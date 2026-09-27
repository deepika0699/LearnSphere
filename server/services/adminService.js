import User, { CANONICAL_ROLES, normalizeRole } from '../models/User.js';
import RefreshSession from '../models/RefreshSession.js';

/**
 * Admin Service Layer
 * Encapsulates business logic and MongoDB operations for the LearnSphere Admin module.
 */

/**
 * Retrieves platform overview statistics for the admin dashboard.
 * Aggregates user counts directly from MongoDB without hardcoding.
 *
 * @returns {Promise<{ users: { total: number, students: number, courseCreators: number, admins: number } }>}
 */
export const getDashboardSummary = async () => {
  // Aggregate user counts grouped by role
  const roleAggregation = await User.aggregate([
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
      },
    },
  ]);

  const roleCounts = {
    student: 0,
    course_creator: 0,
    courseCreator: 0,
    admin: 0,
  };

  let totalUsers = 0;

  for (const item of roleAggregation) {
    if (item._id && Object.prototype.hasOwnProperty.call(roleCounts, item._id)) {
      roleCounts[item._id] = item.count;
    }
    totalUsers += item.count;
  }

  const courseCreatorCount = (roleCounts.courseCreator || 0) + (roleCounts.course_creator || 0);

  return {
    users: {
      total: totalUsers,
      students: roleCounts.student,
      courseCreators: courseCreatorCount,
      admins: roleCounts.admin,
    },
  };
};

/**
 * Retrieves a paginated list of users with strictly sanitized safe fields.
 *
 * @param {Object} options
 * @param {number} options.page - 1-based page number.
 * @param {number} options.limit - Number of records per page.
 * @returns {Promise<{ users: Array, pagination: Object }>}
 */
export const getUsersList = async ({ page = 1, limit = 20, search, role, status }) => {
  const normalizedPage = Math.max(1, Math.floor(Number(page) || 1));
  const normalizedLimit = Math.min(100, Math.max(1, Math.floor(Number(limit) || 20)));
  const skip = (normalizedPage - 1) * normalizedLimit;

  // Build query filter safely
  const query = {};

  if (role) {
    const normalizedRole = normalizeRole(role);
    if (normalizedRole === 'courseCreator') {
      query.role = { $in: ['courseCreator', 'course_creator'] };
    } else if (normalizedRole) {
      query.role = normalizedRole;
    }
  }

  if (status && ['active', 'inactive'].includes(status)) {
    query.status = status;
  }

  if (search && typeof search === 'string' && search.trim()) {
    // Escape regex special characters to prevent regex injection or ReDoS
    const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { email: { $regex: escapedSearch, $options: 'i' } },
    ];
  }

  // Query total count and users concurrently
  const [totalUsers, rawUsers] = await Promise.all([
    User.countDocuments(query),
    User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(normalizedLimit)
      .select('_id name email role status createdAt updatedAt')
      .lean(),
  ]);

  const totalPages = totalUsers === 0 ? 0 : Math.ceil(totalUsers / normalizedLimit);

  // Strictly map to safe user fields, guaranteeing no credentials or internal tokens are returned
  const safeUsers = rawUsers.map((user) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status || 'active',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));

  return {
    users: safeUsers,
    pagination: {
      page: normalizedPage,
      limit: normalizedLimit,
      totalUsers,
      totalPages,
      hasNextPage: normalizedPage < totalPages,
      hasPrevPage: normalizedPage > 1,
    },
  };
};

/**
 * Retrieves a single user by MongoDB ObjectId with strictly sanitized safe fields.
 *
 * @param {string} userId - Target MongoDB ObjectId.
 * @returns {Promise<Object|null>} Safe user object or null if not found.
 */
export const getUserById = async (userId) => {
  const user = await User.findById(userId)
    .select('_id name email role status createdAt updatedAt')
    .lean();

  if (!user) {
    return null;
  }

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status || 'active',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

/**
 * Updates a target user's role securely with strict administrative authorization checks.
 *
 * Enforces:
 * - Admin self-demotion prevention (admin cannot change their own role away from 'admin')
 * - Existence verification of the target user
 * - Verification that the target user's current role is supported
 * - Role-only database update without touching timestamps, names, emails, passwords, etc.
 * - Invalidation of target user's active refresh sessions when role changes
 * - Returns only sanitized safe user fields
 *
 * @param {Object} params
 * @param {string} params.targetUserId - Target MongoDB ObjectId from validated URL param.
 * @param {string} params.newRole - 'student' | 'course_creator' | 'admin'.
 * @param {string} params.adminUserId - Authenticated administrator ID from verified JWT.
 * @returns {Promise<Object>} Safe user record.
 */
export const updateUserRole = async ({ targetUserId, newRole, adminUserId }) => {
  const normalizedNewRole = normalizeRole(newRole);
  if (!normalizedNewRole || !CANONICAL_ROLES.includes(normalizedNewRole)) {
    const error = new Error('Invalid role specified');
    error.statusCode = 400;
    throw error;
  }

  // 1. Guard against administrators removing their own administrator role
  if (adminUserId && adminUserId.toString() === targetUserId.toString() && normalizedNewRole !== 'admin') {
    const error = new Error('Administrators cannot remove their own administrator role');
    error.statusCode = 400;
    throw error;
  }

  // 2. Verify target user exists
  const targetUser = await User.findById(targetUserId).select('_id name email role status createdAt updatedAt');
  if (!targetUser) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // 3. Verify target user's current role is supported
  const currentCanonicalRole = normalizeRole(targetUser.role);
  if (!currentCanonicalRole || !CANONICAL_ROLES.includes(currentCanonicalRole)) {
    const error = new Error('Target user has an unsupported role');
    error.statusCode = 400;
    throw error;
  }

  // 4. Update ONLY the target user's role without touching any other fields or timestamps
  const roleChanged = currentCanonicalRole !== normalizedNewRole;
  if (roleChanged) {
    await User.updateOne(
      { _id: targetUserId },
      { $set: { role: normalizedNewRole } },
      { timestamps: false }
    );

    // 5. Invalidate existing refresh sessions for this user so old tokens cannot refresh sessions
    await RefreshSession.updateMany(
      {
        userId: targetUserId,
        revokedAt: null,
      },
      {
        $set: {
          revokedAt: new Date(),
        },
      }
    );
  }

  // 6. Return strictly safe user fields
  return {
    id: targetUser._id.toString(),
    name: targetUser.name,
    email: targetUser.email,
    role: newRole,
    status: targetUser.status || 'active',
    createdAt: targetUser.createdAt,
    updatedAt: targetUser.updatedAt,
  };
};

/**
 * Updates a target user's account status (active/inactive) securely.
 *
 * Enforces:
 * - Admin self-deactivation prevention (admin cannot set their own status to 'inactive')
 * - Existence verification of the target user
 * - Verification that the requested status is either 'active' or 'inactive'
 * - Status-only database update without touching timestamps, names, emails, roles, passwords
 * - When deactivating (status becomes 'inactive'), immediately revokes ALL active RefreshSession documents
 * - Returns only sanitized safe user fields: id, name, email, role, status, createdAt, updatedAt
 *
 * @param {Object} params
 * @param {string} params.targetUserId - Target MongoDB ObjectId from validated URL param.
 * @param {string} params.newStatus - 'active' | 'inactive'.
 * @param {string} params.adminUserId - Authenticated administrator ID from verified JWT.
 * @returns {Promise<Object>} Safe user record.
 */
export const updateUserStatus = async ({ targetUserId, newStatus, adminUserId }) => {
  const VALID_STATUSES = ['active', 'inactive'];

  // 1. Guard against administrators deactivating their own account
  if (adminUserId && adminUserId.toString() === targetUserId.toString() && newStatus === 'inactive') {
    const error = new Error('Administrators cannot deactivate their own account');
    error.statusCode = 400;
    throw error;
  }

  // 2. Verify target user exists
  const targetUser = await User.findById(targetUserId).select('_id name email role status createdAt updatedAt');
  if (!targetUser) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // 3. Verify requested status is valid
  if (!VALID_STATUSES.includes(newStatus)) {
    const error = new Error('Invalid account status');
    error.statusCode = 400;
    throw error;
  }

  // 4. Update ONLY the target user's status without modifying any other fields
  const currentStatus = targetUser.status || 'active';
  const statusChanged = currentStatus !== newStatus;

  if (statusChanged) {
    await User.updateOne(
      { _id: targetUserId },
      { $set: { status: newStatus } },
      { timestamps: false }
    );

    // 5. If transitioning to 'inactive', immediately revoke ALL active refresh sessions
    if (newStatus === 'inactive') {
      await RefreshSession.updateMany(
        {
          userId: targetUserId,
          revokedAt: null,
        },
        {
          $set: {
            revokedAt: new Date(),
          },
        }
      );
    }
  }

  // 6. Return strictly safe user fields
  return {
    id: targetUser._id.toString(),
    name: targetUser.name,
    email: targetUser.email,
    role: targetUser.role,
    status: newStatus,
    createdAt: targetUser.createdAt,
    updatedAt: targetUser.updatedAt,
  };
};

export default {
  getDashboardSummary,
  getUsersList,
  getUserById,
  updateUserRole,
  updateUserStatus,
};
