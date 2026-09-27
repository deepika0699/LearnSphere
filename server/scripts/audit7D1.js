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
  console.log('=== Step 7D-1 — Student Dashboard Backend API Audit ===');
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
  const createdProgressIds = [];

  try {
    // -------------------------------------------------------------------------
    // SETUP: Fixtures & Tokens
    // -------------------------------------------------------------------------
    console.log('--- Setup: Test Fixtures & Tokens ---');

    // 1. Users
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

    const studentEmpty = await User.create({
      name: `Student Empty ${auditRunId}`,
      email: `student_empty_${auditRunId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'student',
      status: 'active',
    });
    createdUserIds.push(studentEmpty._id);
    const studentEmptyToken = generateAccessToken({
      userId: studentEmpty._id,
      role: studentEmpty.role,
    });

    const inactiveStudent = await User.create({
      name: `Inactive Student ${auditRunId}`,
      email: `inactive_${auditRunId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'student',
      status: 'inactive',
    });
    createdUserIds.push(inactiveStudent._id);
    const inactiveStudentToken = generateAccessToken({
      userId: inactiveStudent._id,
      role: inactiveStudent.role,
    });

    const deletedStudent = await User.create({
      name: `Deleted Student ${auditRunId}`,
      email: `deleted_${auditRunId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'student',
      status: 'active',
    });
    const deletedStudentToken = generateAccessToken({
      userId: deletedStudent._id,
      role: deletedStudent.role,
    });
    await User.findByIdAndDelete(deletedStudent._id);

    const creatorUser = await User.create({
      name: `Creator ${auditRunId}`,
      email: `creator_${auditRunId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'courseCreator',
      status: 'active',
    });
    createdUserIds.push(creatorUser._id);
    const creatorToken = generateAccessToken({ userId: creatorUser._id, role: creatorUser.role });

    const adminUser = await User.create({
      name: `Admin ${auditRunId}`,
      email: `admin_${auditRunId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'admin',
      status: 'active',
    });
    createdUserIds.push(adminUser._id);
    const adminToken = generateAccessToken({ userId: adminUser._id, role: adminUser.role });

    // 2. Courses
    // Course 1: Published, 2 modules, 3 topics
    const course1 = await Course.create({
      title: `Full Published Course ${auditRunId}`,
      description: 'Comprehensive course with multiple modules and topics.',
      category: 'Software Engineering',
      courseCreator: creatorUser._id,
      status: 'published',
    });
    createdCourseIds.push(course1._id);

    const mod1Course1 = await Module.create({
      courseId: course1._id,
      title: 'Module 1 - Basics',
      order: 0,
    });
    createdModuleIds.push(mod1Course1._id);

    const topic1Mod1 = await Topic.create({
      courseId: course1._id,
      moduleId: mod1Course1._id,
      title: 'Topic 1 - Setup',
      order: 0,
    });
    createdTopicIds.push(topic1Mod1._id);

    const topic2Mod1 = await Topic.create({
      courseId: course1._id,
      moduleId: mod1Course1._id,
      title: 'Topic 2 - Syntax',
      order: 1,
    });
    createdTopicIds.push(topic2Mod1._id);

    const mod2Course1 = await Module.create({
      courseId: course1._id,
      title: 'Module 2 - Deep Dive',
      order: 1,
    });
    createdModuleIds.push(mod2Course1._id);

    const topic3Mod2 = await Topic.create({
      courseId: course1._id,
      moduleId: mod2Course1._id,
      title: 'Topic 3 - Concurrency',
      order: 0,
    });
    createdTopicIds.push(topic3Mod2._id);

    // Course 2: Published, empty (0 topics, testing division-by-zero prevention)
    const emptyCourse = await Course.create({
      title: `Zero Topics Course ${auditRunId}`,
      description: 'Published course with no topics yet.',
      category: 'Mathematics',
      courseCreator: creatorUser._id,
      status: 'published',
    });
    createdCourseIds.push(emptyCourse._id);

    // 3. Draft & Archived courses (enrolled while published, then course changed to draft/archived)
    const draftCourse = await Course.create({
      title: `Draft Course ${auditRunId}`,
      description: 'Draft course not yet available publicly.',
      category: 'Physics',
      courseCreator: creatorUser._id,
      status: 'published',
    });
    createdCourseIds.push(draftCourse._id);

    const archivedCourse = await Course.create({
      title: `Archived Course ${auditRunId}`,
      description: 'Archived course retired from learning.',
      category: 'History',
      courseCreator: creatorUser._id,
      status: 'published',
    });
    createdCourseIds.push(archivedCourse._id);

    // 4. Enrollments
    // Student A enrolled in Course 1 and Empty Course
    const enrollStudentACourse1 = await Enrollment.create({
      userId: studentA._id,
      courseId: course1._id,
      status: 'active',
      enrolledAt: new Date(Date.now() - 3600000), // 1 hour ago
    });
    createdEnrollmentIds.push(enrollStudentACourse1._id);

    const enrollStudentAEmpty = await Enrollment.create({
      userId: studentA._id,
      courseId: emptyCourse._id,
      status: 'active',
      enrolledAt: new Date(), // recent
    });
    createdEnrollmentIds.push(enrollStudentAEmpty._id);

    // Enroll in draftCourse and archivedCourse while published
    const enrollStudentADraft = await Enrollment.create({
      userId: studentA._id,
      courseId: draftCourse._id,
      status: 'active',
    });
    createdEnrollmentIds.push(enrollStudentADraft._id);

    const enrollStudentAArchived = await Enrollment.create({
      userId: studentA._id,
      courseId: archivedCourse._id,
      status: 'active',
    });
    createdEnrollmentIds.push(enrollStudentAArchived._id);

    // Now transition courses to draft and archived to test dashboard exclusion filter
    await Course.findByIdAndUpdate(draftCourse._id, { status: 'draft' });
    await Course.findByIdAndUpdate(archivedCourse._id, { status: 'archived' });

    // Student B enrolled in Course 1 only
    const enrollStudentBCourse1 = await Enrollment.create({
      userId: studentB._id,
      courseId: course1._id,
      status: 'active',
    });
    createdEnrollmentIds.push(enrollStudentBCourse1._id);

    // 4. Topic Progress
    // Student A completes Topic 1 and Topic 2 of Course 1 (2/3 topics = 67% progress)
    const progA1 = await TopicProgress.create({
      userId: studentA._id,
      courseId: course1._id,
      moduleId: mod1Course1._id,
      topicId: topic1Mod1._id,
      completedAt: new Date(),
    });
    createdProgressIds.push(progA1._id);

    const progA2 = await TopicProgress.create({
      userId: studentA._id,
      courseId: course1._id,
      moduleId: mod1Course1._id,
      topicId: topic2Mod1._id,
      completedAt: new Date(),
    });
    createdProgressIds.push(progA2._id);

    // Student B has completed 0 topics

    assert(true, 'Test fixtures, enrollments, and topic progress prepared successfully');

    // -------------------------------------------------------------------------
    // SECTION 1: AUTHENTICATION & ACCESS CONTROL
    // -------------------------------------------------------------------------
    console.log('\n--- Section 1: Authentication & Authorization Access Control ---');

    // Unauthenticated request
    const unauthRes = await request('/api/student/dashboard');
    assert(unauthRes.status === 401, 'GET /api/student/dashboard without token returns 401 Unauthorized');

    // Course Creator accessing student dashboard
    const creatorRes = await request('/api/student/dashboard', {}, creatorToken);
    assert(creatorRes.status === 403, 'Course Creator accessing student dashboard returns 403 Forbidden');

    // Admin accessing student dashboard
    const adminRes = await request('/api/student/dashboard', {}, adminToken);
    assert(adminRes.status === 403, 'Admin accessing student dashboard returns 403 Forbidden');

    // Inactive student
    const inactiveRes = await request('/api/student/dashboard', {}, inactiveStudentToken);
    assert(inactiveRes.status === 401, 'Inactive student token returns 401 Unauthorized');

    // Deleted student
    const deletedRes = await request('/api/student/dashboard', {}, deletedStudentToken);
    assert(deletedRes.status === 401, 'Deleted student token returns 401 Unauthorized');

    // -------------------------------------------------------------------------
    // SECTION 2: STUDENT DASHBOARD DATA INTEGRITY & ISOLATION
    // -------------------------------------------------------------------------
    console.log('\n--- Section 2: Student Dashboard Data Integrity & Isolation ---');

    // Student A queries dashboard
    // Sending spoofed query parameter or body attempting to read student B's data
    const studentARes = await request(
      `/api/student/dashboard?userId=${studentB._id.toString()}`,
      {},
      studentAToken
    );

    assert(studentARes.status === 200, 'GET /api/student/dashboard returns 200 OK for active student');
    assert(studentARes.data?.status === 'success', 'Response envelope has status: "success"');

    const dataA = studentARes.data?.data;
    assert(Boolean(dataA), 'Dashboard payload exists');

    // Student Identity
    assert(dataA?.student?.id === studentA._id.toString(), 'Student ID matches authenticated Student A (spoofed param ignored)');
    assert(dataA?.student?.name === studentA.name, 'Student name matches authenticated Student A');
    assert(dataA?.student?.email === studentA.email, 'Student email matches authenticated Student A');
    assert(dataA?.student?.role === 'student', 'Student role is canonical student');

    // Exclusion of draft and archived courses
    const courseIdsInA = (dataA?.courses || []).map((c) => c.courseId);
    assert(courseIdsInA.includes(course1._id.toString()), 'Published Course 1 is included');
    assert(courseIdsInA.includes(emptyCourse._id.toString()), 'Published Empty Course is included');
    assert(!courseIdsInA.includes(draftCourse._id.toString()), 'Draft course is EXCLUDED from dashboard');
    assert(!courseIdsInA.includes(archivedCourse._id.toString()), 'Archived course is EXCLUDED from dashboard');

    // Course counts & stats
    assert(dataA?.stats?.totalEnrollments === 2, 'stats.totalEnrollments === 2 (published only)');
    assert(dataA?.stats?.activeEnrollments === 2, 'stats.activeEnrollments === 2');
    assert(dataA?.stats?.inProgressCourses === 1, 'stats.inProgressCourses === 1 (Course 1 is in progress)');
    assert(dataA?.stats?.completedCourses === 0, 'stats.completedCourses === 0');

    // Course 1 Progress Metrics
    const course1Summary = dataA?.courses?.find((c) => c.courseId === course1._id.toString());
    assert(Boolean(course1Summary), 'Course 1 summary exists');
    assert(course1Summary?.title === course1.title, 'Course 1 title is correct');
    assert(course1Summary?.category === course1.category, 'Course 1 category is correct');
    assert(course1Summary?.courseCreator?.name === creatorUser.name, 'Course Creator name included safely');
    assert(course1Summary?.totalTopics === 3, 'Course 1 has totalTopics === 3');
    assert(course1Summary?.completedTopics === 2, 'Course 1 has completedTopics === 2');
    assert(course1Summary?.completionPercentage === 67, 'Course 1 completionPercentage === 67% (Math.round((2/3)*100))');
    assert(course1Summary?.isCompleted === false, 'Course 1 isCompleted === false');
    assert(Boolean(course1Summary?.enrolledAt), 'Course 1 has real enrolledAt timestamp');

    // Empty Course (Zero Topics) Progress Metrics (Division-by-Zero Safety)
    const emptyCourseSummary = dataA?.courses?.find((c) => c.courseId === emptyCourse._id.toString());
    assert(Boolean(emptyCourseSummary), 'Empty course summary exists');
    assert(emptyCourseSummary?.totalTopics === 0, 'Empty course totalTopics === 0');
    assert(emptyCourseSummary?.completedTopics === 0, 'Empty course completedTopics === 0');
    assert(emptyCourseSummary?.completionPercentage === 0, 'Empty course completionPercentage === 0 without division error');
    assert(emptyCourseSummary?.isCompleted === false, 'Empty course isCompleted === false');

    // Recent Courses
    assert(Array.isArray(dataA?.recentCourses), 'recentCourses is an array');
    assert(dataA?.recentCourses?.length === 2, 'recentCourses contains 2 published courses');
    assert(
      dataA?.recentCourses[0]?.courseId === emptyCourse._id.toString(),
      'Most recently enrolled course appears first in recentCourses'
    );

    // -------------------------------------------------------------------------
    // SECTION 3: CROSS-STUDENT ISOLATION
    // -------------------------------------------------------------------------
    console.log('\n--- Section 3: Cross-Student Isolation ---');

    // Student B queries dashboard
    const studentBRes = await request('/api/student/dashboard', {}, studentBToken);
    assert(studentBRes.status === 200, 'GET dashboard for Student B returns 200 OK');

    const dataB = studentBRes.data?.data;
    assert(dataB?.student?.id === studentB._id.toString(), 'Student B identity is strictly Student B');
    assert(dataB?.stats?.totalEnrollments === 1, 'Student B has exactly 1 enrollment');
    assert(dataB?.stats?.inProgressCourses === 0, 'Student B has 0 in-progress courses (0 completed topics)');
    assert(dataB?.stats?.completedCourses === 0, 'Student B has 0 completed courses');

    const course1B = dataB?.courses?.find((c) => c.courseId === course1._id.toString());
    assert(course1B?.totalTopics === 3, 'Course 1 for Student B has totalTopics === 3');
    assert(course1B?.completedTopics === 0, 'Course 1 for Student B has completedTopics === 0 (no leak from Student A)');
    assert(course1B?.completionPercentage === 0, 'Course 1 for Student B has completionPercentage === 0');
    assert(course1B?.isCompleted === false, 'Course 1 for Student B isCompleted === false');

    // -------------------------------------------------------------------------
    // SECTION 4: STUDENT WITH NO ENROLLMENTS (EMPTY DASHBOARD)
    // -------------------------------------------------------------------------
    console.log('\n--- Section 4: Student with Zero Enrollments ---');

    const emptyStudentRes = await request('/api/student/dashboard', {}, studentEmptyToken);
    assert(emptyStudentRes.status === 200, 'Student with zero enrollments receives 200 OK');

    const dataEmpty = emptyStudentRes.data?.data;
    assert(dataEmpty?.student?.id === studentEmpty._id.toString(), 'Student identity returned safely');
    assert(dataEmpty?.stats?.totalEnrollments === 0, 'stats.totalEnrollments is 0');
    assert(dataEmpty?.stats?.activeEnrollments === 0, 'stats.activeEnrollments is 0');
    assert(dataEmpty?.stats?.completedEnrollments === 0, 'stats.completedEnrollments is 0');
    assert(dataEmpty?.stats?.inProgressCourses === 0, 'stats.inProgressCourses is 0');
    assert(dataEmpty?.stats?.completedCourses === 0, 'stats.completedCourses is 0');
    assert(Array.isArray(dataEmpty?.courses) && dataEmpty.courses.length === 0, 'courses is safe empty array []');
    assert(Array.isArray(dataEmpty?.recentCourses) && dataEmpty.recentCourses.length === 0, 'recentCourses is safe empty array []');

    // -------------------------------------------------------------------------
    // SECTION 5: FULL COURSE COMPLETION FLOW
    // -------------------------------------------------------------------------
    console.log('\n--- Section 5: Full Course Completion State in Dashboard ---');

    // Student A completes Topic 3 of Course 1 (now 3/3 topics completed -> 100%)
    const progA3 = await TopicProgress.create({
      userId: studentA._id,
      courseId: course1._id,
      moduleId: mod2Course1._id,
      topicId: topic3Mod2._id,
      completedAt: new Date(),
    });
    createdProgressIds.push(progA3._id);

    const completedDashboardRes = await request('/api/student/dashboard', {}, studentAToken);
    const dataCompleted = completedDashboardRes.data?.data;

    assert(dataCompleted?.stats?.completedCourses === 1, 'stats.completedCourses is now 1');
    assert(dataCompleted?.stats?.inProgressCourses === 0, 'stats.inProgressCourses is 0 (all topics done)');

    const c1Completed = dataCompleted?.courses?.find((c) => c.courseId === course1._id.toString());
    assert(c1Completed?.completedTopics === 3, 'Course 1 completedTopics === 3');
    assert(c1Completed?.completionPercentage === 100, 'Course 1 completionPercentage === 100%');
    assert(c1Completed?.isCompleted === true, 'Course 1 isCompleted === true');

    // -------------------------------------------------------------------------
    // SECTION 6: NO FAKE METRICS & ZERO SENSITIVE INFORMATION DISCLOSURE
    // -------------------------------------------------------------------------
    console.log('\n--- Section 6: Anti-Slop Check & Zero Information Disclosure ---');

    const serialized = JSON.stringify(dataCompleted);

    // Verify no fake XP, streaks, levels, ratings, or recommendations
    assert(!serialized.includes('"xp"'), 'No fake "xp" property in dashboard response');
    assert(!serialized.includes('"streak"'), 'No fake "streak" property in dashboard response');
    assert(!serialized.includes('"level"'), 'No fake "level" property in dashboard response');
    assert(!serialized.includes('"rating"'), 'No fake "rating" property in dashboard response');
    assert(!serialized.includes('"recommendations"'), 'No fake "recommendations" property in dashboard response');

    // Verify no sensitive fields
    assert(!serialized.includes('password'), 'No password or hash exposed in dashboard response');
    assert(!serialized.includes('refreshToken'), 'No refresh token exposed');
    assert(!serialized.includes('secret'), 'No secret keys exposed');
    assert(!serialized.includes('__v'), 'No Mongoose internal __v exposed');

    // -------------------------------------------------------------------------
    // SECTION 7: INCONSISTENT HIERARCHY & CORRUPTED RECORD RESILIENCE
    // -------------------------------------------------------------------------
    console.log('\n--- Section 7: Inconsistent Hierarchy & Corrupted Record Resilience ---');

    // Create an orphaned / mismatched topic in Course 1 whose moduleId belongs to another dummy course
    const foreignCourse = await Course.create({
      title: `Foreign Course ${auditRunId}`,
      description: 'Foreign course for hierarchy testing',
      category: 'Test',
      courseCreator: creatorUser._id,
      status: 'published',
    });
    createdCourseIds.push(foreignCourse._id);

    const foreignModule = await Module.create({
      courseId: foreignCourse._id,
      title: 'Foreign Module',
      order: 0,
    });
    createdModuleIds.push(foreignModule._id);

    // Topic pointing to course1, but moduleId is foreignModule (cross-course mismatch)
    const mismatchedTopic = await Topic.create({
      courseId: course1._id,
      moduleId: foreignModule._id,
      title: 'Mismatched Topic',
      order: 99,
    });
    createdTopicIds.push(mismatchedTopic._id);

    const hierarchyTestRes = await request('/api/student/dashboard', {}, studentAToken);
    const dataHierarchy = hierarchyTestRes.data?.data;
    const course1AfterMismatched = dataHierarchy?.courses?.find((c) => c.courseId === course1._id.toString());

    // Mismatched topic should NOT inflate course 1's valid topic count
    assert(
      course1AfterMismatched?.totalTopics === 3,
      'Inconsistent hierarchy topic is excluded from totalTopics (remains 3)'
    );

    // -------------------------------------------------------------------------
    // SECTION 8: COMPLETED ENROLLMENT STATUS & READ-ONLY SAFETY
    // -------------------------------------------------------------------------
    console.log('\n--- Section 8: Completed Enrollment Lifecycle & Read-Only Invariance ---');

    // Transition Course 1 enrollment for Student A to 'completed'
    await Enrollment.findByIdAndUpdate(enrollStudentACourse1._id, { status: 'completed' });

    const enrollStatusRes = await request('/api/student/dashboard', {}, studentAToken);
    const dataEnrollStatus = enrollStatusRes.data?.data;

    assert(dataEnrollStatus?.stats?.totalEnrollments === 2, 'stats.totalEnrollments remains 2');
    assert(dataEnrollStatus?.stats?.activeEnrollments === 1, 'stats.activeEnrollments is 1');
    assert(dataEnrollStatus?.stats?.completedEnrollments === 1, 'stats.completedEnrollments is 1');

    // Revert back for cleanup consistency
    await Enrollment.findByIdAndUpdate(enrollStudentACourse1._id, { status: 'active' });

    // Read-Only Invariance: Verify counts of database records before and after repeated calls
    const progressCountBefore = await TopicProgress.countDocuments({ userId: studentA._id });
    const enrollmentCountBefore = await Enrollment.countDocuments({ userId: studentA._id });

    await request('/api/student/dashboard', {}, studentAToken);
    await request('/api/student/dashboard', {}, studentAToken);

    const progressCountAfter = await TopicProgress.countDocuments({ userId: studentA._id });
    const enrollmentCountAfter = await Enrollment.countDocuments({ userId: studentA._id });

    assert(
      progressCountBefore === progressCountAfter,
      'GET /api/student/dashboard is strictly read-only: TopicProgress records unchanged'
    );
    assert(
      enrollmentCountBefore === enrollmentCountAfter,
      'GET /api/student/dashboard is strictly read-only: Enrollment records unchanged'
    );

  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n--- Cleanup: Purging Test Artifacts ---');
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
    console.log('✓ All audit artifacts safely purged from database');
  }

  console.log('\n================================================================');
  console.log(`=== Audit 7D-1 Complete: ${passedTests}/${totalTests} Passed (${failedTests} Failed) ===`);
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
