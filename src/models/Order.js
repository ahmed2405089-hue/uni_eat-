const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
}, { _id: false });

const statusHistorySchema = new mongoose.Schema({
  status: { type: String, required: true },
  note: { type: String, default: '' },
  changedAt: { type: Date, default: Date.now },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  },
  items: {
    type: [orderItemSchema],
    validate: { validator: v => v.length > 0, message: 'Order must have at least one item' },
  },
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  total: { type: Number, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Preparing', 'Ready', 'Completed', 'Cancelled'],
    default: 'Pending',
  },
  statusHistory: [statusHistorySchema],
  comment: { type: String, trim: true, default: '' },
  estimatedTime: { type: String, default: null },
  completedAt: { type: Date, default: null },
  cancelledAt: { type: Date, default: null },
  cancelReason: { type: String, default: '' },
}, { timestamps: true });

orderSchema.index({ student: 1, createdAt: -1 });
orderSchema.index({ restaurant: 1, status: 1 });
orderSchema.index({ status: 1 });

orderSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.statusHistory.push({ status: this.status });
    if (this.status === 'Completed') this.completedAt = new Date();
    if (this.status === 'Cancelled') this.cancelledAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
