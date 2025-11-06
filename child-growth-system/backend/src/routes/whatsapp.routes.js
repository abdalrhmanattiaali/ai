const express = require('express');
const {
  initialize,
  getStatus,
  disconnect,
  getGroups,
  sendMessage,
  sendToGroup,
  validateNumber,
  getQueueStatus
} = require('../controllers/whatsappController');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

// Protect all routes
router.use(protect);

router.post('/initialize', initialize);
router.get('/status', getStatus);
router.post('/disconnect', disconnect);
router.get('/groups', getGroups);
router.post('/send-message', sendMessage);
router.post('/send-to-group', sendToGroup);
router.post('/validate-number', validateNumber);
router.get('/queue', getQueueStatus);

module.exports = router;
