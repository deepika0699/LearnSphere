/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * LearnSphere Phase 11G: Comprehensive Certificate Tests & Security Audit
 *
 * Verifies that the complete Phase 11 academic certificate system is:
 * - Authoritatively aligned with Phase 9 course completion criteria
 * - Idempotent and concurrency-safe against race conditions
 * - Strictly isolated between tenant students (zero cross-student leakage)
 * - Safe against mass assignment and NoSQL injection attacks
 * - Strictly whitelisted on public verification endpoints
 * - Protected by rate limiting and format validation
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
import TopicProgress from '../models/TopicProgress.js';
import Certificate from '../models/Certificate.js';
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

async function runPhase11GAudit() {
  console.log('===================================================================');
  console.log('=== LearnSphere Phase 11G: Comprehensive Certificate Tests & Audit ===');
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
  const createdCertificateIds = [];

  try {
    // -------------------------------------------------------------------------
    // SETUP: Test Fixtures
    // -------------------------------------------------------------------------
    console.log('--- Setup: Test Fixtures & Accounts ---');

    const instructor = await User.create({
      name: `Instructor 11G ${runId}`,
      email: `instructor_11g_${runId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'courseCreator',
      status: 'active',
    });
    createdUserIds.push(instructor._id);
    const instructorToken = generateAccessToken({ userId: instructor._id, role: instructor.role });

    const studentA = await User.create({
      name: `Alice Student ${runId}`,
      email: `student_a_11g_${runId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'student',
      status: 'active',
    });
    createdUserIds.push(studentA._id);
    const tokenA = generateAccessToken({ userId: studentA._id, role: studentA.role });

    const studentB = await User.create({
      name: `Bob Student ${runId}`,
      email: `student_b_11g_${runId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'student',
      status: 'active',
    });
    createdUserIds.push(studentB._id);
    const tokenB = generateAccessToken({ userId: studentB._id, role: studentB.role });

    const studentC = await User.create({
      name: `Charlie Student ${runId}`,
      email: `student_c_11g_${runId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'student',
      status: 'active',
    });
    createdUserIds.push(studentC._id);
    const tokenC = generateAccessToken({ userId: studentC._id, role: studentC.role });

    assert(tokenA && tokenB && tokenC && instructorToken, 'Test users and access tokens created');

    // -------------------------------------------------------------------------
    // SCENARIO 1: Full Lifecycle Certificate Issuance on Completed Course
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 1: Authoritative Certificate Issuance (Completed Course) ---');

    const course1 = await Course.create({
      title: `Advanced Cloud Architecture ${runId}`,
      description: 'Comprehensive cloud design mastery.',
      courseCreator: instructor._id,
      description: 'Test course description',
      category: 'Computer Science',
      status: 'published',
    });
    createdCourseIds.push(course1._id);

    const mod1 = await Module.create({
      courseId: course1._id,
      title: 'Module 1: Cloud Basics',
      order: 1,
    });
    createdModuleIds.push(mod1._id);

    const topic1_1 = await Topic.create({
      courseId: course1._id,
      moduleId: mod1._id,
      title: 'Topic 1.1: Distributed Compute',
      order: 1,
    });
    createdTopicIds.push(topic1_1._id);

    const topic1_2 = await Topic.create({
      courseId: course1._id,
      moduleId: mod1._id,
      title: 'Topic 1.2: Serverless Patterns',
      order: 2,
    });
    createdTopicIds.push(topic1_2._id);

    const optCorrect1 = new mongoose.Types.ObjectId();
    const optWrong1 = new mongoose.Types.ObjectId();

    const quiz1 = await Assessment.create({
      courseId: course1._id,
      moduleId: mod1._id,
      topicId: topic1_2._id,
      createdBy: instructor._id,
      title: `Cloud Architecture Exam ${runId}`,
      type: 'topic',
      passingScore: 50,
      timeLimitMinutes: 0,
      maxAttempts: 5,
      status: 'published',
      questions: [
        {
          prompt: 'What enables auto-scaling in cloud environments?',
          options: [
            { _id: optCorrect1, text: 'Horizontal autoscaling', order: 1 },
            { _id: optWrong1, text: 'Static IP', order: 2 },
          ],
          correctOptionId: optCorrect1,
          explanation: 'Autoscalers dynamically add replicas',
          order: 1,
        },
      ],
    });
    createdAssessmentIds.push(quiz1._id);

    // Student A enrolls in Course 1
    const enroll1Res = await request(`/api/student/enroll/${course1._id}`, { method: 'POST' }, tokenA);
    assert(enroll1Res.status === 201, 'Student A enrolls in Course 1 (201 Created)');
    createdEnrollmentIds.push(enroll1Res.data?.data?.enrollment?.id);

    // Complete Topic 1.1
    await request(`/api/student/progress/${course1._id}/${topic1_1._id}`, { method: 'PUT' }, tokenA);

    // Complete Topic 1.2
    await request(`/api/student/progress/${course1._id}/${topic1_2._id}`, { method: 'PUT' }, tokenA);

    // Attempt and pass Quiz 1
    const startAttemptRes = await request(
      `/api/student/courses/${course1._id}/assessments/${quiz1._id}/start`,
      { method: 'POST' },
      tokenA
    );
    assert(startAttemptRes.status === 201, 'Student A starts Quiz 1 attempt');
    const attempt1Id = startAttemptRes.data?.data?.attempt?.id;
    createdAttemptIds.push(attempt1Id);

    const submitRes = await request(
      `/api/student/courses/${course1._id}/assessments/${quiz1._id}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({
          answers: [
            {
              questionId: quiz1.questions[0]._id.toString(),
              selectedOptionId: optCorrect1.toString(),
            },
          ],
        }),
      },
      tokenA
    );
    assert(submitRes.data?.data?.attempt?.isPassed === true, 'Student A passes the assessment with 100%');

    // Claim Certificate
    const claimRes = await request(`/api/student/certificates/claim/${course1._id}`, { method: 'POST' }, tokenA);
    assert(claimRes.status === 200, 'Student A claims certificate for completed course (200 OK)');
    assert(claimRes.data?.status === 'success', 'Response status is success');
    assert(claimRes.data?.message === 'Certificate issued successfully', 'Response contains friendly success message');

    const cert1 = claimRes.data?.data?.certificate;
    assert(cert1 && cert1.certificateId, 'Certificate object contains certificateId');
    assert(
      /^LS-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}$/.test(cert1.certificateId),
      'Certificate ID matches canonical format (LS-XXXX-XXXX-XXXX)'
    );
    assert(cert1.studentName === `Alice Student ${runId}`, 'Snapshot student name matches authenticated student');
    assert(cert1.courseTitle === `Advanced Cloud Architecture ${runId}`, 'Snapshot course title matches course');
    assert(cert1.status === 'valid', 'Certificate status is valid');
    assert(cert1.completedAt !== null, 'completedAt timestamp is populated from authoritative enrollment');
    assert(cert1.issueDate !== null, 'issueDate timestamp is populated');
    assert(cert1.password === undefined, 'password is not exposed');
    assert(cert1.email === undefined, 'email is not exposed');
    assert(cert1.__v === undefined, '__v internal Mongoose field is omitted');

    const dbCert = await Certificate.findOne({ certificateId: cert1.certificateId });
    assert(dbCert !== null, 'Certificate record successfully persisted in MongoDB');
    if (dbCert) createdCertificateIds.push(dbCert._id);

    // -------------------------------------------------------------------------
    // SCENARIO 2: Certificate Issuance Rejected for Incomplete Criteria
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 2: Rejection of Incomplete / Unmet Criteria ---');

    // 2A: Incomplete Topics
    const course2 = await Course.create({
      title: `Course 2 Incomplete Topics ${runId}`,
      courseCreator: instructor._id,
      description: 'Test course description',
      category: 'Data Science',
      status: 'published',
    });
    createdCourseIds.push(course2._id);
    const mod2 = await Module.create({ courseId: course2._id, title: 'Mod 2', order: 1 });
    createdModuleIds.push(mod2._id);
    const t2_1 = await Topic.create({ courseId: course2._id, moduleId: mod2._id, title: 'T2.1', order: 1 });
    const t2_2 = await Topic.create({ courseId: course2._id, moduleId: mod2._id, title: 'T2.2', order: 2 });
    createdTopicIds.push(t2_1._id, t2_2._id);

    await request(`/api/student/enroll/${course2._id}`, { method: 'POST' }, tokenA);
    await request(`/api/student/progress/${course2._id}/${t2_1._id}`, { method: 'PUT' }, tokenA);
    // Topic 2.2 left incomplete!

    const claim2Res = await request(`/api/student/certificates/claim/${course2._id}`, { method: 'POST' }, tokenA);
    assert(claim2Res.status === 400, 'Claim rejected when topics incomplete (400 Bad Request)');
    assert(
      claim2Res.data?.message?.includes('requirements have not been satisfied'),
      'Message indicates course completion requirements not satisfied'
    );

    // 2B: Failed Assessment
    const course3 = await Course.create({
      title: `Course 3 Failed Quiz ${runId}`,
      courseCreator: instructor._id,
      description: 'Test course description',
      category: 'Design',
      status: 'published',
    });
    createdCourseIds.push(course3._id);
    const mod3 = await Module.create({ courseId: course3._id, title: 'Mod 3', order: 1 });
    createdModuleIds.push(mod3._id);
    const t3_1 = await Topic.create({ courseId: course3._id, moduleId: mod3._id, title: 'T3.1', order: 1 });
    createdTopicIds.push(t3_1._id);

    const optCorrect3 = new mongoose.Types.ObjectId();
    const optWrong3 = new mongoose.Types.ObjectId();

    const quiz3 = await Assessment.create({
      courseId: course3._id,
      moduleId: mod3._id,
      topicId: t3_1._id,
      createdBy: instructor._id,
      title: `Quiz 3 ${runId}`,
      type: 'topic',
      passingScore: 80,
      timeLimitMinutes: 0,
      maxAttempts: 5,
      status: 'published',
      questions: [
        {
          prompt: 'Question',
          options: [
            { _id: optCorrect3, text: 'Correct', order: 1 },
            { _id: optWrong3, text: 'Wrong', order: 2 },
          ],
          correctOptionId: optCorrect3,
          order: 1,
        },
      ],
    });
    createdAssessmentIds.push(quiz3._id);

    await request(`/api/student/enroll/${course3._id}`, { method: 'POST' }, tokenA);
    await request(`/api/student/progress/${course3._id}/${t3_1._id}`, { method: 'PUT' }, tokenA);

    const startAttempt3 = await request(
      `/api/student/courses/${course3._id}/assessments/${quiz3._id}/start`,
      { method: 'POST' },
      tokenA
    );
    const attempt3Id = startAttempt3.data?.data?.attempt?.id;
    createdAttemptIds.push(attempt3Id);

    await request(
      `/api/student/courses/${course3._id}/assessments/${quiz3._id}/submit`,
      {
        method: 'POST',
        body: JSON.stringify({
          answers: [
            {
              questionId: quiz3.questions[0]._id.toString(),
              selectedOptionId: optWrong3.toString(), // WRONG answer
            },
          ],
        }),
      },
      tokenA
    );

    const claim3Res = await request(`/api/student/certificates/claim/${course3._id}`, { method: 'POST' }, tokenA);
    assert(claim3Res.status === 400, 'Claim rejected when required assessment is failed (400 Bad Request)');

    // 2C: Unattempted Assessment
    const course4 = await Course.create({
      title: `Course 4 Unattempted Quiz ${runId}`,
      courseCreator: instructor._id,
      description: 'Test course description',
      category: 'Business',
      status: 'published',
    });
    createdCourseIds.push(course4._id);
    const mod4 = await Module.create({ courseId: course4._id, title: 'Mod 4', order: 1 });
    createdModuleIds.push(mod4._id);
    const t4_1 = await Topic.create({ courseId: course4._id, moduleId: mod4._id, title: 'T4.1', order: 1 });
    createdTopicIds.push(t4_1._id);

    const optCorrect4 = new mongoose.Types.ObjectId();
    const optWrong4 = new mongoose.Types.ObjectId();
    const quiz4 = await Assessment.create({
      courseId: course4._id,
      moduleId: mod4._id,
      topicId: t4_1._id,
      createdBy: instructor._id,
      title: `Quiz 4 ${runId}`,
      type: 'topic',
      passingScore: 50,
      timeLimitMinutes: 0,
      maxAttempts: 5,
      status: 'published',
      questions: [
        {
          prompt: 'Question 4 prompt',
          options: [
            { _id: optCorrect4, text: 'Correct Option', order: 1 },
            { _id: optWrong4, text: 'Wrong Option', order: 2 },
          ],
          correctOptionId: optCorrect4,
          order: 1,
        },
      ],
    });
    createdAssessmentIds.push(quiz4._id);

    await request(`/api/student/enroll/${course4._id}`, { method: 'POST' }, tokenA);
    await request(`/api/student/progress/${course4._id}/${t4_1._id}`, { method: 'PUT' }, tokenA);

    const claim4Res = await request(`/api/student/certificates/claim/${course4._id}`, { method: 'POST' }, tokenA);
    assert(claim4Res.status === 400, 'Claim rejected when assessment not attempted (400 Bad Request)');

    // 2D: Withdrawn Enrollment
    const course5 = await Course.create({
      title: `Course 5 Withdrawn ${runId}`,
      courseCreator: instructor._id,
      description: 'Test course description',
      category: 'Science',
      status: 'published',
    });
    createdCourseIds.push(course5._id);
    const enroll5 = await Enrollment.create({
      userId: studentA._id,
      courseId: course5._id,
      status: 'withdrawn',
    });
    createdEnrollmentIds.push(enroll5._id);

    const claim5Res = await request(`/api/student/certificates/claim/${course5._id}`, { method: 'POST' }, tokenA);
    assert(claim5Res.status === 403 || claim5Res.status === 400, 'Claim rejected for withdrawn enrollment (403/400)');

    // 2E: Missing Enrollment
    const course6 = await Course.create({
      title: `Course 6 Not Enrolled ${runId}`,
      courseCreator: instructor._id,
      description: 'Test course description',
      category: 'Arts',
      status: 'published',
    });
    createdCourseIds.push(course6._id);

    const claim6Res = await request(`/api/student/certificates/claim/${course6._id}`, { method: 'POST' }, tokenA);
    assert(claim6Res.status === 400 || claim6Res.status === 403, 'Claim rejected when student is not enrolled');

    // 2F: Unpublished / Draft Course
    const course7 = await Course.create({
      title: `Course 7 Draft ${runId}`,
      courseCreator: instructor._id,
      description: 'Test course description',
      category: 'Tech',
      status: 'draft',
    });
    createdCourseIds.push(course7._id);

    const claim7Res = await request(`/api/student/certificates/claim/${course7._id}`, { method: 'POST' }, tokenA);
    assert(claim7Res.status === 400, 'Claim rejected for unpublished course (400 Bad Request)');
    assert(
      claim7Res.data?.message?.includes('only issued for published courses'),
      'Rejection specifies course must be published'
    );

    // 2G: Nonexistent Course ID
    const fakeCourseId = new mongoose.Types.ObjectId().toString();
    const claimNonexistentRes = await request(`/api/student/certificates/claim/${fakeCourseId}`, { method: 'POST' }, tokenA);
    assert(claimNonexistentRes.status === 404, 'Claim rejected with 404 for nonexistent course ID');

    // 2H: Malformed Course ID
    const claimMalformedRes = await request(`/api/student/certificates/claim/not-a-mongo-id`, { method: 'POST' }, tokenA);
    assert(claimMalformedRes.status === 400, 'Claim rejected with 400 validation error for malformed course ID');

    // -------------------------------------------------------------------------
    // SCENARIO 3: Idempotency & Concurrency / Race-Condition Handling
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 3: Idempotency & Concurrent Claim Safety ---');

    // Repeated claim returns the exact same canonical certificate
    const claimRepeatRes = await request(`/api/student/certificates/claim/${course1._id}`, { method: 'POST' }, tokenA);
    assert(claimRepeatRes.status === 200, 'Repeated certificate claim returns 200 OK');
    assert(claimRepeatRes.data?.data?.certificate?.certificateId === cert1.certificateId, 'Certificate ID is identical');
    assert(claimRepeatRes.data?.data?.certificate?.issueDate === cert1.issueDate, 'Issue date timestamp is preserved identically');

    const totalCertsForA1 = await Certificate.countDocuments({ userId: studentA._id, courseId: course1._id });
    assert(totalCertsForA1 === 1, 'MongoDB contains strictly 1 certificate for student A and course 1');

    // Test unique compound index constraint directly
    let compoundIndexEnforced = false;
    try {
      await Certificate.create({
        userId: studentA._id,
        courseId: course1._id,
        studentName: 'Duplicate Attempt',
        courseTitle: 'Duplicate Attempt',
        completedAt: new Date(),
        issueDate: new Date(),
      });
    } catch (dupErr) {
      compoundIndexEnforced = dupErr.code === 11000 || dupErr.message.includes('E11000');
    }
    assert(compoundIndexEnforced, 'Direct Mongoose duplicate insert blocked by unique {userId, courseId} index (E11000)');

    // Concurrent claim safety: fire 5 simultaneous claim requests
    const course8 = await Course.create({
      title: `Concurrent Claim Course ${runId}`,
      courseCreator: instructor._id,
      description: 'Test course description',
      category: 'Computer Science',
      status: 'published',
    });
    createdCourseIds.push(course8._id);
    const mod8 = await Module.create({ courseId: course8._id, title: 'Mod 8', order: 1 });
    createdModuleIds.push(mod8._id);
    const t8 = await Topic.create({ courseId: course8._id, moduleId: mod8._id, title: 'T8', order: 1 });
    createdTopicIds.push(t8._id);

    await request(`/api/student/enroll/${course8._id}`, { method: 'POST' }, tokenC);
    await request(`/api/student/progress/${course8._id}/${t8._id}`, { method: 'PUT' }, tokenC);

    const concurrentPromises = [
      request(`/api/student/certificates/claim/${course8._id}`, { method: 'POST' }, tokenC),
      request(`/api/student/certificates/claim/${course8._id}`, { method: 'POST' }, tokenC),
      request(`/api/student/certificates/claim/${course8._id}`, { method: 'POST' }, tokenC),
      request(`/api/student/certificates/claim/${course8._id}`, { method: 'POST' }, tokenC),
      request(`/api/student/certificates/claim/${course8._id}`, { method: 'POST' }, tokenC),
    ];

    const concurrentResults = await Promise.all(concurrentPromises);
    const allSuccessful = concurrentResults.every((r) => r.status === 200);
    const certIds = concurrentResults.map((r) => r.data?.data?.certificate?.certificateId);
    const allSameCertId = certIds.every((id) => id === certIds[0]);

    assert(allSuccessful, 'All 5 concurrent claim requests succeeded with 200 OK');
    assert(allSameCertId, 'All 5 concurrent requests returned the identical canonical certificate ID');

    const totalCertsForC8 = await Certificate.countDocuments({ userId: studentC._id, courseId: course8._id });
    assert(totalCertsForC8 === 1, 'MongoDB contains exactly 1 certificate document despite 5 concurrent claims');
    assert(certIds[0] !== cert1.certificateId, 'Certificate IDs across different issuances are unique');

    // -------------------------------------------------------------------------
    // SCENARIO 4: Student Ownership & Tenant Isolation
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 4: Ownership Isolation & Authorization Boundaries ---');

    // Student A listing certificates
    const listARes = await request('/api/student/certificates', { method: 'GET' }, tokenA);
    assert(listARes.status === 200, 'Student A lists certificates (200 OK)');
    const aCerts = listARes.data?.data?.certificates;
    assert(Array.isArray(aCerts) && aCerts.some((c) => c.certificateId === cert1.certificateId), 'Student A sees Certificate 1');

    // Student B listing certificates
    const listBRes = await request('/api/student/certificates', { method: 'GET' }, tokenB);
    assert(listBRes.status === 200, 'Student B lists certificates (200 OK)');
    const bCerts = listBRes.data?.data?.certificates;
    assert(
      !bCerts.some((c) => c.certificateId === cert1.certificateId),
      'Student B CANNOT see Student A certificate in their certificate list'
    );

    // Student A accessing their own certificate by certificateId
    const getSelfRes = await request(`/api/student/certificates/${cert1.certificateId}`, { method: 'GET' }, tokenA);
    assert(getSelfRes.status === 200, 'Student A can retrieve their own certificate by certificateId (200 OK)');

    // Student B attempting to access Student A's certificate by certificateId
    const getCrossRes = await request(`/api/student/certificates/${cert1.certificateId}`, { method: 'GET' }, tokenB);
    assert(getCrossRes.status === 404, 'Cross-student certificate access fails with 404 Not Found (zero leakage)');

    // Role restrictions: Non-student token (instructor) cannot access student certificate routes
    const instructorAccessRes = await request('/api/student/certificates', { method: 'GET' }, instructorToken);
    assert(instructorAccessRes.status === 403, 'Instructor role is blocked from student certificate route (403 Forbidden)');

    // Unauthenticated access blocked
    const unauthRes = await request('/api/student/certificates', { method: 'GET' });
    assert(unauthRes.status === 401, 'Unauthenticated request to student certificates route is rejected (401 Unauthorized)');

    // Client-supplied userId spoofing attempt
    const spoofClaimRes = await request(
      `/api/student/certificates/claim/${course1._id}`,
      {
        method: 'POST',
        body: JSON.stringify({ userId: studentB._id.toString(), studentName: 'Hacker Spoof' }),
      },
      tokenA
    );
    assert(spoofClaimRes.status === 200, 'Request processes using server-authoritative token context');
    assert(spoofClaimRes.data?.data?.certificate?.studentName === `Alice Student ${runId}`, 'Client-spoofed studentName is ignored');
    assert(spoofClaimRes.data?.data?.certificate?.userId === studentA._id.toString(), 'Certificate userId strictly reflects JWT token');

    // -------------------------------------------------------------------------
    // SCENARIO 5: Public Verification Security & Data Whitelisting
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 5: Public Verification Security & Whitelisting ---');

    // Valid existing certificate
    const verifyValidRes = await request(`/api/certificates/verify/${cert1.certificateId}`);
    assert(verifyValidRes.status === 200, 'Public verification returns 200 OK without authentication');

    const publicCert = verifyValidRes.data?.data?.certificate;
    assert(publicCert.certificateId === cert1.certificateId, 'Public certificateId matches');
    assert(publicCert.studentName === `Alice Student ${runId}`, 'Public studentName matches');
    assert(publicCert.courseTitle === `Advanced Cloud Architecture ${runId}`, 'Public courseTitle matches');
    assert(publicCert.status === 'valid', 'Public status is valid');
    assert(publicCert.isValid === true, 'Public isValid flag is true');
    assert(publicCert.completedAt !== null, 'Public completedAt is populated');
    assert(publicCert.issueDate !== null, 'Public issueDate is populated');

    // Whitelist audit: strictly verify prohibited fields are absent
    assert(publicCert._id === undefined, 'Public verification DOES NOT expose Mongo _id');
    assert(publicCert.id === undefined, 'Public verification DOES NOT expose document id');
    assert(publicCert.userId === undefined, 'Public verification DOES NOT expose student userId');
    assert(publicCert.email === undefined, 'Public verification DOES NOT expose student email');
    assert(publicCert.password === undefined, 'Public verification DOES NOT expose password');
    assert(publicCert.token === undefined, 'Public verification DOES NOT expose token');
    assert(publicCert.__v === undefined, 'Public verification DOES NOT expose Mongoose __v');

    // Case insensitivity check
    const lowercaseId = cert1.certificateId.toLowerCase();
    const verifyCaseRes = await request(`/api/certificates/verify/${lowercaseId}`);
    assert(verifyCaseRes.status === 200, 'Public verification handles case insensitivity (200 OK)');
    assert(verifyCaseRes.data?.data?.certificate?.certificateId === cert1.certificateId, 'Returns uppercase canonical ID');

    // Revoked certificate verification
    await Certificate.updateOne({ certificateId: cert1.certificateId }, { $set: { status: 'revoked' } });
    const verifyRevokedRes = await request(`/api/certificates/verify/${cert1.certificateId}`);
    assert(verifyRevokedRes.status === 200, 'Public verification of revoked certificate returns 200 OK');
    assert(verifyRevokedRes.data?.data?.certificate?.status === 'revoked', 'Status reflects revoked');
    assert(verifyRevokedRes.data?.data?.certificate?.isValid === false, 'isValid flag is strictly false');

    // Nonexistent valid-format certificate ID
    const verifyNonexistentRes = await request('/api/certificates/verify/LS-0000-0000-0000');
    assert(verifyNonexistentRes.status === 404, 'Nonexistent valid-format certificate returns 404 Not Found');
    assert(
      verifyNonexistentRes.data?.message?.includes('Certificate not found or invalid'),
      'Controlled 404 error message returned'
    );

    // Invalid-format certificate ID
    const verifyInvalidFormatRes = await request('/api/certificates/verify/invalid-format-id');
    assert(verifyInvalidFormatRes.status === 400, 'Invalid-format certificate ID returns 400 Bad Request');
    assert(
      verifyInvalidFormatRes.data?.errors?.[0]?.message === 'Invalid certificate ID format',
      'Controlled format validation error message returned'
    );

    // -------------------------------------------------------------------------
    // SCENARIO 6: Input Validation, Sanitization & Injection Defense
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 6: Input Validation & Injection Resistance ---');

    // NoSQL operator injection attempt in verification route
    const nosqlRes = await request('/api/certificates/verify/%24ne%3Dnull');
    assert(nosqlRes.status === 400, 'NoSQL operator payload rejected by format validation (400)');

    // Oversized certificate ID attempt (1000 characters)
    const longId = 'LS-' + 'A'.repeat(1000);
    const longRes = await request(`/api/certificates/verify/${longId}`);
    assert(longRes.status === 400, 'Oversized certificate ID rejected by format validation (400)');

    // SQL-style injection string attempt
    const sqlInjRes = await request('/api/certificates/verify/LS-1234-5678-ABCD%27%20OR%20%271%27%3D%271');
    assert(sqlInjRes.status === 400, 'SQL injection characters rejected by format validation (400)');

    // Path traversal attempt
    const traversalRes = await request('/api/certificates/verify/..%2F..%2Fetc%2Fpasswd');
    assert(traversalRes.status === 400 || traversalRes.status === 404, 'Path traversal attempt safely rejected');

    // -------------------------------------------------------------------------
    // SCENARIO 7: Public Verification Rate Limiting Verification
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 7: Public Verification Rate Limiter Attachment ---');

    const rateLimitCheckRes = await request(`/api/certificates/verify/LS-0000-0000-0000`);
    const hasRateLimitHeader =
      rateLimitCheckRes.headers.get('ratelimit') !== null ||
      rateLimitCheckRes.headers.get('ratelimit-policy') !== null ||
      rateLimitCheckRes.headers.get('ratelimit-limit') !== null ||
      rateLimitCheckRes.headers.get('x-ratelimit-limit') !== null ||
      rateLimitCheckRes.headers.get('ratelimit-remaining') !== null ||
      rateLimitCheckRes.headers.get('x-ratelimit-remaining') !== null;

    assert(hasRateLimitHeader, 'Rate limiting headers present on public certificate verification route');

    // -------------------------------------------------------------------------
    // SCENARIO 8: Mongoose Schema Invariant Audit
    // -------------------------------------------------------------------------
    console.log('\n--- Scenario 8: Database Model Constraints & Index Audit ---');

    const certIndexes = await Certificate.collection.getIndexes();
    const hasCompoundUnique = Object.values(certIndexes).some(
      (idx) => Array.isArray(idx) && idx.some((pair) => pair[0] === 'userId') && idx.some((pair) => pair[0] === 'courseId')
    );
    const hasCertIdUnique = Object.values(certIndexes).some(
      (idx) => Array.isArray(idx) && idx.some((pair) => pair[0] === 'certificateId')
    );

    assert(hasCompoundUnique, 'Compound unique index {userId: 1, courseId: 1} is active in MongoDB');
    assert(hasCertIdUnique, 'Unique index on certificateId is active in MongoDB');

    // Enum validation
    let invalidStatusRejected = false;
    try {
      await Certificate.create({
        userId: new mongoose.Types.ObjectId(),
        courseId: new mongoose.Types.ObjectId(),
        studentName: 'Invalid Status Test',
        courseTitle: 'Invalid Status Test',
        completedAt: new Date(),
        status: 'pending_approval', // Not in enum
      });
    } catch (statusErr) {
      invalidStatusRejected = statusErr.name === 'ValidationError';
    }
    assert(invalidStatusRejected, 'Mongoose schema rejects non-enum certificate statuses');

    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n--- Cleanup: Purging Verification Artifacts ---');

    await Certificate.deleteMany({
      $or: [
        { userId: { $in: createdUserIds } },
        { courseId: { $in: createdCourseIds } },
      ],
    });

    await TopicProgress.deleteMany({ user: { $in: createdUserIds } });
    await AssessmentAttempt.deleteMany({ userId: { $in: createdUserIds } });
    await Enrollment.deleteMany({ userId: { $in: createdUserIds } });
    await Assessment.deleteMany({ courseId: { $in: createdCourseIds } });
    await Topic.deleteMany({ _id: { $in: createdTopicIds } });
    await Module.deleteMany({ _id: { $in: createdModuleIds } });
    await Course.deleteMany({ _id: { $in: createdCourseIds } });
    await User.deleteMany({ _id: { $in: createdUserIds } });

    console.log('✓ All verification artifacts safely purged from database');

  } catch (err) {
    console.error('\n✗ Verification run failed with uncaught exception:', err);
    totalTests++;
    failedTests++;
  }

  console.log('\n===================================================================');
  console.log(`Phase 11G Verification Complete: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('===================================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase11GAudit();
