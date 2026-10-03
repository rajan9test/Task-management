import { pool } from './pool.js';
import { runMigrations } from './runMigrations.js';

async function migrate() {
  const client = await pool.connect();
  try {
    await runMigrations(client);
    console.log('Migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch((err) => {
  console.error(err.message);
  process.exitCode = 1;
});
