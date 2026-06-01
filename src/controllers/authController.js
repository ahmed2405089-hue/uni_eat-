const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_dev_only', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(Date.now() + (Number(process.env.JWT_COOKIE_EXPIRES_IN) || 7) * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  };
  res.cookie('jwt', token, cookieOptions);
  const safeUser = user.toSafeObject();
  res.status(statusCode).json({ status: 'success', token, data: { user: safeUser } });
};

exports.register = catchAsync(async (req, res, next) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return next(new ApiError('Name, email, and password are required.', 400));
  }

  const allowedRoles = ['student', 'owner'];
  const assignedRole = allowedRoles.includes(role) ? role : 'student';

  const user = await User.create({ name, email, password, role: assignedRole });
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  createSendToken(user, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ApiError('Email and password are required.', 400));
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.correctPassword(password))) {
    return next(new ApiError('Incorrect email or password.', 401));
  }

  if (!user.isActive) {
    return next(new ApiError('Your account has been deactivated. Contact support.', 403));
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 1000),
    httpOnly: true,
  });
  res.status(200).json({ status: 'success', message: 'Logged out successfully.' });
};

exports.getMe = catchAsync(async (req, res) => {
  res.status(200).json({ status: 'success', data: { user: req.user.toSafeObject() } });
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return next(new ApiError('Current and new password are required.', 400));
  }

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.correctPassword(currentPassword))) {
    return next(new ApiError('Current password is incorrect.', 401));
  }

  if (newPassword.length < 6) {
    return next(new ApiError('New password must be at least 6 characters.', 400));
  }

  user.password = newPassword;
  await user.save();
  createSendToken(user, 200, res);
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email?.toLowerCase() });
  if (!user) {
    return next(new ApiError('No user found with that email address.', 404));
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'Password reset token sent to email (demo: token below).',
    resetToken,
  });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ApiError('Token is invalid or has expired.', 400));
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  createSendToken(user, 200, res);
});
