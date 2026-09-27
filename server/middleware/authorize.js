import mongoose from 'mongoose';
import User, { CANONICAL_ROLES, normalizeRole } from '../models/User.js';

export { CANONICAL_ROLES, normalizeRole };

/**
 * Valid supported roles in the LearnSphere platform, with courseCreator as canonical.
 */
export const SUPPORTED_ROLES = Object.freeze(['student', 'courseCreator', 'course_creator', 'admin']);

/**
 * Role-Based Authorization Middleware Factory
 *
 * Security & Design:
 * - Must be mounted after the `authenticate` middleware in route chains.
 * - Extracts authenticated user ID exclusively from `req.user.userId` (or `req.user.id`).
 * - Validates that the user ID is a valid MongoDB ObjectId.
 * - Queries MongoDB directly using `User.findById(userId)` to establish the authoritative current role.
 * - Never trusts role values from `req.body`, `req.query`, `req.params`, or client headers.
 * - Enforces canonical role naming: 'courseCreator' is canonical ('course_creator' is normalized).
 * - Supports flexible role specification: e.g., `authorize('admin')`, `authorize('courseCreator')`, or `authorize(['courseCreator', 'admin'])`.
 * - If the authenticated user is missing from `req.user` or no longer exists in MongoDB (deleted user), returns HTTP 401 Unauthorized.
 * - If the user's role is not a supported platform role, or not in the permitted roles list, returns HTTP 403 Forbidden.
 * - Uses generic sanitized error messages without exposing database errors, stack traces, or internal details.
 * - Fails closed if role information is missing or invalid.
 *
 * @param {...(string|string[])} roles - Permitted role(s) for the route.
 * @returns {import('express').RequestHandler} Express middleware function.
 */
export const authorize = (...roles) => {
  // Normalize and map requested roles to canonical application roles
  const rawRoles = roles.flat().filter((role) => typeof role === 'string');
  const allowedRoles = rawRoles
    .map((role) => normalizeRole(role))
    .filter((role) => role && CANONICAL_ROLES.includes(role));

  return async (req, res, next) => {
    try {
      const userId = req.user?.userId || req.user?.id;

      // Ensure user was already authenticated by previous middleware
      if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      // Fetch user directly from MongoDB to establish the authoritative current role
      const user = await User.findById(userId).select('role status');

      // Reject if authenticated user account was deleted or no longer exists in MongoDB
      if (!user || user.status === 'inactive') {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Authentication required',
        });
      }

      // Authoritatively normalize role from MongoDB
      const currentRole = normalizeRole(user.role);

      // Fail closed: reject if role is invalid or unsupported in LearnSphere
      if (!currentRole || !CANONICAL_ROLES.includes(currentRole)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access denied: insufficient permissions',
        });
      }

      // Check if current role is permitted for this route.
      // If roles were specified in authorize(...), currentRole must match at least one allowed valid role.
      if (rawRoles.length > 0 && !allowedRoles.includes(currentRole)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access denied: insufficient permissions',
        });
      }

      // Update req.user with authoritative database canonical role
      req.user.role = currentRole;

      return next();
    } catch (err) {
      return next(err);
    }
  };
};

/**
 * Reusable Course Creator authorization boundary.
 * Strictly requires the authoritative database role to be 'courseCreator'.
 * Fails closed for students (403), admins (403), or invalid roles (403).
 */
export const requireCourseCreator = authorize('courseCreator');

/**
 * Reusable Administrator authorization boundary.
 */
export const requireAdmin = authorize('admin');

/**
 * Reusable Student authorization boundary.
 * Strictly requires the authoritative database role to be 'student'.
 * Fails closed for courseCreators (403), admins (403), or invalid roles (403).
 */
export const requireStudent = authorize('student');

export default authorize;
