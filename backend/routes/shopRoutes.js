const express = require('express');
const router = express.Router();
const Shop = require('../models/shopModel');
const auth = require('../middleware/authMiddleware');

// ✅ Create Shop
router.post('/', auth('vendor'), async (req, res) => {
  const { name, location } = req.body;
  try {
    const newShop = await Shop.create({
      name,
      location,
      vendorId: req.user.id
    });

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

module.exports = router;
