/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LearnSphere — Phase 12A Verification Suite: Student Enrollment & Learning Access
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from '../config/db.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import Assessment from '../models/Assessment.js';
import AssessmentAttempt from '../models/AssessmentAttempt.js';
import Enrollment from '../models/Enrollment.js';
import TopicProgress from '../models/TopicProgress.js';
import RefreshSession from '../models/RefreshSession.js';

const BASE_URL = 'http://localhost:5000';
const SHOWCASE_COURSE_ID = '6abe9dc2f15c2b4f6008ac1c';

const EXPECTED_ASSESSMENT_IDS = [
  '6accf31c46f0619136e9a58c',
  '6accfc1d73e013522f2da030',
  '6acd018dfdf30e469e01ca9f',
  '6acd09c733d8ffe6e77952c9',
  '6acd0b4d39e7ba97f4ebc48c',
  '6acd0cc4d3ffa1e71750ba8a',
  '6acd144048bf3717712a5cee',
  '6acd17822bdf0d335a75c989',
  '6ad19c6b4fbe139ddad65c08',
];

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
  const res = await fetch(url, { ...options, headers });
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

async function runEnrollmentFlowVerification() {
  console.log('========================================================================');
  console.log('=== LearnSphere — Phase 12A: Student Enrollment & Access Flow Suite   ===');
  console.log('========================================================================\n');

  if (!isDbConnected()) {
    await connectDB();
  }

  const createdUserIds = [];
  const createdCourseIds = [];
  let testStudentToken = null;
  let testStudentId = null;
  let secondStudentToken = null;
  let secondStudentId = null;

  try {
    // -------------------------------------------------------------------------
    // 1. Mandatory Preflight Inspection
    // -------------------------------------------------------------------------
    console.log('--- Step 1: Preflight State Verification ---');
    const course = await Course.findById(SHOWCASE_COURSE_ID);
    assert(Boolean(course), `Showcase course ${SHOWCASE_COURSE_ID} exists`);
    assert(course.status === 'published', `Course status is 'published' (actual: '${course.status}')`);

    const modulesCount = await Module.countDocuments({ courseId: SHOWCASE_COURSE_ID });
    assert(modulesCount === 8, `Showcase course has 8 modules (actual: ${modulesCount})`);

    const topicsCount = await Topic.countDocuments({ courseId: SHOWCASE_COURSE_ID });
    assert(topicsCount === 73, `Showcase course has 73 topics (actual: ${topicsCount})`);

    const assessmentsCount = await Assessment.countDocuments({ courseId: SHOWCASE_COURSE_ID });
    assert(assessmentsCount === 9, `Showcase course has 9 assessments (actual: ${assessmentsCount})`);

    // -------------------------------------------------------------------------
    // 2. Student Registration Flow
    // -------------------------------------------------------------------------
    console.log('\n--- Step 2: Student Registration Flow & Privilege Controls ---');
    const timestamp = Date.now();
    const testEmail = `student.phase12a.${timestamp}@learnsphere.io`;
    const testPassword = 'Strong!Password123#';
    const testName = 'Jane Learner';

    // 2a. Normal valid registration
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
        role: 'admin', // Attack simulation: client tries to escalate to admin
      }),
    });

    assert(regRes.status === 201, 'POST /api/auth/register returns 201 Created');
    assert(regRes.data?.status === 'success', 'Registration status is "success"');
    const registeredUser = regRes.data?.data?.user;
    assert(Boolean(registeredUser?.id), 'Response includes user ID');
    assert(registeredUser?.email === testEmail, 'Response includes correct email');
    assert(registeredUser?.name === testName, 'Response includes correct name');
    assert(registeredUser?.role === 'student', 'Privilege escalation prevented: role is strictly "student"');
    assert(!('password' in (registeredUser || {})), 'Password is not exposed in registration response');
    assert(!('passwordHash' in (registeredUser || {})), 'Password hash is not exposed in registration response');

    testStudentId = registeredUser.id;
    createdUserIds.push(testStudentId);

    // 2b. Verify password hashed with bcrypt in database
    const dbUser = await User.findById(testStudentId).select('+password');
    assert(Boolean(dbUser?.password), 'User has hashed password in MongoDB');
    assert(dbUser.password.startsWith('$2'), 'Password uses bcrypt hash format');
    assert(dbUser.password !== testPassword, 'Plaintext password is never stored');

    // 2c. Duplicate registration with same email
    const dupRegRes = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Another Name',
        email: testEmail,
        password: 'AnotherPassword123#',
      }),
    });
    assert(dupRegRes.status === 409, 'Duplicate email registration returns 409 Conflict');

    // 2d. Invalid registration input validation
    const invalidRegRes = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'A', // too short (<2)
        email: 'not-an-email',
        password: 'short', // <8
      }),
    });
    assert(invalidRegRes.status === 400, 'Invalid registration payload returns 400 Bad Request');

    // -------------------------------------------------------------------------
    // 3. Student Login Flow
    // -------------------------------------------------------------------------
    console.log('\n--- Step 3: Student Login Flow ---');
    // 3a. Invalid credentials
    const badLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword!' }),
    });
    assert(badLoginRes.status === 401, 'Invalid password returns 401 Unauthorized');

    // 3b. Valid credentials
    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    assert(loginRes.status === 200, 'Valid login returns 200 OK');
    assert(Boolean(loginRes.data?.data?.accessToken), 'Login returns access token');
    assert(loginRes.data?.data?.user?.role === 'student', 'Login user object confirms student role');
    testStudentToken = loginRes.data?.data?.accessToken;

    // Verify Set-Cookie header contains HttpOnly refreshToken
    const setCookieHeader = loginRes.headers.get('set-cookie') || '';
    assert(setCookieHeader.includes('refreshToken='), 'Login sets refreshToken cookie');
    assert(setCookieHeader.toLowerCase().includes('httponly'), 'refreshToken cookie has HttpOnly flag');

    // -------------------------------------------------------------------------
    // 4. Published Course Discovery
    // -------------------------------------------------------------------------
    console.log('\n--- Step 4: Published Course Discovery & Structure ---');
    const catalogRes = await request('/api/courses', {}, testStudentToken);
    assert(catalogRes.status === 200, 'GET /api/courses returns 200 OK for student');
    const coursesList = catalogRes.data?.data?.courses || [];
    assert(coursesList.some((c) => c.id === SHOWCASE_COURSE_ID), 'Showcase course is visible in catalog');

    const detailsRes = await request(`/api/courses/${SHOWCASE_COURSE_ID}`, {}, testStudentToken);
    assert(detailsRes.status === 200, 'GET /api/courses/:id returns 200 OK');
    assert(detailsRes.data?.data?.course?.status === 'published', 'Course status is published');

    const structureRes = await request(`/api/courses/${SHOWCASE_COURSE_ID}/structure`, {}, testStudentToken);
    assert(structureRes.status === 200, 'GET /api/courses/:id/structure returns 200 OK');
    const modules = structureRes.data?.data?.modules || [];
    assert(modules.length === 8, 'Course structure delivers 8 modules');
    const firstModule = modules[0];
    const firstTopic = firstModule?.topics?.[0];
    assert(Boolean(firstTopic), 'First topic is present in module structure');

    // -------------------------------------------------------------------------
    // 5. Unauthenticated and Non-Enrolled Access Protections
    // -------------------------------------------------------------------------
    console.log('\n--- Step 5: Non-Enrolled Access Rejection & Boundaries ---');
    // 5a. Unauthenticated enrollment attempt
    const unauthEnroll = await request(`/api/student/enroll/${SHOWCASE_COURSE_ID}`, { method: 'POST' });
    assert(unauthEnroll.status === 401, 'Unauthenticated enrollment returns 401 Unauthorized');

    // 5b. Authenticated non-enrolled enrollment check returns 404
    const nonEnrolledCheck = await request(`/api/student/enrollments/${SHOWCASE_COURSE_ID}`, {}, testStudentToken);
    assert(nonEnrolledCheck.status === 404, 'Non-enrolled GET /api/student/enrollments/:courseId returns 404 Not Found');

    // 5c. Authenticated non-enrolled assessment list returns 403
    const nonEnrolledAssessments = await request(`/api/student/courses/${SHOWCASE_COURSE_ID}/assessments`, {}, testStudentToken);
    assert(nonEnrolledAssessments.status === 403, 'Non-enrolled student accessing assessments returns 403 Forbidden');
    assert(
      nonEnrolledAssessments.data?.message?.includes('actively enrolled'),
      'Assessment access message specifies enrollment requirement'
    );

    // 5d. Authenticated non-enrolled topic progress update returns 403
    const nonEnrolledProgress = await request(
      `/api/student/progress/${SHOWCASE_COURSE_ID}/${firstTopic.id}`,
      { method: 'PUT' },
      testStudentToken
    );
    assert(nonEnrolledProgress.status === 403, 'Non-enrolled student updating topic progress returns 403 Forbidden');

    // -------------------------------------------------------------------------
    // 6. Authenticated Enrollment Execution & Persistence
    // -------------------------------------------------------------------------
    console.log('\n--- Step 6: Authenticated Enrollment Execution & Persistence ---');
    // Attack simulation: student passes foreign userId in body
    const enrollRes = await request(
      `/api/student/enroll/${SHOWCASE_COURSE_ID}`,
      {
        method: 'POST',
        body: JSON.stringify({
          userId: '600000000000000000000001', // Spoofed user ID
          status: 'completed', // Spoofed status
        }),
      },
      testStudentToken
    );

    assert(enrollRes.status === 201, 'POST /api/student/enroll/:courseId returns 201 Created');
    assert(enrollRes.data?.status === 'success', 'Enrollment response status is "success"');
    const enrollmentData = enrollRes.data?.data?.enrollment;
    assert(enrollmentData?.courseId === SHOWCASE_COURSE_ID, 'Enrollment record matches showcase course ID');
    assert(enrollmentData?.status === 'active', 'Enrollment status defaults to "active", ignoring spoofed "completed"');
    assert(Boolean(enrollmentData?.enrolledAt), 'Enrollment includes valid timestamp');

    // 6b. Verify MongoDB persistence
    const savedEnrollment = await Enrollment.findOne({
      userId: new mongoose.Types.ObjectId(testStudentId),
      courseId: new mongoose.Types.ObjectId(SHOWCASE_COURSE_ID),
    });
    assert(Boolean(savedEnrollment), 'Enrollment successfully persisted in MongoDB');
    assert(savedEnrollment.status === 'active', 'MongoDB record status is "active"');
    assert(savedEnrollment.userId.toString() === testStudentId, 'MongoDB record userId strictly matches authenticated student, ignoring body spoofing');

    // 6c. Verify student enrollment query endpoint returns 200 OK
    const enrolledCheckRes = await request(`/api/student/enrollments/${SHOWCASE_COURSE_ID}`, {}, testStudentToken);
    assert(enrolledCheckRes.status === 200, 'Enrolled student GET /api/student/enrollments/:courseId returns 200 OK');
    assert(enrolledCheckRes.data?.data?.enrollment?.status === 'active', 'Retrieved enrollment is active');

    // 6d. Duplicate enrollment prevention
    const dupEnrollRes = await request(`/api/student/enroll/${SHOWCASE_COURSE_ID}`, { method: 'POST' }, testStudentToken);
    assert(dupEnrollRes.status === 409, 'Duplicate enrollment attempt returns 409 Conflict');
    assert(dupEnrollRes.data?.message?.includes('already enrolled'), 'Conflict error clearly states already enrolled');

    const totalEnrollmentsForStudent = await Enrollment.countDocuments({
      userId: new mongoose.Types.ObjectId(testStudentId),
      courseId: new mongoose.Types.ObjectId(SHOWCASE_COURSE_ID),
    });
    assert(totalEnrollmentsForStudent === 1, 'Exactly one enrollment record exists in MongoDB after duplicate attempt');

    // -------------------------------------------------------------------------
    // 7. Enrolled Learning & Content Access Flow
    // -------------------------------------------------------------------------
    console.log('\n--- Step 7: Enrolled Course Content & Topic Navigation ---');
    // Fetch educational content for topics across modules
    const sampleTopicRes = await request(
      `/api/courses/${SHOWCASE_COURSE_ID}/modules/${firstModule.id}/topics/${firstTopic.id}`,
      {},
      testStudentToken
    );
    assert(sampleTopicRes.status === 200, 'GET topic content returns 200 OK');
    const topicData = sampleTopicRes.data?.data?.topic;
    assert(Boolean(topicData?.title), 'Topic content includes title');
    assert(Boolean(topicData?.content), 'Topic content includes educational sections/text');
    assert(Array.isArray(topicData?.importantPoints), 'Topic content includes importantPoints array');

    // Test a topic from a later module (e.g. Module 5)
    const module5 = modules[4];
    const module5Topic = module5?.topics?.[0];
    assert(Boolean(module5Topic), 'Module 5 topic exists in curriculum');
    const mod5ContentRes = await request(
      `/api/courses/${SHOWCASE_COURSE_ID}/modules/${module5.id}/topics/${module5Topic.id}`,
      {},
      testStudentToken
    );
    assert(mod5ContentRes.status === 200, 'GET Module 5 topic content returns 200 OK');
    assert(Boolean(mod5ContentRes.data?.data?.topic?.content), 'Module 5 topic contains real educational content');

    // -------------------------------------------------------------------------
    // 8. Student Dashboard Enrolled-Course Visibility
    // -------------------------------------------------------------------------
    console.log('\n--- Step 8: Student Dashboard Enrolled-Course Integration ---');
    const dashboardRes = await request('/api/student/dashboard', {}, testStudentToken);
    assert(dashboardRes.status === 200, 'GET /api/student/dashboard returns 200 OK');
    const dashboardData = dashboardRes.data?.data;
    assert(Boolean(dashboardData?.student), 'Dashboard includes student profile');
    assert(Array.isArray(dashboardData?.courses), 'Dashboard includes courses array');
    const enrolledInDashboard = dashboardData.courses.find(
      (c) => c.courseId === SHOWCASE_COURSE_ID || c.id === SHOWCASE_COURSE_ID
    );
    assert(Boolean(enrolledInDashboard), 'Showcase course is listed in Student Dashboard courses');
    assert(enrolledInDashboard?.totalAssessments === 9, 'Dashboard correctly reflects 9 total assessments');
    assert(enrolledInDashboard?.totalTopics === 73, 'Dashboard correctly reflects 73 total topics');
    assert(enrolledInDashboard?.completionPercentage === 0, 'New enrollment completion percentage is 0%');

    // -------------------------------------------------------------------------
    // 9. Assessment Access & Answer-Key Security for Enrolled Student
    // -------------------------------------------------------------------------
    console.log('\n--- Step 9: Assessment Access & Redaction for Enrolled Student ---');
    const enrolledAssessmentsRes = await request(
      `/api/student/courses/${SHOWCASE_COURSE_ID}/assessments`,
      {},
      testStudentToken
    );
    assert(enrolledAssessmentsRes.status === 200, 'Enrolled student GET /api/student/courses/:id/assessments returns 200 OK');
    const studentAssessments = enrolledAssessmentsRes.data?.data?.assessments || [];
    assert(studentAssessments.length === 9, `Student sees all 9 assessments (found ${studentAssessments.length})`);

    // Verify all 9 expected IDs are present
    const returnedAssessmentIds = studentAssessments.map((a) => a.id);
    const allIdsPresent = EXPECTED_ASSESSMENT_IDS.every((id) => returnedAssessmentIds.includes(id));
    assert(allIdsPresent, 'All 9 expected assessment IDs returned to enrolled student');

    // Audit answer-key redaction across all 9 assessments
    let allRedacted = true;
    let questionsAuditedCount = 0;

    for (const aMeta of studentAssessments) {
      const singleAssessmentRes = await request(
        `/api/student/courses/${SHOWCASE_COURSE_ID}/assessments/${aMeta.id}`,
        {},
        testStudentToken
      );
      assert(singleAssessmentRes.status === 200, `GET assessment ${aMeta.id} returns 200 OK`);
      const questions = singleAssessmentRes.data?.data?.assessment?.questions || [];
      const expectedQCount = aMeta.type === 'course' ? 16 : 8;
      assert(
        questions.length === expectedQCount,
        `Assessment "${aMeta.title}" delivers exactly ${expectedQCount} questions`
      );

      for (const q of questions) {
        questionsAuditedCount++;
        if ('correctOptionId' in q || q.correctOptionId !== undefined) {
          allRedacted = false;
          console.error(`  Security breach: correctOptionId leaked in question ${q.id}`);
        }
        if ('explanation' in q || q.explanation !== undefined) {
          allRedacted = false;
          console.error(`  Security breach: explanation leaked in question ${q.id}`);
        }
        if (!Array.isArray(q.options) || q.options.length !== 4) {
          allRedacted = false;
          console.error(`  Invalid options count in question ${q.id}`);
        }
      }
    }

    assert(questionsAuditedCount === 80, `Audited all 80 questions (found ${questionsAuditedCount})`);
    assert(allRedacted, 'CRITICAL: correctOptionId and explanation are strictly absent from every student question');

    // -------------------------------------------------------------------------
    // 10. Cross-User Ownership Isolation
    // -------------------------------------------------------------------------
    console.log('\n--- Step 10: Cross-User Ownership Isolation ---');
    const secondEmail = `student2.phase12a.${timestamp}@learnsphere.io`;
    const reg2Res = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Second Student',
        email: secondEmail,
        password: testPassword,
      }),
    });
    secondStudentId = reg2Res.data?.data?.user?.id;
    createdUserIds.push(secondStudentId);

    const login2Res = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: secondEmail, password: testPassword }),
    });
    secondStudentToken = login2Res.data?.data?.accessToken;

    // Student 2 has not enrolled, so querying showcase course enrollment returns 404
    const s2Check = await request(`/api/student/enrollments/${SHOWCASE_COURSE_ID}`, {}, secondStudentToken);
    assert(s2Check.status === 404, 'Student 2 cannot access Student 1 enrollment (returns 404)');

    // Student 2 dashboard does not include showcase course
    const s2Dash = await request('/api/student/dashboard', {}, secondStudentToken);
    const s2Courses = s2Dash.data?.data?.courses || [];
    assert(
      !s2Courses.some((c) => c.courseId === SHOWCASE_COURSE_ID || c.id === SHOWCASE_COURSE_ID),
      'Student 2 dashboard does not show Student 1 enrolled courses'
    );

    // -------------------------------------------------------------------------
    // 11. Invalid & Draft Course Enrollment Handling
    // -------------------------------------------------------------------------
    console.log('\n--- Step 11: Invalid & Draft Course Enrollment Handling ---');
    // 11a. Invalid ObjectId
    const invalidIdRes = await request('/api/student/enroll/invalid-id-format', { method: 'POST' }, testStudentToken);
    assert(invalidIdRes.status === 400, 'Enroll with invalid ID format returns 400 Bad Request');

    // 11b. Non-existent Course
    const nonExistentRes = await request('/api/student/enroll/600000000000000000000099', { method: 'POST' }, testStudentToken);
    assert(nonExistentRes.status === 404, 'Enroll in non-existent course returns 404 Not Found');

    // 11c. Draft Course Enrollment Rejection
    const draftCourse = await Course.create({
      title: `Draft Unenrolled Test Course ${timestamp}`,
      description: 'Test draft course that must reject student enrollment.',
      category: 'Testing',
      status: 'draft',
      courseCreator: new mongoose.Types.ObjectId('6abe9dc1f15c2b4f6008ac1a'),
    });
    createdCourseIds.push(draftCourse._id);

    const draftEnrollRes = await request(`/api/student/enroll/${draftCourse._id}`, { method: 'POST' }, testStudentToken);
    assert(draftEnrollRes.status === 400, 'Attempting to enroll in draft course returns 400 Bad Request');
    assert(
      draftEnrollRes.data?.message?.includes('Only published courses allow enrollment'),
      'Error message clarifies that only published courses allow enrollment'
    );

    // -------------------------------------------------------------------------
    // 12. Non-Student Role Enrollment Rejection
    // -------------------------------------------------------------------------
    console.log('\n--- Step 12: Role Enforcement on Enrollment Endpoints ---');
    // Admin login
    const adminLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: process.env.INITIAL_ADMIN_EMAIL || 'admin@learnsphere.io',
        password: process.env.INITIAL_ADMIN_PASSWORD || 'Str0ng!Admin#Secret2026',
      }),
    });
    const adminToken = adminLoginRes.data?.data?.accessToken;

    const adminEnrollAttempt = await request(`/api/student/enroll/${SHOWCASE_COURSE_ID}`, { method: 'POST' }, adminToken);
    assert(adminEnrollAttempt.status === 403, 'Admin attempting student enrollment returns 403 Forbidden');

    // Course Creator login
    const creatorLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'faculty@learnsphere.io',
        password: 'Str0ng!Faculty#Secret2026',
      }),
    });
    const creatorToken = creatorLoginRes.data?.data?.accessToken;

    const creatorEnrollAttempt = await request(`/api/student/enroll/${SHOWCASE_COURSE_ID}`, { method: 'POST' }, creatorToken);
    assert(creatorEnrollAttempt.status === 403, 'Course Creator attempting student enrollment returns 403 Forbidden');

    // -------------------------------------------------------------------------
    // 13. Clean-up & Post-Verification Invariants
    // -------------------------------------------------------------------------
    console.log('\n--- Step 13: Database Clean-up & Invariant Verification ---');
    // Delete test users and their enrollments
    await Enrollment.deleteMany({ userId: { $in: createdUserIds } });
    await User.deleteMany({ _id: { $in: createdUserIds } });
    if (createdCourseIds.length > 0) {
      await Course.deleteMany({ _id: { $in: createdCourseIds } });
    }
    // Clean up all refresh sessions created during test logins
    await RefreshSession.deleteMany({});

    // Verify zero side-effects
    const remainingAttempts = await AssessmentAttempt.countDocuments();
    assert(remainingAttempts === 0, `Zero AssessmentAttempts exist (actual: ${remainingAttempts})`);

    const remainingEnrollments = await Enrollment.countDocuments();
    assert(remainingEnrollments === 0, `Zero test enrollments remain (actual: ${remainingEnrollments})`);

    const remainingProgress = await TopicProgress.countDocuments();
    assert(remainingProgress === 0, `Zero TopicProgress records exist (actual: ${remainingProgress})`);

    const remainingSessions = await RefreshSession.countDocuments();
    assert(remainingSessions === 0, `Zero RefreshSessions remain (actual: ${remainingSessions})`);

    // Verify 9 assessments remain intact
    const postAssessments = await Assessment.find({ courseId: SHOWCASE_COURSE_ID });
    assert(postAssessments.length === 9, 'Exactly 9 assessments remain in database');
    const postComp = postAssessments.find((a) => a.type === 'course');
    assert(postComp?.questions?.length === 16, 'Final assessment retains all 16 questions');
    const postModules = postAssessments.filter((a) => a.type === 'topic');
    assert(postModules.length === 8, 'All 8 module assessments retained');
    assert(
      postModules.every((m) => m.questions.length === 8),
      'Every module assessment retains all 8 questions'
    );

    console.log('\n========================================================================');
    console.log(`=== Phase 12A Suite Complete: ${passedTests}/${totalTests} Checks Passed (${failedTests} Failed) ===`);
    console.log('========================================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error('Test suite failed with unexpected exception:', err);
    // Cleanup on error
    try {
      if (createdUserIds.length > 0) {
        await Enrollment.deleteMany({ userId: { $in: createdUserIds } });
        await User.deleteMany({ _id: { $in: createdUserIds } });
      }
      if (createdCourseIds.length > 0) {
        await Course.deleteMany({ _id: { $in: createdCourseIds } });
      }
      await RefreshSession.deleteMany({});
    } catch {}
    process.exit(1);
  }
}

runEnrollmentFlowVerification();
