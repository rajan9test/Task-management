# Module 1 — Project Setup

**SRS refs:** §15 Architecture, §16 Environment Configuration, §17 Git, §26 Deliverables
**Depends on:** nothing
**Commit:** `Initial project setup`
**Test cases:** [../test-cases/01-project-setup.md](../test-cases/01-project-setup.md)

## Goal

Create an empty but runnable skeleton. The backend should answer a health check, the frontend should show a placeholder page, and env config and git should be set up correctly from the first commit.

## Scope

**In:** folder structure, `package.json` files, dependencies, env loading and validation, Express app with health route, Vite React app, Tailwind, `.gitignore`, `.env.example`.
**Out:** database tables, auth, any feature code.

## Prerequisites

- Node.js LTS (20+) and npm
- PostgreSQL 15+ running locally (or via Docker), plus two empty databases: `task_manager` and `task_manager_test`
- Git

## Steps

### 1. Repo root
- `git init`
- `.gitignore`: `node_modules/`, `.env`, `.env.test`, `dist/`, `coverage/`, `*.log`

### 2. Backend
```
cd backend
npm init -y              # then set "type": "module" in package.json
npm i express cors helmet dotenv pg zod jsonwebtoken bcryptjs
npm i -D nodemon vitest supertest
```

Scripts in `backend/package.json`:
```json
"scripts": {
  "dev": "nodemon src/server.js",
  "start": "node src/server.js",
  "migrate": "node src/db/migrate.js",
  "test": "vitest run"
}
```

Files:
- `src/config/env.js`: loads `dotenv` and reads `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`. **Fails fast** (throws on startup) if a required variable is missing. Exports one frozen `env` object, and no other file reads `process.env` directly.
- `src/app.js`: creates the Express app, adds `helmet()`, `cors({ origin: env.CLIENT_URL })` and `express.json({ limit: '100kb' })`, plus `GET /api/health → { success: true, message: 'OK' }`. Exports `app` without calling `listen`.
- `src/server.js`: imports `app` and calls `app.listen(env.PORT)`.
- `src/utils/ApiError.js`: `class ApiError extends Error { constructor(statusCode, message, errors) }`.
- `src/utils/response.js`: `sendSuccess(res, statusCode, message, data)`.
- `src/middleware/notFound.js`: responds 404 `{ success: false, message: 'Route not found' }`.
- `src/middleware/errorHandler.js`: an `ApiError` becomes its status and message. A JSON parse error (`err.type === 'entity.parse.failed'`) becomes **400** "Invalid JSON in request body", and a too-large body (`'entity.too.large'`) becomes **413** "Request body too large". Anything else is logged with `console.error` and returned as 500 "Something went wrong". **Never send stack traces to the client.**
- `src/config/env.js` also rejects a `JWT_SECRET` shorter than 32 characters when `NODE_ENV=production`.

`backend/.env.example`:
```
PORT=5000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/task_manager
JWT_SECRET=change-me-to-a-long-random-string
JWT_EXPIRES_IN=1d
CLIENT_URL=http://localhost:5173
```

### 3. Frontend
```
npm create vite@latest frontend -- --template react
cd frontend
npm i react-router-dom
npm i -D tailwindcss @tailwindcss/vite
```
- Add the `tailwindcss()` plugin in `vite.config.js` and put `@import "tailwindcss";` in `src/index.css`.
- `frontend/.env.example`: `VITE_API_URL=http://localhost:5000/api`. Vite only exposes variables that start with `VITE_`, so this is the SRS's `API_URL`.
- Replace the demo `App.jsx` with a placeholder heading.

## Design decisions

| Decision | Reason |
|---|---|
| `app.js` and `server.js` are separate | Supertest can import `app` without opening a port |
| `env.js` checks variables at startup | A missing `JWT_SECRET` should crash immediately, not cause odd 500s later |
| ES modules (`"type": "module"`) | Same `import` syntax as the frontend |

## Testing

- [ ] `npm run dev` in `backend/` → `GET http://localhost:5000/api/health` returns `{ "success": true, "message": "OK" }`
- [ ] `GET /api/unknown` → 404 JSON
- [ ] Remove `JWT_SECRET` from `.env` → server refuses to start with a clear message
- [ ] `npm run dev` in `frontend/` → placeholder page at `http://localhost:5173`, and Tailwind classes work
- [ ] `git status` does not show `.env` or `node_modules`

## Done when

- [ ] Both apps start from a clean clone after `npm install` and copying `.env.example` → `.env`
- [ ] Health check, 404 handler and error handler work
- [ ] No secrets in git

## AI prompt

```text
I am building the Student Task Management System (see docs/context.md and docs/plan/01-project-setup.md).
Stack: React + Vite (JS), Node + Express 5 (ES modules), PostgreSQL.

Set up the project skeleton exactly as described in 01-project-setup.md.
First list the files you will create and what each contains. Wait for my confirmation.
Do not add database tables, auth or task features yet.
```
