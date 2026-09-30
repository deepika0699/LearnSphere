import 'dotenv/config';
import mongoose from 'mongoose';
import crypto from 'node:crypto';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import Note from '../models/Note.js';
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

async function runPhase10AAudit() {
  console.log('===================================================================');
  console.log(' LearnSphere Phase 10A: Personalized Notes Architecture & Model    ');
  console.log('===================================================================');

  await connectDB();

  const runId = crypto.randomBytes(4).toString('hex');
  const artifacts = {
    users: [],
    courses: [],
    modules: [],
    topics: [],
    notes: [],
  };

  try {
    console.log('\n--- Setup: Test Accounts & Course Fixtures ---');

    // 1. Student A
    const studentA = await User.create({
      name: `Student A ${runId}`,
      email: `studenta_${runId}@example.com`,
      password: 'Password123!',
      role: 'student',
      status: 'active',
    });
    artifacts.users.push(studentA._id);
    const tokenA = generateAccessToken({ userId: studentA._id, role: studentA.role });

    // 2. Student B (for cross-student isolation)
    const studentB = await User.create({
      name: `Student B ${runId}`,
      email: `studentb_${runId}@example.com`,
      password: 'Password123!',
      role: 'student',
      status: 'active',
    });
    artifacts.users.push(studentB._id);
    const tokenB = generateAccessToken({ userId: studentB._id, role: studentB.role });

    // 3. Admin User (for non-student RBAC check)
    const adminUser = await User.create({
      name: `Admin ${runId}`,
      email: `admin_${runId}@example.com`,
      password: 'Password123!',
      role: 'admin',
      status: 'active',
    });
    artifacts.users.push(adminUser._id);
    const tokenAdmin = generateAccessToken({ userId: adminUser._id, role: adminUser.role });

    // 4. Course 1: Published Course with Module and Topic
    const course1 = await Course.create({
      title: `Operating Systems Fundamentals ${runId}`,
      description: 'Core concepts of operating systems and kernel architecture.',
      category: 'Computer Science',
      difficulty: 'Intermediate',
      courseCreator: adminUser._id,
      status: 'published',
    });
    artifacts.courses.push(course1._id);

    const module1 = await Module.create({
      courseId: course1._id,
      title: 'Process Management',
      order: 1,
    });
    artifacts.modules.push(module1._id);

    const topic1 = await Topic.create({
      courseId: course1._id,
      moduleId: module1._id,
      title: 'Process Scheduling Algorithms',
      description: 'Understanding preemptive and cooperative scheduling.',
      order: 1,
      content: {
        explanation: 'Round robin scheduling uses fixed time slices for fair CPU sharing.',
      },
    });
    artifacts.topics.push(topic1._id);

    // 5. Course 2: Draft Course (for publication check)
    const draftCourse = await Course.create({
      title: `Draft Advanced Algorithms ${runId}`,
      description: 'Unpublished course content.',
      category: 'Computer Science',
      difficulty: 'Advanced',
      courseCreator: adminUser._id,
      status: 'draft',
    });
    artifacts.courses.push(draftCourse._id);

    const draftModule = await Module.create({
      courseId: draftCourse._id,
      title: 'Graph Theory',
      order: 1,
    });
    artifacts.modules.push(draftModule._id);

    const draftTopic = await Topic.create({
      courseId: draftCourse._id,
      moduleId: draftModule._id,
      title: 'Max Flow Min Cut',
      order: 1,
      content: { explanation: 'Ford-Fulkerson method' },
    });
    artifacts.topics.push(draftTopic._id);

    // 6. Course 3: Secondary Course (for hierarchy mismatch tests)
    const course3 = await Course.create({
      title: `Database Internals ${runId}`,
      description: 'B-Trees and WAL logging.',
      category: 'Computer Science',
      difficulty: 'Advanced',
      courseCreator: adminUser._id,
      status: 'published',
    });
    artifacts.courses.push(course3._id);

    const module3 = await Module.create({
      courseId: course3._id,
      title: 'Storage Engines',
      order: 1,
    });
    artifacts.modules.push(module3._id);

    assert(tokenA && tokenB && tokenAdmin, 'Test accounts and access tokens generated');

    // =========================================================================
    // Scenario 1: Authentication & Authorization Boundaries
    // =========================================================================
    console.log('\n--- Scenario 1: Authentication & Authorization Boundaries ---');

    // 1.1 Unauthenticated request rejected
    const unauthRes = await request('/api/student/notes', { method: 'GET' });
    assert(unauthRes.status === 401, 'Unauthenticated GET /api/student/notes returns 401 Unauthorized');

    // 1.2 Admin request rejected (fail-closed for student portal)
    const adminRes = await request('/api/student/notes', { method: 'GET' }, tokenAdmin);
    assert(adminRes.status === 403, 'Admin account accessing student notes returns 403 Forbidden');

    // 1.3 Authenticated student gets 200 OK
    const authRes = await request('/api/student/notes', { method: 'GET' }, tokenA);
    assert(authRes.status === 200, 'Authenticated student gets 200 OK');
    assert(Array.isArray(authRes.data?.data?.notes), 'Notes returned in response array');
    assert(authRes.data?.data?.notes.length === 0, 'Initial notes list is empty');

    // =========================================================================
    // Scenario 2: Standalone Personal Note Creation & Validation
    // =========================================================================
    console.log('\n--- Scenario 2: Standalone Personal Note Creation & Validation ---');

    // 2.1 Blank note rejected
    const blankRes = await request(
      '/api/student/notes',
      {
        method: 'POST',
        body: JSON.stringify({ noteType: 'standalone', title: '', content: '' }),
      },
      tokenA
    );
    assert(blankRes.status === 400, 'Blank standalone note (no title and no content) returns 400 Bad Request');

    // 2.2 Valid standalone note created
    const standaloneRes = await request(
      '/api/student/notes',
      {
        method: 'POST',
        body: JSON.stringify({
          noteType: 'standalone',
          title: 'My Architecture Thoughts',
          content: 'Remember that monolithic architectures can be fine for small projects.',
          tags: ['architecture', 'revision'],
          color: 'indigo',
        }),
      },
      tokenA
    );
    assert(standaloneRes.status === 201, 'Valid standalone note created (201 Created)');
    const standaloneNote = standaloneRes.data?.data?.note;
    artifacts.notes.push(standaloneNote.id);

    assert(standaloneNote?.noteType === 'standalone', 'noteType is standalone');
    assert(standaloneNote?.title === 'My Architecture Thoughts', 'Title stored correctly');
    assert(standaloneNote?.content.includes('monolithic architectures'), 'Content stored correctly');
    assert(standaloneNote?.courseId === null, 'courseId is null for standalone note');
    assert(standaloneNote?.moduleId === null, 'moduleId is null for standalone note');
    assert(standaloneNote?.topicId === null, 'topicId is null for standalone note');
    assert(standaloneNote?.selectedText === '', 'selectedText is empty for standalone note');
    assert(standaloneNote?.color === 'indigo', 'Color stored as indigo');
    assert(Array.isArray(standaloneNote?.tags) && standaloneNote.tags.includes('architecture'), 'Tags stored cleanly');

    // 2.3 Verify ownership derived strictly from req.user (client cannot spoof userId)
    const spoofRes = await request(
      '/api/student/notes',
      {
        method: 'POST',
        body: JSON.stringify({
          userId: studentB._id.toString(), // Attacker tries to create note under Student B
          noteType: 'standalone',
          title: 'Spoofed Ownership Test',
          content: 'This note should belong to Student A, ignoring spoofed userId.',
        }),
      },
      tokenA
    );
    assert(spoofRes.status === 201, 'Request with spoofed userId handled securely (201 Created)');
    const spoofNote = spoofRes.data?.data?.note;
    artifacts.notes.push(spoofNote.id);

    const dbSpoofNote = await Note.findById(spoofNote.id);
    assert(
      dbSpoofNote.userId.toString() === studentA._id.toString(),
      'Server strictly binds note to authenticated studentA, completely ignoring spoofed userId'
    );
    assert(
      dbSpoofNote.userId.toString() !== studentB._id.toString(),
      'Note does NOT belong to studentB'
    );

    // =========================================================================
    // Scenario 3: Highlight / Source-Based Note Creation & Hierarchy Integrity
    // =========================================================================
    console.log('\n--- Scenario 3: Highlight / Source-Based Note Creation & Hierarchy Integrity ---');

    // 3.1 Highlight note without selectedText rejected
    const noTextRes = await request(
      '/api/student/notes',
      {
        method: 'POST',
        body: JSON.stringify({
          noteType: 'highlight',
          courseId: course1._id.toString(),
          moduleId: module1._id.toString(),
          topicId: topic1._id.toString(),
          selectedText: '',
          content: 'My thought',
        }),
      },
      tokenA
    );
    assert(noTextRes.status === 400, 'Highlight note without selectedText returns 400 Bad Request');

    // 3.2 Highlight note on non-existent course rejected
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const badCourseRes = await request(
      '/api/student/notes',
      {
        method: 'POST',
        body: JSON.stringify({
          noteType: 'highlight',
          courseId: nonExistentId,
          moduleId: module1._id.toString(),
          topicId: topic1._id.toString(),
          selectedText: 'Some highlighted text',
        }),
      },
      tokenA
    );
    assert(badCourseRes.status === 404, 'Highlight note referencing non-existent course returns 404 Not Found');

    // 3.3 Highlight note on draft/unpublished course rejected
    const draftCourseRes = await request(
      '/api/student/notes',
      {
        method: 'POST',
        body: JSON.stringify({
          noteType: 'highlight',
          courseId: draftCourse._id.toString(),
          moduleId: draftModule._id.toString(),
          topicId: draftTopic._id.toString(),
          selectedText: 'Ford-Fulkerson method',
        }),
      },
      tokenA
    );
    assert(draftCourseRes.status === 400, 'Highlight note on unpublished/draft course returns 400 Bad Request');

    // 3.4 Module hierarchy mismatch rejected (Module from Course 3 passed with Course 1)
    const mismatchModuleRes = await request(
      '/api/student/notes',
      {
        method: 'POST',
        body: JSON.stringify({
          noteType: 'highlight',
          courseId: course1._id.toString(),
          moduleId: module3._id.toString(), // belongs to course3!
          topicId: topic1._id.toString(),
          selectedText: 'Mismatched hierarchy test',
        }),
      },
      tokenA
    );
    assert(mismatchModuleRes.status === 400, 'Module not belonging to course returns 400 Bad Request');

    // 3.5 Valid highlight note created successfully
    const validHighlightRes = await request(
      '/api/student/notes',
      {
        method: 'POST',
        body: JSON.stringify({
          noteType: 'highlight',
          courseId: course1._id.toString(),
          moduleId: module1._id.toString(),
          topicId: topic1._id.toString(),
          selectedText: 'Round robin scheduling uses fixed time slices for fair CPU sharing.',
          content: 'Important for exam: quantum size determines context switch overhead.',
          tags: ['os', 'scheduling', 'exam-prep'],
          color: 'amber',
        }),
      },
      tokenA
    );
    assert(validHighlightRes.status === 201, 'Valid highlight-based note created (201 Created)');
    const highlightNote = validHighlightRes.data?.data?.note;
    artifacts.notes.push(highlightNote.id);

    assert(highlightNote?.noteType === 'highlight', 'noteType is highlight');
    assert(
      highlightNote?.selectedText === 'Round robin scheduling uses fixed time slices for fair CPU sharing.',
      'Selected text stored accurately as plain text'
    );
    assert(
      highlightNote?.content === 'Important for exam: quantum size determines context switch overhead.',
      'Student commentary stored separately from source text'
    );
    assert(highlightNote?.courseId === course1._id.toString(), 'courseId matches source course');
    assert(highlightNote?.moduleId === module1._id.toString(), 'moduleId matches source module');
    assert(highlightNote?.topicId === topic1._id.toString(), 'topicId matches source topic');
    assert(highlightNote?.courseTitle === course1.title, 'courseTitle snapshot automatically populated');
    assert(highlightNote?.moduleTitle === module1.title, 'moduleTitle snapshot automatically populated');
    assert(highlightNote?.topicTitle === topic1.title, 'topicTitle snapshot automatically populated');
    assert(highlightNote?.color === 'amber', 'Color stored as amber');

    // =========================================================================
    // Scenario 4: Strict Tenant Isolation (Cross-Student Isolation)
    // =========================================================================
    console.log('\n--- Scenario 4: Strict Tenant Isolation (Cross-Student Isolation) ---');

    // 4.1 Student B tries to GET Student A's note by ID -> 404
    const getResB = await request(`/api/student/notes/${highlightNote.id}`, { method: 'GET' }, tokenB);
    assert(
      getResB.status === 404,
      'Student B attempting to GET Student A note returns 404 Not Found (cannot view)'
    );

    // 4.2 Student B tries to PUT Student A's note -> 404
    const putResB = await request(
      `/api/student/notes/${highlightNote.id}`,
      {
        method: 'PUT',
        body: JSON.stringify({ content: 'Malicious modification by Student B' }),
      },
      tokenB
    );
    assert(
      putResB.status === 404,
      'Student B attempting to PUT Student A note returns 404 Not Found (cannot modify)'
    );

    // Verify DB note was not modified
    const dbNoteAfterB = await Note.findById(highlightNote.id);
    assert(
      !dbNoteAfterB.content.includes('Malicious'),
      'Student A note content remains unaltered in database'
    );

    // 4.3 Student B tries to DELETE Student A's note -> 404
    const delResB = await request(`/api/student/notes/${highlightNote.id}`, { method: 'DELETE' }, tokenB);
    assert(
      delResB.status === 404,
      'Student B attempting to DELETE Student A note returns 404 Not Found (cannot delete)'
    );

    // Verify DB note still exists
    const dbNoteStillExists = await Note.findById(highlightNote.id);
    assert(Boolean(dbNoteStillExists), 'Student A note still exists in database');

    // 4.4 Student B list notes returns 0 notes (no leak from Student A)
    const listB = await request('/api/student/notes', { method: 'GET' }, tokenB);
    assert(listB.status === 200, 'Student B GET /api/student/notes returns 200 OK');
    assert(listB.data?.data?.notes.length === 0, 'Student B notes list contains 0 items (0 data leak)');

    // =========================================================================
    // Scenario 5: Note Updates & Source Immutability
    // =========================================================================
    console.log('\n--- Scenario 5: Note Updates & Source Immutability ---');

    const updateRes = await request(
      `/api/student/notes/${highlightNote.id}`,
      {
        method: 'PUT',
        body: JSON.stringify({
          title: 'Revised: Scheduling Review',
          content: 'Updated comment: also check multi-level feedback queues.',
          color: 'emerald',
          tags: ['os', 'final-revision'],
          // Attacker tries to mutate source provenance
          courseId: course3._id.toString(),
          selectedText: 'Tampered source text',
        }),
      },
      tokenA
    );
    assert(updateRes.status === 200, 'Student A successfully updates their note (200 OK)');
    const updatedNote = updateRes.data?.data?.note;

    assert(updatedNote?.title === 'Revised: Scheduling Review', 'Updated title saved');
    assert(updatedNote?.content.includes('multi-level feedback queues'), 'Updated commentary saved');
    assert(updatedNote?.color === 'emerald', 'Updated color saved');
    assert(updatedNote?.tags.includes('final-revision'), 'Updated tags saved');

    // Verify source references remained strictly immutable
    assert(
      updatedNote?.courseId === course1._id.toString(),
      'Source courseId remained immutable (Course 1)'
    );
    assert(
      updatedNote?.selectedText === 'Round robin scheduling uses fixed time slices for fair CPU sharing.',
      'Selected text remained immutable (tampered string ignored)'
    );

    // =========================================================================
    // Scenario 6: Filtering, Searching & Pagination
    // =========================================================================
    console.log('\n--- Scenario 6: Filtering, Searching & Pagination ---');

    // 6.1 Filter by noteType: highlight
    const highlightFilterRes = await request(
      '/api/student/notes?noteType=highlight',
      { method: 'GET' },
      tokenA
    );
    assert(highlightFilterRes.status === 200, 'Filter by noteType=highlight returns 200 OK');
    assert(
      highlightFilterRes.data?.data?.notes.every((n) => n.noteType === 'highlight'),
      'All returned notes have noteType === "highlight"'
    );

    // 6.2 Filter by noteType: standalone
    const standaloneFilterRes = await request(
      '/api/student/notes?noteType=standalone',
      { method: 'GET' },
      tokenA
    );
    assert(standaloneFilterRes.status === 200, 'Filter by noteType=standalone returns 200 OK');
    assert(
      standaloneFilterRes.data?.data?.notes.every((n) => n.noteType === 'standalone'),
      'All returned notes have noteType === "standalone"'
    );

    // 6.3 Filter by courseId
    const courseFilterRes = await request(
      `/api/student/notes?courseId=${course1._id.toString()}`,
      { method: 'GET' },
      tokenA
    );
    assert(courseFilterRes.status === 200, 'Filter by courseId returns 200 OK');
    assert(
      courseFilterRes.data?.data?.notes.length >= 1 &&
        courseFilterRes.data?.data?.notes.every((n) => n.courseId === course1._id.toString()),
      'Returned notes match specified courseId'
    );

    // 6.4 Keyword search
    const searchRes = await request(
      '/api/student/notes?search=scheduling',
      { method: 'GET' },
      tokenA
    );
    assert(searchRes.status === 200, 'Search by keyword "scheduling" returns 200 OK');
    assert(searchRes.data?.data?.notes.length >= 1, 'Matching notes found via keyword search');

    // 6.5 Pagination limits
    const pagedRes = await request('/api/student/notes?limit=1&page=1', { method: 'GET' }, tokenA);
    assert(pagedRes.status === 200, 'Pagination query returns 200 OK');
    assert(pagedRes.data?.data?.notes.length === 1, 'Limit=1 strictly enforced');
    assert(pagedRes.data?.data?.pagination?.limit === 1, 'Pagination metadata limit is 1');
    assert(pagedRes.data?.data?.pagination?.total >= 2, 'Pagination metadata reflects correct total');

    // =========================================================================
    // Scenario 7: Student Notes Statistics
    // =========================================================================
    console.log('\n--- Scenario 7: Student Notes Statistics ---');

    const statsRes = await request('/api/student/notes/stats', { method: 'GET' }, tokenA);
    assert(statsRes.status === 200, 'GET /api/student/notes/stats returns 200 OK');
    const stats = statsRes.data?.data?.stats;
    assert(typeof stats?.totalNotes === 'number' && stats.totalNotes >= 2, 'totalNotes count is accurate');
    assert(typeof stats?.standaloneNotes === 'number' && stats.standaloneNotes >= 1, 'standaloneNotes count is accurate');
    assert(typeof stats?.highlightNotes === 'number' && stats.highlightNotes >= 1, 'highlightNotes count is accurate');
    assert(stats?.coursesWithNotesCount >= 1, 'coursesWithNotesCount reflects distinct courses');

    // =========================================================================
    // Scenario 8: Deletion & Cleanup
    // =========================================================================
    console.log('\n--- Scenario 8: Deletion & Cleanup ---');

    const deleteRes = await request(
      `/api/student/notes/${standaloneNote.id}`,
      { method: 'DELETE' },
      tokenA
    );
    assert(deleteRes.status === 200, 'Student A deletes standalone note (200 OK)');
    assert(deleteRes.data?.data?.deletedId === standaloneNote.id, 'Response confirms deletedId');

    const postDeleteGet = await request(
      `/api/student/notes/${standaloneNote.id}`,
      { method: 'GET' },
      tokenA
    );
    assert(postDeleteGet.status === 404, 'Deleted note returns 404 Not Found on subsequent fetch');

  } catch (err) {
    console.error('Unexpected error during Phase 10A audit:', err);
    totalTests++;
    failedTests++;
  } finally {
    console.log('\n--- Cleanup: Purging Verification Artifacts ---');
    try {
      if (artifacts.notes.length > 0) {
        await Note.deleteMany({ _id: { $in: artifacts.notes } });
      }
      if (artifacts.topics.length > 0) {
        await Topic.deleteMany({ _id: { $in: artifacts.topics } });
      }
      if (artifacts.modules.length > 0) {
        await Module.deleteMany({ _id: { $in: artifacts.modules } });
      }
      if (artifacts.courses.length > 0) {
        await Course.deleteMany({ _id: { $in: artifacts.courses } });
      }
      if (artifacts.users.length > 0) {
        await User.deleteMany({ _id: { $in: artifacts.users } });
      }
      console.log('✓ All verification artifacts safely purged from database');
    } catch (cleanupErr) {
      console.error('Failed to cleanup artifacts:', cleanupErr);
    }
    await mongoose.disconnect();
  }

  console.log('===================================================================');
  console.log(`Phase 10A Verification Complete: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('===================================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runPhase10AAudit();
