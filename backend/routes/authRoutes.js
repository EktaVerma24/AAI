const express = require('express');
const { registerVendor, loginVendor } = require('../controllers/authController');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Cashier = require('../models/cashierModel');

//vendor auth
router.post('/register', registerVendor);
router.post('/login', loginVendor);

//cashier login
router.post('/cashier/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const cashier = await Cashier.findOne({ email });
    if (!cashier) return res.status(400).json({ msg: "No cashier found" });

    const isMatch = await bcrypt.compare(password, cashier.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    // ✅ Include role and shopId in the token
    const token = jwt.sign(
      { id: cashier._id, role: 'cashier', shopId: cashier.shopId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, cashier });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});


module.exports = router;