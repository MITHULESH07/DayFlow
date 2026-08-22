# Dayflow Backend Integration Guide

This document is the complete backend handoff for the Dayflow Human Resource Management System frontend.

The current application is a frontend-only React prototype. Data is loaded from `src/data/mockData.json`, and a few demo changes are stored in browser local storage. The backend developer must replace those temporary data sources with authenticated APIs and MongoDB persistence.

For authentication-specific examples, also read `SIGNIN_SIGNUP_README.md`.

## 1. Product overview

Dayflow supports two user roles:

| Role | Purpose |
| --- | --- |
| `hr` | Creates and manages employees, reviews company attendance, manages leave requests and configures employee salaries. |
| `employee` | Views and edits permitted profile details, checks in/out, views personal attendance, requests time off and views salary information as read-only. |

The first HR user creates a company during public signup. Employees do not sign themselves up. HR creates employee accounts after signing in.

## 2. Current frontend routes

| Route | Expected access | Purpose |
| --- | --- | --- |
| `/login` | Public | Shared HR and employee sign-in |
| `/signup` | Public | New HR/company registration |
| `/dashboard` | HR | Company employee directory |
| `/employees/:employeeId` | HR | View/edit an employee and manage salary |
| `/profile` | HR | HR user's own profile |
| `/employee-dashboard` | Employee | Employee home dashboard |
| `/employee-profile` | Employee | Employee's own profile and read-only salary |
| `/attendance` | HR | Company-wide attendance |
| `/attendance?view=employee` | Employee | Personal attendance |
| `/time-off` | HR | Company leave requests and approvals |
| `/time-off?view=employee` | Employee | Personal leave calendar and requests |

Query parameters are currently used for frontend demonstration only. The backend must never authorize a user based on `?view=employee` or any other client-provided role indicator.

## 3. Recommended backend structure

```text
backend/
  src/
    config/
      database.js
    controllers/
      auth.controller.js
      employee.controller.js
      profile.controller.js
      attendance.controller.js
      timeOff.controller.js
      salary.controller.js
      company.controller.js
    middleware/
      authenticate.js
      authorize.js
      errorHandler.js
      validate.js
      upload.js
    models/
      Company.js
      User.js
      Employee.js
      Attendance.js
      TimeOffRequest.js
      LeaveBalance.js
      Salary.js
    routes/
      auth.routes.js
      employee.routes.js
      profile.routes.js
      attendance.routes.js
      timeOff.routes.js
      salary.routes.js
      company.routes.js
    services/
      loginId.service.js
      salary.service.js
      notification.service.js
    utils/
      ApiError.js
      asyncHandler.js
    app.js
    server.js
  .env.example
  package.json
```

This is a recommendation, not a strict requirement. Endpoint behavior and security are more important than folder names.

## 4. Standard API response format

Successful response:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {}
}
```

Error response:

```json
{
  "success": false,
  "message": "Readable error message",
  "errors": {
    "fieldName": "Field-specific validation message"
  }
}
```

Recommended status codes:

| Status | Meaning |
| --- | --- |
| `200` | Successful read or update |
| `201` | Resource created |
| `400` | Invalid input or business-rule violation |
| `401` | Missing or invalid authentication |
| `403` | Authenticated but not authorized |
| `404` | Resource not found |
| `409` | Duplicate or conflicting resource |
| `422` | Validation failed, if preferred over 400 |
| `429` | Rate limit exceeded |
| `500` | Unexpected server error |

## 5. Authentication and sessions

### 5.1 HR signup

```http
POST /api/auth/signup
```

Request:

```json
{
  "name": "Harini Rao",
  "email": "harini@company.com",
  "companyName": "Dayflow Technologies",
  "phone": "9876543210",
  "password": "SecurePassword123"
}
```

Backend behavior:

1. Validate and normalize the input.
2. Reject an existing email.
3. Create the company.
4. Create the first user with `role: "hr"`.
5. Hash the password with bcrypt.
6. Return an authenticated session and the created user/company.

The endpoint must not accept a role from the frontend.

### 5.2 Shared login

```http
POST /api/auth/login
```

```json
{
  "identifier": "harini@company.com",
  "password": "SecurePassword123"
}
```

`identifier` can be an email address or generated employee login ID. The backend finds the account and returns its stored role.

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "user-id",
      "name": "Harini Rao",
      "email": "harini@company.com",
      "loginId": null,
      "role": "hr",
      "companyId": "company-id",
      "mustChangePassword": false
    }
  }
}
```

Frontend redirection:

```text
role = hr       -> /dashboard
role = employee -> /employee-dashboard
mustChangePassword = true -> password-change page before dashboard
```

### 5.3 Restore session

```http
GET /api/auth/me
Authorization: Bearer <token>
```

The frontend will call this after refresh to restore the user and role.

### 5.4 Logout

```http
POST /api/auth/logout
```

Clear the HTTP-only session cookie or invalidate the refresh token, depending on the selected authentication strategy.

### 5.5 Change temporary password

```http
POST /api/auth/change-password
Authorization: Bearer <token>
```

```json
{
  "currentPassword": "TemporaryPassword123",
  "newPassword": "EmployeeSecurePassword123"
}
```

After a successful first password change, set `mustChangePassword` to `false`.

## 6. Suggested MongoDB models

### 6.1 Company

```json
{
  "_id": "ObjectId",
  "name": "Dayflow Technologies",
  "logoUrl": "https://storage.example/company-logo.png",
  "createdBy": "hr-user-id",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

### 6.2 User

Authentication fields shared by HR and employees:

```json
{
  "_id": "ObjectId",
  "companyId": "ObjectId",
  "employeeId": "ObjectId or null for HR",
  "name": "Ananya Rao",
  "email": "ananya@company.com",
  "phone": "9123456780",
  "loginId": "DFANRA20250014",
  "passwordHash": "bcrypt hash",
  "role": "employee",
  "isActive": true,
  "mustChangePassword": true,
  "lastLoginAt": "ISODate",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

Recommended indexes:

- Unique index on normalized `email`.
- Unique sparse index on `loginId`.
- Index on `companyId` and `role`.

### 6.3 Employee

```json
{
  "_id": "ObjectId",
  "companyId": "ObjectId",
  "userId": "ObjectId",
  "employeeCode": "DFANRA20250014",
  "jobTitle": "Product Designer",
  "department": "Design",
  "managerId": "ObjectId or null",
  "location": "Chennai, India",
  "dateOfJoining": "ISODate",
  "profilePhotoUrl": "https://storage.example/profile.png",
  "about": "Employee biography",
  "jobLove": "What the employee enjoys about the role",
  "interests": "Interests and hobbies",
  "skills": ["Product design", "Figma"],
  "certifications": [
    {
      "name": "Google UX Design",
      "issuer": "Google",
      "issuedAt": "ISODate"
    }
  ],
  "privateInfo": {
    "dateOfBirth": "ISODate",
    "residentialAddress": "Address",
    "nationality": "Indian",
    "personalEmail": "personal@example.com",
    "gender": "Female",
    "maritalStatus": "Single"
  },
  "bankDetails": {
    "accountNumberEncrypted": "encrypted value",
    "bankName": "HDFC Bank",
    "ifscCode": "HDFC0001234",
    "panEncrypted": "encrypted value",
    "uanEncrypted": "encrypted value"
  }
}
```

Encrypt highly sensitive values such as bank accounts, PAN and UAN. Mask them in ordinary API responses.

### 6.4 Attendance

```json
{
  "_id": "ObjectId",
  "companyId": "ObjectId",
  "employeeId": "ObjectId",
  "date": "2026-08-22",
  "checkInAt": "ISODate",
  "checkOutAt": "ISODate or null",
  "workMinutes": 488,
  "extraMinutes": 8,
  "status": "present",
  "source": "web",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

Use a unique compound index on `employeeId` and `date` to prevent multiple daily records unless multiple shifts are intentionally supported.

### 6.5 Time-off request

```json
{
  "_id": "ObjectId",
  "companyId": "ObjectId",
  "employeeId": "ObjectId",
  "type": "paid",
  "startDate": "ISODate",
  "endDate": "ISODate",
  "days": 2,
  "reason": "Personal event",
  "attachmentUrl": null,
  "status": "pending",
  "reviewedBy": null,
  "reviewComment": null,
  "reviewedAt": null,
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

Allowed types:

- `paid`
- `sick`
- `unpaid`

Allowed statuses:

- `pending`
- `approved`
- `rejected`

### 6.6 Leave balance

```json
{
  "_id": "ObjectId",
  "companyId": "ObjectId",
  "employeeId": "ObjectId",
  "year": 2026,
  "paidAllocated": 18,
  "paidUsed": 6,
  "sickAllocated": 7,
  "sickUsed": 3,
  "unpaidUsed": 0
}
```

### 6.7 Salary

Every employee requires a separate salary record.

```json
{
  "_id": "ObjectId",
  "companyId": "ObjectId",
  "employeeId": "ObjectId",
  "monthlyWage": 72000,
  "workingDays": 5,
  "breakHours": 1,
  "basicPercent": 50,
  "hraPercentOfBasic": 50,
  "standardPercent": 8.33,
  "bonusPercent": 4.17,
  "ltaPercent": 4.17,
  "employeePfPercent": 12,
  "employerPfPercent": 12,
  "professionalTax": 200,
  "updatedBy": "hr-user-id",
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

Use a unique index on `employeeId` so one active salary configuration belongs to each employee. If salary history is required, create a separate versioned history collection with `effectiveFrom` and `effectiveTo`.

## 7. Company APIs

### Get current company

```http
GET /api/company
Authorization: Bearer <token>
```

### Update company

```http
PATCH /api/company
Authorization: Bearer <hr-token>
```

Allowed HR fields can include company name and logo.

## 8. Employee APIs

### 8.1 List employees

```http
GET /api/employees?search=&status=&department=&page=1&limit=20
Authorization: Bearer <hr-token>
```

Response:

```json
{
  "success": true,
  "data": {
    "employees": [
      {
        "id": "employee-id",
        "name": "Ananya Rao",
        "email": "ananya@company.com",
        "jobTitle": "Product Designer",
        "department": "Design",
        "profilePhotoUrl": null,
        "attendanceStatus": "present"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### 8.2 Create employee

```http
POST /api/employees
Authorization: Bearer <hr-token>
```

```json
{
  "name": "Ananya Rao",
  "email": "ananya@company.com",
  "phone": "9123456780",
  "jobTitle": "Product Designer",
  "department": "Design",
  "managerId": "manager-employee-id",
  "location": "Chennai, India",
  "dateOfJoining": "2026-08-22",
  "temporaryPassword": "TemporaryPassword123"
}
```

Backend responsibilities:

1. Confirm the requester is HR and belongs to the company.
2. Generate a unique login ID.
3. Hash the temporary password.
4. Create both employee and user records in a transaction.
5. Set `role: "employee"` internally.
6. Set `mustChangePassword: true`.
7. Optionally create default leave-balance and salary records.

### 8.3 Login ID format

The wireframe proposes a generated format combining:

```text
company prefix + employee name prefix + joining year + serial number
```

Example:

```text
DF + ANRA + 2025 + 0014 = DFANRA20250014
```

The exact company/name prefix rules should be finalized before implementation. Always enforce uniqueness in the database.

### 8.4 Get employee profile

```http
GET /api/employees/:employeeId
Authorization: Bearer <hr-token>
```

HR can access employees only within the HR user's company.

### 8.5 Update employee

```http
PATCH /api/employees/:employeeId
Authorization: Bearer <hr-token>
```

HR may edit all allowed employee profile fields.

### 8.6 Activate or deactivate employee

```http
PATCH /api/employees/:employeeId/status
Authorization: Bearer <hr-token>
```

```json
{
  "isActive": false
}
```

Prefer deactivation over permanently deleting HR records.

## 9. Personal profile APIs

### Get own profile

```http
GET /api/profile/me
Authorization: Bearer <token>
```

### Update own profile

```http
PATCH /api/profile/me
Authorization: Bearer <token>
```

Employees may edit permitted fields such as:

- Profile picture
- Phone number
- Residential address
- Personal email
- About text
- Interests
- Skills
- Certifications
- Selected bank information, depending on company policy

Employees must not be able to update:

- Role
- Company ID
- Employee code/login ID
- Job title or department unless HR approves it
- Salary configuration
- Attendance totals
- Leave balances

HR may edit broader employee data through `/api/employees/:employeeId`.

## 10. File upload APIs

Recommended upload endpoint:

```http
POST /api/uploads
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

Allowed upload purposes:

- `company-logo`
- `profile-photo`
- `leave-attachment`
- `employee-document`

Validate MIME type, extension and file size. Store files in object storage or a managed media service. Do not store large binary files directly in ordinary MongoDB documents.

## 11. Attendance APIs

### 11.1 Check in

```http
POST /api/attendance/check-in
Authorization: Bearer <employee-token>
```

The backend obtains `employeeId` from the authenticated session. Do not accept it from the request body.

Rules:

- Prevent a second check-in while an open attendance record exists.
- Use server time, not browser time.
- Create today's attendance record.
- Set status to `present`.

### 11.2 Check out

```http
POST /api/attendance/check-out
Authorization: Bearer <employee-token>
```

Rules:

- Require an open check-in record.
- Use server time.
- Calculate work minutes after subtracting the configured break.
- Calculate extra minutes based on company work-hour rules.

### 11.3 Employee attendance

```http
GET /api/attendance/me?month=2026-08
Authorization: Bearer <employee-token>
```

Return only the authenticated employee's attendance.

```json
{
  "success": true,
  "data": {
    "summary": {
      "daysPresent": 18,
      "leaveTaken": 1,
      "averageMinutes": 492,
      "extraMinutes": 124
    },
    "records": []
  }
}
```

### 11.4 Company attendance for HR

```http
GET /api/attendance?date=2026-08-22&search=
Authorization: Bearer <hr-token>
```

Return employees only from the HR user's company.

## 12. Time-off APIs

### 12.1 Get personal leave balance

```http
GET /api/time-off/balance/me?year=2026
Authorization: Bearer <employee-token>
```

### 12.2 Get personal requests/calendar

```http
GET /api/time-off/me?year=2026
Authorization: Bearer <employee-token>
```

The frontend uses approved and pending date ranges to mark the yearly calendar.

Calendar rules:

- Approved leave: green.
- Pending leave: amber.
- Rejected leave: not marked as leave.

### 12.3 Create leave request

```http
POST /api/time-off
Authorization: Bearer <employee-token>
```

```json
{
  "type": "paid",
  "startDate": "2026-09-14",
  "endDate": "2026-09-15",
  "reason": "Personal event",
  "attachmentUrl": null
}
```

Backend validation:

- Start date must not be after end date.
- Date range must not overlap an active request.
- Calculate leave days on the server.
- Exclude non-working days if required by company policy.
- Verify sufficient paid/sick leave balance.
- Require an attachment for sick leave if company policy requires it.
- Create the request as `pending`.

### 12.4 HR list requests

```http
GET /api/time-off?status=pending&search=&year=2026
Authorization: Bearer <hr-token>
```

### 12.5 Approve request

```http
PATCH /api/time-off/:requestId/approve
Authorization: Bearer <hr-token>
```

```json
{
  "comment": "Approved"
}
```

The backend should use a transaction to mark the request approved and update the employee's leave balance.

### 12.6 Reject request

```http
PATCH /api/time-off/:requestId/reject
Authorization: Bearer <hr-token>
```

```json
{
  "comment": "Insufficient staffing during these dates"
}
```

## 13. Salary APIs and calculations

### 13.1 HR gets one employee's salary

```http
GET /api/employees/:employeeId/salary
Authorization: Bearer <hr-token>
```

### 13.2 HR creates or updates salary

```http
PUT /api/employees/:employeeId/salary
Authorization: Bearer <hr-token>
```

```json
{
  "monthlyWage": 72000,
  "workingDays": 5,
  "breakHours": 1,
  "basicPercent": 50,
  "hraPercentOfBasic": 50,
  "standardPercent": 8.33,
  "bonusPercent": 4.17,
  "ltaPercent": 4.17,
  "employeePfPercent": 12,
  "employerPfPercent": 12,
  "professionalTax": 200
}
```

Only HR may write salary data.

### 13.3 Employee reads own salary

```http
GET /api/salary/me
Authorization: Bearer <employee-token>
```

Employees can view their calculated salary but cannot submit changes.

### 13.4 Calculation rules

```text
yearlyWage = monthlyWage * 12
basic = monthlyWage * basicPercent / 100
hra = basic * hraPercentOfBasic / 100
standard = monthlyWage * standardPercent / 100
bonus = monthlyWage * bonusPercent / 100
lta = monthlyWage * ltaPercent / 100
fixed = monthlyWage - (basic + hra + standard + bonus + lta)
employeePf = basic * employeePfPercent / 100
employerPf = basic * employerPfPercent / 100
estimatedNet = monthlyWage - employeePf - professionalTax
```

Validation rules:

- Monetary values cannot be negative.
- Percentages should normally be between 0 and 100.
- `fixed` cannot be negative.
- Salary components cannot exceed the monthly wage.
- Working days must be between 1 and 7.
- Break hours must be within a reasonable range.
- Recalculate all derived amounts on the backend.
- Do not trust totals calculated by the frontend.

Recommended salary response:

```json
{
  "success": true,
  "data": {
    "configuration": {},
    "calculated": {
      "yearlyWage": 864000,
      "basic": 36000,
      "hra": 18000,
      "standard": 5998,
      "bonus": 3002,
      "lta": 3002,
      "fixed": 5998,
      "employeePf": 4320,
      "employerPf": 4320,
      "estimatedNet": 67480
    }
  }
}
```

## 14. Authorization matrix

| Action | HR | Employee |
| --- | --- | --- |
| Public HR signup | Yes | No |
| Shared login | Yes | Yes |
| List all employees | Yes | No |
| Create employee | Yes | No |
| Edit any employee | Yes | No |
| View own profile | Yes | Yes |
| Edit permitted own fields | Yes | Yes |
| View company attendance | Yes | No |
| View own attendance | Optional | Yes |
| Check in/out | If HR is also an employee | Yes |
| View all leave requests | Yes | No |
| Request personal leave | Optional | Yes |
| Approve/reject leave | Yes | No |
| Edit employee salary | Yes | No |
| View own salary | Yes | Yes, read-only |

Every query must be scoped to the authenticated user's `companyId`.

## 15. Input validation

Recommended validation examples:

- Email: normalized and valid format.
- Password: minimum eight characters; stronger production rules recommended.
- Phone: normalized country code and digits.
- Names: trim whitespace and reject empty values.
- Dates: ISO `YYYY-MM-DD` format in API requests.
- Enum fields: reject values outside defined role/status/type lists.
- MongoDB IDs: validate before querying.
- Search values: escape special characters before building regular expressions.
- Pagination: enforce maximum page size.

Use a validation library such as Zod, Joi or express-validator.

## 16. Security requirements

- Hash passwords with bcrypt or Argon2.
- Never store or return plain-text passwords.
- Never return password hashes.
- Use secure HTTP-only, SameSite cookies when possible.
- If using bearer JWTs, use short-lived access tokens and a safe refresh strategy.
- Keep secrets and database URLs in environment variables.
- Add rate limiting to login, signup and password-reset routes.
- Restrict CORS to approved frontend origins.
- Add Helmet security headers.
- Validate file uploads.
- Encrypt sensitive bank and government-identification data.
- Log salary, role and approval changes for auditability.
- Avoid returning salary or private profile fields in employee-list responses.
- Prevent mass assignment by explicitly selecting allowed update fields.

## 17. Environment variables

Suggested `.env.example`:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/dayflow
JWT_ACCESS_SECRET=replace-with-a-long-random-secret
JWT_REFRESH_SECRET=replace-with-another-long-random-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=http://127.0.0.1:5173
BCRYPT_ROUNDS=12
UPLOAD_MAX_MB=5
```

## 18. Frontend integration notes

The frontend currently imports:

```text
src/data/mockData.json
```

Replace mock-data usage gradually with an API layer, for example:

```text
src/api/http.js
src/api/auth.js
src/api/employees.js
src/api/attendance.js
src/api/timeOff.js
src/api/salary.js
```

Recommended frontend state:

- `AuthContext` for the current user and role.
- Protected routes for authenticated pages.
- Role guards for HR-only routes.
- API loading, error and empty states.
- Server data caching with TanStack Query if the team chooses to add it.

Frontend route guards improve navigation, but backend authorization remains mandatory.

## 19. Recommended implementation order

1. Database connection and global error handling.
2. Company and user models.
3. HR signup, shared login, session restore and logout.
4. Authentication and role middleware.
5. Employee creation/list/detail/update APIs.
6. Personal profile APIs.
7. Attendance check-in/out and reporting.
8. Time-off balances, requests and approvals.
9. Per-employee salary CRUD and calculations.
10. File uploads.
11. Audit logs, notifications and production hardening.

## 20. Integration completion checklist

- [ ] HR can create a company account.
- [ ] HR and employees can use one login endpoint.
- [ ] Login returns the stored user role.
- [ ] Employee accounts can only be created by HR.
- [ ] Employee login IDs are unique.
- [ ] Protected endpoints validate authentication.
- [ ] HR endpoints validate the HR role.
- [ ] All company data is scoped by `companyId`.
- [ ] Employee profiles expose only permitted fields.
- [ ] Check-in/out uses server timestamps.
- [ ] Employees can only read their own attendance.
- [ ] HR can review company attendance.
- [ ] Employees can request leave and view the calendar.
- [ ] HR can approve or reject leave.
- [ ] Leave balances update safely.
- [ ] Each employee has an independent salary record.
- [ ] HR can update salary.
- [ ] Employees can view salary but cannot edit it.
- [ ] Salary calculations are repeated and validated on the backend.
- [ ] Sensitive data is protected and masked.
- [ ] Frontend mock JSON and local-storage persistence are removed after API integration.

Before integration begins, both developers should confirm the API base URL, authentication storage strategy, login-ID format, salary rules and file-storage provider.
