const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// Import the prospect controller
const { createProspect, getProspects, getProspectById, updateProspect, deleteProspect } = require('../controllers/prospectController');

// Define the routes
router.post('/', authenticateToken, createProspect);
router.get('/', authenticateToken, getProspects);
router.get('/:id', authenticateToken, getProspectById);
router.put('/:id', authenticateToken, updateProspect);
router.delete('/:id', authenticateToken, deleteProspect);

module.exports = router;    