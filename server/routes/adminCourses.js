import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  createCourse,
  getCourses,
  getCourseById,
  getCourseStructure,
  updateCourse,
  updateCourseStatus,
} from '../controllers/adminCourseController.js';
import {
  createModule,
  getModulesByCourse,
  getModuleById,
  updateModule,
  deleteModule,
  reorderModules,
} from '../controllers/adminModuleController.js';
import {
  createTopicUnderModule,
  getTopicsByCourseAndModule,
  getTopicByCourseAndModule,
  updateTopicUnderModule,
  deleteTopicUnderModule,
  reorderTopicsUnderModule,
} from '../controllers/adminTopicController.js';
import { isValidYouTubeReference, isValidUrl } from '../services/adminTopicService.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

// Router-level protection: All course admin routes require authentication and the 'admin' role
router.use(authenticate, authorize('admin'));

/**
 * Validation rules for POST /api/admin/courses
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
  body('courseCreator')
    .exists({ checkNull: true })
    .withMessage('Course creator is required')
    .trim()
    .isMongoId()
    .withMessage('Course creator must be a valid ID format'),
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
  body('status')
    .optional()
    .isString()
    .withMessage('Status must be a string')
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
  validateRequest,
];

/**
 * Validation rules for GET /api/admin/courses
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
 * Validation rules for GET /api/admin/courses/:id
 */
const getCourseByIdValidation = [
  param('id')
    .trim()
    .isMongoId()
    .withMessage('Invalid course ID format'),
  validateRequest,
];

/**
 * Validation rules for PATCH /api/admin/courses/:id
 */
const updateCourseValidation = [
  param('id')
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
  body('courseCreator')
    .optional()
    .trim()
    .isMongoId()
    .withMessage('Course creator must be a valid ID format'),
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
  body('status')
    .optional()
    .isString()
    .withMessage('Status must be a string')
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
  validateRequest,
];

/**
 * Validation rules for PATCH /api/admin/courses/:id/status
 */
const updateCourseStatusValidation = [
  param('id')
    .trim()
    .isMongoId()
    .withMessage('Invalid course ID format'),
  body('status')
    .exists({ checkNull: true })
    .withMessage('Status is required')
    .isString()
    .withMessage('Status must be a string')
    .isIn(['draft', 'published', 'archived'])
    .withMessage('Status must be draft, published, or archived'),
  validateRequest,
];

// Routes definitions
router.post('/', createCourseValidation, createCourse);
router.get('/', getCoursesValidation, getCourses);
router.get('/:id', getCourseByIdValidation, getCourseById);
router.get('/:id/structure', getCourseByIdValidation, getCourseStructure);
router.patch('/:id', updateCourseValidation, updateCourse);
router.patch('/:id/status', updateCourseStatusValidation, updateCourseStatus);

// Nested module management sub-routes under course (/api/admin/courses/:courseId/modules)
router.get(
  '/:courseId/modules',
  [param('courseId').trim().isMongoId().withMessage('Invalid course ID format'), validateRequest],
  getModulesByCourse
);
router.post(
  '/:courseId/modules',
  [
    param('courseId').trim().isMongoId().withMessage('Invalid course ID format'),
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
  ],
  createModule
);
router.patch(
  '/:courseId/modules/reorder',
  [
    param('courseId').trim().isMongoId().withMessage('Invalid course ID format'),
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
  ],
  reorderModules
);

router.get(
  '/:courseId/modules/:moduleId',
  [
    param('courseId').trim().isMongoId().withMessage('Invalid course ID format'),
    param('moduleId').trim().isMongoId().withMessage('Invalid module ID format'),
    validateRequest,
  ],
  getModuleById
);

router.patch(
  '/:courseId/modules/:moduleId',
  [
    param('courseId').trim().isMongoId().withMessage('Invalid course ID format'),
    param('moduleId').trim().isMongoId().withMessage('Invalid module ID format'),
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
  ],
  updateModule
);

router.delete(
  '/:courseId/modules/:moduleId',
  [
    param('courseId').trim().isMongoId().withMessage('Invalid course ID format'),
    param('moduleId').trim().isMongoId().withMessage('Invalid module ID format'),
    validateRequest,
  ],
  deleteModule
);

// ==========================================
// COURSE -> MODULE -> TOPIC NESTED CRUD ROUTES
// ==========================================

/**
 * Validation rules for POST /api/admin/courses/:courseId/modules/:moduleId/topics
 */
const createNestedTopicValidation = [
  param('courseId').trim().isMongoId().withMessage('Invalid course ID format'),
  param('moduleId').trim().isMongoId().withMessage('Invalid module ID format'),
  body().custom((_value, { req }) => {
    const allowedKeys = ['title', 'description', 'order'];
    const bodyKeys = Object.keys(req.body || {});
    const unexpected = bodyKeys.filter((key) => !allowedKeys.includes(key));
    if (unexpected.length > 0) {
      throw new Error(`Unexpected field(s) in request body: ${unexpected.join(', ')}`);
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

/**
 * Validation rules for GET /api/admin/courses/:courseId/modules/:moduleId/topics
 */
const getNestedTopicsValidation = [
  param('courseId').trim().isMongoId().withMessage('Invalid course ID format'),
  param('moduleId').trim().isMongoId().withMessage('Invalid module ID format'),
  validateRequest,
];

/**
 * Validation rules for GET / DELETE /api/admin/courses/:courseId/modules/:moduleId/topics/:topicId
 */
const nestedTopicIdValidation = [
  param('courseId').trim().isMongoId().withMessage('Invalid course ID format'),
  param('moduleId').trim().isMongoId().withMessage('Invalid module ID format'),
  param('topicId').trim().isMongoId().withMessage('Invalid topic ID format'),
  validateRequest,
];

/**
 * Validation rules for PATCH / PUT /api/admin/courses/:courseId/modules/:moduleId/topics/:topicId
 */
const updateNestedTopicValidation = [
  param('courseId').trim().isMongoId().withMessage('Invalid course ID format'),
  param('moduleId').trim().isMongoId().withMessage('Invalid module ID format'),
  param('topicId').trim().isMongoId().withMessage('Invalid topic ID format'),
  body().custom((_value, { req }) => {
    const allowedKeys = ['title', 'description', 'order', 'content', 'importantPoints', 'videos', 'codeExamples', 'images'];
    const bodyKeys = Object.keys(req.body || {});
    const unexpected = bodyKeys.filter((key) => !allowedKeys.includes(key));
    if (unexpected.length > 0) {
      throw new Error(`Unexpected field(s) in request body: ${unexpected.join(', ')}`);
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
  body('content')
    .optional()
    .custom((val) => {
      if (typeof val === 'string') {
        if (val.length > 50000) {
          throw new Error('Content cannot exceed 50000 characters');
        }
        return true;
      }
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        if (val.explanation !== undefined) {
          if (typeof val.explanation !== 'string') {
            throw new Error('Content explanation must be a string');
          }
          if (val.explanation.length > 50000) {
            throw new Error('Content explanation cannot exceed 50000 characters');
          }
        }
        return true;
      }
      throw new Error('Content must be a string or structured content object');
    }),
  body('importantPoints')
    .optional()
    .isArray({ max: 50 })
    .withMessage('importantPoints must be an array with at most 50 items')
    .custom((arr) => {
      if (!Array.isArray(arr)) return false;
      for (let i = 0; i < arr.length; i++) {
        if (typeof arr[i] !== 'string') {
          throw new Error(`importantPoints item at index ${i} must be a string`);
        }
        if (arr[i].trim().length > 1000) {
          throw new Error(`importantPoints item at index ${i} cannot exceed 1000 characters`);
        }
      }
      return true;
    }),
  body('videos')
    .optional()
    .custom((val) => {
      if (typeof val !== 'object' || val === null || Array.isArray(val)) {
        throw new Error('videos must be an object with optional english, telugu, and hindi fields');
      }
      const allowedLangs = ['english', 'telugu', 'hindi'];
      const keys = Object.keys(val);
      const invalidKeys = keys.filter((k) => !allowedLangs.includes(k));
      if (invalidKeys.length > 0) {
        throw new Error(`Unsupported video field(s): ${invalidKeys.join(', ')}`);
      }
      for (const lang of allowedLangs) {
        if (val[lang] !== undefined && val[lang] !== null) {
          if (typeof val[lang] !== 'string') {
            throw new Error(`Video reference for ${lang} must be a string or null`);
          }
          const trimmed = val[lang].trim();
          if (trimmed.length > 1000) {
            throw new Error(`Video reference for ${lang} cannot exceed 1000 characters`);
          }
          if (trimmed.length > 0 && !isValidYouTubeReference(trimmed)) {
            throw new Error(
              `Invalid YouTube video reference for ${lang}. Must be a valid YouTube URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...) or video ID`
            );
          }
        }
      }
      return true;
    }),
  body('codeExamples')
    .optional()
    .isArray({ max: 50 })
    .withMessage('codeExamples must be an array with at most 50 items')
    .custom((arr) => {
      if (!Array.isArray(arr)) return false;
      const allowedExampleKeys = ['id', '_id', 'title', 'language', 'code', 'explanation'];
      for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          throw new Error(`codeExample at index ${i} must be an object`);
        }
        const keys = Object.keys(item);
        const unexpected = keys.filter((k) => !allowedExampleKeys.includes(k) || k.startsWith('$') || k.includes('.'));
        if (unexpected.length > 0) {
          throw new Error(`codeExample at index ${i} contains unexpected field(s): ${unexpected.join(', ')}`);
        }
        if (typeof item.code !== 'string' || item.code.trim().length === 0) {
          throw new Error(`code snippet is required for codeExample at index ${i}`);
        }
        if (item.code.length > 30000) {
          throw new Error(`code snippet at index ${i} cannot exceed 30000 characters`);
        }
        if (item.title !== undefined && typeof item.title !== 'string') {
          throw new Error(`codeExample title at index ${i} must be a string`);
        }
        if (typeof item.title === 'string' && item.title.trim().length > 200) {
          throw new Error(`codeExample title at index ${i} cannot exceed 200 characters`);
        }
        if (item.language !== undefined && typeof item.language !== 'string') {
          throw new Error(`codeExample language at index ${i} must be a string`);
        }
        if (typeof item.language === 'string' && item.language.trim().length > 50) {
          throw new Error(`codeExample language at index ${i} cannot exceed 50 characters`);
        }
        if (item.explanation !== undefined && typeof item.explanation !== 'string') {
          throw new Error(`codeExample explanation at index ${i} must be a string`);
        }
        if (typeof item.explanation === 'string' && item.explanation.trim().length > 5000) {
          throw new Error(`codeExample explanation at index ${i} cannot exceed 5000 characters`);
        }
      }
      return true;
    }),
  body('images')
    .optional()
    .isArray({ max: 50 })
    .withMessage('images must be an array with at most 50 items')
    .custom((arr) => {
      if (!Array.isArray(arr)) return false;
      const allowedImageKeys = ['id', '_id', 'url', 'caption', 'altText'];
      for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        if (typeof item === 'string') {
          const trimmed = item.trim();
          if (trimmed.length === 0 || trimmed.length > 1000 || (!isValidUrl(trimmed) && !trimmed.startsWith('/'))) {
            throw new Error(`image reference at index ${i} must be a valid URL or path (max 1000 characters)`);
          }
          continue;
        }
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          throw new Error(`image at index ${i} must be an object or URL string`);
        }
        const keys = Object.keys(item);
        const unexpected = keys.filter((k) => !allowedImageKeys.includes(k) || k.startsWith('$') || k.includes('.'));
        if (unexpected.length > 0) {
          throw new Error(`image at index ${i} contains unexpected field(s): ${unexpected.join(', ')}`);
        }
        if (typeof item.url !== 'string' || item.url.trim().length === 0) {
          throw new Error(`image URL is required at index ${i}`);
        }
        const trimmedUrl = item.url.trim();
        if (trimmedUrl.length > 1000 || (!isValidUrl(trimmedUrl) && !trimmedUrl.startsWith('/'))) {
          throw new Error(`image URL at index ${i} must be a valid HTTP/HTTPS URL or relative path (max 1000 characters)`);
        }
        if (item.caption !== undefined && typeof item.caption !== 'string') {
          throw new Error(`image caption at index ${i} must be a string`);
        }
        if (typeof item.caption === 'string' && item.caption.trim().length > 500) {
          throw new Error(`image caption at index ${i} cannot exceed 500 characters`);
        }
        if (item.altText !== undefined && typeof item.altText !== 'string') {
          throw new Error(`image altText at index ${i} must be a string`);
        }
        if (typeof item.altText === 'string' && item.altText.trim().length > 200) {
          throw new Error(`image altText at index ${i} cannot exceed 200 characters`);
        }
      }
      return true;
    }),
  validateRequest,
];

/**
 * Validation rules for PATCH /api/admin/courses/:courseId/modules/:moduleId/topics/reorder
 */
const reorderNestedTopicsValidation = [
  param('courseId').trim().isMongoId().withMessage('Invalid course ID format'),
  param('moduleId').trim().isMongoId().withMessage('Invalid module ID format'),
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
    .isArray({ min: 1 })
    .withMessage('topicIds must be a non-empty array of topic IDs')
    .custom((ids) => {
      if (!Array.isArray(ids) || ids.length === 0) return false;
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

// POST /api/admin/courses/:courseId/modules/:moduleId/topics
router.post(
  '/:courseId/modules/:moduleId/topics',
  createNestedTopicValidation,
  createTopicUnderModule
);

// GET /api/admin/courses/:courseId/modules/:moduleId/topics
router.get(
  '/:courseId/modules/:moduleId/topics',
  getNestedTopicsValidation,
  getTopicsByCourseAndModule
);

// PATCH /api/admin/courses/:courseId/modules/:moduleId/topics/reorder
router.patch(
  '/:courseId/modules/:moduleId/topics/reorder',
  reorderNestedTopicsValidation,
  reorderTopicsUnderModule
);

// GET /api/admin/courses/:courseId/modules/:moduleId/topics/:topicId
router.get(
  '/:courseId/modules/:moduleId/topics/:topicId',
  nestedTopicIdValidation,
  getTopicByCourseAndModule
);

// PATCH /api/admin/courses/:courseId/modules/:moduleId/topics/:topicId
router.patch(
  '/:courseId/modules/:moduleId/topics/:topicId',
  updateNestedTopicValidation,
  updateTopicUnderModule
);

// PUT /api/admin/courses/:courseId/modules/:moduleId/topics/:topicId
router.put(
  '/:courseId/modules/:moduleId/topics/:topicId',
  updateNestedTopicValidation,
  updateTopicUnderModule
);

// DELETE /api/admin/courses/:courseId/modules/:moduleId/topics/:topicId
router.delete(
  '/:courseId/modules/:moduleId/topics/:topicId',
  nestedTopicIdValidation,
  deleteTopicUnderModule
);

export default router;
