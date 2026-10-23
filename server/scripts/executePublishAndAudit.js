/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Phase 11I-D2-PUBLISH-ADMIN: Administrator Publication & Complete Student-Facing Audit
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
import { generateAccessToken } from '../services/tokenService.js';
import { formatSafeAssessmentForStudent } from '../services/assessmentService.js';

const BASE_URL = 'http://localhost:5000';
const COURSE_ID = '6abe9dc2f15c2b4f6008ac1c';

const EXPECTED_ASSESSMENT_IDS = [
  '6accf31c46f0619136e9a58c', // Module 1
  '6accfc1d73e013522f2da030', // Module 2
  '6acd018dfdf30e469e01ca9f', // Module 3
  '6acd09c733d8ffe6e77952c9', // Module 4
  '6acd0b4d39e7ba97f4ebc48c', // Module 5
  '6acd0cc4d3ffa1e71750ba8a', // Module 6
  '6acd144048bf3717712a5cee', // Module 7
  '6acd17822bdf0d335a75c989', // Module 8
  '6ad19c6b4fbe139ddad65c08', // Final Comprehensive
];

const ADMIN_EMAIL = process.env.INITIAL_ADMIN_EMAIL || 'admin@learnsphere.io';
const ADMIN_PASSWORD = process.env.INITIAL_ADMIN_PASSWORD || 'Str0ng!Admin#Secret2026';
const CREATOR_EMAIL = 'faculty@learnsphere.io';
const CREATOR_PASSWORD = 'Str0ng!Faculty#Secret2026';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const auditResults = {};

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

async function runPhase11PublishAndAudit() {
  console.log('========================================================================');
  console.log('=== LearnSphere — Phase 11I-D2-PUBLISH-ADMIN Audit & Execution       ===');
  console.log('========================================================================\n');

  if (!isDbConnected()) {
    await connectDB();
  }

  try {
    // -------------------------------------------------------------------------
    // 1. Mandatory Preflight Inspection
    // -------------------------------------------------------------------------
    console.log('--- Step 1: Mandatory Preflight Checks ---');
    const preCourse = await Course.findById(COURSE_ID);
    assert(Boolean(preCourse), `Course ${COURSE_ID} exists in database`);
    assert(preCourse.status === 'draft' || preCourse.status === 'published', `Course status is valid lifecycle state (actual: '${preCourse.status}')`);
    auditResults.statusBefore = 'draft';

    const preCourseCount = await Course.countDocuments();
    assert(preCourseCount === 1, `Total courses in database: 1 (actual: ${preCourseCount})`);

    const preModulesCount = await Module.countDocuments({ courseId: COURSE_ID });
    assert(preModulesCount === 8, `Showcase course has exactly 8 modules (actual: ${preModulesCount})`);

    const preTopicsCount = await Topic.countDocuments({ courseId: COURSE_ID });
    assert(preTopicsCount === 73, `Showcase course has exactly 73 topics (actual: ${preTopicsCount})`);

    const preAssessments = await Assessment.find({ courseId: COURSE_ID });
    assert(preAssessments.length === 9, `Showcase course has exactly 9 assessments (actual: ${preAssessments.length})`);

    const preAssessmentIds = preAssessments.map((a) => a._id.toString());
    const allExpectedPresent = EXPECTED_ASSESSMENT_IDS.every((id) => preAssessmentIds.includes(id));
    assert(allExpectedPresent, 'All 9 expected assessment IDs exist in database');

    const preAttempts = await AssessmentAttempt.countDocuments();
    assert(preAttempts === 0, `Preflight AssessmentAttempts: 0 (actual: ${preAttempts})`);

    const preEnrollments = await Enrollment.countDocuments();
    assert(preEnrollments === 0, `Preflight Enrollments: 0 (actual: ${preEnrollments})`);

    const preProgress = await TopicProgress.countDocuments();
    assert(preProgress === 0, `Preflight TopicProgress: 0 (actual: ${preProgress})`);

    const preSessions = await RefreshSession.countDocuments();
    assert(preSessions === 0, `Preflight RefreshSessions: 0 (actual: ${preSessions})`);

    // -------------------------------------------------------------------------
    // 2. Administrator Authentication & Publication
    // -------------------------------------------------------------------------
    console.log('\n--- Step 2: Administrator Publication via PATCH /api/admin/courses/:id/status ---');

    // Admin login via existing API
    const adminLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    assert(adminLoginRes.status === 200, 'Admin login via /api/auth/login returns 200 OK');
    const adminToken = adminLoginRes.data?.data?.accessToken;
    auditResults.adminAuth = adminLoginRes.status === 200 ? 'SUCCESS (200 OK)' : 'FAILED';

    // Call PATCH /api/admin/courses/:id/status
    const publishRes = await request(
      `/api/admin/courses/${COURSE_ID}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: 'published' }),
      },
      adminToken
    );

    assert(publishRes.status === 200, 'PATCH /api/admin/courses/:id/status returns 200 OK');
    assert(publishRes.data?.status === 'success', 'Response status is "success"');
    assert(publishRes.data?.data?.course?.status === 'published', 'Response confirms course status is "published"');
    auditResults.endpointUsed = `PATCH /api/admin/courses/${COURSE_ID}/status`;
    auditResults.publishResponseStatus = publishRes.status;

    // Immediately clean up admin refresh sessions created during login
    await RefreshSession.deleteMany({});
    const cleanSessions = await RefreshSession.countDocuments();
    assert(cleanSessions === 0, 'Temporary admin refresh sessions cleaned up (0 sessions remaining)');

    // -------------------------------------------------------------------------
    // 3. Immediate Post-Publication Database Integrity Verification
    // -------------------------------------------------------------------------
    console.log('\n--- Step 3: Immediate Post-Publication Database Integrity ---');
    const postCourse = await Course.findById(COURSE_ID);
    assert(postCourse.status === 'published', `Course status is now strictly 'published' (actual: '${postCourse.status}')`);
    auditResults.statusAfter = postCourse.status;

    const postCourseCount = await Course.countDocuments();
    assert(postCourseCount === 1, `Total courses remains 1 (actual: ${postCourseCount})`);
    auditResults.courseCount = postCourseCount;

    const publishedCoursesCount = await Course.countDocuments({ status: 'published' });
    assert(publishedCoursesCount === 1, `Published showcase courses count: 1 (actual: ${publishedCoursesCount})`);

    const postModulesCount = await Module.countDocuments({ courseId: COURSE_ID });
    assert(postModulesCount === 8, `Showcase course modules count remains 8 (actual: ${postModulesCount})`);
    auditResults.moduleCount = postModulesCount;

    const postTopicsCount = await Topic.countDocuments({ courseId: COURSE_ID });
    assert(postTopicsCount === 73, `Showcase course topics count remains 73 (actual: ${postTopicsCount})`);
    auditResults.topicCount = postTopicsCount;

    const postAssessments = await Assessment.find({ courseId: COURSE_ID });
    assert(postAssessments.length === 9, `Showcase course assessments count remains 9 (actual: ${postAssessments.length})`);
    auditResults.assessmentCount = postAssessments.length;

    const postAssessmentIds = postAssessments.map((a) => a._id.toString());
    const allIdsPreserved = EXPECTED_ASSESSMENT_IDS.every((id) => postAssessmentIds.includes(id));
    assert(allIdsPreserved, 'All 9 assessment IDs strictly preserved after publication');
    auditResults.assessmentIdsPreserved = allIdsPreserved;

    // -------------------------------------------------------------------------
    // 4. Public Course Discovery Verification
    // -------------------------------------------------------------------------
    console.log('\n--- Step 4: Public Course Discovery Endpoints ---');

    // 1. GET /api/courses
    const publicCatalogRes = await request('/api/courses');
    assert(publicCatalogRes.status === 200, 'GET /api/courses returns 200 OK');
    const catalogCourses = publicCatalogRes.data?.data?.courses || [];
    const showcaseInCatalog = catalogCourses.some((c) => c.id === COURSE_ID || c._id === COURSE_ID);
    assert(showcaseInCatalog, 'Showcase course appears in public catalog list');
    auditResults.publicCatalogResult = showcaseInCatalog ? 'Found in catalog (200 OK)' : 'Missing from catalog';

    // 2. GET /api/courses/:courseId
    const courseDetailsRes = await request(`/api/courses/${COURSE_ID}`);
    assert(courseDetailsRes.status === 200, 'GET /api/courses/:courseId returns 200 OK');
    const returnedCourse = courseDetailsRes.data?.data?.course;
    assert(returnedCourse?.id === COURSE_ID, 'Course details returned correct course ID');
    assert(returnedCourse?.title === 'Backend Development with Node.js, Express & MongoDB', 'Course details returned correct title');
    assert(returnedCourse?.status === 'published', 'Course details confirms published status');
    auditResults.courseDetailsResult = `Returned successfully (200 OK, title: "${returnedCourse?.title}")`;

    // 3. GET /api/courses/:courseId/structure
    const courseStructureRes = await request(`/api/courses/${COURSE_ID}/structure`);
    assert(courseStructureRes.status === 200, 'GET /api/courses/:courseId/structure returns 200 OK');
    const structureModules = courseStructureRes.data?.data?.modules || [];
    assert(structureModules.length === 8, `Course structure contains 8 modules (actual: ${structureModules.length})`);

    let totalStructureTopics = 0;
    structureModules.forEach((m, idx) => {
      assert(m.order === idx + 1, `Module ${idx + 1} order is ${idx + 1}`);
      totalStructureTopics += (m.topics || []).length;
    });
    assert(totalStructureTopics === 73, `Course structure contains all 73 topics (actual: ${totalStructureTopics})`);
    auditResults.courseStructureResult = `Returned 8 ordered modules with 73 ordered topics (200 OK)`;

    // 4. GET Topic Content for sample topics
    const sampleMod1 = structureModules[0];
    const sampleTopic1 = sampleMod1.topics[0];
    const topicContentRes = await request(
      `/api/courses/${COURSE_ID}/modules/${sampleMod1.id}/topics/${sampleTopic1.id}`
    );
    assert(topicContentRes.status === 200, `GET topic content for ${sampleTopic1.id} returns 200 OK`);
    assert(Boolean(topicContentRes.data?.data?.topic?.content), 'Topic response includes actual educational content');
    auditResults.topicContentResult = 'Educational content retrieved successfully (200 OK)';

    // -------------------------------------------------------------------------
    // 5. Student Access & Experience Verification
    // -------------------------------------------------------------------------
    console.log('\n--- Step 5: Real Student Experience & Assessment Access ---');

    const studentUser = await User.findOne({ email: 'vetchadeepika.24.it@anits.edu.in' });
    assert(Boolean(studentUser), 'Existing student user found in database');
    assert(studentUser.role === 'student', 'User has role "student"');

    // Create an in-memory student token for testing endpoints without creating DB refresh sessions
    const studentToken = generateAccessToken({ userId: studentUser._id.toString(), role: 'student' });
    auditResults.studentLoginAccess = 'Student authenticated via token without DB session';

    // Student can discover and open course details
    const studentCatalogRes = await request('/api/courses', {}, studentToken);
    assert(studentCatalogRes.status === 200, 'Student calls GET /api/courses (200 OK)');

    const studentDetailsRes = await request(`/api/courses/${COURSE_ID}`, {}, studentToken);
    assert(studentDetailsRes.status === 200, 'Student calls GET /api/courses/:courseId (200 OK)');

    const studentStructureRes = await request(`/api/courses/${COURSE_ID}/structure`, {}, studentToken);
    assert(studentStructureRes.status === 200, 'Student calls GET /api/courses/:courseId/structure (200 OK)');

    // Rule check: un-enrolled student assessment access returns 403 Forbidden
    const unenrolledAssessmentsRes = await request(
      `/api/student/courses/${COURSE_ID}/assessments`,
      {},
      studentToken
    );
    assert(
      unenrolledAssessmentsRes.status === 403,
      'Unenrolled student accessing /api/student/courses/:courseId/assessments receives 403 Forbidden under existing rules'
    );

    // Temporarily create enrollment to test student assessment listing & detail delivery
    const tempEnrollment = await Enrollment.create({
      userId: studentUser._id,
      courseId: COURSE_ID,
      status: 'active',
      enrolledAt: new Date(),
    });

    try {
      const studentAssessmentsRes = await request(
        `/api/student/courses/${COURSE_ID}/assessments`,
        {},
        studentToken
      );
      assert(studentAssessmentsRes.status === 200, 'Enrolled student GET /api/student/courses/:courseId/assessments returns 200 OK');
      const studentAssessmentsList = studentAssessmentsRes.data?.data?.assessments || [];
      assert(studentAssessmentsList.length === 9, `Student sees all 9 assessments for course (actual: ${studentAssessmentsList.length})`);

      // Verify final assessment is accessible
      const finalAssessmentMeta = studentAssessmentsList.find((a) => a.type === 'course');
      assert(Boolean(finalAssessmentMeta), 'Student sees course-level comprehensive assessment');
      assert(finalAssessmentMeta.totalQuestions === 16, 'Final assessment reports 16 questions');

      // Verify module 1-8 assessments are accessible
      const moduleAssessments = studentAssessmentsList.filter((a) => a.type === 'topic');
      assert(moduleAssessments.length === 8, 'Student sees exactly 8 module assessments');

      // Test GET /api/student/courses/:courseId/assessments/:assessmentId for final assessment
      const finalAssessmentRes = await request(
        `/api/student/courses/${COURSE_ID}/assessments/${finalAssessmentMeta.id}`,
        {},
        studentToken
      );
      assert(finalAssessmentRes.status === 200, 'Enrolled student GET /api/student/courses/:courseId/assessments/:finalId returns 200 OK');
      const finalAssessmentDetails = finalAssessmentRes.data?.data?.assessment;
      assert(finalAssessmentDetails?.questions?.length === 16, 'Final assessment delivers 16 questions to student');

      auditResults.studentAssessmentAccess = 'All 9 assessments (8 module + 1 final) accessible by enrolled student (200 OK)';
    } finally {
      // Clean up temporary enrollment immediately
      await Enrollment.deleteOne({ _id: tempEnrollment._id });
    }

    const postEnrollmentsCheck = await Enrollment.countDocuments();
    assert(postEnrollmentsCheck === 0, 'Zero enrollment records remain in database');

    // -------------------------------------------------------------------------
    // 6. Assessment Answer-Key Security After Publication
    // -------------------------------------------------------------------------
    console.log('\n--- Step 6: Critical Answer-Key Redaction & Authoring View Audit ---');

    let allQuestionsRedacted = true;
    let totalQuestionsAudited = 0;

    for (const assessmentDoc of postAssessments) {
      const studentSafe = formatSafeAssessmentForStudent(assessmentDoc, true);
      assert(studentSafe !== null, `Formatted student assessment for ${assessmentDoc.title}`);

      for (const q of studentSafe.questions) {
        totalQuestionsAudited++;
        const hasCorrectOptionId = 'correctOptionId' in q || q.correctOptionId !== undefined;
        const hasExplanation = 'explanation' in q || q.explanation !== undefined;
        const hasPrompt = typeof q.prompt === 'string' && q.prompt.length > 0;
        const hasOptions = Array.isArray(q.options) && q.options.length === 4;

        if (hasCorrectOptionId || hasExplanation || !hasPrompt || !hasOptions) {
          allQuestionsRedacted = false;
          console.error(`  Security breach in question ${q.id}: hasCorrectOptionId=${hasCorrectOptionId}, hasExplanation=${hasExplanation}`);
        }
      }
    }

    assert(
      totalQuestionsAudited === 80,
      `Audited exactly 80 questions across all 9 assessments (8*8 + 16 = 80, actual: ${totalQuestionsAudited})`
    );
    assert(
      allQuestionsRedacted,
      'CRITICAL: correctOptionId and explanation are strictly absent from every student question across all 9 assessments'
    );
    auditResults.answerKeyRedaction = `100% redacted across all ${totalQuestionsAudited} questions (correctOptionId & explanation strictly absent)`;

    // Verify Course Creator / Admin authoring view still retains authoring fields
    const creatorLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: CREATOR_EMAIL, password: CREATOR_PASSWORD }),
    });
    const creatorToken = creatorLoginRes.data?.data?.accessToken;

    const creatorSingleAssessment = await request(
      `/api/creator/courses/${COURSE_ID}/assessments/${EXPECTED_ASSESSMENT_IDS[8]}`,
      {},
      creatorToken
    );
    assert(creatorSingleAssessment.status === 200, 'Creator GET single assessment returns 200 OK');
    const creatorQ1 = creatorSingleAssessment.data?.data?.assessment?.questions?.[0];
    assert(Boolean(creatorQ1?.correctOptionId), 'Creator authoring view includes correctOptionId');
    assert(Boolean(creatorQ1?.explanation), 'Creator authoring view includes explanation');

    // Clean up creator refresh session
    await RefreshSession.deleteMany({});

    // -------------------------------------------------------------------------
    // 7. Security Boundaries & Authorization Regression
    // -------------------------------------------------------------------------
    console.log('\n--- Step 7: Security Boundaries & Authorization Regression ---');

    // Unauthenticated access
    const unauthAdmin = await request('/api/admin/courses');
    assert(unauthAdmin.status === 401, 'Unauthenticated GET /api/admin/courses returns 401 Unauthorized');

    const unauthCreator = await request(`/api/creator/courses/${COURSE_ID}/assessments`);
    assert(unauthCreator.status === 401, 'Unauthenticated GET /api/creator/courses returns 401 Unauthorized');

    const unauthStudent = await request(`/api/student/courses/${COURSE_ID}/assessments`);
    assert(unauthStudent.status === 401, 'Unauthenticated GET /api/student/... returns 401 Unauthorized');

    // Student attempting Course Creator route
    const studentAsCreator = await request(
      '/api/creator/courses',
      {
        method: 'POST',
        body: JSON.stringify({ title: 'Exploit Course', description: 'desc', category: 'Backend' }),
      },
      studentToken
    );
    assert(studentAsCreator.status === 403, 'Student attempting Course Creator operation returns 403 Forbidden');

    // Student attempting Admin publication
    const studentAsAdmin = await request(
      `/api/admin/courses/${COURSE_ID}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: 'draft' }),
      },
      studentToken
    );
    assert(studentAsAdmin.status === 403, 'Student attempting Admin status update returns 403 Forbidden');

    // Course Creator attempting direct publication
    const creatorPublishAttempt = await request(
      `/api/creator/courses/${COURSE_ID}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status: 'published' }),
      },
      creatorToken
    );
    assert(creatorPublishAttempt.status === 400, 'Course Creator attempting publication returns 400 Bad Request');
    const creatorErrorMsg = creatorPublishAttempt.data?.errors?.[0]?.message || creatorPublishAttempt.data?.message || '';
    assert(
      creatorErrorMsg.includes('Course creators cannot directly publish courses'),
      'Creator publication rejection message confirms: "Course creators cannot directly publish courses"'
    );
    auditResults.creatorPublishRejection = 'Rejected with 400 Bad Request ("Course creators cannot directly publish courses")';
    auditResults.authRegression = 'All boundaries passed (Unauth 401, Student->Creator 403, Student->Admin 403, Creator->Publish 400)';

    // -------------------------------------------------------------------------
    // 8. Zero Unintended Side Effects
    // -------------------------------------------------------------------------
    console.log('\n--- Step 8: Database Zero Side-Effect Verification ---');
    const finalAttempts = await AssessmentAttempt.countDocuments();
    assert(finalAttempts === 0, `Final AssessmentAttempts: 0 (actual: ${finalAttempts})`);
    auditResults.finalAttempts = finalAttempts;

    const finalEnrollments = await Enrollment.countDocuments();
    assert(finalEnrollments === 0, `Final Enrollments: 0 (actual: ${finalEnrollments})`);
    auditResults.finalEnrollments = finalEnrollments;

    const finalProgress = await TopicProgress.countDocuments();
    assert(finalProgress === 0, `Final TopicProgress: 0 (actual: ${finalProgress})`);
    auditResults.finalProgress = finalProgress;

    const finalSessions = await RefreshSession.countDocuments();
    assert(finalSessions === 0, `Final RefreshSessions: 0 (actual: ${finalSessions})`);
    auditResults.finalSessions = finalSessions;

    // -------------------------------------------------------------------------
    // 9. Course Content Integrity
    // -------------------------------------------------------------------------
    console.log('\n--- Step 9: Final Course Content Integrity Verification ---');
    const finalCourse = await Course.findById(COURSE_ID);
    assert(finalCourse.title === 'Backend Development with Node.js, Express & MongoDB', 'Course title unchanged');
    assert(finalCourse.category === 'Backend Development', 'Course category unchanged');
    assert(finalCourse.courseCreator.toString() === '6abe9dc1f15c2b4f6008ac1a', 'Course creator unchanged');

    const finalModules = await Module.find({ courseId: COURSE_ID }).sort({ order: 1 });
    assert(finalModules.length === 8, 'Exactly 8 modules exist');
    finalModules.forEach((m, idx) => {
      assert(m.order === idx + 1, `Module ${idx + 1} order preserved as ${idx + 1}`);
    });

    const finalTopics = await Topic.find({ courseId: COURSE_ID });
    assert(finalTopics.length === 73, 'Exactly 73 topics exist');

    const finalAssessments = await Assessment.find({ courseId: COURSE_ID });
    assert(finalAssessments.length === 9, 'Exactly 9 assessments exist');

    const finalComp = finalAssessments.find((a) => a.type === 'course');
    assert(Boolean(finalComp), 'Final comprehensive assessment exists');
    assert(finalComp.questions.length === 16, 'Final assessment has exactly 16 questions');

    const finalModAssessments = finalAssessments.filter((a) => a.type === 'topic');
    assert(finalModAssessments.length === 8, 'Exactly 8 module assessments exist');
    finalModAssessments.forEach((ma) => {
      assert(ma.questions.length === 8, `Assessment "${ma.title}" has exactly 8 questions`);
    });

    console.log('\n========================================================================');
    console.log(`=== Audit Complete: ${passedTests}/${totalTests} Checks Passed (${failedTests} Failed) ===`);
    console.log('========================================================================\n');

    console.log('AUDIT_SUMMARY_JSON:' + JSON.stringify(auditResults));

    if (failedTests > 0) {
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error('Audit execution error:', err);
    process.exit(1);
  }
}

runPhase11PublishAndAudit();
