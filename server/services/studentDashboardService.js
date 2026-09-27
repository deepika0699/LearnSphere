import mongoose from 'mongoose';
import User from '../models/User.js';
import Module from '../models/Module.js';
import Topic from '../models/Topic.js';
import Enrollment from '../models/Enrollment.js';
import TopicProgress from '../models/TopicProgress.js';
import Assessment from '../models/Assessment.js';
import AssessmentAttempt from '../models/AssessmentAttempt.js';

/**
 * Calculates completion percentage and completion state.
 * Strictly adheres to project rounding and bounds rules:
 * - When totalTopics === 0: completionPercentage is strictly 0 (prevents division by zero).
 * - When totalTopics > 0: Math.round((completedTopics / totalTopics) * 100), bounded between 0 and 100.
 *
 * @param {number} totalTopics - Total number of valid published topics in course.
 * @param {number} completedTopics - Number of valid topics completed by student.
 * @returns {{ completionPercentage: number, isCompleted: boolean }}
 */
export const calculateProgressMetrics = (totalTopics, completedTopics) => {
  if (!totalTopics || totalTopics <= 0) {
    return {
      completionPercentage: 0,
      isCompleted: false,
    };
  }

  const validCompleted = Math.max(0, Math.min(completedTopics, totalTopics));
  const completionPercentage = Math.min(100, Math.max(0, Math.round((validCompleted / totalTopics) * 100)));
  const isCompleted = validCompleted >= totalTopics;

  return {
    completionPercentage,
    isCompleted,
  };
};

/**
 * Student Dashboard Service
 * Aggregates real-time, database-backed enrollment, course, and progress data
 * strictly scoped to the authenticated student session.
 */
class StudentDashboardService {
  /**
   * Retrieves the comprehensive dashboard state for the authenticated student.
   *
   * @param {Object} params
   * @param {string|mongoose.Types.ObjectId} params.userId - Authenticated student ID from session.
   * @returns {Promise<Object>} Safe dashboard payload.
   */
  async getStudentDashboard({ userId }) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      throw err;
    }

    const userObjId = new mongoose.Types.ObjectId(userId);

    // 1. Fetch authenticated student profile using safe fields only
    const userDoc = await User.findById(userObjId)
      .select('_id name email role status')
      .lean();

    if (!userDoc || userDoc.status !== 'active') {
      const err = new Error('User account is inactive or not found');
      err.statusCode = 401;
      throw err;
    }

    const safeStudent = {
      id: userDoc._id.toString(),
      name: userDoc.name,
      email: userDoc.email,
      role: userDoc.role,
    };

    // 2. Fetch all student enrollments and populate published courses
    // Exclude withdrawn enrollments if any; populate only published courses
    const enrollments = await Enrollment.find({
      userId: userObjId,
      status: { $in: ['active', 'completed'] },
    })
      .populate({
        path: 'courseId',
        match: { status: 'published' },
        select: '_id title description category thumbnail courseCreator status',
        populate: {
          path: 'courseCreator',
          select: '_id name',
        },
      })
      .sort({ enrolledAt: -1 })
      .lean();

    // Filter out enrollments where courseId is null (draft, archived, or nonexistent courses)
    const validEnrollments = enrollments.filter(
      (e) => e.courseId && typeof e.courseId === 'object' && e.courseId._id
    );

    // If student has no valid published course enrollments, return safe empty response
    if (validEnrollments.length === 0) {
      return {
        student: safeStudent,
        stats: {
          totalEnrollments: 0,
          activeEnrollments: 0,
          completedEnrollments: 0,
          inProgressCourses: 0,
          completedCourses: 0,
        },
        courses: [],
        recentCourses: [],
      };
    }

    // 3. Batch query course hierarchy (Modules and Topics) to prevent N+1 queries
    const courseIds = validEnrollments.map((e) => e.courseId._id);

    const modules = await Module.find({ courseId: { $in: courseIds } })
      .select('_id courseId')
      .lean();

    // Map module ID to its parent course ID for strict hierarchy validation
    const moduleCourseMap = new Map();
    for (const m of modules) {
      moduleCourseMap.set(m._id.toString(), m.courseId.toString());
    }

    const moduleIds = modules.map((m) => m._id);

    const topics = await Topic.find({
      courseId: { $in: courseIds },
      moduleId: { $in: moduleIds },
    })
      .select('_id courseId moduleId')
      .lean();

    // Map total valid topics and valid topic IDs per course
    const validTopicIdsByCourse = new Map();
    const courseValidTopicIdSets = new Map();
    const allValidTopicIds = [];

    for (const cId of courseIds) {
      const cIdStr = cId.toString();
      validTopicIdsByCourse.set(cIdStr, []);
      courseValidTopicIdSets.set(cIdStr, new Set());
    }

    for (const t of topics) {
      const cIdStr = t.courseId.toString();
      const mIdStr = t.moduleId ? t.moduleId.toString() : '';

      // Verify strict hierarchy: topic's module must belong to the exact same course
      if (moduleCourseMap.get(mIdStr) === cIdStr && validTopicIdsByCourse.has(cIdStr)) {
        validTopicIdsByCourse.get(cIdStr).push(t._id);
        courseValidTopicIdSets.get(cIdStr).add(t._id.toString());
        allValidTopicIds.push(t._id);
      }
    }

    // 4. Batch query student's completed topic progress for valid topics
    const completedProgress =
      allValidTopicIds.length > 0
        ? await TopicProgress.find({
            userId: userObjId,
            courseId: { $in: courseIds },
            topicId: { $in: allValidTopicIds },
          })
            .select('courseId topicId')
            .lean()
        : [];

    // Map completed topic IDs per course (using Sets to strictly guarantee deduplication)
    const completedTopicsByCourse = new Map();
    for (const cId of courseIds) {
      completedTopicsByCourse.set(cId.toString(), new Set());
    }

    for (const p of completedProgress) {
      const cIdStr = p.courseId.toString();
      const topicIdStr = p.topicId.toString();
      const validSet = courseValidTopicIdSets.get(cIdStr);

      // Verify that the completed topic is confirmed valid for this exact course
      if (validSet && validSet.has(topicIdStr)) {
        completedTopicsByCourse.get(cIdStr).add(topicIdStr);
      }
    }

    // 5. Batch query published assessments for these enrolled courses
    const publishedAssessments = await Assessment.find({
      courseId: { $in: courseIds },
      status: 'published',
    })
      .select('_id courseId type')
      .lean();

    const publishedAssessmentsByCourse = new Map();
    const allPublishedAssessmentIds = [];
    for (const cId of courseIds) {
      publishedAssessmentsByCourse.set(cId.toString(), []);
    }
    for (const a of publishedAssessments) {
      const cIdStr = a.courseId.toString();
      if (publishedAssessmentsByCourse.has(cIdStr)) {
        publishedAssessmentsByCourse.get(cIdStr).push(a._id);
        allPublishedAssessmentIds.push(a._id);
      }
    }

    // Batch query student's passed attempts for valid published assessments
    const passedAttempts =
      allPublishedAssessmentIds.length > 0
        ? await AssessmentAttempt.find({
            userId: userObjId,
            courseId: { $in: courseIds },
            assessmentId: { $in: allPublishedAssessmentIds },
            status: { $in: ['completed', 'timed_out'] },
            isPassed: true,
          })
            .select('courseId assessmentId')
            .lean()
        : [];

    const passedAssessmentsByCourse = new Map();
    for (const cId of courseIds) {
      passedAssessmentsByCourse.set(cId.toString(), new Set());
    }
    for (const att of passedAttempts) {
      const cIdStr = att.courseId.toString();
      const aIdStr = att.assessmentId.toString();
      if (passedAssessmentsByCourse.has(cIdStr)) {
        passedAssessmentsByCourse.get(cIdStr).add(aIdStr);
      }
    }

    // 6. Construct course summaries with verified progress and assessment metrics
    const courseSummaries = validEnrollments.map((enrollment) => {
      const course = enrollment.courseId;
      const cIdStr = course._id.toString();
      const courseCreator =
        course.courseCreator && typeof course.courseCreator === 'object'
          ? {
              id: course.courseCreator._id.toString(),
              name: course.courseCreator.name,
            }
          : null;

      const totalTopics = validTopicIdsByCourse.get(cIdStr)?.length || 0;
      const completedTopics = completedTopicsByCourse.get(cIdStr)?.size || 0;
      const totalAssessments = publishedAssessmentsByCourse.get(cIdStr)?.length || 0;
      const passedAssessments = passedAssessmentsByCourse.get(cIdStr)?.size || 0;
      const allAssessmentsPassed = totalAssessments === 0 || passedAssessments >= totalAssessments;

      const { completionPercentage, isCompleted: isTopicsCompleted } = calculateProgressMetrics(
        totalTopics,
        completedTopics
      );

      const isCompleted = isTopicsCompleted && allAssessmentsPassed;

      return {
        id: cIdStr,
        courseId: cIdStr,
        title: course.title,
        description: course.description,
        category: course.category,
        thumbnail: course.thumbnail || '',
        courseCreator,
        enrolledAt: enrollment.enrolledAt,
        enrollmentDate: enrollment.enrolledAt,
        enrollmentStatus: enrollment.status,
        totalTopics,
        completedTopics,
        totalAssessments,
        passedAssessments,
        allAssessmentsPassed,
        completionPercentage,
        isCompleted,
      };
    });

    // 7. Aggregate dashboard metrics
    let inProgressCount = 0;
    let completedCoursesCount = 0;

    for (const c of courseSummaries) {
      if (c.isCompleted) {
        completedCoursesCount++;
      } else if (c.completedTopics > 0 || c.passedAssessments > 0) {
        inProgressCount++;
      }
    }

    const activeEnrollmentsCount = validEnrollments.filter(
      (e) => e.status === 'active'
    ).length;

    const completedEnrollmentsCount = validEnrollments.filter(
      (e) => e.status === 'completed'
    ).length;

    const stats = {
      totalEnrollments: validEnrollments.length,
      activeEnrollments: activeEnrollmentsCount,
      completedEnrollments: completedEnrollmentsCount,
      inProgressCourses: inProgressCount,
      completedCourses: completedCoursesCount,
    };

    // Recent courses (top 5 sorted by enrolledAt descending)
    const recentCourses = courseSummaries.slice(0, 5);

    return {
      student: safeStudent,
      stats,
      courses: courseSummaries,
      recentCourses,
    };
  }
}

const studentDashboardService = new StudentDashboardService();
export default studentDashboardService;
