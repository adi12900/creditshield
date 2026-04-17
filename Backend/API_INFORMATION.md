# CreditShield Backend API Information

## Base URL
- Local: `http://127.0.0.1:8000`

## Authentication / Authorization
- Most workflow endpoints are role-guarded by request header: `x-user-role`
- Allowed role values:
  - `loan_officer`
  - `credit_analyst`
  - `underwriter`
  - `compliance_officer`

## Notes
- Setu routes are currently mounted as:
  - app include prefix: `/api/v1/setu`
  - router prefix: `/setu`
- Effective Setu endpoint base is: `/api/v1/setu/setu`

---

## Health Endpoints

### 1) Health Check
- Method: `GET`
- Path: `/health`
- Description: Service heartbeat

### 2) Database Health
- Method: `GET`
- Path: `/health/db`
- Description: Database connectivity check

---

## Setu Account Aggregator Endpoints
Base: `/api/v1/setu/setu`

### 3) Generate Access Token
- Method: `POST`
- Path: `/api/v1/setu/setu/token`
- Body:
```json
{
  "force_refresh": false
}
```

### 4) Create Consent
- Method: `POST`
- Path: `/api/v1/setu/setu/consents`
- Body:
```json
{
  "vua": "9999999999@onemoney",
  "dataRange": {
    "from": "2023-01-01T00:00:00Z",
    "to": "2023-12-31T23:59:59Z"
  },
  "fiTypes": ["DEPOSIT"],
  "consentTypes": ["PROFILE", "SUMMARY", "TRANSACTIONS"],
  "consentDuration": {
    "unit": "MONTH",
    "value": 6
  },
  "purpose": {
    "code": "103",
    "text": "Loan underwriting and risk assessment",
    "refUri": "https://www.setu.co/purpose",
    "category": {
      "type": "LOAN"
    }
  }
}
```

### 5) Start FI Data Fetch Session
- Method: `POST`
- Path: `/api/v1/setu/setu/consents/{consent_id}/data-fetch`
- Body:
```json
{
  "consentId": "consent_123",
  "dataRange": {
    "from": "2023-01-01T00:00:00Z",
    "to": "2023-12-31T23:59:59Z"
  },
  "format": "json"
}
```

### 6) Get FI Data Session
- Method: `GET`
- Path: `/api/v1/setu/setu/sessions/{session_id}`

### 7) Webhook Callback
- Method: `POST`
- Path: `/api/v1/setu/setu/webhook`
- Body:
```json
{
  "id": "event_123",
  "consentId": "consent_123",
  "status": "ACTIVE"
}
```

### 8) Legacy Fetch Transactions
- Method: `POST`
- Path: `/api/v1/setu/setu/fetch-transactions`
- Body:
```json
{
  "consent_id": "consent_123",
  "from_date": "2023-01-01",
  "to_date": "2023-12-31"
}
```

---

## User Management Endpoints
Base: `/api/v1/users`

### 9) Create User
- Method: `POST`
- Path: `/api/v1/users`
- Body:
```json
{
  "full_name": "Aarav Sharma",
  "email": "aarav@example.com",
  "role": "loan_officer",
  "is_active": true
}
```

### 10) List Users
- Method: `GET`
- Path: `/api/v1/users`
- Optional Query: `role=loan_officer`

### 11) Get User By ID
- Method: `GET`
- Path: `/api/v1/users/{user_id}`

### 12) Update User (Partial)
- Method: `PATCH`
- Path: `/api/v1/users/{user_id}`
- Body:
```json
{
  "full_name": "Aarav Sharma Updated",
  "role": "underwriter",
  "is_active": true
}
```

---

## Workflow Endpoints
Base: `/api/v1/workflow`

### Shared

### 13) List Applications
- Method: `GET`
- Path: `/api/v1/workflow/applications`
- Optional Query: `stage=Lead`

### 14) Get Application
- Method: `GET`
- Path: `/api/v1/workflow/applications/{arn}`

### Loan Officer (requires `x-user-role: loan_officer`)

### 15) Dashboard
- `GET /api/v1/workflow/loan-officer/dashboard`

### 16) Get Documents
- `GET /api/v1/workflow/loan-officer/documents/{arn}`

### 17) Review Document
- `POST /api/v1/workflow/loan-officer/documents/{arn}/review`
- Body:
```json
{
  "document_id": "901",
  "decision": "approve",
  "reason": "Document is valid"
}
```

### 18) Get Communications
- `GET /api/v1/workflow/loan-officer/communications/{arn}`

### 19) Send Communication
- `POST /api/v1/workflow/loan-officer/communications/{arn}/send`
- Body:
```json
{
  "channel": "email",
  "subject": "Application Update",
  "message": "Your application is under review"
}
```

### 20) Move Lead To Intake
- `POST /api/v1/workflow/loan-officer/leads/{arn}/move-to-intake`

### 21) Submit Intake
- `POST /api/v1/workflow/loan-officer/intake/{arn}/submit`

### 22) Send E-Sign Link
- `POST /api/v1/workflow/loan-officer/esign/{arn}/send-link`

### Credit Analyst (requires `x-user-role: credit_analyst`)

### 23) Dashboard
- `GET /api/v1/workflow/credit-analyst/dashboard`

### 24) Bureau Report
- `GET /api/v1/workflow/credit-analyst/bureau/{arn}`

### 25) Recalculate Ratios
- `POST /api/v1/workflow/credit-analyst/ratios/{arn}/recalculate`
- Body:
```json
{
  "monthly_income": 150000,
  "existing_obligations": 25000,
  "proposed_emi": 18000,
  "loan_amount": 1200000,
  "asset_value": 2000000
}
```

### 26) AI Score
- `GET /api/v1/workflow/credit-analyst/ai-score/{arn}`

### 27) Save Credit Memo Draft
- `POST /api/v1/workflow/credit-analyst/memo/{arn}/draft`

### 28) Submit Credit Memo
- `POST /api/v1/workflow/credit-analyst/memo/{arn}/submit`
- Memo Body for both:
```json
{
  "summary": "Strong repayment profile",
  "strengths": "Stable income and clean history",
  "risk_factors": "Sector cyclicality",
  "recommendation": "Approve",
  "conditions": "Standard documentation"
}
```

### Underwriter (requires `x-user-role: underwriter`)

### 29) Dashboard
- `GET /api/v1/workflow/underwriter/dashboard`

### 30) Decision Engine
- `GET /api/v1/workflow/underwriter/decision-engine/{arn}`

### 31) Generate Loan Offer
- `POST /api/v1/workflow/underwriter/loan-structuring/{arn}/offer`
- Body:
```json
{
  "loan_amount": 1200000,
  "tenure_months": 60,
  "interest_rate": 10.5
}
```

### 32) Submit Policy Override
- `POST /api/v1/workflow/underwriter/policy-override/{arn}/submit`
- Body:
```json
{
  "override_category": "LTV Exception",
  "justification": "Applicant has strong repayment record and collateral coverage with approved compensating factors and management sign-off.",
  "decision": "approve"
}
```

### 43) Submit Final Underwriter Decision
- `POST /api/v1/workflow/underwriter/decision-engine/{arn}/submit`
- Body:
```json
{
  "decision": "approve",
  "reason": "Approved after manual underwriter review"
}
```

Allowed `decision` values: `approve`, `reject`, `manual_review`.

### 44) Underwriter Case Summary
- `GET /api/v1/workflow/underwriter/case-summary/{arn}`
- Returns full underwriting case packet including: application snapshot, creditworthiness, risk analysis, financial ratios, documents, underwriting notes, status tracking, and raw `kpi_metrics` from `loan_appraisal_records`.

### 45) Underwriter Decision History
- `GET /api/v1/workflow/underwriter/decisions/{arn}/history`
- Returns previous underwriter decisions for the ARN.

### 46) Send Back for Clarification
- `POST /api/v1/workflow/underwriter/case/{arn}/send-back`
- Body:
```json
{
  "message": "Income mismatch detected. Please validate borrower declarations and re-submit."
}
```

### 47) Request Additional Documents
- `POST /api/v1/workflow/underwriter/case/{arn}/request-documents`
- Body:
```json
{
  "required_documents": ["bank_statement_12m", "itr_last_2_years"],
  "message": "Need latest income and banking proof before final underwriting decision."
}
```

### Compliance Officer (requires `x-user-role: compliance_officer`)

### 33) Dashboard
- `GET /api/v1/workflow/compliance/dashboard`

### 34) KYC/AML Details
- `GET /api/v1/workflow/compliance/kyc-aml/{arn}`

### 35) Clear Compliance Hold
- `POST /api/v1/workflow/compliance/kyc-aml/{arn}/clear-hold`
- Body:
```json
{
  "reason": "Verified with supporting evidence"
}
```

### 36) Fraud Signals
- `GET /api/v1/workflow/compliance/fraud-signals/{arn}`

### 37) Mark Fraud Signal As False Positive
- `POST /api/v1/workflow/compliance/fraud-signals/{arn}/false-positive`
- Body:
```json
{
  "reason": "Reviewed and cleared"
}
```

### 38) Audit Logs
- `GET /api/v1/workflow/compliance/audit-logs`
- Optional Query: `action`, `user`, `resource`, `risk`

### 39) Regulatory Reports
- `GET /api/v1/workflow/compliance/regulatory-reports`

### 40) Generate Regulatory Report
- `POST /api/v1/workflow/compliance/regulatory-reports/generate`
- Body:
```json
{
  "name": "RBI Monthly Compliance Report",
  "report_type": "RBI",
  "reporting_period": "2026-03"
}
```

### 41) RBI Compliance Detail
- `GET /api/v1/workflow/compliance/rbi-compliance/{arn}`

### 42) RBI Audit Export
- `GET /api/v1/workflow/compliance/rbi-audit-export/{arn}`
