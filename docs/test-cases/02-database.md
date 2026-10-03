# Test Cases — Module 2: Database

Plan: [../plan/02-database.md](../plan/02-database.md). Strategy: [00-test-strategy.md](00-test-strategy.md).

These cases test the **database itself**: constraints must hold even if backend validation has a bug. Run them as SQL in `psql` or as Vitest tests using `pool.query` directly. A constraint violation must raise an error, and no row may be written.

## Migration

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| DB-MIG-01 | Fresh migration | Empty DB, `npm run migrate` | `users` and `tasks` created, script logs the files run, exit code 0 | CLI | P0 |
| DB-MIG-02 | Re-run | Run `npm run migrate` again | Exit code 0, no errors, existing data untouched | CLI | P0 |
| DB-MIG-03 | Re-run with data | Insert rows, then migrate again | Rows still there | CLI | P1 |
| DB-MIG-04 | Broken SQL rolls back | Temporarily add a `002_bad.sql` with a valid `CREATE TABLE x` followed by invalid SQL | Script fails with a non-zero exit, and table `x` does **not** exist (transaction rolled back) | CLI | P1 |
| DB-MIG-05 | DB unreachable | Stop Postgres (or set a wrong port), migrate | Clear error such as "connect ECONNREFUSED", non-zero exit, no hang | CLI | P1 |
| DB-MIG-06 | Wrong credentials | Wrong password in `DATABASE_URL` | Clear auth error, non-zero exit, and the password is **not** printed in the log | CLI | P1 |
| DB-MIG-07 | Pool closed | After migrating | Process exits on its own (doesn't hang on open connections) | CLI | P2 |

## Schema structure

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| DB-SCH-01 | users columns | `\d users` | id, name, email, password_hash, created_at, updated_at with the types and NOT NULLs from the plan | DB | P0 |
| DB-SCH-02 | tasks columns | `\d tasks` | All columns, types, defaults and CHECKs from the plan | DB | P0 |
| DB-SCH-03 | Indexes | `\di` | Unique index on `users.email`, plus indexes on `tasks(user_id)` and `tasks(user_id, status)` | DB | P1 |
| DB-SCH-04 | Encoding | `SHOW server_encoding` | `UTF8` | DB | P1 |

## users constraints

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| DB-USR-01 | Valid insert | name, email, password_hash | Inserted, `id` generated, `created_at` and `updated_at` set to now | DB | P0 |
| DB-USR-02 | Duplicate email | Insert `a@test.com` twice | Second insert fails with `23505 unique_violation` | DB | P0 |
| DB-USR-03 | Email case at DB level | Insert `a@test.com` then `A@test.com` | **Recommended:** fails (unique index on `LOWER(email)`). If only the plain UNIQUE exists it succeeds, so the service **must** lowercase (covered by AUTH-REG-08). Record which one the project uses | DB | P1 |
| DB-USR-04 | NULL name / email / password_hash | Insert with each one NULL | Fails with `23502 not_null_violation` | DB | P0 |
| DB-USR-05 | Name over 100 chars | 101-char name | Fails (`22001 string_data_right_truncation`) | DB | P2 |
| DB-USR-06 | Explicit id | `INSERT … (id, …) VALUES (999, …)` | Fails (GENERATED ALWAYS) | DB | P2 |
| DB-USR-07 | Unicode | Name `Rāj Kumār 😀` | Stored and read back unchanged | DB | P2 |

## tasks constraints

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| DB-TSK-01 | Minimal insert | user_id + title only | Inserted with `priority='MEDIUM'`, `status='TODO'`, `description` and `due_date` NULL, timestamps set | DB | P0 |
| DB-TSK-02 | Invalid priority | `priority='VERY_HIGH'` | Fails with `23514 check_violation` | DB | P0 |
| DB-TSK-03 | Lowercase priority | `priority='high'` | Fails (CHECK is case-sensitive) | DB | P1 |
| DB-TSK-04 | Invalid status | `status='DONE'` | Fails with `23514` | DB | P0 |
| DB-TSK-05 | NULL priority / status | Explicit NULL | Fails with `23502` (the default does not apply to an explicit NULL) | DB | P1 |
| DB-TSK-06 | Empty title | `title=''` | Fails (CHECK `length(trim(title)) > 0`) | DB | P0 |
| DB-TSK-07 | Whitespace title | `title='   '` | Fails | DB | P0 |
| DB-TSK-08 | NULL title | `title=NULL` | Fails with `23502` | DB | P0 |
| DB-TSK-09 | Title 200 / 201 chars | Boundary | 200 succeeds, 201 fails | DB | P1 |
| DB-TSK-10 | Unknown user | `user_id=999999` | Fails with `23503 foreign_key_violation` | DB | P0 |
| DB-TSK-11 | Cascade delete | Delete a user who has 3 tasks | Their 3 tasks are gone, other users' tasks untouched | DB | P0 |
| DB-TSK-12 | Invalid date | `due_date='2026-02-30'` | Fails (`22008 datetime_field_overflow`) | DB | P1 |
| DB-TSK-13 | Leap day | `'2028-02-29'` succeeds, `'2027-02-29'` fails | As stated | DB | P2 |
| DB-TSK-14 | Long description | 10,000-char description | Stored (TEXT has no DB limit; the API enforces 2000) | DB | P2 |
| DB-TSK-15 | SQL text stored literally | `title = $1` with value `'); DROP TABLE tasks;--` through a parameterised insert | Row stored with that exact title, table intact | DB | P0 |
| DB-TSK-16 | Unicode / emoji / newlines | `"Study 📚\nChapter 2"` | Read back byte-for-byte equal | DB | P2 |

## Connection pool and type parsing

| ID | Case | Input / Steps | Expected | Type | P |
|---|---|---|---|---|---|
| DB-POOL-01 | DATE as string | Insert `due_date='2026-10-10'`, select it through `pool.query` | JS value is the string `"2026-10-10"`, not a `Date` (type parser 1082) | DB | P0 |
| DB-POOL-02 | DATE across timezones | Repeat DB-POOL-01 with `TZ=America/New_York` and `TZ=Asia/Kolkata` | Always `"2026-10-10"`, never shifted by a day | DB | P0 |
| DB-POOL-03 | TIMESTAMPTZ | Select `created_at` | Serialises to ISO UTC (`…Z`) in JSON | DB | P2 |
| DB-POOL-04 | No connection leak | Run 200 sequential queries through the helper | `pool.totalCount` ≤ pool max, `pool.waitingCount` back to 0 | DB | P1 |
| DB-POOL-05 | Idle client error | Restart Postgres while the server is idle, then send a request | Server process does **not** crash (`pool.on('error')` handler logs it). Next request after the DB is back succeeds | DB | P1 |
| DB-POOL-06 | Param count | Helper called with a query that has `$1` but no params | Rejected promise, surfaced as 500 by the error handler, no crash | DB | P2 |
