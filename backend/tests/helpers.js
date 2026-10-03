import request from 'supertest';
import { app } from '../src/app.js';
import { pool } from '../src/db/pool.js';

export const api = () => request(app);

export async function resetDb() {
  await pool.query('TRUNCATE tasks, users RESTART IDENTITY CASCADE');
}

let userCount = 0;

export async function createUserAndLogin(overrides = {}) {
  userCount += 1;
  const credentials = {
    name: `Student ${userCount}`,
    email: `student${userCount}@example.com`,
    password: 'secret123',
    ...overrides,
  };
  const registered = await api().post('/api/auth/register').send(credentials);
  if (registered.status !== 201) throw new Error(`Register failed: ${JSON.stringify(registered.body)}`);

  const loggedIn = await api()
    .post('/api/auth/login')
    .send({ email: credentials.email, password: credentials.password });
  if (loggedIn.status !== 200) throw new Error(`Login failed: ${JSON.stringify(loggedIn.body)}`);

  return { user: loggedIn.body.data.user, token: loggedIn.body.data.token, password: credentials.password };
}

// Supertest requests with the Authorization header already set.
export function authed(token) {
  const withToken = (req) => req.set('Authorization', `Bearer ${token}`);
  return {
    get: (url) => withToken(api().get(url)),
    post: (url) => withToken(api().post(url)),
    put: (url) => withToken(api().put(url)),
    patch: (url) => withToken(api().patch(url)),
    delete: (url) => withToken(api().delete(url)),
  };
}

export async function createTask(token, task) {
  const res = await authed(token).post('/api/tasks').send(task);
  if (res.status !== 201) throw new Error(`Create task failed: ${JSON.stringify(res.body)}`);
  return res.body.data.task;
}

export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function closeDb() {
  return pool.end();
}
