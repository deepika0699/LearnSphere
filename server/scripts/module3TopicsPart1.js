/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LearnSphere Module 3 — Express.js Content (Part 1: Topics 1–5)
 */

export const module3TopicsPart1 = [
  // =========================================================================
  // TOPIC 1: What Is Express.js?
  // ID: 6abe9dcaf15c2b4f6008ac31
  // =========================================================================
  {
    topicId: '6abe9dcaf15c2b4f6008ac31',
    title: 'What Is Express.js?',
    content: {
      explanation: `When you build an HTTP server using Node.js's built-in 'node:http' module, you have to manually inspect 'req.method' and 'req.url' with long chains of 'if/else' statements, manually collect incoming request data chunks, manually set headers on every response, and write custom logic to extract dynamic URL values. While that works for two or three routes, a real backend application with dozens of API endpoints quickly becomes difficult to maintain.

Express.js (commonly called Express) solves this problem. Express.js is a minimal, fast, unopinionated web application framework built on top of Node.js.

It is vital to understand the exact relationship between Node.js and Express.js:
• Node.js is the runtime environment that executes JavaScript outside the browser and provides low-level operating system networking APIs.
• Express.js is a web framework running on Node.js (installed as an npm package) that wraps Node.js's built-in HTTP module with clean, developer-friendly tools for routing, middleware pipelines, request/response handling, and centralized error handling.

Express.js does NOT replace Node.js; rather, Express runs inside Node.js to make building backend web servers and REST APIs faster, cleaner, and more structured.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Define Express.js accurately as a web framework that runs on top of the Node.js runtime.
2. Clearly distinguish between Node.js (the runtime environment) and Express.js (the web framework).
3. Compare a raw 'node:http' server with an equivalent Express.js server.
4. Explain how Express simplifies routing, middleware processing, request/response handling, and error handling.
5. Identify what Express provides out of the box versus what Express does NOT provide automatically.`,
        },
        {
          order: 1,
          heading: 'Node.js vs. Express.js & Real-World Analogy',
          body: `Let us clearly separate the roles of Node.js and Express.js:

• Node.js = Runtime Environment:
Provides the V8 JavaScript engine, the Event Loop, and low-level system modules like 'node:http', 'node:fs', and 'node:crypto'.

• Express.js = Web Framework Running on Node.js:
An npm package ('express') that sits on top of 'node:http' and provides an organized structure for defining routes, chaining middleware functions, parsing JSON bodies, and sending responses.

Real-World Analogy — Electrical Wiring vs. Pre-Built Wall Outlets & Switches:
• Node.js ('node:http') is like the raw electrical wiring and circuit breaker panel installed in a building. It supplies all the power, but connecting every lamp directly to raw wires by hand is tedious and error-prone.
• Express.js is like standardized wall outlets, light switches, and labeled control panels built on top of that wiring. The electricity still comes from Node.js, but Express gives you clean sockets and switches to plug in routes and security checks effortlessly.`,
        },
        {
          order: 2,
          heading: 'How Express Simplifies Backend Development',
          body: `Express streamlines five core areas of backend engineering:

1. Declarative Routing:
Instead of writing nested 'if (req.method === "GET" && req.url === "/api/courses")' checks, you write clean method-specific route declarations such as 'app.get("/api/courses", handler)' and 'app.post("/api/courses", handler)'.

2. Dynamic Route & Query Extraction:
Express automatically extracts URL route parameters (like '/api/courses/:id' into 'req.params.id') and URL query strings (like '?page=2' into 'req.query.page') without manual string splitting.

3. Middleware Pipeline:
Express lets you plug reusable functions (middleware) into the request lifecycle to handle logging, security headers, CORS, rate limiting, authentication, and input validation before a request ever reaches your route logic.

4. Enhanced Request and Response Helpers:
Express enriches Node.js's 'req' and 'res' objects with convenient methods like 'express.json()' (which automatically parses incoming JSON request bodies into 'req.body') and 'res.status(200).json(data)' (which sets headers and serializes JSON in one call).

5. Centralized Error Handling:
Express provides a dedicated four-argument error-handling middleware pattern '(err, req, res, next)' so all unexpected errors across your entire API can be caught, sanitized, and formatted in one place.`,
        },
        {
          order: 3,
          heading: 'What Express Does NOT Provide Automatically ( & The Layered Architecture)',
          body: `Because Express is deliberately "minimal and unopinionated," it does NOT lock you into a rigid folder structure or bundle everything into one giant tool. Specifically, Express does NOT automatically provide:
• A built-in database or Object Data Modeling library (you pair Express with a database driver or ODM like Mongoose for MongoDB).
• Built-in user authentication or role-based access control (you implement JWT/session middleware).
• Automatic input validation or security headers (you add packages like 'express-validator', 'helmet', 'cors', and 'express-rate-limit').

Beginner Introduction to Layered Backend Architecture:
In structured Express backends like LearnSphere, code is organized into four distinct responsibilities (which we will explore deeply in Module 5):
Route
  ↓  (Matches the HTTP method and URL path, e.g., GET /api/courses)
Controller
  ↓  (Coordinates request/response behavior: reads req, calls service, sends res)
Service
  ↓  (Contains core business logic and rules)
Model / Database
     (Defines data schemas and queries the MongoDB database)`,
        },
        {
          order: 4,
          heading: 'Common Beginner Mistakes',
          body: `1. Claiming Express Replaces Node.js:
Mistake: Saying "We switched our backend from Node.js to Express.js."
Reality: Express cannot run without Node.js! Express is a JavaScript library running inside the Node.js runtime.

2. Assuming Express Automatically Secures or Validates Data:
Mistake: Thinking that using Express automatically blocks malicious input or parses JSON without configuration.
Reality: You must explicitly enable 'app.use(express.json())' to parse JSON bodies, and you must explicitly validate client input and configure security middleware.

3. Putting All Database Queries and Business Rules Inside server.js:
Mistake: Writing thousands of lines of routes, validation, and database queries in a single file.
Reality: Express makes it easy to split routes, controllers, services, and models into separate modular files.`,
        },
        {
          order: 5,
          heading: 'Suggested Practice Task',
          body: `Comparison Exercise:
Compare the two code examples below (the raw 'node:http' server vs. the Express server).
1. List three specific things that the Express example handles in fewer lines of code than the 'node:http' example.
2. In your own words, explain why Express is described as a "web framework running on Node.js" rather than a replacement for Node.js.
3.Briefly state the difference between a Route, a Controller, a Service, and a Model.`,
        },
        {
          order: 6,
          heading: 'Topic Summary',
          body: `• Node.js is the JavaScript runtime environment; Express.js is the most widely used web framework running on top of Node.js.
• Express wraps Node.js's built-in 'node:http' module to provide clean routing, middleware pipelines, automatic parameter parsing, 'res.json()' helpers, and centralized error handling.
• Express is unopinionated: it does not include a built-in database, authentication system, or schema validator by default.
• Clean Express applications separate concerns across Routes, Controllers, Services, and Models.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Before vs. After: Raw node:http Server vs. Equivalent Express.js Server',
        language: 'javascript',
        code: `// --- BEFORE: Using Raw Node.js Built-In 'node:http' ---
import http from 'node:http';

const rawServer = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/api/info') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ runtime: 'Node.js', approach: 'node:http' }));
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

// --- AFTER: Equivalent Server Using Express.js ---
import express from 'express';

const app = express();

app.get('/api/info', (req, res) => {
  res.status(200).json({ runtime: 'Node.js', framework: 'Express.js' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});`,
        explanation: `This side-by-side comparison highlights why developers use Express. In the raw 'node:http' version, you must manually check 'req.method === "GET" && req.url === "/api/info"', manually set the 'Content-Type: application/json' header with 'res.writeHead()', and manually call 'JSON.stringify()'. In the Express version, 'app.get("/api/info", ...)' matches the method and path declaratively, and 'res.status(200).json(...)' automatically sets the JSON header and serializes the object.

Expected JSON Output from GET /api/info (Express version):
{"runtime":"Node.js","framework":"Express.js"}`,
      },
    ],
    importantPoints: [
      'Node.js is the JavaScript runtime environment; Express.js is a web framework that runs on top of Node.js.',
      'Express does not replace Node.js—it builds upon Node.js\'s built-in node:http module.',
      'Express simplifies backend development through declarative routing, middleware pipelines, req/res helpers, and centralized error handling.',
      'Express is minimal and unopinionated: database drivers (like Mongoose), authentication, and input validation are added separately.',
      'Well-structured Express backends organize responsibilities into Routes, Controllers, Services, and Models.',
    ],
    externalReferences: [
      {
        title: 'Express.js Official Documentation: Getting Started & Overview',
        url: 'https://expressjs.com/en/starter/installing.html',
        source: 'Express.js Official Docs',
      },
      {
        title: 'MDN Web Docs: Express Web Framework (Node.js/JavaScript) Overview',
        url: 'https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/Introduction',
        source: 'MDN Web Docs',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 2: Creating an Express Server
  // ID: 6abe9dcaf15c2b4f6008ac32
  // =========================================================================
  {
    topicId: '6abe9dcaf15c2b4f6008ac32',
    title: 'Creating an Express Server',
    content: {
      explanation: `Because Express.js is an external third-party package rather than a module built directly into Node.js, creating an Express server begins with initializing a Node.js project (` + '`package.json`' + `) and installing the ` + '`express`' + ` package via ` + '`npm`' + `.

Consistent with modern Node.js best practices and the actual LearnSphere backend architecture, we configure ` + '`"type": "module"`' + ` in ` + '`package.json`' + ` so our server uses clean ES Module ` + '`import`' + ` and ` + '`export`' + ` syntax.

In this topic, you will walk step-by-step through creating a new project, installing Express, instantiating an Express application (` + '`const app = express()`' + `), defining a root route (` + '`GET /`' + `), starting the server with ` + '`app.listen()`' + `, and tracing the complete request/response flow when a client connects.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Initialize a new Node.js project with ` + '`npm init -y`' + ` and install Express with ` + '`npm install express`' + `.
2. Configure ` + '`package.json`' + ` with ` + '`"type": "module"`' + ` and start/dev scripts.
3. Import Express using ES Module syntax and create an Express application instance (` + '`const app = express()`' + `).
4. Define a basic ` + '`GET /`' + ` route returning a JSON response and bind the server to a port using ` + '`app.listen()`' + `.
5. Trace the step-by-step request/response flow when testing the server in a browser or terminal.`,
        },
        {
          order: 1,
          heading: 'Step-by-Step: Project Setup and Installing Express',
          body: `Let us walk through setting up an Express project from scratch in your terminal:

Step 1: Create and enter a new project directory:
  mkdir express-starter
  cd express-starter

Step 2: Initialize package.json:
  npm init -y
  This creates a 'package.json' file at the root of your folder.

Step 3: Install Express via npm:
  npm install express
  This downloads Express into 'node_modules/', creates 'package-lock.json', and adds '"express"' under '"dependencies"' in your 'package.json'.

Step 4: Enable ES Modules in package.json:
  Open 'package.json' and ensure '"type": "module"' is present (just as in LearnSphere's 'package.json'). This allows you to write 'import express from "express";' instead of legacy CommonJS 'require()'. You can also add '"start": "node server.js"' and '"dev": "node --watch server.js"' under '"scripts"'.`,
        },
        {
          order: 2,
          heading: 'Line-by-Line Breakdown of an Express Server (server.js)',
          body: `Once Express is installed, creating 'server.js' takes only a few clear steps:

1. Importing Express:
  import express from 'express';
  Loads the Express module installed in 'node_modules'.

2. Creating the Express Application Instance:
  const app = express();
  Calling 'express()' creates your main application object ('app'). You use 'app' to register middleware, define routes, and start listening for requests.

3. Configuring the Port:
  const PORT = Number(process.env.PORT) || 5000;
  Reads the port from environment variables or defaults safely to 5000.

4. Defining a Basic Route (GET /):
  app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Welcome to Express!' });
  });
  Registers a route handler that runs whenever a client sends an HTTP GET request to the root path '/'.

5. Starting the Server with app.listen():
  app.listen(PORT, () => {
    console.log(\`Express server listening on http://localhost:\${PORT}\`);
  });
  Under the hood, 'app.listen()' creates a Node.js HTTP server, binds it to 'PORT', and runs the callback once the server is ready to accept connections.`,
        },
        {
          order: 3,
          heading: 'Testing the Server & Understanding the Request–Response Flow',
          body: `How to Start and Test Your Server:
1. Run 'node server.js' (or 'npm run dev') in your terminal.
2. Open your web browser to 'http://localhost:5000/' or run 'curl -i http://localhost:5000/' in a second terminal window.

What Happens During the Request–Response Flow:
Step 1: The client (browser or curl) sends an HTTP GET request to 'http://localhost:5000/'.
Step 2: Node.js receives the raw TCP/HTTP connection on port 5000 and hands the incoming request to your Express 'app' instance.
Step 3: Express wraps the raw request and response into enhanced 'req' and 'res' objects and checks its registered route table.
Step 4: Express sees that the request method ('GET') and path ('/') match 'app.get("/", ...)'.
Step 5: Express invokes your handler function '(req, res) => ...'.
Step 6: 'res.status(200).json(...)' sets the HTTP status code to 200, sets the header 'Content-Type: application/json; charset=utf-8', converts the JavaScript object to a JSON string, and ends the response.
Step 7: The client receives the 200 OK JSON response, while the Express server stays running in the Event Loop ready for the next request.`,
        },
        {
          order: 4,
          heading: 'Common Beginner Mistakes',
          body: `1. Forgetting to Call express() as a Function:
Mistake: Importing 'express' and immediately calling 'express.get("/", ...)' instead of creating an instance with 'const app = express();' first.
Reality: The default export of 'express' is a factory function. You must call 'const app = express()' to create your server application object.

2. Running 'node server.js' Before Running 'npm install express':
Mistake: Writing 'import express from "express"' without installing the package first, causing "Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'express'".
Reality: Because Express is an external npm package, you must run 'npm install express' in your project directory first.

3. Forgetting to Callapp.listen():
Mistake: Defining routes on 'app', running 'node server.js', and wondering why the script immediately exits back to the command prompt.
Reality: Without 'app.listen(PORT)', the server never binds to a network port, so the Node.js Event Loop has nothing to wait for and exits immediately.`,
        },
        {
          order: 5,
          heading: 'Suggested Practice Task',
          body: `Hands-On Server Creation Task:
1. Create a new directory 'my-express-app', initialize it with 'npm init -y', and install Express with 'npm install express'.
2. Add '"type": "module"' to 'package.json'.
3. Create 'server.js' with a 'GET /' route that returns:
   {
     "application": "LearnSphere Practice Server",
     "status": "running",
     "module": 3
   }
4. Start the server with 'node server.js', visit 'http://localhost:5000/' in your browser to verify the JSON response, and then stop the server cleanly with Ctrl + C.`,
        },
        {
          order: 6,
          heading: 'Topic Summary',
          body: `• Setting up an Express project starts with 'npm init -y', 'npm install express', and configuring '"type": "module"' in 'package.json'.
• Call 'const app = express()' to create the Express application instance.
• Use 'app.get("/", (req, res) => { ... })' to handle incoming GET requests at the root URL and respond with 'res.status(200).json(...)'.
• Call 'app.listen(PORT, callback)' to bind the server to a network port and begin accepting HTTP connections.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'package.json After Running npm init and npm install express (ES Modules)',
        language: 'json',
        code: `{
  "name": "express-starter",
  "version": "1.0.0",
  "description": "Minimal Express.js server using ES Modules",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  "dependencies": {
    "express": "^4.21.2"
  }
}`,
        explanation: `When you run 'npm init -y' followed by 'npm install express' and set '"type": "module"', your 'package.json' looks like this. Setting '"type": "module"' matches the LearnSphere backend architecture and enables standard ES Module 'import' statements.`,
      },
      {
        title: 'Complete Minimal Express Server (server.js)',
        language: 'javascript',
        code: `// server.js - Minimal runnable Express.js server using ES Modules
import express from 'express';

// 1. Create the Express application instance
const app = express();

// 2. Define the port (using environment variable or safe fallback 5000)
const PORT = Number(process.env.PORT) || 5000;

// 3. Define a basic GET / route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Express.js server is up and running!',
    module: 'Module 3 — Express.js'
  });
});

// 4. Start listening for incoming HTTP requests
app.listen(PORT, () => {
  console.log(\`Express server running at http://localhost:\${PORT}\`);
});`,
        explanation: `Line-by-line explanation:
1. 'import express from "express"' loads the Express framework.
2. 'const app = express()' creates the Express application instance.
3. 'const PORT = ...' sets the listening port to 5000 if 'process.env.PORT' is not set.
4. 'app.get("/", ...)' registers a route handler for HTTP GET requests to '/'. Inside, 'res.status(200).json(...)' sends a 200 OK status with a JSON body.
5. 'app.listen(PORT, ...)' starts the HTTP server on port 5000.

Expected Terminal Output when running 'node server.js':
Express server running at http://localhost:5000

Expected Browser / curl Output for GET http://localhost:5000/:
{"status":"ok","message":"Express.js server is up and running!","module":"Module 3 — Express.js"}`,
      },
    ],
    importantPoints: [
      'Initialize a Node.js project with npm init -y and install Express with npm install express.',
      'Set "type": "module" in package.json to use modern ES Module import/export syntax.',
      'Always call const app = express() to instantiate the Express application object.',
      'Use res.status(200).json(data) to send a status code, set the Content-Type: application/json header, and serialize a JavaScript object in one step.',
      'Call app.listen(PORT, callback) at the bottom of your server entry file to begin listening for HTTP requests.',
    ],
    externalReferences: [
      {
        title: 'Express.js Official Starter Guide: Hello World Example',
        url: 'https://expressjs.com/en/starter/hello-world.html',
        source: 'Express.js Official Docs',
      },
      {
        title: 'Express.js 4.x API Reference: express() and app.listen()',
        url: 'https://expressjs.com/en/4x/api.html#app.listen',
        source: 'Express.js Official Docs',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 3: Routes
  // ID: 6abe9dcbf15c2b4f6008ac33
  // =========================================================================
  {
    topicId: '6abe9dcbf15c2b4f6008ac33',
    title: 'Routes',
    content: {
      explanation: `In a backend web application, clients send requests to many different URLs using different HTTP methods—for example, ` + '`GET /api/courses`' + ` to view courses, ` + '`POST /api/courses`' + ` to create a course, or ` + '`DELETE /api/courses/101`' + ` to remove a course.

Routing refers to how an Express application determines which handler function should execute when a request arrives for a specific combination of HTTP Method and URL Path (endpoint).

Every Express route definition has three essential parts:
` + '`app.METHOD(PATH, HANDLER)`' + `
1. ` + '`METHOD`' + `: The HTTP method in lowercase (` + '`get`' + `, ` + '`post`' + `, ` + '`put`' + `, ` + '`patch`' + `, ` + '`delete`' + `).
2. ` + '`PATH`' + `: The URL path on the server (for example, ` + `'/api/courses'` + `).
3. ` + '`HANDLER`' + `: The callback function ` + '`(req, res) => { ... }`' + ` executed when Express matches both the method and the path.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Define what an Express route is and identify its three components: HTTP method, URL path, and route handler.
2. Use ` + '`app.get()`' + `, ` + '`app.post()`' + `, ` + '`app.put()`' + `, ` + '`app.patch()`' + `, and ` + '`app.delete()`' + ` to define RESTful endpoints.
3. Explain how Express evaluates routes in top-to-bottom registration order to determine which handler runs.
4. Implement a catch-all 404 fallback handler at the end of your route definitions.`,
        },
        {
          order: 1,
          heading: 'Core Express Routing Methods & Why the HTTP Method Matters',
          body: `Express provides dedicated methods on the 'app' (or 'express.Router()') object that correspond directly to standard HTTP methods:

• app.get(path, handler)    — Handles GET requests (reading/fetching data safely without modifying server state).
• app.post(path, handler)   — Handles POST requests (creating a new resource).
• app.put(path, handler)    — Handles PUT requests (completely replacing an existing resource).
• app.patch(path, handler)  — Handles PATCH requests (partially updating specific fields of an existing resource).
• app.delete(path, handler) — Handles DELETE requests (removing a resource).

Why the HTTP Method Matters:
Notice that two completely different routes can share the exact same URL path as long as their HTTP methods differ!
• GET  /api/courses → Lists existing courses.
• POST /api/courses → Creates a brand-new course.

Similarly, for a single course identified by ':id':
• GET    /api/courses/:id → Reads course ':id'.
• PATCH  /api/courses/:id → Updates fields on course ':id'.
• DELETE /api/courses/:id → Deletes course ':id'.

A route only matches when BOTH the incoming request's HTTP method AND its URL path match the route definition.`,
        },
        {
          order: 2,
          heading: 'How Express Matches Routes: Registration Order & 404 Fallbacks',
          body: `How does Express decide which route handler to run when a request arrives?

1. Top-to-Bottom Sequential Matching:
Express stores routes in the exact order they are registered in your code. When a request comes in, Express checks each route from top to bottom and executes the FIRST route handler whose HTTP method and path pattern match the request.

2. Specific Routes Must Come Before Dynamic Wildcard Routes:
Because Express stops at the first match (unless 'next()' is called), route order matters!
Suppose you have two GET routes:
• '/api/courses/featured' (a specific static path)
• '/api/courses/:id' (a dynamic parameter path that matches anything after '/api/courses/')

If you register '/api/courses/:id' FIRST, a request to 'GET /api/courses/featured' will match '/api/courses/:id' with 'id = "featured"', and your '/api/courses/featured' handler below it will never be reached! Always place specific static routes above dynamic ':param' routes.

3. The 404 Fallback Route:
What if a request does not match any registered route? You register a catch-all middleware at the very bottom of all your routes—after every 'app.get', 'app.post', etc.—to return a clean HTTP 404 Not Found JSON response.`,
        },
        {
          order: 3,
          heading: 'Architectural Preview: Where Routes Fit in Larger Apps',
          body: `In this topic, we write our route handlers directly inside 'app.get(...)' so you can focus purely on how Express routing works.

As applications grow, putting all logic directly inside route definitions makes files too large. In production Express applications like LearnSphere:
• Routes (in 'server/routes/') only declare the HTTP method, path, validation/auth middleware, and point to a Controller function.
• Controllers (in 'server/controllers/') handle 'req' and 'res'.
• Services (in 'server/services/') execute business logic.
• Models (in 'server/models/') talk to MongoDB.

We will keep our examples focused on direct route handlers here in Module 3 and build out the full multi-layer Controller/Service architecture in Module 5.`,
        },
        {
          order: 4,
          heading: 'Common Beginner Mistakes',
          body: `1. Placing the 404 Catch-All Handler at the Top of the File:
Mistake: Registering 'app.use((req, res) => res.status(404)...)' above your 'app.get('/api/courses', ...)' routes.
Reality: Because Express evaluates handlers from top to bottom, a catch-all placed at the top intercepts every single request and returns 404 before Express ever checks the routes below it! Always place the 404 handler AFTER all routes.

2. Placing Dynamic ':id' Routes Above Static Sub-Routes:
Mistake: Defining 'app.get("/api/courses/:id", ...)' before 'app.get("/api/courses/summary", ...)'.
Reality: Express will treat '"summary"' as the ':id' parameter. Always define specific static paths first.

3. Sending Two Responses in the Same Route Handler:
Mistake: Calling 'res.status(404).json(...)' inside an 'if' block without 'return', so execution continues to a second 'res.json(...)' at the bottom of the handler, causing "Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client".
Reality: Always use 'return res.status(...).json(...)' when exiting a handler early.`,
        },
        {
          order: 5,
          heading: 'Suggested Practice Task',
          body: `Route Ordering & Matching Exercise:
Suppose an Express server registers routes in this exact order:
  Route A: app.get('/api/courses/popular', handlerA)
  Route B: app.get('/api/courses/:id', handlerB)
  Route C: app.post('/api/courses', handlerC)
  Route D: app.patch('/api/courses/:id', handlerD)
  Route E: app.use(notFoundHandler)

Determine which handler (A, B, C, D, or E) executes for each request below:
1. GET /api/courses/popular
2. GET /api/courses/42
3. POST /api/courses
4. DELETE /api/courses/42
5. What would happen to Request #1 if Route B were registered above Route A?`,
        },
        {
          order: 6,
          heading: 'Topic Summary',
          body: `• An Express route pairs an HTTP method, a URL path pattern, and a handler function: app.METHOD(path, handler).
• Express supports app.get(), app.post(), app.put(), app.patch(), and app.delete() for standard REST operations.
• Express evaluates routes sequentially in the exact order they are registered, executing the first matching route.
• Specific static routes (like '/api/courses/featured') must be registered before dynamic parameter routes (like '/api/courses/:id'), and the 404 catch-all handler must be registered last.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Express Routing Demo: Matching Methods, Paths, Order, and 404 Fallback',
        language: 'javascript',
        code: `// routes_demo.js - Demonstrating Express route methods and matching order
import express from 'express';

const app = express();
app.use(express.json());

// 1. Specific static GET route (placed BEFORE dynamic :id route)
app.get('/api/courses/featured', (req, res) => {
  return res.status(200).json({
    action: 'GET featured courses',
    featured: 'Backend Development with Node.js, Express & MongoDB'
  });
});

// 2. Collection routes sharing the path '/api/courses' with different HTTP methods
app.get('/api/courses', (req, res) => {
  return res.status(200).json({ action: 'List all courses' });
});

app.post('/api/courses', (req, res) => {
  return res.status(201).json({ action: 'Create a new course' });
});

// 3. Single-resource routes on '/api/courses/:id'
app.get('/api/courses/:id', (req, res) => {
  return res.status(200).json({ action: \`Get course \${req.params.id}\` });
});

app.patch('/api/courses/:id', (req, res) => {
  return res.status(200).json({ action: \`Partially update course \${req.params.id}\` });
});

app.delete('/api/courses/:id', (req, res) => {
  return res.status(200).json({ action: \`Delete course \${req.params.id}\` });
});

// 4. Catch-All 404 Fallback (MUST be registered AFTER all valid routes)
app.use((req, res) => {
  return res.status(404).json({
    error: 'Not Found',
    message: \`No route matched \${req.method} \${req.path}\`
  });
});`,
        explanation: `This example demonstrates how Express matches routes by both HTTP method and path, and why registration order is critical. Notice that '/api/courses/featured' is placed above '/api/courses/:id' so requests for '/api/courses/featured' are not swallowed by ':id'. Finally, the 404 fallback at the bottom catches any unmatched method or URL.

Expected Outputs:
• GET /api/courses/featured  -> Status 200: {"action":"GET featured courses","featured":"Backend Development with Node.js, Express & MongoDB"}
• POST /api/courses          -> Status 201: {"action":"Create a new course"}
• PATCH /api/courses/123     -> Status 200: {"action":"Partially update course 123"}
• GET /api/unknown           -> Status 404: {"error":"Not Found","message":"No route matched GET /api/unknown"}`,
      },
    ],
    importantPoints: [
      'A route consists of an HTTP method (get, post, put, patch, delete), a URL path pattern, and a handler function.',
      'A route only executes when both the incoming HTTP method and the URL path match.',
      'Express checks routes in top-to-bottom registration order and executes the first matching handler.',
      'Always define specific static routes (such as /api/courses/featured) before dynamic parameter routes (such as /api/courses/:id).',
      'Always register the 404 Not Found fallback handler after all route definitions.',
    ],
    externalReferences: [
      {
        title: 'Express.js Official Guide: Routing',
        url: 'https://expressjs.com/en/guide/routing.html',
        source: 'Express.js Official Docs',
      },
      {
        title: 'Express.js Basic Routing Starter Guide',
        url: 'https://expressjs.com/en/starter/basic-routing.html',
        source: 'Express.js Official Docs',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 4: Route Parameters
  // ID: 6abe9dcbf15c2b4f6008ac34
  // =========================================================================
  {
    topicId: '6abe9dcbf15c2b4f6008ac34',
    title: 'Route Parameters',
    content: {
      explanation: `Imagine an online learning platform with 500 courses. It would be impossible to hardcode 500 separate routes like ` + '`app.get("/api/courses/1", ...)`' + `, ` + '`app.get("/api/courses/2", ...)`' + `, and so on.

Instead, Express allows you to define dynamic URL segments called Route Parameters by prefixing a segment name with a colon (` + '`:`' + `), such as:
` + '`/api/courses/:courseId`' + `

When a client requests ` + '`GET /api/courses/123`' + `, Express automatically captures the value ` + '`"123"`' + ` from the URL path and stores it in the ` + '`req.params`' + ` object as ` + '`req.params.courseId`' + `.

Route parameters are used to identify a specific resource (or nested hierarchy of resources) within a collection. Because route parameter values come directly from the client's URL bar, they are untrusted user input and must always be validated before being used in database queries.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Define route parameters using the colon syntax (` + '`:paramName`' + `) and read captured values from ` + '`req.params`' + `.
2. Construct nested hierarchical routes with multiple route parameters (such as ` + '`/api/courses/:courseId/modules/:moduleId/topics/:topicId`' + `).
3. Distinguish when to use route parameters (identifying a specific resource) versus query parameters (filtering or paginating).
4. Validate route parameters defensively before passing them to database queries (including numeric IDs and 24-character hexadecimal MongoDB ObjectIds).`,
        },
        {
          order: 1,
          heading: 'How Express Extracts Route Parameters into req.params',
          body: `When you define a route path with a colon prefix (':'), Express treats that segment of the URL as a named variable:

Route Definition:
  app.get('/api/courses/:courseId', (req, res) => { ... });

Client Request:
  GET /api/courses/123

What Express Places in req.params:
  req.params = { courseId: '123' }

Important Details About req.params:
• Every value inside 'req.params' is ALWAYS a String! Even if the URL is '/api/courses/123', 'req.params.courseId' is the string '"123"', not the number 123.
• A route parameter matches any non-empty segment between slashes ('/'). Wait: 'GET /api/courses/' (with nothing after the slash) will NOT match '/api/courses/:courseId'.`,
        },
        {
          order: 2,
          heading: 'Multiple Route Parameters for Nested Resources',
          body: `A single route pattern can include multiple route parameters to represent parent-child resource relationships.

For example, in the LearnSphere backend ('server/routes/courseCreator.js'), updating a topic's content uses three route parameters in one URL:

Route Pattern:
  /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId/content

Client Request:
  GET /api/creator/courses/c101/modules/m202/topics/t303/content

Extracted req.params Object:
  {
    courseId: 'c101',
    moduleId: 'm202',
    topicId: 't303'
  }

Each parameter name in the route pattern becomes a corresponding key on 'req.params'.`,
        },
        {
          order: 3,
          heading: 'Route Parameters vs. Query Parameters & Parameter Validation',
          body: `How do you know whether to use a Route Parameter or a Query Parameter?

• Use Route Parameters ('/api/courses/:courseId') to identify a SPECIFIC required resource by its unique identifier.
• Use Query Parameters ('/api/courses?category=backend&page=2') for OPTIONAL modifiers like filtering, searching, sorting, or pagination on a collection.

Why You Must Validate Route Parameters Before Using Them:
Never assume that 'req.params.courseId' is automatically a valid number or a valid MongoDB ObjectId!
• Any user can type 'GET /api/courses/not-a-valid-id' or 'GET /api/courses/$$$' into their browser.
• If your database uses MongoDB ObjectIds (which must be 24 hexadecimal characters, 0-9 and a-f) and you pass an arbitrary string like '"banana"' directly into 'Course.findById("banana")' without validation, Mongoose will throw a 'CastError'.
• Validate the parameter format first! If it is invalid, immediately return '400 Bad Request' before touching the database.`,
        },
        {
          order: 4,
          heading: 'Common Beginner Mistakes',
          body: `1. Comparing req.params Directly with Numbers Using Strict Equality (===):
Mistake:
  const courses = [{ id: 123, title: 'Express.js' }];
  // Bug: req.params.courseId is "123" (string), while c.id is 123 (number)!
  const found = courses.find(c => c.id === req.params.courseId); // Always undefined!
Reality: Because 'req.params' values are always strings, either store IDs as strings or convert/validate numeric IDs with 'Number(req.params.courseId)'.

2. Assuming a Route Parameter Is Automatically a Valid MongoDB ObjectId:
Mistake: Passing 'req.params.id' straight to database queries without checking its format.
Reality: In LearnSphere, routes validate IDs using 'isMongoId()' or 'mongoose.Types.ObjectId.isValid(id)' (which checks for a valid 24-character hex string) and return 400 Bad Request on invalid formats.

3. Mismatching Parameter Names Between Route Path and Handler:
Mistake: Defining 'app.get("/api/courses/:courseId", ...)' and then reading 'req.params.id' (which is undefined) instead of 'req.params.courseId'.
Reality: The property name on 'req.params' always matches the exact identifier after the colon ':' in the route string.`,
        },
        {
          order: 5,
          heading: 'Suggested Practice Task',
          body: `Parameter Extraction & Validation Exercise:
1. Write an Express route pattern that matches:
   GET /api/users/:userId/notes/:noteId
2. If a client requests 'GET /api/users/42/notes/abc99', write down the exact JavaScript object stored in 'req.params'.
3. Write an 'if' condition that checks whether 'req.params.userId' consists only of digits ('/^[0-9]+$/') and returns an HTTP 400 JSON response if it does not.`,
        },
        {
          order: 6,
          heading: 'Topic Summary',
          body: `• Route parameters are named dynamic URL segments prefixed with a colon (e.g., '/api/courses/:courseId').
• Express extracts route parameters into the 'req.params' object as strings (e.g., req.params.courseId).
• Multiple route parameters can be combined to represent nested resource hierarchies.
• Route parameters identify a specific resource, whereas query parameters filter, sort, or paginate collections.
• Always validate route parameters (such as checking numeric format or 24-character hex ObjectId format) and return 400 Bad Request if invalid.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Extracting and Validating Single & Multiple Route Parameters',
        language: 'javascript',
        code: `// route_params_demo.js - Safe extraction and validation of req.params
import express from 'express';

const app = express();

// Sample in-memory data
const courses = [
  { id: '123', title: 'Backend Development with Node.js', modules: [{ moduleId: 'm1', title: 'Express.js' }] }
];

// Helper: Validate simple alphanumeric ID (or 24-char hex for MongoDB ObjectIds: /^[a-fA-F0-9]{24}$/)
function isValidIdFormat(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{1,50}$/.test(id);
}

// 1. Single Route Parameter: GET /api/courses/:courseId
app.get('/api/courses/:courseId', (req, res) => {
  const { courseId } = req.params;

  // Validate parameter format before looking up resource
  if (!isValidIdFormat(courseId)) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Invalid courseId format.'
    });
  }

  const course = courses.find((c) => c.id === courseId);
  if (!course) {
    return res.status(404).json({
      error: 'Not Found',
      message: \`Course with ID \${courseId} was not found.\`
    });
  }

  return res.status(200).json({ status: 'success', data: { course } });
});

// 2. Multiple Route Parameters: GET /api/courses/:courseId/modules/:moduleId
app.get('/api/courses/:courseId/modules/:moduleId', (req, res) => {
  const { courseId, moduleId } = req.params;

  if (!isValidIdFormat(courseId) || !isValidIdFormat(moduleId)) {
    return res.status(400).json({ error: 'Bad Request', message: 'Invalid parameter format.' });
  }

  return res.status(200).json({
    status: 'success',
    extractedParams: { courseId, moduleId }
  });
});`,
        explanation: `This example shows both single ('/api/courses/:courseId') and nested ('/api/courses/:courseId/modules/:moduleId') route parameters. Before querying the data store, the handler validates the parameter format with 'isValidIdFormat()'—returning 400 Bad Request for malformed IDs, 404 Not Found when no resource matches, and 200 OK when found.

Expected Outputs:
• GET /api/courses/123               -> Status 200: {"status":"success","data":{"course":{"id":"123","title":"Backend Development with Node.js","modules":[{"moduleId":"m1","title":"Express.js"}]}}}
• GET /api/courses/999               -> Status 404: {"error":"Not Found","message":"Course with ID 999 was not found."}
• GET /api/courses/invalid$id!       -> Status 400: {"error":"Bad Request","message":"Invalid courseId format."}
• GET /api/courses/123/modules/m1    -> Status 200: {"status":"success","extractedParams":{"courseId":"123","moduleId":"m1"}}`,
      },
    ],
    importantPoints: [
      'Route parameters capture dynamic segments of a URL path using the :paramName syntax.',
      'Captured values are stored as strings on the req.params object (for example, req.params.courseId).',
      'Use route parameters to identify specific resources (/api/courses/:courseId) and nested sub-resources.',
      'Never assume a route parameter is valid—always validate its format (such as numeric or 24-character hex ObjectId) before querying a database.',
      'Return 400 Bad Request for malformed route parameters and 404 Not Found when a valid ID does not match an existing record.',
    ],
    externalReferences: [
      {
        title: 'Express.js Routing Guide: Route Parameters',
        url: 'https://expressjs.com/en/guide/routing.html#route-parameters',
        source: 'Express.js Official Docs',
      },
      {
        title: 'Express.js 4.x API Reference: req.params',
        url: 'https://expressjs.com/en/4x/api.html#req.params',
        source: 'Express.js Official Docs',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 5: Query Parameters
  // ID: 6abe9dccf15c2b4f6008ac35
  // =========================================================================
  {
    topicId: '6abe9dccf15c2b4f6008ac35',
    title: 'Query Parameters',
    content: {
      explanation: `When a student browses a course catalog with hundreds of courses, they rarely want all 500 courses dumped onto the screen at once. Instead, they want to filter by category (` + '`category=backend`' + `), search by keyword (` + '`search=node`' + `), sort by title (` + '`sort=title`' + `), or load one page of 10 results at a time (` + '`page=2&limit=10`' + `).

In HTTP, these optional key-value modifiers are appended to the end of a URL after a question mark (` + '`?`' + `) and separated by ampersands (` + '`&`' + `). This portion of the URL is called the Query String, and its key-value pairs are called Query Parameters.

Express automatically parses the URL query string and exposes the values on the ` + '`req.query`' + ` object—without requiring you to change your route path pattern!`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Read URL query parameters in Express using the 'req.query' object.
2. Implement filtering, keyword searching, sorting, and pagination using optional query parameters.
3. Clearly compare when to use '/api/courses/:courseId' (route parameter) versus '/api/courses?category=backend' (query parameter).
4. Validate, sanitize, and bound user-supplied query values so unsafe objects or huge pagination limits cannot compromise your server or database.`,
        },
        {
          order: 1,
          heading: 'Anatomy of a Query String & req.query',
          body: `Notice how a query string is structured at the end of a URL:

Example 1 (Filtering):
  GET /api/courses?category=backend
  → req.query is: { category: 'backend' }

Example 2 (Pagination):
  GET /api/courses?page=2&limit=10
  → req.query is: { page: '2', limit: '10' }

Example 3 (Searching and Sorting):
  GET /api/courses?search=node&sort=title
  → req.query is: { search: 'node', sort: 'title' }

Important Characteristics of Query Parameters:
• The route path definition in Express remains simply 'app.get("/api/courses", ...)'. You do NOT put '?category=...' inside the 'app.get()' path string!
• Query parameters are optional by nature: if a client requests 'GET /api/courses' with no query string, the same route still matches and 'req.query' is simply an empty object '{}'.
• Just like 'req.params', primitive values in 'req.query' are parsed as Strings (so 'page=2' becomes the string '"2"').`,
        },
        {
          order: 2,
          heading: 'Comparing /api/courses/:courseId vs. /api/courses?category=backend',
          body: `A classic backend interview and design question is: When should you use a Route Parameter versus a Query Parameter?

1. Route Parameters ('/api/courses/:courseId'):
• Purpose: Uniquely identify a specific resource in a hierarchy.
• Required: Part of the URL path itself.
• Typical HTTP Status if missing/unmatched: 404 Not Found.
• Example: 'GET /api/courses/6abe9dc2f15c2b4f6008ac1c' fetches that exact single course.

2. Query Parameters ('/api/courses?category=backend&page=2&limit=10'):
• Purpose: Filter, search, sort, or paginate a collection of resources.
• Optional: Omitting them simply returns the default unfiltered/first-page list.
• Typical HTTP Status if filter matches 0 items: 200 OK with an empty array '[]' (not 404, because the '/api/courses' collection endpoint itself exists!).

Why '/api/courses?courseId=123' Is Less RESTful for Fetching One Course:
While passing 'courseId' as a query parameter technically works, REST convention reserves '/api/courses/:courseId' for addressing a single resource and uses '/api/courses?...' for querying the collection.`,
        },
        {
          order: 3,
          heading: 'Safe Handling, Whitelisting, and Preventing Query Injection',
          body: `Because 'req.query' is controlled entirely by the client's URL, you must NEVER pass 'req.query' directly into a database query (such as 'Course.find(req.query)')!

Why Passing Raw req.query to a Database Is Dangerous:
1. Unexpected Fields & Operator Injection:
In Express's default query parser, a malicious client can send nested query syntax like '?status[$ne]=published' (which parses into an object '{ status: { $ne: "published" } }') or pass internal fields you never intended to filter on.
2. Unbounded Pagination (Denial of Service):
If a client requests '?limit=10000000', blindly trusting 'req.query.limit' could force your server to load millions of records into memory and crash.

How to Handle Query Parameters Safely (As Implemented in LearnSphere):
• Verify Types: Check 'typeof req.query.category === "string"' before using string methods like '.trim()'.
• Whitelist Allowed Values: For sorting or status filters, check against a strict list of allowed fields (e.g., 'const allowedSorts = ["title", "createdAt"]').
• Clamp Numeric Pagination Bounds: Parse 'page' and 'limit' with ' parseInt(..., 10)', default to safe values (e.g., page = 1, limit = 10), and enforce a maximum cap (e.g., 'Math.min(Math.max(1, limit), 50)').
• Build Explicit Filter Objects: Construct a brand-new filter object using only validated, sanitized primitive values.`,
        },
        {
          order: 4,
          heading: 'Common Beginner Mistakes',
          body: `1. Putting the Query String Inside the app.get() Route Path:
Mistake: Writing 'app.get("/api/courses?category=backend", ...)' in Express.
Reality: Express route paths only match the pathname ('/api/courses'), never the '?...' query string. Putting '?' in the route path causes the route to fail to match!

2. Forgetting to Convert page and limit from Strings to Numbers:
Mistake: Using 'req.query.limit' directly as a string, or allowing negative numbers (` + '`?page=-5`' + `) and ` + '`NaN`' + ` (` + '`?limit=abc`' + `).
Reality: Always parse integers with 'Number.parseInt(val, 10)' and validate that the result is a positive integer within safe bounds.

3. Passing req.query Directly into Database Queries:
Mistake: Writing 'Course.find(req.query)'.
Reality: Always extract, type-check, and validate only the specific query parameters your endpoint supports.`,
        },
        {
          order: 5,
          heading: 'Suggested Practice Task',
          body: `Query Filtering & Pagination Exercise:
Suppose a client sends the following request to your Express server:
  GET /api/courses?category=backend&search=express&page=2&limit=5

1. Write down the exact key-value pairs Express places in 'req.query'.
2. Calculate the array zero-based 'startIndex' (offset) for 'page = 2' and 'limit = 5' using the formula:
   startIndex = (page - 1) * limit
3. What should your endpoint return if a client sends '?limit=99999' (assuming your maximum allowed limit is 50)?`,
        },
        {
          order: 6,
          heading: 'Topic Summary',
          body: `• Query parameters are optional key-value pairs appended after '?' in a URL (e.g., '/api/courses?category=backend&page=2&limit=10') and accessed via 'req.query'.
• Query parameters are ideal for filtering, searching, sorting, and paginating collections, whereas route parameters ('req.params') identify a specific resource.
• Always provide sensible defaults when optional query parameters are omitted.
• Never pass raw 'req.query' directly to a database; always validate types, whitelist sort fields, and clamp pagination limits.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Safe Filtering, Searching, Sorting, and Pagination with req.query',
        language: 'javascript',
        code: `// query_params_demo.js - Safe handling of req.query for filtering, sorting, and pagination
import express from 'express';

const app = express();

const courses = [
  { id: '1', title: 'Backend Fundamentals', category: 'backend' },
  { id: '2', title: 'Node.js Runtime Deep Dive', category: 'backend' },
  { id: '3', title: 'Express.js API Engineering', category: 'backend' },
  { id: '4', title: 'Responsive CSS Layouts', category: 'frontend' }
];

// GET /api/courses?category=backend&search=node&sort=title&page=1&limit=2
app.get('/api/courses', (req, res) => {
  // 1. Safely extract and validate optional string parameters
  const category = typeof req.query.category === 'string' ? req.query.category.trim().toLowerCase() : '';
  const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
  const sort = typeof req.query.sort === 'string' ? req.query.sort.trim() : '';

  // 2. Safely parse and bound pagination numbers (page >= 1, 1 <= limit <= 50)
  const rawPage = Number.parseInt(String(req.query.page || '1'), 10);
  const rawLimit = Number.parseInt(String(req.query.limit || '10'), 10);
  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const limit = Number.isNaN(rawLimit) || rawLimit < 1 ? 10 : Math.min(rawLimit, 50);

  // 3. Apply filtering and searching
  let results = courses.filter((course) => {
    const matchesCategory = !category || course.category.toLowerCase() === category;
    const matchesSearch = !search || course.title.toLowerCase().includes(search);
    return matchesCategory && matchesSearch;
  });

  // 4. Apply whitelisted sorting
  if (sort === 'title') {
    results = [...results].sort((a, b) => a.title.localeCompare(b.title));
  }

  // 5. Apply pagination slice
  const startIndex = (page - 1) * limit;
  const paginatedItems = results.slice(startIndex, startIndex + limit);

  return res.status(200).json({
    status: 'success',
    pagination: { total: results.length, page, limit },
    data: { courses: paginatedItems }
  });
});`,
        explanation: `This example demonstrates how a single 'GET /api/courses' route supports optional filtering ('?category='), keyword searching ('?search='), whitelisted sorting ('?sort=title'), and bounded pagination ('?page=&limit='). Notice how every value from 'req.query' is type-checked as a string or clamped as a safe integer before use.

Expected Output for GET /api/courses?category=backend&sort=title&page=1&limit=2:
{
  "status": "success",
  "pagination": { "total": 3, "page": 1, "limit": 2 },
  "data": {
    "courses": [
      { "id": "1", "title": "Backend Fundamentals", "category": "backend" },
      { "id": "3", "title": "Express.js API Engineering", "category": "backend" }
    ]
  }
}`,
      },
    ],
    importantPoints: [
      'Query parameters appear after ? in the URL (for example, ?category=backend&page=2&limit=10) and are exposed on req.query.',
      'Do not include the query string in the Express route path pattern—define the route as app.get("/api/courses", ...).',
      'Use route parameters (req.params) to identify a specific resource; use query parameters (req.query) to filter, search, sort, or paginate a collection.',
      'Always type-check query values as strings, whitelist allowed sort/filter fields, and clamp pagination numbers to safe minimums and maximums.',
      'Never pass raw req.query directly into a database query.',
    ],
    externalReferences: [
      {
        title: 'Express.js 4.x API Reference: req.query',
        url: 'https://expressjs.com/en/4x/api.html#req.query',
        source: 'Express.js Official Docs',
      },
      {
        title: 'MDN Web Docs: URL Search / Query Parameters',
        url: 'https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams',
        source: 'MDN Web Docs',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },
];
