import 'dotenv/config';
import mongoose from 'mongoose';
import crypto from 'node:crypto';
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
  console.log('=== Step 7H — Course Creator Content Integration Audit ===');
  console.log('================================================================\n');

  await connectDB();
  if (!isDbConnected()) {
    console.error('Database connection failed. Aborting audit.');
    process.exit(1);
  }

  // Setup test users
  const uniqueSuffix = Date.now().toString().slice(-6);
  const password = 'Test#Password123!';

  const creatorA = await User.create({
    name: `Creator A ${uniqueSuffix}`,
    email: `creator-a-${uniqueSuffix}@test.local`,
    password,
    role: 'courseCreator',
    status: 'active',
  });
  const tokenA = generateAccessToken({ userId: creatorA._id.toString(), role: 'courseCreator' });

  const creatorB = await User.create({
    name: `Creator B ${uniqueSuffix}`,
    email: `creator-b-${uniqueSuffix}@test.local`,
    password,
    role: 'courseCreator',
    status: 'active',
  });
  const tokenB = generateAccessToken({ userId: creatorB._id.toString(), role: 'courseCreator' });

  const studentUser = await User.create({
    name: `Student ${uniqueSuffix}`,
    email: `student-${uniqueSuffix}@test.local`,
    password,
    role: 'student',
    status: 'active',
  });
  const tokenStudent = generateAccessToken({ userId: studentUser._id.toString(), role: 'student' });

  const adminUser = await User.create({
    name: `Admin ${uniqueSuffix}`,
    email: `admin-${uniqueSuffix}@test.local`,
    password,
    role: 'admin',
    status: 'active',
  });
  const tokenAdmin = generateAccessToken({ userId: adminUser._id.toString(), role: 'admin' });

  console.log('Setup: Created test users (Creator A, Creator B, Student, Admin).\n');

  try {
    // ---------------------------------------------------------
    // 1. Course Creation & Default Lifecycle Verification
    // ---------------------------------------------------------
    console.log('--- 1. Course Creation & Default Lifecycle ---');
    const courseRes = await request('/api/creator/courses', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Complete C Programming Masterclass',
        description: 'Comprehensive guide from fundamentals to advanced pointer arithmetic.',
        category: 'Development',
      }),
    }, tokenA);

    assert(courseRes.status === 201, 'Creator A creates Course 1 (status 201)');
    const course1Id = courseRes.data?.data?.course?.id;
    assert(Boolean(course1Id), 'Course 1 has valid ID');
    assert(courseRes.data?.data?.course?.status === 'draft', 'Course status defaults strictly to "draft"');
    assert(courseRes.data?.data?.course?.courseCreator?.id === creatorA._id.toString(), 'Course ownership is server-authoritative for Creator A');

    // Attempt direct publishing on creation
    const pubCourseRes = await request('/api/creator/courses', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Prematurely Published Course',
        description: 'Attempting to publish directly without admin approval.',
        category: 'Development',
        status: 'published',
      }),
    }, tokenA);
    assert(pubCourseRes.status === 400, 'Direct publishing attempt on creation is rejected (status 400)');

    // Attempt direct publishing on update
    const pubUpdateRes = await request(`/api/creator/courses/${course1Id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'published' }),
    }, tokenA);
    assert(pubUpdateRes.status === 400, 'Direct publishing attempt on update is rejected (status 400)');

    // ---------------------------------------------------------
    // 2. Parent-Child Hierarchy Integrity (Course -> Module -> Topic)
    // ---------------------------------------------------------
    console.log('\n--- 2. Parent-Child Hierarchy Integrity ---');
    // Create Module 1 in Course 1
    const mod1Res = await request(`/api/creator/courses/${course1Id}/modules`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Module 1: Introduction and Syntax',
        description: 'Basic C language syntax and variables.',
        order: 0,
      }),
    }, tokenA);
    assert(mod1Res.status === 201, 'Created Module 1 in Course 1 (status 201)');
    const mod1Id = mod1Res.data?.data?.module?.id;
    assert(mod1Res.data?.data?.module?.courseId === course1Id, 'Module 1 courseId matches Course 1 ID');

    // Create Module 2 in Course 1
    const mod2Res = await request(`/api/creator/courses/${course1Id}/modules`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Module 2: Control Flow and Loops',
        description: 'Conditionals and iteration in C.',
        order: 1,
      }),
    }, tokenA);
    assert(mod2Res.status === 201, 'Created Module 2 in Course 1 (status 201)');
    const mod2Id = mod2Res.data?.data?.module?.id;

    // Create Topic 1 in Module 1
    const top1Res = await request(`/api/creator/courses/${course1Id}/modules/${mod1Id}/topics`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Variables and Data Types',
        description: 'Understanding primitive types in C.',
        order: 0,
      }),
    }, tokenA);
    assert(top1Res.status === 201, 'Created Topic 1 in Module 1 (status 201)');
    const top1Id = top1Res.data?.data?.topic?.id;
    assert(top1Res.data?.data?.topic?.courseId === course1Id, 'Topic 1 courseId matches Course 1 ID');
    assert(top1Res.data?.data?.topic?.moduleId === mod1Id, 'Topic 1 moduleId matches Module 1 ID');

    // Create Topic 2 in Module 1
    const top2Res = await request(`/api/creator/courses/${course1Id}/modules/${mod1Id}/topics`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'Constants and Literals',
        description: 'Defining const and #define macros.',
        order: 1,
      }),
    }, tokenA);
    assert(top2Res.status === 201, 'Created Topic 2 in Module 1 (status 201)');
    const top2Id = top2Res.data?.data?.topic?.id;

    // Create Topic 3 in Module 2
    const top3Res = await request(`/api/creator/courses/${course1Id}/modules/${mod2Id}/topics`, {
      method: 'POST',
      body: JSON.stringify({
        title: 'If-Else Conditionals',
        description: 'Branching logic in C programs.',
        order: 0,
      }),
    }, tokenA);
    assert(top3Res.status === 201, 'Created Topic 3 in Module 2 (status 201)');
    const top3Id = top3Res.data?.data?.topic?.id;

    // ---------------------------------------------------------
    // 3. Cross-Module & Cross-Course Scoping Isolation
    // ---------------------------------------------------------
    console.log('\n--- 3. Cross-Module Scoping Isolation ---');
    // Attempt to access Topic 1 with Module 2 in URL
    const wrongModGetRes = await request(`/api/creator/courses/${course1Id}/modules/${mod2Id}/topics/${top1Id}`, {
      method: 'GET',
    }, tokenA);
    assert(wrongModGetRes.status === 404, 'Accessing Topic 1 via wrong Module 2 returns 404');

    // Attempt to update Topic 1 with Module 2 in URL
    const wrongModPatchRes = await request(`/api/creator/courses/${course1Id}/modules/${mod2Id}/topics/${top1Id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Tampered Title' }),
    }, tokenA);
    assert(wrongModPatchRes.status === 404, 'Updating Topic 1 via wrong Module 2 returns 404');

    // Attempt to access content of Topic 1 with Module 2 in URL
    const wrongModContentRes = await request(`/api/creator/courses/${course1Id}/modules/${mod2Id}/topics/${top1Id}/content`, {
      method: 'GET',
    }, tokenA);
    assert(wrongModContentRes.status === 404, 'Accessing Topic 1 content via wrong Module 2 returns 404');

    // Attempt to update content of Topic 1 with Module 2 in URL
    const wrongModContentPatchRes = await request(`/api/creator/courses/${course1Id}/modules/${mod2Id}/topics/${top1Id}/content`, {
      method: 'PATCH',
      body: JSON.stringify({ content: 'Tampered Content' }),
    }, tokenA);
    assert(wrongModContentPatchRes.status === 404, 'Updating Topic 1 content via wrong Module 2 returns 404');

    // ---------------------------------------------------------
    // 4. Reordering Validation & Integrity
    // ---------------------------------------------------------
    console.log('\n--- 4. Module & Topic Reordering Integrity ---');
    // Incomplete module list
    const badModReorder = await request(`/api/creator/courses/${course1Id}/modules/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ moduleIds: [mod1Id] }),
    }, tokenA);
    assert(badModReorder.status === 400, 'Reordering modules with incomplete set is rejected (status 400)');

    // Duplicate module IDs
    const dupModReorder = await request(`/api/creator/courses/${course1Id}/modules/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ moduleIds: [mod1Id, mod1Id] }),
    }, tokenA);
    assert(dupModReorder.status === 400, 'Reordering modules with duplicates is rejected (status 400)');

    // Valid module reorder: invert [mod2Id, mod1Id]
    const okModReorder = await request(`/api/creator/courses/${course1Id}/modules/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ moduleIds: [mod2Id, mod1Id] }),
    }, tokenA);
    assert(okModReorder.status === 200, 'Valid module reordering succeeds (status 200)');
    const reorderedMods = okModReorder.data?.data?.modules || [];
    assert(reorderedMods[0]?.id === mod2Id && reorderedMods[0]?.order === 0, 'Module 2 is now first with order 0');
    assert(reorderedMods[1]?.id === mod1Id && reorderedMods[1]?.order === 1, 'Module 1 is now second with order 1');

    // Topic reordering: Incomplete topic set
    const badTopReorder = await request(`/api/creator/courses/${course1Id}/modules/${mod1Id}/topics/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ topicIds: [top1Id] }),
    }, tokenA);
    assert(badTopReorder.status === 400, 'Reordering topics with incomplete set is rejected (status 400)');

    // Topic reordering: Foreign topic from Module 2 included in Module 1
    const foreignTopReorder = await request(`/api/creator/courses/${course1Id}/modules/${mod1Id}/topics/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ topicIds: [top1Id, top3Id] }),
    }, tokenA);
    assert(foreignTopReorder.status === 400, 'Reordering topics with foreign topic from another module is rejected (status 400)');

    // Valid topic reorder: invert [top2Id, top1Id] in Module 1
    const okTopReorder = await request(`/api/creator/courses/${course1Id}/modules/${mod1Id}/topics/reorder`, {
      method: 'PATCH',
      body: JSON.stringify({ topicIds: [top2Id, top1Id] }),
    }, tokenA);
    assert(okTopReorder.status === 200, 'Valid topic reordering succeeds (status 200)');
    const reorderedTops = okTopReorder.data?.data?.topics || [];
    assert(reorderedTops[0]?.id === top2Id && reorderedTops[0]?.order === 0, 'Topic 2 is now first with order 0');
    assert(reorderedTops[1]?.id === top1Id && reorderedTops[1]?.order === 1, 'Topic 1 is now second with order 1');

    // ---------------------------------------------------------
    // 5. Granular Educational Content Management & Field Preservation
    // ---------------------------------------------------------
    console.log('\n--- 5. Granular Educational Content & Preservation ---');
    // Step 5A: Set initial explanation and sections
    const contentStep1 = await request(`/api/creator/courses/${course1Id}/modules/${mod1Id}/topics/${top1Id}/content`, {
      method: 'PATCH',
      body: JSON.stringify({
        content: {
          explanation: 'Variables in C represent named memory locations with specific types and sizes.',
          sections: [
            { heading: 'Declaring Variables', body: 'Syntax: int count = 0;', order: 0 },
            { heading: 'Scope and Lifetime', body: 'Variables declared inside a block have automatic storage duration.', order: 1 },
          ],
        },
      }),
    }, tokenA);
    assert(contentStep1.status === 200, 'Initial explanation & sections updated (status 200)');
    assert(contentStep1.data?.data?.content?.content?.sections?.length === 2, 'Two sections preserved');

    // Step 5B: Add code examples — verify explanation & sections remain intact
    const contentStep2 = await request(`/api/creator/courses/${course1Id}/modules/${mod1Id}/topics/${top1Id}/content`, {
      method: 'PATCH',
      body: JSON.stringify({
        codeExamples: [
          {
            title: 'Variable Declaration Example',
            language: 'c',
            code: '#include <stdio.h>\nint main() {\n  int x = 42;\n  printf("%d\\n", x);\n  return 0;\n}',
            explanation: 'Declares an integer and prints its value.',
          },
        ],
      }),
    }, tokenA);
    assert(contentStep2.status === 200, 'Code examples updated (status 200)');
    assert(contentStep2.data?.data?.content?.content?.sections?.length === 2, 'Sections preserved after codeExamples update');
    assert(Boolean(contentStep2.data?.data?.content?.content?.explanation), 'Explanation preserved after codeExamples update');
    assert(contentStep2.data?.data?.content?.codeExamples?.length === 1, 'Code example added successfully');

    // Step 5C: Add images — verify previous fields intact
    const contentStep3 = await request(`/api/creator/courses/${course1Id}/modules/${mod1Id}/topics/${top1Id}/content`, {
      method: 'PATCH',
      body: JSON.stringify({
        images: [
          {
            url: 'https://images.unsplash.com/photo-c-variables-memory',
            caption: 'Memory layout of variables in RAM',
            altText: 'Stack and Heap layout diagram',
          },
        ],
      }),
    }, tokenA);
    assert(contentStep3.status === 200, 'Images updated (status 200)');
    assert(contentStep3.data?.data?.content?.codeExamples?.length === 1, 'Code example preserved after images update');
    assert(contentStep3.data?.data?.content?.images?.length === 1, 'Image added successfully');

    // Step 5D: Add revisionPoints — verify previous fields intact
    const contentStep4 = await request(`/api/creator/courses/${course1Id}/modules/${mod1Id}/topics/${top1Id}/content`, {
      method: 'PATCH',
      body: JSON.stringify({
        revisionPoints: [
          'Variables must be declared before use in C.',
          'Format specifier %d is used for integers.',
        ],
      }),
    }, tokenA);
    assert(contentStep4.status === 200, 'Revision points updated (status 200)');
    assert(contentStep4.data?.data?.content?.revisionPoints?.length === 2, 'Revision points stored');
    assert(contentStep4.data?.data?.content?.images?.length === 1, 'Image preserved after revisionPoints update');

    // Step 5E: Add videos (English + Hindi) — verify all content fields preserved
    const contentStep5 = await request(`/api/creator/courses/${course1Id}/modules/${mod1Id}/topics/${top1Id}/content`, {
      method: 'PATCH',
      body: JSON.stringify({
        videos: {
          english: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          hindi: 'https://youtu.be/9bZkp7q19f0',
        },
      }),
    }, tokenA);
    assert(contentStep5.status === 200, 'Videos updated (status 200)');
    assert(Boolean(contentStep5.data?.data?.content?.videos?.english), 'English video stored');
    assert(Boolean(contentStep5.data?.data?.content?.videos?.hindi), 'Hindi video stored');
    assert(contentStep5.data?.data?.content?.videos?.telugu === null, 'Telugu video remains null');
    assert(contentStep5.data?.data?.content?.codeExamples?.length === 1, 'Code examples intact after videos update');
    assert(contentStep5.data?.data?.content?.images?.length === 1, 'Images intact after videos update');

    // Step 5F: Add externalReferences — verify videos and all other fields preserved
    const contentStep6 = await request(`/api/creator/courses/${course1Id}/modules/${mod1Id}/topics/${top1Id}/content`, {
      method: 'PATCH',
      body: JSON.stringify({
        externalReferences: [
          {
            title: 'C Data Types - cppreference.com',
            url: 'https://en.cppreference.com/w/c/language/type',
            source: 'cppreference.com',
          },
          {
            title: 'ISO C Standard Documentation',
            url: 'https://www.iso.org/standard/74528.html',
            source: 'ISO Standard',
          },
        ],
      }),
    }, tokenA);
    assert(contentStep6.status === 200, 'External references updated (status 200)');
    assert(contentStep6.data?.data?.content?.externalReferences?.length === 2, 'External references count is 2');
    assert(Boolean(contentStep6.data?.data?.content?.videos?.english), 'English video preserved after externalReferences update');
    assert(Boolean(contentStep6.data?.data?.content?.videos?.hindi), 'Hindi video preserved after externalReferences update');
    assert(contentStep6.data?.data?.content?.codeExamples?.length === 1, 'Code examples preserved after externalReferences update');
    assert(contentStep6.data?.data?.content?.images?.length === 1, 'Images preserved after externalReferences update');
    assert(contentStep6.data?.data?.content?.content?.sections?.length === 2, 'Sections preserved after externalReferences update');

    // Step 5G: Update ONLY Telugu video — verify English and Hindi videos preserved
    const contentStep7 = await request(`/api/creator/courses/${course1Id}/modules/${mod1Id}/topics/${top1Id}/content`, {
      method: 'PATCH',
      body: JSON.stringify({
        videos: {
          telugu: 'dQw4w9WgXcQ', // Valid 11-char ID
        },
      }),
    }, tokenA);
    assert(contentStep7.status === 200, 'Telugu video updated individually (status 200)');
    assert(Boolean(contentStep7.data?.data?.content?.videos?.english), 'English video preserved');
    assert(Boolean(contentStep7.data?.data?.content?.videos?.hindi), 'Hindi video preserved');
    assert(contentStep7.data?.data?.content?.videos?.telugu === 'dQw4w9WgXcQ', 'Telugu video updated accurately');
    assert(contentStep7.data?.data?.content?.externalReferences?.length === 2, 'External references preserved');

    // Step 5H: Verify Sibling Topic (Topic 2) is completely uncorrupted and empty
    const top2ContentRes = await request(`/api/creator/courses/${course1Id}/modules/${mod1Id}/topics/${top2Id}/content`, {
      method: 'GET',
    }, tokenA);
    assert(top2ContentRes.status === 200, 'Retrieved Topic 2 content (status 200)');
    assert(top2ContentRes.data?.data?.content?.codeExamples?.length === 0, 'Topic 2 code examples untouched (empty)');
    assert(top2ContentRes.data?.data?.content?.externalReferences?.length === 0, 'Topic 2 external references untouched (empty)');
    assert(top2ContentRes.data?.data?.content?.videos?.english === null, 'Topic 2 videos untouched (null)');

    // ---------------------------------------------------------
    // 6. Cascade Deletion & Isolation Integrity
    // ---------------------------------------------------------
    console.log('\n--- 6. Cascade Deletion & Isolation Integrity ---');
    // Create a temporary module with 2 topics
    const tempModRes = await request(`/api/creator/courses/${course1Id}/modules`, {
      method: 'POST',
      body: JSON.stringify({ title: 'Temporary Deletion Module', order: 99 }),
    }, tokenA);
    const tempModId = tempModRes.data?.data?.module?.id;

    const tempTop1 = await request(`/api/creator/courses/${course1Id}/modules/${tempModId}/topics`, {
      method: 'POST',
      body: JSON.stringify({ title: 'Temp Topic 1' }),
    }, tokenA);
    const tempTop1Id = tempTop1.data?.data?.topic?.id;

    const tempTop2 = await request(`/api/creator/courses/${course1Id}/modules/${tempModId}/topics`, {
      method: 'POST',
      body: JSON.stringify({ title: 'Temp Topic 2' }),
    }, tokenA);
    const tempTop2Id = tempTop2.data?.data?.topic?.id;

    // Delete temp module
    const delModRes = await request(`/api/creator/courses/${course1Id}/modules/${tempModId}`, {
      method: 'DELETE',
    }, tokenA);
    assert(delModRes.status === 200, 'Temp module deleted successfully (status 200)');

    // Verify temp module is gone
    const checkMod = await Module.findById(tempModId);
    assert(checkMod === null, 'Temp module document deleted from database');

    // Verify child topics were cascaded
    const checkTop1 = await Topic.findById(tempTop1Id);
    const checkTop2 = await Topic.findById(tempTop2Id);
    assert(checkTop1 === null, 'Temp Topic 1 cascaded and deleted from database');
    assert(checkTop2 === null, 'Temp Topic 2 cascaded and deleted from database');

    // Verify Module 1, Module 2, Topic 1, Topic 2, Topic 3 are completely intact
    const checkMod1 = await Module.findById(mod1Id);
    const checkMod2 = await Module.findById(mod2Id);
    const checkTopic1 = await Topic.findById(top1Id);
    assert(Boolean(checkMod1), 'Module 1 remains intact after cascade delete of other module');
    assert(Boolean(checkMod2), 'Module 2 remains intact after cascade delete of other module');
    assert(Boolean(checkTopic1), 'Topic 1 remains intact after cascade delete of other module');

    // Delete single topic (Topic 2)
    const delTopRes = await request(`/api/creator/courses/${course1Id}/modules/${mod1Id}/topics/${top2Id}`, {
      method: 'DELETE',
    }, tokenA);
    assert(delTopRes.status === 200, 'Topic 2 deleted (status 200)');
    const checkTopic2 = await Topic.findById(top2Id);
    assert(checkTopic2 === null, 'Topic 2 deleted from database');
    const checkTopic1StillHere = await Topic.findById(top1Id);
    assert(Boolean(checkTopic1StillHere), 'Sibling Topic 1 remains intact after Topic 2 deletion');

    // ---------------------------------------------------------
    // 7. Multi-Role & Cross-Creator Ownership Hardening
    // ---------------------------------------------------------
    console.log('\n--- 7. Multi-Role & Cross-Creator Hardening ---');
    // Unauthenticated requests
    const unauthCourse = await request(`/api/creator/courses/${course1Id}`, { method: 'GET' });
    assert(unauthCourse.status === 401, 'Unauthenticated GET /api/creator/courses/:id returns 401');

    const unauthContent = await request(`/api/creator/courses/${course1Id}/modules/${mod1Id}/topics/${top1Id}/content`, { method: 'GET' });
    assert(unauthContent.status === 401, 'Unauthenticated GET content returns 401');

    // Student role forbidden
    const studentCourse = await request(`/api/creator/courses/${course1Id}`, { method: 'GET' }, tokenStudent);
    assert(studentCourse.status === 403, 'Student accessing creator courses returns 403 Forbidden');

    const studentContent = await request(`/api/creator/courses/${course1Id}/modules/${mod1Id}/topics/${top1Id}/content`, { method: 'GET' }, tokenStudent);
    assert(studentContent.status === 403, 'Student accessing creator content returns 403 Forbidden');

    // Cross-Creator B accessing Creator A's resources (Zero-Enumeration Leak Prevention: 404)
    const bGetCourse = await request(`/api/creator/courses/${course1Id}`, { method: 'GET' }, tokenB);
    assert(bGetCourse.status === 404, 'Creator B accessing Creator A course returns 404 (leak prevention)');

    const bPatchCourse = await request(`/api/creator/courses/${course1Id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Hacked by B' }),
    }, tokenB);
    assert(bPatchCourse.status === 404, 'Creator B updating Creator A course returns 404');

    const bGetModules = await request(`/api/creator/courses/${course1Id}/modules`, { method: 'GET' }, tokenB);
    assert(bGetModules.status === 404, 'Creator B listing Creator A modules returns 404');

    const bCreateModule = await request(`/api/creator/courses/${course1Id}/modules`, {
      method: 'POST',
      body: JSON.stringify({ title: 'Injected Module' }),
    }, tokenB);
    assert(bCreateModule.status === 404, 'Creator B injecting module into Creator A course returns 404');

    const bGetTopics = await request(`/api/creator/courses/${course1Id}/modules/${mod1Id}/topics`, { method: 'GET' }, tokenB);
    assert(bGetTopics.status === 404, 'Creator B listing Creator A topics returns 404');

    const bGetContent = await request(`/api/creator/courses/${course1Id}/modules/${mod1Id}/topics/${top1Id}/content`, { method: 'GET' }, tokenB);
    assert(bGetContent.status === 404, 'Creator B reading Creator A topic content returns 404');

    const bPatchContent = await request(`/api/creator/courses/${course1Id}/modules/${mod1Id}/topics/${top1Id}/content`, {
      method: 'PATCH',
      body: JSON.stringify({ content: 'Injected by B' }),
    }, tokenB);
    assert(bPatchContent.status === 404, 'Creator B modifying Creator A topic content returns 404');

    // ---------------------------------------------------------
    // 8. Security & Input Sanitization Hardening
    // ---------------------------------------------------------
    console.log('\n--- 8. Security & Sanitization Hardening ---');
    // Invalid MongoDB ObjectIds in params
    const badParamRes = await request('/api/creator/courses/not-a-mongo-id', { method: 'GET' }, tokenA);
    assert(badParamRes.status === 400, 'Invalid MongoId param returns 400 Bad Request');

    // Dangerous video schemes
    const scriptVideoRes = await request(`/api/creator/courses/${course1Id}/modules/${mod1Id}/topics/${top1Id}/content`, {
      method: 'PATCH',
      body: JSON.stringify({
        videos: { english: 'javascript:alert(1)' },
      }),
    }, tokenA);
    assert(scriptVideoRes.status === 400, 'Video with javascript: protocol is rejected (status 400)');

    const nonYouTubeVideoRes = await request(`/api/creator/courses/${course1Id}/modules/${mod1Id}/topics/${top1Id}/content`, {
      method: 'PATCH',
      body: JSON.stringify({
        videos: { english: 'https://malicious-site.com/exploit.mp4' },
      }),
    }, tokenA);
    assert(nonYouTubeVideoRes.status === 400, 'Non-YouTube video reference is rejected (status 400)');

    // Dangerous external reference schemes
    const scriptRefRes = await request(`/api/creator/courses/${course1Id}/modules/${mod1Id}/topics/${top1Id}/content`, {
      method: 'PATCH',
      body: JSON.stringify({
        externalReferences: [{ title: 'Exploit', url: 'javascript:alert("pwned")' }],
      }),
    }, tokenA);
    assert(scriptRefRes.status === 400, 'External reference with javascript: protocol is rejected (status 400)');

    const dataRefRes = await request(`/api/creator/courses/${course1Id}/modules/${mod1Id}/topics/${top1Id}/content`, {
      method: 'PATCH',
      body: JSON.stringify({
        externalReferences: [{ title: 'Data Exploit', url: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==' }],
      }),
    }, tokenA);
    assert(dataRefRes.status === 400, 'External reference with data: protocol is rejected (status 400)');

    // Protected field tampering in Topic Content update
    const tamperRes = await request(`/api/creator/courses/${course1Id}/modules/${mod1Id}/topics/${top1Id}/content`, {
      method: 'PATCH',
      body: JSON.stringify({
        content: 'Valid content',
        courseCreator: creatorB._id.toString(), // Protected field
      }),
    }, tokenA);
    assert(tamperRes.status === 400, 'Protected field (courseCreator) in content update is rejected (status 400)');

    // ---------------------------------------------------------
    // 9. Admin Compatibility & Hierarchy Structure Reading
    // ---------------------------------------------------------
    console.log('\n--- 9. Admin Compatibility & Hierarchy Reading ---');
    // Admin reads course structure (Course -> Modules -> Topics)
    const adminStructureRes = await request(`/api/admin/courses/${course1Id}/structure`, {
      method: 'GET',
    }, tokenAdmin);
    assert(adminStructureRes.status === 200, 'Admin reads course structure (status 200)');
    const adminCourse = adminStructureRes.data?.data?.course;
    const adminModules = adminStructureRes.data?.data?.modules || [];
    assert(adminCourse?.id === course1Id, 'Admin receives accurate course details');
    assert(adminModules.length === 2, 'Admin receives all active modules in course');

    // Check that admin receives enriched educational content for Topic 1
    const targetAdminModule = adminModules.find((m) => m.id === mod1Id);
    const targetAdminTopic = targetAdminModule?.topics?.find((t) => t.id === top1Id);
    assert(Boolean(targetAdminTopic), 'Admin receives Topic 1 within Module 1');
    assert(targetAdminTopic?.videos?.english?.includes('dQw4w9WgXcQ'), 'Admin receives English video reference');
    assert(targetAdminTopic?.externalReferences?.length === 2, 'Admin receives external references');
    assert(targetAdminTopic?.codeExamples?.length === 1, 'Admin receives code examples');

    // Admin updates topic (e.g. title) and verifies videos & references remain intact
    const adminUpdateTopicRes = await request(`/api/admin/courses/${course1Id}/modules/${mod1Id}/topics/${top1Id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title: 'Variables and Data Types (Reviewed by Admin)' }),
    }, tokenAdmin);
    assert(adminUpdateTopicRes.status === 200, 'Admin updates topic title (status 200)');
    assert(adminUpdateTopicRes.data?.data?.topic?.title === 'Variables and Data Types (Reviewed by Admin)', 'Topic title updated');
    assert(adminUpdateTopicRes.data?.data?.topic?.videos?.english?.includes('dQw4w9WgXcQ'), 'Creator videos preserved after admin update');
    assert(adminUpdateTopicRes.data?.data?.topic?.externalReferences?.length === 2, 'Creator external references preserved after admin update');

    // ---------------------------------------------------------
    // 10. Zero Sensitive Information Disclosure Audit
    // ---------------------------------------------------------
    console.log('\n--- 10. Zero Sensitive Information Disclosure Audit ---');
    const allResponses = [
      courseRes, mod1Res, top1Res, contentStep6, adminStructureRes, adminUpdateTopicRes
    ];
    let passwordFound = false;
    let secretFound = false;
    let stackTraceFound = false;

    for (const r of allResponses) {
      const str = JSON.stringify(r.data || {});
      if (str.includes('password') || str.includes('passwordHash') || str.includes('$2a$') || str.includes('$2b$')) {
        passwordFound = true;
      }
      if (str.includes('JWT_ACCESS_SECRET') || str.includes('JWT_REFRESH_SECRET')) {
        secretFound = true;
      }
      if (str.includes('stack') || str.includes('node_modules')) {
        stackTraceFound = true;
      }
    }
    assert(!passwordFound, 'No passwords, hashes, or bcrypt salt digests exposed in API responses');
    assert(!secretFound, 'No secret environment variables or configuration keys exposed');
    assert(!stackTraceFound, 'No server stack traces or internal runtime paths exposed');

    // ---------------------------------------------------------
    // 11. Clean Up Test Data
    // ---------------------------------------------------------
    console.log('\n--- 11. Cleanup Test Documents ---');
    await Topic.deleteMany({ courseId: course1Id });
    await Module.deleteMany({ courseId: course1Id });
    await Course.findByIdAndDelete(course1Id);
    await User.deleteMany({
      _id: { $in: [creatorA._id, creatorB._id, studentUser._id, adminUser._id] },
    });
    console.log('Cleanup completed successfully.');

  } catch (err) {
    console.error('Audit execution error:', err);
  } finally {
    try {
      await mongoose.disconnect();
    } catch {}
  }

  console.log('\n================================================================');
  console.log(`=== AUDIT SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (${failedTests} FAILED) ===`);
  console.log('================================================================');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAudit().catch((err) => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
