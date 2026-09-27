import adminService from '../services/adminService.js';

/**
 * Controller for Admin User Management endpoints.
 */

/**
 * GET /api/admin/users
 * Returns a paginated list of safe user records.
 */
export const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const { search, role, status } = req.query;

    const result = await adminService.getUsersList({
      page,
      limit,
      search,
      role,
      status,
    });

    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * GET /api/admin/users/:id
 * Returns a single user by MongoDB ObjectId with only safe fields.
 */
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await adminService.getUserById(id);

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /api/admin/users/:id/role
 * Updates a target user's role and returns only safe fields.
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { id: targetUserId } = req.params;
    const { role: newRole } = req.body;
    // Administrator identity is established strictly from authenticated JWT token
    const adminUserId = req.user?.userId;

    const updatedUser = await adminService.updateUserRole({
      targetUserId,
      newRole,
      adminUserId,
    });

    return res.status(200).json({
      status: 'success',
      message: 'User role updated successfully',
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    return next(err);
  }
};

/**
 * PATCH /api/admin/users/:id/status
 * Updates a target user's account status (active/inactive) and returns only safe fields.
 */
export const updateUserStatus = async (req, res, next) => {
  try {
    const { id: targetUserId } = req.params;
    const { status: newStatus } = req.body;
    // Administrator identity is established strictly from authenticated JWT token
    const adminUserId = req.user?.userId;

    const updatedUser = await adminService.updateUserStatus({
      targetUserId,
      newStatus,
      adminUserId,
    });

    return res.status(200).json({
      status: 'success',
      message: 'User status updated successfully',
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export default {
  getUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
};
