import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import * as userRepository from '../repositories/userRepository.js';

const BCRYPT_COST = 10;
const PG_UNIQUE_VIOLATION = '23505';
const INVALID_CREDENTIALS = 'Invalid email or password';

export async function register({ name, email, password }) {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new ApiError(409, 'Email is already registered', { email: 'Email is already registered' });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

  try {
    return await userRepository.create({ name, email, passwordHash });
  } catch (err) {
    // Two requests with the same email at the same time can both pass the check above.
    if (err.code === PG_UNIQUE_VIOLATION) {
      throw new ApiError(409, 'Email is already registered', { email: 'Email is already registered' });
    }
    throw err;
  }
}

export async function login({ email, password }) {
  const user = await userRepository.findByEmail(email);
  // Same message for an unknown email and a wrong password, so nobody can probe which emails exist.
  if (!user) throw new ApiError(401, INVALID_CREDENTIALS);

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) throw new ApiError(401, INVALID_CREDENTIALS);

  const token = jwt.sign({ sub: String(user.id) }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
  return { token, user: { id: user.id, name: user.name, email: user.email } };
}

export async function getCurrentUser(userId) {
  const user = await userRepository.findById(userId);
  if (!user) throw new ApiError(401, 'Your session has expired. Please login again.');
  return user;
}
