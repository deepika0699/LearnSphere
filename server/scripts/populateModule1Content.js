/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LearnSphere Module 1 Content Population Script
 *
 * Populates all 8 topics of Module 1 ("Backend Fundamentals") using the
 * authoritative Course Creator API:
 *   PATCH /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId/content
 *
 * Adheres strictly to:
 * - Existing Topic schema (content.explanation, content.sections, codeExamples, importantPoints, externalReferences)
 * - Self-contained RAG-optimized content structure
 * - No YouTube URLs
 * - No assessments
 * - Course remains Draft
 * - Modules 2-8 remain untouched
 */

import 'dotenv/config';

const BASE_URL = 'http://localhost:5000';
const COURSE_ID = '6abe9dc2f15c2b4f6008ac1c';
const MODULE_1_ID = '6abe9dc2f15c2b4f6008ac1d';

const CREATOR_EMAIL = 'faculty@learnsphere.io';
const CREATOR_PASSWORD = 'Str0ng!Faculty#Secret2026';

export const module1TopicsContent = [
  // =========================================================================
  // TOPIC 1: What Is Backend Development?
  // ID: 6abe9dc2f15c2b4f6008ac1e
  // =========================================================================
  {
    topicId: '6abe9dc2f15c2b4f6008ac1e',
    title: 'What Is Backend Development?',
    content: {
      explanation: `When you interact with any website or mobile app—like logging in, ordering food, or streaming a video—there are two distinct worlds working together: the frontend and the backend.

The frontend is the visual interface that runs on your personal device inside your web browser or mobile application. It consists of buttons, text, layout styling, animations, and forms that you can directly see and click.

The backend is the behind-the-scenes engine that runs on remote computers called servers. While the frontend presents information and collects user input, the backend does the actual heavy lifting: storing your data safely in databases, verifying your identity through authentication, enforcing business rules, calculating values, and communicating with other internet services.

In simple terms: if a web application were a restaurant, the frontend would be the dining area with tables, menus, and friendly decor, while the backend would be the kitchen, storage pantry, and accounting office where ingredients are kept, orders are prepared safely according to recipes, and bills are calculated.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Clearly articulate the difference between frontend and backend software development.
2. Identify the primary responsibilities of a backend server: request processing, data storage, authentication, and business logic execution.
3. Understand what servers, databases, and Application Programming Interfaces (APIs) are and how they collaborate.
4. Walk through a realistic web application flow (such as user account login) from user click to database query and response.`,
        },
        {
          order: 1,
          heading: 'Core Responsibilities of the Backend',
          body: `Backend systems are responsible for tasks that cannot safely or practically happen on a user's personal device:

1. Data Persistence & Management:
User devices have limited storage and can be lost, cleared, or turned off at any moment. The backend connects to persistent databases (like MongoDB or PostgreSQL) to permanently store user profiles, course materials, purchase histories, and activity records.

2. Business Logic Execution:
Business logic refers to the actual rules and decisions of an application. For example: "Can a student view this lesson without being enrolled?" or "Is an order total calculated with valid sales tax and discount coupons?" Running these rules on the backend prevents users from cheating or tampering with numbers in their browser console.

3. Authentication & Authorization:
Verifying who a user is (authentication, e.g., checking passwords and issuing secure login tokens) and deciding what that user is allowed to do (authorization, e.g., allowing an instructor to edit a course while preventing a student from modifying questions) is strictly enforced by the backend.

4. Communication & Integrations:
Backend servers interact with third-party services such as payment processors (Stripe), email dispatchers (SendGrid), and cloud storage services (AWS S3) without exposing sensitive master API keys to web browsers.`,
        },
        {
          order: 2,
          heading: 'Key Backend Terminology',
          body: `To speak the language of backend engineers, familiarize yourself with these core terms:

• Server: A computer connected to the internet that continuously listens for incoming network requests and sends back responses.
• Database: An organized electronic repository designed for fast, persistent, and secure storage, retrieval, and updating of structured or semi-structured data.
• API (Application Programming Interface): A formalized set of rules, URLs, and contracts that allows one software program (like a web browser or mobile app) to talk to another software program (like a backend server).
• Business Logic: The algorithmic rules, calculations, and constraints specific to your product or company.
• Authentication: The process of verifying a user's identity (answering: "Who are you?").
• Authorization: The process of verifying whether an authenticated user has permission to perform a specific action (answering: "Are you allowed to do this?").
• Request & Response: The fundamental message unit of web communication. A client sends a request; the backend server processes it and returns a response.`,
        },
        {
          order: 3,
          heading: 'Real-World Example: Logging Into an Online School',
          body: `Let us trace what happens behind the scenes when a student logs into a platform like LearnSphere:

Step 1 (Frontend): The student types their email and password into an HTML form and clicks "Sign In".
Step 2 (Network Request): The browser bundles the email and password into an encrypted HTTP POST request and sends it over the internet to the backend URL: https://learnsphere.io/api/auth/login.
Step 3 (Backend Processing): The Node.js backend server receives the request. It parses the incoming data, validates that the email address is formatted correctly, and checks that the password meets security requirements.
Step 4 (Database Lookup): The backend queries the MongoDB database for a user matching the email. The database returns the user record, including a securely hashed version of their password.
Step 5 (Security Verification): The backend securely compares the submitted password against the stored cryptographic hash using a library like bcrypt. Plaintext passwords are never stored.
Step 6 (Token Generation & Response): If the credentials match, the backend generates a signed JSON Web Token (JWT) representing the verified session and sends an HTTP 200 response back to the browser containing the token.
Step 7 (Frontend Update): The browser receives the token, stores it in secure memory, and redirects the student to their personal dashboard.`,
        },
        {
          order: 4,
          heading: 'Common Beginner Mistakes',
          body: `Avoid these common pitfalls when learning backend development:

1. Confusing Frontend and Backend Responsibilities:
Mistake: Trying to connect directly from a React frontend component to a MongoDB database using database credentials.
Reality: Browsers cannot and must never connect directly to production databases. Doing so exposes your database password to every person who visits your site. All database queries must pass through an intermediary backend server.

2. Trusting Client Data:
Mistake: Assuming that because the frontend form has a "required" attribute, invalid data will never reach the backend.
Reality: Anyone can bypass frontend validation by using tools like Postman, curl, or browser developer tools. The backend must always re-validate and sanitize every single piece of incoming data.

3. Storing Passwords in Plaintext:
Mistake: Saving user passwords directly as normal text strings in a database column.
Reality: Passwords must always be salted and hashed with robust one-way cryptographic algorithms like bcrypt or Argon2 before saving.`,
        },
        {
          order: 5,
          heading: 'Suggested Practice Task & Thought Exercise',
          body: `Thought Exercise:
Consider an everyday application you use regularly—such as an e-commerce shopping website (like Amazon) or a music streaming app (like Spotify).

1. List 3 distinct things that happen exclusively on the frontend (the client side).
2. List 3 distinct things that must happen on the backend (the server side) for safety, business rules, or storage.
3. Why would it be dangerous for the client's browser to calculate the final shopping cart price and discount deductions on its own without backend verification? Write down your reasoning in 2-3 sentences.`,
        },
        {
          order: 6,
          heading: 'Topic Summary',
          body: `• The frontend is the client-facing user interface that runs in browsers or mobile apps.
• The backend is the server-side architecture that runs on remote computers to process requests, manage databases, enforce business logic, and handle authentication.
• Core backend components include servers (machines running application code), databases (persistent storage systems), and APIs (structured communication channels).
• Security in web development is server-authoritative: the backend never trusts client input and always enforces verification independently.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'A Minimal Node.js HTTP Backend Server',
        language: 'javascript',
        code: `// server.js - A minimal backend server using Node.js built-in 'http' module
import http from 'node:http';

const PORT = 3000;

// Create the server instance
const server = http.createServer((request, response) => {
  // Inspect incoming request information
  console.log(\`Received \${request.method} request for \${request.url}\`);

  // Set the response header with HTTP status code and content type
  response.writeHead(200, { 'Content-Type': 'application/json' });

  // Send a JSON response back to the client
  const responseData = {
    message: 'Hello from the LearnSphere backend server!',
    timestamp: new Date().toISOString(),
    status: 'online'
  };

  response.end(JSON.stringify(responseData));
});

// Start listening for incoming connections
server.listen(PORT, () => {
  console.log(\`Backend server is now listening on http://localhost:\${PORT}\`);
});`,
        explanation: `This simple, runnable script demonstrates what a backend server does at the lowest level. When executed with 'node server.js', the computer begins listening for HTTP requests on port 3000. When you open http://localhost:3000 in your browser, the callback function executes, logs the request, sets the HTTP status code to 200 (OK), and transmits a formatted JSON string back to the browser.

Expected Console Output:
Backend server is now listening on http://localhost:3000
Received GET request for /

Expected Browser Output:
{"message":"Hello from the LearnSphere backend server!","timestamp":"2026-10-02T16:00:00.000Z","status":"online"}`,
      },
    ],
    importantPoints: [
      'Frontend code executes on the user device; backend code executes on controlled, secure remote servers.',
      'The backend is solely responsible for data persistence, security enforcement, business rules, and authentication.',
      'Never connect a web browser directly to a production database—all database operations must be intermediated by backend APIs.',
      'Client input must always be validated and sanitized on the backend because clients can be modified or manipulated by users.',
      'Passwords must always be hashed with cryptographic algorithms (e.g., bcrypt) and never stored in plaintext.',
      'An API is a formal contract allowing frontend clients and backend servers to communicate reliably.',
    ],
    externalReferences: [
      {
        title: 'MDN Web Docs: Introduction to the Server Side',
        url: 'https://developer.mozilla.org/en-US/docs/Learn/Server-side/First_steps/Introduction',
        source: 'MDN Web Docs',
      },
      {
        title: 'Node.js Official Documentation: HTTP Module',
        url: 'https://nodejs.org/docs/latest/api/http.html',
        source: 'Node.js Official Docs',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 2: Client–Server Architecture
  // ID: 6abe9dc3f15c2b4f6008ac1f
  // =========================================================================
  {
    topicId: '6abe9dc3f15c2b4f6008ac1f',
    title: 'Client–Server Architecture',
    content: {
      explanation: `At the heart of almost every internet application lies a architectural design pattern known as the Client–Server model.

In this model, computing workloads are divided between two key participants:
1. The Client (the service requester): The device or application that initiates communication by asking for data or requesting an action. Common clients include Google Chrome, Apple Safari, native iPhone or Android apps, and command-line utilities like curl.
2. The Server (the service provider): A centralized, always-on host machine that waits for incoming requests from clients, processes those requests against business rules and databases, and sends back an authoritative response.

This separation of concerns is fundamental: clients focus on rendering graphics and providing a responsive user experience, while servers focus on data integrity, heavy computing, and security.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Define the Client–Server architecture and explain why it is the dominant model of the internet.
2. Distinguish the roles of the client, the web server, the application server, and the database.
3. Understand the unidirectional nature of standard HTTP requests and responses.
4. Visualize and describe the complete architectural flow from client request to database query and back.`,
        },
        {
          order: 1,
          heading: 'The Three-Tier Architecture',
          body: `Modern web applications typically organize the Client–Server model into three cooperative tiers:

1. Presentation Tier (Client):
Runs in the user's browser (HTML, CSS, JavaScript, React). Captures user gestures, validates form fields for immediate feedback, and displays formatted data.

2. Application / Logic Tier (Backend Server):
Runs on server platforms like Node.js and Express. Receives network requests from the presentation tier, checks authentication headers, enforces business logic, coordinates database queries, and formats output data.

3. Data Tier (Database):
Runs dedicated database software like MongoDB, PostgreSQL, or Redis. Organizes, indexes, and stores information reliably onto persistent disk storage, guaranteeing data consistency.

Separating these tiers means that if you decide to redesign your user interface or build a new mobile app, you can reuse the exact same backend logic and database without rewriting your core business rules.`,
        },
        {
          order: 2,
          heading: 'Architectural Data Flow Diagram',
          body: `Below is the standard sequence that occurs whenever a client interacts with a modern backend application:

Client (Web Browser / Mobile App)
  ↓ [1. Sends HTTP Request with method, URL, and headers]
Internet Network / Router
  ↓ [2. Routes packet to destination server IP]
Backend Application Server (Node.js & Express)
  ↓ [3. Authenticates request and validates parameters]
Database Management System (MongoDB)
  ↓ [4. Executes query and returns raw data records]
Backend Application Server
  ↓ [5. Serializes sanitized data into standard HTTP Response]
Internet Network / Router
  ↓ [6. Transmits response packets back to client IP]
Client (Web Browser / Mobile App)
  [7. Parses response payload and updates visual UI]`,
        },
        {
          order: 3,
          heading: 'Real-World Analogy: Ordering from a Restaurant',
          body: `To understand the Client-Server model intuitively, consider ordering a meal at a restaurant:

• The Customer is the Client. The customer decides what they want, reads the menu, and places an order.
• The Waiter is the API and HTTP protocol. The waiter carries the customer's order to the kitchen in a standardized format and brings the food back to the table.
• The Chef and Kitchen is the Backend Server. The chef receives the ticket, checks if ingredients are in stock, verifies the recipe, and prepares the meal.
• The Storage Pantry & Fridge is the Database. The kitchen retrieves raw ingredients (data) from the pantry, but customers are never allowed to walk into the pantry and grab food themselves.`,
        },
        {
          order: 4,
          heading: 'Common Beginner Mistakes',
          body: `1. Assuming the Server Can Arbitrarily Push to the Client Over Standard HTTP:
Mistake: Believing that a regular backend server can reach out and force a browser to update at any random moment without the browser asking.
Reality: Traditional HTTP is a request-response protocol. The client must initiate the communication. (For real-time bidirectional messaging, specialized protocols like WebSockets are used).

2. Storing Critical State Exclusively on the Client:
Mistake: Keeping the only copy of an active shopping cart or quiz score in browser localStorage.
Reality: If a user switches to their phone or clears browser cache, that local state disappears. Authoritative state must be persisted to the server.

3. Underestimating Network Latency:
Mistake: Assuming client-server communication happens instantly (0 milliseconds).
Reality: Every request travels across physical cables and routers, introducing network latency. Backend developers must design fast queries and concise response payloads.`,
        },
        {
          order: 5,
          heading: 'Suggested Practice Task & Thought Exercise',
          body: `Practice Task:
Open any web browser (Google Chrome, Firefox, or Edge).
1. Open the Developer Tools (right-click anywhere on a webpage and click "Inspect", or press F12).
2. Click on the "Network" tab.
3. Refresh the page or click a link.
4. Observe the waterfall list of requests that your browser (the client) automatically generates to request HTML documents, styles, images, and API data from remote servers.
5. Click on any single request and inspect the "Headers" sub-tab to see the exact Request URL and Response Status.`,
        },
        {
          order: 6,
          heading: 'Topic Summary',
          body: `• Client–Server architecture divides computing tasks between clients (which request resources and render UI) and servers (which provide data, logic, and security).
• Modern web systems use a three-tier design: presentation tier (browser), application tier (Node.js backend), and data tier (database).
• Clients and servers communicate via standardized network protocols (principally HTTP).
• The client initiates requests; the server processes the request, interacts with persistent data stores, and returns a response.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Demonstrating Client-Server Communication in JavaScript',
        language: 'javascript',
        code: `// client_and_server_demo.js
// This code demonstrates both roles: a server that responds, and a client fetch call.

import http from 'node:http';

const PORT = 3001;

// 1. THE SERVER (Service Provider)
const server = http.createServer((req, res) => {
  if (req.url === '/api/courses' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      courses: [
        { id: 1, title: 'Backend Fundamentals', status: 'available' },
        { id: 2, title: 'Node.js Mastery', status: 'available' }
      ]
    }));
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Endpoint Not Found' }));
  }
});

server.listen(PORT, async () => {
  console.log(\`[SERVER] Listening on http://localhost:\${PORT}\`);

  // 2. THE CLIENT (Service Requester)
  console.log('[CLIENT] Dispatching HTTP GET request to /api/courses...');
  try {
    const clientResponse = await fetch(\`http://localhost:\${PORT}/api/courses\`);
    const data = await clientResponse.json();
    console.log('[CLIENT] Successfully received server response:');
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[CLIENT] Request failed:', err);
  } finally {
    // Close the server connection for this demonstration
    server.close(() => console.log('[SERVER] Server closed.'));
  }
});`,
        explanation: `This runnable script encapsulates both sides of the Client-Server model in a single file. First, a Node.js HTTP server starts listening on port 3001. Immediately following startup, the built-in fetch API acts as a client by constructing and dispatching an HTTP GET request. The server receives the request, matches the URL route, and responds with JSON data.

Expected Console Output:
[SERVER] Listening on http://localhost:3001
[CLIENT] Dispatching HTTP GET request to /api/courses...
[CLIENT] Successfully received server response:
{
  "courses": [
    {
      "id": 1,
      "title": "Backend Fundamentals",
      "status": "available"
    },
    {
      "id": 2,
      "title": "Node.js Mastery",
      "status": "available"
    }
  ]
}
[SERVER] Server closed.`,
      },
    ],
    importantPoints: [
      'The client requests services or data; the server fulfills those requests and enforces rules.',
      'Separation of concerns allows the frontend and backend to evolve, scale, and be maintained independently.',
      'A standard web architecture employs three tiers: Client (UI) → Application Server (Logic) → Database (Data).',
      'Communication is initiated by the client in standard HTTP exchanges.',
      'Servers must never trust data sent by the client, as clients run on hardware outside the developer’s control.',
    ],
    externalReferences: [
      {
        title: 'MDN Web Docs: Client-Server Overview',
        url: 'https://developer.mozilla.org/en-US/docs/Learn/Server-side/First_steps/Client-Server_overview',
        source: 'MDN Web Docs',
      },
      {
        title: 'Internet Engineering Task Force (IETF): RFC 9110 HTTP Semantics',
        url: 'https://www.rfc-editor.org/rfc/rfc9110.html',
        source: 'IETF RFCs',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 3: HTTP and HTTPS
  // ID: 6abe9dc3f15c2b4f6008ac20
  // =========================================================================
  {
    topicId: '6abe9dc3f15c2b4f6008ac20',
    title: 'HTTP and HTTPS',
    content: {
      explanation: `When you open any website, your browser needs a predictable set of rules to communicate with the remote server. That foundational rulebook is called HTTP, which stands for HyperText Transfer Protocol.

A protocol in computer networking is just like a protocol in human diplomacy: an agreed-upon format and language so two parties can exchange messages without misunderstanding each other.

Under plain HTTP, messages are transmitted across the internet as plaintext (readable English text). If you connect to public Wi-Fi at a coffee shop and send a password or credit card over HTTP, anyone snooping on that Wi-Fi router can intercept and read your private credentials.

HTTPS (HyperText Transfer Protocol Secure) solves this critical vulnerability. HTTPS takes the exact same HTTP message and wraps it inside an encrypted security layer called TLS (Transport Layer Security). With HTTPS, your messages are scrambled before they leave your device and can only be unscrambled by the intended destination server.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Explain what HTTP is and describe the structure of an HTTP message.
2. Understand the security vulnerabilities of unencrypted HTTP.
3. Explain how HTTPS uses Transport Layer Security (TLS) to provide encryption, integrity, and authentication.
4. Identify what HTTPS protects against (eavesdropping, tampering) and what it does NOT protect against (server-side bugs, phishing, malware).`,
        },
        {
          order: 1,
          heading: 'The Three Guarantees of HTTPS (TLS)',
          body: `HTTPS provides three essential security pillars:

1. Encryption (Confidentiality):
Only the client and the destination server can read the contents of the communication. Any eavesdropper or intermediate internet router sees only meaningless random binary bytes instead of your passwords, emails, or personal messages.

2. Data Integrity:
TLS ensures that data cannot be modified, corrupted, or injected in transit between the client and server without detection. For instance, an attacker cannot intercept a download and secretly inject malware into the file.

3. Server Authentication:
Before encryption begins, the server presents a digital security certificate issued by a trusted Certificate Authority (CA) (such as Let's Encrypt or DigiCert). This guarantees to the browser that it is actually communicating with the legitimate server (e.g., https://learnsphere.io) and not an imposter posing as that website.`,
        },
        {
          order: 2,
          heading: 'What HTTPS Protects Against vs. What It Does NOT',
          body: `A common beginner misconception is that HTTPS means "the website is 100% safe from all hacking." This is dangerously untrue:

What HTTPS DOES Protect:
✓ Protects data against interception (eavesdropping) while traveling across public Wi-Fi and internet cables.
✓ Prevents man-in-the-middle (MITM) attacks where routers alter requests or inject unwanted advertisements.
✓ Validates that the domain name in the address bar belongs to the server responding to the connection.

What HTTPS DOES NOT Protect:
✗ Does NOT protect against insecure server-side code (e.g., SQL injection, exposed database credentials, missing authorization checks).
✗ Does NOT protect against phishing websites. A scammer can easily obtain a valid HTTPS certificate for a fraudulent website like "login-learnsphere-fake.com".
✗ Does NOT protect against malware installed on the user's laptop that records keystrokes.
✗ Does NOT hide the destination server's domain name or IP address from your Internet Service Provider (they know you visited learnsphere.io, even if they cannot see what page you viewed).`,
        },
        {
          order: 3,
          heading: 'Real-World Analogy: Postcard vs. Locked Steel Briefcase',
          body: `To understand HTTP versus HTTPS:

• Plain HTTP is like writing a message on a paper Postcard.
Anyone who touches the postcard along the postal route—the mail carrier, sorting clerk, or curious neighbor—can easily read your message, photograph it, or even scribble on it before delivering it.

• HTTPS is like placing your message inside a Locked Steel Briefcase.
The briefcase is locked with a unique combination that only you and the verified recipient possess. Postal workers can see where the briefcase is addressed to, but no one along the way can see inside or alter the contents.`,
        },
        {
          order: 4,
          heading: 'Common Beginner Mistakes',
          body: `1. Assuming HTTPS Automatically Makes an Application Secure:
Mistake: Believing that adding an SSL certificate to a website means you do not need backend authorization or input sanitization.
Reality: HTTPS only secures the transit pipe between browser and server. If your backend code has bugs or leaks private data, HTTPS will simply encrypt the leaked data as it leaves the server!

2. Mixing HTTP and HTTPS Content (Mixed Content Warning):
Mistake: Hosting a website on HTTPS but loading images, fonts, or scripts using plain 'http://' URLs.
Reality: Browsers will block these insecure sub-resources or flag the site with security warnings. All resources must be served over HTTPS.

3. Testing HTTP vs HTTPS in Local Development:
Mistake: Getting confused about why local development (e.g., http://localhost:3000) does not use HTTPS.
Reality: 'localhost' remains inside your local operating system network loopback and does not travel across the public internet. Therefore, plain HTTP is safe for local offline development, while production domains strictly require HTTPS.`,
        },
        {
          order: 5,
          heading: 'Suggested Practice Task & Thought Exercise',
          body: `Observation Task:
1. Look at the address bar of your browser right now. Look for the padlock icon next to the URL.
2. Click on the padlock icon. View the certificate details: notice the "Issued by" Certificate Authority, the expiration date, and the encryption cipher suite.
3. Write down in your notes: What would happen if a website's TLS certificate expired without being renewed by the engineering team? (Hint: modern browsers display a severe "Your connection is not private" warning screen to protect users).`,
        },
        {
          order: 6,
          heading: 'Topic Summary',
          body: `• HTTP (HyperText Transfer Protocol) is the standard application protocol for exchanging messages on the World Wide Web.
• Plain HTTP transmits data unencrypted, leaving sensitive credentials vulnerable to network snooping and tampering.
• HTTPS encrypts HTTP communication using Transport Layer Security (TLS), guaranteeing confidentiality, integrity, and server authentication.
• HTTPS protects data in transit, but does not substitute for sound backend security practices like authorization, validation, and safe data handling.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Inspecting HTTP Request Headers in Node.js',
        language: 'javascript',
        code: `// inspect_headers.js - Demonstrates how HTTP headers are read by a backend server
import http from 'node:http';

const server = http.createServer((req, res) => {
  // HTTP headers provide metadata about the client and request
  console.log('--- Incoming HTTP Request ---');
  console.log('HTTP Version:', req.httpVersion);
  console.log('Method:      ', req.method);
  console.log('URL:         ', req.url);
  console.log('Host Header: ', req.headers['host']);
  console.log('User-Agent:  ', req.headers['user-agent']);
  console.log('Accept:      ', req.headers['accept']);

  // Send back a friendly response echoing the detected user agent
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'X-Powered-By': 'LearnSphere-Educational-Core' // Custom response header
  });

  res.end(JSON.stringify({
    message: 'HTTP headers inspected successfully',
    protocol: 'HTTP/' + req.httpVersion,
    clientUserAgent: req.headers['user-agent'] || 'Unknown'
  }));
});

server.listen(3002, () => {
  console.log('Header inspection server listening on http://localhost:3002');
});`,
        explanation: `This script shows how an HTTP request consists of headers (metadata) and a body (payload). When a browser connects to this server, the backend can inspect headers like 'user-agent' (identifying the client browser and operating system) and 'accept' (what data types the client prefers). The server also sends back its own custom response header ('X-Powered-By').

Expected Console Output upon browser request:
Header inspection server listening on http://localhost:3002
--- Incoming HTTP Request ---
HTTP Version: 1.1
Method:       GET
URL:          /
Host Header:  localhost:3002
User-Agent:   Mozilla/5.0 ...`,
      },
    ],
    importantPoints: [
      'HTTP is the protocol defining the format and rules for web client-server communication.',
      'HTTPS adds TLS encryption, protecting communications against eavesdropping and transit tampering.',
      'HTTPS provides three core guarantees: Confidentiality (encryption), Integrity (no tampering), and Authentication (verified identity).',
      'HTTPS does NOT protect against server-side coding vulnerabilities, weak passwords, or social engineering/phishing.',
      'In production, all web services and APIs must strictly enforce HTTPS.',
    ],
    externalReferences: [
      {
        title: 'MDN Web Docs: An Overview of HTTP',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview',
        source: 'MDN Web Docs',
      },
      {
        title: 'Cloudflare Learning Center: What is HTTPS?',
        url: 'https://www.cloudflare.com/learning/ssl/what-is-https/',
        source: 'Cloudflare Learning',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 4: HTTP Methods
  // ID: 6abe9dc4f15c2b4f6008ac21
  // =========================================================================
  {
    topicId: '6abe9dc4f15c2b4f6008ac21',
    title: 'HTTP Methods',
    content: {
      explanation: `Whenever a client makes an HTTP request to a backend server, it must specify an action verb called an HTTP Method (also frequently referred to as an HTTP Verb).

The HTTP method tells the server what kind of operation the client wants to perform on a specific resource. For example, are you asking to view a course, create a new student account, update your profile name, or delete a note?

The five most important HTTP methods used in modern web and REST API development are:
• GET — Retrieve/read an existing resource.
• POST — Create a new resource or submit data for processing.
• PUT — Completely replace an existing resource with a new version.
• PATCH — Partially update specific fields of an existing resource.
• DELETE — Remove an existing resource.

Using the correct HTTP method according to internet standards makes your backend intuitive, predictable, and compliant with standard web caching and security tools.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Identify and describe the primary purpose of GET, POST, PUT, PATCH, and DELETE.
2. Design a standardized REST API resource route pattern using appropriate HTTP methods.
3. Clearly articulate the technical difference between PUT (complete replacement) and PATCH (partial modification).
4. Understand the concept of method idempotency and safe methods.`,
        },
        {
          order: 1,
          heading: 'Detailed Breakdown of Common HTTP Methods',
          body: `Let us examine how each method behaves in a realistic online learning application managing "courses":

1. GET (Read/Retrieve):
• Purpose: Fetches data without altering or modifying anything on the server.
• Safe & Idempotent: Calling GET ten times in a row should never change the database state.
• Example: GET /api/courses (returns a list of published courses) or GET /api/courses/101 (returns details for course 101).

2. POST (Create):
• Purpose: Submits new data to the server to create a new record or initiate a stateful action.
• Not Idempotent: Sending the same POST request multiple times will typically create multiple new records (e.g., posting multiple orders).
• Example: POST /api/courses with a JSON body { "title": "Node.js Basics" } creates a new course and returns an ID.

3. PUT (Full Replacement):
• Purpose: Replaces an entire target resource document with the new representation provided in the request body.
• Key Rule: Any fields omitted in the PUT body are expected to be cleared or reset to defaults.
• Example: PUT /api/courses/101 with body { "title": "Node.js Mastery", "category": "Backend" }.

4. PATCH (Partial Update):
• Purpose: Modifies only the specific fields included in the request body while leaving all other existing fields untouched.
• Key Rule: Ideal for updating a user's status, changing a title, or toggling a setting.
• Example: PATCH /api/courses/101 with body { "status": "published" } updates only the status field; title and category remain unchanged.

5. DELETE (Remove):
• Purpose: Permanently deletes or archives the specified resource from the database.
• Example: DELETE /api/courses/101 removes course 101.`,
        },
        {
          order: 2,
          heading: 'PUT vs. PATCH: The Critical Distinction',
          body: `Beginners frequently confuse PUT and PATCH. Here is a clear comparison:

Imagine a Course document currently stored in MongoDB with three properties:
{
  "id": "101",
  "title": "Backend Development",
  "difficulty": "Beginner",
  "price": 0
}

Scenario A: Sending a PUT request to /api/courses/101 with:
{ "title": "Advanced Backend Development" }
→ Result with PUT: The entire resource is replaced. Because "difficulty" and "price" were omitted, they are lost or reset to null/defaults!

Scenario B: Sending a PATCH request to /api/courses/101 with:
{ "title": "Advanced Backend Development" }
→ Result with PATCH: Only "title" is updated. "difficulty" remains "Beginner" and "price" remains 0.

Rule of Thumb: In real-world web applications, PATCH is used far more often than PUT because you usually want to modify specific properties without risking accidental deletion of other fields.`,
        },
        {
          order: 3,
          heading: 'Safe and Idempotent Methods',
          body: `Backend developers categorize HTTP methods using two important technical properties:

1. Safe Methods:
A method is considered "safe" if it does not modify the state of the server.
• GET and HEAD are safe methods. Merely requesting a webpage should never alter user balances or delete accounts.

2. Idempotent Methods:
A method is "idempotent" if making the exact same request once produces the exact same server state as making it five, ten, or a hundred times in succession.
• GET is idempotent (reading data repeatedly changes nothing).
• PUT is idempotent (replacing a record with value X multiple times leaves value X).
• DELETE is idempotent (deleting resource 101 leaves resource 101 deleted, whether called once or twice).
• POST is NOT idempotent (submitting a "Pay Now" POST request twice could charge a credit card twice unless special deduplication tokens are used).`,
        },
        {
          order: 4,
          heading: 'Common Beginner Mistakes',
          body: `1. Using GET for Actions That Modify Data:
Mistake: Creating a route like GET /api/courses/101/delete or GET /api/users/logout.
Reality: Search engine crawlers (like Googlebot) or browser pre-fetching tools will automatically follow GET links, accidentally triggering deletions or unintended logouts. Always use POST or DELETE for state-changing operations!

2. Misunderstanding POST vs PATCH:
Mistake: Using POST for every single API endpoint (e.g., POST /updateCourse, POST /deleteCourse).
Reality: While technically possible, this violates REST conventions and prevents HTTP caches, proxies, and client libraries from understanding the true nature of your operations. Use PATCH for updates and DELETE for removals.`,
        },
        {
          order: 5,
          heading: 'Suggested Practice Task & Thought Exercise',
          body: `Design Exercise:
Imagine you are building a simple "To-Do List" backend API.
Write down the HTTP Method and URL endpoint you would choose for each of the following four user actions:
1. A user wants to see all their saved tasks.
2. A user wants to create a new task named "Study HTTP Status Codes".
3. A user wants to mark an existing task (ID: 42) as completed without changing its title.
4. A user wants to remove task 42 completely from their list.

Check your answers against REST conventions:
1: GET /api/tasks
2: POST /api/tasks
3: PATCH /api/tasks/42
4: DELETE /api/tasks/42`,
        },
        {
          order: 6,
          heading: 'Topic Summary',
          body: `• HTTP methods specify the desired operation to perform on a resource.
• GET retrieves data safely without modifying server state.
• POST creates new resources or submits data for processing.
• PUT completely replaces an existing resource.
• PATCH partially modifies specific fields of an existing resource.
• DELETE removes an existing resource.
• Safe methods do not alter state; idempotent methods can be repeated safely without changing the final outcome.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Handling Different HTTP Methods in a Node.js Server',
        language: 'javascript',
        code: `// methods_demo.js - Routing incoming requests based on HTTP method
import http from 'node:http';

// In-memory course collection for demonstration
let courses = [
  { id: '1', title: 'Backend Fundamentals', status: 'draft' }
];

const server = http.createServer(async (req, res) => {
  const { method, url } = req;
  res.setHeader('Content-Type', 'application/json');

  // Route: GET /api/courses
  if (method === 'GET' && url === '/api/courses') {
    res.writeHead(200);
    return res.end(JSON.stringify({ courses }));
  }

  // Route: POST /api/courses
  if (method === 'POST' && url === '/api/courses') {
    let body = '';
    for await (const chunk of req) { body += chunk; }
    const newCourse = JSON.parse(body);
    newCourse.id = String(courses.length + 1);
    courses.push(newCourse);
    res.writeHead(201); // 201 Created
    return res.end(JSON.stringify({ message: 'Course created', course: newCourse }));
  }

  // Route: DELETE /api/courses/:id
  if (method === 'DELETE' && url.startsWith('/api/courses/')) {
    const id = url.split('/')[3];
    courses = courses.filter(c => c.id !== id);
    res.writeHead(200);
    return res.end(JSON.stringify({ message: \`Course \${id} deleted\` }));
  }

  // Unhandled route/method
  res.writeHead(405); // 405 Method Not Allowed
  res.end(JSON.stringify({ error: \`Method \${method} not allowed on \${url}\` }));
});

server.listen(3003, () => {
  console.log('Method routing server listening on http://localhost:3003');
});`,
        explanation: `This script illustrates how a backend server inspects 'req.method' to distinguish between GET, POST, and DELETE actions on the '/api/courses' route. Notice that a POST request returns HTTP status 201 (Created), while requesting an unsupported method on a route triggers HTTP status 405 (Method Not Allowed).`,
      },
    ],
    importantPoints: [
      'HTTP methods define the action to be performed on a target resource.',
      'GET is for reading data, POST is for creating data, PATCH is for partial updates, PUT is for total replacements, and DELETE is for removing data.',
      'GET requests must be safe and never modify persistent database state.',
      'PUT replaces an entire document; omitted fields are lost. PATCH modifies only specified fields.',
      'An idempotent operation produces the same final result regardless of whether it is executed once or multiple times.',
    ],
    externalReferences: [
      {
        title: 'MDN Web Docs: HTTP Request Methods',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods',
        source: 'MDN Web Docs',
      },
      {
        title: 'RFC 9110: HTTP Method Definitions',
        url: 'https://www.rfc-editor.org/rfc/rfc9110.html#section-9',
        source: 'IETF Standards',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 5: HTTP Status Codes
  // ID: 6abe9dc4f15c2b4f6008ac22
  // =========================================================================
  {
    topicId: '6abe9dc4f15c2b4f6008ac22',
    title: 'HTTP Status Codes',
    content: {
      explanation: `When a backend server responds to a client's request, how does the client instantly know if the operation succeeded, failed, or requires further action?

It looks at the HTTP Status Code: a 3-digit numerical code issued by the server at the very beginning of the HTTP response header.

HTTP status codes are divided into five logical classes based on their first digit:
• 1xx (Informational): Request received, continuing process.
• 2xx (Success): The action was successfully received, understood, and accepted.
• 3xx (Redirection): Further action must be taken by the client to complete the request (e.g., page moved).
• 4xx (Client Error): The client made a mistake in the request (e.g., invalid data, missing password, non-existent URL).
• 5xx (Server Error): The server failed to fulfill an apparently valid request due to a server-side bug or crash.

Understanding these codes is indispensable for backend engineers because they form the global diagnostic language of the web.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Identify the five major classes of HTTP status codes (1xx through 5xx).
2. Recognize and correctly apply the most common status codes in web APIs.
3. Master the critical security distinction between 401 Unauthorized and 403 Forbidden.
4. Choose the appropriate status code for various server outcomes (success, resource creation, validation errors, server crashes).`,
        },
        {
          order: 1,
          heading: 'Common 2xx (Success) Status Codes',
          body: `2xx codes indicate that the client's request was completed successfully:

• 200 OK:
The universal success code. Standard response for successful GET, PUT, or PATCH requests. Means "Here is the data you requested" or "Your update was applied."

• 201 Created:
Returned when a request has succeeded and resulted in the creation of a brand new resource in the database. Used almost exclusively as the response to a successful POST request.

• 204 No Content:
The server has successfully fulfilled the request, but there is no data body to return. Frequently used for successful DELETE requests where returning a response payload is unnecessary.`,
        },
        {
          order: 2,
          heading: 'Common 4xx (Client Error) Status Codes',
          body: `4xx codes mean the problem originated on the client side:

• 400 Bad Request:
The server cannot process the request because of malformed syntax, invalid JSON, or missing required fields.

• 401 Unauthorized (Unauthenticated):
Authentication is required and has failed or has not been provided. The user has not proved who they are (e.g., missing or expired JWT token).

• 403 Forbidden (Unauthorized Permissions):
The server knows who the user is (they are authenticated), but that user does NOT have permission to access the resource. For example, a student attempting to view an admin-only user list.

• 404 Not Found:
The requested URL or resource does not exist on the server (e.g., requesting a course ID that is not in the database).

• 409 Conflict:
The request could not be completed because of a conflict with current server state (e.g., trying to register an email address that is already taken, or enrolling in a course you are already enrolled in).

• 422 Unprocessable Content:
The syntax is valid JSON, but the data fails validation constraints (e.g., password too short, age is negative).

• 429 Too Many Requests:
The client has sent too many requests in a given amount of time (rate limiting triggered to protect against abuse or brute-force attacks).`,
        },
        {
          order: 3,
          heading: 'The Crucial Difference: 401 Unauthorized vs. 403 Forbidden',
          body: `One of the most frequent mistakes in backend engineering is misusing 401 and 403. Remember this rule:

401 Unauthorized = "Who are you?"
• The user has not provided credentials, or their token has expired.
• Fix: The client should prompt the user to log in.

403 Forbidden = "I know who you are, but you cannot touch this."
• The user is successfully logged in, but their role (e.g., 'student') is not allowed to perform an action reserved for an 'admin' or 'course_creator'.
• Fix: Logging in again will not help because their account does not have sufficient privileges.`,
        },
        {
          order: 4,
          heading: 'Common 5xx (Server Error) Status Codes',
          body: `5xx codes indicate that the server encountered an error or was unable to perform the request despite the client request being valid:

• 500 Internal Server Error:
The generic catch-all server crash. Means an unhandled exception occurred in the server code (e.g., calling a method on an undefined variable or an unhandled database connection crash). In production, servers must log the real error privately and return a generic 500 message to avoid leaking stack traces to attackers.

• 503 Service Unavailable:
The server is currently unable to handle the request due to temporary overloading or scheduled maintenance. Often returned by reverse proxies (like Nginx or Cloudflare) when the backend application is down.`,
        },
        {
          order: 5,
          heading: 'Common Beginner Mistakes',
          body: `1. Returning 200 OK for Errors:
Mistake: Returning HTTP 200 with a body like { "status": "error", "message": "User not found" }.
Reality: This confuses client libraries (like Axios or fetch), API gateways, and web caches because they treat HTTP 200 as unconditional success. Always return the appropriate 4xx or 5xx code!

2. Leaking Database Errors in 500 Responses:
Mistake: Sending raw MongoDB or SQL error messages in the HTTP response body when a 500 occurs.
Reality: Database error messages reveal table names, query structure, and server paths to malicious attackers. Log errors internally; return safe generic error messages externally.`,
        },
        {
          order: 6,
          heading: 'Suggested Practice Task & Thought Exercise',
          body: `Quiz Yourself:
Which HTTP status code would you return for each scenario below?
1. A student submits a login form with the wrong password.
2. A course creator successfully authors a brand new topic.
3. A user tries to register with an email that is already registered.
4. A user requests /api/courses/999999, but no course with that ID exists.
5. An authenticated student tries to delete an entire course belonging to faculty.

Answers:
1: 401 Unauthorized
2: 201 Created
3: 409 Conflict
4: 404 Not Found
5: 403 Forbidden`,
        },
        {
          order: 7,
          heading: 'Topic Summary',
          body: `• HTTP status codes are 3-digit standardized numbers sent in response headers to inform clients of the outcome.
• 2xx indicates success (200 OK, 201 Created, 204 No Content).
• 3xx indicates redirection (301 Permanent Redirect, 302 Temporary Redirect).
• 4xx indicates client error (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 429 Rate Limited).
• 5xx indicates server error (500 Internal Server Error, 503 Service Unavailable).
• 401 means unauthenticated (must log in); 403 means authenticated but forbidden (insufficient role privileges).`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Proper Status Code Handling in an Express.js Route',
        language: 'javascript',
        code: `// status_codes_demo.js - Demonstrating proper status codes in Express
import express from 'express';

const app = express();
app.use(express.json());

// Simulated database
const users = [
  { id: '1', email: 'alice@example.com', role: 'student' }
];

// Endpoint demonstrating 200, 400, and 409 status codes
app.post('/api/users', (req, res) => {
  const { email, password } = req.body;

  // 1. Missing data -> 400 Bad Request
  if (!email || !password) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Email and password are required fields.'
    });
  }

  // 2. Conflict with existing data -> 409 Conflict
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'A user with this email address already exists.'
    });
  }

  // 3. Success -> 201 Created
  const newUser = { id: String(users.length + 1), email, role: 'student' };
  users.push(newUser);

  return res.status(201).json({
    status: 'success',
    data: { user: newUser }
  });
});`,
        explanation: `This Express.js snippet illustrates how a backend API checks conditions and chooses semantic HTTP status codes. If required fields are missing, it sends 400 (Bad Request). If the user already exists, it sends 409 (Conflict). If everything succeeds, it returns 201 (Created) along with the newly created user record.`,
      },
    ],
    importantPoints: [
      'Status codes provide a universal, machine-readable signal of the outcome of an HTTP request.',
      '200 is for standard success; 201 is specifically for when a new resource is created.',
      '401 Unauthorized indicates authentication is missing or invalid (the client should authenticate).',
      '403 Forbidden indicates the client is authenticated, but lacks permissions for the requested resource.',
      '404 Not Found indicates the requested endpoint or resource does not exist.',
      'Never return 200 OK when an operation has failed—always choose the semantically accurate 4xx or 5xx code.',
    ],
    externalReferences: [
      {
        title: 'MDN Web Docs: HTTP Response Status Codes',
        url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Status',
        source: 'MDN Web Docs',
      },
      {
        title: 'RFC 9110: Status Code Definitions',
        url: 'https://www.rfc-editor.org/rfc/rfc9110.html#section-15',
        source: 'IETF Standards',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 6: JSON and Data Exchange
  // ID: 6abe9dc5f15c2b4f6008ac23
  // =========================================================================
  {
    topicId: '6abe9dc5f15c2b4f6008ac23',
    title: 'JSON and Data Exchange',
    content: {
      explanation: `When a frontend application running in a browser communicates with a backend server running Node.js, Python, or Go, they need a universal data exchange format that both computers can understand regardless of their programming languages.

Today, that universal language is JSON, which stands for JavaScript Object Notation.

Crucially: JSON is a plain text data format, NOT a programming language.

Because JSON is just formatted text, any programming language—whether JavaScript, Python, Java, C#, or Ruby—can parse a JSON string into its own native memory structures, or serialize native data into a JSON text string.

JSON is human-readable, lightweight, and structured using simple key-value pairs and ordered lists.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Explain what JSON is and why it is the standard format for modern web APIs.
2. Identify the six supported data types in JSON.
3. Write completely valid, syntactically correct JSON without common formatting bugs.
4. Understand serialization (converting memory objects to text) and deserialization/parsing (converting text to memory objects).`,
        },
        {
          order: 1,
          heading: 'The Six Supported JSON Data Types',
          body: `JSON supports exactly six data types. Nothing more, nothing less:

1. String: Text wrapped strictly in double quotes (e.g., "LearnSphere").
2. Number: Integer or floating-point numbers without quotes (e.g., 42 or 99.95).
3. Boolean: Either true or false (all lowercase, no quotes).
4. Null: Represents an empty or non-existent value (null in lowercase, no quotes).
5. Object: An unordered collection of key-value pairs wrapped in curly braces { }. Keys MUST be double-quoted strings.
6. Array: An ordered list of values wrapped in square brackets [ ]. Values can be of any supported JSON type.

Things that JSON does NOT support:
✗ Functions or methods
✗ Dates (dates are transmitted as ISO 8601 strings, like "2026-10-02T16:00:00Z")
✗ Comments (// or /* */ are completely forbidden in standard JSON)
✗ Undefined (undefined does not exist in JSON; use null instead)
✗ Single quotes (strings must use double quotes: "text", not 'text')`,
        },
        {
          order: 2,
          heading: 'Anatomy of a Valid JSON Document',
          body: `Here is a complete, valid JSON representation of a LearnSphere course:

{
  "id": "course-101",
  "title": "Backend Fundamentals",
  "price": 0,
  "isPublished": false,
  "tags": ["nodejs", "backend", "javascript"],
  "instructor": {
    "name": "Backend Faculty Lead",
    "email": "faculty@learnsphere.io"
  },
  "rating": null
}

Notice the strict syntax rules:
• Property names ("id", "title", "price", etc.) MUST have double quotes.
• Commas separate key-value pairs and array items, but there is NO trailing comma after the last property.
• Strings use double quotes exclusively.`,
        },
        {
          order: 3,
          heading: 'Serialization and Parsing (Serialization Lifecycle)',
          body: `When exchanging data over the internet, data must travel as a sequence of text characters or bytes:

1. Serialization (JSON.stringify):
The process of taking an in-memory programming object (like a JavaScript object) and converting it into a plain text JSON string so it can be sent over the network.
JavaScript code:
const jsonString = JSON.stringify(courseObject);

2. Deserialization / Parsing (JSON.parse):
The process of taking an incoming text JSON string received over the network and converting it back into a native programming object in memory so your code can access properties.
JavaScript code:
const courseObject = JSON.parse(incomingJsonString);`,
        },
        {
          order: 4,
          heading: 'Common Beginner Mistakes',
          body: `1. Trailing Commas:
Mistake: Writing { "name": "Alice", "age": 20, } with a comma after 20.
Reality: JavaScript objects permit trailing commas, but strict JSON standard forbids them! A trailing comma will cause JSON.parse() to throw a SyntaxError.

2. Using Single Quotes:
Mistake: Writing { 'title': 'Node.js' }.
Reality: JSON syntax strictly requires double quotes: { "title": "Node.js" }.

3. Adding Comments to JSON Files:
Mistake: Adding // My Configuration to a .json file.
Reality: JSON does not support comments. Any comment character breaks parsing.

4. Forgetting That JSON is Pure Text:
Mistake: Trying to execute functions or send date objects directly inside JSON.
Reality: Everything in JSON is converted to static data representations.`,
        },
        {
          order: 5,
          heading: 'Suggested Practice Task & Thought Exercise',
          body: `Syntax Validation Task:
Look at the text below. Can you spot the THREE syntax errors that make it invalid JSON?

{
  'name': "LearnSphere",
  "version": 1.0,
  "isActive": True,
  // Educational Platform
  "features": ["courses", "quizzes",]
}

Errors:
1. 'name' uses single quotes (must be "name").
2. True has a capital T (must be lowercase true).
3. // Educational Platform is a comment (comments are forbidden in JSON).
4. ["courses", "quizzes",] has an illegal trailing comma after "quizzes".`,
        },
        {
          order: 6,
          heading: 'Topic Summary',
          body: `• JSON (JavaScript Object Notation) is a lightweight, language-agnostic text format for data exchange.
• JSON is a data representation format, not a programming language.
• JSON supports 6 data types: string, number, boolean, null, object, and array.
• All object keys and string values must be enclosed in double quotes.
• JSON.stringify() serializes in-memory objects into text strings; JSON.parse() deserializes text strings into in-memory objects.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Parsing and Stringifying JSON Safely in Node.js',
        language: 'javascript',
        code: `// json_demo.js - Demonstrating serialization, deserialization, and safe error handling

// 1. A native JavaScript in-memory object
const studentData = {
  id: 42,
  name: 'Alex Johnson',
  enrolled: true,
  courses: ['Backend Development', 'MongoDB Mastery'],
  gpa: 3.9
};

// 2. Serialization: Object -> JSON String
const serializedPayload = JSON.stringify(studentData);
console.log('--- Serialized JSON String (Sent over network) ---');
console.log(typeof serializedPayload); // "string"
console.log(serializedPayload);

// 3. Deserialization: JSON String -> Native Object
const incomingNetworkText = '{"id":42,"name":"Alex Johnson","enrolled":true}';

try {
  const parsedStudent = JSON.parse(incomingNetworkText);
  console.log('\\n--- Deserialized Object in Memory ---');
  console.log('Student Name:', parsedStudent.name);
  console.log('Is Enrolled: ', parsedStudent.enrolled);
} catch (err) {
  console.error('Failed to parse incoming JSON payload:', err.message);
}

// 4. Safe Parsing Function (Defensive Backend Practice)
function safeJsonParse(jsonString, fallback = null) {
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}`,
        explanation: `This script shows how JSON.stringify() converts a JavaScript object into a flat text string suitable for sending across an HTTP connection. It also shows how JSON.parse() reconstructs a native object from incoming text, wrapping the parse in a try/catch block to defend the server against crashes if a client sends invalid JSON.`,
      },
    ],
    importantPoints: [
      'JSON is a text-only data exchange format, completely independent of any single programming language.',
      'Keys and string values in JSON MUST be enclosed in double quotation marks.',
      'JSON supports strings, numbers, booleans, null, objects, and arrays.',
      'Trailing commas and code comments are strictly prohibited in valid JSON.',
      'Always wrap JSON.parse() calls in try/catch blocks on the backend to prevent malformed client input from crashing the server process.',
    ],
    externalReferences: [
      {
        title: 'ECMA-404 The JSON Data Interchange Standard',
        url: 'https://www.json.org/json-en.html',
        source: 'JSON.org',
      },
      {
        title: 'MDN Web Docs: Working with JSON',
        url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Objects/JSON',
        source: 'MDN Web Docs',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 7: REST APIs
  // ID: 6abe9dc5f15c2b4f6008ac24
  // =========================================================================
  {
    topicId: '6abe9dc5f15c2b4f6008ac24',
    title: 'REST APIs',
    content: {
      explanation: `You will often hear developers say: "Our backend exposes a REST API." But what does that actually mean?

API stands for Application Programming Interface: a set of clearly defined endpoints and contracts that allow one software program to talk to another.

REST stands for REpresentational State Transfer. It is an architectural style—a collection of sensible design guidelines and conventions—created by computer scientist Roy Fielding in 2000 for building scalable web services.

A REST API is NOT a specific library, framework, or programming language. It is also not simply "any server that returns JSON."

Rather, a REST API is an API that treats your application's data as identifiable resources (like users, courses, or notes), accesses those resources using standard URLs, and manipulates them using standard HTTP methods (GET, POST, PATCH, DELETE).`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Explain what an API is and why REST is the prevailing architectural style for web services.
2. Understand the concept of "resources" and design clean, predictable RESTful URL hierarchies.
3. Understand the principle of statelessness and why it is critical for server scalability.
4. Map CRUD (Create, Read, Update, Delete) operations cleanly onto standard REST endpoints.`,
        },
        {
          order: 1,
          heading: 'Core Principles of RESTful Design',
          body: `To be considered truly RESTful, an API follows several core principles:

1. Resource-Based URLs:
In REST, everything is a noun (a resource). You name your endpoints after collections of things, not verbs:
✓ Good REST: /api/courses
✗ Bad (RPC style): /api/getAllCourses or /api/createCourseNow

2. Standard HTTP Methods for Actions:
Instead of putting verbs in the URL path, the action is defined by the HTTP method:
• GET /api/courses → Read list of courses
• POST /api/courses → Create a new course
• GET /api/courses/:id → Read a single course
• PATCH /api/courses/:id → Update a course
• DELETE /api/courses/:id → Delete a course

3. Statelessness:
Every single request from client to server must contain all the information necessary to understand and process the request (e.g., in headers and tokens). The server does not store memory of the client's past requests between connections. This allows any available server instance in a cluster to handle any incoming request.

4. Representation:
Clients never touch the raw database disk directly. Instead, the server returns a representation of the resource—most commonly a formatted JSON object.`,
        },
        {
          order: 2,
          heading: 'Designing Nested Resource Hierarchies',
          body: `When resources belong to other resources, REST conventions use nested URL paths to represent that parent-child relationship clearly.

Consider LearnSphere's educational hierarchy: Courses contain Modules, and Modules contain Topics:

1. Courses Collection:
GET  /api/courses
POST /api/courses

2. Single Course:
GET    /api/courses/:courseId
PATCH  /api/courses/:courseId
DELETE /api/courses/:courseId

3. Modules Belonging to a Course:
GET  /api/courses/:courseId/modules
POST /api/courses/:courseId/modules

4. Topics Belonging to a Module:
GET  /api/courses/:courseId/modules/:moduleId/topics
POST /api/courses/:courseId/modules/:moduleId/topics

This structured naming makes the API intuitive and self-documenting. Any engineer reading the URL immediately understands the relationship.`,
        },
        {
          order: 3,
          heading: 'Statelessness at a Beginner Level',
          body: `Statelessness is one of the most powerful features of REST.

Imagine a phone call with someone who has total amnesia every 10 seconds:
• If you say: "Order me a pizza," and then 10 seconds later say: "Make it large," they will say: "Make what large? I don't know what you are talking about."
• But if you say: "Order me a large pepperoni pizza to 123 Main Street," every message is self-contained and complete.

In a REST API, when a student requests their profile, they don't say: "Send me my profile (remember me from 2 minutes ago?)."
Instead, the client sends an Authorization header with a signed token:
Authorization: Bearer <jwt-token>
The server validates the token on that specific request without needing to keep a stateful connection open.`,
        },
        {
          order: 4,
          heading: 'Common Beginner Mistakes',
          body: `1. Putting Action Verbs in the URL:
Mistake: /api/deleteUserById?id=5 or /api/updateCourseTitle.
Reality: In REST, the URL identifies the resource (/api/users/5), and the HTTP method identifies the action (DELETE).

2. Inconsistent Pluralization:
Mistake: Mixing /api/user/5 with /api/courses and /api/order.
Reality: Use plural nouns consistently for resource collections (e.g., /api/users, /api/courses, /api/orders).

3. Assuming Any JSON Endpoint is REST:
Mistake: Believing that because an API uses JSON, it is automatically RESTful.
Reality: REST is an architectural design philosophy about resource identity, uniform interfaces, and statelessness.`,
        },
        {
          order: 5,
          heading: 'Suggested Practice Task & Thought Exercise',
          body: `API Design Task:
Imagine you are building a backend for an Online Bookstore.
Design the complete set of 5 RESTful endpoints for managing "books":
1. Fetch all books.
2. Fetch a specific book by ID.
3. Add a new book.
4. Update a book's price.
5. Remove a book.

Check your answers:
1: GET /api/books
2: GET /api/books/:id
3: POST /api/books
4: PATCH /api/books/:id
5: DELETE /api/books/:id`,
        },
        {
          order: 6,
          heading: 'Topic Summary',
          body: `• REST (Representational State Transfer) is an architectural style for building networked web applications.
• REST treats data entities as resources identified by clean, noun-based URLs.
• CRUD operations are mapped to standard HTTP methods: Create (POST), Read (GET), Update (PATCH/PUT), Delete (DELETE).
• REST is stateless: each request must contain all credentials and context needed for the server to fulfill it.
• Nested URLs represent hierarchical relationships between parent and child resources.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Building a RESTful Resource Router in Express.js',
        language: 'javascript',
        code: `// rest_courses_router.js - A clean, RESTful Express router for Courses
import express from 'express';

const router = express.Router();

let courses = [
  { id: '1', title: 'Backend Fundamentals', category: 'Development' }
];

// 1. GET /api/courses - List all resources
router.get('/', (req, res) => {
  res.status(200).json({ status: 'success', data: { courses } });
});

// 2. POST /api/courses - Create a new resource
router.post('/', (req, res) => {
  const { title, category } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const newCourse = { id: String(courses.length + 1), title, category };
  courses.push(newCourse);
  res.status(201).json({ status: 'success', data: { course: newCourse } });
});

// 3. GET /api/courses/:id - Read single resource
router.get('/:id', (req, res) => {
  const course = courses.find(c => c.id === req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }
  res.status(200).json({ status: 'success', data: { course } });
});

// 4. PATCH /api/courses/:id - Update specific fields of a resource
router.patch('/:id', (req, res) => {
  const course = courses.find(c => c.id === req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }
  if (req.body.title) course.title = req.body.title;
  if (req.body.category) course.category = req.body.category;
  res.status(200).json({ status: 'success', data: { course } });
});

// 5. DELETE /api/courses/:id - Remove resource
router.delete('/:id', (req, res) => {
  courses = courses.filter(c => c.id !== req.params.id);
  res.status(204).send(); // 204 No Content
});

export default router;`,
        explanation: `This Express router implements all five fundamental REST conventions for a 'courses' resource collection. The URL remains focused on the noun '/api/courses', while the action is cleanly determined by whether the client sends a GET, POST, PATCH, or DELETE request.`,
      },
    ],
    importantPoints: [
      'REST is an architectural pattern, not a language or tool.',
      'RESTful URLs represent nouns (resources), while HTTP methods represent verbs (actions).',
      'Statelessness requires every request to carry its own authentication and context without relying on server memory.',
      'Representations (typically JSON) separate the client view from the physical database layout.',
      'Clean URL nesting reflects intuitive data relationships (/api/courses/:courseId/modules/:moduleId).',
    ],
    externalReferences: [
      {
        title: 'Architectural Styles and the Design of Network-based Software Architectures (Roy Fielding Dissertation)',
        url: 'https://www.ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm',
        source: 'University of California, Irvine',
      },
      {
        title: 'MDN Web Docs: REST Architecture Guide',
        url: 'https://developer.mozilla.org/en-US/docs/Glossary/REST',
        source: 'MDN Web Docs',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },

  // =========================================================================
  // TOPIC 8: Understanding the Request–Response Cycle
  // ID: 6abe9dc5f15c2b4f6008ac25
  // =========================================================================
  {
    topicId: '6abe9dc5f15c2b4f6008ac25',
    title: 'Understanding the Request–Response Cycle',
    content: {
      explanation: `Every single interaction on the web—from viewing a lesson to posting a comment—is powered by the HTTP Request–Response Cycle.

The Request–Response Cycle is the end-to-end journey that begins the exact millisecond a user interacts with a client application, travels through internet infrastructure, is processed by server middleware and business logic, queries a database, and returns a formatted response to update the user's screen.

Understanding this complete round trip from start to finish is what transforms a beginner into a true backend developer. When a feature breaks or an API feels slow, knowing each step of this cycle lets you diagnose whether the issue lies in the browser, DNS, routing middleware, database query, or network serialization.`,
      sections: [
        {
          order: 0,
          heading: 'Learning Objectives',
          body: `By the end of this topic, you will be able to:
1. Trace the complete 11-step lifecycle of an HTTP request from user click to visual UI update.
2. Understand the role of DNS lookup, TCP/TLS handshake, and IP routing.
3. Understand backend internal processing: routing, middleware chain, controller logic, and database query execution.
4. Walk through a concrete LearnSphere platform example: GET /api/courses.`,
        },
        {
          order: 1,
          heading: 'The Complete 11-Step Lifecycle Walkthrough',
          body: `Here is the comprehensive step-by-step sequence that occurs during a web transaction:

1. User Action:
The user clicks "Explore Courses" on a website or types a URL into the browser address bar.

2. Client Request Construction:
The browser's networking engine constructs an HTTP request message containing:
• Method: GET
• URL Path: /api/courses
• Headers: Accept: application/json, Authorization: Bearer <token>

3. DNS Resolution & TCP/TLS Connection:
The browser translates the human-readable domain name (e.g., example.learnsphere.io) into a machine IP address using the Domain Name System (DNS). The browser then establishes a secure encrypted TCP and TLS connection to that IP on port 443.

4. Network Transmission:
The encrypted HTTP request is broken into packets and transmitted across internet routers until it arrives at the backend hosting infrastructure.

5. Reverse Proxy / Gateway:
A reverse proxy (such as Nginx, Cloudflare, or Google Cloud Run) receives the incoming connection, terminates TLS, applies rate limiting, and forwards the request to the application server (Node.js).

6. Server Middleware Execution:
The request enters the Express.js application and passes sequentially through middleware functions:
• Security headers (Helmet)
• CORS validation (verifying client origin)
• Body parsing (reading incoming JSON)
• Authentication (verifying JWT signature and extracting user ID)
• Rate limiting (preventing denial-of-service abuse)

7. Route Matching:
The router inspects the method (GET) and path (/api/courses) and dispatches the request to the registered controller handler function.

8. Controller & Business Logic:
The controller verifies parameters and calls the service layer. The service layer applies business logic (e.g., "Only retrieve courses whose status is 'published'").

9. Database Interaction:
The service layer issues a database query (e.g., Course.find({ status: 'published' })) via Mongoose to MongoDB. MongoDB executes the query against its index, retrieves the documents from disk/memory, and returns raw data records to Node.js.

10. Response Construction & Serialization:
The controller formats the data, sets the HTTP status code (200 OK), sets headers (Content-Type: application/json), serializes the data into JSON, and transmits the response packets back across the internet.

11. Client Receipt & UI Rendering:
The browser receives the response packets, decrypts them, parses the JSON payload, and passes the course list to the frontend framework (React), which re-renders the DOM to show the course cards to the student.`,
        },
        {
          order: 2,
          heading: 'Concrete Walkthrough: Student Requests Courses on LearnSphere',
          body: `Let us follow a concrete scenario on LearnSphere:

Request: GET /api/courses
Initiator: Authenticated student browsing the course catalog.

• Step A (Client): React triggers fetch('/api/courses', { headers: { Authorization: 'Bearer ...' } }).
• Step B (Server Middleware):
  1. cors() checks that the request comes from an allowed frontend domain.
  2. authenticate() middleware inspects the Authorization header, verifies the cryptographic signature with the server secret key, and attaches req.user = { userId, role: 'student' }.
• Step C (Controller): courseController.getCourses executes.
• Step D (Database Query): MongoDB queries collection 'courses' for { status: 'published' }. Draft courses belonging to faculty are safely excluded from the query results!
• Step E (Server Response): The backend returns HTTP 200 OK with:
  {
    "status": "success",
    "data": { "courses": [...] }
  }
• Step F (Client Render): React receives the 200 OK, sets courses state, stops the loading spinner, and renders the course cards cleanly on the screen.`,
        },
        {
          order: 3,
          heading: 'The Role of Middleware in the Cycle',
          body: `In Node.js and Express backend development, Middleware refers to functions that sit in the pipeline between receiving the raw network request and sending the final response.

Think of middleware as security checkpoints at an airport:
• Checkpoint 1 (Logger): Records arrival time of the passenger.
• Checkpoint 2 (Rate Limiter): Checks if this passenger has walked through the door 100 times in the last minute.
• Checkpoint 3 (Authentication Guard): Checks the passenger's passport (JWT token). If invalid or expired, the guard rejects them immediately with 401 Unauthorized—stopping them before they ever reach the gate (controller)!
• Checkpoint 4 (Controller): Welcomes the verified passenger to their flight.

If any middleware fails or rejects a request, the cycle terminates immediately ("fails closed") without touching the database.`,
        },
        {
          order: 4,
          heading: 'Common Beginner Mistakes',
          body: `1. Forgetting to Call next() in Custom Middleware:
Mistake: Writing a middleware function that does not call next() and does not send a response.
Reality: The request hangs forever until the browser times out! Every middleware must either pass control to next() or terminate the cycle with res.status(...).json(...).

2. Unhandled Asynchronous Errors:
Mistake: Failing to catch rejected Promises in async controller functions.
Reality: Unhandled Promise rejections can crash the Node.js process or leave clients hanging without a response. Always use try/catch blocks or an async error forwarding wrapper.

3. Blocking the Node.js Event Loop:
Mistake: Running a heavy, synchronous calculation (like a multi-second loop or synchronous file read) inside a request handler.
Reality: Node.js is single-threaded for JavaScript execution. Blocking the event loop freezes the server, delaying all other concurrent users from completing their request-response cycles.`,
        },
        {
          order: 5,
          heading: 'Suggested Practice Task & Thought Exercise',
          body: `Diagnostic Exercise:
A user reports: "I clicked the Submit Assignment button 30 seconds ago, and nothing happened—the button is just spinning."

Based on the 11-step Request-Response cycle, list 3 possible places where the breakdown could have occurred:
1. Network: The request failed to reach the server due to disconnected internet or a DNS failure.
2. Server: An unhandled exception or missing next() in backend middleware left the request hanging.
3. Database: The database query is deadlocked or timed out waiting for a connection from the connection pool.`,
        },
        {
          order: 6,
          heading: 'Topic Summary',
          body: `• The Request–Response cycle is the complete journey of a web interaction from client action to UI re-rendering.
• The cycle spans client preparation, DNS resolution, TLS connection, gateway routing, middleware pipeline, controller logic, database execution, serialization, and frontend DOM update.
• Middleware functions act as security and processing checkpoints in the pipeline before requests reach business logic.
• When errors occur, servers must fail closed safely, log details internally, and return clear HTTP status codes to complete the cycle cleanly.`,
        },
      ],
    },
    codeExamples: [
      {
        title: 'Tracing the Request-Response Pipeline in Express.js',
        language: 'javascript',
        code: `// pipeline_demo.js - Demonstrating the sequential flow of the Request-Response Cycle
import express from 'express';

const app = express();

// 1. Global Middleware: Timing and Logging
app.use((req, res, next) => {
  const startTime = Date.now();
  console.log(\`[1. Cycle Started] \${req.method} \${req.url}\`);

  // Hook into response completion to calculate duration
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(\`[4. Cycle Completed] Status: \${res.statusCode} in \${duration}ms\`);
  });

  next(); // Pass to next checkpoint
});

// 2. Authentication Middleware Checkpoint
app.use('/api/protected', (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[2. Auth Failed] Request terminated with 401 Unauthorized');
    return res.status(401).json({ error: 'Authentication required' });
  }
  console.log('[2. Auth Verified] Passing to controller');
  next();
});

// 3. Controller Handler
app.get('/api/protected/data', (req, res) => {
  console.log('[3. Controller] Fetching data and constructing response');
  res.status(200).json({
    status: 'success',
    data: { items: ['Item A', 'Item B', 'Item C'] }
  });
});

app.listen(3004, () => {
  console.log('Pipeline tracer listening on http://localhost:3004');
});`,
        explanation: `This runnable Express application demonstrates how an HTTP request moves sequentially through timing middleware, authentication verification, and finally into the controller. Notice how res.on('finish') allows us to observe the complete request-response cycle time when the last byte leaves the server.`,
      },
    ],
    importantPoints: [
      'The Request–Response cycle is the foundational loop connecting frontend user actions to backend services.',
      'A request moves sequentially through DNS, network routers, reverse proxies, middleware checkpoints, and controller handlers.',
      'Middleware executes in strict order; failing middleware must terminate the cycle with an appropriate error code (e.g., 401).',
      'Database queries represent the persistence step inside the cycle; results are serialized into JSON before transit.',
      'Always ensure every possible code path sends a response or calls next(), preventing client connection hangs.',
    ],
    externalReferences: [
      {
        title: 'MDN Web Docs: How the Web Works',
        url: 'https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanisms/How_does_the_Internet_work',
        source: 'MDN Web Docs',
      },
      {
        title: 'Express.js Guide: Using Middleware',
        url: 'https://expressjs.com/en/guide/using-middleware.html',
        source: 'Express.js Documentation',
      },
    ],
    videos: { english: null, telugu: null, hindi: null },
    images: [],
  },
];

async function populateModule1() {
  console.log('===================================================================');
  console.log('=== LearnSphere: Populating Module 1 Educational Content        ===');
  console.log('===================================================================\n');

  // Step 1: Log in as Course Creator
  console.log(`Authenticating as Course Creator (${CREATOR_EMAIL})...`);
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: CREATOR_EMAIL, password: CREATOR_PASSWORD }),
  });

  if (!loginRes.ok) {
    const errorBody = await loginRes.text();
    throw new Error(`Course Creator authentication failed (${loginRes.status}): ${errorBody}`);
  }

  const loginData = await loginRes.json();
  const accessToken = loginData.data?.accessToken;
  const userRole = loginData.data?.user?.role;
  console.log(`✓ Authenticated successfully. User role: "${userRole}"`);

  if (userRole !== 'course_creator') {
    throw new Error(`Expected role 'course_creator', received '${userRole}'`);
  }

  // Step 2: Loop over each topic and update content via Course Creator API
  console.log(`\nBeginning content population for ${module1TopicsContent.length} topics in Module 1...`);

  let successCount = 0;

  for (const topicData of module1TopicsContent) {
    const { topicId, title, content, codeExamples, importantPoints, externalReferences, videos, images } = topicData;
    console.log(`\nUpdating Topic: "${title}" (ID: ${topicId})...`);

    const updateUrl = `${BASE_URL}/api/creator/courses/${COURSE_ID}/modules/${MODULE_1_ID}/topics/${topicId}/content`;
    const payload = {
      content,
      codeExamples,
      importantPoints,
      externalReferences,
      videos: videos || { english: null, telugu: null, hindi: null },
      images: images || [],
    };

    const updateRes = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      console.error(`✗ Failed to update Topic "${title}" (Status ${updateRes.status}): ${errText}`);
      throw new Error(`Topic update failed for "${title}"`);
    }

    const updateResult = await updateRes.json();
    console.log(`  ✓ Successfully updated topic content via PATCH endpoint (HTTP ${updateRes.status})`);

    // Verify by reading back the content via GET /content
    const verifyRes = await fetch(updateUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!verifyRes.ok) {
      throw new Error(`Failed to verify topic content via GET (Status ${verifyRes.status})`);
    }

    const verifyData = await verifyRes.json();
    const retrieved = verifyData.data?.content;

    const hasExplanation = Boolean(retrieved?.content?.explanation?.length > 100);
    const sectionsCount = retrieved?.content?.sections?.length || 0;
    const examplesCount = retrieved?.codeExamples?.length || 0;
    const pointsCount = retrieved?.importantPoints?.length || 0;
    const refsCount = retrieved?.externalReferences?.length || 0;

    console.log(`  ✓ Verified persisted content:`);
    console.log(`    - Explanation length: ${retrieved?.content?.explanation?.length} chars`);
    console.log(`    - Sections count:     ${sectionsCount}`);
    console.log(`    - Code examples:      ${examplesCount}`);
    console.log(`    - Important points:   ${pointsCount}`);
    console.log(`    - External references:${refsCount}`);

    if (!hasExplanation || sectionsCount < 4 || pointsCount < 4) {
      throw new Error(`Persisted content validation failed for "${title}"`);
    }

    successCount++;
  }

  console.log(`\n===================================================================`);
  console.log(`✓ Completed: Successfully populated and verified all ${successCount}/${module1TopicsContent.length} topics!`);
  console.log(`===================================================================`);
}

populateModule1()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error during Module 1 content population:', err);
    process.exit(1);
  });
