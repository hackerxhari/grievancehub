// server/middleware/auth.js
// Verifies JWT token and attaches authenticated user to req.user for GrievanceOps

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_grievanceops_2026';

// Middleware to authenticate any valid active user
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch latest user details (confirm active status)
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Account not found or has been deactivated.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid authentication token.' });
  }
};

// Middleware to enforce role requirements (CEO has global override)
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated.' });
    }

    // CEO / Admin has additive top-level permission across the entire portal
    if (req.user.role === 'ceo' || allowedRoles.includes(req.user.role)) {
      return next();
    }

    return res.status(403).json({
      error: `Access forbidden: Requires one of [${allowedRoles.join(', ')}] role.`
    });
  };
};

module.exports = {
  authenticate,
  requireRole,
  JWT_SECRET
};
