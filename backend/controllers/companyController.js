const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const ensureLogoColumn = async () => {
  try {
    await db.query('ALTER TABLE companies ADD COLUMN logo_path TEXT NULL');
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') throw err;
  }
};

const getMe = async (req, res, next) => {
  try {
    await ensureLogoColumn();
    const [rows] = await db.query('SELECT id, name, logo_path FROM companies WHERE id = ?', [req.user.companyId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json({ company: rows[0] });
  } catch (err) {
    next(err);
  }
};

const updateLogo = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a company logo' });
  }

  try {
    await ensureLogoColumn();
    const [rows] = await db.query('SELECT logo_path FROM companies WHERE id = ?', [req.user.companyId]);
    if (rows.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Company not found' });
    }

    const oldPath = rows[0].logo_path;
    const logoPath = `/uploads/${req.file.filename}`;
    await db.query('UPDATE companies SET logo_path = ? WHERE id = ?', [logoPath, req.user.companyId]);

    if (oldPath) {
      const absoluteOldPath = path.join(__dirname, '..', oldPath.replace(/^\//, ''));
      if (fs.existsSync(absoluteOldPath)) {
        fs.unlink(absoluteOldPath, (err) => {
          if (err) console.error('Failed to delete old company logo:', err.message);
        });
      }
    }

    res.json({ message: 'Company logo updated successfully', logoPath });
  } catch (err) {
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.error(unlinkErr);
      }
    }
    next(err);
  }
};

module.exports = { getMe, updateLogo };
