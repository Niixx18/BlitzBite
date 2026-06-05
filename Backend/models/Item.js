const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: [true, 'Item must belong to a shop']
  },
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Item name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  price: {
    type: Number,
    required: [true, 'Item price is required'],
    min: [0, 'Price cannot be negative']
  },
  currency: {
    type: String,
    default: 'INR'
  },
  category: {
    type: String,
    trim: true,
    default: 'General'
  },
  images: [String],
  isAvailable: {
    type: Boolean,
    default: true
  },
  tags: [String],
  metadata: {
    calories: Number,
    spiceLevel: {
      type: String,
      enum: ['none', 'mild', 'medium', 'hot', 'extra-hot'],
      default: 'medium'
    }
  },
  // ── Rating ──────────────────────────────────────────────────────────────────
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0
  },
  // Tracks each user's rating to allow updates and prevent duplicates
  userRatings: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      value: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      }
    }
  ]
}, {
  timestamps: true
});

// Index to quickly find a user's existing rating for an item
itemSchema.index({ 'userRatings.user': 1 });

module.exports = mongoose.model('Item', itemSchema);
