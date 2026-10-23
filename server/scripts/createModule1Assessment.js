/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Creation Script: Module 1 Mastery Quiz
 * Course: Backend Development with Node.js, Express & MongoDB (6abe9dc2f15c2b4f6008ac1c)
 * Module 1: Backend Fundamentals (6abe9dc2f15c2b4f6008ac1d)
 * Anchor Topic: Understanding the Request–Response Cycle (6abe9dc5f15c2b4f6008ac25)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from '../config/db.js';
import Assessment from '../models/Assessment.js';
import RefreshSession from '../models/RefreshSession.js';

const BASE_URL = 'http://localhost:5000';
const COURSE_ID = '6abe9dc2f15c2b4f6008ac1c';
const MODULE_1_ID = '6abe9dc2f15c2b4f6008ac1d';
const ANCHOR_TOPIC_ID = '6abe9dc5f15c2b4f6008ac25';

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
    // Question 1: What Is Backend Development?
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'In a standard modern web architecture, which of the following tasks is strictly the primary responsibility of the backend rather than the frontend client?',
      codeSnippet: '',
      order: 0,
      options: [
        { _id: q1Opt1, text: 'Listening for DOM click events and rendering interactive CSS visual transitions in the browser', order: 0 },
        { _id: q1Opt2, text: 'Executing business rules, securely querying databases, and authoritatively enforcing user access control', order: 1 },
        { _id: q1Opt3, text: 'Directly connecting to production databases from client-side JavaScript without an intermediary server', order: 2 },
        { _id: q1Opt4, text: 'Storing database administrative credentials in client LocalStorage for rapid offline querying', order: 3 },
      ],
      correctOptionId: q1Opt2,
      explanation: 'The backend is authoritatively responsible for business logic execution, data integrity, secure database transactions, and access control. Frontend code runs on untrusted user devices and must never connect directly to databases or store master credentials.',
    },

    // Question 2: Client–Server Architecture
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'In the Three-Tier Architecture pattern explored in Module 1, what are the three tiers and their respective roles?',
      codeSnippet: '',
      order: 1,
      options: [
        { _id: q2Opt1, text: 'Presentation Tier (UI/Client), Application/Logic Tier (Backend Server), and Data Tier (Database)', order: 0 },
        { _id: q2Opt2, text: 'Routing Tier (DNS Server), Network Tier (Hardware Switch), and Host Tier (Operating System)', order: 1 },
        { _id: q2Opt3, text: 'HTML Tier (Markup), CSS Tier (Style), and JavaScript Tier (Dynamic Scripts)', order: 2 },
        { _id: q2Opt4, text: 'Express Tier (Middleware), MongoDB Tier (Documents), and Node.js Tier (Runtime Engine)', order: 3 },
      ],
      correctOptionId: q2Opt1,
      explanation: 'The Three-Tier Architecture cleanly separates concerns into: 1) Presentation Tier (browser or mobile user interface), 2) Application/Logic Tier (backend server processing requests and business logic), and 3) Data Tier (databases like MongoDB or PostgreSQL managing persistence).',
    },

    // Question 3: HTTP and HTTPS
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'HTTPS uses Transport Layer Security (TLS) to safeguard network traffic. Which three foundational security guarantees does HTTPS provide to clients and servers?',
      codeSnippet: '',
      order: 2,
      options: [
        { _id: q3Opt1, text: 'Infinite network bandwidth, automated denial-of-service immunity, and server load rebalancing', order: 0 },
        { _id: q3Opt2, text: 'Encryption (confidentiality), Data Integrity (tamper detection), and Server Authentication (identity proof via certificates)', order: 1 },
        { _id: q3Opt3, text: 'Cross-Site Scripting immunity, client hardware sandboxing, and automated database index optimization', order: 2 },
        { _id: q3Opt4, text: 'Zero network latency, guaranteed delivery without packet drops, and complete client anonymity', order: 3 },
      ],
      correctOptionId: q3Opt2,
      explanation: 'HTTPS provides three essential TLS guarantees: 1) Encryption (prevents eavesdroppers from reading data in transit), 2) Data Integrity (detects whether messages were altered or corrupted en route), and 3) Authentication (proves the client is communicating with the genuine server via digital certificates).',
    },

    // Question 4: HTTP Methods
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'Consider the two HTTP requests shown below. Under RESTful conventions and HTTP specifications, what is the crucial distinction between PUT and PATCH?',
      codeSnippet: 'PUT /api/users/42 HTTP/1.1\nContent-Type: application/json\n{ "name": "Jane Doe", "email": "jane@example.com", "role": "student" }\n\nPATCH /api/users/42 HTTP/1.1\nContent-Type: application/json\n{ "role": "course_creator" }',
      order: 3,
      options: [
        { _id: q4Opt1, text: 'PUT is strictly used for deleting records, while PATCH is exclusively used for inserting new records', order: 0 },
        { _id: q4Opt2, text: 'PUT replaces the entire resource document with the provided payload, whereas PATCH applies a partial update modifying only specified fields', order: 1 },
        { _id: q4Opt3, text: 'PUT cannot receive a JSON request body, whereas PATCH requires a multi-part form stream', order: 2 },
        { _id: q4Opt4, text: 'PUT is a non-idempotent method, while PATCH is mathematically guaranteed to be safe and read-only', order: 3 },
      ],
      correctOptionId: q4Opt2,
      explanation: 'Under HTTP and REST specifications, PUT represents a full resource replacement (omitted fields may be reset or erased), whereas PATCH represents a partial modification that only updates the specific fields provided in the request body.',
    },

    // Question 5: HTTP Status Codes
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'A student logs into LearnSphere with valid credentials and receives a valid JWT. If the student attempts to access a restricted creator endpoint (e.g., POST /api/creator/courses), which HTTP status code should the backend return, and why?',
      codeSnippet: '',
      order: 4,
      options: [
        { _id: q5Opt1, text: '401 Unauthorized, because the server does not recognize any user identity whatsoever', order: 0 },
        { _id: q5Opt2, text: '403 Forbidden, because the user is successfully authenticated, but their student role lacks permission for creator operations', order: 1 },
        { _id: q5Opt3, text: '404 Not Found, because endpoints never exist when accessed with insufficient privileges', order: 2 },
        { _id: q5Opt4, text: '500 Internal Server Error, because role verification exceptions indicate an internal server breakdown', order: 3 },
      ],
      correctOptionId: q5Opt2,
      explanation: '401 Unauthorized means authentication is missing or invalid (the server does not know who you are). 403 Forbidden means the client identity was verified, but the authenticated user lacks sufficient permissions or roles to perform the requested action.',
    },

    // Question 6: JSON and Data Exchange
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'Which of the following JSON code snippets is strictly valid according to the ECMA-404 / RFC 8259 JSON standard?',
      codeSnippet: '// Option A:\n{ "courseId": "101", "title": "Node.js Basics", "isPublished": true, "topics": [1, 2, 3] }\n\n// Option B:\n{ \'courseId\': \'101\', title: "Node.js Basics", isPublished: true }\n\n// Option C:\n{ "courseId": "101", "calculate": function() { return 101; } }\n\n// Option D:\n{ "courseId": "101", "details": undefined }',
      order: 5,
      options: [
        { _id: q6Opt1, text: 'Option A', order: 0 },
        { _id: q6Opt2, text: 'Option B', order: 1 },
        { _id: q6Opt3, text: 'Option C', order: 2 },
        { _id: q6Opt4, text: 'Option D', order: 3 },
      ],
      correctOptionId: q6Opt1,
      explanation: 'In valid JSON: 1) all keys and string values must be enclosed in double quotes, 2) functions and undefined values are not valid JSON data types, and 3) comments are not permitted in strict JSON. Option A contains only valid JSON types: string, boolean, and array of numbers.',
    },

    // Question 7: REST APIs
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'Which of the following URI designs adheres best to standard RESTful resource naming conventions for retrieving all topics in Module 2 of Course 5?',
      codeSnippet: '',
      order: 6,
      options: [
        { _id: q7Opt1, text: 'GET /api/courses/5/modules/2/topics', order: 0 },
        { _id: q7Opt2, text: 'GET /api/fetchModuleTopics?courseId=5&moduleId=2', order: 1 },
        { _id: q7Opt3, text: 'POST /api/topics/query_by_module_and_course', order: 2 },
        { _id: q7Opt4, text: 'GET /api/course5_module2_topics_list', order: 3 },
      ],
      correctOptionId: q7Opt1,
      explanation: 'REST emphasizes resource-oriented hierarchies using plural nouns rather than verbs or action procedures. Hierarchical resources are intuitively expressed as nested URIs: /courses/:courseId/modules/:moduleId/topics.',
    },

    // Question 8: Understanding the Request–Response Cycle
    {
      _id: new mongoose.Types.ObjectId(),
      prompt: 'Place the following sequential events of the HTTP Request–Response Cycle in their correct chronological order from the moment a user clicks a link to when the page finishes rendering:\n1. Client formats and sends an HTTP request (method, headers, body) across the connection\n2. Browser resolves the server domain name into an IP address via DNS lookup\n3. Client and server complete TCP 3-way handshake and TLS cryptographic negotiation\n4. Server routing and middleware process request, executing business logic to construct an HTTP response\n5. Browser parses HTTP status code, headers, and response body to render content',
      codeSnippet: '',
      order: 7,
      options: [
        { _id: q8Opt1, text: '2 -> 3 -> 1 -> 4 -> 5', order: 0 },
        { _id: q8Opt2, text: '1 -> 2 -> 3 -> 4 -> 5', order: 1 },
        { _id: q8Opt3, text: '3 -> 2 -> 1 -> 5 -> 4', order: 2 },
        { _id: q8Opt4, text: '2 -> 1 -> 3 -> 4 -> 5', order: 3 },
      ],
      correctOptionId: q8Opt1,
      explanation: 'The request–response lifecycle starts with DNS resolution (2) to find the server IP, followed by establishing network connections via TCP and TLS (3). Next, the HTTP request is transmitted (1). The backend handles routing and generates a response (4). Finally, the client browser parses and renders the response (5).',
    },
  ];
}

async function run() {
  console.log('===================================================================');
  console.log('=== LearnSphere — Creating Module 1 Mastery Quiz                ===');
  console.log('===================================================================\n');

  if (!isDbConnected()) {
    await connectDB();
  }

  // 1. Authenticate Course Creator
  console.log('1. Authenticating as owning Course Creator...');
  const loginRes = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: CREATOR_EMAIL, password: CREATOR_PASSWORD }),
  });

  if (loginRes.status !== 200 || !loginRes.data?.data?.accessToken) {
    console.error('Failed to log in as Course Creator:', loginRes.data);
    process.exit(1);
  }

  const creatorToken = loginRes.data.data.accessToken;
  const creatorUser = loginRes.data.data.user;
  console.log(`✓ Authenticated as: ${creatorUser.name} (${creatorUser.email}), role: ${creatorUser.role}`);

  try {
    // 2. Check for existing assessment
    console.log('2. Checking for existing assessment for Module 1...');
    const existing = await Assessment.findOne({
      courseId: COURSE_ID,
      moduleId: MODULE_1_ID,
      title: 'Module 1 Quiz: Backend & HTTP Fundamentals',
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
      title: 'Module 1 Quiz: Backend & HTTP Fundamentals',
      description: 'Mastery quiz covering core backend responsibilities, 3-tier architecture, HTTP vs HTTPS security guarantees, REST methods and idempotency, HTTP status codes, JSON serialization rules, REST resource design, and the full HTTP request–response lifecycle.',
      type: 'topic',
      moduleId: MODULE_1_ID,
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
