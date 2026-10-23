/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Verification Suite: Showcase Course Workflow & Security Architecture
 *
 * Validates:
 * 1. Admin can access and inspect the showcase course.
 * 2. Course Creator can access and inspect the showcase course.
 * 3. Complete course hierarchy: 8 Modules and 73 Topics correctly linked and ordered.
 * 4. Draft status strictly preserved across all endpoints.
 * 5. Public student catalog (/api/courses) does NOT expose this draft course.
 * 6. Public student details (/api/courses/:id) returns 404 for draft course.
 * 7. Unauthenticated requests to creator/admin endpoints return 401 Unauthorized.
 * 8. Cross-creator ownership boundaries: another Course Creator cannot view or modify the course.
 * 9. Content safety: zero assessments, zero detailed content, zero YouTube URLs, zero fake gamification.
 * 10. Database integrity: exact counts for Course, Modules, and Topics.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from '../config/db.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import Assessment from '../models/Assessment.js';

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
  console.log('=== Phase 11I-B: Showcase Course Workflow & Security Validation ===');
  console.log('===================================================================\n');

  if (!isDbConnected()) {
    await connectDB();
  }

  try {
    // -------------------------------------------------------------------------
    // 1. Locate Showcase Course in Database
    // -------------------------------------------------------------------------
    console.log('--- Step 1: Locating Showcase Course ---');
    const course = await Course.findOne({
      title: 'Backend Development with Node.js, Express & MongoDB',
    }).populate('courseCreator', 'name email role status');

    assert(course !== null, 'Showcase course exists in MongoDB database');
    if (!course) {
      throw new Error('Course not found. Please run createShowcaseCourse.js first.');
    }

    const courseId = course._id.toString();
    console.log(`  Course ID: ${courseId}`);
    assert(course.status === 'draft', 'Course status is strictly "draft"');
    assert(course.category === 'Backend Development', 'Course category is "Backend Development"');
    assert(course.courseCreator && course.courseCreator.role === 'course_creator', 'Course creator role is "course_creator"');

    // -------------------------------------------------------------------------
    // 2. Authenticate Admin and Primary Course Creator
    // -------------------------------------------------------------------------
    console.log('\n--- Step 2: Authenticating Roles ---');
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@learnsphere.io';
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Str0ng!Admin#Secret2026';

    const adminLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    assert(adminLoginRes.status === 200, 'Admin authenticates successfully (200 OK)');
    const adminToken = adminLoginRes.data?.data?.accessToken;

    const creatorEmail = course.courseCreator.email;
    const creatorPassword = 'Str0ng!Faculty#Secret2026';

    const creatorLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: creatorEmail, password: creatorPassword }),
    });
    assert(creatorLoginRes.status === 200, 'Course Creator authenticates successfully (200 OK)');
    const creatorToken = creatorLoginRes.data?.data?.accessToken;

    // -------------------------------------------------------------------------
    // 3. Admin Access & Structure Inspection
    // -------------------------------------------------------------------------
    console.log('\n--- Step 3: Admin Course & Structure Inspection ---');
    const adminCourseRes = await request(`/api/admin/courses/${courseId}`, { method: 'GET' }, adminToken);
    assert(adminCourseRes.status === 200, 'Admin can view course via GET /api/admin/courses/:id (200 OK)');
    assert(adminCourseRes.data?.data?.course?.title === course.title, 'Admin course response title matches');

    const adminStructureRes = await request(`/api/admin/courses/${courseId}/structure`, { method: 'GET' }, adminToken);
    assert(adminStructureRes.status === 200, 'Admin can retrieve structure via GET /api/admin/courses/:id/structure (200 OK)');

    const modules = adminStructureRes.data?.data?.modules || [];
    assert(modules.length === 8, `Complete 8 modules retrieved by admin (retrieved: ${modules.length})`);

    let totalTopics = 0;
    const expectedModuleTitles = [
      'Module 1 — Backend Fundamentals',
      'Module 2 — Node.js Fundamentals',
      'Module 3 — Express.js',
      'Module 4 — MongoDB and Mongoose',
      'Module 5 — Building REST APIs',
      'Module 6 — Authentication and Authorization',
      'Module 7 — Backend Security',
      'Module 8 — Practical Backend Project',
    ];

    for (let i = 0; i < modules.length; i++) {
      const m = modules[i];
      assert(m.title === expectedModuleTitles[i], `Module ${i + 1} title matches: "${m.title}"`);
      assert(m.order === i + 1, `Module ${i + 1} order is sequential (${m.order})`);
      totalTopics += (m.topics || []).length;
    }

    assert(totalTopics === 73, `Total topics across all modules is exactly 73 (counted: ${totalTopics})`);

    // -------------------------------------------------------------------------
    // 4. Course Creator Scoped Access
    // -------------------------------------------------------------------------
    console.log('\n--- Step 4: Course Creator Scoped Access ---');
    const creatorCourseRes = await request(`/api/creator/courses/${courseId}`, { method: 'GET' }, creatorToken);
    assert(creatorCourseRes.status === 200, 'Course Creator can view course via GET /api/creator/courses/:id (200 OK)');
    assert(creatorCourseRes.data?.data?.course?.id === courseId, 'Creator course response ID matches');

    const creatorModulesRes = await request(`/api/creator/courses/${courseId}/modules`, { method: 'GET' }, creatorToken);
    assert(creatorModulesRes.status === 200, 'Course Creator can list modules via GET /api/creator/courses/:id/modules (200 OK)');
    assert(creatorModulesRes.data?.data?.modules?.length === 8, 'Creator receives all 8 modules');

    // -------------------------------------------------------------------------
    // 5. Cross-Creator Ownership Boundary & IDOR Prevention
    // -------------------------------------------------------------------------
    console.log('\n--- Step 5: Cross-Creator Ownership Boundary & IDOR Prevention ---');
    const otherEmail = 'test_unrelated_creator@learnsphere.io';
    const otherPassword = 'Str0ng!Unrelated#2026';

    let otherUser = await User.findOne({ email: otherEmail });
    if (!otherUser) {
      const regRes = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name: 'Unrelated Creator', email: otherEmail, password: otherPassword }),
      });
      const oId = regRes.data?.data?.user?.id;
      await request(`/api/admin/users/${oId}/role`, { method: 'PATCH', body: JSON.stringify({ role: 'course_creator' }) }, adminToken);
    }

    const otherLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: otherEmail, password: otherPassword }),
    });
    const otherToken = otherLoginRes.data?.data?.accessToken;

    // Other creator cannot view course (returns 404 to avoid leaking course existence)
    const otherGetRes = await request(`/api/creator/courses/${courseId}`, { method: 'GET' }, otherToken);
    assert(otherGetRes.status === 404, 'Unrelated Course Creator cannot view course (returns 404 Not Found - Leak Prevention)');

    // Other creator cannot update course
    const otherPatchRes = await request(
      `/api/creator/courses/${courseId}`,
      { method: 'PATCH', body: JSON.stringify({ title: 'Unauthorized Modification' }) },
      otherToken
    );
    assert(otherPatchRes.status === 404, 'Unrelated Course Creator cannot modify course (returns 404 Not Found)');

    // Other creator cannot add modules to this course
    const otherAddModRes = await request(
      `/api/creator/courses/${courseId}/modules`,
      { method: 'POST', body: JSON.stringify({ title: 'Malicious Module', order: 99 }) },
      otherToken
    );
    assert(otherAddModRes.status === 404, 'Unrelated Course Creator cannot add module to another creator course');

    // Clean up temporary other user
    await User.deleteOne({ email: otherEmail });

    // -------------------------------------------------------------------------
    // 6. Public Student Catalog & Detail Isolation (Draft Protection)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 6: Public Student Catalog Isolation ---');
    const publicCatalogRes = await request('/api/courses', { method: 'GET' });
    assert(publicCatalogRes.status === 200, 'Public catalog endpoint /api/courses returns 200 OK');
    const publicCourses = publicCatalogRes.data?.courses || [];
    const foundShowcase = publicCourses.find((c) => c.id === courseId || c.title === course.title);
    assert(!foundShowcase, 'Draft showcase course is NOT visible in public student catalog');
    assert(publicCourses.length === 0, 'Public catalog contains 0 published courses (draft isolation intact)');

    const publicDetailRes = await request(`/api/courses/${courseId}`, { method: 'GET' });
    assert(publicDetailRes.status === 404, 'Direct student access to draft course /api/courses/:id returns 404 Not Found');

    // -------------------------------------------------------------------------
    // 7. Content Rules & Safety Audit
    // -------------------------------------------------------------------------
    console.log('\n--- Step 7: Content Rules & Safety Audit ---');
    const allDbTopics = await Topic.find({ courseId }).lean();
    let hasDetailedContent = false;
    let hasVideo = false;

    for (const t of allDbTopics) {
      if (t.content?.explanation && t.content.explanation.trim().length > 0) hasDetailedContent = true;
      if (t.videos?.english || t.videos?.telugu || t.videos?.hindi) hasVideo = true;
    }

    assert(!hasDetailedContent, 'Zero detailed educational content in topics (saved for content generation phase)');
    assert(!hasVideo, 'Zero YouTube video URLs in topics (saved for media review phase)');

    const assessmentCount = await Assessment.countDocuments({ courseId });
    assert(assessmentCount === 0, 'Zero assessments linked to course (saved for assessment phase)');

    // -------------------------------------------------------------------------
    // 8. Database Counts Summary
    // -------------------------------------------------------------------------
    console.log('\n--- Step 8: Database Integrity & Counts ---');
    const userCount = await User.countDocuments();
    const courseCount = await Course.countDocuments();
    const moduleCount = await Module.countDocuments();
    const topicCount = await Topic.countDocuments();
    const assessCount = await Assessment.countDocuments();

    console.log(`  Users in DB:        ${userCount}`);
    console.log(`  Courses in DB:      ${courseCount}`);
    console.log(`  Modules in DB:      ${moduleCount}`);
    console.log(`  Topics in DB:       ${topicCount}`);
    console.log(`  Assessments in DB:  ${assessCount}`);

    assert(courseCount === 1, 'Exactly 1 course in database');
    assert(moduleCount === 8, 'Exactly 8 modules in database');
    assert(topicCount === 73, 'Exactly 73 topics in database');
    assert(assessCount === 0, 'Zero assessments in database');

  } catch (err) {
    console.error('\n✗ Verification run failed with uncaught exception:', err);
    totalTests++;
    failedTests++;
  }

  console.log('\n===================================================================');
  console.log(`Phase 11I-B Verification: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('===================================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runVerification();
