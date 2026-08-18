const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/authController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Public routes
router.post('/login', login);

// Admin-only user registration (or public if open sign-ups are allowed)
router.post('/register', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), register);

// Authenticated profile route
router.get('/me', authenticateToken, getProfile);

module.exports = router;