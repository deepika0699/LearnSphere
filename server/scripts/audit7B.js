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
  console.log('=== Step 7B — Student Enrollment Backend Audit ===');
  console.log('================================================================\n');

  await connectDB();
  if (!isDbConnected()) {
    console.error('Fatal: Database is not connected');
    process.exit(1);
  }

  const auditRunId = crypto.randomBytes(4).toString('hex');
  const createdUserIds = [];
  const createdCourseIds = [];
  const createdEnrollmentIds = [];

  try {
    // -------------------------------------------------------------------------
    // SETUP: Fixtures & Tokens
    // -------------------------------------------------------------------------
    console.log('--- Setup: Test Fixtures & Tokens ---');

    // Student A
    const studentA = await User.create({
      name: `Student A ${auditRunId}`,
      email: `student_a_${auditRunId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'student',
      status: 'active',
    });
    createdUserIds.push(studentA._id);
    const studentAToken = generateAccessToken({ userId: studentA._id, role: studentA.role });

    // Student B
    const studentB = await User.create({
      name: `Student B ${auditRunId}`,
      email: `student_b_${auditRunId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'student',
      status: 'active',
    });
    createdUserIds.push(studentB._id);
    const studentBToken = generateAccessToken({ userId: studentB._id, role: studentB.role });

    // Student C (No enrollments)
    const studentC = await User.create({
      name: `Student C ${auditRunId}`,
      email: `student_c_${auditRunId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'student',
      status: 'active',
    });
    createdUserIds.push(studentC._id);
    const studentCToken = generateAccessToken({ userId: studentC._id, role: studentC.role });

    // Inactive Student
    const inactiveStudent = await User.create({
      name: `Inactive Student ${auditRunId}`,
      email: `inactive_${auditRunId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'student',
      status: 'inactive',
    });
    createdUserIds.push(inactiveStudent._id);
    const inactiveStudentToken = generateAccessToken({ userId: inactiveStudent._id, role: inactiveStudent.role });

    // Deleted Student (Token created, user deleted from DB)
    const deletedStudent = await User.create({
      name: `Deleted Student ${auditRunId}`,
      email: `deleted_${auditRunId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'student',
      status: 'active',
    });
    const deletedStudentToken = generateAccessToken({ userId: deletedStudent._id, role: deletedStudent.role });
    await User.findByIdAndDelete(deletedStudent._id);

    // Course Creator
    const creatorUser = await User.create({
      name: `Creator ${auditRunId}`,
      email: `creator_${auditRunId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'courseCreator',
      status: 'active',
    });
    createdUserIds.push(creatorUser._id);
    const creatorToken = generateAccessToken({ userId: creatorUser._id, role: creatorUser.role });

    // Admin
    const adminUser = await User.create({
      name: `Admin ${auditRunId}`,
      email: `admin_${auditRunId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'admin',
      status: 'active',
    });
    createdUserIds.push(adminUser._id);
    const adminToken = generateAccessToken({ userId: adminUser._id, role: adminUser.role });

    // Published Course 1
    const publishedCourse1 = await Course.create({
      title: `Published Course 1 ${auditRunId}`,
      description: 'First published test course for student enrollment testing.',
      category: 'Computer Science',
      courseCreator: creatorUser._id,
      status: 'published',
    });
    createdCourseIds.push(publishedCourse1._id);

    // Published Course 2
    const publishedCourse2 = await Course.create({
      title: `Published Course 2 ${auditRunId}`,
      description: 'Second published test course for multi-course enrollment testing.',
      category: 'Web Development',
      courseCreator: creatorUser._id,
      status: 'published',
    });
    createdCourseIds.push(publishedCourse2._id);

    // Draft Course
    const draftCourse = await Course.create({
      title: `Draft Course ${auditRunId}`,
      description: 'Draft course not available for student enrollment.',
      category: 'DevOps',
      courseCreator: creatorUser._id,
      status: 'draft',
    });
    createdCourseIds.push(draftCourse._id);

    // Archived Course
    const archivedCourse = await Course.create({
      title: `Archived Course ${auditRunId}`,
      description: 'Archived course not available for student enrollment.',
      category: 'Data Science',
      courseCreator: creatorUser._id,
      status: 'archived',
    });
    createdCourseIds.push(archivedCourse._id);

    assert(true, 'Fixtures and tokens prepared successfully');

    // -------------------------------------------------------------------------
    // SECTION 1: AUTHENTICATION & AUTHORIZATION CONTROLS
    // -------------------------------------------------------------------------
    console.log('\n--- Section 1: Authentication & Authorization Controls ---');

    // Unauthenticated requests
    const unauthPost = await request(`/api/student/enroll/${publishedCourse1._id}`, { method: 'POST' });
    assert(unauthPost.status === 401, 'POST /api/student/enroll/:id without token returns 401');

    const unauthGetList = await request('/api/student/enrollments');
    assert(unauthGetList.status === 401, 'GET /api/student/enrollments without token returns 401');

    const unauthGetOne = await request(`/api/student/enrollments/${publishedCourse1._id}`);
    assert(unauthGetOne.status === 401, 'GET /api/student/enrollments/:id without token returns 401');

    // Course Creator accessing student routes
    const creatorPost = await request(`/api/student/enroll/${publishedCourse1._id}`, { method: 'POST' }, creatorToken);
    assert(creatorPost.status === 403, 'Course Creator attempting POST enroll returns 403 Forbidden');

    const creatorGetList = await request('/api/student/enrollments', {}, creatorToken);
    assert(creatorGetList.status === 403, 'Course Creator attempting GET enrollments returns 403 Forbidden');

    // Admin accessing student routes
    const adminPost = await request(`/api/student/enroll/${publishedCourse1._id}`, { method: 'POST' }, adminToken);
    assert(adminPost.status === 403, 'Admin attempting POST enroll returns 403 Forbidden');

    const adminGetList = await request('/api/student/enrollments', {}, adminToken);
    assert(adminGetList.status === 403, 'Admin attempting GET enrollments returns 403 Forbidden');

    // Inactive student
    const inactivePost = await request(`/api/student/enroll/${publishedCourse1._id}`, { method: 'POST' }, inactiveStudentToken);
    assert(inactivePost.status === 401, 'Inactive student token returns 401 Unauthorized');

    // Deleted student
    const deletedPost = await request(`/api/student/enroll/${publishedCourse1._id}`, { method: 'POST' }, deletedStudentToken);
    assert(deletedPost.status === 401, 'Deleted student token returns 401 Unauthorized');

    // -------------------------------------------------------------------------
    // SECTION 2: COURSE PUBLICATION & VALIDATION CONTROLS
    // -------------------------------------------------------------------------
    console.log('\n--- Section 2: Course Publication & Validation Controls ---');

    // Attempting to enroll in draft course
    const draftEnroll = await request(`/api/student/enroll/${draftCourse._id}`, { method: 'POST' }, studentAToken);
    assert(draftEnroll.status === 400, 'Attempt to enroll in draft course returns 400 Bad Request');
    assert(draftEnroll.data?.message?.includes('published'), 'Error message states only published courses allow enrollment');

    // Attempting to enroll in archived course
    const archivedEnroll = await request(`/api/student/enroll/${archivedCourse._id}`, { method: 'POST' }, studentAToken);
    assert(archivedEnroll.status === 400, 'Attempt to enroll in archived course returns 400 Bad Request');

    // Non-existent course (valid ObjectId)
    const fakeCourseId = new mongoose.Types.ObjectId().toString();
    const nonExistentEnroll = await request(`/api/student/enroll/${fakeCourseId}`, { method: 'POST' }, studentAToken);
    assert(nonExistentEnroll.status === 404, 'Attempt to enroll in non-existent course returns 404 Not Found');

    // Malformed course ID
    const malformedEnroll = await request('/api/student/enroll/not-a-valid-id', { method: 'POST' }, studentAToken);
    assert(malformedEnroll.status === 400, 'Malformed course ID in POST enroll returns 400 Bad Request');

    const malformedGetOne = await request('/api/student/enrollments/not-a-valid-id', {}, studentAToken);
    assert(malformedGetOne.status === 400, 'Malformed course ID in GET enrollment returns 400 Bad Request');

    // Course student is not enrolled in
    const notEnrolledGetOne = await request(`/api/student/enrollments/${publishedCourse1._id}`, {}, studentAToken);
    assert(notEnrolledGetOne.status === 404, 'GET enrollment for non-enrolled course returns 404 Not Found');

    // -------------------------------------------------------------------------
    // SECTION 3: SUCCESSFUL ENROLLMENT & MASS ASSIGNMENT IMMUNITY
    // -------------------------------------------------------------------------
    console.log('\n--- Section 3: Successful Student Enrollment & Mass Assignment Immunity ---');

    // Student A enrolls in Course 1 while submitting spoofed payload
    const spoofedBody = JSON.stringify({
      userId: studentB._id.toString(), // Attempting to enroll Student B
      status: 'completed', // Attempting to self-complete
      enrolledAt: '1970-01-01T00:00:00.000Z',
    });

    const enrollRes = await request(
      `/api/student/enroll/${publishedCourse1._id}`,
      {
        method: 'POST',
        body: spoofedBody,
      },
      studentAToken
    );

    assert(enrollRes.status === 201, 'Student A successfully enrolls in published Course 1 (201 Created)');
    assert(enrollRes.data?.status === 'success', 'Response status is "success"');

    const enrollmentData = enrollRes.data?.data?.enrollment;
    assert(Boolean(enrollmentData?.id), 'Enrollment record contains normalized id');
    assert(enrollmentData?.userId === studentA._id.toString(), 'userId is strictly server-derived Student A (spoofed userId ignored)');
    assert(enrollmentData?.courseId === publishedCourse1._id.toString(), 'courseId matches target course');
    assert(enrollmentData?.status === 'active', 'status defaults strictly to "active" (spoofed "completed" ignored)');
    assert(enrollmentData?.completedAt === null, 'completedAt is null');
    assert(new Date(enrollmentData?.enrolledAt).getFullYear() >= 2026, 'enrolledAt is current server timestamp (spoofed 1970 ignored)');

    // Safe course summary included
    assert(enrollmentData?.course?.title === publishedCourse1.title, 'Course title included in response');
    assert(enrollmentData?.course?.category === publishedCourse1.category, 'Course category included');
    assert(enrollmentData?.course?.courseCreator?.name === creatorUser.name, 'Safe creator name included');

    // Track for cleanup
    createdEnrollmentIds.push(enrollmentData?.id);

    // -------------------------------------------------------------------------
    // SECTION 4: DUPLICATE ENROLLMENT & RACE CONDITION PROTECTION
    // -------------------------------------------------------------------------
    console.log('\n--- Section 4: Duplicate Enrollment Protection ---');

    const duplicateRes = await request(
      `/api/student/enroll/${publishedCourse1._id}`,
      { method: 'POST' },
      studentAToken
    );

    assert(duplicateRes.status === 409, 'Duplicate enrollment attempt returns HTTP 409 Conflict');
    assert(duplicateRes.data?.error === 'Conflict', 'Error title is "Conflict"');
    assert(
      duplicateRes.data?.message === 'You are already enrolled in this course.',
      'Message is clear and user-safe without leaking DB internals'
    );

    // -------------------------------------------------------------------------
    // SECTION 5: STUDENT ENROLLMENTS QUERY & CROSS-STUDENT ISOLATION
    // -------------------------------------------------------------------------
    console.log('\n--- Section 5: Enrollments Query & Cross-Student Isolation ---');

    // Student A enrolls in Course 2
    const enroll2Res = await request(
      `/api/student/enroll/${publishedCourse2._id}`,
      { method: 'POST' },
      studentAToken
    );
    assert(enroll2Res.status === 201, 'Student A enrolls in Course 2 (201 Created)');
    createdEnrollmentIds.push(enroll2Res.data?.data?.enrollment?.id);

    // Student B enrolls in Course 2
    const studentBEnrollRes = await request(
      `/api/student/enroll/${publishedCourse2._id}`,
      { method: 'POST' },
      studentBToken
    );
    assert(studentBEnrollRes.status === 201, 'Student B enrolls in Course 2 (201 Created)');
    createdEnrollmentIds.push(studentBEnrollRes.data?.data?.enrollment?.id);

    // Query Student A enrollments
    const studentAList = await request('/api/student/enrollments', {}, studentAToken);
    assert(studentAList.status === 200, 'GET /api/student/enrollments returns HTTP 200');
    assert(studentAList.data?.status === 'success', 'Response status is "success"');

    const enrollmentsA = studentAList.data?.data?.enrollments;
    assert(Array.isArray(enrollmentsA) && enrollmentsA.length === 2, 'Student A receives exactly their 2 enrollments');
    assert(
      enrollmentsA.every((e) => e.userId === studentA._id.toString()),
      'All returned enrollments strictly belong to Student A'
    );
    assert(
      !enrollmentsA.some((e) => e.userId === studentB._id.toString()),
      'Zero enrollments from Student B leaked to Student A'
    );

    // Query Student B enrollments
    const studentBList = await request('/api/student/enrollments', {}, studentBToken);
    assert(studentBList.status === 200, 'GET /api/student/enrollments for Student B returns 200');
    const enrollmentsB = studentBList.data?.data?.enrollments;
    assert(Array.isArray(enrollmentsB) && enrollmentsB.length === 1, 'Student B receives exactly 1 enrollment');
    assert(enrollmentsB[0]?.courseId === publishedCourse2._id.toString(), 'Student B enrollment is for Course 2');

    // Pagination verification
    const pagedRes = await request('/api/student/enrollments?page=1&limit=1', {}, studentAToken);
    assert(pagedRes.status === 200, 'Pagination page=1 limit=1 returns 200');
    assert(pagedRes.data?.data?.enrollments?.length === 1, 'Respects pagination limit of 1');
    assert(pagedRes.data?.data?.pagination?.total === 2, 'Pagination total count is accurate (2)');
    assert(pagedRes.data?.data?.pagination?.hasMore === true, 'Pagination hasMore is true on page 1');

    const pagedRes2 = await request('/api/student/enrollments?page=2&limit=1', {}, studentAToken);
    assert(pagedRes2.status === 200, 'Pagination page=2 limit=1 returns 200');
    assert(pagedRes2.data?.data?.enrollments?.length === 1, 'Page 2 contains remaining enrollment');
    assert(pagedRes2.data?.data?.pagination?.hasMore === false, 'Pagination hasMore is false on last page');

    // -------------------------------------------------------------------------
    // SECTION 6: SINGLE ENROLLMENT FETCH & CROSS-STUDENT ACCESS PREVENTION
    // -------------------------------------------------------------------------
    console.log('\n--- Section 6: Single Enrollment Fetch & Cross-Student Prevention ---');

    // Student A fetches their own Course 1 enrollment
    const studentAFetchOwn = await request(`/api/student/enrollments/${publishedCourse1._id}`, {}, studentAToken);
    assert(studentAFetchOwn.status === 200, 'Student A fetches own enrollment for Course 1 (200 OK)');
    assert(studentAFetchOwn.data?.data?.enrollment?.courseId === publishedCourse1._id.toString(), 'Returned courseId matches');
    assert(studentAFetchOwn.data?.data?.enrollment?.course?.title === publishedCourse1.title, 'Returned course summary attached');

    // Student B attempts to fetch Student A's Course 1 enrollment
    const studentBFetchCross = await request(`/api/student/enrollments/${publishedCourse1._id}`, {}, studentBToken);
    assert(studentBFetchCross.status === 404, 'Student B fetching Course 1 enrollment returns 404 Not Found (cross-student denied)');

    // Fetching enrollment for draft course returns 404
    const draftFetch = await request(`/api/student/enrollments/${draftCourse._id}`, {}, studentAToken);
    assert(draftFetch.status === 404, 'Fetching enrollment for draft course returns 404 Not Found');

    // -------------------------------------------------------------------------
    // SECTION 7: EMPTY ENROLLMENT HANDLING
    // -------------------------------------------------------------------------
    console.log('\n--- Section 7: Empty Enrollment Handling ---');

    const studentCEmptyList = await request('/api/student/enrollments', {}, studentCToken);
    assert(studentCEmptyList.status === 200, 'Student with no enrollments receives 200 OK');
    assert(
      Array.isArray(studentCEmptyList.data?.data?.enrollments) &&
        studentCEmptyList.data?.data?.enrollments.length === 0,
      'Enrollments array is empty []'
    );
    assert(studentCEmptyList.data?.data?.pagination?.total === 0, 'Pagination total is 0');
    assert(studentCEmptyList.data?.data?.pagination?.hasMore === false, 'Pagination hasMore is false');

    // -------------------------------------------------------------------------
    // SECTION 8: ZERO SENSITIVE INFORMATION DISCLOSURE
    // -------------------------------------------------------------------------
    console.log('\n--- Section 8: Zero Sensitive Information Disclosure ---');

    const fullResponseStr = JSON.stringify(studentAList.data) + JSON.stringify(enrollRes.data);
    assert(!fullResponseStr.includes('password'), 'No password or password hash exposed');
    assert(!fullResponseStr.includes('salt'), 'No password salt exposed');
    assert(!fullResponseStr.includes('refreshToken'), 'No refresh tokens exposed');
    assert(!fullResponseStr.includes('secret'), 'No secret keys exposed');
    assert(!fullResponseStr.includes('__v'), 'No Mongoose internal __v exposed');

    // -------------------------------------------------------------------------
    // SECTION 9: PHASE 7A MODEL INTEGRITY
    // -------------------------------------------------------------------------
    console.log('\n--- Section 9: Phase 7A Foundation Model Preservation ---');

    assert(Boolean(Enrollment.schema.indexes().find((idx) => idx[0].userId && idx[0].courseId)), 'Enrollment unique compound index intact');
    assert(Boolean(TopicProgress.schema.indexes().find((idx) => idx[0].userId && idx[0].topicId)), 'TopicProgress unique compound index intact');

  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n--- Cleanup: Purging Test Artifacts ---');
    if (createdEnrollmentIds.length > 0) {
      await Enrollment.deleteMany({ _id: { $in: createdEnrollmentIds } });
    }
    if (createdCourseIds.length > 0) {
      await Course.deleteMany({ _id: { $in: createdCourseIds } });
    }
    if (createdUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
    }
    console.log('✓ All audit artifacts safely purged from database');
  }

  console.log('\n================================================================');
  console.log(`=== Audit 7B Complete: ${passedTests}/${totalTests} Passed (${failedTests} Failed) ===`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAudit().catch((err) => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
