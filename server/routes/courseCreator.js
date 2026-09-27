import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../middleware/authenticate.js';
import {
  requireCourseCreator,
  requireCourseOwnership,
  requireModuleBelongsToCourse,
} from '../middleware/courseCreatorAuthorization.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
} from '../controllers/courseCreatorCourseController.js';
import {
  createModule,
  getModules,
  getModuleById as getCreatorModuleById,
  updateModule,
  reorderModules,
  deleteModule,
} from '../controllers/courseCreatorModuleController.js';
import {
  createTopic,
  getTopics,
  getTopicById as getCreatorTopicById,
  updateTopic,
  deleteTopic,
  reorderTopics,
  getTopicContent,
  updateTopicContent,
} from '../controllers/courseCreatorTopicController.js';
import {
  createAssessmentHandler,
  getAssessmentsHandler,
  getAssessmentByIdHandler,
  updateAssessmentHandler,
  deleteAssessmentHandler,
} from '../controllers/creatorAssessmentController.js';

const router = Router();


/**
 * Router-Level Authorization Boundary:
 * All routes under /api/creator require:
 * 1. Valid authentication (valid JWT access token, non-expired, active user).
 * 2. Database-authoritative role strictly matching 'courseCreator'.
 *
 * Students, admins, unauthenticated users, or inactive accounts fail closed.
 */
router.use(authenticate, requireCourseCreator);

/**
 * Validation rules for POST /api/creator/courses
 */
const createCourseValidation = [
  body('title')
    .exists({ checkNull: true })
    .withMessage('Title is required')
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage('Title must be between 3 and 150 characters'),
  body('description')
    .exists({ checkNull: true })
    .withMessage('Description is required')
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  body('category')
    .exists({ checkNull: true })
    .withMessage('Category is required')
    .isString()
    .withMessage('Category must be a string')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  body('thumbnail')
    .optional()
    .isString()
    .withMessage('Thumbnail must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Thumbnail URL cannot exceed 500 characters'),
  body('syllabus')
    .optional()
    .isArray()
    .withMessage('Syllabus must be an array'),
  body('syllabus.*.title')
    .optional()
    .isString()
    .withMessage('Syllabus item title must be a string')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Syllabus item title must be between 1 and 200 characters'),
  body('syllabus.*.description')
    .optional()
    .isString()
    .withMessage('Syllabus item description must be a string')
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Syllabus item description cannot exceed 1000 characters'),
  body('syllabus.*.order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Syllabus item order must be a non-negative integer'),
  body('status')
    .optional()
    .custom((value) => {
      if (value === 'published') {
        throw new Error('Course creators cannot directly publish courses');
      }
      if (value && !['draft', 'archived'].includes(value)) {
        throw new Error('Status must be draft or archived');
      }
      return true;
    }),
  validateRequest,
];

/**
 * Validation rules for GET /api/creator/courses
 */
const getCoursesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
  query('search')
    .optional()
    .isString()
    .withMessage('Search query must be a string')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query cannot exceed 100 characters'),
  query('status')
    .optional()
    .isString()
    .withMessage('Status must be a string')
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
  query('category')
    .optional()
    .isString()
    .withMessage('Category must be a string')
    .trim()
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters'),
  validateRequest,
];

/**
 * Validation rules for GET /api/creator/courses/:courseId
 */
const getCourseByIdValidation = [
  param('courseId')
    .trim()
    .isMongoId()
    .withMessage('Invalid course ID format'),
  validateRequest,
];

/**
 * Validation rules for PATCH /api/creator/courses/:courseId
 */
const updateCourseValidation = [
  param('courseId')
    .trim()
    .isMongoId()
    .withMessage('Invalid course ID format'),
  body('title')
    .optional()
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage('Title must be between 3 and 150 characters'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Description must be between 10 and 5000 characters'),
  body('category')
    .optional()
    .isString()
    .withMessage('Category must be a string')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters'),
  body('thumbnail')
    .optional()
    .isString()
    .withMessage('Thumbnail must be a string')
    .trim()
    .isLength({ max: 500 })
    .withMessage('Thumbnail URL cannot exceed 500 characters'),
  body('syllabus')
    .optional()
    .isArray()
    .withMessage('Syllabus must be an array'),
  body('syllabus.*.title')
    .optional()
    .isString()
    .withMessage('Syllabus item title must be a string')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Syllabus item title must be between 1 and 200 characters'),
  body('syllabus.*.description')
    .optional()
    .isString()
    .withMessage('Syllabus item description must be a string')
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Syllabus item description cannot exceed 1000 characters'),
  body('syllabus.*.order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Syllabus item order must be a non-negative integer'),
  body('status')
    .optional()
    .custom((value) => {
      if (value === 'published') {
        throw new Error('Course creators cannot directly publish courses');
      }
      if (value && !['draft', 'archived'].includes(value)) {
        throw new Error('Status must be draft or archived');
      }
      return true;
    }),
  body().custom((value, { req }) => {
    // Explicitly reject attempts to alter ownership
    if (req.body.courseCreator !== undefined) {
      throw new Error('Course creator ownership cannot be modified');
    }
    return true;
  }),
  validateRequest,
];

/**
 * GET /api/creator/status
 * Authorization boundary verification endpoint.
 */
router.get('/status', (req, res) => {
  return res.status(200).json({
    status: 'success',
    message: 'Course Creator authorization boundary active',
    data: {
      creatorId: req.user.userId,
      role: req.user.role,
    },
  });
});

/**
 * Course Creator Courses Routes:
 * Protected by router-level authenticate + requireCourseCreator
 */

// GET /api/creator/courses - List authenticated creator's courses
router.get('/courses', getCoursesValidation, getCourses);

// POST /api/creator/courses - Create course owned by authenticated creator
router.post('/courses', createCourseValidation, createCourse);

// GET /api/creator/courses/:courseId - Get course by ID (strictly owned by creator)
router.get(
  '/courses/:courseId',
  getCourseByIdValidation,
  requireCourseOwnership({ paramName: 'courseId', leakPrevention: true }),
  getCourseById
);

// PATCH /api/creator/courses/:courseId - Update course (strictly owned by creator)
router.patch(
  '/courses/:courseId',
  updateCourseValidation,
  requireCourseOwnership({ paramName: 'courseId', leakPrevention: true }),
  updateCourse
);

/**
 * Validation rules for Course Creator Modules
 */
const courseIdParamValidation = [
  param('courseId')
    .trim()
    .isMongoId()
    .withMessage('Invalid course ID format'),
  validateRequest,
];

const courseAndModuleIdParamValidation = [
  param('courseId')
    .trim()
    .isMongoId()
    .withMessage('Invalid course ID format'),
  param('moduleId')
    .trim()
    .isMongoId()
    .withMessage('Invalid module ID format'),
  validateRequest,
];

const createModuleValidation = [
  param('courseId')
    .trim()
    .isMongoId()
    .withMessage('Invalid course ID format'),
  body().custom((_value, { req }) => {
    const allowedKeys = ['title', 'description', 'order'];
    const bodyKeys = Object.keys(req.body || {});
    const unexpected = bodyKeys.filter((key) => !allowedKeys.includes(key));
    if (unexpected.length > 0) {
      throw new Error(`Unexpected field(s) in request body: ${unexpected.join(', ')}`);
    }
    if (req.body.courseId !== undefined || req.body._id !== undefined || req.body.courseCreator !== undefined) {
      throw new Error('Course ID, _id, and course creator cannot be set in request body');
    }
    return true;
  }),
  body('title')
    .exists({ checkNull: true })
    .withMessage('Title is required')
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Title must be between 2 and 150 characters'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
  validateRequest,
];

const updateModuleValidation = [
  param('courseId')
    .trim()
    .isMongoId()
    .withMessage('Invalid course ID format'),
  param('moduleId')
    .trim()
    .isMongoId()
    .withMessage('Invalid module ID format'),
  body().custom((_value, { req }) => {
    const allowedKeys = ['title', 'description', 'order'];
    const bodyKeys = Object.keys(req.body || {});
    const unexpected = bodyKeys.filter((key) => !allowedKeys.includes(key));
    if (unexpected.length > 0) {
      throw new Error(`Unexpected field(s) in request body: ${unexpected.join(', ')}`);
    }
    if (req.body.courseId !== undefined || req.body._id !== undefined || req.body.courseCreator !== undefined) {
      throw new Error('Course ID, _id, and course creator cannot be modified');
    }
    if (bodyKeys.length === 0) {
      throw new Error('At least one field (title, description, or order) must be provided for update');
    }
    return true;
  }),
  body('title')
    .optional()
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Title must be between 2 and 150 characters'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
  validateRequest,
];

const reorderModulesValidation = [
  param('courseId')
    .trim()
    .isMongoId()
    .withMessage('Invalid course ID format'),
  body().custom((_value, { req }) => {
    const allowedKeys = ['moduleIds'];
    const bodyKeys = Object.keys(req.body || {});
    const unexpected = bodyKeys.filter((key) => !allowedKeys.includes(key));
    if (unexpected.length > 0) {
      throw new Error(`Unexpected field(s) in request body: ${unexpected.join(', ')}`);
    }
    return true;
  }),
  body('moduleIds')
    .exists({ checkNull: true })
    .withMessage('moduleIds is required')
    .isArray()
    .withMessage('moduleIds must be an array of module IDs')
    .custom((ids) => {
      if (!Array.isArray(ids)) return false;
      for (const id of ids) {
        if (typeof id !== 'string' || !/^[0-9a-fA-F]{24}$/.test(id.trim())) {
          throw new Error('Each module ID must be a valid 24-character hexadecimal MongoId string');
        }
      }
      const stringIds = ids.map((id) => id.trim());
      const unique = new Set(stringIds);
      if (unique.size !== stringIds.length) {
        throw new Error('Duplicate module IDs are not allowed in reorder list');
      }
      return true;
    }),
  validateRequest,
];

/**
 * Course Creator Module Routes:
 * Scoped under /api/creator/courses/:courseId/modules
 * Protected by router-level authenticate + requireCourseCreator
 * and endpoint-level requireCourseOwnership({ paramName: 'courseId', leakPrevention: true })
 */

// GET /api/creator/courses/:courseId/modules - List modules belonging to creator's course
router.get(
  '/courses/:courseId/modules',
  courseIdParamValidation,
  requireCourseOwnership({ paramName: 'courseId', leakPrevention: true }),
  getModules
);

// POST /api/creator/courses/:courseId/modules - Create module under creator's course
router.post(
  '/courses/:courseId/modules',
  createModuleValidation,
  requireCourseOwnership({ paramName: 'courseId', leakPrevention: true }),
  createModule
);

// PATCH /api/creator/courses/:courseId/modules/reorder - Reorder modules in creator's course
// NOTE: Mounted BEFORE /:moduleId to prevent matching "reorder" as a moduleId
router.patch(
  '/courses/:courseId/modules/reorder',
  reorderModulesValidation,
  requireCourseOwnership({ paramName: 'courseId', leakPrevention: true }),
  reorderModules
);

// GET /api/creator/courses/:courseId/modules/:moduleId - Get module by ID
router.get(
  '/courses/:courseId/modules/:moduleId',
  courseAndModuleIdParamValidation,
  requireCourseOwnership({ paramName: 'courseId', leakPrevention: true }),
  getCreatorModuleById
);

// PATCH /api/creator/courses/:courseId/modules/:moduleId - Update module
router.patch(
  '/courses/:courseId/modules/:moduleId',
  updateModuleValidation,
  requireCourseOwnership({ paramName: 'courseId', leakPrevention: true }),
  updateModule
);

// DELETE /api/creator/courses/:courseId/modules/:moduleId - Delete module and its child topics
router.delete(
  '/courses/:courseId/modules/:moduleId',
  courseAndModuleIdParamValidation,
  requireCourseOwnership({ paramName: 'courseId', leakPrevention: true }),
  deleteModule
);

/**
 * Validation rules for Course Creator Topics
 */
const courseModuleAndTopicIdParamValidation = [
  param('courseId')
    .trim()
    .isMongoId()
    .withMessage('Invalid course ID format'),
  param('moduleId')
    .trim()
    .isMongoId()
    .withMessage('Invalid module ID format'),
  param('topicId')
    .trim()
    .isMongoId()
    .withMessage('Invalid topic ID format'),
  validateRequest,
];

const createTopicValidation = [
  param('courseId')
    .trim()
    .isMongoId()
    .withMessage('Invalid course ID format'),
  param('moduleId')
    .trim()
    .isMongoId()
    .withMessage('Invalid module ID format'),
  body().custom((_value, { req }) => {
    const allowedKeys = ['title', 'description', 'order'];
    const bodyKeys = Object.keys(req.body || {});
    const unexpected = bodyKeys.filter((key) => !allowedKeys.includes(key));
    if (unexpected.length > 0) {
      throw new Error(`Unexpected field(s) in request body: ${unexpected.join(', ')}`);
    }
    if (
      req.body.courseId !== undefined ||
      req.body.moduleId !== undefined ||
      req.body.courseCreator !== undefined ||
      req.body._id !== undefined ||
      req.body.createdAt !== undefined ||
      req.body.updatedAt !== undefined
    ) {
      throw new Error('Protected fields (courseId, moduleId, courseCreator, _id, createdAt, updatedAt) cannot be set in request body');
    }
    return true;
  }),
  body('title')
    .exists({ checkNull: true })
    .withMessage('Title is required')
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
  validateRequest,
];

const updateTopicValidation = [
  param('courseId')
    .trim()
    .isMongoId()
    .withMessage('Invalid course ID format'),
  param('moduleId')
    .trim()
    .isMongoId()
    .withMessage('Invalid module ID format'),
  param('topicId')
    .trim()
    .isMongoId()
    .withMessage('Invalid topic ID format'),
  body().custom((_value, { req }) => {
    const allowedKeys = ['title', 'description', 'order'];
    const bodyKeys = Object.keys(req.body || {});
    const unexpected = bodyKeys.filter((key) => !allowedKeys.includes(key));
    if (unexpected.length > 0) {
      throw new Error(`Unexpected field(s) in request body: ${unexpected.join(', ')}`);
    }
    if (
      req.body.courseId !== undefined ||
      req.body.moduleId !== undefined ||
      req.body.courseCreator !== undefined ||
      req.body._id !== undefined ||
      req.body.createdAt !== undefined ||
      req.body.updatedAt !== undefined
    ) {
      throw new Error('Protected fields (courseId, moduleId, courseCreator, _id, createdAt, updatedAt) cannot be modified');
    }
    if (bodyKeys.length === 0) {
      throw new Error('At least one field (title, description, or order) must be provided for update');
    }
    return true;
  }),
  body('title')
    .optional()
    .isString()
    .withMessage('Title must be a string')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description cannot exceed 2000 characters'),
  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order must be a non-negative integer'),
  validateRequest,
];

const reorderTopicsValidation = [
  param('courseId')
    .trim()
    .isMongoId()
    .withMessage('Invalid course ID format'),
  param('moduleId')
    .trim()
    .isMongoId()
    .withMessage('Invalid module ID format'),
  body().custom((_value, { req }) => {
    const allowedKeys = ['topicIds'];
    const bodyKeys = Object.keys(req.body || {});
    const unexpected = bodyKeys.filter((key) => !allowedKeys.includes(key));
    if (unexpected.length > 0) {
      throw new Error(`Unexpected field(s) in request body: ${unexpected.join(', ')}`);
    }
    return true;
  }),
  body('topicIds')
    .exists({ checkNull: true })
    .withMessage('topicIds is required')
    .isArray()
    .withMessage('topicIds must be an array of topic IDs')
    .custom((ids) => {
      if (!Array.isArray(ids)) return false;
      for (const id of ids) {
        if (typeof id !== 'string' || !/^[0-9a-fA-F]{24}$/.test(id.trim())) {
          throw new Error('Each topic ID must be a valid 24-character hexadecimal MongoId string');
        }
      }
      const stringIds = ids.map((id) => id.trim());
      const unique = new Set(stringIds);
      if (unique.size !== stringIds.length) {
        throw new Error('Duplicate topic IDs are not allowed in reorder list');
      }
      return true;
    }),
  validateRequest,
];

/**
 * Course Creator Topic Routes:
 * Scoped under /api/creator/courses/:courseId/modules/:moduleId/topics
 * Protected by router-level authenticate + requireCourseCreator,
 * endpoint-level requireCourseOwnership, and requireModuleBelongsToCourse
 */

// GET /api/creator/courses/:courseId/modules/:moduleId/topics - List topics in module
router.get(
  '/courses/:courseId/modules/:moduleId/topics',
  courseAndModuleIdParamValidation,
  requireCourseOwnership({ paramName: 'courseId', leakPrevention: true }),
  requireModuleBelongsToCourse({ paramName: 'moduleId' }),
  getTopics
);

// POST /api/creator/courses/:courseId/modules/:moduleId/topics - Create topic in module
router.post(
  '/courses/:courseId/modules/:moduleId/topics',
  createTopicValidation,
  requireCourseOwnership({ paramName: 'courseId', leakPrevention: true }),
  requireModuleBelongsToCourse({ paramName: 'moduleId' }),
  createTopic
);

// PATCH /api/creator/courses/:courseId/modules/:moduleId/topics/reorder - Reorder topics in module
// NOTE: Mounted BEFORE /:topicId to prevent matching "reorder" as a topicId
router.patch(
  '/courses/:courseId/modules/:moduleId/topics/reorder',
  reorderTopicsValidation,
  requireCourseOwnership({ paramName: 'courseId', leakPrevention: true }),
  requireModuleBelongsToCourse({ paramName: 'moduleId' }),
  reorderTopics
);

// GET /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId - Get topic by ID
router.get(
  '/courses/:courseId/modules/:moduleId/topics/:topicId',
  courseModuleAndTopicIdParamValidation,
  requireCourseOwnership({ paramName: 'courseId', leakPrevention: true }),
  requireModuleBelongsToCourse({ paramName: 'moduleId' }),
  getCreatorTopicById
);

// PATCH /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId - Update topic
router.patch(
  '/courses/:courseId/modules/:moduleId/topics/:topicId',
  updateTopicValidation,
  requireCourseOwnership({ paramName: 'courseId', leakPrevention: true }),
  requireModuleBelongsToCourse({ paramName: 'moduleId' }),
  updateTopic
);

// DELETE /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId - Delete topic
router.delete(
  '/courses/:courseId/modules/:moduleId/topics/:topicId',
  courseModuleAndTopicIdParamValidation,
  requireCourseOwnership({ paramName: 'courseId', leakPrevention: true }),
  requireModuleBelongsToCourse({ paramName: 'moduleId' }),
  deleteTopic
);

const updateTopicContentValidation = [
  param('courseId')
    .trim()
    .isMongoId()
    .withMessage('Invalid course ID format'),
  param('moduleId')
    .trim()
    .isMongoId()
    .withMessage('Invalid module ID format'),
  param('topicId')
    .trim()
    .isMongoId()
    .withMessage('Invalid topic ID format'),
  body().custom((_value, { req }) => {
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      throw new Error('Request body must be a valid JSON object');
    }
    const allowedKeys = [
      'content',
      'images',
      'codeExamples',
      'importantPoints',
      'revisionPoints',
      'videos',
      'externalReferences',
      'references',
    ];
    const bodyKeys = Object.keys(req.body);
    const unexpected = bodyKeys.filter((k) => !allowedKeys.includes(k) || k.startsWith('$') || k.includes('.'));
    if (unexpected.length > 0) {
      throw new Error(`Unexpected field(s) in request body: ${unexpected.join(', ')}`);
    }
    if (
      req.body.courseId !== undefined ||
      req.body.moduleId !== undefined ||
      req.body.topicId !== undefined ||
      req.body.courseCreator !== undefined ||
      req.body._id !== undefined ||
      req.body.createdAt !== undefined ||
      req.body.updatedAt !== undefined
    ) {
      throw new Error('Protected fields (courseId, moduleId, topicId, courseCreator, _id, createdAt, updatedAt) cannot be modified');
    }
    if (bodyKeys.length === 0) {
      throw new Error('At least one content field (content, images, codeExamples, importantPoints/revisionPoints, videos, or externalReferences) must be provided');
    }
    return true;
  }),
  body('content')
    .optional()
    .custom((val) => {
      if (typeof val !== 'string' && (typeof val !== 'object' || val === null || Array.isArray(val))) {
        throw new Error('Content must be a string or structured object');
      }
      return true;
    }),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('codeExamples')
    .optional()
    .isArray()
    .withMessage('Code examples must be an array'),
  body('importantPoints')
    .optional()
    .isArray()
    .withMessage('Important points must be an array'),
  body('revisionPoints')
    .optional()
    .isArray()
    .withMessage('Revision points must be an array'),
  body('videos')
    .optional()
    .isObject()
    .withMessage('Videos must be an object'),
  body('externalReferences')
    .optional()
    .isArray()
    .withMessage('External references must be an array'),
  body('references')
    .optional()
    .isArray()
    .withMessage('References must be an array'),
  validateRequest,
];

// GET /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId/content - Get topic educational content
router.get(
  '/courses/:courseId/modules/:moduleId/topics/:topicId/content',
  courseModuleAndTopicIdParamValidation,
  requireCourseOwnership({ paramName: 'courseId', leakPrevention: true }),
  requireModuleBelongsToCourse({ paramName: 'moduleId' }),
  getTopicContent
);

// PATCH /api/creator/courses/:courseId/modules/:moduleId/topics/:topicId/content - Update topic educational content
router.patch(
  '/courses/:courseId/modules/:moduleId/topics/:topicId/content',
  updateTopicContentValidation,
  requireCourseOwnership({ paramName: 'courseId', leakPrevention: true }),
  requireModuleBelongsToCourse({ paramName: 'moduleId' }),
  updateTopicContent
);

// ---------------------------------------------------------------------------
// Course Assessment Authoring Routes (/api/creator/courses/:courseId/assessments)
// ---------------------------------------------------------------------------

const creatorCourseIdValidation = [
  param('courseId').trim().isMongoId().withMessage('Invalid course ID format'),
  validateRequest,
];

const creatorCourseAndAssessmentIdValidation = [
  param('courseId').trim().isMongoId().withMessage('Invalid course ID format'),
  param('assessmentId').trim().isMongoId().withMessage('Invalid assessment ID format'),
  validateRequest,
];

const createCreatorAssessmentValidation = [
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

const updateCreatorAssessmentValidation = [
  param('courseId').trim().isMongoId().withMessage('Invalid course ID format'),
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

// POST /api/creator/courses/:courseId/assessments - Create assessment
router.post(
  '/courses/:courseId/assessments',
  createCreatorAssessmentValidation,
  requireCourseOwnership({ paramName: 'courseId', leakPrevention: false }),
  createAssessmentHandler
);

// GET /api/creator/courses/:courseId/assessments - List assessments for course
router.get(
  '/courses/:courseId/assessments',
  creatorCourseIdValidation,
  requireCourseOwnership({ paramName: 'courseId', leakPrevention: false }),
  getAssessmentsHandler
);

// GET /api/creator/courses/:courseId/assessments/:assessmentId - Get assessment details
router.get(
  '/courses/:courseId/assessments/:assessmentId',
  creatorCourseAndAssessmentIdValidation,
  requireCourseOwnership({ paramName: 'courseId', leakPrevention: false }),
  getAssessmentByIdHandler
);

// PUT /api/creator/courses/:courseId/assessments/:assessmentId - Update assessment
router.put(
  '/courses/:courseId/assessments/:assessmentId',
  updateCreatorAssessmentValidation,
  requireCourseOwnership({ paramName: 'courseId', leakPrevention: false }),
  updateAssessmentHandler
);

// DELETE /api/creator/courses/:courseId/assessments/:assessmentId - Delete/archive assessment
router.delete(
  '/courses/:courseId/assessments/:assessmentId',
  creatorCourseAndAssessmentIdValidation,
  requireCourseOwnership({ paramName: 'courseId', leakPrevention: false }),
  deleteAssessmentHandler
);

export default router;

