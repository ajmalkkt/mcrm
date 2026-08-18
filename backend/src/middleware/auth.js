const jwt = require('jsonwebtoken');

// 1. Verify Authentication Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user; // Contains user_id, role, username
    next();
  });
};

// 2. Role-Based Access Guard
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: Access restricted to [${allowedRoles.join(', ')}] roles` 
      });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };