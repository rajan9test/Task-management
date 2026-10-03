import { ApiError } from '../utils/ApiError.js';

// Turns zod issues into { field: 'first message for that field' }.
function toFieldErrors(issues) {
  const errors = {};
  for (const issue of issues) {
    const field = issue.path.join('.') || '_';
    if (!errors[field]) errors[field] = issue.message;
  }
  return errors;
}

// Validates req[source] with a zod schema and stores the parsed result on
// req.validated[source]. Express 5 makes req.query read-only, so we never overwrite req.*.
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) {
      const errors = toFieldErrors(result.error.issues);
      // Single-field schemas (e.g. the :id param) read better with the field message itself.
      const messages = Object.values(errors);
      const message = source === 'body' ? 'Validation failed' : messages[0];
      throw new ApiError(400, message, errors);
    }
    req.validated = { ...req.validated, [source]: result.data };
    next();
  };
}
