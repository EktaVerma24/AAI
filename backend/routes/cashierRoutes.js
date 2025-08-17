const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const Cashier = require('../models/cashierModel');
const auth = require('../middleware/authMiddleware');
const sendEmail = require('../utils/sendEmails');

// ✅ Create Cashier under a shop
router.post('/', auth('vendor'), async (req, res) => {
  const { name, email, password, shopId } = req.body;

  try {
    const existing = await Cashier.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Cashier already exists' });

    const hash = await bcrypt.hash(password, 10);
    const newCashier = await Cashier.create({ name, email, password: hash, shopId });

    res.status(201).json({ msg: 'Cashier created', cashier: newCashier });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ✅ Get all cashiers for a specific shop
router.get('/:shopId', auth('vendor'), async (req, res) => {
  try {
    const cashiers = await Cashier.find({ shopId: req.params.shopId });
    res.json(cashiers);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch cashiers' });
  }
});

// ✅ Get Pending Cashiers for Admin
router.get('/pending/all', auth('admin'), async (req, res) => {
  try {
    const cashiers = await Cashier.find({ approved: false })
      .populate('shopId', 'name location')
      .populate('approvedBy', 'name');
    res.json(cashiers);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch pending cashiers' });
  }
});

// ✅ Approve Cashier by Admin
router.patch('/:id/approve', auth('admin'), async (req, res) => {
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
router.delete('/:id/reject', auth('admin'), async (req, res) => {
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

// ✅ Delete a cashier by ID
router.delete('/:cashierId', auth('vendor'), async (req, res) => {
  try {
    await Cashier.findByIdAndDelete(req.params.cashierId);
    res.json({ msg: 'Cashier removed' });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to delete cashier' });
  }
});

module.exports = router;
