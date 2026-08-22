const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, departmentController.getAll);
router.post('/', verifyToken, requireRole('hr'), departmentController.create);

module.exports = router;

