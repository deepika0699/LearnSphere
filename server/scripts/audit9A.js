import 'dotenv/config';
import mongoose from 'mongoose';
import crypto from 'node:crypto';
import { connectDB, isDbConnected } from '../config/db.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import Enrollment from '../models/Enrollment.js';
import TopicProgress from '../models/TopicProgress.js';
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

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, headers: res.headers, data };
}

async function runAudit() {
  console.log('===================================================================');
  console.log('  LearnSphere Phase 9A — Progress & Assessment Integration Audit   ');
  console.log('===================================================================');

  if (!isDbConnected()) {
    await connectDB();
  }
  console.log('Connected to MongoDB database successfully.');

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
    // SETUP: Fixtures & Users
    // -------------------------------------------------------------------------
    console.log('\n--- Setup: Test Fixtures & Tokens ---');
    const runId = crypto.randomBytes(4).toString('hex');

    // 1. Instructor / Course Creator
    const instructor = await User.create({
      name: `Instructor ${runId}`,
      email: `instructor_${runId}@example.com`,
      password: 'Password123!',
      role: 'courseCreator',
      status: 'active',
    });
    createdUserIds.push(instructor._id);

    // 2. Student A & Student B
    const studentA = await User.create({
      name: `Student A ${runId}`,
      email: `student_a_${runId}@example.com`,
      password: 'Password123!',
      role: 'student',
      status: 'active',
    });
    createdUserIds.push(studentA._id);
    const tokenA = generateAccessToken({ userId: studentA._id, role: studentA.role });

    const studentB = await User.create({
      name: `Student B ${runId}`,
      email: `student_b_${runId}@example.com`,
      password: 'Password123!',
      role: 'student',
      status: 'active',
    });
    createdUserIds.push(studentB._id);
    const tokenB = generateAccessToken({ userId: studentB._id, role: studentB.role });

    // 3. Course 1: Published Course WITH Topic and Course Final Assessment
    const course1 = await Course.create({
      title: `Course 1 Integrated ${runId}`,
      description: 'Testing progress with assessments',
      category: 'Computer Science',
      status: 'published',
      courseCreator: instructor._id,
    });
    createdCourseIds.push(course1._id);

    const mod1 = await Module.create({
      courseId: course1._id,
      title: 'Module 1',
      order: 1,
    });
    createdModuleIds.push(mod1._id);

    const topic1 = await Topic.create({
      courseId: course1._id,
      moduleId: mod1._id,
      title: 'Topic 1 with Quiz',
      order: 1,
    });
    createdTopicIds.push(topic1._id);

    const topic2 = await Topic.create({
      courseId: course1._id,
      moduleId: mod1._id,
      title: 'Topic 2 Standard',
      order: 2,
    });
    createdTopicIds.push(topic2._id);

    // Topic 1 Quiz Assessment
    const optQ1A = new mongoose.Types.ObjectId();
    const optQ1B = new mongoose.Types.ObjectId();
    const topicQuiz = await Assessment.create({
      title: 'Topic 1 Quiz',
      description: 'Practice quiz for Topic 1',
      courseId: course1._id,
      type: 'topic',
      moduleId: mod1._id,
      topicId: topic1._id,
      status: 'published',
      passingScore: 60,
      questions: [
        {
          prompt: 'What is 2 + 2?',
          order: 1,
          options: [
            { _id: optQ1A, text: '4', order: 1 },
            { _id: optQ1B, text: '5', order: 2 },
          ],
          correctOptionId: optQ1A,
          explanation: '2 + 2 equals 4',
        },
      ],
      createdBy: instructor._id,
    });
    createdAssessmentIds.push(topicQuiz._id);

    // Course 1 Final Assessment (Capstone)
    const optFinalA = new mongoose.Types.ObjectId();
    const optFinalB = new mongoose.Types.ObjectId();
    const courseFinal = await Assessment.create({
      title: 'Course 1 Final Exam',
      description: 'Comprehensive capstone exam for Course 1',
      courseId: course1._id,
      type: 'course',
      status: 'published',
      passingScore: 75,
      questions: [
        {
          prompt: 'What is the primary key of a relational database?',
          order: 1,
          options: [
            { _id: optFinalA, text: 'Unique record identifier', order: 1 },
            { _id: optFinalB, text: 'Random string', order: 2 },
          ],
          correctOptionId: optFinalA,
          explanation: 'A primary key uniquely identifies each record',
        },
      ],
      createdBy: instructor._id,
    });
    createdAssessmentIds.push(courseFinal._id);

    // Course 2: Published Course WITHOUT Assessments (Topic only baseline)
    const course2 = await Course.create({
      title: `Course 2 Topics Only ${runId}`,
      description: 'Course without assessments baseline',
      category: 'Mathematics',
      status: 'published',
      courseCreator: instructor._id,
    });
    createdCourseIds.push(course2._id);

    const mod2 = await Module.create({
      courseId: course2._id,
      title: 'Module 2',
      order: 1,
    });
    createdModuleIds.push(mod2._id);

    const topic3 = await Topic.create({
      courseId: course2._id,
      moduleId: mod2._id,
      title: 'Topic 3 Math',
      order: 1,
    });
    createdTopicIds.push(topic3._id);

    // Draft Assessment (should NEVER count toward requirements)
    const draftQuiz = await Assessment.create({
      title: 'Draft Quiz',
      courseId: course1._id,
      type: 'topic',
      moduleId: mod1._id,
      topicId: topic2._id,
      status: 'draft',
      passingScore: 70,
      questions: [
        {
          prompt: 'Draft question?',
          options: [
            { text: 'A', order: 1 },
            { text: 'B', order: 2 },
          ],
          correctOptionId: new mongoose.Types.ObjectId(),
        },
      ],
      createdBy: instructor._id,
    });
    createdAssessmentIds.push(draftQuiz._id);

    // Enroll Student A and Student B in Course 1
    const enrollA1 = await Enrollment.create({
      userId: studentA._id,
      courseId: course1._id,
      status: 'active',
      enrolledAt: new Date(),
    });
    createdEnrollmentIds.push(enrollA1._id);

    const enrollB1 = await Enrollment.create({
      userId: studentB._id,
      courseId: course1._id,
      status: 'active',
      enrolledAt: new Date(),
    });
    createdEnrollmentIds.push(enrollB1._id);

    // Enroll Student A in Course 2 (baseline course)
    const enrollA2 = await Enrollment.create({
      userId: studentA._id,
      courseId: course2._id,
      status: 'active',
      enrolledAt: new Date(),
    });
    createdEnrollmentIds.push(enrollA2._id);

    assert(true, 'Fixtures, courses, modules, topics, and assessments initialized successfully');

    // -------------------------------------------------------------------------
    // SECTION 1: GET COURSE ASSESSMENTS ENDPOINT & INVARIANTS
    // -------------------------------------------------------------------------
    console.log('\n--- Section 1: GET /api/student/courses/:courseId/assessments ---');

    // Unauthenticated access
    const unauthAssessRes = await request(`/api/student/courses/${course1._id}/assessments`);
    assert(unauthAssessRes.status === 401, 'Unauthenticated request returns 401 Unauthorized');

    // Enrolled Student A lists assessments
    const studentAssessRes = await request(`/api/student/courses/${course1._id}/assessments`, {}, tokenA);
    assert(studentAssessRes.status === 200, 'Enrolled student gets 200 OK');
    assert(studentAssessRes.data?.status === 'success', 'Response status is "success"');

    const assessList = studentAssessRes.data?.data?.assessments || [];
    assert(assessList.length === 2, 'Exactly 2 published assessments returned (draft excluded)');

    // Verify correctOptionId & explanation are strictly absent from student response
    const leakedCorrect = assessList.some((a) => 'correctOptionId' in a || (a.questions && a.questions.some((q) => 'correctOptionId' in q)));
    assert(!leakedCorrect, 'STRICT: correctOptionId is completely absent from student assessments list');

    const leakedExpl = assessList.some((a) => 'explanation' in a || (a.questions && a.questions.some((q) => 'explanation' in q)));
    assert(!leakedExpl, 'STRICT: explanation is completely absent from student assessments list');

    // Check individual items
    const topicQuizItem = assessList.find((a) => a.id === topicQuiz._id.toString());
    assert(topicQuizItem?.type === 'topic', 'Topic quiz has type "topic"');
    assert(topicQuizItem?.topicId === topic1._id.toString(), 'Topic quiz has matching topicId');
    assert(topicQuizItem?.status === 'not_started', 'Initial status is "not_started"');
    assert(topicQuizItem?.isPassed === false, 'isPassed is initially false');

    const finalExamItem = assessList.find((a) => a.id === courseFinal._id.toString());
    assert(finalExamItem?.type === 'course', 'Course exam has type "course"');
    assert(finalExamItem?.topicId === null, 'Course exam topicId is null');
    assert(finalExamItem?.status === 'not_started', 'Course exam status is "not_started"');

    // -------------------------------------------------------------------------
    // SECTION 2: BASELINE PROGRESS SUMMARY (COURSE 2: TOPICS ONLY)
    // -------------------------------------------------------------------------
    console.log('\n--- Section 2: Progress Summary Baseline (Course Without Assessments) ---');

    const initSummary2 = await request(`/api/student/progress/${course2._id}/summary`, {}, tokenA);
    assert(initSummary2.status === 200, 'Baseline course progress summary returns 200 OK');
    assert(initSummary2.data?.data?.totalTopics === 1, 'Course 2 totalTopics === 1');
    assert(initSummary2.data?.data?.completedTopics === 0, 'Course 2 completedTopics === 0');
    assert(initSummary2.data?.data?.completionPercentage === 0, 'Course 2 completionPercentage === 0');
    assert(initSummary2.data?.data?.totalAssessments === 0, 'Course 2 totalAssessments === 0');
    assert(initSummary2.data?.data?.allAssessmentsPassed === true, 'Course 2 allAssessmentsPassed is true (0 assessments)');
    assert(initSummary2.data?.data?.isCompleted === false, 'Course 2 isCompleted is false');

    // Complete Topic 3 in Course 2
    const compT3 = await request(`/api/student/progress/${course2._id}/${topic3._id}`, { method: 'PUT' }, tokenA);
    assert(compT3.status === 200, 'Student A completes Topic 3');

    const completedSummary2 = await request(`/api/student/progress/${course2._id}/summary`, {}, tokenA);
    assert(completedSummary2.data?.data?.completedTopics === 1, 'Course 2 completedTopics === 1');
    assert(completedSummary2.data?.data?.completionPercentage === 100, 'Course 2 completionPercentage === 100%');
    assert(completedSummary2.data?.data?.isCompleted === true, 'Course 2 isCompleted === true when all topics done (0 assessments)');

    // -------------------------------------------------------------------------
    // SECTION 3: INTEGRATED PROGRESS SUMMARY (COURSE 1: TOPICS + ASSESSMENTS)
    // -------------------------------------------------------------------------
    console.log('\n--- Section 3: Course 1 Progress with Topics and Assessments ---');

    // Stage 1: Nothing completed
    const summary1Stage1 = await request(`/api/student/progress/${course1._id}/summary`, {}, tokenA);
    assert(summary1Stage1.status === 200, 'Course 1 summary returns 200 OK');
    assert(summary1Stage1.data?.data?.totalTopics === 2, 'totalTopics === 2');
    assert(summary1Stage1.data?.data?.completedTopics === 0, 'completedTopics === 0');
    assert(summary1Stage1.data?.data?.totalAssessments === 2, 'totalAssessments === 2 (published only)');
    assert(summary1Stage1.data?.data?.passedAssessments === 0, 'passedAssessments === 0');
    assert(summary1Stage1.data?.data?.allAssessmentsPassed === false, 'allAssessmentsPassed === false');
    assert(summary1Stage1.data?.data?.isCompleted === false, 'isCompleted === false');

    // Stage 2: Complete all topics, but ZERO assessments taken
    await request(`/api/student/progress/${course1._id}/${topic1._id}`, { method: 'PUT' }, tokenA);
    await request(`/api/student/progress/${course1._id}/${topic2._id}`, { method: 'PUT' }, tokenA);

    const summary1Stage2 = await request(`/api/student/progress/${course1._id}/summary`, {}, tokenA);
    assert(summary1Stage2.data?.data?.completedTopics === 2, 'completedTopics === 2 of 2');
    assert(summary1Stage2.data?.data?.completionPercentage === 100, 'Topic completion percentage === 100%');
    assert(summary1Stage2.data?.data?.passedAssessments === 0, 'passedAssessments === 0');
    assert(summary1Stage2.data?.data?.allAssessmentsPassed === false, 'allAssessmentsPassed === false');
    assert(
      summary1Stage2.data?.data?.isCompleted === false,
      'STRICT: Course is NOT completed when topics are done but published assessments are unpassed'
    );

    // Stage 3: Attempt Topic Quiz but FAIL it (selectedOption = wrong answer)
    const startQuizRes = await request(`/api/student/courses/${course1._id}/assessments/${topicQuiz._id}/start`, { method: 'POST' }, tokenA);
    assert(startQuizRes.status === 201, 'Student A starts Topic 1 Quiz');

    const failQuizRes = await request(
      `/api/student/courses/${course1._id}/assessments/${topicQuiz._id}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({
          answers: [{ questionId: topicQuiz.questions[0]._id.toString(), selectedOptionId: optQ1B.toString() }], // wrong option
        }),
      },
      tokenA
    );
    assert(failQuizRes.status === 200, 'Topic Quiz submission accepted');
    assert(failQuizRes.data?.data?.results?.isPassed === false, 'Attempt evaluated as failed (score: 0% < 60%)');

    // Verify summary reflects failed assessment
    const summary1Stage3 = await request(`/api/student/progress/${course1._id}/summary`, {}, tokenA);
    assert(summary1Stage3.data?.data?.passedAssessments === 0, 'passedAssessments remains 0 after failed attempt');
    assert(summary1Stage3.data?.data?.isCompleted === false, 'isCompleted remains false after failed assessment');

    // Stage 4: Retake Topic Quiz and PASS it (selectedOption = correct answer)
    const restartQuizRes = await request(`/api/student/courses/${course1._id}/assessments/${topicQuiz._id}/start`, { method: 'POST' }, tokenA);
    assert(restartQuizRes.status === 201, 'Student A starts 2nd attempt on Topic Quiz');

    const passQuizRes = await request(
      `/api/student/courses/${course1._id}/assessments/${topicQuiz._id}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({
          answers: [{ questionId: topicQuiz.questions[0]._id.toString(), selectedOptionId: optQ1A.toString() }], // correct option
        }),
      },
      tokenA
    );
    assert(passQuizRes.status === 200, 'Topic Quiz 2nd attempt submitted');
    assert(passQuizRes.data?.data?.results?.isPassed === true, 'Topic Quiz passed (100% >= 60%)');

    // Check summary after 1 of 2 assessments passed
    const summary1Stage4 = await request(`/api/student/progress/${course1._id}/summary`, {}, tokenA);
    assert(summary1Stage4.data?.data?.passedAssessments === 1, 'passedAssessments is now 1 of 2');
    assert(summary1Stage4.data?.data?.allAssessmentsPassed === false, 'allAssessmentsPassed is false (1 of 2)');
    assert(summary1Stage4.data?.data?.isCompleted === false, 'isCompleted is still false (final exam remaining)');

    // Stage 5: Pass the Course Final Exam
    await request(`/api/student/courses/${course1._id}/assessments/${courseFinal._id}/start`, { method: 'POST' }, tokenA);
    const passFinalRes = await request(
      `/api/student/courses/${course1._id}/assessments/${courseFinal._id}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({
          answers: [{ questionId: courseFinal.questions[0]._id.toString(), selectedOptionId: optFinalA.toString() }],
        }),
      },
      tokenA
    );
    assert(passFinalRes.status === 200, 'Course Final Exam submitted');
    assert(passFinalRes.data?.data?.results?.isPassed === true, 'Course Final Exam passed (100% >= 75%)');

    // Stage 6: Verify full course completion
    const summary1Stage6 = await request(`/api/student/progress/${course1._id}/summary`, {}, tokenA);
    assert(summary1Stage6.data?.data?.completedTopics === 2, 'completedTopics === 2');
    assert(summary1Stage6.data?.data?.totalAssessments === 2, 'totalAssessments === 2');
    assert(summary1Stage6.data?.data?.passedAssessments === 2, 'passedAssessments === 2');
    assert(summary1Stage6.data?.data?.allAssessmentsPassed === true, 'allAssessmentsPassed === true (2/2)');
    assert(
      summary1Stage6.data?.data?.isCompleted === true,
      'STRICT: Course is complete when all topics are completed AND all assessments are passed'
    );

    // -------------------------------------------------------------------------
    // SECTION 4: DETAILED COURSE PROGRESS ENDPOINT (/api/student/progress/:courseId)
    // -------------------------------------------------------------------------
    console.log('\n--- Section 4: GET /api/student/progress/:courseId Details ---');

    const courseProgRes = await request(`/api/student/progress/${course1._id}`, {}, tokenA);
    assert(courseProgRes.status === 200, 'GET course progress returns 200 OK');

    const progData = courseProgRes.data?.data;
    assert(progData?.completedCount === 2, 'completedCount === 2');
    assert(progData?.completedTopicIds?.length === 2, 'completedTopicIds has 2 topics');
    assert(Array.isArray(progData?.assessments), 'assessments array is present in progress response');
    assert(progData?.assessments?.length === 2, 'assessments array contains 2 published assessments');
    assert(progData?.passedAssessmentCount === 2, 'passedAssessmentCount === 2');
    assert(progData?.totalAssessmentsCount === 2, 'totalAssessmentsCount === 2');

    const quizProgress = progData?.assessments?.find((a) => a.id === topicQuiz._id.toString());
    assert(quizProgress?.isPassed === true, 'Topic Quiz isPassed is true');
    assert(quizProgress?.status === 'passed', 'Topic Quiz status is "passed"');
    assert(quizProgress?.attemptsCount === 2, 'Topic Quiz attemptsCount === 2');
    assert(quizProgress?.bestScore === 100, 'Topic Quiz bestScore === 100');

    const finalProgress = progData?.assessments?.find((a) => a.id === courseFinal._id.toString());
    assert(finalProgress?.isPassed === true, 'Course Final isPassed is true');
    assert(finalProgress?.status === 'passed', 'Course Final status is "passed"');
    assert(finalProgress?.bestScore === 100, 'Course Final bestScore === 100');

    // -------------------------------------------------------------------------
    // SECTION 5: STUDENT DASHBOARD INTEGRATION
    // -------------------------------------------------------------------------
    console.log('\n--- Section 5: Student Dashboard Integration ---');

    const dashRes = await request('/api/student/dashboard', {}, tokenA);
    assert(dashRes.status === 200, 'GET student dashboard returns 200 OK');

    const dashData = dashRes.data?.data;
    assert(dashData?.stats?.totalEnrollments === 2, 'stats.totalEnrollments === 2');
    assert(dashData?.stats?.completedCourses === 2, 'stats.completedCourses === 2 (both Course 1 & 2 complete)');
    assert(dashData?.stats?.inProgressCourses === 0, 'stats.inProgressCourses === 0');

    const dashC1 = dashData?.courses?.find((c) => c.courseId === course1._id.toString());
    assert(dashC1?.totalTopics === 2, 'Course 1 totalTopics === 2');
    assert(dashC1?.completedTopics === 2, 'Course 1 completedTopics === 2');
    assert(dashC1?.totalAssessments === 2, 'Course 1 totalAssessments === 2');
    assert(dashC1?.passedAssessments === 2, 'Course 1 passedAssessments === 2');
    assert(dashC1?.allAssessmentsPassed === true, 'Course 1 allAssessmentsPassed === true');
    assert(dashC1?.isCompleted === true, 'Course 1 isCompleted === true');

    const dashC2 = dashData?.courses?.find((c) => c.courseId === course2._id.toString());
    assert(dashC2?.totalAssessments === 0, 'Course 2 totalAssessments === 0');
    assert(dashC2?.passedAssessments === 0, 'Course 2 passedAssessments === 0');
    assert(dashC2?.allAssessmentsPassed === true, 'Course 2 allAssessmentsPassed === true');
    assert(dashC2?.isCompleted === true, 'Course 2 isCompleted === true');

    // -------------------------------------------------------------------------
    // SECTION 6: CROSS-STUDENT ISOLATION
    // -------------------------------------------------------------------------
    console.log('\n--- Section 6: Cross-Student Isolation Verification ---');

    // Student B has taken ZERO topics and ZERO assessments
    const summaryB = await request(`/api/student/progress/${course1._id}/summary`, {}, tokenB);
    assert(summaryB.status === 200, 'Student B summary returns 200 OK');
    assert(summaryB.data?.data?.completedTopics === 0, 'Student B completedTopics is strictly 0 (no leak from Student A)');
    assert(summaryB.data?.data?.passedAssessments === 0, 'Student B passedAssessments is strictly 0 (no leak from Student A)');
    assert(summaryB.data?.data?.allAssessmentsPassed === false, 'Student B allAssessmentsPassed is false');
    assert(summaryB.data?.data?.isCompleted === false, 'Student B isCompleted is false');

    const progB = await request(`/api/student/progress/${course1._id}`, {}, tokenB);
    assert(progB.data?.data?.completedCount === 0, 'Student B completedCount is 0');
    assert(progB.data?.data?.passedAssessmentCount === 0, 'Student B passedAssessmentCount is 0');
    assert(progB.data?.data?.passedAssessmentIds?.length === 0, 'Student B passedAssessmentIds is empty []');

    const dashB = await request('/api/student/dashboard', {}, tokenB);
    assert(dashB.data?.data?.stats?.completedCourses === 0, 'Student B completedCourses === 0');
    assert(dashB.data?.data?.stats?.inProgressCourses === 0, 'Student B inProgressCourses === 0');
    const dashBC1 = dashB.data?.data?.courses?.find((c) => c.courseId === course1._id.toString());
    assert(dashBC1?.completedTopics === 0, 'Student B dashboard course completedTopics === 0');
    assert(dashBC1?.passedAssessments === 0, 'Student B dashboard course passedAssessments === 0');
    assert(dashBC1?.isCompleted === false, 'Student B dashboard course isCompleted === false');

    // -------------------------------------------------------------------------
    // SECTION 7: ANTI-SLOP & SECURITY INVARIANTS
    // -------------------------------------------------------------------------
    console.log('\n--- Section 7: Anti-Slop & Zero Information Disclosure ---');

    const serializedDash = JSON.stringify(dashData);
    assert(!serializedDash.includes('"xp"'), 'Zero fake "xp" metrics in dashboard');
    assert(!serializedDash.includes('"streak"'), 'Zero fake "streak" metrics in dashboard');
    assert(!serializedDash.includes('"level"'), 'Zero fake "level" metrics in dashboard');
    assert(!serializedDash.includes('"rating"'), 'Zero fake "rating" metrics in dashboard');
    assert(!serializedDash.includes('password'), 'Zero password leakage');
    assert(!serializedDash.includes('refreshToken'), 'Zero refresh token leakage');
    assert(!serializedDash.includes('__v'), 'Zero Mongoose internal __v leakage');

    // Uncomplete Topic 2 for Student A and verify course drops back to not completed
    console.log('\n--- Section 8: Topic Incomplete Reaction ---');
    const uncompRes = await request(`/api/student/progress/${course1._id}/${topic2._id}`, { method: 'DELETE' }, tokenA);
    assert(uncompRes.status === 200, 'Student A marks Topic 2 incomplete');

    const summaryAfterUncomp = await request(`/api/student/progress/${course1._id}/summary`, {}, tokenA);
    assert(summaryAfterUncomp.data?.data?.completedTopics === 1, 'completedTopics dropped to 1');
    assert(summaryAfterUncomp.data?.data?.passedAssessments === 2, 'Assessments remain passed (2/2)');
    assert(summaryAfterUncomp.data?.data?.allAssessmentsPassed === true, 'allAssessmentsPassed is true');
    assert(
      summaryAfterUncomp.data?.data?.isCompleted === false,
      'isCompleted reverts to false because Topic 2 is now incomplete'
    );

  } catch (err) {
    console.error('Fatal error during Phase 9A audit execution:', err);
    totalTests++;
    failedTests++;
  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n--- Cleanup: Purging Test Artifacts ---');
    await AssessmentAttempt.deleteMany({
      $or: [
        { userId: { $in: createdUserIds } },
        { courseId: { $in: createdCourseIds } },
      ],
    });
    await TopicProgress.deleteMany({
      $or: [
        { userId: { $in: createdUserIds } },
        { courseId: { $in: createdCourseIds } },
      ],
    });
    await Enrollment.deleteMany({
      $or: [
        { userId: { $in: createdUserIds } },
        { courseId: { $in: createdCourseIds } },
      ],
    });
    await Assessment.deleteMany({ _id: { $in: createdAssessmentIds } });
    await Topic.deleteMany({ _id: { $in: createdTopicIds } });
    await Module.deleteMany({ _id: { $in: createdModuleIds } });
    await Course.deleteMany({ _id: { $in: createdCourseIds } });
    await User.deleteMany({ _id: { $in: createdUserIds } });

    console.log('✓ All audit artifacts safely purged from database');
    await mongoose.connection.close();
  }

  console.log('===================================================================');
  console.log(` Audit 9A Complete: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('===================================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runAudit();
