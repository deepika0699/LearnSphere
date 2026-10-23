/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Creation Script: Module 3 Mastery Quiz
 * Course: Backend Development with Node.js, Express & MongoDB (6abe9dc2f15c2b4f6008ac1c)
 * Module 3: Express.js (6abe9dcaf15c2b4f6008ac30)
 * Anchor Topic: Building a Basic REST API (6abe9dcdf15c2b4f6008ac39)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from '../config/db.js';
import Assessment from '../models/Assessment.js';
import RefreshSession from '../models/RefreshSession.js';

const BASE_URL = 'http://localhost:5000';
const COURSE_ID = '6abe9dc2f15c2b4f6008ac1c';
const MODULE_3_ID = '6abe9dcaf15c2b4f6008ac30';
const ANCHOR_TOPIC_ID = '6abe9dcdf15c2b4f6008ac39';

const CREATOR_EMAIL = 'faculty@learnsphere.io';
const CREATOR_PASSWORD = 'Str0ng!Faculty#Secret2026';

async function request(endpoint, options = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers,
  });

  let data = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }
  return { status: res.status, headers: res.headers, data };
}

function buildQuestions() {
  const q1Opt1 = new mongoose.Types.ObjectId();
  const q1Opt2 = new mongoose.Types.ObjectId();
  const q1Opt3 = new mongoose.Types.ObjectId();
  const q1Opt4 = new mongoose.Types.ObjectId();

  const q2Opt1 = new mongoose.Types.ObjectId();
  const q2Opt2 = new mongoose.Types.ObjectId();
  const q2Opt3 = new mongoose.Types.ObjectId();
  const q2Opt4 = new mongoose.Types.ObjectId();

  const q3Opt1 = new mongoose.Types.ObjectId();
  const q3Opt2 = new mongoose.Types.ObjectId();
  const q3Opt3 = new mongoose.Types.ObjectId();
  const q3Opt4 = new mongoose.Types.ObjectId();

  const q4Opt1 = new mongoose.Types.ObjectId();
  const q4Opt2 = new mongoose.Types.ObjectId();
  const q4Opt3 = new mongoose.Types.ObjectId();
  const q4Opt4 = new mongoose.Types.ObjectId();

  const q5Opt1 = new mongoose.Types.ObjectId();
  const q5Opt2 = new mongoose.Types.ObjectId();
  const q5Opt3 = new mongoose.Types.ObjectId();
  const q5Opt4 = new mongoose.Types.ObjectId();

  const q6Opt1 = new mongoose.Types.ObjectId();
  const q6Opt2 = new mongoose.Types.ObjectId();
  const q6Opt3 = new mongoose.Types.ObjectId();
  const q6Opt4 = new mongoose.Types.ObjectId();

  const q7Opt1 = new mongoose.Types.ObjectId();
  const q7Opt2 = new mongoose.Types.ObjectId();
  const q7Opt3 = new mongoose.Types.ObjectId();
  const q7Opt4 = new mongoose.Types.ObjectId();

  const q8Opt1 = new mongoose.Types.ObjectId();
  const q8Opt2 = new mongoose.Types.ObjectId();
  const q8Opt3 = new mongoose.Types.ObjectId();
  const q8Opt4 = new mongoose.Types.ObjectId();

  return [
    // Question 1: Express Application Setup & Server Startup
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'In a standard Express.js application setup, what are the primary architectural roles of app.use(express.json()) and app.listen(PORT, callback)?',
      codeSnippet: `import express from 'express';\n\nconst app = express();\nconst PORT = process.env.PORT || 5000;\n\napp.use(express.json());\n\napp.get('/api/health', (req, res) => {\n  res.status(200).json({ status: 'ok' });\n});\n\napp.listen(PORT, () => {\n  console.log(\`Server listening on port \${PORT}\`);\n});`,
      order: 0,
      options: [
        { _id: q1Opt1, text: 'express.json() parses incoming HTTP request bodies with JSON payloads into req.body, while app.listen() starts the server by binding and listening for incoming client connections on the designated port', order: 0 },
        { _id: q1Opt2, text: 'express.json() establishes an automatic connection to MongoDB, while app.listen() triggers automated hot-reloading for code changes', order: 1 },
        { _id: q1Opt3, text: 'app.listen() parses query parameters into req.params, while express.json() compresses outgoing HTTP response headers', order: 2 },
        { _id: q1Opt4, text: 'express.json() encrypts all route definitions into bytecode, while app.listen() generates SSL certificates for HTTPS', order: 3 },
      ],
      correctOptionId: q1Opt1,
      explanation: 'express.json() is built-in middleware that parses incoming request payloads with Content-Type: application/json into a JavaScript object accessible at req.body. app.listen() binds the Express application to a specific TCP port and starts listening for incoming HTTP connections.',
    },

    // Question 2: Express Routes & Registration Matching Order
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'Given the following Express route declarations, what response does a client receive when sending an HTTP request GET /api/courses/popular?',
      codeSnippet: `app.get('/api/courses/:id', (req, res) => {\n  res.json({ handler: 'parameterized', id: req.params.id });\n});\n\napp.get('/api/courses/popular', (req, res) => {\n  res.json({ handler: 'static_popular' });\n});`,
      order: 1,
      options: [
        { _id: q2Opt1, text: 'The first handler executes and returns { handler: "parameterized", id: "popular" } because Express evaluates routes strictly in the top-to-bottom order they are registered', order: 0 },
        { _id: q2Opt2, text: 'The second handler executes because Express always prioritizes exact static string paths over parameterized routes regardless of registration order', order: 1 },
        { _id: q2Opt3, text: 'Express throws an UnhandledRoutingConflict error at server startup because :id conflicts with the literal segment "popular"', order: 2 },
        { _id: q2Opt4, text: 'Both handlers execute sequentially, merging both JSON objects into a single HTTP response', order: 3 },
      ],
      correctOptionId: q2Opt1,
      explanation: 'Express evaluates routes sequentially in the exact top-to-bottom order they are declared. Because \'/api/courses/:id\' was registered first, the dynamic parameter :id matches the string \'popular\', causing the first handler to respond and terminate the cycle before the second handler is ever reached. Specific static routes must always be registered before dynamic parameterized routes.',
    },

    // Question 3: Route Parameters vs. Query Parameters
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'In RESTful design and Express request handling, which statement accurately describes the appropriate use of req.params versus req.query?',
      codeSnippet: `// Route A: GET /api/courses/:courseId\n// Route B: GET /api/courses?category=backend&limit=10`,
      order: 2,
      options: [
        { _id: q3Opt1, text: 'Use route parameters (req.params) to identify a specific, required resource by ID, and query parameters (req.query) for optional filtering, sorting, or pagination criteria', order: 0 },
        { _id: q3Opt2, text: 'Use route parameters exclusively for optional search filters, and query parameters for mandatory resource primary keys', order: 1 },
        { _id: q3Opt3, text: 'req.params automatically casts URL numbers into JavaScript numbers, whereas req.query values are converted into booleans', order: 2 },
        { _id: q3Opt4, text: 'Route parameters must be sent in the JSON body, whereas query parameters are passed in HTTP authorization headers', order: 3 },
      ],
      correctOptionId: q3Opt1,
      explanation: 'Route parameters (accessible on req.params) are embedded in the URL path to uniquely identify a specific required resource (e.g., /api/courses/:courseId). Query parameters (accessible on req.query) follow the "?" symbol and provide optional modifiers such as filtering, sorting, and pagination (e.g., ?category=backend&limit=10). Both extract values as strings.',
    },

    // Question 4: Request & Response Handling (res.status().json() & return)
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'In the POST route handler below, why is return res.status(201).json(...) utilized rather than simply res.json(...)?',
      codeSnippet: `app.post('/api/courses', (req, res) => {\n  const { title } = req.body;\n  if (!title) {\n    return res.status(400).json({ error: 'Title is required' });\n  }\n  const newCourse = createCourse(title);\n  return res.status(201).json({ status: 'success', data: { course: newCourse } });\n});`,
      order: 3,
      options: [
        { _id: q4Opt1, text: 'res.status(201) communicates HTTP 201 Created for resource creation (instead of default 200 OK), and return halts handler execution to prevent sending multiple responses', order: 0 },
        { _id: q4Opt2, text: 'res.status(201) instructs the client browser to immediately redirect to another page, while return closes the database connection', order: 1 },
        { _id: q4Opt3, text: 'Express automatically crashes with a TypeError if res.json() is called without chaining res.status() first', order: 2 },
        { _id: q4Opt4, text: 'return is required by Node.js to release the TCP socket back to the operating system kernel', order: 3 },
      ],
      correctOptionId: q4Opt1,
      explanation: 'res.json() defaults to status code 200 OK. Setting res.status(201) explicitly conveys HTTP 201 Created according to REST conventions. Using the return keyword stops function execution immediately, preventing subsequent code from running and avoiding the "Cannot set headers after they are sent to the client" error.',
    },

    // Question 5: Middleware Execution & The next() Function
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'In custom Express middleware, what is the role of next(), and what happens if a middleware neither sends a response nor calls next()?',
      codeSnippet: `const requestLogger = (req, res, next) => {\n  console.log(\`[\${new Date().toISOString()}] \${req.method} \${req.url}\`);\n  // What must happen here?\n  next();\n};`,
      order: 4,
      options: [
        { _id: q5Opt1, text: 'next() passes control to the next middleware or route handler in the pipeline; if omitted, the request hangs indefinitely until the client connection times out', order: 0 },
        { _id: q5Opt2, text: 'next() restarts the Express server process; if omitted, Express automatically sends HTTP 200 OK to the client', order: 1 },
        { _id: q5Opt3, text: 'next() re-parses the incoming request body from the network socket; if omitted, req.body becomes undefined', order: 2 },
        { _id: q5Opt4, text: 'next() is only required when an error occurs, and omitting it immediately finishes the response cycle', order: 3 },
      ],
      correctOptionId: q5Opt1,
      explanation: 'Every middleware code path must either terminate the request-response cycle by sending a response (e.g., res.status(401).json(...)) or call next() to pass control to the next middleware/route handler. If neither occurs, the HTTP connection remains open and the client hangs until it times out.',
    },

    // Question 6: Error-Handling Middleware & Function Arity
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'How does Express internally differentiate centralized error-handling middleware from standard application middleware?',
      codeSnippet: `const errorHandler = (err, req, res, next) => {\n  const statusCode = err.statusCode || 500;\n  res.status(statusCode).json({\n    status: 'error',\n    message: err.message || 'Internal Server Error'\n  });\n};\n\napp.use(errorHandler);`,
      order: 5,
      options: [
        { _id: q6Opt1, text: 'Express inspects function arity (fn.length === 4); declaring exactly four parameters (err, req, res, next) marks it as an error-handling middleware', order: 0 },
        { _id: q6Opt2, text: 'Express checks if the function name contains the word "error" or "Error"', order: 1 },
        { _id: q6Opt3, text: 'Error middleware must be registered using app.useErrorHandler() rather than app.use()', order: 2 },
        { _id: q6Opt4, text: 'Express relies on TypeScript decorators; plain JavaScript functions cannot act as error handlers', order: 3 },
      ],
      correctOptionId: q6Opt1,
      explanation: 'Express detects error-handling middleware by inspecting JavaScript function arity (fn.length === 4), conventionally declared as (err, req, res, next). When an error is forwarded via next(err), Express skips standard three-argument middleware (fn.length === 3) and searches the pipeline for the next registered four-argument error handler. Because standard middleware functions only receive requests during normal processing, omitting the fourth parameter prevents Express from recognizing the function as an error handler during error dispatch.',
    },

    // Question 7: Express Router Organization & Route Mounting
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'In a modular Express application, a router is defined in routes/courseRoutes.js and mounted in server.js as shown. What URL path and HTTP method will trigger getCourseById?',
      codeSnippet: `// routes/courseRoutes.js\nimport express from 'express';\nconst router = express.Router();\n\nrouter.get('/', getCourses);\nrouter.get('/:id', getCourseById);\nexport default router;\n\n// server.js\nimport courseRoutes from './routes/courseRoutes.js';\napp.use('/api/courses', courseRoutes);`,
      order: 6,
      options: [
        { _id: q7Opt1, text: 'GET /api/courses/:id (for example, GET /api/courses/6abe9dc2f15c2b4f6008ac1c)', order: 0 },
        { _id: q7Opt2, text: 'GET /:id', order: 1 },
        { _id: q7Opt3, text: 'GET /api/courses/courseRoutes/:id', order: 2 },
        { _id: q7Opt4, text: 'POST /api/courses/getCourseById', order: 3 },
      ],
      correctOptionId: q7Opt1,
      explanation: 'When mounting a router with app.use(\'/api/courses\', courseRoutes), the path prefix \'/api/courses\' is prepended to all route paths defined inside that router. Therefore, router.get(\'/:id\', ...) matches incoming HTTP requests with GET /api/courses/:id.',
    },

    // Question 8: Practical API Scenario: Middleware Pipeline Sequence
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'A developer sends POST /api/courses with JSON payload { "title": "Express Deep Dive" }, but inside the route handler, req.body is undefined. Based on the server pipeline below, what is the cause and solution?',
      codeSnippet: `// server.js\napp.use('/api/courses', courseRouter);\napp.use(express.json());\napp.use(notFoundHandler);\napp.use(errorHandler);`,
      order: 7,
      options: [
        { _id: q8Opt1, text: 'app.use(express.json()) was registered AFTER the course router; it must be moved BEFORE app.use(\'/api/courses\', courseRouter) so the body parser runs prior to route execution', order: 0 },
        { _id: q8Opt2, text: 'The client must send the request using HTTP PUT because POST requests cannot parse JSON bodies in Express', order: 1 },
        { _id: q8Opt3, text: 'notFoundHandler is intercepting the request because errorHandler was placed at the bottom of the file', order: 2 },
        { _id: q8Opt4, text: 'JSON bodies are accessible on req.query.body instead of req.body when routers are used', order: 3 },
      ],
      correctOptionId: q8Opt1,
      explanation: 'Express executes middleware in sequential registration order. If express.json() is placed below app.use(\'/api/courses\', courseRouter), requests matching /api/courses are handled before the body-parsing middleware can parse the stream, leaving req.body as undefined. Middleware required by routes must always precede those routes.',
    },
  ];
}

async function run() {
  console.log('===================================================================');
  console.log('=== Authoring Module 3 Mastery Quiz                             ===');
  console.log('===================================================================\n');

  await connectDB();
  if (!isDbConnected()) {
    console.error('Database connection failed.');
    process.exit(1);
  }

  // 1. Authenticate as Course Creator
  console.log('1. Authenticating as Course Creator...');
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: CREATOR_EMAIL,
      password: CREATOR_PASSWORD,
    }),
  });

  const creatorToken = loginRes.data?.data?.accessToken || loginRes.data?.data?.tokens?.accessToken;
  if (loginRes.status !== 200 || !creatorToken) {
    console.error('Creator login failed:', loginRes.status, loginRes.data);
    process.exit(1);
  }

  const creatorUser = loginRes.data.data.user;
  console.log(`✓ Creator authenticated: ${creatorUser.name} (${creatorUser.email}) [ID: ${creatorUser.id || creatorUser._id}]`);

  try {
    // 2. Check for existing assessment for Module 3
    console.log('2. Checking for existing assessment for Module 3...');
    const existing = await Assessment.findOne({
      courseId: COURSE_ID,
      moduleId: MODULE_3_ID,
      title: 'Module 3 Quiz: Express.js & Middleware',
    });

    if (existing) {
      console.log(`ℹ Assessment already exists with ID: ${existing._id}`);
      console.log(`  Title: ${existing.title}`);
      console.log(`  Status: ${existing.status}`);
      console.log(`  Questions count: ${existing.questions.length}`);
      return;
    }

    // 3. Build payload
    const questions = buildQuestions();
    const payload = {
      title: 'Module 3 Quiz: Express.js & Middleware',
      description: 'Mastery quiz testing core Express.js application setup, server initialization, routing methods and top-to-bottom registration order, route parameters (req.params) vs query parameters (req.query), request and response lifecycle methods, custom middleware and next(), 4-parameter error-handling middleware arity, modular Router mounting, and pipeline ordering rules.',
      type: 'topic',
      moduleId: MODULE_3_ID,
      topicId: ANCHOR_TOPIC_ID,
      status: 'published',
      passingScore: 75,
      timeLimitMinutes: 15,
      maxAttempts: 0,
      questions,
    };

    console.log(`3. Sending POST /api/creator/courses/${COURSE_ID}/assessments...`);
    const createRes = await request(`/api/creator/courses/${COURSE_ID}/assessments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, creatorToken);

    if (createRes.status !== 201) {
      console.error('Failed to create assessment:', createRes.status, createRes.data);
      process.exit(1);
    }

    const createdAssessment = createRes.data?.data?.assessment;
    console.log('✓ Assessment created successfully!');
    console.log(`  ID: ${createdAssessment.id}`);
    console.log(`  Title: ${createdAssessment.title}`);
    console.log(`  Type: ${createdAssessment.type}`);
    console.log(`  Module ID: ${createdAssessment.moduleId}`);
    console.log(`  Topic ID: ${createdAssessment.topicId}`);
    console.log(`  Status: ${createdAssessment.status}`);
    console.log(`  Passing Score: ${createdAssessment.passingScore}%`);
    console.log(`  Time Limit: ${createdAssessment.timeLimitMinutes} minutes`);
    console.log(`  Max Attempts: ${createdAssessment.maxAttempts}`);
    console.log(`  Questions count: ${createdAssessment.questionsCount}`);

  } finally {
    // Clean up temporary login session created during this run
    console.log('\n4. Cleaning up temporary creator login session...');
    await RefreshSession.deleteMany({ userId: creatorUser.id || creatorUser._id });
    console.log('✓ Cleanup complete.');
  }
}

run().then(() => {
  console.log('\n===================================================================');
  console.log('=== Assessment Creation Script Completed Successfully           ===');
  console.log('===================================================================');
  process.exit(0);
}).catch((err) => {
  console.error('Fatal error during execution:', err);
  process.exit(1);
});
