const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  price: { type: Number, required: true, min: 0 },
  image: { type: String, default: null },
  isAvailable: { type: Boolean, default: true },
}, { _id: true });

const menuCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  items: [menuItemSchema],
}, { _id: true });

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Restaurant name is required'],
    trim: true,
    unique: true,
  },
  description: { type: String, trim: true, default: '' },
  image: { type: String, default: null },
  logo: { type: String, default: null },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  deliveryTime: { type: String, default: '20-30 mins' },
  isOpen: { type: Boolean, default: true },
  isApproved: { type: Boolean, default: true },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  categories: [menuCategorySchema],
  tags: [{ type: String, trim: true }],
  totalOrders: { type: Number, default: 0 },
}, { timestamps: true });

restaurantSchema.index({ name: 'text', description: 'text' });
restaurantSchema.index({ owner: 1 });
restaurantSchema.index({ isApproved: 1 });

module.exports = mongoose.model('Restaurant', restaurantSchema);
