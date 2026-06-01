const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

exports.getAllUsers = catchAsync(async (req, res) => {
  const { role, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) filter.$or = [
    { name: { $regex: search, $options: 'i' } },
    { email: { $regex: search, $options: 'i' } },
  ];

  const users = await User.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ status: 'success', results: users.length, data: { users } });
});

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ApiError('User not found.', 404));
  res.status(200).json({ status: 'success', data: { user: user.toSafeObject() } });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  const { name, phone } = req.body;
  const updates = {};
  if (name) updates.name = name;
  if (phone !== undefined) updates.phone = phone;

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ status: 'success', data: { user: user.toSafeObject() } });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  const { name, email, role, isActive } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) return next(new ApiError('User not found.', 404));

  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({ status: 'success', data: { user: user.toSafeObject() } });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return next(new ApiError('User not found.', 404));
  res.status(200).json({ status: 'success', message: 'User deleted.' });
});

exports.getNotifications = catchAsync(async (req, res) => {
  const Notification = require('../models/Notification');
  const notifications = await Notification.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20);
  res.status(200).json({ status: 'success', data: { notifications } });
});

exports.markNotificationsRead = catchAsync(async (req, res) => {
  const Notification = require('../models/Notification');
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.status(200).json({ status: 'success', message: 'All notifications marked as read.' });
});
