# CreditShield Global Overview

## What This Project Is

CreditShield is an end-to-end digital lending platform for loan origination and risk decision support.

It combines:
- A backend API layer for authentication, borrower journey, workflow, and operations.
- An AI agent layer for explainable credit/risk analysis using rule tools and RAG.
- A web dashboard for LOS operations and internal users.
- A mobile app for borrower-facing journey.
- Supporting datasets and lending policy/reference documents.

The primary business goal is to manage the full Loan Origination System (LOS) journey from application intake to sanction/reject decisions with traceable risk controls.

## Global Repository Structure

```text
creditshield/
  Backend/                         FastAPI backend, APIs, models, services
  ai_agent/                        Agentic AI risk assistant and toolchain
  Design Loan Origination Dashboard/  Web dashboard (Vite/React based)
  Mobile-Application/creditshield/ Flutter borrower app
  dataset/                         Seed/dummy business data
  document/                        Domain docs, whitepapers, circulars
```

## Module Purpose

### 1) Backend
- Technology: FastAPI + PostgreSQL style service architecture.
- Owns user/auth, borrower auth, borrower journey APIs, workflow APIs.
- Central system of record for LOS workflow state.

### 2) AI Agent
- Technology: Python agent orchestrator + Bedrock Llama integration + tool calling.
- Supports risk reasoning, policy/rule retrieval, fraud and income analysis, and recommendation generation.
- Can run in mock mode or with AWS Bedrock.

### 3) Dashboard (LOS UI)
- Internal operations interface for loan processing stakeholders.
- Used by Loan Officer, Credit Analyst, Underwriter/Branch Manager, and Admin roles.

### 4) Mobile App
- Borrower-facing onboarding and application tracking interface.
- Integrates with borrower auth and borrower journey APIs.

## LOS (Loan Origination System) Flow

### Stage 1: Lead and Application Intake
- Borrower starts application (mobile/web assisted by field staff).
- Basic profile, KYC inputs, consent capture.
- Initial application record created in backend.

### Stage 2: KYC and Document Collection
- Identity/address/income documents uploaded and validated.
- Field Officer may assist with physical verification and field notes.
- LOS status moves to verification pending/completed.

### Stage 3: Eligibility and Rule Screening
- Backend and AI rule tools run hard/soft policy checks.
- Income summary, fraud signals, and policy violations are generated.
- Cases with hard-fail conditions are flagged early.

### Stage 4: Credit Analysis
- Credit Analyst reviews profile, bureau/income/risk insights.
- AI agent provides explainable risk rationale and counterfactual improvements.
- Analyst proposes recommendation (approve/reject/rework).

### Stage 5: Underwriting Decision
- Underwriter (Branch Manager) performs final policy and risk decisioning.
- Decision options: sanction, conditional sanction, reject, send-back for clarification.
- Audit trail is retained in LOS workflow history.

### Stage 6: Offer and Acceptance
- Approved terms/offers published to borrower.
- Borrower selects offer and submits final acceptance/consent.

### Stage 7: Post-Decision Handover
- Application transitions to downstream disbursal/onboarding systems (outside LOS scope or integrated later).
- Tracker and notifications remain visible to borrower and operations teams.

## LOS Stakeholders and Responsibilities

### Loan Officer
- Owns front-line application intake and document completeness.
- Coordinates with borrower for missing information.
- Ensures cases are submitted with minimum quality standards.

### Credit Analyst
- Performs financial and risk assessment.
- Validates AI outputs against policy and credit judgment.
- Recommends approve/reject/modify with recorded rationale.

### Field Officer
- Conducts field verification when required.
- Validates residence/business/employment signals.
- Uploads on-ground observations to support underwriting.

### Underwriter (Branch Manager)
- Final credit authority in branch context.
- Confirms policy compliance and portfolio fit.
- Issues final decision and conditions.

### System Admin
- Manages users, roles, access control, and system configuration.
- Oversees operational controls, audit readiness, and platform health.
- Maintains governance for authentication and workflow permissions.

## Typical End-to-End Hand-off Sequence

1. Field Officer/Loan Officer captures borrower application.
2. System runs KYC + policy/risk pre-checks.
3. Credit Analyst performs assessment and recommendation.
4. Underwriter/Branch Manager takes final decision.
5. Loan Officer communicates outcome and next steps to borrower.
6. System Admin monitors compliance, role-based access, and audit logs.

## Notes

- This repository contains both product modules and reference artifacts; some folders are implementation-ready, while others are design/documentation support.
- For setup details, use module-specific readme files under each top-level component.
