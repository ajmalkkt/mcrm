-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Master Products & Service Plans
CREATE TABLE IF NOT EXISTS Master_Product (
    product_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    product_name VARCHAR(100) NOT NULL UNIQUE, -- Internet, Fiber, Mobile
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Master_Service_Plan (
    plan_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    product_id VARCHAR(36) REFERENCES Master_Product(product_id) ON DELETE RESTRICT,
    plan_name VARCHAR(100) NOT NULL,
    billing_cycle VARCHAR(20) DEFAULT 'MONTHLY',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Prospects (Leads without an assigned Account ID)
CREATE TABLE IF NOT EXISTS Prospect (
    prospect_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    prospect_name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    address TEXT,
    geo_location VARCHAR(100),
    preferred_product_id VARCHAR(36) REFERENCES Master_Product(product_id),
    status VARCHAR(20) DEFAULT 'NEW', -- NEW, IN_PROGRESS, CONVERTED, REJECTED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Verified Client Accounts & Subscribed Services
CREATE TABLE IF NOT EXISTS Client_Account (
    account_id VARCHAR(50) PRIMARY KEY, -- Business Account Number
    client_name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Client_Service (
    client_service_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    account_id VARCHAR(50) REFERENCES Client_Account(account_id) ON DELETE CASCADE,
    plan_id VARCHAR(36) REFERENCES Master_Service_Plan(plan_id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, EXPIRED, TERMINATED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Document Management Metadata
CREATE TABLE IF NOT EXISTS Document_Store (
    document_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    entity_type VARCHAR(20) NOT NULL, -- 'CLIENT', 'PROSPECT', 'SERVICE'
    entity_id VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path_or_uri TEXT NOT NULL,
    storage_driver VARCHAR(20) DEFAULT 'LOCAL', -- 'LOCAL', 'S3', 'BLOB'
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Data Assignment Engine (Granular RLS Mapping)
CREATE TABLE IF NOT EXISTS Assignment_Rule (
    assignment_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) NOT NULL,
    assignment_type VARCHAR(20) NOT NULL, -- 'ACCOUNT', 'SERVICE'
    target_id VARCHAR(50) NOT NULL, -- account_id or client_service_id
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Interaction & Call Logging
CREATE TABLE IF NOT EXISTS Interaction_Call_Log (
    log_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) NOT NULL,
    entity_type VARCHAR(20) NOT NULL, -- 'CLIENT_SERVICE', 'PROSPECT'
    entity_id VARCHAR(50) NOT NULL,
    call_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT,
    requires_followup BOOLEAN DEFAULT FALSE,
    followup_date TIMESTAMP WITH TIME ZONE NULL,
    is_closed BOOLEAN DEFAULT FALSE
);

-- Performance Indexes for Dashboard & Alert Feeds
CREATE INDEX IF NOT EXISTS idx_client_service_expiry ON Client_Service(end_date, status);
CREATE INDEX IF NOT EXISTS idx_call_log_followup ON Interaction_Call_Log(followup_date, is_closed);
CREATE INDEX IF NOT EXISTS idx_assignment_user ON Assignment_Rule(user_id, target_id);