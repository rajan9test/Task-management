# Test Cases — Module 8: Security, Performance, Resilience and Compatibility

Plan: [../plan/08-testing-review.md](../plan/08-testing-review.md). Strategy: [00-test-strategy.md](00-test-strategy.md).

Modules 1–7 test features one at a time. This file tests the **whole system** before release. Run it on the finished app, and again before every submission.

## Security — authorization sweep (IDOR)

Write one automated test that loops over every task endpoint: A creates a task, then B tries every operation on it.

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| SEC-IDOR-01 | B reads A's task | `GET /api/tasks/:idA` with tokenB | 404 | API | P0 |
| SEC-IDOR-02 | B updates A's task | `PUT /api/tasks/:idA` | 404, A's task unchanged in DB | API | P0 |
| SEC-IDOR-03 | B changes A's status | `PATCH /api/tasks/:idA/status` | 404, unchanged | API | P0 |
| SEC-IDOR-04 | B deletes A's task | `DELETE /api/tasks/:idA` | 404, still exists | API | P0 |
| SEC-IDOR-05 | Enumeration | B loops ids 1–50 with GET | Every non-B id returns the identical 404 body | API | P0 |
| SEC-IDOR-06 | List and stats isolation | B's list, search, filters and stats | No A data in any response | API | P0 |
| SEC-IDOR-07 | Code audit | `grep -n "FROM tasks\|UPDATE tasks\|DELETE FROM tasks" backend/src` | Every statement includes `user_id` | CLI | P0 |

## Security — authentication sweep

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| SEC-AUTH-01 | Every protected route needs a token | Loop all routes except register, login and health without a token | 401 every time | API | P0 |
| SEC-AUTH-02 | Forged tokens | Run the AUTH-MW-06 to MW-12 tokens against every task route | 401 every time | API | P0 |
| SEC-AUTH-03 | Secret strength | Check the production `.env` | `JWT_SECRET` is at least 32 random characters, different from `.env.example` | CLI | P0 |

## Security — injection and XSS

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| SEC-INJ-01 | SQL injection payloads | Send `' OR '1'='1`, `'; DROP TABLE tasks;--`, `1 UNION SELECT * FROM users` in **every** string input (register, login, title, description, search, sort, status, priority, id) | Each is either 400 or stored and matched literally. No 500, no extra rows, tables intact | API | P0 |
| SEC-INJ-02 | Code audit | `grep -rn "query(\`" backend/src`, then inspect each template string | No `${…}` built from user input. Only whitelisted fragments (module 5) | CLI | P0 |
| SEC-XSS-01 | Stored XSS payloads | Create tasks or names containing `<script>alert(1)</script>`, `<img src=x onerror=alert(1)>`, `javascript:alert(1)`, `"><svg onload=alert(1)>` | Rendered as text everywhere (list, modal, header), no alert | UI | P0 |
| SEC-XSS-02 | Code audit | `grep -rn "dangerouslySetInnerHTML\|innerHTML" frontend/src` | No matches | CLI | P0 |
| SEC-MASS-01 | Mass assignment | Send `userId`, `id`, `createdAt`, `password_hash`, `role` in every POST/PUT/PATCH body | All ignored | API | P0 |

## Security — data exposure and configuration

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| SEC-EXP-01 | No password hash anywhere | Search all API responses from the test suite for `password` | Not present | API | P0 |
| SEC-EXP-02 | No internals in errors | Trigger 400, 401, 404, 409, 413 and 500 | No stack traces, SQL, file paths, PG error codes or library names in the bodies | API | P0 |
| SEC-EXP-03 | Logs don't hold secrets | Review the server log after a full test run | No plain passwords, no full tokens, no `DATABASE_URL` with password | CLI | P1 |
| SEC-CFG-01 | Secrets in git history | `git log -p \| grep -iE "JWT_SECRET=\|postgres://[^:]+:[^@]+@"` (or `gitleaks detect`) | Only placeholder values from `.env.example` | CLI | P0 |
| SEC-CFG-02 | Dependency audit | `npm audit --omit=dev` in both apps | 0 high or critical. Note any moderate ones with a reason | CLI | P1 |
| SEC-CFG-03 | CORS | Re-run SETUP-SEC-03/04 against the final app | Only `CLIENT_URL` allowed | API | P0 |
| SEC-CFG-04 | Rate limiting (if implemented) | Brute-force login | 429 after the limit | API | P2 |

## Performance

Tool: `npx autocannon` against a local backend seeded with 50 users × 200 tasks.

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| PERF-01 | List under load | `autocannon -c 50 -d 30 -H "Authorization=Bearer <t>" http://localhost:5000/api/tasks` | 0 errors or timeouts, p95 latency < 300 ms | CLI | P2 |
| PERF-02 | Stats under load | Same, against `/api/tasks/stats` | 0 errors, p95 < 150 ms | CLI | P2 |
| PERF-03 | Login under load | 20 connections POSTing login for 30 s | 0 errors. Latency is higher because of bcrypt (expected) but < 1 s p95 | CLI | P2 |
| PERF-04 | No pool exhaustion | During PERF-01, also call `/api/health` | Health stays fast. After the run the DB has ≤ pool max connections (`SELECT count(*) FROM pg_stat_activity`) | CLI | P2 |
| PERF-05 | Memory stable | Run PERF-01 three times, watch the Node process memory | No steady growth between runs | CLI | P2 |
| PERF-06 | Frontend size | `npm run build` output | Main JS bundle < 300 kB gzipped | CLI | P2 |
| PERF-07 | Lighthouse | Dashboard, production build | Performance ≥ 80 | UI | P2 |

## Resilience

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| RES-01 | DB down mid-session | Stop Postgres while logged in, then load tasks | API → 500 JSON "Something went wrong". UI shows an error with Retry. Server process **keeps running** | API/UI | P0 |
| RES-02 | DB back | Start Postgres again, click Retry | Works without restarting the backend | API/UI | P0 |
| RES-03 | Backend restart | Restart the backend while the UI is open | The next action works, and the user stays logged in (the token is still valid) | UI | P1 |
| RES-04 | Unhandled errors | Grep the server log after the full test run | No `UnhandledPromiseRejection`, no crash restarts | CLI | P0 |
| RES-05 | Slow network | Throttle Slow 3G, complete the full demo flow | Every action shows a loading state, nothing is submitted twice | UI | P1 |
| RES-06 | Offline | DevTools "Offline", perform an action | "Unable to connect to server. Please try again." | UI | P1 |
| RES-07 | Concurrent writes | 20 parallel PATCH status requests on the same task | All 200, final status is one of the sent values, no 500 | API | P2 |

## Compatibility

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| COMP-01 | Chrome (latest) | Full demo flow | Works | UI | P0 |
| COMP-02 | Firefox (latest) | Full demo flow | Works, date picker usable | UI | P1 |
| COMP-03 | Edge (latest) | Full demo flow | Works | UI | P1 |
| COMP-04 | Safari / iOS | Full demo flow on an iPhone or simulator, if available | Works, no input zoom, date picker usable | UI | P2 |
| COMP-05 | Android Chrome | Phone, or DevTools remote | Works | UI | P2 |

## End-to-end regression (SRS demo flow)

Run before every release. Automate it with Playwright if possible.

| ID | Case | Steps | Expected | Type | P |
|---|---|---|---|---|---|
| E2E-01 | Full happy path | Register → Login → Create 3 tasks → View → Edit one → Search "java" → Filter TODO + HIGH → Complete one → Check dashboard numbers → Delete one → Logout | Every step succeeds and stats are correct after each step | E2E | P0 |
| E2E-02 | Two-user isolation | User A creates tasks. In a private window user B registers and logs in | B sees an empty list and zero stats | E2E | P0 |
| E2E-03 | Session expiry | Short `JWT_EXPIRES_IN`, wait, then act | Redirect to login with the message, and logging in again works | E2E | P1 |

## SRS §19 acceptance mapping

Every acceptance item must link to at least one passing case:

| SRS §19 item | Cases |
|---|---|
| User can register / login / logout | AUTH-REG-01, AUTH-LOG-01, FEA-REG-02, FEA-LOG-02, FEA-SES-04 |
| Authentication works | AUTH-MW-*, SEC-AUTH-* |
| Create / view / update / delete / complete tasks | TASK-CRT-01, TASK-LST-02, TASK-UPD-01, TASK-DEL-01, TASK-STS-01, FED-CRT-02, FED-EDT-02, FED-DEL-03, FED-CHK-01 |
| Search works | QRY-SRC-01, FED-SRC-01 |
| Status / priority filters work | QRY-FLT-01..06, FED-FLT-01..03 |
| Dashboard statistics work | QRY-STA-01, FED-STAT-01..05 |
| Backend validates requests | AUTH-REG-06..25, TASK-CRT-06..26 |
| User cannot access another user's tasks | SEC-IDOR-*, TASK-GET-02, E2E-02 |
| Passwords securely stored | AUTH-REG-03, AUTH-REG-04, SEC-EXP-01 |
| Errors handled properly | SETUP-ERR-*, FEA-LOG-10, FED-LIST-04, RES-01 |
| Loading states implemented | FED-LOAD-02, FEA-LOG-07, FED-CRT-07 |
| Environment variables used | SETUP-ENV-*, SEC-CFG-01 |
| Code organised | Module 8 plan, Part C code review |
| Runs from clean setup | SETUP-REPO-03, DOC-SET-01 |
