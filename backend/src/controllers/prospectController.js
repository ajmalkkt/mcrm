import db from '../config/database.js';
import { PROSPECT_QUERIES } from '../constants/prospectQueries.js';
//import { createProspect, getProspects } from '../services/prospectService.js';
import * as prospectService from '../services/prospectService.js';
/**
 * CREATE a new prospect
 * POST /api/prospects
 */
export const createProspect = async (req, res, next) => {
  try {
    const { prospect_name, contact_number, email } = req.body;

    if (!prospect_name || !contact_number || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: prospect_name, contact_number, and email are required.'
      });
    }

    const newProspect = await prospectService.createProspect(req.body);

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

/**
 * GET all prospects (Supports query params ?status=NEW&search=ACME)
 * GET /api/prospects
 */
export const getProspects = async (req, res, next) => {
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

/**
 * GET prospect by ID
 * GET /api/prospects/:id
 */
export const getProspectById = async (req, res, next) => {
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

/**
 * UPDATE prospect details
 * PUT /api/prospects/:id
 */
export const updateProspect = async (req, res, next) => {
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

/**
 * DELETE prospect
 * DELETE /api/prospects/:id
 */
export const deleteProspect = async (req, res, next) => {
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

/**
 * CONVERT prospect to client account (Transaction)
 * POST /api/prospects/:prospectId/convert
 */
export const convertProspectToAccount = async (req, res) => {
  const client = await db.getClient(); // Dedicated client for transaction

  try {
    const { prospectId } = req.params;
    const {
      accountId, // Business Account Number (e.g., 'ACC-982341')
      clientName,
      contactNumber,
      address,
      latitude,
      longitude,
      planId,
      startDate,
      endDate,
      assignToUserId
    } = req.body;

    await client.query('BEGIN'); // 1. Begin SQL Transaction

    // Step 1: Create Client_Account
    const accountRes = await client.query(
      PROSPECT_QUERIES.PROMOTE_CREATE_CLIENT_ACCOUNT,
      [accountId, clientName, contactNumber, address, latitude, longitude]
    );

    // Step 2: Activate Client_Service
    const serviceRes = await client.query(
      PROSPECT_QUERIES.PROMOTE_CREATE_CLIENT_SERVICE,
      [accountId, planId, startDate, endDate]
    );

    // Step 3: Transfer existing Prospect documents to Client entity
    await client.query(
      PROSPECT_QUERIES.PROMOTE_TRANSFER_DOCUMENTS,
      [accountId, prospectId]
    );

    // Step 4: Update Prospect status to CONVERTED
    await client.query(
      PROSPECT_QUERIES.PROMOTE_UPDATE_PROSPECT_STATUS,
      [prospectId]
    );

    // Step 5: Assign Account to User (If assigned)
    if (assignToUserId) {
      await client.query(
        PROSPECT_QUERIES.PROMOTE_ASSIGN_ACCOUNT_TO_USER,
        [assignToUserId, accountId]
      );
    }

    await client.query('COMMIT'); // 2. Commit Transaction

    return res.status(201).json({
      success: true,
      message: 'Prospect converted to active client account successfully',
      data: {
        account: accountRes.rows[0],
        service: serviceRes.rows[0]
      }
    });

  } catch (error) {
    await client.query('ROLLBACK'); // Rollback on failure
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