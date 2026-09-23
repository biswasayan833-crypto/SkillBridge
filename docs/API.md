# SkillBridge REST API Documentation

Comprehensive technical reference for the SkillBridge RESTful API.

---

## 1. Overview & Architecture

- **Base URL**: `http://localhost:5000/api` (in development) or `/api` (production reverse-proxy)
- **Protocol**: HTTP/1.1 / HTTPS
- **Payload Format**: `application/json` (except file uploads which use `multipart/form-data`)
- **Authentication**: Stateless JSON Web Tokens (JWT) transmitted via the standard HTTP `Authorization` request header:
  ```http
  Authorization: Bearer <token>
  ```
  *(Tokens are issued on registration and login, stored client-side in `localStorage` under `skillbridge_token`)*
- **Status Progression**: API-driven status transitions (`Applied` &rarr; `Under Review` &rarr; `Shortlisted` &rarr; `Interview` &rarr; `Selected` / `Rejected`). No WebSockets or live push streams are used.
- **File Uploads**: Resumes are uploaded as PDF or DOCX (max 5 MB) stored securely on the local server filesystem under `server/uploads/resumes/` with path-traversal sanitization. (Cloud object storage is planned as a future enhancement).

---

## 2. Standard Response & Error Envelope

All responses return structured JSON envelopes.

### Success Envelope
```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": { ... }
}
```

### Error Envelope
```json
{
  "success": false,
  "message": "Descriptive error message explaining the failure.",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address."
    }
  ]
}
```

### HTTP Status Code Reference
| Code | Meaning | Typical Scenario |
|---|---|---|
| `200 OK` | Success | Successful retrieval, update, or login |
| `201 Created` | Created | Resource successfully created (registration, application, opportunity) |
| `400 Bad Request` | Client Error | Validation failure, invalid parameters, file too large, forbidden field modification |
| `401 Unauthorized` | Auth Error | Missing, expired, or malformed JWT; invalid email/password |
| `403 Forbidden` | Access Denied | Insufficient RBAC role, ownership mismatch, or CORS violation |
| `404 Not Found` | Missing Resource | Item does not exist or has been soft-deactivated |
| `409 Conflict` | Conflict | Duplicate student application or duplicate user email |
| `429 Too Many Requests` | Rate Limited | Quota exceeded on general or auth endpoints |
| `500 Server Error` | Server Failure | Unexpected internal failure (masked in production) |

---

## 3. Authentication Endpoints (`/api/auth`)

### 3.1 Register User
- **Method**: `POST`
- **Route**: `/api/auth/register`
- **Access**: Public
- **Rate Limit**: Auth limiter (30 req / 15 min prod, 500 dev)
- **Request Body**:
  ```json
  {
    "name": "Alex Morgan",
    "email": "alex.morgan@university.edu",
    "password": "Password123!",
    "role": "student"
  }
  ```
  *Field Notes*:
  - `role`: Must be either `"student"` or `"recruiter"`. (`"admin"` cannot be self-registered).
  - `password`: Minimum 6 characters.
- **Success Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "Account created successfully.",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "Alex Morgan",
      "email": "alex.morgan@university.edu",
      "role": "student",
      "createdAt": "2026-09-23T10:00:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Missing required fields, invalid email format, or weak password.
  - `409 Conflict`: An account with this email address already exists.

---

### 3.2 Login User
- **Method**: `POST`
- **Route**: `/api/auth/login`
- **Access**: Public
- **Rate Limit**: Auth limiter (30 req / 15 min prod, 500 dev)
- **Request Body**:
  ```json
  {
    "email": "alex.morgan@university.edu",
    "password": "Password123!"
  }
  ```
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Logged in successfully.",
    "token": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "Alex Morgan",
      "email": "alex.morgan@university.edu",
      "role": "student",
      "phone": "+1-555-0199",
      "college": "State University",
      "skills": ["JavaScript", "React", "Node.js"],
      "resume": {
        "fileName": "alex-resume.pdf",
        "uploadedAt": "2026-09-23T10:05:00.000Z"
      }
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Missing email or password.
  - `401 Unauthorized`: Invalid email or password.
  - `429 Too Many Requests`: Exceeded 30 requests in 15 minutes.

---

### 3.3 Get Current User Session
- **Method**: `GET`
- **Route**: `/api/auth/me`
- **Access**: Protected (Requires valid Bearer token)
- **Headers**: `Authorization: Bearer <token>`
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "user": {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "Alex Morgan",
      "email": "alex.morgan@university.edu",
      "role": "student",
      "skills": ["JavaScript", "React"]
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Token missing, invalid, or expired.

---

### 3.4 Logout
- **Method**: `POST`
- **Route**: `/api/auth/logout`
- **Access**: Public / Protected
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Logged out successfully."
  }
  ```
  *(Instructs client to clear stored JWT from `localStorage`)*

---

### 3.5 Update Password
- **Method**: `PUT`
- **Route**: `/api/auth/update-password`
- **Access**: Protected (Any authenticated user)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "currentPassword": "OldPassword123!",
    "newPassword": "NewStrongPassword456!"
  }
  ```
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Password updated successfully."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Missing fields or new password fails minimum length.
  - `401 Unauthorized`: Current password does not match.

---

## 4. User Profile & Resume Endpoints (`/api/users`)

### 4.1 Get Profile
- **Method**: `GET`
- **Route**: `/api/users/profile`
- **Access**: Protected (Any authenticated user)
- **Headers**: `Authorization: Bearer <token>`
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "user": {
      "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
      "name": "Alex Morgan",
      "email": "alex.morgan@university.edu",
      "role": "student",
      "phone": "+1-555-0199",
      "college": "State University",
      "bio": "Passionate software engineering student...",
      "skills": ["React", "Node.js", "Express", "MongoDB"],
      "education": {
        "degree": "B.S. Computer Science",
        "graduationYear": 2027
      },
      "experience": "Frontend intern at TechLab (Summer 2025)",
      "github": "https://github.com/alexmorgan",
      "linkedin": "https://linkedin.com/in/alexmorgan",
      "resume": {
        "fileName": "Alex_Morgan_Resume.pdf",
        "fileSize": 142850,
        "mimeType": "application/pdf",
        "uploadedAt": "2026-09-23T10:05:00.000Z"
      }
    }
  }
  ```

---

### 4.2 Update Profile
- **Method**: `PUT`
- **Route**: `/api/users/profile`
- **Access**: Protected (Any authenticated user)
- **Headers**: `Authorization: Bearer <token>`
- **Security Guard**: Strictly blocks modification of immutable/security fields (`role`, `password`, `email`, `_id`, `resume`, `createdAt`, `updatedAt`).
- **Request Body**:
  ```json
  {
    "name": "Alex Morgan",
    "phone": "+1-555-0199",
    "college": "State University",
    "bio": "Full-stack developer focused on React and Node.js.",
    "skills": ["JavaScript", "TypeScript", "React", "Node.js", "MongoDB"],
    "education": {
      "degree": "B.S. Computer Science",
      "graduationYear": 2027
    },
    "experience": "Open-source contributor",
    "github": "https://github.com/alexmorgan",
    "linkedin": "https://linkedin.com/in/alexmorgan"
  }
  ```
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Profile updated successfully.",
    "user": { ... }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Attempting to modify forbidden fields (`role`, `email`, `password`) or empty update payload.

---

### 4.3 Upload Resume
- **Method**: `POST`
- **Route**: `/api/users/resume`
- **Access**: Protected (Student role only)
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`
- **Rate Limit**: Upload limiter (20 uploads / 15 min prod, 100 dev)
- **Form Field**: `resume` (File: `.pdf` or `.docx`, max 5,242,880 bytes / 5 MB)
- **File Validation**:
  - Allowed MIME: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - Filename sanitization with `path.basename()`
  - Collision-resistant on-disk naming: `<userId>-<timestamp>-<hex><ext>`
  - Atomic replacement: old physical file unlinked only after DB metadata update succeeds.
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Resume uploaded successfully.",
    "resume": {
      "fileName": "Resume_Alex_Morgan.pdf",
      "fileSize": 210450,
      "mimeType": "application/pdf",
      "uploadedAt": "2026-09-23T11:20:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: No file uploaded, unsupported MIME type/extension, or file exceeds 5 MB.
  - `403 Forbidden`: User role is not student.

---

### 4.4 Download Resume
- **Method**: `GET`
- **Route**: `/api/users/resume`
- **Access**: Protected (Authenticated user)
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Binary file stream with `Content-Disposition: attachment; filename="..."` and `Content-Type: application/pdf` (or docx).
- **Error Responses**:
  - `404 Not Found`: No resume uploaded for user or file missing from disk.

---

### 4.5 Delete Resume
- **Method**: `DELETE`
- **Route**: `/api/users/resume`
- **Access**: Protected (Student role only)
- **Headers**: `Authorization: Bearer <token>`
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Resume deleted successfully."
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: No resume on profile to delete.
  - `403 Forbidden`: Non-student user.

---

## 5. Opportunity Endpoints (`/api/opportunities`)

### 5.1 Browse Opportunities (Public Search & Filter)
- **Method**: `GET`
- **Route**: `/api/opportunities`
- **Access**: Public
- **Query Parameters**:
  | Parameter | Type | Default | Description |
  |---|---|---|---|
  | `search` | String | None | ReDoS-escaped text search matching `title`, `company`, `description`, `skills`, `location` |
  | `type` | String | None | Role type filter: `internship`, `full-time`, `part-time`, `contract` |
  | `workMode` | String | None | Work arrangement filter: `remote`, `hybrid`, `onsite` |
  | `location` | String | None | Partial match on location string |
  | `skills` | String | None | Comma-separated required skills (e.g. `react,node.js`) |
  | `page` | Integer | `1` | Page number |
  | `limit` | Integer | `10` | Records per page (capped at 50) |
  | `sort` | String | `newest` | Whitelisted sort: `newest`, `oldest`, `deadline`, `title` |
- **Filter Guarantee**: Strictly returns only active postings (`isActive: true`). Soft-deactivated postings are excluded.
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "count": 1,
    "total": 24,
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalRecords": 24,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "opportunities": [
      {
        "_id": "64f2b3c4d5e6f7a8b9c0d2e3",
        "title": "Frontend Software Engineering Intern",
        "company": "Nexus Technologies",
        "description": "Join our product team to build modern React interfaces...",
        "type": "internship",
        "workMode": "remote",
        "location": "San Francisco, CA",
        "salary": "$40/hr",
        "skills": ["React", "JavaScript", "CSS"],
        "deadline": "2026-12-31T23:59:59.000Z",
        "isActive": true,
        "recruiter": {
          "_id": "64f1a2b3c4d5e6f7a8b9c0d9",
          "name": "Nexus Talent Team",
          "email": "talent@nexustechnologies.example"
        },
        "createdAt": "2026-09-20T08:00:00.000Z"
      }
    ]
  }
  ```

---

### 5.2 Get Opportunity by ID
- **Method**: `GET`
- **Route**: `/api/opportunities/:id`
- **Access**: Public
- **Success Response** (`200 OK`): Returns single opportunity object.
- **Error Responses**:
  - `400 Bad Request`: Invalid MongoDB ObjectId format.
  - `404 Not Found`: Opportunity does not exist or has been soft-deactivated (`isActive: false`).

---

### 5.3 Get Recruiter's Own Opportunities
- **Method**: `GET`
- **Route**: `/api/opportunities/my`
- **Access**: Protected (`recruiter`, `admin`)
- **Headers**: `Authorization: Bearer <token>`
- **Behavior**: Retrieves all postings created by the authenticated recruiter (including soft-deactivated ones for record management).
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "count": 5,
    "opportunities": [ ... ]
  }
  ```

---

### 5.4 Create Opportunity
- **Method**: `POST`
- **Route**: `/api/opportunities`
- **Access**: Protected (`recruiter`, `admin`)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "title": "Full Stack Developer",
    "company": "Horizon Cloud Labs",
    "description": "We are seeking a Full Stack Developer experienced with Node.js and React...",
    "type": "full-time",
    "workMode": "hybrid",
    "location": "Austin, TX",
    "salary": "$95,000 - $110,000",
    "skills": ["React", "Node.js", "MongoDB", "REST APIs"],
    "deadline": "2026-11-30"
  }
  ```
- **Behavior**: `recruiter` field is automatically bound to `req.user._id`.
- **Success Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "Opportunity created successfully.",
    "opportunity": { ... }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Missing mandatory fields (`title`, `company`, `description`, `type`, `location`, `deadline`).
  - `403 Forbidden`: Authenticated user is not a recruiter or admin.

---

### 5.5 Update Opportunity
- **Method**: `PUT`
- **Route**: `/api/opportunities/:id`
- **Access**: Protected (`recruiter`, `admin`)
- **Headers**: `Authorization: Bearer <token>`
- **Ownership Rule**: Only the recruiter who created the posting (or an admin) can update it.
- **Success Response** (`200 OK`): Returns updated opportunity document.
- **Error Responses**:
  - `403 Forbidden`: Recruiter does not own this opportunity.
  - `404 Not Found`: Opportunity does not exist.

---

### 5.6 Soft-Deactivate Opportunity
- **Method**: `DELETE`
- **Route**: `/api/opportunities/:id`
- **Access**: Protected (`recruiter`, `admin`)
- **Headers**: `Authorization: Bearer <token>`
- **Behavior**: Performs soft deletion by updating `{ isActive: false }`. Preserves document and all historical applications.
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Opportunity deactivated successfully."
  }
  ```
- **Error Responses**:
  - `403 Forbidden`: Recruiter does not own this opportunity.
  - `404 Not Found`: Opportunity does not exist.

---

## 6. Application Endpoints (`/api/applications`)

### 6.1 Submit Application
- **Method**: `POST`
- **Route**: `/api/applications`
- **Access**: Protected (Student only)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "opportunityId": "64f2b3c4d5e6f7a8b9c0d2e3",
    "coverLetter": "I am excited to apply for the Frontend Intern position..."
  }
  ```
- **Requirements & Validations**:
  1. Student must have an active resume uploaded to their profile (`user.resume.filePath`). Returns `400 Bad Request` if missing.
  2. Opportunity must exist and be active (`isActive: true`). Returns `400 Bad Request` if inactive.
  3. Duplicate prevention: MongoDB compound index `{ student: 1, opportunity: 1 }` prevents multiple submissions. Returns `409 Conflict` if already applied.
- **Success Response** (`201 Created`):
  ```json
  {
    "success": true,
    "message": "Application submitted successfully.",
    "application": {
      "_id": "64f3c4d5e6f7a8b9c0d3e4f5",
      "opportunity": "64f2b3c4d5e6f7a8b9c0d2e3",
      "student": "64f1a2b3c4d5e6f7a8b9c0d1",
      "coverLetter": "I am excited to apply...",
      "status": "Applied",
      "statusUpdatedAt": "2026-09-23T11:30:00.000Z",
      "createdAt": "2026-09-23T11:30:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Missing `opportunityId`, no resume uploaded, or opportunity deactivated.
  - `403 Forbidden`: Non-student account attempting to apply.
  - `409 Conflict`: Application already exists for this opportunity.

---

### 6.2 Get Student's Own Applications
- **Method**: `GET`
- **Route**: `/api/applications/my`
- **Access**: Protected (Student only)
- **Headers**: `Authorization: Bearer <token>`
- **Behavior**: Retrieves all applications submitted by the logged-in student, populating associated opportunity title, company, type, and location.
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "count": 3,
    "applications": [
      {
        "_id": "64f3c4d5e6f7a8b9c0d3e4f5",
        "status": "Under Review",
        "statusUpdatedAt": "2026-09-23T12:00:00.000Z",
        "createdAt": "2026-09-23T11:30:00.000Z",
        "opportunity": {
          "_id": "64f2b3c4d5e6f7a8b9c0d2e3",
          "title": "Frontend Software Engineering Intern",
          "company": "Nexus Technologies",
          "type": "internship",
          "location": "San Francisco, CA"
        }
      }
    ]
  }
  ```

---

### 6.3 Get Application by ID
- **Method**: `GET`
- **Route**: `/api/applications/:id`
- **Access**: Protected (Student owner / Recruiter owner of opportunity / Admin)
- **Headers**: `Authorization: Bearer <token>`
- **Ownership Verification**:
  - If requester is student: Must match `application.student`.
  - If requester is recruiter: Must own `application.opportunity.recruiter`.
  - Others: Rejected with `403 Forbidden`.
- **Success Response** (`200 OK`): Full populated application object.

---

### 6.4 Get Opportunity Applicants (Recruiter Pipeline)
- **Method**: `GET`
- **Route**: `/api/applications/opportunity/:opportunityId`
- **Access**: Protected (`recruiter`, `admin`)
- **Headers**: `Authorization: Bearer <token>`
- **Ownership Verification**: Recruiter must own the targeted opportunity (`recruiter === req.user._id`).
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "count": 8,
    "applications": [
      {
        "_id": "64f3c4d5e6f7a8b9c0d3e4f5",
        "status": "Applied",
        "statusUpdatedAt": "2026-09-23T11:30:00.000Z",
        "coverLetter": "...",
        "student": {
          "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
          "name": "Alex Morgan",
          "email": "alex.morgan@university.edu",
          "phone": "+1-555-0199",
          "college": "State University",
          "skills": ["React", "JavaScript"],
          "education": {
            "degree": "B.S. Computer Science",
            "graduationYear": 2027
          },
          "resume": {
            "fileName": "Alex_Morgan_Resume.pdf",
            "uploadedAt": "2026-09-23T10:05:00.000Z"
          }
        },
        "createdAt": "2026-09-23T11:30:00.000Z"
      }
    ]
  }
  ```
- **Error Responses**:
  - `403 Forbidden`: Recruiter does not own this opportunity.
  - `404 Not Found`: Opportunity does not exist.

---

### 6.5 Update Application Status
- **Method**: `PUT`
- **Route**: `/api/applications/:id/status`
- **Access**: Protected (`recruiter`, `admin`)
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "status": "Interview"
  }
  ```
- **Allowed Status Enum**:
  - `Applied`
  - `Under Review`
  - `Shortlisted`
  - `Interview`
  - `Selected`
  - `Rejected`
- **Behavior**: Updates application status, sets `statusUpdatedAt = Date.now()`, and returns the modified application.
- **Success Response** (`200 OK`):
  ```json
  {
    "success": true,
    "message": "Application status updated to Interview.",
    "application": {
      "_id": "64f3c4d5e6f7a8b9c0d3e4f5",
      "status": "Interview",
      "statusUpdatedAt": "2026-09-23T12:45:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Status value not in allowed enum.
  - `403 Forbidden`: Recruiter does not own the opportunity for this application.
  - `404 Not Found`: Application does not exist.
