import { Router } from 'express';
import { query, param, body } from 'express-validator';
import {
  getUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
} from '../controllers/adminUserController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';

const router = Router();

// Enforce admin authentication and authorization across all user-management routes
router.use(authenticate, authorize('admin'));

/**
 * Validation rules for GET /api/admin/users
 */
const getUsersValidation = [
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
    .trim()
    .isString()
    .isLength({ max: 100 })
    .withMessage('Search query must be at most 100 characters'),
  query('role')
    .optional()
    .trim()
    .isIn(['student', 'courseCreator', 'admin'])
    .withMessage('Role must be one of: student, courseCreator, admin'),
  query('status')
    .optional()
    .trim()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
  validateRequest,
];

/**
 * Validation rules for GET /api/admin/users/:id
 */
const getUserByIdValidation = [
  param('id')
    .trim()
    .isMongoId()
    .withMessage('Invalid user ID format'),
  validateRequest,
];

/**
 * Validation rules for PATCH /api/admin/users/:id/role
 */
const updateUserRoleValidation = [
  param('id')
    .trim()
    .isMongoId()
    .withMessage('Invalid user ID format'),
  body('role')
    .exists({ checkNull: true })
    .withMessage('Role is required')
    .isString()
    .withMessage('Role must be a string')
    .isIn(['student', 'courseCreator', 'admin'])
    .withMessage('Role must be one of: student, courseCreator, admin'),
  validateRequest,
];

// GET /api/admin/users - Paginated user list
router.get('/', getUsersValidation, getUsers);

// GET /api/admin/users/:id - Single user details
router.get('/:id', getUserByIdValidation, getUserById);

// PATCH /api/admin/users/:id/role - Update user role
router.patch('/:id/role', updateUserRoleValidation, updateUserRole);

/**
 * Validation rules for PATCH /api/admin/users/:id/status
 */
const updateUserStatusValidation = [
  param('id')
    .trim()
    .isMongoId()
    .withMessage('Invalid user ID format'),
  body('status')
    .exists({ checkNull: true })
    .withMessage('Status is required')
    .isString()
    .withMessage('Status must be a string')
    .isIn(['active', 'inactive'])
    .withMessage('Status must be either active or inactive'),
  validateRequest,
];

// PATCH /api/admin/users/:id/status - Update user status (activate/deactivate)
router.patch('/:id/status', updateUserStatusValidation, updateUserStatus);

export default router;
