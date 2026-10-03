import { query } from '../db/pool.js';

const COLUMNS = 'id, title, description, priority, status, due_date, created_at, updated_at';

// Fixed ORDER BY clauses. `sort` is validated against these keys, so user text never reaches the SQL.
// `id` is the last tie-breaker so tasks created in the same instant keep a stable order.
const ORDER_BY = {
  newest: 'created_at DESC, id DESC',
  oldest: 'created_at ASC, id ASC',
  due_date: 'due_date ASC NULLS LAST, created_at DESC, id DESC',
  priority: "CASE priority WHEN 'HIGH' THEN 1 WHEN 'MEDIUM' THEN 2 ELSE 3 END, created_at DESC, id DESC",
};

function toTask(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Escape LIKE wildcards so that searching "100%" matches the literal text.
function escapeLike(text) {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export async function findAll(userId, { search, status, priority, sort = 'newest' } = {}) {
  // user_id is always the first condition, so search and filters can only narrow the result.
  const conditions = ['user_id = $1'];
  const values = [userId];

  if (search) {
    values.push(`%${escapeLike(search)}%`);
    conditions.push(`title ILIKE $${values.length}`);
  }
  if (status) {
    values.push(status);
    conditions.push(`status = $${values.length}`);
  }
  if (priority) {
    values.push(priority);
    conditions.push(`priority = $${values.length}`);
  }

  const { rows } = await query(
    `SELECT ${COLUMNS} FROM tasks WHERE ${conditions.join(' AND ')} ORDER BY ${ORDER_BY[sort]}`,
    values,
  );
  return rows.map(toTask);
}

export async function findById(id, userId) {
  const { rows } = await query(`SELECT ${COLUMNS} FROM tasks WHERE id = $1 AND user_id = $2`, [id, userId]);
  return rows[0] ? toTask(rows[0]) : null;
}

export async function create(userId, { title, description, priority, status, dueDate }) {
  const { rows } = await query(
    `INSERT INTO tasks (user_id, title, description, priority, status, due_date)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING ${COLUMNS}`,
    [userId, title, description, priority, status, dueDate],
  );
  return toTask(rows[0]);
}

export async function update(id, userId, { title, description, priority, status, dueDate }) {
  const { rows } = await query(
    `UPDATE tasks
     SET title = $3, description = $4, priority = $5, status = $6, due_date = $7, updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING ${COLUMNS}`,
    [id, userId, title, description, priority, status, dueDate],
  );
  return rows[0] ? toTask(rows[0]) : null;
}

export async function updateStatus(id, userId, status) {
  const { rows } = await query(
    `UPDATE tasks SET status = $3, updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING ${COLUMNS}`,
    [id, userId, status],
  );
  return rows[0] ? toTask(rows[0]) : null;
}

export async function remove(id, userId) {
  const { rows } = await query('DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
  return rows.length > 0;
}

export async function getStats(userId) {
  const { rows } = await query(
    `SELECT
       COUNT(*)                                      AS total,
       COUNT(*) FILTER (WHERE status <> 'COMPLETED') AS pending,
       COUNT(*) FILTER (WHERE status = 'COMPLETED')  AS completed,
       COUNT(*) FILTER (WHERE priority = 'HIGH')     AS high_priority
     FROM tasks
     WHERE user_id = $1`,
    [userId],
  );
  // COUNT returns bigint, which pg gives back as a string.
  const row = rows[0];
  return {
    total: Number(row.total),
    pending: Number(row.pending),
    completed: Number(row.completed),
    highPriority: Number(row.high_priority),
  };
}
