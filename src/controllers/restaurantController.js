const Restaurant = require('../models/Restaurant');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');

exports.getAllRestaurants = catchAsync(async (req, res) => {
  const { search, tag } = req.query;
  const filter = { isApproved: true };

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $regex: search, $options: 'i' } },
      { 'categories.items.name': { $regex: search, $options: 'i' } },
    ];
  }
  if (tag) filter.tags = tag;

  const restaurants = await Restaurant.find(filter)
    .select('-categories')
    .sort({ rating: -1 });

  res.status(200).json({ status: 'success', results: restaurants.length, data: { restaurants } });
});

exports.getRestaurant = catchAsync(async (req, res, next) => {
  const restaurant = await Restaurant.findById(req.params.id).populate('owner', 'name email');
  if (!restaurant) return next(new ApiError('Restaurant not found.', 404));
  res.status(200).json({ status: 'success', data: { restaurant } });
});

exports.createRestaurant = catchAsync(async (req, res, next) => {
  const { name, description, deliveryTime, tags } = req.body;
  if (!name) return next(new ApiError('Restaurant name is required.', 400));

  const restaurant = await Restaurant.create({
    name,
    description,
    deliveryTime,
    tags: Array.isArray(tags) ? tags : (tags ? [tags] : []),
    isApproved: req.user.role === 'admin',
  });

  res.status(201).json({ status: 'success', data: { restaurant } });
});

exports.updateRestaurant = catchAsync(async (req, res, next) => {
  const { name, description, rating, deliveryTime, isOpen, isApproved, tags } = req.body;
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) return next(new ApiError('Restaurant not found.', 404));

  if (req.user.role === 'owner' && String(restaurant.owner) !== String(req.user._id)) {
    return next(new ApiError('You can only update your own restaurant.', 403));
  }

  if (name) restaurant.name = name;
  if (description !== undefined) restaurant.description = description;
  if (deliveryTime) restaurant.deliveryTime = deliveryTime;
  if (isOpen !== undefined) restaurant.isOpen = isOpen;
  if (tags !== undefined) restaurant.tags = Array.isArray(tags) ? tags : [tags];
  if (req.user.role === 'admin' && rating !== undefined) restaurant.rating = rating;
  if (req.user.role === 'admin' && isApproved !== undefined) restaurant.isApproved = isApproved;

  await restaurant.save();
  res.status(200).json({ status: 'success', data: { restaurant } });
});

exports.deleteRestaurant = catchAsync(async (req, res, next) => {
  const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
  if (!restaurant) return next(new ApiError('Restaurant not found.', 404));
  res.status(200).json({ status: 'success', message: 'Restaurant deleted.' });
});

exports.assignOwner = catchAsync(async (req, res, next) => {
  const { ownerId } = req.body;
  const restaurant = await Restaurant.findByIdAndUpdate(
    req.params.id,
    { owner: ownerId },
    { new: true, runValidators: true }
  );
  if (!restaurant) return next(new ApiError('Restaurant not found.', 404));
  res.status(200).json({ status: 'success', data: { restaurant } });
});

exports.addMenuItem = catchAsync(async (req, res, next) => {
  const { category, name, price, description } = req.body;
  if (!name || price === undefined) return next(new ApiError('Item name and price are required.', 400));

  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) return next(new ApiError('Restaurant not found.', 404));

  if (req.user.role === 'owner' && String(restaurant.owner) !== String(req.user._id)) {
    return next(new ApiError('You can only manage your own restaurant.', 403));
  }

  const categoryName = category || 'Menu';
  let cat = restaurant.categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
  if (!cat) {
    restaurant.categories.push({ name: categoryName, items: [] });
    cat = restaurant.categories[restaurant.categories.length - 1];
  }

  const exists = cat.items.some(i => i.name.toLowerCase() === name.toLowerCase());
  if (exists) return next(new ApiError('An item with that name already exists in this category.', 409));

  cat.items.push({ name, price: Number(price), description: description || '' });
  await restaurant.save();
  res.status(201).json({ status: 'success', data: { restaurant } });
});

exports.updateMenuItem = catchAsync(async (req, res, next) => {
  const { category, itemId, name, price, description, isAvailable } = req.body;
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) return next(new ApiError('Restaurant not found.', 404));

  if (req.user.role === 'owner' && String(restaurant.owner) !== String(req.user._id)) {
    return next(new ApiError('You can only manage your own restaurant.', 403));
  }

  const cat = restaurant.categories.find(c => c.name.toLowerCase() === category?.toLowerCase());
  if (!cat) return next(new ApiError('Category not found.', 404));

  const item = cat.items.id(itemId);
  if (!item) return next(new ApiError('Item not found.', 404));

  if (name) item.name = name;
  if (price !== undefined) item.price = Number(price);
  if (description !== undefined) item.description = description;
  if (isAvailable !== undefined) item.isAvailable = isAvailable;

  await restaurant.save();
  res.status(200).json({ status: 'success', data: { restaurant } });
});

exports.deleteMenuItem = catchAsync(async (req, res, next) => {
  const { category, itemId } = req.body;
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) return next(new ApiError('Restaurant not found.', 404));

  if (req.user.role === 'owner' && String(restaurant.owner) !== String(req.user._id)) {
    return next(new ApiError('You can only manage your own restaurant.', 403));
  }

  const cat = restaurant.categories.find(c => c.name.toLowerCase() === category?.toLowerCase());
  if (!cat) return next(new ApiError('Category not found.', 404));

  const itemIndex = cat.items.findIndex(i => String(i._id) === itemId);
  if (itemIndex === -1) return next(new ApiError('Item not found.', 404));

  cat.items.splice(itemIndex, 1);
  await restaurant.save();
  res.status(200).json({ status: 'success', message: 'Item deleted.' });
});

exports.getOwnerRestaurants = catchAsync(async (req, res) => {
  const restaurants = await Restaurant.find({ owner: req.user._id });
  res.status(200).json({ status: 'success', results: restaurants.length, data: { restaurants } });
});
