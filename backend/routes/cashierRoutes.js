const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const Cashier = require('../models/cashierModel');
const auth = require('../middleware/authMiddleware');

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
