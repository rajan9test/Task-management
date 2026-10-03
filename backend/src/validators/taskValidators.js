import { z } from 'zod';
import { PRIORITIES, STATUSES, SORTS } from '../constants/task.js';

const MAX_INT = 2147483647; // Postgres INTEGER limit; larger ids would make the query fail

export const taskIdParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'Invalid task id')
    .transform(Number)
    .refine((id) => id > 0 && id <= MAX_INT, 'Invalid task id'),
});

const title = z
  .string({ error: 'Title is required' })
  .trim()
  .min(1, 'Title is required')
  .max(200, 'Title must be at most 200 characters');

// Missing, null or blank → null
const description = z
  .string({ error: 'Description must be text' })
  .trim()
  .max(2000, 'Description must be at most 2000 characters')
  .nullish()
  .transform((value) => value || null);

function isRealDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

// 'YYYY-MM-DD' that exists on the calendar (rejects 2026-02-30); missing, null or '' → null
const dueDate = z
  .string({ error: 'Invalid due date' })
  .refine((value) => value === '' || (/^\d{4}-\d{2}-\d{2}$/.test(value) && isRealDate(value)), 'Invalid due date')
  .nullish()
  .transform((value) => value || null);

const priority = z.enum(PRIORITIES, { error: 'Invalid priority' });
const status = z.enum(STATUSES, { error: 'Invalid status' });

// Unknown keys such as userId are stripped by z.object, so a client can never set the owner.
export const createTaskSchema = z.object({
  title,
  description,
  priority: priority.default('MEDIUM'),
  status: status.default('TODO'),
  dueDate,
});

// PUT is a full update: priority and status are required, a missing description or dueDate clears it.
export const updateTaskSchema = z.object({
  title,
  description,
  priority,
  status,
  dueDate,
});

export const statusSchema = z.object({ status });

// The frontend sends "All" as an empty string, so '' means "not set".
const emptyToUndefined = (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value);

export const listTasksQuerySchema = z.object({
  search: z.preprocess(
    emptyToUndefined,
    z.string({ error: 'Invalid search' }).trim().max(100, 'Search must be at most 100 characters').optional(),
  ),
  status: z.preprocess(emptyToUndefined, status.optional()),
  priority: z.preprocess(emptyToUndefined, priority.optional()),
  sort: z.preprocess(emptyToUndefined, z.enum(SORTS, { error: 'Invalid sort' }).default('newest')),
});
