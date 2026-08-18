/**
 * Data Assignment & Access Control SQL Queries
 * Compatible with PostgreSQL 16
 */

export const ASSIGNMENT_QUERIES = {
  // ==========================================
  // 1. Assignment Creation & Management
  // ==========================================

  /**
   * Assigns a single target (Account or Service) to a user.
   * Uses ON CONFLICT DO NOTHING (via unique lookup) to prevent duplicate assignments.
   * Parameters:
   *  $1: userId (VARCHAR(36))
   *  $2: assignmentType ('ACCOUNT' | 'SERVICE')
   *  $3: targetId (VARCHAR(50))
   */
  CREATE_ASSIGNMENT: `
    INSERT INTO Assignment_Rule (
        user_id,
        assignment_type,
        target_id
    )
    SELECT $1, $2, $3
    WHERE NOT EXISTS (
        SELECT 1 FROM Assignment_Rule 
        WHERE user_id = $1 
          AND assignment_type = $2 
          AND target_id = $3
    )
    RETURNING assignment_id, user_id, assignment_type, target_id, assigned_at;
  `,

  /**
   * Batch assigns multiple targets to a user using unnested arrays.
   * Parameters:
   *  $1: userId (VARCHAR(36))
   *  $2: assignmentType ('ACCOUNT' | 'SERVICE')
   *  $3: targetIds (Array of VARCHAR(50) - e.g., ['ACC-101', 'ACC-102'])
   */
  BATCH_CREATE_ASSIGNMENTS: `
    INSERT INTO Assignment_Rule (
        user_id,
        assignment_type,
        target_id
    )
    SELECT 
        $1, 
        $2, 
        unnest($3::VARCHAR[])
    ON CONFLICT DO NOTHING
    RETURNING assignment_id, user_id, assignment_type, target_id, assigned_at;
  `,

  /**
   * Revokes a specific assignment by assignment_id.
   * Parameters:
   *  $1: assignmentId (VARCHAR(36))
   */
  REVOKE_ASSIGNMENT_BY_ID: `
    DELETE FROM Assignment_Rule
    WHERE assignment_id = $1
    RETURNING assignment_id, user_id, assignment_type, target_id;
  `,

  /**
   * Revokes a specific mapping between a user and target.
   * Parameters:
   *  $1: userId (VARCHAR(36))
   *  $2: assignmentType ('ACCOUNT' | 'SERVICE')
   *  $3: targetId (VARCHAR(50))
   */
  REVOKE_ASSIGNMENT_BY_TARGET: `
    DELETE FROM Assignment_Rule
    WHERE user_id = $1
      AND assignment_type = $2
      AND target_id = $3
    RETURNING assignment_id, user_id, assignment_type, target_id;
  `,

  /**
   * Reassigns a set of targets from one agent to another (Transfer ownership).
   * Parameters:
   *  $1: newUserId (VARCHAR(36))
   *  $2: currentUserId (VARCHAR(36))
   *  $3: assignmentType ('ACCOUNT' | 'SERVICE')
   *  $4: targetIds (Array of VARCHAR(50))
   */
  REASSIGN_TARGETS: `
    UPDATE Assignment_Rule
    SET 
        user_id = $1,
        assigned_at = CURRENT_TIMESTAMP
    WHERE user_id = $2
      AND assignment_type = $3
      AND target_id = ANY($4::VARCHAR[])
    RETURNING assignment_id, user_id, assignment_type, target_id, assigned_at;
  `,

  // ==========================================
  // 2. Fetching & Access Verification
  // ==========================================

  /**
   * Lists all assignments for a specific user with resolved account/service details.
   * Parameters:
   *  $1: userId (VARCHAR(36))
   *  $2: limit (Integer)
   *  $3: offset (Integer)
   */
  GET_ASSIGNMENTS_BY_USER: `
    SELECT 
        ar.assignment_id,
        ar.user_id,
        ar.assignment_type,
        ar.target_id,
        ar.assigned_at,
        CASE 
            WHEN ar.assignment_type = 'ACCOUNT' THEN ca.client_name
            WHEN ar.assignment_type = 'SERVICE' THEN ca_srv.client_name || ' (' || msp.plan_name || ')'
        END AS target_display_name
    FROM Assignment_Rule ar
    LEFT JOIN Client_Account ca 
        ON ar.assignment_type = 'ACCOUNT' AND ar.target_id = ca.account_id
    LEFT JOIN Client_Service cs 
        ON ar.assignment_type = 'SERVICE' AND ar.target_id = cs.client_service_id
    LEFT JOIN Client_Account ca_srv 
        ON cs.account_id = ca_srv.account_id
    LEFT JOIN Master_Service_Plan msp 
        ON cs.plan_id = msp.plan_id
    WHERE ar.user_id = $1
    ORDER BY ar.assigned_at DESC
    LIMIT $2 OFFSET $3;
  `,

  /**
   * Retrieves all agents/users assigned to a specific account or service.
   * Parameters:
   *  $1: assignmentType ('ACCOUNT' | 'SERVICE')
   *  $2: targetId (VARCHAR(50))
   */
  GET_ASSIGNED_USERS_FOR_TARGET: `
    SELECT 
        ar.assignment_id,
        ar.assigned_at,
        u.user_id,
        u.username,
        u.email,
        u.first_name || ' ' || u.last_name AS agent_name,
        u.role
    FROM Assignment_Rule ar
    JOIN Users u ON ar.user_id = u.user_id
    WHERE ar.assignment_type = $1 
      AND ar.target_id = $2
    ORDER BY ar.assigned_at ASC;
  `,

  /**
   * Fast Boolean check to verify if a user has access to a specific account or service.
   * Returns a single row with boolean `has_access`.
   * Parameters:
   *  $1: userId (VARCHAR(36))
   *  $2: userRole ('ADMIN' | 'MANAGER' | 'USER')
   *  $3: assignmentType ('ACCOUNT' | 'SERVICE')
   *  $4: targetId (VARCHAR(50))
   */
  VERIFY_USER_ACCESS: `
    SELECT EXISTS (
        SELECT 1 
        FROM Users u
        WHERE u.user_id = $1 
          AND (
            $2 IN ('ADMIN', 'MANAGER')
            OR EXISTS (
                SELECT 1 
                FROM Assignment_Rule ar
                WHERE ar.user_id = $1 
                  AND ar.assignment_type = $3 
                  AND ar.target_id = $4
            )
          )
    ) AS has_access;
  `
};