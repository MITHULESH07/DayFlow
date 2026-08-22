const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { verifyToken, requireRole } = require('../middleware/auth');

// GET /api/payroll/me (Get own payroll info - Registered BEFORE /:employeeId)
router.get('/me', verifyToken, payrollController.getMe);

// GET /api/payroll (Get all employee payrolls - ADMIN only)
router.get('/', verifyToken, requireRole('hr'), payrollController.getAll);

// PUT /api/payroll/:employeeId (Create or update employee payroll details - ADMIN only)
router.put('/:employeeId', verifyToken, requireRole('hr'), payrollController.updatePayroll);


module.exports = router;
