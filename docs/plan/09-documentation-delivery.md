# Module 9 — Documentation and Delivery

**SRS refs:** §26 Final Deliverables, §17 Git, §28 Final Goal
**Depends on:** Module 8
**Commit:** `Add documentation`
**Test cases:** [../test-cases/09-documentation-delivery.md](../test-cases/09-documentation-delivery.md)

## Goal

Someone who has never seen the project can clone it, set it up, run it and understand the API. The student can demo and explain it.

## Deliverables

| # | Deliverable | Location |
|---|---|---|
| 1 | Source code | GitHub repo with `frontend/`, `backend/`, `README.md`, `.env.example` files |
| 2 | README | `README.md` (root) |
| 3 | API documentation | `docs/API.md` |
| 4 | Screenshots | `docs/screenshots/*.png` |
| 5 | Short demo | screen recording or a live demo |

## 1. README.md outline

```
# Student Task Management System
One-paragraph overview.

## Features
- Registration/login with JWT, search, filters, sort, dashboard stats, ...

## Tech Stack
React + Vite + Tailwind | Node + Express 5 | PostgreSQL | JWT + bcrypt | Vitest + Supertest

## Project Structure
Short tree + one line per folder (link docs/plan/00-implementation-plan.md).

## Prerequisites
Node 20+, PostgreSQL 15+, Git

## Environment Variables
Table: variable | where | example | purpose
  backend: PORT, DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, CLIENT_URL
  frontend: VITE_API_URL

## Database Setup
createdb task_manager
cd backend && npm run migrate

## Run the Backend
cd backend && npm install && cp .env.example .env && npm run dev

## Run the Frontend
cd frontend && npm install && cp .env.example .env && npm run dev
Open http://localhost:5173

## Run Tests
createdb task_manager_test; cp .env.test.example .env.test; npm test

## API Overview
Endpoint table + link to docs/API.md

## Screenshots
Embedded images

## Design Decisions & Known Limitations
- 404 instead of 403 for other users' tasks (why)
- password column named password_hash
- JWT in localStorage (XSS tradeoff), logout is client-side, no token revocation
- No pagination; migrations are not versioned
- highPriority stat counts all HIGH tasks

## Future Enhancements
From SRS §27.
```

**Verify the README** by following it from a fresh clone in a new folder. Every command must work as written (SRS §19: "Project runs successfully from a clean setup").

## 2. docs/API.md

For **every** endpoint, document:

```
### POST /api/tasks
Create a task for the logged-in user.

Auth: required (Authorization: Bearer <token>)

Request body:
| Field | Type | Required | Notes |
| title | string | yes | 1–200 chars |
| description | string \| null | no | max 2000 |
| priority | LOW \| MEDIUM \| HIGH | no | default MEDIUM |
| status | TODO \| IN_PROGRESS \| COMPLETED | no | default TODO |
| dueDate | YYYY-MM-DD \| null | no | |

Success 201:
{ "success": true, "message": "Task created successfully", "data": { "task": { ... } } }

Errors:
| Status | When | Example message |
| 400 | validation failed | "Validation failed" + errors.title "Title is required" |
| 401 | missing/invalid token | "Authentication required" |
```

Endpoints to cover: `GET /api/health`, `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `GET /api/tasks` (with query params), `GET /api/tasks/stats`, `GET /api/tasks/:id`, `POST /api/tasks`, `PUT /api/tasks/:id`, `PATCH /api/tasks/:id/status`, `DELETE /api/tasks/:id`.

Also include a short **"Common errors"** section (the 400/401/404/409/500 formats) and the task object shape.

Optional: a Postman / Thunder Client collection at `docs/task-manager.postman_collection.json`.

## 3. Screenshots (`docs/screenshots/`)

- [ ] `01-login.png`
- [ ] `02-register.png` (also one with validation errors showing)
- [ ] `03-dashboard.png` (with ~8 realistic tasks, see SRS §2 examples)
- [ ] `04-create-task.png`
- [ ] `05-edit-task.png`
- [ ] `06-filters.png` (Status TODO + Priority HIGH applied)
- [ ] `07-completed-task.png`
- [ ] `08-mobile.png` (optional, 360px width)

Use demo data only, with no real emails or passwords.

## 4. Demo script (~3 minutes)

1. Register a new student → show the validation error for a short password, then succeed.
2. Log in.
3. Create 3 tasks: "Complete Java Assignment" (HIGH, due tomorrow), "Practice 2 DSA questions" (MEDIUM), "Prepare for interview" (HIGH).
4. View the list and point out the dates and badges.
5. Edit one task's description and priority.
6. Search "java", then filter Status TODO + Priority HIGH.
7. Tick a task as completed → stats update.
8. Delete a task → confirmation.
9. Log in as another user in a private window → empty list (authorization).
10. Log out.

Be ready to answer (SRS §25 and §28): *Why this structure? How does the backend know who the user is? What stops user A from reading user B's task? How is the password stored? What happens if the server is down?*

## 5. Git hygiene check

- [ ] History shows small, meaningful commits per module (not one giant commit)
- [ ] No `.env`, `node_modules` or secrets in any commit
- [ ] `.env.example` files are present and complete

## Done when

- [ ] README verified from a fresh clone
- [ ] API.md covers every endpoint
- [ ] Screenshots committed
- [ ] Demo rehearsed
- [ ] You can answer: *"If the AI disappeared, could I explain and maintain the code I built?"* with yes

## AI prompt

```text
Read docs/plan/09-documentation-delivery.md and the current code.
Draft README.md and docs/API.md following the outlines exactly.
Take request/response examples from the actual code. Don't invent fields or endpoints.
List anything in the code that doesn't match the docs instead of silently "fixing" the docs.
```
