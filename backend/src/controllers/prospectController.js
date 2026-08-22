const db = require('../config/database');
const { PROSPECT_QUERIES } = require('../constants/prospectQueries');
const prospectService = require('../services/prospectService');
const { storeDocumentMetadata } = require('../services/documentStorageService');

const parseJsonField = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      return value;
    }
  }
  return value;
};

const normalizeDocuments = (documents = [], uploadedFiles = []) => {
  const parsedDocuments = Array.isArray(documents) ? documents : parseJsonField(documents) || [];
  const mappedFiles = (uploadedFiles || []).map((file) => ({
    file_name: file.originalname,
    mime_type: file.mimetype,
    file_buffer: file.buffer,
    storage_driver: process.env.STORAGE_DRIVER || 'LOCAL',
  }));

  return [...mappedFiles, ...parsedDocuments.filter((doc) => doc && (doc.file_name || doc.fileName || doc.name || doc.file_content || doc.fileContent || doc.file_buffer || doc.fileBuffer))];
};

const generateNextAccountId = async (clientTx) => {
  const { rows } = await clientTx.query(`
    SELECT COALESCE(MAX(CAST(REGEXP_REPLACE(account_id, '^ACC-', '', 'g') AS INTEGER)), 0) + 1 AS next_number
    FROM Client_Account
    WHERE account_id ~ '^ACC-[0-9]+$';
  `);

  return `ACC-${rows[0].next_number}`;
};

const createProspect = async (req, res) => {
  try {
    const body = { ...req.body };
    const servicePreferences = parseJsonField(body.service_preferences);
    const documents = normalizeDocuments(body.documents || body.document_uploads, req.files || []);

    if (servicePreferences) {
      body.service_preferences = servicePreferences;
    }

    const { prospect_name, contact_number, email } = body;

    if (!prospect_name || !contact_number || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: prospect_name, contact_number, and email are required.'
      });
    }

    const newProspect = await prospectService.createProspect(body);
    await storeDocumentMetadata(
      db,
      'PROSPECT',
      newProspect.prospect_id,
      documents
    );

    return res.status(201).json({
      success: true,
      message: 'Prospect created successfully.',
      data: newProspect
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A prospect with this email address already exists.'
      });
    }
    console.error('Error creating prospect:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create prospect.',
      error: error.message
    });
  }
};

const getProspects = async (req, res) => {
  try {
    const { status, search } = req.query;
    const prospects = await prospectService.getProspects({ status, search });

    return res.status(200).json({
      success: true,
      count: prospects.length,
      data: prospects
    });
  } catch (error) {
    console.error('Error fetching prospects:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve prospects.',
      error: error.message
    });
  }
};

const getProspectById = async (req, res) => {
  try {
    const { id } = req.params;
    const prospect = await prospectService.getProspectById(id);

    if (!prospect) {
      return res.status(404).json({
        success: false,
        message: 'Prospect not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: prospect
    });
  } catch (error) {
    console.error('Error fetching prospect by ID:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve prospect details.',
      error: error.message
    });
  }
};

const updateProspect = async (req, res) => {
  try {
    const { id } = req.params;

    const existingProspect = await prospectService.getProspectById(id);
    if (!existingProspect) {
      return res.status(404).json({
        success: false,
        message: 'Prospect not found.'
      });
    }

    const updatedProspect = await prospectService.updateProspect(id, req.body);

    return res.status(200).json({
      success: true,
      message: 'Prospect updated successfully.',
      data: updatedProspect
    });
  } catch (error) {
    console.error('Error updating prospect:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update prospect.',
      error: error.message
    });
  }
};

const deleteProspect = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRecord = await prospectService.deleteProspect(id);

    if (!deletedRecord) {
      return res.status(404).json({
        success: false,
        message: 'Prospect not found or already deleted.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Prospect deleted successfully.',
      data: { prospect_id: id }
    });
  } catch (error) {
    console.error('Error deleting prospect:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete prospect.',
      error: error.message
    });
  }
};

const convertProspectToAccount = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const { prospectId } = req.params;
    const body = { ...req.body };
    const documents = normalizeDocuments(body.documents || body.document_uploads, req.files || []);
    const {
      account_id,
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
      plan_id,
      start_date,
      end_date,
      assign_to_user_id
    } = body;

    await client.query('BEGIN');

    const resolvedAccountId = (account_id && String(account_id).trim()) || await generateNextAccountId(client);

    const accountRes = await client.query(
      PROSPECT_QUERIES.PROMOTE_CREATE_CLIENT_ACCOUNT,
      [
        resolvedAccountId,
        client_name,
        contact_number,
        secondary_contact_number || null,
        email || null,
        address || null,
        city || null,
        state || null,
        country || null,
        latitude || null,
        longitude || null,
      ]
    );

    let serviceRes = null;
    if (plan_id && start_date && end_date) {
      serviceRes = await client.query(
        PROSPECT_QUERIES.PROMOTE_CREATE_CLIENT_SERVICE,
        [resolvedAccountId, plan_id, start_date, end_date]
      );
    }

    await storeDocumentMetadata(
      client,
      'CLIENT',
      resolvedAccountId,
      req.body.documents || []
    );

    await client.query(
      PROSPECT_QUERIES.PROMOTE_TRANSFER_DOCUMENTS,
      [resolvedAccountId, prospectId]
    );

    await client.query(
      PROSPECT_QUERIES.PROMOTE_UPDATE_PROSPECT_STATUS,
      [prospectId]
    );

    if (documents.length > 0) {
      await storeDocumentMetadata(client, 'CLIENT', resolvedAccountId, documents);
    }

    if (assign_to_user_id) {
      await client.query(
        PROSPECT_QUERIES.PROMOTE_ASSIGN_ACCOUNT_TO_USER,
        [assign_to_user_id, resolvedAccountId]
      );
    }

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      message: 'Prospect converted to active client account successfully',
      data: {
        account: accountRes.rows[0],
        service: serviceRes ? serviceRes.rows[0] : null
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Prospect conversion transaction failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to convert prospect',
      error: error.message
    });
  } finally {
    client.release();
  }
};

module.exports = {
  createProspect,
  getProspects,
  getProspectById,
  updateProspect,
  deleteProspect,
  convertProspectToAccount,
};