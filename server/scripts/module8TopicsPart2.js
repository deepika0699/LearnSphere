/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LearnSphere Module 8 — Practical Backend Project Content (Part 2: Topics 6–9)
 */

export const module8TopicsPart2 = [
  // =========================================================================
  // TOPIC 6: Adding Authorization
  // =========================================================================
  {
    topicId: '6abe9de1f15c2b4f6008ac6a',
    title: 'Adding Authorization',
    content: {
      explanation:
        'Once authentication confirms who the caller is, authorization determines what that caller is allowed to do. In a real-world multi-tenant or multi-creator backend like LearnSphere, authorization has two distinct layers: Role-Based Access Control (RBAC), which checks whether the user holds a required role such as student, course_creator, or admin; and Resource Ownership Enforcement, which verifies that a course_creator can only view or modify courses, modules, and topics that they personally created. Without both layers, any logged-in user could overwrite another user\'s data—a critical vulnerability known as Broken Object Level Authorization (BOLA).',
      sections: [
        {
          heading: 'Learning Objectives',
          body: `- Distinguish between Authentication (\`401 Unauthorized\`) and Authorization (\`403 Forbidden\` / \`404 Not Found\`).
- Implement reusable Role-Based Access Control (RBAC) middleware (\`authorizeRoles(...allowedRoles)\`) for Express routes.
- Enforce strict Resource Ownership checks in the service layer by filtering queries with \`createdBy: req.user.id\`.
- Understand Broken Object Level Authorization (BOLA / IDOR) and why role checks alone are insufficient.
- Apply existence-leak prevention by returning \`404 Not Found\` when an unrelated \`course_creator\` requests a draft resource they do not own.`,
          order: 0,
        },
        {
          heading: 'Core Terminology',
          body: `- **Authorization (AuthZ)**: Verifying whether an authenticated user has permission to perform a specific action or access a specific resource.
- **Role-Based Access Control (RBAC)**: Restricting route access based on the user's assigned system role (\`student\`, \`course_creator\`, or \`admin\`).
- **Resource Ownership Enforcement (Object-Level Authorization)**: Verifying that the target database record belongs to the authenticated user (e.g., \`course.createdBy.toString() === req.user.id\`).
- **BOLA (Broken Object Level Authorization / IDOR)**: The #1 API security vulnerability on the OWASP API Security Top 10, occurring when an API checks a user's role but fails to check whether they own the requested object ID.
- **Existence-Leak Prevention**: Returning \`404 Not Found\` instead of \`403 Forbidden\` when an unauthorized user probes a private/draft resource ID, preventing attackers from discovering which private IDs exist.`,
          order: 1,
        },
        {
          heading: 'Two-Stage Authorization Pipeline in LearnSphere',
          body: `Every protected endpoint in LearnSphere passes through a two-stage authorization pipeline after JWT authentication succeeds:

\`\`\`
Incoming Request: PATCH /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId/content
       │
       ├─► Stage 0: authenticate middleware
       │     ├─ Missing/invalid JWT? ──────────────► 401 Unauthorized
       │     └─ Valid JWT -> sets req.user = { id, role }
       │
       ├─► Stage 1: Role-Based Access Control (authorizeRoles('course_creator'))
       │     ├─ req.user.role === 'student'? ──────► 403 Forbidden
       │     └─ req.user.role === 'course_creator' ► Calls next()
       │
       └─► Stage 2: Resource Ownership Verification (Service Layer)
             ├─ Query: Course.findOne({ _id: courseId, createdBy: req.user.id })
             ├─ Course belongs to a DIFFERENT course_creator? ► 404 Not Found (Leak Prevention)
             └─ Course belongs to THIS course_creator? ───────► 200 OK (Update proceeds)
\`\`\`

Notice how Stage 1 and Stage 2 work together:
- **Stage 1 (RBAC)** immediately stops any \`student\` from entering the \`/api/creator/*\` workspace with \`403 Forbidden\`.
- **Stage 2 (Ownership)** ensures that \`course_creator\` Alice cannot read or modify \`course_creator\` Bob's draft course, returning \`404 Not Found\` so Alice cannot even confirm whether Bob's course ID exists.`,
          order: 2,
        },
        {
          heading: 'Draft vs. Published Visibility Boundaries',
          body: `Authorization also governs public catalog and student access boundaries:

1. **Public Catalog (\`GET /api/courses\`)**:
   - Always filters by \`{ status: 'published' }\`.
   - Draft courses (\`status: 'draft'\`) never appear in public listings or search results.

2. **Public / Student Topic Reader (\`GET /api/courses/:courseId/topics/:topicId\`)**:
   - First verifies that the parent course exists **and** has \`status: 'published'\`.
   - If a \`student\` attempts to fetch a topic belonging to a \`draft\` course by guessing its ID, the server responds with \`404 Not Found\`.`,
          order: 3,
        },
        {
          heading: 'Securing Role Promotion via Admin-Only Endpoints',
          body: `How does a user become a \`course_creator\` if public registration always sets \`role: 'student'\`?

Role changes are restricted strictly to an administrative endpoint:
\`PATCH /api/admin/users/:userId/role\`
- Protected by \`authenticate\` and \`authorizeRoles('admin')\`.
- Validates that the target role is one of the canonical system roles (\`['student', 'course_creator', 'admin']\`).
- Prevents privilege escalation by ensuring neither students nor course creators can modify user roles.`,
          order: 4,
        },
        {
          heading: 'Common Beginner Mistakes',
          body: `- **Stopping at RBAC and forgetting ownership**: Checking \`if (req.user.role === 'course_creator')\` and then running \`Course.findByIdAndUpdate(req.params.courseId, ...)\` without checking \`createdBy: req.user.id\`.
- **Reading user ID or role from \`req.body\` or \`req.query\`**: Checking \`req.body.creatorId\` instead of the cryptographically verified \`req.user.id\` attached by \`authenticate\`.
- **Exposing draft resources on public endpoints**: Querying \`Topic.findById(req.params.topicId)\` on a public route without first verifying that the parent \`Course\` has \`status: 'published'\`.
- **Confusing \`401\` and \`403\`**: Returning \`401 Unauthorized\` when a logged-in \`student\` tries to access a \`course_creator\` route (which should be \`403 Forbidden\`).`,
          order: 5,
        },
        {
          heading: 'Suggested Practice Task',
          body: `1. Write an Express middleware factory \`authorizeRoles(...allowedRoles)\`.
2. Write a service helper \`verifyCourseOwnership(courseId, userId)\` that queries \`Course.findOne({ _id: courseId, createdBy: userId }).lean()\`.
3. Trace what status code is returned for \`PATCH /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId/content\` in four cases:
   - Unauthenticated caller (\`401\`)
   - Authenticated \`student\` (\`403\`)
   - Authenticated \`course_creator\` who does **not** own the course (\`404\`)
   - Authenticated \`course_creator\` who **does** own the course (\`200\`).`,
          order: 6,
        },
        {
          heading: 'Topic Summary',
          body: `- Authentication (\`401\`) verifies identity; Authorization (\`403\` / \`404\`) enforces permissions and ownership.
- Use \`authorizeRoles('course_creator')\` at the router layer to enforce Role-Based Access Control (RBAC).
- Always combine RBAC with Resource Ownership checks (\`{ _id: courseId, createdBy: req.user.id }\`) in the service layer to prevent BOLA vulnerabilities.
- Return \`404 Not Found\` when an unrelated \`course_creator\` or \`student\` requests a draft or unowned resource to prevent existence leakage.`,
          order: 7,
        },
      ],
    },
    codeExamples: [
      {
        title: 'RBAC Middleware Factory (server/middleware/authorize.js)',
        language: 'javascript',
        code: `const CANONICAL_ROLES = new Set(['student', 'course_creator', 'admin']);

export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    // Ensure authenticate middleware ran first and attached req.user
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required.',
      });
    }

    const userRole = String(req.user.role).trim().toLowerCase();

    if (!CANONICAL_ROLES.has(userRole) || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        status: 'error',
        message: 'Forbidden: You do not have permission to perform this action.',
      });
    }

    return next();
  };
}`,
        explanation:
          'authorizeRoles is a higher-order middleware factory that checks req.user.role against the route’s allowed roles and returns 403 Forbidden if a student attempts to access a course_creator or admin endpoint.',
      },
      {
        title: 'Ownership Verification & Draft Isolation in the Service Layer',
        language: 'javascript',
        code: `import Course from '../models/Course.js';
import Topic from '../models/Topic.js';

// Used by Course Creator endpoints: enforces strict ownership
export async function verifyOwnedCourse(courseId, creatorUserId) {
  const course = await Course.findOne({
    _id: courseId,
    createdBy: creatorUserId,
  }).lean();

  if (!course) {
    // Return 404 (not 403) so an unrelated creator cannot probe whether courseId exists
    const err = new Error('Course not found.');
    err.statusCode = 404;
    throw err;
  }

  return course;
}

// Used by Public / Student endpoints: enforces published status
export async function getPublishedTopicForStudent(courseId, topicId) {
  const publishedCourse = await Course.findOne({
    _id: courseId,
    status: 'published',
  }).lean();

  if (!publishedCourse) {
    const err = new Error('Course not found.');
    err.statusCode = 404;
    throw err;
  }

  const topic = await Topic.findOne({ _id: topicId, courseId }).lean();
  if (!topic) {
    const err = new Error('Topic not found.');
    err.statusCode = 404;
    throw err;
  }

  return topic;
}`,
        explanation:
          'verifyOwnedCourse scopes the lookup by { _id: courseId, createdBy: creatorUserId } for creators, while getPublishedTopicForStudent requires { _id: courseId, status: "published" } so draft courses remain completely invisible to students.',
      },
    ],
    importantPoints: [
      'Always pair Role-Based Access Control (RBAC) in middleware with Resource Ownership checks in the service layer.',
      'Checking only req.user.role without checking resource ownership (createdBy: req.user.id) leads to Broken Object Level Authorization (BOLA).',
      'Return 403 Forbidden when an authenticated user lacks the required role (e.g., a student calling a /api/creator/* endpoint).',
      'Return 404 Not Found when an unrelated course_creator requests a course they do not own, preventing resource existence leakage.',
      'Ensure public and student endpoints strictly filter courses by status: "published" so draft content is never exposed prematurely.',
      'Derive caller identity and role exclusively from the verified JWT (req.user), never from request body or query parameters.',
    ],
    externalReferences: [
      {
        title: 'OWASP API1:2023 — Broken Object Level Authorization (BOLA)',
        url: 'https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/',
        source: 'OWASP Foundation',
      },
      {
        title: 'OWASP Authorization Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html',
        source: 'OWASP Foundation',
      },
      {
        title: 'HTTP 403 Forbidden vs 401 Unauthorized — MDN Web Docs',
        url: 'https://developer.mozilla.org/en-us/docs/Web/HTTP/Status/403',
        source: 'MDN Web Docs',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 7: Adding Validation and Security
  // =========================================================================
  {
    topicId: '6abe9de1f15c2b4f6008ac6b',
    title: 'Adding Validation and Security',
    content: {
      explanation:
        'A functional API with authentication, CRUD, and authorization is still not ready for production until it is hardened against malicious payloads and automated abuse. Attackers regularly send nested MongoDB query operators ({"$gt": ""}) to bypass checks, inject <script> tags or javascript: URLs into text and reference fields to trigger Cross-Site Scripting (XSS), or flood login endpoints with thousands of password guesses per minute. In this topic, you will integrate multi-layer input validation, NoSQL operator sanitization, HTML/URL sanitization, security headers, CORS restrictions, rate limiting, and safe centralized error handling into the backend project.',
      sections: [
        {
          heading: 'Learning Objectives',
          body: `- Strip MongoDB query operators (keys starting with \`$\` or containing \`.\`) from incoming request bodies, queries, and parameters.
- Validate and sanitize structured content payloads, ensuring external reference URLs strictly use \`https://\` or \`http://\` schemes and never \`javascript:\` or \`data:\`.
- Protect authentication and API routes against brute-force floods using \`express-rate-limit\`.
- Configure \`helmet\` HTTP security headers, explicit CORS origins, and JSON payload size limits (\`express.json({ limit: '100kb' })\`).
- Implement a centralized Express error-handling middleware that hides internal stack traces and database details from clients.`,
          order: 0,
        },
        {
          heading: 'Core Terminology',
          body: `- **Input Validation**: Checking that incoming data conforms to expected types, formats, length bounds, and domain rules before processing it.
- **Input Sanitization**: Cleaning or transforming untrusted input—such as recursively removing \`$ne\`/\`$gt\` keys or stripping dangerous \`<script>\` tags—so it cannot be interpreted as executable code or query logic.
- **NoSQL Injection**: An attack where objects containing MongoDB operators (like \`{ "$ne": null }\`) are injected into JSON request payloads to alter database query logic.
- **Protocol Whitelisting**: Verifying that user-supplied URLs (such as external references) begin strictly with \`https://\` (or \`http://\`), blocking \`javascript:\` and \`vbscript:\` XSS vectors.
- **Operational vs. Programmer Errors**: Operational errors are expected runtime conditions with known 4xx status codes (e.g., \`400\`, \`401\`, \`404\`), whereas unexpected programmer/database exceptions must be logged internally and returned as a generic \`500 Internal Server Error\`.`,
          order: 1,
        },
        {
          heading: 'The Security Hardening Checklist in Express',
          body: `When hardening an Express + MongoDB project, security controls are applied at both the **global middleware layer** and the **domain service layer**:

\`\`\`
GLOBAL EXPRESS MIDDLEWARE (server/server.js)
  ├─► 1. helmet()                       -> Sets X-Content-Type-Options: nosniff, X-Frame-Options, etc.
  ├─► 2. cors({ origin: allowedList })  -> Restricts cross-origin browser access
  ├─► 3. express.json({ limit: '100kb'})-> Prevents oversized JSON memory-exhaustion payloads
  ├─► 4. mongoSanitize middleware       -> Recursively strips '$' and '.' keys from req.body/query/params
  └─► 5. rateLimiter middleware         -> Throttles repeated login/register attempts (429 Too Many Requests)

DOMAIN SERVICE VALIDATION (server/services/courseCreatorTopicService.js)
  ├─► 6. Type & Array Checks            -> Confirms sections, codeExamples, and importantPoints are arrays
  ├─► 7. URL Protocol Validation        -> Rejects any externalReference URL not starting with https:// or http://
  └─► 8. Sequential Section Ordering    -> Normalizes section order indices (0, 1, 2...) before saving
\`\`\``,
          order: 2,
        },
        {
          heading: 'Defending Against NoSQL Injection and Unsafe URLs',
          body: `Consider two realistic attacks against a learning platform backend:

1. **NoSQL Injection on Login**:
   An attacker sends \`POST /api/auth/login\` with:
   \`{ "email": { "$gt": "" }, "password": "any" }\`
   - **Defense Layer 1**: The global \`mongoSanitize\` middleware strips the \`$gt\` key before the controller runs.
   - **Defense Layer 2**: The login validator checks \`typeof req.body.email === 'string'\` and rejects non-strings with \`400 Bad Request\`.

2. **Stored XSS via External Reference Links**:
   A compromised or malicious client sends a topic content update containing:
   \`externalReferences: [{ title: "Click here", url: "javascript:alert(document.cookie)" }]\`
   - **Defense**: The topic content service parses every URL using Node's built-in \`new URL(rawUrl)\` parser and verifies that \`parsed.protocol === 'https:' || parsed.protocol === 'http:'\`, throwing a \`400 Bad Request\` error for any other scheme.`,
          order: 3,
        },
        {
          heading: 'Safe Centralized Error Handling',
          body: `If an unhandled error occurs deep inside a Mongoose query, default Express behavior in development may print stack traces, file paths, or query details.

A production centralized error middleware \`(err, req, res, next)\` enforces strict output safety:
- If \`err.name === 'ValidationError'\` or \`err.name === 'CastError'\`, it returns \`400 Bad Request\` with a clean validation message.
- If \`err.statusCode\` is an expected client error (\`400\`–\`429\`), it returns that status code and \`err.message\`.
- For any unexpected \`500\` error, it logs the full error on the server console for engineers, but sends only \`{ status: 'error', message: 'An unexpected internal server error occurred.' }\` to the client.`,
          order: 4,
        },
        {
          heading: 'Common Beginner Mistakes',
          body: `- **Checking only strings with regex for URLs**: Using a loose regex that can be bypassed instead of parsing with the standard \`new URL(value)\` constructor and checking \`parsedUrl.protocol\`.
- **Sanitizing only \`req.body\` and forgetting \`req.query\` and \`req.params\`**: Attackers frequently inject NoSQL operators via query strings like \`?email[$ne]=null\`.
- **Applying the same rate limit to all routes**: Authentication routes (\`/api/auth/login\`) need stricter limits than general read endpoints (\`/api/courses\`).
- **Leaking raw \`err.message\` or \`err.stack\` on 500 errors**: Exposing internal collection names, index names, or file system paths in error responses.`,
          order: 5,
        },
        {
          heading: 'Suggested Practice Task',
          body: `1. Write a recursive \`sanitizeMongoPayload(obj)\` function that removes any object key starting with \`$\` or containing \`.\`.
2. Write a \`validateSafeHttpsUrl(urlString)\` helper using \`new URL(urlString)\` that returns \`true\` only when \`protocol === 'https:'\`.
3. Test your URL validator against \`"https://developer.mozilla.org"\` (valid), \`"javascript:alert(1)"\` (invalid), and \`"data:text/html,<script>alert(1)</script>"\` (invalid).`,
          order: 6,
        },
        {
          heading: 'Topic Summary',
          body: `- Combine global security middleware (\`helmet\`, \`cors\`, \`express.json({ limit })\`, \`mongoSanitize\`, \`rateLimiter\`) with strict domain validation in services.
- Strip \`$\` and \`.\` keys recursively from \`req.body\`, \`req.query\`, and \`req.params\` to neutralize NoSQL operator injection.
- Validate all external URLs with \`new URL()\` and restrict protocols to \`https:\` (or \`http:\`) to block \`javascript:\` XSS payloads.
- Funnel all exceptions into a centralized 4-argument Express error handler that never leaks stack traces or internal server details.`,
          order: 7,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Recursive NoSQL Operator Sanitizer & Safe URL Validator',
        language: 'javascript',
        code: `/**
 * Recursively strips keys starting with '$' or containing '.' from objects and arrays
 * to prevent MongoDB operator injection.
 */
export function stripMongoOperators(value) {
  if (Array.isArray(value)) {
    return value.map(stripMongoOperators);
  }
  if (value !== null && typeof value === 'object') {
    const cleaned = {};
    for (const [key, val] of Object.entries(value)) {
      if (key.startsWith('$') || key.includes('.')) {
        continue; // Drop dangerous NoSQL operator key
      }
      cleaned[key] = stripMongoOperators(val);
    }
    return cleaned;
  }
  return value;
}

/**
 * Validates that an external reference URL uses a safe HTTPS/HTTP protocol.
 */
export function assertSafeReferenceUrl(rawUrl) {
  if (typeof rawUrl !== 'string' || rawUrl.trim().length === 0) {
    const err = new Error('External reference URL must be a non-empty string.');
    err.statusCode = 400;
    throw err;
  }

  let parsed;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    const err = new Error(\`Invalid URL format: \${rawUrl}\`);
    err.statusCode = 400;
    throw err;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    const err = new Error('External reference URLs must use https:// or http:// protocol.');
    err.statusCode = 400;
    throw err;
  }

  return parsed.toString();
}`,
        explanation:
          'stripMongoOperators neutralizes nested NoSQL injection objects, while assertSafeReferenceUrl parses URLs strictly and blocks javascript: or data: URI schemes.',
      },
      {
        title: 'Centralized Express Error Handler (server/middleware/errorHandler.js)',
        language: 'javascript',
        code: `export function errorHandler(err, req, res, _next) {
  // Handle Mongoose CastError (invalid ObjectId) or ValidationError cleanly as 400
  if (err.name === 'CastError') {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid resource identifier format.',
    });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    return res.status(400).json({
      status: 'error',
      message: messages[0] || 'Validation failed.',
    });
  }

  const statusCode = err.statusCode && err.statusCode >= 400 && err.statusCode < 500
    ? err.statusCode
    : 500;

  if (statusCode === 500) {
    console.error('[Internal Server Error]:', err);
    return res.status(500).json({
      status: 'error',
      message: 'An unexpected internal server error occurred.',
    });
  }

  return res.status(statusCode).json({
    status: 'error',
    message: err.message || 'Request could not be processed.',
  });
}`,
        explanation:
          'This 4-argument Express error middleware translates Mongoose validation/cast errors and operational 4xx errors into clean client messages while hiding internal details on 500 errors.',
      },
    ],
    importantPoints: [
      'Always validate input types (e.g., typeof email === "string") in addition to running global NoSQL operator sanitization.',
      'Recursively strip keys beginning with "$" or containing "." from req.body, req.query, and req.params.',
      'Validate every user-submitted URL with the URL constructor and allow only https: (or http:) protocols to prevent javascript: XSS.',
      'Configure express.json({ limit: "100kb" }) and express-rate-limit to protect server availability against payload and request floods.',
      'Use Helmet middleware to set defensive HTTP response headers automatically.',
      'Never expose raw stack traces, database error objects, or environment details in 500 error responses.',
    ],
    externalReferences: [
      {
        title: 'OWASP Input Validation Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html',
        source: 'OWASP Foundation',
      },
      {
        title: 'Helmet.js — Secure Express HTTP Headers Documentation',
        url: 'https://helmetjs.github.io/',
        source: 'Helmet.js Docs',
      },
      {
        title: 'OWASP REST Security Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html',
        source: 'OWASP Foundation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 8: Testing the API
  // =========================================================================
  {
    topicId: '6abe9de2f15c2b4f6008ac6c',
    title: 'Testing the API',
    content: {
      explanation:
        'How do you know for certain that your API works as intended—and that a future code change will not accidentally allow a student to edit a course or expose a draft topic on a public route? Manual clicking in a browser or running a single curl command only tests the "happy path." Professional backend engineers write automated verification suites that systematically test every endpoint across positive paths, negative validation paths, role boundaries, ownership boundaries, and database state invariants. In this topic, you will learn how to build comprehensive API verification scripts that prove your backend is both functional and secure.',
      sections: [
        {
          heading: 'Learning Objectives',
          body: `- Understand the difference between Unit Tests, Integration Tests, and End-to-End API Verification Suites.
- Design a test matrix covering both positive ("happy path") and negative ("sad/attack path") scenarios.
- Write automated HTTP verification scripts using \`fetch\` and structured assertions to validate status codes and response payloads.
- Test cross-role and cross-owner security boundaries (\`student\` vs. \`course_creator\` vs. unrelated \`course_creator\`).
- Ensure test isolation and database cleanliness by cleaning up temporary test users and refresh sessions in a \`finally\` block.`,
          order: 0,
        },
        {
          heading: 'Core Terminology',
          body: `- **Happy Path Testing**: Verifying that valid requests from authorized users produce the expected \`200 OK\` or \`201 Created\` response and persist accurately in MongoDB.
- **Negative / Boundary Testing**: Deliberately sending invalid inputs, missing tokens, wrong roles, or unowned resource IDs to verify that the API rejects them with the exact expected \`400\`, \`401\`, \`403\`, or \`404\` status code.
- **Database State Assertion**: Querying MongoDB directly during or after an API test to confirm that expected changes persisted and that forbidden side effects (like extra courses or leaked sessions) did not occur.
- **Test Teardown / Cleanup**: Removing any temporary records (such as temporary test accounts or refresh sessions) inside a \`try / finally\` block so the database returns to its exact baseline state after the test suite completes.
- **Regression Testing**: Re-running existing verification suites after adding new features or content to ensure previously working functionality and security rules remain intact.`,
          order: 1,
        },
        {
          heading: 'The Four Pillars of API Verification in LearnSphere',
          body: `Every LearnSphere verification script validates four critical categories of assertions:

\`\`\`
+-------------------------------------------------------------------------+
| 1. FUNCTIONAL & PERSISTENCE ASSERTIONS (200 OK)                         |
|    - Does PATCH update the topic content?                               |
|    - Does a subsequent GET return the exact explanation, ordered        |
|      sections (0..N-1), codeExamples, importantPoints, & HTTPS links?   |
+-------------------------------------------------------------------------+
| 2. ROLE & OWNERSHIP SECURITY BOUNDARIES (401 / 403 / 404)               |
|    - Does an unauthenticated request receive 401 Unauthorized?          |
|    - Does a logged-in 'student' receive 403 Forbidden on creator APIs?  |
|    - Does a second 'course_creator' receive 404 Not Found when trying   |
|      to read or PATCH the first creator's course?                       |
+-------------------------------------------------------------------------+
| 3. DRAFT ISOLATION ASSERTIONS (404 / Empty Public List)                 |
|    - Does the showcase course remain status === 'draft'?                |
|    - Does GET /api/courses return 0 published courses?                  |
|    - Does GET /api/courses/:courseId/topics/:topicId return 404?        |
+-------------------------------------------------------------------------+
| 4. DATABASE INVARIANT & CLEANLINESS AUDIT                               |
|    - Are total counts unchanged (Courses: 1, Modules: 8, Topics: 73)?   |
|    - Are temporary test users & RefreshSessions cleaned up (count: 0)?  |
+-------------------------------------------------------------------------+
\`\`\``,
          order: 2,
        },
        {
          heading: 'Why Negative Security Tests Are Mandatory',
          body: `Suppose a developer accidentally removes \`createdBy: creatorUserId\` from the course lookup in \`courseCreatorTopicService.js\`.
- Every **happy path test** (where the owning Course Creator updates their own course) will still pass with \`200 OK\`!
- Only a **negative ownership test**—where the test script registers a second \`course_creator\`, promotes them via the admin API, and attempts to \`GET\` or \`PATCH\` the first creator's topic—will catch the bug by asserting that the response status **must** be \`404 Not Found\`.`,
          order: 3,
        },
        {
          heading: 'Guaranteeing Clean Teardown with try / finally',
          body: `When an integration test creates temporary users (such as \`temp_other_creator@test.learnsphere.io\` and \`temp_student@test.learnsphere.io\`) or logs in (which creates \`RefreshSession\` documents), what happens if an assertion throws an error halfway through the script?

If cleanup code is only placed at the end of the \`try\` block, a mid-script failure leaves orphaned users and sessions in MongoDB. Wrapping the entire verification suite in \`try { ... } finally { ... }\` guarantees that temporary users and refresh sessions are deleted and \`mongoose.disconnect()\` is called even if an error occurs.`,
          order: 4,
        },
        {
          heading: 'Common Beginner Mistakes',
          body: `- **Testing only the HTTP status code and ignoring the response body**: Asserting \`res.status === 200\` without checking that \`data.content.sections\` actually persisted in the expected order.
- **Testing only valid inputs**: Never testing what happens when an unauthenticated user, a \`student\`, or a non-owning \`course_creator\` calls the endpoint.
- **Leaving test artifacts in the database**: Forgetting to delete temporary test users or \`RefreshSession\` documents created during login tests.
- **Exiting with code \`0\` when assertions fail**: Always call \`process.exit(1)\` if \`failedTests > 0\` so automated CI pipelines detect failures immediately.`,
          order: 5,
        },
        {
          heading: 'Suggested Practice Task',
          body: `1. Write a reusable \`assert(condition, description)\` function that increments \`passedTests\` or \`failedTests\` and logs \`✓ [PASS]\` or \`✗ [FAIL]\`.
2. Write an async test step that logs in as a \`student\`, calls \`PATCH /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId/content\`, and asserts that \`res.status === 403\`.
3. Add a \`finally\` block that cleans up any temporary test users and disconnects Mongoose.`,
          order: 6,
        },
        {
          heading: 'Topic Summary',
          body: `- Automated API verification tests both functional correctness (\`200 OK\` + persisted fields) and security boundaries (\`401\`, \`403\`, \`404\`).
- Always test cross-owner isolation by verifying that an unrelated \`course_creator\` receives \`404 Not Found\` when accessing another creator's draft course.
- Verify database invariants (exact collection counts and preservation of untouched modules) after running updates.
- Use \`try / finally\` to guarantee cleanup of temporary users and \`RefreshSession\` records after every verification run.`,
          order: 7,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Automated API Verification Harness with Security Boundary Assertions',
        language: 'javascript',
        code: `const BASE_URL = 'http://localhost:5000';
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(\`  ✓ [PASS] \${message}\`);
  } else {
    failed++;
    console.error(\`  ✗ [FAIL] \${message}\`);
  }
}

async function apiRequest(path, options = {}, bearerToken = null) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (bearerToken) headers.Authorization = \`Bearer \${bearerToken}\`;

  const res = await fetch(\`\${BASE_URL}\${path}\`, { ...options, headers });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

export async function verifyRoleAndOwnershipBoundaries(courseId, moduleId, topicId, otherCreatorToken, studentToken) {
  // 1. Unauthenticated request must return 401
  const unauthRes = await apiRequest(
    \`/api/creator/courses/\${courseId}/modules/\${moduleId}/topics/\${topicId}/content\`,
    { method: 'GET' }
  );
  assert(unauthRes.status === 401, 'Unauthenticated request blocked with 401 Unauthorized');

  // 2. Student role must return 403 Forbidden on creator routes
  const studentRes = await apiRequest(
    \`/api/creator/courses/\${courseId}/modules/\${moduleId}/topics/\${topicId}/content\`,
    { method: 'GET' },
    studentToken
  );
  assert(studentRes.status === 403, 'Student role blocked from creator route with 403 Forbidden');

  // 3. Unrelated course_creator must return 404 Not Found (BOLA & leak prevention)
  const otherCreatorRes = await apiRequest(
    \`/api/creator/courses/\${courseId}/modules/\${moduleId}/topics/\${topicId}/content\`,
    { method: 'GET' },
    otherCreatorToken
  );
  assert(otherCreatorRes.status === 404, 'Unrelated course_creator blocked with 404 Not Found');
}`,
        explanation:
          'This verification helper tests all three access control boundaries—unauthenticated (401), wrong role (403), and wrong resource owner (404)—against the real running Express API.',
      },
      {
        title: 'Guaranteed Database Cleanup in a try / finally Verification Block',
        language: 'javascript',
        code: `import mongoose from 'mongoose';
import User from '../models/User.js';
import RefreshSession from '../models/RefreshSession.js';

export async function runWithCleanTeardown(testFn) {
  const createdTempUserIds = [];

  try {
    await testFn(createdTempUserIds);
  } finally {
    // Always clean up temporary users and refresh sessions even if an assertion throws
    if (createdTempUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: createdTempUserIds } });
    }
    await RefreshSession.deleteMany({});
    await mongoose.disconnect();
  }
}`,
        explanation:
          'Using a try/finally wrapper guarantees that temporary verification users and login RefreshSession records are purged before the process exits.',
      },
    ],
    importantPoints: [
      'Never rely solely on manual testing or happy-path checks; automate both positive and negative boundary assertions.',
      'Verify that persisted data matches expectations by reading the resource back via GET and inspecting every field.',
      'Explicitly test that a student receives 403 Forbidden on creator routes and 404 Not Found on draft public routes.',
      'Explicitly test that an unrelated course_creator receives 404 Not Found when reading or updating another creator’s course.',
      'Assert database invariants (such as exact Course, Module, Topic, and User counts) at the end of the verification run.',
      'Always clean up temporary test users and RefreshSession documents inside a finally block.',
    ],
    externalReferences: [
      {
        title: 'OWASP Web Security Testing Guide (WSTG) — Authorization Testing',
        url: 'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/05-Authorization_Testing/README',
        source: 'OWASP Foundation',
      },
      {
        title: 'Node.js Built-in Fetch & Test Runner Documentation',
        url: 'https://nodejs.org/api/test.html',
        source: 'Node.js Official Docs',
      },
      {
        title: 'Testing Best Practices — Node.js Best Practices Guide',
        url: 'https://github.com/goldbergyoni/nodebestpractices#4-testing-and-overall-quality-practices',
        source: 'Node.js Best Practices',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 9: Understanding the Complete Backend Flow
  // =========================================================================
  {
    topicId: '6abe9de2f15c2b4f6008ac6d',
    title: 'Understanding the Complete Backend Flow',
    content: {
      explanation:
        'You have now explored every core discipline of backend engineering—from Node.js runtime fundamentals, Express routing, and MongoDB/Mongoose schema design to REST architecture, JWT authentication, RBAC and ownership authorization, defense-in-depth security, and automated API verification. In this final topic of the course, we bring the entire architecture together into one cohesive mental model. You will trace the complete end-to-end lifecycle of an HTTP request from the moment it leaves a client to the moment MongoDB persists the change and Express returns a sanitized JSON response.',
      sections: [
        {
          heading: 'Learning Objectives',
          body: `- Trace the complete 10-step lifecycle of an authenticated HTTP request through Node.js, Express, Mongoose, and MongoDB.
- Explain how every module in this course (Node.js, Express, MongoDB/Mongoose, REST APIs, AuthN/AuthZ, and Backend Security) connects into a single unified pipeline.
- Diagnose where in the backend stack a specific HTTP status code (\`200\`, \`201\`, \`400\`, \`401\`, \`403\`, \`404\`, \`409\`, \`429\`, \`500\`) originates.
- Understand how the Node.js event loop handles concurrent I/O operations across middleware, controllers, and database queries without blocking.
- Review a complete production readiness checklist for building and maintaining real-world backend applications.`,
          order: 0,
        },
        {
          heading: 'Core Terminology',
          body: `- **Request-Response Lifecycle**: The complete sequence of steps an HTTP request undergoes from socket arrival to response serialization.
- **Middleware Pipeline**: The ordered chain of Express functions \`(req, res, next)\` that inspect, secure, rate-limit, parse, and authenticate a request before the controller executes.
- **Non-Blocking I/O**: Node.js's asynchronous execution model where network and database operations (such as \`bcrypt.compare\` or \`Topic.findOneAndUpdate\`) run without freezing the main JavaScript thread.
- **Single Source of Truth**: The principle that MongoDB (enforced by Mongoose schemas and service-layer business rules) is the authoritative record of application state and permissions.
- **Defense-in-Depth Architecture**: Combining network/header protections, input sanitization, cryptographic authentication, role/ownership authorization, and database schema validation into a unified system.`,
          order: 1,
        },
        {
          heading: 'The Complete 10-Step Request Lifecycle Diagram',
          body: `Let's trace exactly what happens inside LearnSphere when an owning \`course_creator\` sends:
\`PATCH /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId/content\`

\`\`\`
[Client (Browser / Script)]
   │  HTTP PATCH + Headers (Authorization: Bearer <JWT>) + JSON Body
   ▼
[Step 1: Node.js HTTP Server & Event Loop]
   │  Accepts TCP connection non-blockingly and hands req/res to Express app
   ▼
[Step 2: Global Security & Parsing Middleware (server.js)]
   │  helmet() -> cors() -> express.json({ limit }) -> mongoSanitize (strips '$' & '.')
   ▼
[Step 3: Route Matching & Rate Limiting (courseCreatorRoutes.js)]
   │  Matches /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId/content
   ▼
[Step 4: JWT Authentication Middleware (authenticate.js)]
   │  Verifies Bearer token signature & expiry -> Sets req.user = { id, role } (or 401)
   ▼
[Step 5: Role Authorization Middleware (authorize.js)]
   │  Checks authorizeRoles('course_creator') -> Blocks 'student' with 403 Forbidden
   ▼
[Step 6: HTTP Controller Layer (courseCreatorTopicController.js)]
   │  Extracts courseId, moduleId, topicId, req.user.id, and req.body -> Calls Service
   ▼
[Step 7: Service Layer — Ownership & Hierarchy Verification]
   │  Validates ObjectIds -> Verifies Course({ _id: courseId, createdBy: req.user.id })
   │  -> Verifies Module({ _id: moduleId, courseId }) (or throws 404 Not Found)
   ▼
[Step 8: Service Layer — Payload Validation & Sanitization]
   │  Validates sections order, codeExamples, importantPoints, and HTTPS externalReferences
   ▼
[Step 9: Mongoose Model & MongoDB Persistence (Topic.js)]
   │  Topic.findOneAndUpdate({ _id: topicId, moduleId, courseId }, { $set }, { runValidators: true })
   ▼
[Step 10: JSON Response Serialization (or Centralized errorHandler)]
   │  Controller sends 200 OK { status: 'success', data: { content } } back to Client
\`\`\``,
          order: 2,
        },
        {
          heading: 'How Every Course Module Connects Together',
          body: `Look back at how each module of **Backend Development with Node.js, Express & MongoDB** forms an indispensable layer of this pipeline:

- **Modules 1 & 2 (Backend Fundamentals & Node.js)**: Provide the HTTP protocol rules, status codes, environment variable isolation (\`process.env\`), ES module imports, and asynchronous \`async/await\` event loop execution (Step 1).
- **Module 3 (Express.js)**: Provides the application router, middleware pipeline (\`req, res, next\`), JSON body parsing, and centralized error handling (Steps 2, 3, and 10).
- **Module 4 (MongoDB & Mongoose)**: Provides the document data model, embedded sub-schemas, compound indexes (\`{ moduleId: 1, order: 1 }\`), and schema validators (Step 9).
- **Module 5 (Building REST APIs)**: Provides the clean controller/service separation, resource-oriented URL hierarchy, and consistent JSON response envelopes (Steps 6 and 10).
- **Module 6 (Authentication & Authorization)**: Provides \`bcrypt\` password hashing, JWT Bearer authentication, RBAC (\`student\`, \`course_creator\`, \`admin\`), and resource ownership verification (Steps 4, 5, and 7).
- **Module 7 (Backend Security)**: Provides Helmet headers, CORS policies, rate limiting, NoSQL injection stripping, HTTPS URL validation, and safe error masking (Steps 2, 8, and 10).
- **Module 8 (Practical Backend Project)**: Connects all seven layers into a planned, structured, tested, and verified end-to-end backend system.`,
          order: 3,
        },
        {
          heading: 'Diagnosing Issues Across the Stack by Status Code',
          body: `When debugging any backend request, the HTTP status code immediately tells you which step of the 10-step flow stopped the request:

- **\`429 Too Many Requests\`** -> Stopped at **Step 2/3** (Rate Limiter middleware).
- **\`401 Unauthorized\`** -> Stopped at **Step 4** (\`authenticate\` middleware: missing, expired, or invalid JWT, or bad login credentials).
- **\`403 Forbidden\`** -> Stopped at **Step 5** (\`authorizeRoles\` middleware: valid JWT, but user role is \`student\` instead of \`course_creator\` or \`admin\`).
- **\`404 Not Found\`** -> Stopped at **Step 7** (Resource does not exist, course belongs to a different \`course_creator\`, or a \`student\` requested a \`draft\` course).
- **\`400 Bad Request\`** -> Stopped at **Step 7/8/9** (Invalid ObjectId format, invalid payload structure, unsafe URL protocol, or Mongoose \`ValidationError\`).
- **\`500 Internal Server Error\`** -> Caught at **Step 10** (Unexpected runtime or database connectivity failure masked safely by \`errorHandler\`).`,
          order: 4,
        },
        {
          heading: 'Common Beginner Mistakes',
          body: `- **Bypassing a layer for "quick fixes"**: Putting database queries directly in route files or skipping the service ownership check on "just one endpoint," which creates architectural drift and security holes.
- **Debugging blindly without tracing the pipeline**: Guessing why a request failed instead of checking which middleware or service step returned the HTTP status code.
- **Forgetting that async errors must reach \`errorHandler\`**: Omitting \`try / catch\` + \`next(err)\` in controllers, causing rejected promises to bypass the centralized error middleware.
- **Treating backend development as isolated snippets**: Writing routes, schemas, and auth checks in isolation without verifying how they interact end to end.`,
          order: 5,
        },
        {
          heading: 'Suggested Practice Task',
          body: `1. Pick any feature you want to build next (for example, a **Bookmark Topic** endpoint \`POST /api/courses/:courseId/topics/:topicId/bookmark\` for enrolled \`student\` users).
2. Write out its complete 10-step journey from client request to MongoDB persistence and JSON response.
3. For each step, list the exact file in \`server/\` (\`routes/\`, \`middleware/\`, \`controllers/\`, \`services/\`, \`models/\`) that executes and what error status code it returns if that step fails.`,
          order: 6,
        },
        {
          heading: 'Topic Summary',
          body: `- Every HTTP request in a well-architected Node.js + Express + MongoDB backend flows deterministically through global security middleware, routing, JWT authentication, role authorization, controllers, services, and Mongoose models.
- Each layer has one clear responsibility and fails safely with an appropriate HTTP status code (\`400\`, \`401\`, \`403\`, \`404\`, \`429\`, or \`500\`).
- Combining modular architecture, strict schema design, authentication, RBAC + ownership checks, input sanitization, and automated verification produces a secure, maintainable backend ready for real-world engineering.`,
          order: 7,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Complete End-to-End Request Flow Across Route, Middleware, Controller, Service, and Model',
        language: 'javascript',
        code: `// 1. ROUTE + MIDDLEWARE PIPELINE (server/routes/courseCreatorRoutes.js)
router.patch(
  '/courses/:courseId/modules/:moduleId/topics/:topicId/content',
  authenticate,                      // Step 4: Verify JWT -> req.user = { id, role }
  authorizeRoles('course_creator'),  // Step 5: Verify role === 'course_creator'
  updateTopicContentController       // Step 6: Invoke Controller
);

// 2. CONTROLLER LAYER (server/controllers/courseCreatorTopicController.js)
export async function updateTopicContentController(req, res, next) {
  try {
    const { courseId, moduleId, topicId } = req.params;
    const updated = await updateTopicContentService(
      courseId,
      moduleId,
      topicId,
      req.user.id,
      req.body
    );

    // Step 10: Return standardized 200 OK JSON envelope
    return res.status(200).json({
      status: 'success',
      message: 'Topic content updated successfully.',
      data: { content: updated },
    });
  } catch (err) {
    return next(err); // Step 10 (Error Path): Forward to centralized errorHandler
  }
}

// 3. SERVICE + MODEL LAYER (server/services/courseCreatorTopicService.js)
export async function updateTopicContentService(courseId, moduleId, topicId, creatorId, body) {
  // Step 7: Verify ownership & hierarchy
  const course = await Course.findOne({ _id: courseId, createdBy: creatorId }).lean();
  if (!course) {
    const err = new Error('Course not found.');
    err.statusCode = 404;
    throw err;
  }

  // Step 8 & 9: Sanitize payload and execute atomic Mongoose update with validators
  const sanitized = sanitizeTopicPayload(body);
  const topic = await Topic.findOneAndUpdate(
    { _id: topicId, moduleId, courseId },
    { $set: sanitized },
    { returnDocument: 'after', runValidators: true }
  ).lean();

  if (!topic) {
    const err = new Error('Topic not found.');
    err.statusCode = 404;
    throw err;
  }

  return topic;
}`,
        explanation:
          'Seeing the route, middleware, controller, service, and Mongoose model side by side illustrates how steps 4 through 10 of the backend request lifecycle fit together seamlessly.',
      },
      {
        title: 'Production Backend Readiness Diagnostic Check',
        language: 'javascript',
        code: `/**
 * Startup & Architectural Self-Check Helper
 * Verifies required environment configuration and database connectivity before serving traffic.
 */
export function verifyBackendReadiness(env, dbReadyState) {
  const requiredEnvKeys = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
  const missingKeys = requiredEnvKeys.filter((key) => !env[key] || String(env[key]).trim() === '');

  if (missingKeys.length > 0) {
    throw new Error(\`Missing required environment variables: \${missingKeys.join(', ')}\`);
  }

  if (dbReadyState !== 1) {
    throw new Error('Database connection is not in ready state (expected state 1).');
  }

  return {
    ready: true,
    rolesSupported: ['student', 'course_creator', 'admin'],
    securityLayers: ['helmet', 'cors', 'rateLimiter', 'mongoSanitize', 'jwtAuth', 'rbac', 'ownership'],
  };
}`,
        explanation:
          'Validating environment variables and database readiness at startup ensures the server fails fast if misconfigured rather than failing unpredictably during live user requests.',
      },
    ],
    importantPoints: [
      'Every incoming request passes through a deterministic pipeline: Server -> Security Middleware -> Router -> authenticate -> authorizeRoles -> Controller -> Service -> Mongoose Model -> MongoDB.',
      'Each layer enforces a specific contract and halts invalid requests early with an accurate HTTP status code (400, 401, 403, 404, 429, or 500).',
      'Controllers handle HTTP concerns (req/res), services enforce business rules and ownership, and models enforce data schema integrity.',
      'LearnSphere enforces three canonical roles (student, course_creator, admin) and strict draft vs. published visibility across the entire stack.',
      'Defense in Depth ensures that even if one layer is bypassed or misconfigured, downstream validation and ownership checks protect the database.',
      'Automated end-to-end verification suites confirm that all layers work together and prevent regressions as the application evolves.',
    ],
    externalReferences: [
      {
        title: 'Express.js Guide — Writing & Using Middleware',
        url: 'https://expressjs.com/en/guide/using-middleware.html',
        source: 'Express.js Official Documentation',
      },
      {
        title: 'Node.js Event Loop, Timers, and process.nextTick()',
        url: 'https://nodejs.org/en/learn/asynchronous-work/event-loop-timers-and-nexttick',
        source: 'Node.js Official Docs',
      },
      {
        title: 'OWASP API Security Top 10 (2023 Edition)',
        url: 'https://owasp.org/API-Security/editions/2023/en/0x11-t10/',
        source: 'OWASP Foundation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },
];
