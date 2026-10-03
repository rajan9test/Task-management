import { query } from '../db/pool.js';

// password_hash is never part of this mapping, so it cannot leak into a response.
function toUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
  };
}

// The only function that selects password_hash; used by login to compare passwords.
export async function findByEmail(email) {
  const { rows } = await query(
    'SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1',
    [email],
  );
  if (!rows[0]) return null;
  return { ...toUser(rows[0]), passwordHash: rows[0].password_hash };
}

export async function findById(id) {
  const { rows } = await query('SELECT id, name, email, created_at FROM users WHERE id = $1', [id]);
  return rows[0] ? toUser(rows[0]) : null;
}

export async function create({ name, email, passwordHash }) {
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [name, email, passwordHash],
  );
  return toUser(rows[0]);
}
