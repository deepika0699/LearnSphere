import studentEnrollmentService from '../services/studentEnrollmentService.js';

/**
 * POST /api/student/enroll/:courseId
 * Enrolls the authenticated student in a published course.
 */
export const enrollInCourse = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { courseId } = req.params;

    const result = await studentEnrollmentService.enrollStudent({
      userId,
      courseId,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Successfully enrolled in course',
      data: {
        enrollment: result,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/student/enrollments
 * Retrieves the paginated list of enrollments for the authenticated student.
 */
export const getEnrollments = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { page, limit, status } = req.query;

    const result = await studentEnrollmentService.getStudentEnrollments({
      userId,
      page,
      limit,
      status,
    });

    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/student/enrollments/:courseId
 * Retrieves a single enrollment for the authenticated student by course ID.
 */
export const getEnrollmentByCourseId = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { courseId } = req.params;

    const result = await studentEnrollmentService.getStudentEnrollmentByCourseId({
      userId,
      courseId,
    });

    return res.status(200).json({
      status: 'success',
      data: {
        enrollment: result,
      },
    });
  } catch (err) {
    return next(err);
  }
};
