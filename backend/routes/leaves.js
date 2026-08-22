const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const { verifyToken, requireRole } = require('../middleware/auth');

// POST /api/leaves (Submit a leave request)
router.post('/', verifyToken, leaveController.requestLeave);

// GET /api/leaves/me (Get own leave requests)
router.get('/me', verifyToken, leaveController.getMyLeaves);

// GET /api/leaves (Get all leave requests - ADMIN only)
router.get('/', verifyToken, requireRole('ADMIN'), leaveController.getAllLeaves);

// PUT /api/leaves/:id/approve (Approve leave request - ADMIN only)
router.put('/:id/approve', verifyToken, requireRole('ADMIN'), leaveController.approveLeave);

// PUT /api/leaves/:id/reject (Reject leave request - ADMIN only)
router.put('/:id/reject', verifyToken, requireRole('ADMIN'), leaveController.rejectLeave);

module.exports = router;
