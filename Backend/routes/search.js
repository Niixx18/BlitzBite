const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const itemController = require('../controllers/itemController');

/**
 * GET /api/search
 * Unified search across shops and items.
 * Query params:
 *   q           - text search term (name, description, tags, category)
 *   category    - filter by category (shops or items)
 *   city        - filter shops by city
 *   isOpen      - filter shops by open status ('true'/'false')
 *   minPrice    - filter items by minimum price
 *   maxPrice    - filter items by maximum price
 *   spiceLevel  - filter items by spice level
 *   isAvailable - filter items by availability ('true'/'false')
 */
router.get('/', async (req, res) => {
  try {
    const [shopsRes, itemsRes] = await Promise.allSettled([
      // Simulate controller calls by building filtered data directly
      require('../models/Shop').find(buildShopFilter(req.query))
        .populate('owner', 'firstName lastName')
        .sort({ rating: -1 })
        .limit(30),
      require('../models/Item').find(buildItemFilter(req.query))
        .populate('shop', 'name category location featuredImage isOpen isActive')
        .sort({ createdAt: -1 })
        .limit(30)
    ]);

    res.json({
      query: req.query.q || '',
      shops: shopsRes.status === 'fulfilled' ? shopsRes.value : [],
      items: itemsRes.status === 'fulfilled' ? itemsRes.value : []
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Shop-only search
router.get('/shops', shopController.searchShops);

// Item-only search
router.get('/items', itemController.searchItems);

// ─── Helpers ───────────────────────────────────────────────────────────────
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildShopFilter({ q, category, city, isOpen }) {
  const filter = { isActive: true };

  if (q && q.trim()) {
    const regex = new RegExp(escapeRegex(q.trim()), 'i');
    filter.$or = [
      { name: regex },
      { description: regex },
      { tags: regex },
      { category: regex }
    ];
  }

  if (category) filter.category = new RegExp(`^${escapeRegex(category.trim())}$`, 'i');
  if (city) filter['location.city'] = new RegExp(escapeRegex(city.trim()), 'i');
  if (isOpen != null) filter.isOpen = isOpen === 'true';

  return filter;
}

function buildItemFilter({ q, category, shop, minPrice, maxPrice, spiceLevel, isAvailable }) {
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

  return filter;
}

module.exports = router;
