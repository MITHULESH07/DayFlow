const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/summary', verifyToken, requireRole('hr'), dashboardController.getSummary);
router.get('/me', verifyToken, dashboardController.getMySummary);

module.exports = router;

