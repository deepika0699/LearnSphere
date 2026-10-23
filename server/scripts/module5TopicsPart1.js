/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LearnSphere Module 5 — Building REST APIs Content (Part 1: Topics 1–5)
 */

export const module5TopicsPart1 = [
  // =========================================================================
  // TOPIC 1: REST API Architecture
  // ID: 6abe9dd2f15c2b4f6008ac45
  // =========================================================================
  {
    topicId: '6abe9dd2f15c2b4f6008ac45',
    title: 'REST API Architecture',
    content: {
      explanation: `When a React frontend in a user's browser needs to load a course catalog, submit an assessment, or save a study note, it does not connect directly to the MongoDB database. Instead, the frontend communicates over HTTP with a backend Application Programming Interface (API).

Today, the most widely used architectural style for designing web APIs is REST (Representational State Transfer). A REST API organizes backend capabilities around named Resources (such as courses, modules, topics, and users) identified by clean URLs, manipulated using standard HTTP methods ('GET', 'POST', 'PATCH', 'PUT', 'DELETE'), exchanged as structured Representations (typically JSON), and governed by Stateless communication.

Understanding the core principles of REST—along with where pragmatic real-world APIs intentionally adapt strict academic REST rules—gives you the architectural foundation to design predictable, scalable backend APIs.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Define what an API (Application Programming Interface) and REST (Representational State Transfer) mean in backend engineering.
2. Explain the core building blocks of a REST API: Resources, Resource-Oriented URLs, HTTP Methods, Representations, Status Codes, and Statelessness.
3. Design clean, resource-oriented endpoints using plural nouns rather than action verbs in URLs.
4. Explain the six architectural constraints of REST at a beginner-friendly level.
5. Recognize practical real-world conventions (such as authentication endpoints) where production APIs balance REST principles with developer clarity.`,
        },
        {
          order: 1,
          heading: 'What Is an API and What Is REST?',
          body: `1. What Is an API (Application Programming Interface)?
An API is a well-defined contract that allows one piece of software (the Client, such as a React web app or mobile app) to request data or operations from another piece of software (the Server) without needing to know how the server's internal database or code is implemented.

2. What Is REST (Representational State Transfer)?
Introduced by Roy Fielding in 2000, REST is not a library, programming language, or protocol—it is an architectural style and set of design guidelines for building network-based APIs on top of HTTP.
Wait—why is it called "Representational State Transfer"?
Because when a client requests a resource (such as a Course), the server does not send the raw MongoDB BSON database memory; it transfers a serialized Representation (usually a JSON document) of the current state of that resource over HTTP.`,
        },
        {
          order: 2,
          heading: 'Resources, Resource-Oriented URLs, and HTTP Methods',
          body: `In a REST API, every core entity in your domain is modeled as a Resource (a noun), and its URL identifies WHICH resource you are targeting, while the HTTP Method specifies WHAT action to perform:

Standard Resource-Oriented Endpoints in LearnSphere:
• GET /api/courses              → List the collection of courses
• GET /api/courses/:courseId    → Retrieve one specific course by ID
• POST /api/courses             → Create a new course
• PATCH /api/courses/:courseId  → Partially update fields on an existing course
• DELETE /api/courses/:courseId → Delete a specific course

Why URLs Should Represent Resources (Nouns) Rather Than Actions (Verbs):
In non-REST RPC-style URLs, beginners often invent a new verb URL for every operation:
✗ Avoid Verb-Based URLs:
  POST /api/createNewCourse
  GET  /api/getCourseById/123
  POST /api/deleteCourse/123

✓ Prefer Resource-Oriented REST URLs:
  POST   /api/courses
  GET    /api/courses/123
  DELETE /api/courses/123

Why is the resource-oriented design much better?
Because HTTP already gives us standardized verbs ('GET', 'POST', 'PATCH', 'PUT', 'DELETE')! Keeping URLs focused on plural resource nouns ('/api/courses', '/api/courses/:courseId/modules') makes your entire API predictable and consistent.`,
        },
        {
          order: 3,
          heading: 'REST Architectural Constraints at a Beginner Level',
          body: `REST defines core constraints that keep web APIs scalable and reliable:

1. Client–Server Separation:
The frontend UI (Client) and backend data/logic layer (Server) evolve independently as long as the HTTP API contract stays consistent.

2. Statelessness:
Every HTTP request from a client to the server must contain all the information needed to understand, authenticate, and process that request (such as an 'Authorization: Bearer <token>' header). The server does not rely on hidden in-memory client session state from a previous request.

3. Uniform Interface:
Resources are identified by standard URIs, manipulated through standard representations (JSON), and accompanied by self-descriptive metadata (HTTP methods, 'Content-Type: application/json' headers, and semantic HTTP status codes like '200 OK', '201 Created', '400 Bad Request', '401 Unauthorized', '403 Forbidden', and '404 Not Found').

4. Cacheability & Layered System:
Responses can indicate whether they are cacheable, and requests can pass through security proxies, load balancers, or rate limiters transparently.`,
        },
        {
          order: 4,
          heading: 'Pragmatic Real-World REST Conventions',
          body: `While resource-oriented URLs handle 90% of backend operations cleanly, real-world production APIs (including LearnSphere) are pragmatic rather than rigidly dogmatic when an operation does not map neatly to a database CRUD table:

Examples of Practical Conventions in Real APIs:
• Authentication Actions: Endpoints like 'POST /api/auth/login' and 'POST /api/auth/logout' represent workflow actions or session token exchanges. Calling it 'POST /api/auth/login' is universally understood by developers.
• Focused Sub-Resource Updates: In LearnSphere's Course Creator Studio, updating the educational content of a topic uses 'PATCH /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId/content' so content authoring is cleanly separated from basic topic title/order metadata.
• Role-Scoped Prefixes: Grouping Course Creator authoring endpoints under '/api/creator/...' and Admin management endpoints under '/api/admin/...' makes role-based middleware enforcement clear and explicit.`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Using 'GET' requests to mutate or delete data: 'GET' requests must always be safe and read-only. Never implement 'GET /api/courses/:id/delete'—web crawlers, browser pre-fetching, or link previews could trigger it accidentally! Always use 'POST', 'PATCH'/'PUT', or 'DELETE' for state changes.
2. Returning '200 OK' for every response—even when an error occurred: Never return HTTP '200 OK' with '{ "status": "error", "message": "Not found" }'. Use proper HTTP status codes ('400', '401', '403', '404', '409', '500') so HTTP clients and monitoring tools can distinguish success from failure.
3. Mixing singular and plural collection names randomly: Do not mix '/api/course', '/api/modules', and '/api/topicItem'. Use consistent plural nouns ('/api/courses', '/api/modules', '/api/topics').`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `Practice Task — Designing a Resource-Oriented REST API Contract:
Suppose you are designing the REST API endpoints for managing Student Notes ('notes') inside a Course.
1. Write the exact HTTP method, URL path, and expected success HTTP status code for:
   • Listing all notes for a specific course
   • Creating a new note
   • Updating the text of an existing note by ':noteId'
   • Deleting an existing note by ':noteId'
2. Write out a sample JSON response envelope for the Create operation ('201 Created') showing 'status', 'message', and 'data.note'.`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `• An API is a structured contract for software communication; REST (Representational State Transfer) is an architectural style that models backend data as Resources over HTTP.
• REST APIs combine resource-oriented noun URLs ('/api/courses/:courseId') with standard HTTP methods ('GET', 'POST', 'PATCH', 'DELETE'), JSON representations, and semantic HTTP status codes.
• Statelessness means each HTTP request carries all context and credentials needed for the server to process it independently.
• Production REST APIs follow resource-oriented conventions for core entities while staying pragmatic for workflow endpoints like authentication ('POST /api/auth/login').`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Resource-Oriented REST API Request & Response Contract',
        language: 'javascript',
        code: `// ============================================================================
// REST API Endpoint Map for the 'courses' Resource
// ============================================================================
const restApiContract = [
  {
    operation: 'List Courses (Collection)',
    method: 'GET',
    path: '/api/courses?page=1&limit=10',
    successStatus: 200,
  },
  {
    operation: 'Get Single Course (Resource)',
    method: 'GET',
    path: '/api/courses/:courseId',
    successStatus: 200,
  },
  {
    operation: 'Create Course',
    method: 'POST',
    path: '/api/creator/courses',
    successStatus: 201,
  },
  {
    operation: 'Update Course Fields',
    method: 'PATCH',
    path: '/api/creator/courses/:courseId',
    successStatus: 200,
  },
  {
    operation: 'Delete Course',
    method: 'DELETE',
    path: '/api/creator/courses/:courseId',
    successStatus: 200,
  },
];

// Consistent JSON Representation Envelope returned by a REST endpoint:
const sampleResponse = {
  status: 'success',
  message: 'Course retrieved successfully',
  data: {
    course: {
      id: '6abe9dc2f15c2b4f6008ac1c',
      title: 'Backend Development with Node.js, Express & MongoDB',
      category: 'backend',
      status: 'draft',
    },
  },
};

console.log('Endpoints count:', restApiContract.length);
console.log('Create endpoint:', restApiContract[2].method, restApiContract[2].path, '->', restApiContract[2].successStatus);
console.log('Envelope status:', sampleResponse.status, '| Resource title:', sampleResponse.data.course.title);

/*
Expected Output:
Endpoints count: 5
Create endpoint: POST /api/creator/courses -> 201
Envelope status: success | Resource title: Backend Development with Node.js, Express & MongoDB
*/`,
        explanation:
          'Illustrates how a REST API maps collection and item operations on the courses resource to HTTP methods, resource URLs, status codes, and a consistent JSON representation envelope.',
      },
    ],
    importantPoints: [
      'REST (Representational State Transfer) organizes APIs around named Resources identified by URLs and manipulated with standard HTTP methods.',
      'Use plural nouns for resource URLs (/api/courses, /api/courses/:courseId) and let the HTTP method (GET, POST, PATCH, DELETE) express the action.',
      'Statelessness means every HTTP request is self-contained and includes its own authentication token and parameters without relying on hidden server memory.',
      'Always pair JSON representations with accurate HTTP status codes (200 OK, 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found).',
      'Real-world REST APIs remain resource-oriented for domain models while using clear pragmatic endpoints for workflows like POST /api/auth/login.',
    ],
    externalReferences: [
      {
        title: 'MDN Web Docs: HTTP Request Methods & REST Concepts',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods',
        source: 'MDN Web Docs',
      },
      {
        title: 'Express.js Guide: Routing and Resource Paths',
        url: 'https://expressjs.com/en/guide/routing.html',
        source: 'Express.js Official Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 2: Controllers
  // ID: 6abe9dd2f15c2b4f6008ac46
  // =========================================================================
  {
    topicId: '6abe9dd2f15c2b4f6008ac46',
    title: 'Controllers',
    content: {
      explanation: `When beginners build their first Express.js application, they often write hundreds of lines of code directly inside 'app.post("/api/courses", async (req, res) => { ... })'—mixing HTTP header checks, database queries, business calculations, and JSON formatting all in one giant file. As soon as an application grows to 20 or 30 endpoints, that single file becomes nearly impossible to read, test, or maintain.

To keep backend code clean and modular, production Express applications separate responsibilities into distinct layers:
Route → Controller → Service → Model → Database

In this layered architecture, a Controller is the HTTP traffic coordinator. Its job is strictly focused on the HTTP layer: extracting validated parameters and user context from 'req', delegating the actual business work to a Service function, formatting the returned result into a clean HTTP status code and JSON response via 'res', and forwarding any unexpected errors to Express error middleware via 'next(err)'.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Define what a Controller is in an Express.js REST API and explain why controllers exist.
2. Trace the layered architecture flow: Route → Controller → Service → Model/Database.
3. Identify the exact responsibilities that belong inside a Controller versus what must be kept out of a Controller.
4. Write a clean, thin Express controller function using 'async/await' and 'try/catch' with 'next(err)'.
5. Explain how separation of concerns makes controllers easy to read, audit, and maintain.`,
        },
        {
          order: 1,
          heading: 'The Layered Architecture: Route → Controller → Service → Model/Database',
          body: `Let us clarify the exact role of each layer in a well-structured Express backend like LearnSphere:

Route ('server/routes/*.js')
   ↓  Matches the HTTP method + URL path and runs route middleware (auth, validation)
Controller ('server/controllers/*.js')
   ↓  Extracts HTTP request data (req.params, req.query, req.body, req.user) and sends the HTTP response (res.status().json())
Service ('server/services/*.js')
   ↓  Executes pure business/application logic and ownership/domain rules
Model ('server/models/*.js')
   ↓  Defines Mongoose schemas and executes database queries
Database (MongoDB)
   ↓  Persists and retrieves BSON documents on disk

Real-World Analogy — Restaurant Waitstaff vs. Kitchen Chef:
• Controller (The Waitstaff): Welcomes the guest at the table (HTTP layer), takes their order from the menu ('req.body', 'req.params'), hands the ticket to the kitchen (calls the Service), brings the plated dish back to the table ('res.status(200).json(...)'), or politely informs the manager if something goes wrong ('next(err)').
• Service (The Kitchen Chef): Actually prepares the meal according to strict recipes and safety rules. The waitstaff does not cook the food at the table, and the chef does not walk out to the street to direct traffic!`,
        },
        {
          order: 2,
          heading: 'Core Responsibilities of a Controller',
          body: `Every controller handler in 'server/controllers/' has four clear responsibilities:

1. Extract Relevant Data from 'req':
Read the authenticated user identity ('req.user.userId'), route parameters ('req.params.courseId'), query parameters ('req.query.page'), and explicitly allowed body fields ('const { title, description, category } = req.body').

2. Call the Appropriate Service Method:
Pass those clean JavaScript values as arguments to a Service function (for example, 'await courseCreatorCourseService.createCourse({ creatorId, title, description, category })').

3. Send the HTTP Response via 'res':
Choose the accurate HTTP status code ('200 OK' for reads/updates, '201 Created' for resource creation) and return a consistent JSON envelope ('res.status(201).json({ status: "success", data: { course } })').

4. Forward Errors via 'next(err)':
Wrap asynchronous calls in 'try / catch (err) { return next(err); }' so any domain error or database exception is handled uniformly by the centralized Express error handler.`,
        },
        {
          order: 3,
          heading: 'Keeping Business Logic and Direct Database Queries Out of Controllers',
          body: `Why should you keep Controllers "thin" (concise and free of complex business logic or raw Mongoose queries)?

1. Reusability:
If complex course-creation or progress-calculation logic is trapped inside an Express controller function that requires 'req' and 'res' objects, you cannot easily reuse that logic from a background script, another service, or an admin workflow.

2. Readability and Security Auditing:
When every controller function is 15–25 lines long and follows the exact same pattern (extract inputs → call service → send JSON → catch & 'next(err)'), a security engineer can audit 50 endpoints in minutes and verify that no raw 'req.body' mass-assignment or missing status code slipped through.

3. Clean Separation of HTTP from Domain Rules:
A controller knows about HTTP status codes and headers; a service knows about courses, modules, topics, and business rules. Keeping them separate means changing how a JSON response is formatted never risks breaking database transaction logic.`,
        },
        {
          order: 4,
          heading: 'Inspecting a Real LearnSphere Controller',
          body: `Look at how 'server/controllers/courseCreatorCourseController.js' in LearnSphere implements 'createCourse' and 'getCourseById':

export const createCourse = async (req, res, next) => {
  try {
    const creatorId = req.user?.userId || req.user?.id;
    const { title, description, category, thumbnail, syllabus, status } = req.body;

    const newCourse = await courseCreatorCourseService.createCourse({
      creatorId,
      title,
      description,
      category,
      thumbnail,
      syllabus,
      status,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Course created successfully',
      data: { course: newCourse },
    });
  } catch (err) {
    return next(err);
  }
};

Notice what makes this controller exemplary:
• It takes the authoritative 'creatorId' from 'req.user' (populated by authentication middleware), NEVER from 'req.body.creatorId'!
• It destructures only the explicitly allowed fields from 'req.body'.
• It delegates creation to 'courseCreatorCourseService.createCourse(...)'.
• It returns HTTP '201 Created' with a structured JSON payload, or passes 'err' to 'next(err)'.`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Trusting 'req.body.userId' or 'req.body.courseCreator' inside a controller: Never let the client body claim who owns a resource! Always read the authenticated user's ID from 'req.user' (verified by JWT authentication middleware).
2. Forgetting 'return' when sending early responses: If a controller checks a condition and calls 'res.status(404).json(...)' without 'return', execution continues to the next line and tries to send a second response, causing '"Cannot set headers after they are sent to the client"'.
3. Swallowing errors silently inside 'catch (err) {}' or sending raw 'err.stack' to the client: Always call 'return next(err);' so the centralized error middleware logs safely and returns a sanitized client response.
4. Writing 200 lines of Mongoose queries directly inside the controller instead of delegating to a service.`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `Practice Task — Refactoring a Bloated Route Handler into a Thin Controller:
1. Write an Express controller function 'updateModule(req, res, next)' for 'PATCH /api/creator/courses/:courseId/modules/:moduleId'.
2. Extract 'courseId' from 'req.course?._id || req.params.courseId', 'moduleId' from 'req.params.moduleId', and '{ title, description, order }' from 'req.body'.
3. Call 'await courseCreatorModuleService.updateModule(courseId, moduleId, { title, description, order })'.
4. Return HTTP '200 OK' with '{ status: "success", message: "Module updated successfully", data: { module: updatedModule } }' and forward any errors via 'next(err)'.`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `• In the 'Route → Controller → Service → Model → Database' architecture, a Controller is responsible strictly for the HTTP request/response boundary.
• A controller extracts validated data from 'req' ('req.params', 'req.query', 'req.body', 'req.user'), invokes a Service method, returns an HTTP status and JSON payload via 'res', and forwards errors via 'next(err)'.
• Keeping business logic and direct database queries out of controllers makes backend code modular, reusable, and easy to audit.
• Always read the acting user's identity from 'req.user' rather than trusting client-supplied IDs in 'req.body'.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Clean Express Controller Delegating to a Service Layer',
        language: 'javascript',
        code: `/**
 * Example Controller: server/controllers/courseCreatorTopicController.js
 * Demonstrates thin HTTP coordination: extract req data -> call service -> send res -> next(err).
 */
export const createTopicController = (topicService) => {
  return {
    // POST /api/creator/courses/:courseId/modules/:moduleId/topics
    createTopic: async (req, res, next) => {
      try {
        // 1. Extract authoritative context and allowed body fields from req
        const courseId = req.course?._id || req.params.courseId;
        const { moduleId } = req.params;
        const { title, description, order } = req.body;

        // 2. Delegate business logic and persistence to the Service layer
        const topic = await topicService.createTopic({
          courseId,
          moduleId,
          title,
          description,
          order,
        });

        // 3. Send semantic HTTP 201 Created response
        return res.status(201).json({
          status: 'success',
          message: 'Topic created successfully',
          data: { topic },
        });
      } catch (err) {
        // 4. Forward any operational or unexpected error to centralized error middleware
        return next(err);
      }
    },
  };
};

// Simulating a controller invocation in Node.js:
const mockService = {
  createTopic: async (input) => ({ id: '6abe9dd2f15c2b4f6008ac46', ...input }),
};
const controller = createTopicController(mockService);

const mockReq = {
  params: { courseId: '6abe9dc2f15c2b4f6008ac1c', moduleId: '6abe9dd2f15c2b4f6008ac44' },
  body: { title: 'Controllers', description: 'HTTP traffic coordination layer', order: 2, ignoredExtraField: 'dropped' },
};
const mockRes = {
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    console.log('HTTP Status:', this.statusCode);
    console.log('Response JSON:', JSON.stringify(payload));
  },
};

await controller.createTopic(mockReq, mockRes, (err) => console.error(err));

/*
Expected Output:
HTTP Status: 201
Response JSON: {"status":"success","message":"Topic created successfully","data":{"topic":{"id":"6abe9dd2f15c2b4f6008ac46","courseId":"6abe9dc2f15c2b4f6008ac1c","moduleId":"6abe9dd2f15c2b4f6008ac44","title":"Controllers","description":"HTTP traffic coordination layer","order":2}}}
*/`,
        explanation:
          'Demonstrates how a thin Express controller extracts only allowed parameters from req, calls the service layer, strips undeclared fields like ignoredExtraField, and sends a structured 201 Created response.',
      },
    ],
    importantPoints: [
      'A Controller is the HTTP coordination layer in the Route -> Controller -> Service -> Model -> Database architecture.',
      'Controller responsibilities: read validated inputs from req, call the Service layer, send the HTTP response via res, and pass errors to next(err).',
      'Keep business logic and direct Mongoose database queries inside Services rather than crowding Controllers.',
      'Always obtain the acting user identity from req.user (set by authentication middleware) and destructure only allowed fields from req.body.',
      'Always use return when sending a response (return res.status(200).json(...)) so execution never attempts to send headers twice.',
    ],
    externalReferences: [
      {
        title: 'MDN Web Docs: Express Tutorial — Routes and Controllers',
        url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs/routes',
        source: 'MDN Web Docs',
      },
      {
        title: 'Express.js Official Guide: Routing & Handler Structure',
        url: 'https://expressjs.com/en/guide/routing.html',
        source: 'Express.js Official Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 3: Services
  // ID: 6abe9dd3f15c2b4f6008ac47
  // =========================================================================
  {
    topicId: '6abe9dd3f15c2b4f6008ac47',
    title: 'Services',
    content: {
      explanation: `Where do the actual brain and rules of a backend application live? They live in the Service Layer ('server/services/*.js').

While a Controller handles HTTP requests and responses, and a Mongoose Model defines the database schema, a Service encapsulates your application's Business Logic: verifying domain rules, enforcing authoritative ownership and hierarchy constraints, coordinating queries across one or more Models, sanitizing/normalizing domain payloads, and throwing structured operational errors (with appropriate 'statusCode' properties like '400', '403', or '404') when a rule is violated.

Understanding how Services differ from both Controllers and Models—and why Services never blindly trust client input—is essential for building maintainable, secure backend systems.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Define the Service Layer and explain what Business Logic means in a backend application.
2. Clearly distinguish Controller vs. Service responsibilities and Service vs. Model responsibilities.
3. Explain how Services keep Controllers thin and provide reusable business operations across the application.
4. Implement server-authoritative validation, ownership checks, and structured error propagation inside Service functions such as 'createCourse()', 'getCourseById()', and 'updateCourse()'.
5. Explain why Services must never blindly trust client input or allow mass assignment of protected fields.`,
        },
        {
          order: 1,
          heading: 'What Is Business Logic and Why Do Services Exist?',
          body: `What Is "Business Logic" (Domain Logic)?
Business logic is the set of real-world rules that govern how your specific application operates. For example, in LearnSphere:
• "A Course Creator can only view, edit, or delete a course whose 'courseCreator' field matches their own user ID."
• "Before a Topic's content can be updated, the backend must verify that the Topic belongs to the specified Module AND that the Module belongs to the specified Course."
• "When a Module is deleted, all Topics belonging to that Module must also be deleted, and the remaining Modules must have their 'order' numbers re-sequenced without gaps."

Why Do Services Exist?
If you put those multi-step rules inside a Controller, your HTTP layer becomes bloated and cannot be reused outside of that single route. If you put all of them inside a single Mongoose Model schema file, one Model has to import five other Models, creating circular dependencies.
The Service Layer sits cleanly between Controllers and Models to orchestrate these rules in plain, testable JavaScript functions.`,
        },
        {
          order: 2,
          heading: 'Clear Distinctions: Controller vs. Service vs. Model',
          body: `Let us compare the three layers side by side so their boundaries are unmistakable:

1. Controller ('server/controllers/courseCreatorCourseController.js'):
• Knows about: 'req', 'res', 'next', HTTP status codes ('200', '201'), query strings, and JSON response envelopes.
• Does NOT know about: Complex Mongoose aggregation pipelines, multi-collection cascading deletes, or low-level data transformation rules.

2. Service ('server/services/courseCreatorCourseService.js'):
• Knows about: Domain operations ('createCourse', 'getCourseById', 'updateCourse'), ownership verification, input whitelist normalization, coordinating 'Course', 'Module', and 'Topic' models, and throwing structured domain errors ('err.statusCode = 404').
• Does NOT know about: Express 'req' or 'res' objects, HTTP headers, or cookies.

3. Model ('server/models/Course.js'):
• Knows about: Mongoose schema definitions, field types, built-in schema validators, indexes, and collection-level queries.
• Does NOT know about: Multi-step application workflows across different domain services.`,
        },
        {
          order: 3,
          heading: 'Walkthrough: createCourse(), getCourseById(), and updateCourse()',
          body: `Let us examine how a realistic Service module ('courseCreatorCourseService.js') implements three core business operations:

1. createCourse({ creatorId, title, description, category }):
• Verifies that 'creatorId' is a valid MongoDB 'ObjectId' and that 'title' is a non-empty string.
• Explicitly constructs the document payload, forcing 'courseCreator: creatorId' and 'status: "draft"' (or validated status) so a client can never spoof ownership.
• Calls 'await Course.create(...)' and returns a clean, serialized course object.

2. getCourseById({ courseId, creatorId }):
• Validates that both 'courseId' and 'creatorId' are valid 24-character hex ObjectIds (failing closed with a 400 or 404 error if malformed).
• Queries 'await Course.findOne({ _id: courseId, courseCreator: creatorId }).lean()'.
• Notice the server-authoritative ownership filter: if the course does not exist OR belongs to a different creator, 'findOne' returns 'null' and the service throws a '404 Not Found' error (preventing cross-creator data leaks).

3. updateCourse({ courseId, creatorId, updateData }):
• Builds an explicit whitelist of allowed update fields ('title', 'description', 'category', 'thumbnail', 'syllabus', 'status')—never allowing 'courseCreator' or '_id' to be overwritten!
• Executes 'Course.findOneAndUpdate({ _id: courseId, courseCreator: creatorId }, { $set: allowedUpdates }, { new: true, runValidators: true })'.`,
        },
        {
          order: 4,
          heading: 'Error Propagation from Services to Controllers',
          body: `Wait—if a Service does not have access to the Express 'res' object, how does a Service signal that a resource was not found ('404') or that an input violated a business rule ('400')?

Structured Application Errors:
In Express backends, a Service creates a standard 'Error' instance, attaches a numeric 'statusCode' property, and throws it:

const createServiceError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

When the Service throws 'createServiceError("Course not found", 404)':
1. The 'await' call inside the Controller's 'try' block rejects immediately.
2. The Controller's 'catch (err)' block runs 'return next(err);'.
3. The centralized Express error-handling middleware inspects 'err.statusCode' ('404') and sends 'res.status(404).json({ error: "Not Found", message: "Course not found" })'.`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Passing the entire Express 'req' and 'res' objects into Service functions: Writing 'courseService.createCourse(req, res)' couples your Service directly to Express HTTP objects and defeats the purpose of separating Controllers from Services. Pass plain data objects ('{ creatorId, title, category }') instead!
2. Assuming the Controller already validated everything and blindly trusting inputs in the Service: Defense-in-depth means a Service should still validate 'ObjectId' formats, enforce ownership filters ('{ _id: courseId, courseCreator: creatorId }'), and whitelist allowed update fields.
3. Allowing 'updateCourse' to overwrite ownership or protected fields: Never pass an unfiltered 'updateData' object directly into '$set'. Always copy only explicitly permitted fields.`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `Practice Task — Writing a Service Function with Ownership & Whitelist Protection:
1. Write an async function 'updateTopicMetadata({ courseId, moduleId, topicId, updateData })'.
2. Check that only 'title' and 'description' from 'updateData' are copied into a 'safeUpdates' object (ignoring any attempt to change 'courseId', 'moduleId', or '_id').
3. Explain why the database query inside the service must filter by '{ _id: topicId, moduleId, courseId }' rather than just '{ _id: topicId }'.`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `• The Service Layer encapsulates business logic, domain rules, multi-model coordination, and authoritative ownership enforcement.
• Controllers handle HTTP 'req'/'res' coordination; Services handle business rules and plain data objects; Models handle Mongoose schemas and collection queries.
• Services propagate operational failures by throwing structured 'Error' objects with 'err.statusCode' ('400', '403', '404', '409'), which Controllers forward via 'next(err)'.
• Services never blindly trust client input—they validate IDs, scope queries by owner/hierarchy ('{ _id: courseId, courseCreator: creatorId }'), and whitelist updatable fields.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Realistic Service Layer: createCourse, getCourseById, and updateCourse',
        language: 'javascript',
        code: `/**
 * Helper to create a structured operational error with an HTTP statusCode.
 */
function createServiceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/**
 * Example Course Service demonstrating server-authoritative ownership,
 * field whitelisting, and structured error propagation.
 */
export function buildCourseService(CourseModel) {
  return {
    async createCourse({ creatorId, title, description = '', category = 'general' }) {
      if (!creatorId) throw createServiceError('Authenticated creatorId is required', 401);
      if (typeof title !== 'string' || title.trim().length < 3) {
        throw createServiceError('Course title must be at least 3 characters', 400);
      }

      // Authoritatively set courseCreator and initial draft status
      return CourseModel.create({
        title: title.trim(),
        description: typeof description === 'string' ? description.trim() : '',
        category: typeof category === 'string' ? category.trim().toLowerCase() : 'general',
        status: 'draft',
        courseCreator: creatorId,
      });
    },

    async getCourseById({ courseId, creatorId }) {
      // Query scopes by BOTH _id and courseCreator to enforce strict ownership
      const course = await CourseModel.findOne({ _id: courseId, courseCreator: creatorId });
      if (!course) {
        throw createServiceError('Course not found', 404);
      }
      return course;
    },

    async updateCourse({ courseId, creatorId, updateData = {} }) {
      // Whitelist allowed fields — never allow courseCreator or _id to be modified!
      const allowedFields = ['title', 'description', 'category'];
      const safeUpdates = {};
      for (const key of allowedFields) {
        if (updateData[key] !== undefined && typeof updateData[key] === 'string') {
          safeUpdates[key] = updateData[key].trim();
        }
      }

      const updated = await CourseModel.findOneAndUpdate(
        { _id: courseId, courseCreator: creatorId },
        { $set: safeUpdates },
        { new: true, runValidators: true }
      );
      if (!updated) {
        throw createServiceError('Course not found', 404);
      }
      return updated;
    },
  };
}

// Simulating service calls:
const fakeDb = [];
const MockCourseModel = {
  create: async (doc) => {
    const saved = { _id: '6abe9dc2f15c2b4f6008ac1c', ...doc };
    fakeDb.push(saved);
    return saved;
  },
  findOne: async (filter) =>
    fakeDb.find((c) => c._id === filter._id && c.courseCreator === filter.courseCreator) || null,
};

const service = buildCourseService(MockCourseModel);
const created = await service.createCourse({
  creatorId: 'creator_1',
  title: '  REST API Mastery  ',
  category: 'BACKEND',
});
console.log('Created Course:', JSON.stringify(created));

try {
  // Another creator ('creator_2') attempting to access 'creator_1' course:
  await service.getCourseById({ courseId: created._id, creatorId: 'creator_2' });
} catch (err) {
  console.log('Cross-Creator Access Blocked -> Status:', err.statusCode, '| Message:', err.message);
}

/*
Expected Output:
Created Course: {"_id":"6abe9dc2f15c2b4f6008ac1c","title":"REST API Mastery","description":"","category":"backend","status":"draft","courseCreator":"creator_1"}
Cross-Creator Access Blocked -> Status: 404 | Message: Course not found
*/`,
        explanation:
          'Demonstrates how a Service layer enforces business rules, sets ownership authoritatively, blocks cross-creator access with a 404 error, and whitelists updatable fields.',
      },
    ],
    importantPoints: [
      'A Service layer encapsulates business/domain logic, multi-model coordination, and authoritative ownership rules.',
      'Controllers handle HTTP req/res concerns; Services operate on plain JavaScript arguments and return domain data or throw structured errors.',
      'Services should never receive Express req or res objects directly, keeping business operations reusable across controllers and scripts.',
      'Services must never blindly trust client input: always scope queries by the authenticated owner and whitelist allowed update fields.',
      'When a business rule or lookup fails, a Service throws an Error with an appropriate statusCode (400, 403, 404, 409) for the Controller to pass to next(err).',
    ],
    externalReferences: [
      {
        title: 'Express.js Guide: Error Propagation and Async Flows',
        url: 'https://expressjs.com/en/guide/error-handling.html',
        source: 'Express.js Official Documentation',
      },
      {
        title: 'Mongoose Official Docs: Queries and findOneAndUpdate',
        url: 'https://mongoosejs.com/docs/tutorials/findoneandupdate.html',
        source: 'Mongoose Official Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 4: Routes and API Organization
  // ID: 6abe9dd3f15c2b4f6008ac48
  // =========================================================================
  {
    topicId: '6abe9dd3f15c2b4f6008ac48',
    title: 'Routes and API Organization',
    content: {
      explanation: `How does a professional Express.js backend organize dozens of endpoints across Student, Course Creator, Authentication, and Admin domains without turning 'server.js' into a 5,000-line tangle?

The answer is modular API organization using 'express.Router()' and a clear directory structure:
• 'routes/'       — Modular Express routers grouped by domain/role, defining route paths, middleware chains, and controller delegation.
• 'middleware/'   — Reusable security, authentication, authorization, ownership, rate-limiting, and validation middleware.
• 'controllers/'  — Thin HTTP request/response coordinators.
• 'services/'     — Business and domain logic.
• 'models/'       — Mongoose schemas and database models.

Understanding how every HTTP request flows through this architecture—and why authentication, authorization, and validation middleware must be placed in exact order before the controller—is key to mastering Express backend design.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Organize an Express project into modular directories ('routes/', 'controllers/', 'services/', 'models/', 'middleware/').
2. Trace the complete end-to-end request flow: Client → Route → Middleware → Controller → Service → Model → MongoDB.
3. Use 'express.Router()' and route prefixes ('app.use("/api/creator", courseCreatorRoutes)') to group endpoints by domain or role.
4. Place authentication, role authorization, course ownership, and input validation middleware in the proper execution order on protected routes.
5. Explain the concept of API versioning (such as '/api/v1/...') and why consistent route prefixes matter.`,
        },
        {
          order: 1,
          heading: 'End-to-End Request Flow & Project Directory Structure',
          body: `Let us trace the complete journey of an HTTP request inside LearnSphere:

Client (Browser / API Consumer)
   ↓  HTTP Request (e.g., PATCH /api/creator/courses/:courseId)
Route ('server/routes/courseCreator.js')
   ↓  Matches route pattern & executes attached middleware chain in order
Middleware ('server/middleware/*.js')
   ↓  1. authenticate -> 2. requireCourseCreator -> 3. validateInput -> 4. requireCourseOwnership
Controller ('server/controllers/courseCreatorCourseController.js')
   ↓  Extracts validated req data, calls service, formats HTTP response
Service ('server/services/courseCreatorCourseService.js')
   ↓  Executes business logic and coordinates model calls
Model ('server/models/Course.js')
   ↓  Validates schema and executes Mongoose query
MongoDB Database
   ↓  Persists BSON document on disk

Standard Backend Directory Layout:
server/
  ├── config/        (Database connection & environment configuration)
  ├── middleware/    (authenticate, authorize, ownership, validation, errorHandler)
  ├── models/        (User, Course, Module, Topic, Enrollment, Assessment)
  ├── services/      (Business logic modules per domain)
  ├── controllers/   (HTTP request/response handlers per domain)
  ├── routes/        (Modular express.Router() files mounted in server.js)
  └── server.js      (Express app initialization, global middleware, router mounting)`,
        },
        {
          order: 2,
          heading: 'Modular Routers with express.Router() and Route Prefixes',
          body: `Instead of attaching every route directly to 'app' in 'server.js', Express provides 'express.Router()'—a mini, mountable routing instance.

1. Creating a Domain Router (e.g., 'server/routes/courses.js'):
import express from 'express';
import * as courseController from '../controllers/courseController.js';

const router = express.Router();
router.get('/', courseController.listPublishedCourses);
router.get('/:id', courseController.getPublishedCourseById);
export default router;

2. Mounting Routers with Route Prefixes in 'server/server.js':
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/creator', courseCreatorRoutes);
app.use('/api/admin', adminRoutes);

Why Route Prefixes Are So Powerful:
Inside 'courseRoutes', you only write 'router.get("/:id", ...)', and because 'server.js' mounted that router at '/api/courses', the full URL automatically becomes 'GET /api/courses/:id'!`,
        },
        {
          order: 3,
          heading: 'Middleware Placement Order on Protected Routes',
          body: `The order in which you attach middleware to a router or route is a critical security boundary. Consider a protected Course Creator route in 'server/routes/courseCreator.js':

// 1. Router-level authentication & role enforcement (runs for EVERY route in this file):
router.use(authenticate, requireCourseCreator);

// 2. Route-specific validation, ownership check, and controller delegation:
router.patch(
  '/courses/:courseId/modules/:moduleId/topics/:topicId/content',
  updateTopicContentValidation,
  requireCourseOwnership({ paramName: 'courseId' }),
  requireModuleOwnership({ moduleParam: 'moduleId' }),
  courseCreatorTopicController.updateTopicContent
);

Why Must Middleware Run in This Exact Sequence?
1. 'authenticate' (First): Verifies the JWT access token and populates 'req.user'. Unauthenticated requests are rejected immediately with '401 Unauthorized' before touching the database.
2. 'requireCourseCreator' (Second): Verifies 'req.user.role === "course_creator"'. Students are rejected immediately with '403 Forbidden'.
3. 'updateTopicContentValidation' (Third): Validates ':courseId', ':moduleId', ':topicId' ObjectId formats and request body fields, returning '400 Bad Request' if malformed.
4. 'requireCourseOwnership' & 'requireModuleOwnership' (Fourth): Queries MongoDB to confirm the authenticated creator actually owns ':courseId' and that ':moduleId' belongs to ':courseId'.
5. 'Controller' (Last): Only runs after every single security and validation gate has passed!`,
        },
        {
          order: 4,
          heading: 'API Versioning Concept',
          body: `As an application grows and serves mobile apps or third-party integrations, you may eventually need to change a response format without breaking older clients.

How API Versioning Works:
Many APIs include a version prefix in the URL path:
• '/api/v1/courses' (Version 1 contract)
• '/api/v2/courses' (Version 2 contract with updated structure)

Because Express routers use mounted prefixes ('app.use("/api/v1/courses", v1CourseRouter)'), organizing your routes into modular 'express.Router()' files from day one makes introducing versioned prefixes clean and effortless whenever your project requires it.`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Placing a specific static route AFTER a dynamic parameter route: In Express, routes match in the exact order they are registered! If you register 'router.get("/:id", getCourseById)' BEFORE 'router.get("/featured", getFeaturedCourses)', a request to 'GET /api/courses/featured' will match '/:id' with 'req.params.id = "featured"'! Always register specific static paths ('/featured', '/status') before dynamic parameter paths ('/:id').
2. Mounting 'authenticate' or 'requireCourseCreator' AFTER the controller or forgetting it on a new route: Using 'router.use(authenticate, requireCourseCreator)' at the top of a protected router file ensures no route added later in that file can accidentally forget authentication.
3. Repeating the mount prefix inside the router file: If 'server.js' mounts 'app.use("/api/courses", courseRoutes)', do not write 'router.get("/api/courses/:id")' inside 'courseRoutes.js' or the URL will become '/api/courses/api/courses/:id'!`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `Practice Task — Designing a Modular Express Router with Middleware Ordering:
1. Write a modular router snippet for 'server/routes/studentNotes.js' expected to be mounted at 'app.use("/api/student/notes", studentNotesRouter)'.
2. Apply 'router.use(authenticate, requireStudent)' at the top of the router so every endpoint requires an authenticated student.
3. Define two routes that delegate to 'studentNoteController':
   • 'GET /course/:courseId' (lists the student's notes for a course)
   • 'POST /' (creates a new note after running 'validateCreateNote' middleware)
4. Explain why 'GET /course/:courseId' would conflict if you placed a generic 'GET /:noteId' route above a static 1-segment route like 'GET /summary'.`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `• Production Express APIs organize code into 'routes/', 'middleware/', 'controllers/', 'services/', and 'models/'.
• The request flow follows: Client → Route → Middleware → Controller → Service → Model → MongoDB.
• 'express.Router()' groups related endpoints into modular files mounted under clean prefixes ('/api/courses', '/api/creator', '/api/admin') in 'server.js'.
• Authentication, authorization, input validation, and ownership middleware must always execute before protected controller actions, and static routes must be declared before dynamic ':param' routes.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Modular Express Router Organization and Middleware Pipeline Order',
        language: 'javascript',
        code: `// ============================================================================
// File 1: server/routes/courseCreator.js (Domain-Scoped Express Router)
// ============================================================================
import express from 'express';
// Middleware imports (conceptual illustration of LearnSphere's pipeline):
// import { authenticate } from '../middleware/authenticate.js';
// import { requireCourseCreator, requireCourseOwnership } from '../middleware/courseCreatorAuthorization.js';
// import * as courseCreatorCourseController from '../controllers/courseCreatorCourseController.js';

export function buildCreatorRouter({
  authenticate,
  requireCourseCreator,
  validateCourseInput,
  requireCourseOwnership,
  courseController,
}) {
  const router = express.Router();

  // 1. Router-wide gate: Every route in this router requires authentication + course_creator role
  router.use(authenticate, requireCourseCreator);

  // 2. Specific static routes MUST come before dynamic :courseId routes
  router.get('/status', courseController.getCreatorStatus);

  // 3. Collection routes (/api/creator/courses)
  router.get('/courses', courseController.getCourses);
  router.post('/courses', validateCourseInput, courseController.createCourse);

  // 4. Resource-specific routes (/api/creator/courses/:courseId) with ownership middleware
  router.get(
    '/courses/:courseId',
    requireCourseOwnership({ paramName: 'courseId' }),
    courseController.getCourseById
  );
  router.patch(
    '/courses/:courseId',
    validateCourseInput,
    requireCourseOwnership({ paramName: 'courseId' }),
    courseController.updateCourse
  );

  return router;
}

// ============================================================================
// Tracing the Pipeline Execution Order:
// ============================================================================
const executionTrace = [];
const traceStep = (name) => () => executionTrace.push(name);

traceStep('1. Route Matched: PATCH /api/creator/courses/:courseId')();
traceStep('2. Middleware: authenticate (verifies JWT)')();
traceStep('3. Middleware: requireCourseCreator (verifies role === "course_creator")')();
traceStep('4. Middleware: validateCourseInput (validates body & params)')();
traceStep('5. Middleware: requireCourseOwnership (verifies creator owns courseId)')();
traceStep('6. Controller: courseController.updateCourse')();
traceStep('7. Service -> Model -> MongoDB')();

console.log(executionTrace.join('\n  ↓\n'));

/*
Expected Output:
1. Route Matched: PATCH /api/creator/courses/:courseId
  ↓
2. Middleware: authenticate (verifies JWT)
  ↓
3. Middleware: requireCourseCreator (verifies role === "course_creator")
  ↓
4. Middleware: validateCourseInput (validates body & params)
  ↓
5. Middleware: requireCourseOwnership (verifies creator owns courseId)
  ↓
6. Controller: courseController.updateCourse
  ↓
7. Service -> Model -> MongoDB
*/`,
        explanation:
          'Shows how an Express Router enforces authentication and role authorization at the router level, places static routes before dynamic routes, and sequences validation and ownership middleware prior to controller execution.',
      },
    ],
    importantPoints: [
      'Organize backend code by responsibility: routes/, middleware/, controllers/, services/, and models/.',
      'The request lifecycle flows: Client -> Route -> Middleware -> Controller -> Service -> Model -> MongoDB.',
      'Use express.Router() to group routes by domain or role and mount them with clear prefixes (e.g., app.use("/api/creator", creatorRouter)) in server.js.',
      'Always run authentication, role authorization, input validation, and ownership middleware BEFORE executing protected controller handlers.',
      'Register specific static routes (such as /status or /featured) before dynamic parameter routes (such as /:id) so static paths are not captured as parameter values.',
    ],
    externalReferences: [
      {
        title: 'Express.js Official API Reference: express.Router()',
        url: 'https://expressjs.com/en/4x/api.html#router',
        source: 'Express.js Official Documentation',
      },
      {
        title: 'Express.js Guide: Using Middleware on Routers',
        url: 'https://expressjs.com/en/guide/using-middleware.html#middleware.router',
        source: 'Express.js Official Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 5: CRUD API Implementation
  // ID: 6abe9dd4f15c2b4f6008ac49
  // =========================================================================
  {
    topicId: '6abe9dd4f15c2b4f6008ac49',
    title: 'CRUD API Implementation',
    content: {
      explanation: `Now that you understand REST API design, Controllers, Services, and Modular Routes, let us bring them together to implement a complete, production-grade CRUD (Create, Read, Update, Delete) REST API in Express.js.

In a REST API, the four CRUD operations map directly to HTTP methods and resource paths:
• Create → 'POST /api/courses'        (creates a new resource, returns '201 Created')
• Read   → 'GET /api/courses/:id'     (retrieves a resource, returns '200 OK' or '404 Not Found')
• Update → 'PATCH /api/courses/:id'   (partially updates allowed fields, returns '200 OK' or '404 Not Found')
• Delete → 'DELETE /api/courses/:id'  (removes a resource, returns '200 OK' or '404 Not Found')

Implementing each of these four endpoints safely requires coordinating input validation, field whitelisting (preventing mass assignment), service calls, database persistence, not-found handling, and consistent JSON response formatting.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Map Create, Read, Update, and Delete operations to their exact HTTP methods, URL paths, and HTTP status codes.
2. Trace how request bodies ('req.body') and route parameters ('req.params.id') are validated and passed to the Service layer.
3. Implement safe 'POST', 'GET', 'PATCH', and 'DELETE' handlers with proper '404 Not Found' handling when a target ID does not exist.
4. Explain the difference between 'PATCH' (partial field update) and 'PUT' (full replacement) in CRUD APIs.
5. Prevent mass-assignment vulnerabilities by never accepting arbitrary client fields during Create or Update operations.`,
        },
        {
          order: 1,
          heading: 'Mapping CRUD Operations to HTTP Methods, Paths, and Status Codes',
          body: `Every CRUD resource in an Express REST API follows this foundational mapping:

| Operation | HTTP Method | Endpoint Path       | Success Status | Common Error Statuses      |
| --------- | ----------- | ------------------- | -------------- | -------------------------- |
| Create    | POST        | /api/courses        | 201 Created    | 400 Bad Request, 401, 403  |
| Read One  | GET         | /api/courses/:id    | 200 OK         | 400 Invalid ID, 404        |
| Update    | PATCH       | /api/courses/:id    | 200 OK         | 400 Bad Request, 403, 404  |
| Delete    | DELETE      | /api/courses/:id    | 200 OK         | 400 Invalid ID, 403, 404  |

Why 'PATCH' Instead of 'PUT' for Most Updates?
• 'PUT /api/courses/:id' traditionally represents replacing the entire resource representation.
• 'PATCH /api/courses/:id' represents a partial modification—for example, updating only a course's 'title' or 'description' while leaving its 'syllabus', 'category', and 'status' untouched. In modern Express APIs (including LearnSphere), 'PATCH' with MongoDB's '$set' operator is the standard choice for safe, selective field updates.`,
        },
        {
          order: 2,
          heading: 'Step-by-Step: Implementing Create (POST) and Read (GET)',
          body: `1. CREATE — 'POST /api/creator/courses':
• Input Source: JSON request body ('req.body') parsed by 'express.json()', plus authenticated creator identity ('req.user.userId').
• Validation & Mass-Assignment Protection: Extract only the allowed fields ('title', 'description', 'category'). Ignore any client attempt to send '_id', 'createdAt', or someone else's 'courseCreator' ID!
• Service & Database Call: 'await Course.create({ title, description, category, courseCreator: creatorId, status: "draft" })'.
• HTTP Response: Return status '201 Created' with the newly created course object inside 'data.course'.

2. READ — 'GET /api/creator/courses/:id':
• Input Source: Route parameter 'req.params.id' (and 'req.user.userId' for creator-scoped reads).
• Validation: Verify 'mongoose.Types.ObjectId.isValid(id)' first; if invalid, return '400 Bad Request'.
• Service & Database Call: 'await Course.findOne({ _id: id, courseCreator: creatorId }).lean()'.
• Not-Found Handling: If the database returns 'null', return '404 Not Found' with '{ error: "Not Found", message: "Course not found" }'. Never return '200 OK' with 'data: null' when a specific ':id' does not exist!
• HTTP Response: Return status '200 OK' with '{ status: "success", data: { course } }'.`,
        },
        {
          order: 3,
          heading: 'Step-by-Step: Implementing Update (PATCH) and Delete (DELETE)',
          body: `3. UPDATE — 'PATCH /api/creator/courses/:id':
• Input Source: Route parameter 'req.params.id' (which resource to update) AND request body 'req.body' (which fields to modify).
• Whitelist Allowed Fields: Copy only explicitly permitted keys (such as 'title', 'description', 'category') into a clean 'updates' object.
• Service & Database Call:
  const updatedCourse = await Course.findOneAndUpdate(
    { _id: id, courseCreator: creatorId },
    { $set: updates },
    { new: true, runValidators: true }
  );
• Not-Found Handling: If 'updatedCourse' is 'null', throw/return '404 Not Found'.
• HTTP Response: Return '200 OK' with the updated resource.

4. DELETE — 'DELETE /api/creator/courses/:id':
• Input Source: Route parameter 'req.params.id' (and 'req.user.userId').
• Service & Database Call: Verify ownership and delete the document (plus any cascading child records like modules and topics if applicable):
  const deleted = await Course.findOneAndDelete({ _id: id, courseCreator: creatorId });
• Not-Found Handling: If 'deleted' is 'null', return '404 Not Found'.
• HTTP Response: Return '200 OK' with '{ status: "success", message: "Course deleted successfully" }'.`,
        },
        {
          order: 4,
          heading: 'Security Rule: Why the Server Must Reject Arbitrary Client Fields',
          body: `Imagine a 'User' or 'Course' model in MongoDB that has internal or privileged fields:
• On 'User': 'role' ('"student"', '"course_creator"', '"admin"'), 'passwordHash'.
• On 'Course': 'courseCreator' (owner ID), 'status', 'publishedAt'.

If an API endpoint writes:
✗ VULNERABLE MASS ASSIGNMENT:
  await User.findByIdAndUpdate(req.user.userId, { $set: req.body });

Then a client sending 'PATCH /api/profile' with '{ "name": "Alice", "role": "admin" }' would overwrite their own role to '"admin"'!
Instead, every CRUD endpoint in LearnSphere uses an explicit allowlist of fields:
✓ SAFE FIELD ALLOWLISTING:
  const allowedUpdates = {};
  if (typeof req.body.title === 'string') allowedUpdates.title = req.body.title.trim();
  if (typeof req.body.description === 'string') allowedUpdates.description = req.body.description.trim();`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Returning '200 OK' with 'null' when ':id' is not found in 'GET', 'PATCH', or 'DELETE': Always check whether the database returned 'null' (or 'deletedCount === 0') and respond with '404 Not Found'.
2. Returning '200 OK' instead of '201 Created' on 'POST' creation endpoints: '201 Created' explicitly signals that a new resource was persisted.
3. Forgetting to validate ':id' before calling 'findById(id)': Passing a non-ObjectId string like '"invalid-id"' into Mongoose without checking 'mongoose.Types.ObjectId.isValid(id)' triggers a 'CastError'.
4. Passing raw 'req.body' into 'Model.create(req.body)' or '$set: req.body': Always pick allowed fields explicitly.`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task',
          body: `Practice Task — Tracing a Complete 4-Endpoint CRUD Lifecycle:
1. Write out the four Express controller/service calls for a 'Module' resource scoped to a course ('/api/creator/courses/:courseId/modules' and '/api/creator/courses/:courseId/modules/:moduleId').
2. For each of the 4 operations (Create, Read One, Update, Delete), list:
   • Where the input IDs come from ('req.params')
   • Which fields are allowed from 'req.body' ('title', 'description', 'order')
   • What status code is returned on success and what status code is returned if ':moduleId' does not exist in that course.`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `• A CRUD REST API maps Create to 'POST' ('201 Created'), Read to 'GET' ('200 OK'), Update to 'PATCH' ('200 OK'), and Delete to 'DELETE' ('200 OK').
• Route parameters ('req.params.id') identify the target resource, while 'req.body' supplies the data payload for 'POST' and 'PATCH'.
• Every single-resource 'GET', 'PATCH', and 'DELETE' endpoint must check if the target document exists and return '404 Not Found' when no matching record is found.
• Never accept arbitrary fields from 'req.body'; always extract an explicit allowlist of permitted fields to prevent mass-assignment vulnerabilities.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Complete Safe CRUD Service & Controller Implementation Pattern',
        language: 'javascript',
        code: `import mongoose from 'mongoose';

/**
 * Demonstrates all 4 CRUD operations (Create, Read, Update, Delete)
 * with ObjectId validation, field allowlisting, and 404 Not Found handling.
 */
export function createCrudHandlers(CourseModel) {
  const isValidId = (id) => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id);

  return {
    // 1. CREATE: POST /api/courses -> 201 Created
    async create(req, res, next) {
      try {
        const { title, description = '', category = 'general' } = req.body;
        const course = await CourseModel.create({
          title: String(title || '').trim(),
          description: String(description).trim(),
          category: String(category).trim().toLowerCase(),
          status: 'draft', // Server-controlled default, never trusted from client
          courseCreator: req.user.userId,
        });
        return res.status(201).json({ status: 'success', data: { course } });
      } catch (err) {
        return next(err);
      }
    },

    // 2. READ ONE: GET /api/courses/:id -> 200 OK or 404 Not Found
    async getById(req, res, next) {
      try {
        const { id } = req.params;
        if (!isValidId(id)) {
          return res.status(400).json({ error: 'Bad Request', message: 'Invalid course ID format' });
        }
        const course = await CourseModel.findOne({ _id: id, courseCreator: req.user.userId });
        if (!course) {
          return res.status(404).json({ error: 'Not Found', message: 'Course not found' });
        }
        return res.status(200).json({ status: 'success', data: { course } });
      } catch (err) {
        return next(err);
      }
    },

    // 3. UPDATE: PATCH /api/courses/:id -> 200 OK or 404 Not Found
    async updateById(req, res, next) {
      try {
        const { id } = req.params;
        if (!isValidId(id)) {
          return res.status(400).json({ error: 'Bad Request', message: 'Invalid course ID format' });
        }
        // Strict allowlist of updatable fields (prevents mass assignment)
        const safeUpdates = {};
        for (const field of ['title', 'description', 'category']) {
          if (typeof req.body[field] === 'string') {
            safeUpdates[field] = req.body[field].trim();
          }
        }
        const course = await CourseModel.findOneAndUpdate(
          { _id: id, courseCreator: req.user.userId },
          { $set: safeUpdates },
          { new: true, runValidators: true }
        );
        if (!course) {
          return res.status(404).json({ error: 'Not Found', message: 'Course not found' });
        }
        return res.status(200).json({ status: 'success', data: { course } });
      } catch (err) {
        return next(err);
      }
    },

    // 4. DELETE: DELETE /api/courses/:id -> 200 OK or 404 Not Found
    async deleteById(req, res, next) {
      try {
        const { id } = req.params;
        if (!isValidId(id)) {
          return res.status(400).json({ error: 'Bad Request', message: 'Invalid course ID format' });
        }
        const deleted = await CourseModel.findOneAndDelete({ _id: id, courseCreator: req.user.userId });
        if (!deleted) {
          return res.status(404).json({ error: 'Not Found', message: 'Course not found' });
        }
        return res.status(200).json({ status: 'success', message: 'Course deleted successfully' });
      } catch (err) {
        return next(err);
      }
    },
  };
}

console.log('Valid ObjectId check ("6abe9dc2f15c2b4f6008ac1c"):', mongoose.Types.ObjectId.isValid('6abe9dc2f15c2b4f6008ac1c'));
console.log('Invalid ObjectId check ("not-an-id"):', mongoose.Types.ObjectId.isValid('not-an-id'));

/*
Expected Output:
Valid ObjectId check ("6abe9dc2f15c2b4f6008ac1c"): true
Invalid ObjectId check ("not-an-id"): false
*/`,
        explanation:
          'Illustrates all four CRUD endpoints (POST, GET, PATCH, DELETE) with ObjectId validation, strict field allowlisting against mass assignment, ownership scoping, and 404 Not Found handling.',
      },
    ],
    importantPoints: [
      'CRUD maps directly to HTTP methods: Create -> POST (201), Read -> GET (200), Update -> PATCH (200), and Delete -> DELETE (200).',
      'Always validate route parameter IDs (such as checking mongoose.Types.ObjectId.isValid(id)) before querying the database.',
      'Return 404 Not Found whenever a GET, PATCH, or DELETE operation targets a resource ID that does not exist or does not belong to the user.',
      'Use PATCH with MongoDB $set and { new: true, runValidators: true } to perform validated partial updates.',
      'Never pass raw req.body into create or update queries; always extract an explicit allowlist of permitted fields to prevent mass assignment.',
    ],
    externalReferences: [
      {
        title: 'MDN Web Docs: HTTP Response Status Codes Reference',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status',
        source: 'MDN Web Docs',
      },
      {
        title: 'Express.js Official API Reference: req.params, req.body, and res.status()',
        url: 'https://expressjs.com/en/4x/api.html#req',
        source: 'Express.js Official Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },
];
