/**
 * Interaction & Call Log SQL Queries
 * Compatible with PostgreSQL 16
 */

export const CALL_LOG_QUERIES = {
  // ==========================================
  // 1. Log Creation & Updates
  // ==========================================

  /**
   * Logs a new call interaction against a Prospect or Client Service.
   * Parameters:
   *  $1: userId (VARCHAR(36))
   *  $2: entityType ('CLIENT_SERVICE' | 'PROSPECT')
   *  $3: entityId (VARCHAR(50))
   *  $4: remarks (TEXT)
   *  $5: requiresFollowup (BOOLEAN)
   *  $6: followupDate (TIMESTAMP WITH TIME ZONE or NULL)
   */
  CREATE_CALL_LOG: `
    INSERT INTO Interaction_Call_Log (
        user_id,
        entity_type,
        entity_id,
        remarks,
        requires_followup,
        followup_date,
        is_closed
    )
    VALUES ($1, $2, $3, $4, $5, $6, FALSE)
    RETURNING 
        log_id,
        user_id,
        entity_type,
        entity_id,
        call_timestamp,
        remarks,
        requires_followup,
        followup_date,
        is_closed;
  `,

  /**
   * Marks a pending follow-up as resolved/closed.
   * Parameters:
   *  $1: logId (VARCHAR(36))
   *  $2: userId (VARCHAR(36) - Enforces agent ownership if role is 'USER')
   *  $3: userRole ('ADMIN' | 'MANAGER' | 'USER')
   */
  CLOSE_FOLLOWUP: `
    UPDATE Interaction_Call_Log
    SET 
        is_closed = TRUE
    WHERE log_id = $1
      AND ($3 IN ('ADMIN', 'MANAGER') OR user_id = $2)
    RETURNING log_id, entity_type, entity_id, is_closed;
  `,

  /**
   * Reschedules an existing pending follow-up.
   * Parameters:
   *  $1: logId (VARCHAR(36))
   *  $2: newFollowupDate (TIMESTAMP WITH TIME ZONE)
   *  $3: remarks (TEXT - optional append/update)
   *  $4: userId (VARCHAR(36))
   *  $5: userRole ('ADMIN' | 'MANAGER' | 'USER')
   */
  RESCHEDULE_FOLLOWUP: `
    UPDATE Interaction_Call_Log
    SET 
        followup_date = $2,
        remarks = COALESCE($3, remarks),
        is_closed = FALSE,
        requires_followup = TRUE
    WHERE log_id = $1
      AND ($5 IN ('ADMIN', 'MANAGER') OR user_id = $4)
    RETURNING log_id, followup_date, is_closed, remarks;
  `,

  // ==========================================
  // 2. Retrieval & Feeds
  // ==========================================

  /**
   * Fetches interaction logs for a specific entity (Client Service or Prospect).
   * Parameters:
   *  $1: entityType ('CLIENT_SERVICE' | 'PROSPECT')
   *  $2: entityId (VARCHAR(50))
   *  $3: limit (Integer)
   *  $4: offset (Integer)
   */
  GET_LOGS_BY_ENTITY: `
    SELECT 
        icl.log_id,
        icl.user_id,
        u.first_name || ' ' || u.last_name AS agent_name,
        icl.entity_type,
        icl.entity_id,
        icl.call_timestamp,
        icl.remarks,
        icl.requires_followup,
        icl.followup_date,
        icl.is_closed
    FROM Interaction_Call_Log icl
    JOIN Users u ON icl.user_id = u.user_id
    WHERE icl.entity_type = $1 
      AND icl.entity_id = $2
    ORDER BY icl.call_timestamp DESC
    LIMIT $3 OFFSET $4;
  `,

  /**
   * Fetches all pending follow-ups for a specific agent or full team feed.
   * Parameters:
   *  $1: userRole ('ADMIN' | 'MANAGER' | 'USER')
   *  $2: userId (VARCHAR(36))
   *  $3: includeOverdueOnly (BOOLEAN)
   *  $4: limit (Integer)
   *  $5: offset (Integer)
   */
  GET_AGENT_FOLLOWUPS: `
    SELECT 
        icl.log_id,
        icl.entity_type,
        icl.entity_id,
        icl.call_timestamp,
        icl.followup_date,
        icl.remarks,
        u.first_name || ' ' || u.last_name AS agent_name,
        CASE 
            WHEN icl.entity_type = 'PROSPECT' THEN p.prospect_name
            WHEN icl.entity_type = 'CLIENT_SERVICE' THEN ca.client_name
        END AS contact_name,
        CASE 
            WHEN icl.entity_type = 'PROSPECT' THEN p.contact_number
            WHEN icl.entity_type = 'CLIENT_SERVICE' THEN ca.contact_number
        END AS contact_number
    FROM Interaction_Call_Log icl
    JOIN Users u ON icl.user_id = u.user_id
    LEFT JOIN Prospect p 
        ON icl.entity_type = 'PROSPECT' AND icl.entity_id = p.prospect_id
    LEFT JOIN Client_Service cs 
        ON icl.entity_type = 'CLIENT_SERVICE' AND icl.entity_id = cs.client_service_id
    LEFT JOIN Client_Account ca 
        ON cs.account_id = ca.account_id
    WHERE icl.requires_followup = TRUE
      AND icl.is_closed = FALSE
      AND ($1 IN ('ADMIN', 'MANAGER') OR icl.user_id = $2)
      AND ($3 = FALSE OR icl.followup_date <= NOW())
    ORDER BY icl.followup_date ASC
    LIMIT $4 OFFSET $5;
  `,

  /**
   * Aggregates daily call statistics per agent for manager reporting.
   * Parameters:
   *  $1: startDate (TIMESTAMP WITH TIME ZONE)
   *  $2: endDate (TIMESTAMP WITH TIME ZONE)
   */
  GET_CALL_METRICS_PER_AGENT: `
    SELECT 
        u.user_id,
        u.first_name || ' ' || u.last_name AS agent_name,
        COUNT(icl.log_id) AS total_calls_logged,
        COUNT(icl.log_id) FILTER (WHERE icl.requires_followup = TRUE) AS followups_scheduled,
        COUNT(icl.log_id) FILTER (WHERE icl.requires_followup = TRUE AND icl.is_closed = TRUE) AS followups_resolved
    FROM Users u
    LEFT JOIN Interaction_Call_Log icl 
        ON u.user_id = icl.user_id 
       AND icl.call_timestamp BETWEEN $1 AND $2
    WHERE u.is_active = TRUE
    GROUP BY u.user_id, u.first_name, u.last_name
    ORDER BY total_calls_logged DESC;
  `
};