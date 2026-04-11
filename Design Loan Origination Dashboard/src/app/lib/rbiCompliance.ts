import type { LoanApplication } from '../data/loanApplications';
import { getLoanPolicy } from './rbiPolicy';

export type RBIComplianceStatus = 'Compliant' | 'Attention' | 'Missing';

export interface RBIComplianceItem {
  id: string;
  chapter: string;
  clause: string;
  requirement: string;
  field: string;
  value: string;
  status: RBIComplianceStatus;
  isCritical: boolean;
  action: string;
}

export interface RBIComplianceProfile {
  score: number;
  blockingIssues: number;
  items: RBIComplianceItem[];
}

export interface RBIFlowGate {
  canProceed: boolean;
  blockingItems: RBIComplianceItem[];
  message: string;
}

function parseDob(dob: string) {
  const parsed = new Date(dob);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function ageFromDob(dob: string) {
  const parsed = parseDob(dob);
  if (!parsed) return null;
  const diffMs = Date.now() - parsed.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
}

function toStatus(ok: boolean, maybe = false): RBIComplianceStatus {
  if (ok) return 'Compliant';
  return maybe ? 'Attention' : 'Missing';
}

function formatStatusValue(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return 'Not captured';
  return String(value);
}

export function buildRBIComplianceProfile(application: LoanApplication): RBIComplianceProfile {
  const borrowerAge = ageFromDob(application.dob);
  const loanPolicy = getLoanPolicy(application.loanType);
  const isDigitalFlow = ['digital_personal_loan', 'microfinance_loan'].includes(application.loanType);
  const isMicrofinance = application.loanType === 'microfinance_loan';
  const isProjectFinance = application.loanType === 'project_finance';
  const isGoldCollateral = application.loanType === 'gold_collateral_loan';
  const isNfbFacility = application.loanType === 'nfb_facility';
  const hasApr = application.interestRate.toLowerCase().includes('%');
  const hasOccupation = Boolean(application.employmentType);
  const hasIncomeAssessment = application.stage !== 'Lead';
  const hasCicReporting = application.stage === 'Disbursed';
  const hasConsentAuditTrail = application.stage !== 'Lead' && application.kycStatus === 'Verified';
  const hasKfs = ['Underwriting', 'Offer Sent', 'Disbursed'].includes(application.stage);
  const hasDirectDisbursalEvidence = application.stage === 'Disbursed';

  const items: RBIComplianceItem[] = [
    {
      id: 'dl-001',
      chapter: 'Chapter III - Digital Lending',
      clause: '8(1)',
      requirement: 'Capture borrower economic profile (age, occupation, income) before loan extension.',
      field: 'Borrower age',
      value: formatStatusValue(borrowerAge ? `${borrowerAge} years` : null),
      status: isDigitalFlow ? toStatus((borrowerAge ?? 0) >= 18) : 'Attention',
      isCritical: true,
      action: isDigitalFlow
        ? 'Collect/validate DOB and age eligibility before sanction.'
        : `Primary control for ${loanPolicy?.label ?? 'selected loan type'} is governed under ${loanPolicy?.rbiChapter ?? 'product policy'} controls.`,
    },
    {
      id: 'dl-002',
      chapter: 'Chapter III - Digital Lending',
      clause: '8(1)',
      requirement: 'Capture borrower economic profile (age, occupation, income) before loan extension.',
      field: 'Occupation',
      value: formatStatusValue(application.employmentType),
      status: isDigitalFlow ? toStatus(hasOccupation) : 'Attention',
      isCritical: true,
      action: isDigitalFlow
        ? 'Ensure occupation class is mandatory in intake form.'
        : 'Track borrower category fields as per product-specific underwriting checklist.',
    },
    {
      id: 'dl-003',
      chapter: 'Chapter III - Digital Lending',
      clause: '8(1)',
      requirement: 'Capture borrower economic profile (age, occupation, income) before loan extension.',
      field: 'Income assessment',
      value: hasIncomeAssessment ? 'Captured during submitted stage' : 'Pending at lead stage',
      status: isDigitalFlow ? toStatus(hasIncomeAssessment, true) : 'Attention',
      isCritical: true,
      action: 'Collect monthly income and repayment capacity before offer.',
    },
    {
      id: 'dl-004',
      chapter: 'Chapter III - Digital Lending',
      clause: '9(1) and 9(3)',
      requirement: 'Provide KFS and digitally signed borrower documents automatically.',
      field: 'KFS delivery',
      value: hasKfs ? 'Available from submitted stage' : 'Not issued yet',
      status: isDigitalFlow ? toStatus(hasKfs, true) : 'Attention',
      isCritical: true,
      action: 'Trigger KFS package (APR, tenor, obligations, penal charges) before execution.',
    },
    {
      id: 'dl-005',
      chapter: 'Chapter III - Digital Lending',
      clause: '9(3)',
      requirement: 'Disclose APR and loan terms in signed communication.',
      field: 'APR / interest disclosure',
      value: formatStatusValue(application.interestRate),
      status: isDigitalFlow ? toStatus(hasApr) : 'Attention',
      isCritical: true,
      action: 'Show APR explicitly in sanction/KFS and execution summary.',
    },
    {
      id: 'dl-006',
      chapter: 'Chapter III - Digital Lending',
      clause: '10(1) and 10(2)',
      requirement: 'Disburse to borrower account and avoid third-party pass-throughs.',
      field: 'Direct disbursal control',
      value: hasDirectDisbursalEvidence
        ? 'Direct disbursal evidence available after disbursement'
        : 'Awaiting payment evidence at current stage',
      status: isDigitalFlow ? (hasDirectDisbursalEvidence ? 'Compliant' : 'Attention') : 'Attention',
      isCritical: true,
      action: 'Keep beneficiary account ownership verification mandatory at disbursal.',
    },
    {
      id: 'dl-007',
      chapter: 'Chapter III - Digital Lending',
      clause: '11(1)',
      requirement: 'Provide minimum one-day cooling-off period with principal + proportionate APR exit.',
      field: 'Cooling-off option',
      value: 'Cooling-off disclosure pending borrower-facing acknowledgment',
      status: 'Attention',
      isCritical: false,
      action: 'Display cooling-off terms and one-time processing fee policy in KFS.',
    },
    {
      id: 'dl-008',
      chapter: 'Chapter III - Digital Lending',
      clause: '12(2) and 12(3)',
      requirement: 'Display nodal grievance officer details and complaint channels.',
      field: 'Grievance contact visibility',
      value: 'Pending borrower-level acknowledgment in active case file',
      status: isDigitalFlow ? 'Attention' : 'Attention',
      isCritical: true,
      action: 'Surface grievance contacts in KFS, DLA, and borrower summary.',
    },
    {
      id: 'dl-009',
      chapter: 'Chapter III - Technology/Data',
      clause: '13(1) to 13(4)',
      requirement: 'Explicit consent and purpose-based data collection with audit trail.',
      field: 'Consent audit trail',
      value: hasConsentAuditTrail ? 'Captured post-intake' : 'Not captured at lead stage',
      status: isDigitalFlow ? toStatus(hasConsentAuditTrail, true) : 'Attention',
      isCritical: true,
      action: 'Capture explicit purpose-wise consent with revoke control.',
    },
    {
      id: 'dl-010',
      chapter: 'Chapter III - Reporting',
      clause: '17(1)',
      requirement: 'Report all digital lending to CIC irrespective of tenor.',
      field: 'CIC reporting eligibility',
      value: hasCicReporting ? 'CIC reporting due for disbursed case' : 'Pending disbursement stage',
      status: isDigitalFlow ? toStatus(hasCicReporting, true) : 'Attention',
      isCritical: false,
      action: 'Ensure CIC payload and reporting status are recorded per loan.',
    },
    {
      id: 'mf-011',
      chapter: 'Chapter VI - Microfinance',
      clause: '66 and 67',
      requirement: 'Monthly repayment outflow must not exceed 50% of monthly household income.',
      field: 'Household indebtedness check',
      value: isMicrofinance ? 'Required for selected microfinance product' : 'Not a microfinance product',
      status: isMicrofinance ? 'Missing' : 'Attention',
      isCritical: isMicrofinance,
      action: 'Capture household income and all obligations before sanctioning microfinance loans.',
    },
    {
      id: 'pf-012',
      chapter: 'Chapter VII - Project Finance',
      clause: '75(1)',
      requirement: 'Financial closure and DCCO must be documented before disbursement.',
      field: 'Project finance controls',
      value: isProjectFinance ? 'Applicable for selected project finance product' : 'Not a project finance product',
      status: isProjectFinance ? 'Missing' : 'Attention',
      isCritical: isProjectFinance,
      action: 'Apply only for project finance products.',
    },
    {
      id: 'gold-013',
      chapter: 'Chapter IV - Gold/Silver Collateral',
      clause: '44 and 45',
      requirement: 'Maintain prescribed LTV and monitor on ongoing basis.',
      field: 'Collateral LTV monitoring',
      value: isGoldCollateral ? 'Applicable for selected gold collateral product' : 'Not a gold collateral product',
      status: isGoldCollateral ? 'Missing' : 'Attention',
      isCritical: isGoldCollateral,
      action: 'Activate only for gold/silver secured products.',
    },
    {
      id: 'dlg-014',
      chapter: 'Chapter III - DLG',
      clause: '24(1)',
      requirement: 'DLG cap should not exceed 5% of disbursed loan portfolio.',
      field: 'DLG cap governance',
      value: 'Track DLG configuration at lender-LSP portfolio level',
      status: 'Attention',
      isCritical: false,
      action: 'Enable DLG cap validation where LSP guarantee is active.',
    },
    {
      id: 'gov-015',
      chapter: 'Chapter II / Chapter III - Governance',
      clause: '5 and 18(3)',
      requirement: 'Board-approved policy and CCO certification for DLA/CIMS controls.',
      field: 'CCO / Board certification',
      value: 'Certification workflow pending explicit owner assignment',
      status: 'Attention',
      isCritical: true,
      action: 'Assign Chief Compliance Officer or Board-designated certifier before report submission.',
    },
    {
      id: 'gov-016',
      chapter: 'Chapter III - Grievance',
      clause: '12(1) to 12(3)',
      requirement: 'Nodal grievance officer designation and complaint channel visibility.',
      field: 'Nodal grievance governance',
      value: 'Role designation pending in live workflow',
      status: 'Attention',
      isCritical: true,
      action: 'Assign nodal grievance officer and track complaint closure SLA.',
    },
    {
      id: 'gov-017',
      chapter: 'Chapter XVI - e-Guarantee control',
      clause: '411(1)',
      requirement: 'Maker-checker-authorizer segregation for electronic guarantee lifecycle.',
      field: 'Segregation of duty control',
      value: isNfbFacility ? 'Applicable for selected NFB product' : 'Not an NFB product',
      status: isNfbFacility ? 'Missing' : 'Attention',
      isCritical: isNfbFacility,
      action: 'Implement maker-checker-authorizer and conflicting-role prevention in access matrix.',
    },
  ];

  const compliantCount = items.filter((item) => item.status === 'Compliant').length;
  const score = Math.round((compliantCount / items.length) * 100);
  const blockingIssues = items.filter((item) => item.isCritical && item.status !== 'Compliant').length;

  return {
    score,
    blockingIssues,
    items,
  };
}

function getRequiredItemIdsForGate(targetStage: 'intake' | 'document' | 'esign' | 'disbursal') {
  if (targetStage === 'intake') {
    return ['dl-001', 'dl-002'];
  }

  if (targetStage === 'document') {
    return ['dl-001', 'dl-002', 'dl-003', 'dl-005', 'dl-009'];
  }

  if (targetStage === 'esign') {
    return ['dl-004', 'dl-005', 'dl-008', 'dl-009'];
  }

  return ['dl-001', 'dl-002', 'dl-003', 'dl-004', 'dl-005', 'dl-006', 'dl-008', 'dl-009'];
}

export function getRBIFlowGate(
  application: LoanApplication,
  targetStage: 'intake' | 'document' | 'esign' | 'disbursal'
): RBIFlowGate {
  const profile = buildRBIComplianceProfile(application);
  const requiredIds = getRequiredItemIdsForGate(targetStage);
  const blockingItems = profile.items.filter(
    (item) => requiredIds.includes(item.id) && item.status !== 'Compliant'
  );

  if (blockingItems.length === 0) {
    return {
      canProceed: true,
      blockingItems,
      message: 'All RBI mandatory controls are satisfied for this stage.',
    };
  }

  return {
    canProceed: false,
    blockingItems,
    message: `${blockingItems.length} RBI mandatory control(s) must be resolved before moving to ${targetStage}.`,
  };
}
