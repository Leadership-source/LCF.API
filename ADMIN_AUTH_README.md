# Admin Authentication and User Onboarding

Frontend implementation guide for admin login verification, superadmin user creation, and password management.

## Base URL

```js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
```

Production:

```text
https://lcf-api-c228.onrender.com
```

## Authentication Flow

### Regular Users

Regular users sign in normally:

```text
POST /auth/login
```

The response contains the JWT token immediately.

### Admins and Superadmins

`ADMIN` and `SUPERADMIN` accounts use a two-step login:

1. Submit the email and password.
2. Receive a six-digit code by email.
3. Submit the code with the temporary challenge.
4. Store the returned JWT and continue to the admin area.

The code expires after 10 minutes.

## Step 1: Submit Login Credentials

```http
POST /auth/login
Content-Type: application/json
```

```json
{
  "email": "admin@example.com",
  "password": "AdminPassword123"
}
```

For an admin account, the API returns `202`:

```json
{
  "status": "verification_required",
  "message": "A six-digit security code has been sent to your email.",
  "challenge": "temporary-challenge-token"
}
```

Do not treat this response as a completed login. Keep the `challenge` in component state until verification finishes.

## Step 2: Verify the Security Code

Display a six-digit numeric input and submit:

```http
POST /auth/login/verify
Content-Type: application/json
```

```json
{
  "challenge": "temporary-challenge-token",
  "code": "123456"
}
```

Successful response:

```json
{
  "message": "Logged in successfully",
  "user": {
    "id": "uuid",
    "name": "Admin User",
    "email": "admin@example.com",
    "role": "ADMIN"
  },
  "token": "eyJ..."
}
```

Store the token according to the application's authentication strategy. The API also sets an HTTP-only JWT cookie when cookies are enabled.

### Axios Example

```js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

export async function loginAdmin(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

export async function verifyAdminLogin(challenge, code) {
  const { data } = await api.post("/auth/login/verify", {
    challenge,
    code,
  });

  localStorage.setItem("token", data.token);
  return data;
}
```

### Login UI States

The login screen should support these states:

- `credentials`: email and password form
- `code`: six-digit security-code form
- `authenticated`: redirect to the admin dashboard
- `error`: show the API error message

For a wrong or expired code, the API returns `401`:

```json
{
  "status": "error",
  "message": "Invalid or expired security code."
}
```

## Creating Users

Only a `SUPERADMIN` can create users.

```http
POST /admin/users
Authorization: Bearer <token>
Content-Type: application/json
```

### With a Password

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "TemporaryPass123",
  "role": "USER"
}
```

### Without a Password

The frontend may omit `password`. The API generates a temporary password and emails it to the new user.

```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "USER"
}
```

Supported roles:

```text
USER
ADMIN
SUPERADMIN
```

Successful response:

```json
{
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "USER",
    "createdAT": "2026-09-06T00:00:00.000Z"
  },
  "emailSent": true
}
```

The generated password is never returned in the API response. It is sent to the user's email together with the login link and password-change instructions.

If `emailSent` is `false`, the account was created but the welcome email could not be delivered. The superadmin should use the password-reset flow or contact the user before they attempt to sign in.

### Create User Example

```js
export async function createUser(form, token) {
  const response = await fetch(`${API_URL}/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify({
      name: form.name,
      email: form.email,
      role: form.role,
      // Omit password to let the API generate one.
      ...(form.password ? { password: form.password } : {}),
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Failed to create user");
  return data;
}
```

## Change Password

An authenticated user can change their password after signing in.

```http
PUT /auth/change-password
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "currentPassword": "TemporaryPass123",
  "newPassword": "MyNewPassword456",
  "confirmPassword": "MyNewPassword456"
}
```

The new password must be at least 6 characters and no more than 100 characters.

Successful response:

```json
{
  "message": "Password changed successfully"
}
```

The frontend should provide this form in account settings and clear the form after success.

## Forgot and Reset Password

Use this flow when a user does not know their current password.

### Request Reset Email

```http
POST /auth/forgot-password
Content-Type: application/json
```

```json
{
  "email": "jane@example.com"
}
```

The API always returns a success response to avoid revealing whether an email belongs to an account:

```json
{
  "status": "success",
  "message": "If the email exists, a password reset link has been sent."
}
```

### Submit New Password

The reset email contains a link with a `token` query parameter. Read that token in the reset-password page and submit:

```http
POST /auth/reset-password/:token
Content-Type: application/json
```

```json
{
  "password": "NewPassword456"
}
```

Successful response:

```json
{
  "status": "success",
  "message": "Password reset successfully"
}
```

Reset links expire after 15 minutes.

## Recommended Frontend Routes

```text
/login
/admin
/admin/users/new
/account/password
/reset-password?token=<token>
```

## Error Handling

| Status | Meaning | Frontend action |
|---|---|---|
| `202` | Admin credentials accepted; code required | Show the security-code form |
| `400` | Invalid request or validation error | Show field-level errors |
| `401` | Invalid credentials, code, or expired session | Show an error or redirect to login |
| `403` | Insufficient role permissions | Show an access-denied state |
| `500` | Server or email-service failure | Show a retry message |

Never log passwords, security codes, or JWT tokens to the browser console.

## Environment Variable

```env
VITE_API_URL=https://lcf-api-c228.onrender.com
```
