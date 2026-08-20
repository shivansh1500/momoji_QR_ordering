import { Schema, model } from 'mongoose';

const orderItemSchema = new Schema({
  menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 }
}, { _id: false });

const orderSchema = new Schema({
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true, index: true },
  tableId: { type: Schema.Types.ObjectId, ref: 'Table', required: true, index: true },
  items: { type: [orderItemSchema], required: true },
  totalAmount: { type: Number, required: true },
  status: { type: String, enum: ['ORDERED', 'ACCEPTED', 'PAID', 'REJECTED'], default: 'ORDERED', required: true },
  acceptedAt: { type: Date },
  paidAt: { type: Date }
}, { timestamps: true });

orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ tableId: 1, createdAt: -1 });

export const Order = model('Order', orderSchema);
