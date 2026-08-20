import { Session } from '../models/Session.js';
import { Table } from '../models/Table.js';
import { MenuItem } from '../models/MenuItem.js';
import { Order } from '../models/Order.js';
import mongoose from 'mongoose';

const { Types } = mongoose;

export async function resolveTableScan(qrToken) {
  const table = await Table.findOne({ qrToken, isActive: true }).lean();
  if (!table) {
    return { table: null, activeSession: null };
  }

  const activeSession = await Session.findOne({ tableId: table._id, status: 'ACTIVE' }).lean();

  return {
    table,
    activeSession
  };
}

export async function placeOrder(tableId, itemsInput) {
  let session = await Session.findOne({ tableId, status: 'ACTIVE' });

  if (!session) {
    session = new Session({
      tableId,
      status: 'ACTIVE',
      totalAmount: 0
    });
    await session.save();
  }

  const itemIds = itemsInput.map(i => new Types.ObjectId(i.menuItemId));
  const menuItems = await MenuItem.find({ _id: { $in: itemIds } });

  const menuItemsMap = new Map();
  menuItems.forEach(item => {
    menuItemsMap.set(item._id.toString(), item);
  });

  let orderTotal = 0;
  const orderItems = itemsInput.map(itemInput => {
    const menuItem = menuItemsMap.get(itemInput.menuItemId);
    if (!menuItem) {
      throw new Error(`Menu item not found: ${itemInput.menuItemId}`);
    }
    if (!menuItem.isAvailable) {
      throw new Error(`Menu item is currently unavailable: ${menuItem.name}`);
    }

    const itemTotal = menuItem.price * itemInput.quantity;
    orderTotal += itemTotal;

    return {
      menuItemId: menuItem._id,
      name: menuItem.name,
      price: menuItem.price,
      quantity: itemInput.quantity
    };
  });

  const order = new Order({
    sessionId: session._id,
    tableId,
    items: orderItems,
    totalAmount: orderTotal,
    status: 'ORDERED'
  });

  await order.save();

  session.totalAmount += orderTotal;
  await session.save();

  return {
    order,
    session
  };
}
