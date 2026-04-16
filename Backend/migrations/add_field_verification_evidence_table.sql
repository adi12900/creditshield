CREATE TABLE IF NOT EXISTS field_verification_evidence (
    id SERIAL PRIMARY KEY,
    borrower_id INTEGER NOT NULL REFERENCES borrowers(id) ON DELETE CASCADE,
    application_id INTEGER NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
    arn VARCHAR(30) NOT NULL,
    loan_type VARCHAR(40) NOT NULL,
    verification_section VARCHAR(40) NOT NULL,
    evidence_type VARCHAR(120) NOT NULL,
    storage_url TEXT NOT NULL,
    uploaded_by_role VARCHAR(32) NOT NULL DEFAULT 'field_officer',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fve_arn ON field_verification_evidence(arn);
CREATE INDEX IF NOT EXISTS idx_fve_application_id ON field_verification_evidence(application_id);
CREATE INDEX IF NOT EXISTS idx_fve_loan_section ON field_verification_evidence(loan_type, verification_section);
CREATE INDEX IF NOT EXISTS idx_fve_evidence_type ON field_verification_evidence(evidence_type);
