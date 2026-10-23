/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Creation Script: Module 8 Mastery Quiz
 * Course: Backend Development with Node.js, Express & MongoDB (6abe9dc2f15c2b4f6008ac1c)
 * Module 8: Module 8 — Practical Backend Project (6abe9ddef15c2b4f6008ac64)
 * Anchor Topic: Understanding the Complete Backend Flow (6abe9de2f15c2b4f6008ac6d)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from '../config/db.js';
import Assessment from '../models/Assessment.js';
import RefreshSession from '../models/RefreshSession.js';

const BASE_URL = 'http://localhost:5000';
const COURSE_ID = '6abe9dc2f15c2b4f6008ac1c';
const MODULE_8_ID = '6abe9ddef15c2b4f6008ac64';
const ANCHOR_TOPIC_ID = '6abe9de2f15c2b4f6008ac6d';

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
    // Question 1: Topic 2 - Designing the Database (Embedding vs. Referencing)
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'When designing Mongoose schemas for a hierarchical domain (such as Courses -> Modules -> Topics -> Sections), what architectural criteria determine whether related data should be embedded as sub-documents versus referenced in separate collections using ObjectId?',
      codeSnippet: `// Schema architectural patterns:
// Pattern A: Embedded subdocuments
const topicSchema = new mongoose.Schema({
  title: String,
  sections: [sectionSchema], // embedded array
});

// Pattern B: Referenced collection
const moduleSchema = new mongoose.Schema({
  title: String,
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
});`,
      order: 0,
      options: [
        {
          _id: q1Opt1,
          text: 'Data should be embedded when it is bounded in size, always queried and displayed in context with its parent document, and has no independent lifecycle (such as topic sections); whereas separate referenced collections should be used when child entities grow unboundedly, require standalone querying, or need independent indexing and pagination (such as courses, modules, and topics).',
          order: 0,
        },
        {
          _id: q1Opt2,
          text: 'All relational data in MongoDB must always be normalized into separate collections because document embedding is limited to arrays containing fewer than 3 items.',
          order: 1,
        },
        {
          _id: q1Opt3,
          text: 'Referencing with ObjectId is required only for temporary session data, while all core domain entities must be embedded into a single root course document exceeding 100 megabytes.',
          order: 2,
        },
        {
          _id: q1Opt4,
          text: 'Embedding subdocuments causes MongoDB to execute a collection scan on every read query, whereas referencing collections bypasses disk storage entirely.',
          order: 3,
        },
      ],
      correctOptionId: q1Opt1,
      explanation: 'In MongoDB schema design, embedding (denormalization) is optimal when child data is strictly bounded in quantity, always retrieved and mutated together with the parent, and does not require independent access (e.g., sections belonging to a specific topic, staying well within MongoDB\'s 16MB document limit). In contrast, referencing separate collections (normalization via ObjectId) is necessary when child collections grow unboundedly, require direct querying, independent pagination, or independent lifecycle management (such as Courses, Modules, and Topics). Over-embedding causes document bloat and memory pressure, while over-referencing leads to multiple query round-trips.',
    },

    // Question 2: Topic 3 - Creating the Project Structure (Controllers vs. Services)
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'In a professional layered Express application (Routes -> Controllers -> Services -> Models), why are business logic and database queries delegated to a Service layer rather than placed directly inside Route handlers or Controllers?',
      codeSnippet: `// Layered separation in LearnSphere:
// Controller:
export async function updateTopicContent(req, res, next) {
  try {
    const updated = await topicService.updateContent({
      courseId: req.params.courseId,
      moduleId: req.params.moduleId,
      topicId: req.params.topicId,
      creatorId: req.user.userId,
      contentData: req.body,
    });
    return res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}`,
      order: 1,
      options: [
        {
          _id: q2Opt1,
          text: 'Controllers remain responsible solely for the HTTP transport layer (parsing request parameters, extracting authenticated user context, and returning status codes and JSON responses), while Services encapsulate business logic and database queries independently of Express (req/res), allowing business rules to be reused, tested in isolation without HTTP mocking, and shielded from transport-level changes.',
          order: 0,
        },
        {
          _id: q2Opt2,
          text: 'Express route handlers cannot execute asynchronous JavaScript or await promises unless all database logic is executed inside a separate operating system child process.',
          order: 1,
        },
        {
          _id: q2Opt3,
          text: 'Placing database queries in services is mandatory because Mongoose models refuse connections if imported into files located in a controllers directory.',
          order: 2,
        },
        {
          _id: q2Opt4,
          text: 'Controllers must only handle database transactions, while services are strictly reserved for serving static HTML and CSS assets.',
          order: 3,
        },
      ],
      correctOptionId: q2Opt1,
      explanation: 'The Separation of Concerns (SoC) pattern establishes that Controllers handle the HTTP transport contract: extracting params, headers, and query strings from req, delegating to services with plain JavaScript arguments, and formatting the HTTP response with res.status().json(). Services encapsulate pure domain logic, validation, and database operations without any dependency on Express req or res. This decoupling enables unit testing of core business logic without mocking HTTP request/response objects, promotes code reusability across APIs or CLI tools, and prevents transport-layer refactorings from destabilizing business logic.',
    },

    // Question 3: Topic 4 - Implementing Authentication (Registration & Token Lifecycle)
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'When implementing user registration and login in a practical Express + MongoDB project, which combination of practices ensures safe credential handling and token lifecycle management?',
      codeSnippet: `// Registration and Token generation pattern:
// 1. Hash password with cost factor 12:
const passwordHash = await bcrypt.hash(password, 12);

// 2. Enforce least-privilege role:
const user = await User.create({ email, passwordHash, role: 'student' });

// 3. Issue dual tokens:
const accessToken = tokenService.generateAccessToken({ userId: user._id, role: user.role });
const refreshToken = tokenService.generateRefreshToken({ userId: user._id });`,
      order: 2,
      options: [
        {
          _id: q3Opt1,
          text: 'Hardcoding \'student\' as the default registration role prevents privilege escalation attacks; bcrypt with cost factor 12 protects passwords against offline brute-force cracking; and pairing short-lived access tokens (15m in Authorization: Bearer) with hashed refresh tokens in HttpOnly cookies provides stateless performance while preserving server-controlled session revocation.',
          order: 0,
        },
        {
          _id: q3Opt2,
          text: 'Defaulting registration to role: req.body.role allows users to self-select faculty privileges, and storing plaintext passwords in MongoDB enables instant account recovery via support email.',
          order: 1,
        },
        {
          _id: q3Opt3,
          text: 'Issuing 30-day access tokens stored in localStorage without refresh tokens is recommended because localStorage is immune to cross-site scripting (XSS).',
          order: 2,
        },
        {
          _id: q3Opt4,
          text: 'Bcrypt should be configured with cost factor 2 to minimize CPU usage, and refresh tokens should be stored in cleartext in the User document.',
          order: 3,
        },
      ],
      correctOptionId: q3Opt1,
      explanation: 'Credential and session security requires defense in depth: (1) Default registration must enforce the least-privilege role (student) on the server to prevent attackers from injecting { role: \'admin\' } (mass-assignment privilege escalation). (2) Passwords must be hashed using an adaptive work factor (such as bcrypt with 12 rounds) so brute-force cracking is computationally prohibitive. (3) Dual-token architecture pairs short-lived stateless JWT access tokens (15m in Authorization: Bearer) with database-backed refresh tokens delivered in HttpOnly, Secure, SameSite cookies. Storing only a SHA-256 hash of the refresh token in MongoDB ensures session revocation is instantaneous while protecting stored tokens in the event of a read-only database dump.',
    },

    // Question 4: Topic 5 - Implementing CRUD (Nested Resource Scoping & ObjectId Validation)
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'When implementing nested CRUD operations on child entities (such as updating a topic\'s content within a course and module), why is validating ObjectId formats and scoping queries by the full parent hierarchy essential?',
      codeSnippet: `// Nested topic lookup in service layer:
if (!mongoose.Types.ObjectId.isValid(courseId) || 
    !mongoose.Types.ObjectId.isValid(moduleId) || 
    !mongoose.Types.ObjectId.isValid(topicId)) {
  const err = new Error('Invalid resource identifier format');
  err.statusCode = 400;
  throw err;
}

const topic = await Topic.findOne({
  _id: topicId,
  moduleId: moduleId,
  courseId: courseId,
});
if (!topic) {
  const err = new Error('Topic not found in the specified course and module');
  err.statusCode = 404;
  throw err;
}`,
      order: 3,
      options: [
        {
          _id: q4Opt1,
          text: 'Validating ObjectId strings with mongoose.Types.ObjectId.isValid() prevents Mongoose CastError exceptions from crashing queries or producing 500 errors; scoping by _id, moduleId, and courseId guarantees that the target topic genuinely belongs to the specified parent module and course, preventing orphaned updates or cross-parent entity manipulation.',
          order: 0,
        },
        {
          _id: q4Opt2,
          text: 'Scoping by parent IDs is unnecessary because MongoDB automatically deletes topics whenever an unrelated module is queried.',
          order: 1,
        },
        {
          _id: q4Opt3,
          text: 'Mongoose.Types.ObjectId.isValid() converts non-hex strings into valid MongoDB ObjectIds automatically, eliminating the need to throw 400 errors.',
          order: 2,
        },
        {
          _id: q4Opt4,
          text: 'Querying only by _id: topicId without parent scoping is always preferred because primary keys in MongoDB are guaranteed to exist in only one course globally.',
          order: 3,
        },
      ],
      correctOptionId: q4Opt1,
      explanation: 'In hierarchical REST APIs, client route parameters are untrusted. First, verifying mongoose.Types.ObjectId.isValid() prevents invalid hex strings from triggering unhandled Mongoose CastError exceptions, allowing the server to return a semantic 400 Bad Request instead of an internal 500. Second, querying by { _id: topicId, moduleId: moduleId, courseId: courseId } enforces parent-child hierarchy scoping. If an API only queried Topic.findById(topicId), a client could submit a topicId belonging to Course B inside a URL pointing to Course A, causing inconsistent updates, broken breadcrumb references, and potential tenant isolation breaches.',
    },

    // Question 5: Topic 6 - Adding Authorization (Two-Stage Pipeline & Ownership)
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'In a multi-creator backend, why is a two-stage authorization pipeline (Role-Based Access Control followed by Resource Ownership verification) necessary, and what HTTP status codes should be returned at each stage?',
      codeSnippet: `// Two-stage authorization in LearnSphere:
// Stage 1: Role check
if (!['course_creator', 'admin'].includes(req.user.role)) {
  return res.status(403).json({ message: 'Insufficient platform permissions' });
}

// Stage 2: Ownership check
const course = await Course.findById(courseId);
if (!course || (course.creatorId.toString() !== req.user.userId.toString() && req.user.role !== 'admin')) {
  return res.status(404).json({ message: 'Course not found' });
}`,
      order: 4,
      options: [
        {
          _id: q5Opt1,
          text: 'Role-Based Access Control (RBAC) verifies that the caller has platform-level creator or admin capabilities (returning 403 Forbidden if not); resource ownership verification ensures the creator owns the specific resource being mutated (returning 404 Not Found to prevent ID enumeration and unauthorized edits by peer creators); relying on RBAC alone would allow any creator to overwrite every other creator\'s courses.',
          order: 0,
        },
        {
          _id: q5Opt2,
          text: 'Checking resource ownership is redundant if the caller possesses the course_creator role because creators are granted universal read/write permissions across all system records.',
          order: 1,
        },
        {
          _id: q5Opt3,
          text: 'The ownership check should return HTTP 200 OK with an empty course document so that malicious callers can inspect competitor course IDs.',
          order: 2,
        },
        {
          _id: q5Opt4,
          text: 'Ownership checks should compare req.body.creatorId with course.creatorId so the client can reassign course ownership dynamically.',
          order: 3,
        },
      ],
      correctOptionId: q5Opt1,
      explanation: 'A complete authorization pipeline requires two independent checks: (1) Stage 1 (RBAC) evaluates whether the caller has the necessary platform role (course_creator or admin). If a student attempts to access a creator route, the server returns HTTP 403 Forbidden. (2) Stage 2 (Ownership / BOLA prevention) checks whether the specific resource belongs to the requesting user (course.creatorId.toString() === req.user.userId.toString()). If Creator X attempts to edit Creator Y\'s course, the server returns HTTP 404 Not Found (or 403). Returning 404 is best practice because it avoids confirming whether a private course ID actually exists to unauthorized callers, completely closing Insecure Direct Object Reference (IDOR) vulnerabilities.',
    },

    // Question 6: Topic 7 - Adding Validation and Security (Global Middleware vs. Domain Validation)
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'When hardening an Express backend against common web vulnerabilities, how do global middleware and domain-specific service validation complement each other in defense in depth?',
      codeSnippet: `// Express application hardening stack:
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10kb' }));
app.use(mongoSanitize());
app.use(generalLimiter);`,
      order: 5,
      options: [
        {
          _id: q6Opt1,
          text: 'Global middleware sets protective HTTP headers (helmet), restricts cross-origin access (cors), caps request body size (limit: \'10kb\'), strips $-prefixed operators (mongoSanitize), and throttles request velocity (rateLimiter); while domain services enforce business logic, regex search escaping, primitive data typing, and resource ownership; neither layer alone is sufficient without the other.',
          order: 0,
        },
        {
          _id: q6Opt2,
          text: 'Configuring helmet() automatically validates all incoming JSON request bodies against the Mongoose schema, rendering service-layer validation unnecessary.',
          order: 1,
        },
        {
          _id: q6Opt3,
          text: 'mongoSanitize() completely prevents all SQL and NoSQL attacks without requiring developers to check primitive types or avoid $where queries.',
          order: 2,
        },
        {
          _id: q6Opt4,
          text: 'Restricting payload sizes to 10kb ensures that all client input is automatically sanitized for cross-site scripting (XSS) and SQL injection.',
          order: 3,
        },
      ],
      correctOptionId: q6Opt1,
      explanation: 'Defense in depth requires distinct security controls across the middleware pipeline and domain services. Global middleware establishes platform-wide baselines: helmet() sets defensive HTTP headers (HSTS, clickjacking protection, MIME-sniffing prevention); cors() prevents unauthorized browsers from reading API responses; express.json({ limit: \'10kb\' }) prevents memory exhaustion DoS; mongoSanitize() strips keys starting with $ or containing .; and rate limiters throttle request flooding. However, global middleware cannot understand domain semantics: service layers must still validate primitive data types, escape regex characters in search strings, enforce field allowlists, and verify resource ownership.',
    },

    // Question 7: Topic 8 - Testing the API (Four Pillars & Negative Security Tests)
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'Why are negative security tests and guaranteed teardown (via try/finally blocks) mandatory in automated backend verification suites, and what do the Four Pillars of API testing validate?',
      codeSnippet: `// Verification test teardown pattern:
try {
  // Test authenticated creator workflow
  // Test negative security boundary (unauthenticated -> 401, wrong creator -> 404)
} finally {
  // Clean up test sessions and temporary records
  await RefreshSession.deleteMany({ userId: testUser.id });
}`,
      order: 6,
      options: [
        {
          _id: q7Opt1,
          text: 'Happy-path tests alone only verify that valid requests succeed, whereas negative security tests verify that unauthenticated requests (401), unauthorized roles (403), and cross-tenant resource tampering (404) are strictly blocked; clean teardown in try/finally blocks guarantees that temporary test users, enrollments, and sessions are purged even if assertions fail, preventing database state pollution across test runs.',
          order: 0,
        },
        {
          _id: q7Opt2,
          text: 'Negative security tests are only used to check if the database server has enough disk space to store 10,000 error logs.',
          order: 1,
        },
        {
          _id: q7Opt3,
          text: 'Using try/finally blocks is discouraged because caught errors prevent the test suite from reporting failure codes to continuous integration servers.',
          order: 2,
        },
        {
          _id: q7Opt4,
          text: 'Testing only HTTP 200 responses is sufficient for production APIs because Express automatically converts all security vulnerabilities into 200 OK responses.',
          order: 3,
        },
      ],
      correctOptionId: q7Opt1,
      explanation: 'Relying solely on happy-path tests (200 OK / 201 Created) leaves dangerous security gaps: an accidental removal of an ownership check (createdBy: creatorId) would still pass every happy-path test. Automated suites must validate the Four Pillars: (1) functional correctness, (2) negative security boundaries (401 Unauthorized, 403 Forbidden, 404 Not Found), (3) schema contracts and response redaction, and (4) database state invariants. Furthermore, wrapping tests in try/finally blocks ensures that test artifacts (temporary auth sessions, test records, enrollments) are purged even when assertions fail, maintaining database determinism and idempotency across test executions.',
    },

    // Question 8: Topic 9 - Understanding the Complete Backend Flow (10-Step Lifecycle & Status Codes)
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'When an authenticated Course Creator sends PATCH /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId/content, how does the request flow through the 10-step backend lifecycle, and what does each failure status code (401, 403, 404, 422, 500) indicate?',
      codeSnippet: `// 10-Step Pipeline Flow:
// 1. TLS/Socket -> 2. Security Middleware -> 3. Body Parsing -> 
// 4. Route Matching -> 5. Authenticate (JWT) -> 6. Authorize (RBAC) -> 
// 7. Controller -> 8. Service (Validation & Ownership) -> 
// 9. MongoDB/Mongoose Query -> 10. Response Serialization / Central Error Handler`,
      order: 7,
      options: [
        {
          _id: q8Opt1,
          text: 'The request passes sequentially through global security middleware (rate limit, cors, helmet), body parsing, JWT authentication (401 if missing/invalid), RBAC authorization (403 if not creator/admin), controller parameter extraction, service domain validation and ownership check (404 if course/topic missing or owned by another creator; 422 if payload invalid), database update, and JSON serialization (500 if unexpected server error caught by centralized error middleware).',
          order: 0,
        },
        {
          _id: q8Opt2,
          text: 'The request executes database queries first at the TCP socket layer, and then sends the response to Express to determine which route should handle the authentication.',
          order: 1,
        },
        {
          _id: q8Opt3,
          text: 'HTTP 401 indicates that the MongoDB database has run out of connections, while HTTP 500 indicates that the client provided an invalid email address.',
          order: 2,
        },
        {
          _id: q8Opt4,
          text: 'Express routes execute in random order concurrently, and the first route handler that finishes sends its response while discarding all middleware.',
          order: 3,
        },
      ],
      correctOptionId: q8Opt1,
      explanation: 'A well-architected Express + MongoDB request follows a deterministic 10-step lifecycle: (1) TCP/TLS arrival, (2) Global security middleware (Helmet, CORS, rate limiting), (3) Body parsing and NoSQL sanitization, (4) Route matching, (5) Authentication (authenticate checks JWT; returns 401 Unauthorized if invalid), (6) Authorization (authorize checks role; returns 403 Forbidden if wrong role), (7) Controller unpacks params and calls service, (8) Service validates input (422 Unprocessable Entity or 400 Bad Request) and checks resource ownership (404 Not Found if missing or owned by another creator), (9) Mongoose executes atomic update against MongoDB, and (10) Controller serializes JSON response (200 OK) or delegates unhandled exceptions to centralized error middleware (500 Internal Server Error).',
    },
  ];
}

async function run() {
  console.log('===================================================================');
  console.log('=== LearnSphere — Create Module 8 Mastery Quiz                  ===');
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
    // 2. Check for existing assessment for Module 8
    console.log('2. Checking for existing assessment for Module 8...');
    const existing = await Assessment.findOne({
      courseId: COURSE_ID,
      moduleId: MODULE_8_ID,
      title: 'Module 8 Quiz: Practical Backend Project',
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
      title: 'Module 8 Quiz: Practical Backend Project',
      description: 'Mastery quiz testing practical backend architecture across database schema design (embedding vs referencing), modular Separation of Concerns (controllers vs services), secure registration and dual-token authentication, nested CRUD scoping and ObjectId validation, two-stage authorization pipelines (RBAC and resource ownership), defense in depth (global middleware vs domain validation), the four pillars of automated API testing with negative security boundaries, and the complete 10-step request-response lifecycle with status code diagnostics.',
      type: 'topic',
      moduleId: MODULE_8_ID,
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
    // Clean up temporary creator login session created during this run
    console.log('\n4. Cleaning up temporary creator login session...');
    await RefreshSession.deleteMany({ userId: creatorUser.id || creatorUser._id });
    console.log('✓ Cleanup complete.');
  }
}

run().then(() => {
  console.log('\n===================================================================');
  console.log('=== Module 8 Assessment Creation Completed Successfully         ===');
  console.log('===================================================================');
  process.exit(0);
}).catch((err) => {
  console.error('Fatal error during execution:', err);
  process.exit(1);
});
