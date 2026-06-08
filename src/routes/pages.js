const express    = require('express');
const { protect, restrictTo, optionalAuth } = require('../middleware/auth');
const Restaurant = require('../models/Restaurant');
const Order      = require('../models/Order');
const User       = require('../models/User');
const Notification = require('../models/Notification');
const catchAsync = require('../utils/catchAsync');

const router = express.Router();

// ── Public ────────────────────────────────────────────────
router.get('/', optionalAuth, catchAsync(async (req, res) => {
  const restaurants = await Restaurant.find({ isApproved: true })
    .select('name description image rating deliveryTime isOpen tags')
    .sort({ rating: -1 })
    .limit(6);
  res.render('index', {
    layout: 'layouts/main',
    title:  'UniEats — Campus Food Ordering',
    restaurants,
  });
}));

// ── Auth pages ───────────────────────────────────────────
router.get('/auth/login', (req, res) => {
  if (req.cookies?.jwt) return res.redirect('/');
  res.render('auth/login', { layout: 'layouts/auth', title: 'Sign In' });
});

router.get('/auth/register', (req, res) => {
  if (req.cookies?.jwt) return res.redirect('/');
  res.render('auth/register', { layout: 'layouts/auth', title: 'Create Account' });
});

router.get('/auth/forgot-password', (req, res) => {
  res.render('auth/forgot-password', { layout: 'layouts/auth', title: 'Reset Password' });
});

// ── Student ───────────────────────────────────────────────
router.get('/student/home', protect, restrictTo('student'), catchAsync(async (req, res) => {
  const limit = 9;
  const page  = Math.max(1, parseInt(req.query.page) || 1);
  const skip  = (page - 1) * limit;

  const [restaurants, total, unreadCount] = await Promise.all([
    Restaurant.find({ isApproved: true })
      .select('name description image rating deliveryTime isOpen tags')
      .sort({ rating: -1 })
      .skip(skip)
      .limit(limit),
    Restaurant.countDocuments({ isApproved: true }),
    Notification.countDocuments({ user: req.user._id, isRead: false }),
  ]);

  const pages = Math.ceil(total / limit);
  res.render('student/home', {
    layout: 'layouts/main',
    title: 'Browse Restaurants',
    restaurants,
    unreadCount,
    page,
    pages,
    total,
  });
}));

router.get('/student/restaurant/:id', protect, restrictTo('student'), catchAsync(async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) return res.redirect('/student/home');
  res.render('student/restaurant', {
    layout: 'layouts/main',
    title: restaurant.name,
    restaurant,
  });
}));

router.get('/student/cart', protect, restrictTo('student'), (req, res) => {
  res.render('student/cart', { layout: 'layouts/main', title: 'Your Cart' });
});

router.get('/student/checkout', protect, restrictTo('student'), (req, res) => {
  res.render('student/checkout', { layout: 'layouts/main', title: 'Checkout' });
});

router.get('/student/tracking/:id', protect, catchAsync(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('restaurant', 'name image deliveryTime')
    .populate('student', 'name');
  if (!order) return res.redirect('/student/orders');
  res.render('student/tracking', {
    layout: 'layouts/main',
    title: 'Track Order',
    order,
  });
}));

router.get('/student/orders', protect, restrictTo('student'), catchAsync(async (req, res) => {
  const limit  = 8;
  const page   = Math.max(1, parseInt(req.query.page) || 1);
  const skip   = (page - 1) * limit;
  const filter = { student: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('restaurant', 'name image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  const pages = Math.ceil(total / limit);
  res.render('student/orders', {
    layout: 'layouts/main',
    title: 'My Orders',
    orders,
    page,
    pages,
    total,
    statusFilter: req.query.status || '',
  });
}));

router.get('/student/profile', protect, (req, res) => {
  res.render('student/profile', { layout: 'layouts/main', title: 'My Profile' });
});

// ── Owner ─────────────────────────────────────────────────
router.get('/owner/dashboard', protect, restrictTo('owner'), catchAsync(async (req, res) => {
  const restaurants = await Restaurant.find({ owner: req.user._id });
  const ids = restaurants.map(r => r._id);

  const [totalOrders, pendingOrders, revenueResult] = await Promise.all([
    Order.countDocuments({ restaurant: { $in: ids } }),
    Order.countDocuments({ restaurant: { $in: ids }, status: { $in: ['Pending', 'Confirmed', 'Preparing'] } }),
    Order.aggregate([
      { $match: { restaurant: { $in: ids }, status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
  ]);

  res.render('owner/dashboard', {
    layout: 'layouts/dashboard',
    title: 'Owner Dashboard',
    restaurants,
    stats: {
      totalOrders,
      pendingOrders,
      revenue: revenueResult[0]?.total?.toFixed(2) || '0.00',
    },
  });
}));

router.get('/owner/menu/:restaurantId', protect, restrictTo('owner'), catchAsync(async (req, res) => {
  const restaurant = await Restaurant.findOne({ _id: req.params.restaurantId, owner: req.user._id });
  if (!restaurant) return res.redirect('/owner/dashboard');
  res.render('owner/menu', {
    layout: 'layouts/dashboard',
    title: 'Manage Menu — ' + restaurant.name,
    restaurant,
  });
}));

router.get('/owner/orders', protect, restrictTo('owner'), catchAsync(async (req, res) => {
  const restaurants = await Restaurant.find({ owner: req.user._id });
  const ids = restaurants.map(r => r._id);
  const orders = await Order.find({ restaurant: { $in: ids } })
    .populate('restaurant', 'name')
    .populate('student', 'name email')
    .sort({ createdAt: -1 })
    .limit(100);
  res.render('owner/orders', {
    layout: 'layouts/dashboard',
    title: 'Orders',
    orders,
    restaurants,
  });
}));

// ── Admin ─────────────────────────────────────────────────
router.get('/admin/dashboard', protect, restrictTo('admin'), catchAsync(async (req, res) => {
  const [totalUsers, totalRestaurants, totalOrders, revenueResult] = await Promise.all([
    User.countDocuments(),
    Restaurant.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { status: 'Completed' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
  ]);
  res.render('admin/dashboard', {
    layout: 'layouts/dashboard',
    title: 'Admin Dashboard',
    stats: {
      totalUsers,
      totalRestaurants,
      totalOrders,
      totalRevenue: revenueResult[0]?.total?.toFixed(2) || '0.00',
    },
  });
}));

router.get('/admin/restaurants', protect, restrictTo('admin'), catchAsync(async (req, res) => {
  const [restaurants, owners] = await Promise.all([
    Restaurant.find().populate('owner', 'name email').sort({ createdAt: -1 }),
    User.find({ role: 'owner' }).select('name email'),
  ]);
  res.render('admin/restaurants', {
    layout: 'layouts/dashboard',
    title: 'Manage Restaurants',
    restaurants,
    owners,
  });
}));

router.get('/admin/users', protect, restrictTo('admin'), catchAsync(async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  res.render('admin/users', {
    layout: 'layouts/dashboard',
    title: 'Manage Users',
    users,
  });
}));

router.get('/admin/orders', protect, restrictTo('admin'), catchAsync(async (req, res) => {
  const orders = await Order.find()
    .populate('student', 'name email')
    .populate('restaurant', 'name')
    .sort({ createdAt: -1 })
    .limit(200);
  res.render('admin/orders', {
    layout: 'layouts/dashboard',
    title: 'All Orders',
    orders,
  });
}));

module.exports = router;
