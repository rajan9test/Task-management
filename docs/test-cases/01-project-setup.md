# Test Cases — Module 1: Project Setup

Plan: [../plan/01-project-setup.md](../plan/01-project-setup.md). Strategy: [00-test-strategy.md](00-test-strategy.md).

## Behaviour these tests lock in

- Malformed JSON → **400**, not 500. `express.json()` throws a `SyntaxError` with `type: 'entity.parse.failed'`, and `errorHandler` must map it.
- Body over 100 kb → **413**.
- Every response, including errors, is JSON in the `{ success, message }` shape.

## Health check and routing

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| SETUP-API-01 | Health check | `GET /api/health` | 200, `{ "success": true, "message": "OK" }`, `Content-Type: application/json` | API | P0 |
| SETUP-API-02 | Unknown route | `GET /api/does-not-exist` | 404, `{ success: false, message: "Route not found" }` | API | P1 |
| SETUP-API-03 | Wrong method on existing path | `POST /api/health` | 404 JSON (not an HTML page) | API | P2 |
| SETUP-API-04 | Root path | `GET /` | 404 JSON, no stack or framework info | API | P2 |
| SETUP-API-05 | Trailing slash | `GET /api/health/` | 200 (Express is non-strict by default) | API | P2 |

## Request parsing and error handler

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| SETUP-ERR-01 | Malformed JSON | `POST /api/health` (or any POST route) with `Content-Type: application/json`, body `{"title": ` | 400, `{ success: false, message: "Invalid JSON in request body" }`, no stack trace | API | P0 |
| SETUP-ERR-02 | Body too large | JSON body of 200 kb | 413, JSON message "Request body too large" | API | P1 |
| SETUP-ERR-03 | Unexpected error | Temporary test route that does `throw new Error('boom')` | 500, `message: "Something went wrong"`. Response body does **not** contain "boom" or a stack trace. Server log does | API | P0 |
| SETUP-ERR-04 | Async error (Express 5) | Test route `async () => { throw new Error() }` | 500 JSON. The process does **not** crash and the next request works | API | P0 |
| SETUP-ERR-05 | ApiError passthrough | Test route throws `new ApiError(418, 'Teapot', { a: 'b' })` | 418, `{ success: false, message: "Teapot", errors: { a: "b" } }` | API | P1 |
| SETUP-ERR-06 | Non-JSON content type | `POST` with `Content-Type: text/plain` | Not a 500. Validation (later modules) returns 400 | API | P2 |

## Security headers and CORS

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| SETUP-SEC-01 | Helmet headers | `GET /api/health` | Has `X-Content-Type-Options: nosniff` and `X-Frame-Options` / CSP headers | API | P1 |
| SETUP-SEC-02 | No framework fingerprint | `GET /api/health` | No `X-Powered-By` header | API | P1 |
| SETUP-SEC-03 | CORS allowed origin | Request with `Origin: http://localhost:5173` (= `CLIENT_URL`) | `Access-Control-Allow-Origin: http://localhost:5173` | API | P0 |
| SETUP-SEC-04 | CORS other origin | Request with `Origin: http://evil.com` | No `Access-Control-Allow-Origin` header | API | P0 |
| SETUP-SEC-05 | CORS preflight | `OPTIONS /api/tasks` with `Origin` = CLIENT_URL and `Access-Control-Request-Method: PUT`, `Access-Control-Request-Headers: Authorization, Content-Type` | 204, allows `PUT` and both headers | API | P1 |

## Environment configuration

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| SETUP-ENV-01 | Missing `JWT_SECRET` | Remove it from `.env`, start the server | Process exits with a non-zero code and the message "Missing required env var: JWT_SECRET" | CLI | P0 |
| SETUP-ENV-02 | Missing `DATABASE_URL` | Remove it, start | Same: exits with the variable named | CLI | P0 |
| SETUP-ENV-03 | Missing `CLIENT_URL` | Remove it, start | Exits with the variable named (or a documented default) | CLI | P1 |
| SETUP-ENV-04 | Weak secret (production) | `NODE_ENV=production`, `JWT_SECRET=abc` | Refuses to start: "JWT_SECRET must be at least 32 characters" | CLI | P1 |
| SETUP-ENV-05 | Invalid `PORT` | `PORT=abc` | Exits with a clear message | CLI | P2 |
| SETUP-ENV-06 | Port already in use | Start two backends on the same port | Second one logs "Port 5000 is already in use" and exits, with no unhandled stack dump | CLI | P2 |
| SETUP-ENV-07 | `.env.example` complete | Compare every variable read in `config/env.js` with `.env.example` | Every variable is listed, no real secrets | CLI | P0 |
| SETUP-ENV-08 | Single env reader | `grep -rn "process.env" backend/src` | Only `config/env.js` matches | CLI | P2 |

## Repository and build

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| SETUP-REPO-01 | `.env` ignored | Create `backend/.env` and `frontend/.env`, run `git status` | Neither is listed | CLI | P0 |
| SETUP-REPO-02 | `node_modules` ignored | `git status` after install | Not listed | CLI | P1 |
| SETUP-REPO-03 | Clean clone | Clone into a new folder, `npm ci` in both apps, copy `.env.example` → `.env`, start | Both start with no extra steps | CLI | P0 |
| SETUP-REPO-04 | Frontend production build | `npm run build` in `frontend/` | Builds with no errors or warnings about missing env | CLI | P1 |
| SETUP-REPO-05 | Frontend env missing | Remove `VITE_API_URL`, `npm run dev` | App shows or logs a clear "VITE_API_URL is not set" message, not silent failed requests to `undefined/...` | UI | P2 |
| SETUP-REPO-06 | Tailwind works | Add `className="text-red-500"` to the placeholder | Text is red | UI | P2 |
| SETUP-REPO-07 | Node version | `node -v` below 20 | `package.json` `engines` field documents 20+, and the README says so | CLI | P2 |
