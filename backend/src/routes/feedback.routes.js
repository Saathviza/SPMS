const express = require('express');
const router = express.Router();
const { addFeedback, getFeedback } = require('../controllers/feedback.controller');
const authenticate = require('../middleware/auth');

router.post('/', authenticate, addFeedback);
router.get('/:target_type/:target_id', authenticate, getFeedback);

module.exports = router;
