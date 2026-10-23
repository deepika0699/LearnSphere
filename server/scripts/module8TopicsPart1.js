/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LearnSphere Module 8 — Practical Backend Project Content (Part 1: Topics 1–5)
 */

export const module8TopicsPart1 = [
  // =========================================================================
  // TOPIC 1: Planning the API
  // =========================================================================
  {
    topicId: '6abe9ddff15c2b4f6008ac65',
    title: 'Planning the API',
    content: {
      explanation:
        'Before writing a single line of Express or Mongoose code, professional backend engineers start by planning the API contract. API planning defines what resources the system manages, which user roles can interact with each resource, what HTTP endpoints and status codes will be exposed, and how requests and responses are structured. Skipping the planning phase leads to inconsistent URL naming, missing authorization checks, and painful database rewrites mid-project. In this practical capstone module, you will design and build a complete, secure backend architecture step by step—starting with a clear API specification that mirrors how LearnSphere itself is engineered.',
      sections: [
        {
          heading: 'Learning Objectives',
          body: `- Translate high-level product requirements into concrete backend domain resources and relationships.
- Define actor roles (\`student\`, \`course_creator\`, \`admin\`) and map their exact permissions in an API access matrix.
- Design RESTful endpoint tables with consistent plural resource nouns, HTTP methods, and status codes.
- Standardize JSON request and response envelopes for both successful operations and error states.
- Identify non-functional requirements such as pagination, filtering, rate limiting, and ownership rules before coding.`,
          order: 0,
        },
        {
          heading: 'Core Terminology',
          body: `- **API Contract (Specification)**: A formal agreement between the backend server and client applications defining every endpoint path, HTTP method, request payload, response structure, and status code.
- **Domain Resource**: A core noun or entity managed by the backend (such as \`User\`, \`Course\`, \`Module\`, \`Topic\`, or \`Note\`).
- **Role Permission Matrix**: A table mapping each system role (\`student\`, \`course_creator\`, \`admin\`) against every API action to clarify who can create, read, update, or delete each resource.
- **Response Envelope**: A consistent top-level JSON structure—such as \`{ success, message, data }\`—used across all endpoints so frontend clients can parse responses predictably.
- **Idempotency**: The property of an HTTP operation where making the same request multiple times produces the same server state as making it once (e.g., \`GET\`, \`PUT\`, and \`DELETE\`).`,
          order: 1,
        },
        {
          heading: 'Step 1: Identifying Domain Resources and Actors',
          body: `Every backend project begins with two questions: **Who uses the system?** and **What data entities do they interact with?**

In a learning platform backend like LearnSphere, we identify three canonical actors and four primary domain resources:

\`\`\`
Actors (Roles):
  1. student        --> Browses published courses, enrolls, reads topics, writes personal notes
  2. course_creator --> Creates draft courses, manages modules and topics, updates owned content
  3. admin          --> Manages user roles, audits platform resources, oversees system health

Core Domain Resources:
  [User] 1 ──────── * [Course] 1 ──────── * [Module] 1 ──────── * [Topic]
  (createdBy)          (courseId)            (moduleId)
\`\`\`

Writing down these relationships before coding immediately reveals critical rules:
1. Every \`Course\` belongs to a specific \`User\` (\`createdBy\`) with the \`course_creator\` role.
2. Every \`Module\` belongs to a specific \`Course\` (\`courseId\`).
3. Every \`Topic\` belongs to both a \`Module\` (\`moduleId\`) and a \`Course\` (\`courseId\`).`,
          order: 2,
        },
        {
          heading: 'Step 2: Mapping the REST Endpoint Matrix',
          body: `Once your resources and actors are defined, map them to RESTful URLs, HTTP verbs, authentication requirements, and expected status codes:

\`\`\`
+--------------------------------------------------------+--------+------------------+-------------------+
| Endpoint Path                                          | Method | Required Role    | Success Status    |
+--------------------------------------------------------+--------+------------------+-------------------+
| /api/auth/register                                     | POST   | Public           | 201 Created       |
| /api/auth/login                                        | POST   | Public           | 200 OK            |
| /api/courses                                           | GET    | Public           | 200 OK            |
| /api/creator/courses                                   | POST   | course_creator   | 201 Created       |
| /api/creator/courses/:courseId/modules                 | GET    | course_creator*  | 200 OK            |
| /api/creator/courses/:courseId/modules/:modId/topics   | GET    | course_creator*  | 200 OK            |
| /api/creator/courses/:courseId/modules/:mId/topics/:id | PATCH  | course_creator*  | 200 OK            |
| /api/admin/users/:userId/role                          | PATCH  | admin            | 200 OK            |
+--------------------------------------------------------+--------+------------------+-------------------+
(* Must also be the owning course_creator where course.createdBy === req.user.id)
\`\`\`

Notice how separating public reader routes (\`/api/courses\`), creator workspace routes (\`/api/creator/...\`), and administrative routes (\`/api/admin/...\`) makes authorization middleware clean and predictable.`,
          order: 3,
        },
        {
          heading: 'Step 3: Designing Consistent JSON Envelopes',
          body: `Frontend engineers should never have to guess whether an endpoint returns \`{ result }\`, \`{ payload }\`, or \`{ item }\`. Planning a single JSON envelope standard up front saves hours of debugging:

1. **Success Envelope (\`200 OK\` / \`201 Created\`)**:
   - \`status\`: \`"success"\`
   - \`message\`: Human-readable summary of the completed operation
   - \`data\`: Object containing the requested resource(s)

2. **Error Envelope (\`400\`, \`401\`, \`403\`, \`404\`, \`409\`, \`429\`, \`500\`)**:
   - \`status\`: \`"error"\`
   - \`message\`: Safe, actionable error description for the client (never exposing raw stack traces or database internals)

Planning your status codes alongside your envelopes ensures every failure case—such as \`400 Bad Request\` for invalid input, \`401 Unauthorized\` for missing/expired JWTs, \`403 Forbidden\` for insufficient role permissions, and \`404 Not Found\` for missing or unowned resources—is handled consistently.`,
          order: 4,
        },
        {
          heading: 'Common Beginner Mistakes',
          body: `- **Putting verbs in REST URLs**: Naming endpoints \`POST /api/createNewCourse\` or \`GET /api/getAllTopics\` instead of using standard HTTP methods on plural nouns (\`POST /api/creator/courses\`, \`GET /api/creator/courses/:courseId/modules/:moduleId/topics\`).
- **Jumping straight into code without a permission matrix**: Writing route handlers first and forgetting to decide whether a route requires ownership verification or role restrictions.
- **Returning inconsistent response shapes**: Returning an array at the root level on one endpoint (\`[...]\`) and a wrapped object (\`{ data: { topics: [...] } }\`) on another.
- **Forgetting non-happy-path status codes**: Planning only for \`200 OK\` and forgetting what happens when a duplicate email is registered (\`409 Conflict\`) or when an unowned course ID is requested (\`404 Not Found\`).`,
          order: 5,
        },
        {
          heading: 'Suggested Practice Task',
          body: `1. Design a mini API specification for a **Student Study Notes** feature inside LearnSphere.
2. Write down the 4 REST endpoints allowing a logged-in \`student\` to create a note on a topic, list their own notes for a course, update a note's text, and delete a note.
3. For each endpoint, document:
   - Exact URL path and HTTP method
   - Required role (\`student\`) and ownership rule (\`note.userId === req.user.id\`)
   - Expected request JSON body (for \`POST\` and \`PATCH\`)
   - Expected success status code and error status codes (\`400\`, \`401\`, \`404\`).`,
          order: 6,
        },
        {
          heading: 'Topic Summary',
          body: `- API planning defines domain resources, actor roles, endpoint paths, and JSON contracts before implementation begins.
- Grouping routes logically by access boundary (\`/api/auth\`, \`/api/courses\`, \`/api/creator\`, \`/api/admin\`) simplifies middleware attachment.
- A Role Permission Matrix prevents authorization gaps by explicitly defining what \`student\`, \`course_creator\`, and \`admin\` users can do.
- Standardized JSON response envelopes and HTTP status codes create a predictable contract between the Express backend and React frontend.`,
          order: 7,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Structured API Specification Manifest & Response Envelope Helpers',
        language: 'javascript',
        code: `/**
 * Standardized API Response Helpers planned before building controllers.
 * Ensures every controller in the project returns a consistent JSON envelope.
 */

export function sendSuccess(res, statusCode, message, data = {}) {
  return res.status(statusCode).json({
    status: 'success',
    message,
    data,
  });
}

export function sendError(res, statusCode, message) {
  return res.status(statusCode).json({
    status: 'error',
    message,
  });
}

// Example API Route Contract Definition used during project planning
export const API_CONTRACT = Object.freeze({
  AUTH_LOGIN: {
    method: 'POST',
    path: '/api/auth/login',
    access: 'public',
    requestBody: ['email', 'password'],
    successStatus: 200,
    errorStatuses: [400, 401, 429],
  },
  UPDATE_TOPIC_CONTENT: {
    method: 'PATCH',
    path: '/api/creator/courses/:courseId/modules/:moduleId/topics/:topicId/content',
    access: 'course_creator (owner only)',
    requestBody: ['content', 'codeExamples', 'importantPoints', 'externalReferences', 'videos', 'images'],
    successStatus: 200,
    errorStatuses: [400, 401, 403, 404],
  },
});`,
        explanation:
          'Creating response helper functions and documenting route contracts up front guarantees that every endpoint across the project returns uniform JSON envelopes and status codes.',
      },
      {
        title: 'Planning Resource Ownership and Visibility Rules in Code',
        language: 'javascript',
        code: `/**
 * Domain Access Policy Matrix for Course Resources
 * Explicitly codifies the rules planned during the API design phase.
 */

export function canReadCourse(user, course) {
  if (!course) return false;

  // Published courses are readable by the public and any student
  if (course.status === 'published') {
    return true;
  }

  // Draft courses require an authenticated user
  if (!user) return false;

  // Admins can inspect any course; course_creators can only read their own draft courses
  if (user.role === 'admin') return true;
  if (user.role === 'course_creator' && String(course.createdBy) === String(user.id)) {
    return true;
  }

  return false;
}`,
        explanation:
          'Translating planned visibility rules into pure policy functions makes it easy to verify how draft vs. published resources behave for anonymous users, students, course creators, and admins.',
      },
    ],
    importantPoints: [
      'Always plan domain resources, actor roles, and endpoint contracts before writing Express routes or Mongoose schemas.',
      'Use plural nouns for REST resource paths (/api/courses, /api/creator/courses/:courseId/modules) and let HTTP methods (GET, POST, PATCH, DELETE) express the action.',
      'LearnSphere enforces three canonical user roles: student, course_creator, and admin.',
      'Separate public routes (/api/courses) from role-protected creator routes (/api/creator/...) and admin routes (/api/admin/...).',
      'Standardize JSON response envelopes ({ status, message, data }) so client applications can handle responses and errors uniformly.',
      'Document both role requirements and resource ownership rules (such as course.createdBy === req.user.id) for every mutating endpoint.',
    ],
    externalReferences: [
      {
        title: 'RESTful Web API Design Best Practices — Microsoft Architecture Center',
        url: 'https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design',
        source: 'Microsoft Learn',
      },
      {
        title: 'HTTP Request Methods — MDN Web Docs',
        url: 'https://developer.mozilla.org/en-us/docs/Web/HTTP/Methods',
        source: 'MDN Web Docs',
      },
      {
        title: 'HTTP Response Status Codes — MDN Web Docs',
        url: 'https://developer.mozilla.org/en-us/docs/Web/HTTP/Status',
        source: 'MDN Web Docs',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 2: Designing the Database
  // =========================================================================
  {
    topicId: '6abe9ddff15c2b4f6008ac66',
    title: 'Designing the Database',
    content: {
      explanation:
        'Once your API contract is planned, the next step in a practical backend project is designing the MongoDB database schemas with Mongoose. Good database design determines how fast your queries run, how reliably invalid data is rejected, and how cleanly parent-child relationships (such as Courses -> Modules -> Topics) are maintained. In MongoDB, schema design requires choosing between embedding sub-documents inside a single record or referencing separate collections using ObjectId foreign keys. In this topic, you will learn how to make those modeling decisions, enforce strict field constraints, and add compound indexes for production performance.',
      sections: [
        {
          heading: 'Learning Objectives',
          body: `- Decide when to embed sub-documents versus when to reference separate collections via \`ObjectId\`.
- Design hierarchical parent-child relationships across \`User\`, \`Course\`, \`Module\`, and \`Topic\` collections.
- Enforce data integrity at the database layer using Mongoose required fields, string length bounds, enums, and defaults.
- Configure compound indexes to accelerate sorted lookups and enforce uniqueness rules.
- Protect sensitive model fields (such as \`passwordHash\`) using \`select: false\` and JSON serialization transforms.`,
          order: 0,
        },
        {
          heading: 'Core Terminology',
          body: `- **Document Embedding (Denormalization)**: Nesting related sub-objects (such as a Topic's \`sections\`, \`codeExamples\`, and \`externalReferences\`) directly inside the parent document so they are fetched and updated atomically in a single query.
- **Document Referencing (Normalization)**: Storing related entities in separate MongoDB collections and linking them via \`mongoose.Schema.Types.ObjectId\` fields (such as \`moduleId\` and \`courseId\` on a \`Topic\`).
- **Compound Index**: A MongoDB index spanning two or more fields (such as \`{ moduleId: 1, order: 1 }\`) that allows the database to filter and sort records without scanning the entire collection.
- **Schema Enum Constraint**: A validation rule restricting a string field to a fixed whitelist of allowed values (e.g., \`role: ['student', 'course_creator', 'admin']\` or \`status: ['draft', 'published']\`).
- **Sub-schema**: A dedicated Mongoose \`Schema\` object defining the structure and validation rules of nested array elements inside a parent schema.`,
          order: 1,
        },
        {
          heading: 'Embedding vs. Referencing in LearnSphere',
          body: `A key decision in MongoDB schema design is whether related data should live in its own collection or be embedded inside a parent document:

\`\`\`
REFERENCED COLLECTIONS (Independent lifecycle, queried separately):
  [User Collection]
         │
         ▼ (createdBy: ObjectId)
  [Course Collection]
         │
         ▼ (courseId: ObjectId)
  [Module Collection]
         │
         ▼ (courseId: ObjectId, moduleId: ObjectId)
  [Topic Collection]
         ├── content.sections: [ { heading, body, order } ]       <-- EMBEDDED
         ├── codeExamples:     [ { title, language, code, ... } ] <-- EMBEDDED
         ├── importantPoints:  [ String ]                         <-- EMBEDDED
         └── externalReferences: [ { title, url, source } ]       <-- EMBEDDED
\`\`\`

**Why reference Courses, Modules, and Topics?**
- A course listing page needs Course and Module titles without loading 73 full Topic articles into memory.
- Each Topic can be fetched or updated individually by its own \`_id\`.

**Why embed Sections, Code Examples, and External References inside Topic?**
- Sections and code examples belong exclusively to one Topic, are always rendered together when a learner opens that Topic, and stay well within MongoDB's 16 MB document limit.`,
          order: 2,
        },
        {
          heading: 'Enforcing Schema Validation and Safe Defaults',
          body: `Your Mongoose schema is the final line of defense before data is written to disk. Every field in a production schema should specify:

1. **Explicit Type**: \`String\`, \`Number\`, \`Boolean\`, \`ObjectId\`, or a typed sub-schema array.
2. **Whitespace Trimming**: \`trim: true\` on strings so accidental leading/trailing spaces are stripped automatically.
3. **Length & Numeric Bounds**: \`minlength\`, \`maxlength\`, and \`min\` constraints (e.g., \`maxlength: 200\` on titles, \`maxlength: 50000\` on explanations) to prevent oversized payloads.
4. **Strict Enums**: Restricting state fields like \`Course.status\` to \`['draft', 'published']\` and \`User.role\` to \`['student', 'course_creator', 'admin']\`.
5. **Safe Defaults**: Setting \`status: 'draft'\` on new courses so no course is ever accidentally published before its content is ready, and \`role: 'student'\` on new users so accounts start with least privilege.`,
          order: 3,
        },
        {
          heading: 'Indexing for Query Performance',
          body: `Without indexes, MongoDB must perform a **Collection Scan (\`COLLSCAN\`)**—reading every document in a collection to find matches. Designing indexes alongside your schemas ensures your queries remain fast as data grows:

- **Unique Single-Field Index**:
  - \`userSchema.index({ email: 1 }, { unique: true })\` prevents duplicate account registrations even under concurrent requests.
- **Ordered Hierarchy Compound Indexes**:
  - \`moduleSchema.index({ courseId: 1, order: 1 })\` lets Express fetch all modules for a course already sorted in sequential order.
  - \`topicSchema.index({ moduleId: 1, order: 1 })\` lets Express list all topics in a module in exact order (\`1, 2, 3...\`) in milliseconds.`,
          order: 4,
        },
        {
          heading: 'Common Beginner Mistakes',
          body: `- **Using \`mongoose.Schema.Types.Mixed\` or untyped \`Array\`**: Allowing arbitrary unvalidated objects inside arrays instead of defining a strict sub-schema with \`heading\`, \`body\`, and \`order\` constraints.
- **Embedding unbounded arrays**: Storing thousands of student enrollment records or activity logs inside an array on the \`Course\` document, which eventually hits MongoDB's 16 MB document size limit.
- **Forgetting \`select: false\` on password hashes**: Leaving \`passwordHash\` selected by default, risking accidental exposure whenever a user document is serialized to JSON.
- **Missing parent references for fast ownership checks**: Storing \`courseId\` on \`Topic\` alongside \`moduleId\` allows the server to verify that a topic belongs to the specified course and module in a single query filter (\`{ _id: topicId, courseId, moduleId }\`).`,
          order: 5,
        },
        {
          heading: 'Suggested Practice Task',
          body: `1. Design a Mongoose schema for a \`Note\` model that allows a \`student\` to save study notes on a specific \`Topic\`.
2. Include references to \`userId\` (\`User\`), \`courseId\` (\`Course\`), and \`topicId\` (\`Topic\`), plus a \`content\` string (trimmed, required, \`maxlength: 10000\`).
3. Add a compound index on \`{ userId: 1, topicId: 1 }\` so the backend can quickly retrieve a student's note for any topic.`,
          order: 6,
        },
        {
          heading: 'Topic Summary',
          body: `- Reference separate collections (\`User\`, \`Course\`, \`Module\`, \`Topic\`) when entities are queried independently or grow in number.
- Embed sub-schemas (\`sections\`, \`codeExamples\`, \`externalReferences\`) when child data belongs strictly to one parent document and is always read together.
- Always configure \`trim\`, \`minlength\`/\`maxlength\`, \`enum\`, and least-privilege \`default\` values (\`role: 'student'\`, \`status: 'draft'\`).
- Add compound indexes matching your application's most frequent filter and sort patterns (\`{ courseId: 1, order: 1 }\` and \`{ moduleId: 1, order: 1 }\`).`,
          order: 7,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Course and Module Schemas with Referencing, Enums, and Compound Indexes',
        language: 'javascript',
        code: `import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft', // Least-privilege default: never public until explicitly published
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owning course_creator ID is required'],
      index: true,
    },
  },
  { timestamps: true }
);

const moduleSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
      maxlength: [200, 'Module title cannot exceed 200 characters'],
    },
    order: {
      type: Number,
      required: [true, 'Module order is required'],
      min: [1, 'Order must be at least 1'],
    },
  },
  { timestamps: true }
);

// Compound index for fast ordered module lookup within a course
moduleSchema.index({ courseId: 1, order: 1 });`,
        explanation:
          'This example demonstrates how Course and Module documents use ObjectId references, safe defaults (status: "draft"), strict length bounds, and compound indexing on { courseId: 1, order: 1 }.',
      },
      {
        title: 'Embedded Sub-Schemas Inside the Topic Model',
        language: 'javascript',
        code: `import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema(
  {
    heading: { type: String, trim: true, maxlength: 200, default: '' },
    body: { type: String, trim: true, maxlength: 20000, default: '' },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const codeExampleSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 200, default: '' },
    language: { type: String, trim: true, maxlength: 50, default: 'javascript' },
    code: { type: String, required: true, maxlength: 30000 },
    explanation: { type: String, trim: true, maxlength: 5000, default: '' },
  },
  { _id: true }
);

// Both courseId and moduleId are stored on Topic for single-query hierarchy verification
const topicSchema = new mongoose.Schema(
  {
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    order: { type: Number, required: true, min: 0 },
    content: {
      explanation: { type: String, trim: true, maxlength: 50000, default: '' },
      sections: { type: [sectionSchema], default: [] },
    },
    codeExamples: { type: [codeExampleSchema], default: [] },
    importantPoints: { type: [String], default: [] },
  },
  { timestamps: true }
);

topicSchema.index({ moduleId: 1, order: 1 });`,
        explanation:
          'Embedding sectionSchema and codeExampleSchema inside Topic allows the entire lesson payload to be retrieved or updated atomically while referencing courseId and moduleId preserves fast hierarchy filtering.',
      },
    ],
    importantPoints: [
      'Use ObjectId references when child entities are queried independently or can grow large (e.g., Courses -> Modules -> Topics).',
      'Use embedded sub-schemas when structured data belongs strictly to a single parent document and is always loaded together (e.g., Topic sections and codeExamples).',
      'Store both courseId and moduleId on Topic documents so hierarchy integrity ({ _id: topicId, courseId, moduleId }) can be verified in one query.',
      'Always define maxlength, minlength, trim, and enum validators in Mongoose schemas to prevent malformed data persistence.',
      'Default Course.status to "draft" and User.role to "student" to enforce safe defaults at the database level.',
      'Create compound indexes ({ courseId: 1, order: 1 } and { moduleId: 1, order: 1 }) so ordered lists do not require slow in-memory sorting.',
    ],
    externalReferences: [
      {
        title: 'Mongoose v8 Documentation — Schemas & Subdocuments',
        url: 'https://mongoosejs.com/docs/subdocs.html',
        source: 'Mongoose Docs',
      },
      {
        title: 'Data Model Design (Embedded vs. Normalized) — MongoDB Manual',
        url: 'https://www.mongodb.com/docs/manual/core/data-model-design/',
        source: 'MongoDB Documentation',
      },
      {
        title: 'Compound Indexes — MongoDB Manual',
        url: 'https://www.mongodb.com/docs/manual/core/index-compound/',
        source: 'MongoDB Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 3: Creating the Project Structure
  // =========================================================================
  {
    topicId: '6abe9ddff15c2b4f6008ac67',
    title: 'Creating the Project Structure',
    content: {
      explanation:
        'A beginner often writes an entire Express backend inside a single 1,500-line server.js file—mixing database connection setup, Mongoose schemas, JWT verification, validation rules, and route handlers together. As soon as the project grows beyond a few endpoints, a single-file server becomes impossible to test, debug, or secure. Professional Node.js backends organize code using a layered, modular directory structure where each folder has a single, clear responsibility. In this topic, you will learn how to structure an Express + MongoDB project into config, models, middleware, services, controllers, routes, and utils layers.',
      sections: [
        {
          heading: 'Learning Objectives',
          body: `- Organize a production Node.js + Express backend into distinct architectural directories.
- Explain the Single Responsibility Principle (SRP) as applied to routes, controllers, services, and models.
- Separate HTTP transport logic (controllers) from domain business logic and database queries (services).
- Configure centralized startup initialization (\`config/db.js\`, environment checks, and middleware mounting).
- Trace how a request flows cleanly through the directory structure from \`routes/\` to \`controllers/\` to \`services/\` to \`models/\`.`,
          order: 0,
        },
        {
          heading: 'Core Terminology',
          body: `- **Separation of Concerns (SoC)**: Dividing a software system into distinct layers so that each layer addresses a separate concern (HTTP parsing, security middleware, business rules, or data persistence).
- **Router Layer (\`server/routes/\`)**: Maps URL paths and HTTP verbs to their required middleware chain and target controller function.
- **Controller Layer (\`server/controllers/\`)**: Extracts data from \`req.params\`, \`req.query\`, \`req.body\`, and \`req.user\`, calls the appropriate service function, and formats the HTTP \`res\` status and JSON envelope.
- **Service Layer (\`server/services/\`)**: Implements pure business rules, ownership verification, and Mongoose database operations without directly referencing Express \`req\` or \`res\` objects.
- **Model Layer (\`server/models/\`)**: Defines Mongoose data schemas, indexes, and document serialization rules.`,
          order: 1,
        },
        {
          heading: 'The Layered Backend Directory Blueprint',
          body: `Below is the modular project structure used in LearnSphere and modern Express applications:

\`\`\`
server/
├── config/
│   └── db.js                        # MongoDB connection setup & health status
├── models/
│   ├── User.js                      # User schema (student, course_creator, admin)
│   ├── Course.js                    # Course schema (draft / published, createdBy)
│   ├── Module.js                    # Module schema (courseId, order)
│   ├── Topic.js                     # Topic schema (sections, codeExamples, references)
│   └── RefreshSession.js            # Hashed refresh token session store
├── middleware/
│   ├── authenticate.js              # Verifies JWT Bearer token & attaches req.user
│   ├── authorize.js                 # Enforces RBAC (authorizeRoles)
│   ├── sanitize.js                  # Strips dangerous characters & NoSQL operators
│   ├── rateLimiter.js               # Protects auth & API routes from floods
│   └── errorHandler.js              # Centralized 4-argument Express error middleware
├── services/
│   ├── authService.js               # Password hashing, token rotation, login logic
│   └── courseCreatorTopicService.js # Ownership check, sanitization, Topic CRUD
├── controllers/
│   ├── authController.js            # HTTP handlers for /api/auth/*
│   └── courseCreatorController.js   # HTTP handlers for /api/creator/*
├── routes/
│   ├── authRoutes.js                # Mounts auth endpoints + rate limiters
│   ├── courseRoutes.js              # Public published course catalog endpoints
│   └── courseCreatorRoutes.js       # Protected course_creator endpoints
└── server.js                        # Express app assembly & middleware pipeline
\`\`\`

Every file has a predictable home. If you need to change a database index, you open \`server/models/\`. If you need to check which roles can access a route, you open \`server/routes/\`.`,
          order: 2,
        },
        {
          heading: 'Why Separate Controllers from Services?',
          body: `Beginners often ask: *"Why not put Mongoose queries directly inside the controller?"*

Separating **controllers** from **services** provides three major engineering advantages:

1. **Thin, Readable Controllers**: Controllers focus strictly on HTTP concerns—reading \`req.params\`, calling the service, and returning \`res.status(200).json(...)\`.
2. **Reusable Business Logic**: A service function like \`verifyCreatorCourseOwnership(courseId, creatorUserId)\` can be reused across course, module, and topic operations without duplicating HTTP status logic.
3. **Easier Testing**: Services accept plain JavaScript arguments (like \`(courseId, moduleId, topicId, userId, payload)\`) and throw structured errors with \`statusCode\` properties, making them straightforward to test without mocking complex Express \`req\` and \`res\` objects.`,
          order: 3,
        },
        {
          heading: 'Assembling the Express App in server.js',
          body: `The root application file initializes the database connection and registers middleware in a strict, deterministic order:

\`\`\`
1. Load environment variables (import 'dotenv/config')
2. Connect to MongoDB (await connectDB())
3. Apply global security headers (helmet()) and CORS policy (cors())
4. Apply body parser with size limit (express.json({ limit: '100kb' }))
5. Apply global input sanitization (mongoSanitize / xss clean)
6. Mount modular routers (/api/auth, /api/courses, /api/creator, /api/admin)
7. Register 404 fallback handler for unknown routes
8. Register centralized 4-argument error handler ((err, req, res, next) => ...)
\`\`\`

Notice that the 404 fallback and centralized error handler **must** be registered last, after all routers have been mounted.`,
          order: 4,
        },
        {
          heading: 'Common Beginner Mistakes',
          body: `- **Mounting the error handler before routes**: Placing \`app.use(errorHandler)\` above \`app.use('/api/creator', creatorRouter)\`, which prevents Express from catching errors thrown inside those routes.
- **Circular imports between layers**: Importing a controller inside a model or importing \`server.js\` inside a service, causing \`undefined\` module bindings at startup.
- **Passing \`req\` and \`res\` into database services**: Coupling the service layer to Express HTTP objects instead of passing extracted parameters (\`courseId\`, \`userId\`, \`payload\`).
- **Hardcoding configuration across multiple files**: Scattering \`process.env\` lookups without validating required variables at startup.`,
          order: 5,
        },
        {
          heading: 'Suggested Practice Task',
          body: `1. Trace the layered call chain for \`GET /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId/content\`.
2. Write down the exact responsibility of each file in the chain:
   - \`server/routes/courseCreatorRoutes.js\`
   - \`server/middleware/authenticate.js\` & \`server/middleware/authorize.js\`
   - \`server/controllers/courseCreatorTopicController.js\`
   - \`server/services/courseCreatorTopicService.js\`
   - \`server/models/Topic.js\`.`,
          order: 6,
        },
        {
          heading: 'Topic Summary',
          body: `- A modular project structure divides code into \`config\`, \`models\`, \`middleware\`, \`services\`, \`controllers\`, and \`routes\`.
- Dependencies flow cleanly inward: \`routes -> controllers -> services -> models\`.
- Controllers handle HTTP request extraction and response formatting; services handle business validation, ownership checks, and database queries.
- Global security middleware is mounted before routers, while 404 and centralized error handlers are mounted last.`,
          order: 7,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Clean Layer Separation: Route -> Controller -> Service',
        language: 'javascript',
        code: `// 1. ROUTE LAYER (server/routes/courseCreatorRoutes.js)
import express from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeRoles } from '../middleware/authorize.js';
import { getTopicContentHandler } from '../controllers/courseCreatorTopicController.js';

const router = express.Router();

router.get(
  '/courses/:courseId/modules/:moduleId/topics/:topicId/content',
  authenticate,
  authorizeRoles('course_creator'),
  getTopicContentHandler
);

// 2. CONTROLLER LAYER (server/controllers/courseCreatorTopicController.js)
import { getTopicContentForCreator } from '../services/courseCreatorTopicService.js';

export async function getTopicContentHandler(req, res, next) {
  try {
    const { courseId, moduleId, topicId } = req.params;
    const creatorId = req.user.id;

    const content = await getTopicContentForCreator(courseId, moduleId, topicId, creatorId);
    return res.status(200).json({
      status: 'success',
      data: { content },
    });
  } catch (err) {
    return next(err); // Forward any operational or unexpected error to centralized errorHandler
  }
}`,
        explanation:
          'The router declares the URL and security middleware; the controller extracts HTTP parameters and delegates business logic to the service layer while forwarding errors via next(err).',
      },
      {
        title: 'Database Connection Module (server/config/db.js)',
        language: 'javascript',
        code: `import mongoose from 'mongoose';

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('FATAL: MONGODB_URI environment variable is not configured.');
  }

  await mongoose.connect(mongoUri, {
    autoIndex: true,
    serverSelectionTimeoutMS: 5000,
  });

  isConnected = true;
  console.log('Connected to MongoDB database successfully.');
}

export function isDbConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}`,
        explanation:
          'Isolating database connection logic in server/config/db.js allows both the main Express server and standalone CLI verification scripts to reuse the exact same connection lifecycle.',
      },
    ],
    importantPoints: [
      'Organize backend code by layer: config, models, middleware, services, controllers, and routes.',
      'Maintain a one-way dependency flow: routes call controllers, controllers call services, and services query models.',
      'Keep controllers thin—extract req.params, req.body, and req.user, invoke the service, and send the HTTP response.',
      'Keep services independent of Express req and res objects so business logic can be reused and tested cleanly.',
      'Mount global security middleware (Helmet, CORS, JSON body limit, sanitizer) before routes, and mount the 404 and error handlers after all routes.',
      'Use next(err) in async controllers to funnel all errors into the centralized error-handling middleware.',
    ],
    externalReferences: [
      {
        title: 'Express Application Routing & Modular Routers — Express.js Guide',
        url: 'https://expressjs.com/en/guide/routing.html',
        source: 'Express.js Official Documentation',
      },
      {
        title: 'Node.js Project Structure Best Practices — Node.js Best Practices',
        url: 'https://github.com/goldbergyoni/nodebestpractices#1-project-structure-practices',
        source: 'Node.js Best Practices',
      },
      {
        title: 'Error Handling in Express — Express.js Guide',
        url: 'https://expressjs.com/en/guide/error-handling.html',
        source: 'Express.js Official Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 4: Implementing Authentication
  // =========================================================================
  {
    topicId: '6abe9de0f15c2b4f6008ac68',
    title: 'Implementing Authentication',
    content: {
      explanation:
        'Authentication answers the question: "Who is making this request?" In a practical backend project, implementing authentication requires securely hashing passwords during registration with bcrypt, verifying credentials during login without leaking whether an email exists, issuing short-lived signed JSON Web Tokens (JWTs) for stateless API access, and managing revocable refresh sessions in MongoDB. In this topic, you will connect these building blocks into a complete, production-grade authentication workflow matching LearnSphere.',
      sections: [
        {
          heading: 'Learning Objectives',
          body: `- Implement user registration with email normalization, password strength checks, and \`bcrypt\` hashing.
- Enforce least-privilege role assignment so public registration always creates a \`student\` account.
- Build a login flow that verifies credentials in constant time and returns a uniform \`401\` error on failure.
- Issue short-lived JWT access tokens containing minimal claims (\`sub\` / \`id\` and canonical \`role\`).
- Implement an \`authenticate\` middleware that validates the \`Authorization: Bearer <token>\` header and populates \`req.user\`.`,
          order: 0,
        },
        {
          heading: 'Core Terminology',
          body: `- **Authentication (AuthN)**: The process of verifying the identity of a user or client (e.g., checking email + password or verifying a cryptographic JWT signature).
- **Bcrypt Cost Factor (Salt Rounds)**: A configurable work factor (such as \`10\` or \`12\`) that controls how computationally expensive password hashing is, protecting stored hashes against offline brute-force attacks.
- **Access Token (JWT)**: A short-lived, cryptographically signed token sent in the \`Authorization: Bearer <token>\` HTTP header to authenticate API requests.
- **Refresh Session**: A server-side database record storing a SHA-256 hash of a refresh token so long-lived sessions can be rotated or revoked upon logout.
- **Credential Enumeration Prevention**: Returning the exact same generic message (\`"Invalid email or password"\`) and HTTP \`401\` status whether the email was not found or the password was wrong.`,
          order: 1,
        },
        {
          heading: 'Registration and Login Architecture',
          body: `Let's trace the complete registration and login flow in a production Express + MongoDB backend:

\`\`\`
1. REGISTRATION (POST /api/auth/register)
   Client sends { name, email, password }
      │
      ├─► Validate & normalize email (trim + toLowerCase)
      ├─► Check duplicate email -> 409 Conflict if taken
      ├─► Hash password: await bcrypt.hash(password, 12)
      ├─► Create User with forced default role: "student" (ignore any req.body.role!)
      └─► Issue JWT Access Token + Refresh Session -> 201 Created

2. LOGIN (POST /api/auth/login)
   Client sends { email, password }
      │
      ├─► Query User.findOne({ email }).select('+passwordHash')
      ├─► Compare password: await bcrypt.compare(password, user.passwordHash)
      ├─► If missing user OR wrong password -> 401 "Invalid email or password"
      └─► Issue JWT Access Token (payload: { id, role }) -> 200 OK
\`\`\`

Notice two critical security details:
1. During registration, \`role\` is **never** read from \`req.body\`. Public sign-ups always receive \`role: 'student'\`.
2. During login, because \`passwordHash\` has \`select: false\` in the Mongoose schema, the login service explicitly calls \`.select('+passwordHash')\` to load the hash for \`bcrypt.compare()\`, and then strips it before returning user data.`,
          order: 2,
        },
        {
          heading: 'Verifying Requests with the authenticate Middleware',
          body: `Once the client holds an access token, it includes that token in the \`Authorization\` header on protected API calls:

\`\`\`
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
\`\`\`

The \`authenticate\` middleware intercepts the request before any protected controller runs:
1. Checks that \`req.headers.authorization\` exists and starts with \`"Bearer "\`.
2. Extracts the token string and calls \`jwt.verify(token, process.env.JWT_ACCESS_SECRET)\`.
3. If the signature is invalid, tampered with, or expired, immediately responds with \`401 Unauthorized\`.
4. Attaches the verified user identity (\`req.user = { id: decoded.id, role: decoded.role }\`) and calls \`next()\`.`,
          order: 3,
        },
        {
          heading: 'Session Revocation and Refresh Token Hashing',
          body: `Why use both an **Access Token** and a **Refresh Session**?
- Stateless JWT access tokens are fast to verify without a database lookup on every request, but they cannot be easily revoked before they expire.
- By keeping access tokens short-lived (e.g., 15 minutes) and storing a hashed refresh token in the \`RefreshSession\` collection, the server can immediately revoke a user's session on logout or password change by deleting or invalidating their \`RefreshSession\` record.`,
          order: 4,
        },
        {
          heading: 'Common Beginner Mistakes',
          body: `- **Mass-assigning \`req.body\` during registration**: Writing \`await User.create(req.body)\`, which lets an attacker send \`{ "role": "admin" }\` and escalate privileges immediately.
- **Storing plaintext passwords or using fast hashes like MD5/SHA-256 for passwords**: Fast hashes can be cracked at billions of guesses per second on modern GPUs; always use a slow adaptive algorithm like \`bcrypt\` or \`argon2\`.
- **Putting sensitive data inside the JWT payload**: A JWT payload is Base64Url-encoded, **not encrypted**. Anyone can decode it. Never place \`passwordHash\`, secret keys, or private personal data in a JWT payload.
- **Revealing which field failed during login**: Returning \`"Email not registered"\` vs. \`"Incorrect password"\`, which helps attackers enumerate valid user emails.`,
          order: 5,
        },
        {
          heading: 'Suggested Practice Task',
          body: `1. Write an Express \`authenticate\` middleware function that reads \`req.headers.authorization\`.
2. Handle three distinct failure cases cleanly with \`401 Unauthorized\`:
   - Missing \`Authorization\` header or missing \`Bearer \` prefix
   - Expired JWT (\`TokenExpiredError\`)
   - Tampered/invalid JWT signature (\`JsonWebTokenError\`).
3. When valid, attach \`req.user = { id: payload.id, role: payload.role }\` and call \`next()\`.`,
          order: 6,
        },
        {
          heading: 'Topic Summary',
          body: `- Hash passwords using \`bcrypt.hash(password, 12)\` before saving to MongoDB and mark \`passwordHash\` as \`select: false\`.
- Always hardcode \`role: 'student'\` on public registration so callers cannot self-assign \`course_creator\` or \`admin\`.
- Return a generic \`401 Unauthorized\` message on failed logins to prevent user enumeration.
- Use \`jwt.verify()\` inside \`authenticate\` middleware to validate Bearer tokens and populate \`req.user\` for downstream handlers.`,
          order: 7,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Secure Registration & Login Service Functions',
        language: 'javascript',
        code: `import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const BCRYPT_ROUNDS = 12;

export async function registerStudent({ name, email, password }) {
  const normalizedEmail = String(email).trim().toLowerCase();

  const existing = await User.findOne({ email: normalizedEmail }).lean();
  if (existing) {
    const err = new Error('An account with this email already exists.');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Security: Explicitly whitelist fields and force canonical default role 'student'
  const user = await User.create({
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash,
    role: 'student',
  });

  const accessToken = jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  return {
    accessToken,
    user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
  };
}

export async function loginUser({ email, password }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

  // Constant generic error message prevents email enumeration
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const accessToken = jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );

  return {
    accessToken,
    user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
  };
}`,
        explanation:
          'This service normalizes emails, hashes passwords with bcrypt, forces role: "student" on public registration, uses .select("+passwordHash") only during login verification, and signs minimal JWT claims.',
      },
      {
        title: 'JWT Authentication Middleware (server/middleware/authenticate.js)',
        language: 'javascript',
        code: `import jwt from 'jsonwebtoken';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required. Please provide a valid Bearer token.',
    });
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication token is missing.',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = {
      id: decoded.id || decoded.sub,
      role: decoded.role,
    };
    return next();
  } catch (err) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired authentication token.',
    });
  }
}`,
        explanation:
          'The authenticate middleware extracts the Bearer token, verifies its cryptographic signature and expiration using process.env.JWT_ACCESS_SECRET, and attaches req.user for downstream authorization checks.',
      },
    ],
    importantPoints: [
      'Never store plaintext passwords; always hash passwords with bcrypt using a safe cost factor (e.g., 12 salt rounds).',
      'Configure passwordHash with select: false in the User schema so it is never accidentally returned in API responses.',
      'Never trust req.body.role during user registration; public sign-ups must always default to the canonical "student" role.',
      'Return the exact same 401 error message ("Invalid email or password") whether the email does not exist or the password fails verification.',
      'Keep JWT payloads minimal—store only the user ID and canonical role (student, course_creator, or admin).',
      'Always load JWT signing secrets from environment variables (process.env.JWT_ACCESS_SECRET), never hardcoded strings.',
    ],
    externalReferences: [
      {
        title: 'OWASP Authentication Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html',
        source: 'OWASP Foundation',
      },
      {
        title: 'OWASP Password Storage Cheat Sheet',
        url: 'https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html',
        source: 'OWASP Foundation',
      },
      {
        title: 'RFC 7519 — JSON Web Token (JWT) Specification',
        url: 'https://datatracker.ietf.org/doc/html/rfc7519',
        source: 'IETF Datatracker',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 5: Implementing CRUD
  // =========================================================================
  {
    topicId: '6abe9de0f15c2b4f6008ac69',
    title: 'Implementing CRUD',
    content: {
      explanation:
        'CRUD—Create, Read, Update, and Delete—forms the core data manipulation engine of every backend API. However, production CRUD in a multi-resource system like LearnSphere is much more than calling Model.find() or Model.findByIdAndUpdate(). Real-world CRUD must validate MongoDB ObjectIds before querying, verify hierarchical parent-child relationships (ensuring a Topic actually belongs to the specified Module and Course), whitelist mutable fields on updates, and use .lean() for fast read performance. In this topic, you will build complete, production-safe CRUD operations with Express and Mongoose.',
      sections: [
        {
          heading: 'Learning Objectives',
          body: `- Map Create, Read, Update, and Delete operations to their corresponding HTTP methods (\`POST\`, \`GET\`, \`PATCH\`, \`DELETE\`) and Mongoose queries.
- Validate URL route parameters (\`:courseId\`, \`:moduleId\`, \`:topicId\`) with \`mongoose.Types.ObjectId.isValid()\` before querying MongoDB.
- Enforce multi-level hierarchy integrity in database queries (\`{ _id: topicId, moduleId, courseId }\`).
- Implement safe partial updates (\`PATCH\`) using explicit field whitelisting and \`{ returnDocument: 'after', runValidators: true }\`.
- Optimize read endpoints using \`.lean()\` and sequential sorting (\`.sort({ order: 1 })\`).`,
          order: 0,
        },
        {
          heading: 'Core Terminology',
          body: `- **CRUD**: The four foundational persistent storage operations—Create (\`POST\`), Read (\`GET\`), Update (\`PATCH\` / \`PUT\`), and Delete (\`DELETE\`).
- **Field Whitelisting (Mass-Assignment Protection)**: Explicitly extracting only the permitted fields from \`req.body\` before constructing a Mongoose \`$set\` update object.
- **Hierarchy Scoping**: Including parent foreign keys (\`courseId\` and \`moduleId\`) alongside the target document \`_id\` in the MongoDB filter so a client cannot manipulate a topic through an unrelated course URL.
- **Mongoose \`.lean()\`**: A query modifier that instructs Mongoose to return plain JavaScript objects instead of heavy Mongoose Document instances, reducing memory usage and speeding up read queries.
- **Schema Validators on Update**: Passing \`runValidators: true\` to \`findOneAndUpdate()\` so Mongoose enforces \`maxlength\`, \`min\`, and \`enum\` rules during \`PATCH\` requests just as it does during \`create()\`.`,
          order: 1,
        },
        {
          heading: 'End-to-End CRUD Lifecycle in LearnSphere',
          body: `Let's examine how each CRUD operation works inside the Course Creator workflow:

\`\`\`
CREATE (POST /api/creator/courses/:courseId/modules/:moduleId/topics)
  ├─► Verify ObjectId format for courseId & moduleId
  ├─► Verify course exists & belongs to creator (course.createdBy === req.user.id)
  ├─► Verify module exists & belongs to course ({ _id: moduleId, courseId })
  └─► Topic.create({ courseId, moduleId, title, description, order }) -> 201 Created

READ (GET /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId/content)
  ├─► Verify course ownership
  ├─► Topic.findOne({ _id: topicId, moduleId, courseId }).lean()
  └─► Return 404 if not found, or 200 OK with structured topic content

UPDATE (PATCH /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId/content)
  ├─► Verify course ownership
  ├─► Validate & sanitize allowed fields (content, codeExamples, importantPoints, externalReferences)
  ├─► Topic.findOneAndUpdate(
  │     { _id: topicId, moduleId, courseId },
  │     { $set: sanitizedUpdate },
  │     { returnDocument: 'after', runValidators: true }
  │   ).lean()
  └─► Return 200 OK with updated content
\`\`\``,
          order: 2,
        },
        {
          heading: 'Why Hierarchy Scoping Matters in Nested Routes',
          body: `Suppose an API exposes the nested URL:
\`PATCH /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId/content\`

A naive developer might check ownership of \`:courseId\` and then run:
\`await Topic.findByIdAndUpdate(req.params.topicId, ...)\`

**Why is that dangerous?**
If an attacker passes their own \`courseId\` in the URL (passing the course ownership check), but passes a \`topicId\` belonging to **another creator's course**, \`findByIdAndUpdate(topicId)\` would overwrite the victim's topic!

By scoping the query filter with all three identifiers:
\`Topic.findOneAndUpdate({ _id: topicId, moduleId, courseId }, ...)\`
MongoDB guarantees that the update only succeeds if that exact topic belongs to that exact module inside that exact owned course.`,
          order: 3,
        },
        {
          heading: 'Validating ObjectIds Before Querying',
          body: `In MongoDB, primary keys (\`_id\`) are 24-character hexadecimal \`ObjectId\` strings (such as \`6abe9de0f15c2b4f6008ac69\`).

If a client requests \`GET /api/courses/not-a-valid-id\` and you pass \`"not-a-valid-id"\` directly into \`Course.findById()\`, Mongoose throws a \`CastError\`. Checking \`mongoose.Types.ObjectId.isValid(id)\` up front allows your service to immediately return a clean \`400 Bad Request\` or \`404 Not Found\` without triggering database cast exceptions.`,
          order: 4,
        },
        {
          heading: 'Common Beginner Mistakes',
          body: `- **Omitting \`runValidators: true\` on updates**: By default, Mongoose only runs schema validators on \`.save()\` and \`.create()\`. Always pass \`{ returnDocument: 'after', runValidators: true }\` to \`findOneAndUpdate()\`.
- **Querying only by \`_id\` on nested routes**: Ignoring \`:courseId\` and \`:moduleId\` in the Mongoose filter, which breaks URL hierarchy guarantees and can cause cross-resource vulnerabilities.
- **Allowing immutable fields to be overwritten in \`PATCH\`**: Failing to strip \`_id\`, \`courseId\`, \`moduleId\`, or \`createdBy\` from the update payload.
- **Returning \`200 OK\` with \`null\` when a document is missing**: Forgetting to check \`if (!doc)\` after \`findOne()\` or \`findOneAndUpdate()\` and failing to return \`404 Not Found\`.`,
          order: 5,
        },
        {
          heading: 'Suggested Practice Task',
          body: `1. Write a service function \`updateModuleTitle(courseId, moduleId, creatorId, newTitle)\`.
2. Validate that \`courseId\` and \`moduleId\` are valid MongoDB ObjectIds.
3. Verify that the course exists with \`{ _id: courseId, createdBy: creatorId }\`.
4. Update the module using \`Module.findOneAndUpdate({ _id: moduleId, courseId }, { $set: { title: newTitle.trim() } }, { returnDocument: 'after', runValidators: true }).lean()\` and throw a \`404\` error if no matching module is found.`,
          order: 6,
        },
        {
          heading: 'Topic Summary',
          body: `- Always validate route parameter IDs with \`mongoose.Types.ObjectId.isValid()\` before executing queries.
- Scope nested CRUD queries by their full parent chain (\`{ _id: topicId, moduleId, courseId }\`) so hierarchy boundaries cannot be bypassed.
- Whitelist allowed fields into a \`$set\` object and pass \`{ returnDocument: 'after', runValidators: true }\` on all update queries.
- Use \`.lean()\` on read queries and return \`404 Not Found\` whenever a target resource does not exist.`,
          order: 7,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Hierarchy-Scoped Topic Content Read & Partial Update Service',
        language: 'javascript',
        code: `import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';

function assertValidObjectId(id, label) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error(\`Invalid \${label} identifier format.\`);
    err.statusCode = 400;
    throw err;
  }
}

export async function updateCreatorTopicContent(courseId, moduleId, topicId, creatorId, payload) {
  assertValidObjectId(courseId, 'course');
  assertValidObjectId(moduleId, 'module');
  assertValidObjectId(topicId, 'topic');

  // 1. Verify course exists and belongs to the authenticated course_creator
  const ownedCourse = await Course.findOne({ _id: courseId, createdBy: creatorId }).lean();
  if (!ownedCourse) {
    const err = new Error('Course not found.');
    err.statusCode = 404;
    throw err;
  }

  // 2. Verify module belongs to this course
  const parentModule = await Module.findOne({ _id: moduleId, courseId }).lean();
  if (!parentModule) {
    const err = new Error('Module not found in this course.');
    err.statusCode = 404;
    throw err;
  }

  // 3. Whitelist only allowed topic content fields
  const allowedFields = {
    content: payload.content,
    codeExamples: payload.codeExamples,
    importantPoints: payload.importantPoints,
    externalReferences: payload.externalReferences,
    videos: payload.videos,
    images: payload.images,
  };

  // 4. Perform atomic, hierarchy-scoped update with schema validators enabled
  const updatedTopic = await Topic.findOneAndUpdate(
    { _id: topicId, moduleId, courseId },
    { $set: allowedFields },
    { returnDocument: 'after', runValidators: true }
  ).lean();

  if (!updatedTopic) {
    const err = new Error('Topic not found in this module.');
    err.statusCode = 404;
    throw err;
  }

  return updatedTopic;
}`,
        explanation:
          'This service validates all three ObjectIds, verifies course ownership, confirms the module belongs to the course, whitelists mutable fields, and scopes findOneAndUpdate by { _id: topicId, moduleId, courseId }.',
      },
      {
        title: 'Ordered Read Query with .lean() and Field Projection',
        language: 'javascript',
        code: `import Topic from '../models/Topic.js';

export async function listTopicsForModule(courseId, moduleId) {
  // Fetch topics in deterministic order (1, 2, 3...) using the { moduleId: 1, order: 1 } compound index
  const topics = await Topic.find({ courseId, moduleId })
    .select('_id title description order courseId moduleId updatedAt')
    .sort({ order: 1 })
    .lean();

  return topics.map((t) => ({
    id: t._id.toString(),
    title: t.title,
    description: t.description,
    order: t.order,
    courseId: t.courseId.toString(),
    moduleId: t.moduleId.toString(),
    updatedAt: t.updatedAt,
  }));
}`,
        explanation:
          'When listing topics in a sidebar or module outline, projecting only summary fields with .select() and .lean() avoids transferring large article bodies over the network until a specific topic is opened.',
      },
    ],
    importantPoints: [
      'Always validate route parameters with mongoose.Types.ObjectId.isValid() before running database queries.',
      'Scope nested queries by their complete parent chain ({ _id: topicId, moduleId, courseId }) to prevent cross-course tampering.',
      'Never pass raw req.body directly to findOneAndUpdate(); always construct an explicit $set whitelist of mutable fields.',
      'Pass { returnDocument: "after", runValidators: true } to findOneAndUpdate() so Mongoose schema constraints are enforced on updates.',
      'Use .lean() and .sort({ order: 1 }) on read queries for fast, deterministic ordering.',
      'Always check if the returned document is null and respond with 404 Not Found when no record matches the query filter.',
    ],
    externalReferences: [
      {
        title: 'Mongoose Queries Guide — Mongoose v8 Documentation',
        url: 'https://mongoosejs.com/docs/queries.html',
        source: 'Mongoose Docs',
      },
      {
        title: 'Mongoose Validation on Update (runValidators) — Mongoose Docs',
        url: 'https://mongoosejs.com/docs/validation.html#update-validators',
        source: 'Mongoose Docs',
      },
      {
        title: 'MongoDB CRUD Operations — MongoDB Manual',
        url: 'https://www.mongodb.com/docs/manual/crud/',
        source: 'MongoDB Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },
];
