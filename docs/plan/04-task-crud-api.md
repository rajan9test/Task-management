# Module 4 — Task CRUD API

**SRS refs:** FR-04 Create, FR-05 View, FR-06 Update, FR-07 Delete, FR-08 Complete, §8 API, §9 Responses, §10 Validation
**Depends on:** Modules 1–3
**Commit:** `Add task APIs`
**Test cases:** [../test-cases/04-task-crud-api.md](../test-cases/04-task-crud-api.md)

## Goal

Authenticated students can create, read, update, delete and change the status of **their own** tasks. Other students' tasks cannot be reached.

## Scope

**In:** `GET /api/tasks` (basic list, newest first), `GET /api/tasks/:id`, `POST /api/tasks`, `PUT /api/tasks/:id`, `PATCH /api/tasks/:id/status`, `DELETE /api/tasks/:id`.
**Out:** search, filters, sorting options and stats (module 5).

## Files

```
src/validators/taskValidators.js   taskIdParamSchema, createTaskSchema, updateTaskSchema, statusSchema
src/repositories/taskRepository.js
src/services/taskService.js
src/controllers/taskController.js
src/routes/taskRoutes.js           router.use(requireAuth); mounted at /api/tasks
```

## Constants

Define these once, for example in `src/constants/task.js`, and reuse them in validators:
```js
export const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'];
export const STATUSES = ['TODO', 'IN_PROGRESS', 'COMPLETED'];
```

## Validation (zod)

| Field | Create | Update (PUT) | Rules / message |
|---|---|---|---|
| title | required | required | trimmed, 1–200 chars, "Title is required" |
| description | optional | optional | string up to 2000 chars, or `null`; an empty string becomes `null` |
| priority | optional, default `MEDIUM` | required | `enum(PRIORITIES)`, "Invalid priority" |
| status | optional, default `TODO` | required | `enum(STATUSES)`, "Invalid status" |
| dueDate | optional | optional | `YYYY-MM-DD` and a real date, or `null`; "Invalid due date" |

- **PUT is a full update:** the client sends the whole task (the shared create/edit form already has every field). An omitted `description` or `dueDate` clears it.
- **PATCH status:** body `{ status }`, required, must be one of `STATUSES`.
- **`:id` param:** must be a positive integer **≤ 2147483647** (Postgres INTEGER max). Otherwise **400** "Invalid task id". Without this check, `/api/tasks/abc` or `/api/tasks/99999999999` would cause a PG error and a 500.
- `priority` and `status` are case-sensitive: `"high"` → 400.
- Unknown fields such as `userId` are **stripped** (zod default). A client can never set the owner.

## Ownership rule (most important part of this module)

Every query that reads or changes a single task includes **both** the task id and the owner:

```sql
SELECT … FROM tasks WHERE id = $1 AND user_id = $2
UPDATE tasks SET …, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING …
DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id
```

`user_id` always comes from `req.user.id`. If no row comes back, the service throws **404 "Task not found"**.

> **Why 404 and not 403?** SRS §10 allows "403 or another appropriate secure response". 404 does not reveal that task #57 exists and belongs to someone else, and it needs only one query instead of "fetch, then compare owner". Note this in the API docs.

## Endpoints

| Method | Path | Body | Success |
|---|---|---|---|
| GET | `/api/tasks` | — | 200 `data: { tasks: [...] }`, ordered `created_at DESC` |
| GET | `/api/tasks/:id` | — | 200 `data: { task }` |
| POST | `/api/tasks` | create schema | **201** "Task created successfully", `data: { task }` |
| PUT | `/api/tasks/:id` | update schema | 200 "Task updated successfully", `data: { task }` |
| PATCH | `/api/tasks/:id/status` | `{ status }` | 200 "Task status updated", `data: { task }` |
| DELETE | `/api/tasks/:id` | — | 200 "Task deleted successfully", `data: null` |

**Task object shape (API):**
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
- A `toTask(row)` helper in the repository maps snake_case → camelCase.
- `user_id` is not returned because the client doesn't need it.

> **DATE gotcha:** `pg` converts `DATE` columns into JS `Date` objects at local midnight, which can shift the day when serialised. Fix it once in `pool.js` with `pg.types.setTypeParser(1082, v => v)` so dates stay `YYYY-MM-DD` strings.

## Layer responsibilities

- **Controller:** reads `req.user.id`, validated params and body, calls the service, sends the response. No SQL, no business rules.
- **Service:** calls the repository. If the result is null, throws `ApiError(404, 'Task not found')`.
- **Repository:** parameterised SQL and the `toTask` mapping only.

## Testing (Vitest + Supertest)

Setup: create user A and user B, and log both in.

- [ ] Create a task as A → 201, `status` defaults to `TODO`, `priority` defaults to `MEDIUM`
- [ ] Create with an empty title / `"   "` title → 400 "Title is required"
- [ ] Create with `priority: "VERY_HIGH"` → 400 "Invalid priority"
- [ ] Create with `status: "DONE"` → 400 "Invalid status"
- [ ] Create with `userId: B.id` in the body → task still belongs to A
- [ ] List as A → only A's tasks
- [ ] Get / update / patch / delete A's task **as B → 404**, and A's task is unchanged
- [ ] Update A's task → fields change and `updatedAt > createdAt`
- [ ] Patch status to `COMPLETED` → 200, status changed
- [ ] Delete → 200, then GET → 404
- [ ] `GET /api/tasks/abc` → 400; `GET /api/tasks/999999` → 404
- [ ] Any task route without a token → 401

## Done when

- [ ] All tests pass
- [ ] Every single-task SQL statement has `AND user_id = $n`

## AI prompt

```text
Read docs/context.md and docs/plan/04-task-crud-api.md.
Implement the task CRUD APIs using the existing authentication (requireAuth, req.user.id),
validate middleware, ApiError and response helpers.

A user must only access their own tasks: every query filters by id AND user_id.
First explain the plan and show the SQL you will use. Wait for confirmation.
Do not implement search/filter/sort/stats yet. Do not modify unrelated modules.
```
