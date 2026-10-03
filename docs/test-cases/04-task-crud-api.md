# Test Cases — Module 4: Task CRUD API

Plan: [../plan/04-task-crud-api.md](../plan/04-task-crud-api.md). Strategy: [00-test-strategy.md](00-test-strategy.md).

Setup for every case: users A and B are registered and logged in (`tokenA`, `tokenB`). "A's task" means a task created through the API by A.

## Behaviour these tests lock in

- **Another user's task → 404 "Task not found"**, identical to a task that doesn't exist.
- `:id` must be a positive integer ≤ 2147483647 (Postgres INTEGER max). Anything else → **400 "Invalid task id"**, never 500.
- `title` is trimmed. Empty `description` → `null`. Empty `dueDate` → `null`.
- `priority` and `status` are **case-sensitive** uppercase. `"high"` → 400.
- `dueDate` must be a real calendar date in `YYYY-MM-DD` form, and is returned exactly as sent. Past dates are allowed.
- PUT is a **full** update. An omitted optional field is cleared.
- `userId`, `id`, `createdAt` and `updatedAt` in a body are ignored.
- Responses never contain `user_id` or `userId`.
- A valid token for a deleted user → **401** on every task route, never 500 from a foreign-key error.

## Authentication on all routes

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| TASK-AUTH-01 | No token | Call each of the 6 task routes without `Authorization` | 401 for every route | API | P0 |
| TASK-AUTH-02 | Expired token | Each route with an expired token | 401 "Your session has expired. Please login again." | API | P0 |
| TASK-AUTH-03 | Deleted user's token | Delete user A from DB, then `POST /api/tasks` with `tokenA` | 401, not 500 | API | P1 |

## Create — `POST /api/tasks`

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| TASK-CRT-01 | Minimal task | `{ title: "Complete Java Assignment" }` | 201, `message: "Task created successfully"`, `priority: "MEDIUM"`, `status: "TODO"`, `description: null`, `dueDate: null`, `createdAt == updatedAt` | API | P0 |
| TASK-CRT-02 | All fields | title, description, `priority: "HIGH"`, `status: "IN_PROGRESS"`, `dueDate: "2026-10-10"` | 201, each field echoed exactly | API | P0 |
| TASK-CRT-03 | Response shape | — | Keys are exactly `id, title, description, priority, status, dueDate, createdAt, updatedAt`, with no `user_id` or `userId` | API | P0 |
| TASK-CRT-04 | Owner from token | Body includes `userId: <B.id>` while sent with `tokenA` | 201, and the task appears in A's list, not B's | API | P0 |
| TASK-CRT-05 | Ignored server fields | `id: 999, createdAt: "2000-01-01"` | Generated id, current timestamp | API | P1 |
| TASK-CRT-06 | Empty body | `{}` | 400, `errors.title = "Title is required"` | API | P0 |
| TASK-CRT-07 | Empty title | `title: ""` | 400 "Title is required" | API | P0 |
| TASK-CRT-08 | Whitespace title | `title: "    "` | 400 "Title is required" | API | P0 |
| TASK-CRT-09 | Title trimmed | `"  Java  "` | Saved as `"Java"` | API | P1 |
| TASK-CRT-10 | Title boundary | 200 chars → 201; 201 chars → 400 | As stated | API | P1 |
| TASK-CRT-11 | Title wrong type | `title: 123` / `null` / `["a"]` | 400, never 500 | API | P1 |
| TASK-CRT-12 | Invalid priority | `"VERY_HIGH"` | 400, `errors.priority = "Invalid priority"` | API | P0 |
| TASK-CRT-13 | Lowercase priority | `"high"` | 400 "Invalid priority" | API | P1 |
| TASK-CRT-14 | Null priority | `priority: null` | 400 | API | P2 |
| TASK-CRT-15 | Invalid status | `"DONE"` / `"completed"` | 400, `errors.status = "Invalid status"` | API | P0 |
| TASK-CRT-16 | Create as completed | `status: "COMPLETED"` | 201 (allowed) | API | P2 |
| TASK-CRT-17 | Description empty | `description: ""` | 201, `description: null` | API | P2 |
| TASK-CRT-18 | Description boundary | 2000 chars → 201; 2001 → 400 | As stated | API | P1 |
| TASK-CRT-19 | Description multiline/unicode | `"Line 1\nLine 2 — 📚 café"` | Returned byte-for-byte equal | API | P2 |
| TASK-CRT-20 | Valid due date | `"2026-10-10"` | Returned `"2026-10-10"` | API | P0 |
| TASK-CRT-21 | Due date timezone stable | Run TASK-CRT-20 with `TZ=America/New_York` and `TZ=Asia/Kolkata` | Always `"2026-10-10"` | API | P0 |
| TASK-CRT-22 | Impossible date | `"2026-02-30"`, `"2026-13-01"`, `"2026-00-10"` | 400 "Invalid due date", not a 500 from Postgres | API | P1 |
| TASK-CRT-23 | Wrong date format | `"10-10-2026"`, `"2026/10/10"`, `"2026-10-10T00:00:00Z"`, `"tomorrow"`, `20261010` | 400 "Invalid due date" | API | P1 |
| TASK-CRT-24 | Leap year | `"2028-02-29"` → 201; `"2027-02-29"` → 400 | As stated | API | P2 |
| TASK-CRT-25 | Past due date | `"2020-01-01"` | 201 (allowed) | API | P2 |
| TASK-CRT-26 | Empty / null due date | `""` or `null` | 201, `dueDate: null` | API | P1 |
| TASK-CRT-27 | HTML title | `"<img src=x onerror=alert(1)>"` | 201, stored and returned verbatim (escaping is the UI's job, FED-ITEM-06) | API | P1 |
| TASK-CRT-28 | SQL text title | `"'); DROP TABLE tasks;--"` | 201, stored literally, other tasks still exist | API | P0 |
| TASK-CRT-29 | Malformed JSON | Broken body | 400 "Invalid JSON in request body" | API | P1 |

## List — `GET /api/tasks` (base behaviour; query params are in module 5)

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| TASK-LST-01 | New user | B with no tasks | 200, `data.tasks = []` | API | P0 |
| TASK-LST-02 | Only own tasks | A has 3 tasks, B has 2. List as A | Exactly A's 3 | API | P0 |
| TASK-LST-03 | Default order | Create T1, T2, T3 in order | Returned T3, T2, T1 | API | P1 |
| TASK-LST-04 | Same timestamp tie | Two tasks with an identical `created_at` (insert in one transaction) | Stable order (tie-break `id DESC`), the same on every call | API | P2 |
| TASK-LST-05 | No user_id leaked | — | No item has `user_id` or `userId` | API | P0 |

## Get one — `GET /api/tasks/:id`

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| TASK-GET-01 | Own task | A gets A's task | 200, `data.task` | API | P0 |
| TASK-GET-02 | Other user's task | B gets A's task id | 404 "Task not found" | API | P0 |
| TASK-GET-03 | Same body as missing | Compare the TASK-GET-02 body with `GET /api/tasks/999999` | Identical status and body (no existence leak) | API | P0 |
| TASK-GET-04 | Non-numeric id | `/api/tasks/abc` | 400 "Invalid task id" | API | P1 |
| TASK-GET-05 | Zero / negative | `/0`, `/-1` | 400 | API | P1 |
| TASK-GET-06 | Decimal / exponent | `/1.5`, `/1e3` | 400 | API | P2 |
| TASK-GET-07 | Integer overflow | `/2147483648`, `/99999999999999999999` | 400, **not** 500 (PG out-of-range error) | API | P1 |
| TASK-GET-08 | Injection in id | `/1%20OR%201=1`, `/1;DROP TABLE tasks` | 400 | API | P0 |

## Update — `PUT /api/tasks/:id`

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| TASK-UPD-01 | Full update | Change every field | 200 "Task updated successfully", all fields changed | API | P0 |
| TASK-UPD-02 | Timestamps | Update after a 1 s wait | `updatedAt` > before, `createdAt` unchanged | API | P0 |
| TASK-UPD-03 | Other user's task | B sends PUT on A's task | 404. GET it as A → unchanged (check every field) | API | P0 |
| TASK-UPD-04 | Missing task | `/999999` | 404 | API | P1 |
| TASK-UPD-05 | Missing required field | Omit `title` / `priority` / `status` | 400 with that field's error | API | P0 |
| TASK-UPD-06 | Omitted optional fields cleared | Task has a description and due date; PUT without them | 200, both `null` | API | P1 |
| TASK-UPD-07 | Same validations as create | Run the CRT-07, 08, 10, 12, 13, 15, 22 and 23 inputs through PUT | Same 400 responses | API | P0 |
| TASK-UPD-08 | Cannot change owner | `userId: B.id` in A's PUT | 200, task still A's, not visible to B | API | P0 |
| TASK-UPD-09 | Same values | PUT the unchanged task | 200, `updatedAt` refreshed | API | P2 |
| TASK-UPD-10 | Deleted task | Delete, then PUT | 404 | API | P1 |
| TASK-UPD-11 | Invalid id | `/abc` | 400 | API | P1 |
| TASK-UPD-12 | Concurrent updates | Two PUTs at once with different titles | Both 200. Final state equals one of them completely (no mixed fields). Last write wins, as documented | API | P2 |

## Status — `PATCH /api/tasks/:id/status`

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| TASK-STS-01 | Complete | `{ status: "COMPLETED" }` | 200 "Task status updated", `status: "COMPLETED"`, `updatedAt` refreshed | API | P0 |
| TASK-STS-02 | Each value | TODO → IN_PROGRESS → COMPLETED → TODO | Each succeeds (re-opening is allowed) | API | P1 |
| TASK-STS-03 | Invalid status | `"DONE"`, `"completed"`, `""` | 400 "Invalid status" | API | P0 |
| TASK-STS-04 | Missing body | `{}` | 400 | API | P1 |
| TASK-STS-05 | Other fields ignored | `{ status: "COMPLETED", title: "Hacked" }` | Status changes, title unchanged | API | P1 |
| TASK-STS-06 | Other user's task | B sends PATCH on A's task | 404, A's status unchanged | API | P0 |
| TASK-STS-07 | Invalid id | `/abc/status` | 400 | API | P1 |

## Delete — `DELETE /api/tasks/:id`

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| TASK-DEL-01 | Delete own | A deletes A's task | 200 "Task deleted successfully", `data: null` | API | P0 |
| TASK-DEL-02 | Gone after delete | GET the same id | 404, not in the list | API | P0 |
| TASK-DEL-03 | Delete twice | DELETE again | 404 | API | P1 |
| TASK-DEL-04 | Other user's task | B deletes A's task | 404, and A's task **still exists** | API | P0 |
| TASK-DEL-05 | Invalid id | `/abc`, `/0` | 400 | API | P1 |
| TASK-DEL-06 | Only that task | A has 3 tasks, deletes 1 | The other 2 are intact | API | P1 |

## Unsupported routes

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| TASK-RT-01 | PATCH without `/status` | `PATCH /api/tasks/1` | 404 "Route not found" | API | P2 |
| TASK-RT-02 | POST to an id | `POST /api/tasks/1` | 404 | API | P2 |
| TASK-RT-03 | DELETE all | `DELETE /api/tasks` | 404, nothing deleted | API | P0 |
