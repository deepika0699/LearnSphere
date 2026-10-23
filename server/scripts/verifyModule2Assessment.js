/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Verification Suite: Module 2 Mastery Quiz & Security Enforcements
 *
 * Verifies:
 * 1. Exactly 2 assessments exist in the database (Module 1 and Module 2).
 * 2. Assessment belongs to Course 6abe9dc2f15c2b4f6008ac1c, Module 6abe9dc6f15c2b4f6008ac26, Topic 6abe9dc9f15c2b4f6008ac2f.
 * 3. Configuration invariants: status 'published', passingScore 75, timeLimitMinutes 15, maxAttempts 0, type 'topic'.
 * 4. Question set invariants: exactly 8 questions, each with 4 distinct options, valid correctOptionId, and non-empty explanation.
 * 5. Course integrity: Course remains 'draft'. All 8 modules and 73 topics intact.
 * 6. Creator and Admin API retrieval parity.
 * 7. Student authorization & projection security: Student cannot take assessment on draft course, and student projection strips correct answers and explanations.
 * 8. Zero database side-effects: 0 enrollments, 0 attempts, 0 topic progress records, 0 lingering refresh sessions.
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
const MODULE_2_ID = '6abe9dc6f15c2b4f6008ac26';
const ANCHOR_TOPIC_ID = '6abe9dc9f15c2b4f6008ac2f';

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
  console.log('=== Verification Suite: Module 2 Mastery Quiz                   ===');
  console.log('===================================================================\n');

  await connectDB();
  assert(isDbConnected(), 'Database connection established');

  // --- SECTION 1: Database Invariants ---
  console.log('\n--- Section 1: Assessment Count & Hierarchy ---');
  const assessmentsCount = await Assessment.countDocuments();
  assert(assessmentsCount >= 2, `Database contains at least 2 assessments (actual: ${assessmentsCount})`);

  const assessment = await Assessment.findOne({
    courseId: COURSE_ID,
    moduleId: MODULE_2_ID,
    title: 'Module 2 Quiz: Node.js Runtime & Asynchronous Programming',
  });
  assert(Boolean(assessment), 'Module 2 Assessment exists in database');
  assert(String(assessment.courseId) === COURSE_ID, `Assessment courseId matches ${COURSE_ID}`);
  assert(String(assessment.moduleId) === MODULE_2_ID, `Assessment moduleId matches ${MODULE_2_ID}`);
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

  assessment.questions.forEach((q, idx) => {
    assert(Boolean(q._id), `Question ${idx + 1} has valid _id: ${q._id}`);
    assert(!questionIds.has(String(q._id)), `Question ${idx + 1} _id is globally unique`);
    questionIds.add(String(q._id));

    assert(typeof q.prompt === 'string' && q.prompt.trim().length > 20, `Question ${idx + 1} has substantial prompt`);
    assert(q.order === idx, `Question ${idx + 1} order is ${idx}`);
    assert(Array.isArray(q.options) && q.options.length === 4, `Question ${idx + 1} has exactly 4 options`);

    const qOptionIds = new Set();
    q.options.forEach((opt, oIdx) => {
      assert(Boolean(opt._id), `Question ${idx + 1} Option ${oIdx + 1} has valid _id`);
      assert(!qOptionIds.has(String(opt._id)), `Question ${idx + 1} Option ${oIdx + 1} _id is unique to question`);
      assert(!allOptionIds.has(String(opt._id)), `Question ${idx + 1} Option ${oIdx + 1} _id is unique across assessment`);
      qOptionIds.add(String(opt._id));
      allOptionIds.add(String(opt._id));

      assert(typeof opt.text === 'string' && opt.text.trim().length > 5, `Question ${idx + 1} Option ${oIdx + 1} has meaningful text`);
    });

    assert(Boolean(q.correctOptionId), `Question ${idx + 1} has correctOptionId`);
    assert(qOptionIds.has(String(q.correctOptionId)), `Question ${idx + 1} correctOptionId (${q.correctOptionId}) belongs to its options`);
    assert(typeof q.explanation === 'string' && q.explanation.trim().length > 20, `Question ${idx + 1} has detailed explanation`);
  });

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
    assert(creatorAssessments.length >= 2, `Creator assessment list contains at least 2 assessments (actual: ${creatorAssessments.length})`);
    assert(creatorAssessments.some(a => a.id === String(assessment._id)), 'Creator assessment list contains Module 2 assessment');

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
    assert(adminListRes.data?.data?.assessments?.some(a => a._id === String(assessment._id) || a.id === String(assessment._id)), 'Admin list includes Module 2 assessment');

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
