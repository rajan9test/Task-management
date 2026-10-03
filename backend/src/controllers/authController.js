import * as authService from '../services/authService.js';
import { sendSuccess } from '../utils/response.js';

export async function register(req, res) {
  const user = await authService.register(req.validated.body);
  sendSuccess(res, 201, 'Registration successful', { user });
}

export async function login(req, res) {
  const result = await authService.login(req.validated.body);
  sendSuccess(res, 200, 'Login successful', result);
}

export async function me(req, res) {
  const user = await authService.getCurrentUser(req.user.id);
  sendSuccess(res, 200, 'Current user', { user });
}
