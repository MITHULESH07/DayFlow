const express = require('express');
const multer = require('multer');
const companyController = require('../controllers/companyController');
const { verifyToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

const handleLogoUpload = (req, res, next) => {
  upload.single('company_logo')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File is too large! Maximum limit is 5MB.' });
      }
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

router.get('/me', verifyToken, companyController.getMe);
router.put('/logo', verifyToken, requireRole('hr'), handleLogoUpload, companyController.updateLogo);

module.exports = router;
