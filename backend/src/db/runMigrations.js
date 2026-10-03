import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const migrationsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

// Runs every .sql file in migrations/, sorted by name, each in its own transaction.
// The SQL uses IF NOT EXISTS, so running this twice is harmless. Applied migrations
// are not tracked in a table (known limitation).
// Used by `npm run migrate` and by the test suite's global setup.
export async function runMigrations(client, log = console.log) {
  const files = (await fs.readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();

  for (const file of files) {
    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('COMMIT');
      log(`Ran ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Migration ${file} failed: ${err.message}`, { cause: err });
    }
  }
}
