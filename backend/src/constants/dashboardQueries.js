/**
 * Dashboard & Analytics SQL Queries
 * Compatible with PostgreSQL 16
 */

export const DASHBOARD_QUERIES = {
  /**
   * Fetches core aggregate metrics based on user role and assignment scope.
   * Parameters:
   *  $1: userRole ('ADMIN', 'MANAGER', 'USER')
   *  $2: userId (VARCHAR(36))
   *  $3: expiryWindowDays (Integer - e.g., 30, 15, 7)
   */
  GET_METRICS: `
    WITH accessible_services AS (
        SELECT 
            cs.client_service_id, 
            cs.account_id, 
            cs.plan_id, 
            cs.end_date, 
            cs.status
        FROM Client_Service cs
        LEFT JOIN Assignment_Rule ar_acc 
            ON cs.account_id = ar_acc.target_id AND ar_acc.assignment_type = 'ACCOUNT'
        LEFT JOIN Assignment_Rule ar_srv 
            ON cs.client_service_id = ar_srv.target_id AND ar_srv.assignment_type = 'SERVICE'
        WHERE 
            $1 IN ('ADMIN', 'MANAGER') 
            OR ar_acc.user_id = $2 
            OR ar_srv.user_id = $2
    )
    SELECT 
        -- Active Services Count
        COUNT(DISTINCT client_service_id) FILTER (WHERE status = 'ACTIVE') AS active_services_count,

        -- FR-5.2 Expiring Service Alerts Count
        COUNT(DISTINCT client_service_id) FILTER (
            WHERE status = 'ACTIVE' 
            AND end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + ($3 || ' days')::INTERVAL)
        ) AS expiring_services_count,

        -- FR-5.3 Pending Follow-Up Alert Feed Count
        (
            SELECT COUNT(*)
            FROM Interaction_Call_Log cl
            WHERE cl.requires_followup = TRUE 
              AND cl.is_closed = FALSE
              AND cl.followup_date <= NOW()
              AND ($1 IN ('ADMIN', 'MANAGER') OR cl.user_id = $2)
        ) AS pending_followups_count,

        -- Unconverted Prospects Count
        (
            SELECT COUNT(*)
            FROM Prospect
            WHERE status IN ('NEW', 'IN_PROGRESS')
        ) AS open_prospects_count

    FROM accessible_services;
  `,

  /**
   * Fetches list of expiring service contracts for the dashboard alert feed.
   * Parameters:
   *  $1: userRole ('ADMIN', 'MANAGER', 'USER')
   *  $2: userId (VARCHAR(36))
   *  $3: expiryWindowDays (Integer)
   *  $4: limit (Integer, default 10)
   */
  GET_EXPIRING_SERVICES_FEED: `
    SELECT 
        cs.client_service_id,
        cs.account_id,
        ca.client_name,
        ca.contact_number,
        msp.plan_name,
        cs.end_date,
        (cs.end_date - CURRENT_DATE) AS days_remaining
    FROM Client_Service cs
    JOIN Client_Account ca ON cs.account_id = ca.account_id
    JOIN Master_Service_Plan msp ON cs.plan_id = msp.plan_id
    LEFT JOIN Assignment_Rule ar_acc 
        ON cs.account_id = ar_acc.target_id AND ar_acc.assignment_type = 'ACCOUNT'
    LEFT JOIN Assignment_Rule ar_srv 
        ON cs.client_service_id = ar_srv.target_id AND ar_srv.assignment_type = 'SERVICE'
    WHERE cs.status = 'ACTIVE'
      AND cs.end_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + ($3 || ' days')::INTERVAL)
      AND ($1 IN ('ADMIN', 'MANAGER') OR ar_acc.user_id = $2 OR ar_srv.user_id = $2)
    ORDER BY cs.end_date ASC
    LIMIT $4;
  `,

  /**
   * Fetches pending interaction follow-ups for the agent dashboard.
   * Parameters:
   *  $1: userRole ('ADMIN', 'MANAGER', 'USER')
   *  $2: userId (VARCHAR(36))
   *  $3: limit (Integer)
   */
  GET_PENDING_FOLLOWUPS_FEED: `
    SELECT 
        icl.log_id,
        icl.entity_type,
        icl.entity_id,
        icl.call_timestamp,
        icl.followup_date,
        icl.remarks,
        u.first_name || ' ' || u.last_name AS logged_by
    FROM Interaction_Call_Log icl
    JOIN Users u ON icl.user_id = u.user_id
    WHERE icl.requires_followup = TRUE 
      AND icl.is_closed = FALSE
      AND icl.followup_date <= NOW()
      AND ($1 IN ('ADMIN', 'MANAGER') OR icl.user_id = $2)
    ORDER BY icl.followup_date ASC
    LIMIT $3;
  `,

  /**
   * Breakdown of prospects grouped by status (NEW, IN_PROGRESS, CONVERTED, REJECTED).
   */
  GET_PROSPECT_STATUS_BREAKDOWN: `
    SELECT 
        status, 
        COUNT(*) AS count 
    FROM Prospect 
    GROUP BY status;
  `
};