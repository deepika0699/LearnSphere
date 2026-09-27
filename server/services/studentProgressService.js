import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import Enrollment from '../models/Enrollment.js';
import TopicProgress from '../models/TopicProgress.js';
import Assessment from '../models/Assessment.js';
import AssessmentAttempt from '../models/AssessmentAttempt.js';

/**
 * Formats a TopicProgress document into a safe, client-facing response object.
 * Strictly excludes passwords, tokens, credentials, and internal Mongoose internals.
 *
 * @param {Object} doc - TopicProgress document or lean object.
 * @returns {Object|null} Sanitized topic progress record.
 */
export const formatSafeProgress = (doc) => {
  if (!doc) return null;
  return {
    id: doc._id ? doc._id.toString() : doc.id,
    userId: doc.userId
      ? doc.userId._id
        ? doc.userId._id.toString()
        : doc.userId.toString()
      : undefined,
    courseId: doc.courseId
      ? doc.courseId._id
        ? doc.courseId._id.toString()
        : doc.courseId.toString()
      : undefined,
    moduleId: doc.moduleId
      ? doc.moduleId._id
        ? doc.moduleId._id.toString()
        : doc.moduleId.toString()
      : undefined,
    topicId: doc.topicId
      ? doc.topicId._id
        ? doc.topicId._id.toString()
        : doc.topicId.toString()
      : undefined,
    completedAt: doc.completedAt,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
};

/**
 * Student Progress Service
 * Encapsulates all business logic for student topic progress and completion tracking.
 */
class StudentProgressService {
  /**
   * Validates active student enrollment and published course eligibility.
   *
   * @private
   * @param {mongoose.Types.ObjectId} userObjId - Authenticated student ObjectId.
   * @param {mongoose.Types.ObjectId} courseObjId - Target course ObjectId.
   * @returns {Promise<Object>} Object containing verified course and enrollment.
   */
  async _verifyActiveEnrollmentAndCourse(userObjId, courseObjId) {
    const course = await Course.findById(courseObjId).select('_id status title');

    if (!course) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }

    if (course.status !== 'published') {
      const err = new Error(
        `Cannot access progress for course with status '${course.status}'. Only published courses allow progress tracking.`
      );
      err.statusCode = 400;
      throw err;
    }

    const enrollment = await Enrollment.findOne({
      userId: userObjId,
      courseId: courseObjId,
      status: { $in: ['active', 'completed'] },
    }).select('_id status');

    if (!enrollment) {
      const err = new Error('Active course enrollment required to access or update topic progress');
      err.statusCode = 403;
      throw err;
    }

    return { course, enrollment };
  }

  /**
   * Marks an individual topic as completed for the authenticated student.
   * Resolves module relationship from topic and enforces course-module-topic hierarchy.
   * Repeated completion calls are safe and idempotent.
   *
   * @param {Object} params
   * @param {string|mongoose.Types.ObjectId} params.userId - Authenticated student ID.
   * @param {string} params.courseId - Course ID.
   * @param {string} params.topicId - Topic ID.
   * @returns {Promise<Object>} { progress, alreadyCompleted }
   */
  async completeTopic({ userId, courseId, topicId }) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      throw err;
    }

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      const err = new Error('Invalid course ID format');
      err.statusCode = 400;
      throw err;
    }

    if (!topicId || !mongoose.Types.ObjectId.isValid(topicId)) {
      const err = new Error('Invalid topic ID format');
      err.statusCode = 400;
      throw err;
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const courseObjId = new mongoose.Types.ObjectId(courseId);
    const topicObjId = new mongoose.Types.ObjectId(topicId);

    // Verify course publication & active student enrollment
    await this._verifyActiveEnrollmentAndCourse(userObjId, courseObjId);

    // Verify topic existence and hierarchy
    const topic = await Topic.findById(topicObjId).select('_id moduleId courseId title');
    if (!topic) {
      const err = new Error('Topic not found');
      err.statusCode = 404;
      throw err;
    }

    if (topic.courseId.toString() !== courseObjId.toString()) {
      const err = new Error('Topic does not belong to the specified course');
      err.statusCode = 400;
      throw err;
    }

    // Verify module hierarchy
    const moduleDoc = await Module.findById(topic.moduleId).select('_id courseId');
    if (!moduleDoc || moduleDoc.courseId.toString() !== courseObjId.toString()) {
      const err = new Error('Topic module does not belong to the specified course');
      err.statusCode = 400;
      throw err;
    }

    // Check if progress already exists (idempotency guard)
    const existingProgress = await TopicProgress.findOne({
      userId: userObjId,
      topicId: topicObjId,
    });

    if (existingProgress) {
      const syncResult = await this.checkAndSyncCourseCompletion({
        userId: userObjId,
        courseId: courseObjId,
      });

      return {
        progress: formatSafeProgress(existingProgress),
        alreadyCompleted: true,
        isCourseCompleted: syncResult.isCompleted,
        enrollmentStatus: syncResult.enrollmentStatus,
      };
    }

    // Create topic progress with server-authoritative fields only
    try {
      const newProgress = await TopicProgress.create({
        userId: userObjId,
        courseId: courseObjId,
        moduleId: topic.moduleId,
        topicId: topicObjId,
        completedAt: new Date(),
      });

      const syncResult = await this.checkAndSyncCourseCompletion({
        userId: userObjId,
        courseId: courseObjId,
      });

      return {
        progress: formatSafeProgress(newProgress),
        alreadyCompleted: false,
        isCourseCompleted: syncResult.isCompleted,
        enrollmentStatus: syncResult.enrollmentStatus,
      };
    } catch (err) {
      // Safe race condition handling for unique compound index (userId, topicId)
      if (err.code === 11000) {
        const raceExisting = await TopicProgress.findOne({
          userId: userObjId,
          topicId: topicObjId,
        });
        if (raceExisting) {
          const syncResult = await this.checkAndSyncCourseCompletion({
            userId: userObjId,
            courseId: courseObjId,
          });

          return {
            progress: formatSafeProgress(raceExisting),
            alreadyCompleted: true,
            isCourseCompleted: syncResult.isCompleted,
            enrollmentStatus: syncResult.enrollmentStatus,
          };
        }
      }
      throw err;
    }
  }

  /**
   * Evaluates server-authoritative course completion and synchronizes Enrollment status.
   * - All required published topics are completed
   * - AND all required published assessments are passed (if course has published assessments)
   * When complete:
   *   transitions Enrollment status from 'active' -> 'completed', sets completedAt to current server timestamp.
   * When incomplete:
   *   transitions Enrollment status from 'completed' -> 'active', resets completedAt to null.
   * STRICT INVARIANTS:
   * - Never modifies 'withdrawn' enrollments.
   * - Idempotent and concurrency-safe via atomic updateOne.
   * - Client cannot force completion flags, percentages, or status.
   * - Scoped strictly to authenticated user's userId.
   *
   * @param {Object} params
   * @param {string|mongoose.Types.ObjectId} params.userId
   * @param {string|mongoose.Types.ObjectId} params.courseId
   * @returns {Promise<{ isCompleted: boolean, enrollmentStatus: string }>}
   */
  async checkAndSyncCourseCompletion({ userId, courseId }) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return { isCompleted: false, enrollmentStatus: 'none' };
    }
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return { isCompleted: false, enrollmentStatus: 'none' };
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const courseObjId = new mongoose.Types.ObjectId(courseId);

    // 1. Fetch enrollment
    const enrollment = await Enrollment.findOne({
      userId: userObjId,
      courseId: courseObjId,
    }).select('_id status completedAt');

    if (!enrollment || enrollment.status === 'withdrawn') {
      return {
        isCompleted: false,
        enrollmentStatus: enrollment ? enrollment.status : 'none',
      };
    }

    // 2. Fetch target published course
    const course = await Course.findOne({
      _id: courseObjId,
      status: 'published',
    }).select('_id');

    if (!course) {
      return { isCompleted: false, enrollmentStatus: enrollment.status };
    }

    // 3. Find valid modules and topics for this course
    const modules = await Module.find({ courseId: courseObjId }).select('_id').lean();
    const moduleIds = modules.map((m) => m._id);

    const topics = await Topic.find({
      courseId: courseObjId,
      moduleId: { $in: moduleIds },
    })
      .select('_id')
      .lean();

    const validTopicIds = topics.map((t) => t._id);
    const totalTopics = validTopicIds.length;

    // If a course has no published topics, it cannot be considered completed
    if (totalTopics === 0) {
      if (enrollment.status === 'completed') {
        await Enrollment.updateOne(
          { _id: enrollment._id, status: 'completed' },
          { $set: { status: 'active', completedAt: null } }
        );
        return { isCompleted: false, enrollmentStatus: 'active' };
      }
      return { isCompleted: false, enrollmentStatus: enrollment.status };
    }

    // 4. Count student's completed valid topics
    const completedTopics = await TopicProgress.countDocuments({
      userId: userObjId,
      courseId: courseObjId,
      topicId: { $in: validTopicIds },
    });

    const areTopicsComplete = completedTopics >= totalTopics;

    // 5. Query published assessments for this course
    const publishedAssessments = await Assessment.find({
      courseId: courseObjId,
      status: 'published',
    })
      .select('_id')
      .lean();

    const totalAssessments = publishedAssessments.length;

    let passedAssessments = 0;
    if (totalAssessments > 0) {
      const passedIds = await AssessmentAttempt.distinct('assessmentId', {
        userId: userObjId,
        courseId: courseObjId,
        assessmentId: { $in: publishedAssessments.map((a) => a._id) },
        status: { $in: ['completed', 'timed_out'] },
        isPassed: true,
      });
      passedAssessments = passedIds.length;
    }

    const allAssessmentsPassed = totalAssessments === 0 || passedAssessments >= totalAssessments;

    // Complete only if topics complete AND all published assessments passed
    const isCourseCompleted = areTopicsComplete && allAssessmentsPassed;

    // 6. Synchronize Enrollment status idempotently
    if (isCourseCompleted) {
      if (enrollment.status === 'active') {
        const now = new Date();
        await Enrollment.updateOne(
          { _id: enrollment._id, status: 'active' },
          { $set: { status: 'completed', completedAt: now } }
        );
        return { isCompleted: true, enrollmentStatus: 'completed' };
      }
      return { isCompleted: true, enrollmentStatus: 'completed' };
    } else {
      if (enrollment.status === 'completed') {
        await Enrollment.updateOne(
          { _id: enrollment._id, status: 'completed' },
          { $set: { status: 'active', completedAt: null } }
        );
        return { isCompleted: false, enrollmentStatus: 'active' };
      }
      return { isCompleted: false, enrollmentStatus: enrollment.status };
    }
  }

  /**
   * Marks a topic as incomplete by removing the student's progress record.
   * Repeated deletion is safe and idempotent.
   *
   * @param {Object} params
   * @param {string|mongoose.Types.ObjectId} params.userId - Authenticated student ID.
   * @param {string} params.courseId - Course ID.
   * @param {string} params.topicId - Topic ID.
   * @returns {Promise<Object>} { topicId, courseId, completed, wasRemoved }
   */
  async uncompleteTopic({ userId, courseId, topicId }) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      throw err;
    }

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      const err = new Error('Invalid course ID format');
      err.statusCode = 400;
      throw err;
    }

    if (!topicId || !mongoose.Types.ObjectId.isValid(topicId)) {
      const err = new Error('Invalid topic ID format');
      err.statusCode = 400;
      throw err;
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const courseObjId = new mongoose.Types.ObjectId(courseId);
    const topicObjId = new mongoose.Types.ObjectId(topicId);

    // Verify course publication & active student enrollment
    await this._verifyActiveEnrollmentAndCourse(userObjId, courseObjId);

    // Verify topic existence and hierarchy
    const topic = await Topic.findById(topicObjId).select('_id moduleId courseId');
    if (!topic) {
      const err = new Error('Topic not found');
      err.statusCode = 404;
      throw err;
    }

    if (topic.courseId.toString() !== courseObjId.toString()) {
      const err = new Error('Topic does not belong to the specified course');
      err.statusCode = 400;
      throw err;
    }

    // Delete progress strictly scoped to this student, topic, and course
    const deleted = await TopicProgress.findOneAndDelete({
      userId: userObjId,
      courseId: courseObjId,
      topicId: topicObjId,
    });

    // Check and synchronize course completion (reverts to active if course was completed)
    await this.checkAndSyncCourseCompletion({
      userId: userObjId,
      courseId: courseObjId,
    });

    return {
      topicId: topicId.toString(),
      courseId: courseId.toString(),
      completed: false,
      wasRemoved: Boolean(deleted),
    };
  }

  /**
   * Retrieves completed topic records for the authenticated student in a specified course.
   *
   * @param {Object} params
   * @param {string|mongoose.Types.ObjectId} params.userId - Authenticated student ID.
   * @param {string} params.courseId - Course ID.
   * @returns {Promise<Object>} { courseId, completedTopicIds, completedCount, progress }
   */
  async getCourseProgress({ userId, courseId }) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      throw err;
    }

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      const err = new Error('Invalid course ID format');
      err.statusCode = 400;
      throw err;
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const courseObjId = new mongoose.Types.ObjectId(courseId);

    // Verify course publication & active student enrollment
    await this._verifyActiveEnrollmentAndCourse(userObjId, courseObjId);

    const records = await TopicProgress.find({
      userId: userObjId,
      courseId: courseObjId,
    })
      .sort({ completedAt: -1 })
      .lean();

    const completedTopicIds = records.map((r) => r.topicId.toString());
    const formattedProgress = records.map(formatSafeProgress);

    // Query published assessments belonging to this course
    const publishedAssessments = await Assessment.find({
      courseId: courseObjId,
      status: 'published',
    })
      .sort({ type: 1, createdAt: 1 })
      .lean();

    const assessmentIds = publishedAssessments.map((a) => a._id);

    // Query student's finalized attempts for these assessments
    const finalizedAttempts =
      assessmentIds.length > 0
        ? await AssessmentAttempt.find({
            userId: userObjId,
            assessmentId: { $in: assessmentIds },
            status: { $in: ['completed', 'timed_out'] },
          })
            .sort({ submittedAt: -1, createdAt: -1 })
            .lean()
        : [];

    const activeAttempts =
      assessmentIds.length > 0
        ? await AssessmentAttempt.find({
            userId: userObjId,
            assessmentId: { $in: assessmentIds },
            status: 'in_progress',
          }).lean()
        : [];

    const attemptsByAssessmentId = new Map();
    for (const att of finalizedAttempts) {
      const aIdStr = att.assessmentId.toString();
      if (!attemptsByAssessmentId.has(aIdStr)) {
        attemptsByAssessmentId.set(aIdStr, []);
      }
      attemptsByAssessmentId.get(aIdStr).push(att);
    }

    const activeAttemptByAssessmentId = new Map();
    for (const att of activeAttempts) {
      activeAttemptByAssessmentId.set(att.assessmentId.toString(), att);
    }

    const passedAssessmentIds = [];
    const formattedAssessments = publishedAssessments.map((assessment) => {
      const aIdStr = assessment._id.toString();
      const attempts = attemptsByAssessmentId.get(aIdStr) || [];
      const hasPassed = attempts.some((att) => att.isPassed === true);
      const activeAtt = activeAttemptByAssessmentId.get(aIdStr);

      if (hasPassed) {
        passedAssessmentIds.push(aIdStr);
      }

      const bestScore = attempts.reduce(
        (max, att) => (typeof att.score === 'number' && att.score > max ? att.score : max),
        0
      );
      const latestAttempt = attempts[0] || null;

      let status = 'not_started';
      if (hasPassed) {
        status = 'passed';
      } else if (activeAtt) {
        status = 'in_progress';
      } else if (attempts.length > 0) {
        status = 'failed';
      }

      return {
        id: aIdStr,
        assessmentId: aIdStr,
        title: assessment.title,
        description: assessment.description || '',
        type: assessment.type,
        moduleId: assessment.moduleId ? assessment.moduleId.toString() : null,
        topicId: assessment.topicId ? assessment.topicId.toString() : null,
        passingScore: assessment.passingScore,
        timeLimitMinutes: assessment.timeLimitMinutes,
        maxAttempts: assessment.maxAttempts,
        totalQuestions: Array.isArray(assessment.questions) ? assessment.questions.length : 0,
        attemptsCount: attempts.length,
        bestScore,
        latestScore: latestAttempt ? latestAttempt.score : null,
        isPassed: hasPassed,
        status,
        lastAttemptAt: latestAttempt?.submittedAt || null,
      };
    });

    return {
      courseId: courseId.toString(),
      completedTopicIds,
      completedCount: completedTopicIds.length,
      progress: formattedProgress,
      assessments: formattedAssessments,
      passedAssessmentIds,
      passedAssessmentCount: passedAssessmentIds.length,
      totalAssessmentsCount: publishedAssessments.length,
    };
  }

  /**
   * Retrieves an accurate, real-time course progress summary for the authenticated student.
   * Avoids division-by-zero errors and strictly calculates percentage against valid course topics.
   * Integrates published assessment completion to derive consistent course completion.
   *
   * @param {Object} params
   * @param {string|mongoose.Types.ObjectId} params.userId - Authenticated student ID.
   * @param {string} params.courseId - Course ID.
   * @returns {Promise<Object>} { courseId, totalTopics, completedTopics, completionPercentage, totalAssessments, passedAssessments, allAssessmentsPassed, isCompleted }
   */
  async getCourseProgressSummary({ userId, courseId }) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      throw err;
    }

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      const err = new Error('Invalid course ID format');
      err.statusCode = 400;
      throw err;
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const courseObjId = new mongoose.Types.ObjectId(courseId);

    // Verify course publication & active student enrollment
    const { enrollment } = await this._verifyActiveEnrollmentAndCourse(userObjId, courseObjId);

    // Find all valid modules belonging to this course
    const modules = await Module.find({ courseId: courseObjId }).select('_id').lean();
    const moduleIds = modules.map((m) => m._id);

    // Find all valid topics belonging to this course and its modules
    const topics = await Topic.find({
      courseId: courseObjId,
      moduleId: { $in: moduleIds },
    })
      .select('_id')
      .lean();

    const validTopicIds = topics.map((t) => t._id);
    const totalTopics = validTopicIds.length;

    // Count completions strictly matching valid topics in this course
    const completedTopics =
      totalTopics > 0
        ? await TopicProgress.countDocuments({
            userId: userObjId,
            courseId: courseObjId,
            topicId: { $in: validTopicIds },
          })
        : 0;

    /**
     * Percentage Rounding Rule:
     * - When totalTopics is 0: completionPercentage is strictly 0 (prevents division by zero).
     * - When totalTopics > 0: Math.round((completedTopics / totalTopics) * 100), bounded between 0 and 100.
     */
    const completionPercentage =
      totalTopics > 0
        ? Math.min(100, Math.max(0, Math.round((completedTopics / totalTopics) * 100)))
        : 0;

    // Query published assessments for this course
    const publishedAssessments = await Assessment.find({
      courseId: courseObjId,
      status: 'published',
    })
      .select('_id')
      .lean();

    const totalAssessments = publishedAssessments.length;

    // Count passed assessments strictly from finalized attempts with isPassed === true
    let passedAssessments = 0;
    if (totalAssessments > 0) {
      const passedAssessmentIds = await AssessmentAttempt.distinct('assessmentId', {
        userId: userObjId,
        courseId: courseObjId,
        assessmentId: { $in: publishedAssessments.map((a) => a._id) },
        status: { $in: ['completed', 'timed_out'] },
        isPassed: true,
      });
      passedAssessments = passedAssessmentIds.length;
    }

    const allAssessmentsPassed = totalAssessments === 0 || passedAssessments >= totalAssessments;
    const isCompleted = totalTopics > 0 && completedTopics >= totalTopics && allAssessmentsPassed;

    return {
      courseId: courseId.toString(),
      totalTopics,
      completedTopics,
      completionPercentage,
      totalAssessments,
      passedAssessments,
      allAssessmentsPassed,
      isCompleted,
      enrollmentStatus: enrollment ? enrollment.status : 'active',
    };
  }
}

const studentProgressService = new StudentProgressService();
export default studentProgressService;
