import rateLimit from 'express-rate-limit';

/**
 * General API rate limiter for all endpoints under /api.
 * Configured with development-friendly limits (100 requests per 15 minutes per IP)
 * to prevent abuse while allowing seamless local testing and normal application usage.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: process.env.NODE_ENV === 'production' ? 100 : 2000, // 2000 in dev/test to allow audit suites, 100 in production
  standardHeaders: 'draft-7', // Draft-7 RateLimit headers: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`
  legacyHeaders: false, // Disable the deprecated `X-RateLimit-*` headers
  statusCode: 429,
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.',
  },
});

/**
 * Dedicated stricter rate limiter for sensitive authentication endpoints (/api/auth/*)
 * to mitigate automated credential-stuffing, brute-force password guessing,
 * and denial-of-service via resource-intensive bcrypt hashing.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: process.env.NODE_ENV === 'production' ? 35 : 500, // 500 in dev/test, 35 in production
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  statusCode: 429,
  message: {
    error: 'Too Many Requests',
    message: 'Too many authentication attempts from this IP, please try again later.',
  },
});

export default {
  apiLimiter,
  authLimiter,
};
