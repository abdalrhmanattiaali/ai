const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const router = express.Router();

router.use(protect);

router.get('/', async (req, res) => {
  res.json({ success: true, data: [], message: 'Route placeholder' });
});

module.exports = router;
