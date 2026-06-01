const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

exports.placeOrder = catchAsync(async (req, res, next) => {
  const { restaurantId, items, comment } = req.body;

  if (!restaurantId || !Array.isArray(items) || items.length === 0) {
    return next(new ApiError('Restaurant and at least one item are required.', 400));
  }

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return next(new ApiError('Restaurant not found.', 404));
  if (!restaurant.isOpen) return next(new ApiError('This restaurant is currently closed.', 400));

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = parseFloat((subtotal * 0.05).toFixed(2));
  const total = parseFloat((subtotal + tax).toFixed(2));

  const order = await Order.create({
    student: req.user._id,
    restaurant: restaurantId,
    items,
    subtotal,
    tax,
    total,
    comment: comment || '',
    statusHistory: [{ status: 'Pending' }],
  });

  await Restaurant.findByIdAndUpdate(restaurantId, { $inc: { totalOrders: 1 } });

  if (restaurant.owner) {
    await Notification.create({
      user: restaurant.owner,
      title: 'New Order Received',
      message: `New order #${order._id.toString().slice(-6)} from ${req.user.name}`,
      type: 'order',
      link: `/owner/orders`,
    });
    req.app.get('io')?.to(`owner_${restaurant.owner}`).emit('newOrder', { orderId: order._id, restaurantId });
  }

  const populated = await order.populate([
    { path: 'restaurant', select: 'name' },
    { path: 'student', select: 'name email' },
  ]);

  res.status(201).json({ status: 'success', data: { order: populated } });
});

exports.getMyOrders = catchAsync(async (req, res) => {
  const orders = await Order.find({ student: req.user._id })
    .populate('restaurant', 'name image')
    .sort({ createdAt: -1 });
  res.status(200).json({ status: 'success', results: orders.length, data: { orders } });
});

exports.getOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('restaurant', 'name image deliveryTime')
    .populate('student', 'name email');

  if (!order) return next(new ApiError('Order not found.', 404));

  const isOwner = req.user.role === 'owner' || req.user.role === 'admin';
  const isStudent = String(order.student._id) === String(req.user._id);
  if (!isOwner && !isStudent) return next(new ApiError('Access denied.', 403));

  res.status(200).json({ status: 'success', data: { order } });
});

exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status, note } = req.body;
  const validStatuses = ['Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return next(new ApiError(`Invalid status. Use: ${validStatuses.join(', ')}`, 400));
  }

  const order = await Order.findById(req.params.id).populate('restaurant');
  if (!order) return next(new ApiError('Order not found.', 404));

  if (req.user.role === 'owner') {
    if (!order.restaurant.owner || String(order.restaurant.owner) !== String(req.user._id)) {
      return next(new ApiError('You can only update orders for your restaurant.', 403));
    }
    if (status === 'Cancelled' && order.status !== 'Pending') {
      return next(new ApiError('Only pending orders can be cancelled.', 400));
    }
  }

  order.status = status;
  if (note) order.statusHistory[order.statusHistory.length - 1].note = note;
  await order.save();

  await Notification.create({
    user: order.student,
    title: 'Order Update',
    message: `Your order #${order._id.toString().slice(-6)} is now ${status}`,
    type: 'order',
    link: `/student/tracking/${order._id}`,
  });

  req.app.get('io')?.to(`user_${order.student}`).emit('orderUpdate', {
    orderId: order._id,
    status,
  });

  res.status(200).json({ status: 'success', data: { order } });
});

exports.getRestaurantOrders = catchAsync(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.restaurantId);
  if (!restaurant) return next(new ApiError('Restaurant not found.', 404));

  if (req.user.role === 'owner' && String(restaurant.owner) !== String(req.user._id)) {
    return next(new ApiError('Access denied.', 403));
  }

  const { status } = req.query;
  const filter = { restaurant: req.params.restaurantId };
  if (status) filter.status = status;

  const orders = await Order.find(filter)
    .populate('student', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({ status: 'success', results: orders.length, data: { orders } });
});

exports.getAllOrders = catchAsync(async (req, res) => {
  const { status, restaurantId, studentId, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (restaurantId) filter.restaurant = restaurantId;
  if (studentId) filter.student = studentId;

  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('student', 'name email')
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    results: orders.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    data: { orders },
  });
});
