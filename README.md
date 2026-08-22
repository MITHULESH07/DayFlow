# DayFlow HRMS

DayFlow is a full-stack HR management web app for company HR teams and employees. It handles HR signup, employee account creation, first-login password change, employee profiles, profile photo uploads, company logo uploads, attendance, leave requests, payroll/salary information, and Resend-based employee credential email delivery.

## Tech Stack

- Frontend: React, Vite, React Router, Lucide icons
- Backend: Node.js, Express, MySQL, JWT auth, bcrypt password hashing, Multer uploads
- Email: Resend API through the shared `/email/email.js` service
- Upload storage: local `backend/uploads` folder, served by Express at `/uploads/...`

## Project Structure

```text
DayFlow/
  backend/
    config/              MySQL config and DB initializer
    controllers/         API business logic
    middleware/          Auth and upload middleware
    routes/              Express route modules
    services/            Backend service wrappers
    uploads/             Local runtime upload storage
    server.js            Express app entry point
  email/
    email.js             Resend email sender
    .env.example         Required email environment variables
  frontend/
    src/
      components/        Shared UI and layout components
      pages/             Auth, dashboard, attendance, leave, profile pages
      services/api.js    API client and session helpers
    vite.config.js       Vite dev server and API/upload proxy
```

## Core User Flow

1. HR signs up with name, email, company, phone, and password.
2. Backend creates the company, HR user, and HR employee profile.
3. HR logs in and lands on the HR dashboard.
4. HR creates employees from the dashboard.
5. Backend generates a login ID and temporary password, stores the employee, marks `must_change_password = 1`, and sends the credentials using Resend.
6. Employee signs in with the login ID or email and temporary password.
7. If `mustChangePassword` is true, the frontend forces the employee to `/change-password` before any dashboard/profile route can open.
8. After changing the password, backend clears `must_change_password`, and the employee is routed to their dashboard.
9. Employees can check in/out, view attendance, request leave, view profile and salary data.
10. HR can manage employee profiles, upload employee profile images, approve/reject leave, view attendance, and edit salary for employees.

## Authentication

The backend uses JWT tokens. Frontend stores the logged-in session in local storage under `dayflow-auth`.

Auth endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/signup` | Register HR and company workspace |
| POST | `/api/auth/login` | HR/employee login by email or employee ID |
| GET | `/api/auth/me` | Restore authenticated session |
| PUT | `/api/auth/change-password` | Change password and clear first-login flag |
| POST | `/api/auth/logout` | Logout response endpoint |

## Employee Management

HR can create and manage employees. Created employees receive an employee login ID and a temporary password. The temp password is shown once in the create response and is also sent by email when Resend is configured.

Employee endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/employees` | HR creates an employee |
| GET | `/api/employees` | HR lists company employees |
| GET | `/api/employees/me` | Current user employee profile |
| PUT | `/api/employees/me` | Current user profile update |
| GET | `/api/employees/:id` | HR views one employee |
| PUT | `/api/employees/:id` | HR updates one employee |
| PUT | `/api/employees/me/profile-picture` | Upload own profile picture |
| PUT | `/api/employees/:id/profile-picture` | HR uploads managed employee profile picture |

Profile images are saved in `backend/uploads`; the stored DB path is like `/uploads/profile-...jpg` and is displayed directly by the frontend.

## Company Logo Upload

Company logo upload is a real backend feature.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/company/me` | Get current company info and logo path |
| PUT | `/api/company/logo` | HR uploads company logo |

Logo files are saved in `backend/uploads`; the company DB row stores `logo_path`, and the frontend displays it on reload.

## Attendance

Employees check in and out through API calls. HR can view company attendance records.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/attendance/check-in` | Current employee check-in |
| POST | `/api/attendance/check-out` | Current employee check-out |
| GET | `/api/attendance/me` | Current employee attendance |
| GET | `/api/attendance/all` | HR attendance list |

## Time Off

Employees request leave. HR approves or rejects pending leave requests.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/leaves` | Create leave request |
| GET | `/api/leaves/me` | Current employee leave history |
| GET | `/api/leaves` | HR list of leave requests |
| PUT | `/api/leaves/:id/approve` | HR approve request |
| PUT | `/api/leaves/:id/reject` | HR reject request |

## Payroll and Salary

Payroll is stored per employee in the `payroll` table. Employee salary is read-only for employees. HR can edit salary for managed employees only. The API blocks HR from editing their own salary.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/payroll/me` | Current user payroll |
| GET | `/api/payroll` | HR payroll list |
| PUT | `/api/payroll/:employeeId` | HR creates/updates managed employee payroll |

The seeded HR account has dummy salary data so HR self-profile can display salary while staying read-only.

## Dashboard APIs

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/dashboard/summary` | HR dashboard totals |
| GET | `/api/dashboard/me` | Employee dashboard summary |
| GET | `/api/departments` | Department list |
| POST | `/api/departments` | HR creates a department |

## Environment Setup

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=dayflow_hrms

JWT_SECRET=replace_with_a_long_secret
JWT_EXPIRES_IN=7d

ADMIN_LOGIN_ID=OIADMIN0001
ADMIN_PASSWORD=AdminPass@123

RESEND_API_KEY=re_your_resend_api_key
RESEND_FROM_EMAIL=Your Name <no-reply@your-verified-domain.com>
```

Resend note: `RESEND_FROM_EMAIL` must be a sender/domain allowed by your Resend account. The backend wrapper calls `email/email.js` and skips email sending gracefully when Resend env vars are missing.

## Install and Run

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

Initialize/reset the database:

```bash
cd backend
node config/initDb.js
```

This command drops and recreates the app tables, then seeds the default HR account and salary data.

Run backend:

```bash
cd backend
npm start
```

Run frontend:

```bash
cd frontend
npm run dev
```

Frontend runs on `http://localhost:3000`. Backend runs on `http://localhost:5000`. Vite proxies `/api` and `/uploads` to the backend.

## Seeded Login

After running `initDb.js`:

```text
Email: harini@dayflow.in
Password: AdminPass@123
Role: HR
```

## Verification

Useful checks before pushing/deploying:

```bash
cd backend
node --check server.js
node --check controllers/authController.js
node --check controllers/employeeController.js
node --check controllers/payrollController.js
```

```bash
cd frontend
npm run build
```

## Current Implementation Notes

- Frontend pages call real API endpoints and no longer depend on frontend mock/demo data.
- Uploaded profile photos and company logos are persisted locally in `backend/uploads` and paths are stored in MySQL.
- First-login password change is enforced by frontend route guards and backed by `must_change_password` in the DB.
- Employee credential emails use the shared `/email/email.js` Resend sender through `backend/services/emailService.js`.
- HR salary is visible from seeded/dummy payroll data, but HR cannot edit their own salary.
