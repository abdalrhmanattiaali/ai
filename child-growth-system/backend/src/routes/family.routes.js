const express = require('express');
const {
  getFamilies,
  getFamily,
  createFamily,
  updateFamily,
  deleteFamily,
  getFamilyStatistics
} = require('../controllers/familyController');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getFamilies)
  .post(createFamily);

router.route('/:id')
  .get(getFamily)
  .put(updateFamily)
  .delete(deleteFamily);

router.get('/:id/statistics', getFamilyStatistics);

module.exports = router;
