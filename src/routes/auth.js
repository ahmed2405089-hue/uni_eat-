const express = require('express');
const rateLimit = require('express-rate-limit');
const { protect } = require('../middleware/auth');
const {
  register, login, logout, getMe,
  updatePassword, forgotPassword, resetPassword,
} = require('../controllers/authController');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { status: 'fail', message: 'Too many attempts. Please try again in 15 minutes.' },
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.patch('/update-password', protect, updatePassword);
router.post('/forgot-password', authLimiter, forgotPassword);
router.patch('/reset-password/:token', resetPassword);

module.exports = router;
