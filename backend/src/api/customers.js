const express = require('express');
const router = express.Router();
const service = require('../services/customerService');

router.get('/', async (req, res) => {
  const items = await service.list();
  res.json(items);
});

module.exports = router;
