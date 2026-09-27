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
  console.log('=== Phase 6E — Student Topic Reader Regression Audit ===');
  console.log('===================================================================\n');

  // --- 1. Static Code Analysis of TopicReader.tsx ---
  console.log('--- 1. Static Code Analysis of TopicReader.tsx ---');
  const readerCode = fs.readFileSync(path.resolve('src/pages/student/TopicReader.tsx'), 'utf8');

  assert(!readerCode.includes('dangerouslySetInnerHTML'), 'No dangerouslySetInnerHTML in TopicReader.tsx');
  assert(!readerCode.includes('eval('), 'No eval() in TopicReader.tsx');
  assert(!readerCode.includes('new Function'), 'No new Function in TopicReader.tsx');
  assert(!readerCode.includes('localStorage'), 'No localStorage in TopicReader.tsx');
  assert(!readerCode.includes('sessionStorage'), 'No sessionStorage in TopicReader.tsx');
  assert(readerCode.includes('isSubscribed = false'), 'TopicReader implements subscription cleanup guard');
  assert(readerCode.includes('cachedCourseRef'), 'TopicReader implements in-memory course structure cache');
  assert(readerCode.includes('cachedCourseRef.current && cachedCourseRef.current.courseId === courseId'), 'Cache requires matching courseId');
  assert(readerCode.includes('setTopicContent(null)'), 'TopicReader resets topic content on navigation to prevent stale flash');
  assert(readerCode.includes('sandbox='), 'TopicReader sandboxes YouTube video iframe');
  assert(readerCode.includes('isValidHttpUrl'), 'TopicReader validates HTTP/HTTPS external references');
  assert(readerCode.includes('rel="noopener noreferrer"'), 'TopicReader protects external links with noopener noreferrer');
  assert(readerCode.includes('courseApi.getTopicContent'), 'Calls courseApi.getTopicContent');
  assert(readerCode.includes('FeedbackState'), 'Implements FeedbackState for error retry');
  assert(readerCode.includes('LoadingSpinner'), 'Implements LoadingSpinner for topic loading');

  // --- 2. Live API Testing with Database Seeding ---
  console.log('\n--- 2. Database Seeding & Topic Delivery Checks ---');
  await connectDB();
  if (!isDbConnected()) {
    console.error('Database connection failed. Aborting audit.');
    process.exit(1);
  }

  const suffix = Date.now().toString().slice(-6);

  const creator = await User.create({
    name: `Reader Instructor ${suffix}`,
    email: `reader-creator-${suffix}@example.com`,
    password: 'Password#123!',
    role: 'courseCreator',
    status: 'active',
  });

  const pubCourse = await Course.create({
    title: `Published Reader Course ${suffix}`,
    description: 'Real-time operating systems and kernel architecture.',
    category: 'Computer Science',
    courseCreator: creator._id,
    status: 'published',
    thumbnail: 'https://images.unsplash.com/photo-reader',
  });

  const draftCourse = await Course.create({
    title: `Draft Reader Course ${suffix}`,
    description: 'Unpublished draft.',
    category: 'Computer Science',
    courseCreator: creator._id,
    status: 'draft',
  });

  const module1 = await Module.create({
    courseId: pubCourse._id,
    title: 'Module 1: Kernel Basics',
    description: 'Kernel concepts',
    order: 0,
  });

  const module2 = await Module.create({
    courseId: pubCourse._id,
    title: 'Module 2: Process Scheduling',
    description: 'Scheduling algorithms',
    order: 1,
  });

  const topic1 = await Topic.create({
    courseId: pubCourse._id,
    moduleId: module1._id,
    title: 'Topic 1.1: Context Switching',
    description: 'How CPU registers are swapped during scheduling.',
    order: 0,
    content: {
      explanation: 'Detailed walkthrough of hardware register swapping during context switch.',
      sections: [
        { heading: 'Hardware Registers', body: 'The program counter and stack pointer.', order: 0 },
        { heading: 'Saving Process State', body: 'Pushing registers onto kernel stack.', order: 1 },
      ],
    },
    codeExamples: [
      { title: 'x86 Switch', language: 'assembly', code: 'pushal\nmovl %esp, (%eax)', explanation: 'Store registers' },
    ],
    importantPoints: ['Interrupts must be disabled', 'Save floating point registers if used'],
    videos: {
      english: 'https://www.youtube.com/watch?v=ENG11111111',
      telugu: 'https://www.youtube.com/watch?v=TEL22222222',
      hindi: null,
    },
    externalReferences: [
      { title: 'OS Dev Wiki', url: 'https://wiki.osdev.org/Context_Switching' },
    ],
  });

  const topic2 = await Topic.create({
    courseId: pubCourse._id,
    moduleId: module1._id,
    title: 'Topic 1.2: PCB Architecture',
    description: 'Process Control Block struct.',
    order: 1,
  });

  try {
    // 2.1 Fetch topic content successfully
    const res = await request(`/api/courses/${pubCourse._id}/modules/${module1._id}/topics/${topic1._id}`);
    assert(res.status === 200, 'GET published topic returns HTTP 200');
    assert(res.data?.status === 'success', 'Response status is success');
    const topicData = res.data?.data?.topic;
    assert(topicData?.id === topic1._id.toString(), 'Topic ID matches');
    assert(topicData?.title === 'Topic 1.1: Context Switching', 'Topic title matches');
    assert(topicData?.content?.explanation?.includes('walkthrough'), 'Explanation delivered');
    assert(topicData?.content?.sections?.length === 2, 'Delivered 2 sections');
    assert(topicData?.content?.sections[0]?.heading === 'Hardware Registers', 'Section 0 heading matches');
    assert(topicData?.content?.sections[1]?.heading === 'Saving Process State', 'Section 1 heading matches');
    assert(topicData?.codeExamples?.length === 1, 'Delivered 1 code example');
    assert(topicData?.codeExamples[0]?.language === 'assembly', 'Code language is assembly');
    assert(topicData?.videos?.english?.includes('ENG11111111'), 'English video present');
    assert(topicData?.videos?.telugu?.includes('TEL22222222'), 'Telugu video present');
    assert(topicData?.videos?.hindi === null, 'Hindi video null preserved');
    assert(topicData?.externalReferences?.length === 1, 'Delivered 1 external reference');
    assert(topicData?.externalReferences[0]?.url.startsWith('https://'), 'External reference URL is safe HTTPS');

    // 2.2 Hierarchy isolation - wrong module returns 404
    const wrongModRes = await request(`/api/courses/${pubCourse._id}/modules/${module2._id}/topics/${topic1._id}`);
    assert(wrongModRes.status === 404, 'Cross-module topic access returns 404');

    // 2.3 Draft course isolation returns 404
    const draftRes = await request(`/api/courses/${draftCourse._id}/modules/${module1._id}/topics/${topic1._id}`);
    assert(draftRes.status === 404, 'Topic under draft course returns 404');

    // 2.4 Malformed topic ID rejection
    const malformedTopic = await request(`/api/courses/${pubCourse._id}/modules/${module1._id}/topics/invalid-id`);
    assert(malformedTopic.status === 400, 'Malformed topic ID returns HTTP 400');
  } finally {
    // Cleanup
    await Topic.deleteMany({ _id: { $in: [topic1._id, topic2._id] } });
    await Module.deleteMany({ _id: { $in: [module1._id, module2._id] } });
    await Course.deleteMany({ _id: { $in: [pubCourse._id, draftCourse._id] } });
    await User.findByIdAndDelete(creator._id);
  }

  console.log('\n===================================================================');
  console.log(`AUDIT 6E COMPLETED: ${passedTests}/${totalTests} PASSED, ${failedTests} FAILED`);
  console.log('===================================================================\n');

  await mongoose.disconnect();
  process.exit(failedTests > 0 ? 1 : 0);
}

runAudit().catch((err) => {
  console.error('Audit 6E error:', err);
  process.exit(1);
});
