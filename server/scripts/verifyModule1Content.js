/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Verification Suite: Module 1 Educational Content & Security Enforcements
 *
 * Verifies:
 * 1. All 8 topics of Module 1 contain comprehensive educational content.
 * 2. Content is associated with the correct topic ID and title.
 * 3. Topic hierarchy is strictly unchanged (8 modules, 73 topics).
 * 4. Course Creator ownership checks still apply.
 * 5. Another Course Creator cannot access or modify the showcase course (404 leak prevention).
 * 6. Students cannot access the draft showcase course (404 Not Found).
 * 7. Zero published courses exist in public catalog.
 * 8. Zero assessments exist in the database.
 * 9. Zero YouTube URLs were added.
 * 10. Zero gamification data exists.
 * 11. Modules 2–8 remain completely untouched (empty content placeholders).
 */

import 'dotenv/config';
import { connectDB, isDbConnected } from '../config/db.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import Assessment from '../models/Assessment.js';
import AssessmentAttempt from '../models/AssessmentAttempt.js';
import Enrollment from '../models/Enrollment.js';
import TopicProgress from '../models/TopicProgress.js';

const BASE_URL = 'http://localhost:5000';
const COURSE_ID = '6abe9dc2f15c2b4f6008ac1c';
const MODULE_1_ID = '6abe9dc2f15c2b4f6008ac1d';

const CREATOR_EMAIL = 'faculty@learnsphere.io';
const CREATOR_PASSWORD = 'Str0ng!Faculty#Secret2026';
const ADMIN_EMAIL = process.env.INITIAL_ADMIN_EMAIL || 'admin@learnsphere.io';
const ADMIN_PASSWORD = process.env.INITIAL_ADMIN_PASSWORD || 'Str0ng!Admin#Secret2026';

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
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
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
    } catch {}
  }
  return { status: res.status, headers: res.headers, data };
}

async function runVerification() {
  console.log('===================================================================');
  console.log('=== LearnSphere Module 1 Content & Security Verification        ===');
  console.log('===================================================================\n');

  if (!isDbConnected()) {
    await connectDB();
  }

  const createdUserIds = [];

  try {
    // -------------------------------------------------------------------------
    // 1. Authenticate Roles
    // -------------------------------------------------------------------------
    console.log('--- Step 1: Role Authentication ---');
    const creatorLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: CREATOR_EMAIL, password: CREATOR_PASSWORD }),
    });
    assert(creatorLogin.status === 200, 'Course Creator authenticates successfully (200 OK)');
    const creatorToken = creatorLogin.data?.data?.accessToken;
    assert(creatorLogin.data?.data?.user?.role === 'course_creator', 'Course Creator role is "course_creator"');

    const adminLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    assert(adminLogin.status === 200, 'Admin authenticates successfully (200 OK)');
    const adminToken = adminLogin.data?.data?.accessToken;

    // -------------------------------------------------------------------------
    // 2. Verify Module 1 Content Quality & Requirements
    // -------------------------------------------------------------------------
    console.log('\n--- Step 2: Module 1 Content Quality & Quality Standards ---');
    const topicsRes = await request(`/api/creator/courses/${COURSE_ID}/modules/${MODULE_1_ID}/topics`, { method: 'GET' }, creatorToken);
    assert(topicsRes.status === 200, 'Creator lists Module 1 topics (200 OK)');
    const topics = topicsRes.data?.data?.topics || [];
    assert(topics.length === 8, 'Module 1 contains exactly 8 topics');

    const expectedTitles = [
      'What Is Backend Development?',
      'Client–Server Architecture',
      'HTTP and HTTPS',
      'HTTP Methods',
      'HTTP Status Codes',
      'JSON and Data Exchange',
      'REST APIs',
      'Understanding the Request–Response Cycle',
    ];

    for (let i = 0; i < 8; i++) {
      const topic = topics[i];
      const expectedTitle = expectedTitles[i];
      console.log(`\nChecking Topic ${i + 1}: "${topic.title}"...`);
      assert(topic.title === expectedTitle, `Topic ${i + 1} title matches: "${expectedTitle}"`);

      // Retrieve full content via GET content endpoint
      const contentRes = await request(
        `/api/creator/courses/${COURSE_ID}/modules/${MODULE_1_ID}/topics/${topic.id}/content`,
        { method: 'GET' },
        creatorToken
      );
      assert(contentRes.status === 200, `Topic ${i + 1} content fetched successfully (200 OK)`);
      const cData = contentRes.data?.data?.content;

      // 1. Topic Introduction / Overview
      assert(Boolean(cData?.content?.explanation && cData.content.explanation.length > 200), `Topic ${i + 1} has rich introduction (>200 chars)`);

      // 2. Sections
      const sections = cData?.content?.sections || [];
      assert(sections.length >= 6, `Topic ${i + 1} has >= 6 detailed sections (found: ${sections.length})`);

      const sectionHeadings = sections.map(s => s.heading.toLowerCase());
      assert(sectionHeadings.some(h => h.includes('objective')), `Topic ${i + 1} includes learning objectives section`);
      assert(sectionHeadings.some(h => h.includes('mistake')), `Topic ${i + 1} includes common beginner mistakes section`);
      assert(sectionHeadings.some(h => h.includes('summary')), `Topic ${i + 1} includes topic summary section`);
      assert(sectionHeadings.some(h => h.includes('task') || h.includes('exercise') || h.includes('practice')), `Topic ${i + 1} includes practice task / thought exercise`);

      // 3. Code Examples
      const codeExamples = cData?.codeExamples || [];
      assert(codeExamples.length >= 1, `Topic ${i + 1} has at least 1 code example (found: ${codeExamples.length})`);
      assert(Boolean(codeExamples[0]?.code && codeExamples[0]?.explanation), `Topic ${i + 1} code example has both code and explanation`);

      // 4. Important Points / Revision Points
      const importantPoints = cData?.importantPoints || [];
      assert(importantPoints.length >= 5, `Topic ${i + 1} has >= 5 key revision points (found: ${importantPoints.length})`);

      // 5. Zero YouTube URLs
      assert(!cData?.videos?.english, `Topic ${i + 1} English video reference is null`);
      assert(!cData?.videos?.telugu, `Topic ${i + 1} Telugu video reference is null`);
      assert(!cData?.videos?.hindi, `Topic ${i + 1} Hindi video reference is null`);

      // 6. External References
      const externalRefs = cData?.externalReferences || [];
      assert(externalRefs.length >= 2, `Topic ${i + 1} has >= 2 external documentation references (found: ${externalRefs.length})`);
    }

    // -------------------------------------------------------------------------
    // 3. Verify Hierarchy & Module 2-8 Invariants
    // -------------------------------------------------------------------------
    console.log('\n--- Step 3: Course Structure & Modules 2-8 Untouched Invariants ---');
    const totalModulesCount = await Module.countDocuments({ courseId: COURSE_ID });
    assert(totalModulesCount === 8, 'Total course modules is exactly 8');

    const totalTopicsCount = await Topic.countDocuments({ courseId: COURSE_ID });
    assert(totalTopicsCount === 73, 'Total course topics is exactly 73');

    // Modules 2-8 must have ZERO content populated
    const otherModules = await Module.find({ courseId: COURSE_ID, order: { $gt: 1 } }).lean();
    for (const om of otherModules) {
      const otherTopics = await Topic.find({ courseId: COURSE_ID, moduleId: om._id }).lean();
      const populatedOther = otherTopics.filter(t => (t.content?.explanation?.length || 0) > 0);
      assert(populatedOther.length === 0, `Module ${om.order} (${om.title}) has 0 populated topics (strictly untouched)`);
    }

    // -------------------------------------------------------------------------
    // 4. Security & Ownership Isolation
    // -------------------------------------------------------------------------
    console.log('\n--- Step 4: Security & Ownership Boundary Enforcement ---');
    const otherEmail = 'temp_other_faculty@test.learnsphere.io';
    const otherPassword = 'Str0ng!OtherFaculty#2026';
    const otherReg = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Other Faculty', email: otherEmail, password: otherPassword }),
    });
    const otherUserId = otherReg.data?.data?.user?.id;
    createdUserIds.push(otherUserId);

    // Promote to course_creator
    await request(`/api/admin/users/${otherUserId}/role`, { method: 'PATCH', body: JSON.stringify({ role: 'course_creator' }) }, adminToken);

    const otherLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: otherEmail, password: otherPassword }),
    });
    const otherToken = otherLogin.data?.data?.accessToken;

    // Cross-creator cannot read course content (leak prevention)
    const otherReadTopic = await request(
      `/api/creator/courses/${COURSE_ID}/modules/${MODULE_1_ID}/topics/${topics[0].id}/content`,
      { method: 'GET' },
      otherToken
    );
    assert(otherReadTopic.status === 404, 'Unrelated creator cannot access topic content (404 Not Found - Leak Prevention)');

    // Cross-creator cannot modify topic content
    const otherUpdateTopic = await request(
      `/api/creator/courses/${COURSE_ID}/modules/${MODULE_1_ID}/topics/${topics[0].id}/content`,
      { method: 'PATCH', body: JSON.stringify({ content: 'Malicious Overwrite' }) },
      otherToken
    );
    assert(otherUpdateTopic.status === 404, 'Unrelated creator cannot modify topic content (404 Not Found)');

    // -------------------------------------------------------------------------
    // 5. Student Access & Public Catalog Isolation
    // -------------------------------------------------------------------------
    console.log('\n--- Step 5: Student Role & Public Catalog Isolation ---');
    const studentEmail = 'temp_student_audit@test.learnsphere.io';
    const studentPassword = 'Str0ng!StudentAudit#2026';
    const studentReg = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Student Auditor', email: studentEmail, password: studentPassword }),
    });
    const studentUserId = studentReg.data?.data?.user?.id;
    createdUserIds.push(studentUserId);

    const studentLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: studentEmail, password: studentPassword }),
    });
    const studentToken = studentLogin.data?.data?.accessToken;

    // Student cannot access creator topic content route
    const studentCreatorAccess = await request(
      `/api/creator/courses/${COURSE_ID}/modules/${MODULE_1_ID}/topics/${topics[0].id}/content`,
      { method: 'GET' },
      studentToken
    );
    assert(studentCreatorAccess.status === 403, 'Student blocked from creator topic content endpoint (403 Forbidden)');

    // Student direct access to draft course topic reader returns 404
    const studentTopicAccess = await request(
      `/api/courses/${COURSE_ID}/topics/${topics[0].id}`,
      { method: 'GET' },
      studentToken
    );
    assert(studentTopicAccess.status === 404, 'Student direct access to draft course topic returns 404 Not Found');

    // Public catalog contains 0 published courses
    const catalogRes = await request('/api/courses', { method: 'GET' });
    const publicCourses = catalogRes.data?.courses || [];
    assert(publicCourses.length === 0, 'Public catalog contains 0 published courses (Draft status strictly preserved)');

    // -------------------------------------------------------------------------
    // 6. Zero Assessments & Zero Gamification
    // -------------------------------------------------------------------------
    console.log('\n--- Step 6: Assessments & Gamification Audit ---');
    const totalAssessments = await Assessment.countDocuments({});
    assert(totalAssessments === 0, 'Total assessments in database is strictly 0');

    const totalAttempts = await AssessmentAttempt.countDocuments({});
    assert(totalAttempts === 0, 'Total assessment attempts in database is strictly 0');

    const totalEnrollments = await Enrollment.countDocuments({});
    assert(totalEnrollments === 0, 'Total enrollments in database is strictly 0');

    const totalProgress = await TopicProgress.countDocuments({});
    assert(totalProgress === 0, 'Total topic progress records in database is strictly 0');

  } catch (err) {
    console.error('\n✗ Error during verification:', err);
    totalTests++;
    failedTests++;
  } finally {
    if (createdUserIds.length > 0) {
      console.log('\n--- Cleaning up temporary test verification accounts ---');
      await User.deleteMany({ _id: { $in: createdUserIds } });
      console.log(`Purged ${createdUserIds.length} temporary test user(s).`);
    }
  }

  console.log('\n===================================================================');
  console.log(`Module 1 Verification: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('===================================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runVerification();
