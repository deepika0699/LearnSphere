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

async function runComprehensiveAudit() {
  console.log('===================================================================');
  console.log('=== Phase 6F — Complete Student Course Delivery Hardening Audit ===');
  console.log('===================================================================\n');

  // --- SECTION 1: GLOBAL SECURITY & STATIC CODE HARDENING ---
  console.log('--- 1. Global Security & Static Code Analysis ---');

  function scanDir(dir, filterFn) {
    let files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const fullPath = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (!['node_modules', 'dist', '.git'].includes(e.name)) {
          files = files.concat(scanDir(fullPath, filterFn));
        }
      } else if (filterFn(fullPath)) {
        files.push(fullPath);
      }
    }
    return files;
  }

  const srcFiles = scanDir(path.resolve('src'), (p) => p.endsWith('.ts') || p.endsWith('.tsx'));
  let foundLocalStorage = 0;
  let foundSessionStorage = 0;
  let foundDangerousHtml = 0;
  let foundEval = 0;
  let foundNewFunction = 0;

  for (const f of srcFiles) {
    const text = fs.readFileSync(f, 'utf8');
    if (text.includes('localStorage')) foundLocalStorage++;
    if (text.includes('sessionStorage')) foundSessionStorage++;
    if (text.includes('dangerouslySetInnerHTML')) foundDangerousHtml++;
    if (text.includes('eval(')) foundEval++;
    if (text.includes('new Function')) foundNewFunction++;
  }

  assert(foundLocalStorage === 0, 'Zero instances of localStorage in src/');
  assert(foundSessionStorage === 0, 'Zero instances of sessionStorage in src/');
  assert(foundDangerousHtml === 0, 'Zero instances of dangerouslySetInnerHTML in src/');
  assert(foundEval === 0, 'Zero instances of eval() in src/');
  assert(foundNewFunction === 0, 'Zero instances of new Function() in src/');

  // Check App.tsx routing
  const appCode = fs.readFileSync(path.resolve('src/App.tsx'), 'utf8');
  assert(!appCode.includes('path="/courses/:id"'), 'No duplicate /courses/:id route in App.tsx');
  assert(appCode.includes('path="/courses/:courseId"'), 'Canonical /courses/:courseId route exists in App.tsx');
  assert(appCode.includes('path="/courses/:courseId/learn/:topicId"'), 'Canonical learning route exists in App.tsx');

  // --- SECTION 2: CACHE & LIFECYCLE AUDIT (TOPIC READER & COURSE DETAILS) ---
  console.log('\n--- 2. Cache & Lifecycle In-Memory Architecture Checks ---');
  const readerCode = fs.readFileSync(path.resolve('src/pages/student/TopicReader.tsx'), 'utf8');
  assert(readerCode.includes('cachedCourseRef = useRef'), 'TopicReader uses useRef for structure caching');
  assert(readerCode.includes('cachedCourseRef.current.courseId === courseId'), 'Cache requires strictly matching courseId');
  assert(readerCode.includes('if (cachedCourseRef.current && cachedCourseRef.current.courseId !== courseId)'), 'Cache isolates and clears when course changes');
  assert(readerCode.includes('setTopicContent(null)'), 'TopicReader clears topic content on topic change');
  assert(readerCode.includes('cachedCourseRef.current = null'), 'Retry handler clears cachedCourseRef');
  assert(readerCode.includes('isSubscribed = false'), 'TopicReader unmount cleanup cancels state updates');

  const detailsCode = fs.readFileSync(path.resolve('src/pages/student/CourseDetails.tsx'), 'utf8');
  assert(detailsCode.includes('isSubscribed = false'), 'CourseDetails unmount cleanup cancels state updates');
  assert(detailsCode.includes('setCourse(null)'), 'CourseDetails resets course on new fetch');
  assert(detailsCode.includes('setModules([])'), 'CourseDetails resets modules on new fetch');

  const catalogCode = fs.readFileSync(path.resolve('src/pages/student/Courses.tsx'), 'utf8');
  assert(catalogCode.includes('isSubscribed = false'), 'Courses unmount cleanup cancels state updates');

  // --- SECTION 3: LIVE END-TO-END DATABASE INTEGRATION ---
  console.log('\n--- 3. Live End-to-End Workflow Verification ---');
  await connectDB();
  if (!isDbConnected()) {
    console.error('Database connection failed.');
    process.exit(1);
  }

  const suffix = Date.now().toString().slice(-6);

  // Setup Creator, Admin, and Student tokens
  const creator = await User.create({
    name: `Prof 6F ${suffix}`,
    email: `prof-6f-${suffix}@example.com`,
    password: 'Password#123!',
    role: 'courseCreator',
    status: 'active',
  });
  const creatorToken = generateAccessToken({ userId: creator._id.toString(), role: 'courseCreator' });

  const admin = await User.create({
    name: `Admin 6F ${suffix}`,
    email: `admin-6f-${suffix}@example.com`,
    password: 'Password#123!',
    role: 'admin',
    status: 'active',
  });
  const adminToken = generateAccessToken({ userId: admin._id.toString(), role: 'admin' });

  // Course 1 (Published)
  const courseA = await Course.create({
    title: `Course A Compilers ${suffix}`,
    description: 'Lexing, parsing, AST optimization, and code generation.',
    category: 'Computer Science',
    courseCreator: creator._id,
    status: 'published',
    thumbnail: 'https://images.unsplash.com/photo-compiler',
  });

  // Course 2 (Published)
  const courseB = await Course.create({
    title: `Course B Database Internals ${suffix}`,
    description: 'B-trees, write-ahead logs, and concurrency.',
    category: 'Computer Science',
    courseCreator: creator._id,
    status: 'published',
    thumbnail: 'https://images.unsplash.com/photo-db',
  });

  // Course 3 (Draft)
  const courseDraft = await Course.create({
    title: `Draft AI Safety ${suffix}`,
    description: 'Draft safety alignment course.',
    category: 'Artificial Intelligence',
    courseCreator: creator._id,
    status: 'draft',
  });

  // Course 4 (Archived)
  const courseArchived = await Course.create({
    title: `Archived Cobol ${suffix}`,
    description: 'Legacy Cobol course.',
    category: 'Computer Science',
    courseCreator: creator._id,
    status: 'archived',
  });

  // Hierarchy for Course A: 2 modules, 3 topics
  const modA1 = await Module.create({
    courseId: courseA._id,
    title: 'Module A.1: Lexical Analysis',
    description: 'Tokens and regular expressions',
    order: 0,
  });

  const modA2 = await Module.create({
    courseId: courseA._id,
    title: 'Module A.2: Parsing',
    description: 'Context-free grammars',
    order: 1,
  });

  const topA1_1 = await Topic.create({
    courseId: courseA._id,
    moduleId: modA1._id,
    title: 'Topic A.1.1: DFA and NFA',
    description: 'Finite state automata for scanning.',
    order: 0,
    content: {
      explanation: 'Constructing deterministic finite automata from regular expressions.',
      sections: [{ heading: 'Regex to NFA', body: "Thompson's construction algorithm.", order: 0 }],
    },
    codeExamples: [{ title: 'DFA State Transition', language: 'c', code: 'int next = transition[state][char];', explanation: 'O(1) transition' }],
    importantPoints: ['DFA has at most one transition per character', 'NFA has epsilon transitions'],
    videos: {
      english: 'https://www.youtube.com/watch?v=ENG12345678',
      telugu: 'https://www.youtube.com/watch?v=TEL12345678',
      hindi: null,
    },
    externalReferences: [
      { title: 'Dragon Book Errata', url: 'https://dragonbook.stanford.edu/errata.html' },
      { title: 'Harmful Script', url: 'javascript:alert(1)' },
    ],
  });

  const topA1_2 = await Topic.create({
    courseId: courseA._id,
    moduleId: modA1._id,
    title: 'Topic A.1.2: Flex Scanner Generator',
    description: 'Lexer specification syntax.',
    order: 1,
  });

  const topA2_1 = await Topic.create({
    courseId: courseA._id,
    moduleId: modA2._id,
    title: 'Topic A.2.1: LL(1) Parsing Tables',
    description: 'Top-down parsing and predictive lookahead.',
    order: 0,
  });

  // Hierarchy for Course B: 1 module, 1 topic
  const modB1 = await Module.create({
    courseId: courseB._id,
    title: 'Module B.1: Storage Engines',
    description: 'Page layout and buffer pool',
    order: 0,
  });

  const topB1_1 = await Topic.create({
    courseId: courseB._id,
    moduleId: modB1._id,
    title: 'Topic B.1.1: Slotted Page Architecture',
    description: 'Record pointers and variable length fields.',
    order: 0,
  });

  try {
    // 3.1 Course Catalog Public Visibility
    const catRes = await request('/api/courses');
    assert(catRes.status === 200, 'Catalog endpoint returns 200');
    const catalogList = catRes.data?.data?.courses || [];
    const idsInCatalog = catalogList.map((c) => c.id);
    assert(idsInCatalog.includes(courseA._id.toString()), 'Published Course A is in catalog');
    assert(idsInCatalog.includes(courseB._id.toString()), 'Published Course B is in catalog');
    assert(!idsInCatalog.includes(courseDraft._id.toString()), 'Draft course is EXCLUDED from catalog');
    assert(!idsInCatalog.includes(courseArchived._id.toString()), 'Archived course is EXCLUDED from catalog');

    // 3.2 Course Details & Structure Integrity
    const detA = await request(`/api/courses/${courseA._id}`);
    assert(detA.status === 200, 'Course A details returned');
    assert(detA.data?.data?.course?.moduleCount === 2, 'Course A has exactly 2 modules');
    assert(detA.data?.data?.course?.topicCount === 3, 'Course A has exactly 3 topics');
    assert(detA.data?.data?.course?.courseCreator?.password === undefined, 'No creator password in details');

    const structA = await request(`/api/courses/${courseA._id}/structure`);
    assert(structA.status === 200, 'Course A structure returned');
    const modulesA = structA.data?.data?.modules || [];
    assert(modulesA[0].order === 0 && modulesA[1].order === 1, 'Module order preserved (0, 1)');
    assert(modulesA[0].topics[0].id === topA1_1._id.toString(), 'First topic matches topA1_1');
    assert(modulesA[0].topics[1].id === topA1_2._id.toString(), 'Second topic matches topA1_2');
    assert(modulesA[1].topics[0].id === topA2_1._id.toString(), 'Third topic in module 2 matches topA2_1');

    // 3.3 Draft and Archived 404 Protection
    const draftDet = await request(`/api/courses/${courseDraft._id}`);
    assert(draftDet.status === 404, 'Draft course details returns 404');
    const draftStruct = await request(`/api/courses/${courseDraft._id}/structure`);
    assert(draftStruct.status === 404, 'Draft course structure returns 404');

    const archDet = await request(`/api/courses/${courseArchived._id}`);
    assert(archDet.status === 404, 'Archived course details returns 404');
    const archStruct = await request(`/api/courses/${courseArchived._id}/structure`);
    assert(archStruct.status === 404, 'Archived course structure returns 404');

    // 3.4 Topic Delivery & Sanitization
    const topicRes = await request(`/api/courses/${courseA._id}/modules/${modA1._id}/topics/${topA1_1._id}`);
    assert(topicRes.status === 200, 'Topic A.1.1 content delivered');
    const topic = topicRes.data?.data?.topic;
    assert(topic.title === 'Topic A.1.1: DFA and NFA', 'Topic title verified');
    assert(topic.content?.sections?.length === 1, 'Section delivered');
    assert(topic.codeExamples.length === 1, 'Code example delivered');
    assert(topic.videos.english.includes('ENG12345678'), 'English video delivered');
    assert(topic.videos.telugu.includes('TEL12345678'), 'Telugu video delivered');
    assert(topic.videos.hindi === null, 'Hindi video null preserved');

    // External references sanitize javascript: scheme
    const extRefs = topic.externalReferences || [];
    assert(extRefs.length === 1, 'javascript: external reference stripped on backend');
    assert(extRefs[0].url === 'https://dragonbook.stanford.edu/errata.html', 'Legitimate HTTPS reference delivered');

    // 3.5 Cross-Hierarchy Isolation
    // Attempt to access Course A topic through Course B module
    const crossMod = await request(`/api/courses/${courseA._id}/modules/${modB1._id}/topics/${topA1_1._id}`);
    assert(crossMod.status === 404, 'Cross-module topic access returns 404');

    // Attempt to access Course A topic under Course B URL
    const crossCourse = await request(`/api/courses/${courseB._id}/modules/${modA1._id}/topics/${topA1_1._id}`);
    assert(crossCourse.status === 404, 'Cross-course topic access returns 404');

    // 3.6 Existing Admin & Creator Endpoints Compatibility
    const creatorList = await request('/api/creator/courses', {}, creatorToken);
    assert(creatorList.status === 200, 'Creator can list own courses');

    const adminList = await request('/api/admin/courses', {}, adminToken);
    assert(adminList.status === 200, 'Admin can list all courses');

    // Student/Unauthenticated access to creator route is rejected
    const unauthCreator = await request('/api/creator/courses');
    assert(unauthCreator.status === 401, 'Unauthenticated access to creator route returns 401');
  } finally {
    // Cleanup
    await Topic.deleteMany({ _id: { $in: [topA1_1._id, topA1_2._id, topA2_1._id, topB1_1._id] } });
    await Module.deleteMany({ _id: { $in: [modA1._id, modA2._id, modB1._id] } });
    await Course.deleteMany({ _id: { $in: [courseA._id, courseB._id, courseDraft._id, courseArchived._id] } });
    await User.deleteMany({ _id: { $in: [creator._id, admin._id] } });
  }

  console.log('\n===================================================================');
  console.log(`COMPREHENSIVE AUDIT 6F RESULT: ${passedTests}/${totalTests} PASSED, ${failedTests} FAILED`);
  console.log('===================================================================\n');

  await mongoose.disconnect();
  process.exit(failedTests > 0 ? 1 : 0);
}

runComprehensiveAudit().catch((err) => {
  console.error('Audit 6F error:', err);
  process.exit(1);
});
