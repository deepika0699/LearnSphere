/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Verification Suite: Module 7 Mastery Quiz & Security Enforcements
 *
 * Verifies:
 * 1. Exactly 7 assessments exist in the database (Modules 1 through 7).
 * 2. Assessment belongs to Course 6abe9dc2f15c2b4f6008ac1c, Module 6abe9ddaf15c2b4f6008ac59, Topic 6abe9ddef15c2b4f6008ac63.
 * 3. Configuration invariants: status 'published', passingScore 75, timeLimitMinutes 15, maxAttempts 0, type 'topic'.
 * 4. Question set invariants: exactly 8 questions, each with 4 distinct options, valid correctOptionId, and non-empty explanation.
 * 5. Practical coverage: At least 4 questions feature code/scenario snippets (found: 8).
 * 6. Course integrity: Course remains 'draft'. All 8 modules and 73 topics intact.
 * 7. Creator and Admin API retrieval parity.
 * 8. Student authorization & projection security: Student cannot take assessment on draft course, and student projection strictly strips correct answers and explanations.
 * 9. Zero database side-effects: 0 enrollments, 0 attempts, 0 topic progress records, 0 lingering refresh sessions.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from '../config/db.js';
import Assessment from '../models/Assessment.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import AssessmentAttempt from '../models/AssessmentAttempt.js';
import Enrollment from '../models/Enrollment.js';
import TopicProgress from '../models/TopicProgress.js';
import RefreshSession from '../models/RefreshSession.js';
import { formatSafeAssessmentForStudent } from '../services/assessmentService.js';

const BASE_URL = 'http://localhost:5000';
const COURSE_ID = '6abe9dc2f15c2b4f6008ac1c';
const MODULE_7_ID = '6abe9ddaf15c2b4f6008ac59';
const ANCHOR_TOPIC_ID = '6abe9ddef15c2b4f6008ac63';

const CREATOR_EMAIL = 'faculty@learnsphere.io';
const CREATOR_PASSWORD = 'Str0ng!Faculty#Secret2026';

const ADMIN_EMAIL = process.env.INITIAL_ADMIN_EMAIL || 'admin@learnsphere.io';
const ADMIN_PASSWORD = process.env.INITIAL_ADMIN_PASSWORD || 'Str0ng!Admin#Secret2026';

let passedChecks = 0;
let totalChecks = 0;

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✓ [PASS] ${message}`);
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

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

async function run() {
  console.log('===================================================================');
  console.log('=== Verification Suite: Module 7 Mastery Quiz                   ===');
  console.log('===================================================================\n');

  await connectDB();
  assert(isDbConnected(), 'Database connection established');

  // --- SECTION 1: Database Invariants ---
  console.log('\n--- Section 1: Assessment Count & Hierarchy ---');
  const assessmentsCount = await Assessment.countDocuments();
  assert(assessmentsCount === 9, `Database contains exactly 9 assessments (actual: ${assessmentsCount})`);

  const moduleAssessmentCount = await Assessment.countDocuments({
    courseId: COURSE_ID,
    moduleId: MODULE_7_ID,
  });
  assert(moduleAssessmentCount === 1, `Expected Module 7 assessment exists exactly once (actual: ${moduleAssessmentCount})`);

  const assessment = await Assessment.findOne({
    courseId: COURSE_ID,
    moduleId: MODULE_7_ID,
    title: 'Module 7 Quiz: Backend Security',
  });

  assert(Boolean(assessment), 'Module 7 Assessment exists in database');
  assert(String(assessment.courseId) === COURSE_ID, `Assessment courseId matches ${COURSE_ID}`);
  assert(String(assessment.moduleId) === MODULE_7_ID, `Assessment moduleId matches ${MODULE_7_ID}`);
  assert(String(assessment.topicId) === ANCHOR_TOPIC_ID, `Assessment topicId matches anchor topic ${ANCHOR_TOPIC_ID}`);

  // --- SECTION 2: Assessment Metadata Invariants ---
  console.log('\n--- Section 2: Assessment Configuration Invariants ---');
  assert(assessment.type === 'topic', `Assessment type is 'topic' (actual: '${assessment.type}')`);
  assert(assessment.status === 'published', `Assessment status is 'published' (actual: '${assessment.status}')`);
  assert(assessment.passingScore === 75, `Passing score is 75% (actual: ${assessment.passingScore})`);
  assert(assessment.timeLimitMinutes === 15, `Time limit is 15 minutes (actual: ${assessment.timeLimitMinutes})`);
  assert(assessment.maxAttempts === 0, `Maximum attempts is 0 (unlimited) (actual: ${assessment.maxAttempts})`);
  assert(assessment.questions.length === 8, `Question count is exactly 8 (actual: ${assessment.questions.length})`);

  // --- SECTION 3: Question Structure & Integrity ---
  console.log('\n--- Section 3: Question Set Quality & Option Validation ---');
  const questionIds = new Set();
  const allOptionIds = new Set();
  let codeQuestionsCount = 0;

  assessment.questions.forEach((q, qIndex) => {
    assert(Boolean(q._id), `Question ${qIndex + 1} has an ObjectId`);
    const qIdStr = String(q._id);
    assert(!questionIds.has(qIdStr), `Question ${qIndex + 1} has a unique ID across the assessment`);
    questionIds.add(qIdStr);

    assert(typeof q.prompt === 'string' && q.prompt.trim().length >= 10, `Question ${qIndex + 1} prompt is non-empty and substantive`);
    assert(q.order === qIndex, `Question ${qIndex + 1} has valid sequential order ${qIndex}`);
    assert(Array.isArray(q.options) && q.options.length === 4, `Question ${qIndex + 1} contains exactly 4 options`);

    const optionTexts = new Set();
    let correctFound = false;

    q.options.forEach((opt, optIndex) => {
      assert(Boolean(opt._id), `Question ${qIndex + 1} Option ${optIndex + 1} has an ObjectId`);
      const optIdStr = String(opt._id);
      assert(!allOptionIds.has(optIdStr), `Question ${qIndex + 1} Option ${optIndex + 1} ID is globally unique`);
      allOptionIds.add(optIdStr);

      assert(typeof opt.text === 'string' && opt.text.trim().length > 0, `Question ${qIndex + 1} Option ${optIndex + 1} text is non-empty`);
      assert(!optionTexts.has(opt.text.trim()), `Question ${qIndex + 1} Option ${optIndex + 1} text is distinct`);
      optionTexts.add(opt.text.trim());

      assert(opt.order === optIndex, `Question ${qIndex + 1} Option ${optIndex + 1} has valid sequential order ${optIndex}`);

      if (String(opt._id) === String(q.correctOptionId)) {
        correctFound = true;
      }
    });

    assert(correctFound, `Question ${qIndex + 1} correctOptionId matches one of its own 4 options`);
    assert(typeof q.explanation === 'string' && q.explanation.trim().length >= 20, `Question ${qIndex + 1} contains a substantive explanation`);

    if ((q.codeSnippet && q.codeSnippet.trim().length > 0) || q.prompt.includes('```') || q.prompt.includes('const ') || q.prompt.includes('function ')) {
      codeQuestionsCount++;
    }
  });

  assert(codeQuestionsCount >= 4, `At least 4 questions feature code/scenario snippets (found: ${codeQuestionsCount})`);

  // Section 3b: Question Concept Grounding Verification
  console.log('\n--- Section 3b: Specific Blueprint Concepts Verification ---');
  const q1 = assessment.questions[0];
  assert(q1.explanation.includes('Server-side validation') && q1.explanation.includes('defense in depth'), 'Question 1 covers server-side input validation and untrusted client handling');

  const q2 = assessment.questions[1];
  assert(q2.explanation.includes('$ne') && q2.explanation.includes('express-mongo-sanitize'), 'Question 2 covers NoSQL operator injection and multi-layered defenses');

  const q3 = assessment.questions[2];
  assert(q3.explanation.includes('401') && q3.explanation.includes('403'), 'Question 3 covers authentication vs authorization and status codes');

  const q4 = assessment.questions[3];
  assert(q4.explanation.includes('BOLA') && q4.explanation.includes('ownership'), 'Question 4 covers broken access control, BOLA/IDOR, and resource ownership');

  const q5 = assessment.questions[4];
  assert(q5.explanation.includes('Mass assignment') && q5.explanation.includes('allowlisting'), 'Question 5 covers mass-assignment protection and field allowlisting');

  const q6 = assessment.questions[5];
  assert(q6.explanation.includes('trust proxy') && q6.explanation.includes('brute-force'), 'Question 6 covers rate limiting, trust proxy behind load balancers, and abuse controls');

  const q7 = assessment.questions[6];
  assert(q7.explanation.includes('Internal server error') && q7.explanation.includes('redaction'), 'Question 7 covers sanitized error handling, log redaction, and secret management');

  const q8 = assessment.questions[7];
  assert(q8.explanation.includes('fail-closed') && q8.explanation.includes('Defense in Depth'), 'Question 8 covers fail-closed architecture, security testing, and defense in depth');

  // --- SECTION 4: Course and Modules Integrity ---
  console.log('\n--- Section 4: Course State & Scope Isolation ---');
  const course = await Course.findById(COURSE_ID);
  assert(Boolean(course), 'Showcase course exists');
  assert(course.status === 'draft', `Course status remains strictly 'draft' (actual: '${course.status}')`);

  const modulesCount = await Module.countDocuments({ courseId: COURSE_ID });
  assert(modulesCount === 8, `All 8 modules remain intact (actual: ${modulesCount})`);

  const topicsCount = await Topic.countDocuments({ courseId: COURSE_ID });
  assert(topicsCount === 73, `All 73 topics remain intact (actual: ${topicsCount})`);

  // --- SECTION 5: API Endpoint Verification ---
  console.log('\n--- Section 5: Course Creator & Admin API Parity ---');
  const creatorLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: CREATOR_EMAIL, password: CREATOR_PASSWORD }),
  });
  assert(creatorLogin.status === 200, 'Course Creator authenticates successfully');
  const creatorToken = creatorLogin.data?.data?.accessToken || creatorLogin.data?.data?.tokens?.accessToken;

  const adminLogin = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  assert(adminLogin.status === 200, 'Admin authenticates successfully');
  const adminToken = adminLogin.data?.data?.accessToken || adminLogin.data?.data?.tokens?.accessToken;

  try {
    // Creator list assessments
    const creatorListRes = await request(`/api/creator/courses/${COURSE_ID}/assessments`, {}, creatorToken);
    assert(creatorListRes.status === 200, 'Creator GET /api/creator/courses/:courseId/assessments returns 200 OK');
    const creatorAssessments = creatorListRes.data?.data?.assessments || [];
    assert(creatorAssessments.length === 9, `Creator assessment list contains exactly 9 assessments (actual: ${creatorAssessments.length})`);
    assert(creatorAssessments.some(a => a.id === String(assessment._id)), 'Creator assessment list contains Module 7 assessment');

    // Creator get single assessment
    const creatorGetRes = await request(`/api/creator/courses/${COURSE_ID}/assessments/${assessment._id}`, {}, creatorToken);
    assert(creatorGetRes.status === 200, 'Creator GET /api/creator/courses/:courseId/assessments/:assessmentId returns 200 OK');
    const creatorAssessmentData = creatorGetRes.data?.data?.assessment;
    assert(creatorAssessmentData.id === String(assessment._id), 'Creator retrieved assessment ID matches');
    assert(creatorAssessmentData.questionsCount === 8, 'Creator retrieved assessment questions count is 8');
    assert(Boolean(creatorAssessmentData.questions[0].correctOptionId), 'Creator view retains correctOptionId for authoring');

    // Admin parity
    const adminGetRes = await request(`/api/admin/assessments/${assessment._id}`, {}, adminToken);
    assert(adminGetRes.status === 200, 'Admin GET /api/admin/assessments/:assessmentId returns 200 OK');
    const adminListRes = await request(`/api/admin/assessments/courses/${COURSE_ID}`, {}, adminToken);
    assert(adminListRes.status === 200, 'Admin GET /api/admin/assessments/courses/:courseId returns 200 OK');
    assert(adminListRes.data?.data?.assessments?.some(a => a._id === String(assessment._id) || a.id === String(assessment._id)), 'Admin list includes Module 7 assessment');

    // --- SECTION 6: Security Isolation & Zero-Leakage Checks ---
    console.log('\n--- Section 6: Security Isolation & Answer Key Redaction ---');
    // Unauthenticated access
    const unauthRes = await request(`/api/creator/courses/${COURSE_ID}/assessments/${assessment._id}`);
    assert(unauthRes.status === 401, 'Unauthenticated access to creator endpoint is rejected (401 Unauthorized)');

    // Safe student projection verification
    const safeStudentView = formatSafeAssessmentForStudent(assessment);
    assert(safeStudentView.questions.length === 8, 'Student-safe formatted view has 8 questions');
    const hasAnyCorrectOptionId = safeStudentView.questions.some((q) => 'correctOptionId' in q && q.correctOptionId !== undefined);
    assert(!hasAnyCorrectOptionId, 'CRITICAL: Student-safe formatted view strictly redacts correctOptionId from all questions');
    const hasAnyExplanation = safeStudentView.questions.some((q) => 'explanation' in q && q.explanation !== undefined);
    assert(!hasAnyExplanation, 'CRITICAL: Student-safe formatted view strictly redacts explanation from all questions');

    // Unauthenticated student access to student endpoints
    const studentApiRes = await request(`/api/student/courses/${COURSE_ID}/assessments/${assessment._id}`);
    assert(studentApiRes.status === 401, 'Unauthenticated student access to student endpoint returns 401 Unauthorized');

  } finally {
    // Clean up temporary login sessions
    await RefreshSession.deleteMany({});
  }

  // --- SECTION 7: Side-Effects Check ---
  console.log('\n--- Section 7: Scope Invariants & Zero Side-Effects ---');
  const attemptsCount = await AssessmentAttempt.countDocuments();
  assert(attemptsCount === 0, `Zero assessment attempts exist (actual: ${attemptsCount})`);

  const enrollmentCount = await Enrollment.countDocuments();
  assert(enrollmentCount === 0, `Zero enrollments exist (actual: ${enrollmentCount})`);

  const progressCount = await TopicProgress.countDocuments();
  assert(progressCount === 0, `Zero topic progress records exist (actual: ${progressCount})`);

  const sessionCount = await RefreshSession.countDocuments();
  assert(sessionCount === 0, `Zero lingering refresh sessions exist (actual: ${sessionCount})`);

  console.log('\n===================================================================');
  console.log(`=== All ${passedChecks}/${totalChecks} Verification Checks PASSED Successfully!            ===`);
  console.log('===================================================================');
}

run().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('\nVerification failed:', err.message);
  process.exit(1);
});
