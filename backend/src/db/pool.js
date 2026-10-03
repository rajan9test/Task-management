import pg from 'pg';
import { env } from '../config/env.js';

// Keep DATE columns (type id 1082) as 'YYYY-MM-DD' strings. By default pg turns them
// into JS Dates at local midnight, which can shift the day when sent as JSON.
pg.types.setTypeParser(1082, (value) => value);

export const pool = new pg.Pool({ connectionString: env.DATABASE_URL });

export function query(text, params) {
  return pool.query(text, params);
}
