// controllers/callLogController.js
import db from '../config/database.js';
import { CALL_LOG_QUERIES } from '../constants/callLogQueries.js';

// Close a pending follow-up task
export const markFollowupClosed = async (req, res) => {
  try {
    const { logId } = req.params;
    const { user_id, role } = req.user;

    const result = await db.query(CALL_LOG_QUERIES.CLOSE_FOLLOWUP, [
      logId,
      user_id,
      role
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Follow-up record not found or unauthorized'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Follow-up marked as resolved',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error closing follow-up:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};