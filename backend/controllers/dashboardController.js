const db = require('../config/db');

const todayInKolkata = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const startOfMonth = () => {
  const today = todayInKolkata();
  return `${today.slice(0, 8)}01`;
};

const getSummary = async (req, res, next) => {
  const companyId = req.user.companyId;
  const today = todayInKolkata();

  try {
    const [[employeeCount]] = await db.query(
      `SELECT COUNT(*) AS total FROM employees e JOIN users u ON e.user_id = u.id WHERE u.company_id = ?`,
      [companyId]
    );
    const [[presentCount]] = await db.query(
      `SELECT COUNT(DISTINCT e.id) AS total
       FROM employees e
       JOIN users u ON e.user_id = u.id
       JOIN attendance a ON a.employee_id = e.id AND a.attendance_date = ? AND a.status IN ('PRESENT', 'HALF_DAY')
       WHERE u.company_id = ?`,
      [today, companyId]
    );
    const [[leaveCount]] = await db.query(
      `SELECT COUNT(DISTINCT e.id) AS total
       FROM employees e
       JOIN users u ON e.user_id = u.id
       JOIN leave_requests l ON l.employee_id = e.id AND l.status = 'APPROVED' AND ? BETWEEN l.start_date AND l.end_date
       WHERE u.company_id = ?`,
      [today, companyId]
    );
    const [[pendingLeaveCount]] = await db.query(
      `SELECT COUNT(*) AS total
       FROM leave_requests l
       JOIN employees e ON l.employee_id = e.id
       JOIN users u ON e.user_id = u.id
       WHERE u.company_id = ? AND l.status = 'PENDING'`,
      [companyId]
    );

    const totalEmployees = Number(employeeCount.total || 0);
    const presentToday = Number(presentCount.total || 0);
    const onLeaveToday = Number(leaveCount.total || 0);
    const absentToday = Math.max(0, totalEmployees - presentToday - onLeaveToday);

    res.json({
      summary: {
        totalEmployees,
        presentToday,
        onLeaveToday,
        absentToday,
        pendingLeaves: Number(pendingLeaveCount.total || 0),
        attendanceRate: totalEmployees ? Math.round((presentToday / totalEmployees) * 100) : 0,
        date: today,
      }
    });
  } catch (err) {
    next(err);
  }
};

const getMySummary = async (req, res, next) => {
  const employeeId = req.user.employeeIdPk;
  if (!employeeId) {
    return res.status(400).json({ message: 'No associated employee profile found' });
  }

  try {
    const monthStart = startOfMonth();
    const today = todayInKolkata();
    const [[present]] = await db.query(
      `SELECT COUNT(*) AS total FROM attendance WHERE employee_id = ? AND attendance_date BETWEEN ? AND ? AND status IN ('PRESENT', 'HALF_DAY')`,
      [employeeId, monthStart, today]
    );
    const [attendanceRows] = await db.query(
      `SELECT check_in, check_out FROM attendance WHERE employee_id = ? AND attendance_date BETWEEN ? AND ? AND check_out IS NOT NULL`,
      [employeeId, monthStart, today]
    );
    const [[leaveTaken]] = await db.query(
      `SELECT COALESCE(SUM(DATEDIFF(end_date, start_date) + 1), 0) AS total
       FROM leave_requests
       WHERE employee_id = ? AND status = 'APPROVED' AND start_date BETWEEN ? AND ?`,
      [employeeId, monthStart, today]
    );
    const [[upcomingLeave]] = await db.query(
      `SELECT start_date, end_date, leave_type FROM leave_requests
       WHERE employee_id = ? AND status IN ('PENDING', 'APPROVED') AND start_date >= ?
       ORDER BY start_date ASC LIMIT 1`,
      [employeeId, today]
    );

    let totalMinutes = 0;
    attendanceRows.forEach(row => {
      if (!row.check_in || !row.check_out) return;
      const [inH, inM] = String(row.check_in).split(':').map(Number);
      const [outH, outM] = String(row.check_out).split(':').map(Number);
      let diff = (outH * 60 + outM) - (inH * 60 + inM);
      if (diff < 0) diff += 24 * 60;
      totalMinutes += diff;
    });
    const averageMinutes = attendanceRows.length ? Math.round(totalMinutes / attendanceRows.length) : 0;

    res.json({
      summary: {
        daysPresent: Number(present.total || 0),
        leaveTaken: Number(leaveTaken.total || 0),
        averageHours: `${Math.floor(averageMinutes / 60)}h ${String(averageMinutes % 60).padStart(2, '0')}m`,
        paidLeaveRemaining: Math.max(0, 18 - Number(leaveTaken.total || 0)),
        sickLeaveRemaining: 7,
        upcomingLeave: upcomingLeave || null,
      }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary, getMySummary };

