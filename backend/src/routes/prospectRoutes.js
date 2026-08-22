const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  createProspect,
  getProspects,
  getProspectById,
  updateProspect,
  deleteProspect,
  convertProspectToAccount,
} = require('../controllers/prospectController');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_FILE_SIZE_MB || 50) * 1024 * 1024,
    files: 20,
  },
});

router.post('/', authenticateToken, upload.array('documents', 20), createProspect);
router.get('/', authenticateToken, getProspects);
router.post('/:prospectId/convert', authenticateToken, upload.array('documents', 20), convertProspectToAccount);
router.get('/:id', authenticateToken, getProspectById);
router.patch('/:id', authenticateToken, updateProspect);
router.delete('/:id', authenticateToken, deleteProspect);

module.exports = router;