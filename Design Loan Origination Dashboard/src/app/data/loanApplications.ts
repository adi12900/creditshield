import type { LoanProductType } from '../lib/rbiPolicy';
import { getRequiredDocumentsForLoanType } from '../lib/rbiPolicy';

export type LoanStage =
  | 'Lead'
  | 'Submitted'
  | 'Documents Pending'
  | 'KYC'
  | 'Underwriting'
  | 'Offer Sent'
  | 'Disbursed'
  | 'Rejected';

export interface LoanApplication {
  id: string;
  arn: string;
  borrowerName: string;
  email: string;
  phone: string;
  loanAmount: number;
  loanType: LoanProductType;
  stage: LoanStage;
  riskGrade: 'A+' | 'A' | 'B' | 'C';
  daysInStage: number;
  slaBreached: boolean;
  creditScore: number;
  kycStatus: 'Verified' | 'Pending';
  processingTime: string;
  employmentType: 'Salaried' | 'Self Employed';
  purpose: string;
  applicationDate: string;
  dob: string;
  panNumber: string;
  tenureMonths: number;
  interestRate: string;
  emi: string;
}

export interface DocumentReviewItem {
  id: string;
  type: string;
  status: 'Verified' | 'Pending OCR' | 'Flagged';
  confidence: number;
  uploadedBy: string;
  uploadDate: string;
  ocrData?: Record<string, { value: string; confidence: number }>;
  tampering?: boolean;
}

export interface CommunicationItem {
  id: string;
  type: 'email' | 'sms' | 'call';
  date: string;
  subject: string;
  preview: string;
  status: 'Delivered' | 'Completed';
  duration?: string;
}

export const loanApplications: LoanApplication[] = [
  {
    id: '1',
    arn: 'ARN202600001',
    borrowerName: 'Rajesh Kumar',
    email: 'rajesh.kumar@email.com',
    phone: '+91 90001 10001',
    loanAmount: 500000,
    loanType: 'digital_personal_loan',
    stage: 'Lead',
    riskGrade: 'A+',
    daysInStage: 1,
    slaBreached: false,
    creditScore: 730,
    kycStatus: 'Pending',
    processingTime: '0.8 days',
    employmentType: 'Salaried',
    purpose: 'Home Renovation',
    applicationDate: '05-Apr-2026',
    dob: '12-Jan-1987',
    panNumber: 'RAJKU1234A',
    tenureMonths: 24,
    interestRate: '11.9% p.a.',
    emi: '₹23,450',
  },
  {
    id: '2',
    arn: 'ARN202600002',
    borrowerName: 'Priya Sharma',
    email: 'priya.sharma@email.com',
    phone: '+91 90001 10002',
    loanAmount: 750000,
    loanType: 'microfinance_loan',
    stage: 'Lead',
    riskGrade: 'A',
    daysInStage: 2,
    slaBreached: false,
    creditScore: 710,
    kycStatus: 'Pending',
    processingTime: '1.1 days',
    employmentType: 'Salaried',
    purpose: 'Education',
    applicationDate: '06-Apr-2026',
    dob: '23-May-1989',
    panNumber: 'PRISH2345B',
    tenureMonths: 36,
    interestRate: '12.1% p.a.',
    emi: '₹24,980',
  },
  {
    id: '3',
    arn: 'ARN202600003',
    borrowerName: 'Amit Patel',
    email: 'amit.patel@email.com',
    phone: '+91 90001 10003',
    loanAmount: 1200000,
    loanType: 'project_finance',
    stage: 'Submitted',
    riskGrade: 'A',
    daysInStage: 1,
    slaBreached: false,
    creditScore: 745,
    kycStatus: 'Pending',
    processingTime: '1.4 days',
    employmentType: 'Self Employed',
    purpose: 'Business Expansion',
    applicationDate: '07-Apr-2026',
    dob: '04-Aug-1984',
    panNumber: 'AMIPA3456C',
    tenureMonths: 48,
    interestRate: '12.4% p.a.',
    emi: '₹31,600',
  },
  {
    id: '4',
    arn: 'ARN202600004',
    borrowerName: 'Vikram Singh',
    email: 'vikram.singh@email.com',
    phone: '+91 98765 43210',
    loanAmount: 850000,
    loanType: 'housing_loan',
    stage: 'Submitted',
    riskGrade: 'A+',
    daysInStage: 3,
    slaBreached: false,
    creditScore: 720,
    kycStatus: 'Verified',
    processingTime: '2.5 days',
    employmentType: 'Salaried',
    purpose: 'Business Expansion',
    applicationDate: '08-Apr-2026',
    dob: '15-Mar-1985',
    panNumber: 'ABCDE1234F',
    tenureMonths: 36,
    interestRate: '12.5% p.a.',
    emi: '₹28,450',
  },
  {
    id: '5',
    arn: 'ARN202600005',
    borrowerName: 'Neha Gupta',
    email: 'neha.gupta@email.com',
    phone: '+91 90001 10005',
    loanAmount: 650000,
    loanType: 'microfinance_loan',
    stage: 'Documents Pending',
    riskGrade: 'B',
    daysInStage: 4,
    slaBreached: true,
    creditScore: 680,
    kycStatus: 'Pending',
    processingTime: '3.1 days',
    employmentType: 'Salaried',
    purpose: 'Medical Expenses',
    applicationDate: '08-Apr-2026',
    dob: '09-Sep-1990',
    panNumber: 'NEHGU4567D',
    tenureMonths: 24,
    interestRate: '13.2% p.a.',
    emi: '₹31,250',
  },
  {
    id: '6',
    arn: 'ARN202600006',
    borrowerName: 'Arjun Reddy',
    email: 'arjun.reddy@email.com',
    phone: '+91 90001 10006',
    loanAmount: 2000000,
    loanType: 'bridge_loan',
    stage: 'Documents Pending',
    riskGrade: 'A',
    daysInStage: 2,
    slaBreached: false,
    creditScore: 780,
    kycStatus: 'Pending',
    processingTime: '1.8 days',
    employmentType: 'Self Employed',
    purpose: 'Property Expansion',
    applicationDate: '09-Apr-2026',
    dob: '17-Feb-1982',
    panNumber: 'ARJRE5678E',
    tenureMonths: 60,
    interestRate: '11.5% p.a.',
    emi: '₹45,600',
  },
  {
    id: '7',
    arn: 'ARN202600007',
    borrowerName: 'Sanjay Mehta',
    email: 'sanjay.mehta@email.com',
    phone: '+91 90001 10007',
    loanAmount: 950000,
    loanType: 'gold_collateral_loan',
    stage: 'KYC',
    riskGrade: 'B',
    daysInStage: 2,
    slaBreached: false,
    creditScore: 695,
    kycStatus: 'Verified',
    processingTime: '2.0 days',
    employmentType: 'Salaried',
    purpose: 'Vehicle Purchase',
    applicationDate: '09-Apr-2026',
    dob: '28-Nov-1988',
    panNumber: 'SANME6789F',
    tenureMonths: 36,
    interestRate: '12.9% p.a.',
    emi: '₹30,100',
  },
  {
    id: '8',
    arn: 'ARN202600008',
    borrowerName: 'Kavita Iyer',
    email: 'kavita.iyer@email.com',
    phone: '+91 90001 10008',
    loanAmount: 1100000,
    loanType: 'housing_loan',
    stage: 'KYC',
    riskGrade: 'A',
    daysInStage: 3,
    slaBreached: false,
    creditScore: 750,
    kycStatus: 'Verified',
    processingTime: '2.3 days',
    employmentType: 'Salaried',
    purpose: 'Home Interiors',
    applicationDate: '09-Apr-2026',
    dob: '11-Jun-1986',
    panNumber: 'KAVIY7890G',
    tenureMonths: 48,
    interestRate: '12.0% p.a.',
    emi: '₹29,900',
  },
  {
    id: '9',
    arn: 'ARN202600009',
    borrowerName: 'Rahul Verma',
    email: 'rahul.verma@email.com',
    phone: '+91 90001 10009',
    loanAmount: 800000,
    loanType: 'bills_discounting',
    stage: 'Underwriting',
    riskGrade: 'A+',
    daysInStage: 1,
    slaBreached: false,
    creditScore: 735,
    kycStatus: 'Verified',
    processingTime: '1.5 days',
    employmentType: 'Self Employed',
    purpose: 'Inventory Funding',
    applicationDate: '10-Apr-2026',
    dob: '03-Oct-1983',
    panNumber: 'RAHVE8901H',
    tenureMonths: 36,
    interestRate: '11.8% p.a.',
    emi: '₹26,300',
  },
  {
    id: '10',
    arn: 'ARN202600010',
    borrowerName: 'Meera Krishnan',
    email: 'meera.krishnan@email.com',
    phone: '+91 90001 10010',
    loanAmount: 1350000,
    loanType: 'acquisition_finance',
    stage: 'Underwriting',
    riskGrade: 'A',
    daysInStage: 4,
    slaBreached: true,
    creditScore: 725,
    kycStatus: 'Verified',
    processingTime: '3.4 days',
    employmentType: 'Salaried',
    purpose: 'Wedding Expenses',
    applicationDate: '10-Apr-2026',
    dob: '19-Jan-1987',
    panNumber: 'MEEKR9012J',
    tenureMonths: 60,
    interestRate: '12.3% p.a.',
    emi: '₹36,250',
  },
  {
    id: '11',
    arn: 'ARN202600011',
    borrowerName: 'Suresh Rao',
    email: 'suresh.rao@email.com',
    phone: '+91 90001 10011',
    loanAmount: 1200000,
    loanType: 'export_credit',
    stage: 'Offer Sent',
    riskGrade: 'A',
    daysInStage: 2,
    slaBreached: false,
    creditScore: 715,
    kycStatus: 'Verified',
    processingTime: '2.2 days',
    employmentType: 'Salaried',
    purpose: 'Debt Consolidation',
    applicationDate: '10-Apr-2026',
    dob: '26-Apr-1984',
    panNumber: 'SURRA0123K',
    tenureMonths: 48,
    interestRate: '12.2% p.a.',
    emi: '₹33,500',
  },
  {
    id: '12',
    arn: 'ARN202600012',
    borrowerName: 'Lakshmi Nair',
    email: 'lakshmi.nair@email.com',
    phone: '+91 90001 10012',
    loanAmount: 900000,
    loanType: 'nbfc_finance',
    stage: 'Offer Sent',
    riskGrade: 'B',
    daysInStage: 1,
    slaBreached: false,
    creditScore: 665,
    kycStatus: 'Verified',
    processingTime: '1.9 days',
    employmentType: 'Self Employed',
    purpose: 'Shop Renovation',
    applicationDate: '10-Apr-2026',
    dob: '30-Jul-1989',
    panNumber: 'LAKNA1234L',
    tenureMonths: 36,
    interestRate: '13.0% p.a.',
    emi: '₹29,100',
  },
  {
    id: '13',
    arn: 'ARN202600013',
    borrowerName: 'Karthik Menon',
    email: 'karthik.menon@email.com',
    phone: '+91 90001 10013',
    loanAmount: 1500000,
    loanType: 'nfb_facility',
    stage: 'Disbursed',
    riskGrade: 'A+',
    daysInStage: 0,
    slaBreached: false,
    creditScore: 760,
    kycStatus: 'Verified',
    processingTime: '0.9 days',
    employmentType: 'Salaried',
    purpose: 'Home Purchase',
    applicationDate: '11-Apr-2026',
    dob: '21-Feb-1985',
    panNumber: 'KARME2345M',
    tenureMonths: 60,
    interestRate: '11.4% p.a.',
    emi: '₹39,400',
  },
  {
    id: '14',
    arn: 'ARN202600014',
    borrowerName: 'Pooja Desai',
    email: 'pooja.desai@email.com',
    phone: '+91 90001 10014',
    loanAmount: 700000,
    loanType: 'loan_against_financial_assets',
    stage: 'Disbursed',
    riskGrade: 'B',
    daysInStage: 0,
    slaBreached: false,
    creditScore: 690,
    kycStatus: 'Verified',
    processingTime: '1.0 days',
    employmentType: 'Salaried',
    purpose: 'Two Wheeler Purchase',
    applicationDate: '11-Apr-2026',
    dob: '08-Dec-1991',
    panNumber: 'POODE3456N',
    tenureMonths: 24,
    interestRate: '12.8% p.a.',
    emi: '₹31,200',
  },
  {
    id: '15',
    arn: 'ARN202600015',
    borrowerName: 'Anil Kumar',
    email: 'anil.kumar@email.com',
    phone: '+91 90001 10015',
    loanAmount: 1100000,
    loanType: 'overseas_jv_credit',
    stage: 'Rejected',
    riskGrade: 'C',
    daysInStage: 1,
    slaBreached: false,
    creditScore: 640,
    kycStatus: 'Verified',
    processingTime: '2.7 days',
    employmentType: 'Self Employed',
    purpose: 'Working Capital',
    applicationDate: '11-Apr-2026',
    dob: '14-Apr-1982',
    panNumber: 'ANIKU4567P',
    tenureMonths: 36,
    interestRate: '13.6% p.a.',
    emi: '₹36,900',
  },
];

let runtimeLoanApplications: LoanApplication[] = [...loanApplications];

export function setRuntimeLoanApplications(applications: LoanApplication[]) {
  runtimeLoanApplications = applications.length > 0 ? applications : [...loanApplications];
}

export function getLoanApplications() {
  return runtimeLoanApplications;
}

export const defaultApplicationArn = 'ARN202600004';

export function getLoanApplicationByArn(arn?: string | null) {
  return runtimeLoanApplications.find((application) => application.arn === arn) ?? runtimeLoanApplications[3] ?? loanApplications[3];
}

export function getApplicationDisplayStatus(application: LoanApplication) {
  if (application.stage === 'Disbursed') {
    return 'Completed';
  }

  if (application.stage === 'Rejected') {
    return 'Rejected';
  }

  return 'In Progress';
}

export function createDocumentReviewItems(application: LoanApplication): DocumentReviewItem[] {
  const requiredDocuments = getRequiredDocumentsForLoanType(application.loanType);
  const generatedRequiredDocs = requiredDocuments.map((docType, index) => ({
    id: `${index + 1}`,
    type: docType,
    status: 'Verified' as const,
    confidence: Math.max(88, 99 - index),
    uploadedBy: application.borrowerName,
    uploadDate: '2026-04-09',
  }));

  return [
    {
      id: '901',
      type: 'Aadhaar Card',
      status: 'Verified',
      confidence: 98,
      uploadedBy: application.borrowerName,
      uploadDate: '2026-04-08',
      ocrData: {
        'Aadhaar Number': { value: '1234 5678 9012', confidence: 98 },
        Name: { value: application.borrowerName.toUpperCase(), confidence: 99 },
        DOB: { value: application.dob.replace(/-/g, '/'), confidence: 97 },
        Address: { value: 'Mumbai, Maharashtra', confidence: 92 },
      },
    },
    {
      id: '902',
      type: 'PAN Card',
      status: 'Verified',
      confidence: 96,
      uploadedBy: application.borrowerName,
      uploadDate: '2026-04-08',
      ocrData: {
        'PAN Number': { value: application.panNumber, confidence: 99 },
        Name: { value: application.borrowerName.toUpperCase(), confidence: 97 },
        DOB: { value: application.dob.replace(/-/g, '/'), confidence: 95 },
      },
    },
    {
      id: '903',
      type: 'Bank Statement (3 months)',
      status: 'Verified',
      confidence: 94,
      uploadedBy: application.borrowerName,
      uploadDate: '2026-04-08',
      ocrData: {
        'Account Number': { value: '1234567890', confidence: 98 },
        'Account Holder': { value: application.borrowerName.toUpperCase(), confidence: 99 },
        'Average Balance': { value: '₹2,45,000', confidence: 91 },
      },
    },
    {
      id: '904',
      type: 'Salary Slips (3 months)',
      status: 'Verified',
      confidence: 93,
      uploadedBy: application.borrowerName,
      uploadDate: '2026-04-09',
      ocrData: {
        'Employee Name': { value: application.borrowerName.toUpperCase(), confidence: 99 },
        'Net Salary': { value: '₹75,000', confidence: 96 },
        Employer: { value: application.employmentType === 'Salaried' ? 'Tech Corp India Ltd' : 'Self Employed', confidence: 94 },
      },
    },
    ...generatedRequiredDocs,
  ];
}

export function createCommunicationHistory(application: LoanApplication): CommunicationItem[] {
  return [
    {
      id: '1',
      type: 'email',
      date: '2026-04-10 10:30 AM',
      subject: 'Application Approved',
      preview: `${application.borrowerName}'s loan application has been approved for ARN ${application.arn}...`,
      status: 'Delivered',
    },
    {
      id: '2',
      type: 'sms',
      date: '2026-04-10 09:15 AM',
      subject: 'Final Document Upload',
      preview: `Please upload your ITR documents for ${application.arn}...`,
      status: 'Delivered',
    },
    {
      id: '3',
      type: 'call',
      date: '2026-04-09 04:30 PM',
      subject: 'Verification Call',
      preview: 'Verified employment details and income consistency',
      status: 'Completed',
      duration: '8 min',
    },
    {
      id: '4',
      type: 'email',
      date: '2026-04-09 02:15 PM',
      subject: 'Document Submission Confirmation',
      preview: `We have received your bank statements for ${application.borrowerName}...`,
      status: 'Delivered',
    },
    {
      id: '5',
      type: 'sms',
      date: '2026-04-09 11:00 AM',
      subject: 'Application in Progress',
      preview: `Your application ${application.arn} is under review...`,
      status: 'Delivered',
    },
    {
      id: '6',
      type: 'email',
      date: '2026-04-08 03:20 PM',
      subject: 'Document Request',
      preview: `Please submit your bank statements for ${application.borrowerName}...`,
      status: 'Delivered',
    },
    {
      id: '7',
      type: 'call',
      date: '2026-04-08 01:45 PM',
      subject: 'Welcome Call',
      preview: 'Introduced loan process and requirements',
      status: 'Completed',
      duration: '12 min',
    },
    {
      id: '8',
      type: 'sms',
      date: '2026-04-08 09:30 AM',
      subject: 'Application Received',
      preview: `Thank you for applying. ARN: ${application.arn}`,
      status: 'Delivered',
    },
  ];
}
