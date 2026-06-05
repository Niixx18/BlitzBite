const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1']
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR'
  }
}, {
  _id: false
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: {
    type: [orderItemSchema],
    validate: {
      validator(items) {
        return items.length > 0;
      },
      message: 'Order must contain at least one item'
    }
  },
  deliveryAddress: {
    street: {
      type: String,
      trim: true,
      required: [true, 'Street address is required']
    },
    city: {
      type: String,
      trim: true,
      required: [true, 'City is required']
    },
    state: {
      type: String,
      trim: true,
      required: [true, 'State is required']
    },
    zipCode: {
      type: String,
      trim: true,
      required: [true, 'Zip code is required']
    },
    country: {
      type: String,
      trim: true,
      default: 'India'
    }
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  deliveryFee: {
    type: Number,
    default: 0,
    min: [0, 'Delivery fee cannot be negative']
  },
  tax: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative']
  },
  discount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0, 'Total amount cannot be negative']
  },
  paymentMethod: {
    type: String,
    enum: ['cod', 'card', 'upi', 'wallet', 'razorpay'],
    default: 'cod'
  },
  // Razorpay tracking fields
  razorpayOrderId: {
    type: String,
    default: null
  },
  razorpayPaymentId: {
    type: String,
    default: null
  },
  razorpaySignature: {
    type: String,
    default: null
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  orderStatus: {
    type: String,
    enum: ['placed', 'accepted', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'],
    default: 'placed'
  },
  deliveryPartner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  deliveryLocation: {
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be at least -90'],
      max: [90, 'Latitude cannot exceed 90']
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be at least -180'],
      max: [180, 'Longitude cannot exceed 180']
    },
    updatedAt: Date
  },
  deliveryOtp: {
    code: {
      type: String,
      select: false
    },
    expiresAt: {
      type: Date,
      select: false
    },
    sentAt: Date,
    verifiedAt: Date
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  deliveredAt: Date,
  cancelledAt: Date
}, {
  timestamps: true
});

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ 'items.shop': 1, createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
