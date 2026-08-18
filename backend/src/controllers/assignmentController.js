// controllers/assignmentController.js
import db from '../config/database.js';
import { ASSIGNMENT_QUERIES } from '../constants/assignmentQueries.js';

// Batch assign accounts to a agent
export const batchAssignAccounts = async (req, res) => {
  try {
    const { userId, targetIds } = req.body; // targetIds: ['ACC-001', 'ACC-002']

    const result = await db.query(ASSIGNMENT_QUERIES.BATCH_CREATE_ASSIGNMENTS, [
      userId,
      'ACCOUNT',
      targetIds
    ]);

    res.status(200).json({
      success: true,
      message: `Successfully assigned ${result.rowCount} accounts.`,
      data: result.rows
    });
  } catch (error) {
    console.error('Error creating batch assignments:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};