const express = require('express');
const router = express.Router();
const service = require('../services/customerService');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

router.get('/', async (req, res) => {
  const items = await service.list();
  res.json(items);
});
// Any authenticated user (ADMIN, MANAGER, USER) can read prospects
router.get('/prospects', authenticateToken, getProspects);

// Only MANAGER or ADMIN can reassign client targets
router.post('/assignments', authenticateToken, authorizeRoles('ADMIN', 'MANAGER'), createAssignment);

// Only ADMIN can edit Master Product offerings
router.post('/master-products', authenticateToken, authorizeRoles('ADMIN'), createMasterProduct);

module.exports = router;
