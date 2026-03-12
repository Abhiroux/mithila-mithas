import crypto from 'crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order.js';

// Setup Razorpay instance
const generateRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// @desc    Create Razorpay Order
// @route   POST /api/payments/create-order
// @access  Private
export const createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    const instance = generateRazorpayInstance();

    const options = {
      // Razorpay calculates in paise (amount * 100)
      amount: Math.round(order.totalPrice * 100),
      currency: 'INR',
      receipt: `receipt_order_${order._id}`,
    };

    const razorpayOrder = await instance.orders.create(options);

    res.json({
      id: razorpayOrder.id,
      currency: razorpayOrder.currency,
      amount: razorpayOrder.amount,
      orderId: order._id,
    });
  } catch (error) {
    console.error('Razorpay Order Creation Error:', error);
    next(new Error('Failed to create Razorpay Order'));
  }
};

// @desc    Verify Payment Signature
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400);
      throw new Error('Payment details missing');
    }

    // Verify signature using crypto
    const body = razorpay_order_id + '|' + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (isAuthentic) {
      // Find the order and update it to Paid
      const order = await Order.findById(orderId);

      if (order) {
        order.isPaid = true;
        order.paidAt = Date.now();
        order.paymentResult = {
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature,
          status: 'success',
        };

        await order.save();

        res.json({
          success: true,
          message: 'Payment verified successfully',
          orderId: order._id
        });
      } else {
        res.status(404);
        throw new Error('Order not found after payment');
      }
    } else {
      res.status(400);
      throw new Error('Invalid signature, payment verification failed');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get Razorpay Key (For frontend to load checkout script)
// @route   GET /api/payments/key
// @access  Private
export const getRazorpayKey = (req, res) => {
  res.json({ key: process.env.RAZORPAY_KEY_ID });
};
