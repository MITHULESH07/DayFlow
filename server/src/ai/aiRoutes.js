const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { chat } = require('./aiController');

const router = express.Router();
router.post('/chat', authenticate, chat);

module.exports = router;
