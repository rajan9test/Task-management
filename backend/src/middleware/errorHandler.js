import { ApiError } from '../utils/ApiError.js';

// Express recognises an error handler by its 4 arguments, so `next` must stay.
export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    const body = { success: false, message: err.message };
    if (err.errors) body.errors = err.errors;
    return res.status(err.statusCode).json(body);
  }

  // Malformed JSON or an oversized body, raised by express.json()
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'Invalid JSON in request body' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'Request body is too large' });
  }

  console.error(err);
  return res.status(500).json({ success: false, message: 'Something went wrong' });
}
