# Implementation Plan: LOS-LMS Platform UI

## Overview

Incremental implementation of the role-based internal lending platform. Each task builds on the previous, starting with the design system foundation, then the app shell and routing, then each portal module, and finally cross-cutting AI components and integration wiring.

Stack: React 18 + TypeScript + Tailwind CSS + React Query + Zustand + React Hook Form + Zod + fast-check

---

## Tasks

- [x] 0. Project Scaffolding — Create React + TypeScript + Tailwind CSS Project
  - Run `npm create vite@latest los-lms-platform -- --template react-ts` in the workspace root to scaffold the project into a `los-lms-platform/` directory
  - Install core dependencies: `npm install react-router-dom @tanstack/react-query zustand react-hook-form zod axios recharts @tanstack/react-virtual`
  - Install dev dependencies: `npm install -D tailwindcss postcss autoprefixer @types/node vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event fast-check jsdom`
  - Run `npx tailwindcss init -p` to generate `tailwind.config.ts` and `postcss.config.js`
  - Update `tailwind.config.ts` content array to include `./index.html` and `./src/**/*.{ts,tsx}`
  - Replace `src/index.css` with Tailwind directives: `@tailwind base; @tailwind components; @tailwind utilities;`
  - Update `vite.config.ts` to add path alias: `@` → `src/` using `resolve.alias`
  - Update `tsconfig.json` to add `"baseUrl": "."` and `"paths": { "@/*": ["src/*"] }`
  - Configure Vitest in `vite.config.ts`: `test: { environment: 'jsdom', globals: true, setupFiles: ['src/test/setup.ts'] }`
  - Create `src/test/setup.ts` importing `@testing-library/jest-dom`
  - Create the base folder structure under `src/`: `app/`, `components/ui/`, `components/layout/`, `components/shared/`, `features/`, `hooks/`, `lib/`, `types/`
  - Delete Vite boilerplate: `src/App.css`, `src/assets/react.svg`, replace `src/App.tsx` with a minimal `<div>LOS-LMS Platform</div>` placeholder
  - Verify the project runs: `npm run dev` should start without errors; `npm run test -- --run` should pass with 0 tests (empty suite)
  - _Requirements: All (project foundation)_

- [x] 1. Design System Foundation
  - Create `src/lib/tokens.ts` with all design tokens: risk colors (A+→D), DPD colors, fraud severity colors, spacing scale, typography scale, shadow tokens
  - Create `tailwind.config.ts` extending Tailwind with all custom color tokens from `tokens.ts`
  - Create `src/components/ui/RiskBadge.tsx` — color-coded pill for risk grades A+/A/B/C/D using token map
  - Create `src/components/ui/SkeletonLoader.tsx` — pulse animation skeleton for cards, rows, and gauges
  - Create `src/components/ui/VirtualTable.tsx` — TanStack Virtual wrapper for tables > 50 rows
  - _Requirements: 43.1, 43.2, 43.3, 43.4, 43.5_

  - [x]* 1.1 Write property test for RiskBadge color mapping
    - **Property 2: Risk Grade Color Token Mapping**
    - **Validates: Requirements 1.7, 9.2, 39.1**

  - [x]* 1.2 Write property test for VirtualTable row count bound
    - **Property 15: Virtual Scrolling Row Count Bound**
    - **Validates: Requirements 43.4**

  - [x]* 1.3 Write property test for SkeletonLoader state exclusivity
    - **Property 16: Skeleton Loading State Exclusivity**
    - **Validates: Requirements 43.5**

- [x] 1.5 Shared Utility Components (prerequisite for all portals)
  - Create `src/components/ui/StatusBadge.tsx` — maps any canonical status string (ApplicationStatus, LoanAccountStatus, DocumentStatus, KYCStatus) to color + label
  - Create `src/components/ui/CurrencyDisplay.tsx` — Indian number formatting (₹ with lakh/crore notation), colorize option for negative/positive
  - Create `src/components/ui/DateDisplay.tsx` — DD-MMM-YYYY and DD-MMM-YYYY HH:MM formats
  - Create `src/components/ui/ConfirmationModal.tsx` — reusable confirmation dialog for destructive actions (danger/primary variants)
  - Create `src/components/ui/PageHeader.tsx` — consistent page header with title, subtitle, breadcrumbs, and action slot
  - Create `src/components/ui/FilterChips.tsx` — active filter chips with remove buttons and clear-all
  - Create `src/components/ui/EmptyState.tsx` — consistent empty state with icon, title, description, and optional action
  - Create `src/components/ui/InlineError.tsx` — inline error state with optional retry button
  - Create `src/lib/formatters.ts` — currency formatter (Indian notation), date formatter (DD-MMM-YYYY), DPD formatter, percentage formatter (2 decimal places)
  - Create `src/lib/queryKeys.ts` — React Query key factory for all query keys
  - Create `src/lib/api/` — Axios instances: `losApi.ts` (LOS base URL), `lmsApi.ts` (LMS base URL), `aiApi.ts` (AI service base URL) with JWT interceptors
  - _Requirements: 43.1, 43.2, H.3, E.1_

- [x] 2. App Shell, Auth, and Role-Based Routing
  - Create `src/types/auth.types.ts` — UserRole, Permission, AuthenticatedUser, DelegatedAuthority interfaces
  - Create `src/app/store.ts` — Zustand store with: authUser, activeRole, notificationFeed, uiPreferences slices
  - Create `src/hooks/useAuth.ts` and `src/hooks/usePermissions.ts` — role check and feature permission hooks
  - Create `src/components/layout/AppShell.tsx` — sidebar + header + outlet shell
  - Create `src/components/layout/RoleSidebar.tsx` — renders navigation items filtered by user role
  - Create `src/app/router.tsx` — all role-based routes with React.lazy() and RoleGuard wrapper
  - Create `src/components/layout/Breadcrumb.tsx` — breadcrumb trail for routes > 2 levels deep
  - Create `src/components/shared/GlobalSearch.tsx` — searches by ARN, LAN, PAN, mobile; groups results by entity type
  - _Requirements: B.1, C.1, C.2, D.2_

- [x] 3. Checkpoint — Ensure app shell renders correctly for each role
  - Ensure all tests pass, ask the user if questions arise.

  - [x]* 3.1 Write role-based access unit tests for RoleGuard
    - Test that each route renders correctly for authorized roles and redirects to 403 for unauthorized roles
    - Cover all 9 roles × all 9 portal routes
    - _Requirements: C.1, C.2_

  - [x]* 3.2 Write unit tests for usePermissions hook
    - Test that feature-level permission checks return correct Read/Write/None for each role × feature combination
    - _Requirements: C.1_

- [x] 4. Shared AI Layer Components
  - Create `src/components/ui/ScoreGauge.tsx` — SVG arc gauge with color zones, confidence interval shading, AI badge, model version tooltip
  - Create `src/components/shared/AIProcessingState.tsx` — pulsing animation with stage label and estimated time
  - Create `src/features/ai-layer/explainability/XAIPanel.tsx` — natural language summary, SHAP waterfall chart, counterfactuals, adverse action codes, PDF export
  - Create `src/features/ai-layer/fraud-indicators/FraudRadar.tsx` — 5-axis radar chart (identity/document/application/synthetic/velocity) + signal badge list
  - Create `src/features/ai-layer/delinquency-pred/DelinquencyScore.tsx` — prediction score display with top 3 factors
  - _Requirements: 39.1, 39.2, 39.3, 39.4, 40.1, 40.2, 41.1, 41.2, 42.1, 42.2_

  - [-]* 4.1 Write property test for ScoreGauge rendering completeness
    - **Property 3: AI Assessment Rendering Completeness**
    - **Validates: Requirements 2.2, 7.1**

- [x] 5. Loan Officer Portal — Pipeline Dashboard
  - Create `src/features/loan-officer/pipeline/PipelineDashboard.tsx` — Kanban board with stage columns
  - Create `src/features/loan-officer/pipeline/ApplicationCard.tsx` — card with ARN, borrower name, risk grade badge, SLA indicator, fraud score
  - Create `src/features/loan-officer/pipeline/PipelineFilters.tsx` — filter bar (loan type, risk grade, date range, channel) with URL-persisted state
  - Create `src/features/loan-officer/pipeline/PipelineMetrics.tsx` — aggregate metrics: total active, avg TAT, SLA breach count, conversion rate
  - Implement real-time notification via WebSocket: new assignment triggers notification without page refresh
  - _Requirements: 1.1, 1.2, 1.3, 1.5, 1.6, 1.7, 1.8_

  - [-]* 5.1 Write property test for pipeline stage grouping
    - **Property 1: Application Stage Grouping Correctness**
    - **Validates: Requirements 1.1**

- [x] 6. Loan Officer Portal — Application Detail View
  - Create `src/features/loan-officer/application-detail/ApplicationDetailPage.tsx` — tabbed layout: Overview, Documents, KYC Status, Credit, Communication, Activity Log
  - Create `src/features/loan-officer/application-detail/OverviewTab.tsx` — borrower summary, AI risk grade, fraud alert banner, contextual action buttons
  - Create `src/features/loan-officer/application-detail/ActivityLog.tsx` — immutable chronological timeline with note creation
  - Create `src/features/loan-officer/application-detail/KYCStatusTab.tsx` — KYC check results with pass/fail badges
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [x] 7. Loan Officer Portal — Document Review Interface
  - Create `src/components/ui/DocumentViewer.tsx` — split-pane: document image (PDF.js) left, OCR field table right
  - Create `src/features/loan-officer/document-review/OCRFieldTable.tsx` — field rows with confidence scores, amber highlight for < 80%, override input with reason
  - Create `src/features/loan-officer/document-review/TamperingAlert.tsx` — red alert banner with specific tampering indicators
  - Implement document comparison mode: side-by-side two versions of same document type
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 7.1 Write property test for OCR confidence threshold styling
    - **Property 4: OCR Confidence Threshold Styling**
    - **Validates: Requirements 3.2, 3.3**

- [x] 8. Loan Officer Portal — CRM & Communication Panel
  - Create `src/features/loan-officer/crm/CommunicationPanel.tsx` — SMS/email composition, call log entry, communication history timeline
  - Create `src/features/loan-officer/crm/MessageTemplates.tsx` — pre-built templates with auto-population of borrower name, ARN, loan details
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [x] 9. Checkpoint — Ensure all Loan Officer portal tests pass
  - Ensure all tests pass, ask the user if questions arise.

  - [ ]* 9.1 Write integration test for Loan Officer application lifecycle flow
    - Test: login as Loan_Officer → view pipeline → open application → verify documents → add note → approve for credit review
    - Verify audit log entry is created at each step
    - _Requirements: 1.1, 2.5, 2.6, 3.7_

  - [ ]* 9.2 Write unit tests for SLA breach indicator
    - Test that applications past their slaDeadline render with urgency indicator
    - Test that applications within SLA render without urgency indicator
    - _Requirements: 1.3_


- [x] 10. Credit Analyst Workbench — Bureau Report & Ratios
  - Create `src/features/credit-analyst/bureau-report/BureauReportViewer.tsx` — structured layout: score, score band, tradelines, inquiry history, derogatory marks
  - Create `src/features/credit-analyst/bureau-report/CreditScoreTrend.tsx` — 24-month line chart using Recharts
  - Create `src/features/credit-analyst/bureau-report/BureauComparison.tsx` — tabbed CIBIL vs Experian comparison view
  - Create `src/features/credit-analyst/ratio-calculator/RatioCalculator.tsx` — auto-computed DTI/FOIR/LTV with formula display, manual input override, real-time recalculation
  - Create `src/features/credit-analyst/ratio-calculator/RatioComparisonTable.tsx` — applicant ratios vs policy thresholds vs peer benchmarks
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ]* 10.1 Write property test for financial ratio calculation invariant
    - **Property 5: Financial Ratio Calculation Invariant**
    - **Validates: Requirements 6.1**

  - [ ]* 10.2 Write unit test for ratio threshold red highlight
    - Test that ratios exceeding configured thresholds render with red highlight class
    - _Requirements: 6.2_

- [x] 11. Credit Analyst Workbench — AI Score Breakdown & Credit Memo
  - Create `src/features/credit-analyst/ai-score/AIScoreBreakdown.tsx` — composite gauge + three-tier breakdown (Tier 1/2/3) with weights and individual scores
  - Create `src/features/credit-analyst/ai-score/SHAPWaterfallChart.tsx` — horizontal bar chart: top 5 positive (green) and top 5 negative (red) factors
  - Create `src/features/credit-analyst/credit-memo/CreditMemoForm.tsx` — pre-populated template, recommendation field, document attachment, version history
  - Implement credit memo submission: routes to assigned Underwriter, updates application stage, creates audit log entry
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 11.1 Write property test for AI score tier weight invariant
    - **Property 6: AI Score Tier Weight Invariant**
    - **Validates: Requirements 7.2**

- [x] 12. Underwriter Workbench — Risk Summary & Decision Engine
  - Create `src/features/underwriter/risk-summary/RiskAssessmentSummary.tsx` — summary card: AI grade, composite score, DTI/FOIR/LTV, fraud score, KYC status; risk warning panel for C/D grades
  - Create `src/features/underwriter/decision-engine/DecisionFlowChart.tsx` — SVG flow diagram: Hard Filters → Policy Rules → Score Evaluation → Decision with pass/fail nodes
  - Create `src/features/underwriter/decision-engine/RuleResultNode.tsx` — individual rule node with pass/fail indicator, rule name, evaluated value, threshold
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [-]* 12.1 Write property test for Decision Engine flow rendering
    - Test that for any DecisionEngineResult, all hard filters and policy rules are rendered with correct pass/fail status
    - **Property (combined from P2 analysis): Decision Engine node pass/fail mapping**
    - **Validates: Requirements 10.1, 10.2**

- [x] 13. Underwriter Workbench — Policy Override & Loan Structuring
  - Create `src/features/underwriter/policy-override/PolicyOverridePanel.tsx` — failed rules list, override form with justification (min 50 chars), category selection, authority limit check
  - Create `src/features/underwriter/policy-override/OverrideHistory.tsx` — immutable override history table
  - Create `src/features/underwriter/loan-structuring/LoanStructuringPanel.tsx` — parameter sliders (amount/tenure/rate/fee), real-time EMI recalculation, policy bound enforcement
  - Create `src/features/underwriter/loan-structuring/OfferVariantComparison.tsx` — side-by-side offer variants with EMI, total interest, APR
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 12.1, 12.2, 12.3, 12.4, 12.5_

  - [x]* 13.1 Write property test for policy override justification validation
    - **Property 7: Policy Override Justification Length Validation**
    - **Validates: Requirements 11.2**

  - [x]* 13.2 Write property test for EMI calculation formula
    - **Property 8: EMI Calculation Formula Correctness**
    - **Validates: Requirements 12.2**

- [x] 14. Checkpoint — Ensure all Credit Analyst and Underwriter portal tests pass
  - Ensure all tests pass, ask the user if questions arise.

  - [ ]* 14.1 Write integration test for underwriting decision flow
    - Test: login as Underwriter → view risk summary → view decision engine output → submit policy override with justification → verify audit log entry
    - _Requirements: 10.1, 11.2, 11.4_

  - [ ]* 14.2 Write unit tests for authority limit enforcement
    - Test that overrides within delegated limit are accepted
    - Test that overrides exceeding delegated limit trigger escalation modal
    - _Requirements: 11.3_

- [x] 15. Risk & Compliance Dashboard
  - Create `src/features/compliance/kyc-aml/KYCAMLDashboard.tsx` — KYC check results (Aadhaar OTP, DigiLocker, liveness, face match) + AML results (PEP, sanctions, adverse media) with audit trail
  - Create `src/features/compliance/kyc-aml/ComplianceHoldModal.tsx` — PEP/sanctions match alert requiring Compliance_Officer action with justification
  - Create `src/features/compliance/fraud-signals/FraudSignalPanel.tsx` — aggregate score badge + FraudRadar chart + signal list + device intelligence + false positive marking
  - Create `src/features/compliance/audit-log/AuditLogPage.tsx` — searchable AuditLogTable with filters (user, date range, action type, entity ID), CSV/PDF export
  - Create `src/features/compliance/regulatory-reports/ReportGenerator.tsx` — report type selection, progress indicator, scheduling, last-generated metadata, retry on failure
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 14.1, 14.2, 14.3, 14.4, 14.5, 15.1, 15.2, 15.3, 15.4, 15.5, 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 16. Operations Portal
  - Create `src/features/operations/disbursement/DisbursementQueue.tsx` — queue table with pre-disbursement checklist, dual-auth enforcement, UTR display on success
  - Create `src/features/operations/document-vault/DocumentVault.tsx` — categorized document list with search, access logging, metadata display, bulk ZIP download
  - Create `src/features/operations/lms-handoff/HandoffStatusTracker.tsx` — status tracker (Pending/In Progress/Completed/Failed), failure detail, LAN display, manual retry with payload editor
  - Create `src/features/operations/exceptions/ExceptionQueue.tsx` — categorized exception list with age, owner, priority, SLA indicator, resolution form
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 18.1, 18.2, 18.3, 18.4, 18.5, 19.1, 19.2, 19.3, 19.4, 19.5, 20.1, 20.2, 20.3, 20.4, 20.5_

- [x] 17. Checkpoint — Ensure all Compliance and Operations portal tests pass
  - Ensure all tests pass, ask the user if questions arise.

  - [ ]* 17.1 Write unit tests for PEP/sanctions match alert blocking
    - Test that a PEP match renders the ComplianceHoldModal and disables application progression
    - Test that clearing the hold with justification updates application status
    - _Requirements: 13.3, 13.5_

  - [ ]* 17.2 Write unit tests for dual-authorization disbursement enforcement
    - Test that disbursements above threshold require two distinct authorizer IDs
    - Test that a single user cannot authorize both steps
    - _Requirements: 17.3_

- [x] 18. Loan Servicing Dashboard — Portfolio & EMI
  - Create `src/features/loan-servicing/portfolio/PortfolioDashboard.tsx` — summary metrics, delinquency distribution chart, vintage analysis chart, concentration metrics
  - Create `src/features/loan-servicing/portfolio/DelinquencyDistributionChart.tsx` — stacked bar chart by DPD bucket using DPD color tokens
  - Create `src/features/loan-servicing/emi-schedule/EMIScheduleTable.tsx` — full amortization table with status color coding, prepayment revision display, summary totals, PDF/CSV export
  - _Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 22.1, 22.2, 22.3, 22.4, 22.5_

  - [ ]* 18.1 Write property test for EMI status color mapping
    - **Property 9: EMI Status Color Mapping**
    - **Validates: Requirements 22.2**

- [x] 19. Loan Servicing Dashboard — Payments & Delinquency
  - Create `src/features/loan-servicing/payment-tracking/PaymentTimeline.tsx` — chronological payment events with allocation breakdown per payment
  - Create `src/components/ui/AllocationWaterfall.tsx` — stacked horizontal bar for fees/penalties/interest/principal allocation
  - Create `src/features/loan-servicing/payment-tracking/NACHStatus.tsx` — mandate status display with last debit result and bounce details
  - Create `src/features/loan-servicing/delinquency/DPDHeatmap.tsx` — DPDHeatmap component with normalized intensity, click-to-drill-down
  - Create `src/features/loan-servicing/delinquency/RollRateAnalysis.tsx` — bucket migration percentages current vs prior month
  - _Requirements: 23.1, 23.2, 23.3, 23.4, 23.5, 24.1, 24.2, 24.3, 24.4, 24.5_

  - [ ]* 19.1 Write property test for payment allocation priority invariant
    - **Property 10: Payment Allocation Priority Invariant**
    - **Validates: Requirements 23.2**

  - [ ]* 19.2 Write property test for payment allocation sum invariant
    - **Property 11: Payment Allocation Sum Invariant**
    - **Validates: Requirements 23.2**

  - [ ]* 19.3 Write property test for DPD heatmap intensity normalization
    - **Property 12: DPD Heatmap Intensity Normalization**
    - **Validates: Requirements 24.1**

- [x] 20. Checkpoint — Ensure all Loan Servicing portal tests pass
  - Ensure all tests pass, ask the user if questions arise.

  - [x]* 20.1 Write unit tests for NPA classification alert
    - Test that an account crossing 90 DPD renders the NPA alert and triggers provisioning workflow
    - _Requirements: 24.3_

  - [x]* 20.2 Write unit tests for prepayment schedule revision
    - Test that after a prepayment event, the amortization table shows the revised schedule with updated outstanding balance
    - _Requirements: 22.3_

- [x] 21. Collections Agent App
  - Create `src/features/collections/queue/CollectionQueue.tsx` — priority-sorted queue with composite score, DPD, overdue amount, last contact, last disposition; daily performance metrics
  - Create `src/features/collections/queue/CollectionQueueFilters.tsx` — filter by DPD bucket, territory, product, amount range
  - Create `src/features/collections/disposition/DispositionForm.tsx` — standardized outcome codes, PTP fields (amount/date/mode), auto-save, disposition history
  - Create `src/features/collections/ptp-tracker/PTPTracker.tsx` — active promises list with due-date highlighting, fulfillment rate metric, reschedule with reason
  - Create `src/features/collections/field-collection/FieldVisitQueue.tsx` — visit queue with map view, visit outcome recording, collection receipt generation
  - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5, 26.1, 26.2, 26.3, 26.4, 26.5, 27.1, 27.2, 27.3, 27.4, 27.5, 28.1, 28.2, 28.3, 28.4, 28.5_

  - [x]* 21.1 Write property test for collection queue sort invariant
    - **Property 13: Collection Queue Sort Invariant**
    - **Validates: Requirements 25.1**

  - [x]* 21.2 Write property test for PTP validation completeness
    - **Property 14: Promise-to-Pay Validation Completeness**
    - **Validates: Requirements 26.2**

- [x] 22. Customer Support Portal
  - Create `src/features/customer-support/borrower-360/Borrower360Page.tsx` — unified profile: all loans, outstanding, DPD status, contact history; search by mobile/PAN/LAN within 1s
  - Create `src/features/customer-support/disputes/DisputeManagement.tsx` — dispute creation form (type/description/document upload), dispute list with SLA indicator, resolution recording
  - Create `src/features/customer-support/statements/StatementGenerator.tsx` — statement type selection, PDF generation with progress indicator, email delivery, generation log
  - _Requirements: 29.1, 29.2, 29.3, 29.4, 29.5, 30.1, 30.2, 30.3, 30.4, 30.5, 31.1, 31.2, 31.3, 31.4_

- [x] 23. Finance & Accounting Dashboard
  - Create `src/features/finance/gl-entries/GLEntryReview.tsx` — double-entry GL table with event type, failed entry handling with manual posting option, daily summary
  - Create `src/features/finance/reconciliation/BankReconciliation.tsx` — split workspace: bank entries left, LMS payments right, auto-match by UTR, unmatched queue, reconciliation summary
  - Create `src/features/finance/provisioning/ProvisioningDashboard.tsx` — provisioning matrix display, ECL calculation per NPA account, write-off workflow with approval, NPA provisioning report
  - _Requirements: 32.1, 32.2, 32.3, 32.4, 32.5, 33.1, 33.2, 33.3, 33.4, 33.5, 34.1, 34.2, 34.3, 34.4, 34.5_

- [x] 24. Checkpoint — Ensure all Collections, Customer Support, and Finance portal tests pass
  - Ensure all tests pass, ask the user if questions arise.

  - [x]* 24.1 Write integration test for broken promise escalation
    - Test: create PTP → advance date past promised date without payment → verify account is flagged as broken promise and priority is escalated in queue
    - _Requirements: 26.4_

  - [x]* 24.2 Write unit tests for dispute SLA breach escalation
    - Test that a dispute past its slaDeadline renders the overdue indicator and triggers supervisor notification
    - _Requirements: 30.4_

  - [ ]* 24.3 Write unit tests for bank reconciliation auto-match
    - Test that bank entries with matching UTR reference are auto-matched to LMS payment records
    - Test that entries without matching UTR appear in the unmatched queue
    - _Requirements: 33.2, 33.3_

- [x] 25. System Admin Console
  - Create `src/features/admin/workflow-designer/WorkflowCanvas.tsx` — drag-and-drop workflow canvas with stages, transitions, condition rule builder, version management, publish workflow
  - Create `src/features/admin/rule-engine/RuleBuilder.tsx` — rule creation (attribute/operator/value/action), rule set grouping (Hard Filters/Policy Rules/Score Thresholds), rule testing against sample application, champion-challenger config
  - Create `src/features/admin/users/UserManagement.tsx` — user list, create user form (name/email/role/manager), custom permission sets, deactivation with session revocation
  - Create `src/features/admin/integrations/IntegrationHealth.tsx` — integration status cards (Healthy/Degraded/Down), response time charts, error rate, manual test trigger
  - _Requirements: 35.1, 35.2, 35.3, 35.4, 35.5, 36.1, 36.2, 36.3, 36.4, 36.5, 37.1, 37.2, 37.3, 37.4, 37.5, 38.1, 38.2, 38.3, 38.4, 38.5_

- [x] 26. Notification System & Real-Time Wiring
  - Create `src/hooks/useRealtime.ts` — WebSocket subscription hook with exponential backoff reconnection
  - Create `src/components/shared/NotificationFeed.tsx` — slide-over panel with notification list, unread count badge, mark-as-read
  - Wire real-time events: new application assignment (Loan_Officer), AI processing complete (Credit_Analyst/Underwriter), disbursement status change (Ops_Team), broken PTP (Collection_Agent), SLA breach (all roles)
  - Implement offline detection: "You are offline" banner, disable write operations, queue and replay on reconnect
  - _Requirements: 1.8, K.3, K.4_

- [x] 27. Cross-Portal Navigation & ARN-LAN Continuity
  - Implement ARN→LAN navigation link: from any LMS loan view, provide a read-only link to the originating LOS application detail
  - Implement LAN display on LOS disbursement record after successful handoff
  - Implement global search result routing: ARN results navigate to Application Detail, LAN results navigate to Loan Account view
  - Ensure all status values use the canonical status strings defined in Section H.2 of requirements
  - _Requirements: H.1, H.2, H.3_

- [x] 28. Error Boundaries & API Error Handling
  - Create `src/components/layout/AppErrorBoundary.tsx` — application-level error boundary with full-page error state
  - Create `src/components/layout/FeatureErrorBoundary.tsx` — module-level error boundary with module error state and retry
  - Create `src/components/layout/ComponentErrorBoundary.tsx` — component-level error boundary with inline error and retry
  - Implement React Query global error handler: 401 → token refresh → retry; 5xx → exponential backoff (1s/2s/4s); 403 → Access Denied state
  - Implement critical action error modal for disbursement, policy override, and write-off failures
  - _Requirements: K.1, K.2, K.3_

- [x] 29. Checkpoint — Final integration check
  - Ensure all tests pass, ask the user if questions arise.

  - [ ]* 29.1 Write integration test for ARN-to-LAN navigation
    - Test: from LMS loan account view, click "View Original Application" link → verify navigation to LOS application detail (read-only) with correct ARN
    - _Requirements: H.1_

  - [ ]* 29.2 Write unit tests for offline queue and replay
    - Test: simulate network disconnection → submit disposition → verify entry is queued locally → restore network → verify entry is replayed and synced
    - _Requirements: K.3, K.4_

  - [ ]* 29.3 Write unit tests for API retry with exponential backoff
    - Test: mock 5xx response → verify 3 retry attempts with 1s/2s/4s delays → verify error state displayed after all retries exhausted
    - _Requirements: K.2_

- [x] 30. Accessibility & Performance Hardening
  - Audit all custom components for ARIA roles: `role="table"` on data grids, `role="dialog"` on modals, `role="alert"` on error messages, `role="status"` on loading states
  - Add `aria-label` to all icon-only buttons across all portals
  - Implement focus trap in all modal dialogs
  - Add `aria-live="polite"` regions for notification feed and status update banners
  - Implement `React.memo` on all list item components (ApplicationCard, EMIRow, CollectionQueueItem, AuditLogRow)
  - Implement `useMemo` for DPD heatmap intensity normalization, vintage analysis chart data, and collection queue priority sorting
  - Implement `useCallback` for all event handlers passed as props to list item components
  - Implement route-level code splitting: verify each feature module is a separate lazy-loaded chunk in the production build
  - Implement `debounce(300ms)` on all search inputs (GlobalSearch, AuditLog search, BorrowerLookup)
  - _Requirements: L.3, N.3, N.1, N.2_

  - [ ]* 30.1 Write unit tests for keyboard navigation in modal dialogs
    - Test focus trap: Tab cycles within open modal, Escape closes modal
    - _Requirements: L.3_

  - [x] 30.2 Write unit tests for AI stale data indicator
    - Test that AI scores older than 24 hours render with the amber "Stale" badge
    - Test that scores within 24 hours render without the stale badge
    - _Requirements: G.1 (req 5)_

  - [ ]* 30.3 Write unit tests for AI processing state transitions
    - Test: isComplete=false → pulsing animation rendered; isComplete=true → checkmark rendered; hasError=true → error icon rendered
    - _Requirements: 39.4_

- [x] 31. Final Checkpoint — All tests pass, all portals wired
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at each portal boundary
- Property tests use fast-check with minimum 100 iterations per property
- Unit tests cover specific examples, edge cases, and error conditions
- All monetary values must use Indian number formatting (₹ with lakh/crore notation)
- All dates must use DD-MMM-YYYY format throughout the platform
