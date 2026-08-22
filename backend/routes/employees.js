const express = require('express');
const router = express.Router();
const multer = require('multer');
const employeeController = require('../controllers/employeeController');
const { verifyToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Wrapper middleware to catch Multer errors gracefully and return JSON responses
const handleProfileUpload = (req, res, next) => {
  upload.single('profile_picture')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File is too large! Maximum limit is 5MB.' });
        }
        return res.status(400).json({ message: `Multer upload error: ${err.message}` });
      }
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// POST /api/employees (ADMIN only)
router.post('/', verifyToken, requireRole('hr'), employeeController.createEmployee);

// GET /api/employees/me (Authenticated)
router.get('/me', verifyToken, employeeController.getMe);

// PUT /api/employees/me (Authenticated)
router.put('/me', verifyToken, employeeController.updateMe);

// PUT /api/employees/me/profile-picture (Authenticated)
router.put('/me/profile-picture', verifyToken, handleProfileUpload, employeeController.updateProfilePicture);

// GET /api/employees (ADMIN only)
router.get('/', verifyToken, requireRole('hr'), employeeController.getAll);

// PUT /api/employees/:id/profile-picture (ADMIN only)
router.put('/:id/profile-picture', verifyToken, requireRole('hr'), handleProfileUpload, employeeController.updateProfilePictureById);

// GET /api/employees/:id (ADMIN only)
router.get('/:id', verifyToken, requireRole('hr'), employeeController.getById);

// PUT /api/employees/:id (ADMIN only)
router.put('/:id', verifyToken, requireRole('hr'), employeeController.updateById);


module.exports = router;


