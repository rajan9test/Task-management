# Test Cases — Module 9: Documentation and Delivery

Plan: [../plan/09-documentation-delivery.md](../plan/09-documentation-delivery.md). Strategy: [00-test-strategy.md](00-test-strategy.md).

These cases check that the documentation is **correct**, not just present. Ideally someone other than the author runs DOC-SET-01.

## Clean setup from the README

| ID | Case | Steps | Expected | Type | P |
|---|---|---|---|---|---|
| DOC-SET-01 | Fresh clone | In a new folder (or a fresh machine or VM), clone the repo and follow the README **word for word**, without using any knowledge from outside the README | Backend, frontend and tests all run. Note every step where you had to guess | CLI | P0 |
| DOC-SET-02 | Prerequisites stated | Read the README | Node and PostgreSQL versions given | CLI | P1 |
| DOC-SET-03 | Commands copy-pasteable | Copy each code block into a terminal | Every command runs as written (watch for Windows vs macOS/Linux differences such as `cp` vs `copy`, and note both) | CLI | P1 |
| DOC-SET-04 | DB setup | Follow the DB section on an empty Postgres | Databases created, migration succeeds | CLI | P0 |
| DOC-SET-05 | Tests | Follow the "Run Tests" section | `npm test` green | CLI | P1 |

## Environment variables

| ID | Case | Steps | Expected | Type | P |
|---|---|---|---|---|---|
| DOC-ENV-01 | Backend vars documented | Compare `config/env.js`, `backend/.env.example` and the README table | Same set of variables in all three | CLI | P0 |
| DOC-ENV-02 | Frontend vars documented | Compare `import.meta.env` usages, `frontend/.env.example` and the README | Same set | CLI | P0 |
| DOC-ENV-03 | No real secrets | Read both `.env.example` files | Placeholder values only | CLI | P0 |

## API documentation accuracy

| ID | Case | Steps | Expected | Type | P |
|---|---|---|---|---|---|
| DOC-API-01 | All endpoints listed | Compare the routes in `backend/src/routes` with `docs/API.md` | Every route documented, nothing documented that doesn't exist | CLI | P0 |
| DOC-API-02 | Examples are real | For each endpoint, run the documented request (curl or Postman) | Actual status and body match the doc (ids and timestamps aside) | CLI | P0 |
| DOC-API-03 | Errors documented | For each endpoint, trigger every listed error | Status codes and messages match the doc | CLI | P1 |
| DOC-API-04 | Auth requirement | Check each endpoint section | Says whether a token is required, matching SEC-AUTH-01 | CLI | P1 |
| DOC-API-05 | Query params | Check the `GET /api/tasks` section | `search`, `status`, `priority` and `sort` documented with allowed values and defaults | CLI | P1 |
| DOC-API-06 | Decisions documented | Read the doc | 404-for-other-users'-tasks, `highPriority` definition, PUT = full update, date format | CLI | P1 |
| DOC-API-07 | Postman collection (if provided) | Import it and run all requests in order | All pass against a fresh DB | CLI | P2 |

## Screenshots and demo

| ID | Case | Steps | Expected | Type | P |
|---|---|---|---|---|---|
| DOC-SCR-01 | All required screenshots | Check `docs/screenshots/` | Login, register, dashboard, create task, edit task, filters, completed task (SRS §26) | CLI | P0 |
| DOC-SCR-02 | Screenshots current | Compare them with the running app | Match the current UI (retake after UI changes) | UI | P1 |
| DOC-SCR-03 | No personal data | Inspect the images | Demo names and emails only, no tokens visible | UI | P1 |
| DOC-SCR-04 | Images render | Open the README on GitHub | Images display (relative paths are correct, filename case matches) | UI | P1 |
| DOC-DEMO-01 | Demo rehearsal | Run the demo script on a fresh DB with a timer | Completes in ≤ 3–4 minutes without errors | UI | P1 |

## Repository hygiene

| ID | Case | Steps | Expected | Type | P |
|---|---|---|---|---|---|
| DOC-GIT-01 | Commit history | `git log --oneline` | Small commits per module with meaningful messages, not one giant commit | CLI | P1 |
| DOC-GIT-02 | No secrets ever committed | Same as SEC-CFG-01 | Clean | CLI | P0 |
| DOC-GIT-03 | No junk files | `git ls-files` | No `node_modules`, `dist`, `.env`, logs or OS files (`.DS_Store`, `Thumbs.db`) | CLI | P1 |
| DOC-GIT-04 | Required structure | Repo root | `frontend/`, `backend/`, `README.md` and `.env.example` files present | CLI | P0 |
| DOC-LINK-01 | No broken links | Click every link in `README.md`, `docs/API.md` and `docs/plan/*.md` | All resolve | UI | P2 |

## Final self-check (SRS §28)

| ID | Case | Steps | Expected | Type | P |
|---|---|---|---|---|---|
| DOC-SELF-01 | Explain without AI | Without notes, explain: the request flow, how JWT auth works, what prevents IDOR, how passwords are stored, how search avoids SQL injection, how the UI handles 401 | Clear answers for all six | — | P0 |
