# Test Cases — Module 7: Dashboard and Task UI

Plan: [../plan/07-frontend-dashboard-tasks.md](../plan/07-frontend-dashboard-tasks.md). Strategy: [00-test-strategy.md](00-test-strategy.md).

Setup: log in as user A with the **standard test data** unless a case says otherwise. Keep DevTools Network open.

> **Note:** In development, React StrictMode runs effects twice, so you may see 2 identical requests on mount. Count requests in a production build (`npm run build && npm run preview`), or treat 2 as expected in dev.

## Behaviour these tests lock in

- Unticking the checkbox on a COMPLETED task sets it to **TODO**. Ticking an IN_PROGRESS task sets it to COMPLETED, and unticking it later gives TODO, not IN_PROGRESS.
- Filters, search and sort are **kept** after creating, editing, completing or deleting a task.
- A task that no longer matches the active filter (e.g. completed while "Status: TODO" is set) disappears after the refetch.
- "Overdue" = due date before **today's local date** and status not COMPLETED. Due today is not overdue.
- Dates show exactly the stored calendar day in every timezone.

## Dashboard load and stats

| ID | Case | Steps | Expected | Type | P |
|---|---|---|---|---|---|
| FED-LOAD-01 | Initial load | Open `/dashboard` | Header, 4 stat cards, toolbar, task list | UI | P0 |
| FED-LOAD-02 | Loading states | Slow 3G, refresh | Stat skeletons and "Loading tasks..." shown, then data. The page never looks frozen or blank | UI | P0 |
| FED-LOAD-03 | Request count | Production build, load the dashboard | 1 `/tasks` request, 1 `/tasks/stats` request (plus `/auth/me`) | UI | P2 |
| FED-STAT-01 | Correct numbers | Standard data | Total 6, Pending 4, Completed 2, High Priority 2 | UI | P0 |
| FED-STAT-02 | New user | Register a new user and log in | All cards show 0, not blank or NaN | UI | P0 |
| FED-STAT-03 | After create | Create a HIGH task | Total, Pending and High Priority each +1, without a page refresh | UI | P0 |
| FED-STAT-04 | After complete / uncomplete | Tick, then untick a task | Pending and Completed move by 1 each way | UI | P0 |
| FED-STAT-05 | After delete | Delete a task | Counts drop correctly | UI | P0 |
| FED-STAT-06 | After edit priority | Change a task's priority LOW → HIGH | High Priority +1 | UI | P1 |
| FED-STAT-07 | Stats unaffected by filters | Apply Status: COMPLETED | Cards still show overall totals | UI | P1 |

## Task list states

| ID | Case | Steps | Expected | Type | P |
|---|---|---|---|---|---|
| FED-LIST-01 | Data | Standard data | 6 tasks, newest first | UI | P0 |
| FED-LIST-02 | Empty, no filters | New user | "No tasks yet. Create your first task!" | UI | P1 |
| FED-LIST-03 | Empty with filters | Search `zzz` | "No tasks match your search or filters." (different from LIST-02) | UI | P1 |
| FED-LIST-04 | Error + retry | Stop the backend, refresh | Error message with a **Retry** button. Start the backend, click Retry → list loads | UI | P0 |
| FED-LIST-05 | Delete last task | Delete every task one by one | Ends at the "No tasks yet" empty state | UI | P2 |
| FED-LIST-06 | Large list | Seed 500 tasks | Renders, scrolling stays smooth, no browser freeze | UI | P2 |

## Task item display

| ID | Case | Steps | Expected | Type | P |
|---|---|---|---|---|---|
| FED-ITEM-01 | Fields shown | Look at one task | Title, description, priority badge, status badge, due date, and created/updated dates | UI | P0 |
| FED-ITEM-02 | Badge text | — | Priority and status show **text** (not colour only) | UI | P1 |
| FED-ITEM-03 | No due date | "Practice Java Collections" | Shows "No due date" (not "Invalid Date" or "01 Jan 1970") | UI | P1 |
| FED-ITEM-04 | Overdue | TODO task due yesterday | "Overdue" indicator | UI | P1 |
| FED-ITEM-05 | Overdue but completed | "Prepare for interview" (COMPLETED, due yesterday) | **No** overdue indicator | UI | P1 |
| FED-ITEM-06 | XSS title | Create a task titled `<img src=x onerror=alert(1)>` | Shown as literal text, no alert, nothing injected into the DOM | UI | P0 |
| FED-ITEM-07 | Long title | 200 chars with no spaces | Wraps or truncates with an ellipsis. Layout doesn't break or scroll horizontally | UI | P1 |
| FED-ITEM-08 | Long description | 2,000 chars | Truncated in the list, full text visible in edit | UI | P2 |
| FED-ITEM-09 | Multiline / emoji | Description `"Line 1\nLine 2 📚"` | Readable, emoji renders | UI | P2 |
| FED-ITEM-10 | Due date timezone | Set the OS/browser timezone to America/New_York, then Asia/Kolkata; task due `2026-10-10` | Shows 10 Oct in both (never 9 Oct) | UI | P0 |
| FED-ITEM-11 | Due today | Task due today | Not overdue | UI | P2 |

## Complete toggle (checkbox)

| ID | Case | Steps | Expected | Type | P |
|---|---|---|---|---|---|
| FED-CHK-01 | Complete | Tick a TODO task | Status COMPLETED, title gets a line-through, stats update | UI | P0 |
| FED-CHK-02 | Uncomplete | Untick a COMPLETED task | Status TODO | UI | P0 |
| FED-CHK-03 | IN_PROGRESS | Tick an IN_PROGRESS task | COMPLETED | UI | P1 |
| FED-CHK-04 | Rapid clicks | Slow 3G, click the checkbox 3 times fast | Checkbox disabled while pending. Only 1 request, final state consistent | UI | P1 |
| FED-CHK-05 | Failure | Stop the backend, tick | Error message, checkbox returns to its previous state | UI | P1 |
| FED-CHK-06 | Under filter | Status: TODO filter, tick a task | Task disappears from the filtered list after the refetch | UI | P2 |
| FED-CHK-07 | Accessible | Tab to the checkbox, press Space | Toggles. It has an accessible name such as "Mark 'Complete Java Assignment' as completed" | UI | P1 |

## Create task (form modal)

| ID | Case | Steps | Expected | Type | P |
|---|---|---|---|---|---|
| FED-CRT-01 | Open | Click "+ Create Task" | Modal titled "Create Task", empty fields, Priority MEDIUM, Status TODO, focus on Title | UI | P0 |
| FED-CRT-02 | Title only | Enter a title → Save | Modal closes, task at the top, success message, stats update | UI | P0 |
| FED-CRT-03 | All fields | Fill everything including a date → Save | Task shows all values correctly | UI | P0 |
| FED-CRT-04 | Empty title | Save with an empty title | "Title is required", no request | UI | P0 |
| FED-CRT-05 | Whitespace title | `"   "` → Save | "Title is required", no request | UI | P1 |
| FED-CRT-06 | Title max length | Type 250 chars | Input stops at 200 (`maxLength`), or an error is shown | UI | P2 |
| FED-CRT-07 | Saving state | Slow 3G → Save | "Saving…", Save disabled, modal stays open | UI | P1 |
| FED-CRT-08 | Double submit | Double-click Save | 1 POST request, 1 task created | UI | P0 |
| FED-CRT-09 | Server error | Stop the backend → Save | Error shown inside the modal. Modal **stays open with the entered data** | UI | P0 |
| FED-CRT-10 | Server validation | Bypass client checks (e.g. edit priority to `VERY_HIGH` in React DevTools) → Save | Server error shown at the field | UI | P2 |
| FED-CRT-11 | Cancel | Type data, Cancel | Modal closes, nothing created | UI | P1 |
| FED-CRT-12 | Escape | Press Esc | Same as Cancel | UI | P2 |
| FED-CRT-13 | Form reset | Open edit for a task, cancel, then open Create | Create form is **empty** (no leftover edit data) | UI | P1 |
| FED-CRT-14 | Clear date | Pick a date, then clear it → Save | Task has no due date | UI | P2 |
| FED-CRT-15 | Filters kept | Status: TODO active, create a TODO task | Filter still applied, new task visible | UI | P2 |

## Edit task

| ID | Case | Steps | Expected | Type | P |
|---|---|---|---|---|---|
| FED-EDT-01 | Prefilled | Click Edit | Modal titled "Edit Task" with every field prefilled, including the date picker | UI | P0 |
| FED-EDT-02 | Save changes | Change title and priority → Save | List and stats update, "Updated" date changes, "Created" date doesn't | UI | P0 |
| FED-EDT-03 | Clear description | Empty the description → Save | Description no longer shown | UI | P1 |
| FED-EDT-04 | Clear due date | Clear the date → Save | "No due date" | UI | P1 |
| FED-EDT-05 | Cancel | Change fields, then Cancel | Original values kept | UI | P1 |
| FED-EDT-06 | Deleted elsewhere | Open edit in tab 1, delete the task in tab 2, Save in tab 1 | "Task not found.", modal closes, list refreshes without that task | UI | P1 |
| FED-EDT-07 | Status via form | Change status to IN_PROGRESS in the form | Saved, badge updates | UI | P1 |

## Delete task

| ID | Case | Steps | Expected | Type | P |
|---|---|---|---|---|---|
| FED-DEL-01 | Confirm dialog | Click Delete | "Are you sure you want to delete this task?" plus the task title | UI | P0 |
| FED-DEL-02 | Cancel | Cancel | Task still there, 0 DELETE requests | UI | P0 |
| FED-DEL-03 | Confirm | Delete | Task removed, success message, stats update | UI | P0 |
| FED-DEL-04 | Double click | Double-click Delete in the dialog | 1 request, no error | UI | P1 |
| FED-DEL-05 | Failure | Stop the backend → Delete | Error shown, task still in the list | UI | P1 |
| FED-DEL-06 | Already deleted | Delete in tab 2, then delete in tab 1 | "Task not found.", list refreshes | UI | P2 |

## Search, filter and sort

| ID | Case | Steps | Expected | Type | P |
|---|---|---|---|---|---|
| FED-SRC-01 | Search | Type `java` | Only the 2 Java tasks | UI | P0 |
| FED-SRC-02 | Debounce | Type `java` quickly | 1 request about 300 ms after the last keystroke, not 4 | UI | P1 |
| FED-SRC-03 | Clear search | Delete the text | All tasks back | UI | P1 |
| FED-SRC-04 | Out-of-order responses | Slow 3G: type `ja`, pause 400 ms, type `va` | Final list shows `java` results, not stale `ja` results | UI | P1 |
| FED-SRC-05 | Special chars | Search `100%` | Only "Submit 100% report_v2" | UI | P2 |
| FED-FLT-01 | Status filter | Each option | Correct subset | UI | P0 |
| FED-FLT-02 | Priority filter | Each option | Correct subset | UI | P0 |
| FED-FLT-03 | Combined | TODO + HIGH | Only "Complete Java Assignment" | UI | P0 |
| FED-FLT-04 | Combined with search | `java` + TODO + HIGH | Same single task | UI | P1 |
| FED-FLT-05 | Back to All | Set both selects to All | All tasks | UI | P1 |
| FED-FLT-06 | Clear filters | Click "Clear filters" (if built) | Search, status and priority reset, all tasks shown | UI | P2 |
| FED-SRT-01 | Each sort | Newest / Oldest / Due date / Priority | Orders match the module 5 rules (no-due-date tasks last, HIGH first) | UI | P0 |
| FED-SRT-02 | Sort + filter | TODO + Due date | Filtered and ordered | UI | P1 |

## Session and isolation

| ID | Case | Steps | Expected | Type | P |
|---|---|---|---|---|---|
| FED-SES-01 | Other user | Log out, log in as B | Only "Java secret", B's stats. None of A's data, even briefly while loading | UI | P0 |
| FED-SES-02 | Token expires on dashboard | `JWT_EXPIRES_IN=1m`, wait, then create a task | Redirect to login with the session-expired message | UI | P0 |
| FED-SES-03 | Logout clears data | Log out as A, log in as B in the same tab | No stale A tasks or stats rendered | UI | P0 |

## Responsive and accessibility

| ID | Case | Steps | Expected | Type | P |
|---|---|---|---|---|---|
| FED-RES-01 | 360 px | Device mode | Stats in a 2×2 grid, toolbar stacked, tasks as cards, **no horizontal scroll** | UI | P0 |
| FED-RES-02 | 768 px / 1280 px | — | Layout adapts, nothing overlaps | UI | P1 |
| FED-RES-03 | Modal on mobile | Open the form at 360×640 | Fits or scrolls inside, Save and Cancel reachable, keyboard doesn't hide the inputs | UI | P1 |
| FED-A11Y-01 | Keyboard flow | Tab: search → selects → Create → task checkbox → Edit → Delete | All reachable, visible focus | UI | P1 |
| FED-A11Y-02 | Modal focus | Open the modal | Focus moves inside, Tab stays within the modal, Esc closes, focus returns to the button that opened it | UI | P1 |
| FED-A11Y-03 | Icon buttons | Screen reader or inspect | Edit and Delete have `aria-label`s naming the task | UI | P1 |
| FED-A11Y-04 | Lighthouse | Run an audit on the dashboard | Accessibility ≥ 90 | UI | P2 |
