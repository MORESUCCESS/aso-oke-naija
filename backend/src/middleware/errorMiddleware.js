const notFound = (req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.status = 404;
  next(err);
};

const errorHandler = (err, req, res, next) => {
  let status  = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Prisma errors
  if (err.code === 'P2002') {
    status  = 409;
    const field = err.meta?.target?.[0] || 'field';
    message = `A record with this ${field} already exists.`;
  }
  if (err.code === 'P2025') {
    status  = 404;
    message = 'Record not found.';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    status  = 401;
    message = 'Invalid token.';
  }
  if (err.name === 'TokenExpiredError') {
    status  = 401;
    message = 'Token expired, please log in again.';
  }

  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${status} — ${message}`, err.stack);
  }

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };
