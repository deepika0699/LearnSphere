/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LearnSphere Module 3 — Express.js Content (Part 2: Topics 6–9)
 */

export const module3TopicsPart2 = [
  // =========================================================================
  // TOPIC 6: Middleware
  // ID: 6abe9dccf15c2b4f6008ac36
  // =========================================================================
  {
    topicId: '6abe9dccf15c2b4f6008ac36',
    title: 'Middleware',
    content: {
      explanation: `Middleware is the architectural backbone of every Express.js application. In fact, an Express application is essentially a sequential pipeline of middleware function calls.

What is a Middleware function?
A middleware function is a function that sits in the middle of the request-response cycle—between the moment the server receives a raw incoming HTTP request and the moment the final route controller sends a response.

Every standard Express middleware function receives three arguments:
` + '`(req, res, next) => { ... }`' + `
1. ` + '`req`' + ` — The incoming Request object (which middleware can inspect or enrich with properties like ` + '`req.user`' + `).
2. ` + '`res`' + ` — The outgoing Response object (which middleware can use to stop and reject an invalid request early).
3. ` + '`next`' + ` — A callback function that passes control to the next middleware or route handler in the pipeline.

Without middleware, you would have to copy and paste security headers, JSON body parsing, request logging, rate limiting, authentication, and validation checks into every single route handler in your project.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Define Express middleware and explain the three parameters (` + '`req`' + `, ` + '`res`' + `, ` + '`next`' + `) and the four-parameter error middleware (` + '`err, req, res, next`' + `).
2. Trace the complete request pipeline from incoming request through multiple middleware layers to the route, controller, and response.
3. Distinguish between application-level, route-level, built-in, third-party, custom, and error-handling middleware.
4. Explain why forgetting to call ` + '`next()`' + ` (or send a response) causes requests to hang, and why middleware registration order is critical.
5. Describe how the actual LearnSphere backend (` + '`server/server.js`' + `) uses middleware for security headers, CORS, JSON parsing, rate limiting, authentication, authorization, and validation.`,
        },
        {
          order: 1,
          heading: 'The Express Request Pipeline & Airport Checkpoint Analogy',
          body: `When an HTTP request enters an Express server, it flows through a sequential pipeline:

Request
   ↓
Middleware 1 (e.g., Security Headers & Request Logger)
   ↓  calls next()
Middleware 2 (e.g., JSON Body Parser & Rate Limiter)
   ↓  calls next()
Route (Matches Method + Path, runs Route-Level Auth / Validation Middleware)
   ↓  calls next()
Controller (Executes handler & calls Service / Model)
   ↓
Response (Sent back to Client)

Real-World Analogy — Airport Security Checkpoints:
Think of an incoming HTTP request as a traveler entering an airport to board a flight (the Controller):
• Checkpoint 1 (Baggage Scanner / Body Parser): Inspects and unpacks what the traveler brought. Calls 'next()' to let them proceed.
• Checkpoint 2 (Boarding Pass & ID Check / Authentication Middleware): Verifies the traveler's identity. If valid, stamps their pass ('req.user = ...') and calls 'next()'. If invalid, stops them immediately at the checkpoint ('return res.status(401).json(...)')—they never reach the boarding gate!
• Boarding Gate (Controller): Because the previous checkpoints already verified everything, the gate agent can focus purely on boarding the flight.`,
        },
        {
          order: 2,
          heading: 'Categories of Middleware in Express',
          body: `Express supports five main categories of middleware:

1. Application-Level Middleware (app.use):
Registered globally on 'app' via 'app.use(middlewareFn)'. It runs on EVERY incoming request (or every request matching a path prefix like 'app.use("/api", apiLimiter)').

2. Route-Level Middleware:
Passed directly as arguments to a specific route or 'express.Router()' before the final controller handler:
  router.get('/dashboard', authenticate, requireAdmin, getDashboard);
Here, 'authenticate' and 'requireAdmin' run only when a client requests 'GET /dashboard'.

3. Built-In Express Middleware:
Bundled directly with Express:
• 'express.json()' — Parses incoming requests with JSON payloads and populates 'req.body'.
• 'express.urlencoded({ extended: true })' — Parses URL-encoded form payloads.

4. Custom Middleware:
Functions you write yourself for your application's needs—such as a custom request logger, role check, or course ownership check.

5. Error-Handling Middleware:
A special middleware function that takes FOUR arguments instead of three:
  (err, req, res, next) => { ... }
Registered at the very bottom of the middleware stack. Whenever any upstream middleware or route calls 'next(error)', Express skips all remaining normal middleware and jumps straight to this four-argument error handler.`,
        },
        {
          order: 3,
          heading: 'Why Order Matters & What Happens If You Forget next()',
          body: `Two rules govern every middleware function you write:

Rule 1: Every Middleware Code Path Must Either Call next() OR Send a Response:
Inside a middleware function, you have exactly two valid choices:
• Choice A: Call 'next()' to pass control to the next middleware/route in line (or 'next(err)' to jump to the error handler).
• Choice B: End the request-response cycle immediately by sending a response (e.g., 'return res.status(401).json({ error: "Unauthorized" })').
If a code path neither calls 'next()' nor sends a response, the client's request will hang forever until the browser or network connection times out!

Rule 2: Middleware Executes in Exact Registration Order:
Express runs middleware in the exact top-to-bottom order you register it with 'app.use()' or route definitions.
• For example, 'app.use(express.json())' MUST be registered BEFORE your routes; if you register 'express.json()' after your routes, 'req.body' will be 'undefined' inside your route handlers!
• Similarly, 'notFoundHandler' and 'errorHandler' MUST be registered LAST, after all routes.`,
        },
        {
          order: 4,
          heading: 'How LearnSphere Uses Middleware in Production',
          body: `Inspecting LearnSphere's actual backend ('server/server.js' and 'server/routes/'), we can see a real-world production middleware pipeline in action:

1. Global Security & Operational Middleware ('server/server.js'):
• 'app.use(helmet())' — Sets standard HTTP security headers to protect against common web vulnerabilities.
• 'app.use(requestLogger)' — Safely logs request method, path, status code, and response time.
• 'app.use(cors(...))' — Enforces Cross-Origin Resource Sharing policy so only allowed frontend origins can call the API.
• 'app.use(express.json())' & 'app.use(express.urlencoded({ extended: true }))' — Parses incoming JSON and form bodies into 'req.body'.
• 'app.use("/api", apiLimiter)' — Applies rate limiting across '/api' endpoints to defend against brute-force and denial-of-service abuse.

2. Route-Level Security & Validation Middleware ('server/routes/'):
• Authentication ('authenticate' in 'server/middleware/authenticate.js'): Verifies the Bearer JWT access token and attaches 'req.user'.
• Role Authorization ('requireAdmin', 'requireCourseCreator', 'requireStudent' in 'server/middleware/authorize.js'): Enforces server-authoritative role boundaries.
• Resource Ownership ('requireCourseOwnership' in 'server/middleware/courseCreatorAuthorization.js'): Verifies in MongoDB that the authenticated Course Creator owns the target course.
• Input Validation ('validateRequest' in 'server/middleware/validateRequest.js'): Evaluates 'express-validator' rules and returns a sanitized 400 Bad Request if validation fails.

3. Terminal Fallback & Error Middleware ('server/middleware/errorHandler.js'):
• 'app.use(notFoundHandler)' — Returns a clean 404 JSON response for unmatched routes.
• 'app.use(errorHandler)' — Centralized 4-argument '(err, req, res, next)' middleware that catches operational and unexpected errors, sanitizes messages, and ensures stack traces or secrets are never leaked.`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Forgetting to Call next() When Proceeding:
Mistake: Writing a logger middleware 'app.use((req, res, next) => { console.log(req.path); });' without calling 'next()'.
Reality: Every request freezes at the logger and never reaches any route!

2. Calling next() After Already Sending a Response:
Mistake: Calling 'res.status(403).json({ error: "Forbidden" });' and then letting the function continue to 'next();' on the next line because 'return' was omitted.
Reality: The downstream route handler will also run and try to send a second response, crashing with 'ERR_HTTP_HEADERS_SENT'. Always write 'return res.status(...).json(...)'.

3. Omitting the 4th Parameter 'next' in Error-Handling Middleware:
Mistake: Writing an error handler with only 3 parameters: '(err, req, res) => { ... }'.
Reality: Express checks 'fn.length === 4' to recognize error-handling middleware! If you omit 'next' from the parameter list, Express treats it as normal 3-argument middleware and will NOT route errors to it.`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `Middleware Pipeline Trace Exercise:
1. Write a custom application-level middleware function 'attachRequestTime(req, res, next)' that attaches 'req.requestTimestamp = new Date().toISOString()' and calls 'next()'.
2. Write a route-level middleware function 'requireCustomHeader(req, res, next)' that checks if 'req.headers["x-client-app"]' is present:
   • If missing, return HTTP 400 with '{ error: "Bad Request", message: "Missing X-Client-App header" }'.
   • If present, call 'next()'.
3. Explain what would happen if 'attachRequestTime' were registered with 'app.use()' AFTER the route that tries to read 'req.requestTimestamp'.`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `• Middleware functions have access to 'req', 'res', and 'next' in the Express request-response pipeline.
• Middleware can inspect/modify 'req', terminate the cycle early with a response, or call 'next()' to pass control forward.
• Express supports application-level ('app.use'), route-level, built-in ('express.json'), custom, and 4-argument error-handling ('err, req, res, next') middleware.
• Registration order determines execution order: body parsers and security middleware go before routes; 404 and error handlers go last.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Custom Logger Middleware & Conceptual Route-Level Auth Guard',
        language: 'javascript',
        code: `// middleware_demo.js - Demonstrating application-level and route-level middleware
import express from 'express';

const app = express();

// 1. Built-in middleware: Parse JSON bodies (runs before routes)
app.use(express.json());

// 2. Custom Application-Level Logger Middleware (runs on every request)
function loggerMiddleware(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    console.log(\`[Logger] \${req.method} \${req.path} -> \${res.statusCode} (\${durationMs}ms)\`);
  });
  next(); // Crucial: pass control to the next middleware/route!
}

app.use(loggerMiddleware);

// 3. Conceptual Route-Level Guard Middleware (checks for an Authorization header)
function conceptualAuthGuard(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Stop pipeline early and return 401 (do NOT call next)
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication required.'
    });
  }
  // Attach mock context and pass control to the route handler
  req.clientContext = { authenticated: true };
  return next();
}

// Public route (only global middleware runs)
app.get('/api/public', (req, res) => {
  return res.status(200).json({ message: 'Public endpoint accessible to everyone.' });
});

// Protected route (conceptualAuthGuard runs before the route handler)
app.get('/api/protected', conceptualAuthGuard, (req, res) => {
  return res.status(200).json({
    message: 'Protected endpoint reached!',
    context: req.clientContext
  });
});`,
        explanation: `This example shows how middleware functions chain together:
1. 'express.json()' and 'loggerMiddleware' are registered globally with 'app.use()', so they run on every request.
2. 'loggerMiddleware' calls 'next()' so the request continues through the pipeline.
3. 'conceptualAuthGuard' is attached only to 'GET /api/protected'. If the 'Authorization: Bearer ...' header is missing, it stops the pipeline with 'return res.status(401).json(...)'. If present, it attaches 'req.clientContext' and calls 'next()' so the final handler runs.

Expected Outputs:
• GET /api/public (no headers)               -> Status 200: {"message":"Public endpoint accessible to everyone."}
• GET /api/protected (no headers)            -> Status 401: {"error":"Unauthorized","message":"Authentication required."}
• GET /api/protected (Header: Bearer demo)   -> Status 200: {"message":"Protected endpoint reached!","context":{"authenticated":true}}`,
      },
    ],
    importantPoints: [
      'A standard Express middleware function has the signature (req, res, next) => { ... }.',
      'Every middleware execution path must either call next() to continue the pipeline or send an HTTP response to end it; doing neither hangs the request.',
      'Middleware executes strictly in the order it is registered—body parsers and security middleware must be registered before routes.',
      'Application-level middleware is mounted with app.use(), whereas route-level middleware is passed directly to specific routes.',
      'Error-handling middleware requires all four parameters (err, req, res, next) and is mounted at the bottom of the pipeline.',
    ],
    externalReferences: [
      {
        title: 'Express.js Official Guide: Using Middleware',
        url: 'https://expressjs.com/en/guide/using-middleware.html',
        source: 'Express.js Official Docs',
      },
      {
        title: 'Express.js Official Guide: Writing Middleware for Use in Express Apps',
        url: 'https://expressjs.com/en/guide/writing-middleware.html',
        source: 'Express.js Official Docs',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 7: Request and Response Objects
  // ID: 6abe9dccf15c2b4f6008ac37
  // =========================================================================
  {
    topicId: '6abe9dccf15c2b4f6008ac37',
    title: 'Request and Response Objects',
    content: {
      explanation: `Every route handler and middleware function in Express revolves around two fundamental objects passed by the framework:
1. The Request object (` + '`req`' + `): Represents the incoming HTTP request sent by the client—containing URL route parameters, query strings, parsed JSON body data, HTTP headers, the HTTP method, and the request path.
2. The Response object (` + '`res`' + `): Represents the outgoing HTTP response that your server constructs and sends back to the client—providing clean methods to set status codes, configure headers, and transmit JSON or text payloads.

Mastering the key properties of ` + '`req`' + ` and the methods of ` + '`res`' + `—along with understanding why ` + '`express.json()`' + ` is required to populate ` + '`req.body`' + ` and why client data must never be trusted blindly—is essential for writing reliable Express endpoints.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Inspect and use the core properties of the Express Request object: ` + '`req.params`' + `, ` + '`req.query`' + `, ` + '`req.body`' + `, ` + '`req.headers`' + `, ` + '`req.method`' + `, and ` + '`req.path`' + `.
2. Use the core methods of the Express Response object: ` + '`res.status()`' + `, ` + '`res.json()`' + `, ` + '`res.send()`' + `, ` + '`res.set()`' + `, and ` + '`res.end()`' + `.
3. Explain the difference between ` + '`res.status(200).json(...)`' + ` and ` + '`res.json(...)`' + ` and why explicit status codes matter.
4. Explain how ` + '`app.use(express.json())`' + ` parses incoming JSON bodies (as configured in LearnSphere's ` + '`server/server.js`' + `) and validate untrusted ` + '`req.body`' + ` fields safely.`,
        },
        {
          order: 1,
          heading: 'Essential Properties of the Request Object (req)',
          body: `When a client sends an HTTP request, Express populates 'req' with structured properties so you know everything about the incoming call:

• req.params:
  An object containing named route parameters captured from dynamic URL segments (e.g., for '/api/courses/:id', requesting '/api/courses/101' gives 'req.params = { id: "101" }').

• req.query:
  An object containing parsed URL query string parameters after '?' (e.g., for '/api/courses?page=2', 'req.query = { page: "2" }').

• req.body:
  Contains the parsed data payload sent in the body of a POST, PUT, or PATCH request.
  Important: By default, 'req.body' is 'undefined' unless body-parsing middleware is registered! In LearnSphere's 'server/server.js' (lines 76–77), 'app.use(express.json())' and 'app.use(express.urlencoded({ extended: true }))' are mounted before all routes so JSON payloads are automatically parsed into 'req.body'.

• req.headers:
  An object containing the incoming HTTP headers with lowercase keys (e.g., 'req.headers["content-type"]', 'req.headers["authorization"]', 'req.headers["user-agent"]').

• req.method:
  A string indicating the HTTP verb of the request ('"GET"', '"POST"', '"PATCH"', '"DELETE"', etc.).

• req.path:
  The pathname portion of the request URL without the query string (e.g., for '/api/courses?page=2', 'req.path' is '"/api/courses"').`,
        },
        {
          order: 2,
          heading: 'Essential Methods of the Response Object (res)',
          body: `Express provides chainable methods on 'res' to build and send the HTTP response:

• res.status(code):
  Sets the numeric HTTP status code for the response (e.g., 200, 201, 400, 404, 500) and returns 'res' so you can chain '.json()' or '.end()' right after it.

• res.json(body):
  Converts a JavaScript object or array into a JSON string using 'JSON.stringify()', automatically sets the response header 'Content-Type: application/json; charset=utf-8', and sends the response to the client.

• res.send(body):
  Sends an HTTP response of various types (String, Buffer, Object, or Array). While 'res.send({ a: 1 })' also sends JSON, backend APIs prefer 'res.json()' for clarity and explicit intent.

• res.set(field, value):
  Sets an HTTP response header before sending the body (e.g., 'res.set("Cache-Control", "no-store")').

• res.end():
  Ends the response process without sending any body payload—commonly used with 'res.status(204).end()' for 204 No Content responses.`,
        },
        {
          order: 3,
          heading: 'res.status(200).json(...) vs. res.json(...) & Why Status Codes Matter',
          body: `What is the difference between writing:
  res.status(200).json({ status: 'success', data })
and writing:
  res.json({ status: 'success', data })
?

1. Default Behavior:
If you call 'res.json(data)' without calling 'res.status()' first, Express automatically defaults the HTTP status code to '200 OK'.

2. Why Explicit res.status(code).json(...) Is Best Practice:
• Clarity & Readability: Writing 'res.status(200).json(...)' makes the intended HTTP status code immediately obvious to any developer reading the controller.
• Avoiding Accidental 200s on Creation or Errors:
  - When a POST route creates a new resource, returning 'res.json(...)' would send '200 OK' instead of the semantically accurate 'res.status(201).json(...)' (201 Created).
  - When an error or validation failure occurs, forgetting 'res.status(400)' and calling 'res.json({ error: "Invalid input" })' sends an HTTP 200 OK status with an error message—causing frontend 'fetch' or API clients to think the request succeeded!`,
        },
        {
          order: 4,
          heading: 'Safe Handling of req.body (Never Blindly Trust Client Data)',
          body: `When receiving JSON in 'req.body' on a POST or PATCH request, remember this core security rule:
Client input is untrusted.

1. Destructure Only Expected Fields (Prevent Mass Assignment):
Never pass 'req.body' directly into 'Model.create(req.body)'! A malicious user could send extra fields in the JSON body like '{ "title": "My Course", "status": "published", "role": "admin" }'. Always extract only the exact allowed fields:
  const { title, category } = req.body;

2. Validate Types and Lengths:
Even in a JSON request, a client can send a number, null, array, or nested object where you expected a string (e.g., '{ "title": { "$gt": "" } }'). Always verify 'typeof title === "string"' and check trimmed length before using the value.`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Forgetting app.use(express.json()) Before POST/PATCH Routes:
Mistake: Sending a JSON POST request and getting "TypeError: Cannot destructure property 'title' of 'req.body' as it is undefined".
Reality: Express does not parse JSON request bodies unless 'app.use(express.json())' is mounted before your routes.

2. Reading Request Headers with Capital Letters:
Mistake: Checking 'req.headers["Authorization"]' or 'req.headers["Content-Type"]' and getting 'undefined'.
Reality: Node.js and Express automatically normalize all keys in 'req.headers' to lowercase ('req.headers["authorization"]'). (Alternatively, you can call 'req.get("Authorization")', which is case-insensitive).

3. Calling res.json() Without Setting an Error Status Code:
Mistake: Writing 'if (!title) return res.json({ error: "Title required" });'.
Reality: That sends HTTP 200 OK! Always chain the status code explicitly: 'return res.status(400).json({ error: "Title required" });'.`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `Request & Response Inspection Exercise:
Suppose a client sends the following HTTP request to an Express server that has 'app.use(express.json())' enabled:
  POST /api/courses/105/reviews?notify=true
  Headers:
    Content-Type: application/json
    X-Client-Version: 2.1
  Body:
    { "rating": 5, "comment": "Very clear explanation of Express!" }

Write down the exact values of:
1. req.method
2. req.path
3. req.params
4. req.query
5. req.body
6. req.headers['x-client-version']
7. Which 'res' method chain should the server use to return the newly created review with status 201?`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `• The Request object ('req') exposes incoming data via 'req.params' (route parameters), 'req.query' (query strings), 'req.body' (parsed payload), 'req.headers' (lowercase headers), 'req.method', and 'req.path'.
• 'app.use(express.json())' must be registered before routes so Express parses incoming JSON payloads into 'req.body'.
• The Response object ('res') constructs outgoing responses via 'res.status()', 'res.json()', 'res.send()', 'res.set()', and 'res.end()'.
• Always use explicit status codes ('res.status(200).json(...)', 'res.status(201).json(...)', 'res.status(400).json(...)') and validate/whitelist fields from 'req.body'.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Handling a JSON POST Request Using req and res Safely',
        language: 'javascript',
        code: `// req_res_demo.js - Inspecting req properties and sending explicit res responses
import express from 'express';

const app = express();

// Required to parse incoming JSON payloads into req.body
app.use(express.json());

// POST /api/courses/:courseId/notes?format=summary
app.post('/api/courses/:courseId/notes', (req, res) => {
  // 1. Inspect request metadata
  const method = req.method;                      // "POST"
  const path = req.path;                          // "/api/courses/101/notes"
  const { courseId } = req.params;                // { courseId: "101" }
  const format = req.query.format || 'full';      // "summary"
  const clientType = req.headers['user-agent'] || 'unknown';

  // 2. Safely extract and validate expected fields from req.body (prevent mass assignment)
  const { title, content } = req.body || {};

  if (typeof title !== 'string' || title.trim().length < 2) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'A valid note title (at least 2 characters) is required.'
    });
  }

  if (typeof content !== 'string' || content.trim().length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Note content must be a non-empty string.'
    });
  }

  // 3. Set a custom response header and return 201 Created with JSON payload
  res.set('X-Resource-Course', courseId);
  return res.status(201).json({
    status: 'success',
    requestMeta: { method, path, format, clientType },
    data: {
      note: {
        courseId,
        title: title.trim(),
        content: content.trim()
      }
    }
  });
});`,
        explanation: `This example demonstrates how an Express POST endpoint reads from 'req.method', 'req.path', 'req.params', 'req.query', 'req.headers', and 'req.body'. Notice that 'app.use(express.json())' is enabled at the top, only the expected 'title' and 'content' fields are destructured from 'req.body', both fields are type-checked and trimmed, and the response uses 'res.set()' and 'res.status(201).json()'.

Expected Output for POST /api/courses/101/notes?format=summary with body {"title":"Express req & res","content":"Always validate req.body"}:
Status: 201 Created
Body:
{
  "status": "success",
  "requestMeta": {
    "method": "POST",
    "path": "/api/courses/101/notes",
    "format": "summary",
    "clientType": "curl/8.x"
  },
  "data": {
    "note": {
      "courseId": "101",
      "title": "Express req & res",
      "content": "Always validate req.body"
    }
  }
}`,
      },
    ],
    importantPoints: [
      'req.params holds URL route parameters; req.query holds URL query string values; req.body holds the parsed request payload.',
      'req.body is undefined by default unless body-parsing middleware such as app.use(express.json()) is registered before routes.',
      'All header keys inside req.headers are automatically lowercased (for example, req.headers["content-type"]).',
      'While res.json(data) defaults to status 200, explicitly chaining res.status(code).json(data) makes status codes clear and prevents accidental 200 responses on 201 or 4xx/5xx outcomes.',
      'Never blindly trust or persist raw req.body—always destructure allowed fields and validate their types and lengths.',
    ],
    externalReferences: [
      {
        title: 'Express.js 4.x API Reference: Request (req) Object',
        url: 'https://expressjs.com/en/4x/api.html#req',
        source: 'Express.js Official Docs',
      },
      {
        title: 'Express.js 4.x API Reference: Response (res) Object',
        url: 'https://expressjs.com/en/4x/api.html#res',
        source: 'Express.js Official Docs',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 8: Error Handling
  // ID: 6abe9dcdf15c2b4f6008ac38
  // =========================================================================
  {
    topicId: '6abe9dcdf15c2b4f6008ac38',
    title: 'Error Handling',
    content: {
      explanation: `In any real backend application, things can and will go wrong: a client might submit invalid JSON, request a course ID that does not exist, attempt to register an email address that is already taken, present an expired authentication token, or trigger an unexpected database failure.

How your Express backend handles these errors determines both the reliability and the security of your platform.

If errors are left unhandled, a single failed asynchronous Promise can crash the entire Node.js server process or leave the client hanging forever. Conversely, if an error handler carelessly sends raw error objects back to the browser, it can leak sensitive internal stack traces, file system paths, database query structures, or credentials to attackers.

In this topic, you will learn the difference between operational client errors and unexpected server errors, how to catch synchronous and asynchronous errors with ` + '`try/catch`' + ` and ` + '`next(error)`' + `, and how centralized error-handling middleware—like LearnSphere's own ` + '`server/middleware/errorHandler.js`' + `—produces clean, production-safe error responses.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Distinguish between operational/client errors (4xx) and unexpected server errors (5xx).
2. Catch errors in asynchronous route handlers using ` + '`try/catch`' + ` and forward them to Express using ` + '`next(error)`' + `.
3. Implement a 404 catch-all handler and a centralized 4-argument Express error-handling middleware ` + '`(err, req, res, next)`' + `.
4. Map common backend scenarios accurately to HTTP status codes (` + '`400`' + `, ` + '`401`' + `, ` + '`403`' + `, ` + '`404`' + `, ` + '`409`' + `, ` + '`422`' + `, ` + '`500`' + `).
5. Enforce strict security rules: never exposing stack traces, MongoDB connection strings, passwords, JWT secrets, tokens, or internal file paths to clients or logs.`,
        },
        {
          order: 1,
          heading: 'Operational / Client Errors (4xx) vs. Unexpected Server Errors (5xx)',
          body: `Backend errors fall into two distinct categories that require different responses:

1. Operational / Client Errors (4xx Status Codes):
Expected situations caused by invalid client requests that your application anticipates and explains cleanly to the user:
• 400 Bad Request — Malformed syntax, invalid ID format, or failed input validation.
• 401 Unauthorized — Missing, invalid, or expired authentication credentials/token.
• 403 Forbidden — Authenticated user lacks role permission or ownership for the resource.
• 404 Not Found — Requested URL route or resource ID does not exist.
• 409 Conflict — Duplicate resource conflict (e.g., email already registered or already enrolled in course).
• 422 Unprocessable Content — Well-formed JSON that violates domain validation rules.

2. Unexpected Server Errors (5xx Status Codes):
Unanticipated failures inside the server or infrastructure—such as a programming bug ('TypeError'), a dropped database connection, or an out-of-memory error:
• 500 Internal Server Error — The client's request was valid, but something failed on the server.
• For 500 errors, the server must NEVER send internal error messages or stack traces to the client. Instead, it returns a generic, safe message:
  { "error": "Internal Server Error", "message": "An error occurred while processing your request." }`,
        },
        {
          order: 2,
          heading: 'Asynchronous Errors, try/catch, and next(error)',
          body: `In Express 4.x (the version used in LearnSphere), synchronous errors thrown inside a route handler are caught by Express automatically, but rejected Promises inside 'async' functions MUST be caught and forwarded explicitly!

The Standard Asynchronous Controller Pattern:
  app.get('/api/courses/:id', async (req, res, next) => {
    try {
      const course = await findCourseInDatabase(req.params.id);
      if (!course) {
        const notFoundErr = new Error('Course not found');
        notFoundErr.statusCode = 404;
        throw notFoundErr;
      }
      return res.status(200).json({ status: 'success', data: { course } });
    } catch (err) {
      // Forward the error to the centralized errorHandler middleware!
      return next(err);
    }
  });

When you call 'next(err)' with an argument, Express immediately skips all remaining normal routes and middleware and passes 'err' directly to your centralized four-argument error-handling middleware '(err, req, res, next)'.`,
        },
        {
          order: 3,
          heading: 'Security: Development Debugging vs. Production-Safe Responses',
          body: `During local development, a developer looking at their own terminal wants to know which line of code threw an error. However, in client-facing HTTP responses (and shared logs), exposing raw error details is a critical security vulnerability.

Never Expose Any of the Following to Clients:
✗ Stack traces ('err.stack') showing internal file paths (e.g., '/app/server/services/authService.js:42')
✗ MongoDB connection strings or database URIs
✗ Passwords or password hashes
✗ JWT signing secrets or API keys
✗ Access tokens or refresh tokens
✗ Internal database collection names, index names, or raw query structures

Why Logging Sensitive Information Is Also Unsafe:
Even in server-side console logs, you must never log passwords, tokens, JWT secrets, or full database connection URIs, because production logs are often aggregated into external log viewers accessible to multiple team members.

How LearnSphere Implements Centralized Error Handling ('server/middleware/errorHandler.js'):
Inspecting 'server/middleware/errorHandler.js' in this project shows how these exact security rules are enforced in practice:
1. 'notFoundHandler' (lines 4–9): Catches unmatched routes and returns a clean 404 JSON payload.
2. 'errorHandler' (lines 15–110):
   • Checks 'if (res.headersSent) return next(err);' to avoid duplicate response crashes.
   • Translates CORS errors to 403 Forbidden.
   • Translates JWT errors ('JsonWebTokenError', 'TokenExpiredError') to 401 Unauthorized.
   • Translates Mongoose 'CastError' and 'ValidationError' to 400 Bad Request without leaking schema paths.
   • Translates MongoDB duplicate key error ('err.code === 11000') to 409 Conflict.
   • Sanitizes any 4xx error message containing sensitive keywords ('mongo', 'connection', 'secret', 'token', 'password', 'query', 'syntax', 'uri') and returns a generic safe message for all 500 errors.`,
        },
        {
          order: 4,
          heading: 'Common Beginner Mistakes',
          body: `1. Sending err.stack or Raw Database Errors in the JSON Response:
Mistake: Writing 'res.status(500).json({ error: err.message, stack: err.stack })'.
Reality: Attackers intentionally trigger errors to read stack traces and discover your libraries, file paths, and database structure. Always return a generic message for 500 errors.

2. Forgetting try/catch in async Route Handlers:
Mistake: Using 'await' inside an 'app.get(path, async (req, res) => { ... })' handler in Express 4 without 'try/catch'.
Reality: If the awaited Promise rejects, Express 4 will not catch it automatically, leading to an UnhandledPromiseRejection and a hanging client request.

3. Writing Error Middleware with Only 3 Arguments:
Mistake: Defining 'app.use((err, req, res) => { ... })' without the fourth 'next' parameter.
Reality: Express requires all four parameters '(err, req, res, next)' to identify a function as error-handling middleware.`,
        },
        {
          order: 5,
          heading: 'Suggested Practice Task',
          body: `Safe Error Sanitization Exercise:
Examine the following three errors that occurred inside a backend server. For each error, state:
  (a) Which HTTP status code should be returned to the client.
  (b) What safe JSON message should be returned to the client instead of the raw error string.

1. Raw error: "Cast to ObjectId failed for value 'xyz' (type string) at path '_id' for model 'Course'"
2. Raw error: "E11000 duplicate key error collection: learnsphere.users index: email_1 dup key: { email: 'user@example.com' }"
3. Raw error: "MongoServerSelectionError: connection timed out to cluster0.example.mongodb.net"`,
        },
        {
          order: 6,
          heading: 'Topic Summary',
          body: `• Operational/client errors (4xx) represent invalid client requests, while unexpected server errors (5xx) represent internal server failures.
• In async route handlers, wrap awaited operations in 'try/catch' and pass caught errors to 'next(err)'.
• Centralized error-handling middleware uses the four-argument signature '(err, req, res, next)' and is mounted at the bottom of 'server.js' after all routes and the 404 handler.
• Never leak stack traces, database URIs, passwords, JWT secrets, tokens, or internal file paths in client responses or logs.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Centralized Express Error Handling with Async try/catch and Safe Responses',
        language: 'javascript',
        code: `// error_handling_demo.js - Demonstrating async try/catch, next(err), 404, and safe error middleware
import express from 'express';

const app = express();
app.use(express.json());

// Helper to create operational errors with an HTTP status code
function createHttpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

// Simulated async lookup
async function findCourseById(id) {
  if (id === 'db-failure') {
    // Simulate an unexpected internal database error containing sensitive details
    throw new Error('MongoNetworkError: failed to connect to internal-db-host:27017');
  }
  if (id === '101') {
    return { id: '101', title: 'Express Error Handling' };
  }
  return null;
}

// Async route using try/catch and forwarding errors with next(err)
app.get('/api/courses/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      throw createHttpError(400, 'Invalid course ID parameter.');
    }

    const course = await findCourseById(id);
    if (!course) {
      throw createHttpError(404, 'Course not found.');
    }

    return res.status(200).json({ status: 'success', data: { course } });
  } catch (err) {
    return next(err); // Forward to centralized error handler
  }
});

// 1. 404 Catch-All Middleware (after all routes)
app.use((req, res) => {
  return res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found on this server.'
  });
});

// 2. Centralized 4-Argument Error Handler Middleware (must have 4 parameters: err, req, res, next)
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode =
    typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600
      ? err.statusCode
      : 500;

  // Never expose 500 internal error messages or stack traces to the client
  const safeMessage =
    statusCode < 500
      ? err.message
      : 'An error occurred while processing your request.';

  return res.status(statusCode).json({
    error: statusCode === 400 ? 'Bad Request' : statusCode === 404 ? 'Not Found' : 'Internal Server Error',
    message: safeMessage
  });
});`,
        explanation: `This example mirrors LearnSphere's production error architecture:
1. Inside the async route, expected client errors (400 and 404) are created with a 'statusCode' property and thrown inside the 'try' block.
2. The 'catch (err)' block calls 'next(err)' to forward any error—expected or unexpected—to the centralized error middleware.
3. In the 4-argument error handler '(err, req, res, next)', operational 4xx errors return their clean message, while unexpected 500 errors (like the simulated 'MongoNetworkError') are sanitized so internal hostnames and stack traces are never leaked to the client.

Expected Outputs:
• GET /api/courses/101         -> Status 200: {"status":"success","data":{"course":{"id":"101","title":"Express Error Handling"}}}
• GET /api/courses/999         -> Status 404: {"error":"Not Found","message":"Course not found."}
• GET /api/courses/bad$id      -> Status 400: {"error":"Bad Request","message":"Invalid course ID parameter."}
• GET /api/courses/db-failure  -> Status 500: {"error":"Internal Server Error","message":"An error occurred while processing your request."}`,
      },
    ],
    importantPoints: [
      'Operational errors (4xx) are caused by invalid client requests; unexpected server errors (5xx) are internal failures.',
      'Always wrap async route logic in try/catch blocks and pass caught errors to next(err).',
      'Express error-handling middleware must declare all four parameters: (err, req, res, next).',
      'Never expose stack traces, database connection strings, passwords, JWT secrets, tokens, or internal file paths in client responses.',
      'Never log sensitive credentials, secrets, or tokens in console logs.',
    ],
    externalReferences: [
      {
        title: 'Express.js Official Guide: Error Handling',
        url: 'https://expressjs.com/en/guide/error-handling.html',
        source: 'Express.js Official Docs',
      },
      {
        title: 'OWASP Cheat Sheet: Improper Error Handling Prevention',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html',
        source: 'OWASP Security',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 9: Building a Basic REST API
  // ID: 6abe9dcdf15c2b4f6008ac39
  // =========================================================================
  {
    topicId: '6abe9dcdf15c2b4f6008ac39',
    title: 'Building a Basic REST API',
    content: {
      explanation: `In this final topic of Module 3, we bring together every Express.js concept you have learned—server setup, routing, route parameters (` + '`req.params`' + `), query parameters (` + '`req.query`' + `), middleware (` + '`express.json()`' + `), request/response objects, input validation, and centralized error handling—to build a complete, working CRUD REST API for managing a ` + '`courses`' + ` resource.

To keep this teaching example self-contained and immediately runnable on any computer, our example stores courses in an in-memory JavaScript array.

Important Architectural Note:
In the real LearnSphere platform, course data is persisted in a **MongoDB database** (which you will learn in Module 4) and structured across separate **Route → Controller → Service → Model** files (which you will master in Module 5), protected by **JWT authentication and role authorization** (covered in Module 6). The in-memory array used here is strictly for learning how Express coordinates a full REST API lifecycle.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Build a complete 5-endpoint REST API in Express (` + '`GET /api/courses`' + `, ` + '`GET /api/courses/:id`' + `, ` + '`POST /api/courses`' + `, ` + '`PATCH /api/courses/:id`' + `, and ` + '`DELETE /api/courses/:id`' + `).
2. Trace the complete end-to-end request flow from Client through Express, Middleware, Route, Handler, Validation, Business Operation, and Response.
3. Validate route parameters and request body payloads before creating or updating resources.
4. Return accurate HTTP status codes (` + '`200`' + `, ` + '`201`' + `, ` + '`400`' + `, ` + '`404`' + `, ` + '`500`' + `) and consistent JSON response shapes for every operation.`,
        },
        {
          order: 1,
          heading: 'The 5 RESTful Endpoints and Their Contracts',
          body: `Our basic REST API exposes a single resource collection ('/api/courses') with five standard endpoints:

1. GET /api/courses
• Purpose: Retrieve the list of courses (supports optional '?category=' query filtering).
• Success Response: '200 OK' with '{ status: "success", count, data: { courses } }'.

2. GET /api/courses/:id
• Purpose: Retrieve a single course by its unique ID ('req.params.id').
• Responses: '200 OK' if found; '400 Bad Request' if ID format is invalid; '404 Not Found' if no course matches.

3. POST /api/courses
• Purpose: Create a new course from validated fields in 'req.body' ('title' and 'category').
• Responses: '201 Created' with the new course object; '400 Bad Request' if validation fails.

4. PATCH /api/courses/:id
• Purpose: Partially update 'title' and/or 'category' on an existing course.
• Responses: '200 OK' with the updated course; '400 Bad Request' if input is invalid; '404 Not Found' if ID does not exist.

5. DELETE /api/courses/:id
• Purpose: Remove an existing course by ID.
• Responses: '200 OK' confirming deletion (or '204 No Content'); '404 Not Found' if ID does not exist.`,
        },
        {
          order: 2,
          heading: 'The Complete Request Flow Inside an Express REST API',
          body: `Every request to our Express API travels through this predictable 8-stage pipeline:

Client
 ↓  (Sends HTTP Request: Method + URL + Headers + Optional JSON Body)
Express
 ↓  (Receives connection and creates req and res objects)
Middleware
 ↓  (express.json() parses JSON body; logger records request start)
Route
 ↓  (Matches HTTP method + path pattern, e.g., PATCH /api/courses/:id)
Handler
 ↓  (Extracts req.params, req.query, and whitelisted fields from req.body)
Validation
 ↓  (Verifies ID format and checks field types/lengths; returns 400 if invalid)
Business Operation
 ↓  (Reads, creates, updates, or deletes the resource—in memory here, or via Service/Model in MongoDB)
Response
    (Sends explicit HTTP status code and formatted JSON back to Client)`,
        },
        {
          order: 3,
          heading: 'Connecting Module 3 to LearnSphere’s Full Architecture',
          body: `How does this single-file Express API evolve into a production backend like LearnSphere?

In our teaching example below, routing, validation, and data manipulation sit together in one file so you can see the entire flow on a single screen. In LearnSphere's production codebase:
• Route ('server/routes/'): Defines endpoints and attaches middleware chains.
• Controller ('server/controllers/'): Extracts 'req' values, calls the Service layer, and sends 'res'.
• Service ('server/services/'): Enforces business rules and coordinates database operations.
• Model ('server/models/'): Defines Mongoose schemas and persists documents in MongoDB rather than an in-memory array (which resets whenever the server restarts).

In Module 4, you will learn how MongoDB and Mongoose provide persistent storage, and in Module 5, you will combine Express and Mongoose into the full Controller-Service-Model architecture.`,
        },
        {
          order: 4,
          heading: 'Common Beginner Mistakes',
          body: `1. Mutating Resource IDs or Allowing Mass Assignment on PATCH:
Mistake: Doing 'Object.assign(course, req.body)' inside a PATCH handler.
Reality: If the client sends '{ "id": "hacked-id", "courseCreator": "someone-else" }', 'Object.assign' overwrites protected fields! Always update only explicitly whitelisted fields ('title', 'category').

2. Returning 200 OK When a Resource Is Not Found on PATCH or DELETE:
Mistake: Running a delete filter or update without checking whether a course with ':id' actually existed first.
Reality: If ':id' does not match any existing resource, return '404 Not Found' so the client knows the target ID was invalid.

3. Forgetting That In-Memory Arrays Reset on Server Restart:
Mistake: Storing real application data in a JavaScript array variable in production.
Reality: In-memory variables are wiped every time the Node.js process restarts. Real applications always persist data in a database like MongoDB.`,
        },
        {
          order: 5,
          heading: 'Suggested Practice Task',
          body: `Hands-On REST API Challenge:
1. Run the complete REST API code example below on your machine (or trace through each endpoint).
2. Add validation to the 'POST /api/courses' and 'PATCH /api/courses/:id' handlers so that 'title' cannot exceed 100 characters. If a client sends a title longer than 100 characters, return HTTP 400 Bad Request with:
   { "error": "Bad Request", "message": "Course title cannot exceed 100 characters." }
3. Trace what status code and JSON body are returned when a client sends:
   a) POST /api/courses with '{ "title": "MongoDB Basics", "category": "database" }'
   b) GET /api/courses/999
   c) DELETE /api/courses/1 followed by a second DELETE /api/courses/1`,
        },
        {
          order: 6,
          heading: 'Topic Summary',
          body: `• A complete Express REST API combines 'express.json()' middleware, CRUD routes ('GET', 'POST', 'PATCH', 'DELETE'), route parameters ('req.params'), query parameters ('req.query'), input validation, and centralized 404/error handling.
• Every endpoint validates untrusted client input before performing business operations and returns semantic HTTP status codes (200, 201, 400, 404, 500).
• Whitelisting allowed fields from 'req.body' prevents mass-assignment vulnerabilities.
• While an in-memory array is great for learning Express fundamentals, production backends like LearnSphere persist data in MongoDB via a layered Route → Controller → Service → Model architecture.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Complete Runnable In-Memory Express REST API (courses_api.js)',
        language: 'javascript',
        code: `// courses_api.js - Educational in-memory Express REST API combining Module 3 concepts
import express from 'express';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// 1. Built-in Middleware: Parse JSON request bodies
app.use(express.json());

// Educational in-memory store (Real LearnSphere data is stored in MongoDB)
let courses = [
  { id: '1', title: 'Backend Fundamentals', category: 'backend' },
  { id: '2', title: 'Node.js Fundamentals', category: 'backend' }
];
let nextId = 3;

// Validation helper for route parameter IDs
function isValidId(id) {
  return typeof id === 'string' && /^[0-9]+$/.test(id);
}

// 2. GET /api/courses - List courses (with optional ?category= query filter)
app.get('/api/courses', (req, res) => {
  const category = typeof req.query.category === 'string' ? req.query.category.trim().toLowerCase() : '';
  const results = category
    ? courses.filter((c) => c.category.toLowerCase() === category)
    : courses;

  return res.status(200).json({
    status: 'success',
    count: results.length,
    data: { courses: results }
  });
});

// 3. GET /api/courses/:id - Get a single course by ID
app.get('/api/courses/:id', (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Bad Request', message: 'Course ID must be numeric.' });
  }

  const course = courses.find((c) => c.id === id);
  if (!course) {
    return res.status(404).json({ error: 'Not Found', message: \`Course \${id} not found.\` });
  }

  return res.status(200).json({ status: 'success', data: { course } });
});

// 4. POST /api/courses - Create a new course
app.post('/api/courses', (req, res) => {
  const { title, category } = req.body || {};

  if (typeof title !== 'string' || title.trim().length < 3) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Title is required and must be at least 3 characters.'
    });
  }
  if (typeof category !== 'string' || category.trim().length < 2) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Category is required and must be at least 2 characters.'
    });
  }

  const newCourse = {
    id: String(nextId++),
    title: title.trim(),
    category: category.trim().toLowerCase()
  };
  courses.push(newCourse);

  return res.status(201).json({ status: 'success', data: { course: newCourse } });
});

// 5. PATCH /api/courses/:id - Partially update a course
app.patch('/api/courses/:id', (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Bad Request', message: 'Course ID must be numeric.' });
  }

  const course = courses.find((c) => c.id === id);
  if (!course) {
    return res.status(404).json({ error: 'Not Found', message: \`Course \${id} not found.\` });
  }

  const { title, category } = req.body || {};
  if (title === undefined && category === undefined) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Provide at least one field (title or category) to update.'
    });
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length < 3) {
      return res.status(400).json({ error: 'Bad Request', message: 'Title must be at least 3 characters.' });
    }
    course.title = title.trim();
  }

  if (category !== undefined) {
    if (typeof category !== 'string' || category.trim().length < 2) {
      return res.status(400).json({ error: 'Bad Request', message: 'Category must be at least 2 characters.' });
    }
    course.category = category.trim().toLowerCase();
  }

  return res.status(200).json({ status: 'success', data: { course } });
});

// 6. DELETE /api/courses/:id - Delete a course
app.delete('/api/courses/:id', (req, res) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    return res.status(400).json({ error: 'Bad Request', message: 'Course ID must be numeric.' });
  }

  const index = courses.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Not Found', message: \`Course \${id} not found.\` });
  }

  const [deleted] = courses.splice(index, 1);
  return res.status(200).json({
    status: 'success',
    message: \`Course \${deleted.id} deleted.\`
  });
});

// 7. 404 Fallback & Centralized Error Handler
app.use((req, res) => {
  return res.status(404).json({ error: 'Not Found', message: 'Endpoint not found.' });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  return res.status(500).json({
    error: 'Internal Server Error',
    message: 'An error occurred while processing your request.'
  });
});

app.listen(PORT, () => {
  console.log(\`Courses REST API listening on http://localhost:\${PORT}\`);
});`,
        explanation: `This complete, runnable Express REST API implements all 5 CRUD operations on '/api/courses' using an in-memory array for teaching purposes. Every endpoint validates 'req.params' and whitelisted 'req.body' fields before touching the data array, and returns explicit status codes.

Expected Responses for All 5 Key Scenarios:
1. Successful GET (/api/courses):
   Status 200 OK -> {"status":"success","count":2,"data":{"courses":[{"id":"1","title":"Backend Fundamentals","category":"backend"},{"id":"2","title":"Node.js Fundamentals","category":"backend"}]}}

2. Successful POST (/api/courses with {"title":"Express.js","category":"backend"}):
   Status 201 Created -> {"status":"success","data":{"course":{"id":"3","title":"Express.js","category":"backend"}}}

3. Missing Resource (GET /api/courses/999):
   Status 404 Not Found -> {"error":"Not Found","message":"Course 999 not found."}

4. Invalid Input (POST /api/courses with {"title":"A"}):
   Status 400 Bad Request -> {"error":"Bad Request","message":"Title is required and must be at least 3 characters."}

5. Successful Update & Delete:
   • PATCH /api/courses/1 with {"title":"Updated Title"} -> Status 200 OK: {"status":"success","data":{"course":{"id":"1","title":"Updated Title","category":"backend"}}}
   • DELETE /api/courses/1 -> Status 200 OK: {"status":"success","message":"Course 1 deleted."}`,
      },
    ],
    importantPoints: [
      'A RESTful Express API exposes consistent resource endpoints using GET, POST, PATCH, and DELETE.',
      'The complete request flow moves from Client -> Express -> Middleware -> Route -> Handler -> Validation -> Business Operation -> Response.',
      'Always validate both route parameters (req.params) and request body fields (req.body) before modifying data.',
      'Extract only explicitly allowed properties from req.body to prevent mass-assignment vulnerabilities.',
      'In-memory arrays are useful for isolated Express exercises, while production systems like LearnSphere persist data in MongoDB via a layered Route -> Controller -> Service -> Model architecture.',
    ],
    externalReferences: [
      {
        title: 'Express.js Official Documentation: Routing & API Guide',
        url: 'https://expressjs.com/en/guide/routing.html',
        source: 'Express.js Official Docs',
      },
      {
        title: 'MDN Web Docs: Express Tutorial — Routes and Controllers',
        url: 'https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/routes',
        source: 'MDN Web Docs',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },
];
