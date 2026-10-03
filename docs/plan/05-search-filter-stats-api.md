# Module 5 — Search, Filter, Sort and Stats API

**SRS refs:** FR-09 Search, FR-10 Filter, FR-11 Dashboard, FR-12 Sorting
**Depends on:** Module 4
**Commit:** `Add search, filters and stats API`
**Test cases:** [../test-cases/05-search-filter-stats-api.md](../test-cases/05-search-filter-stats-api.md)

## Goal

`GET /api/tasks` supports search by title, filters by status and priority (combinable), and sorting. A new `GET /api/tasks/stats` returns the dashboard numbers. All of it is scoped to the logged-in user.

## Scope

**In:** query param validation, dynamic but safe SQL in `taskRepository.findAll`, stats query and endpoint.
**Out:** pagination (not in the SRS, so it's a future enhancement) and frontend.

## `GET /api/tasks` query parameters

| Param | Values | Default | Effect |
|---|---|---|---|
| `search` | string, trimmed, max 100 chars | none | `title ILIKE '%search%'` (case-insensitive, partial match) |
| `status` | `TODO` / `IN_PROGRESS` / `COMPLETED` | none (= All) | `status = $n` |
| `priority` | `LOW` / `MEDIUM` / `HIGH` | none (= All) | `priority = $n` |
| `sort` | `newest` / `oldest` / `due_date` / `priority` | `newest` | ORDER BY (see below) |

- Invalid values → 400 (e.g. `?status=DONE` → "Invalid status").
- An empty string (`?status=`) is treated as "not set", since the frontend sends "All" as empty.
- A **repeated** param (`?status=TODO&status=HIGH`) arrives as an array. The zod schema only accepts strings, so this is a 400, never a 500.
- Unknown params (including `userId`) are ignored.
- Filters combine with `AND`: `?status=TODO&priority=HIGH` returns high-priority TODO tasks only.

### Safe dynamic SQL

```js
const conditions = ['user_id = $1'];
const values = [userId];

if (search)   { values.push(`%${escapeLike(search)}%`); conditions.push(`title ILIKE $${values.length}`); }
if (status)   { values.push(status);   conditions.push(`status = $${values.length}`); }
if (priority) { values.push(priority); conditions.push(`priority = $${values.length}`); }

const ORDER_BY = {
  newest:   'created_at DESC',
  oldest:   'created_at ASC',
  due_date: 'due_date ASC NULLS LAST, created_at DESC',
  priority: "CASE priority WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END, created_at DESC",
};

const sql = `SELECT … FROM tasks WHERE ${conditions.join(' AND ')} ORDER BY ${ORDER_BY[sort]}`;
```

Key points to understand and explain:
- **User values only ever go into `values`** as `$n` placeholders. The only text joined into the SQL comes from our own code (`conditions` strings and the `ORDER_BY` whitelist), so this is safe from SQL injection.
- `sort` is validated against the whitelist, so `ORDER_BY[sort]` can never be user text.
- `escapeLike` escapes `\`, `%` and `_`, so searching `100%` matches literally instead of acting as a wildcard.
- `user_id = $1` is **always** the first condition. Search and filters can never widen the result to other users.
- Priority sort uses `CASE` because alphabetical order (`HIGH, LOW, MEDIUM`) is wrong.

## `GET /api/tasks/stats`

> **Route order:** register `/stats` **before** `/:id`. Otherwise Express treats `stats` as an id, and the id validator returns 400.

Single query:
```sql
SELECT
  COUNT(*)                                         AS total,
  COUNT(*) FILTER (WHERE status <> 'COMPLETED')    AS pending,
  COUNT(*) FILTER (WHERE status = 'COMPLETED')     AS completed,
  COUNT(*) FILTER (WHERE priority = 'HIGH')        AS high_priority
FROM tasks
WHERE user_id = $1;
```

Response:
```json
{ "success": true, "message": "Stats fetched", "data": { "total": 20, "pending": 12, "completed": 8, "highPriority": 4 } }
```

- `COUNT` comes back from `pg` as a **string** (bigint). Convert it with `Number()` in the repository.
- **Definition decision:** `highPriority` counts **all** HIGH tasks, including completed ones, matching the SRS wording "Number of high-priority tasks". Note this in the API docs. If the instructor prefers "open high-priority tasks", add `AND status <> 'COMPLETED'`.
- A new user gets all zeros, not nulls.

## Testing

Setup: user A with ~6 tasks covering a mix of status, priority and due date, including one with no due date. User B has 1 task titled "Java secret".

- [ ] `?search=java` (lowercase) matches "Complete Java Assignment" and "Practice Java Collections"
- [ ] `?search=java` as A does **not** return B's "Java secret"
- [ ] `?search=zzz` → 200 with an empty list (not 404)
- [ ] `?search=%` returns only titles that contain `%`
- [ ] `?status=TODO`, `?priority=HIGH` and `?status=TODO&priority=HIGH` each return the correct subset
- [ ] `?status=DONE` → 400, `?sort=random` → 400
- [ ] `?sort=oldest` reverses `newest`; `?sort=due_date` puts the no-due-date task last; `?sort=priority` gives HIGH → MEDIUM → LOW
- [ ] `GET /api/tasks/stats` matches manual counts, and numbers are numbers, not strings
- [ ] Stats for a new user → all `0`
- [ ] Stats as B do not include A's tasks
- [ ] Stats without a token → 401

## Done when

- [ ] All tests pass
- [ ] You can explain why the dynamic SQL is not vulnerable to injection

## AI prompt

```text
Read docs/plan/05-search-filter-stats-api.md.
Extend the existing GET /api/tasks with search, status, priority and sort query params,
and add GET /api/tasks/stats.

Use parameterised queries and a whitelist for ORDER BY. Every query must keep user_id = $1.
First explain the plan and show the final SQL. Wait for confirmation.
Do not change the create/update/delete logic.
```
