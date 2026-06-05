const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

// POST /api/payment/create-order  — creates a Razorpay order for cart total
router.post('/create-order', protect, paymentController.createRazorpayOrder);

// POST /api/payment/verify  — verifies Razorpay signature and places the DB order
router.post('/verify', protect, paymentController.verifyAndCreateOrder);

module.exports = router;
