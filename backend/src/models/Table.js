import { Schema, model } from 'mongoose';

const tableSchema = new Schema({
  tableNumber: { type: Number, required: true, unique: true, index: true },
  qrToken: { type: String, required: true, unique: true, index: true },
  isActive: { type: Boolean, required: true, default: true }
}, { timestamps: true });

export const Table = model('Table', tableSchema);
