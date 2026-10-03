# Test Strategy

How the test cases in this folder are organised, run and recorded. Each module in [../plan/](../plan/) has a matching test-case file here. Run that file's cases as soon as the module is built, and re-run all earlier files before each release (regression).

| Module | Plan | Test cases |
|---|---|---|
| 1 Project setup | [01](../plan/01-project-setup.md) | [01-project-setup.md](01-project-setup.md) |
| 2 Database | [02](../plan/02-database.md) | [02-database.md](02-database.md) |
| 3 Authentication | [03](../plan/03-authentication.md) | [03-authentication.md](03-authentication.md) |
| 4 Task CRUD API | [04](../plan/04-task-crud-api.md) | [04-task-crud-api.md](04-task-crud-api.md) |
| 5 Search/filter/sort/stats | [05](../plan/05-search-filter-stats-api.md) | [05-search-filter-stats-api.md](05-search-filter-stats-api.md) |
| 6 Frontend auth | [06](../plan/06-frontend-auth.md) | [06-frontend-auth.md](06-frontend-auth.md) |
| 7 Dashboard and task UI | [07](../plan/07-frontend-dashboard-tasks.md) | [07-frontend-dashboard-tasks.md](07-frontend-dashboard-tasks.md) |
| 8 Cross-cutting (security, performance, resilience) | [08](../plan/08-testing-review.md) | [08-security-nonfunctional.md](08-security-nonfunctional.md) |
| 9 Documentation and delivery | [09](../plan/09-documentation-delivery.md) | [09-documentation-delivery.md](09-documentation-delivery.md) |

## Test case IDs

`<MODULE>-<AREA>-<NN>`, for example `AUTH-REG-07` or `TASK-UPD-03`. IDs never change. If a case is removed, mark it *Removed* instead of renumbering, so references in commits and bug reports stay valid.

| Prefix | Module |
|---|---|
| SETUP | 1 Project setup |
| DB | 2 Database |
| AUTH | 3 Authentication |
| TASK | 4 Task CRUD |
| QRY | 5 Search, filter, sort, stats |
| FEA | 6 Frontend auth |
| FED | 7 Frontend dashboard |
| SEC / PERF / RES / COMP | 8 Security, performance, resilience, compatibility |
| DOC | 9 Documentation |

## Priority

| Priority | Meaning | Release rule |
|---|---|---|
| **P0** | Security, data isolation, data loss, or a core flow broken | Must pass. Any failure blocks the release |
| **P1** | Validation, error handling, important edge cases | Must pass, or be explicitly accepted with a written reason |
| **P2** | Polish, rare edge cases, performance goals | Fix if time allows; record known failures in the README |

## Test types and tools

| Type | Tool | Used for |
|---|---|---|
| **API (automated)** | Vitest + Supertest against `task_manager_test` | Modules 1–5, most of 8 |
| **DB (automated or psql)** | Vitest with `pg`, or manual SQL in `psql` | Module 2 |
| **UI (manual)** | Browser + DevTools (Network, Application, device mode) | Modules 6–7 |
| **E2E (optional, recommended)** | Playwright | Turns the P0 UI cases of modules 6–7 into automated tests |
| **Load** | `autocannon` | Module 8 performance |
| **Security tooling** | `npm audit`, `gitleaks` or `git log -p` grep | Module 8 |

The **Type** column in each file says `API`, `DB`, `UI`, `E2E` or `CLI`. API and DB cases should be automated. UI cases are manual unless Playwright is added.

## Test environment

- Separate database `task_manager_test`, reset before **each** test (`TRUNCATE tasks, users RESTART IDENTITY CASCADE`).
- `backend/.env.test` holds a test `JWT_SECRET` and `JWT_EXPIRES_IN=1d`. Expiry tests sign their own short-lived tokens.
- Run API tests with `fileParallelism: false`, because the tests share one DB.
- For timezone cases, run the suite twice: `TZ=Asia/Kolkata npm test` and `TZ=America/New_York npm test`.

## Standard test data

| Name | Value |
|---|---|
| User A | `Asha Student` / `asha@test.com` / `secret123` |
| User B | `Bilal Student` / `bilal@test.com` / `secret456` |
| A's tasks (for query tests) | "Complete Java Assignment" (HIGH, TODO, due +2d), "Practice Java Collections" (MEDIUM, IN_PROGRESS, no due date), "Prepare for interview" (HIGH, COMPLETED, due −1d), "React Project" (MEDIUM, TODO, due +7d), "Attend class" (LOW, COMPLETED, no due date), "Submit 100% report_v2" (LOW, TODO, due +1d) |
| B's tasks | "Java secret" (HIGH, TODO) |

Build these through API helpers (`createUserAndLogin`, `createTask`), not by hand-written SQL, so the tests also exercise the real code.

## Recording results

For each run, copy the module's table into `docs/test-runs/<date>-<module>.md` (or a spreadsheet) and add **Result** (Pass / Fail / Blocked) and **Notes** columns. Every failure becomes a bug note: case ID, actual result, steps, and the screenshot or response body.

## Definition of done for a module

1. All P0 and P1 cases in its file pass.
2. Automated cases are committed and green in `npm test`.
3. All earlier modules' automated suites are still green (regression).
