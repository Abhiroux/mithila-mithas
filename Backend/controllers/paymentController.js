import crypto from 'crypto';
import Razorpay from 'razorpay';
import Order from '../models/Order.js';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';

// Setup Razorpay instance
const generateRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// Helper: Send order confirmation email
const sendOrderConfirmationEmail = async (order) => {
  try {
    const user = await User.findById(order.user);
    if (!user) return;

    const itemsList = order.orderItems
      .map(item => `<li>${item.name} × ${item.qty} — ₹${(item.price * item.qty).toFixed(2)}</li>`)
      .join('');

    await sendEmail({
      email: user.email,
      subject: `Mithila Mithas - Order Confirmed #${order._id.toString().substring(0, 8).toUpperCase()}`,
      message: `Your order #${order._id.toString().substring(0, 8).toUpperCase()} has been confirmed. Total: ₹${order.totalPrice.toFixed(2)}`,
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FFF8F0; padding: 32px;">
          <h2 style="color: #8B1A3A; margin-bottom: 8px;">🪷 Mithila Mithas</h2>
          <hr style="border: 1px solid #E8E8E8; margin: 16px 0;" />
          <h3 style="color: #2D2D2D;">Order Confirmed! 🎉</h3>
          <p style="color: #505050;">Thank you for your order. Here are your details:</p>
          
          <div style="background: #FFFFFF; border-radius: 8px; padding: 20px; margin: 16px 0; border: 1px solid #E8E8E8;">
            <p style="margin: 0 0 8px;"><strong>Order ID:</strong> #${order._id.toString().substring(0, 8).toUpperCase()}</p>
            <p style="margin: 0 0 8px;"><strong>Payment ID:</strong> ${order.paymentResult?.razorpayPaymentId || 'N/A'}</p>
            <p style="margin: 0;"><strong>Date:</strong> ${new Date(order.paidAt || order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}</p>
          </div>

          <h4 style="color: #2D2D2D; margin: 16px 0 8px;">Items Ordered:</h4>
          <ul style="padding-left: 20px; color: #505050;">${itemsList}</ul>

          <div style="background: #FFFFFF; border-radius: 8px; padding: 16px; margin: 16px 0; border: 1px solid #E8E8E8;">
            <p style="margin: 4px 0; color: #505050;">Subtotal: ₹${order.itemsPrice.toFixed(2)}</p>
            <p style="margin: 4px 0; color: #505050;">GST (5%): ₹${order.taxPrice.toFixed(2)}</p>
            <p style="margin: 4px 0; color: #505050;">Delivery: ${order.shippingPrice === 0 ? 'FREE' : '₹' + order.shippingPrice.toFixed(2)}</p>
            <hr style="border: 1px solid #E8E8E8; margin: 8px 0;" />
            <p style="margin: 4px 0; font-size: 18px;"><strong style="color: #8B1A3A;">Total: ₹${order.totalPrice.toFixed(2)}</strong></p>
          </div>

          <div style="background: #FFFFFF; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #E07A22; border: 1px solid #E8E8E8;">
            <p style="margin: 0 0 4px;"><strong>🚚 Shipping to:</strong></p>
            <p style="margin: 0; color: #505050;">${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}</p>
          </div>

          <p style="color: #A0A0A0; font-size: 12px; text-align: center; margin-top: 24px;">
            © Mithila Mithas. Authentic Sweets & Snacks from Mithila.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Order confirmation email error:', error);
    // Don't throw — email failure shouldn't break the payment flow
  }
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

        // Send confirmation email (non-blocking)
        sendOrderConfirmationEmail(order);

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

// @desc    Handle Razorpay Webhook Events (payment.captured, payment.failed)
// @route   POST /api/payments/webhook
// @access  Public (verified via Razorpay signature)
export const webhookHandler = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return res.status(200).json({ status: 'ok' });
    }

    // Verify webhook signature
    const shasum = crypto.createHmac('sha256', webhookSecret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest('hex');

    const razorpaySignature = req.headers['x-razorpay-signature'];

    if (digest !== razorpaySignature) {
      console.error('Webhook signature verification failed');
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const payment = req.body.payload?.payment?.entity;

    if (!payment) {
      return res.status(200).json({ message: 'No payment entity in webhook' });
    }

    if (event === 'payment.captured') {
      console.log('Webhook: payment.captured for payment:', payment.id);

      if (payment.order_id) {
        const order = await Order.findOne({
          'paymentResult.razorpayOrderId': payment.order_id
        });

        if (order && !order.isPaid) {
          order.isPaid = true;
          order.paidAt = Date.now();
          order.paymentResult = {
            ...order.paymentResult,
            razorpayPaymentId: payment.id,
            status: 'captured',
          };
          await order.save();
          sendOrderConfirmationEmail(order);
        }
      }
    } else if (event === 'payment.failed') {
      console.log('Webhook: payment.failed for payment:', payment.id);

      if (payment.order_id) {
        const order = await Order.findOne({
          'paymentResult.razorpayOrderId': payment.order_id
        });

        if (order) {
          order.paymentResult = {
            ...order.paymentResult,
            status: 'failed',
            razorpayPaymentId: payment.id,
          };
          await order.save();
        }
      }
    }

    // Always respond 200 to Razorpay
    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(200).json({ status: 'ok' }); // Still return 200 to prevent retries
  }
};
