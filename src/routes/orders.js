const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const {
  placeOrder, getMyOrders, getOrder,
  updateOrderStatus, cancelOrder, getRestaurantOrders, getAllOrders,
} = require('../controllers/orderController');

const router = express.Router();

router.use(protect);

router.post('/', restrictTo('student'), placeOrder);
router.get('/my', restrictTo('student'), getMyOrders);
router.get('/', restrictTo('admin'), getAllOrders);
router.get('/restaurant/:restaurantId', restrictTo('admin', 'owner'), getRestaurantOrders);
router.get('/:id', getOrder);
router.patch('/:id/status', restrictTo('admin', 'owner'), updateOrderStatus);
router.patch('/:id/cancel', restrictTo('student'), cancelOrder);

module.exports = router;
