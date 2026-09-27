/**
 * LearnSphere Phase 8D-1 — Assessment Authoring Frontend & API Integration Verification
 *
 * Verifies:
 * 1. Creator and Admin route protection & ownership isolation.
 * 2. Topic and Course assessment authoring with full question & option management.
 * 3. Strict course/module/topic hierarchy validation.
 * 4. Question & option integrity and correctOptionId validation.
 * 5. Safe author view vs student view isolation (Zero answer key leakage).
 * 6. Admin parity, cross-course authoring, and privacy-safe stats aggregation.
 * 7. Deletion vs archiving lifecycle preservation.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import crypto from 'node:crypto';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import Assessment from '../models/Assessment.js';
import AssessmentAttempt from '../models/AssessmentAttempt.js';
import Enrollment from '../models/Enrollment.js';
import { generateAccessToken } from '../services/tokenService.js';

const BASE_URL = 'http://localhost:5000';

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

async function runVerification() {
  console.log('===================================================================');
  console.log('=== LearnSphere Phase 8D-1 — Assessment Authoring Verification ===');
  console.log('===================================================================\n');

  await connectDB();

  const runId = crypto.randomBytes(4).toString('hex');
  const createdUserIds = [];
  const createdCourseIds = [];
  const createdModuleIds = [];
  const createdTopicIds = [];
  const createdAssessmentIds = [];
  const createdEnrollmentIds = [];

  try {
    // -------------------------------------------------------------------------
    // SETUP FIXTURES
    // -------------------------------------------------------------------------
    console.log('--- Setup: Test Fixtures & Authoring Accounts ---');

    // Creator A (Primary Author)
    const creatorA = await User.create({
      name: `Author A ${runId}`,
      email: `author_a_${runId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'courseCreator',
      status: 'active',
    });
    createdUserIds.push(creatorA._id);
    const creatorAToken = generateAccessToken({ userId: creatorA._id, role: creatorA.role });

    // Creator B (Foreign Creator)
    const creatorB = await User.create({
      name: `Author B ${runId}`,
      email: `author_b_${runId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'courseCreator',
      status: 'active',
    });
    createdUserIds.push(creatorB._id);
    const creatorBToken = generateAccessToken({ userId: creatorB._id, role: creatorB.role });

    // Admin
    const admin = await User.create({
      name: `Admin Author ${runId}`,
      email: `admin_author_${runId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'admin',
      status: 'active',
    });
    createdUserIds.push(admin._id);
    const adminToken = generateAccessToken({ userId: admin._id, role: admin.role });

    // Student
    const student = await User.create({
      name: `Student Tester ${runId}`,
      email: `student_test_${runId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'student',
      status: 'active',
    });
    createdUserIds.push(student._id);
    const studentToken = generateAccessToken({ userId: student._id, role: student.role });

    // Course 1 owned by Creator A
    const course1 = await Course.create({
      title: `TypeScript & React Mastery ${runId}`,
      description: 'Master frontend architecture and state management.',
      category: 'Web Development',
      courseCreator: creatorA._id,
      status: 'published',
    });
    createdCourseIds.push(course1._id);

    // Module 1 under Course 1
    const module1 = await Module.create({
      title: 'Module 1: Advanced Types',
      description: 'Generics and conditional types',
      courseId: course1._id,
      order: 1,
    });
    createdModuleIds.push(module1._id);

    // Topic 1 under Module 1
    const topic1 = await Topic.create({
      title: 'Topic 1: Utility Types',
      description: 'Pick, Omit, and Partial deep dive',
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

    assert(true, 'Test fixtures, tokens, courses, and hierarchy created successfully');

    // -------------------------------------------------------------------------
    // SECTION 1: ROUTE PROTECTION & AUTHORIZATION BOUNDARIES
    // -------------------------------------------------------------------------
    console.log('\n--- Section 1: Route Protection & Ownership Enforcement ---');

    // 1.1 Unauthenticated requests fail closed
    const unauthRes = await request(`/api/creator/courses/${course1._id}/assessments`);
    assert(unauthRes.status === 401, 'Unauthenticated request to creator assessments rejected (401 Unauthorized)');

    // 1.2 Student cannot access creator assessment authoring
    const studentCreatorRes = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      { method: 'GET' },
      studentToken
    );
    assert(studentCreatorRes.status === 403, 'Student blocked from creator assessment endpoints (403 Forbidden)');

    // 1.3 Student cannot access admin assessment endpoints
    const studentAdminRes = await request(
      `/api/admin/courses/${course1._id}/assessments`,
      { method: 'GET' },
      studentToken
    );
    assert(studentAdminRes.status === 403, 'Student blocked from admin assessment endpoints (403 Forbidden)');

    // 1.4 Creator B cannot list assessments for Creator A course
    const foreignListRes = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      { method: 'GET' },
      creatorBToken
    );
    assert(foreignListRes.status === 403, 'Creator B blocked from listing Creator A assessments (403 Forbidden)');

    // -------------------------------------------------------------------------
    // SECTION 2: ASSESSMENT CREATION & QUESTION MANAGEMENT
    // -------------------------------------------------------------------------
    console.log('\n--- Section 2: Creator Assessment Creation & Question Authoring ---');

    const opt1 = new mongoose.Types.ObjectId();
    const opt2 = new mongoose.Types.ObjectId();
    const opt3 = new mongoose.Types.ObjectId();
    const q1Id = new mongoose.Types.ObjectId();

    const topicAssessmentPayload = {
      title: 'TypeScript Utility Types Quiz',
      description: 'Test your understanding of Pick and Omit',
      type: 'topic',
      moduleId: module1._id.toString(),
      topicId: topic1._id.toString(),
      status: 'draft',
      passingScore: 80,
      timeLimitMinutes: 15,
      maxAttempts: 0, // unlimited
      questions: [
        {
          id: q1Id.toString(),
          prompt: 'Which utility type constructs a type with all properties of T set to optional?',
          codeSnippet: 'type PartialUser = Partial<User>;',
          explanation: 'Partial<T> marks all fields in T as optional.',
          order: 0,
          options: [
            { id: opt1.toString(), text: 'Partial<T>', order: 0 },
            { id: opt2.toString(), text: 'Required<T>', order: 1 },
            { id: opt3.toString(), text: 'Readonly<T>', order: 2 },
          ],
          correctOptionId: opt1.toString(),
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

    assert(createTopicRes.status === 201, 'Creator A creates topic assessment (201 Created)');
    assert(createTopicRes.data?.status === 'success', 'Response status is success');
    const createdTopicAssessment = createTopicRes.data?.data?.assessment;
    assert(Boolean(createdTopicAssessment?.id), 'Assessment ID returned');
    createdAssessmentIds.push(createdTopicAssessment?.id);

    assert(createdTopicAssessment?.title === 'TypeScript Utility Types Quiz', 'Assessment title preserved');
    assert(createdTopicAssessment?.type === 'topic', 'Assessment type is topic');
    assert(createdTopicAssessment?.status === 'draft', 'Assessment initial status is draft');
    assert(createdTopicAssessment?.passingScore === 80, 'Passing score configured to 80%');
    assert(createdTopicAssessment?.timeLimitMinutes === 15, 'Time limit configured to 15 mins');
    assert(createdTopicAssessment?.questions?.length === 1, 'Question count is 1');
    assert(
      createdTopicAssessment?.questions[0]?.correctOptionId === opt1.toString(),
      'Creator response safely includes correctOptionId for authoring'
    );
    assert(
      createdTopicAssessment?.questions[0]?.explanation === 'Partial<T> marks all fields in T as optional.',
      'Creator response includes explanation for authoring'
    );

    // -------------------------------------------------------------------------
    // SECTION 3: COURSE-LEVEL FINAL EXAM AUTHORING
    // -------------------------------------------------------------------------
    console.log('\n--- Section 3: Course Final Assessment Authoring ---');

    const courseOpt1 = new mongoose.Types.ObjectId();
    const courseOpt2 = new mongoose.Types.ObjectId();

    const courseFinalPayload = {
      title: 'Full Course Comprehensive Final Exam',
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
          prompt: 'What is the primary benefit of immutability in React state?',
          codeSnippet: 'const nextState = { ...state, count: state.count + 1 };',
          explanation: 'Immutability enables reliable change detection via shallow comparison.',
          order: 0,
          options: [
            { id: courseOpt1.toString(), text: 'Predictable state transitions and efficient change detection', order: 0 },
            { id: courseOpt2.toString(), text: 'Direct DOM mutation bypass', order: 1 },
          ],
          correctOptionId: courseOpt1.toString(),
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
    const createdFinalAssessment = createFinalRes.data?.data?.assessment;
    createdAssessmentIds.push(createdFinalAssessment?.id);
    assert(createdFinalAssessment?.type === 'course', 'Final assessment type is course');
    assert(createdFinalAssessment?.moduleId === null, 'Final assessment moduleId is null');
    assert(createdFinalAssessment?.topicId === null, 'Final assessment topicId is null');
    assert(createdFinalAssessment?.maxAttempts === 3, 'Course final maxAttempts is 3');

    // -------------------------------------------------------------------------
    // SECTION 4: HIERARCHY VALIDATION INVARIANTS
    // -------------------------------------------------------------------------
    console.log('\n--- Section 4: Hierarchy Validation Rules ---');

    // 4.1 Topic assessment missing topicId must fail
    const missingTopicRes = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Invalid Topic Quiz',
          type: 'topic',
          moduleId: module1._id.toString(),
          topicId: null,
        }),
      },
      creatorAToken
    );
    assert(missingTopicRes.status === 400, 'Topic assessment missing topicId rejected (400)');

    // 4.2 Course assessment specifying moduleId must fail
    const invalidCourseRes = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Invalid Course Final',
          type: 'course',
          moduleId: module1._id.toString(),
        }),
      },
      creatorAToken
    );
    assert(invalidCourseRes.status === 400, 'Course final specifying moduleId rejected (400)');

    // -------------------------------------------------------------------------
    // SECTION 5: QUESTION & OPTION VALIDATION INVARIANTS
    // -------------------------------------------------------------------------
    console.log('\n--- Section 5: Question & Option Integrity Invariants ---');

    // 5.1 Fewer than 2 options must fail
    const singleOptionRes = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Single Option Question Quiz',
          type: 'course',
          questions: [
            {
              prompt: 'Is this valid?',
              options: [{ text: 'Only one option' }],
              correctOptionId: new mongoose.Types.ObjectId().toString(),
            },
          ],
        }),
      },
      creatorAToken
    );
    assert(singleOptionRes.status === 400, 'Question with fewer than 2 options rejected (400)');

    // 5.2 correctOptionId not matching any option must fail
    const nonMatchingKeyRes = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Mismatch Key Quiz',
          type: 'course',
          questions: [
            {
              prompt: 'Where is the correct answer?',
              options: [
                { id: new mongoose.Types.ObjectId().toString(), text: 'Option A' },
                { id: new mongoose.Types.ObjectId().toString(), text: 'Option B' },
              ],
              correctOptionId: new mongoose.Types.ObjectId().toString(), // random id
            },
          ],
        }),
      },
      creatorAToken
    );
    assert(nonMatchingKeyRes.status === 400, 'Question with non-matching correctOptionId rejected (400)');

    // -------------------------------------------------------------------------
    // SECTION 6: ASSESSMENT RETRIEVAL & UPDATE
    // -------------------------------------------------------------------------
    console.log('\n--- Section 6: Assessment Retrieval & Authoring Updates ---');

    // 6.1 Creator lists course assessments
    const listRes = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      { method: 'GET' },
      creatorAToken
    );
    assert(listRes.status === 200, 'Creator lists assessments for course (200 OK)');
    assert(listRes.data?.data?.assessments?.length >= 2, 'Creator sees both created assessments');

    // 6.2 Creator gets single assessment by ID
    const getRes = await request(
      `/api/creator/courses/${course1._id}/assessments/${createdTopicAssessment.id}`,
      { method: 'GET' },
      creatorAToken
    );
    assert(getRes.status === 200, 'Creator retrieves assessment by ID (200 OK)');
    assert(getRes.data?.data?.assessment?.id === createdTopicAssessment.id, 'Assessment ID matches');

    // 6.3 Creator updates assessment metadata & publishes it
    const updateRes = await request(
      `/api/creator/courses/${course1._id}/assessments/${createdTopicAssessment.id}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          title: 'TypeScript Utility Types Mastery Quiz (Updated)',
          status: 'published',
          passingScore: 70,
        }),
      },
      creatorAToken
    );
    assert(updateRes.status === 200, 'Creator updates assessment (200 OK)');
    assert(
      updateRes.data?.data?.assessment?.title === 'TypeScript Utility Types Mastery Quiz (Updated)',
      'Updated title verified'
    );
    assert(updateRes.data?.data?.assessment?.status === 'published', 'Assessment status updated to published');
    assert(updateRes.data?.data?.assessment?.passingScore === 70, 'Passing score updated to 70');

    // -------------------------------------------------------------------------
    // SECTION 7: ADMIN PARITY & PRIVILEGED ACTIONS
    // -------------------------------------------------------------------------
    console.log('\n--- Section 7: Admin Parity & Statistics Aggregation ---');

    // 7.1 Admin lists course assessments across any creator's course
    const adminListRes = await request(
      `/api/admin/courses/${course1._id}/assessments`,
      { method: 'GET' },
      adminToken
    );
    assert(adminListRes.status === 200, 'Admin lists assessments for Course 1 (200 OK)');
    assert(adminListRes.data?.data?.assessments?.length >= 2, 'Admin sees all assessments');

    // 7.2 Admin gets single assessment by ID
    const adminGetRes = await request(
      `/api/admin/assessments/${createdTopicAssessment.id}`,
      { method: 'GET' },
      adminToken
    );
    assert(adminGetRes.status === 200, 'Admin retrieves assessment by ID (200 OK)');
    assert(adminGetRes.data?.data?.assessment?.id === createdTopicAssessment.id, 'Admin assessment matches');

    // 7.3 Admin views aggregate stats
    const statsRes = await request(
      `/api/admin/assessments/${createdTopicAssessment.id}/stats`,
      { method: 'GET' },
      adminToken
    );
    assert(statsRes.status === 200, 'Admin retrieves aggregate assessment stats (200 OK)');
    const stats = statsRes.data?.data?.stats;
    assert(stats?.totalAttempts === 0, 'Stats show 0 total attempts initially');
    assert(typeof stats?.passRate === 'number', 'Stats return numeric pass rate');
    assert(typeof stats?.averageScore === 'number', 'Stats return numeric average score');

    // -------------------------------------------------------------------------
    // SECTION 8: STUDENT VIEW SECURITY ISOLATION
    // -------------------------------------------------------------------------
    console.log('\n--- Section 8: Zero Answer Key Leakage to Students ---');

    const studentViewRes = await request(
      `/api/student/courses/${course1._id}/assessments/${createdTopicAssessment.id}`,
      { method: 'GET' },
      studentToken
    );
    assert(studentViewRes.status === 200, 'Enrolled student reads published assessment (200 OK)');
    const studentAssessment = studentViewRes.data?.data?.assessment;
    assert(Boolean(studentAssessment), 'Student assessment data exists');

    // CRITICAL SECURITY INVARIANT: Zero exposure of correctOptionId or explanation to students before submission
    const studentQuestions = studentAssessment?.questions || [];
    assert(studentQuestions.length > 0, 'Student receives questions');
    const hasLeakedKey = studentQuestions.some((q) => q.correctOptionId !== undefined);
    assert(!hasLeakedKey, 'STRICT SECURITY INVARIANT: correctOptionId is completely absent from student response');
    const hasLeakedExplanation = studentQuestions.some((q) => q.explanation !== undefined);
    assert(!hasLeakedExplanation, 'STRICT SECURITY INVARIANT: explanation is completely absent from student response');

    // -------------------------------------------------------------------------
    // SECTION 9: ARCHIVAL VS DELETION PRESERVATION
    // -------------------------------------------------------------------------
    console.log('\n--- Section 9: Deletion vs Archiving Lifecycle Preservation ---');

    // 9.1 Deleting an assessment without attempts hard deletes it
    const deleteRes = await request(
      `/api/creator/courses/${course1._id}/assessments/${createdFinalAssessment.id}`,
      { method: 'DELETE' },
      creatorAToken
    );
    assert(deleteRes.status === 200, 'Creator deletes assessment without attempts (200 OK)');
    assert(deleteRes.data?.data?.deleted === true, 'Assessment marked deleted in response');

    const verifyDeleted = await Assessment.findById(createdFinalAssessment.id);
    assert(verifyDeleted === null, 'Assessment removed from database collection');

    // 9.2 If student creates an attempt on topic assessment, deleting it archives instead
    await AssessmentAttempt.create({
      assessmentId: createdTopicAssessment.id,
      courseId: course1._id,
      topicId: topic1._id,
      userId: student._id,
      attemptNumber: 1,
      status: 'completed',
      startedAt: new Date(),
      submittedAt: new Date(),
      totalQuestions: 1,
      correctAnswersCount: 1,
      score: 100,
      isPassed: true,
      answers: [],
    });

    const archiveRes = await request(
      `/api/creator/courses/${course1._id}/assessments/${createdTopicAssessment.id}`,
      { method: 'DELETE' },
      creatorAToken
    );
    assert(archiveRes.status === 200, 'Attempted deletion of assessment with attempts returns 200 OK');
    assert(archiveRes.data?.data?.status === 'archived', 'Assessment status transitioned to archived to preserve records');

    const verifyArchived = await Assessment.findById(createdTopicAssessment.id);
    assert(verifyArchived?.status === 'archived', 'Assessment preserved in database with status archived');

    console.log('\n--- Cleanup: Purging Test Artifacts ---');
  } catch (err) {
    console.error('Fatal verification error:', err);
    failedTests++;
  } finally {
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
  console.log(` Phase 8D-1 Verification Complete: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
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
