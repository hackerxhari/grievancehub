# GrievanceOps

> **Enterprise Operations, Intra-Organizational Task Routing & Grievance Resolution Platform**

[![Stack](https://img.shields.io/badge/Stack-MERN-black?style=flat-square)](#tech-stack)
[![React](https://img.shields.io/badge/React-18.3-blue?style=flat-square&logo=react)](https://react.dev/)
[![Node](https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey?style=flat-square&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Security](https://img.shields.io/badge/Auth-JWT%20%7C%20bcryptjs-red?style=flat-square)](#security--authorization)
[![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)](LICENSE)

**GrievanceOps** is a production-grade internal service desk and issue-orchestration system built for engineering teams, IT infrastructure, operations, and corporate cross-functional departments. It replaces disconnected email threads and ad-hoc communication with structured ticket routing, sequential hierarchical escalations, role-scoped triaging, and real-time team workload transparency.

---

## Table of Contents

- [Core Capabilities](#core-capabilities)
- [System Architecture](#system-architecture)
- [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
- [Workflow & Escalation Engine](#workflow--escalation-engine)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [Installation & Execution](#installation--execution)
- [Initial System Initialization](#initial-system-initialization)
- [API Reference](#api-reference)
- [Database Models](#database-models)
- [Security Architecture](#security-architecture)

---

## Core Capabilities

- **Universal Employee Foundation:** Every user is recognized as an organizational employee first. Higher designations (Team Lead, Manager, CEO) act as additive authority layers without removing baseline capabilities (e.g., submitting personal issues or monitoring individual tickets).
- **Strict Sequential Escalation Engine:** Enforces tier-by-tier progression (**Level 1 $\rightarrow$ Level 2 $\rightarrow$ Level 3**). Bypassing organizational hierarchies is strictly barred at both the API and client interface levels.
- **Stage-Scoped Triage Authority:** Action controls (`Resolve`, `Reject`, `Mark In Progress`, `Escalate`) are enabled only when a ticket's active bottleneck matches the authenticated user's permission level. Non-authorized viewers maintain read-only audit visibility.
- **Dedicated Resolver Workspace:** Segregates issues raised *by* an employee from issues assigned *to* that employee, providing a focused, uncluttered queue for task execution.
- **Cascading Resource Lifecycle Management:** Removing a user account automatically initiates cascading cleanup—removing raised tickets, unlinking assigned tasks, and auto-dissolving any departmental team left with zero members.
- **Executive & Managerial Grouped Analytics:**
  - **CEO Dashboard:** Aggregates organization-wide blockers into collapsible departmental modules with real-time priority distribution.
  - **Manager Dashboard:** Maps departmental tickets directly to assigned sub-teams, providing an unassigned queue for unallocated work and single-click team dissolution controls.
- **Immutable Audit History:** Every status transition, priority adjustment, escalation, and resolution note is permanently appended to a tamper-resistant document audit trail with ISO timestamps and user attribution.

---

## System Architecture

```
                                  +-----------------------------+
                                  |   Client Layer (React 18)   |
                                  | Tailwind CSS | Lucide Icons |
                                  +--------------+--------------+
                                                 |
                                     HTTPS / JSON / Bearer JWT
                                                 |
                                                 v
                                  +-----------------------------+
                                  |    Express.js Application   |
                                  |  CORS | JSON Parser | Auth  |
                                  +--------------+--------------+
                                                 |
                   +-----------------------------+-----------------------------+
                   |                             |                             |
                   v                             v                             v
        +---------------------+       +---------------------+       +---------------------+
        |   userController    |       |   teamController    |       |  ticketController   |
        | - CRUD Users        |       | - Provision Teams   |       | - Ingestion & Route |
        | - Cascade Deletion  |       | - Auto-Dissolution  |       | - Strict Escalation |
        | - RBAC Provisioning |       | - Workload Metrics  |       | - Scoped Triage     |
        +----------+----------+       +----------+----------+       +----------+----------+
                   |                             |                             |
                   +-----------------------------+-----------------------------+
                                                 |
                                        Mongoose ODM (v8)
                                                 |
                                                 v
                                  +-----------------------------+
                                  |       MongoDB Database      |
                                  |   Users | Teams | Tickets   |
                                  +-----------------------------+
```

---

## Role-Based Access Control (RBAC)

| Role Identifier | System Designation | Scope & Permissions |
|---|---|---|
| `employee` | General Staff / Engineer | Log grievances, track personal submissions, resolve assigned direct tickets. |
| `representative` | Representative (Level 1) | Frontline department triage: resolve, reject, or escalate to Level 2. |
| `team_lead` | Team Lead (Level 2) | Manage team workload, triage Level 2 escalated issues, escalate to Level 3. |
| `manager` | Department Manager (Level 3) | Oversee department queues, resolve Level 3 issues, provision/dissolve teams. |
| `ceo` | Executive / Global Admin | Global authority: full directory governance, staff provisioning, system-wide metrics. |

---

## Workflow & Escalation Engine

```
[ Employee Logs Ticket ]
           |
           v
+----------------------+
| Stage 1: Level 1 Rep | -----> [ Action: RESOLVE / REJECT ] -----> (Closed / Archived)
+----------+-----------+
           | (Escalate)
           v
+----------------------+
| Stage 2: Team Lead   | -----> [ Action: RESOLVE / REJECT ] -----> (Closed / Archived)
+----------+-----------+
           | (Escalate)
           v
+----------------------+
| Stage 3: Dept Mgr    | -----> [ Action: RESOLVE / REJECT ] -----> (Closed / Archived)
+----------------------+
```

1. **Submission:** An employee raises a ticket specifying title, context, target department, and priority (`Critical`, `Moderate`, `Normal`).
2. **Initial Routing:** The ticket enters Stage 1 and is auto-routed to an active Representative or Team Lead in the designated department.
3. **Escalation Protocol:**
   - **L1 $\rightarrow$ L2:** If a frontline representative cannot clear the blocker, they record mandatory audit notes and escalate to Level 2. The ticket re-assigns to the department Team Lead.
   - **L2 $\rightarrow$ L3:** If higher administrative or resource clearance is required, the Team Lead escalates to Level 3. The ticket re-assigns to the Department Manager.
   - **Terminal Stage:** Level 3 tickets cannot be escalated further and must be cleared or rejected by the Department Manager or CEO.

---

## Tech Stack

### Frontend
- **Framework:** React 18 (Hooks, Functional Components, Strict Mode)
- **Styling:** Tailwind CSS (Minimalist Zinc / Slate palette, responsive layouts)
- **Typography:** Inter (`-apple-system`, `sans-serif`)
- **Icons:** Lucide React
- **HTTP Client:** Axios with dynamic bearer authentication interceptors
- **Build Tool:** Vite 5 (Fast Refresh, optimized chunk generation)

### Backend
- **Runtime Environment:** Node.js (v18.0.0 or higher)
- **Framework:** Express.js (RESTful API architecture)
- **Database Engine:** MongoDB (Local or Atlas Cloud)
- **Object Data Modeling:** Mongoose ODM (Schemas, Hooks, Population)
- **Security:** `bcryptjs` (Salt factor 10), `jsonwebtoken` (Stateless HMAC SHA256)
- **Configuration:** Dotenv

---

## Project Structure

```
grievanceops/
├── server/
│   ├── controllers/
│   │   ├── userController.js        # Staff provisioning & cascading deletion
│   │   ├── teamController.js        # Team lifecycle & workload aggregation
│   │   └── ticketController.js      # Ticket ingestion, triage & escalation
│   ├── middleware/
│   │   └── auth.js                  # Bearer token verification & RBAC guard
│   ├── models/
│   │   ├── User.js                  # User schema with bcrypt pre-save hashing
│   │   ├── Team.js                  # Team organizational hierarchy schema
│   │   └── Ticket.js                # Issue schema with audit history sub-documents
│   ├── .env                         # Server environment configuration
│   ├── .env.example                 # Template environment variables
│   ├── package.json                 # Backend dependencies & scripts
│   └── server.js                    # Express bootstrap & database connection
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   └── MyWorkspace.jsx      # Dedicated resolver workspace
│   │   ├── App.jsx                  # Primary dashboard shell & navigation
│   │   ├── index.css                # Tailwind directives & global styling
│   │   └── main.jsx                 # React root DOM mounting
│   ├── index.html                   # HTML template & OpenGraph metadata
│   ├── package.json                 # Frontend dependencies & scripts
│   ├── tailwind.config.js           # Tailwind theme configuration
│   └── vite.config.js               # Vite build & reverse proxy configuration
├── .gitignore                       # Git exclusion rules
└── README.md                        # Project documentation
```

---

## Getting Started

### Prerequisites

Ensure the following runtimes are installed on your workstation:
- **Node.js** (v18.0.0 or later)
- **npm** (v9.0.0 or later)
- **MongoDB** (A local instance running on port `27017` or a connection URI for MongoDB Atlas)

---

### Environment Configuration

Configure the backend environment file inside `server/.env`:

```env
# Network Configuration
PORT=5000

# Database Connection (Local instance or MongoDB Atlas connection string)
MONGO_URI=mongodb://127.0.0.1:27017/grievanceops
DB_NAME=grievanceops

# JWT Cryptographic Signature
JWT_SECRET=your_secure_random_jwt_secret_key_here
JWT_ISSUER=grievanceops
```

A template configuration is provided in `server/.env.example`.

---

### Installation & Execution

#### 1. Setup Backend Services

```powershell
cd server
npm install
npm run dev
```

*The Express server initializes on `http://localhost:5000`.*

#### 2. Setup Frontend Application

Open a second terminal window:

```powershell
cd client
npm install
npm run dev
```

*The Vite development server boots on `http://localhost:3000` with automated reverse-proxying of `/api` requests to port `5000`.*

---

## Initial System Initialization

When the backend server establishes its initial connection to an empty database, it automatically generates the primary administrative authority account:

| Configuration Key | Initial Value |
|---|---|
| **Access URL** | `http://localhost:3000` |
| **Administrative Email** | `admin@mail.com` |
| **Initial Password** | `admin@123` |
| **Default Authority** | CEO / Global Administrator |
| **Designated Department** | `Executive` |

Upon first signing in, navigate to **Staff Directory** to provision organizational staff members across technical departments (e.g., *Backend, Frontend, DevOps, QA, Infrastructure, HR & Operations*).

---

## API Reference

### Authentication Endpoints

| HTTP Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticates credentials and issues signed JWT bearer token. |
| `POST` | `/api/auth/register` | Public | Self-registration endpoint for entry-level staff. |
| `GET` | `/api/auth/me` | Authenticated | Retrieves current authenticated profile from request token. |

### Staff Directory & Governance

| HTTP Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `GET` | `/api/users` | Authenticated | Retrieves directory of all active organization staff. |
| `POST` | `/api/users` | Admin (`ceo`) | Dynamically provisions a new user with designated role and department. |
| `DELETE` | `/api/users/:id` | Admin (`ceo`) | Executes cascading deletion of user, submitted tickets, and empty teams. |

### Team Structure & Workload Analytics

| HTTP Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `GET` | `/api/teams` | Authenticated | Returns all established organizational teams. |
| `POST` | `/api/teams` | Manager / CEO | Creates a team, designating a Lead and member user IDs. |
| `DELETE` | `/api/teams/:id` | Manager / CEO | Dissolves team document and unlinks member references. |
| `GET` | `/api/teams/manager-stats` | Manager / CEO | Aggregates team-level performance, resolution ratios, and pending counts. |
| `GET` | `/api/teams/lead-stats` | Lead / Manager | Workload distribution metrics for members under a specific Team Lead. |

### Ticket Routing & Triage

| HTTP Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `POST` | `/api/tickets` | Authenticated | Submits an operational blocker or grievance to a target department. |
| `GET` | `/api/tickets/my-tickets` | Authenticated | Fetches tickets submitted by the authenticated user. |
| `GET` | `/api/tickets/my-workspace` | Authenticated | Fetches tickets assigned directly to the authenticated user for resolution. |
| `GET` | `/api/tickets/workspace` | Authenticated | Fetches department-level ticket queue. |
| `GET` | `/api/tickets/escalated` | Manager / CEO | Returns Level 3 escalated tickets sorted by urgency and SLA age. |
| `GET` | `/api/tickets/grouped-by-dept`| Admin (`ceo`) | Returns all tickets grouped by Department with priority metrics. |
| `GET` | `/api/tickets/grouped-by-team`| Manager / CEO | Returns department tickets grouped by Team plus an unassigned queue. |
| `PATCH`| `/api/tickets/:id/action` | Scoped RBAC | Executes status transition (`RESOLVE`, `REJECT`, `IN_PROGRESS`, `ESCALATE`). |

---

## Database Models

### User Schema (`User.js`)
- `name` (String, required, trimmed)
- `email` (String, required, unique, lowercase, indexed)
- `password` (String, required, `select: false`, hashed with bcrypt salt rounds = 10)
- `role` (String, enum: `['ceo', 'manager', 'team_lead', 'representative', 'employee']`, default: `'employee'`)
- `department` (String, required, default: `'Engineering'`)
- `teamId` (ObjectId, ref: `'Team'`, default: `null`)
- `isActive` (Boolean, default: `true`)
- Timestamps (`createdAt`, `updatedAt`)

### Team Schema (`Team.js`)
- `name` (String, required, trimmed)
- `department` (String, required)
- `managerId` (ObjectId, ref: `'User'`, required)
- `teamLeadId` (ObjectId, ref: `'User'`, default: `null`)
- `members` ([ObjectId], ref: `'User'`)
- Timestamps (`createdAt`, `updatedAt`)

### Ticket Schema (`Ticket.js`)
- `title` (String, required, trimmed)
- `description` (String, required)
- `department` (String, required)
- `teamId` (ObjectId, ref: `'Team'`, default: `null`)
- `priority` (String, enum: `['Critical', 'Moderate', 'Normal']`, default: `'Normal'`)
- `status` (String, enum: `['Submitted', 'Under Review', 'Resolved', 'Rejected']`, default: `'Submitted'`)
- `currentStageLevel` (Number, enum: `[1, 2, 3]`, default: `1`)
- `submittedBy` (ObjectId, ref: `'User'`, required)
- `assignedTo` (ObjectId, ref: `'User'`, default: `null`)
- `imageUrl` (String, default: `''`)
- `adminRemarks` (String, default: `''`)
- `auditTrail` (Array of Sub-documents):
  - `action` (String, required)
  - `updatedBy` (ObjectId, ref: `'User'`)
  - `updatedByName` (String)
  - `notes` (String)
  - `stageLevel` (Number)
  - `timestamp` (Date, default: `Date.now`)
- `resolvedAt` (Date, default: `null`)
- Timestamps (`createdAt`, `updatedAt`)

---

## Security Architecture

1. **Cryptographic Storage:** Passwords undergo one-way cryptographic hashing via `bcryptjs` using 10 salt rounds executed in Mongoose `pre('save')` lifecycle middleware. Plaintext credentials are never committed to storage or returned in database queries (`select: false`).
2. **Stateless Authentication:** User authorization is verified via cryptographically signed JSON Web Tokens (`HS256`) passed via the HTTP standard `Authorization: Bearer <token>` header.
3. **Additive Privilege Model:** All system actors inherit baseline employee rights. Administrative tiers introduce authorization overrides without disconnecting higher-tier users from basic staff functions.
4. **Data Isolation & Input Sanitization:** Express middleware trims and sanitizes incoming string payloads, and MongoDB queries utilize parameterized Mongoose models to guard against injection vectors.

---

## License

This project is licensed under the [MIT License](LICENSE).
