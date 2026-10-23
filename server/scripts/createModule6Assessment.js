/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Creation Script: Module 6 Mastery Quiz
 * Course: Backend Development with Node.js, Express & MongoDB (6abe9dc2f15c2b4f6008ac1c)
 * Module 6: Module 6 — Authentication and Authorization (6abe9dd6f15c2b4f6008ac4f)
 * Anchor Topic: Secure Logout and Token Revocation (6abe9ddaf15c2b4f6008ac58)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from '../config/db.js';
import Assessment from '../models/Assessment.js';
import RefreshSession from '../models/RefreshSession.js';

const BASE_URL = 'http://localhost:5000';
const COURSE_ID = '6abe9dc2f15c2b4f6008ac1c';
const MODULE_6_ID = '6abe9dd6f15c2b4f6008ac4f';
const ANCHOR_TOPIC_ID = '6abe9ddaf15c2b4f6008ac58';

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
    // Question 1: Topic 1 - Authentication vs Authorization
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'In a production RESTful API, how do Authentication and Authorization differ in terms of purpose, execution order, and standard HTTP response status codes when an access check fails?',
      codeSnippet: `// Express pipeline order:
// 1. Authentication ("Who are you?") -> 401 Unauthorized if invalid
// 2. Authorization ("What are you allowed to do?") -> 403 Forbidden if not permitted`,
      order: 0,
      options: [
        {
          _id: q1Opt1,
          text: 'Authentication verifies user identity ("Who are you?") and must run first, returning HTTP 401 Unauthorized when credentials or tokens are missing or invalid; Authorization verifies permissions and resource access ("What are you allowed to do?") and runs second, returning HTTP 403 Forbidden when an authenticated user lacks permission.',
          order: 0,
        },
        {
          _id: q1Opt2,
          text: 'Authorization verifies user identity and runs first, returning HTTP 403 Forbidden; Authentication verifies role permissions and runs second, returning HTTP 401 Unauthorized.',
          order: 1,
        },
        {
          _id: q1Opt3,
          text: 'Authentication and Authorization run concurrently in parallel Express middleware; if either check fails, the API returns HTTP 400 Bad Request to conceal the reason.',
          order: 2,
        },
        {
          _id: q1Opt4,
          text: 'Authentication is handled entirely in client-side React state, while Authorization is validated by sending client-selected role headers to the backend, which returns HTTP 404 Not Found on permission failure.',
          order: 3,
        },
      ],
      correctOptionId: q1Opt1,
      explanation: 'Authentication ("Who are you?") verifies user identity and must always execute before authorization so that downstream decisions are based on a verified server-side identity. When credentials or tokens are missing, invalid, or expired, the server returns HTTP 401 Unauthorized. Authorization ("What are you allowed to do?") evaluates whether the authenticated identity has the required platform role or resource ownership. When an authenticated user lacks permission, the server returns HTTP 403 Forbidden.',
    },

    // Question 2: Topic 2 - Password Hashing & bcrypt
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'Consider the following Mongoose user schema pre-save hook and login verification method. Why is checking this.isModified(\'password\') essential in the pre-save hook, and why must bcrypt.compare() be used instead of re-hashing with bcrypt.hash() and comparing with ===?',
      codeSnippet: `userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};`,
      order: 1,
      options: [
        {
          _id: q2Opt1,
          text: 'this.isModified(\'password\') prevents re-hashing an already-hashed password when updating unrelated fields (e.g., name or email), and bcrypt.compare() extracts the unique per-hash salt and work factor embedded in the stored hash to recompute and compare in constant time, whereas re-hashing with a new salt would produce a completely different hash string.',
          order: 0,
        },
        {
          _id: q2Opt2,
          text: 'this.isModified(\'password\') decrypts the user\'s password back into plaintext, and bcrypt.compare() uses reversible symmetric decryption to evaluate the credentials.',
          order: 1,
        },
        {
          _id: q2Opt3,
          text: 'this.isModified(\'password\') validates that the password contains at least one special character, and bcrypt.compare() is required because JavaScript\'s === operator cannot compare strings longer than 32 characters.',
          order: 2,
        },
        {
          _id: q2Opt4,
          text: 'this.isModified(\'password\') clears the database cache, while bcrypt.compare() sends an external RPC request to MongoDB\'s built-in cryptographic key vault to verify the password.',
          order: 3,
        },
      ],
      correctOptionId: q2Opt1,
      explanation: 'In Mongoose, a document pre(\'save\') hook fires whenever doc.save() is called. Checking this.isModified(\'password\') ensures that password hashing only executes when the password field was actually created or modified; without this check, updating unrelated fields (such as a user\'s name or bio) would re-hash the existing bcrypt hash string, permanently locking the user out. Furthermore, because bcrypt incorporates a cryptographically random salt into each hash string, calling bcrypt.hash() on the same password twice yields completely different outputs. bcrypt.compare() reads the salt and work factor embedded inside the stored hash string, hashes the candidate password using that identical salt, and compares the results safely without timing vulnerabilities.',
    },

    // Question 3: Topic 3 - Sessions vs Tokens
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'When evaluating architectural tradeoffs between traditional stateful server sessions and signed token-based authentication (such as JWTs) in a distributed backend architecture, which statement accurately reflects their state management and revocation characteristics?',
      codeSnippet: `// Stateful Sessions:
// Server stores session state in DB/Redis -> Client holds opaque session ID -> Instant revocation.
// Stateless Signed Tokens:
// Server signs claims in JWT -> Client holds token -> Verified without DB read, but harder to revoke instantly.`,
      order: 2,
      options: [
        {
          _id: q3Opt1,
          text: 'Stateful sessions require storing session state on the server or a shared cache (e.g., Redis/DB) with immediate server-controlled revocation upon session deletion, whereas stateless signed tokens contain self-contained claims verified cryptographically without database reads, making instant revocation of stateless access tokens difficult before their expiration without a token blacklist or hybrid session store.',
          order: 0,
        },
        {
          _id: q3Opt2,
          text: 'Stateless tokens automatically invalidate across all server nodes the exact millisecond a user clicks logout without requiring any server-side database operations or token tracking.',
          order: 1,
        },
        {
          _id: q3Opt3,
          text: 'Stateful server sessions cannot store any user metadata on the server, whereas JWT tokens can hold unlimited megabytes of relational database data encrypted inside the token payload.',
          order: 2,
        },
        {
          _id: q3Opt4,
          text: 'Stateless tokens are immune to theft because browsers automatically prevent any malicious script or attacker from accessing network headers or cookies.',
          order: 3,
        },
      ],
      correctOptionId: q3Opt1,
      explanation: 'Stateful sessions store active session state in a server-side store (memory, Redis, or MongoDB) and give the client only an opaque session identifier. Because session validity is checked against the database on each request, the server can revoke sessions instantly. Conversely, stateless JWTs contain self-contained claims and an HMAC or RSA signature, allowing services to verify them without querying a database. The tradeoff is that stateless access tokens remain valid until their expiration timestamp (exp), which is why production architectures (like LearnSphere) keep access tokens short-lived and pair them with database-backed refresh sessions for controlled revocation.',
    },

    // Question 4: Topic 4 - JWT Authentication
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'Analyze the anatomy of a JSON Web Token (JWT) and the following verification code. Why must sensitive data (like passwords or private keys) NEVER be placed in a standard JWT payload, and why must jwt.verify() with an explicit algorithms allowlist be used instead of jwt.decode()?',
      codeSnippet: `// LearnSphere tokenService verification pattern:
const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
  algorithms: ['HS256']
});`,
      order: 3,
      options: [
        {
          _id: q4Opt1,
          text: 'JWT Header and Payload sections are merely Base64URL-encoded (not encrypted), so anyone in possession of the token can decode and view the payload claims; jwt.verify() cryptographically validates the signature and expiration against the secret key using the specified algorithm, whereas jwt.decode() merely decodes the Base64URL payload without validating the signature or verifying that the token was issued by a trusted party.',
          order: 0,
        },
        {
          _id: q4Opt2,
          text: 'Standard JWT payloads are encrypted using 256-bit AES encryption, but jwt.decode() bypasses AES decryption by contacting a public certificate authority.',
          order: 1,
        },
        {
          _id: q4Opt3,
          text: 'The JWT payload is stripped from the token by the browser before HTTP transmission, so passwords placed in the payload would be lost; jwt.verify() re-attaches the payload using algorithms: [\'HS256\'].',
          order: 2,
        },
        {
          _id: q4Opt4,
          text: 'jwt.decode() is the recommended production verification method because it executes asynchronously, whereas jwt.verify() blocks Node.js event loop threads.',
          order: 3,
        },
      ],
      correctOptionId: q4Opt1,
      explanation: 'A JWT consists of three Base64URL-encoded parts separated by periods: Header.Payload.Signature. The payload is signed to guarantee tamper-resistance, but it is NOT encrypted; any client or interceptor can decode the payload and read its JSON contents in plaintext. Therefore, secrets, passwords, or sensitive PII must never be placed in a JWT payload. Furthermore, jwt.decode() only parses the Base64URL payload string without verifying the cryptographic signature, allowing forged tokens to pass. In contrast, jwt.verify() verifies the cryptographic signature with the server secret and enforces the specified algorithms: [\'HS256\'] allowlist to prevent algorithm-switching attacks (e.g., switching to \'none\').',
    },

    // Question 5: Topic 5 - Dual-Token Architecture & Refresh Tokens
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'In LearnSphere\'s dual-token authentication architecture, why are access tokens short-lived and transmitted via the Authorization: Bearer header, while refresh tokens are stored as SHA-256 hashes in the database and delivered in HttpOnly, Secure, SameSite cookies scoped to /api/auth?',
      codeSnippet: `res.cookie('refreshToken', refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});`,
      order: 4,
      options: [
        {
          _id: q5Opt1,
          text: 'Short-lived access tokens minimize the exposure window if intercepted in transit, while storing refresh tokens in HttpOnly cookies protects them from client-side JavaScript theft (XSS); scoping the cookie path to /api/auth ensures it is only sent during token rotation/logout, and storing only a one-way SHA-256 hash in the database prevents attackers from obtaining usable refresh tokens if the database is dumped.',
          order: 0,
        },
        {
          _id: q5Opt2,
          text: 'Access tokens are stored in localStorage so that any third-party script can easily share authentication across external websites without CORS restrictions.',
          order: 1,
        },
        {
          _id: q5Opt3,
          text: 'Storing SHA-256 hashes of refresh tokens allows the server to reverse the hash back into the user\'s plaintext password whenever a refresh request arrives.',
          order: 2,
        },
        {
          _id: q5Opt4,
          text: 'The httpOnly: true flag allows frontend React components to read and manipulate the cookie document directly via document.cookie.',
          order: 3,
        },
      ],
      correctOptionId: q5Opt1,
      explanation: 'Storing tokens in localStorage or sessionStorage exposes them to cross-site scripting (XSS) attacks. By setting httpOnly: true, client-side scripts cannot access the cookie. sameSite: \'strict\' (or \'lax\') and secure: true mitigate CSRF and ensure transmission only over HTTPS. Scoping path: \'/api/auth\' prevents the browser from sending the high-privilege refresh token on standard API requests. Storing a one-way SHA-256 hash (tokenHash) in the RefreshSession collection ensures that even if a read-only database breach occurs, attackers cannot use the stored hashes to forge valid refresh requests. Finally, keeping the access token short-lived (e.g., 15 minutes) minimizes the window of opportunity if an access token is leaked.',
    },

    // Question 6: Topic 6 - Protected Routes & Authentication Middleware
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'Review the following Express authentication middleware for protecting private routes. What potential security vulnerability or operational flaw exists in this implementation?',
      codeSnippet: `export async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] });
    // Trust client-provided userId from body if present, else token sub
    req.user = { userId: req.body.userId || payload.sub, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}`,
      order: 5,
      options: [
        {
          _id: q6Opt1,
          text: 'Falling back to req.body.userId allows an authenticated attacker to spoof another user\'s identity by injecting arbitrary userId values in the request body, bypassing tenant isolation; user identity must be derived strictly from the verified token payload (payload.sub or payload.userId) and confirmed against the active database user record.',
          order: 0,
        },
        {
          _id: q6Opt2,
          text: 'The middleware fails because authHeader.split(\' \') is unsupported in Node.js ES modules.',
          order: 1,
        },
        {
          _id: q6Opt3,
          text: 'The middleware should return HTTP 403 Forbidden instead of HTTP 401 Unauthorized when a token is expired.',
          order: 2,
        },
        {
          _id: q6Opt4,
          text: 'Calling next() inside a try block blocks the Express event loop and prevents downstream routes from sending JSON responses.',
          order: 3,
        },
      ],
      correctOptionId: q6Opt1,
      explanation: 'Security decisions and downstream tenancy must NEVER trust client-supplied identity fields from req.body, req.query, or custom headers. If req.user.userId falls back to req.body.userId, any authenticated attacker could submit { "userId": "victimId" } in their JSON body to impersonate other users (BOLA/IDOR). The middleware must set req.user.userId = payload.sub (or payload.userId) exclusively from the cryptographically verified JWT payload, and verify that the corresponding user still exists and remains active in MongoDB before invoking next().',
    },

    // Question 7: Topic 7 - Role-Based Access Control (RBAC)
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'Consider the following Role-Based Access Control (RBAC) middleware factory in LearnSphere. Why must this middleware execute strictly AFTER authenticate, and why is a fail-closed design essential?',
      codeSnippet: `export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, message: 'Unauthenticated context' });
    }

    const normalizedUserRole = req.user.role.toLowerCase();
    const hasRole = allowedRoles.map(r => r.toLowerCase()).includes(normalizedUserRole);

    if (!hasRole) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }

    next();
  };
}`,
      order: 6,
      options: [
        {
          _id: q7Opt1,
          text: 'authorize depends on a trusted, server-verified req.user attached by authenticate; running after authentication ensures identity is already proven, and a fail-closed design ensures that if the user object, role, or matching permission is missing or unrecognized, the request is immediately rejected with HTTP 403 Forbidden rather than defaulting to permissive access.',
          order: 0,
        },
        {
          _id: q7Opt2,
          text: 'authorize decrypts the user\'s password from the database, which requires authenticate to open an active MongoDB transaction.',
          order: 1,
        },
        {
          _id: q7Opt3,
          text: 'Fail-closed design means the server crashes the Node.js process and closes the TCP socket whenever a student attempts to access a creator route.',
          order: 2,
        },
        {
          _id: q7Opt4,
          text: 'Running authorize after authenticate is optional because Express automatically parses the client\'s role cookie before executing any route middleware.',
          order: 3,
        },
      ],
      correctOptionId: q7Opt1,
      explanation: 'Authorization answers "What are you allowed to do?" based on a verified identity ("Who are you?"). Therefore, authenticate must always execute first to populate req.user. If authorize ran first, req.user would be undefined. A fail-closed security architecture ensures that unless an affirmative match with an allowed role (e.g., course_creator or admin) is explicitly proven, access is denied with HTTP 403 Forbidden. Defaulting to deny prevents unauthorized access when roles are missing, misspelled, malformed, or altered.',
    },

    // Question 8: Topic 8 & 9 - Ownership Authorization & Secure Logout
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'A backend route handles updating a course draft (PUT /api/creator/courses/:courseId). Which implementation correctly enforces resource ownership to prevent Insecure Direct Object References (BOLA/IDOR), and how does secure logout complement this by invalidating user sessions?',
      codeSnippet: `// Candidate A (Ownership verification):
const course = await Course.findById(req.params.courseId);
if (!course) return res.status(404).json({ message: 'Course not found' });
if (course.creatorId.toString() !== req.user.userId.toString()) {
  return res.status(404).json({ message: 'Course not found' });
}`,
      order: 7,
      options: [
        {
          _id: q8Opt1,
          text: 'Candidate A correctly verifies that the authenticated user\'s ID matches the resource\'s owner (course.creatorId.toString() === req.user.userId.toString()) and returns 404 (or 403) to prevent unauthorized mutations and ID enumeration; correspondingly, secure logout revokes the server-side RefreshSession in MongoDB and clears the HttpOnly cookie so the session cannot be reused.',
          order: 0,
        },
        {
          _id: q8Opt2,
          text: 'Verifying ownership is unnecessary if the user has the role course_creator because any course creator is authorized to edit any course on the platform.',
          order: 1,
        },
        {
          _id: q8Opt3,
          text: 'Ownership should be checked by comparing req.body.creatorId === course.creatorId so the client can reassign course ownership dynamically on every update.',
          order: 2,
        },
        {
          _id: q8Opt4,
          text: 'Secure logout only requires calling localStorage.removeItem(\'token\') in React, as the browser automatically notifies all remote MongoDB replica sets to purge the session records.',
          order: 3,
        },
      ],
      correctOptionId: q8Opt1,
      explanation: 'Having an authorized role (such as course_creator) is not enough in multi-tenant systems; the application must verify that the specific resource belongs to the requesting user (course.creatorId.toString() === req.user.userId.toString()). Returning 404 Not Found (or 403 Forbidden) prevents Broken Object Level Authorization (BOLA/IDOR) and avoids confirming whether a private resource ID exists for unauthorized callers. In addition, simply clearing client storage is insufficient for logout; the backend must explicitly mark the RefreshSession document as revoked (revokedAt: new Date()) and clear the HttpOnly cookie using matching options (path: \'/api/auth\') to prevent replay attacks.',
    },
  ];
}

async function run() {
  console.log('===================================================================');
  console.log('=== LearnSphere — Module 6 Mastery Quiz Creation                ===');
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
    // 2. Check for existing assessment for Module 6
    console.log('2. Checking for existing assessment for Module 6...');
    const existing = await Assessment.findOne({
      courseId: COURSE_ID,
      moduleId: MODULE_6_ID,
      title: 'Module 6 Quiz: Authentication & Authorization',
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
      title: 'Module 6 Quiz: Authentication & Authorization',
      description: 'Mastery quiz testing identity verification vs permission enforcement (401 vs 403), password hashing and bcrypt work factors, stateful sessions vs signed tokens, JSON Web Token anatomy (HS256 algorithms allowlist vs unsafe decode), dual-token architecture (short-lived access tokens, SHA-256 refresh hashes, HttpOnly cookies), protected route middleware and req.user derivation, fail-closed Role-Based Access Control (RBAC), BOLA/IDOR prevention and tenancy verification, and secure server-side logout with token revocation.',
      type: 'topic',
      moduleId: MODULE_6_ID,
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
  console.log('=== Module 6 Assessment Creation Completed Successfully         ===');
  console.log('===================================================================');
  process.exit(0);
}).catch((err) => {
  console.error('Fatal error during execution:', err);
  process.exit(1);
});
