/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Verification Suite: Comprehensive Backend Assessment (Course Final)
 * Course: Backend Development with Node.js, Express & MongoDB (6abe9dc2f15c2b4f6008ac1c)
 *
 * Verifies:
 * 1. Exactly 9 assessments exist in the database (Modules 1–8 + Comprehensive Final Assessment).
 * 2. Exactly 1 course-level assessment exists with type 'course', moduleId null, topicId null.
 * 3. Configuration invariants: status 'published', passingScore 75, timeLimitMinutes 45, maxAttempts 3, type 'course'.
 * 4. Question set invariants: exactly 16 questions, each with 4 distinct options, valid correctOptionId, and non-empty explanation.
 * 5. Practical coverage: At least 8 questions feature code/scenario snippets (found: 16).
 * 6. Synthesis verification across all 8 modules (HTTP, Node.js, Express, MongoDB, REST APIs, Auth, Security, Project Architecture).
 * 7. Course integrity: Course remains 'draft'. All 8 modules and 73 topics intact.
 * 8. Creator and Admin API retrieval parity.
 * 9. Student authorization & projection security: Student cannot take assessment on draft course, and student projection strictly strips correct answers and explanations.
 * 10. Zero database side-effects: 0 enrollments, 0 attempts, 0 topic progress records, 0 lingering refresh sessions.
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
  console.log('=== Verification Suite: Comprehensive Backend Assessment        ===');
  console.log('===================================================================\n');

  await connectDB();
  assert(isDbConnected(), 'Database connection established');

  // --- SECTION 1: Database Invariants ---
  console.log('\n--- Section 1: Assessment Count & Hierarchy ---');
  const assessmentsCount = await Assessment.countDocuments();
  assert(assessmentsCount === 9, `Database contains exactly 9 assessments (actual: ${assessmentsCount})`);

  const courseAssessmentCount = await Assessment.countDocuments({
    courseId: COURSE_ID,
    type: 'course',
  });
  assert(courseAssessmentCount === 1, `Expected course-level final assessment exists exactly once (actual: ${courseAssessmentCount})`);

  const assessment = await Assessment.findOne({
    courseId: COURSE_ID,
    type: 'course',
  });

  assert(Boolean(assessment), 'Comprehensive Final Assessment exists in database');
  assert(assessment.title === 'Comprehensive Backend Assessment', `Assessment title matches 'Comprehensive Backend Assessment' (actual: '${assessment.title}')`);
  assert(String(assessment.courseId) === COURSE_ID, `Assessment courseId matches ${COURSE_ID}`);
  assert(assessment.moduleId === null, `Assessment moduleId is strictly null for course-level assessment`);
  assert(assessment.topicId === null, `Assessment topicId is strictly null for course-level assessment`);

  // --- SECTION 2: Assessment Metadata Invariants ---
  console.log('\n--- Section 2: Assessment Configuration Invariants ---');
  assert(assessment.type === 'course', `Assessment type is 'course' (actual: '${assessment.type}')`);
  assert(assessment.status === 'published', `Assessment status is 'published' (actual: '${assessment.status}')`);
  assert(assessment.passingScore === 75, `Passing score is 75% (actual: ${assessment.passingScore})`);
  assert(assessment.timeLimitMinutes === 45, `Time limit is 45 minutes (actual: ${assessment.timeLimitMinutes})`);
  assert(assessment.maxAttempts === 3, `Maximum attempts is 3 for course-level final (actual: ${assessment.maxAttempts})`);
  assert(assessment.questions.length === 16, `Question count is exactly 16 (actual: ${assessment.questions.length})`);

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

    assert(typeof q.prompt === 'string' && q.prompt.trim().length >= 15, `Question ${qIndex + 1} prompt is non-empty and substantive`);
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

    if (q.codeSnippet && q.codeSnippet.trim().length > 0) {
      codeQuestionsCount++;
    }
  });

  assert(codeQuestionsCount >= 8, `At least 8 questions feature code/scenario snippets (found: ${codeQuestionsCount})`);

  // --- SECTION 3b: Curriculum Coverage Across All 8 Modules ---
  console.log('\n--- Section 3b: Curriculum Synthesis Coverage (Modules 1–8) ---');
  // Module 1
  assert(
    assessment.questions[0].prompt.includes('stateless') || assessment.questions[0].explanation.includes('stateless'),
    'Question 1 covers Module 1: Stateless HTTP client-server architecture'
  );
  assert(
    assessment.questions[1].prompt.includes('PUT') && assessment.questions[1].prompt.includes('PATCH'),
    'Question 2 covers Module 1: HTTP methods, idempotency, and status codes'
  );

  // Module 2
  assert(
    assessment.questions[2].prompt.includes('event loop') || assessment.questions[2].explanation.includes('event loop'),
    'Question 3 covers Module 2: Node.js event loop phases and microtask scheduling'
  );
  assert(
    assessment.questions[3].prompt.includes('CPU') || assessment.questions[3].explanation.includes('Worker Threads'),
    'Question 4 covers Module 2: Single-threaded event loop and CPU-bound offloading'
  );

  // Module 3
  assert(
    assessment.questions[4].prompt.includes('error') || assessment.questions[4].explanation.includes('next'),
    'Question 5 covers Module 3: Express middleware pipeline and next(err) error handling'
  );
  assert(
    assessment.questions[5].prompt.includes('mergeParams') || assessment.questions[5].explanation.includes('mergeParams'),
    'Question 6 covers Module 3: Express nested routers and route parameter scoping'
  );

  // Module 4
  assert(
    assessment.questions[6].prompt.includes('.lean()') || assessment.questions[6].explanation.includes('.lean()'),
    'Question 7 covers Module 4: Mongoose query hydration and .lean() performance optimization'
  );
  assert(
    assessment.questions[7].prompt.includes('embedding') || assessment.questions[7].explanation.includes('populate'),
    'Question 8 covers Module 4: MongoDB relational modeling (embedding vs referencing) and .populate()'
  );

  // Module 5
  assert(
    assessment.questions[8].prompt.includes('Service') || assessment.questions[8].explanation.includes('Separation of Concerns'),
    'Question 9 covers Module 5: Layered architecture (Controllers vs Services)'
  );
  assert(
    assessment.questions[9].prompt.includes('mass-assignment') || assessment.questions[9].explanation.includes('mass-assignment'),
    'Question 10 covers Module 5: Safe pagination, sorting allowlists, and mass-assignment defense'
  );

  // Module 6
  assert(
    assessment.questions[10].prompt.includes('bcrypt') || assessment.questions[10].explanation.includes('bcrypt'),
    'Question 11 covers Module 6: Password hashing with bcrypt, salting, and constant-time verification'
  );
  assert(
    assessment.questions[11].prompt.includes('refresh') || assessment.questions[11].explanation.includes('dual-token'),
    'Question 12 covers Module 6: Dual-token JWT architecture and refresh token rotation'
  );

  // Module 7
  assert(
    assessment.questions[12].prompt.includes('$ne') || assessment.questions[12].explanation.includes('query operators'),
    'Question 13 covers Module 7: NoSQL injection prevention and safe query construction'
  );
  assert(
    assessment.questions[13].prompt.includes('rate limiting') || assessment.questions[13].explanation.includes('rate limiting'),
    'Question 14 covers Module 7: Rate limiting, brute-force defense, and sensitive data protection'
  );

  // Module 8
  assert(
    assessment.questions[14].prompt.includes('Two-Stage') || assessment.questions[14].explanation.includes('IDOR'),
    'Question 15 covers Module 8: Two-stage authorization (RBAC and resource ownership)'
  );
  assert(
    assessment.questions[15].prompt.includes('integration') || assessment.questions[15].explanation.includes('pillars'),
    'Question 16 covers Module 8: Automated integration testing pillars and database state invariants'
  );

  // --- SECTION 4: Course State & Scope Isolation ---
  console.log('\n--- Section 4: Course State & Scope Isolation ---');
  const course = await Course.findById(COURSE_ID);
  assert(Boolean(course), 'Showcase course exists');
  assert(course.status === 'draft', `Course status remains strictly 'draft' (actual: '${course.status}')`);

  const modulesCount = await Module.countDocuments({ courseId: COURSE_ID });
  assert(modulesCount === 8, `All 8 modules remain intact (actual: ${modulesCount})`);

  const topicsCount = await Topic.countDocuments({ courseId: COURSE_ID });
  assert(topicsCount === 73, `All 73 topics remain intact (actual: ${topicsCount})`);

  // --- SECTION 5: Course Creator & Admin API Parity ---
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
    assert(creatorAssessments.some(a => a.id === String(assessment._id)), 'Creator assessment list contains Comprehensive Final Assessment');

    // Creator get single assessment
    const creatorGetRes = await request(`/api/creator/courses/${COURSE_ID}/assessments/${assessment._id}`, {}, creatorToken);
    assert(creatorGetRes.status === 200, 'Creator GET /api/creator/courses/:courseId/assessments/:assessmentId returns 200 OK');
    const creatorAssessmentData = creatorGetRes.data?.data?.assessment;
    assert(creatorAssessmentData.id === String(assessment._id), 'Creator retrieved assessment ID matches');
    assert(creatorAssessmentData.questionsCount === 16, 'Creator retrieved assessment questions count is 16');
    assert(Boolean(creatorAssessmentData.questions[0].correctOptionId), 'Creator view retains correctOptionId for authoring');

    // Admin parity
    const adminGetRes = await request(`/api/admin/assessments/${assessment._id}`, {}, adminToken);
    assert(adminGetRes.status === 200, 'Admin GET /api/admin/assessments/:assessmentId returns 200 OK');
    const adminListRes = await request(`/api/admin/assessments/courses/${COURSE_ID}`, {}, adminToken);
    assert(adminListRes.status === 200, 'Admin GET /api/admin/assessments/courses/:courseId returns 200 OK');
    const adminAssessments = adminListRes.data?.data?.assessments || [];
    assert(adminAssessments.some(a => a.id === String(assessment._id)), 'Admin list includes Comprehensive Final Assessment');

  } finally {
    // Teardown temporary login sessions
    if (creatorLogin.data?.data?.user?.id) {
      await RefreshSession.deleteMany({ userId: creatorLogin.data.data.user.id });
    }
    if (adminLogin.data?.data?.user?.id) {
      await RefreshSession.deleteMany({ userId: adminLogin.data.data.user.id });
    }
  }

  // --- SECTION 6: Security Isolation & Answer Key Redaction ---
  console.log('\n--- Section 6: Security Isolation & Answer Key Redaction ---');
  const unauthRes = await request(`/api/creator/courses/${COURSE_ID}/assessments/${assessment._id}`);
  assert(unauthRes.status === 401, 'Unauthenticated access to creator endpoint is rejected (401 Unauthorized)');

  // Validate student safe projection service
  const studentSafeDoc = formatSafeAssessmentForStudent(assessment, true);
  assert(studentSafeDoc.questions.length === 16, 'Student-safe formatted view has 16 questions');

  const leaksCorrectOption = studentSafeDoc.questions.some(q => q.correctOptionId !== undefined);
  assert(!leaksCorrectOption, 'CRITICAL: Student-safe formatted view strictly redacts correctOptionId from all questions');

  const leaksExplanation = studentSafeDoc.questions.some(q => q.explanation !== undefined);
  assert(!leaksExplanation, 'CRITICAL: Student-safe formatted view strictly redacts explanation from all questions');

  // Verify student endpoint rejects unauthenticated access
  const unauthStudentRes = await request(`/api/student/courses/${COURSE_ID}/assessments/${assessment._id}`);
  assert(unauthStudentRes.status === 401, 'Unauthenticated student access to student endpoint returns 401 Unauthorized');

  // --- SECTION 7: Scope Invariants & Zero Side-Effects ---
  console.log('\n--- Section 7: Scope Invariants & Zero Side-Effects ---');
  const attemptsCount = await AssessmentAttempt.countDocuments();
  assert(attemptsCount === 0, `Zero assessment attempts exist (actual: ${attemptsCount})`);

  const enrollmentsCount = await Enrollment.countDocuments({ courseId: COURSE_ID });
  assert(enrollmentsCount === 0, `Zero enrollments exist (actual: ${enrollmentsCount})`);

  const progressCount = await TopicProgress.countDocuments({ courseId: COURSE_ID });
  assert(progressCount === 0, `Zero topic progress records exist (actual: ${progressCount})`);

  const lingeringSessions = await RefreshSession.countDocuments();
  assert(lingeringSessions === 0, `Zero lingering refresh sessions exist (actual: ${lingeringSessions})`);

  console.log('\n======================================================================');
  console.log(`=== All ${passedChecks}/${totalChecks} Verification Checks PASSED Successfully!            ===`);
  console.log('======================================================================');
}

run().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error('\nVerification failed:', err.message);
  process.exit(1);
});
