const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const {
  getAllRestaurants, getRestaurant, createRestaurant,
  updateRestaurant, deleteRestaurant, assignOwner,
  addMenuItem, updateMenuItem, deleteMenuItem, getOwnerRestaurants,
} = require('../controllers/restaurantController');

const router = express.Router();

router.get('/', getAllRestaurants);
router.get('/my', protect, restrictTo('owner'), getOwnerRestaurants);
router.get('/:id', getRestaurant);
router.post('/', protect, restrictTo('admin'), createRestaurant);
router.put('/:id', protect, restrictTo('admin', 'owner'), updateRestaurant);
router.delete('/:id', protect, restrictTo('admin'), deleteRestaurant);
router.patch('/:id/assign-owner', protect, restrictTo('admin'), assignOwner);

router.post('/:id/menu', protect, restrictTo('admin', 'owner'), addMenuItem);
router.put('/:id/menu', protect, restrictTo('admin', 'owner'), updateMenuItem);
router.delete('/:id/menu', protect, restrictTo('admin', 'owner'), deleteMenuItem);

module.exports = router;
