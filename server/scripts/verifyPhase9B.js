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
import TopicProgress from '../models/TopicProgress.js';
import { generateAccessToken } from '../services/tokenService.js';
import studentProgressService from '../services/studentProgressService.js';

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

async function runPhase9BAudit() {
  console.log('===================================================================');
  console.log('=== LearnSphere Phase 9B: Course Completion & Enrollment State ===');
  console.log('===================================================================\n');

  if (!isDbConnected()) {
    await connectDB();
  }
  console.log('Connected to MongoDB database successfully.');

  const runId = crypto.randomBytes(4).toString('hex');

  const createdUserIds = [];
  const createdCourseIds = [];
  const createdModuleIds = [];
  const createdTopicIds = [];
  const createdAssessmentIds = [];
  const createdAttemptIds = [];
  const createdEnrollmentIds = [];
  const createdProgressIds = [];

  try {
    // -------------------------------------------------------------------------
    // SETUP: Users & Tokens
    // -------------------------------------------------------------------------
    console.log('--- Setup: Test Fixtures & Accounts ---');

    const creator = await User.create({
      name: `Instructor 9B ${runId}`,
      email: `instructor_9b_${runId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'courseCreator',
      status: 'active',
    });
    createdUserIds.push(creator._id);

    const studentA = await User.create({
      name: `Student A 9B ${runId}`,
      email: `student_a_9b_${runId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'student',
      status: 'active',
    });
    createdUserIds.push(studentA._id);
    const tokenA = generateAccessToken({ userId: studentA._id, role: studentA.role });

    const studentB = await User.create({
      name: `Student B 9B ${runId}`,
      email: `student_b_9b_${runId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'student',
      status: 'active',
    });
    createdUserIds.push(studentB._id);
    const tokenB = generateAccessToken({ userId: studentB._id, role: studentB.role });

    assert(Boolean(creator && studentA && studentB), 'Test users and access tokens created');

    // -------------------------------------------------------------------------
    // SCENARIO 1: Topics Complete + No Assessments -> Transition to 'completed'
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 1: Topics Complete + No Assessments -> Completed ---');

    const course1 = await Course.create({
      title: `Course 1 No Assessments ${runId}`,
      description: 'Course testing completion without assessments',
      category: 'Computer Science',
      courseCreator: creator._id,
      status: 'published',
    });
    createdCourseIds.push(course1._id);

    const mod1 = await Module.create({
      courseId: course1._id,
      title: 'Module 1',
      order: 1,
    });
    createdModuleIds.push(mod1._id);

    const top1 = await Topic.create({
      courseId: course1._id,
      moduleId: mod1._id,
      title: 'Topic 1',
      order: 1,
    });
    createdTopicIds.push(top1._id);

    const top2 = await Topic.create({
      courseId: course1._id,
      moduleId: mod1._id,
      title: 'Topic 2',
      order: 2,
    });
    createdTopicIds.push(top2._id);

    // Student A enrolls in Course 1
    const enroll1Res = await request(`/api/student/enroll/${course1._id}`, { method: 'POST' }, tokenA);
    assert(enroll1Res.status === 201, 'Student A enrolls in Course 1 (201 Created)');
    createdEnrollmentIds.push(enroll1Res.data?.data?.enrollment?.id);

    // Initial enrollment status is active
    let enroll1Doc = await Enrollment.findOne({ userId: studentA._id, courseId: course1._id });
    assert(enroll1Doc.status === 'active', 'Initial enrollment status is active');
    assert(enroll1Doc.completedAt === null, 'Initial completedAt is null');

    // Student A completes Topic 1 (1 of 2 topics)
    const putTop1Res = await request(
      `/api/student/progress/${course1._id}/${top1._id}`,
      { method: 'PUT' },
      tokenA
    );
    assert(putTop1Res.status === 200, 'Student A completes Topic 1 (200 OK)');
    assert(putTop1Res.data?.data?.isCourseCompleted === false, 'Course is NOT completed after 1/2 topics');

    enroll1Doc = await Enrollment.findOne({ userId: studentA._id, courseId: course1._id });
    assert(enroll1Doc.status === 'active', 'Enrollment status remains active with incomplete topics');
    assert(enroll1Doc.completedAt === null, 'completedAt remains null');

    // Student A completes Topic 2 (2 of 2 topics, no assessments exist)
    const putTop2Res = await request(
      `/api/student/progress/${course1._id}/${top2._id}`,
      { method: 'PUT' },
      tokenA
    );
    assert(putTop2Res.status === 200, 'Student A completes Topic 2 (200 OK)');
    assert(putTop2Res.data?.data?.isCourseCompleted === true, 'isCourseCompleted is true when all topics done');
    assert(putTop2Res.data?.data?.enrollmentStatus === 'completed', 'enrollmentStatus is completed');

    enroll1Doc = await Enrollment.findOne({ userId: studentA._id, courseId: course1._id });
    assert(enroll1Doc.status === 'completed', 'Enrollment.status transitioned to completed in DB');
    assert(enroll1Doc.completedAt instanceof Date, 'completedAt timestamp set to current date');
    const firstCompletedAt = enroll1Doc.completedAt.getTime();

    // Verify GET /api/student/enrollments/:courseId reflects 'completed'
    const getEnrollRes = await request(`/api/student/enrollments/${course1._id}`, {}, tokenA);
    assert(getEnrollRes.status === 200, 'GET enrollment returns 200 OK');
    assert(getEnrollRes.data?.data?.enrollment?.status === 'completed', 'GET enrollment reflects completed status');
    assert(Boolean(getEnrollRes.data?.data?.enrollment?.completedAt), 'GET enrollment returns completedAt timestamp');

    // Verify GET /api/student/progress/:courseId/summary reflects completed
    const getSummaryRes = await request(`/api/student/progress/${course1._id}/summary`, {}, tokenA);
    assert(getSummaryRes.status === 200, 'GET progress summary returns 200 OK');
    assert(getSummaryRes.data?.data?.isCompleted === true, 'Progress summary isCompleted is true');
    assert(getSummaryRes.data?.data?.completionPercentage === 100, 'completionPercentage is 100%');
    assert(getSummaryRes.data?.data?.enrollmentStatus === 'completed', 'Progress summary returns enrollmentStatus completed');

    // -------------------------------------------------------------------------
    // SCENARIO 2: Topics Complete + All Assessments Passed -> Transition to 'completed'
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 2: Topics Complete + All Assessments Passed -> Completed ---');

    const course2 = await Course.create({
      title: `Course 2 With Assessments ${runId}`,
      description: 'Course testing completion with required assessments',
      category: 'Data Science',
      courseCreator: creator._id,
      status: 'published',
    });
    createdCourseIds.push(course2._id);

    const mod2 = await Module.create({
      courseId: course2._id,
      title: 'Module 2',
      order: 1,
    });
    createdModuleIds.push(mod2._id);

    const top2_1 = await Topic.create({
      courseId: course2._id,
      moduleId: mod2._id,
      title: 'Topic 2.1',
      order: 1,
    });
    createdTopicIds.push(top2_1._id);

    const optCorrect = new mongoose.Types.ObjectId();
    const optWrong = new mongoose.Types.ObjectId();

    const assessment2 = await Assessment.create({
      courseId: course2._id,
      moduleId: mod2._id,
      topicId: top2_1._id,
      createdBy: creator._id,
      title: 'Quiz 2.1',
      type: 'topic',
      passingScore: 50,
      timeLimitMinutes: 0,
      maxAttempts: 5,
      status: 'published',
      questions: [
        {
          prompt: 'What is 2 + 2?',
          options: [
            { _id: optCorrect, text: '4', order: 1 },
            { _id: optWrong, text: '5', order: 2 },
          ],
          correctOptionId: optCorrect,
          explanation: '2 + 2 is 4',
          order: 1,
        },
      ],
    });
    createdAssessmentIds.push(assessment2._id);

    // Student A enrolls in Course 2
    const enroll2Res = await request(`/api/student/enroll/${course2._id}`, { method: 'POST' }, tokenA);
    assert(enroll2Res.status === 201, 'Student A enrolls in Course 2 (201 Created)');
    createdEnrollmentIds.push(enroll2Res.data?.data?.enrollment?.id);

    // Student A completes Topic 2.1
    await request(`/api/student/progress/${course2._id}/${top2_1._id}`, { method: 'PUT' }, tokenA);

    // Topic is complete, but assessment NOT yet taken -> Enrollment must remain active
    let enroll2Doc = await Enrollment.findOne({ userId: studentA._id, courseId: course2._id });
    assert(enroll2Doc.status === 'active', 'Enrollment remains active when topic complete but assessment not taken');
    assert(enroll2Doc.completedAt === null, 'completedAt is null');

    // Student A starts attempt on Quiz 2.1
    const start2Res = await request(
      `/api/student/courses/${course2._id}/assessments/${assessment2._id}/start`,
      { method: 'POST' },
      tokenA
    );
    assert(start2Res.status === 201, 'Student A starts Quiz 2.1 attempt (201 Created)');
    const attempt2Id = start2Res.data?.data?.attempt?.id;
    createdAttemptIds.push(attempt2Id);

    // Student A submits passing answer
    const submit2Res = await request(
      `/api/student/courses/${course2._id}/assessments/${assessment2._id}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({
          answers: [
            {
              questionId: assessment2.questions[0]._id.toString(),
              selectedOptionId: optCorrect.toString(),
            },
          ],
        }),
      },
      tokenA
    );
    assert(submit2Res.status === 200, 'Attempt submitted successfully (200 OK)');
    assert(submit2Res.data?.data?.results?.isPassed === true, 'Quiz was passed (100% >= 50%)');

    // Enrollment must now transition from active -> completed
    enroll2Doc = await Enrollment.findOne({ userId: studentA._id, courseId: course2._id });
    assert(enroll2Doc.status === 'completed', 'Enrollment.status transitioned to completed after passing assessment');
    assert(enroll2Doc.completedAt instanceof Date, 'completedAt timestamp set');

    // -------------------------------------------------------------------------
    // SCENARIO 3: Topics Complete + Assessment Not Passed -> Remains Active
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 3: Topics Complete + Assessment Failed -> Remains Active ---');

    const course3 = await Course.create({
      title: `Course 3 Failed Assessment ${runId}`,
      description: 'Course testing failed assessment keeps enrollment active',
      category: 'Design',
      courseCreator: creator._id,
      status: 'published',
    });
    createdCourseIds.push(course3._id);

    const mod3 = await Module.create({
      courseId: course3._id,
      title: 'Module 3',
      order: 1,
    });
    createdModuleIds.push(mod3._id);

    const top3_1 = await Topic.create({
      courseId: course3._id,
      moduleId: mod3._id,
      title: 'Topic 3.1',
      order: 1,
    });
    createdTopicIds.push(top3_1._id);

    const opt3Correct = new mongoose.Types.ObjectId();
    const opt3Wrong = new mongoose.Types.ObjectId();

    const assessment3 = await Assessment.create({
      courseId: course3._id,
      moduleId: mod3._id,
      topicId: top3_1._id,
      createdBy: creator._id,
      title: 'Quiz 3.1',
      type: 'topic',
      passingScore: 80,
      timeLimitMinutes: 0,
      maxAttempts: 3,
      status: 'published',
      questions: [
        {
          prompt: 'Question 1',
          options: [
            { _id: opt3Correct, text: 'Correct', order: 1 },
            { _id: opt3Wrong, text: 'Wrong', order: 2 },
          ],
          correctOptionId: opt3Correct,
          order: 1,
        },
      ],
    });
    createdAssessmentIds.push(assessment3._id);

    // Student A enrolls in Course 3
    const enroll3Res = await request(`/api/student/enroll/${course3._id}`, { method: 'POST' }, tokenA);
    assert(enroll3Res.status === 201, 'Student A enrolls in Course 3 (201 Created)');
    createdEnrollmentIds.push(enroll3Res.data?.data?.enrollment?.id);

    // Complete topic 3.1
    await request(`/api/student/progress/${course3._id}/${top3_1._id}`, { method: 'PUT' }, tokenA);

    // Start attempt on Quiz 3.1
    const start3Res = await request(
      `/api/student/courses/${course3._id}/assessments/${assessment3._id}/start`,
      { method: 'POST' },
      tokenA
    );
    const attempt3Id = start3Res.data?.data?.attempt?.id;
    createdAttemptIds.push(attempt3Id);

    // Submit FAILING answer
    const submit3Res = await request(
      `/api/student/courses/${course3._id}/assessments/${assessment3._id}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({
          answers: [
            {
              questionId: assessment3.questions[0]._id.toString(),
              selectedOptionId: opt3Wrong.toString(), // Wrong option
            },
          ],
        }),
      },
      tokenA
    );
    assert(submit3Res.status === 200, 'Failing attempt submitted (200 OK)');
    assert(submit3Res.data?.data?.results?.isPassed === false, 'Attempt evaluated as NOT passed (0% < 80%)');

    const enroll3Doc = await Enrollment.findOne({ userId: studentA._id, courseId: course3._id });
    assert(enroll3Doc.status === 'active', 'Enrollment remains active when assessment failed');
    assert(enroll3Doc.completedAt === null, 'completedAt remains null');

    // -------------------------------------------------------------------------
    // SCENARIO 4: Incomplete Topics -> Remains Active
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 4: Incomplete Topics -> Remains Active ---');

    const course4 = await Course.create({
      title: `Course 4 Incomplete Topics ${runId}`,
      description: 'Course testing incomplete topics keeps enrollment active',
      category: 'Business',
      courseCreator: creator._id,
      status: 'published',
    });
    createdCourseIds.push(course4._id);

    const mod4 = await Module.create({
      courseId: course4._id,
      title: 'Module 4',
      order: 1,
    });
    createdModuleIds.push(mod4._id);

    const top4_1 = await Topic.create({
      courseId: course4._id,
      moduleId: mod4._id,
      title: 'Topic 4.1',
      order: 1,
    });
    createdTopicIds.push(top4_1._id);

    const top4_2 = await Topic.create({
      courseId: course4._id,
      moduleId: mod4._id,
      title: 'Topic 4.2',
      order: 2,
    });
    createdTopicIds.push(top4_2._id);

    // Student A enrolls in Course 4
    const enroll4Res = await request(`/api/student/enroll/${course4._id}`, { method: 'POST' }, tokenA);
    assert(enroll4Res.status === 201, 'Student A enrolls in Course 4 (201 Created)');
    createdEnrollmentIds.push(enroll4Res.data?.data?.enrollment?.id);

    // Complete only Topic 4.1 out of 2 topics
    await request(`/api/student/progress/${course4._id}/${top4_1._id}`, { method: 'PUT' }, tokenA);

    const enroll4Doc = await Enrollment.findOne({ userId: studentA._id, courseId: course4._id });
    assert(enroll4Doc.status === 'active', 'Enrollment remains active when only 1/2 topics complete');
    assert(enroll4Doc.completedAt === null, 'completedAt remains null');

    // -------------------------------------------------------------------------
    // SCENARIO 5: Withdrawn Enrollment -> Never Automatically Completed
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 5: Withdrawn Enrollment -> Never Automatically Completed ---');

    const course5 = await Course.create({
      title: `Course 5 Withdrawn Test ${runId}`,
      description: 'Course testing withdrawn enrollment immunity',
      category: 'Science',
      courseCreator: creator._id,
      status: 'published',
    });
    createdCourseIds.push(course5._id);

    const mod5 = await Module.create({
      courseId: course5._id,
      title: 'Module 5',
      order: 1,
    });
    createdModuleIds.push(mod5._id);

    const top5_1 = await Topic.create({
      courseId: course5._id,
      moduleId: mod5._id,
      title: 'Topic 5.1',
      order: 1,
    });
    createdTopicIds.push(top5_1._id);

    // Create withdrawn enrollment directly
    const withdrawnEnroll = await Enrollment.create({
      userId: studentA._id,
      courseId: course5._id,
      status: 'withdrawn',
      enrolledAt: new Date(),
      completedAt: null,
    });
    createdEnrollmentIds.push(withdrawnEnroll._id);

    // Call checkAndSyncCourseCompletion on withdrawn enrollment
    const syncWithdrawn = await studentProgressService.checkAndSyncCourseCompletion({
      userId: studentA._id,
      courseId: course5._id,
    });
    assert(syncWithdrawn.isCompleted === false, 'checkAndSync returns isCompleted: false for withdrawn enrollment');
    assert(syncWithdrawn.enrollmentStatus === 'withdrawn', 'enrollmentStatus remains withdrawn');

    const withdrawnDoc = await Enrollment.findById(withdrawnEnroll._id);
    assert(withdrawnDoc.status === 'withdrawn', 'Withdrawn enrollment status strictly preserved in database');
    assert(withdrawnDoc.completedAt === null, 'Withdrawn enrollment completedAt is strictly null');

    // Attempting PUT progress on withdrawn enrollment fails with 403 Forbidden
    const putWithdrawnRes = await request(
      `/api/student/progress/${course5._id}/${top5_1._id}`,
      { method: 'PUT' },
      tokenA
    );
    assert(putWithdrawnRes.status === 403, 'Withdrawn enrollment blocked from updating progress (403 Forbidden)');

    // -------------------------------------------------------------------------
    // SCENARIO 6: Idempotency of Repeated Completion Calls
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 6: Idempotency of Repeated Completion Calls ---');

    // Repeated PUT on already completed Topic 2 of Course 1
    const repeatPutRes = await request(
      `/api/student/progress/${course1._id}/${top2._id}`,
      { method: 'PUT' },
      tokenA
    );
    assert(repeatPutRes.status === 200, 'Repeated PUT progress returns 200 OK');
    assert(repeatPutRes.data?.data?.alreadyCompleted === true, 'alreadyCompleted is true');
    assert(repeatPutRes.data?.data?.isCourseCompleted === true, 'isCourseCompleted remains true');
    assert(repeatPutRes.data?.data?.enrollmentStatus === 'completed', 'enrollmentStatus remains completed');

    const repeatEnrollDoc = await Enrollment.findOne({ userId: studentA._id, courseId: course1._id });
    assert(repeatEnrollDoc.status === 'completed', 'Enrollment status remains completed');
    assert(repeatEnrollDoc.completedAt.getTime() === firstCompletedAt, 'completedAt timestamp is preserved without modification');

    // Direct service idempotency check
    const syncRepeat = await studentProgressService.checkAndSyncCourseCompletion({
      userId: studentA._id,
      courseId: course1._id,
    });
    assert(syncRepeat.isCompleted === true, 'Direct service call returns isCompleted: true');
    assert(syncRepeat.enrollmentStatus === 'completed', 'Direct service call returns enrollmentStatus: completed');

    // -------------------------------------------------------------------------
    // SCENARIO 7: Client Cannot Force Completion Flags or Status
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 7: Client Cannot Force Completion ---');

    // Client attempts to spoof status: 'completed' and isCompleted: true in progress body
    const spoofedBody = JSON.stringify({
      status: 'completed',
      isCompleted: true,
      completionPercentage: 100,
      score: 100,
      completedAt: '1970-01-01T00:00:00.000Z',
    });

    // Course 4 is incomplete (only 1/2 topics). Client tries to force complete Topic 4.1 with spoofed body
    const spoofPutRes = await request(
      `/api/student/progress/${course4._id}/${top4_1._id}`,
      {
        method: 'PUT',
        body: spoofedBody,
      },
      tokenA
    );
    assert(spoofPutRes.status === 200, 'Request processed without server crash');
    assert(spoofPutRes.data?.data?.isCourseCompleted === false, 'Spoofed isCompleted is ignored; course remains incomplete');
    assert(spoofPutRes.data?.data?.enrollmentStatus === 'active', 'Spoofed status is ignored; enrollment remains active');

    const spoofEnrollDoc = await Enrollment.findOne({ userId: studentA._id, courseId: course4._id });
    assert(spoofEnrollDoc.status === 'active', 'DB enrollment status remains active despite client spoof payload');
    assert(spoofEnrollDoc.completedAt === null, 'DB completedAt remains null');

    // -------------------------------------------------------------------------
    // SCENARIO 8: Cross-Student Isolation
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 8: Cross-Student Isolation ---');

    // Student B enrolls in Course 1
    const enroll1BRes = await request(`/api/student/enroll/${course1._id}`, { method: 'POST' }, tokenB);
    assert(enroll1BRes.status === 201, 'Student B enrolls in Course 1 (201 Created)');
    createdEnrollmentIds.push(enroll1BRes.data?.data?.enrollment?.id);

    // Verify Student B's enrollment in Course 1 is active (even though Student A completed it)
    const enroll1BDoc = await Enrollment.findOne({ userId: studentB._id, courseId: course1._id });
    assert(enroll1BDoc.status === 'active', "Student B's enrollment is active (Student A completion does not leak)");
    assert(enroll1BDoc.completedAt === null, "Student B's completedAt is null");

    // Student B's summary for Course 1
    const summaryBRes = await request(`/api/student/progress/${course1._id}/summary`, {}, tokenB);
    assert(summaryBRes.status === 200, 'Student B summary returns 200 OK');
    assert(summaryBRes.data?.data?.completedTopics === 0, 'Student B completedTopics is 0');
    assert(summaryBRes.data?.data?.completionPercentage === 0, 'Student B completionPercentage is 0');
    assert(summaryBRes.data?.data?.isCompleted === false, 'Student B isCompleted is false');
    assert(summaryBRes.data?.data?.enrollmentStatus === 'active', 'Student B enrollmentStatus is active');

    // -------------------------------------------------------------------------
    // SCENARIO 9: Draft/Archived Assessments & Lifecycle State Preservation
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 9: Draft/Archived Assessments & Lifecycle Invariants ---');

    const course6 = await Course.create({
      title: `Course 6 Draft Assessment Test ${runId}`,
      description: 'Course testing draft assessments do not block completion',
      category: 'Arts',
      courseCreator: creator._id,
      status: 'published',
    });
    createdCourseIds.push(course6._id);

    const mod6 = await Module.create({
      courseId: course6._id,
      title: 'Module 6',
      order: 1,
    });
    createdModuleIds.push(mod6._id);

    const top6_1 = await Topic.create({
      courseId: course6._id,
      moduleId: mod6._id,
      title: 'Topic 6.1',
      order: 1,
    });
    createdTopicIds.push(top6_1._id);

    const draftOptA = new mongoose.Types.ObjectId();
    const draftOptB = new mongoose.Types.ObjectId();
    // Create DRAFT assessment (should NOT count or block completion)
    const draftAssessment = await Assessment.create({
      courseId: course6._id,
      createdBy: creator._id,
      title: 'Draft Quiz',
      type: 'course',
      passingScore: 100,
      status: 'draft',
      questions: [
        {
          prompt: 'Draft question?',
          options: [
            { _id: draftOptA, text: 'Option A', order: 1 },
            { _id: draftOptB, text: 'Option B', order: 2 },
          ],
          correctOptionId: draftOptA,
          order: 1,
        },
      ],
    });
    createdAssessmentIds.push(draftAssessment._id);

    const archOptA = new mongoose.Types.ObjectId();
    const archOptB = new mongoose.Types.ObjectId();
    // Create ARCHIVED assessment (should NOT count or block completion)
    const archivedAssessment = await Assessment.create({
      courseId: course6._id,
      createdBy: creator._id,
      title: 'Archived Quiz',
      type: 'course',
      passingScore: 100,
      status: 'archived',
      questions: [
        {
          prompt: 'Archived question?',
          options: [
            { _id: archOptA, text: 'Option A', order: 1 },
            { _id: archOptB, text: 'Option B', order: 2 },
          ],
          correctOptionId: archOptA,
          order: 1,
        },
      ],
    });
    createdAssessmentIds.push(archivedAssessment._id);

    // Student A enrolls in Course 6
    const enroll6Res = await request(`/api/student/enroll/${course6._id}`, { method: 'POST' }, tokenA);
    assert(enroll6Res.status === 201, 'Student A enrolls in Course 6 (201 Created)');
    createdEnrollmentIds.push(enroll6Res.data?.data?.enrollment?.id);

    // Student A completes Topic 6.1
    const putTop6Res = await request(
      `/api/student/progress/${course6._id}/${top6_1._id}`,
      { method: 'PUT' },
      tokenA
    );
    assert(putTop6Res.status === 200, 'Student A completes Topic 6.1 (200 OK)');
    assert(putTop6Res.data?.data?.isCourseCompleted === true, 'Course completed (draft and archived assessments ignored)');
    assert(putTop6Res.data?.data?.enrollmentStatus === 'completed', 'enrollmentStatus transitioned to completed');

    const enroll6Doc = await Enrollment.findOne({ userId: studentA._id, courseId: course6._id });
    assert(enroll6Doc.status === 'completed', 'Enrollment in DB is completed');

    // -------------------------------------------------------------------------
    // SCENARIO 10: Uncomplete Topic Reverts Status to Active & Re-complete Restores
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 10: Topic Uncompletion & Lifecycle Reversal ---');

    // Student A uncompletes Topic 6.1
    const delTop6Res = await request(
      `/api/student/progress/${course6._id}/${top6_1._id}`,
      { method: 'DELETE' },
      tokenA
    );
    assert(delTop6Res.status === 200, 'Student A uncompletes Topic 6.1 (200 OK)');

    const enroll6AfterDelete = await Enrollment.findOne({ userId: studentA._id, courseId: course6._id });
    assert(enroll6AfterDelete.status === 'active', 'Enrollment reverted from completed -> active upon topic uncompletion');
    assert(enroll6AfterDelete.completedAt === null, 'completedAt reset to null upon uncompletion');

    // Student A re-completes Topic 6.1
    const reCompleteRes = await request(
      `/api/student/progress/${course6._id}/${top6_1._id}`,
      { method: 'PUT' },
      tokenA
    );
    assert(reCompleteRes.status === 200, 'Student A re-completes Topic 6.1 (200 OK)');
    assert(reCompleteRes.data?.data?.isCourseCompleted === true, 'isCourseCompleted restored to true');

    const enroll6Restored = await Enrollment.findOne({ userId: studentA._id, courseId: course6._id });
    assert(enroll6Restored.status === 'completed', 'Enrollment restored to completed');
    assert(enroll6Restored.completedAt instanceof Date, 'completedAt restored with new timestamp');

    // -------------------------------------------------------------------------
    // SCENARIO 11: Re-enrollment Lifecycle Contract Preservation
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 11: Re-enrollment Lifecycle Contract Preservation ---');

    // Student A attempts to re-enroll in already completed Course 1
    const reEnrollRes = await request(`/api/student/enroll/${course1._id}`, { method: 'POST' }, tokenA);
    assert(reEnrollRes.status === 409, 'Attempt to re-enroll in completed course returns 409 Conflict');
    assert(
      reEnrollRes.data?.message === 'You are already enrolled in this course.',
      'Message preserves existing contract: You are already enrolled in this course.'
    );

    // Verify Student A's enrollment remains completed
    const enroll1AfterReEnroll = await Enrollment.findOne({ userId: studentA._id, courseId: course1._id });
    assert(enroll1AfterReEnroll.status === 'completed', 'Enrollment status remains completed and uncorrupted');

    // -------------------------------------------------------------------------
    // SCENARIO 12: Student Dashboard Statistics Integration
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 12: Student Dashboard Stats Integration ---');

    const dashRes = await request('/api/student/dashboard', {}, tokenA);
    assert(dashRes.status === 200, 'GET student dashboard returns 200 OK');
    const dashData = dashRes.data?.data;

    // Student A has completed Course 1, Course 2, and Course 6!
    assert(dashData?.stats?.completedCourses >= 3, 'stats.completedCourses reflects completed courses');
    assert(dashData?.stats?.completedEnrollments >= 3, 'stats.completedEnrollments reflects completed enrollments');

    const c1Summary = dashData?.courses?.find((c) => c.courseId === course1._id.toString());
    assert(c1Summary?.isCompleted === true, 'Course 1 summary isCompleted === true');
    assert(c1Summary?.enrollmentStatus === 'completed', 'Course 1 summary enrollmentStatus === "completed"');

  } finally {
    console.log('\n--- Cleanup: Purging Verification Artifacts ---');
    try {
      if (createdAttemptIds.length > 0) {
        await AssessmentAttempt.deleteMany({ _id: { $in: createdAttemptIds } });
      }
      if (createdAssessmentIds.length > 0) {
        await Assessment.deleteMany({ _id: { $in: createdAssessmentIds } });
      }
      if (createdProgressIds.length > 0) {
        await TopicProgress.deleteMany({ _id: { $in: createdProgressIds } });
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
    } catch (cleanupErr) {
      console.error('Error during cleanup:', cleanupErr.message);
    }
  }

  console.log('\n===================================================================');
  console.log(`Phase 9B Verification Complete: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('===================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runPhase9BAudit().catch((err) => {
  console.error('Unhandled verification error:', err);
  process.exit(1);
});
