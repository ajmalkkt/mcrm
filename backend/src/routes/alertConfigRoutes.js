const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAlertConfiguration,
  upsertAlertConfiguration,
} = require('../controllers/alertConfigController');

router.use(authenticateToken);
router.get('/', getAlertConfiguration);
router.put('/', upsertAlertConfiguration);

module.exports = router;
