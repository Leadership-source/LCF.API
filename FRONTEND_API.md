# LCF API — Frontend Integration Guide

## Base URL

| Environment | URL |
|---|---|
| Production | `https://lcf-api-c228.onrender.com` |
| Local dev | `http://localhost:3000` |

---

## Authentication

The API supports two auth strategies. Use one consistently:

**Option A — Cookie (recommended for browser apps)**
The server sets an `httpOnly` JWT cookie on login automatically. Your fetch client must send credentials on every request.

```js
// axios
const api = axios.create({
  baseURL: "https://lcf-api-c228.onrender.com",
  withCredentials: true,          // sends the jwt cookie automatically
});

// fetch
fetch(url, { credentials: "include" })
```

**Option B — Bearer token**
Store the `token` from the login/register response and send it in the `Authorization` header.

```js
headers: {
  Authorization: `Bearer ${token}`
}
```

---

## Response Shape

All responses follow one of two shapes:

```json
// success
{ "status": "success", "data": { ... } }
{ "status": "success", "message": "..." }

// error
{ "status": "error", "message": "..." }
{ "errors": [{ "field": "email", "message": "..." }] }   // validation errors (400)
```

HTTP status codes used: `200`, `201`, `400`, `401`, `403`, `404`, `500`

---

## Auth Routes — `/auth`

> **Note:** Public self-registration has been removed. User accounts are created exclusively by a superadmin via `POST /admin/users`.

### Login
`POST /auth/login`

```json
// body
{
  "email": "jane@example.com",
  "password": "secret123"
}
```

```json
// 200 response
{
  "message": "Logged in successfully",
  "user": { "id": "uuid", "name": "Jane Doe", "email": "jane@example.com", "role": "USER" },
  "token": "eyJ..."
}
```

Possible `role` values: `"USER"` · `"ADMIN"` · `"SUPERADMIN"`

Store the `role` on the client to conditionally render admin UI.

---

### Logout
`POST /auth/logout` — no body required

Clears the JWT cookie. Call this on sign-out.

---

### Get Current User
`GET /auth/me` 🔒 *requires auth*

```json
// 200 response
{
  "user": { "id": "uuid", "name": "Jane Doe", "email": "jane@example.com", "role": "USER" }
}
```

---

### Change Password
`PUT /auth/change-password` 🔒 *requires auth*

```json
// body
{
  "currentPassword": "secret123",
  "newPassword": "newSecret456",    // min 6, max 100
  "confirmPassword": "newSecret456"
}
```

---

### Forgot Password
`POST /auth/forgot-password`

```json
// body
{ "email": "jane@example.com" }
```

Always returns `200` regardless of whether the email exists (prevents user enumeration).

---

### Reset Password
`POST /auth/reset-password/:token`

The `token` comes from the link in the reset email (`?token=...`).

```json
// body
{ "password": "newSecret456" }   // min 6 chars
```

---

## Admin — User Management — `/admin/users`

All routes below require the authenticated user to have `role: "SUPERADMIN"`. Any other role returns `403 Forbidden`.

---

### Create User
`POST /admin/users` 🔒 *superadmin only*

```json
// body
{
  "name": "Jane Doe",           // min 2, max 100 chars
  "email": "jane@example.com",
  "password": "SecurePass@1",   // min 8, max 100 chars
  "role": "USER"                // optional — "USER" | "ADMIN" | "SUPERADMIN", defaults to "USER"
}
```

```json
// 201 response
{
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "USER",
    "createdAT": "2026-08-13T00:00:00.000Z"
  }
}
```

```json
// 400 — email already exists
{ "error": "A user with that email already exists" }
```

---

### List All Users
`GET /admin/users` 🔒 *superadmin only*

```json
// 200 response
{
  "users": [
    { "id": "uuid", "name": "Jane Doe", "email": "jane@example.com", "role": "USER", "createdAT": "2026-08-13T00:00:00.000Z" }
  ]
}
```

Ordered by `createdAT` ascending.

---

### Delete User
`DELETE /admin/users/:id` 🔒 *superadmin only*

```json
// 200 response
{ "message": "User deleted successfully" }
```

```json
// 400 — cannot delete own account
{ "error": "You cannot delete your own account" }
// 404 — user not found
{ "error": "User not found" }
```

---

### Update User Role
`PATCH /admin/users/:id/role` 🔒 *superadmin only*

```json
// body
{ "role": "ADMIN" }   // "USER" | "ADMIN" | "SUPERADMIN"
```

```json
// 200 response
{
  "message": "User role updated",
  "user": { "id": "uuid", "name": "Jane Doe", "email": "jane@example.com", "role": "ADMIN" }
}
```

```json
// 400 — cannot change own role
{ "error": "You cannot change your own role" }
```

---

## Team Routes — `/teams`

### Get Published Teams (public)
`GET /teams/public` — no auth required

```json
// 200 response
{
  "status": "success",
  "results": 4,
  "data": [
    {
      "id": "uuid",
      "name": "John Smith",
      "role": "Director",
      "image": "https://res.cloudinary.com/...",
      "displayOrder": 1,
      "status": "PUBLISHED"
    }
  ]
}
```

Teams are ordered by `displayOrder` ascending.

---

### Get All Teams (admin)
`GET /teams` — no auth required *(returns all including UNPUBLISHED)*

---

### Create Team Member
`POST /teams` 🔒 *requires auth* — `multipart/form-data`

| Field | Type | Required |
|---|---|---|
| `name` | string (min 2, max 100) | ✅ |
| `role` | string (min 2, max 150) | ✅ |
| `image` | file (max 5MB) | ✅ |
| `displayOrder` | number (int ≥ 0) | optional |

```js
const form = new FormData();
form.append("name", "Jane Doe");
form.append("role", "Director");
form.append("image", fileInput.files[0]);

api.post("/teams", form);   // axios sets Content-Type automatically
```

```json
// 201 response
{ "status": "success", "data": { ...teamObject } }
```

---

### Update Team Member
`PUT /teams/:id` 🔒 *requires auth* — `multipart/form-data`

All fields optional. Only the creating user can update.

| Field | Type |
|---|---|
| `name` | string |
| `role` | string |
| `image` | file (new image, optional) |
| `status` | `"PUBLISHED"` \| `"UNPUBLISHED"` |
| `displayOrder` | number |

---

### Update Team Status
`PATCH /teams/:id/status` 🔒 *requires auth*

```json
// body — only the creating user can publish
{ "status": "PUBLISHED" }
// or
{ "status": "UNPUBLISHED" }
```

---

### Delete Team Member
`DELETE /teams/:id` 🔒 *requires auth* — only the creating user can delete

---

## Event Routes — `/events`

### Get Published Events (public)
`GET /events/public` — no auth required

```json
// 200 response
{
  "status": "success",
  "results": 3,
  "data": [
    {
      "id": "uuid",
      "category": "Conference",
      "title": "Leadership Summit 2026",
      "image": "https://res.cloudinary.com/...",
      "location": "London",
      "date": "2026-09-15T00:00:00.000Z",
      "time": "09:00",
      "description": "...",
      "speaker": "John Doe",
      "venue": "ExCeL London",
      "attendees": 500,
      "agenda": ["Opening Keynote", "Panel Discussion", "Networking"],
      "status": "PUBLISHED",
      "createdAt": "2026-08-01T00:00:00.000Z"
    }
  ]
}
```

---

### Get Single Event (public)
`GET /events/:id` — no auth required

```json
// 200 response
{ "status": "success", "data": { ...eventObject } }
```

---

### Get All Events (admin)
`GET /events` 🔒 *requires auth* — returns all events including `UNPUBLISHED`

---

### Register for Event (public)
`POST /events/:id/register` — no auth required

```json
// body
{
  "name": "Jane Doe",           // min 2 chars
  "email": "jane@example.com",
  "phone": "+44 7700 900000"    // optional
}
```

```json
// 200 response
{ "status": "success", "message": "You have successfully registered for Leadership Summit 2026" }
```

```json
// 409 — already registered with this email
{ "status": "error", "message": "This email address has already registered for this event" }
// 400 — event not published
{ "status": "error", "message": "Event is not open for registration" }
```

---

### Get Event Attendees (admin)
`GET /events/:id/attendees` 🔒 *requires auth*

Returns the full attendee list for a specific event. Use the browser print dialog (`window.print()`) on this data to produce a printable list.

```json
// 200 response
{
  "status": "success",
  "event": { "id": "uuid", "title": "Leadership Summit 2026", "date": "2026-09-15T00:00:00.000Z", "location": "London" },
  "total": 2,
  "attendees": [
    { "id": "uuid", "name": "Jane Doe", "email": "jane@example.com", "phone": "+44 7700 900000", "registeredAt": "2026-08-14T00:00:00.000Z" },
    { "id": "uuid", "name": "John Smith", "email": "john@example.com", "phone": null, "registeredAt": "2026-08-14T01:00:00.000Z" }
  ]
}
```

---

### Create Event
`POST /events` 🔒 *requires auth* — `multipart/form-data`

| Field | Type | Notes |
|---|---|---|
| `category` | string (min 2, max 100) | ✅ required |
| `title` | string (min 3, max 200) | ✅ required |
| `location` | string (min 2, max 200) | ✅ required |
| `date` | string | ✅ required, any parseable date e.g. `"2026-09-15"` |
| `time` | string | ✅ required, e.g. `"09:00 AM"` |
| `description` | string (min 10) | ✅ required |
| `speaker` | string (min 2) | ✅ required |
| `venue` | string (min 2) | ✅ required |
| `attendees` | string (number) | ✅ required |
| `agenda` | JSON string array | ✅ required, e.g. `JSON.stringify(["Item 1", "Item 2"])` |
| `image` | file (max 5MB) | ✅ required |

```js
const form = new FormData();
form.append("title", "Leadership Summit");
form.append("category", "Conference");
form.append("location", "London");
form.append("date", "2026-09-15");
form.append("time", "09:00 AM");
form.append("description", "An annual gathering of leaders.");
form.append("speaker", "John Doe");
form.append("venue", "ExCeL London");
form.append("attendees", "500");
form.append("agenda", JSON.stringify(["Keynote", "Panel", "Networking"]));
form.append("image", fileInput.files[0]);

api.post("/events", form);
```

---

### Update Event
`PUT /events/:id` 🔒 *requires auth* — `multipart/form-data`, all fields optional

---

### Update Event Status
`PATCH /events/:id/status` 🔒 *requires auth*

```json
{ "status": "PUBLISHED" }
```

---

### Delete Event
`DELETE /events/:id` 🔒 *requires auth*

---

## Notifications — `/notifications`

### Get My Notifications
`GET /notifications` 🔒 *requires auth*

```json
// 200 response
{
  "data": [
    {
      "id": "uuid",
      "message": "Event \"Leadership Summit\" has been created.",
      "type": "EVENT_CREATED",
      "isRead": false,
      "createdAt": "2026-08-12T00:00:00.000Z"
    }
  ]
}
```

Notification `type` values: `EVENT_CREATED`, `EVENT_UPDATED`, `EVENT_DELETED`, `TEAM_CREATED`, `TEAM_PUBLISHED`, `TEAM_UNPUBLISHED`, `TEAM_DELETED`

---

## Contact — `/contact`

### Submit Contact Message
`POST /contact` — no auth required — `application/json`

```json
// body
{
  "fullName": "Jane Doe",          // min 2, max 100
  "email": "jane@example.com",
  "phone": "+44 7700 900000",      // optional, max 20
  "subject": "Partnership enquiry", // min 3, max 200
  "message": "Hello, I would like to discuss..." // min 10, max 5000
}
```

```json
// 201 response
{
  "message": "Your message has been sent successfully. We will get back to you soon."
}
```

---

## Error Handling

```js
try {
  const { data } = await api.post("/auth/login", { email, password });
} catch (err) {
  if (err.response?.status === 400) {
    // validation error — show field errors
    const { errors } = err.response.data;
    errors.forEach(({ field, message }) => showFieldError(field, message));
  } else if (err.response?.status === 401) {
    // redirect to login
  } else if (err.response?.status === 403) {
    // user is authenticated but lacks superadmin access
    toast.error("You do not have permission to perform this action.");
  } else {
    // generic error toast
    toast.error(err.response?.data?.message ?? "Something went wrong");
  }
}
```

---

## Suggested axios Setup

```js
// src/lib/api.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3000",
  withCredentials: true,
});

// attach token from localStorage if using Bearer strategy
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(err);
  },
);

export default api;
```

Add to your `.env`:
```
VITE_API_URL=https://lcf-api-c228.onrender.com
```

The frontend is served at `https://lcf-7yt6.onrender.com`.
