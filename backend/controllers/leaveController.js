const db = require('../config/db');

// Helper to get today's date in Asia/Kolkata timezone (YYYY-MM-DD)
const getKolkataTodayDate = () => {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
};

// Helper to format Date objects as YYYY-MM-DD
const formatDateStr = (date) => {
  if (!date) return null;
  return date instanceof Date
    ? date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    : date;
};

// POST /api/leaves
const requestLeave = async (req, res, next) => {
  const employeeIdPk = req.user.employeeIdPk;
  const { leave_type, start_date, end_date, remarks } = req.body;

  if (!employeeIdPk) {
    return res.status(400).json({ message: 'No associated employee profile found' });
  }

  if (!leave_type || !start_date || !end_date) {
    return res.status(400).json({ message: 'Leave type, start date, and end date are required' });
  }

  const allowedTypes = ['PAID', 'SICK', 'UNPAID'];
  if (!allowedTypes.includes(leave_type)) {
    return res.status(400).json({ message: 'Invalid leave type. Must be PAID, SICK, or UNPAID.' });
  }

  // Validate start_date <= end_date
  if (start_date > end_date) {
    return res.status(400).json({ message: 'Start date cannot be after end date' });
  }

  // Validate start_date is not in the past
  const todayStr = getKolkataTodayDate();
  if (start_date < todayStr) {
    return res.status(400).json({ message: 'Start date cannot be in the past' });
  }

  try {
    // Check for overlapping PENDING or APPROVED requests
    const [overlapRows] = await db.query(
      `SELECT id FROM leave_requests 
       WHERE employee_id = ? 
         AND status IN ('PENDING', 'APPROVED') 
         AND start_date <= ? 
         AND end_date >= ?`,
      [employeeIdPk, end_date, start_date]
    );

    if (overlapRows.length > 0) {
      return res.status(400).json({
        message: 'You already have a pending/approved leave request overlapping with this date range.'
      });
    }

    // Insert leave request
    const [result] = await db.query(
      `INSERT INTO leave_requests (employee_id, leave_type, start_date, end_date, remarks, status)
       VALUES (?, ?, ?, ?, ?, 'PENDING')`,
      [employeeIdPk, leave_type, start_date, end_date, remarks || null]
    );

    res.status(201).json({
      message: 'Leave request submitted successfully',
      leaveRequest: {
        id: result.insertId,
        employee_id: employeeIdPk,
        leave_type,
        start_date,
        end_date,
        remarks: remarks || null,
        status: 'PENDING'
      }
    });

  } catch (err) {
    next(err);
  }
};

// GET /api/leaves/me
const getMyLeaves = async (req, res, next) => {
  const employeeIdPk = req.user.employeeIdPk;

  if (!employeeIdPk) {
    return res.status(400).json({ message: 'No associated employee profile found' });
  }

  try {
    const [rows] = await db.query(
      `SELECT id, leave_type, start_date, end_date, remarks, status, admin_comment, created_at 
       FROM leave_requests 
       WHERE employee_id = ? 
       ORDER BY created_at DESC`,
      [employeeIdPk]
    );

    const leaveRequests = rows.map(row => ({
      id: row.id,
      leave_type: row.leave_type,
      start_date: formatDateStr(row.start_date),
      end_date: formatDateStr(row.end_date),
      remarks: row.remarks,
      status: row.status,
      admin_comment: row.admin_comment,
      created_at: row.created_at
    }));

    res.json({ leaveRequests });

  } catch (err) {
    next(err);
  }
};

// GET /api/leaves (ADMIN only)
const getAllLeaves = async (req, res, next) => {
  const companyId = req.user.companyId;
  try {
    const [rows] = await db.query(
      `SELECT 
        l.id,
        u.employee_id AS employeeIdStr,
        CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) AS employeeName,
        d.name AS departmentName,
        l.leave_type,
        l.start_date,
        l.end_date,
        l.remarks,
        l.status,
        l.admin_comment,
        l.created_at
       FROM leave_requests l
       JOIN employees e ON l.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE u.company_id = ?
       ORDER BY l.created_at DESC`,
      [companyId]
    );

    const leaveRequests = rows.map(row => ({
      id: row.id,
      employeeId: row.employeeIdStr,
      employeeName: row.employeeName.trim(),
      department: row.departmentName || 'N/A',
      leave_type: row.leave_type,
      start_date: formatDateStr(row.start_date),
      end_date: formatDateStr(row.end_date),
      remarks: row.remarks,
      status: row.status,
      admin_comment: row.admin_comment,
      created_at: row.created_at
    }));

    res.json({ leaveRequests });

  } catch (err) {
    next(err);
  }
};

// PUT /api/leaves/:id/approve (ADMIN only)
const approveLeave = async (req, res, next) => {
  const { id } = req.params;
  const { admin_comment } = req.body;
  const companyId = req.user.companyId;

  try {
    // Check if request exists and belongs to the same company
    const [rows] = await db.query(
      `SELECT l.status FROM leave_requests l 
       JOIN employees e ON l.employee_id = e.id 
       JOIN users u ON e.user_id = u.id 
       WHERE l.id = ? AND u.company_id = ?`,
      [id, companyId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    const request = rows[0];

    // Verify it is pending
    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: 'Only pending leave requests can be approved' });
    }

    // Approve
    await db.query(
      `UPDATE leave_requests 
       SET status = 'APPROVED', admin_comment = ? 
       WHERE id = ?`,
      [admin_comment || null, id]
    );

    res.json({ message: 'Leave request approved successfully' });

  } catch (err) {
    next(err);
  }
};

// PUT /api/leaves/:id/reject (ADMIN only)
const rejectLeave = async (req, res, next) => {
  const { id } = req.params;
  const { admin_comment } = req.body;
  const companyId = req.user.companyId;

  try {
    // Check if request exists and belongs to the same company
    const [rows] = await db.query(
      `SELECT l.status FROM leave_requests l 
       JOIN employees e ON l.employee_id = e.id 
       JOIN users u ON e.user_id = u.id 
       WHERE l.id = ? AND u.company_id = ?`,
      [id, companyId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    const request = rows[0];

    // Verify it is pending
    if (request.status !== 'PENDING') {
      return res.status(400).json({ message: 'Only pending leave requests can be rejected' });
    }

    // Reject
    await db.query(
      `UPDATE leave_requests 
       SET status = 'REJECTED', admin_comment = ? 
       WHERE id = ?`,
      [admin_comment || null, id]
    );

    res.json({ message: 'Leave request rejected successfully' });

  } catch (err) {
    next(err);
  }
};


module.exports = {
  requestLeave,
  getMyLeaves,
  getAllLeaves,
  approveLeave,
  rejectLeave
};
