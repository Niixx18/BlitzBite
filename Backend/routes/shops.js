const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { protect } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');

router.get('/', shopController.getShops);
router.get('/:id', shopController.getShop);
router.post(
  '/',
  protect,
  upload.fields([
    { name: 'featuredImage', maxCount: 1 },
    { name: 'coverImages', maxCount: 5 }
  ]),
  shopController.createShop
);
router.put(
  '/:id',
  protect,
  upload.fields([
    { name: 'featuredImage', maxCount: 1 },
    { name: 'coverImages', maxCount: 5 }
  ]),
  shopController.updateShop
);
router.delete('/:id', protect, shopController.deleteShop);

module.exports = router;
