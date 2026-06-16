const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.get('/', protect, orderController.getMyOrders);
router.get('/owner', protect, orderController.getOwnerOrders);
router.get('/assigned', protect, authorize('delivery'), orderController.getAssignedOrders);
router.get('/available-delivery', protect, authorize('delivery'), orderController.getAvailableDeliveryOrders);
router.get('/delivery-partners', protect, orderController.getDeliveryPartners);
router.get('/:id/tracking', protect, orderController.getOrderTracking);
router.patch('/:id/accept-delivery', protect, authorize('delivery'), orderController.acceptDeliveryOrder);
router.patch('/:id/location', protect, authorize('delivery'), orderController.updateDeliveryLocation);
router.post('/:id/delivery-otp/send', protect, authorize('delivery'), orderController.sendDeliveryOtp);
router.post('/:id/delivery-otp/verify', protect, authorize('delivery'), orderController.verifyDeliveryOtp);
router.patch('/:id/assign-delivery', protect, orderController.assignDeliveryPartner);
router.patch('/:id/status', protect, orderController.updateOrderStatus);
router.post('/', protect, orderController.createOrder);

module.exports = router;
