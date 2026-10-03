# Module 8 — Testing and Code Review

**SRS refs:** §18 Testing Requirements, §19 Acceptance Criteria, §24 Steps 6–7, §25
**Depends on:** Modules 1–7
**Commits:** `Add tests`, then one commit per group of fixes (e.g. `Fix authorization issues`)
**Test cases:** [../test-cases/08-security-nonfunctional.md](../test-cases/08-security-nonfunctional.md)

## Goal

Prove the app meets every SRS requirement. Run a structured review for security and quality issues, then fix **only** those issues.

## Part A — Automated backend tests

### Setup
- `backend/.env.test` (git-ignored) with `DATABASE_URL` pointing to `task_manager_test`, plus `.env.test.example` committed.
- `vitest.config.js`: load `.env.test` and use `fileParallelism: false`, because the tests share one database.
- `tests/helpers.js`:
  - `resetDb()` → `TRUNCATE tasks, users RESTART IDENTITY CASCADE`
  - `createUserAndLogin(overrides)` → returns `{ user, token }`
  - `authed(token)` → wraps supertest with the Authorization header
- `beforeEach(resetDb)` and `afterAll(() => pool.end())`.

### Test files
| File | Covers |
|---|---|
| `tests/auth.test.js` | Module 3 checklist |
| `tests/tasks.crud.test.js` | Module 4 checklist |
| `tests/tasks.query.test.js` | Module 5 checklist |
| `tests/authorization.test.js` | Every task endpoint as the wrong user → 404, and as no user → 401 |

### SRS §18 coverage map
| SRS test | Where |
|---|---|
| Register successfully / existing email | auth.test |
| Login successfully / incorrect password | auth.test |
| Create, view, update, delete, complete task | tasks.crud.test |
| User cannot access another user's task | authorization.test |
| Empty title, invalid priority, invalid status | tasks.crud.test |
| Invalid email, short password | auth.test |
| Search existing / non-existing | tasks.query.test |
| Filter by status, priority, combined | tasks.query.test |

Run with `npm test`. All tests must pass on a fresh test DB.

## Part B — Manual end-to-end pass

Run modules 6 and 7's manual checklists again on the finished app, in the SRS demo order:
Register → Login → Create → View → Update → Filter/Search → Complete → Dashboard stats → Logout.

## Part C — Code review (list first, fix later)

Review against each category and write findings into `docs/review-findings.md` (file, problem, risk, proposed fix). **Don't change code during the review.**

### 1. Security
- [ ] Passwords hashed with bcrypt, `password_hash` never in a response
- [ ] No secrets in code or git history (`git log -p | grep -i secret`)
- [ ] All SQL parameterised. Search the code for template strings inside `query(`
- [ ] Error handler hides stack traces and DB errors
- [ ] CORS limited to `CLIENT_URL`, `helmet` enabled, JSON body size limit set
- [ ] JWT secret is long and random in the real `.env`

### 2. Authorization
- [ ] Every task route sits behind `requireAuth`
- [ ] Every task SQL statement filters by `user_id`
- [ ] `userId` in a body or query is ignored
- [ ] Stats are scoped to the user

### 3. Validation
- [ ] Every body, param and query that accepts input passes through a zod schema
- [ ] Limits on lengths (title 200, description 2000, search 100, password 72)
- [ ] Invalid id → 400, not 500

### 4. Error handling
- [ ] No unhandled promise rejections. Kill the DB during a request → 500 JSON, server keeps running
- [ ] Frontend shows the SRS messages for network, 401, 404 and validation errors

### 5. Performance
- [ ] Indexes on `tasks(user_id)` exist
- [ ] Stats use one query, not four
- [ ] Search is debounced
- [ ] No request loops (check the Network tab when the dashboard loads)

### 6. Code quality
- [ ] Controllers contain no SQL, and repositories contain no HTTP code
- [ ] No duplicated constants (priorities and statuses defined once on each side)
- [ ] No unused files, `console.log` leftovers or commented-out code
- [ ] Consistent naming and formatting (optional: add Prettier)

### Part C, step 2 — Fix
For each finding: fix only that issue, add or adjust a test if possible, and commit with a clear message. Don't refactor unrelated code.

## Part D — SRS §19 acceptance criteria

Copy the checklist from SRS §19 into `docs/review-findings.md` and tick each item with evidence (test name or manual step). The project is done when every box is ticked.

## Done when

- [ ] `npm test` is green
- [ ] Manual demo flow works end to end
- [ ] All review findings fixed or consciously accepted (with a reason)
- [ ] All SRS §19 boxes ticked

## AI prompts

**Tests**
```text
Read docs/plan/08-testing-review.md Part A. Write the backend test setup and test files.
Explain the test DB strategy first. Do not change application code. If a test fails, report it.
```

**Review**
```text
Review the current implementation for:
1. Security problems  2. Authorization problems  3. Validation issues
4. Error handling issues  5. Performance problems  6. Code quality issues
Use the checklist in docs/plan/08-testing-review.md Part C.
Do not change the code yet. List the issues first with file, line, risk and proposed fix.
```

**Fix**
```text
Fix only the issues listed in docs/review-findings.md items #1–#N.
Do not refactor unrelated code. Explain what was changed and why.
```
