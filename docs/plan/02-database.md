# Module 2 — Database

**SRS refs:** §7 Database Requirements, §14 Security (hashed passwords)
**Depends on:** Module 1
**Commit:** `Add database schema`
**Test cases:** [../test-cases/02-database.md](../test-cases/02-database.md)

## Goal

Create the `users` and `tasks` tables with constraints that enforce the SRS rules at the database level, plus a connection pool and a repeatable migration script.

## Scope

**In:** `db/pool.js`, `db/migrations/001_init.sql`, `db/migrate.js`, `npm run migrate`.
**Out:** repositories and queries for features (those are added in modules 3–5).

## Schema

### `users`
| Column | Type | Constraints |
|---|---|---|
| id | `INTEGER GENERATED ALWAYS AS IDENTITY` | PRIMARY KEY |
| name | `VARCHAR(100)` | NOT NULL |
| email | `VARCHAR(255)` | NOT NULL, UNIQUE. Stored lowercase and trimmed by the service |
| password_hash | `VARCHAR(255)` | NOT NULL. bcrypt hash, never plain text |
| created_at | `TIMESTAMPTZ` | NOT NULL DEFAULT `NOW()` |
| updated_at | `TIMESTAMPTZ` | NOT NULL DEFAULT `NOW()` |

> The SRS names this column `password`. We use `password_hash` so nobody mistakes it for plain text. Mention this in the README.

### `tasks`
| Column | Type | Constraints |
|---|---|---|
| id | `INTEGER GENERATED ALWAYS AS IDENTITY` | PRIMARY KEY |
| user_id | `INTEGER` | NOT NULL, `REFERENCES users(id) ON DELETE CASCADE` |
| title | `VARCHAR(200)` | NOT NULL, `CHECK (length(trim(title)) > 0)` |
| description | `TEXT` | NULL |
| priority | `VARCHAR(10)` | NOT NULL DEFAULT `'MEDIUM'`, `CHECK (priority IN ('LOW','MEDIUM','HIGH'))` |
| status | `VARCHAR(15)` | NOT NULL DEFAULT `'TODO'`, `CHECK (status IN ('TODO','IN_PROGRESS','COMPLETED'))` |
| due_date | `DATE` | NULL |
| created_at | `TIMESTAMPTZ` | NOT NULL DEFAULT `NOW()` |
| updated_at | `TIMESTAMPTZ` | NOT NULL DEFAULT `NOW()` |

### Indexes
- `users(email)`: created automatically by UNIQUE.
- `tasks(user_id)`: every task query filters by owner.
- `tasks(user_id, status)`: helps status filters and stats. Optional at this data size, but good practice.

### Relationship
`users 1 ──< tasks` through `tasks.user_id`. Deleting a user deletes their tasks (`ON DELETE CASCADE`).

## Design decisions

| Decision | Reason |
|---|---|
| `VARCHAR + CHECK` instead of Postgres `ENUM` types | Easier to read and change. The DB rejects `VERY_HIGH` even if backend validation is skipped |
| Integer identity IDs | Simple. Guessable IDs are safe because every query checks ownership (module 4) |
| `updated_at` set in UPDATE queries (`updated_at = NOW()`) instead of a trigger | Visible in the code, easier to explain |
| `TIMESTAMPTZ` | Avoids timezone bugs |
| `DATE` for `due_date` | A deadline is a day, not a moment |
| Plain SQL files + small runner | Shows exactly what the DB looks like, with no ORM to learn |

## Files

### `src/db/pool.js`
```js
import pg from 'pg';
import { env } from '../config/env.js';
export const pool = new pg.Pool({ connectionString: env.DATABASE_URL });
```
Also export `query(text, params)` as a thin helper around `pool.query`, and:
- `pg.types.setTypeParser(1082, v => v)` so `DATE` columns stay `YYYY-MM-DD` strings (no timezone shift).
- `pool.on('error', err => console.error(...))` so a dropped idle connection (e.g. Postgres restart) is logged instead of crashing the process.

### `src/db/migrations/001_init.sql`
Contains `CREATE TABLE IF NOT EXISTS users …`, `CREATE TABLE IF NOT EXISTS tasks …` and `CREATE INDEX IF NOT EXISTS …`.

### `src/db/migrate.js`
- Reads every `.sql` file in `migrations/`, sorted by name, and runs each inside a transaction.
- Logs which files ran, then closes the pool.
- Because of `IF NOT EXISTS`, running it twice is harmless. For this project we keep it that simple and do not track applied migrations in a table (mention this as a known limitation).

## Testing

- [ ] `npm run migrate` creates both tables (check with `\d users` and `\d tasks` in `psql`)
- [ ] Running it a second time does not fail
- [ ] Manual SQL checks in `psql`:
  - [ ] inserting two users with the same email fails
  - [ ] inserting a task with `priority = 'VERY_HIGH'` fails
  - [ ] inserting a task with `user_id = 9999` fails (foreign key)
  - [ ] deleting a user deletes their tasks
- [ ] Run the same migration against `task_manager_test`

## Done when

- [ ] Both tables exist with all constraints and indexes
- [ ] Migration is repeatable
- [ ] `.env.example` `DATABASE_URL` works for a fresh setup

## AI prompt

```text
Read docs/plan/02-database.md. Design review first: explain the schema, constraints and
indexes back to me, and point out anything you would change and why. Do not write code yet.

After I confirm: create pool.js, 001_init.sql and migrate.js exactly as described.
Do not create repositories or feature code.
```
