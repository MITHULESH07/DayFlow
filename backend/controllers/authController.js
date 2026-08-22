const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_dayflow_key_12345';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// POST /api/auth/signup (HR Admin Public Registration)
const signup = async (req, res, next) => {
  const { name, email, companyName, phone, password } = req.body;

  // 1. Validate fields
  if (!name || !email || !companyName || !phone || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide valid registration details',
      errors: {
        email: !email ? 'Please enter a valid email address' : undefined,
        name: !name ? 'Name is required' : undefined,
        companyName: !companyName ? 'Company name is required' : undefined,
        password: !password ? 'Password is required' : undefined
      }
    });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // 2. Check if email exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'An account already exists with this email'
      });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 3. Create company/workspace
      const [companyResult] = await connection.query(
        'INSERT INTO companies (name) VALUES (?)',
        [companyName]
      );
      const companyId = companyResult.insertId;

      // 4. Create user with role: hr
      const [userResult] = await connection.query(
        'INSERT INTO users (employee_id, email, password, role, company_id) VALUES (NULL, ?, ?, "hr", ?)',
        [normalizedEmail, hashedPassword, companyId]
      );
      const userId = userResult.insertId;

      // 5. Create employee profile for the HR user
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || null;

      const [employeeResult] = await connection.query(
        `INSERT INTO employees (user_id, first_name, last_name, phone, joining_date, must_change_password)
         VALUES (?, ?, ?, ?, CURDATE(), 0)`,
        [userId, firstName, lastName, phone]
      );

      await connection.commit();

      // 6. Generate Token
      const payload = {
        id: userId,
        employeeIdStr: null,
        employeeIdPk: employeeResult.insertId,
        email: normalizedEmail,
        role: 'hr',
        companyId
      };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      res.status(201).json({
        success: true,
        message: 'HR account created successfully',
        data: {
          token,
          user: {
            id: userId,
            name,
            email: normalizedEmail,
            phone,
            role: 'hr',
            companyId,
            mustChangePassword: false
          },
          company: {
            id: companyId,
            name: companyName
          }
        }
      });

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

// POST /api/auth/login (Shared Login Endpoint)
const login = async (req, res, next) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email/Login ID and password are required'
    });
  }

  const normalizedIdentifier = identifier.trim();

  try {
    const isEmail = normalizedIdentifier.includes('@');

    // Query user and corresponding employee details
    const [rows] = await db.query(
      `SELECT 
        u.id, u.employee_id, u.email, u.password, u.role, u.company_id,
        CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) AS name,
        e.phone, e.must_change_password, e.id AS employeeIdPk
       FROM users u
       LEFT JOIN employees e ON u.id = e.user_id
       WHERE ${isEmail ? 'LOWER(u.email)' : 'u.employee_id'} = ?`,
      [isEmail ? normalizedIdentifier.toLowerCase() : normalizedIdentifier]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login ID/email or password'
      });
    }

    const user = rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid login ID/email or password'
      });
    }

    // Generate token
    const payload = {
      id: user.id,
      employeeIdStr: user.employee_id,
      employeeIdPk: user.employeeIdPk,
      email: user.email,
      role: user.role,
      companyId: user.company_id
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name ? user.name.trim() : null,
          email: user.email,
          loginId: user.employee_id,
          role: user.role,
          companyId: user.company_id,
          employeeIdPk: user.employeeIdPk,
          mustChangePassword: Boolean(user.must_change_password)
        }
      }
    });

  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me (Restore Authenticated Session)
const getMe = async (req, res, next) => {
  const userId = req.user.id;

  try {
    const [rows] = await db.query(
      `SELECT 
        u.id, u.email, u.role, u.company_id,
        CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) AS name,
        e.id AS employeeIdPk, e.must_change_password
       FROM users u
       LEFT JOIN employees e ON u.id = e.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = rows[0];

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name ? user.name.trim() : null,
          email: user.email,
          role: user.role,
          companyId: user.company_id,
          employeeIdPk: user.employeeIdPk,
          mustChangePassword: Boolean(user.must_change_password)
        }
      }
    });

  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};

// PUT /api/auth/change-password
const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: 'Current password and new password are required'
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'New password must be at least 6 characters long'
    });
  }

  try {
    const [userRows] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userRows[0];

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Incorrect current password'
      });
    }

    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);
      await connection.query('UPDATE employees SET must_change_password = 0 WHERE user_id = ?', [userId]);

      await connection.commit();
      res.json({
        success: true,
        message: 'Password changed successfully',
        data: { mustChangePassword: false }
      });
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
  signup,
  login,
  getMe,
  logout,
  changePassword
};
