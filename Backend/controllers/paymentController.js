const crypto = require('crypto');
const Razorpay = require('razorpay');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

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

/**
 * POST /api/payment/create-order
 * Creates a Razorpay order for the current user's cart.
 * Returns { razorpayOrderId, amount, currency, key } so the frontend
 * can open the Razorpay checkout popup.
 */
exports.createRazorpayOrder = async (req, res) => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('xxx')) {
      return res.status(503).json({
        message: 'Razorpay is not configured. Please add your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env',
      });
    }

    const cart = await Cart.findOne({ user: req.user.id }).populate('items.item');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const unavailableItem = cart.items.find((ci) => !ci.item || !ci.item.isAvailable);
    if (unavailableItem) {
      return res.status(400).json({ message: 'One or more cart items are unavailable' });
    }

    const { totalAmount } = calculateTotals(cart.items);
    // Razorpay requires amount in the smallest currency unit (paise for INR)
    const amountInPaise = Math.round(totalAmount * 100);

    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `bb_${String(req.user.id).slice(-8)}_${Date.now()}`,
      notes: {
        userId: String(req.user.id),
      },
    });

    res.json({
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('Razorpay createOrder error:', err);
    res.status(500).json({ message: err.message || 'Failed to create Razorpay order' });
  }
};

/**
 * POST /api/payment/verify
 * Body: { razorpayOrderId, razorpayPaymentId, razorpaySignature, deliveryAddress, notes }
 *
 * 1. Verifies the Razorpay HMAC signature to confirm payment is genuine.
 * 2. Creates the BlitzBite Order in DB with paymentStatus = 'paid'.
 * 3. Clears the cart.
 */
exports.verifyAndCreateOrder = async (req, res) => {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      deliveryAddress,
      notes,
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: 'Missing Razorpay payment details' });
    }

    // Verify signature: HMAC-SHA256(razorpayOrderId + "|" + razorpayPaymentId, secret)
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ message: 'Payment verification failed: invalid signature' });
    }

    // Signature is valid — create the order in DB
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.item');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty or already cleared' });
    }

    const unavailableItem = cart.items.find((ci) => !ci.item || !ci.item.isAvailable);
    if (unavailableItem) {
      return res.status(400).json({ message: 'One or more cart items are unavailable' });
    }

    const orderItems = cart.items.map((ci) => ({
      item: ci.item._id,
      shop: ci.item.shop,
      name: ci.item.name,
      quantity: ci.quantity,
      price: ci.item.price,
      currency: ci.item.currency,
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
      paymentMethod: 'razorpay',
      paymentStatus: 'paid',
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      notes,
    });

    // Clear the cart after successful payment
    cart.items = [];
    await cart.save();

    res.status(201).json({ order });
  } catch (err) {
    console.error('Razorpay verify error:', err);
    res.status(500).json({ message: err.message || 'Failed to verify payment' });
  }
};
