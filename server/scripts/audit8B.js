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

async function runAudit() {
  console.log('================================================================');
  console.log('=== LearnSphere Phase 8B — Assessment Backend Audit ===');
  console.log('================================================================\n');

  await connectDB();
  if (!isDbConnected()) {
    console.error('Fatal: Database is not connected');
    process.exit(1);
  }

  const auditRunId = crypto.randomBytes(4).toString('hex');
  const createdUserIds = [];
  const createdCourseIds = [];
  const createdModuleIds = [];
  const createdTopicIds = [];
  const createdEnrollmentIds = [];
  const createdAssessmentIds = [];
  const createdAttemptIds = [];

  try {
    // -------------------------------------------------------------------------
    // SETUP: Users, Courses, Modules, Topics, and Tokens
    // -------------------------------------------------------------------------
    console.log('--- Setup: Test Fixtures & Tokens ---');

    // 1. Creator A
    const creatorA = await User.create({
      name: `Creator A ${auditRunId}`,
      email: `creator_a_${auditRunId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'courseCreator',
      status: 'active',
    });
    createdUserIds.push(creatorA._id);
    const creatorAToken = generateAccessToken({ userId: creatorA._id, role: creatorA.role });

    // 2. Creator B
    const creatorB = await User.create({
      name: `Creator B ${auditRunId}`,
      email: `creator_b_${auditRunId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'courseCreator',
      status: 'active',
    });
    createdUserIds.push(creatorB._id);
    const creatorBToken = generateAccessToken({ userId: creatorB._id, role: creatorB.role });

    // 3. Admin
    const admin = await User.create({
      name: `Admin ${auditRunId}`,
      email: `admin_${auditRunId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'admin',
      status: 'active',
    });
    createdUserIds.push(admin._id);
    const adminToken = generateAccessToken({ userId: admin._id, role: admin.role });

    // 4. Students
    const studentA = await User.create({
      name: `Student A ${auditRunId}`,
      email: `student_a_${auditRunId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'student',
      status: 'active',
    });
    createdUserIds.push(studentA._id);
    const studentAToken = generateAccessToken({ userId: studentA._id, role: studentA.role });

    const studentB = await User.create({
      name: `Student B ${auditRunId}`,
      email: `student_b_${auditRunId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'student',
      status: 'active',
    });
    createdUserIds.push(studentB._id);
    const studentBToken = generateAccessToken({ userId: studentB._id, role: studentB.role });

    // 5. Courses
    // Course 1: Published Course owned by Creator A
    const course1 = await Course.create({
      title: `Fullstack Assessment Course ${auditRunId}`,
      description: 'Comprehensive course for testing assessment backend capabilities.',
      category: 'Web Development',
      courseCreator: creatorA._id,
      status: 'published',
    });
    createdCourseIds.push(course1._id);

    // Course 2: Published Course owned by Creator B
    const course2 = await Course.create({
      title: `Creator B Python Course ${auditRunId}`,
      description: 'Course owned by creator B for isolation testing.',
      category: 'Data Science',
      courseCreator: creatorB._id,
      status: 'published',
    });
    createdCourseIds.push(course2._id);

    // Course 3: Draft Course owned by Creator A
    const draftCourse = await Course.create({
      title: `Draft Assessment Course ${auditRunId}`,
      description: 'Unpublished draft course.',
      category: 'Design',
      courseCreator: creatorA._id,
      status: 'draft',
    });
    createdCourseIds.push(draftCourse._id);

    // 6. Curriculum for Course 1
    const module1 = await Module.create({
      title: 'Module 1: Foundations',
      description: 'Basic foundations',
      courseId: course1._id,
      order: 1,
    });
    createdModuleIds.push(module1._id);

    const topic1 = await Topic.create({
      title: 'Topic 1: Syntax Basics',
      description: 'Understanding language syntax',
      moduleId: module1._id,
      courseId: course1._id,
      order: 1,
    });
    createdTopicIds.push(topic1._id);

    // Curriculum for Course 2
    const module2 = await Module.create({
      title: 'Module 2 for Course 2',
      courseId: course2._id,
      order: 1,
    });
    createdModuleIds.push(module2._id);

    const topic2 = await Topic.create({
      title: 'Topic 2 for Course 2',
      moduleId: module2._id,
      courseId: course2._id,
      order: 1,
    });
    createdTopicIds.push(topic2._id);

    // 7. Enrollments
    // Student A enrolled in Course 1
    const enrollmentA1 = await Enrollment.create({
      userId: studentA._id,
      courseId: course1._id,
      status: 'active',
      enrolledAt: new Date(),
    });
    createdEnrollmentIds.push(enrollmentA1._id);

    assert(true, 'Test fixtures, tokens, courses, and enrollments created successfully');


    // -------------------------------------------------------------------------
    // TEST 1: Assessment creation by an authorized Course Creator
    // -------------------------------------------------------------------------
    console.log('\n--- Section 1: Assessment Creation by Course Creator ---');

    const opt1Id = new mongoose.Types.ObjectId();
    const opt2Id = new mongoose.Types.ObjectId();
    const opt3Id = new mongoose.Types.ObjectId();
    const opt4Id = new mongoose.Types.ObjectId();

    const topicAssessmentPayload = {
      title: 'Topic 1 Mini-Quiz',
      description: 'Test your understanding of Topic 1 syntax',
      type: 'topic',
      moduleId: module1._id.toString(),
      topicId: topic1._id.toString(),
      status: 'published',
      passingScore: 50,
      timeLimitMinutes: 0, // untimed
      maxAttempts: 0, // unlimited
      questions: [
        {
          prompt: 'What keyword declares a block-scoped variable in modern JavaScript?',
          codeSnippet: 'const x = 10;',
          order: 0,
          options: [
            { _id: opt1Id.toString(), text: 'var', order: 0 },
            { _id: opt2Id.toString(), text: 'let', order: 1 },
          ],
          correctOptionId: opt2Id.toString(),
          explanation: 'let and const declare block-scoped variables in modern JavaScript.',
        },
        {
          prompt: 'Which method adds an element to the end of an array?',
          order: 1,
          options: [
            { _id: opt3Id.toString(), text: 'push', order: 0 },
            { _id: opt4Id.toString(), text: 'pop', order: 1 },
          ],
          correctOptionId: opt3Id.toString(),
          explanation: 'Array.prototype.push adds an element to the end of an array.',
        },
      ],
    };

    const createRes = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      { method: 'POST', body: JSON.stringify(topicAssessmentPayload) },
      creatorAToken
    );

    assert(createRes.status === 201, 'Creator A creates topic assessment (201 Created)');


    assert(createRes.data?.status === 'success', 'Response status is "success"');
    const createdTopicAssessment = createRes.data?.data?.assessment;
    assert(Boolean(createdTopicAssessment?.id), 'Assessment ID returned');
    assert(createdTopicAssessment?.title === 'Topic 1 Mini-Quiz', 'Assessment title matches');
    assert(createdTopicAssessment?.questions?.length === 2, 'Assessment has 2 questions');
    assert(
      createdTopicAssessment?.questions[0]?.correctOptionId === opt2Id.toString(),
      'Creator response includes correctOptionId for authoring'
    );
    if (createdTopicAssessment?.id) {
      createdAssessmentIds.push(new mongoose.Types.ObjectId(createdTopicAssessment.id));
    }

    // -------------------------------------------------------------------------
    // TEST 2: Course Creator ownership isolation
    // -------------------------------------------------------------------------
    console.log('\n--- Section 2: Course Creator Ownership Isolation ---');

    // Creator B attempts to create an assessment on Course 1 (owned by Creator A)
    const creatorBAttackRes = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      { method: 'POST', body: JSON.stringify(topicAssessmentPayload) },
      creatorBToken
    );
    assert(creatorBAttackRes.status === 403, 'Creator B cannot create assessment on Creator A course (403 Forbidden)');

    // Creator B attempts to list assessments on Course 1
    const creatorBListRes = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      { method: 'GET' },
      creatorBToken
    );
    assert(creatorBListRes.status === 403, 'Creator B cannot list assessments on Creator A course (403 Forbidden)');

    // Creator B attempts to update Creator A assessment
    const creatorBUpdateRes = await request(
      `/api/creator/courses/${course1._id}/assessments/${createdTopicAssessment.id}`,
      { method: 'PUT', body: JSON.stringify({ title: 'Hacked Title' }) },
      creatorBToken
    );
    assert(creatorBUpdateRes.status === 403, 'Creator B cannot update Creator A assessment (403 Forbidden)');

    // Creator B attempts to delete Creator A assessment
    const creatorBDeleteRes = await request(
      `/api/creator/courses/${course1._id}/assessments/${createdTopicAssessment.id}`,
      { method: 'DELETE' },
      creatorBToken
    );
    assert(creatorBDeleteRes.status === 403, 'Creator B cannot delete Creator A assessment (403 Forbidden)');

    // -------------------------------------------------------------------------
    // TEST 3: Admin access across courses
    // -------------------------------------------------------------------------
    console.log('\n--- Section 3: Admin Access Across Courses ---');

    // Admin lists assessments for Course 1
    const adminListRes = await request(
      `/api/admin/courses/${course1._id}/assessments`,
      { method: 'GET' },
      adminToken
    );
    assert(adminListRes.status === 200, 'Admin can list assessments for any course (200 OK)');
    assert(adminListRes.data?.data?.assessments?.length >= 1, 'Admin sees Course 1 assessments');

    // Admin creates a Course Final Assessment on Course 1
    const q1Opt1 = new mongoose.Types.ObjectId();
    const q1Opt2 = new mongoose.Types.ObjectId();
    const courseAssessmentPayload = {
      title: 'Course 1 Final Assessment',
      description: 'Comprehensive final exam to test all course concepts.',
      type: 'course',
      status: 'published',
      passingScore: 70,
      timeLimitMinutes: 10,
      maxAttempts: 3, // default course limit
      questions: [
        {
          prompt: 'Final Exam Q1: Is TypeScript a statically typed superset of JavaScript?',
          order: 0,
          options: [
            { _id: q1Opt1.toString(), text: 'Yes', order: 0 },
            { _id: q1Opt2.toString(), text: 'No', order: 1 },
          ],
          correctOptionId: q1Opt1.toString(),
          explanation: 'Yes, TypeScript adds static type checking to JavaScript.',
        },
      ],
    };

    const adminCreateRes = await request(
      `/api/admin/courses/${course1._id}/assessments`,
      { method: 'POST', body: JSON.stringify(courseAssessmentPayload) },
      adminToken
    );
    assert(adminCreateRes.status === 201, 'Admin creates course final assessment (201 Created)');
    const createdCourseAssessment = adminCreateRes.data?.data?.assessment;
    assert(createdCourseAssessment?.type === 'course', 'Assessment type is course');
    assert(createdCourseAssessment?.moduleId === null, 'Course assessment moduleId is null');
    assert(createdCourseAssessment?.topicId === null, 'Course assessment topicId is null');
    assert(createdCourseAssessment?.maxAttempts === 3, 'Course assessment maxAttempts is 3');
    if (createdCourseAssessment?.id) {
      createdAssessmentIds.push(new mongoose.Types.ObjectId(createdCourseAssessment.id));
    }

    // Admin updates an assessment
    const adminUpdateRes = await request(
      `/api/admin/assessments/${createdCourseAssessment.id}`,
      { method: 'PUT', body: JSON.stringify({ description: 'Updated by Admin' }) },
      adminToken
    );
    assert(adminUpdateRes.status === 200, 'Admin can update any assessment (200 OK)');
    assert(adminUpdateRes.data?.data?.assessment?.description === 'Updated by Admin', 'Assessment updated by admin');

    // Admin views stats
    const adminStatsRes = await request(
      `/api/admin/assessments/${createdCourseAssessment.id}/stats`,
      { method: 'GET' },
      adminToken
    );
    assert(adminStatsRes.status === 200, 'Admin can view assessment stats (200 OK)');
    assert(adminStatsRes.data?.data?.stats?.totalAttempts === 0, 'Stats show 0 attempts initially');

    // -------------------------------------------------------------------------
    // TEST 4: Student access restrictions
    // -------------------------------------------------------------------------
    console.log('\n--- Section 4: Student Role Access Restrictions ---');

    // Student attempts to access Creator endpoint
    const studentCreatorRes = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      { method: 'GET' },
      studentAToken
    );
    assert(studentCreatorRes.status === 403, 'Student cannot access Creator routes (403 Forbidden)');

    // Student attempts to access Admin endpoint
    const studentAdminRes = await request(
      `/api/admin/courses/${course1._id}/assessments`,
      { method: 'GET' },
      studentAToken
    );
    assert(studentAdminRes.status === 403, 'Student cannot access Admin routes (403 Forbidden)');

    // -------------------------------------------------------------------------
    // TEST 5: Draft and archived assessment restrictions
    // -------------------------------------------------------------------------
    console.log('\n--- Section 5: Draft & Archived Assessment Restrictions ---');

    // Create a draft assessment
    const draftAssessment = await Assessment.create({
      title: 'Secret Draft Quiz',
      courseId: course1._id,
      type: 'topic',
      moduleId: module1._id,
      topicId: topic1._id,
      status: 'draft',
      passingScore: 80,
      createdBy: creatorA._id,
      questions: [
        {
          prompt: 'Draft question?',
          options: [
            { _id: new mongoose.Types.ObjectId(), text: 'Opt 1' },
            { _id: new mongoose.Types.ObjectId(), text: 'Opt 2' },
          ],
          correctOptionId: new mongoose.Types.ObjectId(),
        },
      ],
    });
    createdAssessmentIds.push(draftAssessment._id);

    const studentGetDraftRes = await request(
      `/api/student/courses/${course1._id}/assessments/${draftAssessment._id}`,
      { method: 'GET' },
      studentAToken
    );
    assert(studentGetDraftRes.status === 404, 'Student cannot access draft assessment (404 Not Found)');

    const studentStartDraftRes = await request(
      `/api/student/courses/${course1._id}/assessments/${draftAssessment._id}/start`,
      { method: 'POST' },
      studentAToken
    );
    assert(studentStartDraftRes.status === 404, 'Student cannot start draft assessment (404 Not Found)');

    // -------------------------------------------------------------------------
    // TEST 6: Published-course and active-enrollment requirements
    // -------------------------------------------------------------------------
    console.log('\n--- Section 6: Published Course & Active Enrollment Barriers ---');

    // Student B is NOT enrolled in Course 1
    const unenrolledRes = await request(
      `/api/student/courses/${course1._id}/assessments/${createdTopicAssessment.id}`,
      { method: 'GET' },
      studentBToken
    );
    assert(unenrolledRes.status === 403, 'Unenrolled student cannot access assessment (403 Forbidden)');

    const unenrolledStartRes = await request(
      `/api/student/courses/${course1._id}/assessments/${createdTopicAssessment.id}/start`,
      { method: 'POST' },
      studentBToken
    );
    assert(unenrolledStartRes.status === 403, 'Unenrolled student cannot start assessment (403 Forbidden)');

    // Student A attempts to access assessment on draft course
    const draftCourseQuiz = await Assessment.create({
      title: 'Quiz on Draft Course',
      courseId: draftCourse._id,
      type: 'course',
      status: 'published',
      passingScore: 70,
      createdBy: creatorA._id,
      questions: [],
    });
    createdAssessmentIds.push(draftCourseQuiz._id);

    const draftCourseRes = await request(
      `/api/student/courses/${draftCourse._id}/assessments/${draftCourseQuiz._id}`,
      { method: 'GET' },
      studentAToken
    );
    assert(draftCourseRes.status === 403, 'Student cannot access assessment on unpublished course (403 Forbidden)');

    // -------------------------------------------------------------------------
    // TEST 7: Correct answer key excluded from student responses
    // -------------------------------------------------------------------------
    console.log('\n--- Section 7: Correct Answer Key Security ---');

    const studentTopicQuizRes = await request(
      `/api/student/courses/${course1._id}/assessments/${createdTopicAssessment.id}`,
      { method: 'GET' },
      studentAToken
    );

    assert(studentTopicQuizRes.status === 200, 'Enrolled student reads published assessment (200 OK)');
    const studentAssessment = studentTopicQuizRes.data?.data?.assessment;
    assert(Boolean(studentAssessment), 'Assessment data object exists');
    assert(studentAssessment.questions.length === 2, 'Student receives 2 questions');

    // Verify correctOptionId and explanation are NOT leaked in questions
    const hasLeakedCorrectOption = studentAssessment.questions.some((q) => q.correctOptionId !== undefined);
    const hasLeakedExplanation = studentAssessment.questions.some((q) => q.explanation !== undefined);
    assert(!hasLeakedCorrectOption, 'STRICT INVARIANT: correctOptionId is completely absent from student response');
    assert(!hasLeakedExplanation, 'STRICT INVARIANT: explanation is completely absent prior to submission');

    // -------------------------------------------------------------------------
    // TEST 8: Invalid hierarchy rejection
    // -------------------------------------------------------------------------
    console.log('\n--- Section 8: Hierarchy Validation Invariants ---');

    // Topic assessment without topicId
    const missingTopicHierarchyRes = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Invalid Topic Assessment',
          type: 'topic',
          moduleId: module1._id.toString(),
          // missing topicId
        }),
      },
      creatorAToken
    );
    assert(missingTopicHierarchyRes.status === 400, 'Topic assessment missing topicId is rejected (400)');

    // Topic assessment with topic belonging to a different course
    const foreignTopicHierarchyRes = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Foreign Topic Assessment',
          type: 'topic',
          moduleId: module1._id.toString(),
          topicId: topic2._id.toString(), // topic2 belongs to course2
        }),
      },
      creatorAToken
    );
    assert(foreignTopicHierarchyRes.status === 400, 'Topic assessment with mismatching topic is rejected (400)');

    // Course assessment with moduleId/topicId specified
    const courseWithTopicHierarchyRes = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Course with Topic Hierarchy',
          type: 'course',
          moduleId: module1._id.toString(),
          topicId: topic1._id.toString(),
        }),
      },
      creatorAToken
    );
    assert(courseWithTopicHierarchyRes.status === 400, 'Course assessment specifying moduleId/topicId is rejected (400)');

    // -------------------------------------------------------------------------
    // TEST 9: Invalid question and option ID rejection
    // -------------------------------------------------------------------------
    console.log('\n--- Section 9: Question and Option Integrity ---');

    // Question with fewer than 2 options
    const singleOptionRes = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Single Option Assessment',
          type: 'course',
          questions: [
            {
              prompt: 'Is this invalid?',
              options: [{ text: 'Only one option' }],
              correctOptionId: new mongoose.Types.ObjectId().toString(),
            },
          ],
        }),
      },
      creatorAToken
    );
    assert(singleOptionRes.status === 400, 'Question with fewer than 2 options rejected (400)');

    // Question where correctOptionId is not one of the options
    const mismatchedCorrectOptionRes = await request(
      `/api/creator/courses/${course1._id}/assessments`,
      {
        method: 'POST',
        body: JSON.stringify({
          title: 'Mismatched Option Assessment',
          type: 'course',
          questions: [
            {
              prompt: 'Where is the correct option?',
              options: [
                { _id: new mongoose.Types.ObjectId().toString(), text: 'Option A' },
                { _id: new mongoose.Types.ObjectId().toString(), text: 'Option B' },
              ],
              correctOptionId: new mongoose.Types.ObjectId().toString(), // Not in options
            },
          ],
        }),
      },
      creatorAToken
    );
    assert(mismatchedCorrectOptionRes.status === 400, 'Question with non-matching correctOptionId rejected (400)');

    // -------------------------------------------------------------------------
    // TEST 10, 11, 12: Start Attempt, Server-side Score Calculation & Spoof Protection
    // -------------------------------------------------------------------------
    console.log('\n--- Section 10-12: Attempt Execution & Server-Side Scoring ---');

    // Student A starts attempt on Topic Quiz (2 questions: opt2Id correct for Q1, opt3Id correct for Q2)
    const startAttemptRes = await request(
      `/api/student/courses/${course1._id}/assessments/${createdTopicAssessment.id}/start`,
      { method: 'POST' },
      studentAToken
    );

    assert(startAttemptRes.status === 201, 'Student starts new attempt (201 Created)');
    const attemptData = startAttemptRes.data?.data?.attempt;
    assert(attemptData?.status === 'in_progress', 'Attempt status is "in_progress"');
    assert(attemptData?.attemptNumber === 1, 'Attempt number is 1');
    assert(startAttemptRes.data?.data?.isResumed === false, 'isResumed is false for new attempt');

    // TEST 15: Existing in_progress attempt handling
    const resumeAttemptRes = await request(
      `/api/student/courses/${course1._id}/assessments/${createdTopicAssessment.id}/start`,
      { method: 'POST' },
      studentAToken
    );
    assert(resumeAttemptRes.status === 200, 'Calling start while in_progress returns existing attempt (200 OK)');
    assert(resumeAttemptRes.data?.data?.isResumed === true, 'isResumed is true');
    assert(resumeAttemptRes.data?.data?.attempt?.id === attemptData.id, 'Resumed attempt ID matches');

    // TEST 11: Client-submitted score and isPassed rejection (spoofed payload)
    // Student submits Q1 correct (opt2Id), Q2 incorrect (opt4Id) -> 1 of 2 = 50%
    // Client tries to spoof score: 100, isPassed: true
    const submitRes = await request(
      `/api/student/courses/${course1._id}/assessments/${createdTopicAssessment.id}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({
          score: 100, // SPOOF ATTEMPT
          isPassed: true, // SPOOF ATTEMPT
          correctAnswersCount: 2, // SPOOF ATTEMPT
          answers: [
            { questionId: createdTopicAssessment.questions[0].id, selectedOptionId: opt2Id.toString() }, // Correct
            { questionId: createdTopicAssessment.questions[1].id, selectedOptionId: opt4Id.toString() }, // Incorrect
          ],
        }),
      },
      studentAToken
    );

    assert(submitRes.status === 200, 'Student submits assessment attempt (200 OK)');
    const results = submitRes.data?.data?.results;
    assert(results?.totalQuestions === 2, 'totalQuestions is 2');
    assert(results?.correctAnswersCount === 1, 'Server calculated exactly 1 correct answer (spoofed 2 ignored)');
    assert(results?.score === 50, 'Server calculated 50% score (spoofed 100 ignored)');
    assert(results?.isPassed === true, 'isPassed is true (50% >= passingScore 50%)');
    assert(results?.status === 'completed', 'Attempt status transitioned to "completed"');

    // TEST 16: Duplicate submission rejection
    const duplicateSubmitRes = await request(
      `/api/student/courses/${course1._id}/assessments/${createdTopicAssessment.id}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({ answers: [] }),
      },
      studentAToken
    );
    assert(
      duplicateSubmitRes.status === 409 || duplicateSubmitRes.status === 400,
      'Duplicate submission of finalized attempt is rejected (409 Conflict / 400)'
    );

    // -------------------------------------------------------------------------
    // TEST 13: Unlimited topic attempts
    // -------------------------------------------------------------------------
    console.log('\n--- Section 13: Unlimited Topic Attempts ---');

    const topicAttempt2Res = await request(
      `/api/student/courses/${course1._id}/assessments/${createdTopicAssessment.id}/start`,
      { method: 'POST' },
      studentAToken
    );
    assert(topicAttempt2Res.status === 201, 'Student can start 2nd attempt on topic quiz (201 Created)');
    assert(topicAttempt2Res.data?.data?.attempt?.attemptNumber === 2, 'Attempt number incremented to 2');

    // Submit attempt 2 with 100% score (both correct)
    const submit2Res = await request(
      `/api/student/courses/${course1._id}/assessments/${createdTopicAssessment.id}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({
          answers: [
            { questionId: createdTopicAssessment.questions[0].id, selectedOptionId: opt2Id.toString() },
            { questionId: createdTopicAssessment.questions[1].id, selectedOptionId: opt3Id.toString() },
          ],
        }),
      },
      studentAToken
    );
    assert(submit2Res.data?.data?.results?.score === 100, 'Attempt 2 score is 100%');
    assert(submit2Res.data?.data?.results?.correctAnswersCount === 2, 'All 2 questions correct');

    // -------------------------------------------------------------------------
    // TEST 14: Default course final attempt limit (maxAttempts = 3)
    // -------------------------------------------------------------------------
    console.log('\n--- Section 14: Course Final Attempt Limit Enforcement ---');

    // Start & complete attempt 1 on Course Assessment
    const cAttempt1Start = await request(
      `/api/student/courses/${course1._id}/assessments/${createdCourseAssessment.id}/start`,
      { method: 'POST' },
      studentAToken
    );
    assert(cAttempt1Start.status === 201, 'Course final attempt 1 started');
    await request(
      `/api/student/courses/${course1._id}/assessments/${createdCourseAssessment.id}/submit`,
      { method: 'POST', body: JSON.stringify({ answers: [] }) },
      studentAToken
    );

    // Start & complete attempt 2
    const cAttempt2Start = await request(
      `/api/student/courses/${course1._id}/assessments/${createdCourseAssessment.id}/start`,
      { method: 'POST' },
      studentAToken
    );
    assert(cAttempt2Start.status === 201, 'Course final attempt 2 started');
    await request(
      `/api/student/courses/${course1._id}/assessments/${createdCourseAssessment.id}/submit`,
      { method: 'POST', body: JSON.stringify({ answers: [] }) },
      studentAToken
    );

    // Start & complete attempt 3
    const cAttempt3Start = await request(
      `/api/student/courses/${course1._id}/assessments/${createdCourseAssessment.id}/start`,
      { method: 'POST' },
      studentAToken
    );
    assert(cAttempt3Start.status === 201, 'Course final attempt 3 started');
    await request(
      `/api/student/courses/${course1._id}/assessments/${createdCourseAssessment.id}/submit`,
      { method: 'POST', body: JSON.stringify({ answers: [] }) },
      studentAToken
    );

    // Attempt 4 should be rejected because maxAttempts = 3!
    const cAttempt4Start = await request(
      `/api/student/courses/${course1._id}/assessments/${createdCourseAssessment.id}/start`,
      { method: 'POST' },
      studentAToken
    );
    assert(cAttempt4Start.status === 400, '4th attempt blocked when maxAttempts is 3 (400 Bad Request)');
    assert(
      cAttempt4Start.data?.message?.includes('Maximum allowed attempts'),
      'Clear error message explaining attempt limit reached'
    );

    // -------------------------------------------------------------------------
    // TEST 17: Timer deadline enforcement
    // -------------------------------------------------------------------------
    console.log('\n--- Section 17: Server-Authoritative Timer Enforcement ---');

    // Create a timed assessment (1 minute)
    const timedQuiz = await Assessment.create({
      title: 'Rapid Timed Quiz',
      courseId: course1._id,
      type: 'course',
      status: 'published',
      passingScore: 60,
      timeLimitMinutes: 1, // 1 minute
      maxAttempts: 10,
      createdBy: creatorA._id,
      questions: [
        {
          prompt: 'Fast question?',
          options: [
            { _id: new mongoose.Types.ObjectId(), text: 'A' },
            { _id: new mongoose.Types.ObjectId(), text: 'B' },
          ],
          correctOptionId: new mongoose.Types.ObjectId(),
        },
      ],
    });
    createdAssessmentIds.push(timedQuiz._id);

    const timedStartRes = await request(
      `/api/student/courses/${course1._id}/assessments/${timedQuiz._id}/start`,
      { method: 'POST' },
      studentAToken
    );
    assert(timedStartRes.status === 201, 'Timed assessment started');
    const timedAttempt = timedStartRes.data?.data?.attempt;
    assert(Boolean(timedAttempt.expiresAt), 'Server established expiresAt timestamp');

    // Simulate clock expiration in DB
    await AssessmentAttempt.findByIdAndUpdate(timedAttempt.id, {
      expiresAt: new Date(Date.now() - 10000), // Expired 10 seconds ago
    });

    const timedSubmitRes = await request(
      `/api/student/courses/${course1._id}/assessments/${timedQuiz._id}/submit`,
      { method: 'POST', body: JSON.stringify({ answers: [] }) },
      studentAToken
    );
    assert(timedSubmitRes.status === 200, 'Late submission processed');
    assert(
      timedSubmitRes.data?.data?.results?.status === 'timed_out',
      'Attempt status marked as "timed_out" due to expired deadline'
    );

    // -------------------------------------------------------------------------
    // TEST 18: Student attempt isolation
    // -------------------------------------------------------------------------
    console.log('\n--- Section 18: Cross-Student Attempt Isolation ---');

    // Enroll Student B in Course 1
    const enrollmentB1 = await Enrollment.create({
      userId: studentB._id,
      courseId: course1._id,
      status: 'active',
      enrolledAt: new Date(),
    });
    createdEnrollmentIds.push(enrollmentB1._id);

    // Student B lists attempts for Topic Quiz
    const studentBAttemptsRes = await request(
      `/api/student/courses/${course1._id}/assessments/${createdTopicAssessment.id}/attempts`,
      { method: 'GET' },
      studentBToken
    );
    assert(studentBAttemptsRes.status === 200, 'Student B lists attempts');
    assert(
      studentBAttemptsRes.data?.data?.attempts?.length === 0,
      "Student B sees 0 attempts (Student A's attempts are isolated)"
    );

    // Student B attempts to access Student A's attempt review
    const studentBAccessReviewRes = await request(
      `/api/student/courses/${course1._id}/assessments/${createdTopicAssessment.id}/attempts/${attemptData.id}`,
      { method: 'GET' },
      studentBToken
    );
    assert(studentBAccessReviewRes.status === 403, "Student B cannot review Student A's attempt (403 Forbidden)");

    // -------------------------------------------------------------------------
    // TEST 19: Final review available only after finalized submission
    // -------------------------------------------------------------------------
    console.log('\n--- Section 19: Finalized Review Access Invariants ---');

    // Student A reviews their completed Attempt 1
    const studentAReviewRes = await request(
      `/api/student/courses/${course1._id}/assessments/${createdTopicAssessment.id}/attempts/${attemptData.id}`,
      { method: 'GET' },
      studentAToken
    );
    assert(studentAReviewRes.status === 200, 'Student A reviews completed attempt (200 OK)');
    const reviewData = studentAReviewRes.data?.data?.results?.review;
    assert(Array.isArray(reviewData), 'Review questions array provided');
    assert(Boolean(reviewData[0].explanation), 'Question explanation now revealed in finalized review');
    assert(Boolean(reviewData[0].correctOptionId), 'correctOptionId revealed in finalized review');
    assert(reviewData[0].selectedOptionId === opt2Id.toString(), 'Student selected option preserved');
    assert(reviewData[0].isCorrect === true, 'isCorrect indicator preserved');

    // -------------------------------------------------------------------------
    // TEST 20: No sensitive data leakage
    // -------------------------------------------------------------------------
    console.log('\n--- Section 20: Anti-Leakage & Sanitization Verification ---');

    const jsonString = JSON.stringify(studentAReviewRes.data) + JSON.stringify(studentTopicQuizRes.data);
    assert(!jsonString.includes('password'), 'Zero password leakage');
    assert(!jsonString.includes('Password123!'), 'Zero plain password leakage');
    assert(!jsonString.includes('refreshToken'), 'Zero refresh token leakage');
    assert(!jsonString.includes('__v'), 'Zero Mongoose internal __v leakage');

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n--- Cleanup: Purging Test Artifacts ---');
  } catch (err) {
    console.error('Fatal audit error:', err);
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
    console.log('✓ All audit artifacts safely purged from database');
  }

  console.log('\n===================================================================');
  console.log(` Audit 8B Complete: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('===================================================================\n');

  if (failedTests > 0) {
    await mongoose.disconnect();
    process.exit(1);
  } else {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runAudit();
