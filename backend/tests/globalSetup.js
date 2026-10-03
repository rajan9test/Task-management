import pg from 'pg';
import { loadTestEnv } from './loadTestEnv.js';
import { runMigrations } from '../src/db/runMigrations.js';

// Creates the tables in the test database once, before any test file runs.
export default async function setup() {
  const client = new pg.Client({ connectionString: loadTestEnv().DATABASE_URL });
  await client.connect();
  try {
    await runMigrations(client, () => {});
  } finally {
    await client.end();
  }
}
