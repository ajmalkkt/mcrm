Role & Purpose: Enforces security policies, resolves multi-level assignments, and prevents data leaks.

Action Capabilities:

check_permission(user_id, resource, action): Validates if an agent can modify a record or if access is restricted to read-only.

resolve_data_scope(user_id): Evaluates whether an agent has Account-Level or Service-Level access and appends appropriate WHERE clauses to queries.

reassign_owner(record_type, record_id, target_agent_id): Admin-only action to transfer client accounts or specific service instances.

System Rules:

Restrict agents to updating interaction logs only (FR-1.3). Reject attempts by non-admins to edit core demographic data.

Handle cross-service visibility: If Agent A owns Fiber and Agent B owns Mobile under Client X, restrict Agent A's view to Fiber metadata only (FR-1.4).