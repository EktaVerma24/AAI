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
const sendEmail = require('../utils/sendEmails');

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
    const vendors = await Vendor.find({ approved: true });
    const shops = await Shop.find({});
    const cashiers = await Cashier.find({});
    const products = await Product.find({});
    const pendingShops = await Shop.find({ approved: false }).countDocuments();
    const pendingCashiers = await Cashier.find({ approved: false }).countDocuments();

    const recentBills = await Bill.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
    path: 'shopId',
    populate: {
      path: 'vendorId',
      model: 'Vendor',
      select: 'companyName name'
    },
          select: 'companyName name vendorId'
  })
  .populate('cashierId', 'name');

    // 🔥 Monthly sales grouped by vendor
    const monthlySales = await Bill.aggregate([
      {
        $lookup: {
          from: 'shops',
          localField: 'shopId',
          foreignField: '_id',
          as: 'shop'
        }
      },
      { $unwind: '$shop' },
      {
        $lookup: {
          from: 'vendors',
          localField: 'shop.vendorId',
          foreignField: '_id',
          as: 'vendor'
        }
      },
      { $unwind: '$vendor' },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
            vendorName: { $ifNull: ['$vendor.companyName', '$vendor.name'] }
          },
          totalSales: { $sum: '$total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    

        // 🔥 Daily sales for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const dailySales = await Bill.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalSales: { $sum: '$total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    // 🔥 Shop-wise daily sales
    const shopDailySales = await Bill.aggregate([
      {
        $lookup: {
          from: 'shops',
          localField: 'shopId',
          foreignField: '_id',
          as: 'shop'
        }
      },
      { $unwind: '$shop' },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
            shopId: '$shop._id',
            shopName: '$shop.name'
          },
          totalSales: { $sum: '$total' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1, '_id.shopName': 1 } }
    ]);

    res.json({
      vendors: vendors.length,
      vendorsList: vendors,
      shops: shops.length,
      shopsList: shops,
      cashiers: cashiers.length,
      cashiersList: cashiers,
      products: products.length,
      productsList: products,
      recentBills,
      monthlySales,
      pendingShops,
      pendingCashiers,
      dailySales,
      shopDailySales
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
      text: `Hello ${vendor.companyName || vendor.name || 'Vendor'}, your registration has been approved. You can now log in.`
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
      text: `Hello ${vendor.companyName || vendor.name || 'Vendor'}, your registration has been rejected. Contact support for more information.`
    });

    res.json({ msg: 'Vendor rejected and email sent' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ✅ Get pending shops for approval
router.get('/pending-shops', auth('admin'), async (req, res) => {
  try {
    const shops = await Shop.find({ approved: false })
      .populate('vendorId', 'companyName name email')
      .populate('approvedBy', 'name');
    res.json(shops);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ✅ Get pending cashiers for approval
router.get('/pending-cashiers', auth('admin'), async (req, res) => {
  try {
    const cashiers = await Cashier.find({ approved: false })
      .populate('shopId', 'name location')
      .populate('approvedBy', 'name');
    res.json(cashiers);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ✅ Approve Shop by Admin
router.patch('/shops/:id/approve', auth('admin'), async (req, res) => {
  try {
    const shop = await Shop.findByIdAndUpdate(
      req.params.id,
      { 
        approved: true, 
        approvedBy: req.user.id,
        approvedAt: new Date()
      },
      { new: true }
    ).populate('vendorId', 'companyName name email');

    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    // Send email notification to vendor
    const subject = `Shop Approved - ${shop.name}`;
    const message = `
Dear ${shop.vendorId.companyName || shop.vendorId.name || 'Vendor'},

Your shop "${shop.name}" has been approved by the admin.

Shop Details:
- Shop Name: ${shop.name}
- Location: ${shop.location}
- Approved Date: ${new Date().toLocaleDateString()}

You can now manage your shop and add cashiers.

Best regards,
Airport Inventory Management System`.trim();

    await sendEmail(shop.vendorId.email, subject, message);

    res.json({ msg: 'Shop approved and email sent', shop });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ✅ Reject Shop by Admin
router.delete('/shops/:id', auth('admin'), async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate('vendorId', 'companyName name email');
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    await Shop.findByIdAndDelete(req.params.id);

    // Send rejection email to vendor
    const subject = `Shop Rejected - ${shop.name}`;
    const message = `
Dear ${shop.vendorId.companyName || shop.vendorId.name || 'Vendor'},

Your shop "${shop.name}" has been rejected by the admin.

Please contact the admin for more information about the rejection.

Best regards,
Airport Inventory Management System`.trim();

    await sendEmail(shop.vendorId.email, subject, message);

    res.json({ msg: 'Shop rejected and email sent' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ✅ Approve Cashier by Admin
router.patch('/cashiers/:id/approve', auth('admin'), async (req, res) => {
  try {
    const cashier = await Cashier.findByIdAndUpdate(
      req.params.id,
      { 
        approved: true, 
        approvedBy: req.user.id,
        approvedAt: new Date()
      },
      { new: true }
    ).populate('shopId', 'name location');

    if (!cashier) {
      return res.status(404).json({ msg: 'Cashier not found' });
    }

    // Send email notification to cashier
    const subject = `Cashier Account Approved - ${cashier.shopId.name}`;
    const message = `
Dear ${cashier.name},

Your cashier account has been approved by the admin.

Account Details:
- Name: ${cashier.name}
- Email: ${cashier.email}
- Shop: ${cashier.shopId.name}
- Location: ${cashier.shopId.location}
- Approved Date: ${new Date().toLocaleDateString()}

You can now log in to your cashier dashboard.

Best regards,
Airport Inventory Management System`.trim();

    await sendEmail(cashier.email, subject, message);

    res.json({ msg: 'Cashier approved and email sent', cashier });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ✅ Reject Cashier by Admin
router.delete('/cashiers/:id/reject', auth('admin'), async (req, res) => {
  try {
    const cashier = await Cashier.findById(req.params.id).populate('shopId', 'name location');
    if (!cashier) {
      return res.status(404).json({ msg: 'Cashier not found' });
    }

    await Cashier.findByIdAndDelete(req.params.id);

    // Send rejection email to cashier
    const subject = `Cashier Account Rejected - ${cashier.shopId.name}`;
    const message = `
Dear ${cashier.name},

Your cashier account has been rejected by the admin.

Please contact the admin for more information about the rejection.

Best regards,
Airport Inventory Management System`.trim();

    await sendEmail(cashier.email, subject, message);

    res.json({ msg: 'Cashier rejected and email sent' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
