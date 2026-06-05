const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const { protect } = require('../middlewares/authMiddleware');
const { upload } = require('../middlewares/uploadMiddleware');

router.get('/', itemController.getItems);
router.get('/:id', itemController.getItem);
router.post('/', protect, upload.array('images', 5), itemController.createItem);
router.post('/:id/rate', protect, itemController.rateItem);
router.put('/:id', protect, itemController.authorizeItemOwner, upload.array('images', 5), itemController.updateItem);
router.delete('/:id', protect, itemController.authorizeItemOwner, itemController.deleteItem);

module.exports = router;
