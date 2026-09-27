/**
 * 404 Catch-All Middleware
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found on this server.',
  });
};

/**
 * Centralized Error Handler Middleware
 * Sanitizes errors to prevent exposing stack traces, database details, or sensitive credentials.
 */
export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  // Handle CORS blocked origin errors
  if (err.message && err.message.includes('CORS request blocked')) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied by CORS policy.',
    });
  }

  // Handle JWT verification errors (expired, malformed, invalid signature)
  if (
    err.name === 'JsonWebTokenError' ||
    err.name === 'TokenExpiredError' ||
    err.name === 'NotBeforeError'
  ) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication session is invalid or expired',
    });
  }

  // Handle Mongoose cast errors (invalid ObjectId or types) without exposing schema paths
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid request parameter.',
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Validation error: invalid request data.',
    });
  }

  // Handle MongoDB duplicate key errors
  if (err.code === 11000) {
    const isEnrollment = err.keyPattern && (err.keyPattern.userId || err.keyPattern.courseId);
    const message = isEnrollment
      ? 'You are already enrolled in this course.'
      : err.message && err.message.includes('email')
        ? 'An account with this email already exists.'
        : 'A duplicate record already exists.';
    return res.status(409).json({
      error: 'Conflict',
      message,
    });
  }

  const rawStatus = err.statusCode || err.status;
  const statusCode =
    typeof rawStatus === 'number' && rawStatus >= 400 && rawStatus < 600 ? rawStatus : 500;

  const errorTitle =
    statusCode === 404
      ? 'Not Found'
      : statusCode === 400
        ? 'Bad Request'
        : statusCode === 401
          ? 'Unauthorized'
          : statusCode === 403
            ? 'Forbidden'
            : statusCode === 409
              ? 'Conflict'
              : statusCode === 429
                ? 'Too Many Requests'
                : 'Internal Server Error';

  // Sanitize 4xx messages so internal details, DB references, or credentials are never leaked
  let safeMessage = 'An error occurred while processing your request.';
  if (statusCode < 500 && err.message) {
    const lower = err.message.toLowerCase();
    const isSensitive =
      lower.includes('mongo') ||
      lower.includes('connection') ||
      lower.includes('secret') ||
      lower.includes('token') ||
      lower.includes('password') ||
      lower.includes('query') ||
      lower.includes('syntax') ||
      lower.includes('uri');

    safeMessage = isSensitive ? 'An invalid request was provided.' : err.message;
  }

  res.status(statusCode).json({
    error: errorTitle,
    message: safeMessage,
  });
};
