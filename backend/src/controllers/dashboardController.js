import { fetchDashboardData } from '../services/dashboardService.js';

export const getDashboardOverview = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const userRole = req.user.role;
    const expiryDays = parseInt(req.query.expiryDays, 10) || 30;

    const data = await fetchDashboardData(userId, userRole, expiryDays);

    return res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve dashboard analytics.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};