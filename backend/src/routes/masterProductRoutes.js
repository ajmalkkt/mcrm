const express = require('express');
const router = express.Router();
const { getProducts, getServicePlans, getProductById} = require('../controllers/masterProductController');
const { authenticateToken } = require('../middleware/auth');

// Product routes
router.get('/', authenticateToken, getProducts);
router.get('/plans/all', authenticateToken, getServicePlans); // Fetch all plans
router.get('/:id', authenticateToken, getProductById);

// Dependent Plan route by product ID
router.get('/:id/plans', authenticateToken, getServicePlans);

module.exports = router;