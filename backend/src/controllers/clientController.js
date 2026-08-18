const db = require('../config/database');

/**
 * Fetch Client Accounts with joined Client Services
 * Supports optional search query (?search=...) and status filter (?status=ACTIVE)
 */
const getClientAccounts = async (req, res) => {
  const { search, status } = req.query;

  try {
    let queryValues = [];
    let whereClauses = [];

    // Filter by search term (Client Name, Account ID, or Phone)
    if (search) {
      queryValues.push(`%${search.trim()}%`);
      whereClauses.push(
        `(ca.client_name ILIKE $${queryValues.length} OR ca.account_id ILIKE $${queryValues.length} OR ca.contact_number ILIKE $${queryValues.length})`
      );
    }

    // Filter by service status
    if (status && status !== 'ALL') {
      queryValues.push(status.toUpperCase());
      whereClauses.push(`cs.status = $${queryValues.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Aggregated SQL Query
    const query = `
      SELECT 
        ca.account_id,
        ca.client_name,
        ca.contact_number,
        ca.address,
        ca.latitude,
        ca.longitude,
        ca.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'client_service_id', cs.client_service_id,
              'account_id', cs.account_id,
              'plan_name', msp.plan_name,
              'product_name', mp.product_name,
              'billing_cycle', msp.billing_cycle,
              'start_date', TO_CHAR(cs.start_date, 'YYYY-MM-DD'),
              'end_date', TO_CHAR(cs.end_date, 'YYYY-MM-DD'),
              'status', cs.status
            )
          ) FILTER (WHERE cs.client_service_id IS NOT NULL), 
          '[]'::json
        ) AS services
      FROM Client_Account ca
      LEFT JOIN Client_Service cs ON ca.account_id = cs.account_id
      LEFT JOIN Master_Service_Plan msp ON cs.plan_id = msp.plan_id
      LEFT JOIN Master_Product mp ON msp.product_id = mp.product_id
      ${whereSql}
      GROUP BY ca.account_id, ca.client_name, ca.contact_number, ca.address, ca.latitude, ca.longitude, ca.created_at
      ORDER BY ca.created_at DESC;
    `;

    const result = await db.query(query, queryValues);

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error fetching client accounts:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve client accounts',
    });
  }
};

/**
 * Fetch a single Client Account by ID with its services
 */
const getClientAccountById = async (req, res) => {
  const { accountId } = req.params;

  try {
    const query = `
      SELECT 
        ca.account_id,
        ca.client_name,
        ca.contact_number,
        ca.address,
        ca.latitude,
        ca.longitude,
        ca.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'client_service_id', cs.client_service_id,
              'account_id', cs.account_id,
              'plan_name', msp.plan_name,
              'product_name', mp.product_name,
              'billing_cycle', msp.billing_cycle,
              'start_date', TO_CHAR(cs.start_date, 'YYYY-MM-DD'),
              'end_date', TO_CHAR(cs.end_date, 'YYYY-MM-DD'),
              'status', cs.status
            )
          ) FILTER (WHERE cs.client_service_id IS NOT NULL), 
          '[]'::json
        ) AS services
      FROM Client_Account ca
      LEFT JOIN Client_Service cs ON ca.account_id = cs.account_id
      LEFT JOIN Master_Service_Plan msp ON cs.plan_id = msp.plan_id
      LEFT JOIN Master_Product mp ON msp.product_id = mp.product_id
      WHERE ca.account_id = $1
      GROUP BY ca.account_id, ca.client_name, ca.contact_number, ca.address, ca.latitude, ca.longitude, ca.created_at;
    `;

    const result = await db.query(query, [accountId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Client account not found' });
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching client account by ID:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve client account' });
  }
};

module.exports = {
  getClientAccounts,
  getClientAccountById,
};