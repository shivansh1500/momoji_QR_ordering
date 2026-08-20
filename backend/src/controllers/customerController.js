import { Restaurant } from '../models/Restaurant.js';
import { Category } from '../models/Category.js';
import { MenuItem } from '../models/MenuItem.js';
import { Session } from '../models/Session.js';
import { Order } from '../models/Order.js';
import { Table } from '../models/Table.js';
import { isWithinOperatingHours, isWithinGeofence } from '../services/geofence.js';
import { resolveTableScan, placeOrder } from '../services/sessionResolver.js';
import { emitToAdmin } from '../sockets/socketManager.js';

export async function getMenu(req, res, next) {
  try {
    const qrToken = req.query.table;
    let table, activeSession;

    if (!qrToken) {
      // Fallback to first active table
      const fallbackTable = await Table.findOne({ isActive: true }).sort({ tableNumber: 1 });
      if (!fallbackTable) {
        return res.status(404).json({ success: false, error: 'No active tables configured in the restaurant.' });
      }
      table = fallbackTable;
      activeSession = await Session.findOne({ tableId: table._id, status: 'ACTIVE' }).lean();
    } else {
      const resolved = await resolveTableScan(qrToken);
      table = resolved.table;
      activeSession = resolved.activeSession;
    }

    if (!table) {
      return res.status(404).json({ success: false, error: 'Invalid or inactive table' });
    }

    const restaurant = await Restaurant.findOne();
    if (!restaurant) {
      return res.status(500).json({ success: false, error: 'Restaurant configuration not found' });
    }

    const isHoursOpen = isWithinOperatingHours(restaurant.openingTime, restaurant.closingTime);
    let orderingEnabled = restaurant.isOpen && isHoursOpen;
    let reason = null;

    if (!restaurant.isOpen) {
      reason = 'Restaurant closed';
    } else if (!isHoursOpen) {
      reason = 'Restaurant closed';
    }

    const categories = await Category.find().sort({ displayOrder: 1 }).lean();
    const menuItems = await MenuItem.find({ isAvailable: true }).lean();

    return res.status(200).json({
      success: true,
      restaurant: {
        name: restaurant.name,
        logoUrl: restaurant.logoUrl,
        banners: restaurant.banners,
        isOpen: restaurant.isOpen,
        openingTime: restaurant.openingTime,
        closingTime: restaurant.closingTime,
        geofence: restaurant.geofence
      },
      table: {
        id: table._id,
        tableNumber: table.tableNumber
      },
      activeSessionId: activeSession ? activeSession._id : null,
      categories,
      menuItems,
      orderingEnabled,
      reason
    });
  } catch (error) {
    next(error);
  }
}

export async function createOrder(req, res, next) {
  try {
    const { qrToken, latitude, longitude, items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing required order items' });
    }

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ success: false, error: 'GPS coordinates are required to place an order' });
    }

    let table;
    if (!qrToken) {
      table = await Table.findOne({ isActive: true }).sort({ tableNumber: 1 });
    } else {
      table = await Table.findOne({ qrToken, isActive: true });
    }
    if (!table) {
      return res.status(404).json({ success: false, error: 'Invalid or inactive table' });
    }

    const restaurant = await Restaurant.findOne();
    if (!restaurant) {
      return res.status(500).json({ success: false, error: 'Restaurant configuration not found' });
    }

    const isHoursOpen = isWithinOperatingHours(restaurant.openingTime, restaurant.closingTime);
    if (!restaurant.isOpen || !isHoursOpen) {
      return res.status(400).json({ success: false, error: 'Restaurant closed' });
    }

    const inGeofence = isWithinGeofence(
      restaurant.geofence.latitude,
      restaurant.geofence.longitude,
      latitude,
      longitude,
      restaurant.geofence.radiusMeters
    );

    if (!inGeofence) {
      return res.status(400).json({ success: false, error: 'Outside delivery area' });
    }

    const { order, session } = await placeOrder(table._id, items);

    const populatedOrder = await Order.findById(order._id)
      .populate({ path: 'tableId', select: 'tableNumber' })
      .lean();

    emitToAdmin('order:new', populatedOrder);

    return res.status(201).json({
      success: true,
      order: populatedOrder,
      sessionId: session._id
    });
  } catch (error) {
    return res.status(400).json({ success: false, error: error.message || 'Failed to place order' });
  }
}

export async function getSession(req, res, next) {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Session ID is required' });
    }

    const session = await Session.findById(sessionId).populate({ path: 'tableId', select: 'tableNumber' }).lean();
    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const orders = await Order.find({ sessionId }).sort({ createdAt: 1 }).lean();

    return res.status(200).json({
      success: true,
      session,
      orders
    });
  } catch (error) {
    next(error);
  }
}
