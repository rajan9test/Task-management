# Module 7 — Dashboard and Task UI

**SRS refs:** §11.3 Dashboard Page, §11.4 Create/Edit Task UI, FR-04 to FR-12, §12 Loading, §13 Errors, §20 UI
**Depends on:** Modules 4, 5, 6
**Commits:** `Add task UI`, `Add search and filters`, `Add dashboard`
**Test cases:** [../test-cases/07-frontend-dashboard-tasks.md](../test-cases/07-frontend-dashboard-tasks.md)

## Goal

The dashboard shows stats cards and the user's task list, with search, filters and sorting. Tasks can be created, edited, completed and deleted (with confirmation). Every action shows a loading state and handles errors.

## Scope

**In:** everything visible on `/dashboard`.
**Out:** new backend endpoints. Use the module 4–5 APIs as they are.

## Files

```
src/api/tasks.js                 getTasks(params), getTask(id), createTask, updateTask, updateTaskStatus, deleteTask, getStats
src/hooks/useDebounce.js         debounce for search input
src/pages/DashboardPage.jsx      owns state and data loading
src/components/StatsCards.jsx
src/components/TaskToolbar.jsx   search + status + priority + sort + "Create Task"
src/components/TaskList.jsx      loading / empty / error / list states
src/components/TaskItem.jsx      one task row/card
src/components/TaskFormModal.jsx shared create/edit form
src/components/ConfirmDialog.jsx
src/components/ui/Modal.jsx, Select.jsx, Badge.jsx
src/utils/format.js              formatDate, isOverdue
```

## Layout

```
┌───────────────────────────────────────────────────────────┐
│ Student Task Manager                     Hi, Riya  Logout │  Header
├───────────────────────────────────────────────────────────┤
│ [Total 20] [Pending 12] [Completed 8] [High Priority 4]   │  StatsCards
├───────────────────────────────────────────────────────────┤
│ [Search tasks...] [Status ▾] [Priority ▾] [Sort ▾] [+ Create Task] │  TaskToolbar
├───────────────────────────────────────────────────────────┤
│ [ ] Complete Java Assignment   HIGH   TODO   Due 10 Oct  ✎ 🗑 │  TaskList
│     Chapter 5 exercises · Created 3 Oct · Updated 3 Oct      │
│ [✓] DSA Practice               HIGH   COMPLETED          ✎ 🗑 │
└───────────────────────────────────────────────────────────┘
```
On mobile (< 640px), the stats become a 2×2 grid, the toolbar controls stack, and tasks render as cards.

## State (in `DashboardPage`)

| State | Purpose |
|---|---|
| `filters` `{ search, status, priority, sort }` | toolbar values. `status`/`priority` = `''` means All, `sort` defaults to `'newest'` |
| `tasks`, `tasksLoading`, `tasksError` | list data |
| `stats`, `statsLoading` | cards |
| `editingTask` (null / `{}` for new / task) | opens the form modal |
| `deletingTask` | opens the confirm dialog |

**Data flow:**
- `useEffect` on `[debouncedSearch, status, priority, sort]` → `getTasks(filters)`. Filtering happens **on the server**, so the UI never sees other data.
- Stats load on mount and **reload after every create, update, status change or delete**.
- After a mutation, refetch the list as well. This is simpler and always correct compared with editing local state by hand.
- Search is debounced by 300 ms so typing doesn't send a request per keystroke.
- Ignore stale responses: in the effect, set a `cancelled` flag on cleanup, so a slow old request can't overwrite newer results.

## Components

### StatsCards
Four cards: Total, Pending, Completed, High Priority. Show skeleton placeholders while loading.

### TaskToolbar
- Search input (`placeholder="Search tasks..."`, `aria-label`).
- Status select: All / To do / In progress / Completed (value `''` / `TODO` / …).
- Priority select: All / Low / Medium / High.
- Sort select: Newest first / Oldest first / Due date / Priority.
- "+ Create Task" button → `setEditingTask({})`.
- Optional: a "Clear filters" link when any filter is active.

### TaskList
| State | Shows |
|---|---|
| loading | "Loading tasks..." / spinner |
| error | error message plus a **Retry** button |
| empty with no filters | "No tasks yet. Create your first task!" |
| empty with filters | "No tasks match your search or filters." |
| data | `TaskItem`s |

### TaskItem
- **Completion checkbox** (FR-08): checked = `COMPLETED`. Clicking it calls `PATCH /status`, with `COMPLETED` when checking and `TODO` when unchecking. Disable it while the request runs. Completed titles get a line-through.
- Title, description (truncated), priority badge (HIGH red, MEDIUM amber, LOW gray), status badge, due date (highlighted "Overdue" if past and not completed), and created/updated dates.
- Edit button → `setEditingTask(task)`; Delete button → `setDeletingTask(task)`.
- Icon buttons have an `aria-label` ("Edit task", "Delete task").

### TaskFormModal (shared create/edit)
- Fields: Title*, Description, Priority (default MEDIUM), Status (default TODO), Due date (`<input type="date">`), plus Save and Cancel.
- Title is "Create Task" or "Edit Task" depending on whether `task.id` exists.
- Client validation: title required, max 200.
- Submit → `createTask` or `updateTask` (sending all fields, since PUT is a full update). Empty description or due date are sent as `null`.
- While saving, the Save button is disabled and reads "Saving…".
- Server validation errors show on the matching fields. A 404 (task deleted elsewhere) closes the modal, shows "Task not found." and refreshes the list.
- Escape and Cancel close the modal. Focus moves to the title input on open.

### ConfirmDialog
"Are you sure you want to delete this task?" plus the task title, with **Cancel** and **Delete** (red) buttons. Delete shows a loading state. On success, close, refetch the list and stats.

## Feedback
Use a small inline success message or toast after create, update or delete (e.g. "Task created successfully"), using the server `message`. A toast library is optional, and a simple state-driven banner is enough.

## Testing (manual — record it for the demo)

- [ ] Dashboard loads: cards and list show loading states, then data
- [ ] Create a task with only a title → appears with MEDIUM/TODO, Total and Pending +1
- [ ] Create with an empty title → blocked with "Title is required"
- [ ] Edit a task → changes shown, "Updated" date changes
- [ ] Tick the checkbox → COMPLETED with line-through, Completed +1 and Pending −1; untick → TODO
- [ ] Delete → confirmation appears; Cancel keeps it, Delete removes it and stats update
- [ ] Search "java" → only matching tasks; search "zzz" → "No tasks match…"
- [ ] Status TODO + Priority HIGH → only high-priority TODO tasks
- [ ] Each sort option orders correctly
- [ ] Log in as a second user → none of the first user's tasks or stats
- [ ] Stop the backend → error message with a Retry that works after restarting
- [ ] Works at 360px width (DevTools device mode), with no horizontal scroll
- [ ] Keyboard only: can reach the toolbar, open and close the modal, and submit the form

## Done when

- [ ] All checks pass
- [ ] Screenshots possible for: dashboard, create task, edit task, filters, completed task

## AI prompt

```text
Read docs/context.md and docs/plan/07-frontend-dashboard-tasks.md.
Create the task dashboard UI using the existing task APIs (modules 4–5) and the existing
API client and AuthContext (module 6).

First explain the component structure and data flow (which state lives where, when the list
and stats are refetched). Wait for confirmation. Then implement it.
Keep the UI responsive and simple. Do not modify backend code.
```
