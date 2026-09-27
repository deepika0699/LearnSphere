import mongoose from 'mongoose';
import { requireStudent, CANONICAL_ROLES, normalizeRole } from './authorize.js';

export { requireStudent, CANONICAL_ROLES, normalizeRole };

/**
 * Checks whether a given user object or payload represents an active student.
 *
 * @param {Object} user - User document or req.user object.
 * @returns {boolean} True if the user role is canonically 'student' and status is 'active'.
 */
export const isStudent = (user) => {
  if (!user) return false;
  const role = normalizeRole(user.role);
  const status = user.status || 'active';
  return role === 'student' && status === 'active';
};

/**
 * Programmatic assertion to verify student identity inside services or controllers.
 * Throws a 403 Forbidden error if user is not a verified active student.
 * Throws a 401 Unauthorized if user is unauthenticated or missing.
 *
 * @param {Object} user - Authenticated user object (typically req.user).
 * @throws {Error} 401 if unauthenticated, 403 if role is not student.
 * @returns {boolean} Always true if assertion passes.
 */
export const assertStudent = (user) => {
  if (!user || (!user.userId && !user.id && !user._id)) {
    const error = new Error('Authentication required');
    error.statusCode = 401;
    throw error;
  }
  if (!isStudent(user)) {
    const error = new Error('Access denied: Student access required');
    error.statusCode = 403;
    throw error;
  }
  return true;
};

export default {
  requireStudent,
  isStudent,
  assertStudent,
};
