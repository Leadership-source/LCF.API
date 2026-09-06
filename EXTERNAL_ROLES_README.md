# External Roles — Frontend Implementation Guide

## Overview

External roles represent organizational positions such as Advisors, Patrons, Brand Ambassadors, Honorary Supporters, and Mentees. This guide covers how to implement the frontend for both the public-facing role directory and the admin management interface.

---

## 1. Available Role Types

The API supports 5 external role types:

| Type | Value |
|------|-------|
| Advisor | `ADVISOR` |
| Patron | `PATRON` |
| Brand Ambassador | `BRAND_AMBASSADOR` |
| Honorary Supporter | `HONORARY_SUPPORTER` |
| Mentee | `MENTEE` |

---

## 2. API Endpoints

### Public Endpoints (No Auth Required)

#### Get Published Roles
```
GET /external-roles/public
```

Returns all published external roles ordered by `displayOrder`.

**Response:**
```json
{
  "status": "success",
  "results": 3,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Sarah Johnson",
      "roleType": "ADVISOR",
      "bio": "Sarah brings 20 years of experience in leadership development...",
      "image": "https://res.cloudinary.com/...",
      "displayOrder": 1
    },
    {
      "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "name": "Michael Chen",
      "roleType": "PATRON",
      "bio": "Generous supporter of youth empowerment initiatives...",
      "image": "https://res.cloudinary.com/...",
      "displayOrder": 2
    }
  ]
}
```

---

### Admin Endpoints (Requires ADMIN or SUPERADMIN Role)

All admin endpoints require authentication with `Authorization: Bearer {token}` header or JWT cookie.

#### List All Roles (Admin)
```
GET /external-roles
```

Returns all roles including unpublished ones. Includes creator information.

**Response:**
```json
{
  "status": "success",
  "results": 5,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Sarah Johnson",
      "roleType": "ADVISOR",
      "bio": "...",
      "image": "https://res.cloudinary.com/...",
      "displayOrder": 1,
      "status": "PUBLISHED",
      "createdBy": "uuid",
      "creator": {
        "id": "uuid",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "createdAt": "2026-08-01T00:00:00.000Z",
      "updatedAt": "2026-08-14T00:00:00.000Z"
    }
  ]
}
```

#### Create Role
```
POST /external-roles
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**Fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | ✅ | 2-100 characters |
| `roleType` | string | ✅ | One of: ADVISOR, PATRON, BRAND_AMBASSADOR, HONORARY_SUPPORTER, MENTEE |
| `bio` | string | optional | Max 2000 characters |
| `image` | file | ✅ | Max 5MB, image file only |
| `displayOrder` | number | optional | Integer ≥ 0, defaults to 0 |

**Example (JavaScript/FormData):**
```js
const formData = new FormData();
formData.append("name", "Sarah Johnson");
formData.append("roleType", "ADVISOR");
formData.append("bio", "Sarah brings 20 years of experience in leadership development...");
formData.append("image", fileInput.files[0]);  // File from <input type="file">
formData.append("displayOrder", "1");

const response = await fetch("https://lcf-api-c228.onrender.com/external-roles", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`
  },
  body: formData,
  credentials: "include"  // if using cookies
});

const { data } = await response.json();
```

**Success Response (201):**
```json
{
  "status": "success",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Sarah Johnson",
    "roleType": "ADVISOR",
    "bio": "...",
    "image": "https://res.cloudinary.com/...",
    "displayOrder": 1,
    "status": "UNPUBLISHED",
    "createdBy": "uuid",
    "createdAt": "2026-09-06T00:00:00.000Z",
    "updatedAt": "2026-09-06T00:00:00.000Z"
  }
}
```

#### Update Role
```
PUT /external-roles/:id
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

All fields optional. Only update the fields you provide.

**Example:**
```js
const formData = new FormData();
formData.append("name", "Sarah Johnson (Updated)");
formData.append("bio", "Updated bio text...");
// optionally include image to replace it
// formData.append("image", newFileInput.files[0]);

const response = await fetch(`https://lcf-api-c228.onrender.com/external-roles/${roleId}`, {
  method: "PUT",
  headers: {
    Authorization: `Bearer ${token}`
  },
  body: formData,
  credentials: "include"
});
```

#### Update Role Status (Publish/Unpublish)
```
PATCH /external-roles/:id/status
Content-Type: application/json
Authorization: Bearer {token}
```

**Body:**
```json
{
  "status": "PUBLISHED"
}
```

Or to unpublish:
```json
{
  "status": "UNPUBLISHED"
}
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "External role published successfully",
  "data": { ...roleObject }
}
```

#### Reorder Roles
```
PATCH /external-roles/reorder
Content-Type: application/json
Authorization: Bearer {token}
```

**Body:**
```json
{
  "orders": [
    { "id": "550e8400-e29b-41d4-a716-446655440000", "displayOrder": 1 },
    { "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8", "displayOrder": 2 },
    { "id": "7ca8c920-0eae-12e2-91c5-11d05gf541d9", "displayOrder": 3 }
  ]
}
```

Use this endpoint after a drag-and-drop reorder to persist the new display order.

**Success Response (200):**
```json
{
  "status": "success",
  "message": "External roles reordered successfully"
}
```

#### Delete Role
```
DELETE /external-roles/:id
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "status": "success",
  "message": "External role deleted successfully"
}
```

---

## 3. Public-Facing Role Directory

### Display Published Roles

Fetch and display roles on a public page (e.g., `/advisors-and-partners`):

```jsx
import { useState, useEffect } from "react";

export function RoleDirectory() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch(
        "https://lcf-api-c228.onrender.com/external-roles/public"
      );
      if (!response.ok) throw new Error("Failed to fetch roles");
      
      const { data } = await response.json();
      setRoles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading roles...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="roles-container">
      <h1>Our Leadership Network</h1>
      <div className="roles-grid">
        {roles.map((role) => (
          <RoleCard key={role.id} role={role} />
        ))}
      </div>
    </div>
  );
}

function RoleCard({ role }) {
  return (
    <div className="role-card">
      <img src={role.image} alt={role.name} className="role-image" />
      <h3>{role.name}</h3>
      <p className="role-type">{formatRoleType(role.roleType)}</p>
      {role.bio && <p className="role-bio">{role.bio}</p>}
    </div>
  );
}

function formatRoleType(type) {
  return type
    .split("_")
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
}
```

### CSS Grid Styling Example

```css
.roles-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
}

.role-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.role-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.role-image {
  width: 100%;
  height: 300px;
  object-fit: cover;
}

.role-card h3 {
  font-size: 1.25rem;
  margin: 1rem;
  color: #1a1a2e;
}

.role-type {
  font-size: 0.9rem;
  color: #4a6cf7;
  font-weight: 600;
  margin: 0 1rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.role-bio {
  font-size: 0.95rem;
  line-height: 1.6;
  color: #555;
  padding: 0 1rem 1rem;
}
```

---

## 4. Admin Management Interface

### Role Management Dashboard

```jsx
import { useState, useEffect } from "react";

export function RoleManagementDashboard() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchRoles();
  }, [token]);

  const fetchRoles = async () => {
    try {
      const response = await fetch(
        "https://lcf-api-c228.onrender.com/external-roles",
        {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include"
        }
      );
      if (!response.ok) throw new Error("Failed to fetch roles");
      
      const { data } = await response.json();
      setRoles(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roleId) => {
    if (!window.confirm("Delete this role?")) return;
    
    try {
      const response = await fetch(
        `https://lcf-api-c228.onrender.com/external-roles/${roleId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include"
        }
      );
      if (response.ok) {
        setRoles(roles.filter(r => r.id !== roleId));
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const handlePublish = async (roleId, currentStatus) => {
    const newStatus = currentStatus === "PUBLISHED" ? "UNPUBLISHED" : "PUBLISHED";
    
    try {
      const response = await fetch(
        `https://lcf-api-c228.onrender.com/external-roles/${roleId}/status`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ status: newStatus }),
          credentials: "include"
        }
      );
      if (response.ok) {
        setRoles(roles.map(r =>
          r.id === roleId ? { ...r, status: newStatus } : r
        ));
      }
    } catch (error) {
      console.error("Publish error:", error);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="admin-panel">
      <div className="panel-header">
        <h2>External Roles Management</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancel" : "+ Add Role"}
        </button>
      </div>

      {showForm && (
        <CreateRoleForm
          token={token}
          onSuccess={() => {
            setShowForm(false);
            fetchRoles();
          }}
        />
      )}

      <table className="roles-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Bio</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {roles.map(role => (
            <tr key={role.id}>
              <td>{role.name}</td>
              <td>{role.roleType}</td>
              <td>{role.bio?.slice(0, 50)}...</td>
              <td>
                <span className={`badge ${role.status.toLowerCase()}`}>
                  {role.status}
                </span>
              </td>
              <td>
                <button
                  className="btn-sm"
                  onClick={() => handlePublish(role.id, role.status)}
                >
                  {role.status === "PUBLISHED" ? "Unpublish" : "Publish"}
                </button>
                <button className="btn-sm">Edit</button>
                <button
                  className="btn-sm btn-danger"
                  onClick={() => handleDelete(role.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Create Role Form

```jsx
function CreateRoleForm({ token, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    roleType: "ADVISOR",
    bio: "",
    displayOrder: "0"
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const roleTypes = [
    "ADVISOR",
    "PATRON",
    "BRAND_AMBASSADOR",
    "HONORARY_SUPPORTER",
    "MENTEE"
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("roleType", formData.roleType);
      data.append("bio", formData.bio);
      data.append("displayOrder", formData.displayOrder);
      if (image) data.append("image", image);

      const response = await fetch(
        "https://lcf-api-c228.onrender.com/external-roles",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: data,
          credentials: "include"
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Failed to create role");
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="create-role-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Name *</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          placeholder="E.g., Sarah Johnson"
          required
          minLength="2"
          maxLength="100"
        />
      </div>

      <div className="form-group">
        <label>Role Type *</label>
        <select
          name="roleType"
          value={formData.roleType}
          onChange={handleInputChange}
          required
        >
          {roleTypes.map(type => (
            <option key={type} value={type}>
              {type.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Bio</label>
        <textarea
          name="bio"
          value={formData.bio}
          onChange={handleInputChange}
          placeholder="Short biography (max 2000 characters)"
          maxLength="2000"
          rows="4"
        />
      </div>

      <div className="form-group">
        <label>Display Order</label>
        <input
          type="number"
          name="displayOrder"
          value={formData.displayOrder}
          onChange={handleInputChange}
          min="0"
        />
      </div>

      <div className="form-group">
        <label>Image *</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          required
        />
        {image && <p className="file-name">{image.name}</p>}
      </div>

      {error && <div className="error-message">{error}</div>}

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? "Creating..." : "Create Role"}
      </button>
    </form>
  );
}
```

---

## 5. Error Handling

The API returns standard error responses:

```json
// 400 — Validation error
{
  "status": "error",
  "message": "Failed to create external role.",
  "errors": [
    { "field": "name", "message": "Name must be at least 2 characters" },
    { "field": "roleType", "message": "Invalid role type" }
  ]
}

// 401 — Not authenticated
{
  "status": "error",
  "message": "Unauthorized"
}

// 403 — Insufficient permissions (not ADMIN/SUPERADMIN)
{
  "status": "error",
  "message": "Forbidden"
}

// 404 — Role not found
{
  "status": "error",
  "message": "External role not found"
}

// 500 — Server error
{
  "status": "error",
  "message": "Failed to create external role."
}
```

### Error Handling Example

```js
const handleFetch = async (url, options) => {
  try {
    const response = await fetch(url, options);
    const json = await response.json();

    if (!response.ok) {
      if (response.status === 400) {
        // Show field-level validation errors
        json.errors?.forEach(({ field, message }) => {
          showFieldError(field, message);
        });
      } else if (response.status === 401) {
        // Redirect to login
        window.location.href = "/login";
      } else if (response.status === 403) {
        toast.error("You do not have permission to perform this action");
      } else {
        toast.error(json.message || "Something went wrong");
      }
      return null;
    }

    return json;
  } catch (error) {
    toast.error("Network error: " + error.message);
    return null;
  }
};
```

---

## 6. Authentication Setup (axios example)

```js
// lib/api.js
import axios from "axios";

const api = axios.create({
  baseURL: "https://lcf-api-c228.onrender.com",
  withCredentials: true,  // send cookies
});

// Attach token if using Bearer strategy
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 7. Drag-and-Drop Reordering

```jsx
import { useState } from "react";

export function ReorderableRolesList({ roles, token }) {
  const [orderedRoles, setOrderedRoles] = useState(roles);
  const [draggedId, setDraggedId] = useState(null);

  const handleDragStart = (id) => {
    setDraggedId(id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (targetId) => {
    if (draggedId === targetId) return;

    const draggedIndex = orderedRoles.findIndex(r => r.id === draggedId);
    const targetIndex = orderedRoles.findIndex(r => r.id === targetId);

    const newRoles = [...orderedRoles];
    [newRoles[draggedIndex], newRoles[targetIndex]] = [
      newRoles[targetIndex],
      newRoles[draggedIndex]
    ];

    setOrderedRoles(newRoles);
    setDraggedId(null);
  };

  const handleSaveOrder = async () => {
    const orders = orderedRoles.map((role, index) => ({
      id: role.id,
      displayOrder: index + 1
    }));

    try {
      const response = await fetch(
        "https://lcf-api-c228.onrender.com/external-roles/reorder",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ orders }),
          credentials: "include"
        }
      );

      if (response.ok) {
        alert("Order saved successfully!");
      }
    } catch (error) {
      console.error("Error saving order:", error);
    }
  };

  return (
    <div>
      <ul className="reorder-list">
        {orderedRoles.map((role) => (
          <li
            key={role.id}
            draggable
            onDragStart={() => handleDragStart(role.id)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(role.id)}
            className={draggedId === role.id ? "dragging" : ""}
          >
            ⋮⋮ {role.name}
          </li>
        ))}
      </ul>
      <button onClick={handleSaveOrder} className="btn-primary">
        Save New Order
      </button>
    </div>
  );
}
```

---

## 8. Environment Variables

Add to your `.env.local`:

```
VITE_API_URL=https://lcf-api-c228.onrender.com
```

Or for local development:

```
VITE_API_URL=http://localhost:3000
```

---

## Summary

| Feature | Endpoint | Auth Required |
|---------|----------|---------------|
| View published roles | `GET /external-roles/public` | No |
| List all roles (admin) | `GET /external-roles` | Yes (ADMIN) |
| Create role | `POST /external-roles` | Yes (ADMIN) |
| Update role | `PUT /external-roles/:id` | Yes (ADMIN) |
| Publish/unpublish | `PATCH /external-roles/:id/status` | Yes (ADMIN) |
| Reorder roles | `PATCH /external-roles/reorder` | Yes (ADMIN) |
| Delete role | `DELETE /external-roles/:id` | Yes (ADMIN) |

All admin operations require the user's role to be `ADMIN` or `SUPERADMIN`.
