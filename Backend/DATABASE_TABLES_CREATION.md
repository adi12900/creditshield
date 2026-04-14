# Database Tables Creation Guide (PostgreSQL)

This document defines the database tables needed to support the current CreditShield backend and the role workflows for:
- loan_officer
- credit_analyst
- underwriter
- compliance_officer

The SQL below is designed for PostgreSQL and uses `IF NOT EXISTS` where possible.

## 1) Recommended Database Objects

### Enum Types
- `user_role`
- `loan_stage`

### Core Tables
- `users`
- `loan_applications`
- `application_stage_history`
- `application_assignments`

### Loan Officer Tables
- `documents`
- `document_reviews`
- `communications`
- `esign_requests`

### Credit Analyst Tables
- `bureau_reports`
- `ratio_snapshots`
- `ai_score_results`
- `credit_memos`

### Underwriter Tables
- `loan_offers`
- `decision_engine_results`
- `policy_overrides`

### Compliance Tables
- `kyc_aml_checks`
- `fraud_signals`
- `compliance_holds`
- `rbi_compliance_checks`
- `regulatory_reports`

### Cross-Cutting Tables
- `audit_logs`

## 2) Full SQL Script

```sql
BEGIN;

-- =====================================================
-- ENUMS
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
            'loan_officer',
            'credit_analyst',
            'underwriter',
            'compliance_officer',
            'ops_team',
            'system_admin',
            'board_member',
            'chief_compliance_officer',
            'nodal_grievance_officer',
            'lsp_governance_officer',
            'data_protection_officer',
            'recovery_governance_officer',
            'internal_auditor'
        );
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loan_stage') THEN
        CREATE TYPE loan_stage AS ENUM (
            'Lead',
            'Submitted',
            'Documents Pending',
            'KYC',
            'Underwriting',
            'Offer Sent',
            'Disbursed',
            'Rejected'
        );
    END IF;
END
$$;

-- =====================================================
-- USERS
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role user_role NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);
CREATE INDEX IF NOT EXISTS ix_users_role ON users (role);

-- =====================================================
-- LOAN APPLICATION CORE
-- =====================================================
CREATE TABLE IF NOT EXISTS loan_applications (
    id BIGSERIAL PRIMARY KEY,
    arn VARCHAR(30) NOT NULL UNIQUE,
    borrower_name VARCHAR(150) NOT NULL,
    borrower_email VARCHAR(255),
    borrower_phone VARCHAR(20),
    loan_amount NUMERIC(14,2) NOT NULL,
    loan_type VARCHAR(80) NOT NULL,
    stage loan_stage NOT NULL DEFAULT 'Lead',
    risk_grade VARCHAR(2) NOT NULL CHECK (risk_grade IN ('A+', 'A', 'B', 'C')),
    credit_score INT NOT NULL CHECK (credit_score BETWEEN 300 AND 900),
    kyc_status VARCHAR(20) NOT NULL CHECK (kyc_status IN ('Verified', 'Pending')),
    employment_type VARCHAR(20) NOT NULL CHECK (employment_type IN ('Salaried', 'Self Employed')),
    purpose VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_loan_applications_stage ON loan_applications (stage);
CREATE INDEX IF NOT EXISTS ix_loan_applications_risk_grade ON loan_applications (risk_grade);
CREATE INDEX IF NOT EXISTS ix_loan_applications_credit_score ON loan_applications (credit_score);

CREATE TABLE IF NOT EXISTS application_stage_history (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
    from_stage loan_stage,
    to_stage loan_stage NOT NULL,
    moved_by_user_id BIGINT REFERENCES users(id),
    reason TEXT,
    moved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_stage_history_application_id ON application_stage_history (application_id);

CREATE TABLE IF NOT EXISTS application_assignments (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
    assigned_to_user_id BIGINT NOT NULL REFERENCES users(id),
    assigned_role user_role NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS ix_assignments_application_id ON application_assignments (application_id);
CREATE INDEX IF NOT EXISTS ix_assignments_assigned_to_user_id ON application_assignments (assigned_to_user_id);

-- =====================================================
-- LOAN OFFICER
-- =====================================================
CREATE TABLE IF NOT EXISTS documents (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
    doc_type VARCHAR(120) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Verified', 'Pending OCR', 'Flagged')),
    confidence INT CHECK (confidence BETWEEN 0 AND 100),
    storage_url TEXT,
    uploaded_by_user_id BIGINT REFERENCES users(id),
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_documents_application_id ON documents (application_id);

CREATE TABLE IF NOT EXISTS document_reviews (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    reviewer_user_id BIGINT NOT NULL REFERENCES users(id),
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('approve', 'reject')),
    reason TEXT,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_document_reviews_document_id ON document_reviews (document_id);

CREATE TABLE IF NOT EXISTS communications (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
    sent_by_user_id BIGINT NOT NULL REFERENCES users(id),
    channel VARCHAR(10) NOT NULL CHECK (channel IN ('email', 'sms', 'call')),
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Delivered',
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_communications_application_id ON communications (application_id);

CREATE TABLE IF NOT EXISTS esign_requests (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
    requested_by_user_id BIGINT NOT NULL REFERENCES users(id),
    provider VARCHAR(60),
    status VARCHAR(30) NOT NULL DEFAULT 'Link Sent',
    link_expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_esign_requests_application_id ON esign_requests (application_id);

-- =====================================================
-- CREDIT ANALYST
-- =====================================================
CREATE TABLE IF NOT EXISTS bureau_reports (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    bureau_score INT NOT NULL,
    report_json JSONB NOT NULL,
    pulled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_bureau_reports_application_id ON bureau_reports (application_id);

CREATE TABLE IF NOT EXISTS ratio_snapshots (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
    calculated_by_user_id BIGINT REFERENCES users(id),
    monthly_income NUMERIC(14,2) NOT NULL,
    existing_obligations NUMERIC(14,2) NOT NULL,
    proposed_emi NUMERIC(14,2) NOT NULL,
    dti NUMERIC(6,2) NOT NULL,
    foir NUMERIC(6,2) NOT NULL,
    ltv NUMERIC(6,2) NOT NULL,
    policy_pass BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_ratio_snapshots_application_id ON ratio_snapshots (application_id);

CREATE TABLE IF NOT EXISTS ai_score_results (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
    model_version VARCHAR(50),
    composite_score INT NOT NULL,
    confidence_percent INT,
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('AUTO_APPROVE', 'MANUAL_REVIEW', 'AUTO_REJECT')),
    reason_codes JSONB,
    result_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_ai_score_results_application_id ON ai_score_results (application_id);

CREATE TABLE IF NOT EXISTS credit_memos (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
    analyst_user_id BIGINT NOT NULL REFERENCES users(id),
    summary TEXT NOT NULL,
    strengths TEXT,
    risk_factors TEXT,
    recommendation VARCHAR(30) NOT NULL CHECK (recommendation IN ('Approve', 'Approve with Conditions', 'Decline')),
    conditions_text TEXT,
    submitted BOOLEAN NOT NULL DEFAULT FALSE,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_credit_memos_application_id ON credit_memos (application_id);

-- =====================================================
-- UNDERWRITER
-- =====================================================
CREATE TABLE IF NOT EXISTS loan_offers (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
    underwriter_user_id BIGINT NOT NULL REFERENCES users(id),
    offered_amount NUMERIC(14,2) NOT NULL,
    tenure_months INT NOT NULL,
    interest_rate NUMERIC(5,2) NOT NULL,
    emi NUMERIC(14,2) NOT NULL,
    total_interest NUMERIC(14,2) NOT NULL,
    total_payable NUMERIC(14,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_loan_offers_application_id ON loan_offers (application_id);

CREATE TABLE IF NOT EXISTS decision_engine_results (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
    final_decision VARCHAR(20) NOT NULL CHECK (final_decision IN ('AUTO_APPROVE', 'MANUAL_REVIEW', 'AUTO_REJECT')),
    reason TEXT,
    steps_json JSONB,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_decision_engine_results_application_id ON decision_engine_results (application_id);

CREATE TABLE IF NOT EXISTS policy_overrides (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
    underwriter_user_id BIGINT NOT NULL REFERENCES users(id),
    override_category VARCHAR(120) NOT NULL,
    justification TEXT NOT NULL,
    decision VARCHAR(20) NOT NULL CHECK (decision IN ('approve', 'reject')),
    status VARCHAR(30) NOT NULL DEFAULT 'submitted',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_policy_overrides_application_id ON policy_overrides (application_id);

-- =====================================================
-- COMPLIANCE
-- =====================================================
CREATE TABLE IF NOT EXISTS kyc_aml_checks (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
    check_name VARCHAR(100) NOT NULL,
    result VARCHAR(40) NOT NULL,
    provider VARCHAR(80),
    confidence INT CHECK (confidence BETWEEN 0 AND 100),
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_kyc_aml_checks_application_id ON kyc_aml_checks (application_id);

CREATE TABLE IF NOT EXISTS fraud_signals (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
    signal_label VARCHAR(120) NOT NULL,
    score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    source TEXT,
    is_false_positive BOOLEAN NOT NULL DEFAULT FALSE,
    false_positive_reason TEXT,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_fraud_signals_application_id ON fraud_signals (application_id);

CREATE TABLE IF NOT EXISTS compliance_holds (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL CHECK (status IN ('active', 'cleared')),
    reason TEXT NOT NULL,
    created_by_user_id BIGINT REFERENCES users(id),
    cleared_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cleared_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS ix_compliance_holds_application_id ON compliance_holds (application_id);

CREATE TABLE IF NOT EXISTS rbi_compliance_checks (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES loan_applications(id) ON DELETE CASCADE,
    chapter VARCHAR(120) NOT NULL,
    clause VARCHAR(30) NOT NULL,
    requirement TEXT NOT NULL,
    field_name VARCHAR(120) NOT NULL,
    field_value TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Compliant', 'Attention', 'Missing')),
    is_critical BOOLEAN NOT NULL DEFAULT FALSE,
    action_required TEXT,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_rbi_checks_application_id ON rbi_compliance_checks (application_id);

CREATE TABLE IF NOT EXISTS regulatory_reports (
    id BIGSERIAL PRIMARY KEY,
    report_id VARCHAR(30) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    reporting_period VARCHAR(40) NOT NULL,
    due_date DATE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('Pending', 'In Progress', 'Submitted')),
    completeness INT NOT NULL DEFAULT 0 CHECK (completeness BETWEEN 0 AND 100),
    created_by_user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_regulatory_reports_status ON regulatory_reports (status);

-- =====================================================
-- AUDIT LOGS
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    user_display VARCHAR(150) NOT NULL,
    action VARCHAR(150) NOT NULL,
    resource VARCHAR(150) NOT NULL,
    details TEXT,
    risk VARCHAR(10) NOT NULL CHECK (risk IN ('Low', 'Medium', 'High')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_audit_logs_created_at ON audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS ix_audit_logs_action ON audit_logs (action);
CREATE INDEX IF NOT EXISTS ix_audit_logs_resource ON audit_logs (resource);

COMMIT;
```

## 3) Minimum Set If You Want To Start Small

If you want a minimal rollout first, create these tables first:
1. `users`
2. `loan_applications`
3. `documents`
4. `communications`
5. `credit_memos`
6. `loan_offers`
7. `policy_overrides`
8. `kyc_aml_checks`
9. `fraud_signals`
10. `audit_logs`
11. `regulatory_reports`
12. `rbi_compliance_checks`

Then add the rest in Phase 2.

## 4) Notes

- Your currently added user API already expects a `users` table with `user_role` enum values.
- The current workflow API in backend is in-memory; these tables are what you need to persist that workflow in production.
- Add migration tooling (Alembic) so table updates are versioned and repeatable.
