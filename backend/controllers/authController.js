const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// POST /api/auth/login
const login = async (req, res, next) => {
  const { employeeId, password } = req.body;

  if (!employeeId || !password) {
    return res.status(400).json({ message: 'Employee ID and password are required' });
  }

  try {
    // 1. Fetch user by employee_id
    const [userRows] = await db.query('SELECT * FROM users WHERE employee_id = ?', [employeeId]);
    if (userRows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = userRows[0];

    // 2. Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // 3. Fetch corresponding employee profile details
    const [employeeRows] = await db.query('SELECT * FROM employees WHERE user_id = ?', [user.id]);
    const employee = employeeRows.length > 0 ? employeeRows[0] : null;

    // 4. Generate JWT
    const jwtSecret = process.env.JWT_SECRET || 'super_secret_dayflow_key_12345';
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const payload = {
      id: user.id,
      employeeIdStr: user.employee_id,
      employeeIdPk: employee ? employee.id : null,
      email: user.email,
      role: user.role
    };

    const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });

    res.json({
      message: 'Login successful',
      token,
      mustChangePassword: employee ? Boolean(employee.must_change_password) : false,
      user: {
        id: user.id,
        employeeId: user.employee_id,
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    next(err);
  }
};

// PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current password and new password are required' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long' });
  }

  try {
    // 1. Fetch user to verify current password
    const [userRows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userRows[0];

    // 2. Compare current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Incorrect current password' });
    }

    // 3. Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // 4. Update password and must_change_password inside a transaction
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);
      await connection.query('UPDATE employees SET must_change_password = 0 WHERE user_id = ?', [userId]);

      await connection.commit();
      res.json({ message: 'Password changed successfully' });
    } catch (txErr) {
      await connection.rollback();
      throw txErr;
    } finally {
      connection.release();
    }

  } catch (err) {
    next(err);
  }
};

module.exports = {
  login,
  changePassword
};
