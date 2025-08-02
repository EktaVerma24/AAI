const Vendor  = require('../models/vendorModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.registerVendor = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const existing = await Vendor.findOne({ email });
        if (existing) return res.status(400).json({ message: 'Vendor already exists' });

        const hash = await bcrypt.hash(password, 10);
        const vendor = await Vendor.create({name, email, password:hash});

        res.status(201).json({msg:"Vendor Registered",vendor});
    }catch(err){
        res.status(500).json({ msg: err.message });
    }
};

exports.loginVendor = async (req, res) => {
  const { email, password } = req.body;

  try {
    const vendor = await Vendor.findOne({ email });
    if (!vendor) return res.status(400).json({ msg: "No vendor found" });

    if (!vendor.approved) {
      return res.status(403).json({ msg: "Your registration is under review by admin." });
    }

    const isMatch = await bcrypt.compare(password, vendor.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid Credentials" });

    const token = jwt.sign({ id: vendor._id, role: 'vendor' }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, vendor });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
