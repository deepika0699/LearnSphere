import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Enrollment, { ENROLLMENT_STATUSES } from '../models/Enrollment.js';

/**
 * Formats a Course document into a safe, client-facing summary object.
 * Strictly omits draft/archived status, internal flags, and creator private data.
 *
 * @param {Object} course - Course document or lean object.
 * @returns {Object|null} Sanitized course summary.
 */
export const formatSafeCourse = (course) => {
  if (!course) return null;
  const creator = course.courseCreator;
  return {
    id: course._id ? course._id.toString() : course.id,
    title: course.title,
    description: course.description,
    category: course.category,
    thumbnail: course.thumbnail || '',
    status: course.status,
    courseCreator: creator
      ? {
          id: creator._id ? creator._id.toString() : creator.toString(),
          name: creator.name || 'Course Creator',
        }
      : null,
  };
};

/**
 * Formats an Enrollment document into a safe, client-facing response object.
 * Never exposes passwords, tokens, credentials, or internal Mongoose flags.
 *
 * @param {Object} enrollment - Enrollment document or lean object.
 * @param {Object} [course=null] - Optional populated course document.
 * @returns {Object} Sanitized enrollment record.
 */
export const formatSafeEnrollment = (enrollment, course = null) => {
  const courseData =
    course || (enrollment.courseId && enrollment.courseId.title ? enrollment.courseId : null);

  return {
    id: enrollment._id ? enrollment._id.toString() : enrollment.id,
    userId: enrollment.userId
      ? enrollment.userId._id
        ? enrollment.userId._id.toString()
        : enrollment.userId.toString()
      : undefined,
    courseId: enrollment.courseId
      ? enrollment.courseId._id
        ? enrollment.courseId._id.toString()
        : enrollment.courseId.toString()
      : undefined,
    status: enrollment.status,
    enrolledAt: enrollment.enrolledAt,
    completedAt: enrollment.completedAt || null,
    createdAt: enrollment.createdAt,
    updatedAt: enrollment.updatedAt,
    course: courseData ? formatSafeCourse(courseData) : undefined,
  };
};

/**
 * Student Enrollment Service
 * Encapsulates all business logic for student enrollment operations.
 */
class StudentEnrollmentService {
  /**
   * Enrolls an authenticated student in a published course.
   *
   * @param {Object} params
   * @param {string|mongoose.Types.ObjectId} params.userId - Authenticated student ID.
   * @param {string} params.courseId - Target course ID.
   * @returns {Promise<Object>} Formatted enrollment record with safe course details.
   */
  async enrollStudent({ userId, courseId }) {
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

    const courseObjId = new mongoose.Types.ObjectId(courseId);
    const userObjId = new mongoose.Types.ObjectId(userId);

    // Verify course existence and publication status
    const course = await Course.findById(courseObjId)
      .select('title description category thumbnail status courseCreator createdAt updatedAt')
      .populate('courseCreator', '_id name');

    if (!course) {
      const err = new Error('Course not found');
      err.statusCode = 404;
      throw err;
    }

    if (course.status !== 'published') {
      const err = new Error(
        `Cannot enroll in a course with status '${course.status}'. Only published courses allow enrollment.`
      );
      err.statusCode = 400;
      throw err;
    }

    // Pre-check for existing enrollment
    const existingEnrollment = await Enrollment.findOne({
      userId: userObjId,
      courseId: courseObjId,
    }).select('_id status');

    if (existingEnrollment) {
      const conflictErr = new Error('You are already enrolled in this course.');
      conflictErr.statusCode = 409;
      throw conflictErr;
    }

    // Create enrollment with explicit attributes to prevent mass assignment
    try {
      const newEnrollment = await Enrollment.create({
        userId: userObjId,
        courseId: courseObjId,
        status: 'active',
        enrolledAt: new Date(),
      });

      return formatSafeEnrollment(newEnrollment, course);
    } catch (err) {
      // Safely handle race condition on compound unique index (userId, courseId)
      if (err.code === 11000) {
        const conflictErr = new Error('You are already enrolled in this course.');
        conflictErr.statusCode = 409;
        throw conflictErr;
      }
      throw err;
    }
  }

  /**
   * Retrieves paginated enrollments for the authenticated student.
   * Returns only enrollments for courses that are currently published.
   *
   * @param {Object} params
   * @param {string|mongoose.Types.ObjectId} params.userId - Authenticated student ID.
   * @param {number|string} [params.page=1]
   * @param {number|string} [params.limit=20]
   * @param {string} [params.status]
   * @returns {Promise<Object>} { enrollments, pagination }
   */
  async getStudentEnrollments({ userId, page = 1, limit = 20, status }) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      throw err;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const userObjId = new mongoose.Types.ObjectId(userId);
    const matchFilter = { userId: userObjId };

    if (status && typeof status === 'string' && ENROLLMENT_STATUSES.includes(status)) {
      matchFilter.status = status;
    }

    // Pipeline to join courses, enforce published-only visibility, join creator safely, and paginate
    const pipeline = [
      { $match: matchFilter },
      {
        $lookup: {
          from: 'courses',
          localField: 'courseId',
          foreignField: '_id',
          as: 'course',
        },
      },
      { $unwind: '$course' },
      { $match: { 'course.status': 'published' } },
      {
        $lookup: {
          from: 'users',
          localField: 'course.courseCreator',
          foreignField: '_id',
          as: 'courseCreator',
        },
      },
      {
        $unwind: {
          path: '$courseCreator',
          preserveNullAndEmptyArrays: true,
        },
      },
      { $sort: { enrolledAt: -1 } },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [{ $skip: skip }, { $limit: limitNum }],
        },
      },
    ];

    const [aggregateResult] = await Enrollment.aggregate(pipeline);

    const total = aggregateResult?.metadata[0]?.total || 0;
    const rawData = aggregateResult?.data || [];

    const formattedEnrollments = rawData.map((item) => ({
      id: item._id.toString(),
      userId: item.userId.toString(),
      courseId: item.courseId.toString(),
      status: item.status,
      enrolledAt: item.enrolledAt,
      completedAt: item.completedAt || null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      course: {
        id: item.course._id.toString(),
        title: item.course.title,
        description: item.course.description,
        category: item.course.category,
        thumbnail: item.course.thumbnail || '',
        status: item.course.status,
        courseCreator: item.courseCreator
          ? {
              id: item.courseCreator._id.toString(),
              name: item.courseCreator.name || 'Course Creator',
            }
          : null,
      },
    }));

    return {
      enrollments: formattedEnrollments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
        hasMore: pageNum * limitNum < total,
      },
    };
  }

  /**
   * Retrieves a single enrollment by course ID for the authenticated student.
   *
   * @param {Object} params
   * @param {string|mongoose.Types.ObjectId} params.userId - Authenticated student ID.
   * @param {string} params.courseId - Target course ID.
   * @returns {Promise<Object>} Formatted enrollment record with safe course details.
   */
  async getStudentEnrollmentByCourseId({ userId, courseId }) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      throw err;
    }

    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      const err = new Error('Enrollment not found');
      err.statusCode = 404;
      throw err;
    }

    const userObjId = new mongoose.Types.ObjectId(userId);
    const courseObjId = new mongoose.Types.ObjectId(courseId);

    const enrollment = await Enrollment.findOne({
      userId: userObjId,
      courseId: courseObjId,
    }).populate({
      path: 'courseId',
      select: 'title description category thumbnail status courseCreator createdAt updatedAt',
      populate: { path: 'courseCreator', select: '_id name' },
    });

    if (!enrollment || !enrollment.courseId || enrollment.courseId.status !== 'published') {
      const err = new Error('Enrollment not found');
      err.statusCode = 404;
      throw err;
    }

    return formatSafeEnrollment(enrollment, enrollment.courseId);
  }
}

const studentEnrollmentService = new StudentEnrollmentService();
export default studentEnrollmentService;
