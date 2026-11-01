# GrievanceOps — Internal Service & Grievance Resolution Platform

A production-grade, collaborative internal operations, task-routing, and grievance resolution platform designed for engineering teams and modern organizations. Built with **React 18**, **Tailwind CSS** (Linear/Raycast aesthetic), **Node.js/Express**, **MongoDB/Mongoose**, **JWT**, and **bcryptjs**.

---

## 🔑 Initial Root Administrator Credentials

When the system boots for the first time, it automatically verifies and provisions the root administrative authority account:

| Field | Initial Root Credential |
|---|---|
| **Email** | `admin@mail.com` |
| **Password** | `admin@123` |
| **Designation** | CEO / System Administrator (`Executive` Department) |

> **All subsequent users, teams, issues, and departmental workflows are provisioned dynamically by this user through the portal.** There are no mock role-switchers or artificial demo seed scripts.

---

## 🎯 Core Architectural Features

### 1. Strict Step-by-Step Escalation & Scoped Action Buttons
* **Sequential Tier-by-Tier Escalation:**
  * **Level 1 (Representative / Engineer) $\rightarrow$ Level 2 (Team Lead) $\rightarrow$ Level 3 (Department Manager).**
  * Engineers and L1 Representatives can only escalate to Level 2.
  * Only Level 2 Team Leads can escalate to Level 3.
  * Direct jumping to Level 3 is strictly prevented by the API and UI.
* **Stage-Scoped Action Authorization:**
  * Action controls (`Resolve`, `Reject`, `In Progress`, `Escalate`) are enabled **only** for tickets matching the logged-in user's authorized stage tier.
  * Tickets outside the user's tier are displayed in a clean `Read Only` state.

### 2. Dedicated "My Workspace" Resolver Tab
* Clearly separated from **"My Raised Tickets"** (which tracks grievances logged *by* the user).
* **"My Workspace"** displays only the queries assigned specifically to the logged-in engineer to investigate and resolve (`assignedTo === user._id`).
* Provides rapid action triggers (`Resolve`, `Reject`, `Mark In Progress`, `Escalate to Next Tier`) with mandatory audit rationale notes.

### 3. Cascading Deletion & Automatic Team Dissolution
* **Cascading Cleanup on User Removal (`DELETE /api/users/:id`):**
  * When a staff member is deleted by the CEO, all queries submitted by that user are cascade-deleted (`Ticket.deleteMany({ submittedBy: userId })`).
  * The user is removed from `assignedTo` fields and from any team's `members` array.
* **Auto-Dissolve Empty Teams:**
  * If a team's membership drops to 0 as a result of user removals, the `Team` document is automatically deleted from MongoDB.
* **Manual Team Dissolution (`DELETE /api/teams/:id`):**
  * Department Managers have an explicit red **"Delete Team"** control in the Team Analytics dashboard that unassigns the `teamId` from its members and dissolves the team.

### 4. CEO Level: Department-Grouped Accordion View
* All organization queries are grouped by **Department** (Backend, Frontend, DevOps, QA, Infrastructure, HR & Operations, Executive).
* Displays live metric summaries per department: total tickets, critical blockers (with pulsing badges), moderate count, and resolved count.
* Collapsible accordions allow executive drill-down into specific departmental queues.

### 5. Manager Level: Team-Grouped Queue & Unassigned Section
* Department queries are mapped directly to their assigned **Teams** (with lead name, member counts, and team resolution stats).
* Unallocated departmental queries sit in a dedicated **"Unassigned Team Queue"** awaiting lead or member allocation.

---

## 📁 Project Architecture

```
feedback/
├── server/
│   ├── controllers/
│   │   ├── userController.js     # User provisioning, cascading delete & team auto-dissolution
│   │   ├── teamController.js     # Team creation, manual dissolution & analytics
│   │   └── ticketController.js   # Step-by-step escalation, my-workspace & grouped queues
│   ├── middleware/
│   │   └── auth.js               # JWT verification & role guard
│   ├── models/
│   │   ├── User.js               # User schema with bcrypt pre-save hook & comparePassword
│   │   ├── Team.js               # Departmental team schema (Lead, Manager, Members)
│   │   └── Ticket.js             # Issue schema with teamId & audit trail history
│   ├── server.js                 # Express server & route wiring
│   ├── .env                      # Environment variables (PORT, MONGO_URI, DB_NAME, JWT_SECRET)
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   └── MyWorkspace.jsx   # Dedicated resolver queue for assigned queries
│   │   ├── App.jsx               # GrievanceOps UI (Tabs, Modals, Drawers, Grouped Views)
│   │   ├── main.jsx              # React root mount
│   │   └── index.css             # Tailwind directives & Inter typography
│   ├── index.html                # GrievanceOps metadata & Inter font
│   ├── vite.config.js            # API proxy to backend
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

---

## 🚀 Running the Project Locally

### 1. Backend Server Setup
```powershell
cd h:\feedback\server
npm install
npm run dev
# Server runs on http://localhost:5000
```

### 2. Frontend Client Setup
In a new terminal:
```powershell
cd h:\feedback\client
npm install
npm run dev
# Vite dev server runs on http://localhost:3000
```

### 3. Usage & Demonstration Guide
1. Open **`http://localhost:3000`**.
2. Sign in with the root credentials:
   * **Email:** `admin@mail.com`
   * **Password:** `admin@123`
3. Navigate to **"Staff Directory"** tab:
   * Provision your managers, team leads, representatives, and engineers.
4. Test the collaborative resolver workflow:
   * Log in as an engineer and click **"+ Raise Issue"** targeting a department (e.g. `Backend` or `DevOps`).
   * Log in as the assigned engineer: open the **"My Workspace"** tab to see your assigned blocker.
   * Mark it `In Progress`, `Resolve` it, or sequentially `Escalate to Level 2`.
   * Log in as the Team Lead: triage the Level 2 ticket and escalate to `Level 3 (Manager)` if required.
   * Log in as the Department Manager: dissolve teams via the trash icon or resolve Level 3 issues.
   * Log in as CEO: view the **"Analytics & Management"** tab to see all issues grouped by department with accordion summaries.

---

## 🔌 API Endpoints Reference

### Authentication
* `POST /api/auth/login` — Authenticate email & password, returns JWT token + user profile.
* `POST /api/auth/register` — Self-registration for employees.
* `GET /api/auth/me` — Retrieve currently logged-in user profile from token.

### Staff & User Management (CEO / Admin)
* `GET /api/users` — Directory of active staff members.
* `POST /api/users` — Provision a new employee with designated role and department.
* `DELETE /api/users/:id` — Cascading deletion of user, submitted tickets, and auto-dissolving empty teams.

### Teams & Analytics
* `GET /api/teams` — List all organization teams.
* `POST /api/teams` — Create a team with assigned Lead and members.
* `DELETE /api/teams/:id` — Dissolve team manually and unassign member `teamId`s.
* `GET /api/teams/manager-stats` — Team resolution metrics.
* `GET /api/teams/lead-stats` — Member workload breakdown.

### Tickets & Issue Resolution
* `POST /api/tickets` — Raise an issue/blocker to a target department (Universal).
* `GET /api/tickets/my-tickets` — Issues raised *by* current user.
* `GET /api/tickets/my-workspace` — Dedicated queue of issues assigned *to* current user.
* `GET /api/tickets/workspace` — Incoming department queue for triage.
* `GET /api/tickets/escalated` — Level 3 escalated tickets (Managers / CEO).
* `GET /api/tickets/grouped-by-dept` — CEO view: All tickets grouped by department.
* `GET /api/tickets/grouped-by-team` — Manager view: Department tickets grouped by team.
* `PATCH /api/tickets/:id/action` — Scoped step-by-step escalation, resolution, and rejection.
