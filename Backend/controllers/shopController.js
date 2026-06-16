const Shop = require('../models/Shop');
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const { uploadToCloudinary } = require('../config/cloudinary');

const uploadFiles = async (files) => {
  const uploaded = {};

  if (files?.featuredImage?.[0]) {
    uploaded.featuredImage = await uploadToCloudinary(files.featuredImage[0].buffer, 'blitzbite/shops');
  }

  if (files?.coverImages?.length) {
    uploaded.coverImages = await Promise.all(
      files.coverImages.map((file) => uploadToCloudinary(file.buffer, 'blitzbite/shops'))
    );
  }

  return uploaded;
};

exports.createShop = async (req, res) => {
  try {
    const { name, description, category, location, tags } = req.body;
    const owner = req.user.id;
    const uploaded = await uploadFiles(req.files);

    const shop = await Shop.create({
      name,
      description,
      category,
      location,
      tags,
      featuredImage: uploaded.featuredImage || req.body.featuredImage,
      coverImages: uploaded.coverImages || req.body.coverImages,
      owner
    });

    res.status(201).json({ shop });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getShops = async (req, res) => {
  try {
    const filter = { isActive: true };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.city) filter['location.city'] = req.query.city;
    if (req.query.isOpen != null) filter.isOpen = req.query.isOpen === 'true';
    if (req.query.owner) filter.owner = req.query.owner;

    const shops = await Shop.find(filter).populate('owner', 'firstName lastName email');
    res.json({ shops });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate('owner', 'firstName lastName email');
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    res.json({ shop });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    if (shop.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized to update this shop' });

    const uploaded = await uploadFiles(req.files);
    const updates = ['name', 'description', 'category', 'location', 'tags', 'isOpen', 'isActive'];
    updates.forEach((field) => {
      if (req.body[field] !== undefined) {
        shop[field] = req.body[field];
      }
    });

    if (uploaded.featuredImage) {
      shop.featuredImage = uploaded.featuredImage;
    }

    if (uploaded.coverImages) {
      shop.coverImages = uploaded.coverImages;
    }

    if (req.body.featuredImage !== undefined && !uploaded.featuredImage) {
      shop.featuredImage = req.body.featuredImage;
    }

    if (req.body.coverImages !== undefined && !uploaded.coverImages) {
      shop.coverImages = req.body.coverImages;
    }

    await shop.save();
    res.json({ shop });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: 'Shop not found' });
    if (shop.owner.toString() !== req.user.id) return res.status(403).json({ message: 'Not authorized to delete this shop' });

    await shop.deleteOne();
    res.json({ message: 'Shop deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.searchShops = async (req, res) => {
  try {
    const { q, category, city, isOpen } = req.query;
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

    const shops = await Shop.find(filter)
      .populate('owner', 'firstName lastName')
      .sort({ rating: -1 })
      .limit(50);

    res.json({ shops });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
