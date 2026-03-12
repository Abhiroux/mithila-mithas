import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import Product from './models/Product.js';
import User from './models/User.js';
import cloudinary from './config/cloudinary.js';

// Import frontend data
import { menuItems } from '../Frontend/src/data/menuData.js';

dotenv.config();

connectDB();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const importData = async () => {
  try {
    await Product.deleteMany(); // Clear existing products
    
    // We need an admin user to attach the products to
    let adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.log('No admin user found. Creating default admin...');
      adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@mithilamithas.com',
        password: 'password123',
        role: 'admin',
        isVerified: true
      });
    }
    
    const userId = adminUser._id;

    console.log('Uploading images to Cloudinary and transforming products...');

    const productsToInsert = [];

    for (const item of menuItems) {
      if (!item.image) continue;

      const localImagePath = path.join(__dirname, '../Frontend/public', item.image);
      
      console.log(`Uploading ${item.name} image...`);
      
      try {
        const uploadResponse = await cloudinary.uploader.upload(localImagePath, {
          folder: 'mithila_mithas_products',
        });

        // Construct new DB product object
        const newProduct = {
          user: userId,
          name: item.name,
          image: uploadResponse.secure_url, // Cloudinary URL
          description: item.description || 'Authentic Mithila Sweet/Snack',
          category: item.category || 'sweets',
          price: item.price,
          weight: item.weight || '250g',
          stock: 100,
          inStock: true,
          rating: item.rating || 0,
          numReviews: item.reviews || 0,
          badge: item.badge,
          isVeg: item.isVeg !== undefined ? item.isVeg : true,
        };

        productsToInsert.push(newProduct);
      } catch (uploadError) {
        console.error(`Failed to upload ${item.name} image. Is it in the Frontend/public folder?`, uploadError.message);
      }
    }

    if (productsToInsert.length > 0) {
      await Product.insertMany(productsToInsert);
      console.log('Data Imported successfully! ✅');
    } else {
      console.log('No products to insert ⚠️');
    }

    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message} ❌`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await Product.deleteMany();
    console.log('Data Destroyed! 💥');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message} ❌`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
