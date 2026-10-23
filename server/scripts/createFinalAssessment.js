/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Creation Script: Comprehensive Backend Assessment (Course Final)
 * Course: Backend Development with Node.js, Express & MongoDB (6abe9dc2f15c2b4f6008ac1c)
 * Type: 'course' (Course-level capstone assessment)
 * Modules Covered: Modules 1 through 8 (16 comprehensive synthesis questions)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from '../config/db.js';
import Assessment from '../models/Assessment.js';
import RefreshSession from '../models/RefreshSession.js';

const BASE_URL = 'http://localhost:5000';
const COURSE_ID = '6abe9dc2f15c2b4f6008ac1c';

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
  const questionSpecs = [
    // --- MODULE 1: Backend & HTTP Fundamentals ---
    // Q1: Client-Server Architecture & Stateless HTTP Protocol
    {
      prompt: 'In a high-throughput microservices architecture, a frontend client communicates with an Express backend via HTTP/1.1. Why is the HTTP protocol classified as stateless, and how does modern backend architecture maintain authenticated sessions across multiple requests without violating protocol-level statelessness?',
      codeSnippet: `POST /api/orders HTTP/1.1
Host: api.learnsphere.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{"courseId": "6abe9dc2f15c2b4f6008ac1c"}`,
      options: [
        'HTTP does not retain transaction or client context between distinct request-response cycles on the transport/application layer; authentication state is explicitly supplied per request (e.g., via Authorization headers or cookies) and verified server-side without requiring persistent socket-level memory.',
        'HTTP servers automatically store all client variables inside the TCP connection pool, discarding them only when TLS certificates rotate.',
        'Statelessness means servers cannot query databases during HTTP transactions, so state must be hardcoded into DNS records.',
        'HTTP requires clients to establish a permanent WebSocket handshake before any RESTful request can transfer credentials.',
      ],
      correctIndex: 0,
      explanation: 'HTTP is defined as a stateless protocol because each request-response cycle is completely independent; the protocol itself retains no memory of previous transactions. To maintain state (such as user authentication), clients must transmit explicit state credentials (such as JWT Bearer tokens or session cookies) with each individual request, which the backend inspects and validates.',
    },
    // Q2: HTTP Methods, Idempotency & Status Code Semantics
    {
      prompt: 'A backend engineer is implementing resource update operations in a RESTful API. What is the precise semantic distinction between PUT and PATCH, and what are the appropriate HTTP status codes to return upon successful completion?',
      codeSnippet: `// Operation A: Complete representation replacement
PUT /api/users/profile/123 HTTP/1.1
Content-Type: application/json
{"name": "Alice", "bio": "Software Engineer", "theme": "dark"}

// Operation B: Partial delta modification
PATCH /api/users/profile/123 HTTP/1.1
Content-Type: application/json
{"bio": "Staff Backend Engineer"}`,
      options: [
        'PUT replaces the target resource entirely and must be idempotent, returning 200 OK or 204 No Content; PATCH applies partial modifications to the resource and is not required to be idempotent, typically returning 200 OK.',
        'PUT creates subordinate child resources returning 201 Created; PATCH destroys the parent collection returning 204 No Content.',
        'PUT is safe and cannot modify data on the server; PATCH is unsafe and restricted to mutating database primary keys.',
        'PUT only accepts URL-encoded form data; PATCH requires GraphQL payloads and must return 304 Not Modified.',
      ],
      correctIndex: 0,
      explanation: 'Under RFC 7231 and RFC 5789, PUT is defined as an idempotent full replacement of the target resource representation, whereas PATCH specifies a set of changes (partial update) to be applied to the resource. Both typically return 200 OK with the updated entity or 204 No Content if no payload is returned.',
    },

    // --- MODULE 2: Node.js Fundamentals & Asynchronous Architecture ---
    // Q3: Event Loop Phases & Microtask Scheduling Order
    {
      prompt: 'Consider the following Node.js script. In what exact order will the numbers be logged to stdout according to the Node.js event loop and microtask scheduling specifications?',
      codeSnippet: `console.log('1');
setTimeout(() => console.log('2'), 0);
setImmediate(() => console.log('3'));
Promise.resolve().then(() => console.log('4'));
process.nextTick(() => console.log('5'));
console.log('6');`,
      options: [
        '1, 6, 5, 4, 2, 3',
        '1, 2, 3, 4, 5, 6',
        '1, 6, 4, 5, 3, 2',
        '5, 4, 1, 6, 2, 3',
      ],
      correctIndex: 0,
      explanation: 'Node.js first executes all synchronous code on the call stack (logging 1 and 6). Next, the microtask queue drains immediately before the event loop advances: process.nextTick callbacks take highest microtask priority (logging 5), followed by Promise microtasks (logging 4). Finally, the event loop phases execute macrotasks: the Timers phase executes the zero-delay setTimeout callback (logging 2), and the Check phase executes setImmediate (logging 3).',
    },
    // Q4: Single-Threaded Event Loop vs CPU-Bound Blocking
    {
      prompt: 'During peak traffic, a Node.js API server handles 2,000 concurrent database queries with sub-20ms latency. However, when an endpoint triggers synchronous image processing or intensive cryptographic hashing on the main thread, latency across all concurrent routes surges to 5,000ms. Why does this occur, and what is the architecturally sound solution?',
      codeSnippet: `// Synchronous bottleneck on main event loop:
app.post('/api/report/generate', (req, res) => {
  const result = cpuIntensiveCalculation(req.body.data); // Blocks main thread!
  res.json({ result });
});`,
      options: [
        'Node.js executes JavaScript on a single thread; CPU-bound synchronous calculations block the event loop from processing I/O callbacks, so heavy compute must be delegated to Worker Threads, child processes, or external worker queues.',
        'Node.js allocates a separate OS thread for every HTTP connection, but V8 garbage collection freezes all cores when arrays exceed 100 elements.',
        'Asynchronous database drivers shut down the network card whenever CPU utilization exceeds 15%.',
        'Synchronous functions automatically convert into microtasks that corrupt libuv socket handles.',
      ],
      correctIndex: 0,
      explanation: 'Because Node.js executes application JavaScript on a single main thread, synchronous CPU-intensive tasks monopolize that thread, preventing the event loop from advancing to process I/O events, network sockets, or timer callbacks. Offloading CPU-heavy work to Worker Threads or dedicated worker processes keeps the main event loop responsive.',
    },

    // --- MODULE 3: Express.js & Middleware Architecture ---
    // Q5: Express Middleware Execution & Centralized next(err) Routing
    {
      prompt: 'In an Express.js application, an error occurs inside an asynchronous route handler. How must the error be propagated so that it bypasses subsequent standard route middleware and reaches the centralized error-handling middleware?',
      codeSnippet: `app.get('/api/resource/:id', async (req, res, next) => {
  try {
    const item = await Resource.findById(req.params.id);
    if (!item) {
      const err = new Error('Resource not found');
      err.statusCode = 404;
      return next(err); // Propagation
    }
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
});`,
      options: [
        'By calling next(err) with a truthy argument, causing Express to skip all remaining non-error middleware and route handlers until reaching a four-argument error handler (err, req, res, next).',
        'By throwing the error into process.on("uncaughtException") to trigger an automatic HTTP 500 response.',
        'By returning res.send(err) directly from middleware to terminate the TCP connection immediately.',
        'By calling next("route") which forces Express to invoke the nearest database rollback transaction.',
      ],
      correctIndex: 0,
      explanation: 'In Express, invoking next() with any truthy value (except the string "route") signals an error. Express skips all remaining standard middleware and routes in the stack, jumping directly to the first registered error-handling middleware defined with four arguments: (err, req, res, next).',
    },
    // Q6: Modular Routers & mergeParams Scoping
    {
      prompt: 'A backend service structures hierarchical routes across modular routers: /api/courses/:courseId/modules/:moduleId/topics. Inside the nested topic router, req.params.moduleId is undefined. What configuration is missing?',
      codeSnippet: `// courseRouter.js
const moduleRouter = express.Router({ mergeParams: true });
courseRouter.use('/:courseId/modules', moduleRouter);

// moduleRouter.js
const topicRouter = express.Router(/* missing config */);
moduleRouter.use('/:moduleId/topics', topicRouter);`,
      options: [
        'The child router must be instantiated with express.Router({ mergeParams: true }) so that params from parent routers are merged into req.params.',
        'The parent router must export req.params as a global Node.js process variable.',
        'The child router must query the database to reconstruct the URL string on every request.',
        'The route path in moduleRouter must use wildcard asterisks instead of named parameter colons.',
      ],
      correctIndex: 0,
      explanation: 'By default, each Express Router maintains an isolated req.params dictionary. To access route parameters defined in ancestor routers (such as :courseId or :moduleId), the nested child router must be initialized with { mergeParams: true }.',
    },

    // --- MODULE 4: MongoDB & Mongoose ---
    // Q7: Mongoose Query Hydration vs .lean() Performance
    {
      prompt: 'A read-only API endpoint retrieves a paginated catalog of 100 course documents. What is the performance effect of appending .lean() to the Mongoose query chain?',
      codeSnippet: `const courses = await Course.find({ status: 'published' })
  .select('title description price category')
  .sort({ createdAt: -1 })
  .limit(100)
  .lean();`,
      options: [
        'It instructs Mongoose to skip hydrating returned documents into full Mongoose Document instances, returning plain JavaScript objects to reduce memory usage and CPU execution time.',
        'It compresses MongoDB documents into raw binary buffers that cannot be serialized into JSON.',
        'It converts the MongoDB query into a client-side SQL join executed in Node memory.',
        'It deletes internal Mongoose validation schemas permanently from disk.',
      ],
      correctIndex: 0,
      explanation: 'By default, Mongoose wraps query results in rich Mongoose Document instances featuring change tracking, virtuals, getters, and document methods (.save(), etc.). Appending .lean() bypasses this hydration overhead, returning raw, plain JavaScript objects (POJOs), substantially reducing memory consumption and latency for read-only queries.',
    },
    // Q8: MongoDB Data Modeling & .populate() Reference Resolution
    {
      prompt: 'When designing a MongoDB schema for an e-commerce platform with Products and Reviews, when is referencing preferred over embedding, and how does Mongoose resolve populated references?',
      codeSnippet: `// Schema with reference
const productSchema = new mongoose.Schema({
  title: String,
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }
});

const product = await Product.findById(productId).populate('category', 'name slug');`,
      options: [
        'Referencing is preferred for unbounded or independently queried datasets to avoid exceeding the 16MB BSON limit; Mongoose resolves .populate() by executing separate database queries behind the scenes.',
        'Referencing requires a native foreign key engine join on the MongoDB storage engine level that locks the database collection.',
        'Embedding is mandatory for all relationships because MongoDB cannot query documents across multiple collections.',
        'Mongoose .populate() downloads the entire referenced collection to client memory and filters records in the browser.',
      ],
      correctIndex: 0,
      explanation: 'Embedding is best for 1-to-few bounded relationships. For 1-to-many unbounded relationships (like thousands of reviews), referencing prevents documents from breaching the 16MB document boundary and prevents document relocation fragmentation. Mongoose resolves .populate() by issuing an auxiliary query (typically using $in) to fetch referenced documents from the related collection.',
    },

    // --- MODULE 5: REST API Design & Implementation ---
    // Q9: Separation of Concerns: Controllers vs Services
    {
      prompt: 'In professional REST API engineering, why should business logic, data persistence, and transaction management be encapsulated in Service layers rather than Express Controller functions?',
      codeSnippet: `// Recommended pattern:
export const enrollStudentController = async (req, res, next) => {
  try {
    const enrollment = await enrollmentService.processEnrollment({
      studentId: req.user.userId,
      courseId: req.params.courseId,
    });
    res.status(201).json({ success: true, data: { enrollment } });
  } catch (error) {
    next(error);
  }
};`,
      options: [
        'Controllers remain focused solely on HTTP concerns (parsing requests, selecting status codes, formatting responses), while Services contain pure, reusable business logic testable without mocking HTTP objects.',
        'Controllers cannot access databases because Express forbids importing mongoose inside route files.',
        'Services run in WebAssembly while Controllers execute in the browser.',
        'Moving business logic to Services allows client browsers to execute server code directly.',
      ],
      correctIndex: 0,
      explanation: 'Separation of Concerns dictates that Controllers handle HTTP transport mechanics (validating HTTP inputs, status codes, cookies, headers, and responses). Services encapsulate the core business domain, data validations, and database mutations. This architecture enables unit testing services without mocking Express req/res objects and allows domain logic to be reused across CLI scripts, background jobs, or WebSockets.',
    },
    // Q10: Safe Pagination & Mass-Assignment Defense
    {
      prompt: 'An API endpoint accepts query parameters for sorting, pagination, and user profile updates. What controls must be implemented to prevent denial of service and privilege escalation?',
      codeSnippet: `// Secure controller handler:
const allowedSorts = ['createdAt', 'title', 'price'];
const sortField = allowedSorts.includes(req.query.sortBy) ? req.query.sortBy : 'createdAt';
const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

// Updates:
const { name, bio } = req.body; // Explicit allowlist prevents mass-assignment
await User.findByIdAndUpdate(userId, { name, bio }, { runValidators: true });`,
      options: [
        'Clamp limit to an enforced maximum, allowlist sort fields to prevent unindexed sort attacks, and explicitly destructure allowlisted update fields to prevent mass-assignment.',
        'Allow clients to pass arbitrary limit numbers up to 1,000,000 and pass raw req.body directly to User.updateMany({}).',
        'Store all user passwords in query string parameters so Mongoose can validate them automatically.',
        'Disable pagination and return the entire database collection in a single JSON array.',
      ],
      correctIndex: 0,
      explanation: 'Unbounded query parameters can cause memory exhaustion and database denial of service if clients request enormous limits or trigger full-table unindexed sorts. Allowlisting query parameters and strictly destructuring permitted body fields prevents mass-assignment (e.g. an attacker injecting { role: "admin" } into a profile update).',
    },

    // --- MODULE 6: Authentication & Authorization ---
    // Q11: Bcrypt Password Hashing & Constant-Time Verification
    {
      prompt: 'How does bcrypt protect stored credentials against offline dictionary attacks and timing side-channels during authentication?',
      codeSnippet: `// Verification:
const isMatch = await bcrypt.compare(candidatePassword, user.passwordHash);`,
      options: [
        'Bcrypt uses a slow, adaptive work factor with unique salts embedded in the hash, and performs constant-time string comparison to prevent timing side-channels.',
        'Bcrypt encrypts passwords with a reversible two-way AES key stored in git.',
        'Bcrypt sends the candidate password to an external OAuth provider for hashing.',
        'Bcrypt uses MD5 with zero iterations to guarantee instant login execution.',
      ],
      correctIndex: 0,
      explanation: 'Bcrypt uses an adaptive key derivation function based on the Blowfish cipher. It incorporates a per-password salt and configurable work factor (cost) to make offline brute-force and rainbow table attacks computationally expensive. When verifying passwords with bcrypt.compare, the salt and cost are extracted from the stored hash, and constant-time comparison prevents timing analysis attacks.',
    },
    // Q12: Dual-Token JWT Architecture & Refresh Rotation
    {
      prompt: 'Why does LearnSphere implement a dual-token authentication model with short-lived access tokens and refresh token rotation, rather than relying on a single long-lived access token?',
      codeSnippet: `// Access token: 15 minutes, stateless verification
const accessToken = jwt.sign({ userId, role }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });

// Refresh token: Single-use, stored in database session with rotation`,
      options: [
        'Short-lived access tokens limit the exposure window if compromised; refresh token rotation detects token reuse and invalidates the entire compromised session family immediately.',
        'Long-lived access tokens are illegal under HTTP/2 specifications.',
        'Refresh tokens encrypt database passwords so they can be decoded by frontend React components.',
        'Access tokens cannot carry user IDs, so refresh tokens are required to identify the student.',
      ],
      correctIndex: 0,
      explanation: 'Stateless JWT access tokens cannot be revoked before expiration without querying a revocation list. Keeping their lifespan brief (e.g. 15 minutes) limits the window of opportunity for an attacker if intercepted. Long-lived refresh tokens are stored in the database; rotating them on every exchange and detecting reuse ensures that if a refresh token is stolen, any reuse invalidates the entire session, protecting user accounts.',
    },

    // --- MODULE 7: Backend Security ---
    // Q13: NoSQL Injection Prevention & Safe Query Construction
    {
      prompt: 'An Express backend processes a login request. An attacker submits { username: { $ne: null }, password: { $ne: null } }. Why does this vulnerability exist, and what is the proper defense?',
      codeSnippet: `// Vulnerable query:
const user = await User.findOne({ username: req.body.username, password: req.body.password });`,
      options: [
        'MongoDB query selectors treat nested objects as query operators ($ne, $gt); defense requires strict schema type validation, input sanitization, and explicit casting to primitive strings.',
        'The vulnerability occurs because Express uses JSON; converting to XML completely eliminates NoSQL injection.',
        'MongoDB automatically hashes all query objects before comparing them to database indexes.',
        'NoSQL injection only affects SQL databases like PostgreSQL, so MongoDB requires no protection.',
      ],
      correctIndex: 0,
      explanation: 'If an Express application uses body-parser with JSON and passes raw request bodies directly to MongoDB query filters, an attacker can supply objects containing query operators like $ne (not equal). The query { username: { $ne: null } } evaluates to true for the first record in the collection. Sanitizing keys that start with "$" or enforcing strict string-only types in validation middleware prevents query manipulation.',
    },
    // Q14: Rate Limiting & Sensitive Data Protection
    {
      prompt: 'To protect an API against credential stuffing, brute-force attacks, and secret leakage, what defense-in-depth measures should be applied to authentication endpoints?',
      codeSnippet: `// Protective rate limiting & sanitized responses:
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, error: 'Too many login attempts. Please try again later.' }
});`,
      options: [
        'Apply IP and account-scoped rate limiting with 429 status codes, avoid descriptive login error differentiation, and redact passwords, tokens, and stack traces from server logs.',
        'Return "Password incorrect for user Alice" with a 200 OK status code to help legitimate users debug typos.',
        'Print plaintext passwords and JWT secret keys in console.log() to assist production monitoring.',
        'Disable TLS encryption so that network firewalls can inspect credentials in transit.',
      ],
      correctIndex: 0,
      explanation: 'Defense in depth for authentication requires tiered rate limiting to throttle automated brute-force attempts (returning 429 Too Many Requests), generic failure messages ("Invalid email or password") to prevent username enumeration, and strict log hygiene to prevent storing sensitive data (passwords, authorization tokens, PII) in application logs.',
    },

    // --- MODULE 8: Practical Backend Project Architecture ---
    // Q15: Two-Stage Authorization: RBAC & Resource Ownership
    {
      prompt: 'In an enterprise multi-tenant application, how does two-stage authorization enforce security when a Course Creator attempts to modify an assessment at /api/creator/courses/:courseId/assessments/:assessmentId?',
      codeSnippet: `// Stage 1: Role-Based Access Control
router.put('/:assessmentId', authenticateToken, requireRole(['courseCreator', 'admin']), async (req, res, next) => {
  // Stage 2: Authoritative Resource Ownership Verification
  const course = await Course.findById(req.params.courseId);
  if (req.user.role === 'courseCreator' && course.courseCreator.toString() !== req.user.userId) {
    return res.status(403).json({ success: false, error: 'Forbidden: You do not own this course' });
  }
  // Safe mutation proceeds...
});`,
      options: [
        'Stage 1 validates that the user\'s role permits creator-level actions; Stage 2 dynamically verifies that the authenticated user owns the specific course being accessed, preventing IDOR attacks.',
        'Stage 1 verifies the client\'s browser user-agent; Stage 2 grants write access to any user who supplies an assessment ID.',
        'Both stages are redundant because JWT signatures automatically prevent users from requesting resources owned by other creators.',
        'Stage 1 grants full database administrator rights to all authenticated students.',
      ],
      correctIndex: 0,
      explanation: 'RBAC (Role-Based Access Control) ensures that only users with the "courseCreator" or "admin" role can access creator routes. However, RBAC alone cannot prevent Insecure Direct Object References (IDOR), where Creator A modifies Creator B\'s course. The second stage performs authoritative database-level ownership verification: it checks that req.user.userId matches the courseCreator field of the target course, granting access only if ownership is proven.',
    },
    // Q16: Automated Integration Testing Pillars & Database Invariants
    {
      prompt: 'When writing automated integration tests for backend APIs, what are the core testing pillars required to guarantee production reliability and data isolation?',
      codeSnippet: `// Test Suite Pattern:
describe('Assessment Creation API', () => {
  it('rejects unauthenticated requests with 401', async () => { /* ... */ });
  it('rejects invalid payloads with 400 validation error', async () => { /* ... */ });
  it('rejects cross-creator mutations with 403 Forbidden', async () => { /* ... */ });
  it('creates assessment for authorized owner with 201 Created', async () => { /* ... */ });
  afterEach(async () => { await cleanupTestArtifacts(); });
});`,
      options: [
        'Verify positive happy paths, validate negative input boundary rejections (400), enforce authentication and role authorization boundaries (401/403), and assert clean database state teardown.',
        'Only test happy paths with mocked 200 OK responses while leaving test records permanently in production databases.',
        'Verify that all backend endpoints return HTTP 200 OK regardless of whether an error occurred.',
        'Run tests only once during repository initialization and disable testing in deployment pipelines.',
      ],
      correctIndex: 0,
      explanation: 'Professional automated API verification requires four pillars: (1) Happy path testing verifying functional contracts and status codes; (2) Negative testing ensuring invalid inputs are rejected with 400 Bad Request; (3) Security boundary testing ensuring unauthenticated requests receive 401 and unauthorized requests receive 403; and (4) Idempotent state isolation and guaranteed teardown ensuring test runs do not leave lingering records or corrupt application state.',
    },
  ];

  return questionSpecs.map((q, qIndex) => {
    const questionId = new mongoose.Types.ObjectId();
    const optionsWithIds = q.options.map((optText, optIndex) => ({
      _id: new mongoose.Types.ObjectId(),
      text: optText,
      order: optIndex,
    }));

    const correctOptionId = optionsWithIds[q.correctIndex]._id;

    return {
      _id: questionId,
      prompt: q.prompt,
      codeSnippet: q.codeSnippet,
      order: qIndex,
      options: optionsWithIds,
      correctOptionId,
      explanation: q.explanation,
    };
  });
}

async function run() {
  console.log('===================================================================');
  console.log('=== LearnSphere — Create Comprehensive Backend Assessment       ===');
  console.log('===================================================================\n');

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
    // 2. Check for existing comprehensive assessment for the course
    console.log('2. Checking for existing course-level comprehensive assessment...');
    const existing = await Assessment.findOne({
      courseId: COURSE_ID,
      type: 'course',
    });

    if (existing) {
      console.log(`ℹ Comprehensive course assessment already exists with ID: ${existing._id}`);
      console.log(`  Title: ${existing.title}`);
      console.log(`  Type: ${existing.type}`);
      console.log(`  Status: ${existing.status}`);
      console.log(`  Questions count: ${existing.questions.length}`);
      return;
    }

    // 3. Build payload
    const questions = buildQuestions();
    const payload = {
      title: 'Comprehensive Backend Assessment',
      description: 'Comprehensive capstone assessment covering the complete 8-module curriculum of Backend Development with Node.js, Express & MongoDB. Evaluates foundational HTTP/HTTPS client-server architecture, Node.js event loop and asynchronous execution, Express middleware routing pipelines, MongoDB document modeling and Mongoose querying, RESTful API design and controller/service separation, secure authentication and dual-token JWT rotation, backend security and NoSQL injection mitigation, and production-grade project architecture with automated integration verification.',
      type: 'course',
      moduleId: null,
      topicId: null,
      status: 'published',
      passingScore: 75,
      timeLimitMinutes: 45,
      maxAttempts: 3,
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
    // Clean up temporary creator login session created during this run
    console.log('\n4. Cleaning up temporary creator login session...');
    await RefreshSession.deleteMany({ userId: creatorUser.id || creatorUser._id });
    console.log('✓ Cleanup complete.');
  }
}

run().then(() => {
  console.log('\n===================================================================');
  console.log('=== Final Assessment Creation Completed Successfully            ===');
  console.log('===================================================================');
  process.exit(0);
}).catch((err) => {
  console.error('Fatal error during execution:', err);
  process.exit(1);
});
