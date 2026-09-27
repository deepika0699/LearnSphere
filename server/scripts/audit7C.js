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
  console.log('=== Step 7C — Student Topic Progress Backend Audit ===');
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

    const studentUnenrolled = await User.create({
      name: `Student Unenrolled ${auditRunId}`,
      email: `student_unenrolled_${auditRunId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'student',
      status: 'active',
    });
    createdUserIds.push(studentUnenrolled._id);
    const studentUnenrolledToken = generateAccessToken({
      userId: studentUnenrolled._id,
      role: studentUnenrolled.role,
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

    // 2. Published Course 1 (with 2 modules, 3 topics total)
    const publishedCourse1 = await Course.create({
      title: `Published Course 1 ${auditRunId}`,
      description: 'Course 1 for topic progress testing.',
      category: 'Computer Science',
      courseCreator: creatorUser._id,
      status: 'published',
    });
    createdCourseIds.push(publishedCourse1._id);

    const mod1Course1 = await Module.create({
      courseId: publishedCourse1._id,
      title: 'Module 1 - Fundamentals',
      order: 0,
    });
    createdModuleIds.push(mod1Course1._id);

    const topic1Mod1 = await Topic.create({
      courseId: publishedCourse1._id,
      moduleId: mod1Course1._id,
      title: 'Topic 1 - Variables',
      order: 0,
    });
    createdTopicIds.push(topic1Mod1._id);

    const topic2Mod1 = await Topic.create({
      courseId: publishedCourse1._id,
      moduleId: mod1Course1._id,
      title: 'Topic 2 - Operators',
      order: 1,
    });
    createdTopicIds.push(topic2Mod1._id);

    const mod2Course1 = await Module.create({
      courseId: publishedCourse1._id,
      title: 'Module 2 - Control Flow',
      order: 1,
    });
    createdModuleIds.push(mod2Course1._id);

    const topic3Mod2 = await Topic.create({
      courseId: publishedCourse1._id,
      moduleId: mod2Course1._id,
      title: 'Topic 3 - Loops',
      order: 0,
    });
    createdTopicIds.push(topic3Mod2._id);

    // 3. Published Course 2 (Course without topics to test division by zero)
    const emptyPublishedCourse = await Course.create({
      title: `Empty Course ${auditRunId}`,
      description: 'Empty course with zero topics.',
      category: 'Mathematics',
      courseCreator: creatorUser._id,
      status: 'published',
    });
    createdCourseIds.push(emptyPublishedCourse._id);

    // 4. Foreign Course (for hierarchy mismatch testing)
    const foreignCourse = await Course.create({
      title: `Foreign Course ${auditRunId}`,
      description: 'Foreign course for hierarchy mismatch test.',
      category: 'Security',
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

    const foreignTopic = await Topic.create({
      courseId: foreignCourse._id,
      moduleId: foreignModule._id,
      title: 'Foreign Topic',
      order: 0,
    });
    createdTopicIds.push(foreignTopic._id);

    // 5. Draft Course
    const draftCourse = await Course.create({
      title: `Draft Course ${auditRunId}`,
      description: 'Draft course.',
      category: 'DevOps',
      courseCreator: creatorUser._id,
      status: 'draft',
    });
    createdCourseIds.push(draftCourse._id);

    // 6. Archived Course
    const archivedCourse = await Course.create({
      title: `Archived Course ${auditRunId}`,
      description: 'Archived course.',
      category: 'Design',
      courseCreator: creatorUser._id,
      status: 'archived',
    });
    createdCourseIds.push(archivedCourse._id);

    // Enrollments: Student A and Student B enrolled in Course 1; Student A enrolled in empty course
    const enrollStudentACourse1 = await Enrollment.create({
      userId: studentA._id,
      courseId: publishedCourse1._id,
      status: 'active',
    });
    createdEnrollmentIds.push(enrollStudentACourse1._id);

    const enrollStudentBCourse1 = await Enrollment.create({
      userId: studentB._id,
      courseId: publishedCourse1._id,
      status: 'active',
    });
    createdEnrollmentIds.push(enrollStudentBCourse1._id);

    const enrollStudentAEmpty = await Enrollment.create({
      userId: studentA._id,
      courseId: emptyPublishedCourse._id,
      status: 'active',
    });
    createdEnrollmentIds.push(enrollStudentAEmpty._id);

    assert(true, 'Test fixtures, courses, modules, and enrollments prepared successfully');

    // -------------------------------------------------------------------------
    // SECTION 1: AUTHENTICATION & ROLE-BASED ACCESS CONTROL
    // -------------------------------------------------------------------------
    console.log('\n--- Section 1: Authentication & Authorization Access Control ---');

    // Unauthenticated requests
    const unauthPut = await request(`/api/student/progress/${publishedCourse1._id}/${topic1Mod1._id}`, { method: 'PUT' });
    assert(unauthPut.status === 401, 'PUT progress without token returns 401 Unauthorized');

    const unauthDel = await request(`/api/student/progress/${publishedCourse1._id}/${topic1Mod1._id}`, { method: 'DELETE' });
    assert(unauthDel.status === 401, 'DELETE progress without token returns 401 Unauthorized');

    const unauthGet = await request(`/api/student/progress/${publishedCourse1._id}`);
    assert(unauthGet.status === 401, 'GET progress without token returns 401 Unauthorized');

    const unauthSummary = await request(`/api/student/progress/${publishedCourse1._id}/summary`);
    assert(unauthSummary.status === 401, 'GET summary without token returns 401 Unauthorized');

    // Course Creator accessing student progress routes
    const creatorPut = await request(
      `/api/student/progress/${publishedCourse1._id}/${topic1Mod1._id}`,
      { method: 'PUT' },
      creatorToken
    );
    assert(creatorPut.status === 403, 'Course Creator attempting PUT progress returns 403 Forbidden');

    const creatorGet = await request(`/api/student/progress/${publishedCourse1._id}`, {}, creatorToken);
    assert(creatorGet.status === 403, 'Course Creator attempting GET progress returns 403 Forbidden');

    // Admin accessing student progress routes
    const adminPut = await request(
      `/api/student/progress/${publishedCourse1._id}/${topic1Mod1._id}`,
      { method: 'PUT' },
      adminToken
    );
    assert(adminPut.status === 403, 'Admin attempting PUT progress returns 403 Forbidden');

    const adminGet = await request(`/api/student/progress/${publishedCourse1._id}`, {}, adminToken);
    assert(adminGet.status === 403, 'Admin attempting GET progress returns 403 Forbidden');

    // Inactive & Deleted student tokens
    const inactivePut = await request(
      `/api/student/progress/${publishedCourse1._id}/${topic1Mod1._id}`,
      { method: 'PUT' },
      inactiveStudentToken
    );
    assert(inactivePut.status === 401, 'Inactive student token returns 401 Unauthorized');

    const deletedPut = await request(
      `/api/student/progress/${publishedCourse1._id}/${topic1Mod1._id}`,
      { method: 'PUT' },
      deletedStudentToken
    );
    assert(deletedPut.status === 401, 'Deleted student token returns 401 Unauthorized');

    // -------------------------------------------------------------------------
    // SECTION 2: ENROLLMENT & PUBLISHED COURSE ELIGIBILITY CONTROLS
    // -------------------------------------------------------------------------
    console.log('\n--- Section 2: Enrollment & Course Eligibility Controls ---');

    // Student without enrollment
    const unenrolledPut = await request(
      `/api/student/progress/${publishedCourse1._id}/${topic1Mod1._id}`,
      { method: 'PUT' },
      studentUnenrolledToken
    );
    assert(unenrolledPut.status === 403, 'Student without enrollment attempting PUT progress returns 403 Forbidden');

    const unenrolledGet = await request(
      `/api/student/progress/${publishedCourse1._id}`,
      {},
      studentUnenrolledToken
    );
    assert(unenrolledGet.status === 403, 'Student without enrollment attempting GET progress returns 403 Forbidden');

    const unenrolledSummary = await request(
      `/api/student/progress/${publishedCourse1._id}/summary`,
      {},
      studentUnenrolledToken
    );
    assert(unenrolledSummary.status === 403, 'Student without enrollment attempting GET summary returns 403 Forbidden');

    // Attempting progress on Draft Course
    const draftPut = await request(
      `/api/student/progress/${draftCourse._id}/${topic1Mod1._id}`,
      { method: 'PUT' },
      studentAToken
    );
    assert(draftPut.status === 400, 'Attempting progress on draft course returns 400 Bad Request');
    assert(draftPut.data?.message?.includes('published'), 'Error message specifies published courses required');

    // Attempting progress on Archived Course
    const archivedPut = await request(
      `/api/student/progress/${archivedCourse._id}/${topic1Mod1._id}`,
      { method: 'PUT' },
      studentAToken
    );
    assert(archivedPut.status === 400, 'Attempting progress on archived course returns 400 Bad Request');

    // Missing Course (valid non-existent ObjectId)
    const fakeCourseId = new mongoose.Types.ObjectId().toString();
    const missingCoursePut = await request(
      `/api/student/progress/${fakeCourseId}/${topic1Mod1._id}`,
      { method: 'PUT' },
      studentAToken
    );
    assert(missingCoursePut.status === 404, 'Missing course returns 404 Not Found');

    // Missing Topic (valid non-existent ObjectId)
    const fakeTopicId = new mongoose.Types.ObjectId().toString();
    const missingTopicPut = await request(
      `/api/student/progress/${publishedCourse1._id}/${fakeTopicId}`,
      { method: 'PUT' },
      studentAToken
    );
    assert(missingTopicPut.status === 404, 'Missing topic returns 404 Not Found');

    // Malformed ObjectIds
    const malformedCoursePut = await request(
      `/api/student/progress/invalid-course-id/${topic1Mod1._id}`,
      { method: 'PUT' },
      studentAToken
    );
    assert(malformedCoursePut.status === 400, 'Malformed course ID returns 400 Bad Request');

    const malformedTopicPut = await request(
      `/api/student/progress/${publishedCourse1._id}/invalid-topic-id`,
      { method: 'PUT' },
      studentAToken
    );
    assert(malformedTopicPut.status === 400, 'Malformed topic ID returns 400 Bad Request');

    // -------------------------------------------------------------------------
    // SECTION 3: HIERARCHY MISMATCH VALIDATION
    // -------------------------------------------------------------------------
    console.log('\n--- Section 3: Hierarchy Mismatch Validation ---');

    // Topic belongs to Foreign Course, but request specifies Course 1
    const mismatchCoursePut = await request(
      `/api/student/progress/${publishedCourse1._id}/${foreignTopic._id}`,
      { method: 'PUT' },
      studentAToken
    );
    assert(mismatchCoursePut.status === 400, 'Mismatched topic and course returns 400 Bad Request');
    assert(
      mismatchCoursePut.data?.message?.includes('Topic does not belong to the specified course'),
      'Hierarchy rejection error message is descriptive and accurate'
    );

    // -------------------------------------------------------------------------
    // SECTION 4: PROGRESS MUTATION, IDEMPOTENCY & MASS ASSIGNMENT IMMUNITY
    // -------------------------------------------------------------------------
    console.log('\n--- Section 4: Progress Mutation, Idempotency & Mass Assignment ---');

    // Student A completes Topic 1 while submitting spoofed payload
    const spoofedPayload = JSON.stringify({
      userId: studentB._id.toString(), // Attacker tries to complete for student B
      courseId: foreignCourse._id.toString(),
      moduleId: foreignModule._id.toString(),
      completedAt: '1970-01-01T00:00:00.000Z',
    });

    const completeRes1 = await request(
      `/api/student/progress/${publishedCourse1._id}/${topic1Mod1._id}`,
      { method: 'PUT', body: spoofedPayload },
      studentAToken
    );

    assert(completeRes1.status === 200, 'PUT progress returns 200 OK on completion');
    assert(completeRes1.data?.status === 'success', 'Response status is "success"');
    assert(completeRes1.data?.message === 'Topic marked as completed', 'Message states "Topic marked as completed"');

    const progressObj1 = completeRes1.data?.data?.progress;
    assert(Boolean(progressObj1?.id), 'Response contains normalized progress id');
    assert(progressObj1?.userId === studentA._id.toString(), 'userId is strictly server-derived Student A (spoofed userId ignored)');
    assert(progressObj1?.courseId === publishedCourse1._id.toString(), 'courseId matches target course');
    assert(progressObj1?.moduleId === mod1Course1._id.toString(), 'moduleId is server-resolved from database');
    assert(progressObj1?.topicId === topic1Mod1._id.toString(), 'topicId matches target topic');
    assert(new Date(progressObj1?.completedAt).getFullYear() >= 2026, 'completedAt is server-derived timestamp (spoofed 1970 ignored)');
    assert(completeRes1.data?.data?.alreadyCompleted === false, 'alreadyCompleted flag is false on initial complete');

    createdProgressIds.push(progressObj1?.id);

    // Idempotency: Repeated PUT completion request
    const completeResRepeated = await request(
      `/api/student/progress/${publishedCourse1._id}/${topic1Mod1._id}`,
      { method: 'PUT' },
      studentAToken
    );

    assert(completeResRepeated.status === 200, 'Repeated PUT progress returns 200 OK');
    assert(completeResRepeated.data?.data?.alreadyCompleted === true, 'Repeated PUT indicates alreadyCompleted: true');
    assert(
      completeResRepeated.data?.data?.progress?.id === progressObj1.id,
      'Same progress document ID is preserved without creating duplicates'
    );

    // Verify in MongoDB: Exactly 1 record exists for (studentA, topic1)
    const dbProgressCount = await TopicProgress.countDocuments({
      userId: studentA._id,
      topicId: topic1Mod1._id,
    });
    assert(dbProgressCount === 1, 'MongoDB strictly contains exactly 1 progress record for user & topic');

    // Student A completes Topic 2
    const completeRes2 = await request(
      `/api/student/progress/${publishedCourse1._id}/${topic2Mod1._id}`,
      { method: 'PUT' },
      studentAToken
    );
    assert(completeRes2.status === 200, 'Student A completes Topic 2 (200 OK)');
    createdProgressIds.push(completeRes2.data?.data?.progress?.id);

    // -------------------------------------------------------------------------
    // SECTION 5: CROSS-STUDENT PROGRESS ISOLATION
    // -------------------------------------------------------------------------
    console.log('\n--- Section 5: Cross-Student Progress Isolation ---');

    // Query Student A progress
    const studentAGet = await request(`/api/student/progress/${publishedCourse1._id}`, {}, studentAToken);
    assert(studentAGet.status === 200, 'GET /api/student/progress/:courseId returns 200 for Student A');
    assert(studentAGet.data?.data?.completedCount === 2, 'Student A has completedCount === 2');
    assert(studentAGet.data?.data?.completedTopicIds?.includes(topic1Mod1._id.toString()), 'Topic 1 is in completedTopicIds');
    assert(studentAGet.data?.data?.completedTopicIds?.includes(topic2Mod1._id.toString()), 'Topic 2 is in completedTopicIds');

    // Query Student B progress (Student B has completed 0 topics)
    const studentBGet = await request(`/api/student/progress/${publishedCourse1._id}`, {}, studentBToken);
    assert(studentBGet.status === 200, 'GET /api/student/progress/:courseId returns 200 for Student B');
    assert(studentBGet.data?.data?.completedCount === 0, 'Student B completedCount is 0 (no progress leaked from Student A)');
    assert(studentBGet.data?.data?.completedTopicIds?.length === 0, 'Student B completedTopicIds is empty []');

    // Student B attempts to delete Student A's progress for Topic 1
    const studentBDelStudentA = await request(
      `/api/student/progress/${publishedCourse1._id}/${topic1Mod1._id}`,
      { method: 'DELETE' },
      studentBToken
    );
    assert(studentBDelStudentA.status === 200, 'DELETE from Student B returns 200 OK (idempotent)');
    assert(studentBDelStudentA.data?.data?.wasRemoved === false, 'wasRemoved is false because Student B had no record to remove');

    // Verify Student A's progress record was NOT deleted
    const studentACheck = await request(`/api/student/progress/${publishedCourse1._id}`, {}, studentAToken);
    assert(studentACheck.data?.data?.completedCount === 2, "Student A's progress remains intact after Student B delete call");

    // -------------------------------------------------------------------------
    // SECTION 6: PROGRESS SUMMARY ACCURACY & CALCULATION INTEGRITY
    // -------------------------------------------------------------------------
    console.log('\n--- Section 6: Progress Summary & Calculation Integrity ---');

    // Student A summary for Course 1 (totalTopics: 3, completedTopics: 2 -> 67%)
    const summaryRes = await request(`/api/student/progress/${publishedCourse1._id}/summary`, {}, studentAToken);
    assert(summaryRes.status === 200, 'GET summary returns 200 OK');
    assert(summaryRes.data?.data?.totalTopics === 3, 'totalTopics is 3');
    assert(summaryRes.data?.data?.completedTopics === 2, 'completedTopics is 2');
    assert(
      summaryRes.data?.data?.completionPercentage === 67,
      'completionPercentage is 67% (Math.round((2/3)*100))'
    );
    assert(summaryRes.data?.data?.isCompleted === false, 'isCompleted is false (2/3 topics done)');

    // Student B summary for Course 1 (totalTopics: 3, completedTopics: 0 -> 0%)
    const summaryBRes = await request(`/api/student/progress/${publishedCourse1._id}/summary`, {}, studentBToken);
    assert(summaryBRes.status === 200, 'GET summary for Student B returns 200 OK');
    assert(summaryBRes.data?.data?.totalTopics === 3, 'Student B totalTopics is 3');
    assert(summaryBRes.data?.data?.completedTopics === 0, 'Student B completedTopics is 0');
    assert(summaryBRes.data?.data?.completionPercentage === 0, 'Student B completionPercentage is 0');
    assert(summaryBRes.data?.data?.isCompleted === false, 'isCompleted is false');

    // Empty course summary (0 topics -> division by zero avoidance test)
    const emptySummaryRes = await request(
      `/api/student/progress/${emptyPublishedCourse._id}/summary`,
      {},
      studentAToken
    );
    assert(emptySummaryRes.status === 200, 'Empty course summary returns 200 OK');
    assert(emptySummaryRes.data?.data?.totalTopics === 0, 'Empty course totalTopics is 0');
    assert(emptySummaryRes.data?.data?.completedTopics === 0, 'Empty course completedTopics is 0');
    assert(emptySummaryRes.data?.data?.completionPercentage === 0, 'Empty course completionPercentage is strictly 0 without division errors');
    assert(emptySummaryRes.data?.data?.isCompleted === false, 'Empty course isCompleted is false');

    // Student A completes Topic 3 (all topics completed)
    const completeRes3 = await request(
      `/api/student/progress/${publishedCourse1._id}/${topic3Mod2._id}`,
      { method: 'PUT' },
      studentAToken
    );
    assert(completeRes3.status === 200, 'Student A completes Topic 3');
    createdProgressIds.push(completeRes3.data?.data?.progress?.id);

    const fullSummaryRes = await request(
      `/api/student/progress/${publishedCourse1._id}/summary`,
      {},
      studentAToken
    );
    assert(fullSummaryRes.data?.data?.completedTopics === 3, 'Student A completedTopics is 3/3');
    assert(fullSummaryRes.data?.data?.completionPercentage === 100, 'completionPercentage is 100%');
    assert(fullSummaryRes.data?.data?.isCompleted === true, 'isCompleted is true when all topics done');

    // -------------------------------------------------------------------------
    // SECTION 7: TOPIC UNCOMPLETION (DELETE) & IDEMPOTENCY
    // -------------------------------------------------------------------------
    console.log('\n--- Section 7: Topic Uncompletion & Idempotency ---');

    // Student A marks Topic 3 as incomplete
    const uncompleteRes = await request(
      `/api/student/progress/${publishedCourse1._id}/${topic3Mod2._id}`,
      { method: 'DELETE' },
      studentAToken
    );

    assert(uncompleteRes.status === 200, 'DELETE topic progress returns 200 OK');
    assert(uncompleteRes.data?.status === 'success', 'Response status is "success"');
    assert(uncompleteRes.data?.data?.completed === false, 'Response data indicates completed: false');
    assert(uncompleteRes.data?.data?.wasRemoved === true, 'wasRemoved is true');

    // Verify progress was removed from DB
    const progressAfterDelete = await TopicProgress.findOne({
      userId: studentA._id,
      topicId: topic3Mod2._id,
    });
    assert(progressAfterDelete === null, 'Progress document removed from MongoDB');

    // Repeated deletion is safe and idempotent
    const uncompleteRepeated = await request(
      `/api/student/progress/${publishedCourse1._id}/${topic3Mod2._id}`,
      { method: 'DELETE' },
      studentAToken
    );
    assert(uncompleteRepeated.status === 200, 'Repeated DELETE returns 200 OK');
    assert(uncompleteRepeated.data?.data?.wasRemoved === false, 'wasRemoved is false on second deletion');

    // Verify summary reflects topic deletion (back to 2/3 and 67%)
    const summaryAfterDelete = await request(
      `/api/student/progress/${publishedCourse1._id}/summary`,
      {},
      studentAToken
    );
    assert(summaryAfterDelete.data?.data?.completedTopics === 2, 'completedTopics updated back to 2');
    assert(summaryAfterDelete.data?.data?.completionPercentage === 67, 'completionPercentage is 67%');
    assert(summaryAfterDelete.data?.data?.isCompleted === false, 'isCompleted is false');

    // -------------------------------------------------------------------------
    // SECTION 8: ZERO SENSITIVE INFORMATION DISCLOSURE
    // -------------------------------------------------------------------------
    console.log('\n--- Section 8: Zero Sensitive Information Disclosure ---');

    const jsonDump = JSON.stringify(completeRes1.data) + JSON.stringify(studentAGet.data) + JSON.stringify(summaryRes.data);
    assert(!jsonDump.includes('password'), 'No password or hash exposed in progress endpoints');
    assert(!jsonDump.includes('refreshToken'), 'No refresh token exposed');
    assert(!jsonDump.includes('secret'), 'No secret key exposed');
    assert(!jsonDump.includes('__v'), 'No Mongoose __v exposed');

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
  console.log(`=== Audit 7C Complete: ${passedTests}/${totalTests} Passed (${failedTests} Failed) ===`);
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
