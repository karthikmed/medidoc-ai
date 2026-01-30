-- Manually create all tables

-- ===============================
-- 1️⃣ Providers
-- ===============================
CREATE TABLE IF NOT EXISTS t_kb_provider (
    provider_id SERIAL PRIMARY KEY,
    provider_name VARCHAR(255) NOT NULL,
    specialty VARCHAR(255),
    contact_info JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===============================
-- 2️⃣ Patients
-- ===============================
CREATE TABLE IF NOT EXISTS t_kb_patient (
    patient_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    insurance JSONB,
    contact_info JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===============================
-- 3️⃣ Appointments
-- ===============================
CREATE TABLE IF NOT EXISTS t_kb_appointment (
    appointment_id SERIAL PRIMARY KEY,
    patient_id INT REFERENCES t_kb_patient(patient_id),
    provider_id INT REFERENCES t_kb_provider(provider_id),
    appointment_date TIMESTAMP NOT NULL,
    duration_min INT,
    type_of_visit_id INT,
    type_of_service_id INT,
    place_of_service_code_id INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ===============================
-- 4️⃣ Field Definitions (27 fields)
-- ===============================
CREATE TABLE IF NOT EXISTS t_kb_field_definitions (
    field_id SERIAL PRIMARY KEY,
    field_key VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    description TEXT,
    data_type VARCHAR(50) DEFAULT 'text',
    is_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert all 27 fields
INSERT INTO t_kb_field_definitions (field_key, display_name, description)
VALUES
('calculated_age', 'Age', 'Represents the patient''s age at the time of the medical encounter. Age may be expressed in days, months, or years.'),
('patient_gender', 'Gender', 'Indicates the patient''s gender (male, female, or other), relevant for clinical decisions.'),
('assessment', 'Clinical Assessment', 'The provider''s evaluation and clinical judgment based on symptoms, history, and findings. Includes diagnostic reasoning.'),
('chief_complient', 'Chief Complaint', 'Describes the patient''s main concern and history of present illness, including onset, severity, and progression.'),
('description_of_procedure', 'Procedure Description', 'A detailed summary of how a medical or surgical procedure was performed, including tools and observations.'),
('diagnosis', 'Diagnosis', 'A formally recognized medical condition based on clinical evaluation and diagnostic testing.'),
('history', 'Patient History', 'Includes medical, surgical, family, and social history relevant to the current encounter.'),
('insurance_categories', 'Insurance Categories', 'Categorization of patient''s insurance coverage type or plan.'),
('insurance_companies', 'Insurance Companies', 'The name(s) of the insurance provider(s) covering the patient''s care.'),
('operative_procedure', 'Operative Procedure', 'The surgical procedure(s) performed during the operative session.'),
('physical_exam', 'Detailed Physical Exam', 'Findings from a structured physical examination across body systems.'),
('place_of_service_code_id', 'Place of Service Code', 'A standardized code indicating the location where care was provided (e.g., office, hospital).'),
('plan', 'Treatment Plan', 'Details of planned interventions, medications, referrals, and follow-up steps.'),
('plan_and_prognosis', 'Plan & Prognosis', 'Outlines both the treatment plan and the expected health outcomes or recovery path.'),
('post_of_impression', 'Post-treatment Impression', 'Provider''s interpretation of the patient''s status after a procedure or treatment.'),
('post_op_diagnosis', 'Postoperative Diagnosis', 'The confirmed diagnosis after surgery, reflecting intraoperative findings.'),
('pre_op_diagnosis', 'Preoperative Diagnosis', 'Diagnosis established prior to surgery to justify and plan the procedure.'),
('time_duration_min', 'Encounter Duration (Minutes)', 'Duration of the patient visit in minutes.'),
('type_of_service_id', 'Type of Service', 'Identifies the nature of the service provided (e.g., consultation, follow-up).'),
('type_of_visit_id', 'Type of Visit', 'A classification of the visit (e.g., new patient, established patient, emergency).'),
('post_op_order', 'Post-Operative Orders', 'Physician instructions issued after a surgical procedure to guide immediate post-operative care and recovery.'),
('clinical_impression', 'Clinical Impression', 'Clinician''s assessment or diagnosis after evaluating the patient, based on symptoms, history, physical exam, and diagnostic tests.'),
('ros', 'Review of System', 'Structured series of questions asked by a clinician to identify symptoms the patient might be experiencing across all body systems.'),
('procedure', 'Procedure', 'A detailed summary of how a medical or surgical procedure was performed, including tools and observations.'),
('vital_signs', 'Vital Signs', ''),
('test_and_orders', 'Test and Orders', ''),
('history_of_illness', 'History of Present Illness', '')
ON CONFLICT (field_key) DO NOTHING;

-- ===============================
-- 5️⃣ Chart Info (all 27 fields as columns)
-- ===============================
CREATE TABLE IF NOT EXISTS t_kb_chart_info (
    chart_info_id SERIAL PRIMARY KEY,
    appointment_id INT UNIQUE REFERENCES t_kb_appointment(appointment_id) ON DELETE CASCADE,
    
    -- All 27 fields as columns
    calculated_age TEXT,
    patient_gender TEXT,
    assessment TEXT,
    chief_complient TEXT,
    description_of_procedure TEXT,
    diagnosis TEXT,
    history TEXT,
    insurance_categories TEXT,
    insurance_companies TEXT,
    operative_procedure TEXT,
    physical_exam TEXT,
    place_of_service_code_id TEXT,
    plan TEXT,
    plan_and_prognosis TEXT,
    post_of_impression TEXT,
    post_op_diagnosis TEXT,
    pre_op_diagnosis TEXT,
    time_duration_min TEXT,
    type_of_service_id TEXT,
    type_of_visit_id TEXT,
    post_op_order TEXT,
    clinical_impression TEXT,
    ros TEXT,
    procedure TEXT,
    vital_signs TEXT,
    test_and_orders TEXT,
    history_of_illness TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
