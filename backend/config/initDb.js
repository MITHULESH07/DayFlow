require('dotenv').config();
const db = require('./db');
const bcrypt = require('bcrypt');

async function initDb() {
  let connection;
  try {
    connection = await db.getConnection();
    console.log('Database connection acquired for initialization.');

    // 1. Drop existing tables in correct order
    console.log('Dropping existing tables if they exist...');
    await connection.query('DROP TABLE IF EXISTS payroll');
    await connection.query('DROP TABLE IF EXISTS leave_requests');
    await connection.query('DROP TABLE IF EXISTS attendance');
    await connection.query('DROP TABLE IF EXISTS employees');
    await connection.query('DROP TABLE IF EXISTS users');
    await connection.query('DROP TABLE IF EXISTS employee_year_sequences');
    await connection.query('DROP TABLE IF EXISTS departments');

    // 2. Create departments table
    console.log('Creating departments table...');
    await connection.query(`
      CREATE TABLE departments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(100) NOT NULL UNIQUE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Create employee_year_sequences table (for concurrency-safe serial IDs)
    console.log('Creating employee_year_sequences table...');
    await connection.query(`
      CREATE TABLE employee_year_sequences (
        year INT PRIMARY KEY,
        last_serial INT NOT NULL DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 4. Create users table
    console.log('Creating users table...');
    await connection.query(`
      CREATE TABLE users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        employee_id VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('ADMIN', 'EMPLOYEE') NOT NULL DEFAULT 'EMPLOYEE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5. Create employees table
    console.log('Creating employees table...');
    await connection.query(`
      CREATE TABLE employees (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL UNIQUE,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100),
        phone VARCHAR(20),
        address TEXT,
        department_id INT,
        job_title VARCHAR(100),
        profile_picture TEXT,
        joining_date DATE NOT NULL,
        must_change_password TINYINT(1) DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5.1. Create attendance table
    console.log('Creating attendance table...');
    await connection.query(`
      CREATE TABLE attendance (
        id INT PRIMARY KEY AUTO_INCREMENT,
        employee_id INT NOT NULL,
        attendance_date DATE NOT NULL,
        check_in TIME NOT NULL,
        check_out TIME NULL,
        status ENUM('PRESENT', 'ABSENT', 'HALF_DAY', 'LEAVE') DEFAULT 'PRESENT',
        UNIQUE (employee_id, attendance_date),
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5.2. Create leave_requests table
    console.log('Creating leave_requests table...');
    await connection.query(`
      CREATE TABLE leave_requests (
        id INT PRIMARY KEY AUTO_INCREMENT,
        employee_id INT NOT NULL,
        leave_type ENUM('PAID', 'SICK', 'UNPAID') NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        remarks TEXT NULL,
        status ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING',
        admin_comment TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 5.3. Create payroll table
    console.log('Creating payroll table...');
    await connection.query(`
      CREATE TABLE payroll (
        id INT PRIMARY KEY AUTO_INCREMENT,
        employee_id INT NOT NULL UNIQUE,
        basic_salary DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        allowances DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        deductions DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        net_salary DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);



    // 6. Seed default departments
    console.log('Seeding initial departments...');
    await connection.query(`
      INSERT INTO departments (name) VALUES 
      ('Engineering'),
      ('Human Resources'),
      ('Finance')
    `);

    // 7. Seed Admin user from environment variables
    const adminLoginId = process.env.ADMIN_LOGIN_ID || 'OIADMIN0001';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass@123';
    console.log(`Seeding Admin user (Login ID: ${adminLoginId})...`);

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    await connection.beginTransaction();

    const [userResult] = await connection.query(`
      INSERT INTO users (employee_id, email, password, role) 
      VALUES (?, ?, ?, 'ADMIN')
    `, [adminLoginId, 'admin@dayflow.com', hashedPassword]);

    const adminUserId = userResult.insertId;

    // Get department ID for Human Resources (should be id = 2)
    const [deptRows] = await connection.query("SELECT id FROM departments WHERE name = 'Human Resources'");
    const deptId = deptRows.length > 0 ? deptRows[0].id : null;

    await connection.query(`
      INSERT INTO employees (user_id, first_name, last_name, department_id, job_title, joining_date, must_change_password)
      VALUES (?, 'System', 'Admin', ?, 'HR Administrator', CURDATE(), 0)
    `, [adminUserId, deptId]);

    await connection.commit();
    console.log('Database initialized and Admin user seeded successfully!');

  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackErr) {
        console.error('Rollback failed:', rollbackErr.message);
      }
    }
    console.error('Database initialization failed:', err);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
    }
    process.exit(0);
  }
}

initDb();
