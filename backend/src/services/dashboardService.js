const db = require('../config/database');
const { DASHBOARD_QUERIES } = require('../constants/dashboardQueries');

const fetchDashboardData = async (userId, userRole, expiryDays = 30) => {
  const [metricsRes, expiringRes, followupsRes, prospectsRes] = await Promise.all([
    db.query(DASHBOARD_QUERIES.GET_METRICS, [userRole, userId, expiryDays]),
    db.query(DASHBOARD_QUERIES.GET_EXPIRING_SERVICES_FEED, [userRole, userId, expiryDays, 5]),
    db.query(DASHBOARD_QUERIES.GET_PENDING_FOLLOWUPS_FEED, [userRole, userId, 5]),
    db.query(DASHBOARD_QUERIES.GET_PROSPECT_STATUS_BREAKDOWN)
  ]);

  const metrics = metricsRes.rows[0] || {};

  return {
    summary: {
      activeServices: parseInt(metrics.active_services_count || 0, 10),
      expiringServices: parseInt(metrics.expiring_services_count || 0, 10),
      pendingFollowups: parseInt(metrics.pending_followups_count || 0, 10),
      openProspects: parseInt(metrics.open_prospects_count || 0, 10)
    },
    alerts: {
      expiringServices: expiringRes.rows,
      pendingFollowups: followupsRes.rows
    },
    prospectBreakdown: prospectsRes.rows.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count, 10);
      return acc;
    }, {})
  };
};

module.exports = { fetchDashboardData };