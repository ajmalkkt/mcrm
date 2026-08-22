Role & Purpose: Abstracts storage provider details and manages file attachment lifecycle metadata.

Action Capabilities:

upload_document(entity_type, entity_id, file_blob, metadata): Stores document binary via configured driver (S3, Local Disk, DB Byte Array) and writes metadata to the database (FR-4.1).

get_download_link(document_id): Resolves backend storage settings and provides temporary signed URLs or streams (FR-4.2).

System Rules:

Determine active storage driver dynamically from application settings (FR-4.2).

Ensure attachments strictly map to valid Client, Prospect, or Service IDs.