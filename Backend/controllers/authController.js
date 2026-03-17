import crypto from 'crypto';
import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    const user = await User.create({
      name,
      email,
      password,
      phone,
      otp: otpHash,
      otpExpire: Date.now() + 10 * 60 * 1000, // 10 minutes
    });

    if (user) {
      try {
        await sendEmail({
          email: user.email,
          subject: 'Mithila Mithas - Verify your email',
          message: `Your OTP for email verification is ${otp}. It is valid for 10 minutes.`,
          html: `<h2>Welcome to Mithila Mithas!</h2><p>Your OTP for email verification is: <strong style="font-size: 24px;">${otp}</strong></p><p>It is valid for 10 minutes.</p>`,
        });

        res.status(201).json({
          success: true,
          message: 'OTP sent to email',
          email: user.email,
        });
      } catch (error) {
        await User.findByIdAndDelete(user._id);
        res.status(500);
        throw new Error('Email could not be sent. Please check your SMTP configuration.');
      }
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select('+otp +otpExpire');

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    if (user.isVerified) {
      res.status(400);
      throw new Error('User already verified');
    }

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    if (user.otp !== otpHash || user.otpExpire < Date.now()) {
      res.status(400);
      throw new Error('Invalid or expired OTP');
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    res.cookie('token', generateToken(user._id), {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');

    if (!user) {
      res.status(401);
      throw new Error('Invalid email or password');
    }

    if (user.lockUntil && user.lockUntil > Date.now()) {
      res.status(401);
      throw new Error('Account locked. Try again later.');
    }

    if (await user.matchPassword(password)) {
      if (!user.isVerified) {
        // Generate new 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

        user.otp = otpHash;
        user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
        await user.save();

        try {
          await sendEmail({
            email: user.email,
            subject: 'Mithila Mithas - Verify your email',
            message: `Your OTP for email verification is ${otp}. It is valid for 10 minutes.`,
            html: `<h2>Welcome back!</h2><p>Your new OTP for email verification is: <strong style="font-size: 24px;">${otp}</strong></p><p>It is valid for 10 minutes.</p>`,
          });
        } catch (error) {
          console.error('OTP Resend Error:', error);
        }

        res.status(401);
        throw new Error('Please verify your email using OTP first');
      }

      user.loginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();

      res.cookie('token', generateToken(user._id), {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 30 * 60 * 1000; // Lock for 30 minutes
      }
      await user.save();

      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        addresses: user.addresses,
        wishlist: user.wishlist,
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.phone = req.body.phone || user.phone;
      
      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.json({ message: 'Logged out successfully' });
};

// @desc    Add user address
// @route   POST /api/auth/addresses
// @access  Private
export const addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      const { _id, name, label, street, city, state, pincode, phone, isDefault } = req.body;
      
      const addressData = {
        name,
        label,
        street,
        city,
        state,
        pincode,
        phone,
        isDefault: isDefault || false
      };

      if (addressData.isDefault) {
        user.addresses = user.addresses.map((addr) => {
          addr.isDefault = false;
          return addr;
        });
      }

      if (_id) {
         const existingAddress = user.addresses.id(_id);
         if (existingAddress) {
             existingAddress.set(addressData);
         } else {
             res.status(404);
             throw new Error('Address not found');
         }
      } else {
         if (user.addresses.length === 0) {
           addressData.isDefault = true;
         }
         user.addresses.push(addressData);
      }

      const updatedUser = await user.save();
      res.status(_id ? 200 : 201).json(updatedUser.addresses);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user addresses
// @route   GET /api/auth/addresses
// @access  Private
export const getAddresses = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json(user.addresses);
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404);
      throw new Error('User not found with this email');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Reuse the existing OTP fields
    user.otp = otpHash;
    user.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    try {
      await sendEmail({
        email: user.email,
        subject: 'Mithila Mithas - Password Reset OTP',
        message: `Your OTP for password reset is ${otp}. It is valid for 10 minutes.`,
        html: `<h2>Password Reset Request</h2><p>Your OTP to reset your password is: <strong style="font-size: 24px;">${otp}</strong></p><p>It is valid for 10 minutes. If you did not request this, please ignore this email.</p>`,
      });

      res.status(200).json({
        success: true,
        message: 'OTP sent to email',
      });
    } catch (error) {
       user.otp = undefined;
       user.otpExpire = undefined;
       await user.save();
       res.status(500);
       throw new Error('Email could not be sent. Please check your SMTP configuration.');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email }).select('+otp +otpExpire +password');

    if (!user) {
      res.status(404);
      throw new Error('User not found');
    }

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    if (user.otp !== otpHash || user.otpExpire < Date.now()) {
      res.status(400);
      throw new Error('Invalid or expired OTP');
    }

    // Passwords are automatically hashed via the Mongoose pre-save hook
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpire = undefined;
    
    // Unlock account automatically on successful password reset
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successfully. You can now log in.',
    });
  } catch (error) {
    next(error);
  }
};
