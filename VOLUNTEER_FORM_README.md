# Dynamic Volunteer Form

This document describes how the frontend should build and submit the volunteer form using the backend API.

## 1. Fetch Form Options

Request the available volunteer areas and their conditional fields:

```http
GET /volunteers/options
```

Example response:

```json
{
  "status": "success",
  "options": [
    {
      "value": "MENTORING",
      "label": "Mentoring and coaching",
      "fields": [
        {
          "name": "experience",
          "label": "Relevant experience",
          "type": "textarea",
          "required": true
        },
        {
          "name": "ageGroup",
          "label": "Preferred age group",
          "type": "text",
          "required": true
        }
      ]
    }
  ]
}
```

Use `options` to populate the area-of-interest dropdown. Use `availabilityOptions` to populate the availability dropdown. When the selected area changes, clear the previous conditional values and render the new option's `fields`.

Supported areas currently include:

- `MENTORING`
- `EVENTS`
- `COMMUNITY_OUTREACH`
- `COMMUNICATIONS`
- `FUNDRAISING`
- `ADMIN_SUPPORT`

Availability options currently include:

| Value | Label |
| --- | --- |
| `WEEKDAYS` | Weekdays |
| `WEEKENDS` | Weekends |
| `BOTH` | Weekdays and weekends |
| `FLEXIBLE` | Flexible |

## 2. Base Form Fields

The form should include:

| Field | Type | Required | Limits |
| --- | --- | --- | --- |
| `fullName` | text | Yes | 2-100 characters |
| `email` | email | Yes | Valid email, max 254 characters |
| `phone` | tel | No | Max 20 characters |
| `areaOfInterest` | select | Yes | Must match an API option |
| `availability` | select | Yes | Must match an API availability option |
| `message` | textarea | No | Max 2,000 characters |
| `details` | dynamic object | Depends on area | Each value max 1,000 characters |

The API validates all fields. Client-side validation should improve the user experience, but should not replace server-side validation.

## 3. Conditional Fields

The API requires these fields for each area:

| Area | Required `details` fields |
| --- | --- |
| `MENTORING` | `experience`, `ageGroup` |
| `EVENTS` | `eventExperience` |
| `COMMUNITY_OUTREACH` | `community` |
| `COMMUNICATIONS` | `platforms` |
| `FUNDRAISING` | `fundraisingExperience` |
| `ADMIN_SUPPORT` | `skills` |

The field names must be sent exactly as returned by `/volunteers/options`.

## 4. Submit the Form

Request:

```http
POST /volunteers
Content-Type: application/json
```

Example mentoring submission:

```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+44 7700 900000",
  "areaOfInterest": "MENTORING",
  "availability": "WEEKDAYS",
  "details": {
    "experience": "I have coached young leaders for three years.",
    "ageGroup": "16-21"
  },
  "message": "I would love to help with the next programme."
}
```

Successful response:

```json
{
  "status": "success",
  "message": "Thank you for volunteering. We will be in touch soon.",
  "data": {
    "id": "application-uuid",
    "status": "NEW"
  }
}
```

## 5. Basic Frontend Flow

```js
const [options, setOptions] = useState([]);
const [availabilityOptions, setAvailabilityOptions] = useState([]);
const [areaOfInterest, setAreaOfInterest] = useState("");
const [details, setDetails] = useState({});

useEffect(() => {
  fetch(`${API_URL}/volunteers/options`)
    .then((response) => response.json())
    .then((result) => {
      setOptions(result.options);
      setAvailabilityOptions(result.availabilityOptions);
    });
}, []);

function handleAreaChange(event) {
  setAreaOfInterest(event.target.value);
  setDetails({});
}

function handleDetailChange(fieldName, value) {
  setDetails((current) => ({
    ...current,
    [fieldName]: value,
  }));
}

async function submitVolunteerForm(event) {
  event.preventDefault();

  const response = await fetch(`${API_URL}/volunteers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName,
      email,
      phone,
      areaOfInterest,
      availability,
      details,
      message,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to submit application");
  }

  return result;
}
```

Render the availability dropdown from `availabilityOptions`:

```jsx
<select value={availability} onChange={(event) => setAvailability(event.target.value)} required>
  <option value="">Select availability</option>
  {availabilityOptions.map((option) => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ))}
</select>
```

For the area-specific fields, find the selected option and loop over its fields:

```js
const selectedOption = options.find(
  (option) => option.value === areaOfInterest,
);

selectedOption?.fields.map((field) => (
  <label key={field.name}>
    {field.label}
    {field.type === "textarea" ? (
      <textarea
        required={field.required}
        value={details[field.name] || ""}
        onChange={(event) => handleDetailChange(field.name, event.target.value)}
      />
    ) : (
      <input
        type="text"
        required={field.required}
        value={details[field.name] || ""}
        onChange={(event) => handleDetailChange(field.name, event.target.value)}
      />
    )}
  </label>
));
```

## 6. Error Handling

Validation errors return HTTP `400`:

```json
{
  "status": "error",
  "message": "Validation failed",
  "errors": [
    {
      "field": "details.experience",
      "message": "experience is required for this area of interest"
    }
  ]
}
```

Display each error against its matching field. A successful submission returns HTTP `201`.

## 7. Admin Implementation

The backend includes an admin listing endpoint, but no admin frontend page is included in this backend repository.

The frontend admin implementation should call the endpoint below, display the returned applications in a table or list, and restrict the request to authenticated admins. Each application includes its base fields, selected `areaOfInterest`, dynamic `details`, `status`, `isRead`, and `createdAt`.

Authenticated admins can retrieve submitted applications:

```http
GET /volunteers/admin
Authorization: Bearer <admin-token>
```

This endpoint requires an `ADMIN` or `SUPERADMIN` account. The response includes the applicant's `message` and dynamic `details`, so the admin can read the complete form submission.

To mark an application as read after the admin opens it:

```http
PATCH /volunteers/admin/:id/read
Authorization: Bearer <admin-token>
```

## 8. Email Notification

After an application is saved, the backend sends the complete submission to `CONTACT_RECEIVER_EMAIL`. The applicant's email is set as `replyTo`, so the admin can reply directly.

The server must have these environment variables configured:

```env
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=verified-sender@example.com
CONTACT_RECEIVER_EMAIL=admin@example.com
```
