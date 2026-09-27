import { Router } from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  getCourseAssessmentsHandler,
  getAssessmentByIdHandler,
  createAssessmentHandler,
  updateAssessmentHandler,
  deleteAssessmentHandler,
  getAssessmentStatsHandler,
} from '../controllers/adminAssessmentController.js';

const router = Router();

const courseIdParamValidation = [
  param('courseId').trim().isMongoId().withMessage('Invalid course ID format'),
  validateRequest,
];

const assessmentIdParamValidation = [
  param('assessmentId').trim().isMongoId().withMessage('Invalid assessment ID format'),
  validateRequest,
];

const createAssessmentValidation = [
  param('courseId').trim().isMongoId().withMessage('Invalid course ID format'),
  body('title')
    .exists({ checkNull: true })
    .withMessage('Title is required')
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('type')
    .optional()
    .isIn(['topic', 'course'])
    .withMessage("Type must be either 'topic' or 'course'"),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage("Status must be 'draft', 'published', or 'archived'"),
  body('passingScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Passing score must be between 0 and 100'),
  body('timeLimitMinutes')
    .optional()
    .isInt({ min: 0, max: 300 })
    .withMessage('Time limit must be between 0 and 300 minutes'),
  body('maxAttempts')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Max attempts must be between 0 and 100'),
  body('questions')
    .optional()
    .isArray()
    .withMessage('Questions must be an array'),
  validateRequest,
];

const updateAssessmentValidation = [
  param('assessmentId').trim().isMongoId().withMessage('Invalid assessment ID format'),
  body('title')
    .optional()
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('status')
    .optional()
    .isIn(['draft', 'published', 'archived'])
    .withMessage("Status must be 'draft', 'published', or 'archived'"),
  body('passingScore')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Passing score must be between 0 and 100'),
  body('timeLimitMinutes')
    .optional()
    .isInt({ min: 0, max: 300 })
    .withMessage('Time limit must be between 0 and 300 minutes'),
  body('maxAttempts')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Max attempts must be between 0 and 100'),
  body('questions')
    .optional()
    .isArray()
    .withMessage('Questions must be an array'),
  validateRequest,
];

// GET /api/admin/assessments/courses/:courseId
router.get('/courses/:courseId', courseIdParamValidation, getCourseAssessmentsHandler);

// GET /api/admin/assessments/:assessmentId
router.get('/:assessmentId', assessmentIdParamValidation, getAssessmentByIdHandler);

// POST /api/admin/assessments/courses/:courseId
router.post('/courses/:courseId', createAssessmentValidation, createAssessmentHandler);

// PUT /api/admin/assessments/:assessmentId
router.put('/:assessmentId', updateAssessmentValidation, updateAssessmentHandler);

// DELETE /api/admin/assessments/:assessmentId
router.delete('/:assessmentId', assessmentIdParamValidation, deleteAssessmentHandler);

// GET /api/admin/assessments/:assessmentId/stats
router.get('/:assessmentId/stats', assessmentIdParamValidation, getAssessmentStatsHandler);

export {
  courseIdParamValidation,
  createAssessmentValidation,
  assessmentIdParamValidation,
  updateAssessmentValidation,
};

export default router;

