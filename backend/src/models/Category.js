import { Schema, model } from 'mongoose';

const categorySchema = new Schema({
  name: { type: String, required: true },
  displayOrder: { type: Number, required: true, default: 0 }
}, { timestamps: true });

export const Category = model('Category', categorySchema);
