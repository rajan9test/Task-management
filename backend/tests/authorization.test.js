import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { authed, closeDb, createTask, createUserAndLogin, resetDb } from './helpers.js';

let a;
let b;
let taskOfA;

beforeEach(async () => {
  await resetDb();
  a = await createUserAndLogin();
  b = await createUserAndLogin();
  taskOfA = await createTask(a.token, { title: "A's private task", priority: 'HIGH' });
});
afterAll(closeDb);

async function expectUnchanged() {
  const res = await authed(a.token).get(`/api/tasks/${taskOfA.id}`);
  expect(res.status).toBe(200);
  expect(res.body.data.task).toEqual(taskOfA);
}

describe("another user's task is unreachable", () => {
  it('GET as B → 404', async () => {
    const res = await authed(b.token).get(`/api/tasks/${taskOfA.id}`);
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Task not found');
  });

  it('PUT as B → 404 and the task is unchanged', async () => {
    const res = await authed(b.token)
      .put(`/api/tasks/${taskOfA.id}`)
      .send({ title: 'Hacked', priority: 'LOW', status: 'COMPLETED' });
    expect(res.status).toBe(404);
    await expectUnchanged();
  });

  it('PATCH status as B → 404 and the task is unchanged', async () => {
    const res = await authed(b.token).patch(`/api/tasks/${taskOfA.id}/status`).send({ status: 'COMPLETED' });
    expect(res.status).toBe(404);
    await expectUnchanged();
  });

  it('DELETE as B → 404 and the task still exists', async () => {
    const res = await authed(b.token).delete(`/api/tasks/${taskOfA.id}`);
    expect(res.status).toBe(404);
    await expectUnchanged();
  });

  it("B's list and stats do not include A's task", async () => {
    const list = await authed(b.token).get('/api/tasks');
    const stats = await authed(b.token).get('/api/tasks/stats');

    expect(list.body.data.tasks).toEqual([]);
    expect(stats.body.data).toEqual({ total: 0, pending: 0, completed: 0, highPriority: 0 });
  });
});

describe('the owner always comes from the token', () => {
  it('ignores userId in the request body', async () => {
    const task = await createTask(a.token, { title: 'Mine', userId: b.user.id, user_id: b.user.id });

    expect((await authed(a.token).get(`/api/tasks/${task.id}`)).status).toBe(200);
    expect((await authed(b.token).get(`/api/tasks/${task.id}`)).status).toBe(404);
  });

  it('ignores userId in the query string', async () => {
    const res = await authed(b.token).get(`/api/tasks?userId=${a.user.id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.tasks).toEqual([]);
  });
});
