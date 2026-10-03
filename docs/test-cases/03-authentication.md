# Test Cases — Module 3: Authentication (Backend)

Plan: [../plan/03-authentication.md](../plan/03-authentication.md). Strategy: [00-test-strategy.md](00-test-strategy.md).

## Behaviour these tests lock in

- Emails are **trimmed and lowercased**. Names are trimmed. **Passwords are never trimmed or changed.**
- Unknown email and wrong password return the **same** 401 body.
- Unknown request fields (e.g. `role`, `id`) are ignored.
- `jwt.verify` is called with `algorithms: ['HS256']`, so unsigned (`alg: none`) and other-algorithm tokens are rejected.
- A valid token for a user who no longer exists → 401, never 500.
- Wrong types (number instead of string, etc.) → 400, never 500.

Error body format for validation: `{ success: false, message: "Validation failed", errors: { <field>: "<message>" } }`.

## Register — happy path

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| AUTH-REG-01 | Valid registration | `{ name: "Asha Student", email: "asha@test.com", password: "secret123" }` | 201, `message: "Registration successful"`, `data.user` = `{ id, name, email, createdAt }` | API | P0 |
| AUTH-REG-02 | No secret in response | Same as above | Body has no `password` or `password_hash` key at any level | API | P0 |
| AUTH-REG-03 | Password hashed | Query `users` after AUTH-REG-01 | `password_hash` starts with `$2a$10$` or `$2b$10$` and is not equal to `secret123` | API | P0 |
| AUTH-REG-04 | Salted hashes | Register two users with the same password | Their hashes are different | API | P1 |
| AUTH-REG-05 | Extra fields ignored | Add `role: "admin", id: 999, createdAt: "2000-01-01"` | 201. The id is generated, not 999, and there is no role column or role in the response | API | P0 |

## Register — validation

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| AUTH-REG-06 | Empty body | `{}` | 400, `errors` has `name`, `email` and `password` | API | P0 |
| AUTH-REG-07 | Missing name | No `name` | 400, `errors.name = "Name is required"` | API | P0 |
| AUTH-REG-08 | Email normalised | `email: "  Asha@Test.COM  "` | 201, stored and returned as `asha@test.com` | API | P0 |
| AUTH-REG-09 | Duplicate email | Register `asha@test.com` twice | Second → 409, `message: "Email is already registered"` | API | P0 |
| AUTH-REG-10 | Duplicate, different case | `asha@test.com`, then `ASHA@test.com` | Second → 409 | API | P0 |
| AUTH-REG-11 | Concurrent duplicates | Send two identical registrations with `Promise.all` | Exactly one 201 and one 409, **no 500**, one row in DB | API | P1 |
| AUTH-REG-12 | Invalid email formats | `"abc"`, `"abc@"`, `"@test.com"`, `"a b@test.com"`, `"asha@@test.com"` | Each → 400, `errors.email = "Invalid email format"` | API | P0 |
| AUTH-REG-13 | Email too long | 250-char local part + `@test.com` | 400 | API | P2 |
| AUTH-REG-14 | Name whitespace only | `name: "    "` | 400, "Name is required" | API | P1 |
| AUTH-REG-15 | Name trimmed | `name: "  Asha  "` | Stored as `"Asha"` | API | P2 |
| AUTH-REG-16 | Name boundary | 100 chars → 201; 101 chars → 400 | As stated | API | P2 |
| AUTH-REG-17 | Unicode name | `"Rāj Kumār"` | 201, returned unchanged | API | P2 |
| AUTH-REG-18 | HTML in name | `"<script>alert(1)</script>"` | 201, stored as plain text (the UI must escape it, see FEA-SEC-02) | API | P1 |
| AUTH-REG-19 | Password 5 chars | `"abcde"` | 400, "Password must be at least 6 characters" | API | P0 |
| AUTH-REG-20 | Password exactly 6 | `"abcdef"` | 201 | API | P0 |
| AUTH-REG-21 | Password 72 / 73 chars | Boundary | 72 → 201; 73 → 400 | API | P1 |
| AUTH-REG-22 | Password not trimmed | `" secret1 "` (with spaces) | 201. Login with `"secret1"` fails, and login with `" secret1 "` succeeds | API | P1 |
| AUTH-REG-23 | Empty strings | `name: "", email: "", password: ""` | 400 with all three errors | API | P0 |
| AUTH-REG-24 | Wrong types | `name: 123`, `email: true`, `password: 123456` | 400 each, never 500 | API | P1 |
| AUTH-REG-25 | `null` values | `name: null` etc. | 400 | API | P1 |
| AUTH-REG-26 | Body is an array | `[{ ... }]` | 400 | API | P2 |
| AUTH-REG-27 | Injection text in email | `"' OR 1=1 --"` | 400 invalid email, no SQL error | API | P0 |
| AUTH-REG-28 | Injection text in name | `"Robert'); DROP TABLE users;--"` | 201, stored literally, `users` table intact | API | P0 |

## Login

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| AUTH-LOG-01 | Valid login | Correct email and password | 200, `data.token` (string), `data.user = { id, name, email }` | API | P0 |
| AUTH-LOG-02 | No secret in response | Same | No `password` or `password_hash` | API | P0 |
| AUTH-LOG-03 | Token contents | Decode the token without verifying it | Header `alg: HS256`. Payload has `sub` = user id as a string, `iat`, and `exp` ≈ iat + 86400. No email, name or password in the payload | API | P0 |
| AUTH-LOG-04 | Wrong password | Correct email, wrong password | 401, `message: "Invalid email or password"` | API | P0 |
| AUTH-LOG-05 | Unknown email | `nobody@test.com` | 401 with a body **identical** to AUTH-LOG-04 | API | P0 |
| AUTH-LOG-06 | Email case-insensitive | `ASHA@TEST.COM` | 200 | API | P0 |
| AUTH-LOG-07 | Email trimmed | `"  asha@test.com "` | 200 | API | P1 |
| AUTH-LOG-08 | Password case-sensitive | `SECRET123` | 401 | API | P0 |
| AUTH-LOG-09 | Missing fields | `{}` / only email / only password | 400 with field errors | API | P1 |
| AUTH-LOG-10 | Wrong types | `password: 123456` | 400, not 500 | API | P1 |
| AUTH-LOG-11 | Injection in password | `"' OR '1'='1"` | 401, normal failure | API | P0 |
| AUTH-LOG-12 | Timing (optional hardening) | Measure 20 logins with an unknown email vs a wrong password | Similar response times. If unknown emails are much faster, compare against a dummy hash | API | P2 |
| AUTH-LOG-13 | Rate limit (if implemented) | 11 failed logins from one IP within 15 min | 11th → 429 "Too many login attempts", JSON body | API | P2 |
| AUTH-LOG-14 | Two logins | Log in twice | Both tokens work (no single-session rule) | API | P2 |

## requireAuth middleware (tested through `GET /api/auth/me`)

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| AUTH-MW-01 | Valid token | `Authorization: Bearer <token>` | 200, `data.user = { id, name, email }`, no password hash | API | P0 |
| AUTH-MW-02 | No header | — | 401, "Authentication required" | API | P0 |
| AUTH-MW-03 | `Bearer` with no token | `Authorization: Bearer ` | 401 | API | P0 |
| AUTH-MW-04 | Wrong scheme | `Authorization: Basic abc` / `Token <jwt>` | 401 | API | P1 |
| AUTH-MW-05 | Raw token, no scheme | `Authorization: <jwt>` | 401 | API | P1 |
| AUTH-MW-06 | Garbage token | `Bearer abc.def.ghi` | 401, no stack or library error text in the body | API | P0 |
| AUTH-MW-07 | Wrong secret | Token signed with `"other-secret"` | 401 | API | P0 |
| AUTH-MW-08 | Expired token | `jwt.sign({ sub: '1' }, secret, { expiresIn: -10 })` | 401, "Your session has expired. Please login again." | API | P0 |
| AUTH-MW-09 | `alg: none` attack | Unsigned token `header {alg:"none"}` + payload `{sub:"1"}` + empty signature | 401 | API | P0 |
| AUTH-MW-10 | Tampered payload | Valid token with the payload changed to `sub: "2"` and the original signature kept | 401 | API | P0 |
| AUTH-MW-11 | Deleted user | Valid token, user then deleted from DB | `/me` → 401 (not 500, not 200) | API | P0 |
| AUTH-MW-12 | Non-numeric `sub` | Correctly signed token with `sub: "abc"` | 401, not 500 | API | P1 |
| AUTH-MW-13 | Token in query string | `GET /api/auth/me?token=<jwt>` | 401 (tokens are only accepted in the header) | API | P1 |
| AUTH-MW-14 | Lowercase scheme | `authorization: bearer <jwt>` | Pick one behaviour and keep it. Recommended: 200 (header names are case-insensitive, the scheme is accepted case-insensitively) | API | P2 |
| AUTH-MW-15 | Very long header | 10 kb Authorization value | 401 or 431, server stable | API | P2 |

## Logout (client-side)

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| AUTH-OUT-01 | Known limitation documented | Read the README | States that tokens stay valid until expiry after logout (no server revocation) | CLI | P2 |
