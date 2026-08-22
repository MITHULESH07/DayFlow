const db = require('../config/db');

// Helper to get current Date and Time in Asia/Kolkata timezone
const getKolkataDateTime = () => {
  const now = new Date();
  
  // Format date to YYYY-MM-DD
  const dateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  
  // Format time to HH:MM:SS (24-hour)
  const timeStr = now.toLocaleTimeString('en-US', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
  
  return { date: dateStr, time: timeStr };
};

// Helper to calculate working duration formatted as HH:MM
const calculateWorkingHours = (checkInStr, checkOutStr) => {
  if (!checkInStr || !checkOutStr) return null;
  
  const [inH, inM, inS] = checkInStr.split(':').map(Number);
  const [outH, outM, outS] = checkOutStr.split(':').map(Number);

  const checkInSec = inH * 3600 + inM * 60 + (inS || 0);
  const checkOutSec = outH * 3600 + outM * 60 + (outS || 0);

  let diffSec = checkOutSec - checkInSec;
  if (diffSec < 0) {
    diffSec += 24 * 3600; // Handling shifts crossing midnight
  }

  const totalMin = Math.floor(diffSec / 60);
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

// POST /api/attendance/check-in
const checkIn = async (req, res, next) => {
  const employeeIdPk = req.user.employeeIdPk;

  if (!employeeIdPk) {
    return res.status(400).json({ message: 'No associated employee profile found' });
  }

  try {
    const { date, time } = getKolkataDateTime();

    // Check if record already exists for today
    const [existing] = await db.query(
      'SELECT id FROM attendance WHERE employee_id = ? AND attendance_date = ?',
      [employeeIdPk, date]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Already checked in for today' });
    }

    // Insert check-in record (status default is PRESENT)
    await db.query(
      'INSERT INTO attendance (employee_id, attendance_date, check_in, status) VALUES (?, ?, ?, "PRESENT")',
      [employeeIdPk, date, time]
    );

    res.status(201).json({
      message: 'Checked in successfully',
      attendance: {
        employee_id: employeeIdPk,
        attendance_date: date,
        check_in: time,
        status: 'PRESENT'
      }
    });

  } catch (err) {
    next(err);
  }
};

// POST /api/attendance/check-out
const checkOut = async (req, res, next) => {
  const employeeIdPk = req.user.employeeIdPk;

  if (!employeeIdPk) {
    return res.status(400).json({ message: 'No associated employee profile found' });
  }

  try {
    const { date, time } = getKolkataDateTime();

    // Find check-in record for today
    const [rows] = await db.query(
      'SELECT * FROM attendance WHERE employee_id = ? AND attendance_date = ?',
      [employeeIdPk, date]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        message: 'No check-in record found for today. You must check in first.'
      });
    }

    const attendance = rows[0];

    if (attendance.check_out) {
      return res.status(400).json({
        message: 'Already checked out for today.'
      });
    }

    // Calculate working duration
    const checkInTimeStr = attendance.check_in;
    const checkOutTimeStr = time;

    // Parse times
    const [inH, inM] = checkInTimeStr.split(':').map(Number);
    const [outH, outM] = checkOutTimeStr.split(':').map(Number);

    const checkInMin = inH * 60 + inM;
    const checkOutMin = outH * 60 + outM;

    let diffMin = checkOutMin - checkInMin;
    if (diffMin < 0) {
      diffMin += 24 * 60; // Shifts crossing midnight
    }

    const hours = Math.floor(diffMin / 60);
    const minutes = diffMin % 60;

    // Status: HALF_DAY if working duration is less than 4 hours
    let status = 'PRESENT';
    if (diffMin < 4 * 60) {
      status = 'HALF_DAY';
    }

    // Update record
    await db.query(
      'UPDATE attendance SET check_out = ?, status = ? WHERE id = ?',
      [checkOutTimeStr, status, attendance.id]
    );

    res.json({
      message: 'Checked out successfully',
      attendance: {
        id: attendance.id,
        employee_id: employeeIdPk,
        attendance_date: date,
        check_in: checkInTimeStr,
        check_out: checkOutTimeStr,
        status
      },
      workingHours: String(hours).padStart(2, '0'),
      workingMinutes: String(minutes).padStart(2, '0')
    });

  } catch (err) {
    next(err);
  }
};

// GET /api/attendance/me
const getMyAttendance = async (req, res, next) => {
  const employeeIdPk = req.user.employeeIdPk;

  if (!employeeIdPk) {
    return res.status(400).json({ message: 'No associated employee profile found' });
  }

  try {
    const [rows] = await db.query(
      `SELECT attendance_date, check_in, check_out, status 
       FROM attendance 
       WHERE employee_id = ? 
       ORDER BY attendance_date DESC`,
      [employeeIdPk]
    );

    const attendance = rows.map(row => {
      const dateString = row.attendance_date instanceof Date
        ? row.attendance_date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
        : row.attendance_date;

      return {
        date: dateString,
        checkIn: row.check_in,
        checkOut: row.check_out,
        status: row.status,
        workingHours: calculateWorkingHours(row.check_in, row.check_out)
      };
    });

    res.json({ attendance });

  } catch (err) {
    next(err);
  }
};

// GET /api/attendance/all (ADMIN only)
const getAllAttendance = async (req, res, next) => {
  const companyId = req.user.companyId;
  try {
    const [rows] = await db.query(
      `SELECT 
        a.attendance_date, 
        a.check_in, 
        a.check_out, 
        a.status,
        u.employee_id AS employeeIdStr,
        CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) AS employeeName,
        d.name AS department_name
       FROM attendance a
       JOIN employees e ON a.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       LEFT JOIN departments d ON e.department_id = d.id
       WHERE u.company_id = ?
       ORDER BY a.attendance_date DESC, a.check_in DESC`,
      [companyId]
    );


    const attendance = rows.map(row => {
      const dateString = row.attendance_date instanceof Date
        ? row.attendance_date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
        : row.attendance_date;

      return {
        employeeId: row.employeeIdStr,
        employeeName: row.employeeName.trim(),
        department: row.department_name || 'N/A',
        date: dateString,
        checkIn: row.check_in,
        checkOut: row.check_out,
        status: row.status,
        workingHours: calculateWorkingHours(row.check_in, row.check_out)
      };
    });

    res.json({ attendance });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getMyAttendance,
  getAllAttendance
};
