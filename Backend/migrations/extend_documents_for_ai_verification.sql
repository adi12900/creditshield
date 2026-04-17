-- Extend documents schema for AI OCR + verification pipeline
ALTER TABLE documents
    ALTER COLUMN status TYPE VARCHAR(32);

-- Keep status check aligned with existing production enum values.
ALTER TABLE documents
    DROP CONSTRAINT IF EXISTS documents_status_check;

ALTER TABLE documents
    ADD CONSTRAINT documents_status_check
    CHECK (
        status IN (
            'Pending OCR',
            'Verified',
            'Flagged'
        )
    );

ALTER TABLE documents
    ALTER COLUMN confidence TYPE DOUBLE PRECISION USING confidence::double precision;

ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS extracted_text TEXT,
    ADD COLUMN IF NOT EXISTS agent_verdict TEXT,
    ADD COLUMN IF NOT EXISTS is_blocking BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS verification_attempts INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Backfill existing rows for legacy data.
UPDATE documents
SET is_blocking = TRUE
WHERE lower(replace(doc_type, '-', '_')) IN (
    'student_id_card',
    'pan_card',
    'guardian_bank_statement',
    'co_applicant_income_proof',
    'aadhaar_card'
);

UPDATE documents
SET status = 'Pending OCR'
WHERE lower(replace(status, '-', ' ')) IN ('pending ocr', 'pending_ocr', 'pendingocr');

UPDATE documents
SET status = 'Verified'
WHERE lower(replace(status, '-', ' ')) IN ('verified', 'approved', 'success');

UPDATE documents
SET status = 'Flagged'
WHERE lower(replace(status, '-', ' ')) IN ('flagged', 'rejected', 'failed', 'verification failed', 'error');

CREATE INDEX IF NOT EXISTS idx_documents_application_id_is_blocking ON documents(application_id, is_blocking);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
