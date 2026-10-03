# Module 3 — Authentication (Backend)

**SRS refs:** FR-01 Registration, FR-02 Login, FR-03 Authentication, §10 Validation, §14 Security
**Depends on:** Modules 1, 2
**Commit:** `Add authentication`
**Test cases:** [../test-cases/03-authentication.md](../test-cases/03-authentication.md)

## Goal

Students can register and log in. Login returns a JWT, and an `auth` middleware protects routes and identifies the current user. Passwords are hashed and never returned.

## Scope

**In:** `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `auth` middleware, `validate` middleware, user repository, auth service.
**Out:** task endpoints, frontend. Logout is client-side (see below).

## Files

```
src/validators/authValidators.js   registerSchema, loginSchema
src/middleware/validate.js         validate(schema, 'body' | 'query' | 'params')
src/middleware/auth.js             requireAuth
src/repositories/userRepository.js findByEmail, findById, create
src/services/authService.js        register, login, getCurrentUser
src/controllers/authController.js
src/routes/authRoutes.js           mounted at /api/auth in app.js
```

## Validation rules (zod)

**Register:** `{ name, email, password }`
| Field | Rules | Message |
|---|---|---|
| name | string, trimmed, 1–100 chars | "Name is required" |
| email | string, trimmed, lowercased, valid email format | "Email is required" / "Invalid email format" |
| password | string, 6–72 chars | "Password is required" / "Password must be at least 6 characters" |

> Max 72 because bcrypt ignores bytes after 72.
> `confirmPassword` is checked only on the frontend. The API does not need it.

**Login:** `{ email, password }`, both required, email trimmed and lowercased.

### `validate` middleware
Runs `schema.safeParse(req[source])`.
- On failure: `throw new ApiError(400, 'Validation failed', fieldErrors)`, where `fieldErrors` looks like `{ email: 'Invalid email format' }`.
- On success: replace `req.body` (or store the result on `req.validated`) with the parsed data, so trimming and lowercasing apply.

> Express 5 makes `req.query` read-only. Store parsed query data on `req.validated.query`, and use the same pattern for body and params to keep things consistent.

## Endpoints

### `POST /api/auth/register`
1. Validate the body.
2. `findByEmail(email)`. If it exists → **409** "Email is already registered".
3. `bcrypt.hash(password, 10)`.
4. Insert the user and return **201**: `{ success: true, message: 'Registration successful', data: { user: { id, name, email, createdAt } } }`.
5. A race condition (two requests at once) could still hit the DB unique constraint. Catch PG error code `23505` → 409.

### `POST /api/auth/login`
1. Validate the body.
2. `findByEmail(email)`. If missing → **401** "Invalid email or password".
3. `bcrypt.compare`. If it fails → **401** with the **same** message, so attackers cannot learn which emails exist.
4. Sign the JWT: `jwt.sign({ sub: String(user.id) }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN })`.
5. Return **200**: `{ success: true, message: 'Login successful', data: { token, user: { id, name, email } } }`.

### `GET /api/auth/me` (protected)
Returns the current user. The frontend uses it to check that a stored token is still valid. If the user no longer exists → 401.

### Logout
JWTs are stateless, so logout = **the frontend deletes the token**. There is no server endpoint. Known limitation: a stolen token stays valid until it expires (1 day). A token denylist is out of scope for v1.

## `requireAuth` middleware

```
Header: Authorization: Bearer <token>
- no header or wrong format   → 401 "Authentication required"
- jwt.verify fails or expired → 401 "Your session has expired. Please login again."
- sub is not a positive int   → 401
- ok                          → req.user = { id: Number(payload.sub) }; next()
```

- Always call `jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] })`. Pinning the algorithm rejects unsigned `alg: none` tokens.
- Check that the user still exists (`findById`). A valid token for a deleted user must give **401**, not a 500 foreign-key error later when creating a task. One indexed lookup per request is cheap at this scale.

## Security checklist

- [ ] `password_hash` is never selected into objects sent to the client. Repository functions that return users to controllers omit it, and only `findByEmail` for login selects it.
- [ ] Same error message for an unknown email and a wrong password
- [ ] `JWT_SECRET` only comes from env
- [ ] bcrypt cost 10
- [ ] Optional nice-to-have: rate-limit `/api/auth/login` (`express-rate-limit`)

## Testing (Vitest + Supertest, against the test DB)

- [ ] Register succeeds → 201, no password in the response
- [ ] Register with an existing email → 409
- [ ] Register with an invalid email → 400 with an `errors.email` message
- [ ] Register with a 5-char password → 400
- [ ] Register with a missing name → 400
- [ ] `Test@Mail.com ` and `test@mail.com` count as the same email
- [ ] Login succeeds → 200 with a token
- [ ] Login with a wrong password → 401
- [ ] Login with an unknown email → 401 with the same message
- [ ] `GET /api/auth/me` without a token → 401, with a garbage token → 401, with a valid token → 200
- [ ] The `users` table holds a bcrypt hash (`$2a$…`), not the plain password

## Done when

- [ ] All tests above pass
- [ ] `requireAuth` is exported and ready for the task routes

## AI prompt

```text
Read docs/context.md and docs/plan/03-authentication.md.
Explain the implementation plan first: files, request flow, how the password is hashed,
how the JWT is created and verified. Wait for confirmation.

Then implement it using the existing project structure (modules 1–2).
Do not modify unrelated modules. Do not create task endpoints.
```
