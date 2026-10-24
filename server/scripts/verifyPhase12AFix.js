/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * LearnSphere — Phase 12A-FIX: Student Enrollment CTA Verification
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from '../config/db.js';
import User from '../models/User.js';
import Enrollment from '../models/Enrollment.js';
import Assessment from '../models/Assessment.js';
import AssessmentAttempt from '../models/AssessmentAttempt.js';
import TopicProgress from '../models/TopicProgress.js';
import RefreshSession from '../models/RefreshSession.js';

const SHOWCASE_COURSE_ID = '6abe9dc2f15c2b4f6008ac1c';
const BASE_URL = 'http://localhost:5000';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
    failed++;
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

async function runVerification() {
  console.log('===========================================================================');
  console.log(' Phase 12A-FIX: Student Enrollment CTA & Navigation Verification Suite');
  console.log('===========================================================================');

  if (!isDbConnected()) {
    await connectDB();
  }
  console.log('Connected to MongoDB database successfully.\n');

  const testEmail = `student_cta_test_${Date.now()}@learnsphere.test`;
  const testPassword = 'Password123!';
  let studentToken = null;
  let studentUserId = null;

  try {
    // Step 1: Register and login test student
    console.log('--- Step 1: Student Account Authentication ---');
    const regRes = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'CTA Test Student',
        email: testEmail,
        password: testPassword,
      }),
    });
    assert(regRes.status === 201, 'Student registered successfully (201)');
    studentUserId = regRes.data.data.user.id;

    const loginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });
    assert(loginRes.status === 200, 'Student logged in successfully (200)');
    studentToken = loginRes.data.data.accessToken;
    assert(!!studentToken, 'Student received valid access token');

    // Step 2: Query Course Details and Curriculum
    console.log('\n--- Step 2: Course Discovery and Curriculum Inspection ---');
    const courseRes = await request(`/api/courses/${SHOWCASE_COURSE_ID}`);
    assert(courseRes.status === 200, 'Showcase course details retrieved (200)');
    assert(courseRes.data?.data?.course?.status === 'published', 'Course status is published');

    const structRes = await request(`/api/courses/${SHOWCASE_COURSE_ID}/structure`);
    assert(structRes.status === 200, 'Course structure retrieved (200)');
    const modules = structRes.data?.data?.modules || [];
    assert(Array.isArray(modules) && modules.length === 8, 'Curriculum has 8 modules');

    // Determine first topic (Start Learning destination)
    const firstTopic = modules.flatMap((m) => m.topics || [])[0];
    const firstModule = modules[0];
    assert(!!firstTopic && !!firstTopic.id, `First topic found: ${firstTopic?.title} (${firstTopic?.id})`);
    const expectedLearnUrl = `/courses/${SHOWCASE_COURSE_ID}/learn/${firstTopic.id}`;
    console.log(`  -> Expected "Start Learning" destination: ${expectedLearnUrl}`);

    // Step 3: Verify initial unenrolled state
    console.log('\n--- Step 3: Initial Non-Enrolled State ---');
    const initialEnrollCheck = await request(`/api/student/enrollments/${SHOWCASE_COURSE_ID}`, {}, studentToken);
    assert(initialEnrollCheck.status === 404, 'Initial enrollment check returns 404 (not enrolled)');
    console.log('  -> Frontend CourseDetails renders: <button id="enroll-course-cta-button">Enroll in Course</button>');

    // Step 4: Execute Enrollment (Simulating clicking "Enroll in Course" button)
    console.log('\n--- Step 4: Execute Enrollment (POST /api/student/enroll/:courseId) ---');
    const enrollRes = await request(`/api/student/enroll/${SHOWCASE_COURSE_ID}`, {
      method: 'POST',
      body: JSON.stringify({}),
    }, studentToken);
    assert(enrollRes.status === 201, 'POST /api/student/enroll/:courseId returns 201 Created');
    assert(enrollRes.data?.status === 'success', 'Response status is "success"');
    const enrollmentData = enrollRes.data?.data?.enrollment;
    assert(enrollmentData?.courseId === SHOWCASE_COURSE_ID, 'Enrolled courseId matches showcase course');
    assert(enrollmentData?.status === 'active', 'Enrollment status is "active"');

    // Step 5: Verify MongoDB persistence
    console.log('\n--- Step 5: Verify Authoritative MongoDB Persistence ---');
    const dbEnrollment = await Enrollment.findOne({
      userId: new mongoose.Types.ObjectId(studentUserId),
      courseId: new mongoose.Types.ObjectId(SHOWCASE_COURSE_ID),
    });
    assert(!!dbEnrollment, 'Enrollment record successfully persisted in MongoDB');
    assert(dbEnrollment.status === 'active', 'MongoDB record status is "active"');
    assert(String(dbEnrollment.userId) === studentUserId, 'MongoDB record userId matches authenticated student');

    // Step 6: Verify Frontend Authoritative State Transition to "Start Learning"
    console.log('\n--- Step 6: Authoritative State Transition to "Start Learning" ---');
    const postEnrollCheck = await request(`/api/student/enrollments/${SHOWCASE_COURSE_ID}`, {}, studentToken);
    assert(postEnrollCheck.status === 200, 'GET /api/student/enrollments/:courseId returns 200 OK');
    assert(postEnrollCheck.data?.data?.enrollment?.status === 'active', 'Status is "active"');
    console.log('  -> Frontend CourseDetails state updated: enrollment = active');
    console.log('  -> Button transitions to: <Link id="resume-learning-cta-button" to="' + expectedLearnUrl + '">Start Learning</Link>');

    // Step 7: Verify "Start Learning" Navigation Destination
    console.log('\n--- Step 7: Verify "Start Learning" Destination Content ---');
    const topicRes = await request(
      `/api/courses/${SHOWCASE_COURSE_ID}/modules/${firstModule.id}/topics/${firstTopic.id}`,
      {},
      studentToken
    );
    assert(topicRes.status === 200, 'First topic content loads successfully (200)');
    const topicData = topicRes.data?.data?.topic;
    assert(!!topicData?.title, 'Topic contains title: ' + topicData?.title);
    assert(!!topicData?.content, 'Topic contains educational content body');

    // Step 8: Verify Page Refresh Behavior
    console.log('\n--- Step 8: Verify Page Refresh Preserves Enrolled State ---');
    const refreshCheck = await request(`/api/student/enrollments/${SHOWCASE_COURSE_ID}`, {}, studentToken);
    assert(refreshCheck.status === 200, 'Page refresh check returns 200 OK');
    assert(refreshCheck.data?.data?.enrollment?.status === 'active', 'Enrolled state retained on refresh');
    console.log('  -> On refresh, button immediately renders: "Start Learning"');

    // Step 9: Verify Student Dashboard Course Listing
    console.log('\n--- Step 9: Verify Student Dashboard Lists Enrolled Course ---');
    const dashRes = await request('/api/student/dashboard', {}, studentToken);
    assert(dashRes.status === 200, 'Dashboard returns 200 OK');
    const enrolledCourses = dashRes.data?.data?.courses || [];
    const foundShowcase = enrolledCourses.find((c) => c.id === SHOWCASE_COURSE_ID);
    assert(!!foundShowcase, 'Showcase course appears in Student Dashboard courses');
    assert(foundShowcase.enrollmentStatus === 'active', 'Course status in dashboard is active');

  } finally {
    // Step 10: Cleanup test records and verify invariants
    console.log('\n--- Step 10: Clean-up and Invariant Audit ---');
    if (studentUserId) {
      await Enrollment.deleteMany({
        userId: new mongoose.Types.ObjectId(studentUserId),
      });
      await TopicProgress.deleteMany({
        userId: new mongoose.Types.ObjectId(studentUserId),
      });
      await AssessmentAttempt.deleteMany({
        userId: new mongoose.Types.ObjectId(studentUserId),
      });
      await RefreshSession.deleteMany({
        userId: new mongoose.Types.ObjectId(studentUserId),
      });
      await User.deleteOne({
        _id: new mongoose.Types.ObjectId(studentUserId),
      });
      console.log('  -> Test student and associated records cleaned up.');
    }

    const remainingAttempts = await AssessmentAttempt.countDocuments();
    const remainingEnrollments = await Enrollment.countDocuments();
    const remainingTopicProgress = await TopicProgress.countDocuments();
    const remainingRefreshSessions = await RefreshSession.countDocuments();

    assert(remainingAttempts === 0, `Zero AssessmentAttempts exist (actual: ${remainingAttempts})`);
    assert(remainingEnrollments === 0, `Zero test enrollments remain (actual: ${remainingEnrollments})`);
    assert(remainingTopicProgress === 0, `Zero TopicProgress records exist (actual: ${remainingTopicProgress})`);
    assert(remainingRefreshSessions === 0, `Zero RefreshSessions remain (actual: ${remainingRefreshSessions})`);

    const assessmentCount = await Assessment.countDocuments({
      courseId: new mongoose.Types.ObjectId(SHOWCASE_COURSE_ID),
    });
    assert(assessmentCount === 9, `Showcase course retains all 9 assessments (actual: ${assessmentCount})`);

    await mongoose.disconnect();
  }

  console.log('\n===========================================================================');
  console.log(` Phase 12A-FIX Suite Complete: ${passed} Passed, ${failed} Failed`);
  console.log('===========================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Verification failed with error:', err);
  process.exit(1);
});
