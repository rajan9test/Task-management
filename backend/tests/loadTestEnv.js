import dotenv from 'dotenv';

// Reads .env.test without touching process.env. Refuses to continue unless the database
// name contains "test", because the suite empties every table it touches.
export function loadTestEnv() {
  const { parsed, error } = dotenv.config({ path: '.env.test', processEnv: {}, quiet: true });
  if (error) {
    throw new Error('Missing backend/.env.test. Copy .env.test.example to .env.test and fill it in.');
  }
  const dbName = new URL(parsed.DATABASE_URL).pathname.slice(1);
  if (!dbName.includes('test')) {
    throw new Error(`Refusing to run tests against "${dbName}": the test database name must contain "test".`);
  }
  return { ...parsed, NODE_ENV: 'test' };
}
