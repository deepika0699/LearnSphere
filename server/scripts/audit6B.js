/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, isDbConnected } from '../config/db.js';
import User from '../models/User.js';
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
  console.log('=== Phase 6B — Backend Student Course Delivery Endpoints Audit ===');
  console.log('================================================================\n');

  await connectDB();
  if (!isDbConnected()) {
    console.error('Database connection failed. Aborting audit.');
    process.exit(1);
  }

  const suffix = Date.now().toString().slice(-6);

  // 1. Setup Test Users
  const creator = await User.create({
    name: `Creator ${suffix}`,
    email: `creator-${suffix}@example.com`,
    password: 'Password#123!',
    role: 'courseCreator',
    status: 'active',
  });
  const creatorToken = generateAccessToken({ userId: creator._id.toString(), role: 'courseCreator' });

  const admin = await User.create({
    name: `Admin ${suffix}`,
    email: `admin-${suffix}@example.com`,
    password: 'Password#123!',
    role: 'admin',
    status: 'active',
  });
  const adminToken = generateAccessToken({ userId: admin._id.toString(), role: 'admin' });

  // 2. Setup Courses: 1 Published, 1 Draft, 1 Archived
  const publishedCourse = await Course.create({
    title: `Published C Programming ${suffix}`,
    description: 'Learn C programming from basics to advanced memory management.',
    category: 'Computer Science',
    courseCreator: creator._id,
    status: 'published',
    thumbnail: 'https://images.unsplash.com/photo-c-programming',
  });

  const draftCourse = await Course.create({
    title: `Draft Rust Course ${suffix}`,
    description: 'Work in progress rust course not yet ready for public view.',
    category: 'Computer Science',
    courseCreator: creator._id,
    status: 'draft',
    thumbnail: 'https://images.unsplash.com/photo-rust',
  });

  const archivedCourse = await Course.create({
    title: `Archived Legacy Pascal Course ${suffix}`,
    description: 'Archived historical course.',
    category: 'Computer Science',
    courseCreator: creator._id,
    status: 'archived',
    thumbnail: 'https://images.unsplash.com/photo-pascal',
  });

  // 3. Setup Modules under Published Course (order 0 and order 1)
  const module1 = await Module.create({
    courseId: publishedCourse._id,
    title: 'Module 1: Introduction to Variables',
    description: 'Data types and memory',
    order: 0,
  });

  const module2 = await Module.create({
    courseId: publishedCourse._id,
    title: 'Module 2: Pointers and Memory',
    description: 'Deep dive into address manipulation',
    order: 1,
  });

  // Setup Module in another course for cross-course tests
  const draftModule = await Module.create({
    courseId: draftCourse._id,
    title: 'Draft Module 1',
    description: 'Draft',
    order: 0,
  });

  // 4. Setup Topics under Module 1
  const topic1 = await Topic.create({
    courseId: publishedCourse._id,
    moduleId: module1._id,
    title: 'Variables & Data Types',
    description: 'Primitive and derived types in C',
    order: 0,
    content: {
      explanation: 'Variables represent named memory locations in C.',
      sections: [
        { heading: 'Overview', body: 'Primitive types include int, char, float.', order: 0 },
        { heading: 'Memory Size', body: 'Sizes depend on 32-bit vs 64-bit architectures.', order: 1 },
      ],
    },
    codeExamples: [
      {
        title: 'Variable Declaration',
        language: 'c',
        code: 'int age = 25;\nfloat gpa = 3.85f;',
        explanation: 'Declaring integer and floating point variables.',
      },
    ],
    importantPoints: ['Always initialize variables', 'Beware of integer overflow'],
    images: [
      {
        url: 'https://images.unsplash.com/photo-memory-layout',
        caption: 'RAM Layout',
        altText: 'Diagram of stack and heap',
      },
    ],
    videos: {
      english: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      telugu: 'https://youtu.be/9bZkp7q19f0',
      hindi: null,
    },
    externalReferences: [
      {
        title: 'Safe C Reference',
        url: 'https://en.cppreference.com/w/c',
        source: 'cppreference',
      },
      // Insert unsafe reference URLs directly in DB to verify delivery filtering
      {
        title: 'XSS Attack Reference',
        url: 'javascript:alert(document.cookie)',
        source: 'malicious',
      },
      {
        title: 'Data URI Reference',
        url: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
        source: 'malicious',
      },
      {
        title: 'VBScript Reference',
        url: 'vbscript:msgbox("hello")',
        source: 'malicious',
      },
      {
        title: 'Secure ISO C Standard',
        url: 'https://www.iso.org/standard/74528.html',
        source: 'ISO',
      },
    ],
  });

  const topic2 = await Topic.create({
    courseId: publishedCourse._id,
    moduleId: module1._id,
    title: 'Type Modifiers & Limits',
    description: 'Signed, unsigned, short, long',
    order: 1,
  });

  const draftTopic = await Topic.create({
    courseId: draftCourse._id,
    moduleId: draftModule._id,
    title: 'Draft Topic',
    description: 'Draft',
    order: 0,
  });

  try {
    // ---------------------------------------------------------
    // TEST 1: Public GET access without authentication
    // ---------------------------------------------------------
    console.log('\n--- 1. Public Access & Listing Verification ---');
    const publicListRes = await request('/api/courses');
    assert(publicListRes.status === 200, 'GET /api/courses returns HTTP 200 without authentication');
    assert(publicListRes.data?.status === 'success', 'Response status is "success"');
    assert(Array.isArray(publicListRes.data?.data?.courses), 'Courses is an array');

    const foundPublished = publicListRes.data.data.courses.some(
      (c) => c.id === publishedCourse._id.toString()
    );
    assert(foundPublished, 'Published course is included in public listing');

    const foundDraft = publicListRes.data.data.courses.some(
      (c) => c.id === draftCourse._id.toString()
    );
    assert(!foundDraft, 'Draft course is EXCLUDED from public listing');

    const foundArchived = publicListRes.data.data.courses.some(
      (c) => c.id === archivedCourse._id.toString()
    );
    assert(!foundArchived, 'Archived course is EXCLUDED from public listing');

    // Filter by search
    const searchRes = await request(`/api/courses?search=${encodeURIComponent(suffix)}`);
    assert(searchRes.status === 200, 'Search filter succeeds with 200');
    assert(searchRes.data?.data?.courses.length >= 1, 'Search finds matching published course');
    const allPublishedInSearch = searchRes.data.data.courses.every((c) => c.status === 'published');
    assert(allPublishedInSearch, 'All searched results have status === "published"');

    // ---------------------------------------------------------
    // TEST 2: Published course details return safe metadata
    // ---------------------------------------------------------
    console.log('\n--- 2. Published Course Details ---');
    const courseDetailsRes = await request(`/api/courses/${publishedCourse._id}`);
    assert(courseDetailsRes.status === 200, 'GET /api/courses/:courseId returns HTTP 200 for published course');
    const courseObj = courseDetailsRes.data?.data?.course;
    assert(courseObj?.id === publishedCourse._id.toString(), 'Returned course ID matches');
    assert(courseObj?.title === publishedCourse.title, 'Course title matches');
    assert(courseObj?.category === 'Computer Science', 'Course category matches');
    assert(courseObj?.status === 'published', 'Course status is published');
    assert(typeof courseObj?.moduleCount === 'number', 'Includes moduleCount metric');
    assert(typeof courseObj?.topicCount === 'number', 'Includes topicCount metric');
    assert(courseObj?.moduleCount === 2, 'Module count is accurate (2 modules)');
    assert(courseObj?.topicCount === 2, 'Topic count is accurate (2 topics)');
    assert(courseObj?.courseCreator?.name === creator.name, 'Creator name is safely included');
    assert(!courseObj?.courseCreator?.password, 'Creator password is NOT exposed');
    assert(!courseObj?.courseCreator?.tokens, 'Creator tokens are NOT exposed');

    // ---------------------------------------------------------
    // TEST 3: Published curriculum returns ordered modules and topics
    // ---------------------------------------------------------
    console.log('\n--- 3. Published Curriculum Structure ---');
    const structureRes = await request(`/api/courses/${publishedCourse._id}/structure`);
    assert(structureRes.status === 200, 'GET /api/courses/:courseId/structure returns HTTP 200');
    const structModules = structureRes.data?.data?.modules;
    assert(Array.isArray(structModules), 'Modules is an array');
    assert(structModules.length === 2, 'Returns 2 structured modules');
    assert(structModules[0].id === module1._id.toString(), 'First module is module 1 (order 0)');
    assert(structModules[1].id === module2._id.toString(), 'Second module is module 2 (order 1)');

    const mod1Topics = structModules[0].topics;
    assert(Array.isArray(mod1Topics), 'Module 1 has topics array');
    assert(mod1Topics.length === 2, 'Module 1 contains 2 topics');
    assert(mod1Topics[0].id === topic1._id.toString(), 'First topic is topic 1 (order 0)');
    assert(mod1Topics[1].id === topic2._id.toString(), 'Second topic is topic 2 (order 1)');

    // ---------------------------------------------------------
    // TEST 4: Published topic content returns educational fields
    // ---------------------------------------------------------
    console.log('\n--- 4. Educational Topic Content Delivery ---');
    const topicRes = await request(
      `/api/courses/${publishedCourse._id}/modules/${module1._id}/topics/${topic1._id}`
    );
    assert(topicRes.status === 200, 'GET topic content returns HTTP 200');
    const topicData = topicRes.data?.data?.topic;
    assert(topicData?.id === topic1._id.toString(), 'Topic ID matches');
    assert(topicData?.title === 'Variables & Data Types', 'Topic title matches');
    assert(topicData?.content?.explanation.includes('named memory locations'), 'Explanation is returned');
    assert(Array.isArray(topicData?.content?.sections) && topicData.content.sections.length === 2, 'Sections returned');
    assert(Array.isArray(topicData?.codeExamples) && topicData.codeExamples.length === 1, 'Code examples returned');
    assert(topicData?.codeExamples[0].language === 'c', 'Code language is c');
    assert(Array.isArray(topicData?.images) && topicData.images.length === 1, 'Images returned');
    assert(topicData?.videos?.english?.includes('youtube.com'), 'English video URL returned');
    assert(topicData?.videos?.telugu?.includes('youtu.be'), 'Telugu video URL returned');
    assert(topicData?.videos?.hindi === null, 'Hindi video is null as saved');
    assert(Array.isArray(topicData?.importantPoints) && topicData.importantPoints.length === 2, 'Important points returned');

    // ---------------------------------------------------------
    // TEST 5 & 6: Draft and archived courses return 404
    // ---------------------------------------------------------
    console.log('\n--- 5 & 6. Draft and Archived Course 404 Protection ---');
    const draftRes = await request(`/api/courses/${draftCourse._id}`);
    assert(draftRes.status === 404, 'GET draft course returns HTTP 404 Not Found');

    const draftStructureRes = await request(`/api/courses/${draftCourse._id}/structure`);
    assert(draftStructureRes.status === 404, 'GET draft course structure returns HTTP 404');

    const draftTopicContentRes = await request(
      `/api/courses/${draftCourse._id}/modules/${draftModule._id}/topics/${draftTopic._id}`
    );
    assert(draftTopicContentRes.status === 404, 'GET draft course topic content returns HTTP 404');

    const archivedRes = await request(`/api/courses/${archivedCourse._id}`);
    assert(archivedRes.status === 404, 'GET archived course returns HTTP 404 Not Found');

    const archivedStructureRes = await request(`/api/courses/${archivedCourse._id}/structure`);
    assert(archivedStructureRes.status === 404, 'GET archived course structure returns HTTP 404');

    // ---------------------------------------------------------
    // TEST 7: Missing and malformed IDs handled safely
    // ---------------------------------------------------------
    console.log('\n--- 7. Missing and Malformed ID Handling ---');
    const fakeObjectId = new mongoose.Types.ObjectId();
    const notFoundCourseRes = await request(`/api/courses/${fakeObjectId}`);
    assert(notFoundCourseRes.status === 404, 'Non-existent ObjectId returns HTTP 404');

    const notFoundStructureRes = await request(`/api/courses/${fakeObjectId}/structure`);
    assert(notFoundStructureRes.status === 404, 'Non-existent ObjectId structure returns HTTP 404');

    const malformedIdRes = await request('/api/courses/not-a-valid-mongo-id');
    assert(
      malformedIdRes.status === 400 || malformedIdRes.status === 404,
      `Malformed course ID returns safe error (${malformedIdRes.status})`
    );

    const malformedTopicRes = await request(
      `/api/courses/${publishedCourse._id}/modules/${module1._id}/topics/invalid-topic-id`
    );
    assert(
      malformedTopicRes.status === 400 || malformedTopicRes.status === 404,
      `Malformed topic ID returns safe error (${malformedTopicRes.status})`
    );

    // ---------------------------------------------------------
    // TEST 8: Cross-course and cross-module hierarchy isolation
    // ---------------------------------------------------------
    console.log('\n--- 8. Hierarchy Enforcement ---');
    // Module 1 accessed through draft course
    const crossCourseModuleTopicRes = await request(
      `/api/courses/${draftCourse._id}/modules/${module1._id}/topics/${topic1._id}`
    );
    assert(crossCourseModuleTopicRes.status === 404, 'Accessing topic via draft course returns HTTP 404');

    // Topic 1 accessed through Module 2 (Topic 1 belongs to Module 1, NOT Module 2)
    const crossModuleTopicRes = await request(
      `/api/courses/${publishedCourse._id}/modules/${module2._id}/topics/${topic1._id}`
    );
    assert(crossModuleTopicRes.status === 404, 'Topic accessed through wrong module returns HTTP 404');

    // Draft Topic accessed through Published Course and Module 1
    const foreignTopicRes = await request(
      `/api/courses/${publishedCourse._id}/modules/${module1._id}/topics/${draftTopic._id}`
    );
    assert(foreignTopicRes.status === 404, 'Foreign topic accessed under published module returns HTTP 404');

    // ---------------------------------------------------------
    // TEST 9: External references reject unsafe protocols
    // ---------------------------------------------------------
    console.log('\n--- 9. Safe External References Filtering ---');
    const extRefs = topicData?.externalReferences || [];
    assert(Array.isArray(extRefs), 'externalReferences is an array');

    const hasJavascriptProtocol = extRefs.some((r) => r.url.toLowerCase().startsWith('javascript:'));
    assert(!hasJavascriptProtocol, 'javascript: URL protocol is STRIPPED/REJECTED');

    const hasDataProtocol = extRefs.some((r) => r.url.toLowerCase().startsWith('data:'));
    assert(!hasDataProtocol, 'data: URL protocol is STRIPPED/REJECTED');

    const hasVbscriptProtocol = extRefs.some((r) => r.url.toLowerCase().startsWith('vbscript:'));
    assert(!hasVbscriptProtocol, 'vbscript: URL protocol is STRIPPED/REJECTED');

    const allHttpsOrHttp = extRefs.every((r) => r.url.startsWith('http://') || r.url.startsWith('https://'));
    assert(allHttpsOrHttp, 'All returned external reference URLs are strictly http: or https:');
    assert(extRefs.length === 2, 'Only the 2 valid HTTP/HTTPS URLs are delivered (cppreference and ISO)');

    // ---------------------------------------------------------
    // TEST 10: Mass assignment / mutation prevention on delivery endpoints
    // ---------------------------------------------------------
    console.log('\n--- 10. Mutation & Mass Assignment Prevention ---');
    const postRes = await request('/api/courses', {
      method: 'POST',
      body: JSON.stringify({ title: 'Hacked Course' }),
    });
    assert(
      postRes.status === 404 || postRes.status === 405,
      `POST to /api/courses is rejected with ${postRes.status}`
    );

    const patchRes = await request(`/api/courses/${publishedCourse._id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Modified Title' }),
    });
    assert(
      patchRes.status === 404 || patchRes.status === 405,
      `PATCH to /api/courses/:id is rejected with ${patchRes.status}`
    );

    const deleteRes = await request(`/api/courses/${publishedCourse._id}`, {
      method: 'DELETE',
    });
    assert(
      deleteRes.status === 404 || deleteRes.status === 405,
      `DELETE to /api/courses/:id is rejected with ${deleteRes.status}`
    );

    // ---------------------------------------------------------
    // TEST 11: Existing admin & Course Creator endpoints remain functional
    // ---------------------------------------------------------
    console.log('\n--- 11. Existing Admin & Creator Endpoints Compatibility ---');
    const creatorCoursesRes = await request('/api/creator/courses', { method: 'GET' }, creatorToken);
    assert(creatorCoursesRes.status === 200, 'GET /api/creator/courses remains functional (status 200)');

    const adminCoursesRes = await request('/api/admin/courses', { method: 'GET' }, adminToken);
    assert(adminCoursesRes.status === 200, 'GET /api/admin/courses remains functional (status 200)');

    const healthRes = await request('/api/health');
    assert(healthRes.status === 200, 'GET /api/health remains functional (status 200)');

    // ---------------------------------------------------------
    // TEST 12: No secrets or credentials in responses
    // ---------------------------------------------------------
    console.log('\n--- 12. Information Disclosure Audit ---');
    const stringifiedTopic = JSON.stringify(topicRes.data);
    assert(!stringifiedTopic.includes('password'), 'Topic delivery contains no password fields');
    assert(!stringifiedTopic.includes('secret'), 'Topic delivery contains no secret keys');
    assert(!stringifiedTopic.includes('token'), 'Topic delivery contains no token values');
    assert(!stringifiedTopic.includes('Password#123!'), 'Topic delivery contains no raw user passwords');

    const stringifiedCourse = JSON.stringify(courseDetailsRes.data);
    assert(!stringifiedCourse.includes('password'), 'Course details contain no password fields');
    assert(!stringifiedCourse.includes('Password#123!'), 'Course details contain no raw passwords');
  } finally {
    // Clean up created entities
    await Course.deleteMany({
      _id: { $in: [publishedCourse._id, draftCourse._id, archivedCourse._id] },
    });
    await Module.deleteMany({
      courseId: { $in: [publishedCourse._id, draftCourse._id, archivedCourse._id] },
    });
    await Topic.deleteMany({
      courseId: { $in: [publishedCourse._id, draftCourse._id, archivedCourse._id] },
    });
    await User.deleteMany({
      _id: { $in: [creator._id, admin._id] },
    });
  }

  console.log('\n================================================================');
  console.log(`=== AUDIT COMPLETED: ${passedTests}/${totalTests} PASSED, ${failedTests} FAILED ===`);
  console.log('================================================================\n');

  await mongoose.disconnect();
  process.exit(failedTests > 0 ? 1 : 0);
}

runAudit().catch((err) => {
  console.error('Audit crashed with error:', err);
  process.exit(1);
});
