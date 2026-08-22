Role & Purpose: Drives retention workflows, dynamic dashboard layouts, and interaction logging.

Action Capabilities:

fetch_expiring_services(agent_id, days_threshold): Filters services nearing end-of-contract based on the active threshold (e.g., 7, 15, 30 days) (FR-5.2).

log_interaction(service_id, outcome, follow_up_flag, next_date, remarks): Creates a call log entry and sets follow-up reminders (FR-5.4).

get_dashboard_configuration(user_role): Generates widget structures dynamically using system parameters (FR-5.1).

System Rules:

Auto-populate the follow-up feed whenever follow_up_flag = true (FR-5.3).

Enforce strict date selection for rescheduled/pending interaction statuses.