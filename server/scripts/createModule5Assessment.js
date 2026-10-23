/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Creation Script: Module 5 Mastery Quiz
 * Course: Backend Development with Node.js, Express & MongoDB (6abe9dc2f15c2b4f6008ac1c)
 * Module 5: Module 5 — Building REST APIs (6abe9dd2f15c2b4f6008ac44)
 * Anchor Topic: API Testing (6abe9dd6f15c2b4f6008ac4e)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from '../config/db.js';
import Assessment from '../models/Assessment.js';
import RefreshSession from '../models/RefreshSession.js';

const BASE_URL = 'http://localhost:5000';
const COURSE_ID = '6abe9dc2f15c2b4f6008ac1c';
const MODULE_5_ID = '6abe9dd2f15c2b4f6008ac44';
const ANCHOR_TOPIC_ID = '6abe9dd6f15c2b4f6008ac4e';

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
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'According to REST architectural conventions, how should API endpoints be named and how should actions be expressed on resources?',
      codeSnippet: '',
      options: [
        {
          _id: q1Opt1,
          text: 'Endpoints should use verbs that describe database operations (such as /api/getCourse and /api/createCourse) while using HTTP POST for all requests.',
        },
        {
          _id: q1Opt2,
          text: 'Endpoints should use plural nouns representing resources (such as /api/courses and /api/courses/:courseId) and use standard HTTP methods (GET, POST, PATCH, DELETE) to express actions.',
        },
        {
          _id: q1Opt3,
          text: 'Endpoints should embed user credentials directly into URL paths (such as /api/faculty/courses) and maintain server-side in-memory session state between requests.',
        },
        {
          _id: q1Opt4,
          text: 'Endpoints should name singular resource tables (such as /api/course/edit) and use custom HTTP status codes outside RFC standards.',
        },
      ],
      correctOptionId: q1Opt2,
      explanation: 'REST (Representational State Transfer) is resource-oriented: resources are identified by plural nouns in URLs (e.g., /api/courses, /api/courses/:courseId), actions are communicated via standard HTTP methods (GET to read, POST to create, PATCH to partially update, DELETE to remove), and communication is stateless.',
      order: 0,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'In a layered backend architecture (Route -> Controller -> Service -> Model), what is the primary architectural responsibility of a Controller?',
      codeSnippet: `// Example Controller method:
export async function createCourse(req, res, next) {
  try {
    const course = await courseService.createCourse(req.user.id, req.body);
    return res.status(201).json({ success: true, data: { course } });
  } catch (err) {
    return next(err);
  }
}`,
      options: [
        {
          _id: q2Opt1,
          text: 'Define database schema validation rules and directly execute raw MongoDB aggregation pipelines.',
        },
        {
          _id: q2Opt2,
          text: 'Handle HTTP transport concerns: extract validated inputs from req, delegate business logic to the Service layer, return the HTTP response via res, and forward errors to next(err).',
        },
        {
          _id: q2Opt3,
          text: 'Receive raw client input, parse JWT tokens directly without middleware, and manage database connection pools.',
        },
        {
          _id: q2Opt4,
          text: 'Act as a fallback service that executes only when Mongoose models fail to connect to MongoDB.',
        },
      ],
      correctOptionId: q2Opt2,
      explanation: 'Controllers act as the HTTP transport coordination layer: they read parameters, bodies, and auth context from the Express req object, invoke the decoupled business logic in the Service layer, formulate standard HTTP JSON responses using res, and forward uncaught errors to centralized error middleware via next(err).',
      order: 1,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'Why should backend Service layer functions receive plain JavaScript arguments (e.g., courseId, actorId, updateData) rather than Express req and res objects directly?',
      codeSnippet: `// Preferred Service signature:
export async function updateCourseService(courseId, actorId, updateData) {
  // Enforces domain validation, ownership checks, and database updates
}`,
      options: [
        {
          _id: q3Opt1,
          text: 'Because passing req and res into services prevents JavaScript garbage collection from reclaiming HTTP socket memory.',
        },
        {
          _id: q3Opt2,
          text: 'Because decoupling services from HTTP transport objects ensures business rules are cleanly testable and reusable across controllers, CLI scripts, and background jobs.',
        },
        {
          _id: q3Opt3,
          text: 'Because Mongoose query methods automatically reject any function call that contains an Express request object in scope.',
        },
        {
          _id: q3Opt4,
          text: 'Because Node.js worker threads require all service arguments to be serialized into BSON buffers prior to function invocation.',
        },
      ],
      correctOptionId: q3Opt2,
      explanation: 'Keeping Services independent of HTTP transport objects (req, res) separates business rules from protocol details. This makes business logic easily unit testable without mocking HTTP objects, and reusable across different interfaces such as REST controllers, background queue workers, and CLI admin scripts.',
      order: 2,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'Consider this route definition file. When a client sends a GET request to /api/courses/featured, which route handler executes, and why?',
      codeSnippet: `import { Router } from 'express';
const router = Router();

router.get('/:courseId', getCourseByIdHandler);
router.get('/featured', getFeaturedCoursesHandler);

export default router;`,
      options: [
        {
          _id: q4Opt1,
          text: 'getFeaturedCoursesHandler executes because Express evaluates exact string literal matches before parameterized route patterns.',
        },
        {
          _id: q4Opt2,
          text: 'getCourseByIdHandler executes with req.params.courseId set to "featured" because Express matches routes sequentially in registration order.',
        },
        {
          _id: q4Opt3,
          text: 'Express throws a RoutingConflictError at startup and refuses to mount the router on the main application.',
        },
        {
          _id: q4Opt4,
          text: 'Both handlers execute concurrently and Express sends duplicate HTTP response headers back to the client.',
        },
      ],
      correctOptionId: q4Opt2,
      explanation: 'Express routes are evaluated in the exact order they are registered. Because "/:courseId" is registered first, any path segment—including the literal word "featured"—is captured as the parameter courseId, executing getCourseByIdHandler. Specific static routes must always be declared before dynamic parameter routes.',
      order: 3,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'Review the following controller handler for updating a course. What security and reliability vulnerability does this code introduce, and how should it be fixed?',
      codeSnippet: `export async function updateCourse(req, res, next) {
  try {
    const updated = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    return next(err);
  }
}`,
      options: [
        {
          _id: q5Opt1,
          text: 'It suffers from mass assignment and bypasses schema validation; it should extract an explicit allowlist of fields from req.body and pass runValidators: true.',
        },
        {
          _id: q5Opt2,
          text: 'It returns HTTP 200 instead of HTTP 201 Created; it should use HTTP 201 whenever any database document is modified.',
        },
        {
          _id: q5Opt3,
          text: 'findByIdAndUpdate does not support the new: true option; it must always be replaced with findOneAndReplace.',
        },
        {
          _id: q5Opt4,
          text: 'It uses try/catch blocks; asynchronous Express handlers should never use try/catch because Express automatically catches rejected promises.',
        },
      ],
      correctOptionId: q5Opt1,
      explanation: 'Passing unvetted req.body directly into findByIdAndUpdate permits mass assignment (clients can overwrite internal fields like creatorId or status). Furthermore, Mongoose update validators are disabled by default on findByIdAndUpdate unless runValidators: true is explicitly specified. The solution is allowlisting update fields and enabling runValidators: true.',
      order: 4,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'What constitutes a correct and secure centralized error-handling middleware function in Express?',
      codeSnippet: `// Centralized Error Middleware signature:
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(statusCode).json({
    success: false,
    error: { message, code: err.code || 'SERVER_ERROR' }
  });
}`,
      options: [
        {
          _id: q6Opt1,
          text: 'It must omit the next parameter and be mounted at the top of server.js before any route or authentication middleware is declared.',
        },
        {
          _id: q6Opt2,
          text: 'It must declare all four parameters (err, req, res, next), be mounted after all application routes, use semantic HTTP error codes, and never leak stack traces or internal secrets in client responses.',
        },
        {
          _id: q6Opt3,
          text: 'It must always return HTTP 200 with an error flag inside the JSON payload to prevent client-side HTTP network errors from triggering.',
        },
        {
          _id: q6Opt4,
          text: 'It must catch errors by inspecting process.on("uncaughtException") rather than receiving forwarded errors from Express route handlers.',
        },
      ],
      correctOptionId: q6Opt2,
      explanation: 'Express identifies error middleware solely by its 4-parameter signature (err, req, res, next). It must be registered after all route handlers, normalize error status codes (e.g., 400 for bad input, 401 for unauthenticated, 403 for forbidden, 404 for missing items, 500 for unexpected crashes), provide consistent JSON payloads, and sanitize sensitive error details.',
      order: 5,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'When implementing offset-based pagination for GET /api/courses?page=2&limit=10 on a collection with 25 total matching documents, how should skip, limit, and totalPages be calculated safely?',
      codeSnippet: `// Safe pagination calculation:
const page = Math.max(1, parseInt(req.query.page, 10) || 1);
const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
const skip = (page - 1) * limit;`,
      options: [
        {
          _id: q7Opt1,
          text: 'skip is (page * limit) = 20, limit is raw req.query.limit without bounds, and totalPages is Math.floor(25 / 10) = 2.',
        },
        {
          _id: q7Opt2,
          text: 'skip is ((page - 1) * limit) = 10, limit is clamped against a server-side maximum (e.g., 50), and totalPages is Math.ceil(total / limit) = Math.ceil(25 / 10) = 3.',
        },
        {
          _id: q7Opt3,
          text: 'skip is 0 for all pages, and limit is determined dynamically by the total number of document bytes divided by 1024.',
        },
        {
          _id: q7Opt4,
          text: 'skip and limit are passed as unvalidated strings directly into Mongoose, which defaults totalPages to 1.',
        },
      ],
      correctOptionId: q7Opt2,
      explanation: 'For 1-based page numbers, skip = (page - 1) * limit (for page 2 and limit 10, skip is 10). Limits must be bounded by a server-side MAX_LIMIT to prevent Denial of Service via huge allocations. Total pages is calculated using Math.ceil(total / limit), yielding Math.ceil(25 / 10) = 3 pages.',
      order: 6,
    },
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'When building a safe search and filter endpoint (e.g., GET /api/courses?category=Backend&search=node+js), which practices are required for security and semantic correctness?',
      codeSnippet: `// Safe search & filter query builder:
function buildCourseFilter(rawQuery) {
  const filter = {};
  if (typeof rawQuery.category === 'string' && ALLOWED_CATEGORIES.includes(rawQuery.category)) {
    filter.category = rawQuery.category;
  }
  if (typeof rawQuery.search === 'string' && rawQuery.search.trim()) {
    const escaped = rawQuery.search.trim().replace(/[.*+?^$\\{}()|[\\]\\\\]/g, '\\\\$&');
    filter.title = { $regex: escaped, $options: 'i' };
  }
  return filter;
}`,
      options: [
        {
          _id: q8Opt1,
          text: 'Pass raw req.query directly into Course.find(req.query), and return 404 Not Found whenever 0 documents match the query.',
        },
        {
          _id: q8Opt2,
          text: 'Construct the filter from an allowlist of validated parameters, escape regex special characters on search terms, verify primitive types, and return 200 OK with an empty array [] when no results match.',
        },
        {
          _id: q8Opt3,
          text: 'Execute a raw JavaScript eval() expression inside a $where clause to test search strings against all collection documents.',
        },
        {
          _id: q8Opt4,
          text: 'Reject all query parameters containing spaces or punctuation with HTTP 500 Internal Server Error.',
        },
      ],
      correctOptionId: q8Opt2,
      explanation: 'Secure search and filtering requires: (1) constructing an explicit allowlisted filter object rather than passing raw req.query, (2) validating primitive string types to prevent NoSQL operator injection, (3) escaping regex characters to prevent regex DoS (ReDoS) or unintended pattern matching, and (4) returning 200 OK with an empty array ([]) when no items match rather than 404 Not Found.',
      order: 7,
    },
  ];
}

async function run() {
  console.log('===================================================================');
  console.log('=== LearnSphere — Module 5 Mastery Quiz Creation                ===');
  console.log('===================================================================');

  await connectDB();
  if (!isDbConnected()) {
    console.error('Database connection failed.');
    process.exit(1);
  }

  // 1. Authenticate as Course Creator
  console.log('1. Authenticating as Course Creator (faculty@learnsphere.io)...');
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: CREATOR_EMAIL,
      password: CREATOR_PASSWORD,
    }),
  });

  if (loginRes.status !== 200 || !loginRes.data?.data?.accessToken) {
    console.error('Failed to login as course creator:', loginRes.status, loginRes.data);
    process.exit(1);
  }

  const creatorToken = loginRes.data.data.accessToken;
  const creatorUser = loginRes.data.data.user;
  console.log(`✓ Creator authenticated: ${creatorUser.name} (${creatorUser.email}) [ID: ${creatorUser.id || creatorUser._id}]`);

  try {
    // 2. Check for existing assessment for Module 5
    console.log('2. Checking for existing assessment for Module 5...');
    const existing = await Assessment.findOne({
      courseId: COURSE_ID,
      moduleId: MODULE_5_ID,
      title: 'Module 5 Quiz: REST API Design & Implementation',
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
      title: 'Module 5 Quiz: REST API Design & Implementation',
      description: 'Mastery quiz testing REST architectural principles, resource naming conventions, statelessness, Controller HTTP transport coordination, Service layer business logic isolation, Express router mounting and ordering rules, secure CRUD endpoint implementation and mass assignment prevention, centralized 4-parameter error handling middleware and HTTP status semantics, bounded pagination calculations (skip, limit, totalPages), allowlisted query filtering, regex escaping, and API testing matrix verification.',
      type: 'topic',
      moduleId: MODULE_5_ID,
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
  console.log('=== Module 5 Assessment Creation Completed Successfully         ===');
  console.log('===================================================================');
  process.exit(0);
}).catch((err) => {
  console.error('Fatal error during execution:', err);
  process.exit(1);
});
