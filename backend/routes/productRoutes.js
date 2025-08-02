const express = require('express');
const router = express.Router();
const Product = require('../models/productModel');
const auth = require('../middleware/authMiddleware');

// Create product (Vendor)
router.post('/', auth('vendor'), async (req, res) => {
  const { name, price, quantity, shopId } = req.body;
  try {
    const product = await Product.create({ name, price, quantity, shopId });
    res.status(201).json({ msg: 'Product added', product });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Get all products for a shop (Vendor)
router.get('/:shopId', auth('vendor'), async (req, res) => {
  try {
    const products = await Product.find({ shopId: req.params.shopId });
    res.json(products);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Update product (Vendor)
router.put('/:id', auth('vendor'), async (req, res) => {
  try {
    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Delete product (Vendor)
router.delete('/:id', auth('vendor'), async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;

