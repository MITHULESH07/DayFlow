const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', authController.login);

// PUT /api/auth/change-password
router.put('/change-password', verifyToken, authController.changePassword);

module.exports = router;
