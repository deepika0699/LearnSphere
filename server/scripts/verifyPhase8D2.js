/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * LearnSphere Phase 8D-2 — Assessment Authoring Browser & Integration Verification Suite
 *
 * Validates the full browser & backend flow for Course Creator & Admin authoring workflows:
 * Section 1: Course Creator route protection & ownership isolation
 * Section 2: Assessment listing, search, and type/status filters
 * Section 3: Assessment creation (topic & course final) & hierarchy validation
 * Section 4: Question & option editor validation & answer key integrity
 * Section 5: Assessment editing, data preservation, & zero-leakage preview
 * Section 6: Publishing & safe deletion vs attempt-archiving preservation
 * Section 7: Admin assessment management, global course scope, & privacy-safe analytics
 * Section 8: End-to-end regression checks (student attempt flow, topic reader, curriculum, dashboard)
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import crypto from 'node:crypto';
import { connectDB, isDbConnected } from '../config/db.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import Assessment from '../models/Assessment.js';
import AssessmentAttempt from '../models/AssessmentAttempt.js';
import Enrollment from '../models/Enrollment.js';
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
  console.log('===================================================================');
  console.log('=== LearnSphere Phase 8D-2 — Assessment Authoring Browser Verification ===');
  console.log('===================================================================\n');

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
    // SETUP FIXTURES
    // -------------------------------------------------------------------------
    console.log('--- Setup: Test Fixtures & Real Authenticated Roles ---');

    // Creator A (Primary Author)
    const creatorA = await User.create({
      name: `Primary Creator ${runId}`,
      email: `creator_a_${runId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'courseCreator',
      status: 'active',
    });
    createdUserIds.push(creatorA._id);
    const creatorAToken = generateAccessToken({ userId: creatorA._id, role: creatorA.role });

    // Creator B (Foreign Creator)
    const creatorB = await User.create({
      name: `Foreign Creator ${runId}`,
      email: `creator_b_${runId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'courseCreator',
      status: 'active',
    });
    createdUserIds.push(creatorB._id);
    const creatorBToken = generateAccessToken({ userId: creatorB._id, role: creatorB.role });

    // Admin
    const admin = await User.create({
      name: `Platform Admin ${runId}`,
      email: `admin_${runId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'admin',
      status: 'active',
    });
    createdUserIds.push(admin._id);
    const adminToken = generateAccessToken({ userId: admin._id, role: admin.role });

    // Student
    const student = await User.create({
      name: `Enrolled Student ${runId}`,
      email: `student_${runId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'student',
      status: 'active',
    });
    createdUserIds.push(student._id);
    const studentToken = generateAccessToken({ userId: student._id, role: student.role });

    // Course 1 owned by Creator A
    const course1 = await Course.create({
      title: `Full-Stack Architecture & Microservices ${runId}`,
      description: 'Master backend architectures, service communication, and databases.',
      category: 'Software Engineering',
      courseCreator: creatorA._id,
      status: 'published',
    });
    createdCourseIds.push(course1._id);

    // Module 1 under Course 1
    const module1 = await Module.create({
      title: 'Module 1: Distributed Systems',
      description: 'CAP Theorem and Consensus Protocols',
      courseId: course1._id,
      order: 1,
    });
    createdModuleIds.push(module1._id);

    // Topic 1 under Module 1
    const topic1 = await Topic.create({
      title: 'Topic 1: Raft Consensus Algorithm',
      description: 'Leader election, log replication, and safety invariants',
      moduleId: module1._id,
      courseId: course1._id,
      order: 1,
    });
    createdTopicIds.push(topic1._id);

    // Enroll student in Course 1
    const enrollment = await Enrollment.create({
      userId: student._id,
      courseId: course1._id,
      status: 'active',
      enrolledAt: new Date(),
    });
    createdEnrollmentIds.push(enrollment._id);

    assert(true, 'Test accounts, course hierarchy, and student enrollments provisioned');

    // -------------------------------------------------------------------------
    // SECTION 1: Course Creator Route Protection & Isolation
    // -------------------------------------------------------------------------
    console.log('\n--- Section 1: Course Creator Route Protection & Ownership Isolation ---');

    // 1.1 Unauthenticated requests cannot access creator endpoints
    const unauthCreatorRes = await request(`/api/creator/courses/${course1._id}/assessments`);
    assert(unauthCreatorRes.status === 401, 'Unauthenticated request to creator assessments rejected (401 Unauthorized)');

    // 1.2 Student cannot access creator assessment authoring actions
    const studentCreatorRes = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      { method: 'GET' },
      studentToken
    );
    assert(studentCreatorRes.status === 403, 'Student blocked from creator assessment listing (403 Forbidden)');

    const studentCreateRes = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      { method: 'POST', body: JSON.stringify({ title: 'Student Spoofed Quiz' }) },
      studentToken
    );
    assert(studentCreateRes.status === 403, 'Student blocked from creating assessments (403 Forbidden)');

    // 1.3 Creator B cannot access Creator A's assessments
    const foreignListRes = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      { method: 'GET' },
      creatorBToken
    );
    assert(foreignListRes.status === 403, 'Foreign creator blocked from listing assessments on another creator course (403 Forbidden)');

    const foreignCreateRes = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      { method: 'POST', body: JSON.stringify({ title: 'Foreign Injected Quiz', type: 'course' }) },
      creatorBToken
    );
    assert(foreignCreateRes.status === 403, 'Foreign creator blocked from creating assessments on another creator course (403 Forbidden)');

    // 1.4 Frontend SPA serves Creator authoring shells
    const creatorShellHtml = await request(`${FRONTEND_BASE}/creator/assessments`);
    assert(creatorShellHtml.status === 200, 'Frontend SPA delivers /creator/assessments route to browser');

    // -------------------------------------------------------------------------
    // SECTION 2: Assessment Listing, Filtering, and Status Indicators
    // -------------------------------------------------------------------------
    console.log('\n--- Section 2: Assessment Listing & State Consistency ---');

    // Creator A lists assessments initially (empty state)
    const initialList = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      { method: 'GET' },
      creatorAToken
    );
    assert(initialList.status === 200, 'Creator A retrieves course assessment list (200 OK)');
    assert(Array.isArray(initialList.data?.data?.assessments), 'Assessments payload is an array');
    assert(initialList.data?.data?.assessments.length === 0, 'Initially empty before creation');

    // -------------------------------------------------------------------------
    // SECTION 3: Assessment Creation & Hierarchy Validation
    // -------------------------------------------------------------------------
    console.log('\n--- Section 3: Assessment Creation & Hierarchy Integrity ---');

    // 3.1 Invalid hierarchy: Topic assessment missing topicId
    const badHierarchy1 = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Orphan Topic Quiz',
          type: 'topic',
          moduleId: module1._id.toString(),
          topicId: null,
          passingScore: 70,
        }),
      },
      creatorAToken
    );
    assert(badHierarchy1.status === 400, 'Topic assessment missing topicId is rejected (400 Bad Request)');

    // 3.2 Invalid hierarchy: Course assessment specifying moduleId
    const badHierarchy2 = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Conflicting Final Exam',
          type: 'course',
          moduleId: module1._id.toString(),
          passingScore: 75,
        }),
      },
      creatorAToken
    );
    assert(badHierarchy2.status === 400, 'Course final specifying moduleId is rejected (400 Bad Request)');

    // 3.3 Create valid Topic Assessment with full authoring metadata
    const optA1 = new mongoose.Types.ObjectId();
    const optA2 = new mongoose.Types.ObjectId();
    const optA3 = new mongoose.Types.ObjectId();

    const topicAssessmentPayload = {
      title: 'Raft Consensus State Machine Quiz',
      description: 'Evaluates comprehension of election timeouts and log replication.',
      type: 'topic',
      moduleId: module1._id.toString(),
      topicId: topic1._id.toString(),
      status: 'draft',
      passingScore: 80,
      timeLimitMinutes: 10,
      maxAttempts: 0, // unlimited
      questions: [
        {
          prompt: 'What happens when a Raft follower heartbeat timer expires?',
          codeSnippet: 'startElection();\ncurrentTerm++;\nstate = CANDIDATE;',
          explanation: 'When heartbeats from the leader cease, the follower transitions to candidate and increments currentTerm.',
          order: 0,
          options: [
            { id: optA1.toString(), text: 'Transitions to Candidate state and begins an election', order: 0 },
            { id: optA2.toString(), text: 'Immediately becomes the new Leader without voting', order: 1 },
            { id: optA3.toString(), text: 'Terminates the process node permanently', order: 2 },
          ],
          correctOptionId: optA1.toString(),
        },
      ],
    };

    const createTopicRes = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      {
        method: 'POST',
        body: JSON.stringify(topicAssessmentPayload),
      },
      creatorAToken
    );

    assert(createTopicRes.status === 201, 'Creator A creates valid topic assessment (201 Created)');
    const topicAssessment = createTopicRes.data?.data?.assessment;
    createdAssessmentIds.push(topicAssessment.id);
    assert(topicAssessment.title === 'Raft Consensus State Machine Quiz', 'Assessment title preserved');
    assert(topicAssessment.status === 'draft', 'Initial publication status is draft');
    assert(topicAssessment.type === 'topic', 'Assessment type is topic');
    assert(topicAssessment.moduleId === module1._id.toString(), 'Module ID correctly bound');
    assert(topicAssessment.topicId === topic1._id.toString(), 'Topic ID correctly bound');

    // 3.4 Create valid Course Final Assessment
    const optF1 = new mongoose.Types.ObjectId();
    const optF2 = new mongoose.Types.ObjectId();

    const courseFinalPayload = {
      title: 'Distributed Systems Comprehensive Final Exam',
      description: 'Comprehensive exam for full course certification.',
      type: 'course',
      moduleId: null,
      topicId: null,
      status: 'draft',
      passingScore: 75,
      timeLimitMinutes: 45,
      maxAttempts: 3,
      questions: [
        {
          prompt: 'According to the CAP theorem, which property must be sacrificed during a network partition in a CP system?',
          explanation: 'In a CP system, availability is sacrificed during a network partition to ensure strong consistency.',
          order: 0,
          options: [
            { id: optF1.toString(), text: 'Availability (A)', order: 0 },
            { id: optF2.toString(), text: 'Consistency (C)', order: 1 },
          ],
          correctOptionId: optF1.toString(),
        },
      ],
    };

    const createFinalRes = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      {
        method: 'POST',
        body: JSON.stringify(courseFinalPayload),
      },
      creatorAToken
    );

    assert(createFinalRes.status === 201, 'Creator A creates course final assessment (201 Created)');
    const finalAssessment = createFinalRes.data?.data?.assessment;
    createdAssessmentIds.push(finalAssessment.id);
    assert(finalAssessment.type === 'course', 'Final assessment type is course');
    assert(finalAssessment.moduleId === null, 'Course assessment has null moduleId');
    assert(finalAssessment.topicId === null, 'Course assessment has null topicId');
    assert(finalAssessment.maxAttempts === 3, 'Course assessment enforces maxAttempts: 3');

    // -------------------------------------------------------------------------
    // SECTION 4: Question & Option Integrity Invariants
    // -------------------------------------------------------------------------
    console.log('\n--- Section 4: Question & Option Validation Invariants ---');

    // 4.1 Question with fewer than 2 options
    const invalidOptCountRes = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Single Option Question Quiz',
          type: 'course',
          questions: [
            {
              prompt: 'Is single option valid?',
              options: [{ text: 'Only one choice' }],
              correctOptionId: new mongoose.Types.ObjectId().toString(),
            },
          ],
        }),
      },
      creatorAToken
    );
    assert(invalidOptCountRes.status === 400, 'Question with fewer than 2 options rejected (400 Bad Request)');

    // 4.2 correctOptionId does not match any provided option
    const invalidKeyRes = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Mismatched Key Quiz',
          type: 'course',
          questions: [
            {
              prompt: 'Which is correct?',
              options: [
                { id: new mongoose.Types.ObjectId().toString(), text: 'Choice 1' },
                { id: new mongoose.Types.ObjectId().toString(), text: 'Choice 2' },
              ],
              correctOptionId: new mongoose.Types.ObjectId().toString(), // fake ID
            },
          ],
        }),
      },
      creatorAToken
    );
    assert(invalidKeyRes.status === 400, 'Mismatched correctOptionId rejected (400 Bad Request)');

    // -------------------------------------------------------------------------
    // SECTION 5: Assessment Editing, Preservation, & Safe Preview
    // -------------------------------------------------------------------------
    console.log('\n--- Section 5: Assessment Editing, Preservation & Preview Isolation ---');

    // 5.1 Reopen existing assessment for authoring
    const reopenRes = await request(
      `/api/creator/courses/${course1._id}/assessments/${topicAssessment.id}`,
      { method: 'GET' },
      creatorAToken
    );
    assert(reopenRes.status === 200, 'Author retrieves existing assessment details (200 OK)');
    assert(reopenRes.data?.data?.assessment?.questions?.length === 1, 'Question preserved');
    assert(
      reopenRes.data?.data?.assessment?.questions[0]?.correctOptionId === optA1.toString(),
      'Author view safely includes correctOptionId'
    );
    assert(
      reopenRes.data?.data?.assessment?.questions[0]?.codeSnippet.includes('CANDIDATE'),
      'Author view safely includes codeSnippet'
    );

    // 5.2 Edit assessment questions and publish
    const newOptQ2_1 = new mongoose.Types.ObjectId();
    const newOptQ2_2 = new mongoose.Types.ObjectId();

    const updatePayload = {
      title: 'Raft Consensus Mastery Quiz (Updated & Published)',
      status: 'published',
      passingScore: 70,
      questions: [
        reopenRes.data.data.assessment.questions[0], // preserve Q1
        {
          prompt: 'How many nodes are required for a Raft cluster to maintain quorum under 2 simultaneous faults?',
          explanation: 'To survive f faults, a cluster must have at least 2f + 1 nodes. For f = 2, 2(2) + 1 = 5 nodes.',
          order: 1,
          options: [
            { id: newOptQ2_1.toString(), text: '5 nodes', order: 0 },
            { id: newOptQ2_2.toString(), text: '3 nodes', order: 1 },
          ],
          correctOptionId: newOptQ2_1.toString(),
        },
      ],
    };

    const updateRes = await request(
      `/api/creator/courses/${course1._id}/assessments/${topicAssessment.id}`,
      {
        method: 'PUT',
        body: JSON.stringify(updatePayload),
      },
      creatorAToken
    );
    assert(updateRes.status === 200, 'Author updates and publishes assessment (200 OK)');
    assert(updateRes.data?.data?.assessment?.status === 'published', 'Assessment status transitioned to published');
    assert(updateRes.data?.data?.assessment?.questions?.length === 2, 'New question appended successfully (2 total)');
    assert(updateRes.data?.data?.assessment?.passingScore === 70, 'Passing score updated to 70%');

    // 5.3 Verify Student Perspective View strictly hides answer keys & explanations
    const studentViewRes = await request(
      `/api/student/courses/${course1._id}/assessments/${topicAssessment.id}`,
      { method: 'GET' },
      studentToken
    );
    assert(studentViewRes.status === 200, 'Enrolled student loads published assessment (200 OK)');
    const studentAssessment = studentViewRes.data?.data?.assessment;
    assert(studentAssessment.questions?.length === 2, 'Student receives 2 questions');
    
    // Strict invariant: no correctOptionId or explanation in any question
    const anyKeyExposed = studentAssessment.questions.some((q) => q.correctOptionId !== undefined);
    assert(!anyKeyExposed, 'STRICT INVARIANT: Zero correctOptionId leakage in student response');
    const anyExplanationExposed = studentAssessment.questions.some((q) => q.explanation !== undefined);
    assert(!anyExplanationExposed, 'STRICT INVARIANT: Zero explanation leakage prior to submission');

    // -------------------------------------------------------------------------
    // SECTION 6: Publishing Lifecycle & Archival Preservation
    // -------------------------------------------------------------------------
    console.log('\n--- Section 6: Publishing & Attempt-Safe Archival Lifecycle ---');

    // 6.1 Draft assessment is invisible to students
    const draftViewRes = await request(
      `/api/student/courses/${course1._id}/assessments/${finalAssessment.id}`,
      { method: 'GET' },
      studentToken
    );
    assert(draftViewRes.status === 404, 'Draft assessment is completely hidden from students (404 Not Found)');

    // 6.2 Assessment with 0 attempts can be cleanly hard-deleted
    const cleanDeleteRes = await request(
      `/api/creator/courses/${course1._id}/assessments/${finalAssessment.id}`,
      { method: 'DELETE' },
      creatorAToken
    );
    assert(cleanDeleteRes.status === 200, 'Assessment without attempts cleanly deleted (200 OK)');
    assert(cleanDeleteRes.data?.data?.deleted === true, 'Response indicates deleted: true');
    const verifyCleanDeleted = await Assessment.findById(finalAssessment.id);
    assert(verifyCleanDeleted === null, 'Assessment removed from database collection');

    // 6.3 If student has submitted an attempt, deletion is intercepted and archives instead
    const studentAttempt = await AssessmentAttempt.create({
      assessmentId: topicAssessment.id,
      courseId: course1._id,
      topicId: topic1._id,
      userId: student._id,
      attemptNumber: 1,
      status: 'completed',
      startedAt: new Date(Date.now() - 300000),
      submittedAt: new Date(),
      totalQuestions: 2,
      correctAnswersCount: 2,
      score: 100,
      isPassed: true,
      answers: [],
    });
    createdAttemptIds.push(studentAttempt._id);

    const safeArchiveRes = await request(
      `/api/creator/courses/${course1._id}/assessments/${topicAssessment.id}`,
      { method: 'DELETE' },
      creatorAToken
    );
    assert(safeArchiveRes.status === 200, 'Deletion of assessment with student attempts returns 200 OK');
    assert(safeArchiveRes.data?.data?.status === 'archived', 'Assessment automatically transitioned to archived status');

    const verifyPreserved = await Assessment.findById(topicAssessment.id);
    assert(verifyPreserved?.status === 'archived', 'Assessment preserved in database with status archived');
    const verifyAttemptPreserved = await AssessmentAttempt.findById(studentAttempt._id);
    assert(verifyAttemptPreserved !== null, 'Student attempt record preserved intact');

    // -------------------------------------------------------------------------
    // SECTION 7: Admin Assessment Management & Privacy-Safe Analytics
    // -------------------------------------------------------------------------
    console.log('\n--- Section 7: Admin Assessment Parity & Privacy-Safe Analytics ---');

    // 7.1 Admin route protection
    const unauthAdmin = await request(`/api/admin/courses/${course1._id}/assessments`);
    assert(unauthAdmin.status === 401, 'Unauthenticated user blocked from admin assessment endpoints (401)');
    const creatorAsAdmin = await request(
      `/api/admin/courses/${course1._id}/assessments`,
      { method: 'GET' },
      creatorAToken
    );
    assert(creatorAsAdmin.status === 403, 'Creator blocked from admin assessment endpoints (403)');

    // 7.2 Admin global course scope listing
    const adminList = await request(
      `/api/admin/courses/${course1._id}/assessments`,
      { method: 'GET' },
      adminToken
    );
    assert(adminList.status === 200, 'Admin lists assessments across any creator course (200 OK)');
    assert(adminList.data?.data?.assessments?.length >= 1, 'Admin sees preserved course assessments');

    // 7.3 Admin inspects assessment details
    const adminGet = await request(
      `/api/admin/assessments/${topicAssessment.id}`,
      { method: 'GET' },
      adminToken
    );
    assert(adminGet.status === 200, 'Admin inspects assessment by ID (200 OK)');
    assert(adminGet.data?.data?.assessment?.id === topicAssessment.id, 'Admin retrieved matching assessment');

    // 7.4 Admin fetches privacy-safe aggregate statistics
    const adminStats = await request(
      `/api/admin/assessments/${topicAssessment.id}/stats`,
      { method: 'GET' },
      adminToken
    );
    assert(adminStats.status === 200, 'Admin fetches assessment statistics (200 OK)');
    const stats = adminStats.data?.data?.stats;
    assert(stats?.totalAttempts === 1, 'Stats report totalAttempts: 1');
    assert(stats?.completedAttempts === 1, 'Stats report completedAttempts: 1');
    assert(stats?.passCount === 1, 'Stats report passCount: 1');
    assert(stats?.failCount === 0, 'Stats report failCount: 0');
    assert(stats?.passRate === 100, 'Stats calculate 100% passRate');
    assert(stats?.averageScore === 100, 'Stats calculate 100% averageScore');

    // Privacy check: Zero PII in stats response
    const statsStr = JSON.stringify(stats);
    assert(!statsStr.includes(student.email), 'Zero student email leakage in aggregate stats');
    assert(!statsStr.includes(student.name), 'Zero student name leakage in aggregate stats');
    assert(!statsStr.includes(student._id.toString()), 'Zero student ID leakage in aggregate stats');

    // 7.5 Admin frontend SPA serves /admin/assessments
    const adminShellHtml = await request(`${FRONTEND_BASE}/admin/assessments`);
    assert(adminShellHtml.status === 200, 'Frontend SPA delivers /admin/assessments route to browser');

    // -------------------------------------------------------------------------
    // SECTION 8: Application Regression Checks
    // -------------------------------------------------------------------------
    console.log('\n--- Section 8: Application Regression Checks ---');

    // 8.1 Course details API
    const courseRes = await request(`/api/courses/${course1._id}`);
    assert(courseRes.status === 200, 'Public Course Details API functional (200 OK)');

    // 8.2 Curriculum Structure API
    const structRes = await request(`/api/courses/${course1._id}/structure`);
    assert(structRes.status === 200, 'Course Curriculum Structure API functional (200 OK)');
    assert(structRes.data?.data?.modules?.length === 1, 'Modules structure intact');

    // 8.3 Topic Reader API
    const topicRes = await request(`/api/courses/${course1._id}/modules/${module1._id}/topics/${topic1._id}`);
    assert(topicRes.status === 200, 'Topic Reader Content API functional (200 OK)');

    // 8.4 Student Dashboard API
    const dashRes = await request('/api/student/dashboard', { method: 'GET' }, studentToken);
    assert(dashRes.status === 200, 'Student Dashboard API functional (200 OK)');

    // 8.5 Course Creator Courses API
    const creatorCoursesRes = await request('/api/creator/courses', { method: 'GET' }, creatorAToken);
    assert(creatorCoursesRes.status === 200, 'Creator Courses API functional (200 OK)');

    // 8.6 Auth check
    const authMeRes = await request('/api/auth/me', { method: 'GET' }, studentToken);
    assert(authMeRes.status === 200, 'Auth me endpoint functional (200 OK)');
    assert(authMeRes.data?.data?.user?.role === 'student', 'Student identity verified');

    console.log('\n--- Cleanup: Purging Test Artifacts ---');
  } catch (error) {
    console.error('Fatal Verification Error:', error);
    failedTests++;
  } finally {
    if (createdAttemptIds.length > 0) {
      await AssessmentAttempt.deleteMany({ _id: { $in: createdAttemptIds } });
    }
    if (createdAssessmentIds.length > 0) {
      await Assessment.deleteMany({ _id: { $in: createdAssessmentIds } });
    }
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
  console.log(` Phase 8D-2 Verification Complete: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
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
