const db = require('../config/db');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { sendEmployeePasswordEmail } = require('../services/emailService');

const resolveEmployeeIdForUser = async (userId) => {
  const [rows] = await db.query('SELECT id FROM employees WHERE user_id = ?', [userId]);
  return rows[0]?.id || null;
};

// POST /api/employees (ADMIN only)
const createEmployee = async (req, res, next) => {
  const {
    email,
    first_name,
    last_name,
    phone,
    address,
    department_id,
    department,
    job_title,
    joining_date
  } = req.body;

  if (!email || !first_name || !joining_date) {
    return res.status(400).json({ message: 'Email, first name, and joining date are required' });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Verify email uniqueness
    const [existingUsers] = await connection.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    let resolvedDepartmentId = department_id || null;
    if (!resolvedDepartmentId && department && department.trim()) {
      await connection.query('INSERT IGNORE INTO departments (name) VALUES (?)', [department.trim()]);
      const [deptRows] = await connection.query('SELECT id FROM departments WHERE name = ?', [department.trim()]);
      resolvedDepartmentId = deptRows.length ? deptRows[0].id : null;
    }

    // 2. Fetch or insert yearly serial (concurrency safe using FOR UPDATE)
    const joiningYear = new Date(joining_date).getFullYear();
    if (isNaN(joiningYear)) {
      return res.status(400).json({ message: 'Invalid joining date format' });
    }

    let serial = 1;
    const [seqRows] = await connection.query(
      'SELECT last_serial FROM employee_year_sequences WHERE year = ? FOR UPDATE',
      [joiningYear]
    );

    if (seqRows.length === 0) {
      await connection.query(
        'INSERT INTO employee_year_sequences (year, last_serial) VALUES (?, 1)',
        [joiningYear]
      );
    } else {
      serial = seqRows[0].last_serial + 1;
      await connection.query(
        'UPDATE employee_year_sequences SET last_serial = ? WHERE year = ?',
        [serial, joiningYear]
      );
    }

    // 3. Generate employee_id (Login ID)
    const fnClean = first_name.replace(/[^a-zA-Z]/g, '');
    const lnClean = (last_name || '').replace(/[^a-zA-Z]/g, '');

    const fnPart = fnClean.substring(0, 2).padEnd(2, 'X').toUpperCase();
    const lnPart = lnClean.substring(0, 2).padEnd(2, 'X').toUpperCase();
    const serialPart = String(serial).padStart(4, '0');
    const employeeIdStr = `OI${fnPart}${lnPart}${joiningYear}${serialPart}`;

    // 4. Generate random temporary password
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#';
    let tempPassword = '';
    for (let i = 0; i < 10; i++) {
      tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // 5. Insert user record (role is always employee when created here)
    const companyId = req.user.companyId;
    const [userResult] = await connection.query(
      'INSERT INTO users (employee_id, email, password, role, company_id) VALUES (?, ?, ?, "employee", ?)',
      [employeeIdStr, email, hashedPassword, companyId]
    );

    const userId = userResult.insertId;

    // 6. Insert employee profile record
    const [employeeResult] = await connection.query(
      `INSERT INTO employees (user_id, first_name, last_name, phone, address, department_id, job_title, joining_date, must_change_password)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        userId,
        first_name,
        last_name || null,
        phone || null,
        address || null,
        resolvedDepartmentId,
        job_title || null,
        joining_date
      ]
    );

    await connection.commit();

    let emailDelivery = { sent: false };
    try {
      const emailResult = await sendEmployeePasswordEmail({
        to: email,
        name: `${first_name} ${last_name || ''}`.trim(),
        employeeId: employeeIdStr,
        password: tempPassword,
      });
      emailDelivery = emailResult?.skipped
        ? { sent: false, skipped: true, reason: emailResult.reason }
        : { sent: true, id: emailResult?.id };
    } catch (emailErr) {
      console.error('Employee invitation email failed:', emailErr.message);
      emailDelivery = { sent: false, error: emailErr.message };
    }

    res.status(201).json({
      message: 'Employee created successfully',
      employee: {
        id: employeeResult.insertId,
        employeeId: employeeIdStr,
        tempPassword,
        email,
        first_name,
        last_name,
        joining_date,
        role: 'employee',
        mustChangePassword: true,
        department_id: resolvedDepartmentId,
        department_name: department || null,
        job_title
      },
      emailDelivery
    });


  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

// GET /api/employees/me (Authenticated)
const getMe = async (req, res, next) => {
  try {
    const employeeIdPk = req.user.employeeIdPk || await resolveEmployeeIdForUser(req.user.id);

    if (!employeeIdPk) {
      return res.status(400).json({ message: 'No associated employee profile found' });
    }
    const [rows] = await db.query(
      `SELECT e.*, u.employee_id, u.email, u.role, d.name AS department_name
       FROM employees e
       JOIN users u ON e.user_id = u.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE e.id = ?`,
      [employeeIdPk]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    const employee = rows[0];
    
    // Parse JSON fields
    if (employee.skills) {
      try {
        employee.skills = JSON.parse(employee.skills);
      } catch (e) {
        employee.skills = [];
      }
    } else {
      employee.skills = [];
    }

    if (employee.certifications) {
      try {
        employee.certifications = JSON.parse(employee.certifications);
      } catch (e) {
        employee.certifications = [];
      }
    } else {
      employee.certifications = [];
    }

    res.json(employee);
  } catch (err) {
    next(err);
  }
};

// PUT /api/employees/me (Authenticated)
const updateMe = async (req, res, next) => {
  const employeeIdPk = req.user.employeeIdPk || await resolveEmployeeIdForUser(req.user.id);
  const {
    first_name,
    last_name,
    phone,
    address,
    manager_name,
    location,
    about_me,
    job_passion,
    interests,
    skills,
    certifications,
    date_of_birth,
    nationality,
    gender,
    personal_email,
    marital_status,
    bank_name,
    bank_account_no,
    bank_ifsc,
    pan_no,
    uan_no
  } = req.body;

  if (!employeeIdPk) {
    return res.status(400).json({ message: 'No associated employee profile found' });
  }

  if (!first_name) {
    return res.status(400).json({ message: 'First name is required' });
  }

  try {
    const skillsStr = Array.isArray(skills) ? JSON.stringify(skills) : (skills || null);
    const certsStr = Array.isArray(certifications) ? JSON.stringify(certifications) : (certifications || null);

    await db.query(
      `UPDATE employees 
       SET first_name = ?, last_name = ?, phone = ?, address = ?,
           manager_name = ?, location = ?, about_me = ?, job_passion = ?, interests = ?,
           skills = ?, certifications = ?, date_of_birth = ?, nationality = ?, gender = ?,
           personal_email = ?, marital_status = ?, bank_name = ?, bank_account_no = ?,
           bank_ifsc = ?, pan_no = ?, uan_no = ?
       WHERE id = ?`,
      [
        first_name,
        last_name || null,
        phone || null,
        address || null,
        manager_name || null,
        location || null,
        about_me || null,
        job_passion || null,
        interests || null,
        skillsStr,
        certsStr,
        date_of_birth || null,
        nationality || null,
        gender || null,
        personal_email || null,
        marital_status || null,
        bank_name || null,
        bank_account_no || null,
        bank_ifsc || null,
        pan_no || null,
        uan_no || null,
        employeeIdPk
      ]
    );

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    next(err);
  }
};


// PUT /api/employees/me/profile-picture (Authenticated)
const updateProfilePicture = async (req, res, next) => {
  const employeeIdPk = req.user.employeeIdPk || await resolveEmployeeIdForUser(req.user.id);

  if (!employeeIdPk) {
    // Delete file if uploaded but user profile is missing
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(400).json({ message: 'No associated employee profile found' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a profile picture' });
  }

  try {
    // 1. Fetch current profile picture to delete later
    const [rows] = await db.query('SELECT profile_picture FROM employees WHERE id = ?', [employeeIdPk]);
    if (rows.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Employee profile not found' });
    }

    const oldPath = rows[0].profile_picture;
    const newRelativePath = `/uploads/${req.file.filename}`;

    // 2. Save new relative path to MySQL database
    await db.query('UPDATE employees SET profile_picture = ? WHERE id = ?', [newRelativePath, employeeIdPk]);

    // 3. Delete old file if it exists
    if (oldPath) {
      // Resolve path (e.g. /uploads/profile/filename.png -> backend/uploads/profile/filename.png)
      const relativeClean = oldPath.replace(/^\//, ''); // Remove leading slash
      const absoluteOldPath = path.join(__dirname, '..', relativeClean);
      if (fs.existsSync(absoluteOldPath)) {
        fs.unlink(absoluteOldPath, (err) => {
          if (err) console.error('Failed to delete old profile picture:', err.message);
        });
      }
    }

    res.json({
      message: 'Profile picture updated successfully',
      profilePicture: newRelativePath
    });

  } catch (err) {
    // Delete uploaded file if error occurs
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


// PUT /api/employees/:id/profile-picture (ADMIN only)
const updateProfilePictureById = async (req, res, next) => {
  const { id } = req.params;
  const companyId = req.user.companyId;

  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a profile picture' });
  }

  try {
    const [rows] = await db.query(
      `SELECT e.profile_picture
       FROM employees e
       JOIN users u ON e.user_id = u.id
       WHERE e.id = ? AND u.company_id = ?`,
      [id, companyId]
    );

    if (rows.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Employee not found' });
    }

    const oldPath = rows[0].profile_picture;
    const newRelativePath = `/uploads/${req.file.filename}`;

    await db.query('UPDATE employees SET profile_picture = ? WHERE id = ?', [newRelativePath, id]);

    if (oldPath) {
      const relativeClean = oldPath.replace(/^\//, '');
      const absoluteOldPath = path.join(__dirname, '..', relativeClean);
      if (fs.existsSync(absoluteOldPath)) {
        fs.unlink(absoluteOldPath, (err) => {
          if (err) console.error('Failed to delete old profile picture:', err.message);
        });
      }
    }

    res.json({
      message: 'Employee profile picture updated successfully',
      profilePicture: newRelativePath
    });
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
// GET /api/employees (ADMIN only)
const getAll = async (req, res, next) => {
  const companyId = req.user.companyId;
  try {
    const [rows] = await db.query(
      `SELECT e.*, u.employee_id, u.email, u.role, d.name AS department_name,
        CASE
          WHEN lr.id IS NOT NULL THEN 'leave'
          WHEN a.id IS NOT NULL AND a.status IN ('PRESENT', 'HALF_DAY') THEN 'present'
          ELSE 'absent'
        END AS today_status
       FROM employees e
       JOIN users u ON e.user_id = u.id
       LEFT JOIN departments d ON e.department_id = d.id
       LEFT JOIN attendance a ON a.employee_id = e.id AND a.attendance_date = CURDATE()
       LEFT JOIN leave_requests lr ON lr.employee_id = e.id AND lr.status = 'APPROVED' AND CURDATE() BETWEEN lr.start_date AND lr.end_date
       WHERE u.company_id = ?`,
      [companyId]
    );

    const employees = rows.map(emp => {
      if (emp.skills) {
        try {
          emp.skills = JSON.parse(emp.skills);
        } catch (e) {
          emp.skills = [];
        }
      } else {
        emp.skills = [];
      }

      if (emp.certifications) {
        try {
          emp.certifications = JSON.parse(emp.certifications);
        } catch (e) {
          emp.certifications = [];
        }
      } else {
        emp.certifications = [];
      }
      return emp;
    });

    res.json(employees);
  } catch (err) {
    next(err);
  }
};

// GET /api/employees/:id (ADMIN only)
const getById = async (req, res, next) => {
  const { id } = req.params;
  const companyId = req.user.companyId;

  try {
    const [rows] = await db.query(
      `SELECT e.*, u.employee_id, u.email, u.role, d.name AS department_name
       FROM employees e
       JOIN users u ON e.user_id = u.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE e.id = ? AND u.company_id = ?`,
      [id, companyId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const employee = rows[0];

    if (employee.skills) {
      try {
        employee.skills = JSON.parse(employee.skills);
      } catch (e) {
        employee.skills = [];
      }
    } else {
      employee.skills = [];
    }

    if (employee.certifications) {
      try {
        employee.certifications = JSON.parse(employee.certifications);
      } catch (e) {
        employee.certifications = [];
      }
    } else {
      employee.certifications = [];
    }

    res.json(employee);
  } catch (err) {
    next(err);
  }
};

// PUT /api/employees/:id (ADMIN only)
const updateById = async (req, res, next) => {
  const { id } = req.params;
  const companyId = req.user.companyId;
  const {
    first_name,
    last_name,
    phone,
    address,
    department_id,
    department,
    job_title,
    joining_date,
    manager_name,
    location,
    about_me,
    job_passion,
    interests,
    skills,
    certifications,
    date_of_birth,
    nationality,
    gender,
    personal_email,
    marital_status,
    bank_name,
    bank_account_no,
    bank_ifsc,
    pan_no,
    uan_no
  } = req.body;

  if (!first_name || !joining_date) {
    return res.status(400).json({ message: 'First name and joining date are required' });
  }

  try {
    const [rows] = await db.query(
      'SELECT e.id FROM employees e JOIN users u ON e.user_id = u.id WHERE e.id = ? AND u.company_id = ?',
      [id, companyId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    let resolvedDepartmentId = department_id || null;
    if (!resolvedDepartmentId && department && department.trim()) {
      await db.query('INSERT IGNORE INTO departments (name) VALUES (?)', [department.trim()]);
      const [deptRows] = await db.query('SELECT id FROM departments WHERE name = ?', [department.trim()]);
      resolvedDepartmentId = deptRows.length ? deptRows[0].id : null;
    }

    const skillsStr = Array.isArray(skills) ? JSON.stringify(skills) : (skills || null);
    const certsStr = Array.isArray(certifications) ? JSON.stringify(certifications) : (certifications || null);

    await db.query(
      `UPDATE employees 
       SET first_name = ?, last_name = ?, phone = ?, address = ?, department_id = ?, job_title = ?, joining_date = ?,
           manager_name = ?, location = ?, about_me = ?, job_passion = ?, interests = ?,
           skills = ?, certifications = ?, date_of_birth = ?, nationality = ?, gender = ?,
           personal_email = ?, marital_status = ?, bank_name = ?, bank_account_no = ?,
           bank_ifsc = ?, pan_no = ?, uan_no = ?
       WHERE id = ?`,
      [
        first_name,
        last_name || null,
        phone || null,
        address || null,
        resolvedDepartmentId,
        job_title || null,
        joining_date,
        manager_name || null,
        location || null,
        about_me || null,
        job_passion || null,
        interests || null,
        skillsStr,
        certsStr,
        date_of_birth || null,
        nationality || null,
        gender || null,
        personal_email || null,
        marital_status || null,
        bank_name || null,
        bank_account_no || null,
        bank_ifsc || null,
        pan_no || null,
        uan_no || null,
        id
      ]
    );

    res.json({ message: 'Employee updated successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createEmployee,
  getMe,
  updateMe,
  updateProfilePicture,
  updateProfilePictureById,
  getAll,
  getById,
  updateById
};










