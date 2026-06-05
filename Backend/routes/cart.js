const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, cartController.getCart);
router.post('/', protect, cartController.addToCart);
router.put('/:itemId', protect, cartController.updateCartItem);
router.delete('/:itemId', protect, cartController.removeCartItem);
router.delete('/', protect, cartController.clearCart);

module.exports = router;
