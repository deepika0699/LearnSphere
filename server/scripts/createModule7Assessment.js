/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Creation Script: Module 7 Mastery Quiz
 * Course: Backend Development with Node.js, Express & MongoDB (6abe9dc2f15c2b4f6008ac1c)
 * Module 7: Module 7 — Backend Security (6abe9ddaf15c2b4f6008ac59)
 * Anchor Topic: Common Backend Security Mistakes (6abe9ddef15c2b4f6008ac63)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from '../config/db.js';
import Assessment from '../models/Assessment.js';
import RefreshSession from '../models/RefreshSession.js';

const BASE_URL = 'http://localhost:5000';
const COURSE_ID = '6abe9dc2f15c2b4f6008ac1c';
const MODULE_7_ID = '6abe9ddaf15c2b4f6008ac59';
const ANCHOR_TOPIC_ID = '6abe9ddef15c2b4f6008ac63';

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
    // Question 1: Topic 1 & 2 - Input Validation and Safe Handling of Untrusted Data
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'Why is strict server-side validation (enforcing primitive types, string length caps, and integer ranges) required on all API request data, and why can client-side validation never be trusted as a security boundary?',
      codeSnippet: `// Express profile update input validation:
function validateProfileInput(data) {
  const errors = [];
  if (typeof data.displayName !== 'string' || data.displayName.trim().length === 0 || data.displayName.length > 50) {
    errors.push('displayName must be a string between 1 and 50 characters');
  }
  if (typeof data.age !== 'number' || !Number.isInteger(data.age) || data.age < 13 || data.age > 120) {
    errors.push('age must be an integer between 13 and 120');
  }
  return errors;
}`,
      order: 0,
      options: [
        {
          _id: q1Opt1,
          text: 'The client environment is entirely untrusted and outside server control; attackers easily bypass frontend forms and UI restrictions by sending raw HTTP requests with tools like curl, Postman, or automated scripts. Strict server-side validation enforces schema constraints, blocks memory exhaustion from unbounded payloads, and rejects malformed types, although input validation alone must still be complemented by output encoding and contextual escaping.',
          order: 0,
        },
        {
          _id: q1Opt2,
          text: 'Client-side validation encrypts form fields using the browser\'s TLS session keys, making backend validation necessary only when requests bypass HTTPS.',
          order: 1,
        },
        {
          _id: q1Opt3,
          text: 'Server-side validation is solely required to format JSON data for legacy mobile operating systems, as Express automatically blocks all malformed types at the network socket layer.',
          order: 2,
        },
        {
          _id: q1Opt4,
          text: 'Validating input on the server is obsolete because modern NoSQL databases automatically convert all incoming payloads into safe strings.',
          order: 3,
        },
      ],
      correctOptionId: q1Opt1,
      explanation: 'Because the client environment is completely untrusted, attackers can bypass any browser form validation by sending raw HTTP requests using curl, scripts, or Postman. Server-side validation is the foundational first line of defense: it validates primitive data types, enforces string length boundaries (preventing memory exhaustion and buffer inflation), and verifies numeric ranges before data reaches database queries or business logic. However, input validation alone is not a comprehensive defense; it must be paired with output encoding, query parameterization, and authorization to achieve defense in depth.',
    },

    // Question 2: Topic 3 - NoSQL Injection and Safe Query Construction
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'How can an attacker exploit the MongoDB/Express login endpoint above using NoSQL operator injection, and what multi-layered defenses prevent this vulnerability?',
      codeSnippet: `// Express authentication endpoint:
app.post('/api/auth/login', async (req, res) => {
  // Untrusted client input passed into query:
  const user = await User.findOne({
    email: req.body.email,
    password: req.body.password
  });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  // ...
});`,
      order: 1,
      options: [
        {
          _id: q2Opt1,
          text: 'If the client submits a JSON body with { "password": { "$ne": "" } }, Express parses it as an object and MongoDB treats $ne as an operator, matching any document with a non-empty password; defenses require verifying primitive string types (e.g., typeof req.body.password === \'string\'), sanitizing payloads with express-mongo-sanitize to strip $-prefixed keys, and verifying passwords via bcrypt.compare() rather than direct database query filtering.',
          order: 0,
        },
        {
          _id: q2Opt2,
          text: 'The attacker submits SQL syntax like \' OR 1=1 -- which forces MongoDB\'s memory engine to dump all collection documents to stdout.',
          order: 1,
        },
        {
          _id: q2Opt3,
          text: 'Mongoose automatically converts nested objects starting with $ into empty strings, making operator injection impossible in Node.js applications.',
          order: 2,
        },
        {
          _id: q2Opt4,
          text: 'NoSQL operator injection only affects applications using native C++ database drivers; Mongoose models automatically execute query validation that blocks all MongoDB comparison operators.',
          order: 3,
        },
      ],
      correctOptionId: q2Opt1,
      explanation: 'Because Express parses incoming JSON payloads directly into JavaScript objects via express.json(), an attacker can submit { "email": "admin@learnsphere.io", "password": { "$ne": "" } }. MongoDB interprets $ne as the "not equal" query operator, returning the admin document because any password hash is not an empty string. Robust defenses require defense in depth: (1) verifying primitive string types, (2) sanitizing request bodies with express-mongo-sanitize to remove $-prefixed keys, and (3) architecturally never querying passwords directly in MongoDB filters—instead, query only by email and verify the password using bcrypt.compare().',
    },

    // Question 3: Topic 1 & 10 - Authentication versus Authorization
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'In the Express route pipeline above, how do authentication, role-based authorization, and resource ownership checks distinctly divide responsibilities, and why does successful authentication not grant authorization?',
      codeSnippet: `// Express route definition:
router.delete('/api/creator/courses/:courseId',
  authenticate,
  authorize('admin', 'course_creator'),
  checkCourseOwnership,
  courseController.deleteCourse
);`,
      order: 2,
      options: [
        {
          _id: q3Opt1,
          text: 'Authentication verifies identity (\'who you are\') and returns 401 Unauthorized if invalid or expired; role authorization evaluates platform permissions (\'what role you possess\') and returns 403 Forbidden if insufficient; and ownership checks enforce tenant isolation (\'do you own this resource\'); authenticating proves identity but grants zero automatic rights to access restricted roles or alter resources owned by others.',
          order: 0,
        },
        {
          _id: q3Opt2,
          text: 'Authentication and authorization are synonymous terms for checking password hashes, while ownership checks are handled automatically by HTTP cookies.',
          order: 1,
        },
        {
          _id: q3Opt3,
          text: 'Possessing a cryptographically valid JWT automatically satisfies authorization and ownership because JWT signatures grant universal write permissions across all collections.',
          order: 2,
        },
        {
          _id: q3Opt4,
          text: 'Ownership checks must execute before authentication so that unauthenticated requests do not consume database query bandwidth.',
          order: 3,
        },
      ],
      correctOptionId: q3Opt1,
      explanation: 'Authentication ("Who are you?") validates credentials, tokens, or sessions, returning HTTP 401 Unauthorized when credentials are missing or invalid. Authorization ("What are you allowed to do?") evaluates whether the authenticated identity holds the requisite role (such as course_creator or admin), returning HTTP 403 Forbidden when permissions are lacking. Resource ownership checks enforce multi-tenant isolation, ensuring that even an authorized creator cannot mutate resources owned by a peer. Proving identity via authentication establishes who the caller is, but does not grant broad authorization across arbitrary routes or tenant data.',
    },

    // Question 4: Topic 10 - Broken Access Control, Ownership Checks, and Role Enforcement (BOLA/IDOR)
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'What broken access control flaw (Broken Object Level Authorization / IDOR) exists in this course update handler, and what is the secure implementation?',
      codeSnippet: `// PUT /api/creator/courses/:courseId
app.put('/api/creator/courses/:courseId', authenticate, authorize('course_creator'), async (req, res) => {
  const course = await Course.findById(req.params.courseId);
  if (!course) return res.status(404).json({ message: 'Course not found' });
  
  // Vulnerable update without ownership verification:
  Object.assign(course, req.body);
  await course.save();
  return res.json({ success: true, course });
});`,
      order: 3,
      options: [
        {
          _id: q4Opt1,
          text: 'The handler checks that the user has the \'course_creator\' role but never checks whether course.creatorId matches req.user.userId, allowing any creator to overwrite another creator\'s courses; the handler must verify course.creatorId.toString() === req.user.userId.toString() (or admin privileges) and return 404 (or 403) to prevent unauthorized mutations and resource ID enumeration.',
          order: 0,
        },
        {
          _id: q4Opt2,
          text: 'The route is secure because authorize(\'course_creator\') guarantees that all course creators share mutual administrative ownership over all platform courses.',
          order: 1,
        },
        {
          _id: q4Opt3,
          text: 'The vulnerability is that Course.findById() does not support Express route parameters unless they are passed through query strings.',
          order: 2,
        },
        {
          _id: q4Opt4,
          text: 'The handler should accept req.body.creatorId from the client and reassign course ownership dynamically on every update request.',
          order: 3,
        },
      ],
      correctOptionId: q4Opt1,
      explanation: 'This represents Broken Object Level Authorization (BOLA/IDOR), the #1 API security vulnerability in the OWASP Top 10. While the route verifies that the requester has the "course_creator" role, having that role does not grant permission to edit another creator\'s courses. Any authenticated creator could provide a competitor\'s courseId in the URL and overwrite its title or lessons. The backend must explicitly verify resource ownership: if (course.creatorId.toString() !== req.user.userId.toString()) return res.status(404).json({ message: \'Course not found\' });. Returning 404 Not Found (or 403 Forbidden) prevents unauthorized updates and avoids confirming the existence of private resources.',
    },

    // Question 5: Topic 2 - Mass-Assignment Protection and Allowlisted Fields
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'Why is passing raw req.body into User.findByIdAndUpdate() vulnerable to mass assignment, and what is the standard defense in Node.js/Mongoose backends?',
      codeSnippet: `// PATCH /api/users/profile
app.patch('/api/users/profile', authenticate, async (req, res) => {
  // Vulnerable pattern:
  // const updatedUser = await User.findByIdAndUpdate(req.user.userId, req.body, { new: true, runValidators: true });
});`,
      order: 4,
      options: [
        {
          _id: q5Opt1,
          text: 'An attacker can include elevated fields in their JSON body (such as role: \'admin\', isVerified: true, or credits: 1000) that Mongoose persists to the database, resulting in unauthorized privilege escalation; developers must strictly allowlist permitted update fields (e.g., destructuring const { bio, displayName } = req.body) and update only those specific properties.',
          order: 0,
        },
        {
          _id: q5Opt2,
          text: 'Passing req.body causes Mongoose to execute arbitrary C++ code on the MongoDB server, leading to database-level remote code execution.',
          order: 1,
        },
        {
          _id: q5Opt3,
          text: 'runValidators: true automatically discards any property not explicitly listed in the HTTP request query parameters, preventing mass assignment.',
          order: 2,
        },
        {
          _id: q5Opt4,
          text: 'Mass assignment only affects SQL databases with auto-incrementing primary keys; MongoDB document collections are immune to unauthorized field modifications.',
          order: 3,
        },
      ],
      correctOptionId: q5Opt1,
      explanation: 'Mass assignment occurs when client-provided request bodies are bound directly to database update or creation methods. Even if the frontend UI only displays fields for updating a user\'s name or avatar, an attacker can send { "role": "admin", "isVerified": true } via curl. Because those fields exist in the Mongoose User schema, Mongoose updates them, granting the attacker administrative privileges. Strict field allowlisting—extracting only permitted fields like const { bio, displayName } = req.body or using a validated DTO—ensures that sensitive properties can never be overwritten by client payloads.',
    },

    // Question 6: Topic 6 - Rate Limiting, Brute-Force Mitigation, and Account-Abuse Controls
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'How does tiered rate limiting mitigate brute-force attacks in Express, why is app.set(\'trust proxy\', 1) vital behind reverse proxies, and what are the inherent limits of IP-based rate limiting?',
      codeSnippet: `import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 5,                   // Limit each IP to 5 requests per window
  message: { success: false, message: 'Too many login attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});`,
      order: 5,
      options: [
        {
          _id: q6Opt1,
          text: 'Tiered rate limiting applies strict thresholds to authentication endpoints (e.g., 5 requests per 15 minutes) while allowing higher volume on public content routes; setting \'trust proxy\' allows express-rate-limit to read the real client IP from X-Forwarded-For rather than throttling the proxy IP; however, IP rate limiting alone cannot stop distributed botnets rotating thousands of residential IPs, requiring defense in depth like account lockouts and anomaly detection.',
          order: 0,
        },
        {
          _id: q6Opt2,
          text: 'Rate limiting permanently blocks any client IP that exceeds 5 requests by modifying the operating system\'s iptables firewall.',
          order: 1,
        },
        {
          _id: q6Opt3,
          text: 'Setting \'trust proxy\' permits clients to spoof their IP address indefinitely by appending arbitrary values to the Referer header.',
          order: 2,
        },
        {
          _id: q6Opt4,
          text: 'Rate limiting is only necessary for GET requests because browsers automatically throttle POST requests to one attempt per minute.',
          order: 3,
        },
      ],
      correctOptionId: q6Opt1,
      explanation: 'Tiered rate limiting applies tight limits on sensitive endpoints (such as login and password resets) to protect against credential stuffing and brute-force attacks, while allowing higher limits on standard API routes. When deployed behind reverse proxies (like Cloudflare, NGINX, or AWS ALB), Express must set app.set(\'trust proxy\', 1) so that rate limiters inspect the genuine client IP from X-Forwarded-For rather than treating all incoming traffic as originating from the proxy\'s single IP. However, IP-based rate limiting is not an absolute barrier: attackers can distribute attacks across botnets using thousands of residential proxies. Therefore, defense in depth requires pairing rate limiting with account lockouts, bcrypt work factors, and monitoring.',
    },

    // Question 7: Topic 8 & 9 - Secure Error Handling, Secret Management, and Sensitive-Log Prevention
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'Why is production error sanitization vital for backend security, and what practices govern server-side secret management and diagnostic logging?',
      codeSnippet: `// Express centralized error middleware:
app.use((err, req, res, next) => {
  logger.error(err.message, {
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;
  res.status(statusCode).json({ success: false, message });
});`,
      order: 6,
      options: [
        {
          _id: q7Opt1,
          text: 'Returning raw error details or stack traces exposes database schemas, library versions, and file paths to attackers; production error handlers must return generic messages for 500 errors, log diagnostics internally while redacting sensitive tokens and passwords, and load secrets from environment variables that fail fast on server startup if unconfigured.',
          order: 0,
        },
        {
          _id: q7Opt2,
          text: 'Stack traces and database error objects should always be returned in HTTP 500 responses in production so that API consumers can debug database indexing issues independently.',
          order: 1,
        },
        {
          _id: q7Opt3,
          text: 'Secret keys like JWT_ACCESS_SECRET should be committed to Git inside .env.example so that all microservices use identical fallback keys across environments.',
          order: 2,
        },
        {
          _id: q7Opt4,
          text: 'Logging complete Authorization headers, passwords, and refresh tokens in server console logs is recommended because Node.js automatically encrypts stdout streams.',
          order: 3,
        },
      ],
      correctOptionId: q7Opt1,
      explanation: 'Leaking internal errors (such as Mongoose CastErrors, query syntax errors, or stack traces) provides attackers with information about internal file paths, database architectures, and dependencies. In production, centralized error middleware must return generic messages (e.g., "Internal server error") for 500 errors. Diagnostics should be logged internally, with strict redaction of sensitive credentials (passwords, JWTs, refresh tokens, API keys). Furthermore, secrets must never be committed to Git; they must be managed via environment variables with fail-fast startup validation that prevents the server from booting if required secrets are missing.',
    },

    // Question 8: Topic 1, 7 & 10 - Security Testing, Fail-Closed Behavior, and Defense in Depth
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'Why is a \'fail-closed\' security architecture crucial in backend systems, and how does the principle of Defense in Depth apply when combining controls like Helmet, CORS, and authentication middleware?',
      codeSnippet: `// Role authorization middleware:
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    next();
  };
}`,
      order: 7,
      options: [
        {
          _id: q8Opt1,
          text: 'A fail-closed design defaults to denying access unless every required check affirmatively passes, preventing unauthorized access when null values, missing fields, or unexpected exceptions occur; Defense in Depth establishes multiple independent defensive layers so that if one control (such as CORS or Helmet) is bypassed or inapplicable, subsequent layers (such as authentication and authorization) still prevent compromise.',
          order: 0,
        },
        {
          _id: q8Opt2,
          text: 'Fail-closed means that when an authorization error occurs, the server grants administrative access to prevent downtime for end users.',
          order: 1,
        },
        {
          _id: q8Opt3,
          text: 'Configuring Helmet security headers completely eliminates the need for input validation, authentication, and database permissions.',
          order: 2,
        },
        {
          _id: q8Opt4,
          text: 'Defense in Depth requires hosting the backend across three separate cloud providers simultaneously for every HTTP request.',
          order: 3,
        },
      ],
      correctOptionId: q8Opt1,
      explanation: 'A fail-closed (or default-deny) architecture ensures that unless a caller affirmatively satisfies all authentication, role, and permission requirements, access is refused with 401 or 403. If req.user is undefined, req.user.role is null, or an unhandled condition arises, the system denies access rather than falling through to privileged logic. The principle of Defense in Depth recognizes that no single defensive control is infallible: Helmet manages browser HTTP headers, CORS governs browser cross-origin read restrictions, rate limiting controls request velocity, input validation sanitizes data, and authorization enforces resource boundaries. Even if an attacker uses curl to bypass CORS and Helmet, the server\'s authentication, authorization, and validation layers remain intact.',
    },
  ];
}

async function run() {
  console.log('===================================================================');
  console.log('=== LearnSphere — Create Module 7 Mastery Quiz                  ===');
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
    // 2. Check for existing assessment for Module 7
    console.log('2. Checking for existing assessment for Module 7...');
    const existing = await Assessment.findOne({
      courseId: COURSE_ID,
      moduleId: MODULE_7_ID,
      title: 'Module 7 Quiz: Backend Security',
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
      title: 'Module 7 Quiz: Backend Security',
      description: 'Mastery quiz testing input validation and untrusted data handling, NoSQL operator injection and safe query construction, authentication vs authorization (401 vs 403), broken access control and BOLA/IDOR ownership checks, mass-assignment protection with field allowlisting, tiered rate limiting and reverse proxy trust, sanitized error handling and secret management, and fail-closed defense-in-depth architecture.',
      type: 'topic',
      moduleId: MODULE_7_ID,
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
  console.log('=== Module 7 Assessment Creation Completed Successfully         ===');
  console.log('===================================================================');
  process.exit(0);
}).catch((err) => {
  console.error('Fatal error during execution:', err);
  process.exit(1);
});
