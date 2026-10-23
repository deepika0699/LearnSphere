/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LearnSphere Module 7 — Backend Security Content (Part 2: Topics 6–10)
 */

export const module7TopicsPart2 = [
  // =========================================================================
  // TOPIC 6: Rate Limiting
  // =========================================================================
  {
    topicId: '6abe9ddcf15c2b4f6008ac5f',
    title: 'Rate Limiting',
    content: {
      explanation:
        'Without limits on how many requests a client can send in a given timeframe, a single automated script can send thousands of requests per second to your backend. Attackers use high-volume request floods to guess user passwords (brute-force and credential stuffing attacks), scrape entire databases, or exhaust server CPU and database connections so legitimate users cannot access the app (Denial of Service). Rate limiting is a defensive middleware technique that tracks how many requests each client (typically identified by IP address or user ID) makes within a rolling time window, automatically rejecting excess traffic with HTTP 429 Too Many Requests before expensive controller or database operations run.',
      sections: [
        {
          heading: 'Learning Objectives',
          body: `- Understand why unrestricted API traffic exposes a backend to brute-force attacks, credential stuffing, and Denial of Service (DoS).
- Explain how time-window rate limiters track client request counts and return \`429 Too Many Requests\`.
- Configure tiered rate limiters in Express using \`express-rate-limit\` (general API limiter vs. stricter authentication limiter).
- Interpret standard HTTP RateLimit response headers (\`RateLimit-Limit\`, \`RateLimit-Remaining\`, \`RateLimit-Reset\`).
- Understand why \`app.set('trust proxy', 1)\` is required when running behind a reverse proxy or load balancer.`,
          order: 0,
        },
        {
          heading: 'Core Terminology',
          body: `- **Rate Limiting**: Restricting the number of HTTP requests a client can make to an API within a specified time window (for example, 100 requests per 15 minutes).
- **Brute-Force Attack**: Repeatedly submitting thousands of password combinations against a login endpoint in hopes of guessing a user's credentials.
- **Credential Stuffing**: Automated login attempts using lists of email/password pairs leaked from breaches on other websites.
- **HTTP \`429 Too Many Requests\`**: The standard HTTP status code returned when a client exceeds the permitted request rate.
- **Reverse Proxy (\`trust proxy\`)**: An intermediate server (such as Nginx, Cloudflare, or a container ingress) that forwards client requests to Express. Enabling \`trust proxy\` ensures Express reads the real client IP from \`X-Forwarded-For\` rather than rate-limiting the proxy's own IP.`,
          order: 1,
        },
        {
          heading: 'How Tiered Rate Limiting Works in LearnSphere',
          body: `Not all API endpoints have the same risk profile. Browsing course modules requires multiple normal requests as a user clicks around, whereas logging in or registering only happens occasionally—and triggers CPU-intensive \`bcrypt\` hashing on every attempt.

Therefore, LearnSphere (` +
        '`server/middleware/rateLimiter.js`' +
        `) uses a **two-tier rate limiting strategy**:

\`\`\`
Incoming Request to Express
   │
   ├─► Tier 1: General API Limiter (app.use('/api', apiLimiter))
   │     Window: 15 minutes
   │     Production Limit: 100 requests per IP
   │     Protects general routes against scraping and request floods
   │
   └─► Tier 2: Strict Auth Limiter (Applied to /api/auth/login & /api/auth/register)
         Window: 15 minutes
         Production Limit: 35 requests per IP
         Protects authentication endpoints against brute-force password guessing
         and bcrypt CPU exhaustion
\`\`\`

When a client stays within the limit, the request proceeds normally and includes standard Draft-7 headers (` +
        '`RateLimit-Limit`' +
        `, ` +
        '`RateLimit-Remaining`' +
        `, ` +
        '`RateLimit-Reset`' +
        `). The moment a client exceeds the limit, the middleware short-circuits the request pipeline and returns:

\`\`\`json
HTTP/1.1 429 Too Many Requests
{
  "error": "Too Many Requests",
  "message": "Too many authentication attempts from this IP, please try again later."
}
\`\`\``,
          order: 2,
        },
        {
          heading: 'Why trust proxy Matters Behind Load Balancers',
          body: `In production deployments (and containerized preview environments), incoming user traffic passes through a reverse proxy or load balancer before reaching your Node.js server.

- **Without \`app.set('trust proxy', 1)\`**: Express sees \`req.ip\` as the internal IP address of the load balancer itself. Every single user on the internet appears to share the exact same IP address! Once 100 total requests arrive across all users combined, the rate limiter blocks everyone.
- **With \`app.set('trust proxy', 1)\`**: Express trusts the first hop proxy and reads the client's real IP address from the \`X-Forwarded-For\` header, ensuring each individual client gets their own separate rate limit counter.`,
          order: 3,
        },
        {
          heading: 'Combining Rate Limiting with Payload Size Limits',
          body: `Rate limiting controls **how many** requests arrive, but what if an attacker sends just **one** request containing a 500 MB JSON body to crash the Node.js heap?

To protect server availability completely, pair \`express-rate-limit\` with body parser size limits:
- Configure \`express.json({ limit: '100kb' })\` (or Express's default 100kb limit) so oversized payloads are rejected immediately with \`413 Payload Too Large\` before JSON parsing consumes server memory.`,
          order: 4,
        },
        {
          heading: 'Common Beginner Mistakes',
          body: `- **Applying the same loose limit to \`/api/auth/login\` as general GET routes**: Allowing thousands of login attempts per minute lets attackers brute-force weak passwords and overload the CPU with \`bcrypt\` hashes.
- **Forgetting \`app.set('trust proxy', 1)\` behind a proxy**: Accidentally rate-limiting the load balancer IP so one noisy user locks out all legitimate users.
- **Placing the rate limiter AFTER expensive middleware or routes**: Mounting \`apiLimiter\` at the bottom of \`server.js\` means routes execute before the limiter ever checks the request count.
- **Returning HTML instead of JSON on \`429\`**: Frontend \`fetch()\` clients expect a consistent JSON \`{ error, message }\` structure when handling rate limit errors.`,
          order: 5,
        },
        {
          heading: 'Suggested Practice Task',
          body: `1. Inspect \`server/middleware/rateLimiter.js\` and \`server/routes/auth.js\` in LearnSphere.
2. Make a \`GET\` request to \`http://localhost:5000/api/health\` using \`curl -i\` and inspect the response headers.
3. Locate the \`RateLimit-Limit\`, \`RateLimit-Remaining\`, and \`RateLimit-Reset\` headers in the HTTP response and verify how \`RateLimit-Remaining\` decrements by 1 on each subsequent request.`,
          order: 6,
        },
        {
          heading: 'Topic Summary',
          body: `- Rate limiting protects Availability and Confidentiality by capping how many requests a client can send within a time window.
- Exceeding the limit returns HTTP \`429 Too Many Requests\` with a structured JSON error payload.
- Use a general limiter for \`/api\` routes and a stricter limiter (\`authLimiter\`) for sensitive \`/api/auth\` login and registration endpoints.
- Always configure \`app.set('trust proxy', 1)\` when running behind a reverse proxy so rate limits apply per client IP rather than globally across the proxy.`,
          order: 7,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Tiered API and Authentication Rate Limiters with express-rate-limit',
        language: 'javascript',
        code: `import express from 'express';
import rateLimit from 'express-rate-limit';

const app = express();

// Trust first reverse proxy hop so req.ip reflects the true client IP
app.set('trust proxy', 1);

// 1. General API limiter for all /api endpoints
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  limit: process.env.NODE_ENV === 'production' ? 100 : 2000,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  statusCode: 429,
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.',
  },
});

// 2. Stricter limiter for login and registration endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  limit: process.env.NODE_ENV === 'production' ? 35 : 500,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  statusCode: 429,
  message: {
    error: 'Too Many Requests',
    message: 'Too many authentication attempts from this IP, please try again later.',
  },
});

// Mount general limiter across all /api routes
app.use('/api', apiLimiter);

// Mount strict limiter on authentication routes
app.post('/api/auth/login', authLimiter, (req, res) => {
  res.status(200).json({ status: 'ok' });
});`,
        explanation:
          'This setup configures two rate limiters using express-rate-limit: apiLimiter protects all /api endpoints from general flooding, while authLimiter applies a much tighter cap on /api/auth/login to stop brute-force password guessing and bcrypt CPU exhaustion.',
      },
    ],
    importantPoints: [
      'Rate limiting defends against brute-force password guessing, credential stuffing, scraping, and Denial of Service (DoS).',
      'When a client exceeds the allowed request count in windowMs, the server responds with HTTP 429 Too Many Requests.',
      'Authentication endpoints (/api/auth/login, /api/auth/register) require stricter rate limits than general read endpoints.',
      'Enabling app.set("trust proxy", 1) ensures Express identifies each client IP accurately when deployed behind a reverse proxy.',
      'Standard Draft-7 RateLimit headers inform well-behaved clients how many requests remain in the current window.',
    ],
    externalReferences: [
      {
        title: 'express-rate-limit Official Documentation',
        url: 'https://express-rate-limit.mintlify.app/overview',
        source: 'Express Rate Limit Docs',
      },
      {
        title: 'OWASP Blocking Brute Force Attacks',
        url: 'https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks',
        source: 'OWASP Foundation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 7: Security Headers and Helmet
  // =========================================================================
  {
    topicId: '6abe9dddf15c2b4f6008ac60',
    title: 'Security Headers and Helmet',
    content: {
      explanation:
        'When a web browser receives an HTTP response from your server, it relies on HTTP response headers to decide what security rules to enforce—such as whether your application may be embedded inside an invisible <iframe> on another website, whether the browser is allowed to guess ("sniff") the MIME type of a response, or whether future connections must strictly use HTTPS. By default, Express does not send these protective headers and even advertises its technology stack via the X-Powered-By: Express header. Helmet is a battle-tested Express middleware that sets a suite of standard HTTP security headers and removes fingerprinting headers in a single line of code: app.use(helmet()).',
      sections: [
        {
          heading: 'Learning Objectives',
          body: `- Understand why HTTP security response headers are essential for instructing browsers how to handle your app safely.
- Explain why hiding technology fingerprinting headers (\`X-Powered-By\`) reduces targeted automated attacks.
- Describe the purpose of key headers set by \`helmet()\`: \`X-Content-Type-Options\`, \`X-Frame-Options\` / \`Content-Security-Policy\`, \`Strict-Transport-Security\`, and \`Referrer-Policy\`.
- Mount \`helmet()\` at the top of the Express middleware pipeline in \`server/server.js\`.
- Verify security headers using \`curl -i\` or browser DevTools Network tab.`,
          order: 0,
        },
        {
          heading: 'Core Terminology',
          body: `- **HTTP Security Headers**: Response metadata sent by the server that instructs the client browser to enable specific built-in security defenses.
- **Server Fingerprinting**: Reconnaissance where an attacker inspects headers like \`X-Powered-By: Express\` or \`Server\` to identify the exact framework and version running on the backend.
- **MIME Sniffing**: A dangerous browser behavior where the browser ignores the declared \`Content-Type\` header and tries to guess the file type by inspecting the content bytes, potentially executing a text or JSON response as HTML/JavaScript.
- **Clickjacking (UI Redressing)**: An attack where a malicious website embeds your application inside a transparent \`<iframe>\` overlaid on top of a fake button, tricking users into clicking buttons in your app without realizing it.
- **HSTS (HTTP Strict Transport Security)**: A header (\`Strict-Transport-Security\`) that tells browsers to only connect to your domain over encrypted HTTPS and never downgrade to plain HTTP.`,
          order: 1,
        },
        {
          heading: 'Essential Headers Set by Helmet',
          body: `When LearnSphere calls \`app.use(helmet())\` and \`app.disable('x-powered-by')\` at the top of \`server/server.js\`, every HTTP response automatically includes protective headers:

\`\`\`
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self'; frame-ancestors 'self'; ...
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=15552000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Frame-Options: SAMEORIGIN
\`\`\`

Here is what the most important headers do:

1. **\`X-Content-Type-Options: nosniff\`**
   - Forces the browser to strictly respect the server's \`Content-Type\` header (such as \`application/json\`) and disables MIME-type sniffing.

2. **\`X-Frame-Options: SAMEORIGIN\` & CSP \`frame-ancestors 'self'\`**
   - Prevents external websites from embedding your app inside an \`<iframe>\`, stopping **Clickjacking** attacks completely.

3. **\`Strict-Transport-Security: max-age=15552000; includeSubDomains\`**
   - Instructs browsers to remember for 180 days that this domain must only be contacted via HTTPS, preventing man-in-the-middle protocol downgrade attacks.

4. **\`Referrer-Policy: no-referrer\`**
   - Prevents the browser from leaking your application's internal URLs (which might contain course or topic IDs) in the \`Referer\` header when a user clicks an external documentation link.

5. **Removal of \`X-Powered-By\`**
   - Removes \`X-Powered-By: Express\` so automated vulnerability scanners cannot trivially fingerprint your backend framework.`,
          order: 2,
        },
        {
          heading: 'Where Helmet Fits in the Middleware Pipeline',
          body: `Middleware order matters in Express! If you mount \`helmet()\` *after* your routes, any response sent by those routes will leave the server **without** Helmet's security headers.

In \`server/server.js\`, LearnSphere registers \`app.use(helmet())\` as the very first middleware right after creating the Express \`app\` instance. That way, every response—including \`200 OK\` API payloads, \`404 Not Found\` responses, \`429\` rate limit responses, and \`500\` error responses—carries the full set of security headers.`,
          order: 3,
        },
        {
          heading: 'Customizing Content-Security-Policy (CSP) When Needed',
          body: `Helmet's default \`Content-Security-Policy\` header restricts scripts, images, and frames to \`'self'\` (the same origin). For a pure JSON backend API (like LearnSphere's \`/api/*\` server), Helmet's defaults work out of the box with zero configuration.

If your Express server also serves HTML pages that load images or scripts from trusted external CDNs, you can customize directives inside \`helmet({ contentSecurityPolicy: { directives: { ... } } })\` rather than disabling Helmet altogether.`,
          order: 4,
        },
        {
          heading: 'Common Beginner Mistakes',
          body: `- **Leaving \`X-Powered-By: Express\` enabled**: Giving attackers free reconnaissance about your server stack.
- **Mounting \`helmet()\` at the bottom of \`server.js\`**: Middleware registered after route handlers never executes for requests handled by those routes.
- **Disabling Helmet completely when a single CSP directive blocks an external image**: Instead of removing \`helmet()\`, configure only the specific directive (like \`img-src\`) that needs an allowlisted domain.
- **Assuming security headers replace input validation**: Headers instruct the browser on how to behave, but they do not stop server-side vulnerabilities like NoSQL Injection or broken authorization.`,
          order: 5,
        },
        {
          heading: 'Suggested Practice Task',
          body: `1. Run \`curl -i http://localhost:5000/api/health\` in your terminal.
2. Verify that \`X-Powered-By\` is **not** present in the response headers.
3. Confirm that \`X-Content-Type-Options: nosniff\`, \`X-Frame-Options: SAMEORIGIN\`, \`Strict-Transport-Security\`, and \`Referrer-Policy: no-referrer\` are present on the response.`,
          order: 6,
        },
        {
          heading: 'Topic Summary',
          body: `- HTTP security headers instruct browsers to enforce critical protections against MIME sniffing, Clickjacking, protocol downgrades, and referrer leakage.
- \`helmet()\` sets over a dozen standard security headers automatically and removes the \`X-Powered-By: Express\` fingerprinting header.
- Always register \`app.use(helmet())\` at the very top of your Express middleware stack so every route and error response is protected.`,
          order: 7,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Configuring Helmet and Disabling Fingerprinting Headers in Express',
        language: 'javascript',
        code: `import express from 'express';
import helmet from 'helmet';

const app = express();

// 1. Apply Helmet as the first middleware so all responses include security headers
app.use(helmet());

// 2. Explicitly disable X-Powered-By header to prevent server fingerprinting
app.disable('x-powered-by');

// Example health route that automatically inherits all Helmet headers
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Headers secured by Helmet',
  });
});

export default app;`,
        explanation:
          'By registering app.use(helmet()) and app.disable("x-powered-by") before any routes, every HTTP response from the Express server automatically includes X-Content-Type-Options: nosniff, X-Frame-Options: SAMEORIGIN, Strict-Transport-Security, Content-Security-Policy, and Referrer-Policy: no-referrer.',
      },
    ],
    importantPoints: [
      'Helmet sets essential HTTP response headers that protect browsers against Clickjacking, MIME sniffing, and protocol downgrade attacks.',
      'X-Content-Type-Options: nosniff prevents browsers from guessing MIME types and executing JSON responses as HTML.',
      'X-Frame-Options: SAMEORIGIN and CSP frame-ancestors prevent malicious sites from framing your application in a Clickjacking attack.',
      'Removing X-Powered-By hides framework fingerprinting details from automated scanners.',
      'Always mount app.use(helmet()) at the top of server.js before any route handlers.',
    ],
    externalReferences: [
      {
        title: 'Helmet.js Official Documentation',
        url: 'https://helmetjs.github.io/',
        source: 'Helmet.js Docs',
      },
      {
        title: 'OWASP HTTP Security Response Headers Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html',
        source: 'OWASP Cheat Sheet Series',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 8: Secure Error Handling
  // =========================================================================
  {
    topicId: '6abe9dddf15c2b4f6008ac61',
    title: 'Secure Error Handling',
    content: {
      explanation:
        'Errors are inevitable in any backend application: a client might send a malformed MongoDB ObjectId, a user might try to register with an email that already exists, a JWT might expire, or a database query might fail unexpectedly. However, how your backend responds to errors is a major security boundary. If an unhandled error returns a raw Node.js stack trace, Mongoose schema path, or database connection string to the client, attackers gain a detailed blueprint of your internal file structure, library versions, and database schema. Secure error handling uses a centralized Express error middleware to log internal diagnostics safely on the server while returning clean, standardized, sanitized JSON error responses to the client.',
      sections: [
        {
          heading: 'Learning Objectives',
          body: `- Understand how verbose error messages and stack traces help attackers map out your backend architecture.
- Implement a centralized 4-argument Express error-handling middleware \`(err, req, res, next)\`.
- Translate specific internal error types (\`CastError\`, \`ValidationError\`, MongoDB duplicate key \`11000\`, \`JsonWebTokenError\`) into safe HTTP status codes (\`400\`, \`401\`, \`409\`, \`500\`).
- Scrub sensitive keywords (\`mongo\`, \`connection\`, \`secret\`, \`token\`, \`password\`, \`uri\`) from outward-facing error messages.
- Prevent resource existence leakage by returning \`404 Not Found\` when an unauthorized user probes a private resource ID.`,
          order: 0,
        },
        {
          heading: 'Core Terminology',
          body: `- **Information Disclosure (Stack Trace Leakage)**: Accidentally sending internal file paths, line numbers, SQL/NoSQL query structures, or environment details in an HTTP error response.
- **Centralized Error Handler**: An Express middleware with four parameters \`(err, req, res, next)\` mounted at the very end of the pipeline that catches all errors passed via \`next(err)\` or thrown in \`async\` handlers.
- **Error Classification**: Mapping technical error classes (e.g., Mongoose \`CastError\` or JWT \`TokenExpiredError\`) to appropriate semantic HTTP status codes (\`400\`, \`401\`, \`403\`, \`404\`, \`409\`, \`500\`).
- **Generic 500 Fallback**: Returning a safe, non-revealing message (\`"An error occurred while processing your request."\`) for unexpected \`500 Internal Server Error\` exceptions.
- **Existence Leak Prevention**: Returning \`404 Not Found\` (instead of \`403 Forbidden\`) when a user requests a private or draft resource they do not own, so attackers cannot enumerate which resource IDs exist.`,
          order: 1,
        },
        {
          heading: 'Leaky Error Response vs. Sanitized Error Response',
          body: `Compare what happens when a client sends an invalid ID or triggers a database error in a naive app versus LearnSphere's centralized error handler (\`server/middleware/errorHandler.js\`):

\`\`\`
❌ LEAKY ERROR RESPONSE (Exposes internals to attacker):
HTTP/1.1 500 Internal Server Error
{
  "message": "Cast to ObjectId failed for value \\"invalid-id\\" (type string) at path \\"_id\\" for model \\"Course\\"",
  "stack": "CastError: Cast to ObjectId failed...\\n  at model.Query.exec (/app/node_modules/mongoose/lib/query.js:4912:21)\\n  at /app/server/controllers/courseController.js:42:18"
}
\`\`\`
From that single response, an attacker learns you are using Node.js, Express, Mongoose, the exact file path \`/app/server/controllers/courseController.js\`, and the model name \`Course\`.

\`\`\`
✅ SECURE ERROR RESPONSE (LearnSphere errorHandler.js):
HTTP/1.1 400 Bad Request
{
  "error": "Bad Request",
  "message": "Invalid request parameter."
}
\`\`\`
The client learns only what they need to fix their request (\`400 Bad Request\`), and zero internal file paths, stack traces, or schema details are exposed.`,
          order: 2,
        },
        {
          heading: 'How LearnSphere Translates Errors Centrally',
          body: `In \`server/middleware/errorHandler.js\`, every error flows through a structured decision tree:

1. **CORS Policy Errors**:
   - Matches \`'CORS request blocked'\` -> Returns \`403 Forbidden\` (\`"Access denied by CORS policy."\`).
2. **JWT Verification Errors**:
   - Matches \`JsonWebTokenError\`, \`TokenExpiredError\`, or \`NotBeforeError\` -> Returns \`401 Unauthorized\` (\`"Authentication session is invalid or expired"\`).
3. **Mongoose \`CastError\`**:
   - Returns \`400 Bad Request\` (\`"Invalid request parameter."\`) without leaking schema paths.
4. **Mongoose \`ValidationError\`**:
   - Returns \`400 Bad Request\` (\`"Validation error: invalid request data."\`).
5. **MongoDB Duplicate Key (\`err.code === 11000\`)**:
   - Returns \`409 Conflict\` with a clean user-friendly message (e.g., \`"An account with this email already exists."\` or \`"You are already enrolled in this course."\`).
6. **Sensitive Keyword Scrubbing & 500 Fallback**:
   - For \`500\` errors, always returns \`"An error occurred while processing your request."\`.
   - Even for \`4xx\` errors, checks if \`err.message\` contains sensitive words (\`mongo\`, \`connection\`, \`secret\`, \`token\`, \`password\`, \`query\`, \`syntax\`, \`uri\`) and replaces it with \`"An invalid request was provided."\``,
          order: 3,
        },
        {
          heading: '404 Catch-All and Resource Existence Privacy',
          body: `Alongside \`errorHandler\`, LearnSphere mounts \`notFoundHandler\` right after all valid API routes in \`server/server.js\`. Any request to an unknown route receives a uniform JSON response:
\`\`\`json
{
  "error": "Not Found",
  "message": "The requested resource was not found on this server."
}
\`\`\`
Furthermore, when an authenticated \`course_creator\` tries to access or edit a draft course belonging to *another* creator, LearnSphere's ownership middleware returns \`404 Not Found\` rather than \`403 Forbidden\`, preventing attackers from probing whether a specific course ID exists.`,
          order: 4,
        },
        {
          heading: 'Common Beginner Mistakes',
          body: `- **Sending \`res.status(500).json({ error: err.message, stack: err.stack })\`**: Directly exposing stack traces and internal database errors to API callers.
- **Forgetting the 4th parameter \`next\` in \`(err, req, res, next)\`**: In Express, an error-handling middleware **must** declare all four arguments \`(err, req, res, next)\`. If you write \`(err, req, res)\` with only three parameters, Express treats it as a normal middleware and will not route errors to it!
- **Revealing whether an email or username exists during login**: Returning \`"Email not found"\` vs \`"Wrong password"\` on \`POST /api/auth/login\` allows attackers to enumerate registered emails. Always return a single generic \`401\` message: \`"Invalid email or password"\`.
- **Crashing the server on unhandled async errors**: Failing to wrap controller logic in \`try / catch\` and forward errors with \`next(err)\`.`,
          order: 5,
        },
        {
          heading: 'Suggested Practice Task',
          body: `1. Review \`server/middleware/errorHandler.js\`.
2. Trace what HTTP status code and JSON body \`errorHandler\` produces for each of the following error objects:
   - \`{ name: 'CastError', path: '_id', value: '123' }\`
   - \`{ name: 'TokenExpiredError', message: 'jwt expired' }\`
   - \`{ statusCode: 400, message: 'Mongo connection uri failed' }\`
   - \`new Error('Unexpected null reference in service')\`
3. Verify that none of the resulting JSON responses contain stack traces or sensitive internal keywords.`,
          order: 6,
        },
        {
          heading: 'Topic Summary',
          body: `- Never expose stack traces, Mongoose schema paths, library versions, or database errors in HTTP responses.
- Mount a 4-parameter \`(err, req, res, next)\` centralized error handler at the bottom of \`server.js\` after all routes and the 404 catch-all handler.
- Map known error types (\`CastError\`, \`ValidationError\`, \`11000\` duplicate key, JWT errors) to clean \`400\`, \`401\`, or \`409\` JSON responses.
- Always return a generic message for \`500 Internal Server Error\` and scrub any sensitive keywords from \`4xx\` messages.`,
          order: 7,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Centralized Sanitized Error Handler Middleware in Express',
        language: 'javascript',
        code: `// 404 Catch-All Handler (mounted after all valid routes)
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found on this server.',
  });
};

// Centralized 4-Argument Error Handler (mounted last in server.js)
export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  // 1. JWT Authentication Errors -> 401
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

  // 2. Mongoose CastError (e.g. malformed ObjectId) -> 400 without leaking schema details
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid request parameter.',
    });
  }

  // 3. Mongoose ValidationError -> 400
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Validation error: invalid request data.',
    });
  }

  // 4. MongoDB Duplicate Key Error -> 409 Conflict
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'A duplicate record already exists.',
    });
  }

  // 5. Determine status code & scrub sensitive terms from 4xx messages
  const rawStatus = err.statusCode || err.status;
  const statusCode =
    typeof rawStatus === 'number' && rawStatus >= 400 && rawStatus < 600 ? rawStatus : 500;

  let safeMessage = 'An error occurred while processing your request.';
  if (statusCode < 500 && typeof err.message === 'string') {
    const lower = err.message.toLowerCase();
    const isSensitive = ['mongo', 'connection', 'secret', 'token', 'password', 'query', 'uri'].some(
      (word) => lower.includes(word)
    );
    safeMessage = isSensitive ? 'An invalid request was provided.' : err.message;
  }

  return res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : 'Request Error',
    message: safeMessage,
  });
};`,
        explanation:
          'This centralized error middleware intercepts all application errors, maps JWT, CastError, ValidationError, and duplicate key errors to semantic HTTP status codes, strips sensitive internal keywords, and never leaks err.stack to the client.',
      },
    ],
    importantPoints: [
      'Stack traces, file paths, and raw database errors must never be returned in API responses.',
      'An Express error middleware must declare all four parameters: (err, req, res, next).',
      'Translate Mongoose CastError and ValidationError into clean 400 Bad Request responses.',
      'Return a generic message ("Invalid email or password") on failed logins to prevent user enumeration.',
      'Always fall back to a generic 500 message ("An error occurred while processing your request.") for unexpected server exceptions.',
    ],
    externalReferences: [
      {
        title: 'Express.js Error Handling Guide',
        url: 'https://expressjs.com/en/guide/error-handling.html',
        source: 'Express.js Official Documentation',
      },
      {
        title: 'OWASP Improper Error Handling Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html',
        source: 'OWASP Cheat Sheet Series',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 9: Secret and Environment Variable Management
  // =========================================================================
  {
    topicId: '6abe9ddef15c2b4f6008ac62',
    title: 'Secret and Environment Variable Management',
    content: {
      explanation:
        'Every production backend relies on sensitive configuration values: database connection strings (MONGODB_URI), cryptographic signing keys (JWT_ACCESS_SECRET and JWT_REFRESH_SECRET), initial bootstrap credentials, and third-party API keys. If a developer hardcodes these secrets inside JavaScript source files or commits a .env file to Git, anyone who clones the repository—or any automated bot scanning public commits—instantly gains the ability to forge admin JWTs and connect directly to the production database. Secret and environment variable management is the practice of keeping configuration strictly separated from source code, loading secrets at runtime via process.env, validating required secrets on startup (fail-fast), and never exposing backend secrets to client-side frontend bundles or logs.',
      sections: [
        {
          heading: 'Learning Objectives',
          body: `- Understand why hardcoding secrets in source code or committing \`.env\` files to version control is a critical security failure.
- Use \`dotenv\` and \`process.env\` to load environment-specific secrets at server startup.
- Maintain a safe, committed \`.env.example\` template containing only variable names and placeholder examples, while keeping \`.env\` in \`.gitignore\`.
- Implement fail-fast startup validation so the server refuses to boot with missing or weak JWT secrets.
- Understand why backend secrets must never be prefixed with \`VITE_\` or returned in API responses or logs.`,
          order: 0,
        },
        {
          heading: 'Core Terminology',
          body: `- **Environment Variable (\`process.env\`)**: A key-value pair injected into the Node.js process by the operating system, container runtime, or \`.env\` loader at startup.
- **Secret**: Sensitive configuration data (such as \`MONGODB_URI\`, \`JWT_ACCESS_SECRET\`, \`JWT_REFRESH_SECRET\`) that grants privileged access or cryptographic signing authority.
- **\`.env\` vs. \`.env.example\`**: \`.env\` holds real local secrets and is strictly ignored by Git (\`.gitignore\`); \`.env.example\` holds safe dummy placeholders and is committed to Git to document required variables for teammates.
- **Fail-Fast Startup Validation**: Checking at application boot time that all required environment variables exist and meet strength requirements, throwing an error immediately if any are missing.
- **Client Bundle Exposure (\`VITE_\`)**: Frontend build tools like Vite embed environment variables starting with \`VITE_\` directly into browser JavaScript bundles. Backend secrets must **never** use the \`VITE_\` prefix.`,
          order: 1,
        },
        {
          heading: 'Separating Code, .env.example, and Runtime Secrets',
          body: `The Twelve-Factor App methodology establishes a strict separation between **Code** (tracked in Git) and **Config/Secrets** (injected per environment):

\`\`\`
[Git Repository (Committed & Shared)]
  ├── server/
  │     ├── config/db.js          --> Reads process.env.MONGODB_URI
  │     └── services/tokenService.js --> Reads process.env.JWT_ACCESS_SECRET
  ├── .gitignore                  --> Lists .env so secrets are NEVER committed
  └── .env.example                --> Safe template:
                                      MONGODB_URI=mongodb://localhost:27017/learnsphere
                                      JWT_ACCESS_SECRET=replace_with_64_char_random_hex

[Local / Production Runtime (Never Committed)]
  └── .env or Cloud Secret Manager --> Injects real runtime values into process.env
\`\`\`

If an attacker gains read access to your source code repository, they should find zero usable credentials—only references to \`process.env.*\`.`,
          order: 2,
        },
        {
          heading: 'Fail-Fast Secret Validation and Cryptographic Entropy',
          body: `What happens if a developer deploys a backend server and forgets to set \`JWT_ACCESS_SECRET\` in the production environment?
- **Bad Pattern (Dangerous Fallback)**:
  \`\`\`javascript
  // ❌ NEVER DO THIS:
  const secret = process.env.JWT_ACCESS_SECRET || 'default_secret_123';
  \`\`\`
  If the environment variable is missing, the server silently falls back to a weak, publicly known string (\`'default_secret_123'\`). Anyone who reads your code can now forge valid \`admin\` JWTs!

- **Secure Pattern (Fail-Fast in LearnSphere)**:
  In \`server/services/tokenService.js\`, \`getAccessSecret()\` checks \`process.env.JWT_ACCESS_SECRET\`. If it is missing or empty, it immediately throws \`new Error('Server configuration error: JWT_ACCESS_SECRET is missing')\`. Furthermore, LearnSphere uses distinct secrets for access tokens (\`JWT_ACCESS_SECRET\`) and refresh tokens (\`JWT_REFRESH_SECRET\`), generated using high-entropy random bytes (e.g., \`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"\`).`,
          order: 3,
        },
        {
          heading: 'Protecting Secrets from Logs and Frontend Bundles',
          body: `Loading secrets from \`process.env\` is only half the battle—you must also ensure secrets never leak out of the server during runtime:
1. **Never log secrets**: Never run \`console.log(process.env)\` or log full database connection URIs containing credentials. In \`server/middleware/logger.js\`, LearnSphere logs only safe operational metadata (HTTP method, path, status code, and response duration)—never request bodies, \`Authorization\` headers, or cookies.
2. **Never prefix backend secrets with \`VITE_\`**: In a Vite + React project, any variable named \`VITE_*\` is bundled into the public browser JavaScript file that every visitor downloads. Keep \`MONGODB_URI\`, \`JWT_ACCESS_SECRET\`, and \`JWT_REFRESH_SECRET\` strictly server-side without the \`VITE_\` prefix.`,
          order: 4,
        },
        {
          heading: 'Common Beginner Mistakes',
          body: `- **Hardcoding fallback secrets with \`|| 'secret'\`**: Writing \`process.env.JWT_SECRET || 'mysecret'\` defeats the entire purpose of environment variables if a variable is unset in production.
- **Using the same secret for Access Tokens and Refresh Tokens**: If both token types share the same signing secret, a long-lived refresh token could potentially be presented as an access token unless both secrets and token \`type\` claims are strictly separated.
- **Committing \`.env\` to Git "just once"**: Even if you delete \`.env\` in a later commit, the secret remains permanently visible in \`git log\` history and must be rotated immediately.
- **Using weak, human-typed JWT secrets**: Using \`"supersecretpassword"\` instead of a 256-bit (32+ byte) cryptographically random hex or base64 string.`,
          order: 5,
        },
        {
          heading: 'Suggested Practice Task',
          body: `1. Write a startup check function \`validateEnvConfig()\` that verifies \`MONGODB_URI\`, \`JWT_ACCESS_SECRET\`, and \`JWT_REFRESH_SECRET\` are all present in \`process.env\`.
2. Ensure the function checks that \`JWT_ACCESS_SECRET\` and \`JWT_REFRESH_SECRET\` are at least 32 characters long and are **not** equal to each other.
3. Verify how Node's built-in \`crypto.randomBytes(32).toString('hex')\` generates a 64-character cryptographically strong secret.`,
          order: 6,
        },
        {
          heading: 'Topic Summary',
          body: `- Never hardcode credentials, database URIs, or JWT signing secrets in source files, and never commit \`.env\` to version control.
- Commit a safe \`.env.example\` file with placeholder values so developers know which environment variables are required.
- Fail fast if required secrets are missing rather than falling back to hardcoded default strings.
- Keep access and refresh secrets distinct, high-entropy, excluded from logs, and never prefixed with \`VITE_\`.`,
          order: 7,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Fail-Fast Environment Variable Validator and Safe Secret Retrieval',
        language: 'javascript',
        code: `import crypto from 'crypto';

/**
 * Validates required backend environment variables on server startup.
 * Fails fast if any critical secret is missing or weak.
 */
export function validateServerEnv() {
  const requiredVars = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  const missing = requiredVars.filter(
    (key) => typeof process.env[key] !== 'string' || process.env[key].trim().length === 0
  );

  if (missing.length > 0) {
    throw new Error(\`Startup aborted: Missing required environment variables: \${missing.join(', ')}\`);
  }

  if (process.env.JWT_ACCESS_SECRET.length < 32 || process.env.JWT_REFRESH_SECRET.length < 32) {
    throw new Error('Startup aborted: JWT secrets must be at least 32 characters long.');
  }

  if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
    throw new Error('Startup aborted: JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be distinct.');
  }
}

/**
 * Utility for generating a cryptographically strong 64-character hex secret
 * (Run locally when provisioning a new .env file, never log in production)
 */
export function generateStrongSecretHex() {
  return crypto.randomBytes(32).toString('hex');
}`,
        explanation:
          'validateServerEnv() verifies at startup that MONGODB_URI, JWT_ACCESS_SECRET, and JWT_REFRESH_SECRET are configured, enforces a minimum length of 32 characters, and ensures the access and refresh secrets are distinct—without ever falling back to insecure hardcoded defaults.',
      },
    ],
    importantPoints: [
      'Never commit .env files or real secrets to Git; commit only .env.example with safe placeholder values.',
      'Never use hardcoded fallback secrets like process.env.JWT_ACCESS_SECRET || "default-secret"—fail fast instead.',
      'Use separate, high-entropy cryptographic secrets for JWT_ACCESS_SECRET and JWT_REFRESH_SECRET.',
      'Never prefix backend secrets with VITE_, as Vite bundles VITE_* variables into public client-side JavaScript.',
      'Ensure request loggers never print Authorization headers, cookies, passwords, or database connection strings.',
    ],
    externalReferences: [
      {
        title: 'OWASP Secrets Management Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html',
        source: 'OWASP Cheat Sheet Series',
      },
      {
        title: 'The Twelve-Factor App: III. Config',
        url: 'https://12factor.net/config',
        source: 'Twelve-Factor App Methodology',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 10: Common Backend Security Mistakes
  // =========================================================================
  {
    topicId: '6abe9ddef15c2b4f6008ac63',
    title: 'Common Backend Security Mistakes',
    content: {
      explanation:
        'Real-world security breaches rarely happen because an attacker breaks modern cryptography like SHA-256 or bcrypt. Instead, breaches almost always happen because of everyday implementation oversights: a developer checks authentication on four routes in a file but forgets the fifth, verifies that a user has the course_creator role but forgets to check whether that user actually owns the course being edited, trusts req.body.userId instead of req.user.id, or passes req.body straight into findByIdAndUpdate(). Reviewing these common backend security mistakes—and knowing how to audit your own Express and MongoDB code with a systematic security checklist—ties together everything in Module 7.',
      sections: [
        {
          heading: 'Learning Objectives',
          body: `- Identify the most frequent real-world security bugs in Node.js, Express, and MongoDB applications.
- Distinguish between Broken Function-Level Authorization (missing role check) and Broken Object-Level Authorization / IDOR (missing ownership check).
- Spot Mass Assignment, NoSQL Operator Injection, Sensitive Data Exposure, and Stack Trace Leakage in code reviews.
- Apply a complete 8-point Backend Security Audit Checklist to any Express API endpoint before shipping to production.`,
          order: 0,
        },
        {
          heading: 'Core Terminology',
          body: `- **BOLA / IDOR (Broken Object-Level Authorization / Insecure Direct Object Reference)**: Checking that a user is logged in (or has a role like \`course_creator\`), but querying a document solely by \`req.params.id\` without verifying that the document belongs to \`req.user.id\`.
- **BFLA (Broken Function-Level Authorization)**: Mounting an administrative or creator endpoint without role authorization middleware (\`authorizeRoles('admin')\`), allowing regular \`student\` accounts to call privileged functions.
- **Excessive Data Exposure**: Returning entire Mongoose documents (\`res.json(user)\`) instead of selecting or sanitizing only the fields safe for the client to see.
- **Security Audit Checklist**: A repeatable set of verification checks applied to every new route, controller, and service method before deployment.`,
          order: 1,
        },
        {
          heading: 'Top 6 Backend Security Mistakes at a Glance',
          body: `Here is how the most common backend security mistakes occur in Express + MongoDB code and how LearnSphere prevents each one:

\`\`\`
┌────────────────────────────────────┬──────────────────────────────────────┬──────────────────────────────────────────┐
│ Common Mistake                     │ Vulnerable Code Pattern              │ Secure LearnSphere Pattern               │
├────────────────────────────────────┼──────────────────────────────────────┼──────────────────────────────────────────┤
│ 1. Broken Object Ownership (IDOR)  │ Course.findById(req.params.courseId) │ Course.findOne({ _id, createdBy: user }) │
│ 2. Mass Assignment (Over-Posting)  │ User.create(req.body)                │ Explicit whitelist of allowed fields     │
│ 3. NoSQL Operator Injection        │ if (!req.body.email) ...             │ if (typeof email !== 'string') return 400│
│ 4. Trusting Client Identity        │ const userId = req.body.userId       │ const userId = req.user.id (from JWT)    │
│ 5. Leaking Sensitive Document Data │ res.json(userDoc)                    │ select('-passwordHash') & sanitizeUser() │
│ 6. Verbose Error / Stack Leakage   │ res.status(500).json({ err })        │ Centralized errorHandler sanitizes output│
└────────────────────────────────────┴──────────────────────────────────────┴──────────────────────────────────────────┘
\`\`\``,
          order: 2,
        },
        {
          heading: 'Deep Dive: Role Check Without Ownership Check (IDOR)',
          body: `One of the subtlest mistakes in multi-user platforms like LearnSphere is assuming that **Role-Based Access Control (RBAC)** alone is enough.

Suppose User A and User B both have the canonical role \`course_creator\`.
- User A creates Course X (\`createdBy: UserA._id\`).
- User B sends \`PATCH /api/creator/courses/<CourseX_ID>\` with User B's valid \`course_creator\` JWT.

If the route only checks \`authenticate\` and \`authorizeRoles('course_creator')\` and then runs \`Course.findByIdAndUpdate(req.params.courseId, ...)\`, **User B can overwrite or delete User A's course!**

To prevent this:
1. Verify authentication (\`authenticate\` -> \`401\`).
2. Verify role (\`authorizeRoles('course_creator')\` -> \`403\`).
3. Verify resource ownership (\`createdBy: req.user.id\` -> \`404 Not Found\`) and verify hierarchical parent-child relationships (\`Topic\` belongs to \`Module\`, and \`Module\` belongs to \`Course\`).`,
          order: 3,
        },
        {
          heading: 'The 8-Point Express Endpoint Security Checklist',
          body: `Whenever you create or review an Express endpoint, walk through these 8 questions in order:

1. **Headers & Transport**: Is \`helmet()\` active and \`x-powered-by\` disabled?
2. **CORS**: Is the \`Origin\` validated against an explicit allowlist?
3. **Rate Limiting**: Is the endpoint covered by \`apiLimiter\` (and \`authLimiter\` if it handles credentials/tokens)?
4. **Authentication**: Does the route require \`authenticate\` middleware, and does it verify token type (\`access\` vs \`refresh\`) and current database user status?
5. **Authorization (Role & Ownership)**: Does the route enforce canonical roles (\`student\`, \`course_creator\`, \`admin\`) **and** verify ownership (\`createdBy: req.user.id\`) + parent-child scoping (\`{ _id: topicId, moduleId, courseId }\`)?
6. **Input Validation & NoSQL Safety**: Are all \`req.params\` checked with \`ObjectId.isValid()\`, and are all \`req.body\`/\`req.query\` fields type-checked (\`typeof === 'string'\`), trimmed, length-bounded, and whitelisted?
7. **Output Sanitization**: Does the response strip sensitive fields (\`passwordHash\`, internal tokens) before calling \`res.json()\`?
8. **Error Handling**: Are errors passed to \`next(err)\` and sanitized by the centralized \`errorHandler\` without leaking stack traces?`,
          order: 4,
        },
        {
          heading: 'Common Beginner Mistakes',
          body: `- **Checking parent ownership without scoping child queries**: Verifying that the creator owns \`:courseId\`, but then updating a topic with \`Topic.findByIdAndUpdate(req.params.topicId, ...)\` without checking that \`topicId\` actually belongs to that \`courseId\` and \`moduleId\`.
- **Returning \`403\` instead of \`404\` on private resource probes**: Telling an unauthorized caller \`403 Forbidden\` confirms that the private ID exists; returning \`404 Not Found\` hides its existence.
- **Storing or logging plaintext passwords**: Logging \`req.body\` on \`/api/auth/login\` writes users' plaintext passwords straight into server log files.
- **Forgetting to revoke refresh sessions on logout**: Clearing only the client state without marking the server-side \`RefreshSession\` as revoked in MongoDB.`,
          order: 5,
        },
        {
          heading: 'Suggested Practice Task',
          body: `Audit the following 6-line Express route handler and find **at least 5 distinct security vulnerabilities**:
\`\`\`javascript
router.put('/courses/:courseId/topics/:topicId', authenticate, async (req, res) => {
  try {
    const topic = await Topic.findByIdAndUpdate(req.params.topicId, req.body, { new: true });
    res.json(topic);
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});
\`\`\`
Rewrite the handler so it enforces role authorization, course ownership, parent-child scoping (\`{ _id: topicId, courseId }\`), ObjectId validation, field whitelisting, and centralized error forwarding (\`next(err)\`).`,
          order: 6,
        },
        {
          heading: 'Topic Summary',
          body: `- Most backend breaches stem from missing ownership checks (IDOR), Mass Assignment, unvalidated input types, or leaky error responses.
- Always pair Role-Based Access Control (\`authorizeRoles\`) with strict Resource Ownership and hierarchical scoping (\`{ _id: topicId, moduleId, courseId }\`).
- Never trust client-supplied identity fields (\`req.body.userId\` or \`req.body.role\`), never pass raw \`req.body\` into database updates, and never return raw stack traces.
- Use the 8-point Endpoint Security Checklist to systematically verify every route in your Express backend.`,
          order: 7,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Side-by-Side Security Audit: Vulnerable Route vs. Hardened LearnSphere Route',
        language: 'javascript',
        code: `import express from 'express';
import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Topic from '../models/Topic.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRoles } from '../middleware/authorize.js';

const router = express.Router();

// ❌ VULNERABLE: 5 critical security flaws in 8 lines of code
// 1. Missing role check (any logged-in student can call it!)
// 2. Missing course ownership check (IDOR across creators!)
// 3. Unscoped findByIdAndUpdate (ignores :courseId and :moduleId hierarchy!)
// 4. Mass Assignment (passes raw req.body directly to MongoDB!)
// 5. Stack trace leakage (returns err.stack in 500 response!)
router.patch('/unsafe/courses/:courseId/modules/:moduleId/topics/:topicId', authenticate, async (req, res) => {
  try {
    const topic = await Topic.findByIdAndUpdate(req.params.topicId, req.body, { new: true });
    return res.json(topic);
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
});

// ✅ HARDENED: Applies all 8 layers of the Backend Security Audit Checklist
router.patch(
  '/safe/courses/:courseId/modules/:moduleId/topics/:topicId',
  authenticate,
  authorizeRoles('course_creator', 'admin'),
  async (req, res, next) => {
    try {
      const { courseId, moduleId, topicId } = req.params;

      // 1. Validate ObjectIds
      if (
        !mongoose.Types.ObjectId.isValid(courseId) ||
        !mongoose.Types.ObjectId.isValid(moduleId) ||
        !mongoose.Types.ObjectId.isValid(topicId)
      ) {
        return res.status(400).json({ error: 'Bad Request', message: 'Invalid ID format.' });
      }

      // 2. Verify course ownership (or admin privilege) — return 404 to prevent ID enumeration
      const ownershipFilter =
        req.user.role === 'admin' ? { _id: courseId } : { _id: courseId, createdBy: req.user.id };
      const ownedCourse = await Course.findOne(ownershipFilter).select('_id').lean();
      if (!ownedCourse) {
        return res.status(404).json({ error: 'Not Found', message: 'Course not found.' });
      }

      // 3. Whitelist and validate primitive types in req.body
      const safeFields = {};
      if (typeof req.body?.title === 'string' && req.body.title.trim().length >= 2) {
        safeFields.title = req.body.title.trim().slice(0, 200);
      }
      if (typeof req.body?.description === 'string') {
        safeFields.description = req.body.description.trim().slice(0, 2000);
      }

      // 4. Scope update strictly by topicId + moduleId + courseId
      const updatedTopic = await Topic.findOneAndUpdate(
        { _id: topicId, moduleId, courseId },
        { $set: safeFields },
        { returnDocument: 'after', runValidators: true }
      ).lean();

      if (!updatedTopic) {
        return res.status(404).json({ error: 'Not Found', message: 'Topic not found in this module.' });
      }

      return res.status(200).json({ status: 'ok', data: { topic: updatedTopic } });
    } catch (err) {
      // 5. Forward unexpected errors to centralized sanitized errorHandler
      next(err);
    }
  }
);`,
        explanation:
          'This comparison contrasts an insecure route (vulnerable to broken function-level authorization, IDOR, cross-course topic tampering, mass assignment, and stack trace disclosure) with the hardened pattern used in LearnSphere.',
      },
    ],
    importantPoints: [
      'Role checks (authorizeRoles) verify what type of user is calling; ownership checks verify that the user owns the specific resource ID.',
      'Always scope child resource queries by their parent IDs ({ _id: topicId, moduleId, courseId }) to prevent cross-resource tampering.',
      'Return 404 Not Found (rather than 403 Forbidden) when an unauthorized creator probes another creator’s private resource ID.',
      'Never pass raw req.body to Mongoose create/update methods, and never log plaintext passwords or tokens.',
      'Forward unexpected exceptions via next(err) to the centralized errorHandler so internal details are never leaked.',
    ],
    externalReferences: [
      {
        title: 'OWASP API Security Top 10',
        url: 'https://owasp.org/API-Security/editions/2023/en/0x11-t10/',
        source: 'OWASP Foundation',
      },
      {
        title: 'Node.js Security Best Practices',
        url: 'https://nodejs.org/en/learn/getting-started/security-best-practices',
        source: 'Node.js Official Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },
];
