# LOS Frontend Borrower Journey Study

## Scope

This study is based on the frontend code in the web app and the Flutter borrower app, plus the RBI directions document and the LOS/LMS whitepaper in the document folder.

Primary source documents used:

- RBI directions: [RBI-DOR-2025-26-154_3122025154245207 (1).md](RBI-DOR-2025-26-154_3122025154245207%20(1).md)
- LOS/LMS whitepaper: [LOS_LMS_Comprehensive_Whitepaper.md](LOS_LMS_Comprehensive_Whitepaper.md)

Primary frontend surfaces studied:

- Web app routing and dashboards: [Design Loan Origination Dashboard/src/app/App.tsx](../Design%20Loan%20Origination%20Dashboard/src/app/App.tsx)
- RBI controls and risk helpers: [Design Loan Origination Dashboard/src/app/lib/rbiCompliance.ts](../Design%20Loan%20Origination%20Dashboard/src/app/lib/rbiCompliance.ts), [Design Loan Origination Dashboard/src/app/lib/aiRiskModel.ts](../Design%20Loan%20Origination%20Dashboard/src/app/lib/aiRiskModel.ts)
- Mobile routing and borrower flow: [Mobile-Application/creditshield/lib/app/router/app_router.dart](../Mobile-Application/creditshield/lib/app/router/app_router.dart)
- Mobile consent, RBI checkpoint, offers, agreement, and loan dashboard screens: [Mobile-Application/creditshield/lib/features/consent/consent_screen.dart](../Mobile-Application/creditshield/lib/features/consent/consent_screen.dart), [Mobile-Application/creditshield/lib/features/compliance/rbi_compliance_screen.dart](../Mobile-Application/creditshield/lib/features/offer_selection/offer_selection_screen.dart), [Mobile-Application/creditshield/lib/features/loan_agreement/loan_agreement_screen.dart](../Mobile-Application/creditshield/lib/features/loan_dashboard/loan_dashboard_screen.dart)

## End-to-End Loan Journey

### 1) Borrower entry and pre-qualification

The borrower journey begins in the mobile app at splash, language selection, welcome, and onboarding. The flow then moves into eligibility checks and loan type selection.

Implemented screens and sequence:

1. Splash screen
2. Language selection
3. Welcome onboarding
4. KYC screen
5. Profile setup
6. Eligibility check
7. Home screen with apply / track / dashboard / profile tabs

The loan journey is started from the Home screen, which resumes any in-progress application if one exists.

### 2) Loan application intake

The borrower fills a structured multi-step application in [loan_application_screen.dart](../Mobile-Application/creditshield/lib/features/loan_application/loan_application_screen.dart).

The screen captures:

- Personal identity fields
- Mobile, email, PAN, Aadhaar, DOB
- Address, city, state, PIN
- Occupation and employment type
- Employer name where relevant
- Monthly income
- Monthly household income
- Existing monthly obligations
- Optional co-applicant details
- Product-specific fields for gold, home, car, and education loans
- Lender selection and amount / tenure review

This part matches the whitepaper’s LOS intake stage and the RBI requirement to capture borrower economic profile before loan extension.

### 3) Document collection

After the form review, the borrower is routed to document upload. The web app also contains a back-office document review page for the loan officer.

The intended flow is:

Borrower application -> document upload -> lender review -> compliance review -> underwriting

### 4) Consent and RBI disclosures

The borrower app has a dedicated consent screen and an RBI compliance checkpoint.

Current borrower-facing sequence:

1. Consent screen
2. RBI compliance screen
3. Risk score screen
4. Lender offers
5. Offer selection and share confirmation
6. Loan agreement signing

This is aligned with the RBI digital lending guidance for:

- explicit consent
- data-purpose disclosure
- KFS disclosure
- cooling-off period
- grievance redressal visibility
- APR and repayment obligation disclosure

### 5) AI / risk assessment

The web app’s AI score path uses a deterministic and explainable risk profile in [aiRiskModel.ts](../Design%20Loan%20Origination%20Dashboard/src/app/lib/aiRiskModel.ts).

The risk model outputs:

- composite score
- confidence band
- risk grade
- decision path
- model version
- last training date
- reason codes
- explanation text
- counterfactual guidance
- bureau, behavioral, and alternative tier scores

The mobile app also shows a borrower-facing risk score screen, but its score is still a fixed presentation layer and not connected to the web model.

### 6) Offer comparison and selection

The borrower sees lender offers in the mobile app and can compare them side by side.

Offer comparison currently includes:

- lender name
- amount
- EMI
- APR / rate
- tenure
- total cost
- processing fee
- prepayment terms

The offer selection screen also shows KFS-style disclosures and a data-sharing confirmation step before submission.

### 7) Agreement execution and e-sign

The loan agreement screen presents the key terms summary, agreement text, and OTP-based e-sign flow.

It shows:

- sanctioned amount
- APR
- interest rate
- EMI
- tenure
- processing fee
- prepayment terms
- cooling-off period
- default consequence
- grievance contact

This maps to the RBI disclosure expectations before final execution.

### 8) Disbursal and post-disbursal servicing

The borrower app ends at the loan dashboard and loan tracker.

The dashboard shows:

- active loan summary
- next EMI reminder
- credit score tracker
- EMI schedule

The whitepaper expects the flow to continue into LMS operations after disbursement, but the current borrower UI does not yet include full servicing actions such as:

- foreclosure / closure request
- statement download
- payment history reconciliation
- grievance ticket status
- repayment mandate management

## Web App Flow and Stakeholder Ownership

The web app is the lender back-office system. It is the control center for the LOS pipeline and RBI checks.

### Loan Officer

Owns the front of the LOS pipeline.

Responsibilities:

- lead qualification
- application intake
- application detail review
- document review
- borrower communication
- e-sign coordination

Relevant screens:

- Lead Workbench
- Application Intake
- Application Detail
- Document Review
- Communication
- E-Sign Agreement

### Credit Analyst

Owns underwriting inputs and credit memo preparation.

Responsibilities:

- bureau report review
- financial ratio analysis
- AI score review
- credit memo preparation

Relevant screens:

- Bureau Reports
- Financial Ratios
- AI Score
- Credit Memo

### Underwriter

Owns the final risk decision.

Responsibilities:

- policy evaluation
- exception handling
- override review
- loan structuring

Relevant screens:

- Decision Engine
- Policy Override
- Loan Structuring

### Compliance Officer

Owns KYC / AML, RBI checks, audit trail, and regulatory reporting.

Responsibilities:

- KYC / AML monitoring
- fraud signal review
- RBI compliance checklist
- audit log review
- regulatory reporting
- export of evidence

Relevant screens:

- KYC / AML
- Fraud Signals
- Audit Log
- Regulatory Reports
- RBI Compliance Center
- RBI Audit Export

### Operations Team

Owns disbursement execution and operational controls.

Responsibilities:

- disbursement approval
- document vault review
- exception queue handling
- payment rail verification

Relevant screens:

- Disbursement Approval
- Document Vault
- Exception Queue

### System Admin

Owns workflow and platform governance.

Responsibilities:

- user management
- workflow design
- rule engine configuration
- system monitoring

Relevant screens:

- Workflow Designer
- Rule Engine
- User Management

## RBI Governance and Accountability Stakeholders (Added)

The operational LOS roles above are valid, but RBI governance requires additional named owners with explicit accountability.

### Board / Board Credit Committee

Owns policy approval and oversight.

Responsibilities:

- approve and periodically review credit policy across digital lending, DLG, gold/silver lending, project finance, housing finance, NBFC finance, NFB, bills, export credit, and related products
- delegate accountable officials for regulatory certifications
- ensure governance structure is documented and auditable

System interaction:

- policy and governance layer (outside day-to-day LOS queue actions)

### Chief Compliance Officer (or Board-Designated Certifier)

Owns regulatory certification for DLA and CIMS reporting.

Responsibilities:

- certify correctness and timeliness of DLA registry submissions
- certify DLA controls for grievance, privacy, and data handling compliance
- sign off before regulatory submission workflows are marked complete

Relevant screens/processes:

- Regulatory Reports
- RBI Compliance Center
- RBI Audit Export

### Nodal Grievance Redressal Officer

Owns complaint intake and closure controls for digital lending complaints.

Responsibilities:

- ensure grievance contacts are visible in KFS, DLA, and bank channels
- track complaint lifecycle and turnaround timelines
- ensure escalation path to RBI CMS / Ombudsman is visible and complete

Relevant screens/processes:

- borrower grievance workflow (pending full implementation)
- Compliance dashboard controls

### LSP Governance Owner (Outsourcing and Third-Party Risk)

Owns bank-LSP accountability controls.

Responsibilities:

- perform onboarding due diligence and periodic reviews of LSPs
- enforce contractual controls for conduct, data, and customer protection
- ensure lender liability remains with bank for LSP acts and omissions

Relevant screens/processes:

- vendor governance workflow (currently a gap)
- Regulatory Reports (for DLA/CIMS events)

### Data Protection and Information Security Owner

Owns data governance and technology control assurance.

Responsibilities:

- enforce explicit consent, purpose limitation, and revocation controls
- enforce India data residency and permitted collection boundaries
- maintain cybersecurity and incident control compliance for DLA stack

Relevant screens/processes:

- RBI Compliance Center
- system controls and audit evidence pipeline

### Recovery Governance Owner

Owns compliant recovery operations where recovery agents and LSP recovery flows are used.

Responsibilities:

- validate recovery agent appointment/change notifications to borrowers
- ensure recovery conduct is compliant with responsible business conduct norms
- maintain audit trail for recovery actions and controls

Relevant screens/processes:

- collections/recovery workflow (partly outside current LOS frontend)

### Internal Audit / RBIA and Concurrent Audit Owner

Owns periodic independent assurance of high-risk control areas.

Responsibilities:

- include digital lending and e-guarantee lifecycle controls in audit scope
- test maker-checker-authorizer and segregation-of-duty controls
- report control gaps and closure evidence to governance committees

Relevant screens/processes:

- Audit Log
- RBI Audit Export
- control testing and audit workpapers (outside UI today)

## RBI Mapping Summary

The current frontend maps the RBI document well in these areas:

- mandatory borrower profile capture
- APR and KFS disclosure
- cooling-off disclosure
- grievance contact disclosure
- explicit consent capture
- disbursal control checks
- RBI compliance checklist by clause
- evidence export for audit

The dedicated RBI helper in [rbiCompliance.ts](../Design%20Loan%20Origination%20Dashboard/src/app/lib/rbiCompliance.ts) is the main control point for these checks in the web app.

## What Is Missing or Still Weak

The UI is strong for demo and workflow design, but it still has gaps if the goal is production-grade LOS/LMS operation.

### Major gaps

1. No real backend integration.

The web and mobile apps are still driven by mock data and local state. There is no live LOS/LMS API, no persistence layer, and no actual lender decision service.

2. Borrower status is not synchronized from the back office.

The mobile app does not read the live stage from the web pipeline. It shows a borrower journey, but it is not yet tied to the real processing state.

3. Rejection handling is not fully linked.

The mobile app has a rejection-recovery screen, but the normal borrower path does not route into it from a failed risk decision.

4. LMS servicing is incomplete.

The borrower dashboard shows EMIs and loan health, but it does not yet cover full servicing actions like closure, foreclosure, NOC, payment dispute handling, or mandate maintenance.

5. Audit evidence is frontend-only.

The audit export is useful, but there is no immutable server-side audit log or regulator feed.

6. Compliance evidence is partly static.

The RBI compliance center is detailed, but some values are still derived from the sample application state rather than from live documents, lender system events, or actual customer records.

7. RBI governance stakeholders are not modeled as first-class system roles.

The current role model is operations-heavy and does not explicitly model Board, CCO certifier, Nodal Grievance Officer, LSP governance owner, recovery governance owner, or data protection owner as named accountable actors.

8. Some mappings are generalized and can overstate compliance readiness.

The system uses broad roles (for example, System Admin as broad fallback access) and marks some controls as compliant for non-applicable product types in demo flows. This is acceptable for a teaching model but should be separated from production compliance attestation.

### Smaller gaps

- No live notification push pipeline
- No real document OCR / verification service
- No co-applicant identity linkage beyond the form fields
- No sanctions / bureau / KYC API integration
- No signed document repository integration
- No true DLA / CIMS reporting workflow

## Flow Verdict

The frontend is now structured as a complete LOS teaching model:

- borrower app captures the journey from onboarding to agreement
- web app covers lender review, credit analysis, underwriting, compliance, and disbursal
- RBI controls are visible at the right checkpoints
- AI risk scoring is explainable in the web layer

What is still missing is the production integration layer that would turn the UI into a real lending platform.

## Recommended Next Build Steps

1. Connect borrower app and web app to a shared API and loan application database.
2. Persist stage transitions, consent records, and RBI audit evidence server-side.
3. Wire the rejection / rework path from score and underwriting decisions back into the borrower app.
4. Add LMS servicing flows for repayment, closure, foreclosure, and statement requests.
5. Replace the remaining mock queues and sample data with live services.