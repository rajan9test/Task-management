# Module 6 — Frontend Foundation and Auth UI

**SRS refs:** §11.1 Login Page, §11.2 Registration Page, §12 Loading, §13 Error Handling, FR-01, FR-02
**Depends on:** Modules 1 and 3 (backend auth must work)
**Commit:** `Add auth UI`
**Test cases:** [../test-cases/06-frontend-auth.md](../test-cases/06-frontend-auth.md)

## Goal

A shared API client, auth state, routing, and the Login and Register pages. Logged-out users can only see auth pages, and logged-in users can only see the dashboard. An expired session sends the user back to login with a message.

## Scope

**In:** `api/client.js`, `api/auth.js`, `AuthContext`, route guards, Login and Register pages, shared UI pieces (Button, Input, Spinner, Alert), logout.
**Out:** dashboard content and task UI (module 7). For now `/dashboard` is a placeholder with a header and logout.

## Files

```
src/api/client.js            fetch wrapper
src/api/auth.js              register(), login(), getMe()
src/context/AuthContext.jsx  AuthProvider + useAuth()
src/components/ProtectedRoute.jsx
src/components/PublicOnlyRoute.jsx
src/components/ui/Button.jsx, Input.jsx, Spinner.jsx, Alert.jsx
src/components/Header.jsx    app name + user name + Logout
src/pages/LoginPage.jsx
src/pages/RegisterPage.jsx
src/pages/DashboardPage.jsx  placeholder for now
src/App.jsx                  routes
```

## Routes

| Path | Guard | Page |
|---|---|---|
| `/login` | PublicOnly (redirects to `/dashboard` if logged in) | LoginPage |
| `/register` | PublicOnly | RegisterPage |
| `/dashboard` | Protected (redirects to `/login` if not logged in) | DashboardPage |
| `*` | — | redirect to `/dashboard` (which then redirects to `/login` if needed) |

## API client (`api/client.js`)

One function every API call goes through: `apiRequest(path, { method, body, params })`.

Responsibilities:
1. Base URL from `import.meta.env.VITE_API_URL`.
2. Adds `Authorization: Bearer <token>` if a token is stored, and `Content-Type: application/json` when there is a body.
3. Turns `params` into a query string, skipping empty values.
4. Error handling, always throwing an `ApiClientError { status, message, errors }`:

| Situation | Message shown |
|---|---|
| `fetch` throws (server down, no network) | "Unable to connect to server. Please try again." |
| 401 on a protected call | "Your session has expired. Please login again.", then calls the registered `onUnauthorized` handler (clears the token and redirects to `/login`) |
| 400 with `errors` | "Please check the entered information." plus field `errors` for the form |
| 404 | the server message (e.g. "Task not found.") |
| other | the server `message`, or "Something went wrong." |

> A 401 from `/auth/login` (wrong password) must **not** trigger the session-expired logout. Only trigger it when a token was sent.

5. Returns `json.data` on success.

## Auth state (`AuthContext`)

- State: `token`, `user`, `isLoading` (true while checking a stored token at startup).
- On app load, if a token is in `localStorage`, call `GET /api/auth/me`. Valid → set `user`. Invalid → clear the token.
- `login(email, password)`: calls the API, stores the token in `localStorage`, sets `user`.
- `logout()`: removes the token, clears `user`, navigates to `/login`. This is the SRS logout requirement.
- Registers `logout` as the client's `onUnauthorized` handler, passing a flash message ("Your session has expired…") through router state.

> **Token storage tradeoff:** `localStorage` is simple and fine for this project, but readable by any script on the page (XSS risk). An httpOnly cookie is safer and a possible future improvement. Mention this in the README.

## Pages

### LoginPage
- Fields: Email, Password, plus a **Login** button.
- Link: "Don't have an account? Register" → `/register`.
- Client-side validation: both fields required, email format.
- While submitting, the button is disabled and shows "Logging in…".
- Server error → `<Alert>` above the form ("Invalid email or password").
- Shows a flash message from router state (e.g. "Account created. Please log in." or "Your session has expired…").
- On success → `/dashboard`.

### RegisterPage
- Fields: Name, Email, Password, Confirm Password, plus a **Create Account** button.
- Client validation: all required, email format, password ≥ 6, confirm matches ("Passwords do not match").
- Server field errors (e.g. 409 "Email is already registered") show next to the relevant field or in an Alert.
- On success → `/login` with the flash message "Account created. Please log in." The user logs in themselves, which keeps one clear login path.

## UI rules
- Centered card layout, works at 360px width.
- Each `<label>` is linked with `htmlFor`, inputs have the right `type` (`email`, `password`) and `autoComplete`, and error text uses `role="alert"`.
- No heavy animation (SRS §20).

## Testing (manual)

- [ ] Register: empty fields, bad email, 5-char password and mismatched confirm each show the right message without calling the API
- [ ] Register with an existing email → server error shown
- [ ] Register succeeds → redirected to login with the success message
- [ ] Login with a wrong password → "Invalid email or password"
- [ ] Login succeeds → dashboard placeholder with the user's name in the header
- [ ] Refresh on `/dashboard` → still logged in (token restored through `/auth/me`)
- [ ] Visiting `/login` while logged in → redirected to `/dashboard`
- [ ] Logout → back to `/login`, and `/dashboard` is no longer reachable
- [ ] Stop the backend and try to log in → "Unable to connect to server. Please try again."
- [ ] Edit the token in localStorage to garbage and refresh → back to login with the session message
- [ ] Buttons are disabled with loading text while requests run

## Done when

- [ ] All manual checks pass
- [ ] Every API call goes through `apiRequest`, with no stray `fetch` calls

## AI prompt

```text
Read docs/context.md and docs/plan/06-frontend-auth.md.
Build the frontend foundation: API client, AuthContext, route guards, Login and Register pages.

First explain the component structure and how a 401 is handled end to end. Wait for confirmation.
Use Tailwind, keep it simple and responsive. Do not build the task dashboard yet.
```
