# Dayflow Sign-in and Sign-up Backend Integration

This document describes the authentication contract required by the Dayflow frontend.

## User roles

Dayflow currently has two roles:

- `hr`: Can sign up, sign in, manage employees and access HR pages.
- `employee`: Can only sign in. Employee accounts are created later by an authenticated HR user.

HR and employees use the same sign-in page and the same login endpoint. The backend must determine the user's role from the stored account. The frontend must never be trusted to choose or assign a role.

## Frontend routes

| Page | Route | Access |
| --- | --- | --- |
| Shared sign-in | `/login` | HR and employees |
| HR registration | `/signup` | New HR users only |
| HR dashboard | `/dashboard` | Authenticated HR |
| Employee dashboard | `/employee-dashboard` | Authenticated employee |

## 1. HR sign-up

Only a new HR administrator can use public registration. This creates a company workspace and its first HR account.

### Endpoint

```http
POST /api/auth/signup
Content-Type: application/json
```

### Request body

```json
{
  "name": "Harini Rao",
  "email": "harini@dayflow.in",
  "companyName": "Dayflow Technologies",
  "phone": "9876543210",
  "password": "SecurePassword123"
}
```

`confirmPassword` is validated by the frontend and does not need to be sent to the backend.

### Backend behavior

1. Validate all required fields.
2. Normalize the email address to lowercase.
3. Check whether the email already exists.
4. Create the company/workspace.
5. Hash the password using bcrypt.
6. Create the user with `role: "hr"`.
7. Connect the HR user to the newly created company using `companyId`.
8. Return the authentication token, user and company.

The signup endpoint must not accept a role from the request. It must always create the initial user as `hr`.

### Successful response

Status: `201 Created`

```json
{
  "success": true,
  "message": "HR account created successfully",
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "user-id",
      "name": "Harini Rao",
      "email": "harini@dayflow.in",
      "phone": "9876543210",
      "role": "hr",
      "companyId": "company-id",
      "mustChangePassword": false
    },
    "company": {
      "id": "company-id",
      "name": "Dayflow Technologies"
    }
  }
}
```

### Error responses

Invalid fields (`400`):

```json
{
  "success": false,
  "message": "Please provide valid registration details",
  "errors": {
    "email": "Please enter a valid email address"
  }
}
```

Duplicate email (`409`):

```json
{
  "success": false,
  "message": "An account already exists with this email"
}
```

## 2. Shared sign-in

HR and employees must use the same login endpoint. The identifier can contain either an HR email address, employee email address or generated employee login ID.

### Endpoint

```http
POST /api/auth/login
Content-Type: application/json
```

### Request body

```json
{
  "identifier": "harini@dayflow.in",
  "password": "SecurePassword123"
}
```

Employee example:

```json
{
  "identifier": "DFANRA20260001",
  "password": "TemporaryPassword123"
}
```

### Backend behavior

1. Detect whether `identifier` is an email address or login ID.
2. Find the matching user.
3. Compare the password using bcrypt.
4. Confirm the account is active.
5. Read the role from the database.
6. Generate an authentication token or session.
7. Return the user, role, company and password-change status.

Do not accept a role from the frontend during login.

### Successful HR response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "hr-user-id",
      "name": "Harini Rao",
      "email": "harini@dayflow.in",
      "loginId": null,
      "role": "hr",
      "companyId": "company-id",
      "mustChangePassword": false
    }
  }
}
```

### Successful employee response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "employee-user-id",
      "name": "Ananya Rao",
      "email": "ananya@dayflow.in",
      "loginId": "DFANRA20260001",
      "role": "employee",
      "companyId": "company-id",
      "mustChangePassword": true
    }
  }
}
```

### Invalid login response

Status: `401 Unauthorized`

```json
{
  "success": false,
  "message": "Invalid login ID/email or password"
}
```

Use the same generic error for an unknown account and an incorrect password. Do not reveal whether an email or login ID exists.

### Inactive account response

Status: `403 Forbidden`

```json
{
  "success": false,
  "message": "Your account is inactive. Please contact HR."
}
```

## 3. Frontend redirect logic

After a successful login:

```text
mustChangePassword = true  -> password-change page
role = hr                  -> /dashboard
role = employee            -> /employee-dashboard
```

The current frontend contains demonstration redirects. These must be replaced with redirects based on `data.user.role` after API integration.

## 4. Restore the authenticated session

The frontend needs an endpoint to restore the user after a browser refresh.

### Endpoint

```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Response

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-id",
      "name": "Harini Rao",
      "email": "harini@dayflow.in",
      "role": "hr",
      "companyId": "company-id",
      "mustChangePassword": false
    }
  }
}
```

## 5. Logout

If authentication uses an HTTP-only cookie:

```http
POST /api/auth/logout
```

The backend should invalidate or clear the cookie. If JWT is stored only on the client, the frontend will remove it during logout.

## 6. Employee account creation

Employees must not use `/api/auth/signup`. An employee account is created from the HR dashboard by an authenticated HR user.

Suggested endpoint:

```http
POST /api/employees
Authorization: Bearer <hr-token>
```

The backend must:

- Verify that the requester has the `hr` role.
- Assign the employee to the HR user's company.
- Generate a unique employee login ID.
- Hash the temporary password.
- Set `role: "employee"` internally.
- Set `mustChangePassword: true`.
- Return the generated credentials once to the HR user.

## 7. Authorization rules

Authentication identifies the user. Authorization determines which pages and data the user can access.

- HR can access company employees and company-wide attendance.
- Employees can access only their own profile, attendance and time-off data.
- Employees must never be able to request HR data by changing a frontend URL or query parameter.
- Every protected backend endpoint must verify both the role and `companyId`.
- Frontend route protection is for user experience only; backend authorization is mandatory.

## 8. Security requirements

- Hash passwords with bcrypt.
- Never store or return plain-text passwords.
- Never return password hashes.
- Store JWT secrets in environment variables.
- Add token expiration.
- Prefer secure HTTP-only cookies when practical.
- Validate and sanitize all request values.
- Add rate limiting to signup and login.
- Configure CORS for the frontend origin.
- Do not trust user IDs, roles or company IDs supplied by the frontend.
- Return only the minimum user information required by the frontend.

## 9. Standard response format

Success:

```json
{
  "success": true,
  "message": "Readable success message",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Readable error message",
  "errors": {}
}
```

The backend and frontend developers should confirm the final API base URL, token-storage method and response field names before integration.
