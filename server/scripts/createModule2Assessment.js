/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Creation Script: Module 2 Mastery Quiz
 * Course: Backend Development with Node.js, Express & MongoDB (6abe9dc2f15c2b4f6008ac1c)
 * Module 2: Node.js Fundamentals (6abe9dc6f15c2b4f6008ac26)
 * Anchor Topic: Building a Simple Node.js Server (6abe9dc9f15c2b4f6008ac2f)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from '../config/db.js';
import Assessment from '../models/Assessment.js';
import RefreshSession from '../models/RefreshSession.js';

const BASE_URL = 'http://localhost:5000';
const COURSE_ID = '6abe9dc2f15c2b4f6008ac1c';
const MODULE_2_ID = '6abe9dc6f15c2b4f6008ac26';
const ANCHOR_TOPIC_ID = '6abe9dc9f15c2b4f6008ac2f';

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
    // Question 1: Node.js Runtime Architecture (V8 & libuv)
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'In the Node.js runtime architecture, which statement accurately distinguishes the responsibilities of Google V8 and libuv?',
      codeSnippet: '',
      order: 0,
      options: [
        { _id: q1Opt1, text: 'V8 executes JavaScript on the single main thread, while libuv manages the event loop, non-blocking I/O, and the background worker thread pool', order: 0 },
        { _id: q1Opt2, text: 'V8 manages the operating system thread pool and file descriptors, while libuv compiles JavaScript bytecode into machine instructions', order: 1 },
        { _id: q1Opt3, text: 'V8 handles network routing and HTTP socket listening, while libuv is the npm package registry client bundled with Node.js', order: 2 },
        { _id: q1Opt4, text: 'V8 provides multi-threaded DOM manipulation APIs, while libuv executes synchronous garbage collection routines', order: 3 },
      ],
      correctOptionId: q1Opt1,
      explanation: 'Node.js pairs Google V8 (which compiles and executes JavaScript code on the single main call stack) with libuv (a C library providing cross-platform asynchronous I/O, the event loop, and a worker thread pool for file system operations, DNS lookups, and crypto tasks).',
    },

    // Question 2: Blocking vs. Non-Blocking I/O
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'What occurs on a Node.js server handling multiple concurrent client connections if a request handler executes a synchronous file system method like fs.readFileSync?',
      codeSnippet: `const fs = require('fs');\n\n// Inside a request handler:\nconst reportData = fs.readFileSync('/data/annual-report.pdf');\nres.end(reportData);`,
      order: 1,
      options: [
        { _id: q2Opt1, text: 'Node.js spawns an isolated operating system thread for each incoming request so other clients experience zero delay', order: 0 },
        { _id: q2Opt2, text: 'The single main JavaScript thread is completely blocked, preventing any other client requests or timer callbacks from executing until the read finishes', order: 1 },
        { _id: q2Opt3, text: 'V8 automatically intercepts the call and runs it asynchronously in the background without halting the event loop', order: 2 },
        { _id: q2Opt4, text: 'Only database connections are paused; HTTP network sockets continue processing concurrently on separate threads', order: 3 },
      ],
      correctOptionId: q2Opt2,
      explanation: 'Because user JavaScript executes on a single main thread, calling synchronous blocking operations like fs.readFileSync halts the entire call stack. No other client requests, callbacks, or events can be processed until that operation completes, degrading server throughput.',
    },

    // Question 3: Asynchronous Callbacks & Error-First Convention
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'In traditional Node.js asynchronous APIs, what is the structure and purpose of the "error-first callback" convention demonstrated below?',
      codeSnippet: `fs.readFile('database.json', 'utf8', (err, data) => {\n  if (err) {\n    console.error('File read failed:', err.message);\n    return;\n  }\n  console.log('File content:', data);\n});`,
      order: 2,
      options: [
        { _id: q3Opt1, text: 'The first callback argument is reserved for an Error object (or null/undefined on success), ensuring developers explicitly check for errors before handling data', order: 0 },
        { _id: q3Opt2, text: 'The callback always receives data first, with errors returned as an optional third string argument', order: 1 },
        { _id: q3Opt3, text: 'The error parameter automatically triggers an uncaughtException process termination if omitted', order: 2 },
        { _id: q3Opt4, text: 'Error-first callbacks are only used in frontend browser click handlers and are deprecated across Node.js', order: 3 },
      ],
      correctOptionId: q3Opt1,
      explanation: 'Node.js standardized the error-first callback convention where the first argument err is null/undefined if the operation succeeded, or an Error instance if it failed. The caller must inspect if (err) first before safely using the resulting data.',
    },

    // Question 4: Promises and State Transitions
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'According to the Promises/A+ specification and the Node.js runtime, how do Promise state transitions behave?',
      codeSnippet: '',
      order: 3,
      options: [
        { _id: q4Opt1, text: 'A Promise begins in the pending state and can transition once to either fulfilled or rejected; once settled, its state and value/reason are immutable', order: 0 },
        { _id: q4Opt2, text: 'A Promise begins in the fulfilled state and dynamically shifts to rejected each time a catch handler executes', order: 1 },
        { _id: q4Opt3, text: 'A Promise alternates between pending and fulfilled indefinitely as subsequent .then() chains are attached', order: 2 },
        { _id: q4Opt4, text: 'A Promise starts in the rejected state and requires calling resolve() from an external listener to become pending', order: 3 },
      ],
      correctOptionId: q4Opt1,
      explanation: 'A Promise starts in the "pending" state. It can transition exactly once to "fulfilled" (with a resolved value) or "rejected" (with a rejection reason/error). Once settled, its state cannot change again.',
    },

    // Question 5: Async/Await & Robust Error Handling
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'When using async/await in Node.js backend services, what is the idiomatic pattern for handling rejected Promises thrown by awaited operations?',
      codeSnippet: `async function fetchUserProfile(userId) {\n  try {\n    const user = await userRepository.findById(userId);\n    if (!user) throw new Error('User not found');\n    return user;\n  } catch (error) {\n    logger.error('Failed to retrieve user:', error.message);\n    throw error;\n  }\n}`,
      order: 4,
      options: [
        { _id: q5Opt1, text: 'Wrapping await expressions in standard try...catch blocks, which intercept rejected Promises just like synchronous runtime exceptions', order: 0 },
        { _id: q5Opt2, text: 'Passing an error callback as the second parameter into every await call (e.g., await fn(id, (err) => {}))', order: 1 },
        { _id: q5Opt3, text: 'Awaiting functions never throw errors because async functions automatically convert rejections into empty strings', order: 2 },
        { _id: q5Opt4, text: 'Calling process.exit(0) inside the function header to silence unhandled rejections', order: 3 },
      ],
      correctOptionId: q5Opt1,
      explanation: 'async/await allows asynchronous code to be structured synchronously. When an awaited Promise rejects, JavaScript throws an exception that can be caught using standard try...catch blocks.',
    },

    // Question 6: Environment Variables & Security Rules
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'According to Twelve-Factor App methodology and Node.js best practices taught in Module 2, how should configuration and secrets be handled?',
      codeSnippet: `const PORT = process.env.PORT || 5000;\nconst MONGODB_URI = process.env.MONGODB_URI;`,
      order: 5,
      options: [
        { _id: q6Opt1, text: 'Access configuration via process.env, store local development values in a .env file that is gitignored, and inject environment variables at deployment without committing secrets', order: 0 },
        { _id: q6Opt2, text: 'Hardcode production database passwords and secret keys directly inside package.json so every developer has them', order: 1 },
        { _id: q6Opt3, text: 'Commit .env and .env.production files with live credentials into public Git repositories to automate deployment', order: 2 },
        { _id: q6Opt4, text: 'Store backend API keys in client-side localStorage and fetch them via browser window objects', order: 3 },
      ],
      correctOptionId: q6Opt1,
      explanation: 'Production secrets, API keys, and port numbers should be configured through environment variables (accessible via process.env). Sensitive .env files must never be committed to source control (they must be in .gitignore), and production environments inject variables securely.',
    },

    // Question 7: CommonJS vs. ES Modules
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'What is a fundamental difference between CommonJS (CJS) and ES Modules (ESM) in Node.js?',
      codeSnippet: `// System A: const express = require('express'); module.exports = app;\n// System B: import express from 'express'; export default app;`,
      order: 6,
      options: [
        { _id: q7Opt1, text: 'CommonJS uses require() and module.exports with synchronous runtime loading, whereas ES Modules use import and export with static analysis, enabled via "type": "module" in package.json', order: 0 },
        { _id: q7Opt2, text: 'CommonJS is exclusively for frontend web browsers, while ES Modules are exclusively supported in Node.js servers', order: 1 },
        { _id: q7Opt3, text: 'require() is strictly asynchronous and returns a Promise, while import statements are executed synchronously at runtime', order: 2 },
        { _id: q7Opt4, text: 'CommonJS requires Node.js v22 or higher, whereas ES Modules have been the default syntax since Node.js v0.10', order: 3 },
      ],
      correctOptionId: q7Opt1,
      explanation: 'CommonJS is Node\'s legacy module format that loads modules synchronously at runtime using require() and module.exports. ES Modules use static import/export declarations that can be analyzed before code execution, enabled in Node.js by setting "type": "module" in package.json or using the .mjs extension.',
    },

    // Question 8: Building an HTTP Server with the Core http Module
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'In the core Node.js http module, how does http.createServer() handle incoming client requests and send a structured JSON response?',
      codeSnippet: `const http = require('http');\n\nconst server = http.createServer((req, res) => {\n  if (req.method === 'GET' && req.url === '/api/health') {\n    res.writeHead(200, { 'Content-Type': 'application/json' });\n    res.end(JSON.stringify({ status: 'ok' }));\n  }\n});\nserver.listen(5000);`,
      order: 7,
      options: [
        { _id: q8Opt1, text: 'The callback receives req (readable stream for request details) and res (writable stream), using res.writeHead() to send status code and headers, and res.end() to transmit the payload and close the HTTP stream', order: 0 },
        { _id: q8Opt2, text: 'res.end() terminates the entire Node.js server process and releases the listening port after every request', order: 1 },
        { _id: q8Opt3, text: 'req is a writable stream used to send response bodies, while res is a read-only stream containing incoming client IP data', order: 2 },
        { _id: q8Opt4, text: 'http.createServer() only accepts HTML strings and throws a TypeError if JSON is passed to res.end()', order: 3 },
      ],
      correctOptionId: q8Opt1,
      explanation: 'http.createServer() registers a request listener with two arguments: req (an IncomingMessage readable stream representing the incoming request) and res (a ServerResponse writable stream). res.writeHead() configures the HTTP status code and response headers, and res.end() writes the response body and signals completion of the HTTP message.',
    },
  ];
}

async function run() {
  console.log('===================================================================');
  console.log('=== Authoring Module 2 Mastery Quiz                             ===');
  console.log('===================================================================\n');

  await connectDB();
  if (!isDbConnected()) {
    console.error('Database connection failed.');
    process.exit(1);
  }

  // 1. Authenticate as Course Creator
  console.log('1. Authenticating as Course Creator...');
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: CREATOR_EMAIL,
      password: CREATOR_PASSWORD,
    }),
  });

  const creatorToken = loginRes.data?.data?.accessToken || loginRes.data?.data?.tokens?.accessToken;
  if (loginRes.status !== 200 || !creatorToken) {
    console.error('Creator login failed:', loginRes.status, loginRes.data);
    process.exit(1);
  }
  const creatorUser = loginRes.data.data.user;
  console.log(`✓ Creator authenticated: ${creatorUser.name} (${creatorUser.email}) [ID: ${creatorUser.id || creatorUser._id}]`);

  try {
    // 2. Check for existing assessment for Module 2
    console.log('2. Checking for existing assessment for Module 2...');
    const existing = await Assessment.findOne({
      courseId: COURSE_ID,
      moduleId: MODULE_2_ID,
      title: 'Module 2 Quiz: Node.js Runtime & Asynchronous Programming',
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
      title: 'Module 2 Quiz: Node.js Runtime & Asynchronous Programming',
      description: 'Mastery quiz testing core Node.js runtime architecture (V8 vs libuv), blocking vs non-blocking I/O, error-first callback conventions, Promise lifecycle and immutability, async/await try/catch patterns, environment variable configuration, CommonJS vs ES Modules, and building HTTP servers with the core http module.',
      type: 'topic',
      moduleId: MODULE_2_ID,
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
  console.log('=== Assessment Creation Script Completed Successfully           ===');
  console.log('===================================================================');
  process.exit(0);
}).catch((err) => {
  console.error('Fatal error during execution:', err);
  process.exit(1);
});
