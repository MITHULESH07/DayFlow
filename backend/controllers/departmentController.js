const db = require('../config/db');

const getAll = async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT id, name FROM departments ORDER BY name ASC');
    res.json({ departments: rows });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Department name is required' });
  }

  try {
    await db.query('INSERT IGNORE INTO departments (name) VALUES (?)', [name.trim()]);
    const [rows] = await db.query('SELECT id, name FROM departments WHERE name = ?', [name.trim()]);
    res.status(201).json({ department: rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, create };

