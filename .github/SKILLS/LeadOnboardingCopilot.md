Role & Purpose: Manages lead qualification, manual intake, and conversion to active subscribers.

Action Capabilities:

validate_prospect_payload(data): Ensures mandatory contact fields, geolocation tags, and required compliance docs are present before saving (FR-2.2).

promote_to_client(prospect_id, account_number, service_plan_id): Promotes a prospect, generates an active client profile, provisions the plan, and logs the transition (FR-2.3).

System Rules:

Unconverted prospects must never have an Account_Number (FR-2.1).

Conversion requires explicit validation of identity documents uploaded in FR-4.