const jwt = require('jsonwebtoken');

const authMiddleware = (requiredRole) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]; // Format: Bearer <token>
    if (!token) return res.status(401).json({ msg: "No token provided" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (requiredRole && decoded.role !== requiredRole) {
        return res.status(403).json({ msg: "Access denied: unauthorized role" });
      }
      req.user = decoded; // set user ID and role in req
      next();
    } catch (err) {
      res.status(401).json({ msg: "Invalid token" });
    }
  };
};

module.exports = authMiddleware;