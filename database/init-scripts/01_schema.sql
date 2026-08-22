-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- 0. User Management & Role-Based Access Control (RBAC)
-- =========================================================
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'MANAGER', 'USER');
    -- Enums
    CREATE TYPE assignment_level AS ENUM ('ACCOUNT', 'SERVICE');
    CREATE TYPE service_status AS ENUM ('ACTIVE', 'SUSPENDED', 'PENDING_PROVISION', 'TERMINATED');
    CREATE TYPE interaction_status AS ENUM ('PENDING', 'RESCHEDULED', 'CLOSED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS Users (
    user_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'USER',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 1. Master Products & Service Plans
-- =========================================================
CREATE TABLE IF NOT EXISTS Master_Product (
    product_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    product_name VARCHAR(100) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Master_Service_Plan (
    plan_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    product_id VARCHAR(36) REFERENCES Master_Product(product_id) ON DELETE RESTRICT,
    plan_name VARCHAR(100) NOT NULL,
    billing_cycle VARCHAR(20) DEFAULT 'MONTHLY',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 2. Prospects (Leads without an assigned Account ID)
-- =========================================================
CREATE TABLE IF NOT EXISTS Prospect (
    prospect_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    prospect_name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100), -- Province, Region
    country VARCHAR(100),
    geo_location VARCHAR(100),
    preferred_product_id VARCHAR(36) REFERENCES Master_Product(product_id),
    preferred_plan_id VARCHAR(36) REFERENCES Master_Service_Plan(plan_id),
    status VARCHAR(20) DEFAULT 'NEW', -- NEW, IN_PROGRESS, CONVERTED, REJECTED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 3. Verified Client Accounts & Subscribed Services
-- =========================================================
CREATE TABLE IF NOT EXISTS Client_Account (
    account_id VARCHAR(50) PRIMARY KEY,
    client_code VARCHAR(50) UNIQUE, -- Optional unique code for internal reference
    client_name VARCHAR(150) NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    secondary_contact_number VARCHAR(20),
    email VARCHAR(255) NOT NULL UNIQUE,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100), -- Province, Region
    country VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Alert_Configuration (
    alert_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    renewal_warning_days INTEGER NOT NULL DEFAULT 15,
    expiry_warning_days INTEGER NOT NULL DEFAULT 7,
    followup_reminder_days INTEGER NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Client_Service (
    client_service_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    account_id VARCHAR(50) REFERENCES Client_Account(account_id) ON DELETE CASCADE,
    plan_id VARCHAR(36) REFERENCES Master_Service_Plan(plan_id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status service_status DEFAULT 'PENDING_PROVISION', -- ACTIVE, EXPIRED, TERMINATED
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 4. Document Management Metadata
-- =========================================================
CREATE TABLE IF NOT EXISTS Document_Store (
    document_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    entity_type VARCHAR(20) NOT NULL, -- 'CLIENT', 'PROSPECT', 'SERVICE'
    entity_id VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path_or_uri TEXT NOT NULL,
    storage_driver VARCHAR(20) DEFAULT 'LOCAL', -- 'LOCAL', 'S3', 'BLOB'
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 5. Data Assignment Engine (Granular RLS Mapping)
-- =========================================================
CREATE TABLE IF NOT EXISTS Assignment_Rule (
    assignment_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    assignment_type assignment_level NOT NULL, -- 'ACCOUNT', 'SERVICE'
    target_id VARCHAR(50) NOT NULL, -- account_id or client_service_id
    --account_id INT REFERENCES client_account(account_id) ON DELETE CASCADE,
    --client_service_id INT REFERENCES client_service(client_service_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- 6. Interaction & Call Logging
-- =========================================================
CREATE TABLE IF NOT EXISTS Interaction_Call_Log (
    log_id VARCHAR(36) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(36) NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    entity_type VARCHAR(20) NOT NULL, -- 'CLIENT_SERVICE', 'PROSPECT'
    entity_id VARCHAR(50) NOT NULL,
    call_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status interaction_status DEFAULT 'PENDING',
    remarks TEXT,
    requires_followup BOOLEAN DEFAULT FALSE,
    followup_date TIMESTAMP WITH TIME ZONE NULL,
    is_closed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_master_product'
    ) THEN
        CREATE TRIGGER set_updated_at_master_product
        BEFORE UPDATE ON Master_Product
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_master_service_plan'
    ) THEN
        CREATE TRIGGER set_updated_at_master_service_plan
        BEFORE UPDATE ON Master_Service_Plan
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_prospect'
    ) THEN
        CREATE TRIGGER set_updated_at_prospect
        BEFORE UPDATE ON Prospect
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_client_account'
    ) THEN
        CREATE TRIGGER set_updated_at_client_account
        BEFORE UPDATE ON Client_Account
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_client_service'
    ) THEN
        CREATE TRIGGER set_updated_at_client_service
        BEFORE UPDATE ON Client_Service
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_document_store'
    ) THEN
        CREATE TRIGGER set_updated_at_document_store
        BEFORE UPDATE ON Document_Store
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_assignment_rule'
    ) THEN
        CREATE TRIGGER set_updated_at_assignment_rule
        BEFORE UPDATE ON Assignment_Rule
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_interaction_call_log'
    ) THEN
        CREATE TRIGGER set_updated_at_interaction_call_log
        BEFORE UPDATE ON Interaction_Call_Log
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    END IF;
END $$;

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_client_service_expiry ON Client_Service(end_date, status);
CREATE INDEX IF NOT EXISTS idx_call_log_followup ON Interaction_Call_Log(followup_date, is_closed);
CREATE INDEX IF NOT EXISTS idx_assignment_user ON Assignment_Rule(user_id, target_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON Users(role);
