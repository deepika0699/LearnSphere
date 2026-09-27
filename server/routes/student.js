import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/authenticate.js';

import { requireStudent } from '../middleware/studentAuthorization.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  enrollInCourse,
  getEnrollments,
  getEnrollmentByCourseId,
} from '../controllers/studentEnrollmentController.js';
import {
  markTopicCompleted,
  markTopicIncomplete,
  getCourseProgress,
  getCourseProgressSummary,
} from '../controllers/studentProgressController.js';
import { getStudentDashboard } from '../controllers/studentDashboardController.js';
import {
  getAssessmentHandler,
  getCourseAssessmentsHandler,
  startAttemptHandler,
  submitAttemptHandler,
  getAttemptsHandler,
  getAttemptReviewHandler,
} from '../controllers/studentAssessmentController.js';

const router = Router();


/**
 * Router-Level Authorization Boundary:
 * All routes under /api/student strictly require:
 * 1. Valid authentication (JWT access token, active non-deleted user).
 * 2. Database-authoritative role matching canonical 'student'.
 *
 * Admins, courseCreators, unauthenticated requests, and inactive accounts fail closed.
 */
router.use(authenticate, requireStudent);

/**
 * Validation rules for POST /api/student/enroll/:courseId
 */
const enrollValidation = [
  param('courseId')
    .trim()
    .isMongoId()
    .withMessage('Invalid course ID format'),
  validateRequest,
];

/**
 * Validation rules for GET /api/student/enrollments
 */
const getEnrollmentsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be an integer between 1 and 50'),
  query('status')
    .optional()
    .isString()
    .isIn(['active', 'completed', 'withdrawn'])
    .withMessage('Invalid status parameter. Must be one of: active, completed, withdrawn'),
  validateRequest,
];

/**
 * Validation rules for GET /api/student/enrollments/:courseId
 */
const getEnrollmentByCourseIdValidation = [
  param('courseId')
    .trim()
    .isMongoId()
    .withMessage('Invalid course ID format'),
  validateRequest,
];

/**
 * Validation rules for PUT / DELETE /api/student/progress/:courseId/:topicId
 */
const topicProgressParamValidation = [
  param('courseId')
    .trim()
    .isMongoId()
    .withMessage('Invalid course ID format'),
  param('topicId')
    .trim()
    .isMongoId()
    .withMessage('Invalid topic ID format'),
  validateRequest,
];

/**
 * Validation rules for GET /api/student/progress/:courseId and summary
 */
const courseProgressParamValidation = [
  param('courseId')
    .trim()
    .isMongoId()
    .withMessage('Invalid course ID format'),
  validateRequest,
];

// Mount enrollment endpoints
router.post('/enroll/:courseId', enrollValidation, enrollInCourse);
router.get('/enrollments', getEnrollmentsValidation, getEnrollments);
router.get('/enrollments/:courseId', getEnrollmentByCourseIdValidation, getEnrollmentByCourseId);

// Mount dashboard endpoint
router.get('/dashboard', getStudentDashboard);

// Mount progress endpoints
router.put('/progress/:courseId/:topicId', topicProgressParamValidation, markTopicCompleted);
router.delete('/progress/:courseId/:topicId', topicProgressParamValidation, markTopicIncomplete);
router.get('/progress/:courseId/summary', courseProgressParamValidation, getCourseProgressSummary);
router.get('/progress/:courseId', courseProgressParamValidation, getCourseProgress);

// ---------------------------------------------------------------------------
// Student Assessment Endpoints (/api/student/courses/:courseId/assessments)
// ---------------------------------------------------------------------------

const studentCourseAndAssessmentIdValidation = [
  param('courseId').trim().isMongoId().withMessage('Invalid course ID format'),
  param('assessmentId').trim().isMongoId().withMessage('Invalid assessment ID format'),
  validateRequest,
];

const studentSubmitAttemptValidation = [
  param('courseId').trim().isMongoId().withMessage('Invalid course ID format'),
  param('assessmentId').trim().isMongoId().withMessage('Invalid assessment ID format'),
  body('answers').optional().isArray().withMessage('Answers must be an array'),
  validateRequest,
];

const studentAttemptReviewValidation = [
  param('courseId').trim().isMongoId().withMessage('Invalid course ID format'),
  param('assessmentId').trim().isMongoId().withMessage('Invalid assessment ID format'),
  param('attemptId').trim().isMongoId().withMessage('Invalid attempt ID format'),
  validateRequest,
];

// GET /api/student/courses/:courseId/assessments - List published assessments for a course with attempt overview
router.get(
  '/courses/:courseId/assessments',
  courseProgressParamValidation,
  getCourseAssessmentsHandler
);

// GET /api/student/courses/:courseId/assessments/:assessmentId - View assessment questions (sanitized)
router.get(
  '/courses/:courseId/assessments/:assessmentId',
  studentCourseAndAssessmentIdValidation,
  getAssessmentHandler
);

// POST /api/student/courses/:courseId/assessments/:assessmentId/start - Start or resume attempt
router.post(
  '/courses/:courseId/assessments/:assessmentId/start',
  studentCourseAndAssessmentIdValidation,
  startAttemptHandler
);

// POST /api/student/courses/:courseId/assessments/:assessmentId/submit - Submit attempt
router.post(
  '/courses/:courseId/assessments/:assessmentId/submit',
  studentSubmitAttemptValidation,
  submitAttemptHandler
);

// GET /api/student/courses/:courseId/assessments/:assessmentId/attempts - List student's attempts
router.get(
  '/courses/:courseId/assessments/:assessmentId/attempts',
  studentCourseAndAssessmentIdValidation,
  getAttemptsHandler
);

// GET /api/student/courses/:courseId/assessments/:assessmentId/attempts/:attemptId - View finalized attempt review
router.get(
  '/courses/:courseId/assessments/:assessmentId/attempts/:attemptId',
  studentAttemptReviewValidation,
  getAttemptReviewHandler
);

export default router;

