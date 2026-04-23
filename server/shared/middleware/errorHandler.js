const { ZodError } = require('zod');
const { logger } = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details;

  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    details = err.flatten();
  }

  if (err.name === 'CastError') {
    statusCode = 404;
    message = `Resource not found: ${err.value}`;
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    statusCode = 400;
    message = `${field} already exists`;
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((value) => value.message).join(', ');
  }

  logger.error(message, {
    path: req.originalUrl,
    method: req.method,
    statusCode,
    stack: err.stack
  });

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
};

module.exports = { errorHandler };
