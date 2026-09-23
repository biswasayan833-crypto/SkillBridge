# SkillBridge — Internship & Career Management Platform

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-18.x-blue.svg)](https://react.dev/)
[![Express Version](https://img.shields.io/badge/express-4.x-lightgrey.svg)](https://expressjs.com/)
[![Database](https://img.shields.io/badge/database-MongoDB%20Atlas-forestgreen.svg)](https://www.mongodb.com/atlas)
[![Regression Test Coverage](https://img.shields.io/badge/tests-185%2F185%20passing-success.svg)](./scratch/)
[![Security Audited](https://img.shields.io/badge/security-hardened-blueviolet.svg)](#18-security-measures)

SkillBridge is an end-to-end, full-stack early-career recruiting and internship management platform. Built with a decoupled **React 18** client and **Express/Node.js** REST API backed by **MongoDB**, SkillBridge streamlines the recruitment lifecycle for students and university recruiters through transparent workflows, structured application pipelines, and comprehensive security hardening.

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Key Features](#3-key-features)
4. [User Roles](#4-user-roles)
5. [Student Features](#5-student-features)
6. [Recruiter Features](#6-recruiter-features)
7. [Admin & RBAC Status](#7-admin--rbac-status)
8. [Application Workflow](#8-application-workflow)
9. [Technology Stack](#9-technology-stack)
10. [System Architecture](#10-system-architecture)
11. [Database Collections & Models](#11-database-collections--models)
12. [Authentication Architecture](#12-authentication-architecture)
13. [JWT & Role-Based Access Control](#13-jwt--role-based-access-control)
14. [Opportunity Management](#14-opportunity-management)
15. [Application Management & Duplicate Prevention](#15-application-management--duplicate-prevention)
16. [Resume Management](#16-resume-management)
17. [Security Measures](#17-security-measures)
18. [API Overview](#18-api-overview)
19. [Project Structure](#19-project-structure)
20. [Local Setup & Prerequisites](#20-local-setup--prerequisites)
21. [Environment Variables](#21-environment-variables)
22. [MongoDB Atlas Setup](#22-mongodb-atlas-setup)
23. [Running Frontend](#23-running-frontend)
24. [Running Backend](#24-running-backend)
25. [Testing & Verification](#25-testing--verification)
26. [Production Build](#26-production-build)
27. [Deployment Considerations](#27-deployment-considerations)
28. [Current Limitations](#28-current-limitations)
29. [Future Improvements](#29-future-improvements)
30. [Portfolio & Engineering Highlights](#30-portfolio--engineering-highlights)

---

## 1. Project Overview

SkillBridge provides a centralized digital ecosystem for campus recruitment. Students build structured profiles, upload and manage their resume, discover active internships and full-time positions using faceted filters, and track their application progression. Recruiters author job listings, review applicant pools, inspect candidate credentials and resumes, and transition applicants through a structured 6-stage hiring workflow.

---

## 2. Problem Statement

Traditional university recruiting suffers from fragmented tools:
- **For Students**: Applications disappear into corporate ATS portals without status transparency, leaving candidates uninformed for weeks or months.
- **For Recruiters**: Campus hiring teams handle high volumes of unstandardized resumes over email or clunky enterprise software lacking agile candidate progression pipelines.
- **For Academic Institutions**: Verification and structured tracking of students transitioning from education to industry is uncoordinated.

SkillBridge addresses these issues by enforcing structured data models, auditable application progression, duplicate application prevention, and direct recruiter-student workflows.

---

## 3. Key Features

- **Decoupled Architecture**: Independent React 18 SPA client and Express REST API backend.
- **Stateless JWT Authentication**: Secure password hashing with bcrypt, stateless JSON Web Tokens stored client-side in `localStorage`, and HTTP Bearer header authorization.
- **Role-Based Routing & Guards**: Protected client-side navigation (`ProtectedRoute` and `PublicRoute`) enforcing role restrictions for students and recruiters.
- **Faceted Opportunity Search**: ReDoS-escaped keyword search with multi-parameter filtering (role type, work arrangement, location, required skills), sorting, and server-side pagination.
- **Guaranteed Duplicate Prevention**: MongoDB compound unique index enforcing `{ student: 1, opportunity: 1 }` to eliminate duplicate applications.
- **6-Stage Application Progression**: API-driven status updates (`Applied` &rarr; `Under Review` &rarr; `Shortlisted` &rarr; `Interview` &rarr; `Selected` / `Rejected`) with full timestamp auditing.
- **Secure Resume Hub**: Upload, view, download, and delete resumes (PDF/DOCX, 5 MB cap) with path-traversal protection and atomic file replacement.
- **Role-Specific Dashboards**: High-level statistical overviews, stage counters, and recent activity tables for both students and recruiters.
- **Hardened Security Baseline**: Helmet HTTP headers, NoSQL query injection sanitization, environment-calibrated rate limiters, and strict CORS enforcement.

---

## 4. User Roles

| Role | Target Persona | Capabilities |
|---|---|---|
| `student` | University students, job seekers | Browse opportunities, submit applications, manage profile & resume, view personal dashboard and application history. |
| `recruiter` | Talent acquisition specialists, hiring managers | Author opportunities, manage postings, review candidate applicants, inspect resumes, advance candidate statuses. |
| `admin` | Platform administrators (system role) | System-level oversight, override capabilities across opportunities and candidate records. (Direct self-registration is blocked). |

---

## 5. Student Features

- **Profile Management**: Curate contact details, college affiliation, academic degree, graduation year, bio, skills tags, and portfolio links (GitHub, LinkedIn).
- **Resume Hub**: Upload PDF or DOCX resume documents (up to 5 MB). Replace existing files atomically or delete them on demand.
- **Opportunity Discovery**: Browse published positions with instant keyword search and filters by type (`internship`, `full-time`, `part-time`, `contract`), mode (`remote`, `hybrid`, `onsite`), and required skills.
- **Application Submission**: Submit applications with an optional cover letter. The platform validates that a resume is attached and checks against duplicate submissions.
- **Application Tracking**: View submitted applications with a visual progress stepper reflecting current status, submission timestamp, and last status update.
- **Student Dashboard**: Interactive KPI summary cards detailing total applications, active reviews, interviews, and offers.

---

## 6. Recruiter Features

- **Opportunity Authoring**: Create detailed position listings with compensation, work arrangements, location, skill prerequisites, and application deadlines.
- **Opportunity Management**: Dedicated console to view active and inactive postings, edit posting details, and perform soft deactivations (`isActive = false`).
- **Applicant Review Board**: Dedicated candidate review interface per opportunity. Inspect applicant education, graduation year, skills chips, and cover letters.
- **Resume Access**: Securely download and review candidate resumes with permission-gated endpoints.
- **API-Driven Status Pipeline**: Advance candidate status through a standardized dropdown updater (`Applied` &rarr; `Under Review` &rarr; `Shortlisted` &rarr; `Interview` &rarr; `Selected` / `Rejected`).
- **Recruiter Dashboard**: Overview metrics summarizing active job postings, total candidates received, and aggregate hiring funnel distribution.

---

## 7. Admin & RBAC Status

- **Role Enforcement**: User roles are validated on every authenticated request via backend `requireRole` middleware.
- **Self-Registration Defense**: Direct registration with `role: "admin"` is strictly blocked by input validation (`HTTP 400 Bad Request`); only `"student"` and `"recruiter"` roles are permitted during public onboarding.
- **Admin Access**: The backend architecture supports administrative override on opportunity deactivation and applicant inspection. An interactive admin dashboard is outside current scope and planned for a future release.

---

## 8. Application Workflow

```
[ Student Discovers Opportunity ]
               │
               ▼
[ Validates Resume on Profile ]
               │
               ▼
[ Submits Application with Cover Letter ] ──(Duplicate Check: Compound Index)
               │
               ▼
         Status: Applied
               │
               ▼
      [ Recruiter Reviews ] ──► Status: Under Review
               │
               ▼
    [ Candidate Evaluated ] ──► Status: Shortlisted
               │
               ▼
     [ Recruiter Schedules ] ──► Status: Interview
               │
      ┌────────┴────────┐
      ▼                 ▼
Status: Selected   Status: Rejected
```

Application status transitions are **API-driven** via `PUT /api/applications/:id/status`. Each transition updates `statusUpdatedAt` to provide auditability.

---

## 9. Technology Stack

### Frontend Client (`client/`)
- **Core Framework**: React 18.3 (Single Page Application)
- **Tooling & Bundler**: Vite 6.4 (ESM development server & Rollup production bundler)
- **Routing**: React Router DOM v6.28 (Client-side routing with route-level code splitting)
- **HTTP Client**: Axios 1.7 (Configured with request/response interceptors for JWT injection and error normalization)
- **Styling**: Cinematic dark-slate custom design system (`index.css`) with zero heavy CSS framework bloat
- **Optimization**: `React.lazy` and `React.Suspense` for asynchronous route chunking

### Backend Server (`server/`)
- **Runtime**: Node.js (v18+)
- **Framework**: Express 4.19 (RESTful HTTP microframework)
- **Database ODM**: Mongoose 8.5
- **Authentication**: JSON Web Token (`jsonwebtoken` 9.0) + `bcryptjs` 2.4
- **Security Middleware**: `helmet` 7.1, `cors` 2.8, `express-rate-limit` 7.3
- **File Upload Engine**: `multer` 1.4 (Memory & disk storage with MIME/extension filtering)
- **Logging**: `morgan` (HTTP request logging)

### Database Layer
- **Engine**: MongoDB 7.0 / MongoDB Atlas Cloud Cluster
- **Indexes**: Compound unique indexes, multikey skill indexes, and foreign reference fields

---

## 10. System Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                     Client Application (SPA)                  │
│       React 18 + Vite | Route-Level Code Splitting            │
│       AuthContext (localStorage: skillbridge_token)           │
│       Axios Interceptor (Authorization: Bearer <token>)       │
└──────────────────────────────┬────────────────────────────────┘
                               │ JSON REST API / Multipart Form
                               │ Ports: 5173 (Client) -> 5000 (API)
┌──────────────────────────────▼────────────────────────────────┐
│                   Express Backend Application                 │
│   ├── Security Middleware (Helmet, CORS, NoSQL Sanitizer)     │
│   ├── Environment-Calibrated Rate Limiters (General & Auth)   │
│   ├── JWT Auth & RBAC Middleware (verifyToken, requireRole)   │
│   ├── Controllers & Ownership Logic                           │
│   └── File Handler (Multer + Path Traversal Defense)          │
└──────────────────────────────┬────────────────────────────────┘
                               │ Mongoose ODM Driver
┌──────────────────────────────▼────────────────────────────────┐
│                     MongoDB Database Layer                    │
│   ├── Users Collection (Auth, Profile, Embedded Resume Meta)  │
│   ├── Opportunities Collection (Jobs, Filters, Soft Deletion) │
│   └── Applications Collection (Compound Unique Index, Audit)  │
└───────────────────────────────────────────────────────────────┘
```

---

## 11. Database Collections & Models

### 11.1 Users Collection (`server/src/models/User.js`)
- `name`: String (required, trimmed, max 50 chars)
- `email`: String (required, unique, lowercased, validated via regex)
- `password`: String (required, min 6 chars, `select: false`, hashed with bcrypt)
- `role`: String (enum: `['student', 'recruiter', 'admin']`, default: `'student'`)
- `phone`, `college`, `bio`, `experience`, `github`, `linkedin`: Profile strings
- `skills`: Array of Strings
- `education`: Subdocument `{ degree: String, graduationYear: Number }`
- `resume`: Subdocument `{ fileName: String, filePath: String, fileSize: Number, mimeType: String, uploadedAt: Date }`

### 11.2 Opportunities Collection (`server/src/models/Opportunity.js`)
- `title`: String (required, trimmed, max 100 chars)
- `company`: String (required, trimmed, max 100 chars)
- `description`: String (required, max 5000 chars)
- `type`: String (enum: `['internship', 'full-time', 'part-time', 'contract']`)
- `workMode`: String (enum: `['remote', 'hybrid', 'onsite']`)
- `location`: String (required, trimmed)
- `salary`: String (optional compensation text)
- `skills`: Array of Strings (multikey indexed)
- `deadline`: Date (required)
- `isActive`: Boolean (default: `true`, indexed for soft deactivation)
- `recruiter`: ObjectId (ref: `'User'`, required, indexed)

### 11.3 Applications Collection (`server/src/models/Application.js`)
- `opportunity`: ObjectId (ref: `'Opportunity'`, required)
- `student`: ObjectId (ref: `'User'`, required)
- `coverLetter`: String (optional, max 2000 chars)
- `status`: String (enum: `['Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected']`, default: `'Applied'`)
- `statusUpdatedAt`: Date (default: `Date.now`)
- **Index**: Unique compound index `{ student: 1, opportunity: 1 }`

---

## 12. Authentication Architecture

- **Stateless Tokens**: The backend does not maintain server-side session stores. Upon successful login or registration, the server issues a signed JWT containing the user ID and role.
- **Client Storage**: The token is stored in the browser's `localStorage` under the key `skillbridge_token`.
- **Request Authentication**: The Axios request interceptor reads `localStorage.getItem('skillbridge_token')` and transmits it in the standard `Authorization: Bearer <token>` header.
- **Session Rehydration**: When the app initializes or refreshes, `AuthContext` queries `GET /api/auth/me` with the stored Bearer token to hydrate user state. If the token is expired or forged, `AuthContext` clears `localStorage` and resets state to guest.
- *Note: SkillBridge does not use HTTP-only cookies; authentication is strictly token-based via Bearer headers.*

---

## 13. JWT & Role-Based Access Control

1. **`verifyToken` Middleware**:
   - Inspects `req.headers.authorization`.
   - Validates JWT signature using `process.env.JWT_SECRET`.
   - Verifies expiration.
   - Fetches the active user from MongoDB (excluding password) and binds it to `req.user`.
2. **`requireRole(...roles)` Middleware**:
   - Compares `req.user.role` against authorized roles.
   - Rejects unauthorized roles with `HTTP 403 Forbidden`.
3. **Frontend Guards**:
   - `ProtectedRoute`: Verifies authentication and role eligibility before rendering child routes. Redirects guests to `/login` with location memory.
   - `PublicRoute`: Prevents authenticated users from accessing guest-only routes (`/login`, `/register`) by redirecting them to their respective role dashboard.

---

## 14. Opportunity Management

- **Public Access**: Anyone can search and view active opportunities without creating an account.
- **Recruiter Authoring**: Authenticated recruiters can post opportunities with automatic binding to `req.user._id`.
- **Strict Ownership**: Only the posting's creator (or admin) can modify or deactivate an opportunity. Foreign recruiter attempts receive `HTTP 403 Forbidden`.
- **Soft Deactivation**: Opportunities are deactivated via `{ isActive: false }`. They immediately drop out of public listings and direct 404 lookups while preserving application history for auditability.

---

## 15. Application Management & Duplicate Prevention

- **Resume Prerequisite**: Submitting an application requires an active resume on file (`user.resume.filePath`).
- **Database-Level Duplicate Prevention**: The MongoDB compound index `{ student: 1, opportunity: 1 }` guarantees idempotency. Duplicate submissions return `HTTP 409 Conflict`.
- **Privacy & Ownership Isolation**:
  - Students can only view their own submissions.
  - Recruiters can only access applicant lists for opportunities they authored. Cross-tenant applicant requests return `HTTP 403 Forbidden`.
- **Timestamp Auditing**: Status changes update `statusUpdatedAt` dynamically.

---

## 16. Resume Management

- **Supported Formats**: `.pdf` and `.docx` only.
- **Size Limit**: Maximum 5 MB (5,242,880 bytes).
- **Storage Strategy**: Files are stored on the local server filesystem under `server/uploads/resumes/`. Filenames are generated using collision-resistant identifiers: `<userId>-<timestamp>-<randomHex><ext>`.
- **Atomic File Replacement**: When a student uploads a new resume, the database metadata is updated first; only upon successful database write is the old physical file removed from disk.
- **Path Traversal Defense**: Download and delete handlers pass filenames through `path.basename()` before resolving file paths.
- *Note: Cloud object storage (AWS S3 / Cloudinary) is planned for future horizontal scalability.*

---

## 17. Security Measures

- **NoSQL Query Injection Sanitization**: Custom middleware recursively strips MongoDB operator keys (`$` and `.`) from query parameters and request bodies.
- **ReDoS Protection**: User search terms are escaped with `str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` before building regular expressions.
- **Helmet HTTP Headers**: Enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and strict Content Security Policy.
- **Environment-Aware Rate Limiting**:
  - *Production*: General limiter enforces 200 req / 15 min; auth limiter enforces 30 req / 15 min.
  - *Development*: General limiter allows 1000 req / 15 min; auth limiter allows 500 req / 15 min to prevent development lockouts.
- **CORS Whitelist Protection**: Validates incoming `Origin` headers against `CLIENT_URL`. Untrusted origins receive `HTTP 403 Forbidden`.
- **Information Disclosure Prevention**: Production error handlers mask 500 internal error stack traces and internal database error messages.

---

## 18. API Overview

Detailed documentation for every endpoint is available in [`docs/API.md`](./docs/API.md).

| Module | Method | Endpoint | Access | Purpose |
|---|---|---|---|---|
| **Auth** | `POST` | `/api/auth/register` | Public | Register new student or recruiter |
| **Auth** | `POST` | `/api/auth/login` | Public | Authenticate user and issue JWT |
| **Auth** | `GET` | `/api/auth/me` | Protected | Hydrate authenticated user session |
| **Auth** | `POST` | `/api/auth/logout` | Public | Clear user session |
| **Auth** | `PUT` | `/api/auth/update-password` | Protected | Change password with current password verification |
| **Profile** | `GET` | `/api/users/profile` | Protected | Fetch current user profile |
| **Profile** | `PUT` | `/api/users/profile` | Protected | Update profile fields (guards forbidden fields) |
| **Resume** | `POST` | `/api/users/resume` | Protected (Student) | Upload or replace PDF/DOCX resume |
| **Resume** | `GET` | `/api/users/resume` | Protected | Download uploaded resume document |
| **Resume** | `DELETE` | `/api/users/resume` | Protected (Student) | Remove resume from disk and clear profile metadata |
| **Opportunities** | `GET` | `/api/opportunities` | Public | Search and filter active opportunities |
| **Opportunities** | `GET` | `/api/opportunities/:id` | Public | View single opportunity details |
| **Opportunities** | `GET` | `/api/opportunities/my` | Protected (Recruiter) | List opportunities authored by authenticated recruiter |
| **Opportunities** | `POST` | `/api/opportunities` | Protected (Recruiter) | Create a new career opportunity |
| **Opportunities** | `PUT` | `/api/opportunities/:id` | Protected (Recruiter) | Update owned opportunity |
| **Opportunities** | `DELETE` | `/api/opportunities/:id` | Protected (Recruiter) | Soft-deactivate owned opportunity |
| **Applications** | `POST` | `/api/applications` | Protected (Student) | Submit application with duplicate prevention |
| **Applications** | `GET` | `/api/applications/my` | Protected (Student) | View applications submitted by student |
| **Applications** | `GET` | `/api/applications/:id` | Protected (Owner/Recruiter) | View single application details |
| **Applications** | `GET` | `/api/applications/opportunity/:id` | Protected (Recruiter) | View candidate applicant pipeline for opportunity |
| **Applications** | `PUT` | `/api/applications/:id/status` | Protected (Recruiter) | Update candidate status across hiring funnel |

---

## 19. Project Structure

```
SkillBridge/
├── client/                         # React 18 frontend application
│   ├── public/                     # Static public assets
│   ├── src/
│   │   ├── assets/                 # Icons and design assets
│   │   ├── components/             # Reusable UI components
│   │   │   ├── applications/       # ApplicationForm, status steppers
│   │   │   ├── common/             # Badges, Pagination, LoadingSpinner
│   │   │   ├── layout/             # Navbar, Footer
│   │   │   └── opportunities/      # OpportunityCard
│   │   ├── context/                # AuthContext (session state)
│   │   ├── layouts/                # RootLayout (Navbar + Outlet + Footer)
│   │   ├── pages/                  # Page views (code-split via React.lazy)
│   │   │   ├── public/             # Home, Opportunities, Details, Login, Register
│   │   │   ├── recruiter/          # RecruiterDashboard, Manage, Create, Edit, Applicants
│   │   │   └── student/            # StudentDashboard, MyApplications, Details, Profile
│   │   ├── routes/                 # AppRoutes, ProtectedRoute, PublicRoute
│   │   ├── services/               # Axios API client & service wrappers
│   │   ├── styles/                 # Custom CSS design system (index.css)
│   │   ├── App.jsx                 # App root component
│   │   └── main.jsx                # DOM mount entry point
│   ├── .env.example                # Client environment template
│   ├── index.html                  # HTML template
│   ├── package.json                # Client dependencies
│   └── vite.config.js              # Vite configuration
├── server/                         # Express backend API
│   ├── src/
│   │   ├── config/                 # Database connection (db.js)
│   │   ├── controllers/            # auth, user, opportunity, application controllers
│   │   ├── middleware/             # auth, rbac, rateLimiters, upload, sanitize
│   │   ├── models/                 # User, Opportunity, Application Mongoose schemas
│   │   ├── routes/                 # Express route definitions
│   │   ├── utils/                  # jwt utility functions
│   │   ├── app.js                  # Express application setup & middleware assembly
│   │   └── server.js               # HTTP server entry point
│   ├── uploads/resumes/            # Local resume storage directory
│   ├── .env.example                # Server environment template
│   └── package.json                # Server dependencies
├── docs/                           # Project documentation
│   ├── API.md                      # Complete REST API reference
│   └── PORTFOLIO.md                # Architectural case study
├── scratch/                        # Automated PowerShell verification test suites
├── .gitignore                      # Root Git ignore rules
└── README.md                       # Main project documentation
```

---

## 20. Local Setup & Prerequisites

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance (port 27017) OR a MongoDB Atlas cluster URI
- **PowerShell**: For running automated regression test suites on Windows

---

## 21. Environment Variables

### Backend Configuration (`server/.env`)
Copy `server/.env.example` to `server/.env`:
```bash
cp server/.env.example server/.env
```

| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Backend listening port | `5000` |
| `NODE_ENV` | Runtime environment (`development`, `production`, `test`) | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/skillbridge` |
| `JWT_SECRET` | Cryptographically random secret for signing tokens | `your_development_jwt_secret_key` |
| `JWT_EXPIRES_IN` | Token lifespan | `7d` |
| `CLIENT_URL` | Comma-separated allowed frontend origins | `http://localhost:5173,http://127.0.0.1:5173` |
| `AUTH_RATE_LIMIT_MAX` | Optional override for auth rate limiter | `30` |

### Frontend Configuration (`client/.env`)
Copy `client/.env.example` to `client/.env`:
```bash
cp client/.env.example client/.env
```

| Variable | Description | Example / Default |
|---|---|---|
| `VITE_API_URL` | Base URL of the backend API | `http://localhost:5000` |

---

## 22. MongoDB Atlas Setup

To connect to a cloud MongoDB Atlas database:
1. Create a cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Under **Network Access**, add your current IP address (or `0.0.0.0/0` for development).
3. Under **Database Access**, create a user with read/write privileges.
4. Obtain the connection string (`mongodb+srv://<user>:<password>@<cluster>.mongodb.net/skillbridge?retryWrites=true&w=majority`).
5. Assign this string to `MONGODB_URI` in `server/.env`.

---

## 23. Running Frontend

```bash
cd client
npm install
npm run dev
```
The client will start at `http://localhost:5173`.

---

## 24. Running Backend

```bash
cd server
npm install
node src/server.js
```
The API server will start on `http://localhost:5000`.

---

## 25. Testing & Verification

SkillBridge includes 8 automated integration test suites covering all platform capabilities:

```powershell
# Run the complete regression suite (185 tests)
powershell -NoProfile -ExecutionPolicy Bypass -File scratch/run_all_tests.ps1
```

Individual test suites:
- `scratch/test_auth.ps1`: Phase 2 Auth & RBAC (17 tests)
- `scratch/test_phase3_opportunities.ps1`: Phase 3 Opportunities API (21 tests)
- `scratch/test_phase4_applications.ps1`: Phase 4 Applications API (25 tests)
- `scratch/test_phase5_profile_resume.ps1`: Phase 5 Profile & Resume Management (31 tests)
- `scratch/test_phase6_frontend_api.ps1`: Phase 6 Frontend Integration (21 tests)
- `scratch/test_phase7_dashboards.ps1`: Phase 7 Dashboards & Aggregations (20 tests)
- `scratch/test_phase8_security.ps1`: Phase 8 Security Hardening (28 tests)
- `scratch/test_phase8_6_login.ps1`: Phase 8.6 Login & CORS Verification (22 tests)

**Total Verification Baseline**: **185 / 185 tests passing**.

---

## 26. Production Build

To produce an optimized production build of the frontend client:

```bash
cd client
npm run build
```

This compiles optimized assets to `client/dist/` with route-level code splitting:
- Main bundle entry: **~231 kB** (~77 kB gzip)
- 15 independent on-demand page chunks
- Zero build errors or warnings

---

## 27. Deployment Considerations

When deploying SkillBridge to a production environment:
1. **Reverse Proxy**: Serve the backend behind an Nginx reverse proxy with SSL/TLS termination.
2. **Environment**: Set `NODE_ENV=production` on the server to activate strict rate limiting (200 req / 15 min general, 30 req / 15 min auth) and error sanitization.
3. **CORS Configuration**: Configure `CLIENT_URL` to point strictly to the production frontend domain (e.g. `https://skillbridge.example.com`).
4. **File Storage**: While local disk storage works for single-instance deployments, horizontal scaling across multiple container instances requires migrating file uploads to an object storage provider (e.g., AWS S3).
5. **Static File Serving**: In production, serve the compiled `client/dist/` assets via Nginx or a CDN with caching headers.

---

## 28. Current Limitations

- **Local File Storage**: Resume documents are currently saved on the server's local disk rather than an external object storage service.
- **REST Status Updates**: Status transitions are API-driven; candidate status changes do not push live to other browser sessions without page refresh or API query.
- **Credentials**: Authentication is currently limited to email and password credentials.

---

## 29. Future Improvements

- **Cloud Object Storage**: Direct integration with AWS S3 or Cloudinary with pre-signed upload URLs.
- **Google Sign-In / OAuth 2.0**: Third-party Google authentication alongside email/password login.
- **Transactional Notifications**: Automated email notifications (SendGrid / AWS SES) when candidate applications transition status.
- **Live Updates**: WebSocket integration for real-time recruiter applicant streams and notifications.
- **Interactive Admin Dashboard**: Dedicated portal for platform administrators to manage users and view system metrics.

---

## 30. Portfolio & Engineering Highlights

- **Clean Architecture**: Complete separation of concerns between presentation, business logic, authorization, and persistence.
- **Data Integrity by Design**: MongoDB compound unique index guarantees zero duplicate applications under concurrency.
- **Security-First Engineering**: Layered defenses against ReDoS, NoSQL query injection, brute-force credential attacks, and path traversal.
- **Accessible & Responsive**: High-contrast custom design system with semantic HTML, fluid layouts, and `prefers-reduced-motion` support.
- **185 Verified Assertions**: Full test harness testing real HTTP endpoints, JWT validation, role transitions, and error handling.
