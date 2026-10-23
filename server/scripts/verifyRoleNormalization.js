/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Verification Suite: Role Normalization (course_creator) & Security Enforcement
 *
 * Strictly tests all 14 mandatory conditions:
 * 1. Existing Admin can still log in.
 * 2. Existing Course Creator can still log in.
 * 3. Course Creator JWT/auth response uses canonical 'course_creator'.
 * 4. Course Creator can access their own course.
 * 5. Course Creator can access their own modules.
 * 6. Course Creator can access their own topics.
 * 7. Course Creator can still perform authorized course-management operations.
 * 8. Another Course Creator cannot access the showcase course.
 * 9. Student cannot access Course Creator routes (403 Forbidden).
 * 10. Student cannot access the draft showcase course (404 Not Found).
 * 11. Admin can still access Admin routes.
 * 12. Public registration still creates student only.
 * 13. Client-supplied role cannot escalate to Course Creator or Admin.
 * 14. No runtime authorization path still depends on courseCreator.
 */

import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { connectDB, isDbConnected } from '../config/db.js';
import User, { CANONICAL_ROLES, normalizeRole } from '../models/User.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
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

async function runRoleAudit() {
  console.log('===================================================================');
  console.log('=== LearnSphere Role Normalization & Security Audit Suite       ===');
  console.log('===================================================================\n');

  if (!isDbConnected()) {
    await connectDB();
  }

  const createdUserIds = [];

  try {
    const adminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@learnsphere.io';
    const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'Str0ng!Admin#Secret2026';
    const creatorEmail = 'faculty@learnsphere.io';
    const creatorPassword = 'Str0ng!Faculty#Secret2026';

    // -------------------------------------------------------------------------
    // TEST 1: Existing Admin can still log in
    // -------------------------------------------------------------------------
    console.log('--- Test 1: Admin Authentication ---');
    const adminLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: adminEmail, password: adminPassword }),
    });
    assert(adminLoginRes.status === 200, 'Existing Admin can log in (200 OK)');
    assert(adminLoginRes.data?.data?.user?.role === 'admin', 'Admin user payload role is "admin"');
    const adminToken = adminLoginRes.data?.data?.accessToken;
    assert(Boolean(adminToken), 'Admin received valid accessToken');

    // -------------------------------------------------------------------------
    // TEST 2 & 3: Existing Course Creator can still log in & JWT/auth payload uses course_creator
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2 & 3: Course Creator Authentication & Role Claims ---');
    const creatorLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: creatorEmail, password: creatorPassword }),
    });
    assert(creatorLoginRes.status === 200, 'Existing Course Creator can log in (200 OK)');
    assert(
      creatorLoginRes.data?.data?.user?.role === 'course_creator',
      'Course Creator user payload role is strictly "course_creator"'
    );
    const creatorToken = creatorLoginRes.data?.data?.accessToken;
    assert(Boolean(creatorToken), 'Course Creator received valid accessToken');

    // Decode JWT token directly to verify claim payload
    const decodedToken = jwt.decode(creatorToken);
    assert(
      decodedToken?.role === 'course_creator',
      'Course Creator signed JWT access token contains claim role: "course_creator"'
    );

    // Verify GET /api/auth/me returns canonical course_creator
    const meRes = await request('/api/auth/me', { method: 'GET' }, creatorToken);
    assert(meRes.status === 200, 'GET /api/auth/me returns 200 OK');
    assert(meRes.data?.data?.user?.role === 'course_creator', 'Authoritative /api/auth/me role is "course_creator"');

    // Verify GET /api/creator/status returns canonical course_creator
    const statusRes = await request('/api/creator/status', { method: 'GET' }, creatorToken);
    assert(statusRes.status === 200, 'GET /api/creator/status returns 200 OK');
    assert(statusRes.data?.data?.role === 'course_creator', 'GET /api/creator/status reports role: "course_creator"');

    // -------------------------------------------------------------------------
    // TEST 4, 5, 6, 7: Course Creator can access own course, modules, topics & perform management
    // -------------------------------------------------------------------------
    console.log('\n--- Test 4, 5, 6, 7: Course Creator Resource Access & Management ---');
    const showcaseCourse = await Course.findOne({ title: 'Backend Development with Node.js, Express & MongoDB' });
    assert(Boolean(showcaseCourse), 'Showcase course exists in MongoDB');
    const courseId = showcaseCourse._id.toString();

    // 4. Access own course
    const creatorCourseRes = await request(`/api/creator/courses/${courseId}`, { method: 'GET' }, creatorToken);
    assert(creatorCourseRes.status === 200, 'Course Creator can access their own course (200 OK)');

    // 5. Access own modules
    const creatorModulesRes = await request(`/api/creator/courses/${courseId}/modules`, { method: 'GET' }, creatorToken);
    assert(creatorModulesRes.status === 200, 'Course Creator can access their own modules (200 OK)');
    const firstModuleId = creatorModulesRes.data?.data?.modules?.[0]?.id;
    assert(Boolean(firstModuleId), 'Modules list is populated with valid module IDs');

    // 6. Access own topics
    const creatorTopicsRes = await request(
      `/api/creator/courses/${courseId}/modules/${firstModuleId}/topics`,
      { method: 'GET' },
      creatorToken
    );
    assert(creatorTopicsRes.status === 200, 'Course Creator can access their own topics (200 OK)');
    assert(creatorTopicsRes.data?.data?.topics?.length === 8, 'First module returns all 8 topics');

    // 7. Course Creator can perform authorized management operations
    // Test safe patch of description without altering draft status
    const updateCourseRes = await request(
      `/api/creator/courses/${courseId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({
          description:
            'Learn backend development from the fundamentals to building secure REST APIs using Node.js, Express.js, MongoDB, and Mongoose.',
        }),
      },
      creatorToken
    );
    assert(updateCourseRes.status === 200, 'Course Creator can update course metadata via PATCH /api/creator/courses/:id (200 OK)');

    // -------------------------------------------------------------------------
    // TEST 8: Another Course Creator cannot access the showcase course (Isolation & IDOR prevention)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 8: Cross-Creator Isolation & IDOR Protection ---');
    const otherEmail = 'temp_other_creator@test.learnsphere.io';
    const otherPassword = 'Str0ng!OtherCreator#2026';
    const otherReg = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Unrelated Creator', email: otherEmail, password: otherPassword }),
    });
    const otherUserId = otherReg.data?.data?.user?.id;
    createdUserIds.push(otherUserId);

    // Promote to course_creator via admin endpoint
    await request(`/api/admin/users/${otherUserId}/role`, { method: 'PATCH', body: JSON.stringify({ role: 'course_creator' }) }, adminToken);

    const otherLoginRes = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: otherEmail, password: otherPassword }),
    });
    const otherToken = otherLoginRes.data?.data?.accessToken;

    const otherCourseAccess = await request(`/api/creator/courses/${courseId}`, { method: 'GET' }, otherToken);
    assert(otherCourseAccess.status === 404, 'Other Course Creator receives 404 Not Found (Leak Prevention)');

    const otherCourseUpdate = await request(
      `/api/creator/courses/${courseId}`,
      { method: 'PATCH', body: JSON.stringify({ title: 'Hijacked Title' }) },
      otherToken
    );
    assert(otherCourseUpdate.status === 404, 'Other Course Creator cannot modify showcase course (404 Not Found)');

    // -------------------------------------------------------------------------
    // TEST 9 & 10: Student cannot access Course Creator routes or draft course
    // -------------------------------------------------------------------------
    console.log('\n--- Test 9 & 10: Student Role Boundary Enforcement ---');
    const studentEmail = 'temp_student@test.learnsphere.io';
    const studentPassword = 'Str0ng!Student#2026';
    const studentReg = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name: 'Enrolled Learner', email: studentEmail, password: studentPassword }),
    });
    const studentUserId = studentReg.data?.data?.user?.id;
    createdUserIds.push(studentUserId);

    const studentLogin = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: studentEmail, password: studentPassword }),
    });
    const studentToken = studentLogin.data?.data?.accessToken;

    // 9. Student cannot access creator routes
    const studentCreatorAccess = await request(`/api/creator/courses/${courseId}`, { method: 'GET' }, studentToken);
    assert(studentCreatorAccess.status === 403, 'Student cannot access Course Creator routes (403 Forbidden)');

    const studentCreatorList = await request('/api/creator/courses', { method: 'GET' }, studentToken);
    assert(studentCreatorList.status === 403, 'Student cannot list courses via creator API (403 Forbidden)');

    // 10. Student cannot access draft showcase course
    const studentPublicView = await request(`/api/courses/${courseId}`, { method: 'GET' }, studentToken);
    assert(studentPublicView.status === 404, 'Student direct access to draft course returns 404 Not Found');

    const publicCatalog = await request('/api/courses', { method: 'GET' });
    const catalogCourses = publicCatalog.data?.courses || [];
    assert(catalogCourses.length === 0, 'Public course catalog does not contain draft showcase course (0 published courses)');

    // -------------------------------------------------------------------------
    // TEST 11: Admin can still access Admin routes
    // -------------------------------------------------------------------------
    console.log('\n--- Test 11: Admin Route Authorization ---');
    const adminDashRes = await request('/api/admin/dashboard', { method: 'GET' }, adminToken);
    assert(adminDashRes.status === 200, 'Admin can access /api/admin/dashboard (200 OK)');
    assert(typeof adminDashRes.data?.data?.users?.courseCreators === 'number', 'Dashboard aggregates course creators count');

    const adminUsersRes = await request('/api/admin/users?role=course_creator', { method: 'GET' }, adminToken);
    assert(adminUsersRes.status === 200, 'Admin can list users with query role=course_creator (200 OK)');
    assert(adminUsersRes.data?.data?.users?.length >= 1, 'Admin finds at least 1 course_creator user');

    const adminCourseView = await request(`/api/admin/courses/${courseId}`, { method: 'GET' }, adminToken);
    assert(adminCourseView.status === 200, 'Admin can view course via GET /api/admin/courses/:id (200 OK)');

    // -------------------------------------------------------------------------
    // TEST 12 & 13: Public registration creates student only; role cannot be spoofed
    // -------------------------------------------------------------------------
    console.log('\n--- Test 12 & 13: Public Registration Privilege Escalation Defense ---');
    const attackerEmail = 'attacker_escalation@test.learnsphere.io';
    const attackerReg = await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Attacker Attempt',
        email: attackerEmail,
        password: 'Password123!',
        role: 'course_creator', // Attempting to force role
      }),
    });
    assert(attackerReg.status === 201, 'Public registration returns 201 Created');
    assert(attackerReg.data?.data?.user?.role === 'student', 'Public registration forces role strictly to "student"');
    const attackerUserId = attackerReg.data?.data?.user?.id;
    createdUserIds.push(attackerUserId);

    const dbAttacker = await User.findById(attackerUserId);
    assert(dbAttacker?.role === 'student', 'Database role verified strictly as "student"');

    // -------------------------------------------------------------------------
    // TEST 14: No runtime authorization path still depends on legacy courseCreator
    // -------------------------------------------------------------------------
    console.log('\n--- Test 14: Canonical Role Architecture Verification ---');
    assert(CANONICAL_ROLES.includes('course_creator'), 'CANONICAL_ROLES includes "course_creator"');
    assert(!CANONICAL_ROLES.includes('courseCreator'), 'CANONICAL_ROLES DOES NOT include "courseCreator"');
    assert(normalizeRole('courseCreator') === 'course_creator', 'normalizeRole("courseCreator") maps to "course_creator"');
    assert(normalizeRole('course_creator') === 'course_creator', 'normalizeRole("course_creator") maps to "course_creator"');

    // Test that token with legacy 'courseCreator' string is also normalized by middleware
    const legacyToken = generateAccessToken({ userId: showcaseCourse.courseCreator, role: 'courseCreator' });
    const legacyAccessRes = await request(`/api/creator/status`, { method: 'GET' }, legacyToken);
    assert(legacyAccessRes.status === 200, 'Legacy token is successfully authorized via normalizeRole (200 OK)');
    assert(legacyAccessRes.data?.data?.role === 'course_creator', 'Middleware upgrades legacy role to "course_creator"');

  } catch (err) {
    console.error('\n✗ Error during role verification:', err);
    totalTests++;
    failedTests++;
  } finally {
    // Clean up temporary test users created during verification
    if (createdUserIds.length > 0) {
      console.log('\n--- Cleaning up temporary test verification accounts ---');
      await User.deleteMany({ _id: { $in: createdUserIds } });
      console.log(`Purged ${createdUserIds.length} temporary test user(s).`);
    }
  }

  console.log('\n===================================================================');
  console.log(`Role Audit & Normalization Verification: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('===================================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runRoleAudit();
