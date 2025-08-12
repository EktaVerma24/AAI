const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  location: String,
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  upiQrCode: {
    type: String,
    default: null
  }
});

module.exports = mongoose.model('Shop',shopSchema);