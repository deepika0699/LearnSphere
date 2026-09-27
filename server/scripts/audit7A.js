import 'dotenv/config';
import mongoose from 'mongoose';
import crypto from 'node:crypto';
import { connectDB, isDbConnected } from '../config/db.js';
import User from '../models/User.js';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import Enrollment, { ENROLLMENT_STATUSES } from '../models/Enrollment.js';
import TopicProgress from '../models/TopicProgress.js';
import { requireStudent } from '../middleware/authorize.js';
import { isStudent, assertStudent } from '../middleware/studentAuthorization.js';
import { generateAccessToken } from '../services/tokenService.js';

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

async function runAudit() {
  console.log('================================================================');
  console.log('=== Step 7A — Student Data & Authorization Foundation Audit ===');
  console.log('================================================================\n');

  await connectDB();
  if (!isDbConnected()) {
    console.error('Fatal: Database is not connected');
    process.exit(1);
  }

  // Ensure unique indexes are built in MongoDB
  await Enrollment.init();
  await TopicProgress.init();

  const auditRunId = crypto.randomBytes(4).toString('hex');
  const createdUserIds = [];
  const createdCourseIds = [];
  const createdModuleIds = [];
  const createdTopicIds = [];
  const createdEnrollmentIds = [];
  const createdProgressIds = [];

  try {
    // -------------------------------------------------------------------------
    // SECTION 1: MODEL & SCHEMA INTEGRITY
    // -------------------------------------------------------------------------
    console.log('--- Section 1: Model & Schema Loading ---');

    assert(Boolean(Enrollment), 'Enrollment model loaded successfully');
    assert(Boolean(TopicProgress), 'TopicProgress model loaded successfully');
    assert(Array.isArray(ENROLLMENT_STATUSES) && ENROLLMENT_STATUSES.length === 3, 'ENROLLMENT_STATUSES contains active, completed, withdrawn');

    // -------------------------------------------------------------------------
    // SECTION 2: SEED PREREQUISITES (Users, Courses, Modules, Topics)
    // -------------------------------------------------------------------------
    console.log('\n--- Section 2: Fixture Setup ---');

    const studentUser = await User.create({
      name: `Audit Student ${auditRunId}`,
      email: `student_${auditRunId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'student',
      status: 'active',
    });
    createdUserIds.push(studentUser._id);

    const creatorUser = await User.create({
      name: `Audit Creator ${auditRunId}`,
      email: `creator_${auditRunId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'courseCreator',
      status: 'active',
    });
    createdUserIds.push(creatorUser._id);

    const adminUser = await User.create({
      name: `Audit Admin ${auditRunId}`,
      email: `admin_${auditRunId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'admin',
      status: 'active',
    });
    createdUserIds.push(adminUser._id);

    const inactiveStudent = await User.create({
      name: `Inactive Student ${auditRunId}`,
      email: `inactive_${auditRunId}@test.learnsphere.io`,
      password: 'Password123!',
      role: 'student',
      status: 'inactive',
    });
    createdUserIds.push(inactiveStudent._id);

    // Published course
    const publishedCourse = await Course.create({
      title: `Published Course ${auditRunId}`,
      description: 'A comprehensive published test course for student foundation testing.',
      category: 'Development',
      courseCreator: creatorUser._id,
      status: 'published',
    });
    createdCourseIds.push(publishedCourse._id);

    // Draft course
    const draftCourse = await Course.create({
      title: `Draft Course ${auditRunId}`,
      description: 'A draft test course that must reject student enrollments.',
      category: 'Development',
      courseCreator: creatorUser._id,
      status: 'draft',
    });
    createdCourseIds.push(draftCourse._id);

    // Archived course
    const archivedCourse = await Course.create({
      title: `Archived Course ${auditRunId}`,
      description: 'An archived test course that must reject student enrollments.',
      category: 'Development',
      courseCreator: creatorUser._id,
      status: 'archived',
    });
    createdCourseIds.push(archivedCourse._id);

    // Module 1 in Published Course
    const module1 = await Module.create({
      courseId: publishedCourse._id,
      title: `Module 1 ${auditRunId}`,
      order: 1,
    });
    createdModuleIds.push(module1._id);

    // Module 2 in Published Course
    const module2 = await Module.create({
      courseId: publishedCourse._id,
      title: `Module 2 ${auditRunId}`,
      order: 2,
    });
    createdModuleIds.push(module2._id);

    // Topic 1 in Module 1
    const topic1 = await Topic.create({
      courseId: publishedCourse._id,
      moduleId: module1._id,
      title: `Topic 1.1 ${auditRunId}`,
      description: 'First topic in module 1',
      order: 1,
    });
    createdTopicIds.push(topic1._id);

    assert(true, 'Fixtures created successfully');

    // -------------------------------------------------------------------------
    // SECTION 3: ENROLLMENT MODEL & VALIDATION
    // -------------------------------------------------------------------------
    console.log('\n--- Section 3: Enrollment Model Validations ---');

    // 3.1 Valid Enrollment Creation
    const validEnrollment = await Enrollment.create({
      userId: studentUser._id,
      courseId: publishedCourse._id,
      status: 'active',
    });
    createdEnrollmentIds.push(validEnrollment._id);
    assert(validEnrollment._id && validEnrollment.status === 'active', 'Valid enrollment creates with default/explicit status');
    assert(validEnrollment.enrolledAt instanceof Date, 'enrolledAt timestamp is automatically populated');

    // 3.2 toJSON transforms safely (exposes id, excludes internals)
    const enrollmentJson = validEnrollment.toJSON();
    assert(enrollmentJson.id === validEnrollment._id.toString(), 'toJSON provides normalized string id');
    assert(enrollmentJson.userId && enrollmentJson.courseId, 'Safe references present in serialized JSON');

    // 3.3 Rejection of invalid status enum
    let invalidStatusError = null;
    try {
      await Enrollment.create({
        userId: studentUser._id,
        courseId: publishedCourse._id,
        status: 'pending_payment', // Not in enum
      });
    } catch (err) {
      invalidStatusError = err;
    }
    assert(Boolean(invalidStatusError), 'Rejects invalid status enum value');

    // 3.4 Rejection of missing required fields
    let missingCourseError = null;
    try {
      await Enrollment.create({
        userId: studentUser._id,
        // missing courseId
      });
    } catch (err) {
      missingCourseError = err;
    }
    assert(Boolean(missingCourseError), 'Rejects enrollment creation with missing courseId');

    // 3.5 Rejection of draft course enrollment
    let draftEnrollmentError = null;
    try {
      await Enrollment.create({
        userId: studentUser._id,
        courseId: draftCourse._id,
      });
    } catch (err) {
      draftEnrollmentError = err;
    }
    assert(Boolean(draftEnrollmentError) && draftEnrollmentError.message.includes('draft'), 'Rejects enrollment in draft course');

    // 3.6 Rejection of archived course enrollment
    let archivedEnrollmentError = null;
    try {
      await Enrollment.create({
        userId: studentUser._id,
        courseId: archivedCourse._id,
      });
    } catch (err) {
      archivedEnrollmentError = err;
    }
    assert(Boolean(archivedEnrollmentError) && archivedEnrollmentError.message.includes('archived'), 'Rejects enrollment in archived course');

    // 3.7 Compound Unique Index: Rejects duplicate user-course enrollment
    let duplicateEnrollmentError = null;
    try {
      await Enrollment.create({
        userId: studentUser._id,
        courseId: publishedCourse._id, // already enrolled above
        status: 'active',
      });
    } catch (err) {
      duplicateEnrollmentError = err;
    }
    assert(
      Boolean(duplicateEnrollmentError) &&
        (duplicateEnrollmentError.code === 11000 || duplicateEnrollmentError.message?.includes('duplicate key')),
      'Unique compound index prevents duplicate user-course enrollment'
    );

    // -------------------------------------------------------------------------
    // SECTION 4: TOPIC PROGRESS MODEL & HIERARCHY VALIDATION
    // -------------------------------------------------------------------------
    console.log('\n--- Section 4: Topic Progress Validations ---');

    // 4.1 Valid Topic Progress Creation
    const validProgress = await TopicProgress.create({
      userId: studentUser._id,
      courseId: publishedCourse._id,
      moduleId: module1._id,
      topicId: topic1._id,
    });
    createdProgressIds.push(validProgress._id);
    assert(validProgress._id && validProgress.completedAt instanceof Date, 'Valid topic progress creates successfully');

    // 4.2 Hierarchy Validation: Rejects mismatched moduleId
    let mismatchedModuleError = null;
    try {
      await TopicProgress.create({
        userId: studentUser._id,
        courseId: publishedCourse._id,
        moduleId: module2._id, // topic1 belongs to module1, not module2!
        topicId: topic1._id,
      });
    } catch (err) {
      mismatchedModuleError = err;
    }
    assert(
      Boolean(mismatchedModuleError) && mismatchedModuleError.message.includes('module'),
      'Strict hierarchy check rejects progress when topic does not belong to specified module'
    );

    // 4.3 Hierarchy Validation: Rejects mismatched courseId
    let mismatchedCourseError = null;
    try {
      await TopicProgress.create({
        userId: studentUser._id,
        courseId: draftCourse._id, // topic1 belongs to publishedCourse, not draftCourse!
        moduleId: module1._id,
        topicId: topic1._id,
      });
    } catch (err) {
      mismatchedCourseError = err;
    }
    assert(
      Boolean(mismatchedCourseError) && mismatchedCourseError.message.includes('course'),
      'Strict hierarchy check rejects progress when topic does not belong to specified course'
    );

    // 4.4 Rejection of missing topicId / moduleId / courseId / userId
    let missingTopicError = null;
    try {
      await TopicProgress.create({
        userId: studentUser._id,
        courseId: publishedCourse._id,
        moduleId: module1._id,
        // missing topicId
      });
    } catch (err) {
      missingTopicError = err;
    }
    assert(Boolean(missingTopicError), 'Rejects topic progress creation with missing required foreign keys');

    // 4.5 Compound Unique Index: Rejects duplicate user-topic progress
    let duplicateProgressError = null;
    try {
      await TopicProgress.create({
        userId: studentUser._id,
        courseId: publishedCourse._id,
        moduleId: module1._id,
        topicId: topic1._id, // already completed above
      });
    } catch (err) {
      duplicateProgressError = err;
    }
    assert(
      Boolean(duplicateProgressError) &&
        (duplicateProgressError.code === 11000 || duplicateProgressError.message?.includes('duplicate key')),
      'Unique compound index prevents duplicate user-topic progress records'
    );

    // -------------------------------------------------------------------------
    // SECTION 5: STUDENT AUTHORIZATION MIDDLEWARE & HELPERS
    // -------------------------------------------------------------------------
    console.log('\n--- Section 5: Student Authorization & Role Verification ---');

    // 5.1 Helper `isStudent`
    assert(isStudent({ role: 'student', status: 'active' }) === true, 'isStudent returns true for student role');
    assert(isStudent({ role: 'courseCreator', status: 'active' }) === false, 'isStudent returns false for courseCreator');
    assert(isStudent({ role: 'admin', status: 'active' }) === false, 'isStudent returns false for admin');
    assert(isStudent({ role: 'student', status: 'inactive' }) === false, 'isStudent returns false for inactive student');
    assert(isStudent(null) === false, 'isStudent returns false for null user');

    // 5.2 Helper `assertStudent`
    let assertStudentPass = false;
    try {
      assertStudent({ userId: studentUser._id.toString(), role: 'student', status: 'active' });
      assertStudentPass = true;
    } catch {
      assertStudentPass = false;
    }
    assert(assertStudentPass, 'assertStudent succeeds for valid active student');

    let assertCreatorReject = false;
    try {
      assertStudent({ userId: creatorUser._id.toString(), role: 'courseCreator', status: 'active' });
    } catch (err) {
      assertCreatorReject = err.statusCode === 403;
    }
    assert(assertCreatorReject, 'assertStudent throws 403 for courseCreator');

    let assertUnauthReject = false;
    try {
      assertStudent(null);
    } catch (err) {
      assertUnauthReject = err.statusCode === 401;
    }
    assert(assertUnauthReject, 'assertStudent throws 401 for missing/unauthenticated user');

    // 5.3 `requireStudent` middleware simulation tests
    const executeMiddleware = (middleware, req) => {
      return new Promise((resolve) => {
        const res = {
          statusCode: 200,
          jsonData: null,
          status(code) {
            this.statusCode = code;
            return this;
          },
          json(data) {
            this.jsonData = data;
            resolve({ statusCode: this.statusCode, data: this.jsonData });
          },
        };
        const next = (err) => {
          if (err) {
            resolve({ statusCode: 500, error: err });
          } else {
            resolve({ statusCode: 200, passedNext: true });
          }
        };
        middleware(req, res, next).catch((err) => resolve({ statusCode: 500, error: err }));
      });
    };

    // Unauthenticated request (missing req.user)
    const resUnauth = await executeMiddleware(requireStudent, {});
    assert(resUnauth.statusCode === 401, 'requireStudent rejects unauthenticated request with 401');

    // Active student request
    const resStudent = await executeMiddleware(requireStudent, {
      user: { userId: studentUser._id.toString(), role: 'student' },
    });
    assert(resStudent.statusCode === 200 && resStudent.passedNext === true, 'requireStudent allows verified student with 200/next');

    // Course Creator attempting student route
    const resCreator = await executeMiddleware(requireStudent, {
      user: { userId: creatorUser._id.toString(), role: 'courseCreator' },
    });
    assert(resCreator.statusCode === 403, 'requireStudent rejects courseCreator with 403 Forbidden');

    // Admin attempting student route
    const resAdmin = await executeMiddleware(requireStudent, {
      user: { userId: adminUser._id.toString(), role: 'admin' },
    });
    assert(resAdmin.statusCode === 403, 'requireStudent rejects admin with 403 Forbidden');

    // Inactive student
    const resInactive = await executeMiddleware(requireStudent, {
      user: { userId: inactiveStudent._id.toString(), role: 'student' },
    });
    assert(resInactive.statusCode === 401, 'requireStudent rejects inactive student with 401');

    // Nonexistent user (deleted)
    const fakeId = new mongoose.Types.ObjectId().toString();
    const resDeleted = await executeMiddleware(requireStudent, {
      user: { userId: fakeId, role: 'student' },
    });
    assert(resDeleted.statusCode === 401, 'requireStudent rejects deleted/nonexistent user with 401');

    // -------------------------------------------------------------------------
    // SECTION 6: NO SENSITIVE FIELDS EXPOSED
    // -------------------------------------------------------------------------
    console.log('\n--- Section 6: Data Leak Prevention ---');
    const studentDoc = await User.findById(studentUser._id);
    const safeStudentJson = studentDoc.toJSON();
    assert(safeStudentJson.password === undefined, 'User toJSON never exposes password hash');

    const enrollmentDoc = await Enrollment.findById(validEnrollment._id);
    const safeEnrollmentJson = enrollmentDoc.toJSON();
    assert(safeEnrollmentJson.id && !safeEnrollmentJson.password, 'Enrollment toJSON safe and clean');

  } finally {
    // -------------------------------------------------------------------------
    // CLEANUP
    // -------------------------------------------------------------------------
    console.log('\n--- Cleanup: Purging Temporary Audit Artifacts ---');
    if (createdProgressIds.length > 0) {
      await TopicProgress.deleteMany({ _id: { $in: createdProgressIds } });
    }
    if (createdEnrollmentIds.length > 0) {
      await Enrollment.deleteMany({ _id: { $in: createdEnrollmentIds } });
    }
    if (createdTopicIds.length > 0) {
      await Topic.deleteMany({ _id: { $in: createdTopicIds } });
    }
    if (createdModuleIds.length > 0) {
      await Module.deleteMany({ _id: { $in: createdModuleIds } });
    }
    if (createdCourseIds.length > 0) {
      await Course.deleteMany({ _id: { $in: createdCourseIds } });
    }
    if (createdUserIds.length > 0) {
      await User.deleteMany({ _id: { $in: createdUserIds } });
    }
    console.log('✓ All audit artifacts safely purged from database');
  }

  console.log('\n================================================================');
  console.log(`=== Audit 7A Complete: ${passedTests}/${totalTests} Passed (${failedTests} Failed) ===`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAudit().catch((err) => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
