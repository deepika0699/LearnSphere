import studentProgressService from '../services/studentProgressService.js';

/**
 * PUT /api/student/progress/:courseId/:topicId
 * Marks an educational topic as completed for the authenticated student.
 */
export const markTopicCompleted = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { courseId, topicId } = req.params;

    const result = await studentProgressService.completeTopic({
      userId,
      courseId,
      topicId,
    });

    return res.status(200).json({
      status: 'success',
      message: result.alreadyCompleted
        ? 'Topic progress already completed'
        : 'Topic marked as completed',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /api/student/progress/:courseId/:topicId
 * Marks an educational topic as incomplete by removing the authenticated student's progress record.
 */
export const markTopicIncomplete = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { courseId, topicId } = req.params;

    const result = await studentProgressService.uncompleteTopic({
      userId,
      courseId,
      topicId,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Topic marked as incomplete',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/student/progress/:courseId
 * Retrieves all completed topic records for the authenticated student in a course.
 */
export const getCourseProgress = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { courseId } = req.params;

    const result = await studentProgressService.getCourseProgress({
      userId,
      courseId,
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
 * GET /api/student/progress/:courseId/summary
 * Retrieves an accurate progress summary (total, completed, completion percentage) for the authenticated student.
 */
export const getCourseProgressSummary = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const { courseId } = req.params;

    const result = await studentProgressService.getCourseProgressSummary({
      userId,
      courseId,
    });

    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};
