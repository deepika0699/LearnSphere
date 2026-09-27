import adminService from '../services/adminService.js';

/**
 * Controller for Admin Dashboard endpoints.
 */

/**
 * GET /api/admin/dashboard
 * Returns overall statistics and user breakdown from real MongoDB data.
 */
export const getDashboard = async (req, res, next) => {
  try {
    const summary = await adminService.getDashboardSummary();

    return res.status(200).json({
      status: 'success',
      data: summary,
    });
  } catch (err) {
    return next(err);
  }
};

export default {
  getDashboard,
};
