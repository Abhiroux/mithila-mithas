import express from 'express';
import {
  createRazorpayOrder,
  verifyPayment,
  getRazorpayKey,
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);
router.get('/key', protect, getRazorpayKey);

export default router;
