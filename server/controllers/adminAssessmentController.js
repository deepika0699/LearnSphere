import assessmentService from '../services/assessmentService.js';

/**
 * GET /api/admin/courses/:courseId/assessments
 * List all assessments for any course.
 */
export const getCourseAssessmentsHandler = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const assessments = await assessmentService.getAssessmentsByCourse({
      courseId,
      user: req.user,
    });

    return res.status(200).json({
      status: 'success',
      data: {
        assessments,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/admin/assessments/:assessmentId
 * Admin gets assessment details by ID.
 */
export const getAssessmentByIdHandler = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const assessment = await assessmentService.getAssessmentById({
      assessmentId,
      user: req.user,
    });

    return res.status(200).json({
      status: 'success',
      data: {
        assessment,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/admin/courses/:courseId/assessments
 * Admin creates an assessment for any course.
 */
export const createAssessmentHandler = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const assessment = await assessmentService.createAssessment({
      courseId,
      data: req.body,
      user: req.user,
    });

    return res.status(201).json({
      status: 'success',
      message: 'Assessment created successfully by admin',
      data: {
        assessment,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PUT /api/admin/assessments/:assessmentId
 * Admin updates an assessment.
 */
export const updateAssessmentHandler = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const assessment = await assessmentService.updateAssessment({
      assessmentId,
      data: req.body,
      user: req.user,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Assessment updated successfully by admin',
      data: {
        assessment,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /api/admin/assessments/:assessmentId
 * Admin archives or deletes an assessment.
 */
export const deleteAssessmentHandler = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const result = await assessmentService.archiveOrDeleteAssessment({
      assessmentId,
      user: req.user,
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
 * GET /api/admin/assessments/:assessmentId/stats
 * Admin views aggregate pass/fail and performance stats for an assessment without user personal data.
 */
export const getAssessmentStatsHandler = async (req, res, next) => {
  try {
    const { assessmentId } = req.params;
    const stats = await assessmentService.getAssessmentStats({
      assessmentId,
    });

    return res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export default {
  getCourseAssessmentsHandler,
  getAssessmentByIdHandler,
  createAssessmentHandler,
  updateAssessmentHandler,
  deleteAssessmentHandler,
  getAssessmentStatsHandler,
};
