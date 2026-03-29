import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const addOrderItems = async (req, res, next) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod,
    } = req.body;

    if (orderItems && orderItems.length === 0) {
      res.status(400);
      throw new Error('No order items');
    }

    // Server-side price calculation based on product name (since frontend uses static IDs)
    const itemsFromDB = await Product.find({
      name: { $in: orderItems.map((x) => x.name) },
    });

    const dbOrderItems = orderItems.map((itemFromClient) => {
      const matchingItemFromDB = itemsFromDB.find(
        (itemFromDB) => itemFromDB.name === itemFromClient.name
      );
      
      if (!matchingItemFromDB) {
         res.status(404);
         throw new Error(`Product not found in database: ${itemFromClient.name}`);
      }

      return {
        ...itemFromClient,
        product: matchingItemFromDB._id, // Assign actual MongoDB _id
        price: matchingItemFromDB.price,
        _id: undefined,
      };
    });

    const itemsPrice = Number(
      dbOrderItems.reduce((acc, item) => acc + item.price * item.qty, 0).toFixed(2)
    );
    const shippingPrice = itemsPrice > 1000 ? 0 : 50; 
    const taxPrice = Number((0.05 * itemsPrice).toFixed(2));
    const totalPrice = Number((itemsPrice + shippingPrice + taxPrice).toFixed(2));

    const order = new Order({
      orderItems: dbOrderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      discount: 0,
      orderStatus: 'PENDING',
      timeline: [
        { status: 'PENDING', description: 'Order has been placed and is awaiting confirmation/payment.' }
      ]
    });

    const createdOrder = await order.save();

    // Send "Order Received" email (non-blocking)
    try {
      const user = await User.findById(req.user._id);
      if (user) {
        const shortId = createdOrder._id.toString().substring(0, 8).toUpperCase();
        const itemsList = createdOrder.orderItems
          .map(item => `<li>${item.name} × ${item.qty} — ₹${(item.price * item.qty).toFixed(2)}</li>`)
          .join('');

        await sendEmail({
          email: user.email,
          subject: `Mithila Mithas - Order Received #${shortId}`,
          message: `Your order #${shortId} has been received and is pending. Total: ₹${createdOrder.totalPrice.toFixed(2)}`,
          html: `
            <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FFF8F0; padding: 32px; border: 1px solid #E8E8E8;">
              <h2 style="color: #8B1A3A; margin-bottom: 8px;">🪷 Mithila Mithas</h2>
              <hr style="border: 1px solid #E8E8E8; margin: 16px 0;" />
              <h3 style="color: #2D2D2D;">Order Received!</h3>
              <p style="color: #505050;">Hello ${user.name}, we've received your order <strong>#${shortId}</strong>. It is currently <strong>PENDING</strong> awaiting payment/confirmation.</p>
              
              <div style="background: #FFFFFF; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <h4 style="margin: 0 0 12px; color: #8B1A3A;">Summary:</h4>
                <ul style="padding-left: 20px; color: #505050;">${itemsList}</ul>
                <p style="margin-top: 12px; font-weight: bold; color: #2D2D2D;">Total Amount: ₹${createdOrder.totalPrice.toFixed(2)}</p>
              </div>

              <p style="color: #707070; font-size: 0.9rem;">We'll notify you once your order is confirmed and shipped.</p>
            </div>
          `
        });
      }
    } catch (emailErr) {
      console.error("Order Received Email Failed", emailErr);
    }

    // Decrement stock
    for (const item of order.orderItems) {
      const product = await Product.findById(item.product);
      if (product) {
        product.countInStock = Math.max(0, product.countInStock - item.qty);
        await product.save();
      }
    }

    // Clear user cart after order
    await Cart.findOneAndUpdate(
      { user: req.user._id },
      { items: [] }
    );

    res.status(201).json(createdOrder);
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'user',
      'name email'
    );

    if (order) {
      // Check if user is admin or the order belongs to the user
      if (req.user.role === 'admin' || order.user._id.equals(req.user._id)) {
        res.json(order);
      } else {
        res.status(403);
        throw new Error('Not authorized to view this order');
      }
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
export const updateOrderToPaid = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      order.isPaid = true;
      order.paidAt = Date.now();
      
      // Update with Razorpay/Stripe details when available
      if (req.body.id) {
        order.paymentResult = {
          id: req.body.id,
          status: req.body.status,
          update_time: req.body.update_time,
          email_address: req.body.payer?.email_address,
        };
      }

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;

    const count = await Order.countDocuments({ user: req.user._id });
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({
      orders,
      page,
      pages: Math.ceil(count / pageSize),
      total: count
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getOrders = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const { status, search, startDate, endDate } = req.query;

    let query = {};

    // Filter by Status
    if (status && status !== 'ALL') {
      query.orderStatus = status.toUpperCase();
    }

    // Filter by Date Range
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Inclusion of the entire end date
        query.createdAt.$lte = end;
      }
    }

    // Search by User Name, Email, or Order ID
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      
      // Try finding users that match the search first
      const matchedUsers = await User.find({
        $or: [
          { name: { $regex: searchRegex } },
          { email: { $regex: searchRegex } }
        ]
      }).select('_id');

      const userIds = matchedUsers.map(u => u._id);

      // Construct $or query for search
      query.$or = [
        { user: { $in: userIds } }
      ];

      // Check if search string is a valid MongoDB ObjectId for Direct ID matching
      if (mongoose.Types.ObjectId.isValid(search)) {
        query.$or.push({ _id: search });
      }
    }

    const count = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'id name email')
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1));

    res.json({
      orders,
      page,
      pages: Math.ceil(count / pageSize),
      total: count
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      const { status, description } = req.body;
      const uppercaseStatus = status.toUpperCase();

      order.orderStatus = uppercaseStatus;
      
      if (uppercaseStatus === 'DELIVERED') {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
      }

      order.timeline.push({
        status: uppercaseStatus,
        date: Date.now(),
        description: description || `Order status updated to ${uppercaseStatus}`
      });

      const updatedOrder = await order.save();

      try {
        const user = await User.findById(order.user);
        if (user) {
          const shortId = order._id.toString().substring(0, 8).toUpperCase();
          await sendEmail({
            email: user.email,
            subject: `Mithila Mithas - Order ${uppercaseStatus} #${shortId}`,
            message: `Your order #${shortId} status is now ${uppercaseStatus}.`,
            html: `
              <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #FFF8F0; padding: 32px;">
                <h2 style="color: #8B1A3A; margin-bottom: 8px;">🪷 Mithila Mithas</h2>
                <hr style="border: 1px solid #E8E8E8; margin: 16px 0;" />
                <h3 style="color: #2D2D2D;">Order Status Update</h3>
                <p style="color: #505050;">Hello ${user.name}, the status of your order <strong>#${shortId}</strong> has been updated to <strong>${uppercaseStatus}</strong>!</p>
                <div style="background: #FFFFFF; border-radius: 8px; padding: 16px; margin: 16px 0; border-left: 4px solid #E07A22;">
                  <p style="margin: 0; color: #505050;">${description || `Your package is currently marked as ${uppercaseStatus}.`}</p>
                </div>
              </div>
            `
          });
        }
      } catch (err) {
        console.error("Status Email Failed", err);
      }

      res.json(updatedOrder);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};
