/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LearnSphere Showcase Course Creation & Workflow Verification
 *
 * Creates the primary production-style showcase course:
 * "Backend Development with Node.js, Express & MongoDB"
 * and its 8-Module, 73-Topic hierarchy strictly through the authentic
 * Course Creator and Administrator HTTP APIs.
 *
 * Real-world security & workflow rules enforced:
 * 1. Zero MongoDB direct document insertion — Uses POST /api/creator/... endpoints.
 * 2. Course Creator ownership and server-authoritative role verification.
 * 3. Status strictly preserved as 'draft'.
 * 4. Zero fake ratings, enrollment counts, XP, streaks, or gamification.
 * 5. Zero assessments created (saved for assessment phase).
 * 6. Zero detailed educational content created (saved for content phase).
 * 7. Zero YouTube video URLs created (saved for media review phase).
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from '../config/db.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import { provisionInitialAdmin } from './provisionInitialAdmin.js';

const BASE_URL = 'http://localhost:5000';

const COURSE_METADATA = {
  title: 'Backend Development with Node.js, Express & MongoDB',
  description:
    'Learn backend development from the fundamentals to building secure REST APIs using Node.js, Express.js, MongoDB, and Mongoose.',
  category: 'Backend Development',
  difficulty: 'Beginner to Intermediate',
  language: 'English',
  status: 'draft',
};

const MODULES_DATA = [
  {
    order: 1,
    title: 'Module 1 — Backend Fundamentals',
    description:
      'Foundational concepts of backend engineering, client-server models, HTTP protocol, and data exchange principles.',
    topics: [
      { order: 1, title: 'What Is Backend Development?', description: 'Overview of backend responsibilities, server runtimes, databases, and client interactions.' },
      { order: 2, title: 'Client–Server Architecture', description: 'Request-response paradigms, clients, reverse proxies, and server architectures.' },
      { order: 3, title: 'HTTP and HTTPS', description: 'HyperText Transfer Protocol fundamentals, TLS/SSL encryption, and secure network communication.' },
      { order: 4, title: 'HTTP Methods', description: 'Idempotency and semantics of GET, POST, PUT, PATCH, DELETE, and OPTIONS methods.' },
      { order: 5, title: 'HTTP Status Codes', description: 'Informational (1xx), successful (2xx), redirection (3xx), client error (4xx), and server error (5xx) responses.' },
      { order: 6, title: 'JSON and Data Exchange', description: 'JavaScript Object Notation serialization, deserialization, and payload formatting.' },
      { order: 7, title: 'REST APIs', description: 'Representational State Transfer constraints, resource-oriented URI design, and stateless communications.' },
      { order: 8, title: 'Understanding the Request–Response Cycle', description: 'Tracing an HTTP transaction from client socket through DNS, gateway, routing, and response return.' },
    ],
  },
  {
    order: 2,
    title: 'Module 2 — Node.js Fundamentals',
    description:
      'Core architecture of the Node.js runtime, asynchronous JavaScript, packages, environment variables, and basic servers.',
    topics: [
      { order: 1, title: 'What Is Node.js?', description: 'JavaScript outside the browser, V8 execution engine, and server-side runtime characteristics.' },
      { order: 2, title: 'Node.js Runtime and Architecture', description: 'The single-threaded event loop, libuv worker threads, non-blocking I/O, and call stack execution.' },
      { order: 3, title: 'Installing Node.js and npm', description: 'Version managers (nvm), runtime installation, and environment path configuration.' },
      { order: 4, title: 'npm and package.json', description: 'Dependency management, semantic versioning (semver), scripts, and lockfiles.' },
      { order: 5, title: 'CommonJS and ES Modules', description: 'Module import/export patterns, package type definitions, and interop between require and import.' },
      { order: 6, title: 'Asynchronous JavaScript', description: 'Callbacks, event emitters, concurrency, and avoiding callback hell in server logic.' },
      { order: 7, title: 'Promises and async/await', description: 'Microtask queue mechanics, promise states, chaining, and clean asynchronous error handling.' },
      { order: 8, title: 'Environment Variables', description: 'Configuring application environments, dotenv management, and separating secrets from code.' },
      { order: 9, title: 'Building a Simple Node.js Server', description: 'Creating an HTTP server using Node built-in http module without third-party frameworks.' },
    ],
  },
  {
    order: 3,
    title: 'Module 3 — Express.js',
    description:
      'Building structured web applications and APIs using the Express.js framework, middleware pipeline, and route handling.',
    topics: [
      { order: 1, title: 'What Is Express.js?', description: 'Minimalist web framework architecture, routing abstractions, and the middleware paradigm.' },
      { order: 2, title: 'Creating an Express Server', description: 'Initializing an application instance, mounting middleware, and starting the listener socket.' },
      { order: 3, title: 'Routes', description: 'Defining URI endpoints, method binding, and modular router structuring with express.Router.' },
      { order: 4, title: 'Route Parameters', description: 'Extracting dynamic URI path segments via req.params for resource targeting.' },
      { order: 5, title: 'Query Parameters', description: 'Parsing URL query strings via req.query for filtering, searching, and pagination.' },
      { order: 6, title: 'Middleware', description: 'Understanding next(), execution order, built-in middleware, custom middleware, and third-party plugins.' },
      { order: 7, title: 'Request and Response Objects', description: 'Inspecting request headers/body and formulating HTTP responses with appropriate status and payload.' },
      { order: 8, title: 'Error Handling', description: 'Synchronous and asynchronous error propagation, 404 catch-alls, and centralized error middleware.' },
      { order: 9, title: 'Building a Basic REST API', description: 'Combining routes, middleware, and memory data structures to assemble a working REST endpoint.' },
    ],
  },
  {
    order: 4,
    title: 'Module 4 — MongoDB and Mongoose',
    description:
      'Document databases, MongoDB data modeling, CRUD operations, and schema management with the Mongoose ODM.',
    topics: [
      { order: 1, title: 'What Is MongoDB?', description: 'NoSQL document databases, BSON format, dynamic schemas, and horizontal scaling capabilities.' },
      { order: 2, title: 'Databases, Collections and Documents', description: 'Hierarchical data organization, document IDs (_id), and collection indexing.' },
      { order: 3, title: 'MongoDB CRUD Operations', description: 'insertOne, insertMany, find, findOne, updateOne, updateMany, and delete operations in MongoDB.' },
      { order: 4, title: 'Connecting Node.js to MongoDB', description: 'Connection strings, replica sets, connection pools, and connection lifecycle handling.' },
      { order: 5, title: 'What Is Mongoose?', description: 'Object Data Modeling (ODM) abstractions, type casting, validation, and business logic encapsulation.' },
      { order: 6, title: 'Mongoose Schemas and Models', description: 'Defining schema structures, field types, timestamps, and compiling Mongoose models.' },
      { order: 7, title: 'Validation', description: 'Built-in schema validators, custom validators, required rules, and pre-validation hooks.' },
      { order: 8, title: 'Querying and Filtering', description: 'Comparison operators ($eq, $gt, $in), logical operators ($and, $or), sorting, and projections.' },
      { order: 9, title: 'References and Relationships', description: 'Normalized vs embedded data modeling, ObjectId references, and query population with .populate().' },
    ],
  },
  {
    order: 5,
    title: 'Module 5 — Building REST APIs',
    description:
      'Production REST API architecture, controllers, services, input validation, pagination, and testing.',
    topics: [
      { order: 1, title: 'REST API Architecture', description: 'Layered architecture patterns: separation of routes, controllers, services, and data models.' },
      { order: 2, title: 'Controllers', description: 'Handling HTTP requests, extracting validated inputs, coordinating services, and formulating HTTP responses.' },
      { order: 3, title: 'Services', description: 'Encapsulating reusable business rules, domain calculations, and database interactions independent of HTTP.' },
      { order: 4, title: 'Routes and API Organization', description: 'Organizing REST endpoints by resource domain, URL versioning, and route indexers.' },
      { order: 5, title: 'CRUD API Implementation', description: 'Building full Create, Read, Update, and Delete endpoints for a database entity.' },
      { order: 6, title: 'Input Validation', description: 'Validating payload formats, data types, and required fields using express-validator.' },
      { order: 7, title: 'Error Handling', description: 'Operational vs programmatic errors, custom error classes, and consistent API error JSON formats.' },
      { order: 8, title: 'Pagination', description: 'Offset-based and cursor-based pagination, page/limit calculations, and pagination metadata.' },
      { order: 9, title: 'Searching and Filtering', description: 'Implementing text search, category filters, and dynamic MongoDB query building.' },
      { order: 10, title: 'API Testing', description: 'Testing REST endpoints using HTTP clients, verifying status codes, headers, and payload contracts.' },
    ],
  },
  {
    order: 6,
    title: 'Module 6 — Authentication and Authorization',
    description:
      'User identity security, password hashing with bcrypt, JWT access and refresh token lifecycles, and RBAC.',
    topics: [
      { order: 1, title: 'Authentication vs Authorization', description: 'Differentiating identity verification (who you are) from permission enforcement (what you can do).' },
      { order: 2, title: 'Password Hashing', description: 'One-way cryptographic hash functions, salts, computational cost factors, and bcrypt implementation.' },
      { order: 3, title: 'Sessions vs Tokens', description: 'Stateful server-side sessions vs stateless client tokens: tradeoffs, scalability, and security models.' },
      { order: 4, title: 'JWT Authentication', description: 'JSON Web Token anatomy: header, payload, and cryptographic signature algorithms (HMAC SHA-256).' },
      { order: 5, title: 'Access Tokens and Refresh Tokens', description: 'Short-lived access tokens, long-lived refresh tokens in HttpOnly cookies, and token rotation.' },
      { order: 6, title: 'Protected Routes', description: 'Writing authentication middleware to verify Bearer tokens and attach identity to the request context.' },
      { order: 7, title: 'Role-Based Access Control', description: 'Defining student, creator, and admin roles, and enforcing server-authoritative role boundaries.' },
      { order: 8, title: 'Ownership and Resource Authorization', description: 'Verifying user tenancy and resource ownership to prevent Insecure Direct Object References (IDOR).' },
      { order: 9, title: 'Secure Logout and Token Revocation', description: 'Invalidating refresh sessions, clearing cookies, and handling token reuse/replay detection.' },
    ],
  },
  {
    order: 7,
    title: 'Module 7 — Backend Security',
    description:
      'Essential backend defenses: input sanitization, NoSQL injection prevention, CORS, rate limiting, and security headers.',
    topics: [
      { order: 1, title: 'Why Backend Security Matters', description: 'The threat landscape: defense in depth, principle of least privilege, and fail-safe defaults.' },
      { order: 2, title: 'Input Validation and Sanitization', description: 'Whitelisting allowed fields, trimming inputs, escaping special characters, and blocking mass assignment.' },
      { order: 3, title: 'NoSQL Injection', description: 'Understanding operator injection in MongoDB queries and sanitizing query parameters against $gt and $ne attacks.' },
      { order: 4, title: 'XSS and Unsafe Input', description: 'Preventing Cross-Site Scripting by properly handling untrusted inputs and avoiding raw HTML echoing.' },
      { order: 5, title: 'CORS', description: 'Cross-Origin Resource Sharing mechanics: origin checking, preflight requests, and credential restrictions.' },
      { order: 6, title: 'Rate Limiting', description: 'Protecting endpoints against brute-force and Denial-of-Service attacks using sliding-window rate limiters.' },
      { order: 7, title: 'Security Headers and Helmet', description: 'Configuring Content Security Policy, X-Content-Type-Options, HSTS, and disabling X-Powered-By.' },
      { order: 8, title: 'Secure Error Handling', description: 'Preventing information leakage, suppressing stack traces, and sanitizing error responses for clients.' },
      { order: 9, title: 'Secret and Environment Variable Management', description: 'Safely storing API keys, database credentials, and token secrets outside version control.' },
      { order: 10, title: 'Common Backend Security Mistakes', description: 'Reviewing Top 10 vulnerabilities: hardcoded credentials, missing auth checks, and default passwords.' },
    ],
  },
  {
    order: 8,
    title: 'Module 8 — Practical Backend Project',
    description:
      'End-to-end backend application development connecting architecture, database design, authentication, and security.',
    topics: [
      { order: 1, title: 'Planning the API', description: 'Defining product requirements, resource endpoints, request contracts, and HTTP status codes.' },
      { order: 2, title: 'Designing the Database', description: 'Establishing entity-relationship models, schema constraints, field indexes, and relationship keys.' },
      { order: 3, title: 'Creating the Project Structure', description: 'Structuring directories for config, models, routes, controllers, middleware, and services.' },
      { order: 4, title: 'Implementing Authentication', description: 'Building user registration, login, JWT issuance, and authentication guard middleware.' },
      { order: 5, title: 'Implementing CRUD', description: 'Writing controllers and services for managing core application data entities with MongoDB.' },
      { order: 6, title: 'Adding Authorization', description: 'Enforcing role permissions and ownership checks on sensitive modifying endpoints.' },
      { order: 7, title: 'Adding Validation and Security', description: 'Applying Helmet, CORS, rate limiting, and express-validator input sanitizers.' },
      { order: 8, title: 'Testing the API', description: 'End-to-end testing of authentication flows, authorization gates, and data persistence.' },
      { order: 9, title: 'Understanding the Complete Backend Flow', description: 'Synthesizing the entire backend journey: from network packet arrival to persistent data commit.' },
    ],
  },
];

async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const options = { method, headers };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${endpoint}`, options);
  let data = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  }
  return { status: res.status, data };
}

export async function createAndVerifyShowcaseCourse() {
  console.log('===================================================================');
  console.log('=== LearnSphere Showcase Course Creation & Workflow Verification ===');
  console.log('===================================================================\n');

  if (!isDbConnected()) {
    await connectDB();
  }

  // 1. Check if showcase course already exists
  const existingCourse = await Course.findOne({ title: COURSE_METADATA.title });
  if (existingCourse) {
    console.log(`Notice: Showcase course already exists (ID: ${existingCourse._id}).`);
    return { success: true, courseId: existingCourse._id.toString(), existing: true };
  }

  // 2. Ensure initial Administrator exists
  console.log('--- Step 1: Administrator Authentication ---');
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@learnsphere.io';
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Str0ng!Admin#Secret2026';

  let adminUser = await User.findOne({ role: 'admin' });
  if (!adminUser) {
    console.log('No administrator found. Provisioning initial platform administrator...');
    const provRes = await provisionInitialAdmin({
      email: adminEmail,
      password: adminPassword,
      name: 'Platform Administrator',
    });
    if (!provRes.success) {
      throw new Error(`Failed to provision admin: ${provRes.reason}`);
    }
  }

  // Admin login via standard HTTP endpoint
  const adminLoginRes = await apiRequest('/api/auth/login', 'POST', {
    email: adminEmail,
    password: adminPassword,
  });
  if (adminLoginRes.status !== 200) {
    throw new Error(`Admin login failed with status ${adminLoginRes.status}`);
  }
  const adminToken = adminLoginRes.data?.data?.accessToken;
  console.log('✓ Administrator authenticated successfully via POST /api/auth/login.');

  // 3. Ensure Course Creator exists
  console.log('\n--- Step 2: Course Creator Account Setup ---');
  const creatorEmail = 'faculty@learnsphere.io';
  const creatorPassword = 'Str0ng!Faculty#Secret2026';
  const creatorName = 'Backend Faculty Lead';

  let creatorUser = await User.findOne({ email: creatorEmail });
  if (!creatorUser) {
    console.log('Registering Course Creator user via standard POST /api/auth/register...');
    const regRes = await apiRequest('/api/auth/register', 'POST', {
      name: creatorName,
      email: creatorEmail,
      password: creatorPassword,
    });
    if (regRes.status !== 201) {
      throw new Error(`Course creator registration failed with status ${regRes.status}`);
    }
    const registeredId = regRes.data?.data?.user?.id;

    console.log('Promoting registered user to course_creator role via PATCH /api/admin/users/:id/role...');
    const promoteRes = await apiRequest(
      `/api/admin/users/${registeredId}/role`,
      'PATCH',
      { role: 'course_creator' },
      adminToken
    );
    if (promoteRes.status !== 200) {
      throw new Error(`Role promotion failed with status ${promoteRes.status}`);
    }
    console.log('✓ User successfully promoted to canonical role "course_creator".');
  }

  // Course Creator login via standard HTTP endpoint
  const creatorLoginRes = await apiRequest('/api/auth/login', 'POST', {
    email: creatorEmail,
    password: creatorPassword,
  });
  if (creatorLoginRes.status !== 200) {
    throw new Error(`Creator login failed with status ${creatorLoginRes.status}`);
  }
  const creatorToken = creatorLoginRes.data?.data?.accessToken;
  console.log('✓ Course Creator authenticated successfully via POST /api/auth/login.');

  // 4. Create Course via POST /api/creator/courses
  console.log('\n--- Step 3: Creating Course via POST /api/creator/courses ---');
  const createCourseRes = await apiRequest(
    '/api/creator/courses',
    'POST',
    {
      title: COURSE_METADATA.title,
      description: COURSE_METADATA.description,
      category: COURSE_METADATA.category,
    },
    creatorToken
  );

  if (createCourseRes.status !== 201) {
    throw new Error(
      `Course creation failed with status ${createCourseRes.status}: ${JSON.stringify(createCourseRes.data)}`
    );
  }

  const createdCourse = createCourseRes.data?.data?.course;
  const courseId = createdCourse.id;
  console.log(`✓ Course successfully created via API: "${createdCourse.title}" (ID: ${courseId})`);
  console.log(`  Initial Status: "${createdCourse.status}" (strictly preserved as draft)`);

  // 5. Create Modules and Topics via existing APIs
  console.log('\n--- Step 4: Creating Modules and Topics via Creator APIs ---');
  const moduleCreationResults = [];
  let totalTopicsCreated = 0;

  for (const modData of MODULES_DATA) {
    // Call POST /api/creator/courses/:courseId/modules
    const createModRes = await apiRequest(
      `/api/creator/courses/${courseId}/modules`,
      'POST',
      {
        title: modData.title,
        description: modData.description,
        order: modData.order,
      },
      creatorToken
    );

    if (createModRes.status !== 201) {
      throw new Error(
        `Failed to create module "${modData.title}" (Status ${createModRes.status}): ${JSON.stringify(createModRes.data)}`
      );
    }

    const createdModule = createModRes.data?.data?.module;
    const moduleId = createdModule.id;
    console.log(`  ✓ Created [${modData.title}] (ID: ${moduleId})`);

    const topicResults = [];
    for (const topData of modData.topics) {
      // Call POST /api/creator/courses/:courseId/modules/:moduleId/topics
      const createTopRes = await apiRequest(
        `/api/creator/courses/${courseId}/modules/${moduleId}/topics`,
        'POST',
        {
          title: topData.title,
          description: topData.description,
          order: topData.order,
        },
        creatorToken
      );

      if (createTopRes.status !== 201) {
        throw new Error(
          `Failed to create topic "${topData.title}" (Status ${createTopRes.status}): ${JSON.stringify(createTopRes.data)}`
        );
      }

      const createdTopic = createTopRes.data?.data?.topic;
      topicResults.push({ id: createdTopic.id, title: createdTopic.title, order: createdTopic.order });
      totalTopicsCreated++;
    }

    moduleCreationResults.push({
      moduleId,
      title: createdModule.title,
      order: createdModule.order,
      topicsCount: topicResults.length,
      topics: topicResults,
    });
  }

  console.log(`\n✓ Hierarchy created successfully: 8 Modules, ${totalTopicsCreated} Topics.`);

  // 6. Workflow & Security Validation
  console.log('\n--- Step 5: Workflow & Security Authorization Validation ---');

  // Test 1: Admin can see the course via GET /api/admin/courses/:id
  const adminViewRes = await apiRequest(`/api/admin/courses/${courseId}`, 'GET', null, adminToken);
  console.log(`  [Check 1] Admin view course: ${adminViewRes.status === 200 ? 'PASS (200 OK)' : 'FAIL'}`);

  // Test 2: Admin can retrieve complete course structure via GET /api/admin/courses/:id/structure
  const adminStructureRes = await apiRequest(`/api/admin/courses/${courseId}/structure`, 'GET', null, adminToken);
  const structureModules = adminStructureRes.data?.data?.modules || [];
  const structureModulesCount = structureModules.length;
  let structureTopicsCount = 0;
  for (const m of structureModules) {
    structureTopicsCount += m.topics?.length || 0;
  }
  console.log(
    `  [Check 2] Admin view structure: ${adminStructureRes.status === 200 && structureModulesCount === 8 && structureTopicsCount === 73 ? `PASS (8 modules, ${structureTopicsCount} topics)` : 'FAIL'}`
  );

  // Test 3: Course Creator can see the course via GET /api/creator/courses/:courseId
  const creatorViewRes = await apiRequest(`/api/creator/courses/${courseId}`, 'GET', null, creatorToken);
  console.log(`  [Check 3] Creator view course: ${creatorViewRes.status === 200 ? 'PASS (200 OK)' : 'FAIL'}`);

  // Test 4: Another Course Creator CANNOT view or modify this course (Leak prevention & ownership check)
  console.log('  Testing multi-creator isolation with a second Course Creator...');
  const otherCreatorEmail = 'other_faculty@learnsphere.io';
  const otherCreatorPassword = 'Str0ng!OtherFaculty#2026';
  let otherCreator = await User.findOne({ email: otherCreatorEmail });
  if (!otherCreator) {
    const oReg = await apiRequest('/api/auth/register', 'POST', {
      name: 'Unrelated Faculty',
      email: otherCreatorEmail,
      password: otherCreatorPassword,
    });
    const oId = oReg.data?.data?.user?.id;
    await apiRequest(`/api/admin/users/${oId}/role`, 'PATCH', { role: 'course_creator' }, adminToken);
  }
  const oLogin = await apiRequest('/api/auth/login', 'POST', {
    email: otherCreatorEmail,
    password: otherCreatorPassword,
  });
  const otherCreatorToken = oLogin.data?.data?.accessToken;

  const otherCreatorAccessRes = await apiRequest(`/api/creator/courses/${courseId}`, 'GET', null, otherCreatorToken);
  console.log(
    `  [Check 4] Other creator accessing resource: ${otherCreatorAccessRes.status === 404 ? 'PASS (404 Not Found - Leak Prevention)' : 'FAIL'}`
  );

  const otherCreatorPatchRes = await apiRequest(
    `/api/creator/courses/${courseId}`,
    'PATCH',
    { title: 'Hacked Title' },
    otherCreatorToken
  );
  console.log(
    `  [Check 5] Other creator modifying resource: ${otherCreatorPatchRes.status === 404 ? 'PASS (404 Not Found - Modification Blocked)' : 'FAIL'}`
  );

  // Cleanup other test creator
  await User.deleteOne({ email: otherCreatorEmail });

  // Test 5: Unauthenticated access blocked
  const unauthRes = await apiRequest(`/api/creator/courses/${courseId}`, 'GET');
  console.log(`  [Check 6] Unauthenticated access: ${unauthRes.status === 401 ? 'PASS (401 Unauthorized)' : 'FAIL'}`);

  // Test 6: Draft course NOT visible in public student catalog
  const publicCatalogRes = await apiRequest('/api/courses', 'GET');
  const publicCourses = publicCatalogRes.data?.courses || [];
  const showcaseInPublic = publicCourses.find((c) => c.id === courseId);
  console.log(
    `  [Check 7] Public catalog draft isolation: ${!showcaseInPublic && publicCourses.length === 0 ? 'PASS (Draft course hidden from public catalog)' : 'FAIL'}`
  );

  // Test 7: Public details endpoint returns 404 for draft course
  const publicDetailRes = await apiRequest(`/api/courses/${courseId}`, 'GET');
  console.log(
    `  [Check 8] Public details draft isolation: ${publicDetailRes.status === 404 ? 'PASS (404 Not Found for students)' : 'FAIL'}`
  );

  // Test 8: Content safety audit on created records
  const dbCourse = await Course.findById(courseId).lean();
  const dbModules = await Module.find({ courseId }).sort({ order: 1 }).lean();
  const dbTopics = await Topic.find({ courseId }).sort({ order: 1 }).lean();

  let hasEducationalContent = false;
  let hasYouTubeUrl = false;
  for (const t of dbTopics) {
    if (t.content?.explanation && t.content.explanation.length > 0) hasEducationalContent = true;
    if (t.videos?.english || t.videos?.telugu || t.videos?.hindi) hasYouTubeUrl = true;
  }

  console.log(`  [Check 9] Course status in DB: ${dbCourse.status === 'draft' ? 'PASS ("draft")' : 'FAIL'}`);
  console.log(`  [Check 10] Zero detailed educational content: ${!hasEducationalContent ? 'PASS (Confirmed)' : 'FAIL'}`);
  console.log(`  [Check 11] Zero YouTube URLs: ${!hasYouTubeUrl ? 'PASS (Confirmed)' : 'FAIL'}`);
  console.log(`  [Check 12] Total modules in DB: ${dbModules.length === 8 ? 'PASS (8 modules)' : 'FAIL'}`);
  console.log(`  [Check 13] Total topics in DB: ${dbTopics.length === 73 ? 'PASS (73 topics)' : 'FAIL'}`);

  return {
    success: true,
    courseId,
    courseTitle: dbCourse.title,
    modulesCount: dbModules.length,
    topicsCount: dbTopics.length,
    modules: moduleCreationResults,
  };
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  createAndVerifyShowcaseCourse()
    .then(async (res) => {
      console.log('\n===================================================================');
      console.log('Showcase Course Provisioning & Verification Finished Successfully.');
      console.log(`Course ID: ${res.courseId}`);
      console.log(`Modules:   ${res.modulesCount}`);
      console.log(`Topics:    ${res.topicsCount}`);
      console.log('===================================================================\n');
      try {
        await mongoose.disconnect();
      } catch {}
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('\nFatal error in showcase course provisioning:', err);
      try {
        await mongoose.disconnect();
      } catch {}
      process.exit(1);
    });
}
