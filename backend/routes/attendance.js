const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { verifyToken, requireRole } = require('../middleware/auth');

// POST /api/attendance/check-in
router.post('/check-in', verifyToken, attendanceController.checkIn);

// POST /api/attendance/check-out
router.post('/check-out', verifyToken, attendanceController.checkOut);

// GET /api/attendance/me
router.get('/me', verifyToken, attendanceController.getMyAttendance);

// GET /api/attendance/all (ADMIN only)
router.get('/all', verifyToken, requireRole('hr'), attendanceController.getAllAttendance);


module.exports = router;
