# Student Task Management System — Project Context

Full-stack web app where students manage their own academic/personal tasks. It is a **vibe-coding practice project**: the goal is learning to build with AI step by step, not just getting a finished app.

Source of truth: [Student_Task_Management_System_SRS_Vibe_Coding.md](Student_Task_Management_System_SRS_Vibe_Coding.md). If this file and the SRS disagree, the SRS wins.

Module-wise implementation plan: [plan/00-implementation-plan.md](plan/00-implementation-plan.md), with one document per module (01–09) in [plan/](plan/). Before working on a module, read its document. Production-level test cases (with IDs and priorities) for every module are in [test-cases/](test-cases/00-test-strategy.md). A module is done only when its P0 and P1 cases pass.

## Current status

- Modules 1–7 are implemented (backend API + frontend). Module 8 backend tests are written and need a local `task_manager_test` DB to run. Module 9 README and `docs/API.md` are drafted.
- Still to do: run migrations and `npm test` against real databases, the manual end-to-end pass, the review in `docs/review-findings.md` (module 8 Part C/D), screenshots, and per-module commits.
- **Tech stack (decided):** React 19 + Vite + React Router + Tailwind (JavaScript) | Node.js + Express 5 (JavaScript, ES modules) | PostgreSQL with `pg` and plain SQL | `zod` validation | JWT (`jsonwebtoken`) + `bcryptjs` | Vitest + Supertest.

## How to work in this repo (vibe-coding rules from the SRS)

- **Do not build the whole app in one go.** Work one module at a time: architecture → DB schema → auth → task APIs → frontend → review → fix.
- **Explain the plan first, then write code**, especially for a new module. When the user says "do not write code yet", don't.
- **Don't modify unrelated modules.** When fixing review findings, fix only those issues and say what changed and why.
- Reviews come before fixes: list the issues (security, authorization, validation, error handling, performance, code quality), then wait.
- Keep code simple enough that the student can explain and maintain it without AI.
- Suggest small, focused git commits (e.g. "Add authentication", "Add task APIs", "Add search and filters").

## Target repo layout

```
frontend/
backend/        # layered: routes → controllers → services → validation → DB layer
README.md
.env.example    # DATABASE_URL, JWT_SECRET, API_URL, PORT — real .env never committed
docs/
```

## Domain

**User** (Student): register, login, logout, and full CRUD on **only their own** tasks.

**Task fields**
| Field | Required | Values |
|---|---|---|
| title | yes | non-empty |
| description | no | text |
| priority | yes | `LOW` / `MEDIUM` / `HIGH` |
| status | yes | `TODO` / `IN_PROGRESS` / `COMPLETED` |
| due_date | no | date |
| created_at / updated_at | auto | update `updated_at` on every edit |

**Database (relational)**
- `users`: id, name, email (unique), password (hashed), created_at, updated_at
- `tasks`: id, user_id (FK → users.id), title, description, priority, status, due_date, created_at, updated_at
- One user → many tasks.

## API

| Method | Endpoint | Auth |
|---|---|---|
| POST | `/api/auth/register` | no |
| POST | `/api/auth/login` | no |
| GET | `/api/tasks` (search, filter, sort via query params) | yes |
| GET | `/api/tasks/:id` | yes |
| POST | `/api/tasks` | yes |
| PUT | `/api/tasks/:id` | yes |
| DELETE | `/api/tasks/:id` | yes |
| PATCH | `/api/tasks/:id/status` | yes |

Response format:
```json
{ "success": true, "message": "Task created successfully", "data": {} }
{ "success": false, "message": "Task not found" }
```

## Features

- **Register**: name, email, password required; valid email format; password ≥ 6 chars; email unique. The frontend form also has Confirm Password.
- **Login**: email + password → token/session. Wrong credentials → clear error.
- **Search**: by title, only within the user's own tasks.
- **Filter**: status (All/TODO/IN_PROGRESS/COMPLETED) and priority (All/LOW/MEDIUM/HIGH); the two can be combined.
- **Sort**: newest, oldest, due date, priority.
- **Complete**: one-click toggle that sets `status = COMPLETED`.
- **Delete**: confirm first ("Are you sure you want to delete this task?"), then delete permanently.
- **Dashboard stats**: total, pending (not COMPLETED), completed, high priority.

## Non-negotiable rules

- **Authorization on the backend**: the user comes from the token/session, never from the request body. Every task query is scoped by `user_id`. Accessing another user's task → 403 (or 404). Never rely on frontend checks alone.
- **Passwords are hashed** (e.g. bcrypt) and never returned in any response. Secrets are never sent to the client.
- **Validation on the backend** (frontend validation is extra UX only). Examples: empty title → "Title is required"; `priority=VERY_HIGH` → "Invalid priority"; invalid status is rejected too.
- **No hardcoded config**: use env vars and keep `.env.example` up to date.

## Frontend pages

- **Login**: email, password, and a link: "Don't have an account? Register".
- **Register**: name, email, password, confirm password, "Create Account" button.
- **Dashboard**: header with Logout, stat cards, search, status/priority filters, sort, "+ Create Task" button, task list showing title, description, priority, status, due date, created and updated dates.
- **Task form** (shared by create and edit): title, description, priority dropdown, status dropdown, due date, Save, Cancel.
- **Loading states** on every API call ("Loading tasks..." or a spinner/skeleton).
- **Error messages**: network ("Unable to connect to server. Please try again."), 401 ("Your session has expired. Please login again." then redirect to login), not found ("Task not found."), validation ("Please check the entered information.").
- UI should be clean, responsive, mobile-friendly and accessible, without heavy animation.

## Out of scope (v1)

Chat, social login, email/push notifications, payments, AI features, team collaboration, file uploads, calendar sync, mobile app, categories/tags, dark mode, admin dashboard. Don't add these unless the user asks.

## Testing checklist

- **Auth**: register OK, duplicate email, login OK, wrong password.
- **Tasks**: create, view, update, delete, complete.
- **Authorization**: user A cannot read, update or delete user B's task.
- **Validation**: empty title, invalid email, short password, invalid priority, invalid status.
- **Search**: a match and no match.
- **Filters**: status, priority, both combined.

## Deliverables

- Source code: `frontend/`, `backend/`, `README.md`, `.env.example`.
- README: overview, features, stack, install, env vars, DB setup, how to run frontend and backend, API overview.
- API docs: endpoint, method, body, auth, response, errors.
- Screenshots and a short demo: register → login → create → view → update → filter/search → complete → dashboard.
