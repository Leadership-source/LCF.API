# LCF API

Backend API for the Leadership Conference Forum platform.

## Handover Summary

- Runtime: Node.js 24+
- Framework: Express 5
- Database: PostgreSQL
- ORM: Prisma 6
- Authentication: JWT with HTTP-only cookie or bearer token
- Email: SendGrid
- Images: Cloudinary
- Deployment: Render
- Production API: `https://lcf-api-c228.onrender.com`

## Local Setup

### Requirements

- Node.js 20 or newer
- PostgreSQL database
- Cloudinary account for image uploads
- SendGrid account for transactional email

### Install and Configure

```bash
npm install
```

Create a local `.env` file. Do not commit it:

```env
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=verified-sender@example.com
CONTACT_RECEIVER_EMAIL=recipient@example.com
EVENT_REGISTRATION_EMAIL=recipient@example.com
```

Generate the Prisma client and apply migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

Run the API:

```bash
npm run dev
```

The local API is available at `http://localhost:3000`.

### Production Deployment

Render uses the configuration in `render.yaml`:

```text
Build: npm install && npx prisma generate
Start: node src/server.js
```

Apply production migrations before or during deployment:

```bash
npx prisma migrate deploy
```

Never run `prisma migrate reset` against production.

## Authentication

### Login

```http
POST /auth/login
Content-Type: application/json
```

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

Regular users receive a JWT immediately. Admin and superadmin users receive a temporary challenge instead:

```json
{
  "status": "verification_required",
  "message": "A six-digit security code has been sent to your email.",
  "challenge": "temporary-challenge-token"
}
```

Complete admin login with:

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

The six-digit code expires after 10 minutes. Successful verification returns the normal user and token response.

### Authenticated Requests

Bearer-token example:

```http
Authorization: Bearer <token>
```

Cookie-based clients must send credentials:

```js
fetch(url, { credentials: "include" });
```

### Password Management

```text
PUT  /auth/change-password       Authenticated user
POST /auth/forgot-password       Public
POST /auth/reset-password/:token Public reset link
```

Change-password body:

```json
{
  "currentPassword": "oldPassword",
  "newPassword": "newPassword",
  "confirmPassword": "newPassword"
}
```

Password reset links expire after 15 minutes.

## User Administration

User management requires `SUPERADMIN` authentication.

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/admin/users` | Create a user |
| `GET` | `/admin/users` | List users |
| `DELETE` | `/admin/users/:id` | Delete a user |
| `PATCH` | `/admin/users/:id/role` | Change a user's role |

When `password` is omitted from `POST /admin/users`, the API generates a temporary password and emails it to the new user. The email contains the login link and password-change instructions. The generated password is never returned in the response.

Supported roles are `USER`, `ADMIN`, and `SUPERADMIN`.

## API Reference

All successful responses use `status: "success"` where applicable. Validation errors return HTTP `400`; unauthenticated requests return `401`; insufficient permissions return `403`; missing records return `404`.

### Teams

Public:

```text
GET /teams/public
GET /teams/:id
```

Admin mutations use `multipart/form-data` with an optional image field, limited to 5 MB:

```text
GET    /teams
POST   /teams
PUT    /teams/:id
PATCH  /teams/:id/status
PATCH  /teams/reorder
DELETE /teams/:id
```

### Events

```text
GET    /events/public
GET    /events/:id
GET    /events
POST   /events
PUT    /events/:id
PATCH  /events/:id/status
DELETE /events/:id
POST   /events/:id/register
GET    /events/:id/attendees
```

Create and update event requests use `multipart/form-data`. Event images are limited to 5 MB.

### External Roles

Supported role types:

```text
ADVISOR
PATRON
BRAND_AMBASSADOR
HONORARY_SUPPORTER
MENTEE
```

```text
GET    /external-roles/public
GET    /external-roles
POST   /external-roles
PUT    /external-roles/:id
PATCH  /external-roles/:id/status
PATCH  /external-roles/reorder
DELETE /external-roles/:id
```

Create and update requests use `multipart/form-data`. Images are required when creating a role and limited to 5 MB.

### Quotes

Public published quotes:

```text
GET /quotes/published
```

Admin quote management:

```text
GET    /quotes
GET    /quotes/:id
POST   /quotes
PUT    /quotes/:id
PATCH  /quotes/:id/status
DELETE /quotes/:id
```

Quote creation and updates use `multipart/form-data`. The `image` field is optional and limited to 5 MB.

Quote invitations:

```text
POST   /quotes/invitations
GET    /quotes/invitations
GET    /quotes/invitations/:token
POST   /quotes/invitations/:token/submit
POST   /quotes/invitations/:id/resend
DELETE /quotes/invitations/:id
```

Invitation quote submission is public and accepts an optional image.

### Testimonials

```text
POST   /testimonials
GET    /testimonials/approved
GET    /testimonials/admin
PATCH  /testimonials/admin/:id/approve
PATCH  /testimonials/admin/:id/reject
PUT    /testimonials/admin/:id
DELETE /testimonials/admin/:id
```

Submitting a testimonial is public. Administrative operations require `ADMIN` or `SUPERADMIN` authentication.

### Volunteers

```text
GET   /volunteers/options
POST  /volunteers
GET   /volunteers/admin
PATCH /volunteers/admin/:id/read
```

Use `/volunteers/options` to build the dynamic form. Submit the selected option's conditional values inside the `details` object.

### News

```text
GET    /news/public
GET    /news/:id
GET    /news
POST   /news
PUT    /news/:id
PATCH  /news/:id/status
DELETE /news/:id
```

### Partners

```text
GET    /partners/public
GET    /partners
POST   /partners
PUT    /partners/:id
PATCH  /partners/:id/status
DELETE /partners/:id
```

### Contact and Notifications

```text
POST /contact
GET  /notifications
```

Contact submission is public. Notifications require authentication.

### Admin Dashboard

```text
GET /admin
GET /admin/stats
```

The statistics endpoint requires `ADMIN` or `SUPERADMIN` authentication.

## Frontend Uploads

Use `FormData` for image endpoints and do not manually set the `Content-Type` header. The browser supplies the multipart boundary.

```js
const form = new FormData();
form.append("name", "Jane Doe");
form.append("role", "Advisor");
form.append("image", fileInput.files[0]);

await api.post("/teams", form);
```

Images are uploaded to Cloudinary under entity-specific folders and the API returns the resulting URL.

## Client Integration Checklist

- Configure the production API URL.
- Send cookies with `credentials: "include"` when using cookie authentication.
- Store bearer tokens securely if using bearer authentication.
- Implement the second admin-login screen for the six-digit code.
- Protect admin routes based on `ADMIN` and `SUPERADMIN` roles.
- Do not expose passwords, security codes, or tokens in logs.
- Use `FormData` for image uploads.
- Display field-level validation errors from `400` responses.
- Handle `401` by returning the user to login.
- Handle `403` with an access-denied state.
- Use the password-change screen after first login with a temporary password.

## Verification Commands

Run these before handover:

```bash
npm install
npx prisma validate
npx prisma migrate status
npm run build
```

Syntax-check all source files:

```powershell
$files = Get-ChildItem -Path src -Filter *.js -Recurse
foreach ($file in $files) { node --check $file.FullName }
```

The repository currently has no automated test suite configured. Manual smoke testing should cover login, admin code verification, user creation, password change/reset, public content endpoints, and image upload flows.

`npm audit --omit=dev --audit-level=high` currently reports three high-severity findings in Prisma 6's transitive `deepmerge-ts` dependency. The available forced remediation changes Prisma to an incompatible version, so it was not applied during handover. The compatible `qs` vulnerability was remediated to `6.16.0`. Plan a separate Prisma upgrade and regression test cycle before treating the audit as clear.

## Repository Structure

```text
src/
  config/         Database and Cloudinary configuration
  controller/     Request handlers
  middleWare/     Authentication and validation middleware
  routes/         Express route definitions
  service/        Shared application services
  utils/          Email and token utilities
  validators/     Zod request schemas
prisma/
  schema.prisma
  migrations/
render.yaml
package.json
README.md
```

## Support Notes

- Keep `.env` out of version control.
- Run migrations with `prisma migrate deploy` during release deployment.
- Do not change production data directly without a migration or controlled script.
- Review Render logs and SendGrid delivery logs when an email is not received.
