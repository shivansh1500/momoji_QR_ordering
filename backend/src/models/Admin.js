import { Schema, model } from 'mongoose';

const adminSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, default: 'admin' }
}, { timestamps: true });

export const Admin = model('Admin', adminSchema);
