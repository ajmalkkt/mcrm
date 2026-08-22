const db = require('../config/database');
const { storeDocumentMetadata } = require('../services/documentStorageService');

const generateNextAccountId = async (clientTx) => {
  const { rows } = await clientTx.query(`
    SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(account_id, '^ACC-', '', 'g') AS INTEGER)), 0) + 1 AS next_number
    FROM Client_Account
    WHERE account_id ~ '^ACC-[0-9]+$';
  `);

  return `ACC-${rows[0].next_number}`;
};

const getClientAccounts = async (req, res) => {
  const { search, status } = req.query;

  try {
    let queryValues = [];
    let whereClauses = [];

    if (search) {
      queryValues.push(`%${search.trim()}%`);
      whereClauses.push(
        `(ca.client_name ILIKE $${queryValues.length} OR ca.account_id ILIKE $${queryValues.length} OR ca.contact_number ILIKE $${queryValues.length} OR ca.client_code ILIKE $${queryValues.length})`
      );
    }

    if (status && status !== 'ALL') {
      queryValues.push(status.toUpperCase());
      whereClauses.push(`cs.status = $${queryValues.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const query = `
      SELECT 
        ca.account_id,
        ca.client_code,
        ca.client_name,
        ca.contact_number,
        ca.secondary_contact_number,
        ca.email,
        ca.address,
        ca.city,
        ca.state,
        ca.country,
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
      GROUP BY ca.account_id, ca.client_code, ca.client_name, ca.contact_number, ca.secondary_contact_number, ca.email, ca.address, ca.city, ca.state, ca.country, ca.latitude, ca.longitude, ca.created_at
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

const getClientAccountById = async (req, res) => {
  const { accountId } = req.params;

  try {
    const query = `
      SELECT 
        ca.account_id,
        ca.client_code,
        ca.client_name,
        ca.contact_number,
        ca.secondary_contact_number,
        ca.email,
        ca.address,
        ca.city,
        ca.state,
        ca.country,
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
      GROUP BY ca.account_id, ca.client_code, ca.client_name, ca.contact_number, ca.secondary_contact_number, ca.email, ca.address, ca.city, ca.state, ca.country, ca.latitude, ca.longitude, ca.created_at;
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

const createClient = async (req, res) => {
  const client = await db.pool.connect();
  const {
    account_id,
    client_code,
    client_name,
    contact_number,
    secondary_contact_number,
    email,
    address,
    city,
    state,
    country,
    latitude,
    longitude,
    services = [],
    documents = []
  } = req.body;

  if (!client_name || !contact_number || !email) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: client_name, contact_number, and email are required.'
    });
  }

  try {
    await client.query('BEGIN');

    const resolvedAccountId = (account_id && String(account_id).trim()) || await generateNextAccountId(client);

    const insertQuery = `
      INSERT INTO Client_Account (
        account_id,
        client_code,
        client_name,
        contact_number,
        secondary_contact_number,
        email,
        address,
        city,
        state,
        country,
        latitude,
        longitude
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;

    const result = await client.query(insertQuery, [
      resolvedAccountId,
      client_code || resolvedAccountId,
      client_name,
      contact_number,
      secondary_contact_number || null,
      email,
      address || null,
      city || null,
      state || null,
      country || null,
      latitude || null,
      longitude || null,
    ]);

    const normalizedServices = Array.isArray(services) ? services : [];
    for (const service of normalizedServices) {
      if (!service?.plan_id) continue;

      const startDate = service.start_date || service.startDate || new Date().toISOString().slice(0, 10);
      const endDate = service.end_date || service.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const status = service.status || 'PENDING_PROVISION';

      await client.query(
        `
          INSERT INTO Client_Service (account_id, plan_id, start_date, end_date, status)
          VALUES ($1, $2, $3, $4, $5);
        `,
        [resolvedAccountId, service.plan_id, startDate, endDate, status]
      );
    }

    await storeDocumentMetadata(client, 'CLIENT', resolvedAccountId, documents);

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Client account created',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating client account:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create client account',
      error: error.message
    });
  } finally {
    client.release();
  }
};

module.exports = {
  getClientAccounts,
  getClientAccountById,
  createClient,
};