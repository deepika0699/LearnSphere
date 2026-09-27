/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from '../config/db.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';

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

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
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
  console.log('===================================================================');
  console.log('=== Phase 6C — Public Course Catalog Regression & Hardening Audit ===');
  console.log('===================================================================\n');

  // --- 1. Static Code Analysis of Courses.tsx ---
  console.log('--- 1. Static Code Analysis of Courses.tsx ---');
  const coursesCode = fs.readFileSync(path.resolve('src/pages/student/Courses.tsx'), 'utf8');

  assert(!coursesCode.includes('dangerouslySetInnerHTML'), 'No dangerouslySetInnerHTML in Courses.tsx');
  assert(!coursesCode.includes('eval('), 'No eval() in Courses.tsx');
  assert(!coursesCode.includes('new Function'), 'No new Function in Courses.tsx');
  assert(!coursesCode.includes('localStorage'), 'No localStorage in Courses.tsx');
  assert(!coursesCode.includes('sessionStorage'), 'No sessionStorage in Courses.tsx');
  assert(coursesCode.includes('isSubscribed = false'), 'Courses.tsx implements subscription cleanup guard');
  assert(coursesCode.includes('courseApi.getCourses'), 'Courses.tsx consumes real courseApi.getCourses');
  assert(coursesCode.includes('handleRetry') || coursesCode.includes('retryTrigger'), 'Courses.tsx includes retry trigger handler');
  assert(coursesCode.includes('/courses/${course.id}'), 'Courses.tsx navigates to canonical /courses/:courseId');
  assert(coursesCode.includes('FeedbackState'), 'Courses.tsx implements FeedbackState for errors');
  assert(coursesCode.includes('SkeletonCard'), 'Courses.tsx implements SkeletonCard for catalog loading');

  // --- 2. Live API Testing with Database Seeding ---
  console.log('\n--- 2. Database Seeding & Public Catalog Checks ---');
  await connectDB();
  if (!isDbConnected()) {
    console.error('Database connection failed. Aborting audit.');
    process.exit(1);
  }

  const suffix = Date.now().toString().slice(-6);

  const creator = await User.create({
    name: `Catalog Instructor ${suffix}`,
    email: `catalog-creator-${suffix}@example.com`,
    password: 'Password#123!',
    role: 'courseCreator',
    status: 'active',
  });

  const pubCourse1 = await Course.create({
    title: `Alpha Systems Architecture ${suffix}`,
    description: 'Computer systems, microkernels, and low-level engineering.',
    category: 'Computer Science',
    courseCreator: creator._id,
    status: 'published',
    thumbnail: 'https://images.unsplash.com/photo-systems',
    createdAt: new Date(Date.now() - 30000),
  });

  const pubCourse2 = await Course.create({
    title: `Beta Deep Learning Foundations ${suffix}`,
    description: 'Neural networks and machine learning mathematics.',
    category: 'Artificial Intelligence',
    courseCreator: creator._id,
    status: 'published',
    thumbnail: 'https://images.unsplash.com/photo-ai',
    createdAt: new Date(Date.now() - 10000),
  });

  const draftCourse = await Course.create({
    title: `Draft Unreleased Course ${suffix}`,
    description: 'Should never appear in public catalog.',
    category: 'Computer Science',
    courseCreator: creator._id,
    status: 'draft',
  });

  const archivedCourse = await Course.create({
    title: `Archived Obsolete Course ${suffix}`,
    description: 'Should never appear in public catalog.',
    category: 'Computer Science',
    courseCreator: creator._id,
    status: 'archived',
  });

  try {
    // 2.1 Public listing returns published courses
    const listRes = await request('/api/courses');
    assert(listRes.status === 200, 'GET /api/courses returns HTTP 200');
    assert(listRes.data?.status === 'success', 'Response status is success');
    const courses = listRes.data?.data?.courses || [];
    assert(Array.isArray(courses), 'Courses is an array');

    const hasPub1 = courses.some((c) => c.id === pubCourse1._id.toString());
    const hasPub2 = courses.some((c) => c.id === pubCourse2._id.toString());
    const hasDraft = courses.some((c) => c.id === draftCourse._id.toString());
    const hasArchived = courses.some((c) => c.id === archivedCourse._id.toString());

    assert(hasPub1 && hasPub2, 'Public listing includes all published test courses');
    assert(!hasDraft, 'Public listing EXCLUDES draft course');
    assert(!hasArchived, 'Public listing EXCLUDES archived course');

    // 2.2 Category filtering
    const catRes = await request('/api/courses?category=Artificial%20Intelligence');
    assert(catRes.status === 200, 'Category filter returns HTTP 200');
    const catCourses = catRes.data?.data?.courses || [];
    const catMatch = catCourses.some((c) => c.id === pubCourse2._id.toString());
    const catMismatch = catCourses.some((c) => c.id === pubCourse1._id.toString());
    assert(catMatch, 'Category filter includes Artificial Intelligence course');
    assert(!catMismatch, 'Category filter excludes other categories');

    // 2.3 Search query filtering
    const searchRes = await request(`/api/courses?search=Alpha%20Systems%20Architecture%20${suffix}`);
    assert(searchRes.status === 200, 'Search query returns HTTP 200');
    const searchCourses = searchRes.data?.data?.courses || [];
    assert(searchCourses.length === 1 && searchCourses[0].id === pubCourse1._id.toString(), 'Search returns precise matching course');

    // Search query for draft course must return 0 results
    const draftSearch = await request(`/api/courses?search=Draft%20Unreleased%20Course%20${suffix}`);
    assert(draftSearch.status === 200, 'Draft search query returns HTTP 200');
    assert((draftSearch.data?.data?.courses || []).length === 0, 'Draft search returns 0 results');

    // 2.4 Sorting
    const sortNewest = await request('/api/courses?sort=newest');
    assert(sortNewest.status === 200, 'Sort newest returns HTTP 200');
    const sortOldest = await request('/api/courses?sort=oldest');
    assert(sortOldest.status === 200, 'Sort oldest returns HTTP 200');
    const sortTitleAsc = await request('/api/courses?sort=title_asc');
    assert(sortTitleAsc.status === 200, 'Sort title_asc returns HTTP 200');
    const sortTitleDesc = await request('/api/courses?sort=title_desc');
    assert(sortTitleDesc.status === 200, 'Sort title_desc returns HTTP 200');
    const sortInvalid = await request('/api/courses?sort=invalid_sort');
    assert(sortInvalid.status === 400, 'Invalid sort parameter correctly rejected with HTTP 400');

    // 2.5 Pagination
    const pageRes = await request('/api/courses?page=1&limit=1');
    assert(pageRes.status === 200, 'Pagination page 1 limit 1 returns HTTP 200');
    assert((pageRes.data?.data?.courses || []).length === 1, 'Pagination limit strictly respected');
    assert(pageRes.data?.data?.pagination?.page === 1, 'Pagination page is 1');
    assert(pageRes.data?.data?.pagination?.limit === 1, 'Pagination limit is 1');
    assert(pageRes.data?.data?.pagination?.total >= 2, 'Pagination total reflects available items');

    // 2.6 Out of bounds page returns empty array safely
    const emptyPageRes = await request('/api/courses?page=99999&limit=10');
    assert(emptyPageRes.status === 200, 'Out of bounds page returns HTTP 200');
    assert((emptyPageRes.data?.data?.courses || []).length === 0, 'Out of bounds page returns empty courses array');
  } finally {
    // Cleanup
    await Course.deleteMany({ _id: { $in: [pubCourse1._id, pubCourse2._id, draftCourse._id, archivedCourse._id] } });
    await User.findByIdAndDelete(creator._id);
  }

  console.log('\n===================================================================');
  console.log(`AUDIT 6C COMPLETED: ${passedTests}/${totalTests} PASSED, ${failedTests} FAILED`);
  console.log('===================================================================\n');

  await mongoose.disconnect();
  process.exit(failedTests > 0 ? 1 : 0);
}

runAudit().catch((err) => {
  console.error('Audit 6C error:', err);
  process.exit(1);
});
