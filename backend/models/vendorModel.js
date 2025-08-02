const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  approved: {
    type: Boolean,
    default: false // 👈 vendors are unapproved by default
  }
});

module.exports = mongoose.model('Vendor', vendorSchema);
