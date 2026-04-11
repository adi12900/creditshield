# Requirements Document

## Introduction

This document defines the requirements for the **LOS-LMS Platform UI** — a production-ready, role-based internal web platform built with React + TypeScript + Tailwind CSS. The platform serves all non-borrower stakeholders across the complete 20-stage lending lifecycle: Loan Origination System (LOS, Stages 1–10) and Loan Management System (LMS, Stages 11–20) for the Indian financial ecosystem.

The platform integrates AI/ML signals (credit scoring, fraud detection, delinquency prediction, OCR) visibly into every relevant workflow. The borrower-facing mobile app (Flutter) is out of scope.

---

## Glossary

- **LOS**: Loan Origination System — manages loan creation from lead to disbursement (Stages 1–10)
- **LMS**: Loan Management System — manages active loans from account creation to closure (Stages 11–20)
- **ARN**: Application Reference Number — unique ID assigned at application submission
- **LAN**: Loan Account Number — unique ID assigned at LMS account creation
- **DPD**: Days Past Due — primary delinquency metric
- **SMA**: Special Mention Account — RBI classification: SMA-0 (1–30 DPD), SMA-1 (31–60 DPD), SMA-2 (61–90 DPD)
- **NPA**: Non-Performing Asset — loan with 90+ DPD
- **DTI**: Debt-to-Income ratio
- **FOIR**: Fixed Obligation to Income Ratio
- **LTV**: Loan-to-Value ratio
- **EMI**: Equated Monthly Installment
- **NACH**: National Automated Clearing House — auto-debit mandate system
- **ECL**: Expected Credit Loss — IFRS 9 provisioning metric
- **PEP**: Politically Exposed Person
- **NOC**: No-Objection Certificate issued at loan closure
- **Risk_Grade**: AI-assigned risk classification: A+, A, B, C, D
- **Decision_Engine**: Automated system applying hard filters → policy rules → credit score evaluation
- **Platform**: The internal web application described in this document
- **Loan_Officer**: Internal staff managing application pipeline and borrower communication
- **Credit_Analyst**: Internal staff analyzing creditworthiness and preparing credit memos
- **Underwriter**: Internal staff with final approval authority within delegated limits
- **Collection_Agent**: Internal staff managing delinquent account recovery
- **Finance_Team**: Internal staff managing GL, reconciliation, and provisioning
- **Compliance_Officer**: Internal staff monitoring KYC/AML, audit, and regulatory reporting
- **Ops_Team**: Internal staff managing disbursement, document vault, and LMS handoff
- **System_Admin**: Internal staff configuring workflows, rules, users, and integrations
- **AI_Layer**: Cross-cutting AI/ML services providing credit scoring, fraud detection, OCR, and delinquency prediction

---

## Requirements

### Requirement 1: Loan Officer Portal — Application Pipeline Dashboard

**User Story:** As a Loan Officer, I want a real-time application pipeline dashboard, so that I can manage my assigned applications, monitor SLAs, and prioritize work efficiently.

#### Acceptance Criteria

1. THE Platform SHALL display a Kanban-style pipeline view grouping applications by stage: Lead, Submitted, Documents Pending, KYC, Underwriting, Offer Sent, Disbursed, Rejected
2. WHEN a Loan_Officer logs in, THE Platform SHALL show only applications assigned to that officer by default, with a toggle to view team pipeline
3. WHEN an application SLA threshold is breached, THE Platform SHALL highlight the application card with a visual urgency indicator and display time-overdue
4. WHEN a Loan_Officer clicks an application card, THE Platform SHALL navigate to the Application Detail View without full page reload
5. THE Platform SHALL display aggregate pipeline metrics: total active applications, average TAT per stage, SLA breach count, and conversion rate
6. WHEN a Loan_Officer applies a filter (loan type, risk grade, date range, channel), THE Platform SHALL update the pipeline view within 500ms
7. THE Platform SHALL display the AI_Layer risk grade badge (A+ to D) on each application card where risk assessment is complete
8. WHEN a new application is assigned to the Loan_Officer, THE Platform SHALL display a real-time notification without requiring page refresh

### Requirement 2: Loan Officer Portal — Application Detail View with AI Risk Signals

**User Story:** As a Loan Officer, I want a comprehensive application detail view with AI-generated risk signals, so that I can make informed decisions and take appropriate actions on each application.

#### Acceptance Criteria

1. THE Platform SHALL display all application data in a tabbed layout: Overview, Documents, KYC Status, Credit, Communication, Activity Log
2. WHEN the AI_Layer has completed risk assessment, THE Platform SHALL display the risk grade (A+ to D), confidence score (0–100%), and top 3 contributing factors
3. WHEN a fraud signal is detected by the AI_Layer, THE Platform SHALL display a prominent fraud alert banner with signal type and severity level
4. THE Platform SHALL display document verification status for each uploaded document: Verified, Pending OCR, Failed, Requires Review
5. WHEN a Loan_Officer adds a note or comment, THE Platform SHALL persist it to the activity log with timestamp and officer name
6. THE Platform SHALL provide action buttons contextual to the current application stage: Request Documents, Escalate, Approve for Underwriting, Reject
7. IF an application is in Manual Review status, THEN THE Platform SHALL display the reason for manual review and the underwriter assignment
8. THE Platform SHALL display the complete communication history with the borrower in chronological order

### Requirement 3: Loan Officer Portal — Document Review Interface

**User Story:** As a Loan Officer, I want an integrated document review interface with OCR extraction results, so that I can verify documents efficiently without switching between systems.

#### Acceptance Criteria

1. THE Platform SHALL display uploaded documents in a side-by-side viewer: document image on the left, OCR-extracted fields on the right
2. WHEN the AI_Layer completes OCR processing, THE Platform SHALL display extracted field values with confidence scores per field
3. WHEN an OCR confidence score falls below 80%, THE Platform SHALL highlight the field in amber and prompt the Loan_Officer to manually verify
4. THE Platform SHALL allow a Loan_Officer to override an OCR-extracted value and record the manual correction with a reason
5. WHEN a document tampering signal is detected, THE Platform SHALL display a red alert with the specific tampering indicator (metadata anomaly, pixel manipulation, digital signature mismatch)
6. THE Platform SHALL support document comparison: displaying two versions of the same document type side-by-side for re-submission review
7. WHEN all required documents are verified, THE Platform SHALL automatically update the application stage to Documents Complete

### Requirement 4: Loan Officer Portal — Communication Tools and CRM

**User Story:** As a Loan Officer, I want integrated communication tools and CRM capabilities, so that I can manage borrower interactions without leaving the platform.

#### Acceptance Criteria

1. THE Platform SHALL provide a communication panel supporting: SMS composition, email composition, and call log entry
2. WHEN a Loan_Officer sends a communication, THE Platform SHALL log it to the application activity timeline with channel, content summary, and timestamp
3. THE Platform SHALL display borrower contact details, preferred contact channel, and communication history in a unified CRM panel
4. WHEN a borrower responds to a communication, THE Platform SHALL surface the response in the Loan_Officer's notification feed
5. THE Platform SHALL provide pre-built message templates for common scenarios: document request, status update, offer notification, rejection notice
6. WHEN a Loan_Officer selects a template, THE Platform SHALL auto-populate borrower name, ARN, and relevant loan details into the template

### Requirement 5: Credit Analyst Workbench — Credit Bureau Report Viewer

**User Story:** As a Credit Analyst, I want a structured credit bureau report viewer, so that I can analyze borrower creditworthiness efficiently and accurately.

#### Acceptance Criteria

1. THE Platform SHALL display the parsed credit bureau report in a structured layout: credit score, score band, tradelines, inquiry history, derogatory marks, and public records
2. THE Platform SHALL display credit score trend over the last 24 months as a line chart
3. WHEN a derogatory mark or active collection account is present, THE Platform SHALL highlight it with a red indicator and display the account details
4. THE Platform SHALL display credit utilization ratio as a visual gauge with industry benchmark comparison
5. WHEN multiple bureau reports are available (CIBIL + Experian), THE Platform SHALL display them in a tabbed comparison view
6. THE Platform SHALL display the AI_Layer Tier 1 credit score contribution alongside the bureau score for comparison
7. WHEN a thin-file borrower has insufficient bureau data, THE Platform SHALL display an indicator and show available alternative data sources used


### Requirement 6: Credit Analyst Workbench — Financial Ratio Calculator

**User Story:** As a Credit Analyst, I want an automated financial ratio calculator, so that I can compute DTI, FOIR, and LTV accurately from verified income and obligation data.

#### Acceptance Criteria

1. THE Platform SHALL automatically calculate DTI, FOIR, and LTV from verified application data and display results with the formula used
2. WHEN a calculated ratio exceeds the product policy threshold, THE Platform SHALL highlight it in red and display the policy limit
3. THE Platform SHALL allow a Credit_Analyst to adjust income or obligation inputs and recalculate ratios in real-time
4. THE Platform SHALL display a ratio comparison table showing the applicant's ratios against product eligibility thresholds and peer benchmarks
5. WHEN bank statement analysis data is available, THE Platform SHALL display average monthly inflow, outflow, and net surplus alongside declared income

### Requirement 7: Credit Analyst Workbench — AI Credit Score Breakdown

**User Story:** As a Credit Analyst, I want a detailed breakdown of the AI credit score across all three tiers, so that I can understand the model's assessment and identify risk factors.

#### Acceptance Criteria

1. THE Platform SHALL display the composite AI credit score with a visual gauge (0–900 scale) and risk band label
2. THE Platform SHALL display the three-tier score breakdown: Tier 1 (bureau), Tier 2 (behavioral), Tier 3 (alternative data) with individual scores and weights
3. THE Platform SHALL display the top 5 positive and top 5 negative factors contributing to the AI score with their relative impact
4. WHEN a Tier 3 alternative data source is used, THE Platform SHALL display which data sources contributed (bank statement, utility, rental) and their confidence levels
5. THE Platform SHALL display the AI model confidence interval for the credit score (e.g., 720 ± 35)

### Requirement 8: Credit Analyst Workbench — Credit Memo Creation

**User Story:** As a Credit Analyst, I want a structured credit memo creation tool, so that I can document my analysis and recommendation in a standardized format for underwriter review.

#### Acceptance Criteria

1. THE Platform SHALL provide a credit memo template pre-populated with application data, bureau scores, financial ratios, and AI risk grade
2. WHEN a Credit_Analyst completes the credit memo, THE Platform SHALL require a recommendation field: Approve, Approve with Conditions, Decline
3. THE Platform SHALL allow a Credit_Analyst to attach supporting documents and notes to the credit memo
4. WHEN a credit memo is submitted, THE Platform SHALL route it to the assigned Underwriter and update the application stage
5. THE Platform SHALL maintain a version history of credit memos for audit purposes

### Requirement 9: Underwriter Workbench — Risk Assessment Summary

**User Story:** As an Underwriter, I want a consolidated risk assessment summary with AI grade visualization, so that I can make informed final credit decisions efficiently.

#### Acceptance Criteria

1. THE Platform SHALL display a risk assessment summary card showing: AI risk grade (A+ to D), composite credit score, DTI, FOIR, LTV, fraud score, and KYC status
2. THE Platform SHALL display the AI risk grade as a color-coded badge: A+ (deep green), A (green), B (teal), C (amber), D (red)
3. THE Platform SHALL display the credit analyst's memo and recommendation prominently in the underwriting workbench
4. WHEN the AI risk grade is C or D, THE Platform SHALL display a risk warning panel with specific risk factors requiring underwriter attention
5. THE Platform SHALL display comparable approved/rejected applications with similar risk profiles as reference cases

### Requirement 10: Underwriter Workbench — Decision Engine Output Visualization

**User Story:** As an Underwriter, I want to see the Decision Engine's step-by-step output, so that I can understand the automated decision logic and identify where manual review is required.

#### Acceptance Criteria

1. THE Platform SHALL display the Decision Engine evaluation as a visual flow: Hard Filters → Policy Rules → Credit Score Evaluation → Decision
2. THE Platform SHALL show the pass/fail status of each hard filter and policy rule with the specific rule name and evaluated value
3. WHEN the Decision Engine routes to Manual Review, THE Platform SHALL display the specific trigger condition (e.g., "Credit score 650 — in MEDIUM band, requires underwriter review")
4. THE Platform SHALL display the final automated decision (AUTO APPROVE / MANUAL REVIEW / AUTO REJECT) with reason codes
5. WHEN an AUTO REJECT is triggered by a hard filter, THE Platform SHALL display the specific filter that triggered rejection


### Requirement 11: Underwriter Workbench — Policy Override Interface

**User Story:** As an Underwriter, I want a policy override interface with mandatory audit trail, so that I can approve exceptions within my delegated authority while maintaining compliance.

#### Acceptance Criteria

1. THE Platform SHALL display a policy override panel listing all failed policy rules with the option to override each individually
2. WHEN an Underwriter initiates a policy override, THE Platform SHALL require a mandatory justification text (minimum 50 characters) and override category selection
3. THE Platform SHALL enforce delegated authority limits: overrides exceeding the Underwriter's authority level SHALL require escalation to a senior approver
4. WHEN a policy override is submitted, THE Platform SHALL create an immutable audit log entry with: underwriter ID, timestamp, rule overridden, justification, and decision
5. THE Platform SHALL display the override history for the application showing all previous overrides and their outcomes

### Requirement 12: Underwriter Workbench — Loan Structuring Tools

**User Story:** As an Underwriter, I want loan structuring tools, so that I can adjust loan parameters to create an approvable offer for borderline applications.

#### Acceptance Criteria

1. THE Platform SHALL provide a loan structuring panel allowing adjustment of: loan amount, tenure, interest rate (within product bounds), and processing fee
2. WHEN an Underwriter adjusts loan parameters, THE Platform SHALL recalculate EMI, total interest payable, APR, and updated DTI/FOIR in real-time
3. THE Platform SHALL display multiple offer variants side-by-side (e.g., lower amount vs. longer tenure) for comparison
4. WHEN structured loan parameters violate product policy bounds, THE Platform SHALL prevent submission and display the violated constraint
5. THE Platform SHALL generate a draft loan offer preview showing the borrower-facing offer details before final approval

### Requirement 13: Risk & Compliance Dashboard — KYC/AML Screening Results

**User Story:** As a Compliance_Officer, I want a KYC/AML screening results dashboard, so that I can review identity verification outcomes and manage compliance holds efficiently.

#### Acceptance Criteria

1. THE Platform SHALL display KYC verification results for each check: Aadhaar OTP, DigiLocker, liveness check, face match — with pass/fail status and confidence score
2. THE Platform SHALL display AML screening results: PEP match status, sanctions list match status, adverse media hits — with match score and source
3. WHEN a PEP or sanctions match is detected, THE Platform SHALL display a high-priority alert with match details and require Compliance_Officer action before the application can proceed
4. THE Platform SHALL display the complete KYC/AML audit trail: each check performed, timestamp, provider, result, and decision rationale
5. WHEN a Compliance_Officer clears a KYC/AML hold, THE Platform SHALL record the clearance with justification and update the application status

### Requirement 14: Risk & Compliance Dashboard — Fraud Signal Visualization

**User Story:** As a Compliance_Officer, I want a fraud signal visualization panel, so that I can assess fraud risk across multiple detection dimensions and take appropriate action.

#### Acceptance Criteria

1. THE Platform SHALL display a fraud risk radar chart showing scores across: identity fraud, document fraud, application fraud, synthetic identity, and velocity fraud dimensions
2. THE Platform SHALL display individual fraud signals as a list with signal type, severity (Low/Medium/High/Critical), and detection method
3. WHEN the aggregate fraud score exceeds the high-risk threshold, THE Platform SHALL display a fraud alert banner and block automated processing
4. THE Platform SHALL display device intelligence signals: device fingerprint, IP geolocation, VPN/proxy detection, and velocity (applications from same device/IP)
5. THE Platform SHALL allow a Compliance_Officer to mark a fraud signal as false positive with a mandatory reason, updating the fraud score accordingly

### Requirement 15: Risk & Compliance Dashboard — Audit Log Viewer

**User Story:** As a Compliance_Officer, I want a searchable audit log viewer, so that I can investigate specific events and produce evidence for regulatory examinations.

#### Acceptance Criteria

1. THE Platform SHALL display an immutable audit log with: timestamp, user ID, action type, entity affected, data before/after state, and IP address
2. WHEN a Compliance_Officer searches the audit log by user, date range, action type, or entity ID, THE Platform SHALL return filtered results within 2 seconds
3. THE Platform SHALL support audit log export in CSV and PDF formats with applied filters preserved
4. THE Platform SHALL display audit log entries in chronological order with the ability to reverse sort
5. WHEN an audit log entry involves a policy override or compliance hold clearance, THE Platform SHALL display it with a distinct visual indicator


### Requirement 16: Risk & Compliance Dashboard — Regulatory Report Generation

**User Story:** As a Compliance_Officer, I want automated regulatory report generation, so that I can fulfill RBI and other regulatory reporting obligations accurately and on time.

#### Acceptance Criteria

1. THE Platform SHALL support generation of the following report types: SMA/NPA classification report, AML suspicious activity summary, fair lending disparate impact analysis, and bureau update queue
2. WHEN a Compliance_Officer initiates report generation, THE Platform SHALL display a progress indicator and notify upon completion
3. THE Platform SHALL allow scheduling of recurring regulatory reports with configurable frequency (daily, weekly, monthly)
4. THE Platform SHALL display the last generated date and record count for each report type
5. WHEN a report generation fails, THE Platform SHALL display the error reason and provide a retry option

### Requirement 17: Operations Portal — Disbursement Approval Queue

**User Story:** As an Ops_Team member, I want a disbursement approval queue, so that I can review and authorize fund transfers efficiently with all required checks visible.

#### Acceptance Criteria

1. THE Platform SHALL display a disbursement queue listing applications approved for disbursement with: ARN, borrower name, loan amount, payment rail (NEFT/RTGS/IMPS), and bank account details
2. WHEN an Ops_Team member selects a disbursement record, THE Platform SHALL display the complete pre-disbursement checklist: e-sign status, KYC cleared, agreement executed, bank account verified
3. THE Platform SHALL require dual-authorization for disbursements above a configurable threshold amount
4. WHEN a disbursement is authorized, THE Platform SHALL trigger the payment instruction and display the UTR/transaction reference number upon confirmation
5. WHEN a disbursement fails, THE Platform SHALL display the failure reason and route the record to the exception queue

### Requirement 18: Operations Portal — Document Vault

**User Story:** As an Ops_Team member, I want a secure document vault, so that I can access, manage, and retrieve all loan-related documents throughout the loan lifecycle.

#### Acceptance Criteria

1. THE Platform SHALL display all documents associated with a loan organized by category: Identity, Income, Address, Agreement, Collateral, Correspondence
2. THE Platform SHALL support document search by document type, upload date, and verification status
3. WHEN an Ops_Team member downloads a document, THE Platform SHALL log the access event with user ID, timestamp, and document ID
4. THE Platform SHALL display document metadata: upload date, uploaded by, OCR status, verification status, and version number
5. THE Platform SHALL support bulk document download as a ZIP archive for a complete loan file

### Requirement 19: Operations Portal — LOS-to-LMS Handoff Status

**User Story:** As an Ops_Team member, I want visibility into the LOS-to-LMS handoff status, so that I can ensure disbursed loans are correctly transferred to the LMS without data loss.

#### Acceptance Criteria

1. THE Platform SHALL display a handoff status tracker for each disbursed loan: Pending, In Progress, Completed, Failed
2. WHEN a handoff fails, THE Platform SHALL display the specific failure reason (API error, data validation failure, timeout) and the failed payload fields
3. THE Platform SHALL display the LAN returned by the LMS upon successful handoff alongside the originating ARN
4. WHEN a handoff is in Failed status for more than 30 minutes, THE Platform SHALL escalate to the Ops_Team supervisor with an alert
5. THE Platform SHALL provide a manual retry option for failed handoffs with the ability to view and edit the handoff payload before retry

### Requirement 20: Operations Portal — Exception Management

**User Story:** As an Ops_Team member, I want an exception management queue, so that I can resolve processing exceptions that require manual intervention without losing track of pending items.

#### Acceptance Criteria

1. THE Platform SHALL display all active exceptions categorized by type: Document Exception, KYC Exception, Disbursement Exception, Handoff Exception, System Exception
2. THE Platform SHALL display exception age, assigned owner, priority level, and current status for each exception
3. WHEN an Ops_Team member resolves an exception, THE Platform SHALL require a resolution note and update the parent application status accordingly
4. THE Platform SHALL display exception trend metrics: open count by type, average resolution time, and SLA breach rate
5. WHEN an exception is unresolved beyond its SLA, THE Platform SHALL escalate it to the next level and display an overdue indicator


### Requirement 21: Loan Servicing Dashboard — Active Loan Portfolio View

**User Story:** As a Finance_Team member, I want an active loan portfolio view, so that I can monitor portfolio health, outstanding balances, and delinquency distribution at a glance.

#### Acceptance Criteria

1. THE Platform SHALL display portfolio summary metrics: total active loans, total outstanding principal, total overdue amount, NPA count, and collection efficiency ratio
2. THE Platform SHALL display a delinquency distribution chart showing loan count and outstanding amount by DPD bucket: Current, SMA-0, SMA-1, SMA-2, NPA
3. WHEN a Finance_Team member filters by product type, disbursement cohort, or risk grade, THE Platform SHALL update all portfolio metrics and charts accordingly
4. THE Platform SHALL display a vintage analysis chart showing default rates by disbursement month cohort
5. THE Platform SHALL display portfolio concentration metrics: top 10 borrowers by exposure, geographic distribution, and product mix

### Requirement 22: Loan Servicing Dashboard — EMI Schedule and Amortization Table

**User Story:** As a Finance_Team member or Customer Support Agent, I want to view the complete EMI schedule and amortization table for any loan, so that I can answer borrower queries and verify payment calculations.

#### Acceptance Criteria

1. THE Platform SHALL display the complete amortization table for a loan: EMI number, due date, EMI amount, principal component, interest component, and outstanding balance
2. THE Platform SHALL highlight paid EMIs in green, upcoming EMIs in default color, overdue EMIs in red, and partially paid EMIs in amber
3. WHEN a prepayment has been made, THE Platform SHALL display the revised amortization schedule with the recalculated outstanding balance and remaining EMIs
4. THE Platform SHALL display summary totals: total principal, total interest payable, total amount payable, and amount paid to date
5. THE Platform SHALL support export of the amortization table as PDF and CSV

### Requirement 23: Loan Servicing Dashboard — Payment Tracking and Allocation Waterfall

**User Story:** As a Finance_Team member, I want real-time payment tracking with allocation waterfall visibility, so that I can verify payment processing accuracy and resolve allocation disputes.

#### Acceptance Criteria

1. THE Platform SHALL display a payment history timeline showing each payment event: date, amount received, payment mode, UTR reference, and allocation breakdown
2. THE Platform SHALL display the allocation waterfall for each payment: amount applied to fees, penalties, interest, and principal — in priority order
3. WHEN a partial payment is received, THE Platform SHALL display the shortfall amount and the updated next EMI due
4. THE Platform SHALL display NACH mandate status: active, failed, pending registration, and last debit attempt result
5. WHEN a payment bounce occurs, THE Platform SHALL display the bounce reason, bounce charge applied, and re-presentation schedule

### Requirement 24: Loan Servicing Dashboard — Delinquency Bucket Visualization

**User Story:** As a Finance_Team member, I want a delinquency bucket heatmap and DPD tracker, so that I can monitor portfolio delinquency trends and identify at-risk accounts.

#### Acceptance Criteria

1. THE Platform SHALL display a DPD heatmap showing loan accounts plotted by DPD bucket and outstanding amount, with color intensity representing concentration
2. THE Platform SHALL display roll rate analysis: percentage of accounts moving from each DPD bucket to the next in the current month vs. prior month
3. WHEN an account crosses into NPA status (90+ DPD), THE Platform SHALL display an NPA classification alert and trigger the provisioning workflow
4. THE Platform SHALL display the AI_Layer delinquency prediction score for each active loan: probability of becoming delinquent in the next 30 days
5. THE Platform SHALL display delinquency trend charts: DPD bucket distribution over the last 12 months

### Requirement 25: Collections Agent App — Collection Queue

**User Story:** As a Collection_Agent, I want a prioritized collection queue, so that I can focus my outreach efforts on the highest-value and highest-risk accounts first.

#### Acceptance Criteria

1. THE Platform SHALL display a collection queue sorted by a composite priority score combining: DPD bucket, outstanding amount, AI delinquency prediction score, and previous contact attempts
2. THE Platform SHALL display for each queue item: borrower name, LAN, DPD, overdue amount, last contact date, and last disposition
3. WHEN a Collection_Agent selects an account, THE Platform SHALL display the borrower's 360° view: loan details, payment history, contact history, and AI risk signals
4. THE Platform SHALL allow a Collection_Agent to filter the queue by DPD bucket, assigned territory, loan product, and outstanding amount range
5. THE Platform SHALL display the Collection_Agent's daily performance metrics: accounts contacted, promises received, amount promised, and amount collected


### Requirement 26: Collections Agent App — Call Disposition Entry

**User Story:** As a Collection_Agent, I want a quick call disposition entry interface, so that I can record contact outcomes accurately and efficiently after each borrower interaction.

#### Acceptance Criteria

1. THE Platform SHALL provide a disposition entry form with standardized outcome codes: Promise to Pay, Partial Promise, Dispute Raised, Cannot Be Contacted, Refused to Pay, Legal Action Required
2. WHEN a Collection_Agent selects "Promise to Pay", THE Platform SHALL require entry of: promised amount, promised date, and payment mode
3. THE Platform SHALL auto-save disposition entries and update the account's contact history in real-time
4. WHEN a promise-to-pay date passes without payment, THE Platform SHALL automatically flag the account as broken promise and escalate priority in the queue
5. THE Platform SHALL display the complete disposition history for an account in chronological order

### Requirement 27: Collections Agent App — Promise-to-Pay Tracker

**User Story:** As a Collection_Agent, I want a promise-to-pay tracker, so that I can monitor commitments made by borrowers and follow up on broken promises systematically.

#### Acceptance Criteria

1. THE Platform SHALL display all active promises-to-pay with: borrower name, LAN, promised amount, promised date, and days until due
2. THE Platform SHALL highlight promises due today in amber and overdue promises in red
3. WHEN a payment matching a promise-to-pay is received, THE Platform SHALL automatically mark the promise as fulfilled
4. THE Platform SHALL display promise fulfillment rate as a metric: promises kept vs. total promises in the current month
5. THE Platform SHALL allow a Collection_Agent to reschedule a promise-to-pay with a mandatory reason note

### Requirement 28: Collections Agent App — Field Collection Management

**User Story:** As a Collection_Agent, I want field collection management tools, so that I can plan and record in-person collection visits for high-value delinquent accounts.

#### Acceptance Criteria

1. THE Platform SHALL display a field visit queue with borrower address, outstanding amount, DPD, and recommended visit priority
2. WHEN a Collection_Agent records a field visit outcome, THE Platform SHALL capture: visit date/time, location (GPS coordinates if available), contact made (yes/no), amount collected, and notes
3. THE Platform SHALL display a map view of field visit assignments grouped by geographic territory
4. WHEN cash is collected in the field, THE Platform SHALL generate a collection receipt with a unique reference number
5. THE Platform SHALL display field collection performance metrics: visits completed, collection rate, and average collection per visit

### Requirement 29: Customer Support Portal — Borrower Account 360° View

**User Story:** As a Customer Support Agent, I want a 360° borrower account view, so that I can answer any borrower query with complete context without switching between systems.

#### Acceptance Criteria

1. THE Platform SHALL display a unified borrower profile: personal details, all active and closed loans, total outstanding, payment status, and contact history
2. THE Platform SHALL display the loan origination summary for each loan: ARN, application date, approved amount, interest rate, tenure, and disbursement date
3. WHEN a Customer Support Agent searches by mobile number, PAN, or LAN, THE Platform SHALL return the matching borrower profile within 1 second
4. THE Platform SHALL display the borrower's current DPD status and delinquency history across all loans
5. THE Platform SHALL display the AI_Layer delinquency prediction score and risk grade for each active loan visible to the support agent

### Requirement 30: Customer Support Portal — Dispute Management

**User Story:** As a Customer Support Agent, I want a dispute management interface, so that I can log, track, and resolve borrower disputes within defined SLAs.

#### Acceptance Criteria

1. THE Platform SHALL provide a dispute creation form with: dispute type (payment not credited, incorrect charge, statement error, NACH failure), description, and supporting document upload
2. WHEN a dispute is created, THE Platform SHALL assign a unique dispute ID, set status to Open, and notify the relevant team
3. THE Platform SHALL display all disputes for a borrower with: dispute ID, type, creation date, status, and resolution date
4. WHEN a dispute SLA is breached, THE Platform SHALL escalate it to the supervisor and display an overdue indicator
5. WHEN a dispute is resolved, THE Platform SHALL notify the borrower and record the resolution details in the dispute history

### Requirement 31: Customer Support Portal — Statement Generation

**User Story:** As a Customer Support Agent, I want on-demand statement generation, so that I can provide borrowers with accurate account statements and certificates immediately.

#### Acceptance Criteria

1. THE Platform SHALL support generation of: account statement (date range), interest certificate (financial year), outstanding balance certificate, NOC (for closed loans), and foreclosure quote
2. WHEN a Customer Support Agent generates a statement, THE Platform SHALL produce a PDF within 10 seconds
3. THE Platform SHALL allow the Customer Support Agent to send the generated statement directly to the borrower's registered email from within the platform
4. THE Platform SHALL log every statement generation event with: agent ID, statement type, date range, and delivery method


### Requirement 32: Finance & Accounting Dashboard — GL Entry Review

**User Story:** As a Finance_Team member, I want a GL entry review interface, so that I can verify that all loan financial events are correctly posted to the general ledger.

#### Acceptance Criteria

1. THE Platform SHALL display GL entries for a loan in double-entry format: debit account, credit account, amount, event type, and posting date
2. THE Platform SHALL display GL entries for standard loan events: disbursement, interest accrual, payment receipt, penalty collection, NPA provisioning, and write-off
3. WHEN a GL entry fails to post, THE Platform SHALL display the failed entry with error reason and provide a manual posting option
4. THE Platform SHALL support GL entry search by date range, account code, event type, and loan ID
5. THE Platform SHALL display daily GL summary: total debits, total credits, and net position by account code

### Requirement 33: Finance & Accounting Dashboard — Bank Reconciliation

**User Story:** As a Finance_Team member, I want a bank reconciliation interface, so that I can match incoming payments to loan accounts and identify unreconciled transactions.

#### Acceptance Criteria

1. THE Platform SHALL display a reconciliation workspace showing: bank statement entries on the left and matched LMS payment records on the right
2. THE Platform SHALL automatically match bank entries to LMS payments by UTR reference number and display match confidence
3. WHEN a bank entry cannot be automatically matched, THE Platform SHALL display it in an unmatched queue for manual reconciliation
4. THE Platform SHALL display reconciliation summary: total bank credits, total matched, total unmatched, and reconciliation percentage
5. WHEN a Finance_Team member manually matches a bank entry to a payment, THE Platform SHALL record the match with the agent ID and timestamp

### Requirement 34: Finance & Accounting Dashboard — Provisioning and Write-off Management

**User Story:** As a Finance_Team member, I want provisioning and write-off management tools, so that I can comply with IFRS 9 ECL requirements and manage credit loss recognition.

#### Acceptance Criteria

1. THE Platform SHALL display the provisioning matrix showing required provision percentage by DPD bucket and loan category
2. THE Platform SHALL calculate and display the ECL provision amount for each NPA account based on the configured provisioning matrix
3. WHEN a Finance_Team member initiates a write-off, THE Platform SHALL require: write-off amount, write-off reason, approval authority, and supporting documentation
4. THE Platform SHALL display total provisioning balance, write-off amount for the current period, and provision coverage ratio
5. THE Platform SHALL generate the NPA provisioning report in the format required for RBI regulatory submission

### Requirement 35: System Admin Console — Workflow Designer

**User Story:** As a System_Admin, I want a visual workflow designer, so that I can configure and modify loan processing workflows without requiring engineering involvement.

#### Acceptance Criteria

1. THE Platform SHALL provide a drag-and-drop workflow canvas where System_Admin can define stages, transitions, conditions, and actions
2. WHEN a System_Admin adds a transition condition, THE Platform SHALL provide a rule builder with attribute selection, operator, and value inputs
3. THE Platform SHALL support workflow versioning: saving a new version, comparing versions, and rolling back to a previous version
4. WHEN a System_Admin publishes a workflow change, THE Platform SHALL apply it to new applications only, leaving in-flight applications on the previous version
5. THE Platform SHALL display workflow performance metrics: average time per stage, SLA breach rate, and bottleneck identification

### Requirement 36: System Admin Console — Rule Engine Configuration

**User Story:** As a System_Admin, I want a rule engine configuration interface, so that I can define and update credit policy rules, hard filters, and scoring thresholds without code changes.

#### Acceptance Criteria

1. THE Platform SHALL provide a rule builder interface for creating rules with: attribute, operator, value, and action (approve/reject/flag/route)
2. THE Platform SHALL support rule grouping into rule sets: Hard Filters, Policy Rules, and Credit Score Thresholds
3. WHEN a System_Admin tests a rule against a sample application, THE Platform SHALL display the rule evaluation result and the matched/unmatched conditions
4. THE Platform SHALL support champion-challenger rule set configuration: running two rule versions simultaneously with configurable traffic split
5. THE Platform SHALL display rule performance metrics: application volume processed, approval rate, and default rate by rule segment


### Requirement 37: System Admin Console — User and Role Management

**User Story:** As a System_Admin, I want user and role management capabilities, so that I can control access to sensitive financial data and enforce the principle of least privilege.

#### Acceptance Criteria

1. THE Platform SHALL support role-based access control with predefined roles: Loan_Officer, Credit_Analyst, Underwriter, Compliance_Officer, Ops_Team, Collection_Agent, Customer_Support, Finance_Team, System_Admin
2. WHEN a System_Admin creates a user, THE Platform SHALL require: name, email, role assignment, and reporting manager
3. THE Platform SHALL support custom permission sets allowing System_Admin to grant or revoke specific feature access within a role
4. WHEN a user account is deactivated, THE Platform SHALL immediately revoke all active sessions and prevent new logins
5. THE Platform SHALL display user activity summary: last login, actions performed in the last 30 days, and active session count

### Requirement 38: System Admin Console — Integration Health Monitoring

**User Story:** As a System_Admin, I want an integration health monitoring dashboard, so that I can detect and respond to third-party service failures before they impact loan processing.

#### Acceptance Criteria

1. THE Platform SHALL display the health status of all integrations: credit bureaus (CIBIL, Experian), KYC providers, payment rails (NEFT/RTGS/IMPS), eSign provider, and LMS API
2. THE Platform SHALL display for each integration: current status (Healthy/Degraded/Down), response time (last 24 hours), error rate, and last successful call timestamp
3. WHEN an integration status changes to Degraded or Down, THE Platform SHALL display an alert banner and notify the System_Admin
4. THE Platform SHALL display integration call volume and latency trend charts for the last 7 days
5. THE Platform SHALL provide a manual integration test trigger that calls the integration health endpoint and displays the raw response

### Requirement 39: AI Intelligence Layer — Risk Score Visualization

**User Story:** As any internal stakeholder, I want consistent AI risk score visualization across all portals, so that I can interpret AI assessments quickly and confidently.

#### Acceptance Criteria

1. THE Platform SHALL display the AI credit score as a gauge chart with color zones: green (A+/A), teal (B), amber (C), red (D)
2. THE Platform SHALL display the score confidence interval (e.g., 720 ± 35) alongside the point estimate
3. THE Platform SHALL display the top contributing factors as a horizontal bar chart showing positive factors (green bars) and negative factors (red bars)
4. WHEN the AI model is processing, THE Platform SHALL display a processing state indicator with estimated completion time
5. THE Platform SHALL display the model version and last training date for transparency

### Requirement 40: AI Intelligence Layer — Explainable AI Panel

**User Story:** As a Credit_Analyst or Underwriter, I want an explainable AI panel, so that I can understand the reasoning behind AI decisions and satisfy regulatory requirements for adverse action notices.

#### Acceptance Criteria

1. THE Platform SHALL display a natural-language explanation of the AI decision: "This application was flagged for manual review because the credit score of 650 falls in the medium-risk band and the DTI ratio of 48% exceeds the 45% policy threshold"
2. THE Platform SHALL display a SHAP-style feature importance visualization showing each input variable's contribution to the final score
3. WHEN an adverse action is triggered, THE Platform SHALL generate regulation-compliant reason codes suitable for borrower communication
4. THE Platform SHALL display counterfactual explanations: "If the DTI ratio were reduced to 42%, this application would qualify for AUTO APPROVE"
5. THE Platform SHALL allow a Credit_Analyst to export the AI explanation as a PDF for inclusion in the credit file

### Requirement 41: AI Intelligence Layer — Fraud Signal Indicators

**User Story:** As a Compliance_Officer or Loan_Officer, I want clear fraud signal indicators, so that I can identify and act on potential fraud before disbursement.

#### Acceptance Criteria

1. THE Platform SHALL display a fraud risk score (0–100) with a color-coded severity band: Low (0–30), Medium (31–60), High (61–85), Critical (86–100)
2. THE Platform SHALL display individual fraud signals as tagged badges: Liveness Fail, Document Tamper, Velocity Flag, Synthetic Identity, IP Anomaly, Income Inconsistency
3. WHEN a Critical fraud score is detected, THE Platform SHALL automatically block the application from proceeding and require Compliance_Officer review
4. THE Platform SHALL display the fraud signal timeline showing when each signal was detected during the application process
5. THE Platform SHALL display similar fraud patterns: other applications with matching fraud signals (same device, same IP, similar document anomalies)

### Requirement 42: AI Intelligence Layer — Delinquency Prediction

**User Story:** As a Finance_Team member or Collection_Agent, I want AI-powered delinquency prediction, so that I can proactively intervene with at-risk accounts before they become delinquent.

#### Acceptance Criteria

1. THE Platform SHALL display a delinquency prediction score (0–100%) for each active loan representing the probability of becoming delinquent in the next 30 days
2. THE Platform SHALL display the top 3 factors driving the delinquency prediction for each account
3. WHEN a delinquency prediction score exceeds 70%, THE Platform SHALL automatically add the account to the proactive outreach queue
4. THE Platform SHALL display a portfolio-level delinquency prediction heatmap showing predicted delinquency concentration by geography and product type
5. THE Platform SHALL display prediction accuracy metrics: model precision, recall, and AUC for the last 90 days

### Requirement 43: Design System — Component Library and Visual Standards

**User Story:** As a developer, I want a consistent design system, so that all portals share a unified visual language and interaction model that communicates financial data clearly.

#### Acceptance Criteria

1. THE Platform SHALL use a risk-based semantic color system: success/healthy (green #16A34A), warning/SMA (amber #D97706), danger/NPA (red #DC2626), info (blue #2563EB), neutral (slate)
2. THE Platform SHALL use a typography scale based on Inter font: display (36px), heading (24px/20px/18px), body (16px/14px), caption (12px)
3. THE Platform SHALL provide reusable components: RiskBadge, ScoreGauge, DPDHeatmap, AllocationWaterfall, DecisionFlowChart, AuditLogTable, DocumentViewer, DispositionForm
4. WHEN a data table has more than 50 rows, THE Platform SHALL implement virtual scrolling to maintain rendering performance
5. THE Platform SHALL implement skeleton loading states for all data-fetching components, replacing spinners for content areas larger than 200px


---

## Section A: Stakeholder Mapping & Role Definitions

### A.1 LOS Stakeholders

| Stakeholder | Responsibilities | System Access Scope | Decision Authority | Separation of Duties |
|---|---|---|---|---|
| Loan_Officer | Manages application pipeline, assists borrowers, performs initial screening, manages CRM | Req 1–4: Pipeline, Detail View, Document Review, CRM | Initial screening, escalation, document requests | Cannot approve credit or override policy rules |
| Credit_Analyst | Analyzes bureau data, calculates financial ratios, prepares credit memos | Req 5–8: Bureau Viewer, Ratio Calculator, AI Score, Credit Memo | Recommends approve/decline; no final authority | Cannot disburse or override underwriter decisions |
| Underwriter | Final risk assessment, policy exception review, loan structuring | Req 9–12: Risk Summary, Decision Engine, Policy Override, Structuring | Final approval within delegated limits; escalates above limit | Cannot process disbursement or modify KYC results |
| Compliance_Officer | KYC/AML monitoring, fraud review, audit, regulatory reporting | Req 13–16: KYC/AML, Fraud Signals, Audit Log, Reports | Compliance holds, regulatory filing triggers | Cannot approve loans or override credit decisions |
| Ops_Team | Disbursement execution, document vault, LMS handoff, exception resolution | Req 17–20: Disbursement Queue, Document Vault, Handoff, Exceptions | Disbursement authorization, operational exceptions | Cannot approve credit or modify risk assessments |
| System_Admin | Workflow config, rule engine, user management, integration monitoring | Req 35–38: Workflow Designer, Rule Engine, User Mgmt, Integration Health | System configuration, user access management | Cannot approve loans or process disbursements |

### A.2 LMS Stakeholders

| Stakeholder | Responsibilities | System Access Scope | Decision Authority | Separation of Duties |
|---|---|---|---|---|
| Finance_Team | GL entries, bank reconciliation, provisioning, write-off, portfolio monitoring | Req 21–24, 32–34: Portfolio, EMI, Payments, GL, Reconciliation, Provisioning | Write-off approval, provisioning decisions | Cannot modify loan terms or contact borrowers |
| Collection_Agent | Delinquent account outreach, disposition recording, PTP tracking, field visits | Req 25–28: Collection Queue, Disposition, PTP Tracker, Field Collection | Promise-to-pay recording, legal action initiation | Cannot modify loan terms or process payments |
| Customer_Support | Borrower query resolution, dispute management, statement generation | Req 29–31: 360° View, Dispute Mgmt, Statement Generation | Dispute creation, statement issuance | Cannot modify financial records or approve waivers |
| Compliance_Officer | NPA classification, bureau reporting, regulatory reports, audit access | Req 15–16, 34: Audit Log, Regulatory Reports, NPA Provisioning | Regulatory filing, NPA classification review | Cannot process payments or modify loan terms |
| System_Admin | Product config, interest rate tables, NACH integration, user roles | Req 35–38: Admin Console | System configuration, rate table updates | Cannot approve loans or process disbursements |

### A.3 Cross-System Stakeholders

| Stakeholder | LOS Access | LMS Access | Notes |
|---|---|---|---|
| Compliance_Officer | Full compliance dashboard (Req 13–16) | Audit log, NPA reports (Req 15–16, 34) | Single role spanning both systems |
| System_Admin | Full admin console (Req 35–38) | Product config, NACH, user roles | Single admin console for both systems |

---

## Section B: Information Architecture & Navigation

### B.1 Role-Based Navigation Structure

Each role sees a tailored sidebar navigation. The Platform SHALL render navigation items based on the authenticated user's role.

#### Loan_Officer Sidebar
```
Dashboard (Pipeline)
├── My Applications
├── Team Pipeline
├── SLA Monitor
Applications
├── Search / Filter
├── Application Detail
Communication
├── Inbox
├── Templates
Notifications
```

#### Credit_Analyst Sidebar
```
Dashboard
├── Assigned for Analysis
├── Credit Queue
Workbench
├── Bureau Reports
├── Financial Ratios
├── AI Score Breakdown
├── Credit Memo
Reports
├── Analysis History
```

#### Underwriter Sidebar
```
Dashboard
├── Pending Decisions
├── Escalations
Workbench
├── Risk Assessment
├── Decision Engine
├── Policy Override
├── Loan Structuring
Audit
├── Override History
```

#### Compliance_Officer Sidebar
```
Dashboard
├── KYC/AML Queue
├── Fraud Alerts
├── Compliance Holds
Audit & Reports
├── Audit Log
├── Regulatory Reports
├── Disparate Impact
├── Bureau Update Queue
```

#### Ops_Team Sidebar
```
Dashboard
├── Disbursement Queue
├── Exception Queue
Operations
├── Document Vault
├── LMS Handoff Status
├── Disbursement History
```

#### Finance_Team Sidebar
```
Portfolio
├── Active Loans
├── Delinquency Heatmap
├── Vintage Analysis
Servicing
├── EMI Schedules
├── Payment Tracking
Accounting
├── GL Entries
├── Bank Reconciliation
├── Provisioning
├── Write-off Management
```

#### Collection_Agent Sidebar
```
My Queue
├── Collection Queue
├── Promise-to-Pay Tracker
├── Field Visits
Performance
├── Daily Metrics
├── Disposition History
```

#### Customer_Support Sidebar
```
Search
├── Borrower Lookup
Accounts
├── 360° View
├── Payment History
├── EMI Schedule
Service
├── Disputes
├── Statement Generation
```

#### System_Admin Sidebar
```
Configuration
├── Workflow Designer
├── Rule Engine
├── Product Config
├── Interest Rate Tables
Users & Access
├── User Management
├── Role Management
├── Permission Sets
Monitoring
├── Integration Health
├── System Logs
├── Audit Trail
```

### B.2 Feature Grouping Principles

1. WHEN a user navigates between features within the same portal, THE Platform SHALL preserve filter and search state for the current session
2. THE Platform SHALL display a breadcrumb trail for all pages deeper than 2 levels
3. THE Platform SHALL provide a global search bar accessible from all portals that searches by ARN, LAN, borrower name, PAN, and mobile number
4. WHEN a global search returns results, THE Platform SHALL group them by entity type: Applications, Loans, Borrowers

---

## Section C: Permissions & Access Control Matrix

### C.1 Feature-Level Access Matrix

| Feature | Loan_Officer | Credit_Analyst | Underwriter | Compliance_Officer | Ops_Team | Finance_Team | Collection_Agent | Customer_Support | System_Admin |
|---|---|---|---|---|---|---|---|---|---|
| Pipeline Dashboard | Read/Write | — | — | Read | — | — | — | — | Read |
| Application Detail | Read/Write | Read | Read/Write | Read | Read | — | — | — | Read |
| Document Review | Read/Write | Read | Read | Read | Read/Write | — | — | — | Read |
| CRM / Communication | Read/Write | — | — | — | — | — | — | Read/Write | — |
| Bureau Report | Read | Read/Write | Read | Read | — | — | — | — | — |
| Financial Ratios | Read | Read/Write | Read | — | — | — | — | — | — |
| AI Score Breakdown | Read | Read/Write | Read/Write | Read | — | — | — | — | — |
| Credit Memo | Read | Read/Write | Read | Read | — | — | — | — | — |
| Risk Assessment | Read | Read | Read/Write | Read | — | — | — | — | — |
| Decision Engine View | — | Read | Read/Write | Read | — | — | — | — | — |
| Policy Override | — | — | Write (within limit) | Read | — | — | — | — | — |
| Loan Structuring | — | — | Read/Write | — | — | — | — | — | — |
| KYC/AML Dashboard | Read | — | Read | Read/Write | — | — | — | — | — |
| Fraud Signals | Read | Read | Read | Read/Write | — | — | — | — | — |
| Audit Log | — | — | — | Read/Write | — | — | — | — | Read |
| Regulatory Reports | — | — | — | Read/Write | — | — | — | — | Read |
| Disbursement Queue | — | — | — | — | Read/Write | — | — | — | — |
| Document Vault | Read | Read | Read | Read | Read/Write | — | — | — | Read |
| LMS Handoff Status | — | — | — | — | Read/Write | — | — | — | Read |
| Exception Queue | — | — | — | — | Read/Write | — | — | — | Read |
| Portfolio View | — | — | — | Read | — | Read/Write | — | — | Read |
| EMI Schedule | — | — | — | — | — | Read | — | Read | — |
| Payment Tracking | — | — | — | — | — | Read/Write | — | Read | — |
| Delinquency Heatmap | — | — | — | Read | Read/Write | Read/Write | Read | — | Read |
| Collection Queue | — | — | — | — | — | — | Read/Write | — | — |
| Call Disposition | — | — | — | — | — | — | Read/Write | — | — |
| PTP Tracker | — | — | — | — | — | — | Read/Write | — | — |
| Field Collection | — | — | — | — | — | — | Read/Write | — | — |
| Borrower 360° View | Read | — | — | Read | — | Read | Read | Read/Write | — |
| Dispute Management | — | — | — | — | — | — | — | Read/Write | — |
| Statement Generation | — | — | — | — | — | — | — | Read/Write | — |
| GL Entries | — | — | — | — | — | Read/Write | — | — | — |
| Bank Reconciliation | — | — | — | — | — | Read/Write | — | — | — |
| Provisioning/Write-off | — | — | — | Read | — | Read/Write | — | — | — |
| Workflow Designer | — | — | — | — | — | — | — | — | Read/Write |
| Rule Engine | — | — | — | Read | — | — | — | — | Read/Write |
| User Management | — | — | — | — | — | — | — | — | Read/Write |
| Integration Health | — | — | — | — | — | — | — | — | Read/Write |

### C.2 Restricted Actions

1. THE Platform SHALL enforce that policy overrides require Underwriter role with active delegated authority record
2. THE Platform SHALL enforce that disbursements above ₹10,00,000 require dual authorization from two Ops_Team members
3. THE Platform SHALL enforce that write-offs require Finance_Team role with write-off approval permission explicitly granted
4. THE Platform SHALL enforce that user deactivation requires System_Admin role
5. THE Platform SHALL enforce that rule engine changes require System_Admin role and a mandatory change reason
6. WHEN a user attempts an action outside their permission set, THE Platform SHALL display an "Access Denied" message with the required role and a contact link for access requests

---

## Section D: Frontend Architecture

### D.1 Feature-Based Folder Structure

```
src/
├── app/
│   ├── router.tsx              # Role-based route definitions
│   ├── store.ts                # Zustand global store
│   └── providers.tsx           # QueryClient, Auth, Theme providers
├── features/
│   ├── loan-officer/
│   │   ├── pipeline/           # Kanban pipeline dashboard
│   │   ├── application-detail/ # Tabbed application view
│   │   ├── document-review/    # OCR side-by-side viewer
│   │   └── crm/                # Communication & CRM panel
│   ├── credit-analyst/
│   │   ├── bureau-report/      # Bureau report viewer
│   │   ├── ratio-calculator/   # DTI/FOIR/LTV calculator
│   │   ├── ai-score/           # AI score breakdown
│   │   └── credit-memo/        # Memo creation & history
│   ├── underwriter/
│   │   ├── risk-summary/       # Risk assessment summary
│   │   ├── decision-engine/    # Decision flow visualization
│   │   ├── policy-override/    # Override interface & audit
│   │   └── loan-structuring/   # Loan parameter adjustment
│   ├── compliance/
│   │   ├── kyc-aml/            # KYC/AML screening results
│   │   ├── fraud-signals/      # Fraud radar & signal list
│   │   ├── audit-log/          # Searchable audit log
│   │   └── regulatory-reports/ # Report generation & scheduling
│   ├── operations/
│   │   ├── disbursement/       # Disbursement approval queue
│   │   ├── document-vault/     # Document management
│   │   ├── lms-handoff/        # Handoff status tracker
│   │   └── exceptions/         # Exception management queue
│   ├── loan-servicing/
│   │   ├── portfolio/          # Active loan portfolio view
│   │   ├── emi-schedule/       # Amortization table
│   │   ├── payment-tracking/   # Payment history & waterfall
│   │   └── delinquency/        # DPD heatmap & roll rates
│   ├── collections/
│   │   ├── queue/              # Prioritized collection queue
│   │   ├── disposition/        # Call disposition entry
│   │   ├── ptp-tracker/        # Promise-to-pay tracker
│   │   └── field-collection/   # Field visit management
│   ├── customer-support/
│   │   ├── borrower-360/       # 360° borrower view
│   │   ├── disputes/           # Dispute management
│   │   └── statements/         # Statement generation
│   ├── finance/
│   │   ├── gl-entries/         # GL entry review
│   │   ├── reconciliation/     # Bank reconciliation
│   │   └── provisioning/       # Provisioning & write-off
│   ├── admin/
│   │   ├── workflow-designer/  # Visual workflow canvas
│   │   ├── rule-engine/        # Rule builder & testing
│   │   ├── users/              # User & role management
│   │   └── integrations/       # Integration health monitor
│   └── ai-layer/
│       ├── score-gauge/        # Reusable score gauge component
│       ├── explainability/     # XAI panel & SHAP chart
│       ├── fraud-indicators/   # Fraud signal badges & radar
│       └── delinquency-pred/   # Delinquency prediction display
├── components/
│   ├── ui/                     # Base design system components
│   │   ├── RiskBadge.tsx
│   │   ├── ScoreGauge.tsx
│   │   ├── DPDHeatmap.tsx
│   │   ├── AllocationWaterfall.tsx
│   │   ├── DecisionFlowChart.tsx
│   │   ├── AuditLogTable.tsx
│   │   ├── DocumentViewer.tsx
│   │   ├── DispositionForm.tsx
│   │   ├── SkeletonLoader.tsx
│   │   └── VirtualTable.tsx
│   ├── layout/
│   │   ├── AppShell.tsx        # Sidebar + header shell
│   │   ├── RoleSidebar.tsx     # Role-aware navigation
│   │   └── Breadcrumb.tsx
│   └── shared/
│       ├── GlobalSearch.tsx
│       ├── NotificationFeed.tsx
│       └── AIProcessingState.tsx
├── hooks/
│   ├── useAuth.ts              # Auth state & role access
│   ├── usePermissions.ts       # Feature-level permission checks
│   ├── useRealtime.ts          # WebSocket subscription hook
│   └── useAIStatus.ts          # AI processing state polling
├── lib/
│   ├── api/                    # Axios instances per domain
│   ├── queryKeys.ts            # React Query key factory
│   └── formatters.ts           # Currency, date, DPD formatters
└── types/
    ├── los.types.ts            # LOS domain types
    ├── lms.types.ts            # LMS domain types
    └── ai.types.ts             # AI/ML response types
```

### D.2 State Management Approach

1. THE Platform SHALL use **React Query (TanStack Query)** for all server state: fetching, caching, background refresh, and optimistic updates
2. THE Platform SHALL use **Zustand** for global client state: authenticated user, active role, notification feed, and UI preferences
3. THE Platform SHALL use **React Hook Form** with **Zod** validation for all form state
4. THE Platform SHALL implement React Query cache with stale times: pipeline data (30s), portfolio metrics (60s), audit logs (5min), static config (10min)
5. THE Platform SHALL use **WebSocket** connections for real-time features: pipeline notifications, AI processing status, and payment events
6. THE Platform SHALL implement optimistic updates for disposition entry and note creation, rolling back on API error

### D.3 Data Loading Strategy

1. THE Platform SHALL implement route-level code splitting using React.lazy() for each feature module
2. THE Platform SHALL prefetch the next likely route's data on hover over navigation items
3. THE Platform SHALL implement skeleton loading states for all data-fetching components
4. WHEN a data fetch fails, THE Platform SHALL display an inline error state with a retry button rather than a full-page error
5. THE Platform SHALL implement infinite scroll for audit logs, payment history, and disposition history lists

---

## Section E: Performance & UX Constraints

### E.1 Response Time Requirements

1. THE Platform SHALL render the initial dashboard view within 2 seconds on a standard broadband connection (10 Mbps)
2. THE Platform SHALL respond to filter and sort interactions within 500ms using client-side filtering for datasets under 1,000 records
3. THE Platform SHALL display skeleton loading states within 100ms of initiating any data fetch
4. WHEN generating a PDF statement, THE Platform SHALL complete generation within 10 seconds and display a progress indicator
5. THE Platform SHALL complete global search queries within 1 second for up to 100,000 loan records

### E.2 Rendering Performance Rules

1. THE Platform SHALL implement virtual scrolling (windowing) for all tables with more than 50 rows using TanStack Virtual
2. THE Platform SHALL memoize expensive chart computations (DPD heatmap, vintage analysis) using useMemo with stable dependency arrays
3. THE Platform SHALL lazy-load chart libraries (Recharts/Victory) only when the containing route is active
4. THE Platform SHALL debounce search input by 300ms before triggering API calls
5. THE Platform SHALL implement React.memo on all list item components to prevent unnecessary re-renders during queue updates

### E.3 Large Dataset Handling

1. WHEN an audit log query returns more than 500 records, THE Platform SHALL paginate results in pages of 50 with server-side pagination
2. WHEN a portfolio view contains more than 10,000 loans, THE Platform SHALL use server-side aggregation and display summary metrics rather than individual records
3. THE Platform SHALL implement cursor-based pagination for all infinite scroll lists to maintain stable performance as data grows

---

## Section F: Responsiveness & Device Strategy

### F.1 Breakpoint Strategy

THE Platform is desktop-first. The primary target viewport is 1280px and above. The Platform SHALL support the following breakpoints:
- `sm`: 640px (tablet portrait — limited support)
- `md`: 768px (tablet landscape — read-only views)
- `lg`: 1024px (laptop — full functionality)
- `xl`: 1280px (desktop — primary target)
- `2xl`: 1536px (wide desktop — expanded layouts)

### F.2 Component Behavior by Viewport

1. WHILE the viewport is below 1024px, THE Platform SHALL collapse the sidebar into a hamburger menu overlay
2. WHILE the viewport is below 768px, THE Platform SHALL display data tables in a card-stack layout instead of horizontal rows
3. WHILE the viewport is below 768px, THE Platform SHALL hide secondary chart panels and display only primary KPI metrics
4. THE Platform SHALL ensure all form inputs, buttons, and interactive elements have a minimum touch target of 44×44px
5. WHILE the viewport is at 1280px or above, THE Platform SHALL display the sidebar as a persistent 240px fixed panel

### F.3 Collection Agent App — Mobile Optimization

The Collection_Agent portal has a secondary mobile-optimized view for field agents:

1. THE Platform SHALL provide a mobile-optimized collection queue view at viewports below 768px with swipe-to-dispose gesture support
2. THE Platform SHALL support offline-capable disposition entry for Collection_Agents with sync on reconnection
3. WHEN a Collection_Agent is offline, THE Platform SHALL display an offline indicator and queue disposition entries locally

---

## Section G: AI UX Consistency Standards

### G.1 Universal AI Display Patterns

All AI-generated data across all portals SHALL follow these consistent patterns:

1. THE Platform SHALL always display AI scores with a confidence indicator (percentage or interval) adjacent to the score value
2. THE Platform SHALL always display an "AI" badge or label on any value generated by the AI_Layer to distinguish it from human-entered data
3. THE Platform SHALL always display the AI model version and last training date in a tooltip on hover over any AI-generated value
4. WHEN the AI_Layer is processing, THE Platform SHALL display a pulsing "AI Processing" indicator with an estimated wait time, never a blank state
5. WHEN an AI result is stale (older than 24 hours), THE Platform SHALL display a "Stale — refresh recommended" indicator

### G.2 Risk Grade Color Consistency

THE Platform SHALL use these exact color mappings for Risk_Grade across ALL portals:

| Risk Grade | Background | Text | Border | Meaning |
|---|---|---|---|---|
| A+ | #DCFCE7 | #15803D | #16A34A | Excellent — lowest risk |
| A | #D1FAE5 | #065F46 | #059669 | Good — low risk |
| B | #CCFBF1 | #0F766E | #0D9488 | Fair — moderate risk |
| C | #FEF3C7 | #92400E | #D97706 | Caution — elevated risk |
| D | #FEE2E2 | #991B1B | #DC2626 | High risk — requires attention |

### G.3 Fraud Score Color Consistency

THE Platform SHALL use these exact color mappings for fraud severity across ALL portals:

| Severity | Score Range | Color |
|---|---|---|
| Low | 0–30 | #16A34A (green) |
| Medium | 31–60 | #D97706 (amber) |
| High | 61–85 | #EA580C (orange) |
| Critical | 86–100 | #DC2626 (red) |

### G.4 DPD Bucket Color Consistency

THE Platform SHALL use these exact color mappings for DPD status across ALL portals:

| DPD Status | Color | Meaning |
|---|---|---|
| Current (0 DPD) | #16A34A | Performing |
| SMA-0 (1–30 DPD) | #CA8A04 | Watch |
| SMA-1 (31–60 DPD) | #EA580C | Sub-standard |
| SMA-2 (61–90 DPD) | #DC2626 | Doubtful |
| NPA (90+ DPD) | #7F1D1D | Loss |

### G.5 AI Explainability Requirements

1. THE Platform SHALL display AI explanations in plain language accessible to non-technical users (no model jargon)
2. THE Platform SHALL provide a "Why this decision?" expandable panel on every AI-generated decision or score
3. WHEN displaying SHAP-style feature importance, THE Platform SHALL label each feature with its business name (e.g., "Monthly Income" not "feature_23")
4. THE Platform SHALL display counterfactual explanations in the format: "To improve this score, [specific action] would change the outcome to [result]"

---

## Section H: Cross-Module Data Continuity

### H.1 ARN-to-LAN Continuity

1. THE Platform SHALL display the originating ARN on every LMS screen that relates to a loan originated through the LOS
2. THE Platform SHALL provide a navigation link from any LMS loan view to the originating LOS application detail view (read-only)
3. THE Platform SHALL display the LAN on the LOS disbursement record once the LMS handoff is complete

### H.2 Status Flow Consistency

The following status values SHALL be used consistently across all portals:

**Application Status (LOS):**
Lead → Submitted → Documents Pending → KYC Verification → Credit Assessment → Underwriting → Offer Generated → E-Sign Pending → Disbursement Pending → Disbursed → Rejected → Withdrawn

**Loan Account Status (LMS):**
Active → SMA-0 → SMA-1 → SMA-2 → NPA → Restructured → Closed → Written Off → Foreclosed

**Document Status:**
Pending Upload → Uploaded → OCR Processing → OCR Complete → Verified → Failed → Requires Resubmission

**KYC Status:**
Not Started → In Progress → Passed → Failed → Manual Review → Cleared

### H.3 Naming Consistency

1. THE Platform SHALL use "ARN" (not "Application ID" or "Ref No") for all LOS application references
2. THE Platform SHALL use "LAN" (not "Loan ID" or "Account No") for all LMS loan account references
3. THE Platform SHALL use "Risk Grade" (not "Credit Grade" or "Risk Rating") for the AI_Layer A+–D classification
4. THE Platform SHALL use "DPD" (not "Days Overdue" or "Days Late") for the delinquency metric
5. THE Platform SHALL use "EMI" (not "Installment" or "Monthly Payment") for scheduled repayment amounts


---

## Section I: Role Hierarchy & Escalation Paths

### I.1 LOS Role Hierarchy

```
System_Admin
    └── (system configuration authority)

Compliance_Officer
    └── (independent compliance authority — reports to Chief Risk Officer)

Underwriter (Senior)
    └── Underwriter (Junior)
            └── Credit_Analyst
                    └── Loan_Officer

Ops_Team (Supervisor)
    └── Ops_Team (Member)
```

### I.2 Approval Limits & Escalation Rules

| Role | Approval Limit | Escalation Target | Escalation Trigger |
|---|---|---|---|
| Loan_Officer | No approval authority | Credit_Analyst | Application ready for credit review |
| Credit_Analyst | Recommendation only | Underwriter | Credit memo submitted |
| Underwriter (Junior) | Up to ₹25,00,000 | Underwriter (Senior) | Loan amount exceeds limit |
| Underwriter (Senior) | Up to ₹1,00,00,000 | Credit Committee | Loan amount exceeds limit |
| Ops_Team (Member) | Disbursement up to ₹10,00,000 | Ops_Team (Supervisor) | Amount exceeds limit or dual-auth required |
| Compliance_Officer | Compliance holds | Chief Risk Officer | Sanctions match or Critical fraud score |
| Collection_Agent | PTP recording | Collection Supervisor | Legal action initiation |

### I.3 Delegated Access Rules

1. THE Platform SHALL support temporary delegated access: a senior user can grant their approval authority to a peer for a defined period (max 30 days)
2. WHEN delegated access is active, THE Platform SHALL display a "Delegated by [Name]" indicator on all actions taken under delegation
3. THE Platform SHALL log all delegated access grants and revocations in the audit trail
4. WHEN a delegated access period expires, THE Platform SHALL automatically revoke the delegation and notify both parties

---

## Section J: Advanced Access Control

### J.1 Audit Visibility Rules

| Role | Can View Own Actions | Can View Team Actions | Can View All Actions |
|---|---|---|---|
| Loan_Officer | Yes | No | No |
| Credit_Analyst | Yes | No | No |
| Underwriter | Yes | Yes (same product) | No |
| Compliance_Officer | Yes | Yes | Yes |
| Ops_Team | Yes | Yes (same team) | No |
| Finance_Team | Yes | Yes (same team) | No |
| Collection_Agent | Yes | No | No |
| Customer_Support | Yes | No | No |
| System_Admin | Yes | Yes | Yes |

### J.2 Multi-Level Approval Workflows

1. THE Platform SHALL implement a multi-level approval chain for policy overrides: Underwriter submits → Senior Underwriter approves → Compliance_Officer notified
2. THE Platform SHALL implement a dual-authorization workflow for high-value disbursements: first authorizer submits → second authorizer confirms within 30 minutes
3. WHEN the second authorizer in a dual-auth workflow does not act within 30 minutes, THE Platform SHALL send an escalation notification and extend the window by 15 minutes
4. THE Platform SHALL display the current approval chain status on any pending approval item: who has approved, who is pending, and time remaining

---

## Section K: Error Boundary & Failure Handling Strategy

### K.1 React Error Boundary Strategy

1. THE Platform SHALL implement error boundaries at three levels: application level (catches catastrophic failures), feature module level (isolates portal failures), and component level (isolates widget failures)
2. WHEN a feature module error boundary catches an error, THE Platform SHALL display the affected module's error state while keeping the rest of the portal functional
3. WHEN a component-level error boundary catches an error, THE Platform SHALL display an inline "Unable to load this section" message with a retry button
4. THE Platform SHALL log all caught errors to the application monitoring service with: component name, error message, stack trace, user ID, and current route

### K.2 API Failure Handling Patterns

1. WHEN an API call fails with a 5xx error, THE Platform SHALL automatically retry up to 3 times with exponential backoff (1s, 2s, 4s) before displaying an error state
2. WHEN an API call fails with a 4xx error (except 401/403), THE Platform SHALL display the error message from the API response without retrying
3. WHEN an API call returns a 401 Unauthorized, THE Platform SHALL silently refresh the auth token and retry the request once before redirecting to login
4. WHEN an API call returns a 403 Forbidden, THE Platform SHALL display an "Access Denied" message without retrying
5. WHEN a critical API (disbursement, policy override) fails, THE Platform SHALL display a prominent error modal with the error reference number and support contact

### K.3 Network Failure Scenarios

1. WHEN the Platform detects network disconnection, THE Platform SHALL display a persistent "You are offline" banner and disable all write operations
2. WHEN network connectivity is restored, THE Platform SHALL automatically retry any queued write operations and refresh stale data
3. WHEN a WebSocket connection drops, THE Platform SHALL attempt reconnection with exponential backoff and display a "Reconnecting..." indicator
4. THE Platform SHALL preserve unsaved form data in sessionStorage during network interruptions and restore it upon reconnection

### K.4 Partial Data Loading & Race Conditions

1. WHEN a dashboard loads and some data sources are slow, THE Platform SHALL display available data immediately and show skeleton states for pending sections independently
2. THE Platform SHALL use React Query's `staleWhileRevalidate` pattern to display cached data immediately while fetching fresh data in the background
3. WHEN real-time updates arrive for data currently being edited by a user, THE Platform SHALL display a "New data available — refresh to see updates" notification rather than overwriting the user's in-progress work
4. THE Platform SHALL use optimistic locking for concurrent edits: if two users edit the same record, the second save SHALL display a conflict resolution dialog showing both versions

### K.5 Conflicting System States

1. WHEN an application status changes in the backend while a user is viewing it, THE Platform SHALL display a "Status updated" banner with the new status without forcing a page reload
2. WHEN a disbursement is processed by one Ops_Team member while another is viewing the same record, THE Platform SHALL display a "This record has been updated by [user]" message and disable the action buttons

---

## Section L: Design System — Tokens & Component States

### L.1 Design Tokens

```typescript
// Color Tokens
const colors = {
  // Risk semantic colors
  risk: {
    excellent: { bg: '#DCFCE7', text: '#15803D', border: '#16A34A' },  // A+
    good:      { bg: '#D1FAE5', text: '#065F46', border: '#059669' },  // A
    fair:      { bg: '#CCFBF1', text: '#0F766E', border: '#0D9488' },  // B
    caution:   { bg: '#FEF3C7', text: '#92400E', border: '#D97706' },  // C
    high:      { bg: '#FEE2E2', text: '#991B1B', border: '#DC2626' },  // D
  },
  // DPD semantic colors
  dpd: {
    current:   '#16A34A',  // 0 DPD
    sma0:      '#CA8A04',  // 1–30 DPD
    sma1:      '#EA580C',  // 31–60 DPD
    sma2:      '#DC2626',  // 61–90 DPD
    npa:       '#7F1D1D',  // 90+ DPD
  },
  // Fraud severity colors
  fraud: {
    low:       '#16A34A',
    medium:    '#D97706',
    high:      '#EA580C',
    critical:  '#DC2626',
  },
  // Base palette
  primary:   '#2563EB',   // Blue — primary actions
  secondary: '#64748B',   // Slate — secondary actions
  surface:   '#F8FAFC',   // Page background
  border:    '#E2E8F0',   // Default border
}

// Spacing Tokens (4px base grid)
const spacing = {
  1: '4px', 2: '8px', 3: '12px', 4: '16px',
  5: '20px', 6: '24px', 8: '32px', 10: '40px',
  12: '48px', 16: '64px',
}

// Typography Tokens
const typography = {
  fontFamily: "'Inter', system-ui, sans-serif",
  scale: {
    display:  { size: '36px', weight: 700, lineHeight: '44px' },
    h1:       { size: '24px', weight: 700, lineHeight: '32px' },
    h2:       { size: '20px', weight: 600, lineHeight: '28px' },
    h3:       { size: '18px', weight: 600, lineHeight: '26px' },
    bodyLg:   { size: '16px', weight: 400, lineHeight: '24px' },
    body:     { size: '14px', weight: 400, lineHeight: '20px' },
    caption:  { size: '12px', weight: 400, lineHeight: '16px' },
    label:    { size: '12px', weight: 500, lineHeight: '16px' },
  },
}

// Shadow Tokens
const shadows = {
  card:   '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
  modal:  '0 20px 25px rgba(0,0,0,0.15), 0 10px 10px rgba(0,0,0,0.04)',
  focus:  '0 0 0 3px rgba(37,99,235,0.3)',
}
```

### L.2 Component States

Every interactive component in the Platform SHALL implement these states:

| State | Visual Treatment |
|---|---|
| Default | Standard styling per design tokens |
| Hover | 5% darker background, cursor: pointer |
| Focus | 3px blue focus ring (shadows.focus token) |
| Active/Pressed | 10% darker background |
| Loading | Skeleton pulse animation replacing content |
| Empty | Centered empty state illustration + descriptive message + primary action |
| Error | Red border + error icon + error message below field |
| Disabled | 40% opacity, cursor: not-allowed, no hover effects |
| Success | Green checkmark + success message (auto-dismiss after 3s) |

### L.3 Accessibility (a11y) Requirements

1. THE Platform SHALL achieve WCAG 2.1 AA color contrast ratios: minimum 4.5:1 for body text, 3:1 for large text and UI components
2. THE Platform SHALL implement full keyboard navigation: all interactive elements reachable via Tab, actions triggerable via Enter/Space
3. THE Platform SHALL implement ARIA roles for all custom components: `role="table"` for data grids, `role="dialog"` for modals, `role="alert"` for error messages, `role="status"` for loading states
4. THE Platform SHALL provide `aria-label` or `aria-labelledby` for all icon-only buttons
5. THE Platform SHALL implement focus trap in modal dialogs: Tab cycles only within the open modal
6. THE Platform SHALL announce dynamic content changes (new notifications, status updates) via `aria-live="polite"` regions
7. THE Platform SHALL not rely solely on color to convey information: risk grades SHALL include text labels, fraud signals SHALL include icons alongside color

---

## Section M: Data Handling & UX Precision

### M.1 Pagination vs Infinite Scroll Decisions

| Data Type | Strategy | Rationale |
|---|---|---|
| Application pipeline | Paginated (25/page) | Users need to navigate to specific pages |
| Audit log | Paginated (50/page) + server-side | Immutable, needs stable page references |
| Payment history | Infinite scroll | Chronological browsing, no need for page jumps |
| Disposition history | Infinite scroll | Chronological browsing |
| Collection queue | Paginated (20/page) | Agents work through queue systematically |
| Portfolio loan list | Paginated (50/page) + server-side | Large dataset, needs filtering |
| GL entries | Paginated (50/page) | Finance team needs stable references |
| Notifications | Infinite scroll | Chronological, read-as-you-go |

### M.2 Sorting & Filtering UX Rules

1. THE Platform SHALL persist active filters in the URL query string so that filtered views can be bookmarked and shared
2. THE Platform SHALL display active filter chips below the filter bar showing each active filter with a remove (×) button
3. WHEN all filters are cleared, THE Platform SHALL return to the default unfiltered view
4. THE Platform SHALL support multi-column sorting in data tables: primary sort column shown with a filled arrow, secondary sort with an outline arrow
5. THE Platform SHALL display the total record count and filtered record count when filters are active (e.g., "Showing 47 of 1,243 applications")

### M.3 Bulk Actions

1. THE Platform SHALL support bulk selection in collection queues and disbursement queues via checkbox column
2. WHEN items are bulk-selected, THE Platform SHALL display a bulk action toolbar with available actions for the selected items
3. THE Platform SHALL display a confirmation dialog for all bulk destructive actions showing the count of affected records
4. WHEN a bulk action partially fails, THE Platform SHALL display a results summary: X succeeded, Y failed, with the failed items listed

### M.4 Data Refresh Strategies

1. THE Platform SHALL auto-refresh the pipeline dashboard every 30 seconds using React Query's `refetchInterval`
2. THE Platform SHALL auto-refresh the collection queue every 60 seconds
3. THE Platform SHALL provide a manual refresh button on all dashboard views that triggers an immediate refetch
4. WHEN a user returns to a tab after more than 5 minutes of inactivity, THE Platform SHALL automatically refetch stale data using React Query's `refetchOnWindowFocus`

---

## Section N: Performance Optimization Standards

### N.1 Bundle Size Optimization

1. THE Platform SHALL implement route-based code splitting: each feature module (loan-officer, credit-analyst, etc.) SHALL be a separate lazy-loaded chunk
2. THE Platform SHALL use dynamic imports for heavy libraries: chart libraries, PDF generators, and the workflow designer canvas
3. THE Platform SHALL target a First Contentful Paint (FCP) under 1.5 seconds and a Time to Interactive (TTI) under 3 seconds on a 4G connection
4. THE Platform SHALL implement tree-shaking for all utility libraries and import only used components from UI libraries

### N.2 API Batching & Throttling

1. THE Platform SHALL batch multiple simultaneous API calls for the same dashboard using React Query's parallel queries
2. THE Platform SHALL throttle real-time WebSocket message processing to a maximum of 10 updates per second to prevent UI thrashing
3. THE Platform SHALL implement request deduplication: if the same query is triggered multiple times simultaneously, only one API call SHALL be made
4. THE Platform SHALL use HTTP/2 multiplexing for all API calls to reduce connection overhead

### N.3 Memoization Guidelines

1. THE Platform SHALL memoize all chart data transformations using `useMemo` with explicit dependency arrays
2. THE Platform SHALL memoize all list item components using `React.memo` with custom equality functions for complex objects
3. THE Platform SHALL use `useCallback` for all event handlers passed as props to child components
4. THE Platform SHALL avoid anonymous function creation in JSX render paths for components that render more than 20 items

### N.4 Form Validation UX Patterns

1. THE Platform SHALL validate form fields on blur (when the user leaves a field) rather than on every keystroke
2. THE Platform SHALL display inline validation errors below the relevant field, not in a summary at the top
3. WHEN a form is submitted with validation errors, THE Platform SHALL scroll to and focus the first invalid field
4. THE Platform SHALL disable the submit button while a form submission is in progress and display a loading spinner within the button
5. WHEN a form submission succeeds, THE Platform SHALL display a success toast notification and either close the form or reset it based on the workflow context

