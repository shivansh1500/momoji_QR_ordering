import { Schema, model } from 'mongoose';

const restaurantSchema = new Schema({
  name: { type: String, required: true, default: 'Momoji' },
  logoUrl: { type: String },
  banners: { type: [String], default: [] },
  isOpen: { type: Boolean, required: true, default: true },
  openingTime: { type: String, required: true, default: '09:00' },
  closingTime: { type: String, required: true, default: '22:00' },
  geofence: {
    latitude: { type: Number, required: true, default: 28.6139 },
    longitude: { type: Number, required: true, default: 77.2090 },
    radiusMeters: { type: Number, required: true, default: 100 }
  }
}, { timestamps: true });

export const Restaurant = model('Restaurant', restaurantSchema);
