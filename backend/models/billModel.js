const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      quantity: Number,
      price: Number
    }
  ],
  total: Number,
  customerName: String,
  customerPhone: String,
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop'
  },
  cashierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cashier'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});
module.exports = mongoose.model('Bill', billSchema);
