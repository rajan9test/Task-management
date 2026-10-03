import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { authed, closeDb, createTask, createUserAndLogin, resetDb } from './helpers.js';

let a;
let b;

const titles = (res) => res.body.data.tasks.map((t) => t.title);

// Created in this order, so "newest" is the reverse of this list.
const TASKS_OF_A = [
  { title: 'Complete Java Assignment', priority: 'HIGH', status: 'TODO', dueDate: '2026-10-10' },
  { title: 'Practice Java Collections', priority: 'MEDIUM', status: 'IN_PROGRESS', dueDate: '2026-10-05' },
  { title: 'Prepare for interview', priority: 'HIGH', status: 'COMPLETED', dueDate: '2026-10-20' },
  { title: 'Read OS chapter 3', priority: 'LOW', status: 'TODO' },
  { title: 'DSA Practice', priority: 'HIGH', status: 'TODO', dueDate: '2026-10-01' },
  { title: 'Score 100% in quiz', priority: 'LOW', status: 'COMPLETED', dueDate: '2026-10-15' },
];

beforeEach(async () => {
  await resetDb();
  a = await createUserAndLogin();
  b = await createUserAndLogin();
  for (const task of TASKS_OF_A) await createTask(a.token, task);
  await createTask(b.token, { title: 'Java secret', priority: 'HIGH' });
});
afterAll(closeDb);

describe('search', () => {
  it('matches part of the title, case-insensitively', async () => {
    const res = await authed(a.token).get('/api/tasks?search=java');

    expect(res.status).toBe(200);
    expect(titles(res).sort()).toEqual(['Complete Java Assignment', 'Practice Java Collections']);
  });

  it("never returns another user's tasks", async () => {
    const res = await authed(a.token).get('/api/tasks?search=secret');
    expect(titles(res)).toEqual([]);
  });

  it('returns an empty list, not 404, when nothing matches', async () => {
    const res = await authed(a.token).get('/api/tasks?search=zzz');

    expect(res.status).toBe(200);
    expect(res.body.data.tasks).toEqual([]);
  });

  it('treats % and _ as literal characters', async () => {
    expect(titles(await authed(a.token).get('/api/tasks?search=%25'))).toEqual(['Score 100% in quiz']);
    expect(titles(await authed(a.token).get('/api/tasks?search=_'))).toEqual([]);
  });

  it('rejects a search longer than 100 characters', async () => {
    const res = await authed(a.token).get(`/api/tasks?search=${'a'.repeat(101)}`);
    expect(res.status).toBe(400);
  });
});

describe('filters', () => {
  it('filters by status', async () => {
    const res = await authed(a.token).get('/api/tasks?status=TODO');
    expect(titles(res).sort()).toEqual(['Complete Java Assignment', 'DSA Practice', 'Read OS chapter 3']);
  });

  it('filters by priority', async () => {
    const res = await authed(a.token).get('/api/tasks?priority=HIGH');
    expect(titles(res).sort()).toEqual(['Complete Java Assignment', 'DSA Practice', 'Prepare for interview']);
  });

  it('combines status and priority', async () => {
    const res = await authed(a.token).get('/api/tasks?status=TODO&priority=HIGH');
    expect(titles(res).sort()).toEqual(['Complete Java Assignment', 'DSA Practice']);
  });

  it('combines search with filters', async () => {
    const res = await authed(a.token).get('/api/tasks?search=java&status=TODO');
    expect(titles(res)).toEqual(['Complete Java Assignment']);
  });

  it('treats empty values as "All"', async () => {
    const res = await authed(a.token).get('/api/tasks?status=&priority=&search=');
    expect(res.body.data.tasks).toHaveLength(TASKS_OF_A.length);
  });

  it('rejects invalid values', async () => {
    const status = await authed(a.token).get('/api/tasks?status=DONE');
    const sort = await authed(a.token).get('/api/tasks?sort=random');

    expect(status.status).toBe(400);
    expect(status.body.message).toBe('Invalid status');
    expect(sort.status).toBe(400);
    expect(sort.body.message).toBe('Invalid sort');
  });
});

describe('sorting', () => {
  it('defaults to newest first, and oldest reverses it', async () => {
    const newest = titles(await authed(a.token).get('/api/tasks'));
    const oldest = titles(await authed(a.token).get('/api/tasks?sort=oldest'));

    expect(newest).toEqual(TASKS_OF_A.map((t) => t.title).reverse());
    expect(oldest).toEqual([...newest].reverse());
  });

  it('sorts by due date with no-due-date tasks last', async () => {
    const res = await authed(a.token).get('/api/tasks?sort=due_date');

    expect(titles(res)).toEqual([
      'DSA Practice',
      'Practice Java Collections',
      'Complete Java Assignment',
      'Score 100% in quiz',
      'Prepare for interview',
      'Read OS chapter 3',
    ]);
  });

  it('sorts by priority HIGH → MEDIUM → LOW', async () => {
    const res = await authed(a.token).get('/api/tasks?sort=priority');
    const priorities = res.body.data.tasks.map((t) => t.priority);

    expect(priorities).toEqual(['HIGH', 'HIGH', 'HIGH', 'MEDIUM', 'LOW', 'LOW']);
  });
});

describe('GET /api/tasks/stats', () => {
  it('returns correct counts as numbers', async () => {
    const res = await authed(a.token).get('/api/tasks/stats');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      success: true,
      message: 'Stats fetched',
      data: { total: 6, pending: 4, completed: 2, highPriority: 3 },
    });
  });

  it('returns zeros for a new user', async () => {
    const fresh = await createUserAndLogin();
    const res = await authed(fresh.token).get('/api/tasks/stats');

    expect(res.body.data).toEqual({ total: 0, pending: 0, completed: 0, highPriority: 0 });
  });

  it("does not count another user's tasks", async () => {
    const res = await authed(b.token).get('/api/tasks/stats');
    expect(res.body.data).toEqual({ total: 1, pending: 1, completed: 0, highPriority: 1 });
  });
});
