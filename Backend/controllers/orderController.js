const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Shop = require('../models/Shop');
const User = require('../models/User');
const twilio = require('twilio');

const isTwilioConfigured = Boolean(
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_AUTH_TOKEN &&
  process.env.TWILIO_PHONE_NUMBER
);

const twilioClient = isTwilioConfigured
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

const calculateTotals = (items) => {
  const subtotal = items.reduce((sum, cartItem) => {
    const price = Number(cartItem.item.price || 0);
    return sum + price * Number(cartItem.quantity || 0);
  }, 0);
  const deliveryFee = subtotal > 0 && subtotal < 499 ? 39 : 0;
  const tax = Math.round(subtotal * 0.05 * 100) / 100;
  const totalAmount = subtotal + deliveryFee + tax;

  return { subtotal, deliveryFee, tax, totalAmount };
};

const populateOrder = (query) => query
  .populate('items.shop', 'name location')
  .populate('user', 'firstName lastName email phone')
  .populate('deliveryPartner', 'firstName lastName email phone');

const userOwnsOrderShop = async (userId, order) => {
  const shops = await Shop.find({ owner: userId }).select('_id');
  const shopIds = shops.map((shop) => shop._id);

  return shopIds.length > 0 && order.items.some((item) =>
    shopIds.some((shopId) => shopId.equals(item.shop))
  );
};

const userCanViewOrder = async (userId, order) => {
  const isCustomer = String(order.user) === String(userId);
  const isDeliveryPartner = order.deliveryPartner && String(order.deliveryPartner) === String(userId);

  if (isCustomer || isDeliveryPartner) {
    return true;
  }

  return userOwnsOrderShop(userId, order);
};

const generateDeliveryOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendDeliveryOtpToUser = async (order) => {
  const customer = await User.findById(order.user).select('firstName phone');

  if (!customer || !customer.phone) {
    return {
      sent: false,
      message: 'Customer phone number is not available'
    };
  }

  const otp = generateDeliveryOtp();
  order.deliveryOtp = otp;
  order.deliveryOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  order.otpSentAt = new Date();
  order.otpVerified = false;
  await order.save();

  console.log(`[DEV OTP LOG] Generated OTP for Order #${order._id}: ${otp}`);

  if (!isTwilioConfigured) {
    return {
      sent: false,
      message: 'Twilio is not configured; OTP generated for local testing',
      devOtp: otp
    };
  }

  try {
    await twilioClient.messages.create({
      body: `Your BlitzBite delivery OTP for order #${order._id.toString().slice(-6)} is ${otp}. Share it with the delivery partner only at delivery.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: `+91${customer.phone}`
    });

    return {
      sent: true,
      message: 'Delivery OTP sent successfully'
    };
  } catch (twilioErr) {
    console.error('[TWILIO ERROR] Failed to send SMS:', twilioErr.message);
    return {
      sent: false,
      message: `Twilio error: ${twilioErr.message}. OTP logged locally for testing.`,
      devOtp: otp
    };
  }
};

exports.createOrder = async (req, res) => {
  try {
    const { deliveryAddress, paymentMethod = 'cod', notes } = req.body;

    const cart = await Cart.findOne({ user: req.user.id }).populate('items.item');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const unavailableItem = cart.items.find((cartItem) => !cartItem.item || !cartItem.item.isAvailable);
    if (unavailableItem) {
      return res.status(400).json({ message: 'One or more cart items are unavailable' });
    }

    const orderItems = cart.items.map((cartItem) => ({
      item: cartItem.item._id,
      shop: cartItem.item.shop,
      name: cartItem.item.name,
      quantity: cartItem.quantity,
      price: cartItem.item.price,
      currency: cartItem.item.currency
    }));

    const totals = calculateTotals(cart.items);

    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      deliveryAddress,
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      tax: totals.tax,
      totalAmount: totals.totalAmount,
      paymentMethod,
      notes
    });

    cart.items = [];
    await cart.save();

    res.status(201).json({ order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('items.shop', 'name')
      .populate('deliveryPartner', 'firstName lastName email phone');
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getDeliveryPartners = async (req, res) => {
  try {
    const partners = await User.find({ userType: 'delivery', isActive: true })
      .select('firstName lastName email phone');
    res.json({ partners });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAssignedOrders = async (req, res) => {
  try {
    const orders = await Order.find({ deliveryPartner: req.user.id })
      .sort({ createdAt: -1 })
      .populate('items.shop', 'name')
      .populate('user', 'firstName lastName email')
      .populate('deliveryPartner', 'firstName lastName email phone');

    // Calculate daily statistics
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayCompletedOrders = await Order.find({
      deliveryPartner: req.user.id,
      orderStatus: 'delivered',
      deliveredAt: { $gte: startOfToday, $lte: endOfToday }
    });

    const todayDeliveriesCount = todayCompletedOrders.length;
    const todayEarnings = todayCompletedOrders.reduce((sum, order) => {
      const pay = Math.max(Number(order.deliveryFee || 0), 40); // Base pay ₹40 or order's delivery fee
      return sum + pay;
    }, 0);

    res.json({
      orders,
      todayStats: {
        deliveriesCount: todayDeliveriesCount,
        earnings: todayEarnings
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOrderTracking = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const canView = await userCanViewOrder(req.user.id, order);
    if (!canView) {
      return res.status(403).json({ message: 'Not authorized to track this order' });
    }

    const populatedOrder = await populateOrder(Order.findById(order._id));
    res.json({ order: populatedOrder });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateDeliveryLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (!Number.isFinite(Number(latitude)) || !Number.isFinite(Number(longitude))) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (!order.deliveryPartner || String(order.deliveryPartner) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Only the assigned delivery partner can update location' });
    }

    if (['delivered', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({ message: 'Cannot update location for a completed order' });
    }

    order.deliveryLocation = {
      latitude: Number(latitude),
      longitude: Number(longitude),
      updatedAt: new Date()
    };

    await order.save();

    const updatedOrder = await populateOrder(Order.findById(order._id));

    // Emit live location update to the tracking room
    try {
      const { sendToOrderRoom } = require('../config/socket');
      sendToOrderRoom(order._id, 'locationUpdate', {
        latitude: order.deliveryLocation.latitude,
        longitude: order.deliveryLocation.longitude,
        updatedAt: order.deliveryLocation.updatedAt
      });
    } catch (socketErr) {
      console.error('Socket location update emission error:', socketErr);
    }

    res.json({ order: updatedOrder });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.sendDeliveryOtp = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const isDeliveryPartner = order.deliveryPartner && String(order.deliveryPartner) === String(req.user.id);
    if (!isDeliveryPartner) {
      return res.status(403).json({ message: 'Only the assigned delivery partner can send delivery OTP' });
    }

    if (order.orderStatus !== 'out-for-delivery') {
      return res.status(400).json({ message: 'Delivery OTP can be sent only when the order is out for delivery' });
    }

    if (order.otpVerified) {
      return res.status(400).json({ message: 'Delivery OTP is already verified' });
    }

    const otpResult = await sendDeliveryOtpToUser(order);
    const updatedOrder = await populateOrder(Order.findById(order._id));

    res.json({
      message: otpResult.message,
      smsSent: otpResult.sent,
      devOtp: otpResult.devOtp,
      order: updatedOrder
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAvailableDeliveryOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      deliveryPartner: null,
      orderStatus: 'placed'
    })
      .sort({ createdAt: 1 })
      .populate('items.shop', 'name')
      .populate('user', 'firstName lastName email');

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.acceptDeliveryOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findOneAndUpdate(
      {
        _id: id,
        deliveryPartner: null,
        orderStatus: 'placed'
      },
      {
        deliveryPartner: req.user.id,
        orderStatus: 'accepted'
      },
      {
        new: true,
        runValidators: true
      }
    )
      .populate('items.shop', 'name')
      .populate('user', 'firstName lastName email')
      .populate('deliveryPartner', 'firstName lastName email phone');

    if (!order) {
      return res.status(400).json({ message: 'Order is not available for acceptance' });
    }

    res.json({ order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.assignDeliveryPartner = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryPartner } = req.body;

    if (!deliveryPartner) {
      return res.status(400).json({ message: 'Delivery partner is required' });
    }

    const shops = await Shop.find({ owner: req.user.id }).select('_id');
    const shopIds = shops.map((shop) => shop._id);
    if (shopIds.length === 0) {
      return res.status(403).json({ message: 'You do not own any shops' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const hasOwnerShopItem = order.items.some((item) =>
      shopIds.some((shopId) => shopId.equals(item.shop))
    );
    if (!hasOwnerShopItem) {
      return res.status(403).json({ message: 'Not authorized to assign delivery for this order' });
    }

    const partner = await User.findOne({ _id: deliveryPartner, userType: 'delivery', isActive: true })
      .select('firstName lastName email phone');
    if (!partner) {
      return res.status(400).json({ message: 'Invalid delivery partner selected' });
    }

    order.deliveryPartner = partner._id;
    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate('items.shop', 'name')
      .populate('deliveryPartner', 'firstName lastName email phone')
      .populate('user', 'firstName lastName email');

    res.json({ order: updatedOrder });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOwnerOrders = async (req, res) => {
  try {
    const shops = await Shop.find({ owner: req.user.id }).select('_id');
    const shopIds = shops.map((shop) => shop._id);

    if (shopIds.length === 0) {
      return res.json({ orders: [] });
    }

    const orders = await Order.find({ 'items.shop': { $in: shopIds } })
      .sort({ createdAt: -1 })
      .populate('items.shop', 'name')
      .populate('user', 'firstName lastName email')
      .populate('deliveryPartner', 'firstName lastName email phone');

    res.json({ orders });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const statusTransitionMap = {
  placed: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['out-for-delivery', 'cancelled'],
  'out-for-delivery': ['delivered', 'cancelled'],
  delivered: [],
  cancelled: []
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    if (!orderStatus || !statusTransitionMap[orderStatus]) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Owner check: does current user own any shop in the order?
    const shops = await Shop.find({ owner: req.user.id }).select('_id');
    const shopIds = shops.map((shop) => shop._id);
    const isOwner = shopIds.length > 0 && order.items.some((item) =>
      shopIds.some((shopId) => shopId.equals(item.shop))
    );

    // Delivery partner check: is current user assigned as delivery partner?
    const isDeliveryPartner = order.deliveryPartner && order.deliveryPartner.equals
      ? order.deliveryPartner.equals(req.user.id)
      : String(order.deliveryPartner) === String(req.user.id);

    if (!isOwner && !isDeliveryPartner) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    const allowedNextStatuses = statusTransitionMap[order.orderStatus] || [];
    if (!allowedNextStatuses.includes(orderStatus)) {
      return res.status(400).json({
        message: `Status cannot change from ${order.orderStatus} to ${orderStatus}`
      });
    }

    if (orderStatus === 'delivered' && !order.otpVerified) {
      return res.status(400).json({
        message: 'Order cannot be marked delivered without OTP verification'
      });
    }

    order.orderStatus = orderStatus;
    let otpResult = null;
    if (orderStatus === 'out-for-delivery') {
      otpResult = await sendDeliveryOtpToUser(order);
    }
    if (orderStatus === 'delivered') {
      order.deliveredAt = new Date();
    }
    if (orderStatus === 'cancelled') {
      order.cancelledAt = new Date();
    }

    await order.save();
    const updatedOrder = await Order.findById(id)
      .populate('items.shop', 'name')
      .populate('user', 'firstName lastName email')
      .populate('deliveryPartner', 'firstName lastName email phone');

    // Emit live order status update to the tracking room
    try {
      const { sendToOrderRoom } = require('../config/socket');
      sendToOrderRoom(order._id, 'statusUpdate', {
        orderStatus,
        order: updatedOrder
      });
    } catch (socketErr) {
      console.error('Socket status update emission error:', socketErr);
    }

    res.json({
      order: updatedOrder,
      deliveryOtp: otpResult ? {
        message: otpResult.message,
        smsSent: otpResult.sent,
        devOtp: otpResult.devOtp
      } : undefined
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyDeliveryOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const isDeliveryPartner = order.deliveryPartner && String(order.deliveryPartner) === String(req.user.id);
    if (!isDeliveryPartner) {
      return res.status(403).json({ message: 'Only the assigned delivery partner can verify OTP' });
    }

    if (order.orderStatus !== 'out-for-delivery') {
      return res.status(400).json({ message: 'OTP can only be verified when the order is out for delivery' });
    }

    if (order.otpVerified) {
      return res.status(400).json({ message: 'OTP has already been verified' });
    }

    if (!order.deliveryOtp) {
      return res.status(400).json({ message: 'No active OTP found. Please send OTP first.' });
    }

    if (new Date() > order.deliveryOtpExpiry) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    if (order.deliveryOtp !== otp.trim()) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    // OTP matches and is valid! Update details
    order.otpVerified = true;
    order.deliveryOtp = null;
    order.deliveryOtpExpiry = null;
    order.orderStatus = 'delivered';
    order.deliveredAt = new Date();

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate('items.shop', 'name')
      .populate('user', 'firstName lastName email')
      .populate('deliveryPartner', 'firstName lastName email phone');

    // Emit live order status update to the tracking room
    try {
      const { sendToOrderRoom } = require('../config/socket');
      sendToOrderRoom(order._id, 'statusUpdate', {
        orderStatus: 'delivered',
        order: updatedOrder
      });
    } catch (socketErr) {
      console.error('Socket status update emission error:', socketErr);
    }

    res.json({
      message: 'OTP verified successfully. Order marked as delivered.',
      order: updatedOrder
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
