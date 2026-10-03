# Student Task Management System

A full-stack web app where students register, log in and manage their own academic and personal tasks: assignments, exam prep, coding practice and deadlines. Each student sees **only their own tasks**, enforced on the backend. Built step by step as a vibe-coding practice project, following the [SRS](docs/Student_Task_Management_System_SRS_Vibe_Coding.md) and the [module plan](docs/plan/00-implementation-plan.md).

## Features

- Registration and login with hashed passwords (bcrypt) and JWT authentication
- Create, view, edit and delete tasks (with a delete confirmation)
- One-click "complete" checkbox
- Search by title, filter by status and priority (combinable), sort by newest / oldest / due date / priority
- Dashboard stats: total, pending, completed, high priority
- Loading states and clear error messages (network down, session expired, not found, validation)
- Responsive layout that works down to 360px wide

## Tech Stack

React 19 + Vite + React Router + Tailwind CSS | Node.js + Express 5 (ES modules) | PostgreSQL (`pg`, plain SQL) | `zod` validation | JWT + bcryptjs | Vitest + Supertest

## Project Structure

```
backend/
  src/
    config/env.js        reads and checks environment variables (the only file that reads process.env)
    db/                  pg pool, migration runner, SQL migrations
    middleware/          requireAuth, validate (zod), notFound, errorHandler
    validators/          zod schemas for each request body / query / param
    routes/ → controllers/ → services/ → repositories/   (HTTP → business rules → SQL)
    app.js               builds the Express app (no listen, so tests can import it)
    server.js            starts the server
  tests/                 Vitest + Supertest integration tests (run against a separate test DB)
frontend/
  src/
    api/                 client.js (single fetch wrapper), auth.js, tasks.js
    context/             AuthContext (token, current user, login/logout)
    components/          dashboard pieces + ui/ (Button, Input, Select, Modal, ...)
    pages/               LoginPage, RegisterPage, DashboardPage
docs/                    SRS, module plans, API reference
```

See [docs/plan/00-implementation-plan.md](docs/plan/00-implementation-plan.md) for the request flow and conventions.

## Prerequisites

- Node.js 20+ and npm
- PostgreSQL 15+
- Git

## Environment Variables

Copy each `.env.example` to `.env` and fill in real values. `.env` files are git-ignored.

| Variable | Where | Example | Purpose |
|---|---|---|---|
| `PORT` | backend | `5000` | API port |
| `DATABASE_URL` | backend | `postgres://postgres:postgres@localhost:5432/task_manager` | PostgreSQL connection string |
| `JWT_SECRET` | backend | a long random string | Signs login tokens. Keep it secret |
| `JWT_EXPIRES_IN` | backend | `1d` | Token lifetime |
| `CLIENT_URL` | backend | `http://localhost:5173` | The only origin allowed by CORS |
| `VITE_API_URL` | frontend | `http://localhost:5000/api` | Base URL of the API |

Generate a strong secret with:

```
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

The backend refuses to start if `DATABASE_URL`, `JWT_SECRET` or `CLIENT_URL` is missing.

## Database Setup

```
createdb -U postgres task_manager
cd backend
npm install
cp .env.example .env        # then edit DATABASE_URL and JWT_SECRET
npm run migrate
```

`npm run migrate` runs every SQL file in `backend/src/db/migrations/`. It is safe to run more than once.

## Run the Backend

```
cd backend
npm run dev
```

Check it: `http://localhost:5000/api/health` should return `{ "success": true, "message": "OK" }`.

## Run the Frontend

```
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173.

## Run Tests

The tests use a **separate** database and empty its tables before every test. As a safety check, they refuse to run unless the database name contains `test`.

```
createdb -U postgres task_manager_test
cd backend
cp .env.test.example .env.test   # then edit DATABASE_URL
npm test
```

The test run creates the tables itself, so there's no need to migrate the test DB by hand.

## API Overview

All responses use `{ success, message, data }` on success and `{ success: false, message, errors? }` on failure. Full reference: [docs/API.md](docs/API.md).

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | no | Health check |
| POST | `/api/auth/register` | no | Create an account |
| POST | `/api/auth/login` | no | Log in, returns a JWT |
| GET | `/api/auth/me` | yes | Current user |
| GET | `/api/tasks` | yes | List own tasks (`search`, `status`, `priority`, `sort`) |
| GET | `/api/tasks/stats` | yes | Dashboard counts |
| GET | `/api/tasks/:id` | yes | One task |
| POST | `/api/tasks` | yes | Create a task |
| PUT | `/api/tasks/:id` | yes | Replace a task (full update) |
| PATCH | `/api/tasks/:id/status` | yes | Change only the status |
| DELETE | `/api/tasks/:id` | yes | Delete a task |

## Screenshots

Screenshots go in `docs/screenshots/` (see [module 9](docs/plan/09-documentation-delivery.md#3-screenshots-docsscreenshots)).

## Design Decisions & Known Limitations

- **404 instead of 403 for other users' tasks.** Every task query filters by `id AND user_id`, so another student's task looks exactly like a missing one. This doesn't reveal that the task exists and needs only one query.
- **`password_hash` column.** The SRS calls it `password`. The new name makes it obvious that it never holds plain text.
- **JWT in `localStorage`.** Simple, but readable by any script on the page (XSS risk). An httpOnly cookie would be safer.
- **Logout is client-side.** The frontend deletes the token. There is no token revocation, so a stolen token stays valid until it expires (`JWT_EXPIRES_IN`).
- **No pagination.** The list returns all of a student's tasks.
- **Migrations are not versioned.** The runner re-runs every file and relies on `IF NOT EXISTS`.
- **`highPriority` counts all HIGH tasks**, including completed ones, matching the SRS wording.
- **PUT is a full update.** Leaving out `description` or `dueDate` clears it.

## Future Enhancements

From SRS §27: email reminders, recurring tasks, calendar integration, task categories, tags, dark mode, notifications, admin dashboard, team tasks, AI task suggestions and summaries, a mobile app.
