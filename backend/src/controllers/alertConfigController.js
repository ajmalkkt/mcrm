const db = require('../config/database');

const getAlertConfiguration = async (req, res) => {
  try {
    const result = await db.query(
      `
        SELECT alert_id, renewal_warning_days, expiry_warning_days, followup_reminder_days, is_active, created_at, updated_at
        FROM Alert_Configuration
        ORDER BY created_at DESC
        LIMIT 1;
      `
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          alert_id: null,
          renewal_warning_days: 15,
          expiry_warning_days: 7,
          followup_reminder_days: 10,
          is_active: true,
        }
      });
    }

    return res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error fetching alert configuration:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve alert configuration.' });
  }
};

const upsertAlertConfiguration = async (req, res) => {
  const {
    renewal_warning_days = 15,
    expiry_warning_days = 7,
    followup_reminder_days = 10,
    is_active = true,
  } = req.body;

  try {
    const existing = await db.query(
      `SELECT alert_id FROM Alert_Configuration ORDER BY created_at DESC LIMIT 1;`
    );

    let result;
    if (existing.rows.length > 0) {
      result = await db.query(
        `
          UPDATE Alert_Configuration
          SET renewal_warning_days = $1,
              expiry_warning_days = $2,
              followup_reminder_days = $3,
              is_active = $4,
              updated_at = NOW()
          WHERE alert_id = $5
          RETURNING *;
        `,
        [renewal_warning_days, expiry_warning_days, followup_reminder_days, is_active, existing.rows[0].alert_id]
      );
    } else {
      result = await db.query(
        `
          INSERT INTO Alert_Configuration (
            renewal_warning_days,
            expiry_warning_days,
            followup_reminder_days,
            is_active,
            updated_at
          )
          VALUES ($1, $2, $3, $4, NOW())
          RETURNING *;
        `,
        [renewal_warning_days, expiry_warning_days, followup_reminder_days, is_active]
      );
    }

    return res.status(200).json({ success: true, message: 'Alert configuration updated', data: result.rows[0] });
  } catch (error) {
    console.error('Error updating alert configuration:', error);
    return res.status(500).json({ success: false, message: 'Failed to update alert configuration.' });
  }
};

module.exports = {
  getAlertConfiguration,
  upsertAlertConfiguration,
};
