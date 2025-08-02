const mongoose = require('mongoose');

const cashierSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  }
});

module.exports = mongoose.model('Cashier', cashierSchema);