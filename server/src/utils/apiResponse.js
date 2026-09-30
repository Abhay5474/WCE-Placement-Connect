/* Consistent success envelope so the frontend can rely on a single shape. */
export const ok = (res, data = null, message = 'OK', status = 200, meta = undefined) =>
  res.status(status).json({ success: true, message, data, ...(meta ? { meta } : {}) });

export const created = (res, data = null, message = 'Created') => ok(res, data, message, 201);

/* Wraps async route handlers so thrown errors reach the central error middleware. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
