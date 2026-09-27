import studentAssessmentService from '../services/studentAssessmentService.js';

/**
 * GET /api/student/courses/:courseId/assessments/:assessmentId
 * Get assessment details for taking/previewing.
 * STRICT: Excludes correctOptionId and explanation.
 */
export const getAssessmentHandler = async (req, res, next) => {
  try {
    const studentId = req.user?.userId || req.user?.id;
    const { courseId, assessmentId } = req.params;

    const result = await studentAssessmentService.getAssessmentForStudent(courseId, assessmentId, studentId);

    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/student/courses/:courseId/assessments/:assessmentId/start
 * Starts a new assessment attempt or resumes an existing in-progress attempt.
 */
export const startAttemptHandler = async (req, res, next) => {
  try {
    const studentId = req.user?.userId || req.user?.id;
    const { courseId, assessmentId } = req.params;

    const result = await studentAssessmentService.startAssessmentAttempt(courseId, assessmentId, studentId);

    const statusCode = result.isResumed ? 200 : 201;

    return res.status(statusCode).json({
      status: 'success',
      message: result.isResumed ? 'Resumed active assessment attempt' : 'Started new assessment attempt',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * POST /api/student/courses/:courseId/assessments/:assessmentId/submit
 * Submits student answers for an active assessment attempt.
 * Calculates score and returns result summary.
 */
export const submitAttemptHandler = async (req, res, next) => {
  try {
    const studentId = req.user?.userId || req.user?.id;
    const { courseId, assessmentId } = req.params;

    // Defense against mass-assignment / client spoofing
    const submissionData = {
      answers: req.body?.answers,
    };

    const result = await studentAssessmentService.submitAssessmentAttempt(
      courseId,
      assessmentId,
      studentId,
      submissionData
    );

    return res.status(200).json({
      status: 'success',
      message: 'Assessment attempt submitted successfully',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/student/courses/:courseId/assessments/:assessmentId/attempts
 * List all past attempts for the authenticated student.
 */
export const getAttemptsHandler = async (req, res, next) => {
  try {
    const studentId = req.user?.userId || req.user?.id;
    const { courseId, assessmentId } = req.params;

    const attempts = await studentAssessmentService.getStudentAttempts(courseId, assessmentId, studentId);

    return res.status(200).json({
      status: 'success',
      data: {
        attempts,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/student/courses/:courseId/assessments/:assessmentId/attempts/:attemptId
 * Review a specific completed attempt with questions, student answers, correct answers, and explanations.
 */
export const getAttemptReviewHandler = async (req, res, next) => {
  try {
    const studentId = req.user?.userId || req.user?.id;
    const { courseId, assessmentId, attemptId } = req.params;

    const result = await studentAssessmentService.getStudentAttemptReview(
      courseId,
      assessmentId,
      attemptId,
      studentId
    );

    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/student/courses/:courseId/assessments
 * List all published assessments for a course with the authenticated student's attempt overview.
 */
export const getCourseAssessmentsHandler = async (req, res, next) => {
  try {
    const studentId = req.user?.userId || req.user?.id;
    const { courseId } = req.params;

    const result = await studentAssessmentService.getCourseAssessmentsForStudent(courseId, studentId);

    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};

export default {
  getAssessmentHandler,
  getCourseAssessmentsHandler,
  startAttemptHandler,
  submitAttemptHandler,
  getAttemptsHandler,
  getAttemptReviewHandler,
};
