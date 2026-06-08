const express  = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const upload   = require('../middleware/upload');
const {
  getAllRestaurants, getRestaurant, createRestaurant,
  updateRestaurant, deleteRestaurant, assignOwner,
  addMenuItem, updateMenuItem, deleteMenuItem, getOwnerRestaurants,
} = require('../controllers/restaurantController');

const router = express.Router();

router.get('/', getAllRestaurants);
router.get('/my', protect, restrictTo('owner'), getOwnerRestaurants);
router.get('/:id', getRestaurant);
router.post('/',    protect, restrictTo('admin'),         upload.single('image'), createRestaurant);
router.put('/:id',  protect, restrictTo('admin', 'owner'), upload.single('image'), updateRestaurant);
router.delete('/:id', protect, restrictTo('admin'), deleteRestaurant);
router.patch('/:id/assign-owner', protect, restrictTo('admin'), assignOwner);

router.post('/:id/menu',   protect, restrictTo('admin', 'owner'), upload.single('image'), addMenuItem);
router.put('/:id/menu',    protect, restrictTo('admin', 'owner'), upload.single('image'), updateMenuItem);
router.delete('/:id/menu', protect, restrictTo('admin', 'owner'), deleteMenuItem);

module.exports = router;
