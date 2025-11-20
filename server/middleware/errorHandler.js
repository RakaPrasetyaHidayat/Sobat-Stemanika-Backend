export const errorHandler = (err, req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  const response = {
    error: message,
    status: statusCode,
    ...(isDev && err.details && { details: err.details }),
    ...(isDev && { stack: err.stack })
  };

  if (statusCode === 500) {
    console.error('[ERROR]', err);
  }

  res.status(statusCode).json(response);
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
