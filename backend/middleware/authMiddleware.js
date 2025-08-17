const jwt = require('jsonwebtoken');
const Vendor = require('../models/vendorModel');
const Cashier = require('../models/cashierModel');

const auth = (requiredRole) => {
  return async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ msg: "No token provided" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (requiredRole && decoded.role !== requiredRole) {
        return res.status(403).json({ msg: "Access denied: unauthorized role" });
      }

      // Check approval status for vendors and cashiers
      if (decoded.role === 'vendor') {
        const vendor = await Vendor.findById(decoded.id);
        if (!vendor || !vendor.approved) {
          return res.status(403).json({ msg: "Access denied: vendor not approved" });
        }
      } else if (decoded.role === 'cashier') {
        const cashier = await Cashier.findById(decoded.id);
        if (!cashier || !cashier.approved) {
          return res.status(403).json({ msg: "Access denied: cashier not approved" });
        }
      }

      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ msg: "Invalid token" });
    }
  };
};

const multiRoleAuth = (roles = []) => {
  return async (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ msg: "No token provided" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!roles.includes(decoded.role)) {
        return res.status(403).json({ msg: "Access denied: role not allowed" });
      }

      // Check approval status for vendors and cashiers
      if (decoded.role === 'vendor') {
        const vendor = await Vendor.findById(decoded.id);
        if (!vendor || !vendor.approved) {
          return res.status(403).json({ msg: "Access denied: vendor not approved" });
        }
      } else if (decoded.role === 'cashier') {
        const cashier = await Cashier.findById(decoded.id);
        if (!cashier || !cashier.approved) {
          return res.status(403).json({ msg: "Access denied: cashier not approved" });
        }
      }

      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ msg: "Invalid token" });
    }
  };
};

module.exports = auth;
module.exports.multiRoleAuth = multiRoleAuth;
