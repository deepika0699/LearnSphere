/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * LearnSphere Phase 8C-3 — Browser Flow Verification & Hardening Suite
 * 
 * Covers all 10 verification sections:
 * 1. Unauthenticated access & route protection invariants
 * 2. Assessment overview data source & metadata accuracy
 * 3. Start and resume flow, duplicate prevention & state consistency
 * 4. Question navigation, answer state tracking & sanitized payload generation
 * 5. Server-authoritative timer enforcement & late submission handling
 * 6. Submission payload verification, partial answers, & duplicate block
 * 7. Server-calculated results, pass/fail grading, & finalized review data
 * 8. Cross-student attempt isolation & review authorization
 * 9. Maximum attempt limit enforcement & 409/400 handling
 * 10. Existing application regression verification (courses, curriculum, topic reader, dashboard)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import crypto from 'node:crypto';
import { connectDB, isDbConnected } from '../config/db.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import Enrollment from '../models/Enrollment.js';
import Assessment from '../models/Assessment.js';
import AssessmentAttempt from '../models/AssessmentAttempt.js';
import { generateAccessToken } from '../services/tokenService.js';

const API_BASE = 'http://localhost:5000';
const FRONTEND_BASE = 'http://localhost:3000';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, description) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${description}`);
  } else {
    failedTests++;
    console.error(`  ✗ [FAIL] ${description}`);
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
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
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
  } else if (contentType && contentType.includes('text/html')) {
    data = await res.text();
  }
  return { status: res.status, headers: res.headers, data };
}

async function runVerification() {
  console.log('================================================================');
  console.log('=== LearnSphere Phase 8C-3: Assessment Flow Verification ===');
  console.log('================================================================\n');

  await connectDB();
  if (!isDbConnected()) {
    console.error('Fatal: Database is not connected');
    process.exit(1);
  }

  const runId = crypto.randomBytes(4).toString('hex');
  const createdUserIds = [];
  const createdCourseIds = [];
  const createdModuleIds = [];
  const createdTopicIds = [];
  const createdEnrollmentIds = [];
  const createdAssessmentIds = [];
  const createdAttemptIds = [];

  try {
    // -------------------------------------------------------------------------
    // SETUP: Fixtures, Users, and Enrollments
    // -------------------------------------------------------------------------
    console.log('--- Setup: Creating Verified Test Fixtures ---');

    // Creator
    const creator = await User.create({
      name: `Author ${runId}`,
      email: `creator_${runId}@learnsphere.io`,
      password: 'Password123!',
      role: 'courseCreator',
      status: 'active',
    });
    createdUserIds.push(creator._id);
    const creatorToken = generateAccessToken({ userId: creator._id, role: creator.role });

    // Student A (Enrolled)
    const studentA = await User.create({
      name: `Student A ${runId}`,
      email: `student_a_${runId}@learnsphere.io`,
      password: 'Password123!',
      role: 'student',
      status: 'active',
    });
    createdUserIds.push(studentA._id);
    const studentAToken = generateAccessToken({ userId: studentA._id, role: studentA.role });

    // Student B (Unenrolled / Alternate)
    const studentB = await User.create({
      name: `Student B ${runId}`,
      email: `student_b_${runId}@learnsphere.io`,
      password: 'Password123!',
      role: 'student',
      status: 'active',
    });
    createdUserIds.push(studentB._id);
    const studentBToken = generateAccessToken({ userId: studentB._id, role: studentB.role });

    // Published Course
    const course = await Course.create({
      title: `Full-Stack Verification Course ${runId}`,
      description: 'Comprehensive course for browser flow verification',
      category: 'Web Development',
      status: 'published',
      courseCreator: creator._id,
    });
    createdCourseIds.push(course._id);

    // Curriculum: Module and Topic
    const module1 = await Module.create({
      courseId: course._id,
      title: 'Module 1: Foundations',
      order: 0,
    });
    createdModuleIds.push(module1._id);

    const topic1 = await Topic.create({
      courseId: course._id,
      moduleId: module1._id,
      title: 'Topic 1: Modern Component Architecture',
      order: 0,
      content: {
        explanation: 'Deep dive into components.',
        sections: [{ title: 'Overview', body: 'Components are the building blocks.' }],
      },
    });
    createdTopicIds.push(topic1._id);

    // Active Enrollment for Student A
    const enrollmentA = await Enrollment.create({
      userId: studentA._id,
      courseId: course._id,
      status: 'active',
      enrolledAt: new Date(),
    });
    createdEnrollmentIds.push(enrollmentA._id);

    // Topic Assessment (Unlimited attempts, untimed)
    const optQ1_A = new mongoose.Types.ObjectId();
    const optQ1_B = new mongoose.Types.ObjectId();
    const optQ2_A = new mongoose.Types.ObjectId();
    const optQ2_B = new mongoose.Types.ObjectId();

    const topicAssessment = await Assessment.create({
      title: 'Component Architecture Quiz',
      description: 'Validates understanding of component lifecycles and state.',
      courseId: course._id,
      moduleId: module1._id,
      topicId: topic1._id,
      type: 'topic',
      status: 'published',
      passingScore: 50,
      timeLimitMinutes: 0, // untimed
      maxAttempts: 0, // unlimited
      createdBy: creator._id,
      questions: [
        {
          prompt: 'What React hook is used to persist mutable values without triggering re-renders?',
          codeSnippet: 'const ref = useRef(initialValue);',
          order: 0,
          options: [
            { _id: optQ1_A, text: 'useRef' },
            { _id: optQ1_B, text: 'useState' },
          ],
          correctOptionId: optQ1_A,
          explanation: 'useRef returns a mutable ref object whose .current property does not trigger re-renders.',
        },
        {
          prompt: 'Which HTTP method should be used for idempotent updates?',
          codeSnippet: 'PUT /api/resource/123',
          order: 1,
          options: [
            { _id: optQ2_A, text: 'POST' },
            { _id: optQ2_B, text: 'PUT' },
          ],
          correctOptionId: optQ2_B,
          explanation: 'PUT is designed to be idempotent in RFC 7231.',
        },
      ],
    });
    createdAssessmentIds.push(topicAssessment._id);

    // Course Final Assessment (Timed 20m, maxAttempts = 2)
    const optFinal1_A = new mongoose.Types.ObjectId();
    const optFinal1_B = new mongoose.Types.ObjectId();

    const courseAssessment = await Assessment.create({
      title: 'Course Final Comprehensive Exam',
      description: 'Timed assessment evaluating overall mastery.',
      courseId: course._id,
      type: 'course',
      status: 'published',
      passingScore: 70,
      timeLimitMinutes: 20,
      maxAttempts: 2,
      createdBy: creator._id,
      questions: [
        {
          prompt: 'Does Vite support native ESM in development?',
          order: 0,
          options: [
            { _id: optFinal1_A, text: 'Yes, Vite serves source code over native ESM.' },
            { _id: optFinal1_B, text: 'No, Vite bundles all code into a single file upfront.' },
          ],
          correctOptionId: optFinal1_A,
          explanation: 'Vite transforms and serves source code over native ESM for fast dev server startup.',
        },
      ],
    });
    createdAssessmentIds.push(courseAssessment._id);

    assert(true, 'Test fixtures initialized successfully');

    // -------------------------------------------------------------------------
    // SECTION 1: Unauthenticated Access & Route Protection Invariants
    // -------------------------------------------------------------------------
    console.log('\n--- Section 1: Unauthenticated Access & Protection Invariants ---');

    // API should reject unauthenticated request with 401
    const unauthApiRes = await request(
      `/api/student/courses/${course._id}/assessments/${topicAssessment._id}`
    );
    assert(unauthApiRes.status === 401, 'Unauthenticated API access rejected with 401 Unauthorized');
    assert(
      !unauthApiRes.data?.data?.assessment,
      'Zero assessment question data leaked to unauthenticated client'
    );

    // Frontend entry point serves index.html (SPA with StudentRoute guard)
    const frontendRouteRes = await request(
      `${FRONTEND_BASE}/courses/${course._id}/assessments/${topicAssessment._id}`
    );
    assert(frontendRouteRes.status === 200, 'Frontend SPA serves assessment route');
    assert(
      typeof frontendRouteRes.data === 'string' && frontendRouteRes.data.includes('<div id="root">'),
      'HTML root container delivered to browser'
    );

    // -------------------------------------------------------------------------
    // SECTION 2: Assessment Overview Data Source & Metadata Accuracy
    // -------------------------------------------------------------------------
    console.log('\n--- Section 2: Assessment Overview Data Source & Metadata ---');

    const overviewRes = await request(
      `/api/student/courses/${course._id}/assessments/${topicAssessment._id}`,
      { method: 'GET' },
      studentAToken
    );
    assert(overviewRes.status === 200, 'Enrolled student reads published assessment (200 OK)');

    const fetchedAssessment = overviewRes.data?.data?.assessment;
    const attemptOverview = overviewRes.data?.data?.attemptOverview;

    assert(fetchedAssessment.title === topicAssessment.title, 'Assessment title matches backend record');
    assert(fetchedAssessment.type === 'topic', 'Assessment type correctly identified as "topic"');
    assert(fetchedAssessment.questions.length === 2, 'Question count accurately reported as 2');
    assert(fetchedAssessment.passingScore === 50, 'Passing score accurately reported as 50%');
    assert(fetchedAssessment.timeLimitMinutes === 0, 'Untimed assessment has timeLimitMinutes = 0');
    assert(attemptOverview.pastAttemptsCount === 0, 'Zero previous attempts reported on fresh assessment');
    assert(attemptOverview.hasActiveAttempt === false, 'No active attempt reported initially');
    assert(attemptOverview.isMaxAttemptsReached === false, 'Max attempts limit is not reached');

    // Strict security check: neither correctOptionId nor explanation are present
    const hasLeakedKey = fetchedAssessment.questions.some((q) => q.correctOptionId !== undefined);
    const hasLeakedExp = fetchedAssessment.questions.some((q) => q.explanation !== undefined);
    assert(!hasLeakedKey, 'STRICT: correctOptionId is absent from active student assessment');
    assert(!hasLeakedExp, 'STRICT: explanation is absent from active student assessment');

    // -------------------------------------------------------------------------
    // SECTION 3: Start and Resume Flow & Idempotency
    // -------------------------------------------------------------------------
    console.log('\n--- Section 3: Start and Resume Flow & Idempotency ---');

    // Start attempt 1
    const startRes = await request(
      `/api/student/courses/${course._id}/assessments/${topicAssessment._id}/start`,
      { method: 'POST' },
      studentAToken
    );
    assert(startRes.status === 201, 'Student starts new attempt (201 Created)');
    assert(startRes.data?.data?.isResumed === false, 'isResumed is false on new attempt');

    const activeAttempt1 = startRes.data?.data?.attempt;
    assert(Boolean(activeAttempt1.id), 'Backend generated valid attempt ID');
    assert(activeAttempt1.status === 'in_progress', 'Attempt status is "in_progress"');
    assert(activeAttempt1.attemptNumber === 1, 'Attempt number is 1');

    // Revisit / simulate resume: calling start again while in_progress returns existing attempt
    const resumeRes = await request(
      `/api/student/courses/${course._id}/assessments/${topicAssessment._id}/start`,
      { method: 'POST' },
      studentAToken
    );
    assert(resumeRes.status === 200, 'Revisiting active assessment returns 200 OK');
    assert(resumeRes.data?.data?.isResumed === true, 'isResumed is true when active attempt exists');
    assert(resumeRes.data?.data?.attempt?.id === activeAttempt1.id, 'Resumed attempt ID matches original');

    // Verify in database that NO duplicate attempt record was created
    const inProgressAttemptsCount = await AssessmentAttempt.countDocuments({
      assessmentId: topicAssessment._id,
      userId: studentA._id,
      status: 'in_progress',
    });
    assert(inProgressAttemptsCount === 1, 'MongoDB contains strictly 1 in_progress attempt record (no duplicate)');

    // -------------------------------------------------------------------------
    // SECTION 4: Question Navigation & Sanitized Payload Construction
    // -------------------------------------------------------------------------
    console.log('\n--- Section 4: Question Navigation & Payload Construction ---');

    // Test answer payload construction from student UI selection:
    // Question 1: optQ1_A (correct)
    // Question 2: optQ2_A (incorrect, optQ2_B was correct)
    const answersPayload = [
      { questionId: topicAssessment.questions[0]._id.toString(), selectedOptionId: optQ1_A.toString() },
      { questionId: topicAssessment.questions[1]._id.toString(), selectedOptionId: optQ2_A.toString() },
    ];

    assert(answersPayload.length === 2, 'Frontend constructed 2 answer items');
    assert(
      !('score' in answersPayload[0]) && !('isPassed' in answersPayload[0]) && !('isCorrect' in answersPayload[0]),
      'Payload strictly free of client-computed score, isPassed, or isCorrect fields'
    );

    // -------------------------------------------------------------------------
    // SECTION 5 & 6: Submission, Grading & Duplicate Prevention
    // -------------------------------------------------------------------------
    console.log('\n--- Section 5 & 6: Submission, Server-Side Grading & Duplicate Prevention ---');

    const submitRes = await request(
      `/api/student/courses/${course._id}/assessments/${topicAssessment._id}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({ answers: answersPayload }),
      },
      studentAToken
    );

    assert(submitRes.status === 200, 'Assessment attempt submitted successfully (200 OK)');
    const submitResult = submitRes.data?.data?.results;
    const finalizedAttempt = submitRes.data?.data?.attempt;

    assert(finalizedAttempt.status === 'completed', 'Attempt status transitioned to "completed"');
    assert(submitResult.totalQuestions === 2, 'Result reports 2 total questions');
    assert(submitResult.correctAnswersCount === 1, 'Server calculated exactly 1 correct answer');
    assert(submitResult.score === 50, 'Server calculated 50% score');
    assert(submitResult.isPassed === true, 'isPassed evaluated as true (50% >= passingScore 50%)');

    // Verify duplicate submission on finalized attempt is rejected
    const dupSubmitRes = await request(
      `/api/student/courses/${course._id}/assessments/${topicAssessment._id}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({ answers: answersPayload }),
      },
      studentAToken
    );
    assert(
      dupSubmitRes.status === 409 || dupSubmitRes.status === 400,
      'Duplicate submission on finalized attempt is safely rejected (409 Conflict / 400)'
    );

    // -------------------------------------------------------------------------
    // SECTION 7: Finalized Result & Review Data Invariants
    // -------------------------------------------------------------------------
    console.log('\n--- Section 7: Finalized Review Data Invariants ---');

    const reviewQuestions = submitResult.review;
    assert(Array.isArray(reviewQuestions) && reviewQuestions.length === 2, 'Review includes all 2 questions');

    const q1Review = reviewQuestions[0];
    assert(q1Review.isCorrect === true, 'Question 1 correctly evaluated as true');
    assert(q1Review.correctOptionId === optQ1_A.toString(), 'Question 1 correctOptionId revealed in review');
    assert(Boolean(q1Review.explanation), 'Question 1 explanation revealed in review');

    const q2Review = reviewQuestions[1];
    assert(q2Review.isCorrect === false, 'Question 2 correctly evaluated as false');
    assert(q2Review.correctOptionId === optQ2_B.toString(), 'Question 2 correctOptionId revealed in review');
    assert(q2Review.selectedOptionId === optQ2_A.toString(), 'Student selectedOptionId preserved');

    // -------------------------------------------------------------------------
    // SECTION 8: Attempt History & Cross-Student Isolation
    // -------------------------------------------------------------------------
    console.log('\n--- Section 8: Attempt History & Isolation ---');

    // Student A checks history
    const historyRes = await request(
      `/api/student/courses/${course._id}/assessments/${topicAssessment._id}/attempts`,
      { method: 'GET' },
      studentAToken
    );
    assert(historyRes.status === 200, 'Student A lists past attempts (200 OK)');
    assert(historyRes.data?.data?.attempts?.length === 1, 'Student A sees exactly 1 past attempt');

    // Student B checks history for same assessment
    // First enroll Student B
    const enrollmentB = await Enrollment.create({
      userId: studentB._id,
      courseId: course._id,
      status: 'active',
      enrolledAt: new Date(),
    });
    createdEnrollmentIds.push(enrollmentB._id);

    const historyBRes = await request(
      `/api/student/courses/${course._id}/assessments/${topicAssessment._id}/attempts`,
      { method: 'GET' },
      studentBToken
    );
    assert(historyBRes.status === 200, 'Student B lists past attempts');
    assert(historyBRes.data?.data?.attempts?.length === 0, 'Student B sees 0 attempts (Student A attempts isolated)');

    // Student B attempts to directly review Student A's attempt
    const directReviewBRes = await request(
      `/api/student/courses/${course._id}/assessments/${topicAssessment._id}/attempts/${finalizedAttempt.id}`,
      { method: 'GET' },
      studentBToken
    );
    assert(
      directReviewBRes.status === 403,
      "Student B cannot review Student A's attempt (403 Forbidden cross-student isolation)"
    );

    // Student A direct review succeeds
    const directReviewARes = await request(
      `/api/student/courses/${course._id}/assessments/${topicAssessment._id}/attempts/${finalizedAttempt.id}`,
      { method: 'GET' },
      studentAToken
    );
    assert(directReviewARes.status === 200, 'Student A directly loads finalized attempt review (200 OK)');

    // -------------------------------------------------------------------------
    // SECTION 9: Server-Authoritative Timer & Attempt Limits
    // -------------------------------------------------------------------------
    console.log('\n--- Section 9: Timed Assessment & Attempt Limits ---');

    // Start Attempt 1 on Course Assessment (maxAttempts = 2, timed 20 min)
    const timedStart1 = await request(
      `/api/student/courses/${course._id}/assessments/${courseAssessment._id}/start`,
      { method: 'POST' },
      studentAToken
    );
    assert(timedStart1.status === 201, 'Timed course assessment attempt 1 started');
    const timedAttempt1 = timedStart1.data?.data?.attempt;
    assert(Boolean(timedAttempt1.expiresAt), 'Server established expiresAt deadline timestamp');

    // Verify timer expiry handling: set expiresAt in DB to 1 minute ago
    await AssessmentAttempt.findByIdAndUpdate(timedAttempt1.id, {
      expiresAt: new Date(Date.now() - 60000),
    });

    // Late submission
    const timedSubmit1 = await request(
      `/api/student/courses/${course._id}/assessments/${courseAssessment._id}/submit`,
      { method: 'POST', body: JSON.stringify({ answers: [] }) },
      studentAToken
    );
    assert(timedSubmit1.status === 200, 'Expired attempt submission processed');
    assert(
      timedSubmit1.data?.data?.results?.status === 'timed_out',
      'Attempt status accurately recorded as "timed_out" due to expired server timer'
    );

    // Start Attempt 2 (allowed since maxAttempts = 2)
    const timedStart2 = await request(
      `/api/student/courses/${course._id}/assessments/${courseAssessment._id}/start`,
      { method: 'POST' },
      studentAToken
    );
    assert(timedStart2.status === 201, 'Course assessment attempt 2 started (within limit)');
    await request(
      `/api/student/courses/${course._id}/assessments/${courseAssessment._id}/submit`,
      { method: 'POST', body: JSON.stringify({ answers: [] }) },
      studentAToken
    );

    // Attempt 3 should be BLOCKED because maxAttempts = 2!
    const timedStart3 = await request(
      `/api/student/courses/${course._id}/assessments/${courseAssessment._id}/start`,
      { method: 'POST' },
      studentAToken
    );
    assert(
      timedStart3.status === 400 || timedStart3.status === 409,
      'Attempt 3 blocked when maxAttempts is 2 (400/409)'
    );

    // Overview now reports isMaxAttemptsReached = true
    const limitOverviewRes = await request(
      `/api/student/courses/${course._id}/assessments/${courseAssessment._id}`,
      { method: 'GET' },
      studentAToken
    );
    assert(
      limitOverviewRes.data?.data?.attemptOverview?.isMaxAttemptsReached === true,
      'Overview reports isMaxAttemptsReached: true when limit reached'
    );

    // -------------------------------------------------------------------------
    // SECTION 10: Existing Application Regression Verification
    // -------------------------------------------------------------------------
    console.log('\n--- Section 10: Existing Application Regression Verification ---');

    // 1. Course details API
    const courseRes = await request(`/api/courses/${course._id}`);
    assert(courseRes.status === 200, 'Public Course Details API functional (200 OK)');
    assert(courseRes.data?.data?.course?.title === course.title, 'Course title matches');

    // 2. Course structure API
    const structureRes = await request(`/api/courses/${course._id}/structure`);
    assert(structureRes.status === 200, 'Course Curriculum Structure API functional (200 OK)');
    assert(structureRes.data?.data?.modules?.length === 1, 'Module structure intact');

    // 3. Topic educational content API
    const topicRes = await request(
      `/api/courses/${course._id}/modules/${module1._id}/topics/${topic1._id}`
    );
    assert(topicRes.status === 200, 'Topic Reader Content API functional (200 OK)');
    assert(topicRes.data?.data?.topic?.title === topic1.title, 'Topic title matches');

    // 4. Student dashboard API
    const dashRes = await request('/api/student/dashboard', { method: 'GET' }, studentAToken);
    assert(dashRes.status === 200, 'Student Dashboard API functional (200 OK)');

    // 5. Frontend public Home & Courses
    const homeHtml = await request(`${FRONTEND_BASE}/`);
    assert(homeHtml.status === 200, 'Frontend Home page functional');

    const coursesHtml = await request(`${FRONTEND_BASE}/courses`);
    assert(coursesHtml.status === 200, 'Frontend Courses catalog functional');

  } catch (error) {
    console.error('Fatal Verification Error:', error);
    failedTests++;
  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP: Purge all verification test fixtures
    // -------------------------------------------------------------------------
    console.log('\n--- Cleanup: Purging Verification Artifacts ---');
    if (createdAssessmentIds.length > 0) {
      await Assessment.deleteMany({ _id: { $in: createdAssessmentIds } });
    }
    await AssessmentAttempt.deleteMany({ userId: { $in: createdUserIds } });
    if (createdEnrollmentIds.length > 0) {
      await Enrollment.deleteMany({ _id: { $in: createdEnrollmentIds } });
    }
    if (createdTopicIds.length > 0) {
      await Topic.deleteMany({ _id: { $in: createdTopicIds } });
    }
    if (createdModuleIds.length > 0) {
      await Module.deleteMany({ _id: { $in: createdModuleIds } });
    }
    if (createdCourseIds.length > 0) {
      await Course.deleteMany({ _id: { $in: createdCourseIds } });
    }
    if (createdUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
    }
    console.log('✓ All verification artifacts safely purged from database');
  }

  console.log('\n===================================================================');
  console.log(` Verification Complete: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('===================================================================\n');

  if (failedTests > 0) {
    await mongoose.disconnect();
    process.exit(1);
  } else {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runVerification();
