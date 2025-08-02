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

const router = express.Router();

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

// ✅ Approve vendor
router.patch('/vendors/:id/approve', auth('admin'), async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    );
    res.json({ msg: 'Vendor approved', vendor });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
