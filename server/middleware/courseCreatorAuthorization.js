import mongoose from 'mongoose';
import Course from '../models/Course.js';
import Module from '../models/Module.js';
import { requireCourseCreator, CANONICAL_ROLES, normalizeRole } from './authorize.js';

export { requireCourseCreator, CANONICAL_ROLES, normalizeRole };

/**
 * Determines whether a course belongs to the specified user.
 * Checks authoritative `course.courseCreator` field.
 *
 * @param {Object} course - Mongoose Course document or plain object.
 * @param {string|mongoose.Types.ObjectId} userId - Target user ObjectId or string.
 * @returns {boolean} True if the course is owned by the user, false otherwise.
 */
export const isCourseOwner = (course, userId) => {
  if (!course || !userId) return false;

  const rawCreator = course.courseCreator;
  if (!rawCreator) return false;

  const creatorId = rawCreator._id ? rawCreator._id.toString() : rawCreator.toString();
  const targetId = userId._id ? userId._id.toString() : userId.toString();

  return Boolean(creatorId && targetId && creatorId === targetId);
};

/**
 * Programmatic assertion to verify course ownership inside services, controllers, or workflows.
 * Throws a 403 error if the user is not the authoritative creator of the course.
 *
 * @param {Object} course - Mongoose Course document or plain object.
 * @param {string|mongoose.Types.ObjectId} userId - Authenticated creator ID.
 * @throws {Error} 403 Forbidden error if ownership check fails.
 * @returns {boolean} Always true if ownership passes.
 */
export const assertCourseOwnership = (course, userId) => {
  if (!isCourseOwner(course, userId)) {
    const error = new Error('Access denied: You do not have permission to access or modify this course');
    error.statusCode = 403;
    throw error;
  }
  return true;
};

/**
 * Express Middleware Factory: Verifies Course Creator ownership over a target course.
 *
 * Security & Design:
 * - Must be mounted after `authenticate` and `requireCourseCreator`.
 * - Reads courseId from request parameters (default: `req.params[paramName]`).
 * - Validates MongoDB ObjectId format to prevent cast errors or operator injection.
 * - Queries Course from MongoDB and extracts authoritative `courseCreator`.
 * - Returns 404 if course does not exist.
 * - Returns 403 Forbidden if `course.courseCreator !== req.user.userId`.
 * - Attaches verified course to `req.course` for downstream controllers.
 * - Fails closed if parameters or credentials are missing.
 *
 * @param {Object} [options]
 * @param {string} [options.paramName='id'] - The route param key holding the courseId.
 * @returns {import('express').RequestHandler}
 */
export const requireCourseOwnership = ({ paramName = 'id', leakPrevention = true } = {}) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId || req.user?.id;
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      // Extract courseId from specified param (or fall back to body/query if not in params)
      const courseId = req.params?.[paramName] || req.body?.courseId || req.query?.courseId;

      if (!courseId || typeof courseId !== 'string' || !mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Valid course ID is required',
        });
      }

      // Query database for authoritative course creator
      const course = await Course.findById(courseId).select('_id title status courseCreator');

      if (!course) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Course not found',
        });
      }

      // Check authoritative ownership without leaking existence of another creator's course
      if (!isCourseOwner(course, userId)) {
        if (leakPrevention) {
          return res.status(404).json({
            error: 'Not Found',
            message: 'Course not found',
          });
        }
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access denied: You do not have permission to access or modify this course',
        });
      }

      // Attach verified course to request context
      req.course = course;

      return next();
    } catch (err) {
      return next(err);
    }
  };
};

/**
 * Express Middleware: Verifies that a target module exists and belongs to req.course._id.
 * Must be mounted after requireCourseOwnership so req.course is present.
 *
 * @param {Object} [options]
 * @param {string} [options.paramName='moduleId'] - The route param key holding the moduleId.
 * @returns {import('express').RequestHandler}
 */
export const requireModuleBelongsToCourse = ({ paramName = 'moduleId' } = {}) => {
  return async (req, res, next) => {
    try {
      const courseId = req.course?._id;
      if (!courseId) {
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Parent course context missing',
        });
      }

      const moduleId = req.params?.[paramName] || req.body?.moduleId || req.query?.moduleId;

      if (!moduleId || typeof moduleId !== 'string' || !mongoose.Types.ObjectId.isValid(moduleId)) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Valid module ID is required',
        });
      }

      const foundModule = await Module.findOne({ _id: moduleId, courseId }).select('_id courseId title order').lean();

      if (!foundModule) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Module not found in this course',
        });
      }

      req.module = foundModule;
      return next();
    } catch (err) {
      return next(err);
    }
  };
};

export default {
  requireCourseCreator,
  requireCourseOwnership,
  requireModuleBelongsToCourse,
  assertCourseOwnership,
  isCourseOwner,
};
