import { Schema, model } from 'mongoose';

const menuItemSchema = new Schema({
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String },
  rating: { type: Number, required: true, default: 5.0 },
  isAvailable: { type: Boolean, required: true, default: true }
}, { timestamps: true });

menuItemSchema.index({ categoryId: 1, isAvailable: 1 });

export const MenuItem = model('MenuItem', menuItemSchema);
