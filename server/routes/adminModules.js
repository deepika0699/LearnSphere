import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createModule,
  getModulesByCourse,
  getModuleById,
  updateModule,
  reorderModules,
  deleteModule,
} from '../controllers/adminModuleController.js';
import {
  createTopic,
  getTopicsByModule,
  reorderTopics,
} from '../controllers/adminTopicController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

// Router-level protection: Admin only
router.use(authenticate, authorize('admin'));

/**
 * Validation rules for POST /api/admin/modules
 */
const createModuleValidation = [
  body('courseId')
    .exists({ checkNull: true })
    .withMessage('Course ID is required')
    .trim()
    .isMongoId()
    .withMessage('Course ID must be a valid MongoId'),
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

/**
 * Validation rules for GET/DELETE /api/admin/modules/:id
 */
const moduleIdParamValidation = [
  param('id')
    .trim()
    .isMongoId()
    .withMessage('Invalid module ID format'),
  validateRequest,
];

/**
 * Validation rules for PATCH /api/admin/modules/:id
 */
const updateModuleValidation = [
  param('id')
    .trim()
    .isMongoId()
    .withMessage('Invalid module ID format'),
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

/**
 * Validation rules for PATCH /api/admin/modules/reorder
 */
const reorderModulesValidation = [
  body().custom((_value, { req }) => {
    const allowedKeys = ['courseId', 'moduleIds'];
    const bodyKeys = Object.keys(req.body || {});
    const unexpected = bodyKeys.filter((key) => !allowedKeys.includes(key));
    if (unexpected.length > 0) {
      throw new Error(`Unexpected field(s) in request body: ${unexpected.join(', ')}`);
    }
    return true;
  }),
  body('courseId')
    .exists({ checkNull: true })
    .withMessage('Course ID is required')
    .trim()
    .isMongoId()
    .withMessage('Course ID must be a valid MongoId'),
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
 * Validation rules for topic creation under module: POST /api/admin/modules/:moduleId/topics
 */
const createTopicUnderModuleValidation = [
  param('moduleId')
    .trim()
    .isMongoId()
    .withMessage('Invalid module ID format'),
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
  validateRequest,
];

/**
 * Validation rules for topics reorder under module: PATCH /api/admin/modules/:moduleId/topics/reorder
 */
const reorderTopicsUnderModuleValidation = [
  param('moduleId')
    .trim()
    .isMongoId()
    .withMessage('Invalid module ID format'),
  body('topicOrders')
    .exists({ checkNull: true })
    .withMessage('topicOrders is required')
    .isArray({ min: 1 })
    .withMessage('topicOrders must be a non-empty array'),
  validateRequest,
];

// Direct Module Routes
router.post('/', createModuleValidation, createModule);
router.patch('/reorder', reorderModulesValidation, reorderModules);
router.get('/:id', moduleIdParamValidation, getModuleById);
router.patch('/:id', updateModuleValidation, updateModule);
router.delete('/:id', moduleIdParamValidation, deleteModule);

// Nested Topic Sub-Routes under Module
router.get(
  '/:moduleId/topics',
  [param('moduleId').trim().isMongoId().withMessage('Invalid module ID format'), validateRequest],
  getTopicsByModule
);
router.post('/:moduleId/topics', createTopicUnderModuleValidation, createTopic);
router.patch('/:moduleId/topics/reorder', reorderTopicsUnderModuleValidation, reorderTopics);

export default router;
