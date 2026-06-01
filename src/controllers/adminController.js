const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');
const catchAsync = require('../utils/catchAsync');

exports.getDashboardStats = catchAsync(async (req, res) => {
  const [totalUsers, totalRestaurants, totalOrders, revenueData, recentOrders, statusBreakdown] = await Promise.all([
    User.countDocuments(),
    Restaurant.countDocuments(),
    Order.countDocuments(),
    Order.aggregate([
      { $match: { status: { $in: ['Completed', 'Ready'] } } },
      { $group: { _id: null, totalRevenue: { $sum: '$total' }, avgOrder: { $avg: '$total' } } },
    ]),
    Order.find()
      .populate('student', 'name email')
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 })
      .limit(10),
    Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);

  const usersByRole = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      stats: {
        totalUsers,
        totalRestaurants,
        totalOrders,
        totalRevenue: revenueData[0]?.totalRevenue?.toFixed(2) || '0.00',
        avgOrderValue: revenueData[0]?.avgOrder?.toFixed(2) || '0.00',
      },
      recentOrders,
      statusBreakdown: statusBreakdown.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      usersByRole: usersByRole.reduce((acc, r) => ({ ...acc, [r._id]: r.count }), {}),
    },
  });
});

exports.getOrderAnalytics = catchAsync(async (req, res) => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const dailyOrders = await Order.aggregate([
    { $match: { createdAt: { $gte: sevenDaysAgo } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        count: { $sum: 1 },
        revenue: { $sum: '$total' },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  res.status(200).json({ status: 'success', data: { dailyOrders } });
});

exports.seedAdmin = catchAsync(async (req, res) => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return res.status(400).json({ status: 'fail', message: 'Set ADMIN_EMAIL and ADMIN_PASSWORD in .env' });
  }

  const exists = await User.findOne({ email: ADMIN_EMAIL });
  if (exists) {
    return res.status(200).json({ status: 'success', message: 'Admin already exists.' });
  }

  await User.create({ name: ADMIN_NAME || 'Admin', email: ADMIN_EMAIL, password: ADMIN_PASSWORD, role: 'admin' });
  res.status(201).json({ status: 'success', message: 'Admin user created.' });
});
