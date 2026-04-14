-- DigiLocker CSV import into borrower/KYC tables
-- Run this after creating tables from DATABASE_TABLES_CREATION.md.
-- Note: This script assumes digilocker_demo_csv_stage is already populated.

CREATE TABLE IF NOT EXISTS digilocker_demo_csv_stage (
    id BIGINT,
    full_name VARCHAR(120),
    gender VARCHAR(20),
    date_of_birth DATE,
    phone VARCHAR(15),
    email VARCHAR(255),
    aadhaar_number VARCHAR(20),
    pan_number VARCHAR(20),
    address VARCHAR(255),
    state VARCHAR(80),
    pincode VARCHAR(10),
    document_type VARCHAR(80),
    document_id VARCHAR(120),
    issue_date DATE
);

BEGIN;

WITH stage_clean AS (
    SELECT
        s.id,
        s.full_name,
        LOWER(TRIM(s.email)) AS email_norm,
        REGEXP_REPLACE(COALESCE(s.phone, ''), '\\D', '', 'g') AS phone_digits,
        s.issue_date
    FROM digilocker_demo_csv_stage s
    WHERE COALESCE(TRIM(s.email), '') <> ''
      AND COALESCE(TRIM(s.phone), '') <> ''
),
stage_dedup AS (
    SELECT DISTINCT ON (email_norm)
        full_name,
        email_norm,
        phone_digits
    FROM stage_clean
    ORDER BY email_norm, issue_date DESC NULLS LAST, id DESC
)
INSERT INTO borrowers (full_name, email, mobile_number, password_hash, is_active)
SELECT
    s.full_name,
    s.email_norm,
    s.phone_digits,
    'DEMO_LOGIN_DISABLED',
    TRUE
FROM stage_dedup s
ON CONFLICT (email) DO UPDATE
SET full_name = EXCLUDED.full_name,
    mobile_number = EXCLUDED.mobile_number,
    is_active = TRUE,
    updated_at = NOW();

WITH stage_clean AS (
    SELECT
        s.id,
        LOWER(TRIM(s.email)) AS email_norm,
        s.issue_date
    FROM digilocker_demo_csv_stage s
    WHERE COALESCE(TRIM(s.email), '') <> ''
),
stage_dedup AS (
    SELECT DISTINCT ON (email_norm)
        id,
        email_norm
    FROM stage_clean
    ORDER BY email_norm, issue_date DESC NULLS LAST, id DESC
)
INSERT INTO borrower_kyc_profiles (borrower_id, kyc_status, kyc_provider, kyc_reference_id, verified_at)
SELECT
    b.id,
    'Verified',
    'digilocker',
    CONCAT('DL-KYC-', LPAD(s.id::text, 6, '0')),
    NOW()
FROM stage_dedup s
JOIN borrowers b ON b.email = s.email_norm
ON CONFLICT (borrower_id) DO UPDATE
SET kyc_status = 'Verified',
    kyc_provider = 'digilocker',
    kyc_reference_id = EXCLUDED.kyc_reference_id,
    verified_at = NOW(),
    rejection_reason = NULL,
    updated_at = NOW();

INSERT INTO borrower_digilocker_artifacts (
    borrower_id,
    artifact_type,
    artifact_id,
    issuer_name,
    artifact_number_masked,
    issue_date,
    payload_json,
    is_verified,
    verified_at
)
WITH stage_mapped AS (
    SELECT
        s.id,
        LOWER(TRIM(s.email)) AS email_norm,
        s.document_id,
        s.document_type,
        s.aadhaar_number,
        s.pan_number,
        s.issue_date,
        s.full_name,
        s.gender,
        s.date_of_birth,
        s.phone,
        s.email,
        s.address,
        s.state,
        s.pincode,
        CASE
            WHEN LOWER(TRIM(s.document_type)) IN ('aadhaar card', 'aadhaar') THEN 'AADHAAR_XML'
            WHEN LOWER(TRIM(s.document_type)) IN ('pan card', 'pan') THEN 'PAN_PDF'
            WHEN LOWER(TRIM(s.document_type)) IN ('driving license', 'driving licence') THEN 'ADDRESS_PROOF'
            WHEN LOWER(TRIM(s.document_type)) = 'marksheet' THEN 'ADDRESS_PROOF'
            ELSE 'ADDRESS_PROOF'
        END AS artifact_type_mapped
    FROM digilocker_demo_csv_stage s
    WHERE COALESCE(TRIM(s.email), '') <> ''
      AND COALESCE(TRIM(s.document_id), '') <> ''
),
stage_dedup AS (
    SELECT DISTINCT ON (email_norm, artifact_type_mapped, document_id)
        *
    FROM stage_mapped
    ORDER BY email_norm, artifact_type_mapped, document_id, issue_date DESC NULLS LAST, id DESC
)
SELECT
    b.id,
    s.artifact_type_mapped,
    s.document_id,
    CASE
        WHEN LOWER(TRIM(s.document_type)) IN ('aadhaar card', 'aadhaar') THEN 'UIDAI'
        WHEN LOWER(TRIM(s.document_type)) IN ('pan card', 'pan') THEN 'Income Tax Department'
        WHEN LOWER(TRIM(s.document_type)) IN ('driving license', 'driving licence') THEN 'State Transport Department'
        WHEN LOWER(TRIM(s.document_type)) = 'marksheet' THEN 'Education Board'
        ELSE 'DigiLocker'
    END,
    CASE
        WHEN COALESCE(TRIM(s.aadhaar_number), '') <> '' THEN CONCAT('XXXX-XXXX-', RIGHT(s.aadhaar_number, 4))
        WHEN COALESCE(TRIM(s.pan_number), '') <> '' THEN CONCAT(LEFT(s.pan_number, 5), '****', RIGHT(s.pan_number, 1))
        ELSE 'MASKED'
    END,
    s.issue_date,
    jsonb_build_object(
        'source', 'digilocker-csv',
        'csv_id', s.id,
        'full_name', s.full_name,
        'gender', s.gender,
        'date_of_birth', s.date_of_birth,
        'phone', s.phone,
        'email', s.email,
        'aadhaar_number', s.aadhaar_number,
        'pan_number', s.pan_number,
        'address', s.address,
        'state', s.state,
        'pincode', s.pincode,
        'document_type', s.document_type,
        'document_id', s.document_id,
        'issue_date', s.issue_date
    ),
    TRUE,
    NOW()
FROM stage_dedup s
JOIN borrowers b ON b.email = s.email_norm
ON CONFLICT (borrower_id, artifact_type, artifact_id) DO UPDATE
SET payload_json = EXCLUDED.payload_json,
    issue_date = EXCLUDED.issue_date,
    is_verified = TRUE,
    verified_at = NOW();

COMMIT;

-- Quick verification query
-- SELECT b.id, b.full_name, b.email, k.kyc_status, a.artifact_type, a.artifact_id
-- FROM borrowers b
-- LEFT JOIN borrower_kyc_profiles k ON k.borrower_id = b.id
-- LEFT JOIN borrower_digilocker_artifacts a ON a.borrower_id = b.id
-- ORDER BY b.id, a.id;
