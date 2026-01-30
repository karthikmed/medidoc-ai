-- ============================================================================
-- Healthcare Clinical Documentation System - Database Schema
-- ============================================================================
-- Design Principles:
-- - Human-readable schema
-- - Avoid EAV pattern for clinical data
-- - Proper normalization
-- - Clinical chart data in real columns (not key/value)
-- - Production-ready and clean
-- ============================================================================

-- Step 1: Drop existing tables (except t_login_info)
-- ============================================================================
DROP TABLE IF EXISTS t_kb_chart_info CASCADE;
DROP TABLE IF EXISTS t_kb_appointment CASCADE;
DROP TABLE IF EXISTS t_kb_appointment_type CASCADE;
DROP TABLE IF EXISTS t_kb_field_definitions CASCADE;
DROP TABLE IF EXISTS t_kb_patient CASCADE;
DROP TABLE IF EXISTS t_kb_provider CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- Step 2: Create t_kb_provider (Providers/Clinicians)
-- ============================================================================
-- Purpose: Store provider/clinician information
-- No dependencies - can be created first
CREATE TABLE t_kb_provider (
    provider_id SERIAL PRIMARY KEY,
    provider_name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255),
    contact_info JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE t_kb_provider IS 'Stores provider/clinician information including name, specialty, and contact details';

-- ============================================================================
-- Step 3: Create t_kb_patient (Patient Demographics)
-- ============================================================================
-- Purpose: Store patient demographics and basic information
-- No dependencies - can be created second
CREATE TABLE t_kb_patient (
    patient_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    insurance JSONB,
    contact_info JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE t_kb_patient IS 'Stores patient demographics including name, DOB, gender, insurance, and contact information';

-- ============================================================================
-- Step 4: Create t_kb_appointment_type (Lookup Table)
-- ============================================================================
-- Purpose: Defines how a visit is classified
-- Replaces individual IDs: type_of_visit_id, type_of_service_id, place_of_service_code_id
-- No dependencies - can be created third
CREATE TABLE t_kb_appointment_type (
    appointment_type_id SERIAL PRIMARY KEY,
    type_of_visit VARCHAR(100) NOT NULL,  -- e.g., New, Established, ER
    type_of_service VARCHAR(100) NOT NULL,  -- e.g., Office Visit, Surgery
    place_of_service VARCHAR(100) NOT NULL,  -- e.g., Clinic, Hospital, Telehealth
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(type_of_visit, type_of_service, place_of_service)
);

COMMENT ON TABLE t_kb_appointment_type IS 'Lookup table defining visit classifications. Consolidates type_of_visit, type_of_service, and place_of_service into a single normalized table';

-- ============================================================================
-- Step 5: Create t_kb_appointment (Scheduling Only)
-- ============================================================================
-- Purpose: Stores only scheduling and relationships, NOT clinical text
-- Dependencies: t_kb_patient, t_kb_provider, t_kb_appointment_type
CREATE TABLE t_kb_appointment (
    appointment_id SERIAL PRIMARY KEY,
    patient_id INT NOT NULL REFERENCES t_kb_patient(patient_id) ON DELETE CASCADE,
    provider_id INT NOT NULL REFERENCES t_kb_provider(provider_id) ON DELETE CASCADE,
    appointment_type_id INT NOT NULL REFERENCES t_kb_appointment_type(appointment_type_id) ON DELETE RESTRICT,
    appointment_date TIMESTAMP NOT NULL,
    duration_min INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE t_kb_appointment IS 'Stores appointment scheduling information only. Clinical documentation is stored in t_kb_chart_info';

-- ============================================================================
-- Step 6: Create t_kb_field_definitions (Metadata Layer)
-- ============================================================================
-- Purpose: Used ONLY for UI/config/validation
-- IMPORTANT: This table does NOT store patient data
-- field_key must match column names in t_kb_chart_info
-- No dependencies - can be created fourth
CREATE TABLE t_kb_field_definitions (
    field_id SERIAL PRIMARY KEY,
    field_key VARCHAR(100) UNIQUE NOT NULL,  -- Must match column names in t_kb_chart_info
    display_name VARCHAR(255),
    description TEXT,
    data_type VARCHAR(50) DEFAULT 'text',
    is_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE t_kb_field_definitions IS 'Metadata table for UI configuration and validation. field_key values must match column names in t_kb_chart_info. Does NOT store patient data.';

-- Insert all 27 field definitions
-- These field_key values will become column names in t_kb_chart_info
INSERT INTO t_kb_field_definitions (field_key, display_name, description, data_type)
VALUES
('calculated_age', 'Age', 'Represents the patient''s age at the time of the medical encounter. Age may be expressed in days, months, or years.', 'text'),
('patient_gender', 'Gender', 'Indicates the patient''s gender (male, female, or other), relevant for clinical decisions.', 'text'),
('chief_complient', 'Chief Complaint', 'Describes the patient''s main concern and history of present illness, including onset, severity, and progression.', 'text'),
('history_of_illness', 'History of Present Illness', 'Detailed history of the current medical condition or complaint.', 'text'),
('history', 'Patient History', 'Includes medical, surgical, family, and social history relevant to the current encounter.', 'text'),
('ros', 'Review of System', 'Structured series of questions asked by a clinician to identify symptoms the patient might be experiencing across all body systems.', 'text'),
('physical_exam', 'Detailed Physical Exam', 'Findings from a structured physical examination across body systems.', 'text'),
('vital_signs', 'Vital Signs', 'Patient vital signs including blood pressure, heart rate, temperature, respiratory rate, and oxygen saturation.', 'text'),
('assessment', 'Clinical Assessment', 'The provider''s evaluation and clinical judgment based on symptoms, history, and findings. Includes diagnostic reasoning.', 'text'),
('clinical_impression', 'Clinical Impression', 'Clinician''s assessment or diagnosis after evaluating the patient, based on symptoms, history, physical exam, and diagnostic tests.', 'text'),
('diagnosis', 'Diagnosis', 'A formally recognized medical condition based on clinical evaluation and diagnostic testing.', 'text'),
('plan', 'Treatment Plan', 'Details of planned interventions, medications, referrals, and follow-up steps.', 'text'),
('plan_and_prognosis', 'Plan & Prognosis', 'Outlines both the treatment plan and the expected health outcomes or recovery path.', 'text'),
('procedure', 'Procedure', 'A detailed summary of how a medical or surgical procedure was performed, including tools and observations.', 'text'),
('description_of_procedure', 'Procedure Description', 'A detailed summary of how a medical or surgical procedure was performed, including tools and observations.', 'text'),
('operative_procedure', 'Operative Procedure', 'The surgical procedure(s) performed during the operative session.', 'text'),
('pre_op_diagnosis', 'Preoperative Diagnosis', 'Diagnosis established prior to surgery to justify and plan the procedure.', 'text'),
('post_op_diagnosis', 'Postoperative Diagnosis', 'The confirmed diagnosis after surgery, reflecting intraoperative findings.', 'text'),
('post_of_impression', 'Post-treatment Impression', 'Provider''s interpretation of the patient''s status after a procedure or treatment.', 'text'),
('post_op_order', 'Post-Operative Orders', 'Physician instructions issued after a surgical procedure to guide immediate post-operative care and recovery.', 'text'),
('test_and_orders', 'Test and Orders', 'Diagnostic tests ordered and physician instructions for patient care.', 'text'),
('insurance_categories', 'Insurance Categories', 'Categorization of patient''s insurance coverage type or plan.', 'text'),
('insurance_companies', 'Insurance Companies', 'The name(s) of the insurance provider(s) covering the patient''s care.', 'text')
ON CONFLICT (field_key) DO NOTHING;

-- ============================================================================
-- Step 7: Create t_kb_chart_info (Clinical Data)
-- ============================================================================
-- Purpose: Stores actual patient clinical documentation
-- Design: One row per appointment, all fields as columns (NOT EAV pattern)
-- Dependencies: t_kb_appointment, t_kb_field_definitions (for reference)
-- 
-- Why NOT EAV?
-- - EAV (Entity-Attribute-Value) stores data as rows: (appointment_id, field_id, value)
-- - This design uses REAL COLUMNS for each clinical field
-- - Benefits: Better performance, type safety, easier queries, human-readable
-- - Trade-off: Schema changes require ALTER TABLE (but this is acceptable for clinical data)
CREATE TABLE t_kb_chart_info (
    chart_info_id SERIAL PRIMARY KEY,
    appointment_id INT UNIQUE NOT NULL REFERENCES t_kb_appointment(appointment_id) ON DELETE CASCADE,
    
    -- All 27 clinical fields as columns (from t_kb_field_definitions.field_key)
    -- Using TEXT type for flexibility with clinical documentation
    calculated_age TEXT,
    patient_gender TEXT,
    chief_complient TEXT,
    history_of_illness TEXT,
    history TEXT,
    ros TEXT,
    physical_exam TEXT,
    vital_signs TEXT,
    assessment TEXT,
    clinical_impression TEXT,
    diagnosis TEXT,
    plan TEXT,
    plan_and_prognosis TEXT,
    procedure TEXT,
    description_of_procedure TEXT,
    operative_procedure TEXT,
    pre_op_diagnosis TEXT,
    post_op_diagnosis TEXT,
    post_of_impression TEXT,
    post_op_order TEXT,
    test_and_orders TEXT,
    insurance_categories TEXT,
    insurance_companies TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE t_kb_chart_info IS 'Stores actual patient clinical documentation. One row per appointment with all clinical fields as columns. Avoids EAV pattern for better performance and readability. Column names match t_kb_field_definitions.field_key values.';

COMMENT ON COLUMN t_kb_chart_info.appointment_id IS 'UNIQUE constraint ensures one chart record per appointment. CASCADE delete removes chart when appointment is deleted.';

-- ============================================================================
-- Indexes for Performance
-- ============================================================================
CREATE INDEX idx_appointment_patient ON t_kb_appointment(patient_id);
CREATE INDEX idx_appointment_provider ON t_kb_appointment(provider_id);
CREATE INDEX idx_appointment_date ON t_kb_appointment(appointment_date);
CREATE INDEX idx_chart_appointment ON t_kb_chart_info(appointment_id);

-- ============================================================================
-- Schema Creation Complete
-- ============================================================================
