const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Shop = require('../models/shopModel');
const Cashier = require('../models/cashierModel');
const auth = require('../middleware/authMiddleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'upi-qr-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// ✅ Create Shop with UPI QR Code
router.post('/', auth('vendor'), upload.single('upiQrCode'), async (req, res) => {
  const { name, location } = req.body;
  try {
    const shopData = {
      name,
      location,
      vendorId: req.user.id
    };

    // Add UPI QR code filename if file was uploaded
    if (req.file) {
      shopData.upiQrCode = req.file.filename;
    }

    const newShop = await Shop.create(shopData);

    // ✅ This response matches what your frontend expects
    res.status(201).json({
      msg: 'Shop created',
      shop: newShop
    });

  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ✅ Get Shops for logged-in Vendor
router.get('/', auth('vendor'), async (req, res) => {
  try {
    const shops = await Shop.find({ vendorId: req.user.id });
    res.json(shops);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ✅ Get Pending Shops for Admin
router.get('/pending', auth('admin'), async (req, res) => {
  try {
    const shops = await Shop.find({ approved: false })
      .populate('vendorId', 'companyName name email')
      .populate('approvedBy', 'name');
    res.json(shops);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ✅ Approve Shop by Admin
router.patch('/:id/approve', auth('admin'), async (req, res) => {
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
    const subject = `Shop Approval - ${shop.name}`;
    const message = `
Dear ${shop.vendorId.companyName || shop.vendorId.name || 'Vendor'},

Your shop "${shop.name}" has been approved by the admin.

Shop Details:
- Name: ${shop.name}
- Location: ${shop.location}
- Approved Date: ${new Date().toLocaleDateString()}

You can now add cashiers and products to this shop.

Best regards,
Airport Inventory Management System`.trim();

    await sendEmail(shop.vendorId.email, subject, message);

    res.json({ msg: 'Shop approved and email sent', shop });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ✅ Reject Shop by Admin
router.delete('/:id', auth('admin'), async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate('vendorId', 'companyName name email');
    if (!shop) {
      return res.status(404).json({ msg: 'Shop not found' });
    }

    await Shop.findByIdAndDelete(req.params.id);

    // Send rejection email to vendor
    const subject = `Shop Rejection - ${shop.name}`;
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

// ✅ Serve UPI QR Code Images
router.get('/qr-code/:filename', (req, res) => {
  console.log(req.params);
  const filename = req.params.filename;
  console.log(filename);
  const filepath = path.join(__dirname, '..', 'uploads', filename);
  console.log(filepath);
  res.sendFile(filepath);
});

// ✅ Get current cashier's shop (includes upiQrCode)
router.get('/cashier-shop', auth('cashier'), async (req, res) => {
  try {
    const cashier = await require('../models/cashierModel').findById(req.user.id);
    if (!cashier) return res.status(404).json({ msg: 'Cashier not found' });
    const shop = await Shop.findById(cashier.shopId);
    if (!shop) return res.status(404).json({ msg: 'Shop not found' });
    res.json(shop);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ✅ Update UPI QR Code for a Shop
router.patch('/:id/qr', auth('vendor'), upload.single('upiQrCode'), async (req, res) => {
  try {
    const shop = await Shop.findOne({ _id: req.params.id, vendorId: req.user.id });
    if (!shop) return res.status(404).json({ msg: 'Shop not found' });

    if (req.file) {
      shop.upiQrCode = req.file.filename;
      await shop.save();
      return res.json({ msg: 'QR code updated', upiQrCode: shop.upiQrCode });
    } else {
      return res.status(400).json({ msg: 'No file uploaded' });
    }
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
