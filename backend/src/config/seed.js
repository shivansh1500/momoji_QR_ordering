import bcrypt from 'bcrypt';
import { Admin } from '../models/Admin.js';
import { Restaurant } from '../models/Restaurant.js';
import { Category } from '../models/Category.js';
import { MenuItem } from '../models/MenuItem.js';
import { Table } from '../models/Table.js';

export async function seedDatabase() {
  try {
    // 1. Seed Admin
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('AdminMomoji123!', salt);
      
      await Admin.create({
        name: 'Momoji Admin',
        email: 'admin@momoji.com',
        passwordHash,
        role: 'admin'
      });
      console.log('Seeded default admin: admin@momoji.com / AdminMomoji123!');
    }

    // 2. Seed Restaurant
    let restaurant = await Restaurant.findOne();
    if (!restaurant) {
      restaurant = await Restaurant.create({
        name: 'Momoji Restaurant',
        banners: [
          'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'
        ],
        logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&h=200&q=80',
        isOpen: true,
        openingTime: '00:00',
        closingTime: '23:59',
        geofence: {
          latitude: 28.6139,
          longitude: 77.2090,
          radiusMeters: 50000
        }
      });
      console.log('Seeded default Restaurant branding & configurations.');
    }

    // 3. Seed Tables
    const tableCount = await Table.countDocuments();
    if (tableCount === 0) {
      const tablesData = [
        { tableNumber: 1, qrToken: 'table1', isActive: true },
        { tableNumber: 2, qrToken: 'table2', isActive: true },
        { tableNumber: 3, qrToken: 'table3', isActive: true },
        { tableNumber: 4, qrToken: 'table4', isActive: true },
        { tableNumber: 5, qrToken: 'table5', isActive: true }
      ];
      await Table.insertMany(tablesData);
      console.log('Seeded 5 active Tables with tokens: table1, table2, table3, table4, table5');
    }

    // 4. Seed Categories
    const categoryCount = await Category.countDocuments();
    let seededCategories = [];
    if (categoryCount === 0) {
      const categoriesData = [
        { name: 'Dim Sums', displayOrder: 1 },
        { name: 'Ramen', displayOrder: 2 },
        { name: 'Sushi', displayOrder: 3 },
        { name: 'Desserts', displayOrder: 4 },
        { name: 'Beverages', displayOrder: 5 }
      ];
      seededCategories = await Category.insertMany(categoriesData);
      console.log('Seeded categories: Dim Sums, Ramen, Sushi, Desserts, Beverages');
    } else {
      seededCategories = await Category.find().sort({ displayOrder: 1 });
    }

    // 5. Seed Menu Items
    const menuCount = await MenuItem.countDocuments();
    if (menuCount === 0 && seededCategories.length > 0) {
      const dimSumCat = seededCategories.find(c => c.name === 'Dim Sums')?._id;
      const ramenCat = seededCategories.find(c => c.name === 'Ramen')?._id;
      const sushiCat = seededCategories.find(c => c.name === 'Sushi')?._id;
      const dessertCat = seededCategories.find(c => c.name === 'Desserts')?._id;
      const bevCat = seededCategories.find(c => c.name === 'Beverages')?._id;

      const items = [];

      if (dimSumCat) {
        items.push(
          {
            categoryId: dimSumCat,
            name: 'Crystal Veg Dumpling',
            description: 'Translucent skins filled with crunchy water chestnuts and mushrooms.',
            price: 280,
            imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=400&q=80',
            rating: 4.8,
            isAvailable: true
          },
          {
            categoryId: dimSumCat,
            name: 'Chicken Gyoza',
            description: 'Pan-seared chicken dumplings served with a tangy soy dip.',
            price: 320,
            imageUrl: 'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=400&q=80',
            rating: 4.7,
            isAvailable: true
          }
        );
      }

      if (ramenCat) {
        items.push(
          {
            categoryId: ramenCat,
            name: 'Spicy Miso Ramen',
            description: 'Rich chicken broth mixed with red miso paste, noodles, bamboo shoots, and soft boiled egg.',
            price: 490,
            imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=400&q=80',
            rating: 4.9,
            isAvailable: true
          },
          {
            categoryId: ramenCat,
            name: 'Tonkotsu Ramen',
            description: 'Creamy pork bone broth ramen served with pork belly chashu and nori sheets.',
            price: 520,
            imageUrl: 'https://images.unsplash.com/photo-1557872943-16a5ac26437e?auto=format&fit=crop&w=400&q=80',
            rating: 4.9,
            isAvailable: true
          }
        );
      }

      if (sushiCat) {
        items.push(
          {
            categoryId: sushiCat,
            name: 'Salmon Maki Roll',
            description: 'Fresh salmon wrapped in seasoned sushi rice and nori sheet.',
            price: 450,
            imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=400&q=80',
            rating: 4.6,
            isAvailable: true
          }
        );
      }

      if (dessertCat) {
        items.push(
          {
            categoryId: dessertCat,
            name: 'Matcha Lava Cake',
            description: 'Warm matcha chocolate cake with a molten matcha chocolate center.',
            price: 220,
            imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=400&q=80',
            rating: 4.8,
            isAvailable: true
          }
        );
      }

      if (bevCat) {
        items.push(
          {
            categoryId: bevCat,
            name: 'Boba Milk Tea',
            description: 'Classic black milk tea served with sweet brown sugar tapioca pearls.',
            price: 180,
            imageUrl: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=400&q=80',
            rating: 4.5,
            isAvailable: true
          }
        );
      }

      await MenuItem.insertMany(items);
      console.log('Seeded menu items.');
    }
  } catch (error) {
    console.error('Seeding database failed:', error);
  }
}
