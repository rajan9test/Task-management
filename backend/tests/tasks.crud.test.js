import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { api, authed, closeDb, createTask, createUserAndLogin, resetDb, wait } from './helpers.js';

let a; // { user, token }

beforeEach(async () => {
  await resetDb();
  a = await createUserAndLogin();
});
afterAll(closeDb);

describe('POST /api/tasks', () => {
  it('creates a task with default priority and status', async () => {
    const res = await authed(a.token).post('/api/tasks').send({ title: 'Complete Java Assignment' });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Task created successfully');
    expect(res.body.data.task).toMatchObject({
      id: expect.any(Number),
      title: 'Complete Java Assignment',
      description: null,
      priority: 'MEDIUM',
      status: 'TODO',
      dueDate: null,
    });
    expect(res.body.data.task).not.toHaveProperty('userId');
  });

  it('keeps the due date as YYYY-MM-DD', async () => {
    const task = await createTask(a.token, { title: 'Submit lab report', dueDate: '2026-10-10' });
    expect(task.dueDate).toBe('2026-10-10');
  });

  it.each([[''], ['   ']])('rejects title %j with "Title is required"', async (title) => {
    const res = await authed(a.token).post('/api/tasks').send({ title });

    expect(res.status).toBe(400);
    expect(res.body.errors.title).toBe('Title is required');
  });

  it('rejects an invalid priority', async () => {
    const res = await authed(a.token).post('/api/tasks').send({ title: 'x', priority: 'VERY_HIGH' });

    expect(res.status).toBe(400);
    expect(res.body.errors.priority).toBe('Invalid priority');
  });

  it('rejects an invalid status', async () => {
    const res = await authed(a.token).post('/api/tasks').send({ title: 'x', status: 'DONE' });

    expect(res.status).toBe(400);
    expect(res.body.errors.status).toBe('Invalid status');
  });

  it('rejects a due date that does not exist', async () => {
    const res = await authed(a.token).post('/api/tasks').send({ title: 'x', dueDate: '2026-02-30' });

    expect(res.status).toBe(400);
    expect(res.body.errors.dueDate).toBe('Invalid due date');
  });
});

describe('GET /api/tasks and /api/tasks/:id', () => {
  it('lists tasks newest first', async () => {
    await createTask(a.token, { title: 'First' });
    await createTask(a.token, { title: 'Second' });
    const res = await authed(a.token).get('/api/tasks');

    expect(res.status).toBe(200);
    expect(res.body.data.tasks.map((t) => t.title)).toEqual(['Second', 'First']);
  });

  it('gets one task by id', async () => {
    const task = await createTask(a.token, { title: 'DSA Practice', priority: 'HIGH' });
    const res = await authed(a.token).get(`/api/tasks/${task.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.task).toEqual(task);
  });

  it('returns 400 for a non-numeric id', async () => {
    const res = await authed(a.token).get('/api/tasks/abc');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid task id');
  });

  it('returns 404 for a task that does not exist', async () => {
    const res = await authed(a.token).get('/api/tasks/999999');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, message: 'Task not found' });
  });
});

describe('PUT /api/tasks/:id', () => {
  it('updates every field and moves updatedAt forward', async () => {
    const task = await createTask(a.token, { title: 'Old title', description: 'old' });
    await wait(20);
    const res = await authed(a.token).put(`/api/tasks/${task.id}`).send({
      title: 'New title',
      description: 'Chapter 5 exercises',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: '2026-11-01',
    });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Task updated successfully');
    expect(res.body.data.task).toMatchObject({
      title: 'New title',
      description: 'Chapter 5 exercises',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: '2026-11-01',
      createdAt: task.createdAt,
    });
    expect(new Date(res.body.data.task.updatedAt) > new Date(task.createdAt)).toBe(true);
  });

  it('clears description and due date when they are left out (full update)', async () => {
    const task = await createTask(a.token, { title: 't', description: 'd', dueDate: '2026-10-10' });
    const res = await authed(a.token)
      .put(`/api/tasks/${task.id}`)
      .send({ title: 't', priority: 'LOW', status: 'TODO' });

    expect(res.body.data.task).toMatchObject({ description: null, dueDate: null });
  });

  it('requires priority and status', async () => {
    const task = await createTask(a.token, { title: 't' });
    const res = await authed(a.token).put(`/api/tasks/${task.id}`).send({ title: 't' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toMatchObject({ priority: 'Invalid priority', status: 'Invalid status' });
  });
});

describe('PATCH /api/tasks/:id/status', () => {
  it('marks a task as completed', async () => {
    const task = await createTask(a.token, { title: 'Prepare for interview' });
    const res = await authed(a.token).patch(`/api/tasks/${task.id}/status`).send({ status: 'COMPLETED' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Task status updated');
    expect(res.body.data.task.status).toBe('COMPLETED');
  });

  it('rejects an invalid status', async () => {
    const task = await createTask(a.token, { title: 't' });
    const res = await authed(a.token).patch(`/api/tasks/${task.id}/status`).send({ status: 'DONE' });

    expect(res.status).toBe(400);
    expect(res.body.errors.status).toBe('Invalid status');
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('deletes a task permanently', async () => {
    const task = await createTask(a.token, { title: 'Old notes' });
    const res = await authed(a.token).delete(`/api/tasks/${task.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, message: 'Task deleted successfully', data: null });
    expect((await authed(a.token).get(`/api/tasks/${task.id}`)).status).toBe(404);
  });

  it('returns 404 when deleting twice', async () => {
    const task = await createTask(a.token, { title: 't' });
    await authed(a.token).delete(`/api/tasks/${task.id}`);
    const res = await authed(a.token).delete(`/api/tasks/${task.id}`);

    expect(res.status).toBe(404);
  });
});

describe('without a token', () => {
  it.each([
    ['get', '/api/tasks'],
    ['get', '/api/tasks/stats'],
    ['get', '/api/tasks/1'],
    ['post', '/api/tasks'],
    ['put', '/api/tasks/1'],
    ['patch', '/api/tasks/1/status'],
    ['delete', '/api/tasks/1'],
  ])('%s %s → 401', async (method, url) => {
    const res = await api()[method](url);
    expect(res.status).toBe(401);
  });
});
