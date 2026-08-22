const express = require('express');
const router = express.Router();
const { getClientAccounts, getClientAccountById, createClient } = require('../controllers/clientController');
const { authenticateToken } = require('../middleware/auth');

// Protect all client account endpoints with JWT auth
router.use(authenticateToken);

// GET /api/v1/clients (Supports ?search= and ?status= query params)
router.get('/', getClientAccounts);

// POST /api/v1/clients - create new client account
router.post('/', createClient);

// GET /api/v1/clients/:accountId
router.get('/:accountId', getClientAccountById);

module.exports = router;