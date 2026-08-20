import dotenv from 'dotenv';

// Load variables from .env
dotenv.config();

export const env = {
  PORT: parseInt(process.env.PORT || '5001', 10),
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/momoji',
  JWT_SECRET: process.env.JWT_SECRET || 'momoji_secret_jwt_token_key_change_this_for_production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || 'localhost',
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || '',
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || '',
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || ''
};
