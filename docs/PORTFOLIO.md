# SkillBridge — Architectural & Engineering Case Study

An in-depth portfolio review of the engineering decisions, architecture, and security design behind SkillBridge.

---

## 1. Executive Summary & Problem Space

Early-career recruitment processes often suffer from fragmentation: students submit resumes into opaque corporate ATS portals without status visibility, while university recruiters navigate sprawling email inboxes or rigid enterprise software poorly suited for campus hiring.

**SkillBridge** addresses this friction by providing a structured, bi-directional career platform:
- **For Students**: A transparent hub to curate academic credentials, manage a verified resume, discover internships and full-time positions via faceted search, submit structured applications, and track application progression across a 6-stage lifecycle.
- **For Recruiters**: An organized dashboard to publish role requirements, inspect structured applicant portfolios, review uploaded resumes, and progress candidate applications through an API-driven hiring workflow.

---

## 2. System Architecture & Component Separation

SkillBridge is built as a decoupled, multi-tiered client-server system:

```
┌─────────────────────────────────────────────────────────────────┐
│                       Client Layer (SPA)                        │
│   React 18 + Vite | React Router DOM v6 | Axios | Custom CSS     │
│   - Route-Level Code Splitting (React.lazy + Suspense)          │
│   - Client-side Session State (AuthContext + localStorage)      │
│   - Role-Based Route Guards (ProtectedRoute & PublicRoute)      │
└───────────────────────────────┬─────────────────────────────────┘
                                │ JSON Over HTTP/REST
                                │ Authorization: Bearer <JWT>
┌───────────────────────────────▼─────────────────────────────────┐
│                      Server Layer (REST API)                    │
│   Node.js + Express | Helmet | CORS | express-rate-limit        │
│   - Security Layer: NoSQL sanitization, ReDoS regex escaping    │
│   - Auth Layer: bcrypt password hashing, stateless JWT signing │
│   - RBAC & Ownership: Fine-grained resource access guards       │
│   - File Engine: Multer with MIME verification & path hygiene   │
└───────────────────────────────┬─────────────────────────────────┘
                                │ Mongoose ODM
┌───────────────────────────────▼─────────────────────────────────┐
│                      Data Layer (MongoDB)                       │
│   MongoDB Atlas / Local MongoDB 7.0                             │
│   - Users (Credentials, Profile, Embedded Resume Metadata)     │
│   - Opportunities (Postings, Filters, Soft-deactivation state)  │
│   - Applications (Compound unique index, status audit trail)    │
└─────────────────────────────────────────────────────────────────┘
```

### Architectural Principles
1. **Decoupled Client & Server**: Complete separation between frontend presentation and backend API logic. The backend operates strictly as a headless JSON REST API.
2. **Stateless Authorization**: Eliminates server-side session memory locks; authentication is verified per-request using standard JWT Bearer tokens.
3. **Defense in Depth**: Security validations exist independently at the routing, middleware, controller, and database schema layers.

---

## 3. Data Modeling & Database Design

The data layer uses MongoDB via Mongoose schemas structured to enforce data integrity:

### 3.1 User Schema (`server/src/models/User.js`)
- **Roles**: Enforces an explicit role enum: `student`, `recruiter`, `admin`.
- **Credential Protection**: The `password` field is configured with `select: false` so user queries omit hash values by default unless explicitly requested during authentication.
- **Pre-Save Hashing**: Uses `bcryptjs` with 10 salt rounds executed via Mongoose pre-save hooks, ensuring passwords are never stored in plaintext.
- **Embedded Resume Metadata**: Resume information (filename, path, MIME type, upload timestamp) is embedded directly into the user document, ensuring zero join overhead when inspecting applicant profiles.

### 3.2 Opportunity Schema (`server/src/models/Opportunity.js`)
- **Indexes**: Indexed on `recruiter`, `type`, `workMode`, and `createdAt` for performant faceted queries.
- **Soft Deactivation**: Employs an `isActive: Boolean` flag. Deletion triggers a soft deactivation (`isActive = false`), preserving referential integrity for historic applications.

### 3.3 Application Schema (`server/src/models/Application.js`)
- **Duplicate Prevention Guarantee**: Enforced via a unique compound index:
  ```javascript
  ApplicationSchema.index({ student: 1, opportunity: 1 }, { unique: true });
  ```
  This database-level constraint makes it physically impossible for race conditions or duplicate clicks to generate duplicate applications.
- **Auditing**: Records both `createdAt` and `statusUpdatedAt` timestamps to track candidate progression velocity.

---

## 4. Authentication, Token Lifecycle & RBAC

### 4.1 Token Storage & Header Authorization
- **Client Storage**: Upon login/registration, the client stores the signed JWT in `localStorage` under the key `skillbridge_token`.
- **Request Transport**: An Axios request interceptor attaches the token as an `Authorization: Bearer <token>` header to all outgoing requests.
- **Session Rehydration**: On application mount or browser reload, `AuthContext` queries `GET /api/auth/me` with the stored token to populate the user profile and role state.
- **Token Invalidation**: When logging out or receiving an `HTTP 401 Unauthorized` response on a protected route, the client strips the token from `localStorage` and resets authentication state.

### 4.2 Role-Based Access Control (RBAC) & Ownership Verification
SkillBridge implements two distinct layers of access control:
1. **Role Gating (`requireRole`)**: Middleware that validates whether `req.user.role` matches allowed roles (e.g. `['recruiter', 'admin']` or `['student']`).
2. **Resource Ownership Gating**:
   - **Opportunities**: A recruiter can only update or deactivate an opportunity if `opportunity.recruiter.toString() === req.user._id.toString()`.
   - **Applications**: A student can only view their own submissions; a recruiter can only view applicants and update statuses for opportunities they personally authored. Cross-recruiter applicant inspection returns `HTTP 403 Forbidden`.

---

## 5. Security Engineering & Hardening (Phase 8)

The application incorporates a defense-in-depth posture:

### 5.1 NoSQL Operator Injection Sanitization
Express query parameters and request bodies are recursively inspected via custom sanitization middleware that strips keys containing MongoDB operators (`$` or `.`), preventing JSON query injection attacks such as `{ "email": { "$ne": null } }`.

### 5.2 Regular Expression Denial of Service (ReDoS) Defense
User search input in `GET /api/opportunities?search=...` is sanitized using regex escaping before constructing MongoDB RegExp queries:
```javascript
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
```
This neutralizes catastrophic backtracking payloads that could stall the Node.js event loop.

### 5.3 HTTP Security Headers (Helmet)
Configured with strict Content Security Policy (CSP), Cross-Origin-Resource-Policy (`same-origin`), and `X-Content-Type-Options: nosniff`.

### 5.4 Environment-Calibrated Rate Limiting
Configured using `express-rate-limit`:
- **Production (`NODE_ENV=production`)**:
  - General API: **200 req / 15 min**
  - Authentication (`/api/auth/*`): **30 req / 15 min**
  - Resume Uploads (`/api/users/resume`): **20 uploads / 15 min**
- **Development (`NODE_ENV=development`)**:
  - Calibrated higher (1,000 general, 500 auth) to allow local development and comprehensive test suites to execute without false-positive lockouts.

### 5.5 Secure Resume File Upload Handling
- **Type Whitelisting**: Restricts uploads strictly to `.pdf` and `.docx` using Multer fileFilter checking both extension and MIME type.
- **Size Limitation**: Rejects payloads exceeding 5 MB with `HTTP 400 Bad Request`.
- **Path Traversal Protection**: File downloads and deletions use `path.basename()` to strip directory navigation tokens (`../`) before resolving paths.

---

## 6. Frontend Engineering & Performance

### 6.1 Route-Level Code Splitting
The React client utilizes `React.lazy` and `React.Suspense` to split all 15 page components into dedicated dynamic chunks.
- Initial bundle entry reduced from ~340 kB to **231 kB** (~32% reduction).
- Lazy chunks load on-demand with an accessible `<LoadingSpinner />` fallback.

### 6.2 Responsive & Accessible Design
- Built entirely with responsive layout patterns (`grid`, `flexbox`, fluid typography) tested across viewports from 375px mobile to 1280px+ desktop.
- High-contrast dark-slate palette (`#0a0e17` canvas, `#111827` surface, vibrant indigo/cyan accents).
- Explicit `prefers-reduced-motion: reduce` CSS media queries disable keyframe animations and transitions for users with vestibular sensitivities.
- Semantic HTML form controls, `<label>` associations, and ARIA attributes on modals and interactive controls.

---

## 7. Testing & Verification Methodology

The test harness consists of 8 comprehensive PowerShell integration test suites executing **185 end-to-end assertions** against the running HTTP server and database:

| Suite | Focus Area | Assertions | Result |
|---|---|:---:|:---:|
| `test_auth.ps1` | Auth, JWT issuance, password hashing, RBAC | 17 / 17 | ✅ Passed |
| `test_phase3_opportunities.ps1` | Opportunity CRUD, search, pagination, soft deactivation | 21 / 21 | ✅ Passed |
| `test_phase4_applications.ps1` | Submissions, duplicate prevention, status transitions | 25 / 25 | ✅ Passed |
| `test_phase5_profile_resume.ps1` | Profile updates, resume upload/download/deletion | 31 / 31 | ✅ Passed |
| `test_phase6_frontend_api.ps1` | Frontend-backend API integration contracts | 21 / 21 | ✅ Passed |
| `test_phase7_dashboards.ps1` | Role dashboards, metric aggregations, partial failures | 20 / 20 | ✅ Passed |
| `test_phase8_security.ps1` | NoSQL injection, ReDoS, Helmet, rate limits, CORS | 28 / 28 | ✅ Passed |
| `test_phase8_6_login.ps1` | End-to-end login, credentials, CORS loopback | 22 / 22 | ✅ Passed |
| **Total** | **Complete System Regression Baseline** | **185 / 185** | **100% Passed** |

---

## 8. Current Limitations & Future Roadmap

To maintain engineering integrity, current architectural boundaries are documented honestly:

### Current Limitations
1. **Local Filesystem Resume Storage**: Resumes are currently stored on the local server disk (`server/uploads/resumes/`). While suitable for single-instance development and testing, horizontal scaling requires object storage.
2. **Polled / API-Driven Status Updates**: Application status updates are fetched via standard REST API calls; status changes do not push live to other browser tabs automatically.
3. **Authentication Method**: Supports email/password credentials only.

### Planned Future Roadmap
- **Cloud Object Storage**: Transition resume storage from local filesystem to AWS S3 or Cloudinary with pre-signed URLs.
- **Google OAuth 2.0**: Add third-party Google Sign-In / Sign-Up alongside email/password credentials.
- **Email Notifications**: Trigger automated transactional emails (SendGrid / AWS SES) when application statuses transition (e.g. `Shortlisted`, `Interview`).
- **WebSockets / Live Updates**: Introduce real-time push updates for recruiters reviewing active applicant streams.
