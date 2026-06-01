const express = require('express');
const { protect, restrictTo } = require('../middleware/auth');
const {
  getAllUsers, getUser, updateMe, updateUser, deleteUser,
  getNotifications, markNotificationsRead,
} = require('../controllers/userController');

const router = express.Router();

router.use(protect);

router.get('/notifications', getNotifications);
router.patch('/notifications/read', markNotificationsRead);
router.patch('/me', updateMe);

router.get('/', restrictTo('admin'), getAllUsers);
router.get('/:id', restrictTo('admin'), getUser);
router.patch('/:id', restrictTo('admin'), updateUser);
router.delete('/:id', restrictTo('admin'), deleteUser);

module.exports = router;
