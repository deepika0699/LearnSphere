import { validationResult } from 'express-validator';

/**
 * Reusable validation middleware for express-validator chains.
 * Inspects validation results on the request object.
 * If errors are detected, returns a clean, sanitized HTTP 400 Bad Request response.
 *
 * Security Note:
 * Input values (especially sensitive fields like passwords or tokens) are strictly
 * excluded from the returned error payload to prevent credential or data reflection.
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Map errors safely without echoing raw input values
    const formattedErrors = errors.array().map((err) => ({
      field: err.path || err.param || 'unknown',
      message: err.msg,
    }));

    return res.status(400).json({
      error: 'Validation Error',
      message: 'One or more fields failed validation.',
      errors: formattedErrors,
    });
  }

  return next();
};

export default validateRequest;
