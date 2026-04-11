# Design Document: LOS-LMS Platform UI

## Overview

The LOS-LMS Platform UI is a production-ready, role-based internal web application built with React 18 + TypeScript + Tailwind CSS. It serves 9 distinct internal stakeholder roles across the complete 20-stage lending lifecycle, integrating AI/ML signals visibly throughout every workflow.

The platform is a single-page application (SPA) with role-based routing, a persistent sidebar shell, and feature-module architecture. Each portal is a self-contained feature module that lazy-loads on demand. The AI Intelligence Layer is a cross-cutting concern implemented as shared components consumed by all portals.

### Key Design Principles

1. **AI Visibility First** — Every AI-generated value is labeled, explained, and accompanied by a confidence indicator. No black-box outputs.
2. **Role Isolation** — Each role sees only their authorized features. Navigation, data, and actions are filtered at the component level.
3. **Audit by Default** — Every write operation emits an audit event. The UI makes audit trails first-class citizens, not afterthoughts.
4. **Fail Gracefully** — Network failures, API errors, and partial data loads degrade gracefully with inline error states and retry mechanisms.
5. **Financial Data Precision** — All monetary values use Indian number formatting (₹ with lakh/crore notation). All dates use DD-MMM-YYYY. All percentages show 2 decimal places.

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (React SPA)                       │
│                                                             │
│  ┌──────────┐  ┌──────────────────────────────────────────┐ │
│  │ AppShell │  │           Feature Modules                │ │
│  │          │  │  ┌──────────┐  ┌──────────┐  ┌────────┐ │ │
│  │ RoleSide │  │  │LoanOfficer│  │CreditAnal│  │Underwr.│ │ │
│  │ bar      │  │  └──────────┘  └──────────┘  └────────┘ │ │
│  │ Header   │  │  ┌──────────┐  ┌──────────┐  ┌────────┐ │ │
│  │ Notif.   │  │  │Compliance│  │Operations│  │Finance │ │ │
│  │ Feed     │  │  └──────────┘  └──────────┘  └────────┘ │ │
│  └──────────┘  │  ┌──────────┐  ┌──────────┐  ┌────────┐ │ │
│                │  │Collections│  │CustSupport│  │Admin  │ │ │
│                │  └──────────┘  └──────────┘  └────────┘ │ │
│                └──────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Shared AI Layer Components              │   │
│  │  ScoreGauge  FraudRadar  XAIPanel  DPDHeatmap       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           State Layer                                │   │
│  │  React Query (server state)  Zustand (client state) │   │
│  │  React Hook Form + Zod (form state)                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
         │ HTTPS + WebSocket
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway / BFF                         │
│  Auth (JWT)  Rate Limiting  Request Routing  Versioning     │
└─────────────────────────────────────────────────────────────┘
         │
┌─────────────────────────────────────────────────────────────┐
│              Backend Microservices (LOS + LMS)               │
└─────────────────────────────────────────────────────────────┘
```

### Routing Architecture

```typescript
// Role-based route guard pattern
const routes: RouteConfig[] = [
  {
    path: '/loan-officer/*',
    component: lazy(() => import('@/features/loan-officer')),
    requiredRoles: ['Loan_Officer', 'System_Admin'],
  },
  {
    path: '/credit-analyst/*',
    component: lazy(() => import('@/features/credit-analyst')),
    requiredRoles: ['Credit_Analyst', 'System_Admin'],
  },
  {
    path: '/underwriter/*',
    component: lazy(() => import('@/features/underwriter')),
    requiredRoles: ['Underwriter', 'System_Admin'],
  },
  // ... one route per feature module
]
```

Each route is protected by a `<RoleGuard>` component that checks the authenticated user's role against `requiredRoles`. Unauthorized access redirects to a 403 page.


---

## Components and Interfaces

### AppShell Component

```typescript
interface AppShellProps {
  user: AuthenticatedUser;
}

interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  delegatedAuthority?: DelegatedAuthority;
}

type UserRole =
  | 'Loan_Officer' | 'Credit_Analyst' | 'Underwriter'
  | 'Compliance_Officer' | 'Ops_Team' | 'Finance_Team'
  | 'Collection_Agent' | 'Customer_Support' | 'System_Admin';
```

The AppShell renders:
- `RoleSidebar` — navigation items filtered by `user.role`
- `TopHeader` — global search, notification bell, user avatar
- `<Outlet>` — active feature module
- `NotificationFeed` — slide-over panel for real-time alerts

### Core Shared Components

#### RiskBadge
```typescript
interface RiskBadgeProps {
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}
```
Renders a color-coded pill using the risk color tokens. Always includes text label for accessibility.

#### ScoreGauge
```typescript
interface ScoreGaugeProps {
  score: number;           // 0–900
  min?: number;            // default 300
  max?: number;            // default 900
  confidenceInterval?: [number, number];  // e.g., [685, 755]
  label: string;
  isLoading?: boolean;
  modelVersion?: string;
  lastTrainedAt?: string;
}
```
SVG arc gauge with color zones. Shows confidence interval as a shaded arc segment. Tooltip on hover shows model version and training date.

#### DPDHeatmap
```typescript
interface DPDHeatmapProps {
  data: DPDCell[];
  onCellClick?: (bucket: DPDBucket, month: string) => void;
}

interface DPDCell {
  month: string;           // 'Jan 2026'
  bucket: DPDBucket;       // 'current' | 'sma0' | 'sma1' | 'sma2' | 'npa'
  loanCount: number;
  outstandingAmount: number;
  intensity: number;       // 0–1, drives color opacity
}
```

#### AllocationWaterfall
```typescript
interface AllocationWaterfallProps {
  payment: PaymentAllocation;
}

interface PaymentAllocation {
  totalReceived: number;
  fees: number;
  penalties: number;
  interest: number;
  principal: number;
  shortfall?: number;
}
```
Stacked horizontal bar showing allocation priority order with amount labels.

#### DecisionFlowChart
```typescript
interface DecisionFlowChartProps {
  hardFilters: FilterResult[];
  policyRules: RuleResult[];
  creditScoreEvaluation: ScoreEvaluation;
  finalDecision: 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'AUTO_REJECT';
  triggerCondition?: string;
}

interface FilterResult {
  name: string;
  passed: boolean;
  evaluatedValue?: string;
  threshold?: string;
}
```
SVG/React flow diagram rendering the Decision Engine logic tree with pass/fail indicators at each node.

#### DocumentViewer
```typescript
interface DocumentViewerProps {
  document: LoanDocument;
  ocrResult?: OCRResult;
  onFieldOverride?: (fieldName: string, value: string, reason: string) => void;
  compareWith?: LoanDocument;  // for side-by-side comparison
}
```
Split-pane component: left pane renders document image (PDF.js or `<img>`), right pane renders OCR field table with confidence scores and override inputs.

#### AuditLogTable
```typescript
interface AuditLogTableProps {
  entries: AuditEntry[];
  isLoading: boolean;
  totalCount: number;
  onPageChange: (page: number) => void;
  onExport: (format: 'csv' | 'pdf') => void;
}

interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  actionType: string;
  entityType: string;
  entityId: string;
  ipAddress: string;
  dataBefore?: Record<string, unknown>;
  dataAfter?: Record<string, unknown>;
  isHighlighted?: boolean;  // for overrides and compliance events
}
```

#### DispositionForm
```typescript
interface DispositionFormProps {
  loanId: string;
  borrowerName: string;
  onSubmit: (disposition: DispositionEntry) => Promise<void>;
}

interface DispositionEntry {
  outcomeCode: DispositionCode;
  promisedAmount?: number;
  promisedDate?: string;
  paymentMode?: string;
  notes: string;
  contactedAt: string;
}

type DispositionCode =
  | 'PROMISE_TO_PAY' | 'PARTIAL_PROMISE' | 'DISPUTE_RAISED'
  | 'CANNOT_BE_CONTACTED' | 'REFUSED_TO_PAY' | 'LEGAL_ACTION_REQUIRED';
```

#### AIProcessingState
```typescript
interface AIProcessingStateProps {
  stage: 'credit_scoring' | 'fraud_detection' | 'ocr' | 'delinquency_prediction';
  estimatedSeconds?: number;
  isComplete: boolean;
  hasError: boolean;
}
```
Animated pulsing indicator with stage label and estimated time. Transitions to a checkmark on completion or error icon on failure.


---

## Data Models

### LOS Domain Types

```typescript
// Application lifecycle
interface LoanApplication {
  arn: string;                          // Application Reference Number
  status: ApplicationStatus;
  stage: ApplicationStage;
  loanType: 'personal' | 'home' | 'auto' | 'business' | 'bnpl';
  requestedAmount: number;
  requestedTenureMonths: number;
  channel: 'web' | 'mobile' | 'branch' | 'api';
  borrower: BorrowerProfile;
  assignedOfficerId: string;
  assignedAnalystId?: string;
  assignedUnderwriterId?: string;
  slaDeadline: string;                  // ISO timestamp
  slaBreached: boolean;
  aiRiskGrade?: RiskGrade;
  aiFraudScore?: FraudScore;
  createdAt: string;
  updatedAt: string;
}

type ApplicationStatus =
  | 'Lead' | 'Submitted' | 'Documents_Pending' | 'KYC_Verification'
  | 'Credit_Assessment' | 'Underwriting' | 'Offer_Generated'
  | 'ESigning_Pending' | 'Disbursement_Pending' | 'Disbursed'
  | 'Rejected' | 'Withdrawn';

type RiskGrade = 'A+' | 'A' | 'B' | 'C' | 'D';

interface BorrowerProfile {
  id: string;
  name: string;
  pan: string;
  mobile: string;
  email: string;
  dateOfBirth: string;
  employmentType: 'salaried' | 'self_employed' | 'business';
  monthlyIncome: number;
  city: string;
  state: string;
}

interface FraudScore {
  aggregate: number;                    // 0–100
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  signals: FraudSignal[];
  assessedAt: string;
}

interface FraudSignal {
  type: 'liveness_fail' | 'document_tamper' | 'velocity_flag'
      | 'synthetic_identity' | 'ip_anomaly' | 'income_inconsistency';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  detectedAt: string;
  isFalsePositive: boolean;
  falsePositiveReason?: string;
}

interface AIRiskAssessment {
  applicationId: string;
  compositeScore: number;               // 0–900
  confidenceInterval: [number, number];
  riskGrade: RiskGrade;
  tier1Score: number;                   // Bureau
  tier2Score: number;                   // Behavioral
  tier3Score?: number;                  // Alternative
  tier1Weight: number;
  tier2Weight: number;
  tier3Weight?: number;
  positiveFactors: ScoringFactor[];
  negativeFactors: ScoringFactor[];
  modelVersion: string;
  lastTrainedAt: string;
  assessedAt: string;
}

interface ScoringFactor {
  name: string;                         // Business-friendly label
  featureKey: string;                   // Internal model feature name
  impact: number;                       // SHAP value, positive or negative
  value: string;                        // Human-readable value
}

interface DecisionEngineResult {
  applicationId: string;
  hardFilters: FilterResult[];
  policyRules: RuleResult[];
  creditScoreEvaluation: ScoreEvaluation;
  finalDecision: 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'AUTO_REJECT';
  triggerCondition?: string;
  reasonCodes: string[];
  evaluatedAt: string;
}

interface FilterResult {
  filterId: string;
  name: string;
  passed: boolean;
  evaluatedValue?: string;
  threshold?: string;
}

interface RuleResult {
  ruleId: string;
  name: string;
  passed: boolean;
  evaluatedValue?: string;
  threshold?: string;
  isOverridden?: boolean;
  overrideJustification?: string;
}

interface ScoreEvaluation {
  score: number;
  band: 'HIGH' | 'MEDIUM' | 'LOW';
  highThreshold: number;
  lowThreshold: number;
}

interface LoanDocument {
  id: string;
  applicationId: string;
  type: 'aadhaar' | 'pan' | 'salary_slip' | 'itr' | 'bank_statement'
      | 'address_proof' | 'agreement' | 'collateral' | 'other';
  status: DocumentStatus;
  uploadedAt: string;
  uploadedBy: string;
  fileUrl: string;
  ocrStatus: 'pending' | 'processing' | 'complete' | 'failed';
  ocrResult?: OCRResult;
  version: number;
  isTampered?: boolean;
  tamperingIndicators?: string[];
}

type DocumentStatus =
  | 'Pending_Upload' | 'Uploaded' | 'OCR_Processing'
  | 'OCR_Complete' | 'Verified' | 'Failed' | 'Requires_Resubmission';

interface OCRResult {
  documentId: string;
  extractedFields: OCRField[];
  overallConfidence: number;
  processedAt: string;
}

interface OCRField {
  fieldName: string;
  extractedValue: string;
  confidence: number;                   // 0–1
  isManuallyOverridden: boolean;
  overriddenValue?: string;
  overrideReason?: string;
  overriddenBy?: string;
}

interface PolicyOverride {
  id: string;
  applicationId: string;
  ruleId: string;
  ruleName: string;
  underwriterId: string;
  underwriterName: string;
  justification: string;
  overrideCategory: string;
  delegatedAuthority: boolean;
  approvedBy?: string;
  createdAt: string;
}

interface CreditMemo {
  id: string;
  applicationId: string;
  analystId: string;
  analystName: string;
  recommendation: 'Approve' | 'Approve_with_Conditions' | 'Decline';
  conditions?: string;
  summary: string;
  attachments: string[];
  version: number;
  submittedAt?: string;
  createdAt: string;
}
```

### LMS Domain Types

```typescript
interface LoanAccount {
  lan: string;                          // Loan Account Number
  arn: string;                          // Originating ARN
  borrowerId: string;
  status: LoanAccountStatus;
  principalAmount: number;
  disbursedAmount: number;
  disbursedAt: string;
  interestRate: number;                 // Annual percentage
  interestMethod: 'reducing_balance' | 'flat_rate' | 'bullet';
  tenureMonths: number;
  emiAmount: number;
  nextEmiDueDate: string;
  outstandingPrincipal: number;
  totalOverdueAmount: number;
  dpd: number;                          // Days Past Due
  dpdBucket: DPDBucket;
  nachMandateStatus: 'active' | 'failed' | 'pending' | 'cancelled';
  delinquencyPredictionScore?: number;  // 0–100, AI-generated
  createdAt: string;
}

type LoanAccountStatus =
  | 'Active' | 'SMA_0' | 'SMA_1' | 'SMA_2' | 'NPA'
  | 'Restructured' | 'Closed' | 'Written_Off' | 'Foreclosed';

type DPDBucket = 'current' | 'sma0' | 'sma1' | 'sma2' | 'npa';

interface EMIScheduleEntry {
  emiNumber: number;
  dueDate: string;
  emiAmount: number;
  principalComponent: number;
  interestComponent: number;
  outstandingBalance: number;
  status: 'paid' | 'upcoming' | 'overdue' | 'partial' | 'waived';
  paidAmount?: number;
  paidAt?: string;
}

interface PaymentEvent {
  id: string;
  lan: string;
  receivedAt: string;
  amount: number;
  paymentMode: 'nach' | 'upi' | 'neft' | 'rtgs' | 'cash' | 'cheque';
  utrReference: string;
  allocation: PaymentAllocation;
  isBounced: boolean;
  bounceReason?: string;
  bounceCharge?: number;
}

interface PaymentAllocation {
  totalReceived: number;
  fees: number;
  penalties: number;
  interest: number;
  principal: number;
  shortfall?: number;
}

interface DispositionEntry {
  id: string;
  lan: string;
  agentId: string;
  agentName: string;
  outcomeCode: DispositionCode;
  promisedAmount?: number;
  promisedDate?: string;
  paymentMode?: string;
  notes: string;
  contactedAt: string;
  isBrokenPromise?: boolean;
}

interface PromiseToPay {
  id: string;
  lan: string;
  borrowerName: string;
  promisedAmount: number;
  promisedDate: string;
  paymentMode: string;
  status: 'pending' | 'fulfilled' | 'broken' | 'rescheduled';
  agentId: string;
  createdAt: string;
}

interface GLEntry {
  id: string;
  lan: string;
  eventType: 'disbursement' | 'interest_accrual' | 'payment_receipt'
           | 'penalty_collection' | 'npa_provisioning' | 'write_off';
  debitAccount: string;
  creditAccount: string;
  amount: number;
  postingDate: string;
  status: 'posted' | 'failed' | 'pending';
  errorReason?: string;
}

interface Dispute {
  id: string;
  lan: string;
  borrowerId: string;
  type: 'payment_not_credited' | 'incorrect_charge' | 'statement_error' | 'nach_failure';
  description: string;
  status: 'Open' | 'In_Progress' | 'Resolved' | 'Escalated';
  createdBy: string;
  createdAt: string;
  resolvedAt?: string;
  resolutionDetails?: string;
  slaDeadline: string;
  slaBreached: boolean;
}
```

### AI Layer Types

```typescript
interface DelinquencyPrediction {
  lan: string;
  predictionScore: number;             // 0–100, probability of delinquency in 30 days
  topFactors: PredictionFactor[];
  modelVersion: string;
  predictedAt: string;
}

interface PredictionFactor {
  name: string;
  impact: 'positive' | 'negative';
  description: string;
}

interface XAIExplanation {
  entityId: string;                    // ARN or LAN
  decisionType: 'credit_score' | 'fraud_score' | 'delinquency_prediction';
  naturalLanguageSummary: string;
  shapValues: ScoringFactor[];
  counterfactuals: Counterfactual[];
  adverseActionCodes?: string[];
}

interface Counterfactual {
  condition: string;                   // "If DTI ratio were reduced to 42%"
  outcome: string;                     // "this application would qualify for AUTO APPROVE"
}
```


---

## UX Flows

### Flow 1: Application Lifecycle (LOS)

```
Loan_Officer logs in
    → Pipeline Dashboard (Kanban view, assigned applications)
    → Clicks application card
        → Application Detail View (tabbed)
            → Overview tab: borrower summary, AI risk grade badge, fraud score
            → Documents tab: DocumentViewer with OCR results
                → OCR confidence < 80%: amber highlight, manual override prompt
                → Tampering detected: red alert, block progression
            → KYC Status tab: KYC/AML check results
            → Credit tab: bureau score, AI score breakdown (read-only for LO)
            → Communication tab: CRM panel, message templates
            → Activity Log tab: immutable timeline
        → Action: "Approve for Credit Review"
            → Routes to Credit_Analyst queue
            → Audit log entry created
```

### Flow 2: Decision Engine & Underwriting

```
Credit_Analyst receives application
    → Credit Analyst Workbench
        → Bureau Report Viewer: parsed CIBIL/Experian report
        → Financial Ratio Calculator: auto-computed DTI/FOIR/LTV
        → AI Score Breakdown: Tier 1/2/3 with SHAP factors
        → Credit Memo: pre-populated template
            → Analyst adds recommendation: Approve / Decline
            → Submit → routes to Underwriter

Underwriter receives credit memo
    → Underwriter Workbench
        → Risk Assessment Summary: AI grade, all ratios, fraud score
        → Decision Engine Output: visual flow (Hard Filters → Policy Rules → Score)
            → If MANUAL_REVIEW: trigger condition displayed
        → Policy Override (if needed):
            → Failed rules listed
            → Underwriter enters justification (min 50 chars)
            → Authority check: within limit → submit; exceeds limit → escalate
            → Audit log entry: immutable
        → Loan Structuring (if borderline):
            → Adjust amount/tenure/rate → real-time EMI recalculation
            → Offer variants side-by-side
        → Final Decision: Approve → Offer Generated
```

### Flow 3: Delinquency Escalation (LMS)

```
Nightly batch: DPD recalculated for all active loans
    → Accounts crossing DPD thresholds auto-reclassified:
        0 DPD → SMA-0 (1 DPD): notification to Collection_Agent queue
        30 DPD → SMA-1: escalated priority in collection queue
        60 DPD → SMA-2: field collection flag added
        90 DPD → NPA: provisioning workflow triggered, bureau update queued

Finance_Team: Delinquency Dashboard
    → DPD Heatmap: concentration by bucket and month
    → Roll Rate Analysis: bucket migration percentages
    → NPA alert: provisioning workflow initiated
    → AI Delinquency Prediction: accounts with score > 70% added to proactive queue
```

### Flow 4: Collections Workflow

```
Collection_Agent logs in
    → Collection Queue (priority-sorted by composite score)
    → Selects account
        → Borrower 360° view: loan details, payment history, AI signals
        → Initiates contact
        → Disposition Entry:
            → Promise to Pay: enter amount + date + mode
                → PTP Tracker updated
                → On promised date: payment received → auto-fulfilled
                → On promised date: no payment → broken promise flag, priority escalated
            → Legal Action Required:
                → Escalation to Collection Supervisor
                → Legal action initiation workflow
        → Field Visit (high-value accounts):
            → Field Visit Queue: map view by territory
            → Record visit outcome: GPS, contact made, amount collected
            → Collection receipt generated
```

### Flow 5: Restructuring Flow

```
Customer_Support receives restructuring request
    → Borrower 360° view: current loan status, DPD, payment history
    → Creates service request: type = Restructuring
    → Routes to Finance_Team

Finance_Team reviews
    → Loan Servicing Dashboard: current amortization, outstanding
    → Restructuring options: moratorium / tenure extension / rate reduction
    → Recalculates new EMI schedule
    → Approval workflow: Finance_Team submits → Compliance_Officer notified
    → New amortization schedule generated
    → Loan status updated to Restructured
    → Bureau update queued
```

### Flow 6: Exception Handling UX

```
Any processing failure → Exception Queue (Ops_Team)
    → Exception categorized: Document / KYC / Disbursement / Handoff / System
    → Exception detail: error reason, failed fields, age, SLA deadline
    → Ops_Team resolves:
        → Handoff failure: view/edit payload → manual retry
        → Disbursement failure: check payment rail status → re-trigger
        → Document exception: request resubmission from borrower
    → Resolution note required
    → Parent application status updated
    → SLA breach: auto-escalate to supervisor + overdue indicator
```

---

## AI Integration UX Patterns

### Pattern 1: AI Score Display

Every AI score in the platform follows this layout:
1. **Gauge** — SVG arc gauge with color zones and confidence interval shading
2. **Point estimate** — large number with risk grade badge
3. **Confidence interval** — "720 ± 35" in smaller text below
4. **AI badge** — "AI" chip to distinguish from human-entered values
5. **Model info** — tooltip on hover: "Model v2.3 | Trained: 15-Mar-2026"
6. **Processing state** — pulsing animation while AI is computing

### Pattern 2: Explainability Panel

Triggered by "Why this decision?" button on any AI score:
1. **Natural language summary** — plain English explanation
2. **SHAP waterfall chart** — horizontal bars, positive (green) and negative (red)
3. **Counterfactuals** — "To improve: reduce DTI to 42% → AUTO APPROVE"
4. **Adverse action codes** — regulation-compliant codes for borrower communication
5. **Export button** — PDF export for credit file inclusion

### Pattern 3: Fraud Signal Display

1. **Aggregate score** — color-coded severity badge (Low/Medium/High/Critical)
2. **Radar chart** — 5-axis: identity, document, application, synthetic, velocity
3. **Signal list** — tagged badges per signal type with severity
4. **Timeline** — when each signal was detected during the application
5. **Similar patterns** — other applications with matching signals
6. **False positive** — "Mark as False Positive" with mandatory reason

### Pattern 4: AI Processing State

When AI is computing (credit scoring, OCR, fraud detection):
1. Show `AIProcessingState` component with pulsing animation
2. Display estimated time: "Estimated: ~15 seconds"
3. On completion: transition to result with a brief success flash
4. On failure: show inline error with "Retry AI Analysis" button
5. Never show blank/empty state during AI processing

### Pattern 5: Stale AI Data

When AI result is older than 24 hours:
1. Display amber "Stale" badge next to the score
2. Show "Last assessed: X hours ago"
3. Provide "Refresh AI Analysis" button
4. Do not auto-refresh AI scores (they require explicit trigger due to cost)


---

## Error Handling

### Error Boundary Hierarchy

```
<AppErrorBoundary>           ← Catches catastrophic failures, shows full-page error
  <AppShell>
    <FeatureErrorBoundary>   ← Catches module failures, shows module error state
      <PipelineDashboard>
        <ComponentErrorBoundary>  ← Catches widget failures, shows inline error
          <ScoreGauge />
        </ComponentErrorBoundary>
      </PipelineDashboard>
    </FeatureErrorBoundary>
  </AppShell>
</AppErrorBoundary>
```

### API Error Response Handling

| HTTP Status | UI Behavior |
|---|---|
| 400 Bad Request | Inline form validation error from API response body |
| 401 Unauthorized | Silent token refresh → retry once → redirect to login |
| 403 Forbidden | "Access Denied" message with required role info |
| 404 Not Found | Inline "Record not found" empty state |
| 409 Conflict | Conflict resolution dialog (optimistic locking) |
| 422 Unprocessable | Field-level validation errors mapped to form fields |
| 429 Rate Limited | "Too many requests — please wait X seconds" with countdown |
| 5xx Server Error | Retry with exponential backoff (1s, 2s, 4s) → error state with reference number |
| Network Timeout | Offline banner + queue write operations locally |

### Critical Action Error Handling

For disbursement, policy override, and write-off failures:
1. Display a modal error dialog (not inline) — these are high-stakes actions
2. Show error reference number for support escalation
3. Preserve all form data so the user can retry without re-entering
4. Log the error with full context to the monitoring service

### Empty States

Every data-fetching component defines an empty state:
- **Collection Queue empty**: "No accounts in your queue. Check back later or adjust filters."
- **Pipeline empty**: "No applications assigned. Contact your supervisor."
- **Audit Log empty**: "No audit entries match your search criteria."
- **Portfolio empty**: "No active loans in the selected filters."

Each empty state includes a descriptive message and a relevant primary action button.


---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Application Stage Grouping Correctness

*For any* set of loan applications with known stage values, the pipeline grouping function should place each application in exactly one stage bucket, and the union of all buckets should equal the original set with no applications lost or duplicated.

**Validates: Requirements 1.1**

---

### Property 2: Risk Grade Color Token Mapping

*For any* risk grade value in {A+, A, B, C, D}, the rendered RiskBadge and ScoreGauge components should apply the exact background color, text color, and border color tokens defined in the design system color map — no grade should map to an undefined or incorrect color.

**Validates: Requirements 1.7, 9.2, 39.1**

---

### Property 3: AI Assessment Rendering Completeness

*For any* AIRiskAssessment object with a valid compositeScore, riskGrade, confidenceInterval, positiveFactors, and negativeFactors, the rendered AI score panel should display all of: the score value, the risk grade badge, the confidence interval, and at least one positive and one negative factor — no field should be silently omitted.

**Validates: Requirements 2.2, 7.1**

---

### Property 4: OCR Confidence Threshold Styling

*For any* OCRField with a confidence value, the rendered field row should apply the amber highlight style if and only if confidence < 0.80, and the default style otherwise. This mapping must hold for all confidence values in [0.0, 1.0].

**Validates: Requirements 3.2, 3.3**

---

### Property 5: Financial Ratio Calculation Invariant

*For any* valid combination of monthly income (> 0), total monthly obligations (≥ 0), and loan amount (> 0), the computed DTI ratio should equal (total monthly obligations / monthly income) × 100, and the result should be a non-negative finite number. The same invariant applies to FOIR and LTV with their respective formulas.

**Validates: Requirements 6.1**

---

### Property 6: AI Score Tier Weight Invariant

*For any* AIRiskAssessment object, the sum of tier weights (tier1Weight + tier2Weight + optional tier3Weight) should equal exactly 1.0 (within floating-point tolerance of 0.001). No valid assessment should have weights that do not sum to 1.

**Validates: Requirements 7.2**

---

### Property 7: Policy Override Justification Length Validation

*For any* policy override submission, the form should accept the submission if and only if the justification string has length ≥ 50 characters after trimming whitespace. Strings of length < 50 (including all-whitespace strings) should be rejected with a validation error.

**Validates: Requirements 11.2**

---

### Property 8: EMI Calculation Formula Correctness

*For any* valid loan with principal P > 0, annual interest rate r > 0, and tenure n > 0 months, the computed monthly EMI using the reducing balance method should equal [P × (r/12) × (1 + r/12)^n] / [(1 + r/12)^n - 1], within a tolerance of ₹1 (rounding). The computed EMI should always be positive and less than the principal.

**Validates: Requirements 12.2**

---

### Property 9: EMI Status Color Mapping

*For any* EMIScheduleEntry with a known status, the rendered table row should apply the correct color: paid → green, overdue → red, partial → amber, upcoming → default (no color class). This mapping must be exhaustive — no status value should result in an undefined color.

**Validates: Requirements 22.2**

---

### Property 10: Payment Allocation Priority Invariant

*For any* payment event with a positive received amount and outstanding dues across fees, penalties, interest, and principal, the allocation should satisfy the priority order: fees are fully covered before penalties, penalties before interest, and interest before principal. No principal should be reduced while fees remain outstanding.

**Validates: Requirements 23.2**

---

### Property 11: Payment Allocation Sum Invariant

*For any* PaymentAllocation object, the sum of (fees + penalties + interest + principal + shortfall) should equal totalReceived within a tolerance of ₹0.01. No payment amount should be created or destroyed during allocation.

**Validates: Requirements 23.2**

---

### Property 12: DPD Heatmap Intensity Normalization

*For any* set of DPDCell objects, the intensity values should be normalized to [0.0, 1.0] relative to the maximum value in the dataset. The cell with the highest loan count (or outstanding amount) should have intensity = 1.0, and all other cells should have intensity proportional to their value. No cell should have intensity outside [0.0, 1.0].

**Validates: Requirements 24.1**

---

### Property 13: Collection Queue Sort Invariant

*For any* collection queue, the items should be sorted in descending order by composite priority score. For every adjacent pair of items (i, i+1) in the rendered queue, item[i].priorityScore ≥ item[i+1].priorityScore. An empty queue and a single-item queue trivially satisfy this property.

**Validates: Requirements 25.1**

---

### Property 14: Promise-to-Pay Validation Completeness

*For any* DispositionEntry with outcomeCode = PROMISE_TO_PAY, the entry should be rejected if any of promisedAmount, promisedDate, or paymentMode is absent or empty. All three fields must be present and non-empty for the disposition to be accepted.

**Validates: Requirements 26.2**

---

### Property 15: Virtual Scrolling Row Count Bound

*For any* VirtualTable component rendering a dataset of N rows where N > 50, the number of DOM row elements rendered at any given scroll position should be less than N and bounded by the configured overscan window (typically 10–20 rows). The full dataset should never be fully materialized in the DOM simultaneously.

**Validates: Requirements 43.4**

---

### Property 16: Skeleton Loading State Exclusivity

*For any* data-fetching component in the loading state (isLoading = true), the rendered output should contain skeleton elements and should not contain actual data content. Conversely, when isLoading = false and data is available, no skeleton elements should be present. These states are mutually exclusive.

**Validates: Requirements 43.5**

---

## Testing Strategy

### Dual Testing Approach

Both unit tests and property-based tests are required. They are complementary:
- **Unit tests** verify specific examples, edge cases, and integration points
- **Property tests** verify universal correctness across all valid inputs

### Property-Based Testing Library

Use **fast-check** (TypeScript/JavaScript) for all property-based tests.

```typescript
import fc from 'fast-check';
```

Each property test must run a minimum of **100 iterations** (fast-check default is 100).

### Property Test Tag Format

Each property test must be tagged with a comment:
```typescript
// Feature: los-lms-platform-ui, Property N: [property title]
```

### Property Test Implementation Map

| Property | Test File | fast-check Arbitraries |
|---|---|---|
| P1: Stage Grouping | `pipeline.test.ts` | `fc.array(fc.record({ stage: fc.constantFrom(...stages) }))` |
| P2: Risk Grade Colors | `RiskBadge.test.tsx` | `fc.constantFrom('A+', 'A', 'B', 'C', 'D')` |
| P3: AI Assessment Rendering | `ScoreGauge.test.tsx` | `fc.record({ score: fc.integer(300, 900), grade: fc.constantFrom(...) })` |
| P4: OCR Confidence Styling | `DocumentViewer.test.tsx` | `fc.float({ min: 0, max: 1 })` |
| P5: Financial Ratio Calculation | `ratioCalculator.test.ts` | `fc.record({ income: fc.float({ min: 1 }), obligations: fc.float({ min: 0 }) })` |
| P6: Tier Weight Invariant | `aiScore.test.ts` | `fc.record({ t1: fc.float(0,1), t2: fc.float(0,1) })` |
| P7: Override Justification | `policyOverride.test.ts` | `fc.string()` |
| P8: EMI Calculation | `emiCalculator.test.ts` | `fc.record({ principal: fc.float({ min: 1000 }), rate: fc.float({ min: 0.01, max: 0.36 }), tenure: fc.integer({ min: 1, max: 360 }) })` |
| P9: EMI Status Colors | `EMISchedule.test.tsx` | `fc.constantFrom('paid', 'upcoming', 'overdue', 'partial')` |
| P10: Allocation Priority | `paymentAllocation.test.ts` | `fc.record({ received: fc.float({ min: 1 }), fees: fc.float({ min: 0 }), ... })` |
| P11: Allocation Sum | `paymentAllocation.test.ts` | Same as P10 |
| P12: Heatmap Normalization | `DPDHeatmap.test.tsx` | `fc.array(fc.record({ loanCount: fc.nat() }), { minLength: 1 })` |
| P13: Queue Sort | `collectionQueue.test.ts` | `fc.array(fc.record({ priorityScore: fc.float() }))` |
| P14: PTP Validation | `DispositionForm.test.tsx` | `fc.record({ outcomeCode: fc.constant('PROMISE_TO_PAY'), promisedAmount: fc.option(fc.float({ min: 1 })) })` |
| P15: Virtual Scroll Rows | `VirtualTable.test.tsx` | `fc.array(fc.anything(), { minLength: 51, maxLength: 10000 })` |
| P16: Skeleton Exclusivity | `SkeletonLoader.test.tsx` | `fc.boolean()` (isLoading) |

### Unit Test Focus Areas

- Specific examples for each portal's happy path
- Edge cases: empty queues, zero-amount payments, thin-file borrowers, all-whitespace inputs
- Integration points: ARN→LAN navigation, status transitions, audit log creation
- Error states: API failures, network disconnection, 403 responses
- Accessibility: ARIA roles, keyboard navigation, focus management


---

## Component Hierarchy Per Portal

### Loan Officer Portal
```
LoanOfficerLayout (RoleGuard: Loan_Officer)
├── PipelineDashboard
│   ├── PipelineMetrics (KPI cards)
│   ├── PipelineFilters (URL-persisted filter bar)
│   └── KanbanBoard
│       └── KanbanColumn[] (one per ApplicationStatus)
│           └── ApplicationCard[] (RiskBadge, SLA indicator, FraudScore badge)
├── ApplicationDetailPage (tabbed)
│   ├── OverviewTab
│   │   ├── BorrowerSummaryCard
│   │   ├── ScoreGauge (AI risk score, read-only)
│   │   ├── FraudAlertBanner (conditional)
│   │   └── ContextualActionBar (stage-aware buttons)
│   ├── DocumentsTab
│   │   └── DocumentViewer (split-pane)
│   │       ├── DocumentImagePane (PDF.js)
│   │       └── OCRFieldTable (confidence scores, override inputs)
│   │           └── TamperingAlert (conditional)
│   ├── KYCStatusTab
│   │   └── KYCCheckList (pass/fail badges per check)
│   ├── CreditTab (read-only for Loan_Officer)
│   │   └── ScoreGauge (bureau score only)
│   ├── CommunicationTab
│   │   └── CommunicationPanel
│   │       ├── MessageComposer (SMS/email/call log)
│   │       ├── MessageTemplates
│   │       └── CommunicationTimeline
│   └── ActivityLogTab
│       └── ActivityTimeline (immutable, with note creation)
└── SLAMonitorPage
    └── SLABreachTable (VirtualTable)
```

### Credit Analyst Workbench
```
CreditAnalystLayout (RoleGuard: Credit_Analyst)
├── CreditQueuePage
│   └── CreditQueueTable (VirtualTable, assigned applications)
└── CreditWorkbenchPage (application-scoped)
    ├── BureauReportViewer
    │   ├── CreditScoreCard (score + band + utilization gauge)
    │   ├── CreditScoreTrend (Recharts LineChart, 24 months)
    │   ├── TradelineTable (VirtualTable)
    │   ├── DerogatoryMarksList
    │   └── BureauComparison (tabbed CIBIL/Experian)
    ├── RatioCalculator
    │   ├── RatioInputForm (income, obligations, property value)
    │   ├── RatioResultCards (DTI, FOIR, LTV with threshold indicators)
    │   └── RatioComparisonTable
    ├── AIScoreBreakdown
    │   ├── ScoreGauge (composite, with confidence interval)
    │   ├── TierBreakdownTable (Tier 1/2/3 scores + weights)
    │   └── SHAPWaterfallChart (top 5 positive + negative factors)
    └── CreditMemoForm
        ├── MemoTemplate (pre-populated fields)
        ├── RecommendationSelector
        ├── DocumentAttachment
        └── MemoVersionHistory
```

### Underwriter Workbench
```
UnderwriterLayout (RoleGuard: Underwriter)
├── UnderwriterQueuePage
│   └── PendingDecisionsTable (VirtualTable)
└── UnderwritingWorkbenchPage (application-scoped)
    ├── RiskAssessmentSummary
    │   ├── RiskSummaryCard (AI grade, all ratios, fraud score, KYC)
    │   ├── RiskWarningPanel (conditional, for C/D grades)
    │   └── ComparableCasesPanel
    ├── DecisionEngineViewer
    │   ├── DecisionFlowChart (SVG flow)
    │   │   ├── HardFilterNodes[]
    │   │   ├── PolicyRuleNodes[]
    │   │   └── ScoreEvaluationNode
    │   └── ManualReviewTriggerBanner (conditional)
    ├── PolicyOverridePanel
    │   ├── FailedRulesList
    │   ├── OverrideForm (justification, category, authority check)
    │   ├── EscalationModal (when authority exceeded)
    │   └── OverrideHistory (AuditLogTable variant)
    └── LoanStructuringPanel
        ├── ParameterSliders (amount, tenure, rate, fee)
        ├── EMICalculatorDisplay (real-time recalculation)
        ├── PolicyBoundIndicators
        └── OfferVariantComparison
```

### Collections Agent App
```
CollectionsLayout (RoleGuard: Collection_Agent)
├── CollectionQueuePage
│   ├── CollectionQueueFilters
│   ├── CollectionQueueTable (VirtualTable, priority-sorted)
│   │   └── CollectionQueueItem (DPD badge, overdue amount, last contact)
│   └── AgentPerformanceMetrics (daily KPIs)
├── AccountDetailPage (LAN-scoped)
│   ├── Borrower360Card (loan details, payment history, AI signals)
│   ├── DispositionForm
│   │   ├── OutcomeCodeSelector
│   │   ├── PTPFields (conditional on PROMISE_TO_PAY)
│   │   └── DispositionHistory (infinite scroll)
│   └── DelinquencyScore (AI prediction)
├── PTPTrackerPage
│   ├── PTPList (due-date sorted, amber/red highlighting)
│   └── PTPFulfillmentMetric
└── FieldVisitPage
    ├── FieldVisitMap (territory view)
    ├── FieldVisitQueue
    └── VisitOutcomeForm (GPS capture, receipt generation)
```

---

## State Management Ownership

### Global State (Zustand — `src/app/store.ts`)

| Slice | Owner | Contents |
|---|---|---|
| `auth` | AppShell | authenticatedUser, role, permissions, delegatedAuthority |
| `notifications` | NotificationFeed | unread count, notification list, WebSocket connection status |
| `ui` | AppShell | sidebarCollapsed, activeTheme, toastQueue |
| `offlineQueue` | useRealtime | queued write operations pending network restoration |

### Server State (React Query — per feature module)

| Query Key | Owner Module | Stale Time | Refetch Strategy |
|---|---|---|---|
| `['applications', filters]` | loan-officer/pipeline | 30s | refetchInterval: 30s |
| `['application', arn]` | application-detail | 60s | refetchOnWindowFocus |
| `['aiAssessment', arn]` | ai-layer | 24h | manual trigger only |
| `['bureauReport', arn]` | credit-analyst | 24h | manual trigger only |
| `['portfolio', filters]` | loan-servicing | 60s | refetchInterval: 60s |
| `['loanAccount', lan]` | loan-servicing | 30s | refetchOnWindowFocus |
| `['collectionQueue', agentId]` | collections | 60s | refetchInterval: 60s |
| `['auditLog', filters]` | compliance | 5min | manual trigger only |
| `['integrationHealth']` | admin | 30s | refetchInterval: 30s |

### Form State (React Hook Form + Zod — per form component)

| Form | Schema Location | Validation Trigger |
|---|---|---|
| PolicyOverrideForm | `underwriter/policy-override/schema.ts` | onBlur + onSubmit |
| DispositionForm | `collections/disposition/schema.ts` | onBlur + onSubmit |
| CreditMemoForm | `credit-analyst/credit-memo/schema.ts` | onBlur + onSubmit |
| DisbursementAuthForm | `operations/disbursement/schema.ts` | onSubmit only |
| UserCreateForm | `admin/users/schema.ts` | onBlur + onSubmit |
| DisputeCreateForm | `customer-support/disputes/schema.ts` | onBlur + onSubmit |

---

## Missing Utility Components (Cross-Portal)

### StatusBadge
```typescript
interface StatusBadgeProps {
  status: ApplicationStatus | LoanAccountStatus | DocumentStatus | KYCStatus;
  size?: 'sm' | 'md';
}
```
Generic status badge that maps any canonical status string to a color and label. Used across all portals for consistent status display.

### CurrencyDisplay
```typescript
interface CurrencyDisplayProps {
  amount: number;
  showSymbol?: boolean;   // default true
  size?: 'sm' | 'md' | 'lg';
  colorize?: boolean;     // red for negative, green for positive
}
```
Formats numbers in Indian notation (₹ with lakh/crore). Used everywhere monetary values appear.

### DateDisplay
```typescript
interface DateDisplayProps {
  date: string;           // ISO timestamp
  format?: 'date' | 'datetime' | 'relative';
}
```
Formats dates as DD-MMM-YYYY or DD-MMM-YYYY HH:MM. Used everywhere dates appear.

### ConfirmationModal
```typescript
interface ConfirmationModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant: 'danger' | 'primary';
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}
```
Reusable confirmation dialog for destructive actions (write-off, deactivation, bulk actions).

### PageHeader
```typescript
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
}
```
Consistent page header with title, optional subtitle, breadcrumbs, and action slot.

### FilterChips
```typescript
interface FilterChipsProps {
  filters: ActiveFilter[];
  onRemove: (filterId: string) => void;
  onClearAll: () => void;
}
```
Displays active filter chips with remove buttons. Used in all filterable list views.

### EmptyState
```typescript
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}
```
Consistent empty state component used across all data-fetching views.

### InlineError
```typescript
interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
}
```
Inline error state for component-level failures. Used inside ComponentErrorBoundary.

