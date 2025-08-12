const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  companyName: { type: String, required: true },
  email: { type: String, unique: true },
  password: String,
  address: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  approved: {
    type: Boolean,
    default: false // 👈 vendors are unapproved by default
  }
});

module.exports = mongoose.model('Vendor', vendorSchema);
