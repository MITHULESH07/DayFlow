require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./config/db'); // Test DB connection on startup

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leaves');
const payrollRoutes = require('./routes/payroll');
const departmentRoutes = require('./routes/departments');
const dashboardRoutes = require('./routes/dashboard');
const companyRoutes = require('./routes/company');




const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve profile uploads statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Sample/Root Route
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'Welcome to the DayFlow API',
    timestamp: new Date()
  });
});

// Test DB Endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 AS result');
    res.json({
      message: "MySQL connected successfully",
      result: rows
    });
  } catch (error) {
    console.error('Database query failed:', error);
    res.status(500).json({
      message: "Database connection failed"
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/company', companyRoutes);






// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'An internal server error occurred'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


