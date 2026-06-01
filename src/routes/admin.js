const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const { getDashboardStats, getOrderAnalytics, seedAdmin } = require('../controllers/adminController');

const router = express.Router();

router.get('/seed', seedAdmin);
router.use(protect, restrictTo('admin'));
router.get('/stats', getDashboardStats);
router.get('/analytics', getOrderAnalytics);

module.exports = router;
