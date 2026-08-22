const db = require('../config/db');

const resolveEmployeeIdForUser = async (userId) => {
  const [rows] = await db.query('SELECT id FROM employees WHERE user_id = ?', [userId]);
  return rows[0]?.id || null;
};

// GET /api/payroll/me (Employee gets own payroll)
const getMe = async (req, res, next) => {
  const employeeIdPk = req.user.employeeIdPk || await resolveEmployeeIdForUser(req.user.id);

  if (!employeeIdPk) {
    return res.status(400).json({ message: 'No associated employee profile found' });
  }

  try {
    const [rows] = await db.query(
      'SELECT id, employee_id, basic_salary, allowances, deductions, net_salary, updated_at FROM payroll WHERE employee_id = ?',
      [employeeIdPk]
    );

    if (rows.length === 0) {
      if (req.user.role === 'hr') {
        const basic = 35000;
        const allowances = 35000;
        const deductions = 4400;
        const net = basic + allowances - deductions;
        await db.query(
          'INSERT INTO payroll (employee_id, basic_salary, allowances, deductions, net_salary) VALUES (?, ?, ?, ?, ?)',
          [employeeIdPk, basic, allowances, deductions, net]
        );
        return res.json({
          payroll: {
            employee_id: employeeIdPk,
            basic_salary: basic.toFixed(2),
            allowances: allowances.toFixed(2),
            deductions: deductions.toFixed(2),
            net_salary: net.toFixed(2),
            updated_at: null
          }
        });
      }

      return res.json({
        payroll: {
          employee_id: employeeIdPk,
          basic_salary: '0.00',
          allowances: '0.00',
          deductions: '0.00',
          net_salary: '0.00',
          updated_at: null
        }
      });
    }

    // Format DECIMAL values to strings
    const payroll = {
      id: rows[0].id,
      employee_id: rows[0].employee_id,
      basic_salary: parseFloat(rows[0].basic_salary).toFixed(2),
      allowances: parseFloat(rows[0].allowances).toFixed(2),
      deductions: parseFloat(rows[0].deductions).toFixed(2),
      net_salary: parseFloat(rows[0].net_salary).toFixed(2),
      updated_at: rows[0].updated_at
    };

    res.json({ payroll });

  } catch (err) {
    next(err);
  }
};

// GET /api/payroll (ADMIN only - view all employee payrolls)
const getAll = async (req, res, next) => {
  const companyId = req.user.companyId;
  try {
    const [rows] = await db.query(`
      SELECT 
        e.id AS employeeIdPk,
        u.employee_id AS employeeIdStr,
        CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) AS employeeName,
        d.name AS departmentName,
        p.basic_salary,
        p.allowances,
        p.deductions,
        p.net_salary,
        p.updated_at
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN departments d ON e.department_id = d.id
      LEFT JOIN payroll p ON e.id = p.employee_id
      WHERE u.company_id = ?
      ORDER BY e.id ASC
    `, [companyId]);

    const payrollList = rows.map(row => ({
      employeeIdPk: row.employeeIdPk,
      employeeId: row.employeeIdStr,
      employeeName: row.employeeName.trim(),
      department: row.departmentName || 'N/A',
      basic_salary: row.basic_salary ? parseFloat(row.basic_salary).toFixed(2) : '0.00',
      allowances: row.allowances ? parseFloat(row.allowances).toFixed(2) : '0.00',
      deductions: row.deductions ? parseFloat(row.deductions).toFixed(2) : '0.00',
      net_salary: row.net_salary ? parseFloat(row.net_salary).toFixed(2) : '0.00',
      updated_at: row.updated_at || null
    }));

    res.json({ payrollList });

  } catch (err) {
    next(err);
  }
};

// PUT /api/payroll/:employeeId (ADMIN only - create or update salary details)
const updatePayroll = async (req, res, next) => {
  const { employeeId } = req.params; // Refers to employees.id (FK primary key)
  const { basic_salary, allowances, deductions } = req.body;
  const companyId = req.user.companyId;

  // Validate parameters presence
  if (basic_salary === undefined || allowances === undefined || deductions === undefined) {
    return res.status(400).json({ message: 'basic_salary, allowances, and deductions are required' });
  }

  // Validate numeric format
  const basic = Number(basic_salary);
  const allow = Number(allowances);
  const deduct = Number(deductions);

  if (isNaN(basic) || isNaN(allow) || isNaN(deduct)) {
    return res.status(400).json({ message: 'Salary fields must be numeric' });
  }

  // Validate >= 0 bounds
  if (basic < 0 || allow < 0 || deduct < 0) {
    return res.status(400).json({ message: 'Salary fields must be non-negative' });
  }

  try {
    // 1. Verify that employee exists and belongs to the same company
    const [empRows] = await db.query(
      'SELECT e.id, u.id AS userId FROM employees e JOIN users u ON e.user_id = u.id WHERE e.id = ? AND u.company_id = ?',
      [employeeId, companyId]
    );
    if (empRows.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    if (Number(empRows[0].userId) === Number(req.user.id)) {
      return res.status(403).json({ message: 'HR cannot edit their own salary' });
    }


    // 2. Compute net_salary
    const net = basic + allow - deduct;

    // 3. Check if record exists to determine Insert vs Update
    const [existing] = await db.query('SELECT id FROM payroll WHERE employee_id = ?', [employeeId]);

    if (existing.length > 0) {
      // Update
      await db.query(
        'UPDATE payroll SET basic_salary = ?, allowances = ?, deductions = ?, net_salary = ? WHERE employee_id = ?',
        [basic, allow, deduct, net, employeeId]
      );
    } else {
      // Insert
      await db.query(
        'INSERT INTO payroll (employee_id, basic_salary, allowances, deductions, net_salary) VALUES (?, ?, ?, ?, ?)',
        [employeeId, basic, allow, deduct, net]
      );
    }

    // Fetch final updated record
    const [updatedRows] = await db.query('SELECT * FROM payroll WHERE employee_id = ?', [employeeId]);
    const updated = updatedRows[0];

    res.json({
      message: 'Payroll details updated successfully',
      payroll: {
        id: updated.id,
        employee_id: updated.employee_id,
        basic_salary: parseFloat(updated.basic_salary).toFixed(2),
        allowances: parseFloat(updated.allowances).toFixed(2),
        deductions: parseFloat(updated.deductions).toFixed(2),
        net_salary: parseFloat(updated.net_salary).toFixed(2),
        updated_at: updated.updated_at
      }
    });

  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMe,
  getAll,
  updatePayroll
};
