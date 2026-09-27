import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  createTopic,
  getTopicById,
  updateTopic,
  reorderTopics,
  deleteTopic,
} from '../controllers/adminTopicController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

// Router-level protection: Admin only
router.use(authenticate, authorize('admin'));

/**
 * Validation rules for POST /api/admin/topics
 */
const createTopicValidation = [
  body('moduleId')
    .exists({ checkNull: true })
    .withMessage('Module ID is required')
    .trim()
    .isMongoId()
    .withMessage('Module ID must be a valid MongoId'),
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
 * Validation rules for GET / DELETE /api/admin/topics/:id
 */
const topicIdParamValidation = [
  param('id')
    .trim()
    .isMongoId()
    .withMessage('Invalid topic ID format'),
  validateRequest,
];

/**
 * Validation rules for PATCH /api/admin/topics/:id
 */
const updateTopicValidation = [
  param('id')
    .trim()
    .isMongoId()
    .withMessage('Invalid topic ID format'),
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
 * Validation rules for PATCH /api/admin/topics/reorder
 */
const reorderTopicsValidation = [
  body('moduleId')
    .exists({ checkNull: true })
    .withMessage('Module ID is required')
    .trim()
    .isMongoId()
    .withMessage('Module ID must be a valid MongoId'),
  body('topicOrders')
    .exists({ checkNull: true })
    .withMessage('topicOrders is required')
    .isArray({ min: 1 })
    .withMessage('topicOrders must be a non-empty array'),
  validateRequest,
];

router.post('/', createTopicValidation, createTopic);
router.patch('/reorder', reorderTopicsValidation, reorderTopics);
router.get('/:id', topicIdParamValidation, getTopicById);
router.patch('/:id', updateTopicValidation, updateTopic);
router.delete('/:id', topicIdParamValidation, deleteTopic);

export default router;
