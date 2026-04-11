export type LoanProductType =
  | 'digital_personal_loan'
  | 'microfinance_loan'
  | 'gold_collateral_loan'
  | 'housing_loan'
  | 'project_finance'
  | 'nbfc_finance'
  | 'export_credit'
  | 'nfb_facility'
  | 'loan_against_financial_assets'
  | 'bills_discounting'
  | 'acquisition_finance'
  | 'overseas_jv_credit'
  | 'bridge_loan';

export interface LoanProductPolicy {
  type: LoanProductType;
  label: string;
  rbiChapter: string;
  keyControls: string[];
}

export const loanProductPolicies: LoanProductPolicy[] = [
  {
    type: 'digital_personal_loan',
    label: 'Digital Personal Loan',
    rbiChapter: 'Chapter III - Digital Lending',
    keyControls: ['KFS/APR disclosure', 'Cooling-off period', 'Direct borrower disbursal', 'Consent and grievance controls'],
  },
  {
    type: 'microfinance_loan',
    label: 'Microfinance Loan',
    rbiChapter: 'Chapter VI - Microfinance',
    keyControls: ['Household income assessment', '50% repayment cap', 'Collateral-free design', 'CIC reporting'],
  },
  {
    type: 'gold_collateral_loan',
    label: 'Gold/Silver Collateral Loan',
    rbiChapter: 'Chapter IV - Gold and Silver Collateral',
    keyControls: ['LTV cap by ticket size', 'Ownership and purity validation', 'Collateral valuation standards', 'Top-up/renewal rules'],
  },
  {
    type: 'housing_loan',
    label: 'Housing Finance Loan',
    rbiChapter: 'Chapter VIII(B) - Housing Finance',
    keyControls: ['LTV and risk weight norms', 'Sanctioned plan controls', 'Progress-linked disbursement', 'Builder disclosures'],
  },
  {
    type: 'project_finance',
    label: 'Project Finance Exposure',
    rbiChapter: 'Chapter VII - Project Finance',
    keyControls: ['Financial closure before disbursal', 'DCCO governance', 'Land/approval prerequisites', 'Project data maintenance'],
  },
  {
    type: 'nbfc_finance',
    label: 'Finance to NBFC',
    rbiChapter: 'Chapter XIV - Finance to NBFCs',
    keyControls: ['Eligibility and prohibited activity checks', 'Prudential exposure controls', 'Regulatory classification controls'],
  },
  {
    type: 'export_credit',
    label: 'Export Credit',
    rbiChapter: 'Chapter XV - Export Credit',
    keyControls: ['Pre/post shipment controls', 'End-use and realization checks', 'FX compliance controls'],
  },
  {
    type: 'nfb_facility',
    label: 'Non-Fund Based Facility',
    rbiChapter: 'Chapter XVI - NFB Facilities',
    keyControls: ['Guarantee issuance controls', 'Maker-checker-authorizer', 'e-Guarantee controls', 'Audit coverage'],
  },
  {
    type: 'loan_against_financial_assets',
    label: 'Loan Against Financial Assets',
    rbiChapter: 'Chapter XIII - Financial Assets',
    keyControls: ['Exposure and margin norms', 'Capital market linked restrictions', 'Borrower category controls'],
  },
  {
    type: 'bills_discounting',
    label: 'Bills Discounting / Rediscounting',
    rbiChapter: 'Chapter X - Bills Discounting',
    keyControls: ['Genuine trade transaction checks', 'LC and recourse controls', 'Accommodation bill prevention'],
  },
  {
    type: 'acquisition_finance',
    label: 'Acquisition Finance',
    rbiChapter: 'Chapter XI - Acquisition Finance',
    keyControls: ['Board approval for specific cases', 'Lock-in and pledge controls', 'Promoter funding restrictions'],
  },
  {
    type: 'overseas_jv_credit',
    label: 'Overseas JV/WOS Credit',
    rbiChapter: 'Chapter XII - Overseas JV/WOS',
    keyControls: ['FEMA and country risk controls', 'Project viability and security controls'],
  },
  {
    type: 'bridge_loan',
    label: 'Bridge Loan',
    rbiChapter: 'Chapter XVII(C) - Bridge Loans',
    keyControls: ['Purpose/end-use checks', 'Repayment source visibility', 'Exposure governance'],
  },
];

export const roleAccountabilityMatrix = [
  {
    role: 'Board / Board Credit Committee',
    accountabilities: ['Policy approval across credit categories', 'Governance oversight', 'Delegated certifier nomination'],
  },
  {
    role: 'Chief Compliance Officer',
    accountabilities: ['CIMS/DLA certification', 'Regulatory submission sign-off', 'Compliance breach escalation'],
  },
  {
    role: 'Nodal Grievance Officer',
    accountabilities: ['Complaint channel visibility', 'Complaint turnaround governance', 'RBI CMS escalation readiness'],
  },
  {
    role: 'LSP Governance Officer',
    accountabilities: ['LSP due diligence', 'Contractual control enforcement', 'Periodic conduct review'],
  },
  {
    role: 'Data Protection Officer',
    accountabilities: ['Consent and data minimization controls', 'Data residency governance', 'Security incident readiness'],
  },
  {
    role: 'Recovery Governance Officer',
    accountabilities: ['Recovery conduct controls', 'Agent assignment notification controls', 'Recovery audit trail controls'],
  },
  {
    role: 'Internal Auditor',
    accountabilities: ['RBIA and concurrent audit coverage', 'Segregation of duty testing', 'Control gap reporting'],
  },
];

const commonCoreDocs = ['KYC ID Proof', 'Address Proof', 'PAN', 'Bank Statement (3 months)', 'Borrower Photograph'];

const docsByLoanType: Record<LoanProductType, string[]> = {
  digital_personal_loan: [...commonCoreDocs, 'Income Proof / Salary Slip', 'KFS Acknowledgment', 'Cooling-off Disclosure Acknowledgment'],
  microfinance_loan: [...commonCoreDocs, 'Household Income Declaration', 'Household Obligation Declaration', 'Collateral-Free Undertaking'],
  gold_collateral_loan: [...commonCoreDocs, 'Collateral Ownership Declaration', 'Purity/Assay Certificate', 'LTV Computation Sheet'],
  housing_loan: [...commonCoreDocs, 'Property Documents', 'Sanctioned Building Plan', 'Builder Disclosure and NOC', 'Stage-wise Disbursement Plan'],
  project_finance: ['Financial Closure Document', 'DCCO Document', 'Approvals/Clearances Pack', 'Land Availability Proof', 'TEV Report'],
  nbfc_finance: ['NBFC Registration/Exemption Evidence', 'End-use Declaration', 'Prudential Exposure Note', 'Prohibited Activity Check Memo'],
  export_credit: ['Export Order / LC', 'Shipment/Invoice Evidence', 'FX Compliance Declaration', 'Realisation Tracking Sheet'],
  nfb_facility: ['Guarantee/LC Request', 'Obligor Profile', 'Maker-Checker-Authorizer Log', 'e-Guarantee Audit Trail'],
  loan_against_financial_assets: [...commonCoreDocs, 'Asset Holding Statement', 'Margin Computation', 'Exposure Limit Check'],
  bills_discounting: ['Underlying Trade Invoice', 'Bill of Exchange', 'LC/Recourse Confirmation', 'Authenticity Verification Note'],
  acquisition_finance: ['Board Approval Note', 'Acquisition Term Sheet', 'Lock-in/Pledge Documentation', 'Promoter Contribution Proof'],
  overseas_jv_credit: ['Overseas Entity Documents', 'Country Risk Note', 'FEMA Compliance Checklist', 'Project Viability Assessment'],
  bridge_loan: ['Receivable Proof', 'Bridge Loan Purpose Note', 'Repayment Source Confirmation', 'Exposure Control Note'],
};

export function getRequiredDocumentsForLoanType(loanType: LoanProductType) {
  return docsByLoanType[loanType];
}

export function getLoanPolicy(loanType: LoanProductType) {
  return loanProductPolicies.find((policy) => policy.type === loanType);
}
