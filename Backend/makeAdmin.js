import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const makeAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected.');

    // The email you want to make an admin
    const email = process.argv[2];

    if (!email) {
      console.error('Please provide an email! Usage: node makeAdmin.js <email>');
      process.exit(1);
    }

    const user = await User.findOne({ email });

    if (!user) {
      console.error(`User with email ${email} not found!`);
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();

    console.log(`Success! ${user.name} (${user.email}) is now an ADMIN!`);
    console.log(`You can now log in normally and access the Admin Dashboard from the profile dropdown.`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

makeAdmin();
