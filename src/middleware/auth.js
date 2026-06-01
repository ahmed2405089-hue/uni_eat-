const jwt      = require('jsonwebtoken');
const User     = require('../models/User');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

const verifyToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_dev_only');

const isApiRequest = (req) =>
  req.xhr || req.path.startsWith('/api/') || (req.headers.accept || '').includes('application/json');

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  if (req.cookies?.jwt) {
    token = req.cookies.jwt;
  } else if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    if (isApiRequest(req)) {
      return next(new ApiError('Not authenticated. Please log in.', 401));
    }
    return res.redirect('/auth/login');
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    if (isApiRequest(req)) {
      return next(new ApiError('Invalid or expired token. Please log in again.', 401));
    }
    res.clearCookie('jwt');
    return res.redirect('/auth/login');
  }

  const user = await User.findById(decoded.id);
  if (!user || !user.isActive) {
    if (isApiRequest(req)) {
      return next(new ApiError('User no longer exists or is deactivated.', 401));
    }
    res.clearCookie('jwt');
    return res.redirect('/auth/login');
  }

  req.user        = user;
  res.locals.user = user;
  next();
});

exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    if (isApiRequest(req)) {
      return next(new ApiError('You do not have permission to perform this action.', 403));
    }
    return res.redirect('/');
  }
  next();
};

exports.optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.jwt;
    if (token) {
      const decoded = verifyToken(token);
      const user    = await User.findById(decoded.id);
      if (user && user.isActive) {
        req.user        = user;
        res.locals.user = user;
      }
    }
  } catch {
    /* silently ignore invalid/expired token */
  }
  next();
};
