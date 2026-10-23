/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LearnSphere Module 5 — Building REST APIs Content (Part 2: Topics 6–10)
 */

export const module5TopicsPart2 = [
  // =========================================================================
  // TOPIC 6: Input Validation
  // ID: 6abe9dd4f15c2b4f6008ac4a
  // =========================================================================
  {
    topicId: '6abe9dd4f15c2b4f6008ac4a',
    title: 'Input Validation',
    content: {
      explanation: `Every HTTP request that arrives at your Express backend comes from an untrusted external network. Even if your React frontend has form checks, any client can send arbitrary JSON bodies, malformed URL route parameters, or crafted query strings directly to your API endpoints.

Therefore, a foundational principle of REST API engineering is:
Frontend validation is for user experience; backend validation is authoritative.

Validating API input before executing business logic—across 'req.body', 'req.params', and 'req.query'—protects your services and database against malformed IDs, unexpected fields, invalid data types, oversized payloads, and NoSQL operator injection.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Explain why backend API input validation is authoritative while frontend validation is strictly for user experience.
2. Clearly distinguish between Validation, Sanitization, and Authorization.
3. Validate all three HTTP input sources: Route Parameters ('req.params'), Query Parameters ('req.query'), and Request Bodies ('req.body').
4. Enforce type checks, required fields, allowed enum values, string length/numeric range bounds, and MongoDB 'ObjectId' format checks in Express validation middleware.
5. Protect backend endpoints against malformed IDs, oversized inputs, unexpected fields, and unsafe query objects.`,
        },
        {
          order: 1,
          heading: 'Validation vs. Sanitization vs. Authorization',
          body: `Let us clearly define and separate three security concepts that work together on incoming API requests:

1. Validation — "Is this input allowed and correctly shaped?"
Validation inspects incoming values against strict rules (type, presence, length, numeric range, allowed enum list, or 'ObjectId' format). If any rule is violated, validation stops the request immediately and returns '400 Bad Request' before calling the controller or service.

2. Sanitization — "Is potentially unsafe input normalized or cleaned where appropriate?"
Sanitization transforms input into a clean, canonical representation—for example, trimming leading and trailing whitespace ('"  Node.js  "' → '"Node.js"'), normalizing an email or category string to lowercase, or stripping unexpected properties.

3. Authorization — "Is this authenticated user permitted to perform this action on this resource?"
Neither validation nor sanitization replaces authorization! A request body can be 100% validly shaped and sanitized, yet still be forbidden ('403') or hidden ('404') if the authenticated user does not own the target course.`,
        },
        {
          order: 2,
          heading: 'Validating All Three Input Sources: req.params, req.query, and req.body',
          body: `Beginners often validate 'req.body' on 'POST' requests but forget that 'req.params' and 'req.query' are equally untrusted user inputs!

1. Route Parameter Validation ('req.params'):
• Every dynamic URL parameter like ':courseId', ':moduleId', or ':topicId' must be validated as a 24-character hexadecimal MongoDB 'ObjectId' ('mongoose.Types.ObjectId.isValid(id)').
• Rejecting malformed IDs early with '400 Bad Request' prevents Mongoose 'CastError' exceptions in the database layer.

2. Query Parameter Validation ('req.query'):
• Verify that optional filters ('category', 'status', 'search') are plain primitive strings ('typeof val === "string"') and within a safe maximum length (e.g., max 100 characters for a search term).
• Parse numeric query parameters ('page', 'limit') with 'Number.parseInt()' and clamp them to safe minimum and maximum bounds.

3. Request Body Validation ('req.body'):
• Verify that 'req.body' is a plain object (not 'null' or an array).
• Check required fields, primitive data types ('typeof title === "string"', 'typeof order === "number"'), string length limits ('minlength', 'maxlength'), and allowed enum values.`,
        },
        {
          order: 3,
          heading: 'Defending Against Oversized Inputs, Unexpected Fields, and Unsafe Objects',
          body: `Why do we enforce strict length bounds and type checks in API validation middleware?

• Malformed IDs: Passing '"123"' where a 24-character hex 'ObjectId' is required causes database cast failures unless caught by 'ObjectId' validation.
• Unexpected Fields (Mass Assignment): A client might include '"role": "admin"' or '"courseCreator": "otherId"' in 'req.body'. Validation and controller/service allowlisting ensure only expected fields are accepted.
• Invalid Types & Unsafe Query Objects (NoSQL Injection Defense): In JSON, a client can send '{ "title": { "$ne": "" } }' where 'title' is an object instead of a string. Checking 'typeof req.body.title === "string"' immediately rejects any non-string object with '400 Bad Request'!
• Oversized Inputs: Express configures a payload size limit on 'express.json({ limit: "1mb" })', and field validators enforce reasonable character limits (such as max 200 chars for a title) so a single request cannot exhaust server memory or MongoDB's 16MB document limit.`,
        },
        {
          order: 4,
          heading: 'Running Validation Middleware Before Business Logic',
          body: `In LearnSphere ('server/routes/courseCreator.js' and 'server/middleware/validateRequest.js'), validation runs as Express middleware right in the route pipeline BEFORE the controller is ever called:

router.post(
  '/courses',
  createCourseValidation, // <-- Validates req.body; returns 400 if invalid
  courseCreatorCourseController.createCourse
);

When 'createCourseValidation' detects one or more invalid fields, it responds immediately with a structured '400 Bad Request' JSON payload listing the specific validation errors, and never invokes 'createCourse'.`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Checking 'if (!req.body.title)' without checking 'typeof req.body.title === "string"': A truthy object like '{ "title": { "$gt": "" } }' or an array '["hello"]' passes 'if (!req.body.title)'! Always check the primitive type first ('typeof title === "string"').
2. Validating 'req.body' on 'POST' but forgetting to validate 'req.body' on 'PATCH': Partial update ('PATCH') endpoints must validate every optional field that is present in the request body.
3. Relying solely on frontend React validation: Any HTTP client can call your Express endpoint directly without using the browser UI.
4. Returning '500 Internal Server Error' for invalid client input: Invalid client input is a client error and should return '400 Bad Request' (or '422 Unprocessable Entity'), never '500'.`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `Practice Task — Writing an Express Validation Middleware Function:
1. Write an Express middleware function 'validateCreateModule(req, res, next)' for 'POST /api/creator/courses/:courseId/modules'.
2. Validate:
   • 'req.params.courseId' is a valid 24-character hex ObjectId.
   • 'req.body.title' is a string whose trimmed length is between 3 and 150 characters.
   • 'req.body.order' (if provided) is an integer greater than or equal to 1.
3. If any check fails, return 'res.status(400).json({ error: "Bad Request", errors })'; otherwise normalize 'req.body.title = req.body.title.trim()' and call 'next()'.`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `• Frontend validation improves user experience, but backend validation is authoritative.
• Validation checks whether input is allowed and properly shaped; Sanitization normalizes and cleans input; Authorization verifies user permissions.
• Validate all three input sources ('req.params', 'req.query', 'req.body') in middleware before business logic executes.
• Enforcing primitive type checks ('typeof val === "string"'), 'ObjectId' validation, enum allowlists, and length bounds protects against malformed IDs, oversized payloads, and NoSQL injection patterns.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Express Input Validation & Sanitization Middleware for Params, Query, and Body',
        language: 'javascript',
        code: `import mongoose from 'mongoose';

/**
 * Reusable validation middleware for updating a Course:
 * Validates req.params.courseId and sanitizes/validates req.body fields.
 */
export function validateUpdateCourse(req, res, next) {
  const errors = [];
  const { courseId } = req.params || {};

  // 1. Validate Route Parameter (ObjectId check)
  if (typeof courseId !== 'string' || !mongoose.Types.ObjectId.isValid(courseId)) {
    errors.push({ field: 'courseId', message: 'Valid 24-character hex courseId is required' });
  }

  // 2. Validate & Sanitize Body Fields (Type, Length, and Enum checks)
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};

  if (body.title !== undefined) {
    if (typeof body.title !== 'string') {
      errors.push({ field: 'title', message: 'Title must be a string' });
    } else {
      const trimmedTitle = body.title.trim();
      if (trimmedTitle.length < 3 || trimmedTitle.length > 200) {
        errors.push({ field: 'title', message: 'Title must be between 3 and 200 characters' });
      } else {
        req.body.title = trimmedTitle; // Sanitized value
      }
    }
  }

  if (body.status !== undefined) {
    const allowedStatuses = ['draft', 'published'];
    if (typeof body.status !== 'string' || !allowedStatuses.includes(body.status)) {
      errors.push({ field: 'status', message: 'Status must be either draft or published' });
    }
  }

  // 3. Reject immediately with 400 Bad Request if any validation rule failed
  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Input validation failed',
      errors,
    });
  }

  return next();
}

// Simulating validation with an invalid request:
const badReq = {
  params: { courseId: 'invalid-id' },
  body: { title: { $ne: '' }, status: 'archived' },
};
const mockRes = {
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    console.log('HTTP Status:', this.statusCode);
    console.log('Validation Errors:', JSON.stringify(payload.errors));
  },
};

validateUpdateCourse(badReq, mockRes, () => console.log('Passed!'));

/*
Expected Output:
HTTP Status: 400
Validation Errors: [{"field":"courseId","message":"Valid 24-character hex courseId is required"},{"field":"title","message":"Title must be a string"},{"field":"status","message":"Status must be either draft or published"}]
*/`,
        explanation:
          'Demonstrates how an Express validation middleware checks ObjectId route parameters, enforces primitive string types (blocking object payloads), checks string lengths and allowed enums, and returns 400 Bad Request before reaching business logic.',
      },
    ],
    importantPoints: [
      'Frontend validation improves user experience, whereas backend validation is the authoritative security and data-integrity boundary.',
      'Validation checks whether input is allowed and properly shaped; Sanitization cleans and normalizes input; Authorization verifies user permissions.',
      'Always validate all three input vectors: req.params (such as ObjectId format), req.query (filter types and pagination limits), and req.body.',
      'Always verify primitive types (e.g., typeof val === "string") before running string methods or database queries to block injected operator objects.',
      'Run validation middleware before controllers and services, returning 400 Bad Request immediately when invalid input is detected.',
    ],
    externalReferences: [
      {
        title: 'express-validator Official Documentation: Validation & Sanitization',
        url: 'https://express-validator.github.io/docs/',
        source: 'express-validator Documentation',
      },
      {
        title: 'OWASP Cheat Sheet Series: Input Validation Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html',
        source: 'OWASP Foundation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 7: Error Handling
  // ID: 6abe9dd4f15c2b4f6008ac4b
  // =========================================================================
  {
    topicId: '6abe9dd4f15c2b4f6008ac4b',
    title: 'Error Handling',
    content: {
      explanation: `In a production REST API, things will inevitably go wrong: a client sends malformed JSON ('400'), an access token expires ('401'), a student tries to access a creator endpoint ('403'), a requested course ID does not exist ('404'), a user tries to register an email that is already taken ('409'), a client exceeds the rate limit ('429'), or an unexpected database network drop occurs ('500').

If every controller handled errors in its own ad-hoc way, your API responses would be inconsistent and you could accidentally leak sensitive stack traces or internal database details to clients.

Instead, well-architected Express APIs use Centralized Error Handling: services throw structured application errors, controllers forward errors via 'next(err)', and a single four-argument Express error-handling middleware ('(err, req, res, next) => { ... }') maps errors to accurate HTTP status codes and client-safe JSON responses while logging internal diagnostics safely on the server.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Explain why centralized error handling is essential in an Express REST API.
2. Distinguish between Operational Errors (expected runtime conditions like 400, 401, 403, 404, 409, 429) and Programming/Unexpected Errors (bugs or infrastructure failures that map to 500).
3. Choose the exact HTTP error status code ('400', '401', '403', '404', '409', '429', '500') for each failure scenario rather than turning every error into a generic '500'.
4. Propagate asynchronous errors cleanly from Services and Controllers to Express's four-parameter error middleware ('(err, req, res, next)').
5. Format client-safe production error responses that never leak stack traces, MongoDB connection strings, passwords, JWT secrets, or internal database details.`,
        },
        {
          order: 1,
          heading: 'Operational Errors vs. Programming Errors',
          body: `Backend engineers classify errors into two fundamental categories:

1. Operational Errors (Expected Client or Domain Conditions — 4xx Statuses):
These are normal situations that happen even when your code has zero bugs:
• A client omits a required field or sends an invalid ObjectId ('400 Bad Request').
• A request has no JWT token or an expired token ('401 Unauthorized').
• A student requests an admin-only route ('403 Forbidden').
• A client requests a course ID that does not exist ('404 Not Found').
• A user registers with an email address that already exists in the 'users' collection ('409 Conflict').
• A client sends too many login attempts in one minute ('429 Too Many Requests').
Operational errors carry a clear, helpful message that IS safe and intended to be shown to the client.

2. Programming / Unexpected System Errors (500 Internal Server Error):
These are unexpected bugs or infrastructure failures (such as a 'TypeError' from reading a property of 'undefined' or a sudden database outage).
For '500' errors, the server logs the diagnostic error internally for engineers to fix, but returns a generic, safe message ('"An unexpected internal server error occurred"') to the client.`,
        },
        {
          order: 2,
          heading: 'Choosing the Right HTTP Error Status Code',
          body: `Never return a generic '500 Internal Server Error' for a client mistake! Each HTTP status code communicates a specific meaning to the frontend:

• 400 Bad Request: Malformed syntax, failed input validation, or invalid MongoDB 'ObjectId' parameter ('CastError' / 'ValidationError').
• 401 Unauthorized: Missing, invalid, or expired authentication credentials (the client must log in or refresh their token).
• 403 Forbidden: The client IS authenticated, but their role ('student') does not have permission to access the resource.
• 404 Not Found: The requested route or resource ID does not exist (or is hidden for ownership leak prevention).
• 409 Conflict: The request conflicts with existing state, such as a duplicate unique key in MongoDB ('err.code === 11000', e.g., duplicate email or duplicate module order).
• 429 Too Many Requests: The client exceeded the rate limiter threshold.
• 500 Internal Server Error: An unhandled server-side exception occurred.`,
        },
        {
          order: 3,
          heading: 'Express Four-Argument Error Middleware & Async Error Propagation',
          body: `How does Express know a middleware function is an Error Handler rather than a normal middleware?
By its function signature having exactly FOUR parameters:
export const errorHandler = (err, req, res, next) => { ... };

How Async Error Propagation Works:
In Express controllers, we wrap async operations in 'try / catch':
export const getCourseById = async (req, res, next) => {
  try {
    const course = await courseService.getCourseById({ ... });
    return res.status(200).json({ status: 'success', data: { course } });
  } catch (err) {
    return next(err); // Jumps straight past normal routes to errorHandler(err, req, res, next)!
  }
};

When 'next(err)' is called with an error argument, Express skips all remaining normal middleware and route handlers and invokes the centralized 'errorHandler' mounted at the very bottom of 'server/server.js'.`,
        },
        {
          order: 4,
          heading: 'Security Rule: Client-Safe Responses and Safe Logging',
          body: `What Must NEVER Be Exposed in Production Error Responses?
A production API error response must NEVER include:
• JavaScript stack traces ('err.stack') or internal file paths ('/app/server/services/...').
• MongoDB connection strings ('MONGODB_URI') or database credentials.
• User passwords or password hashes.
• JWT signing secrets ('JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET').
• Raw internal database driver dumps or collection structures.

How Centralized Error Middleware Protects Production Responses:
1. It normalizes known database errors—converting Mongoose 'ValidationError' and 'CastError' into clean '400 Bad Request' messages, and MongoDB duplicate key errors ('err.code === 11000') into '409 Conflict'.
2. If 'statusCode' is '500' in production, it returns a generic message ('"Internal Server Error"') instead of raw internal exception text, and never attaches 'err.stack' to the JSON response.`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Defining an error middleware with only 3 arguments '(err, req, res)': If you omit the fourth parameter 'next', Express treats your function as a normal middleware (where the first argument is 'req'!) and your error handler will never catch errors! Always write '(err, req, res, next) => {}'.
2. Mounting 'app.use(errorHandler)' BEFORE your routes in 'server.js': Error-handling middleware must be mounted AFTER all 'app.use("/api/...", router)' mounts so it can catch errors thrown by those routes.
3. Sending 'res.status(500).json({ error: err.stack })' to clients: Returning stack traces exposes internal file paths, library versions, and code logic to attackers.
4. Turning every database error into a 500: Map 'ValidationError'/'CastError' to '400' and duplicate key ('11000') to '409'.`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `Practice Task — Mapping Errors in a Centralized Error Handler:
1. Write a centralized Express error middleware function 'errorHandler(err, req, res, next)' that determines 'statusCode' and 'message' for these four cases:
   • Case A: 'err.name === "ValidationError"' → Status '400', message summarizing invalid fields.
   • Case B: 'err.name === "CastError"' → Status '400', message '"Invalid resource identifier format"'.
   • Case C: 'err.code === 11000' → Status '409', message '"Duplicate resource value already exists"'.
   • Case D: 'err.statusCode' is set (e.g., '403' or '404') → Use 'err.statusCode' and 'err.message'; otherwise default to '500' with a safe message '"Internal Server Error"'.
2. Ensure the JSON response never includes 'err.stack'.`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `• Centralized error handling uses a single four-argument middleware '(err, req, res, next)' mounted after all routes in 'server.js'.
• Distinguish operational 4xx errors ('400', '401', '403', '404', '409', '429') from unexpected '500' server errors so clients receive accurate HTTP status codes.
• Controllers catch async rejections and pass them to 'next(err)', keeping controller code clean and uniform.
• Production error responses must be client-safe and never expose stack traces, connection strings, passwords, JWT secrets, or internal database details.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Safe Centralized Express Error-Handling Middleware',
        language: 'javascript',
        code: `/**
 * Centralized Express Error Handler (server/middleware/errorHandler.js pattern).
 * Note: Must declare all 4 parameters (err, req, res, next) so Express recognizes it.
 */
export function safeErrorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // 1. Normalize Mongoose ValidationError -> 400 Bad Request
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const fieldMessages = Object.values(err.errors || {}).map((e) => e.message);
    message = fieldMessages.length > 0 ? fieldMessages.join(', ') : 'Validation failed';
  }
  // 2. Normalize Mongoose CastError (invalid ObjectId) -> 400 Bad Request
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid resource identifier format';
  }
  // 3. Normalize MongoDB Duplicate Key Error (11000) -> 409 Conflict
  else if (err.code === 11000) {
    statusCode = 409;
    message = 'A record with that unique value already exists';
  }

  // 4. Never leak internal error messages or stack traces on 500 errors
  const clientSafeMessage = statusCode === 500 ? 'An unexpected internal server error occurred' : message;

  return res.status(statusCode).json({
    status: 'error',
    statusCode,
    message: clientSafeMessage,
  });
}

// Testing how different errors are normalized safely:
const testErrors = [
  { name: 'CastError', message: 'Cast to ObjectId failed for value "abc" at path "_id"' },
  { code: 11000, message: 'E11000 duplicate key error collection: learnsphere.users index: email_1' },
  { statusCode: 404, message: 'Course not found' },
  { statusCode: 500, message: 'Internal DB socket timeout on host 10.0.0.12', stack: 'Error: ...' },
];

for (const sampleErr of testErrors) {
  safeErrorHandler(
    sampleErr,
    {},
    {
      status(code) {
        this.code = code;
        return this;
      },
      json(body) {
        console.log(\`HTTP \${this.code} -> \${JSON.stringify(body)}\`);
      },
    },
    () => {}
  );
}

/*
Expected Output:
HTTP 400 -> {"status":"error","statusCode":400,"message":"Invalid resource identifier format"}
HTTP 409 -> {"status":"error","statusCode":409,"message":"A record with that unique value already exists"}
HTTP 404 -> {"status":"error","statusCode":404,"message":"Course not found"}
HTTP 500 -> {"status":"error","statusCode":500,"message":"An unexpected internal server error occurred"}
*/`,
        explanation:
          'Demonstrates how a four-parameter Express error handler maps CastError (400), duplicate key 11000 (409), operational statusCode (404), and unexpected 500 errors into clean, client-safe JSON responses without exposing stack traces or internal infrastructure details.',
      },
    ],
    importantPoints: [
      'Centralized error middleware in Express must declare all four parameters: (err, req, res, next) and be mounted after all routes.',
      'Use accurate HTTP error statuses: 400 (validation/malformed ID), 401 (unauthenticated), 403 (forbidden role), 404 (not found), 409 (conflict/duplicate), 429 (rate limit), and 500 (unexpected server error).',
      'Controllers forward async errors using try/catch and return next(err) so error formatting stays in one place.',
      'Normalize database errors such as Mongoose ValidationError/CastError (400) and MongoDB duplicate key code 11000 (409).',
      'Never expose stack traces, MongoDB connection strings, passwords, JWT secrets, or internal database details in client responses.',
    ],
    externalReferences: [
      {
        title: 'Express.js Official Guide: Error Handling',
        url: 'https://expressjs.com/en/guide/error-handling.html',
        source: 'Express.js Official Documentation',
      },
      {
        title: 'OWASP Cheat Sheet Series: Error Handling Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html',
        source: 'OWASP Foundation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 8: Pagination
  // ID: 6abe9dd5f15c2b4f6008ac4c
  // =========================================================================
  {
    topicId: '6abe9dd5f15c2b4f6008ac4c',
    title: 'Pagination',
    content: {
      explanation: `Imagine an online learning platform whose 'courses' or 'users' collection grows to 25,000 records. If a 'GET /api/courses' endpoint tried to load all 25,000 documents from MongoDB, serialize them into a giant multi-megabyte JSON string, and send them over the network in a single response, both the backend server and the user's browser would grind to a halt.

Pagination solves this problem by dividing a large collection into small, predictable "pages" of results. The client requests a specific page number and page size via query parameters—such as 'GET /api/courses?page=2&limit=10'—and the backend returns just those 10 items along with pagination metadata ('page', 'limit', 'total', 'totalPages') so the frontend can render "Next Page" and "Previous Page" controls accurately.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Explain why pagination is necessary for collection endpoints in a REST API.
2. Calculate 'page', 'limit', 'skip' (offset), and 'totalPages' accurately from HTTP query parameters.
3. Combine deterministic '.sort()' with '.skip()' and '.limit()' in Mongoose queries and return structured pagination metadata.
4. Enforce server-side minimum and maximum bounds on 'page' and 'limit' so a client cannot request a million records at once.
5. Understand the trade-offs of offset pagination on very large or rapidly changing datasets and how cursor-based pagination works conceptually.`,
        },
        {
          order: 1,
          heading: 'How Page, Limit, and Skip (Offset) Work Together',
          body: `When a client requests:
GET /api/courses?page=2&limit=10

The client is asking for:
• 'limit = 10': At most 10 items per page (the page size).
• 'page = 2': The second page of results (items 11 through 20).

How Do We Calculate 'skip' (Offset)?
To reach page 'page', the database needs to skip over all the items that appeared on previous pages:
const skip = (page - 1) * limit;

Let us verify this formula across the first 4 pages when 'limit = 10':
• Page 1: 'skip = (1 - 1) * 10 = 0'   → Skips 0 items, returns items 1–10.
• Page 2: 'skip = (2 - 1) * 10 = 10'  → Skips first 10 items, returns items 11–20.
• Page 3: 'skip = (3 - 1) * 10 = 20'  → Skips first 20 items, returns items 21–30.
• Page 4: 'skip = (4 - 1) * 10 = 30'  → Skips first 30 items, returns items 31–35 (the remaining 5 items out of 35 total).

How Do We Calculate 'totalPages'?
Using the total number of matching documents ('total = await Course.countDocuments(filter)'), we round up with 'Math.ceil()':
const totalPages = Math.ceil(total / limit);
For example, if 'total = 35' and 'limit = 10', 'Math.ceil(35 / 10)' equals '4' pages!`,
        },
        {
          order: 2,
          heading: 'Structured Pagination Response Metadata & Deterministic Sorting',
          body: `A paginated REST endpoint should return both the array of items for the current page AND a metadata summary so the frontend UI knows how many pages exist:

{
  "items": [ ...10 course objects... ],
  "page": 2,
  "limit": 10,
  "total": 35,
  "totalPages": 4
}

Why Deterministic Sorting ('.sort()') Is Mandatory with Pagination:
Without an explicit '.sort()' clause, a database does not guarantee the order in which documents are returned across separate requests. If Page 1 and Page 2 are not sorted deterministically, the same course could appear on both Page 1 and Page 2!
Always apply a consistent sort—such as '.sort({ createdAt: -1, _id: -1 })'—before '.skip(skip)' and '.limit(limit)'.`,
        },
        {
          order: 3,
          heading: 'Security Rule: Enforcing Server-Side Bounds on Page and Limit',
          body: `What happens if a client requests 'GET /api/courses?page=-5&limit=99999999' or 'GET /api/courses?page=abc&limit=NaN'?
• Passing a negative number into '.skip()' throws a MongoDB query error.
• Passing '99999999' into '.limit()' allows a single client to trigger a massive memory/database denial-of-service query!

Therefore, the backend must NEVER trust raw 'req.query.page' or 'req.query.limit'. Always normalize and clamp them on the server:
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50; // Authoritative maximum page size

const rawPage = Number.parseInt(req.query.page, 10);
const rawLimit = Number.parseInt(req.query.limit, 10);

const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
const limit = Number.isInteger(rawLimit) && rawLimit > 0
  ? Math.min(rawLimit, MAX_LIMIT)
  : DEFAULT_LIMIT;
const skip = (page - 1) * limit;`,
        },
        {
          order: 4,
          heading: 'Offset Pagination Trade-Offs & Cursor-Based Pagination Concept',
          body: `The 'page' / 'limit' / 'skip' approach we just built is called Offset Pagination. It is simple, intuitive, and lets users jump directly to "Page 4".

However, for very large or rapidly changing datasets (such as a live social feed with millions of posts), offset pagination has two known trade-offs:
1. Deep Offset Cost: If a user requests 'skip = 500000', MongoDB still has to scan through 500,000 index entries before returning 10 documents.
2. Shifting Items: If a new item is inserted at the top of Page 1 while a user is reading Page 1, the 10th item shifts down to become the 1st item on Page 2 when they click "Next".

Conceptual Introduction to Cursor-Based Pagination:
To solve those two issues on massive feeds, APIs can use Cursor-Based Pagination: instead of passing 'page=2', the client passes the unique '_id' or timestamp of the last item it saw ('?after=6abe9dd5f15c2b4f6008ac4c&limit=10'), and the server queries '{ _id: { $lt: lastSeenId } }.sort({ _id: -1 }).limit(10)'. For standard course catalogs and admin tables in LearnSphere, bounded offset pagination is the ideal fit.`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Passing 'req.query.limit' directly into '.limit(req.query.limit)' without a 'MAX_LIMIT' cap or 'Number.parseInt()': Remember that 'req.query' values are strings, and unbounded limits allow clients to request the entire collection in one call.
2. Counting all documents in the collection instead of counting documents matching the active 'filter': When calculating 'total', always pass the exact same 'filter' object to 'Model.countDocuments(filter)' that you passed to 'Model.find(filter)'!
3. Using 'Math.round()' or 'Math.floor()' instead of 'Math.ceil()' for 'totalPages': If there are 35 items and 'limit = 10', 'Math.floor(35 / 10)' gives '3' pages, hiding the last 5 items! Always use 'Math.ceil(total / limit)'.`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `Practice Task — Calculating Pagination Metadata:
1. Suppose a collection has 'total = 42' matching courses and a client requests 'GET /api/courses?page=3&limit=10'.
2. Calculate the exact values of:
   • 'skip'
   • How many items are returned on Page 3
   • How many items will be returned on Page 5
   • 'totalPages'
3. Write the 5-line JavaScript helper function 'parsePagination(query)' that safely clamps 'page >= 1' and '1 <= limit <= 50'.`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `• Pagination divides large collections into manageable pages using 'page', 'limit', and 'skip = (page - 1) * limit'.
• Always pair paginated queries with a deterministic '.sort()' and return metadata ('items', 'page', 'limit', 'total', 'totalPages' via 'Math.ceil(total / limit)').
• Enforce server-side minimum and maximum bounds (such as 'MAX_LIMIT = 50') so clients cannot request negative pages or unbounded page sizes.
• While offset pagination is ideal for catalogs and dashboards, cursor-based pagination is an alternative concept used for massive, rapidly shifting feeds.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Safe Bounded Pagination Helper and Paginated Response Builder',
        language: 'javascript',
        code: `const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

/**
 * Safely parses and clamps page and limit from untrusted req.query,
 * and computes pagination metadata for GET /api/courses?page=2&limit=10.
 */
export function buildPaginationPlan(rawQuery = {}, totalMatchingItems = 0) {
  const parsedPage = Number.parseInt(rawQuery.page, 10);
  const parsedLimit = Number.parseInt(rawQuery.limit, 10);

  const page = Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : DEFAULT_PAGE;
  const limit =
    Number.isInteger(parsedLimit) && parsedLimit >= 1
      ? Math.min(parsedLimit, MAX_LIMIT)
      : DEFAULT_LIMIT;

  const skip = (page - 1) * limit;
  const totalPages = totalMatchingItems === 0 ? 0 : Math.ceil(totalMatchingItems / limit);

  return { page, limit, skip, total: totalMatchingItems, totalPages };
}

// Example 1: Standard request GET /api/courses?page=2&limit=10 with 35 total courses
const page2Plan = buildPaginationPlan({ page: '2', limit: '10' }, 35);
console.log('Page 2 Plan:', JSON.stringify(page2Plan));

// Example 2: Client attempts negative page and huge limit (?page=-3&limit=50000)
const clampedPlan = buildPaginationPlan({ page: '-3', limit: '50000' }, 35);
console.log('Clamped Safe Plan:', JSON.stringify(clampedPlan));

/*
Expected Output:
Page 2 Plan: {"page":2,"limit":10,"skip":10,"total":35,"totalPages":4}
Clamped Safe Plan: {"page":1,"limit":50,"skip":0,"total":35,"totalPages":1}
*/`,
        explanation:
          'Demonstrates how the server parses page and limit safely, enforces a strict MAX_LIMIT of 50, computes skip = (page - 1) * limit, and calculates totalPages = Math.ceil(total / limit).',
      },
    ],
    importantPoints: [
      'Pagination prevents memory and network overload by returning a bounded slice of documents using page, limit, and skip = (page - 1) * limit.',
      'Always include a deterministic .sort() (such as { createdAt: -1, _id: -1 }) so items do not shift randomly between pages.',
      'Return structured pagination metadata (items, page, limit, total, totalPages) using Math.ceil(total / limit).',
      'Never trust raw client limit or page values: enforce page >= 1 and cap limit with a server-side MAX_LIMIT (e.g., 50).',
      'Pass the exact same filter object to countDocuments(filter) and find(filter) so total reflects the filtered result set.',
    ],
    externalReferences: [
      {
        title: 'MongoDB Manual: cursor.skip() and cursor.limit() Pagination',
        url: 'https://www.mongodb.com/docs/manual/reference/method/cursor.skip/',
        source: 'MongoDB Official Documentation',
      },
      {
        title: 'Mongoose Official Docs: Query.prototype.limit() & skip()',
        url: 'https://mongoosejs.com/docs/api/query.html#Query.prototype.limit()',
        source: 'Mongoose Official Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 9: Searching and Filtering
  // ID: 6abe9dd5f15c2b4f6008ac4d
  // =========================================================================
  {
    topicId: '6abe9dd5f15c2b4f6008ac4d',
    title: 'Searching and Filtering',
    content: {
      explanation: `When students browse a course catalog or an administrator audits users, they need to narrow down results dynamically using URL query parameters such as:
• 'GET /api/courses?category=Backend'
• 'GET /api/courses?difficulty=Beginner'
• 'GET /api/courses?search=node'
• 'GET /api/courses?category=Backend&search=node&page=1&limit=10'

While both Searching and Filtering narrow down a collection, they work differently under the hood: Filtering matches exact field values or allowed categories, whereas Searching looks for a keyword substring across text fields like 'title' or 'description'.

Most importantly, converting HTTP query parameters into MongoDB queries requires a strict security boundary: you must NEVER pass arbitrary 'req.query' objects directly into MongoDB. Instead, your service must use an explicit allowlist of supported filter parameters and validate every value before constructing the database query.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Distinguish between exact Filtering (such as 'category=Backend' or 'difficulty=Beginner') and keyword Searching (such as 'search=node').
2. Convert validated HTTP query parameters ('req.query') into safe Mongoose filter conditions.
3. Combine filtering, keyword searching, sorting, and pagination into one unified query pipeline.
4. Explain why passing raw 'req.query' directly into MongoDB is dangerous and how allowlisting prevents NoSQL operator injection.
5. Safely handle unknown query parameters, invalid values, and excessively long search strings.`,
        },
        {
          order: 1,
          heading: 'Filtering vs. Searching Explained',
          body: `Although users often interact with filters and a search bar on the same page, they represent two distinct query patterns:

1. Filtering (Exact or Enumerated Attribute Match):
• Example: 'GET /api/courses?category=Backend&difficulty=Beginner'
• Purpose: Restricts results to documents where a specific structured field equals a known value (often normalized to lowercase, such as 'category: "backend"').
• Database Condition: Exact equality match ('filter.category = "backend"').

2. Searching (Keyword Substring or Text Match):
• Example: 'GET /api/courses?search=node'
• Purpose: Finds documents whose human-readable text fields (such as 'title' or 'description') contain the user's keyword anywhere in the text, case-insensitively.
• Database Condition: Safe, escaped case-insensitive regular expression or text index match across 'title' and 'description'.`,
        },
        {
          order: 2,
          heading: 'Security Rule: Never Directly Pass Arbitrary req.query into MongoDB',
          body: `Why is 'Course.find(req.query)' a severe security flaw?

1. Unauthorized Field Exposure:
In LearnSphere, the public course catalog ('GET /api/courses') must ONLY return courses where 'status === "published"'. If a route passed 'req.query' directly into 'Course.find(req.query)', a client could request '?status=draft' and view unpublished draft courses!

2. NoSQL Operator Injection:
Express parses nested query parameters like '?category[$ne]=none' into an object: '{ category: { $ne: "none" } }'. If passed directly into MongoDB, the client can execute arbitrary MongoDB comparison operators instead of matching a category string.

3. Regular Expression Denial of Service (ReDoS) on Search Strings:
If a client passes special regex characters (like '.*', '+', '(', '[') or a 50,000-character string in '?search=...', passing it unescaped into 'new RegExp(req.query.search, "i")' can throw a syntax error or stall the Node.js event loop.

The Defense — Allowlisted Fields, Type Checks, Length Caps, and Regex Escaping:
• Start with an authoritative base filter: 'const filter = { status: "published" };'.
• Only inspect allowlisted query keys ('category', 'difficulty', 'search'). Any unknown query parameter (like '?status=draft' or '?secretField=1') is completely ignored!
• Verify 'typeof val === "string"', cap search length (e.g., max 100 chars), and escape special regex characters ('val.replace(/[.*+?^{}$()|[\\]\\\\]/g, "\\\\$&")') before constructing a case-insensitive search pattern.`,
        },
        {
          order: 3,
          heading: 'Combining Filtering, Searching, Sorting, and Pagination Together',
          body: `In a production service function ('getCourses'), filtering, searching, sorting, and pagination work together seamlessly in four steps:

Step 1 — Build the Authoritative Filter Object:
• Set mandatory server constraints ('filter.status = "published"').
• Add validated exact filters ('if (validCategory) filter.category = validCategory').
• Add validated keyword search ('if (escapedSearch) filter.$or = [{ title: regex }, { description: regex }]').

Step 2 — Count Total Matching Documents:
• Run 'const total = await Course.countDocuments(filter);' using the exact composite 'filter'.

Step 3 — Fetch the Sorted, Paginated Page of Documents:
• Run 'const items = await Course.find(filter).select("...").sort({ createdAt: -1 }).skip(skip).limit(limit).lean();'.

Step 4 — Return Items and Pagination Metadata:
• Return '{ items, page, limit, total, totalPages: Math.ceil(total / limit) }'.`,
        },
        {
          order: 4,
          heading: 'Handling Unknown Parameters, Invalid Values, and Empty Results',
          body: `How should your REST API behave when a client sends unusual query parameters?

• Unknown Query Parameters (e.g., 'GET /api/courses?utm_source=newsletter&foo=bar'):
  Because the service only reads its explicit allowlist ('category', 'difficulty', 'search', 'page', 'limit'), unknown query parameters are harmlessly ignored.
• Filter Matches Zero Documents (e.g., 'GET /api/courses?category=quantum-computing'):
  Return HTTP '200 OK' with 'items: []' and 'total: 0'. Remember: an empty collection search result is a valid '200 OK' response, NOT '404 Not Found'!
• Excessively Long Search Strings:
  Either reject strings over 100 characters with '400 Bad Request' in validation middleware, or slice/bound them safely before building the query.`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Passing 'req.query' directly into 'Model.find(req.query)': Never let the client dictate which database fields or operators are queried.
2. Building 'new RegExp(req.query.search, "i")' without escaping regex metacharacters or checking 'typeof req.query.search === "string"': If a user searches for '"C++"' or '"Node.js (v22)"', unescaped '+' or '(' characters break or alter the regular expression! Always escape special regex characters first.
3. Returning '404 Not Found' when a search or filter returns 0 items: Always return '200 OK' with an empty 'items: []' array when querying a collection.`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `Practice Task — Writing a Safe Filter & Search Builder:
1. Write a pure JavaScript function 'buildCourseCatalogFilter(rawQuery)' that starts with '{ status: "published" }'.
2. If 'rawQuery.category' is a non-empty string, normalize it to trimmed lowercase and set 'filter.category'.
3. If 'rawQuery.difficulty' is one of '["beginner", "intermediate", "advanced"]' (case-insensitive), set 'filter.difficulty'.
4. If 'rawQuery.search' is a non-empty string (max 100 chars), escape regex special characters and attach a '$or' condition matching 'title' or 'description'.`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `• Filtering narrows results by exact or enumerated attributes ('?category=Backend&difficulty=Beginner'), while Searching matches keyword text across fields ('?search=node').
• Never pass raw 'req.query' directly into MongoDB; always construct a fresh filter object from an explicit allowlist of validated primitive parameters.
• Escape special regex characters and cap search string length before performing case-insensitive keyword searches.
• Combine your validated filter with 'countDocuments(filter)', '.sort()', '.skip()', and '.limit()' to deliver filtered, searched, and paginated collection endpoints.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Safe Allowlisted Filtering and Escaped Keyword Search Builder',
        language: 'javascript',
        code: `/**
 * Escapes special regular expression characters so user search terms like "C++" or "Node.js"
 * are treated strictly as literal characters.
 */
function escapeRegex(text) {
  return text.replace(/[.*+?^{}$()|[\\]\\\\]/g, '\\\\$&');
}

/**
 * Converts untrusted req.query into a safe MongoDB filter for GET /api/courses.
 * Enforces status: 'published', allowlists category/difficulty, and bounds search strings.
 */
export function buildSafeCourseFilter(rawQuery = {}) {
  // 1. Authoritative server constraint: public catalog only shows published courses
  const filter = { status: 'published' };

  // 2. Allowlisted exact filter: category
  if (typeof rawQuery.category === 'string' && rawQuery.category.trim().length > 0) {
    filter.category = rawQuery.category.trim().toLowerCase();
  }

  // 3. Allowlisted enum filter: difficulty
  const allowedDifficulties = ['beginner', 'intermediate', 'advanced'];
  if (typeof rawQuery.difficulty === 'string') {
    const normalizedDiff = rawQuery.difficulty.trim().toLowerCase();
    if (allowedDifficulties.includes(normalizedDiff)) {
      filter.difficulty = normalizedDiff;
    }
  }

  // 4. Safe, bounded, regex-escaped keyword search
  if (typeof rawQuery.search === 'string') {
    const trimmedSearch = rawQuery.search.trim().slice(0, 100);
    if (trimmedSearch.length > 0) {
      const safePattern = escapeRegex(trimmedSearch);
      filter.$or = [
        { title: { $regex: safePattern, $options: 'i' } },
        { description: { $regex: safePattern, $options: 'i' } },
      ];
    }
  }

  return filter;
}

// Test 1: Legitimate combined filter and search
console.log(
  'Valid Filter:',
  JSON.stringify(buildSafeCourseFilter({ category: 'Backend', difficulty: 'Beginner', search: 'Node.js' }))
);

// Test 2: Client tries to override status='draft' and inject an object into category
console.log(
  'Protected Filter:',
  JSON.stringify(buildSafeCourseFilter({ status: 'draft', category: { $ne: null }, unknownParam: 'ignored' }))
);

/*
Expected Output:
Valid Filter: {"status":"published","category":"backend","difficulty":"beginner","$or":[{"title":{"$regex":"Node\\\\.js","$options":"i"}},{"description":{"$regex":"Node\\\\.js","$options":"i"}}]}
Protected Filter: {"status":"published"}
*/`,
        explanation:
          'Demonstrates how to build a safe MongoDB filter from HTTP query parameters using an allowlist for category and difficulty, regex-escaping and length-capping for search keywords, and immutable enforcement of status: "published".',
      },
    ],
    importantPoints: [
      'Filtering matches exact or enumerated attributes (e.g., ?category=Backend), whereas Searching matches keywords across text fields (e.g., ?search=node).',
      'Never pass raw req.query directly into MongoDB queries; always construct a new filter object from an explicit allowlist of supported parameters.',
      'Validate that query parameter values are primitive strings within safe length bounds, and ignore unknown query parameters.',
      'Always escape special regular expression characters and cap string length before constructing a case-insensitive $regex search.',
      'When a valid search or filter matches 0 documents, return 200 OK with an empty items array [] rather than 404 Not Found.',
    ],
    externalReferences: [
      {
        title: 'MongoDB Manual: $regex Query Operator Reference',
        url: 'https://www.mongodb.com/docs/manual/reference/operator/query/regex/',
        source: 'MongoDB Official Documentation',
      },
      {
        title: 'Express.js Official API Reference: req.query',
        url: 'https://expressjs.com/en/4x/api.html#req.query',
        source: 'Express.js Official Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 10: API Testing
  // ID: 6abe9dd6f15c2b4f6008ac4e
  // =========================================================================
  {
    topicId: '6abe9dd6f15c2b4f6008ac4e',
    title: 'API Testing',
    content: {
      explanation: `How do you know for sure that your REST API works as intended—and just as importantly, that students cannot access Course Creator endpoints, that Creator A cannot modify Creator B's courses, and that invalid inputs return '400 Bad Request' instead of crashing the server?

You verify it through systematic API Testing. Testing only the "happy path" (where a valid user sends valid data) is never enough in backend engineering. A production-ready API test suite verifies the complete Test Matrix across authentication, role authorization, resource ownership, input validation, not-found handling, conflict handling, and database state integrity.

Whether you are testing interactively during development with Postman or running automated Node.js HTTP verification scripts (like the 'server/scripts/verify*.js' suites in LearnSphere), mastering systematic API testing gives you confidence in every deployment.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Explain why backend APIs require automated and systematic testing beyond manual browser clicks.
2. Distinguish between Unit Tests and Integration / Endpoint Tests at a beginner level.
3. Apply the complete API Test Matrix: Valid Success ('200'/'201'), Invalid Input ('400'), Unauthenticated ('401'), Unauthorized Role ('403'), Missing/Unowned Resource ('404'), and Duplicate Conflict ('409').
4. Write clear HTTP status-code assertions and JSON response-body assertions in Node.js verification scripts.
5. Explain why security tests and test-data cleanup are mandatory parts of API testing.`,
        },
        {
          order: 1,
          heading: 'Unit Tests vs. Integration (Endpoint) Tests',
          body: `In backend software engineering, we use two primary levels of testing:

1. Unit Tests:
• Test a single isolated function (such as 'escapeRegex()', 'buildPaginationPlan()', or 'normalizeRole()') in memory without starting an HTTP server or connecting to a live database.
• Fast (milliseconds) and great for verifying pure helper logic and edge cases.

2. Integration / Endpoint Tests:
• Send real HTTP requests ('fetch') through the full Express pipeline: Route → Middleware → Controller → Service → Model → MongoDB, and inspect the real HTTP response and database state.
• Essential for REST APIs because many critical bugs (such as middleware ordering mistakes, missing authentication gates, or Mongoose validation errors) only appear when all layers work together!`,
        },
        {
          order: 2,
          heading: 'The Essential API Test Matrix (Happy Path + Error & Security Paths)',
          body: `For every protected REST endpoint you build, test all six scenarios in the API Test Matrix:

Valid request                 → Expected success (200 OK or 201 Created + expected JSON data)
Invalid input                 → Validation error (400 Bad Request + structured error list)
Unauthenticated request       → Authentication failure (401 Unauthorized)
Authenticated, wrong role     → Authorization failure (403 Forbidden, e.g., Student calling Creator API)
Missing or unowned resource   → Not Found (404 Not Found, including cross-creator leak prevention)
Duplicate unique resource     → Conflict response (409 Conflict, e.g., registering an existing email)

Why Security Testing Is Part of API Testing:
If you only test that Creator A can update Creator A's course ('200 OK'), you have NOT tested whether your ownership middleware actually blocks Creator B! A complete API test explicitly logs in as Creator B, attempts to 'GET' and 'PATCH' Creator A's course, and asserts that the server returns '404 Not Found' and leaves Creator A's database record untouched.`,
        },
        {
          order: 3,
          heading: 'Interactive Testing (Postman / curl) vs. Automated Verification Scripts',
          body: `1. Interactive API Testing Tools (Postman, Insomnia, curl):
• Ideal while you are actively writing a new endpoint and want to inspect headers, status codes, and JSON payloads manually.
• Limitation: Manual testing does not automatically re-run every time you change code in a later phase.

2. Automated HTTP Verification Scripts (Node.js 'fetch' Suites):
• In LearnSphere ('server/scripts/verify*.js'), we write self-contained Node.js scripts that send real 'fetch()' requests to the running server, assert both HTTP status codes ('res.status === 200') and JSON body properties ('data.status === "success"'), verify MongoDB document counts, and clean up any temporary test users in a 'finally' block.
• Running an automated script verifies 50 to 200 assertions in seconds and guarantees zero regressions across phases!`,
        },
        {
          order: 4,
          heading: 'Writing Status-Code, Response-Body, and Database Cleanup Assertions',
          body: `Every strong API test checks three things:
1. HTTP Status Code Assertion:
   'assert(res.status === 201, "POST /api/creator/courses returns 201 Created");'
2. Response Body Structure & Value Assertion:
   'assert(res.data?.data?.course?.status === "draft", "New course defaults to draft status");'
3. Database State & Cleanup Assertion:
   • Verify the record was actually persisted (or not modified on a rejected 400/403/404 request).
   • In a 'try / finally' block, delete any temporary test users, courses, or refresh sessions created during the test so the database remains completely clean after the test finishes.`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Testing only the "200 OK" happy path: Most production incidents and security vulnerabilities happen on error paths (missing tokens, wrong roles, malformed IDs, or cross-user IDOR attempts). Always test the full 6-row Test Matrix.
2. Checking only 'res.status === 200' without inspecting the JSON response body: A buggy controller might return '200 OK' with '{ data: null }' or leak sensitive fields like 'passwordHash'. Assert both the status code AND the response body structure.
3. Leaving temporary test records in the database after a test script finishes (or fails midway): Always wrap test execution in 'try { ... } finally { ... }' so temporary test data is cleaned up even if an assertion throws an error.`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `Practice Task — Designing a 6-Case API Test Matrix for a Course Endpoint:
Suppose you are testing 'PATCH /api/creator/courses/:courseId'.
Write out 6 concrete test cases specifying:
1. Who sends the request (Unauthenticated, Student, Unrelated Creator B, Owning Creator A).
2. What ':courseId' and JSON body they send.
3. What exact HTTP status code ('200', '400', '401', '403', '404') the server must return for each case.`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `• API testing verifies that routes, middleware, controllers, services, and models work together accurately across both happy paths and failure/security paths.
• Unit tests verify isolated pure functions in memory, while integration/endpoint tests verify full HTTP request-response cycles against the server and database.
• Always test the complete API Test Matrix: '200/201' (Valid), '400' (Invalid Input), '401' (Unauthenticated), '403' (Unauthorized Role), '404' (Missing/Unowned Resource), and '409' (Conflict).
• Assert both HTTP status codes and JSON response bodies, and always clean up temporary test records in a 'finally' block.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Automated API Test Matrix Runner with Status & Body Assertions',
        language: 'javascript',
        code: `/**
 * Demonstrates how an automated API verification script tests the complete
 * 6-part Test Matrix against an endpoint handler.
 */
function runTestMatrixSimulation() {
  let passed = 0;
  let total = 0;

  function assert(condition, label) {
    total++;
    if (condition) {
      passed++;
      console.log(\`  ✓ [PASS] \${label}\`);
    } else {
      console.error(\`  ✗ [FAIL] \${label}\`);
    }
  }

  // Simulated endpoint evaluator representing PATCH /api/creator/courses/:courseId
  function simulatePatchCourse({ tokenRole, tokenUserId, courseOwnerId, courseId, body }) {
    if (!tokenRole) return { status: 401, body: { error: 'Unauthorized' } };
    if (tokenRole !== 'course_creator') return { status: 403, body: { error: 'Forbidden' } };
    if (!/^[0-9a-fA-F]{24}$/.test(courseId) || typeof body.title !== 'string' || body.title.trim().length < 3) {
      return { status: 400, body: { error: 'Bad Request' } };
    }
    if (tokenUserId !== courseOwnerId) {
      return { status: 404, body: { error: 'Not Found' } }; // Leak prevention
    }
    return { status: 200, body: { status: 'success', data: { title: body.title.trim() } } };
  }

  const validCourseId = '6abe9dc2f15c2b4f6008ac1c';

  // 1. Valid Request -> 200 OK
  const resValid = simulatePatchCourse({
    tokenRole: 'course_creator',
    tokenUserId: 'creator_A',
    courseOwnerId: 'creator_A',
    courseId: validCourseId,
    body: { title: 'Updated Course Title' },
  });
  assert(resValid.status === 200 && resValid.body.data.title === 'Updated Course Title', 'Valid request -> 200 OK');

  // 2. Invalid Input -> 400 Bad Request
  const resInvalid = simulatePatchCourse({
    tokenRole: 'course_creator',
    tokenUserId: 'creator_A',
    courseOwnerId: 'creator_A',
    courseId: 'bad-id',
    body: { title: '' },
  });
  assert(resInvalid.status === 400, 'Invalid input -> 400 Bad Request');

  // 3. Unauthenticated -> 401 Unauthorized
  const resUnauth = simulatePatchCourse({
    tokenRole: null,
    tokenUserId: null,
    courseOwnerId: 'creator_A',
    courseId: validCourseId,
    body: { title: 'Valid Title' },
  });
  assert(resUnauth.status === 401, 'Unauthenticated -> 401 Unauthorized');

  // 4. Authenticated but Unauthorized Role (Student) -> 403 Forbidden
  const resStudent = simulatePatchCourse({
    tokenRole: 'student',
    tokenUserId: 'student_1',
    courseOwnerId: 'creator_A',
    courseId: validCourseId,
    body: { title: 'Valid Title' },
  });
  assert(resStudent.status === 403, 'Authenticated Student on Creator route -> 403 Forbidden');

  // 5. Unrelated Course Creator (Not Owner) -> 404 Not Found
  const resOtherCreator = simulatePatchCourse({
    tokenRole: 'course_creator',
    tokenUserId: 'creator_B',
    courseOwnerId: 'creator_A',
    courseId: validCourseId,
    body: { title: 'Hijack Title' },
  });
  assert(resOtherCreator.status === 404, 'Unowned/Missing resource -> 404 Not Found');

  console.log(\`Matrix Summary: \${passed}/\${total} assertions passed.\`);
}

runTestMatrixSimulation();

/*
Expected Output:
  ✓ [PASS] Valid request -> 200 OK
  ✓ [PASS] Invalid input -> 400 Bad Request
  ✓ [PASS] Unauthenticated -> 401 Unauthorized
  ✓ [PASS] Authenticated Student on Creator route -> 403 Forbidden
  ✓ [PASS] Unowned/Missing resource -> 404 Not Found
Matrix Summary: 5/5 assertions passed.
*/`,
        explanation:
          'Demonstrates how an automated test suite verifies the complete API Test Matrix (200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden, and 404 Not Found) with both status-code and response-body assertions.',
      },
    ],
    importantPoints: [
      'Unit tests check isolated functions in memory, while endpoint integration tests verify the full HTTP Route -> Middleware -> Controller -> Service -> Database flow.',
      'Always test the full API Test Matrix: Valid (200/201), Invalid Input (400), Unauthenticated (401), Unauthorized Role (403), Missing/Unowned (404), and Conflict (409).',
      'Assert both the HTTP status code and the JSON response body payload on every test case.',
      'Security verification—such as confirming students receive 403 and unrelated Course Creators receive 404—is a core part of API testing.',
      'Always clean up any temporary test users or sessions inside a finally block so the database remains clean after verification.',
    ],
    externalReferences: [
      {
        title: 'Node.js Official Documentation: Built-in Test Runner & Assertions',
        url: 'https://nodejs.org/api/test.html',
        source: 'Node.js Official Documentation',
      },
      {
        title: 'MDN Web Docs: Fetch API for HTTP Requests and Assertions',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API',
        source: 'MDN Web Docs',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },
];
