const Item = require('../models/Item');
const Shop = require('../models/Shop');
const { uploadToCloudinary } = require('../config/cloudinary');

const uploadItemImages = async (files) => {
  if (!files?.images?.length) return undefined;
  return Promise.all(files.images.map((file) => uploadToCloudinary(file.buffer, 'blitzbite/items')));
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.createItem = async (req, res) => {
  try {
    const { shop: shopId, name, description, price, currency, category, isAvailable, tags, metadata } = req.body;

    const shop = await Shop.findById(shopId);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    if (shop.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized to add items to this shop' });

    const uploadedImages = await uploadItemImages(req.files);

    const item = await Item.create({
      shop: shopId,
      name,
      description,
      price,
      currency,
      category,
      images: uploadedImages || req.body.images,
      isAvailable,
      tags,
      metadata
    });

    res.status(201).json({ item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getItems = async (req, res) => {
  try {
    const filter = {};
    if (req.query.shop) filter.shop = req.query.shop;
    if (req.query.isAvailable != null) filter.isAvailable = req.query.isAvailable === 'true';
    if (req.query.category) {
      filter.category = new RegExp(`^${escapeRegex(req.query.category.trim())}$`, 'i');
    }

    const items = await Item.find(filter).populate('shop', 'name category location');
    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('shop', 'name category location');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const authorizeItemOwner = async (req, res, next) => {
  try {
    const item = await Item.findById(req.params.id).populate('shop');
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (item.shop.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized to modify this item' });
    req.item = item;
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateItem = async (req, res) => {
  try {
    const item = req.item;
    const uploadedImages = await uploadItemImages(req.files);
    const updates = ['name', 'description', 'price', 'currency', 'category', 'isAvailable', 'tags', 'metadata'];
    updates.forEach((field) => {
      if (req.body[field] !== undefined) {
        item[field] = req.body[field];
      }
    });

    if (uploadedImages) {
      item.images = uploadedImages;
    } else if (req.body.images !== undefined) {
      item.images = req.body.images;
    }

    await item.save();
    res.json({ item });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteItem = async (req, res) => {
  try {
    await req.item.remove();
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.authorizeItemOwner = authorizeItemOwner;

exports.searchItems = async (req, res) => {
  try {
    const { q, category, shop, minPrice, maxPrice, spiceLevel, isAvailable } = req.query;
    const filter = {};

    if (q && q.trim()) {
      const regex = new RegExp(escapeRegex(q.trim()), 'i');
      filter.$or = [
        { name: regex },
        { description: regex },
        { tags: regex },
        { category: regex }
      ];
    }

    if (shop) filter.shop = shop;
    if (category) filter.category = new RegExp(`^${escapeRegex(category.trim())}$`, 'i');
    if (isAvailable != null) filter.isAvailable = isAvailable === 'true';
    if (spiceLevel) filter['metadata.spiceLevel'] = spiceLevel;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const items = await Item.find(filter)
      .populate('shop', 'name category location featuredImage isOpen isActive')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ items });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/items/:id/rate
 * Body: { rating: 1-5 }
 * Protected — requires auth token.
 * Users can rate an item once; submitting again updates their existing rating.
 * Recalculates the average rating after every submission.
 */
exports.rateItem = async (req, res) => {
  try {
    const { rating } = req.body;
    const ratingNum = Number(rating);

    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
    }

    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    const userId = req.user.id;

    // Check if this user has already rated this item
    const existingIndex = item.userRatings.findIndex(
      (r) => r.user.toString() === userId
    );

    if (existingIndex !== -1) {
      // Update the existing rating
      item.userRatings[existingIndex].value = ratingNum;
    } else {
      // Add a new rating
      item.userRatings.push({ user: userId, value: ratingNum });
    }

    // Recalculate average rating and total count
    const total = item.userRatings.reduce((sum, r) => sum + r.value, 0);
    item.ratingCount = item.userRatings.length;
    item.rating = Math.round((total / item.ratingCount) * 10) / 10; // 1 decimal place

    await item.save();

    res.json({
      message: existingIndex !== -1 ? 'Rating updated' : 'Rating submitted',
      rating: item.rating,
      ratingCount: item.ratingCount,
      userRating: ratingNum,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
