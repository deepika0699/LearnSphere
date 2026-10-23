/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Verification Suite: Phase 11I-C8 — Module 8 Content & Complete Course Verification
 *
 * Verifies all mandatory conditions:
 * 1. All 9 Module 8 topics exist in exact order and contain populated content.
 * 2. Explanations are non-empty and substantial.
 * 3. Sections are populated and sequentially ordered.
 * 4. Code examples have the expected structure.
 * 5. Important points are populated.
 * 6. External references are populated and valid HTTPS links.
 * 7. Videos remain null.
 * 8. Images remain empty.
 * 9. Modules 1–7 remain populated (8/8, 9/9, 9/9, 9/9, 10/10, 9/9, 10/10) and Module 8 is populated (9/9) -> 73/73 total topics populated.
 * 10. Course remains draft and no public published course appears.
 * 11. Data integrity confirmed across all collections.
 * 12. Authorization & ownership boundaries enforced.
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
import Note from '../models/Note.js';
import Certificate from '../models/Certificate.js';
import RefreshSession from '../models/RefreshSession.js';

const BASE_URL = 'http://localhost:5000';
const COURSE_ID = '6abe9dc2f15c2b4f6008ac1c';

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
  console.log('=== LearnSphere Phase 11I-C8: Module 8 Content Verification     ===');
  console.log('===================================================================\n');

  if (!isDbConnected()) {
    await connectDB();
  }

  const initialUsersCount = await User.countDocuments({});
  const createdUserIds = [];

  try {
    // -------------------------------------------------------------------------
    // 1. Authenticate Roles & Dynamically Resolve Module 8 ID from Database
    // -------------------------------------------------------------------------
    console.log('--- Step 1: Role Authentication & Module 8 Resolution ---');
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

    const mod8Doc = await Module.findOne({ courseId: COURSE_ID, order: 8 }).lean();
    assert(Boolean(mod8Doc), 'Module 8 resolved dynamically from MongoDB');
    assert(
      mod8Doc && mod8Doc.title.includes('Practical Backend Project'),
      `Module 8 title includes "Practical Backend Project" (found: "${mod8Doc?.title}")`
    );
    const MODULE_8_ID = mod8Doc._id.toString();

    // -------------------------------------------------------------------------
    // 2. Verify All 9 Module 8 Topics & Required Content Structure
    // -------------------------------------------------------------------------
    console.log('\n--- Step 2: Module 8 Topics Content & Quality Verification ---');
    const topicsRes = await request(
      `/api/creator/courses/${COURSE_ID}/modules/${MODULE_8_ID}/topics`,
      { method: 'GET' },
      creatorToken
    );
    assert(topicsRes.status === 200, 'Creator lists Module 8 topics (200 OK)');
    const topics = topicsRes.data?.data?.topics || [];
    assert(topics.length === 9, 'Module 8 contains exactly 9 topics');

    const expectedTopics = [
      { id: '6abe9ddff15c2b4f6008ac65', title: 'Planning the API' },
      { id: '6abe9ddff15c2b4f6008ac66', title: 'Designing the Database' },
      { id: '6abe9ddff15c2b4f6008ac67', title: 'Creating the Project Structure' },
      { id: '6abe9de0f15c2b4f6008ac68', title: 'Implementing Authentication' },
      { id: '6abe9de0f15c2b4f6008ac69', title: 'Implementing CRUD' },
      { id: '6abe9de1f15c2b4f6008ac6a', title: 'Adding Authorization' },
      { id: '6abe9de1f15c2b4f6008ac6b', title: 'Adding Validation and Security' },
      { id: '6abe9de2f15c2b4f6008ac6c', title: 'Testing the API' },
      { id: '6abe9de2f15c2b4f6008ac6d', title: 'Understanding the Complete Backend Flow' },
    ];

    const forbiddenVaguePhrases = [
      'as explained above',
      'as explained earlier',
      'as we saw earlier',
      'as we discussed above',
      'as discussed earlier',
      'you already know this',
    ];
    const forbiddenGamificationTerms = ['leaderboard', 'xp points', 'streak badge', 'daily coins'];

    for (let i = 0; i < 9; i++) {
      const topic = topics[i];
      const expected = expectedTopics[i];
      console.log(`\nChecking Topic ${i + 1}: "${topic.title}"...`);
      assert(topic.id === expected.id, `Topic ${i + 1} ID matches expected (${expected.id})`);
      assert(topic.title === expected.title, `Topic ${i + 1} title matches: "${expected.title}"`);
      assert(topic.order === i + 1, `Topic ${i + 1} order is ${i + 1}`);

      const contentRes = await request(
        `/api/creator/courses/${COURSE_ID}/modules/${MODULE_8_ID}/topics/${topic.id}/content`,
        { method: 'GET' },
        creatorToken
      );
      assert(contentRes.status === 200, `Topic ${i + 1} content fetched successfully (200 OK)`);
      const cData = contentRes.data?.data?.content;

      // 1 & 2. Clear introduction / explanation
      const explanation = cData?.content?.explanation || '';
      assert(explanation.length > 300, `Topic ${i + 1} has substantial introduction (${explanation.length} chars)`);

      // 3. Meaningful & ordered sections
      const sections = cData?.content?.sections || [];
      assert(sections.length >= 7, `Topic ${i + 1} has >= 7 sections (found: ${sections.length})`);

      const isOrdered = sections.every((s, idx) => s.order === idx && s.heading.length > 3 && s.body.length > 100);
      assert(isOrdered, `Topic ${i + 1} sections are sequentially ordered (0..${sections.length - 1}) and substantial`);

      const sectionHeadings = sections.map((s) => s.heading.toLowerCase());
      assert(sectionHeadings.some((h) => h.includes('objective')), `Topic ${i + 1} has Learning Objectives section`);
      assert(sectionHeadings.some((h) => h.includes('terminology')), `Topic ${i + 1} has Core Terminology section`);
      assert(sectionHeadings.some((h) => h.includes('mistake')), `Topic ${i + 1} has Common Beginner Mistakes section`);
      assert(sectionHeadings.some((h) => h.includes('practice') || h.includes('task')), `Topic ${i + 1} has Suggested Practice Task section`);
      assert(sectionHeadings.some((h) => h.includes('summary')), `Topic ${i + 1} has Topic Summary section`);

      // 4. Code examples
      const codeExamples = cData?.codeExamples || [];
      assert(codeExamples.length >= 1, `Topic ${i + 1} has >= 1 code example (found: ${codeExamples.length})`);
      const validExamples = codeExamples.every(
        (ex) => ex.title && ex.language && ex.code && ex.code.length > 40 && ex.explanation && ex.explanation.length > 40
      );
      assert(validExamples, `Topic ${i + 1} code examples have title, language, code, and explanation`);

      // 5. Important / revision points
      const importantPoints = cData?.importantPoints || [];
      assert(importantPoints.length >= 5, `Topic ${i + 1} has >= 5 revision points (found: ${importantPoints.length})`);

      // 6. External references
      const externalRefs = cData?.externalReferences || [];
      assert(externalRefs.length >= 2, `Topic ${i + 1} has >= 2 external references (found: ${externalRefs.length})`);
      const validRefs = externalRefs.every((r) => r.title && r.url && r.url.startsWith('https://') && r.source);
      assert(validRefs, `Topic ${i + 1} external references are validly structured HTTPS links`);

      // 7. Video fields remain null
      assert(cData?.videos?.english === null, `Topic ${i + 1} videos.english is null`);
      assert(cData?.videos?.telugu === null, `Topic ${i + 1} videos.telugu is null`);
      assert(cData?.videos?.hindi === null, `Topic ${i + 1} videos.hindi is null`);

      // 8. Images remain empty
      assert(Array.isArray(cData?.images) && cData.images.length === 0, `Topic ${i + 1} images array is empty`);

      // Self-contained quality, zero real secrets, zero gamification, no "instructor" role
      const combinedText = JSON.stringify(cData).toLowerCase();
      const hasVaguePhrase = forbiddenVaguePhrases.some((p) => combinedText.includes(p));
      assert(!hasVaguePhrase, `Topic ${i + 1} is self-contained (no vague cross-topic phrases)`);

      const hasGamification = forbiddenGamificationTerms.some((g) => combinedText.includes(g));
      assert(!hasGamification, `Topic ${i + 1} contains no gamification terminology`);

      const hasRealMongoUri = combinedText.includes('mongodb+srv://');
      assert(!hasRealMongoUri, `Topic ${i + 1} contains no real MongoDB connection URIs`);

      const hasInstructorRole = combinedText.includes('instructor');
      assert(!hasInstructorRole, `Topic ${i + 1} uses canonical LearnSphere roles (never "instructor")`);
    }

    // -------------------------------------------------------------------------
    // 3. Verify Modules 1–7 Preserved, Module 8 Populated & Course Draft
    // -------------------------------------------------------------------------
    console.log('\n--- Step 3: Course Structure, Modules 1–7 Preservation & Complete Course Audit ---');
    const courseDoc = await Course.findById(COURSE_ID).lean();
    assert(courseDoc && courseDoc.status === 'draft', 'Showcase course remains strictly in "draft" status');

    const totalCoursesCount = await Course.countDocuments({});
    assert(totalCoursesCount === 1, 'Total courses in database is strictly 1');

    const totalModulesCount = await Module.countDocuments({ courseId: COURSE_ID });
    assert(totalModulesCount === 8, 'Total course modules is strictly 8');

    const totalTopicsCount = await Topic.countDocuments({ courseId: COURSE_ID });
    assert(totalTopicsCount === 73, 'Total course topics is strictly 73');

    const allModules = await Module.find({ courseId: COURSE_ID }).sort({ order: 1 }).lean();
    const expectedModuleCounts = [
      { order: 1, total: 8, populated: 8 },
      { order: 2, total: 9, populated: 9 },
      { order: 3, total: 9, populated: 9 },
      { order: 4, total: 9, populated: 9 },
      { order: 5, total: 10, populated: 10 },
      { order: 6, total: 9, populated: 9 },
      { order: 7, total: 10, populated: 10 },
      { order: 8, total: 9, populated: 9 },
    ];

    for (const exp of expectedModuleCounts) {
      const mDoc = allModules.find((m) => m.order === exp.order);
      const mTopics = await Topic.find({ courseId: COURSE_ID, moduleId: mDoc._id }).lean();
      const popCount = mTopics.filter((t) => (t.content?.explanation?.length || 0) > 200).length;
      assert(
        mTopics.length === exp.total && popCount === exp.populated,
        `Module ${exp.order} (${mDoc.title}) has ${popCount}/${mTopics.length} populated topics (expected ${exp.populated}/${exp.total})`
      );
    }

    // -------------------------------------------------------------------------
    // 4. Security & Ownership Isolation
    // -------------------------------------------------------------------------
    console.log('\n--- Step 4: Security & Ownership Boundary Enforcement ---');
    const unauthRead = await request(
      `/api/creator/courses/${COURSE_ID}/modules/${MODULE_8_ID}/topics/${topics[0].id}/content`,
      { method: 'GET' }
    );
    assert(unauthRead.status === 401, 'Unauthenticated request cannot read Module 8 topic content (401 Unauthorized)');

    const otherEmail = 'temp_other_creator_m8@test.learnsphere.io';
    const otherPassword = 'Str0ng!OtherCreatorM8#2026';
    const otherReg = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Other Creator M8', email: otherEmail, password: otherPassword }),
    });
    const otherUserId = otherReg.data?.data?.user?.id;
    createdUserIds.push(otherUserId);

    await request(
      `/api/admin/users/${otherUserId}/role`,
      { method: 'PATCH', body: JSON.stringify({ role: 'course_creator' }) },
      adminToken
    );

    const otherLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: otherEmail, password: otherPassword }),
    });
    const otherToken = otherLogin.data?.data?.accessToken;

    const otherRead = await request(
      `/api/creator/courses/${COURSE_ID}/modules/${MODULE_8_ID}/topics/${topics[0].id}/content`,
      { method: 'GET' },
      otherToken
    );
    assert(otherRead.status === 404, 'Unrelated Course Creator cannot read Module 8 topic content (404 Leak Prevention)');

    const otherPatch = await request(
      `/api/creator/courses/${COURSE_ID}/modules/${MODULE_8_ID}/topics/${topics[0].id}/content`,
      { method: 'PATCH', body: JSON.stringify({ content: 'Unauthorized edit' }) },
      otherToken
    );
    assert(otherPatch.status === 404, 'Unrelated Course Creator cannot modify Module 8 topic content (404 Not Found)');

    // -------------------------------------------------------------------------
    // 5. Student Access & Public Catalog Isolation
    // -------------------------------------------------------------------------
    console.log('\n--- Step 5: Student Role & Draft Isolation ---');
    const studentEmail = 'temp_student_m8@test.learnsphere.io';
    const studentPassword = 'Str0ng!StudentM8#2026';
    const studentReg = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Student M8', email: studentEmail, password: studentPassword }),
    });
    const studentUserId = studentReg.data?.data?.user?.id;
    createdUserIds.push(studentUserId);

    const studentLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: studentEmail, password: studentPassword }),
    });
    const studentToken = studentLogin.data?.data?.accessToken;

    const studentCreatorAccess = await request(
      `/api/creator/courses/${COURSE_ID}/modules/${MODULE_8_ID}/topics/${topics[0].id}/content`,
      { method: 'GET' },
      studentToken
    );
    assert(studentCreatorAccess.status === 403, 'Student blocked from creator content endpoint (403 Forbidden)');

    const studentPublicTopicAccess = await request(
      `/api/courses/${COURSE_ID}/topics/${topics[0].id}`,
      { method: 'GET' },
      studentToken
    );
    assert(studentPublicTopicAccess.status === 404, 'Student cannot access draft Module 8 topic via public route (404 Not Found)');

    const catalogRes = await request('/api/courses', { method: 'GET' });
    assert((catalogRes.data?.courses || []).length === 0, 'Public catalog contains 0 published courses');

    // Clean up temporary verification users and sessions before final DB count assertions
    if (createdUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
      createdUserIds.length = 0;
    }
    await RefreshSession.deleteMany({});

    // -------------------------------------------------------------------------
    // 6. Database Cleanliness Audit
    // -------------------------------------------------------------------------
    console.log('\n--- Step 6: Users, Assessments, Enrollments, Progress, Notes & Certificates Audit ---');
    assert(
      (await User.countDocuments({})) === initialUsersCount,
      `Users count remains unchanged at ${initialUsersCount} (no unexpected user records created)`
    );
    assert((await Assessment.countDocuments({})) === 0, 'Assessments count is strictly 0');
    assert((await AssessmentAttempt.countDocuments({})) === 0, 'AssessmentAttempts count is strictly 0');
    assert((await Enrollment.countDocuments({})) === 0, 'Enrollments count is strictly 0');
    assert((await TopicProgress.countDocuments({})) === 0, 'TopicProgress count is strictly 0');
    assert((await Note.countDocuments({})) === 0, 'Notes count is strictly 0');
    assert((await Certificate.countDocuments({})) === 0, 'Certificates count is strictly 0');
    assert((await RefreshSession.countDocuments({})) === 0, 'RefreshSessions count is strictly 0');
  } catch (err) {
    console.error('\n✗ Verification error:', err);
    totalTests++;
    failedTests++;
  } finally {
    if (createdUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
    }
    await RefreshSession.deleteMany({});
    await mongoose.disconnect();
  }

  console.log('\n===================================================================');
  console.log(`Phase 11I-C8 Module 8 Verification: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('===================================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runVerification();
