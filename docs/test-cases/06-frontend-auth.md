# Test Cases — Module 6: Frontend Foundation and Auth UI

Plan: [../plan/06-frontend-auth.md](../plan/06-frontend-auth.md). Strategy: [00-test-strategy.md](00-test-strategy.md).

Run with both apps running. Keep DevTools open: **Network** to count requests, **Application → Local Storage** to inspect the token, **device mode** for mobile. P0 cases are good candidates for Playwright E2E tests.

## Behaviour these tests lock in

- Client validation blocks the request: an invalid form sends **zero** network requests.
- A wrong-password 401 on `/login` shows "Invalid email or password". It does **not** show "session expired".
- A 401 on any other call (token present) clears the token and redirects to `/login` with "Your session has expired. Please login again."
- Submit buttons are disabled while a request is pending, so double submits are impossible.
- After registering, the user is redirected to `/login` with "Account created. Please log in."

## Login page

| ID | Case | Steps | Expected | Type | P |
|---|---|---|---|---|---|
| FEA-LOG-01 | Page layout | Open `/login` | Email, Password, **Login** button, and the link "Don't have an account? Register" | UI | P0 |
| FEA-LOG-02 | Successful login | Valid credentials → Login | Redirect to `/dashboard`, user's name in the header, token in localStorage | UI | P0 |
| FEA-LOG-03 | Empty submit | Click Login with empty fields | "Email is required" and "Password is required", **0 requests** in Network | UI | P0 |
| FEA-LOG-04 | Invalid email format | `abc` | "Invalid email format", no request | UI | P1 |
| FEA-LOG-05 | Email with spaces | `"  asha@test.com  "` | Login succeeds | UI | P2 |
| FEA-LOG-06 | Wrong password | Correct email, wrong password | Alert "Invalid email or password". Password field keeps or clears its value consistently. **No** redirect, **no** "session expired" text | UI | P0 |
| FEA-LOG-07 | Loading state | DevTools throttling "Slow 3G" → Login | Button disabled with text "Logging in…" until the response | UI | P1 |
| FEA-LOG-08 | Double submit | Double-click Login quickly (Slow 3G) | Exactly **1** login request | UI | P1 |
| FEA-LOG-09 | Enter key | Type credentials, press Enter in the password field | Submits | UI | P1 |
| FEA-LOG-10 | Server down | Stop the backend → Login | "Unable to connect to server. Please try again.", button re-enabled | UI | P0 |
| FEA-LOG-11 | Server error | Make the backend return 500 (e.g. stop the DB) → Login | Generic error message, no raw JSON or stack shown | UI | P1 |
| FEA-LOG-12 | Error clears | After an error, edit a field and resubmit successfully | Old error is gone | UI | P2 |
| FEA-LOG-13 | Password masked | — | `type="password"`, and the value is not visible in page text | UI | P1 |
| FEA-LOG-14 | Autocomplete | Inspect inputs | `autocomplete="email"` and `"current-password"`, so browser password managers work | UI | P2 |
| FEA-LOG-15 | Register link | Click "Register" | Goes to `/register` without a full page reload | UI | P1 |

## Register page

| ID | Case | Steps | Expected | Type | P |
|---|---|---|---|---|---|
| FEA-REG-01 | Page layout | Open `/register` | Name, Email, Password, Confirm Password, **Create Account**, and a link back to Login | UI | P0 |
| FEA-REG-02 | Successful registration | Valid data | Redirect to `/login` with "Account created. Please log in." | UI | P0 |
| FEA-REG-03 | Empty submit | — | Required errors on all 4 fields, 0 requests | UI | P0 |
| FEA-REG-04 | Invalid email | `asha@` | "Invalid email format", no request | UI | P1 |
| FEA-REG-05 | Short password | `abcde` | "Password must be at least 6 characters", no request | UI | P0 |
| FEA-REG-06 | Password exactly 6 | `abcdef` + matching confirm | Request sent, success | UI | P1 |
| FEA-REG-07 | Confirm mismatch | `secret123` / `secret124` | "Passwords do not match", no request | UI | P0 |
| FEA-REG-08 | Mismatch then fix | Fix the confirm field | Error clears (on change or next submit) | UI | P2 |
| FEA-REG-09 | Duplicate email | Use an existing email | "Email is already registered" shown at the email field or in an alert. Form values kept, except passwords may be cleared | UI | P0 |
| FEA-REG-10 | Whitespace name | `"    "` | "Name is required" | UI | P1 |
| FEA-REG-11 | Loading and double submit | Slow 3G, double-click | Button reads "Creating account…", disabled, 1 request | UI | P1 |
| FEA-REG-12 | Server down | Stop the backend | Connection error message | UI | P1 |
| FEA-REG-13 | Flash message once | After FEA-REG-02, refresh `/login` | The "Account created" message is gone (it came from router state) | UI | P2 |

## Session handling and route guards

| ID | Case | Steps | Expected | Type | P |
|---|---|---|---|---|---|
| FEA-SES-01 | Protected route | Logged out, open `/dashboard` directly | Redirect to `/login`, dashboard content never flashes | UI | P0 |
| FEA-SES-02 | Public-only route | Logged in, open `/login` or `/register` | Redirect to `/dashboard` | UI | P1 |
| FEA-SES-03 | Refresh keeps session | On `/dashboard`, press F5 | Still logged in. During the `/auth/me` check you see a loader, not the login page | UI | P0 |
| FEA-SES-04 | Logout | Click Logout | Token removed from localStorage, redirect to `/login` | UI | P0 |
| FEA-SES-05 | Back after logout | Logout, then press Back | Not shown the dashboard with data. Redirected to `/login` | UI | P0 |
| FEA-SES-06 | Tampered token | Edit the token in localStorage to garbage, refresh | Redirect to `/login` with "Your session has expired. Please login again.", token removed | UI | P0 |
| FEA-SES-07 | Expired token | Backend `JWT_EXPIRES_IN=1m`, log in, wait 70 s, click anything that calls the API | Redirect to login with the session-expired message | UI | P0 |
| FEA-SES-08 | Deleted user | Log in, delete the user in DB, refresh | Redirect to login | UI | P1 |
| FEA-SES-09 | Two tabs | Log out in tab 1, then act in tab 2 | Tab 2's next API call → 401 → redirect to login (or it syncs through the `storage` event) | UI | P1 |
| FEA-SES-10 | Unknown route | `/abc` | Redirect to `/dashboard` (logged in) or `/login` (logged out) | UI | P2 |
| FEA-SES-11 | Server down on startup | Token stored, backend stopped, refresh | Shows the connection error. Does **not** delete the token or log out (it's a network problem, not an auth one) | UI | P1 |

## Security

| ID | Case | Steps | Expected | Type | P |
|---|---|---|---|---|---|
| FEA-SEC-01 | Token not in URL | Watch the address bar and Network during login and navigation | The token only appears in the `Authorization` header | UI | P0 |
| FEA-SEC-02 | XSS in name | Register with name `<img src=x onerror=alert(1)>`, log in | The header shows the text literally, no alert. No `dangerouslySetInnerHTML` in the code | UI | P0 |
| FEA-SEC-03 | No secrets logged | Console during register and login | No password or token printed | UI | P1 |
| FEA-SEC-04 | Password not stored | Check localStorage, sessionStorage and cookies | Only the token (and optionally the non-sensitive user name/email) | UI | P0 |
| FEA-SEC-05 | Build has no secrets | `npm run build`, search `dist/` for `JWT_SECRET` and `DATABASE_URL` | Not found | CLI | P0 |

## Accessibility and responsive layout

| ID | Case | Steps | Expected | Type | P |
|---|---|---|---|---|---|
| FEA-A11Y-01 | Labels | Click on each label | Focuses its input (`htmlFor`/`id` linked) | UI | P1 |
| FEA-A11Y-02 | Keyboard only | Tab through the login and register forms | Logical order, visible focus ring, can submit with Enter | UI | P1 |
| FEA-A11Y-03 | Errors announced | Inspect error elements | `role="alert"` or `aria-describedby` on the input, plus `aria-invalid="true"` | UI | P2 |
| FEA-A11Y-04 | Contrast | Lighthouse accessibility audit | Score ≥ 90, no contrast failures | UI | P2 |
| FEA-RES-01 | Mobile | Device mode 360×640 | Forms fit with no horizontal scroll, and inputs are at least 16px font (no iOS zoom) | UI | P1 |
| FEA-RES-02 | Desktop | 1440 px | Form is centred and has a sensible max width | UI | P2 |
