import studentDashboardService from '../services/studentDashboardService.js';

/**
 * GET /api/student/dashboard
 * Retrieves the authenticated student's dashboard including profile, stats,
 * and course summaries with verified topic progress metrics.
 */
export const getStudentDashboard = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    const data = await studentDashboardService.getStudentDashboard({ userId });

    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (err) {
    return next(err);
  }
};
