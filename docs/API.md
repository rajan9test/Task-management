# API Reference

Base URL: `http://localhost:5000/api`

## Conventions

- JSON in, JSON out. Field names are camelCase.
- Protected endpoints need `Authorization: Bearer <token>`, where the token comes from `POST /api/auth/login`.
- The logged-in user always comes from the token. A `userId` sent in a body or query string is ignored.
- Success: `{ "success": true, "message": "...", "data": ... }`
- Failure: `{ "success": false, "message": "...", "errors": { "field": "message" } }`. `errors` is present only for validation problems and duplicate emails.

## Task object

```json
{
  "id": 12,
  "title": "Complete Java Assignment",
  "description": "Chapter 5 exercises",
  "priority": "HIGH",
  "status": "TODO",
  "dueDate": "2026-10-10",
  "createdAt": "2026-10-03T10:15:00.000Z",
  "updatedAt": "2026-10-03T10:15:00.000Z"
}
```

| Field | Type | Notes |
|---|---|---|
| `priority` | `LOW` \| `MEDIUM` \| `HIGH` | |
| `status` | `TODO` \| `IN_PROGRESS` \| `COMPLETED` | |
| `description` | string \| null | |
| `dueDate` | `YYYY-MM-DD` \| null | A calendar day, no time or timezone |
| `createdAt`, `updatedAt` | ISO 8601 timestamp | `updatedAt` changes on every edit |

## Common errors

| Status | When | Example |
|---|---|---|
| 400 | Validation failed | `{ "success": false, "message": "Validation failed", "errors": { "title": "Title is required" } }` |
| 400 | Invalid query or id | `{ "success": false, "message": "Invalid status", "errors": { "status": "Invalid status" } }` |
| 400 | Malformed JSON body | `{ "success": false, "message": "Invalid JSON in request body" }` |
| 401 | No or malformed `Authorization` header | `{ "success": false, "message": "Authentication required" }` |
| 401 | Invalid or expired token | `{ "success": false, "message": "Your session has expired. Please login again." }` |
| 404 | Task does not exist **or belongs to another user** | `{ "success": false, "message": "Task not found" }` |
| 404 | Unknown route | `{ "success": false, "message": "Route not found" }` |
| 409 | Email already registered | `{ "success": false, "message": "Email is already registered", "errors": { "email": "..." } }` |
| 413 | Body larger than 100 kb | `{ "success": false, "message": "Request body is too large" }` |
| 500 | Unexpected server error | `{ "success": false, "message": "Something went wrong" }` (details are logged on the server only) |

> **Why 404 and not 403 for another user's task?** SRS §10 allows "403 or another appropriate secure response". A 404 doesn't reveal that the task exists.

---

## Health

### GET /api/health

Auth: none

Success 200:
```json
{ "success": true, "message": "OK" }
```

---

## Authentication

### POST /api/auth/register

Create an account. Does not log the user in.

Auth: none

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | 1–100 chars, trimmed |
| `email` | string | yes | valid email, trimmed and lowercased |
| `password` | string | yes | 6–72 chars |

Success 201:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": { "user": { "id": 1, "name": "Riya Sharma", "email": "riya@example.com", "createdAt": "2026-10-03T10:00:00.000Z" } }
}
```

Errors:
| Status | When | Example |
|---|---|---|
| 400 | invalid input | `errors.email`: "Invalid email format", `errors.password`: "Password must be at least 6 characters", `errors.name`: "Name is required" |
| 409 | email taken | "Email is already registered" |

### POST /api/auth/login

Auth: none

| Field | Type | Required |
|---|---|---|
| `email` | string | yes |
| `password` | string | yes |

Success 200:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { "id": 1, "name": "Riya Sharma", "email": "riya@example.com" }
  }
}
```

Errors:
| Status | When | Example |
|---|---|---|
| 400 | missing fields | `errors.password`: "Password is required" |
| 401 | unknown email **or** wrong password | "Invalid email or password" (same message for both) |

### GET /api/auth/me

Returns the user the token belongs to. The frontend uses it to check a stored token at startup.

Auth: required

Success 200:
```json
{ "success": true, "message": "Current user", "data": { "user": { "id": 1, "name": "Riya Sharma", "email": "riya@example.com", "createdAt": "..." } } }
```

Errors: 401 if the token is missing, invalid or expired, or if the user no longer exists.

### Logout

There is no logout endpoint. Tokens are stateless, so the frontend logs out by deleting its stored token.

---

## Tasks

All task endpoints require `Authorization: Bearer <token>` and only ever see the logged-in user's tasks.

### GET /api/tasks

List the user's tasks.

| Query param | Values | Default | Effect |
|---|---|---|---|
| `search` | string, max 100 chars | — | Case-insensitive partial match on title. `%` and `_` match literally |
| `status` | `TODO` \| `IN_PROGRESS` \| `COMPLETED` | all | Exact match |
| `priority` | `LOW` \| `MEDIUM` \| `HIGH` | all | Exact match |
| `sort` | `newest` \| `oldest` \| `due_date` \| `priority` | `newest` | `due_date`: soonest first, tasks without a due date last. `priority`: HIGH → MEDIUM → LOW |

An empty value (e.g. `?status=`) means "not set". Filters combine with AND.

Example: `GET /api/tasks?search=java&status=TODO&priority=HIGH&sort=due_date`

Success 200 (an empty list is still 200):
```json
{ "success": true, "message": "Tasks fetched", "data": { "tasks": [ { "id": 12, "title": "Complete Java Assignment", "...": "..." } ] } }
```

Errors: 400 for an invalid value, e.g. `?status=DONE` → "Invalid status", `?sort=random` → "Invalid sort".

### GET /api/tasks/stats

Dashboard counts for the user.

Success 200:
```json
{ "success": true, "message": "Stats fetched", "data": { "total": 20, "pending": 12, "completed": 8, "highPriority": 4 } }
```

- `pending` = every task whose status is not `COMPLETED`.
- `highPriority` = every `HIGH` task, **including completed ones**.
- A new user gets all zeros.

### GET /api/tasks/:id

Success 200: `{ "success": true, "message": "Task fetched", "data": { "task": { ... } } }`

Errors: 400 "Invalid task id" (not a positive integer), 404 "Task not found".

### POST /api/tasks

Create a task for the logged-in user.

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | 1–200 chars, trimmed |
| `description` | string \| null | no | max 2000. An empty string is stored as `null` |
| `priority` | `LOW` \| `MEDIUM` \| `HIGH` | no | default `MEDIUM` |
| `status` | `TODO` \| `IN_PROGRESS` \| `COMPLETED` | no | default `TODO` |
| `dueDate` | `YYYY-MM-DD` \| null | no | must be a real date (`2026-02-30` is rejected) |

Success 201:
```json
{ "success": true, "message": "Task created successfully", "data": { "task": { ... } } }
```

Errors:
| Status | When | Example |
|---|---|---|
| 400 | validation failed | `errors.title`: "Title is required", `errors.priority`: "Invalid priority", `errors.status`: "Invalid status", `errors.dueDate`: "Invalid due date" |

### PUT /api/tasks/:id

Replace a task. This is a **full update**: send every field. A missing `description` or `dueDate` is cleared to `null`.

| Field | Required |
|---|---|
| `title` | yes |
| `description` | no |
| `priority` | **yes** |
| `status` | **yes** |
| `dueDate` | no |

Success 200: `{ "success": true, "message": "Task updated successfully", "data": { "task": { ... } } }`

Errors: 400 validation or invalid id, 404 "Task not found".

### PATCH /api/tasks/:id/status

Change only the status (used by the "complete" checkbox).

Body: `{ "status": "COMPLETED" }`

Success 200: `{ "success": true, "message": "Task status updated", "data": { "task": { ... } } }`

Errors: 400 "Invalid status" or invalid id, 404 "Task not found".

### DELETE /api/tasks/:id

Delete a task permanently.

Success 200:
```json
{ "success": true, "message": "Task deleted successfully", "data": null }
```

Errors: 400 invalid id, 404 "Task not found".
