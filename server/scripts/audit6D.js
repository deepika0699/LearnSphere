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
  console.log('=== Phase 6D — Course Details & Curriculum Regression Audit ===');
  console.log('===================================================================\n');

  // --- 1. Static Code Analysis of CourseDetails.tsx ---
  console.log('--- 1. Static Code Analysis of CourseDetails.tsx ---');
  const detailsCode = fs.readFileSync(path.resolve('src/pages/student/CourseDetails.tsx'), 'utf8');

  assert(!detailsCode.includes('dangerouslySetInnerHTML'), 'No dangerouslySetInnerHTML in CourseDetails.tsx');
  assert(!detailsCode.includes('eval('), 'No eval() in CourseDetails.tsx');
  assert(!detailsCode.includes('new Function'), 'No new Function in CourseDetails.tsx');
  assert(!detailsCode.includes('localStorage'), 'No localStorage in CourseDetails.tsx');
  assert(!detailsCode.includes('sessionStorage'), 'No sessionStorage in CourseDetails.tsx');
  assert(detailsCode.includes('isSubscribed = false'), 'CourseDetails.tsx implements subscription cleanup guard');
  assert(detailsCode.includes('setCourse(null)'), 'CourseDetails.tsx resets course state during transitions');
  assert(detailsCode.includes('setModules([])'), 'CourseDetails.tsx resets modules state during transitions');
  assert(detailsCode.includes('courseApi.getCourseById'), 'Calls courseApi.getCourseById');
  assert(detailsCode.includes('courseApi.getCourseStructure'), 'Calls courseApi.getCourseStructure');
  assert(detailsCode.includes('/courses/${courseId}/learn/${t.id}') || detailsCode.includes('/courses/${course.id}/learn/'), 'Links to canonical /courses/:courseId/learn/:topicId');
  assert(detailsCode.includes('FeedbackState'), 'Implements FeedbackState for error retry');
  assert(detailsCode.includes('LoadingSpinner'), 'Implements LoadingSpinner for details loading');

  // --- 2. Live API Testing with Database Seeding ---
  console.log('\n--- 2. Database Seeding & Course Details Checks ---');
  await connectDB();
  if (!isDbConnected()) {
    console.error('Database connection failed. Aborting audit.');
    process.exit(1);
  }

  const suffix = Date.now().toString().slice(-6);

  const creator = await User.create({
    name: `Dr. Details ${suffix}`,
    email: `details-creator-${suffix}@example.com`,
    password: 'Password#123!',
    role: 'courseCreator',
    status: 'active',
  });

  const pubCourse = await Course.create({
    title: `Published Details Course ${suffix}`,
    description: 'Detailed analysis of operating systems and algorithms.',
    category: 'Computer Science',
    courseCreator: creator._id,
    status: 'published',
    thumbnail: 'https://images.unsplash.com/photo-details',
  });

  const draftCourse = await Course.create({
    title: `Draft Details Course ${suffix}`,
    description: 'Under development.',
    category: 'Computer Science',
    courseCreator: creator._id,
    status: 'draft',
  });

  const archivedCourse = await Course.create({
    title: `Archived Details Course ${suffix}`,
    description: 'Archived course.',
    category: 'Computer Science',
    courseCreator: creator._id,
    status: 'archived',
  });

  const mod0 = await Module.create({
    courseId: pubCourse._id,
    title: 'Module 0: Fundamentals',
    description: 'Basics',
    order: 0,
  });

  const mod1 = await Module.create({
    courseId: pubCourse._id,
    title: 'Module 1: Advanced Topics',
    description: 'Advanced',
    order: 1,
  });

  const top00 = await Topic.create({
    courseId: pubCourse._id,
    moduleId: mod0._id,
    title: 'Topic 0.0: Introduction',
    description: 'Getting started',
    order: 0,
  });

  const top01 = await Topic.create({
    courseId: pubCourse._id,
    moduleId: mod0._id,
    title: 'Topic 0.1: Setup',
    description: 'Environment',
    order: 1,
  });

  const top10 = await Topic.create({
    courseId: pubCourse._id,
    moduleId: mod1._id,
    title: 'Topic 1.0: Kernel Overview',
    description: 'Architecture',
    order: 0,
  });

  try {
    // 2.1 Published course details
    const res = await request(`/api/courses/${pubCourse._id}`);
    assert(res.status === 200, 'GET published course details returns HTTP 200');
    assert(res.data?.data?.course?.id === pubCourse._id.toString(), 'Course ID matches');
    assert(res.data?.data?.course?.title === pubCourse.title, 'Course title matches');
    assert(res.data?.data?.course?.moduleCount === 2, 'Module count is 2');
    assert(res.data?.data?.course?.topicCount === 3, 'Topic count is 3');
    assert(res.data?.data?.course?.courseCreator?.name === `Dr. Details ${suffix}`, 'Creator attribution name is present');
    assert(res.data?.data?.course?.courseCreator?.password === undefined, 'Creator password is NOT exposed');
    assert(res.data?.data?.course?.courseCreator?.refreshToken === undefined, 'Creator token is NOT exposed');

    // 2.2 Published course curriculum structure
    const structRes = await request(`/api/courses/${pubCourse._id}/structure`);
    assert(structRes.status === 200, 'GET course structure returns HTTP 200');
    const modules = structRes.data?.data?.modules || [];
    assert(modules.length === 2, 'Structure returns 2 modules');
    assert(modules[0].id === mod0._id.toString() && modules[0].order === 0, 'First module order 0 preserved');
    assert(modules[1].id === mod1._id.toString() && modules[1].order === 1, 'Second module order 1 preserved');
    assert(modules[0].topics?.length === 2, 'Module 0 contains 2 topics');
    assert(modules[0].topics[0].id === top00._id.toString() && modules[0].topics[0].order === 0, 'Topic 0.0 order 0 preserved');
    assert(modules[0].topics[1].id === top01._id.toString() && modules[0].topics[1].order === 1, 'Topic 0.1 order 1 preserved');
    assert(modules[1].topics?.length === 1, 'Module 1 contains 1 topic');
    assert(modules[1].topics[0].id === top10._id.toString(), 'Topic 1.0 preserved in module 1');

    // 2.3 Draft course protection
    const draftRes = await request(`/api/courses/${draftCourse._id}`);
    assert(draftRes.status === 404, 'Draft course details returns HTTP 404');
    const draftStructRes = await request(`/api/courses/${draftCourse._id}/structure`);
    assert(draftStructRes.status === 404, 'Draft course structure returns HTTP 404');

    // 2.4 Archived course protection
    const archivedRes = await request(`/api/courses/${archivedCourse._id}`);
    assert(archivedRes.status === 404, 'Archived course details returns HTTP 404');
    const archivedStructRes = await request(`/api/courses/${archivedCourse._id}/structure`);
    assert(archivedStructRes.status === 404, 'Archived course structure returns HTTP 404');

    // 2.5 Malformed ID rejection
    const malformedRes = await request('/api/courses/not-a-valid-id');
    assert(malformedRes.status === 400, 'Malformed course ID returns HTTP 400');
    const malformedStructRes = await request('/api/courses/not-a-valid-id/structure');
    assert(malformedStructRes.status === 400, 'Malformed course structure ID returns HTTP 400');
  } finally {
    // Cleanup
    await Topic.deleteMany({ _id: { $in: [top00._id, top01._id, top10._id] } });
    await Module.deleteMany({ _id: { $in: [mod0._id, mod1._id] } });
    await Course.deleteMany({ _id: { $in: [pubCourse._id, draftCourse._id, archivedCourse._id] } });
    await User.findByIdAndDelete(creator._id);
  }

  console.log('\n===================================================================');
  console.log(`AUDIT 6D COMPLETED: ${passedTests}/${totalTests} PASSED, ${failedTests} FAILED`);
  console.log('===================================================================\n');

  await mongoose.disconnect();
  process.exit(failedTests > 0 ? 1 : 0);
}

runAudit().catch((err) => {
  console.error('Audit 6D error:', err);
  process.exit(1);
});
