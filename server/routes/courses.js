/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Router } from 'express';
import { param, query } from 'express-validator';
import {
  getCourses,
  getCourseById,
  getCourseStructure,
  getTopicContent,
} from '../controllers/courseController.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

/**
 * Validation rules for GET /api/courses
 */
const getCoursesValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be an integer between 1 and 50'),
  query('category')
    .optional()
    .isString()
    .withMessage('Category must be a string')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category cannot exceed 100 characters'),
  query('search')
    .optional()
    .isString()
    .withMessage('Search query must be a string')
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query cannot exceed 100 characters'),
  query('sort')
    .optional()
    .isString()
    .isIn(['newest', 'oldest', 'title_asc', 'title_desc'])
    .withMessage('Invalid sort parameter. Must be one of: newest, oldest, title_asc, title_desc'),
  validateRequest,
];

/**
 * Validation rules for GET /api/courses/:courseId
 */
const getCourseByIdValidation = [
  param('courseId')
    .trim()
    .isMongoId()
    .withMessage('Invalid course ID format'),
  validateRequest,
];

/**
 * Validation rules for GET /api/courses/:courseId/structure
 */
const getCourseStructureValidation = [
  param('courseId')
    .trim()
    .isMongoId()
    .withMessage('Invalid course ID format'),
  validateRequest,
];

/**
 * Validation rules for GET /api/courses/:courseId/modules/:moduleId/topics/:topicId
 */
const getTopicContentValidation = [
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

/**
 * Public Read-Only Course Delivery Endpoints:
 * Authentication is NOT required for reading published content.
 * Draft and archived courses fail closed with HTTP 404.
 */

// 1. GET /api/courses - List published courses with search, filters, and pagination
router.get('/', getCoursesValidation, getCourses);

// 2. GET /api/courses/:courseId - Get published course details and metadata
router.get('/:courseId', getCourseByIdValidation, getCourseById);

// 3. GET /api/courses/:courseId/structure - Get curriculum structure (ordered modules & topics)
router.get('/:courseId/structure', getCourseStructureValidation, getCourseStructure);

// 4. GET /api/courses/:courseId/modules/:moduleId/topics/:topicId - Get topic educational content
router.get(
  '/:courseId/modules/:moduleId/topics/:topicId',
  getTopicContentValidation,
  getTopicContent
);

export default router;
