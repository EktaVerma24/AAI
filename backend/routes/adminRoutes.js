const express = require('express');
const Admin = require('../models/adminModel');
const Vendor = require('../models/vendorModel');
const Shop = require('../models/shopModel');
const Cashier = require('../models/cashierModel');
const Product = require('../models/productModel');
const Bill = require('../models/billModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const auth = require('../middleware/authMiddleware');
const nodemailer = require('nodemailer');

const router = express.Router();

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ✅ Admin Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ msg: 'Admin not found' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.json({ token, admin });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ✅ Admin Dashboard Data
router.get('/dashboard', auth('admin'), async (req, res) => {
  try {
    const vendors = await Vendor.countDocuments();
    const shops = await Shop.countDocuments();
    const cashiers = await Cashier.countDocuments();
    const products = await Product.countDocuments();
    const bills = await Bill.find().sort({ createdAt: -1 }).limit(5);

    const totalSales = (await Bill.find()).reduce((sum, bill) => sum + bill.total, 0);

    res.json({
      vendors,
      shops,
      cashiers,
      products,
      totalSales,
      recentBills: bills
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ✅ Get all vendors
router.get('/vendors', auth('admin'), async (req, res) => {
  try {
    const vendors = await Vendor.find();
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ✅ Approve vendor with email notification
router.patch('/vendors/:id/approve', auth('admin'), async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    );

    // Send email to vendor
    await transporter.sendMail({
      to: vendor.email,
      subject: 'Vendor Approval Confirmation',
      text: `Hello ${vendor.name}, your registration has been approved. You can now log in.`
    });

    res.json({ msg: 'Vendor approved and email sent', vendor });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ✅ Reject vendor with email notification
router.delete('/vendors/:id', auth('admin'), async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);

    // Send rejection email
    await transporter.sendMail({
      to: vendor.email,
      subject: 'Vendor Registration Rejected',
      text: `Hello ${vendor.name}, your registration has been rejected. Contact support for more information.`
    });

    res.json({ msg: 'Vendor rejected and email sent' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
