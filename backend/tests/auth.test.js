import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { pool } from '../src/db/pool.js';
import { api, closeDb, createUserAndLogin, resetDb } from './helpers.js';

const validUser = { name: 'Riya Sharma', email: 'riya@example.com', password: 'secret123' };

beforeEach(resetDb);
afterAll(closeDb);

describe('POST /api/auth/register', () => {
  it('registers a user and never returns the password', async () => {
    const res = await api().post('/api/auth/register').send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Registration successful');
    expect(res.body.data.user).toMatchObject({ id: 1, name: 'Riya Sharma', email: 'riya@example.com' });
    expect(JSON.stringify(res.body)).not.toMatch(/password|secret123/i);
  });

  it('stores a bcrypt hash, not the plain password', async () => {
    await api().post('/api/auth/register').send(validUser);
    const { rows } = await pool.query('SELECT password_hash FROM users WHERE email = $1', [validUser.email]);

    expect(rows[0].password_hash).toMatch(/^\$2[aby]\$10\$/);
    expect(rows[0].password_hash).not.toContain(validUser.password);
  });

  it('rejects an email that is already registered with 409', async () => {
    await api().post('/api/auth/register').send(validUser);
    const res = await api().post('/api/auth/register').send({ ...validUser, name: 'Someone Else' });

    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ success: false, message: 'Email is already registered' });
  });

  it('treats emails case- and whitespace-insensitively', async () => {
    await api().post('/api/auth/register').send({ ...validUser, email: 'Test@Mail.com ' });
    const res = await api().post('/api/auth/register').send({ ...validUser, email: 'test@mail.com' });

    expect(res.status).toBe(409);
  });

  it('rejects an invalid email with a field error', async () => {
    const res = await api().post('/api/auth/register').send({ ...validUser, email: 'not-an-email' });

    expect(res.status).toBe(400);
    expect(res.body.errors.email).toBe('Invalid email format');
  });

  it('rejects a password shorter than 6 characters', async () => {
    const res = await api().post('/api/auth/register').send({ ...validUser, password: '12345' });

    expect(res.status).toBe(400);
    expect(res.body.errors.password).toBe('Password must be at least 6 characters');
  });

  it('rejects a missing name', async () => {
    const res = await api().post('/api/auth/register').send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(400);
    expect(res.body.errors.name).toBe('Name is required');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await api().post('/api/auth/register').send(validUser);
  });

  it('logs in and returns a token', async () => {
    const res = await api().post('/api/auth/login').send({ email: validUser.email, password: validUser.password });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Login successful');
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user).toEqual({ id: 1, name: 'Riya Sharma', email: 'riya@example.com' });
  });

  it('rejects a wrong password with 401', async () => {
    const res = await api().post('/api/auth/login').send({ email: validUser.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, message: 'Invalid email or password' });
  });

  it('gives the same 401 message for an unknown email', async () => {
    const res = await api().post('/api/auth/login').send({ email: 'nobody@example.com', password: 'secret123' });

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ success: false, message: 'Invalid email or password' });
  });

  it('rejects a missing password with 400', async () => {
    const res = await api().post('/api/auth/login').send({ email: validUser.email });

    expect(res.status).toBe(400);
    expect(res.body.errors.password).toBe('Password is required');
  });
});

describe('GET /api/auth/me', () => {
  it('returns 401 without a token', async () => {
    const res = await api().get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Authentication required');
  });

  it('returns 401 with a garbage token', async () => {
    const res = await api().get('/api/auth/me').set('Authorization', 'Bearer not.a.token');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Your session has expired. Please login again.');
  });

  it('returns the current user with a valid token', async () => {
    const { token } = await createUserAndLogin({ name: 'Arjun', email: 'arjun@example.com' });
    const res = await api().get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user).toMatchObject({ name: 'Arjun', email: 'arjun@example.com' });
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
  });

  it('returns 401 when the user no longer exists', async () => {
    const { token } = await createUserAndLogin();
    await resetDb();
    const res = await api().get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });
});
