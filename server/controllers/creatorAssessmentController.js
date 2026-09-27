import assessmentService from '../services/assessmentService.js';

/**
 * POST /api/creator/courses/:courseId/assessments
 * Create a new assessment for a course.
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
      message: 'Assessment created successfully',
      data: {
        assessment,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/creator/courses/:courseId/assessments
 * List all assessments for a course.
 */
export const getAssessmentsHandler = async (req, res, next) => {
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
 * GET /api/creator/courses/:courseId/assessments/:assessmentId
 * Get a specific assessment by ID with authoring details.
 */
export const getAssessmentByIdHandler = async (req, res, next) => {
  try {
    const { courseId, assessmentId } = req.params;
    const assessment = await assessmentService.getAssessmentById({
      assessmentId,
      courseId,
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
 * PUT /api/creator/courses/:courseId/assessments/:assessmentId
 * Update an assessment.
 */
export const updateAssessmentHandler = async (req, res, next) => {
  try {
    const { courseId, assessmentId } = req.params;
    const assessment = await assessmentService.updateAssessment({
      assessmentId,
      courseId,
      data: req.body,
      user: req.user,
    });

    return res.status(200).json({
      status: 'success',
      message: 'Assessment updated successfully',
      data: {
        assessment,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * DELETE /api/creator/courses/:courseId/assessments/:assessmentId
 * Delete or archive an assessment.
 */
export const deleteAssessmentHandler = async (req, res, next) => {
  try {
    const { courseId, assessmentId } = req.params;
    const result = await assessmentService.archiveOrDeleteAssessment({
      assessmentId,
      courseId,
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

export default {
  createAssessmentHandler,
  getAssessmentsHandler,
  getAssessmentByIdHandler,
  updateAssessmentHandler,
  deleteAssessmentHandler,
};
