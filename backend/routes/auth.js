const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// POST /api/auth/signup (HR signup)
router.post('/signup', authController.signup);

// POST /api/auth/login (Shared Login)
router.post('/login', authController.login);

// GET /api/auth/me (Restore Session)
router.get('/me', verifyToken, authController.getMe);

// POST /api/auth/logout (Logout)
router.post('/logout', authController.logout);

// PUT /api/auth/change-password
router.put('/change-password', verifyToken, authController.changePassword);

module.exports = router;
