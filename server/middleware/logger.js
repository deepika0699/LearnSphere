/**
 * Secure Request Logging Middleware
 *
 * Logs only non-sensitive operational metadata:
 * - Timestamp
 * - HTTP Method (e.g., GET, POST)
 * - Sanitized Path (strips query parameters to prevent logging tokens/query secrets)
 * - HTTP Response Status Code
 * - Duration in milliseconds
 *
 * Explicitly Excluded (Never Logged):
 * - Request body (no passwords, forms, or payloads)
 * - Query string values
 * - Headers (no Authorization tokens, Cookie credentials, or API keys)
 * - Personal or user data
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Strip query string so tokens, keys, or sensitive query parameters are never recorded
  const cleanPath = req.originalUrl ? req.originalUrl.split('?')[0] : req.path;
  const method = req.method;

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const statusCode = res.statusCode;

    console.log(
      `[${new Date().toISOString()}] ${method} ${cleanPath} ${statusCode} - ${durationMs}ms`
    );
  });

  next();
};

export default requestLogger;
