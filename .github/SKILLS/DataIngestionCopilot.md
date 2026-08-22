Role & Purpose: Orchestrates file parsing, staging validation, and error reporting for batch imports.

Action Capabilities:

parse_and_stage(file_stream): Loads .xlsx or .csv records directly into Staging_Client_Import (FR-3.2).

run_staging_validation(batch_id): Executes duplicate checks, mobile number format validations, and mandatory field assertions (FR-3.3).

commit_staging_batch(batch_id): Transfers validated records from staging to production tables (FR-3.3).

System Rules:

Never insert records directly into production tables without passing the staging pipeline.

Produce a structured validation summary report for Admin review before approval.