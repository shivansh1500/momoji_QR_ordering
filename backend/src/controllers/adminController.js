import crypto from 'crypto';
import { Order } from '../models/Order.js';
import { Session } from '../models/Session.js';
import { Table } from '../models/Table.js';
import { Category } from '../models/Category.js';
import { MenuItem } from '../models/MenuItem.js';
import { Restaurant } from '../models/Restaurant.js';
import { emitToAdmin } from '../sockets/socketManager.js';
import { generateQRBuffer } from '../services/qrService.js';
import { createTableQRPDF, createAnalyticsPDF } from '../services/pdfService.js';
import { cloudinary } from '../config/cloudinary.js';

async function uploadImageToCloudinary(imageStr) {
  if (!imageStr) return '';
  if (imageStr.startsWith('http')) return imageStr;

  try {
    if (cloudinary.config().cloud_name) {
      const res = await cloudinary.uploader.upload(imageStr, { folder: 'momoji' });
      return res.secure_url;
    }
  } catch (err) {
    console.error('Cloudinary upload error:', err);
  }
  return '/placeholder.jpg';
}

// ---------------- ORDERS ----------------
export async function getOrders(req, res, next) {
  try {
    const { status, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const query = {};
    if (status) query.status = status;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate({ path: 'tableId', select: 'tableNumber' })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    return res.status(200).json({ success: true, total, page: pageNum, limit: limitNum, orders });
  } catch (error) {
    next(error);
  }
}

export async function acceptOrder(req, res, next) {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate({ path: 'tableId', select: 'tableNumber' });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (order.status !== 'ORDERED') return res.status(400).json({ success: false, error: 'Cannot accept order' });

    order.status = 'ACCEPTED';
    order.acceptedAt = new Date();
    await order.save();

    emitToAdmin('order:updated', order);
    return res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
}

export async function rejectOrder(req, res, next) {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate({ path: 'tableId', select: 'tableNumber' });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });
    if (order.status !== 'ORDERED') return res.status(400).json({ success: false, error: 'Cannot reject order' });

    order.status = 'REJECTED';
    await order.save();

    const session = await Session.findById(order.sessionId);
    if (session) {
      session.totalAmount = Math.max(0, session.totalAmount - order.totalAmount);
      await session.save();
    }

    emitToAdmin('order:updated', order);
    return res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
}

export async function payOrder(req, res, next) {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).populate({ path: 'tableId', select: 'tableNumber' });
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    order.status = 'PAID';
    order.paidAt = new Date();
    await order.save();

    emitToAdmin('order:updated', order);

    const unpaid = await Order.countDocuments({ sessionId: order.sessionId, status: { $ne: 'PAID' } });
    if (unpaid === 0) {
      const session = await Session.findById(order.sessionId);
      if (session && session.status === 'ACTIVE') {
        session.status = 'CLOSED';
        session.closedAt = new Date();
        await session.save();
        emitToAdmin('session:closed', { tableId: session.tableId, sessionId: session._id });
      }
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
}

export async function closeSession(req, res, next) {
  try {
    const { id } = req.params;
    const session = await Session.findById(id);
    if (!session) return res.status(404).json({ success: false, error: 'Session not found' });

    session.status = 'CLOSED';
    session.closedAt = new Date();
    await session.save();

    await Order.updateMany(
      { sessionId: session._id, status: { $in: ['ORDERED', 'ACCEPTED'] } },
      { $set: { status: 'PAID', paidAt: new Date() } }
    );

    emitToAdmin('session:closed', { tableId: session.tableId, sessionId: session._id });
    return res.status(200).json({ success: true, session });
  } catch (error) {
    next(error);
  }
}

// ---------------- TABLES ----------------
export async function getTables(req, res, next) {
  try {
    const tables = await Table.find().sort({ tableNumber: 1 }).lean();
    const activeSessions = await Session.find({ status: 'ACTIVE' }).select('tableId').lean();
    const activeTableIds = new Set(activeSessions.map(s => s.tableId.toString()));

    const tablesWithStatus = tables.map(t => ({
      ...t,
      status: activeTableIds.has(t._id.toString()) ? 'OCCUPIED' : 'AVAILABLE'
    }));

    return res.status(200).json({ success: true, tables: tablesWithStatus });
  } catch (error) {
    next(error);
  }
}

export async function createTable(req, res, next) {
  try {
    const { tableNumber } = req.body;
    if (!tableNumber) return res.status(400).json({ success: false, error: 'Table number is required' });

    const existingTable = await Table.findOne({ tableNumber });
    if (existingTable) return res.status(400).json({ success: false, error: `Table number ${tableNumber} already exists` });

    const qrToken = crypto.randomBytes(24).toString('hex');
    const table = new Table({ tableNumber, qrToken, isActive: true });

    await table.save();
    return res.status(201).json({ success: true, table });
  } catch (error) {
    next(error);
  }
}

export async function patchTable(req, res, next) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const table = await Table.findById(id);
    if (!table) return res.status(404).json({ success: false, error: 'Table not found' });

    if (isActive !== undefined) table.isActive = isActive;
    await table.save();

    return res.status(200).json({ success: true, table });
  } catch (error) {
    next(error);
  }
}

export async function getTableQR(req, res, next) {
  try {
    const { id } = req.params;
    const table = await Table.findById(id);
    if (!table) return res.status(404).json({ success: false, error: 'Table not found' });

    const qrBuffer = await generateQRBuffer(table.qrToken);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=table_${table.tableNumber}_qr.pdf`);

    createTableQRPDF(res, table.tableNumber, qrBuffer);
  } catch (error) {
    next(error);
  }
}

// ---------------- CATEGORIES ----------------
export async function getCategories(req, res, next) {
  try {
    const categories = await Category.find().sort({ displayOrder: 1 }).lean();
    return res.status(200).json({ success: true, categories });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req, res, next) {
  try {
    const { name, displayOrder } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'Name is required' });

    const category = new Category({ name, displayOrder: displayOrder || 0 });
    await category.save();

    return res.status(201).json({ success: true, category });
  } catch (error) {
    next(error);
  }
}

export async function patchCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, displayOrder } = req.body;

    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ success: false, error: 'Category not found' });

    if (name !== undefined) category.name = name;
    if (displayOrder !== undefined) category.displayOrder = displayOrder;

    await category.save();
    return res.status(200).json({ success: true, category });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;
    const count = await MenuItem.countDocuments({ categoryId: id });
    if (count > 0) return res.status(400).json({ success: false, error: 'Cannot delete category containing menu items' });

    await Category.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) {
    next(error);
  }
}

// ---------------- MENU ITEMS ----------------
export async function getMenuItems(req, res, next) {
  try {
    const { categoryId, page = '1', limit = '10' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);

    const query = {};
    if (categoryId) query.categoryId = categoryId;

    const total = await MenuItem.countDocuments(query);
    const items = await MenuItem.find(query)
      .populate('categoryId')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    return res.status(200).json({ success: true, total, page: pageNum, limit: limitNum, menuItems: items });
  } catch (error) {
    next(error);
  }
}

export async function createMenuItem(req, res, next) {
  try {
    const { categoryId, name, description, price, imageUrl, isAvailable } = req.body;
    if (!categoryId || !name || !description || price === undefined) {
      return res.status(400).json({ success: false, error: 'Missing fields' });
    }

    const finalUrl = imageUrl ? await uploadImageToCloudinary(imageUrl) : '';
    const item = new MenuItem({
      categoryId,
      name,
      description,
      price,
      imageUrl: finalUrl,
      isAvailable: isAvailable !== undefined ? isAvailable : true
    });

    await item.save();
    return res.status(201).json({ success: true, menuItem: item });
  } catch (error) {
    next(error);
  }
}

export async function patchMenuItem(req, res, next) {
  try {
    const { id } = req.params;
    const { categoryId, name, description, price, imageUrl, isAvailable, rating } = req.body;

    const item = await MenuItem.findById(id);
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });

    if (categoryId !== undefined) item.categoryId = categoryId;
    if (name !== undefined) item.name = name;
    if (description !== undefined) item.description = description;
    if (price !== undefined) item.price = price;
    if (isAvailable !== undefined) item.isAvailable = isAvailable;
    if (rating !== undefined) item.rating = rating;

    if (imageUrl !== undefined && imageUrl !== item.imageUrl) {
      item.imageUrl = await uploadImageToCloudinary(imageUrl);
    }

    await item.save();
    return res.status(200).json({ success: true, menuItem: item });
  } catch (error) {
    next(error);
  }
}

export async function deleteMenuItem(req, res, next) {
  try {
    const { id } = req.params;
    await MenuItem.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: 'Item deleted' });
  } catch (error) {
    next(error);
  }
}

// ---------------- SETTINGS ----------------
export async function getSettings(req, res, next) {
  try {
    let settings = await Restaurant.findOne();
    if (!settings) {
      settings = new Restaurant({
        name: 'Momoji',
        banners: [],
        isOpen: true,
        openingTime: '09:00',
        closingTime: '22:00',
        geofence: { latitude: 28.6139, longitude: 77.2090, radiusMeters: 100 }
      });
      await settings.save();
    }
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    next(error);
  }
}

export async function patchSettings(req, res, next) {
  try {
    const { name, isOpen, openingTime, closingTime, geofence, logoUrl, banners } = req.body;
    let settings = await Restaurant.findOne();
    if (!settings) settings = new Restaurant();

    if (name !== undefined) settings.name = name;
    if (isOpen !== undefined) settings.isOpen = isOpen;
    if (openingTime !== undefined) settings.openingTime = openingTime;
    if (closingTime !== undefined) settings.closingTime = closingTime;
    if (geofence !== undefined) {
      settings.geofence = {
        latitude: geofence.latitude !== undefined ? geofence.latitude : settings.geofence.latitude,
        longitude: geofence.longitude !== undefined ? geofence.longitude : settings.geofence.longitude,
        radiusMeters: geofence.radiusMeters !== undefined ? geofence.radiusMeters : settings.geofence.radiusMeters
      };
    }

    if (logoUrl !== undefined && logoUrl !== settings.logoUrl) {
      settings.logoUrl = await uploadImageToCloudinary(logoUrl);
    }

    if (banners !== undefined) {
      const processed = [];
      for (const banner of banners) {
        processed.push(await uploadImageToCloudinary(banner));
      }
      settings.banners = processed;
    }

    await settings.save();
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    next(error);
  }
}

// ---------------- ANALYTICS ----------------
async function fetchAnalyticsData(startDateStr, endDateStr) {
  const dateQuery = {};
  if (startDateStr || endDateStr) {
    dateQuery.createdAt = {};
    if (startDateStr) dateQuery.createdAt.$gte = new Date(startDateStr);
    if (endDateStr) dateQuery.createdAt.$lte = new Date(endDateStr);
  }

  const paidOrders = await Order.find({ status: 'PAID', ...dateQuery }).lean();
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrders = paidOrders.length;

  const sessionQuery = dateQuery.createdAt ? { createdAt: dateQuery.createdAt } : {};
  const totalSessions = await Session.countDocuments(sessionQuery);

  const tables = await Table.find().lean();
  const tableBreakdownMap = new Map();

  tables.forEach(t => {
    tableBreakdownMap.set(t._id.toString(), { tableNumber: t.tableNumber, revenue: 0, orderCount: 0 });
  });

  paidOrders.forEach(o => {
    const tableIdStr = o.tableId.toString();
    const entry = tableBreakdownMap.get(tableIdStr);
    if (entry) {
      entry.revenue += o.totalAmount;
      entry.orderCount += 1;
    }
  });

  const tableBreakdown = Array.from(tableBreakdownMap.values()).sort((a, b) => a.tableNumber - b.tableNumber);

  return { totalRevenue, totalOrders, totalSessions, tableBreakdown, startDate: startDateStr, endDate: endDateStr };
}

export async function getAnalytics(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const data = await fetchAnalyticsData(startDate, endDate);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

export async function exportAnalytics(req, res, next) {
  try {
    const { startDate, endDate } = req.query;
    const data = await fetchAnalyticsData(startDate, endDate);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=momoji_analytics.pdf`);

    createAnalyticsPDF(res, data);
  } catch (error) {
    next(error);
  }
}
