const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const router = express.Router();

// Placeholder - سننشئ Controllers لاحقاً
router.use(protect);

router.get('/', async (req, res) => {
  res.json({ success: true, data: [] });
});

router.post('/', async (req, res) => {
  res.json({ success: true, message: 'Child route - will implement' });
});

module.exports = router;
