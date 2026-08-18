const express = require('express');
const router = express.Router();
const { getDashboardOverview } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');


// GET /api/v1/dashboard/overview?expiryDays=30
router.get('/overview', authenticateToken, getDashboardOverview);

module.exports = router;