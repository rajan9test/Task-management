# Implementation Plan — Overview

Student Task Management System, built module by module, following the SRS ([../Student_Task_Management_System_SRS_Vibe_Coding.md](../Student_Task_Management_System_SRS_Vibe_Coding.md)).

## Tech stack (decided)

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 19 + Vite, JavaScript, React Router, Tailwind CSS | Fast dev server, minimal config |
| Backend | Node.js (LTS) + Express 5, JavaScript (ES modules) | Express 5 forwards async errors to the error handler, so no try/catch wrappers are needed |
| Database | PostgreSQL + `pg` (node-postgres), plain SQL | No ORM magic: every query can be read and explained |
| Validation | `zod` | One schema per request body or query |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` | Stateless tokens; pure-JS bcrypt avoids native build issues on Windows |
| Security middleware | `helmet`, `cors` | Safe headers; only the frontend origin is allowed |
| Tests | Vitest + Supertest (backend), manual checklist (frontend) | Vitest supports ES modules without extra config |

## Module order

Each module depends on the ones before it. Finish, test and commit a module before starting the next one.

| # | Module | Document | Output | Suggested commit |
|---|---|---|---|---|
| 1 | Project setup | [01-project-setup.md](01-project-setup.md) | Folders, packages, env config, health check | `Initial project setup` |
| 2 | Database | [02-database.md](02-database.md) | Schema, migration script, DB connection | `Add database schema` |
| 3 | Authentication (backend) | [03-authentication.md](03-authentication.md) | Register, login, JWT middleware | `Add authentication` |
| 4 | Task CRUD API | [04-task-crud-api.md](04-task-crud-api.md) | Create, read, update, delete, status endpoints | `Add task APIs` |
| 5 | Search, filter, sort and stats API | [05-search-filter-stats-api.md](05-search-filter-stats-api.md) | Query params on `GET /api/tasks`, `GET /api/tasks/stats` | `Add search, filters and stats API` |
| 6 | Frontend foundation and auth UI | [06-frontend-auth.md](06-frontend-auth.md) | API client, auth context, login/register pages, protected routes | `Add auth UI` |
| 7 | Dashboard and task UI | [07-frontend-dashboard-tasks.md](07-frontend-dashboard-tasks.md) | Stats cards, task list, search/filter/sort, task form, delete confirm | `Add task UI` / `Add dashboard` |
| 8 | Testing and code review | [08-testing-review.md](08-testing-review.md) | Full test pass, security review, fixes | `Add tests` / `Fix review issues` |
| 9 | Documentation and delivery | [09-documentation-delivery.md](09-documentation-delivery.md) | README, API docs, screenshots, demo | `Add documentation` |

```
01 Setup → 02 Database → 03 Auth → 04 Task CRUD → 05 Search/Filter/Stats
                                                         ↓
                    09 Docs ← 08 Testing/Review ← 07 Dashboard UI ← 06 Auth UI
```

## Final folder structure

```
task-management-system/
├── backend/
│   ├── src/
│   │   ├── config/env.js            # reads and checks env vars
│   │   ├── db/
│   │   │   ├── pool.js              # pg connection pool
│   │   │   ├── migrate.js           # runs SQL files in migrations/
│   │   │   └── migrations/001_init.sql
│   │   ├── middleware/
│   │   │   ├── auth.js              # verifies JWT and sets req.user
│   │   │   ├── validate.js          # runs zod schemas
│   │   │   ├── notFound.js
│   │   │   └── errorHandler.js
│   │   ├── validators/              # zod schemas
│   │   ├── repositories/            # SQL only
│   │   ├── services/                # business rules
│   │   ├── controllers/             # HTTP request → service → response
│   │   ├── routes/
│   │   ├── utils/ApiError.js, response.js
│   │   ├── app.js                   # builds the Express app (no listen, so tests can import it)
│   │   └── server.js                # app.listen
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/                     # client.js, auth.js, tasks.js
│   │   ├── context/AuthContext.jsx
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx, main.jsx, index.css
│   ├── .env.example
│   └── package.json
├── docs/
├── .gitignore
└── README.md
```

## Request flow (backend)

```
HTTP request
  → route (URL + method)
  → auth middleware (protected routes only; sets req.user.id from the JWT)
  → validate middleware (zod; returns 400 with field errors)
  → controller (reads req, calls the service, sends the response)
  → service (business rules, e.g. "task must belong to this user")
  → repository (parameterised SQL)
  → PostgreSQL
Errors anywhere → throw ApiError → errorHandler → { success: false, message, errors? }
```

## Conventions that apply to every module

- **API naming:** JSON uses camelCase (`dueDate`, `createdAt`), the DB uses snake_case (`due_date`). Repositories convert between them.
- **Responses:** success is `{ success: true, message, data }` and failure is `{ success: false, message, errors? }`, sent through `utils/response.js` and `errorHandler`.
- **Status codes:** 200 OK, 201 created, 400 validation, 401 not logged in or bad token, 404 not found (also used for other users' tasks, see module 4), 409 duplicate email, 500 unexpected.
- **User identity** always comes from `req.user.id` (the JWT), never from the request body or query.
- **SQL** always uses `$1, $2…` placeholders. Never build SQL from user input with string concatenation.
- **Secrets** live in `.env` (git-ignored). `.env.example` lists every variable with a dummy value.

## How to use these docs with AI (vibe-coding flow)

For each module:
1. Read the module doc and make sure you understand every section.
2. Paste the module's **AI prompt** section and ask for the plan first, not code.
3. Generate the code, read it, and compare it with the doc's design.
4. Run it and work through the module's **Testing** checklist, then the full edge-case list in [../test-cases/](../test-cases/00-test-strategy.md) (same number as the module). All P0 and P1 cases must pass.
5. Tick the **Done when** checklist, then commit.
6. Before moving on, answer: *"Could I explain this module without AI?"*
