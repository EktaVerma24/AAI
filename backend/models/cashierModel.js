const mongoose = require('mongoose');

const cashierSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  approved: {
    type: Boolean,
    default: false
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  approvedAt: {
    type: Date
  }
});

module.exports = mongoose.model('Cashier', cashierSchema);