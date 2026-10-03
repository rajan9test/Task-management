const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';
const TOKEN_KEY = 'token';

export const MESSAGES = {
  network: 'Unable to connect to server. Please try again.',
  sessionExpired: 'Your session has expired. Please login again.',
  validation: 'Please check the entered information.',
  fallback: 'Something went wrong.',
};

export class ApiClientError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status; // 0 means the server could not be reached
    this.errors = errors;
  }
}

// localStorage can throw (private mode, blocked storage), so failures count as "no token".
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // The session then lasts only until the page is reloaded.
  }
}

export function clearToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing stored, nothing to clear.
  }
}

// AuthContext registers its logout here, so a 401 anywhere ends the session.
let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

function buildUrl(path, params) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined && value !== null && value !== '') query.append(key, value);
  }
  const queryString = query.toString();
  return `${BASE_URL}${path}${queryString ? `?${queryString}` : ''}`;
}

// Every API call goes through this function. Returns `data` from the response,
// or throws an ApiClientError with a message that is safe to show to the user.
export async function apiRequest(path, { method = 'GET', body, params } = {}) {
  const token = getToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiClientError(0, MESSAGES.network);
  }

  let json = null;
  try {
    json = await response.json();
  } catch {
    // Not JSON (e.g. a proxy error page); handled below by status code.
  }

  if (response.ok) return json?.data ?? null;

  // A 401 without a token is a failed login ("Invalid email or password"), not an expired session.
  if (response.status === 401 && token) {
    onUnauthorized?.();
    throw new ApiClientError(401, MESSAGES.sessionExpired);
  }

  if (response.status === 400 && json?.errors) {
    throw new ApiClientError(400, MESSAGES.validation, json.errors);
  }

  throw new ApiClientError(response.status, json?.message || MESSAGES.fallback, json?.errors);
}
