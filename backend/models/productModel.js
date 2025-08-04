const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  quantity: Number,
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  lowStockThreshold: {
  type: Number,
  default: 5, // can adjust per product later
},
});

module.exports = mongoose.model('Product', productSchema);
