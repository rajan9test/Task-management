# Test Cases — Module 5: Search, Filter, Sort and Stats API

Plan: [../plan/05-search-filter-stats-api.md](../plan/05-search-filter-stats-api.md). Strategy: [00-test-strategy.md](00-test-strategy.md).

Setup: the **standard test data** from [00-test-strategy.md](00-test-strategy.md). A has 6 tasks and B has "Java secret".

## Behaviour these tests lock in

- Search matches the **title only**, is case-insensitive, matches partial text, and treats `%`, `_` and `\` literally.
- An empty or whitespace-only `search`, `status` or `priority` means "no filter".
- A **repeated** query param (`?status=TODO&status=HIGH`) → 400, never 500. Express parses repeated params into arrays.
- Unknown query params are ignored. `userId` in the query never changes whose tasks are returned.
- An empty result is 200 with `[]`, never 404.
- Stats: `pending` = everything not COMPLETED (TODO + IN_PROGRESS). `highPriority` counts all HIGH tasks, including completed ones. `total = pending + completed` always.

## Search

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| QRY-SRC-01 | Basic | `?search=Java` as A | "Complete Java Assignment", "Practice Java Collections" | API | P0 |
| QRY-SRC-02 | Case-insensitive | `?search=JAVA` / `java` | Same 2 tasks | API | P0 |
| QRY-SRC-03 | Partial, mid-word | `?search=ava` | Same 2 tasks | API | P1 |
| QRY-SRC-04 | No cross-user leak | `?search=java` as A | B's "Java secret" **not** included | API | P0 |
| QRY-SRC-05 | Other user sees only own | `?search=java` as B | Only "Java secret" | API | P0 |
| QRY-SRC-06 | No match | `?search=zzz` | 200, `tasks: []` | API | P0 |
| QRY-SRC-07 | Title only | Task with "kotlin" only in its description; `?search=kotlin` | Not returned | API | P1 |
| QRY-SRC-08 | Trimmed | `?search=%20%20java%20%20` | Same as `java` | API | P2 |
| QRY-SRC-09 | Empty / whitespace | `?search=` / `?search=%20%20` | All 6 of A's tasks | API | P1 |
| QRY-SRC-10 | `%` literal | `?search=%25` (= `%`) | Only "Submit 100% report_v2" | API | P0 |
| QRY-SRC-11 | `_` literal | `?search=_` | Only "Submit 100% report_v2" | API | P1 |
| QRY-SRC-12 | Backslash | `?search=%5C` (= `\`) | 200, no error | API | P2 |
| QRY-SRC-13 | Quote | `?search='` / `?search="` | 200, no SQL error | API | P0 |
| QRY-SRC-14 | Injection text | `?search=' OR '1'='1` | 200 `[]` (literal text), never all tasks or other users' tasks | API | P0 |
| QRY-SRC-15 | Unicode / emoji | Task "Study 📚 café", `?search=café` and `?search=📚` | Found | API | P2 |
| QRY-SRC-16 | Length boundary | 100 chars → 200; 101 chars → 400 | As stated | API | P2 |
| QRY-SRC-17 | Repeated param | `?search=a&search=b` | 400, not 500 | API | P1 |

## Filters

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| QRY-FLT-01 | Status TODO | `?status=TODO` | Java Assignment, React Project, Submit 100% report | API | P0 |
| QRY-FLT-02 | Status IN_PROGRESS | `?status=IN_PROGRESS` | Practice Java Collections | API | P0 |
| QRY-FLT-03 | Status COMPLETED | `?status=COMPLETED` | Prepare for interview, Attend class | API | P0 |
| QRY-FLT-04 | Priority HIGH | `?priority=HIGH` | Java Assignment, Prepare for interview | API | P0 |
| QRY-FLT-05 | Priority LOW / MEDIUM | Each | Correct subsets | API | P1 |
| QRY-FLT-06 | Combined | `?status=TODO&priority=HIGH` | Only "Complete Java Assignment" | API | P0 |
| QRY-FLT-07 | Combined, no match | `?status=IN_PROGRESS&priority=LOW` | 200 `[]` | API | P1 |
| QRY-FLT-08 | Search + filters | `?search=java&status=TODO&priority=HIGH` | Only "Complete Java Assignment" | API | P0 |
| QRY-FLT-09 | Empty = All | `?status=&priority=` | All 6 | API | P1 |
| QRY-FLT-10 | Invalid status | `?status=DONE` | 400 "Invalid status" | API | P0 |
| QRY-FLT-11 | Lowercase | `?status=todo` / `?priority=high` | 400 | API | P1 |
| QRY-FLT-12 | Repeated param | `?status=TODO&status=COMPLETED` | 400, not 500 | API | P1 |
| QRY-FLT-13 | Unknown param | `?foo=bar` | 200, ignored | API | P2 |
| QRY-FLT-14 | userId in query | As A: `?userId=<B.id>` | A's tasks only | API | P0 |
| QRY-FLT-15 | Filters don't leak | As A: `?priority=HIGH` | B's HIGH task not included | API | P0 |

## Sort

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| QRY-SRT-01 | Default | No `sort` | Newest `createdAt` first | API | P0 |
| QRY-SRT-02 | Newest | `?sort=newest` | Same as default | API | P1 |
| QRY-SRT-03 | Oldest | `?sort=oldest` | Exact reverse of newest | API | P0 |
| QRY-SRT-04 | Due date | `?sort=due_date` | Earliest due date first (past dates first). Tasks **without** a due date at the end | API | P0 |
| QRY-SRT-05 | Priority | `?sort=priority` | All HIGH, then MEDIUM, then LOW (not alphabetical). Within the same priority, newest first | API | P0 |
| QRY-SRT-06 | Invalid | `?sort=random` / `?sort=title` | 400 | API | P1 |
| QRY-SRT-07 | Injection | `?sort=created_at;DROP TABLE tasks` | 400, table intact | API | P0 |
| QRY-SRT-08 | Empty | `?sort=` | Default (newest) | API | P2 |
| QRY-SRT-09 | Sort + filter | `?status=TODO&sort=due_date` | 3 TODO tasks ordered by due date | API | P1 |
| QRY-SRT-10 | Stable | Call the same query 3 times | Identical order each time | API | P2 |

## Stats — `GET /api/tasks/stats`

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| QRY-STA-01 | Counts | As A | `{ total: 6, pending: 4, completed: 2, highPriority: 2 }` | API | P0 |
| QRY-STA-02 | Numbers not strings | — | `typeof` each value === `"number"` | API | P0 |
| QRY-STA-03 | New user | Stats for a newly registered user | All `0` (not null, not missing) | API | P0 |
| QRY-STA-04 | Isolation | As B | `{ total: 1, pending: 1, completed: 0, highPriority: 1 }` | API | P0 |
| QRY-STA-05 | IN_PROGRESS is pending | — | The IN_PROGRESS task is counted in `pending` | API | P1 |
| QRY-STA-06 | Completed HIGH counted | — | "Prepare for interview" (HIGH, COMPLETED) is in `highPriority` | API | P1 |
| QRY-STA-07 | Invariant | After random creates, deletes and status changes | `total === pending + completed` | API | P1 |
| QRY-STA-08 | Reacts to create | Create a HIGH TODO task | total +1, pending +1, highPriority +1 | API | P0 |
| QRY-STA-09 | Reacts to complete | PATCH a TODO task to COMPLETED | pending −1, completed +1, total unchanged | API | P0 |
| QRY-STA-10 | Reacts to delete | Delete a COMPLETED task | total −1, completed −1 | API | P0 |
| QRY-STA-11 | Route order | `GET /api/tasks/stats` | Stats response, **not** 400 "Invalid task id" | API | P0 |
| QRY-STA-12 | No auth | No token | 401 | API | P0 |
| QRY-STA-13 | Ignores filters | `/stats?status=TODO` | Same totals as without the param (stats are always overall) | API | P2 |

## Performance (data volume)

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| QRY-PRF-01 | List with 1,000 tasks | Seed 1,000 tasks for A, 1,000 for B; time `GET /api/tasks?search=java&sort=priority` | < 300 ms locally, only A's tasks | API | P2 |
| QRY-PRF-02 | Stats with 1,000 tasks | Time `/stats` | < 100 ms, one SQL query (check the query log) | API | P2 |
| QRY-PRF-03 | Index used | `EXPLAIN ANALYZE` the filter query with ~10k rows | Uses a `tasks_user_id` index (not a full seq scan of all users' tasks) | DB | P2 |
