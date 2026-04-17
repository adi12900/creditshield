import { workflowApi, type WorkflowApplication } from '../../lib/workflowApi';

export interface CibilAccount {
  bank: string;
  accountType: string;
  accountNumber: string;
  ownership: string;
  creditLimit: number;
  sanctionedAmount: number;
  currentBalance: number;
  cashLimit: number;
  amountOverdue: number;
  rateOfInterest: string;
  repaymentTenure: string;
  emiAmount: number;
  paymentFrequency: 'Monthly';
  actualPaymentAmount: number;
  dateOpened: string;
  lastPaymentDate: string;
  dateClosed: string;
  dateReported: string;
  paymentHistory: PaymentMonthStatus[];
  dpd: DpdYearRow[];
  collateralValue: number;
  collateralType: string;
  suitFiled: 'Yes' | 'No';
  writtenOff: 'Yes' | 'No';
  settlement: 'Yes' | 'No';
}

export type PaymentStatus = '0' | 'XXX' | '-';

export interface PaymentMonthStatus {
  month: string;
  status: PaymentStatus;
}

export interface DpdYearRow {
  year: number;
  jan: PaymentStatus;
  feb: PaymentStatus;
  mar: PaymentStatus;
  apr: PaymentStatus;
  may: PaymentStatus;
  jun: PaymentStatus;
  jul: PaymentStatus;
  aug: PaymentStatus;
  sep: PaymentStatus;
  oct: PaymentStatus;
  nov: PaymentStatus;
  dec: PaymentStatus;
}

export interface CibilListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  cibilScore: number;
}

export interface CibilReportData extends CibilListItem {
  controlNumber: string;
  reportDate: string;
  isCibilVerified: boolean;
  dob: string;
  gender: 'Male' | 'Female';
  pan: string;
  addresses: string[];
  employmentType: string;
  employerName: string;
  accounts: CibilAccount[];
}

interface SyntheticFields {
  pan: string;
  dob: string;
  gender: 'Male' | 'Female';
  addresses: string[];
  employerName: string;
  accounts: CibilAccount[];
}

const syntheticCache = new Map<string, SyntheticFields>();

const EMPLOYERS = ['Vertex Systems', 'BlueOrbit Tech', 'NexFin Services', 'Aria Logistics', 'CoreAxis Retail'];
const BANKS = ['HDFC Bank', 'ICICI Bank', 'Axis Bank', 'SBI', 'Kotak Mahindra'];
const ACCOUNT_TYPES = ['Personal Loan', 'Credit Card', 'Consumer Durable Loan', 'Auto Loan'];
const OWNERSHIP_TYPES = ['Individual', 'Joint'];
const COLLATERAL_TYPES = ['Unsecured', 'Vehicle', 'Property'];
const ADDRESSES = [
  '22, Lake View Road, Bengaluru - 560034',
  'A-54, Green Park, New Delhi - 110016',
  '701, Orchid Residency, Mumbai - 400067',
  '12/4, MG Road, Pune - 411001',
  '3rd Floor, Sunrise Enclave, Hyderabad - 500081',
];

function pickOne<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generatePAN(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const randomLetters = () => letters[Math.floor(Math.random() * letters.length)];

  return (
    randomLetters() +
    randomLetters() +
    randomLetters() +
    randomLetters() +
    randomLetters() +
    Math.floor(1000 + Math.random() * 9000) +
    randomLetters()
  );
}

export function generateDOB(): string {
  const start = new Date(1975, 0, 1);
  const end = new Date(2003, 0, 1);
  const dob = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return dob.toLocaleDateString('en-GB');
}

export function generateGender(): 'Male' | 'Female' {
  const genders: Array<'Male' | 'Female'> = ['Male', 'Female'];
  return genders[Math.floor(Math.random() * genders.length)];
}

function generatePaymentHistory(score: number): PaymentMonthStatus[] {
  const result: PaymentMonthStatus[] = [];
  const now = new Date();

  for (let i = 35; i >= 0; i -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = monthDate.toLocaleString('en-US', { month: 'short', year: '2-digit' }).toUpperCase();

    const roll = Math.random();
    let status: PaymentStatus = '0';

    if (score >= 750) {
      if (roll < 0.8) status = '0';
      else if (roll < 0.95) status = '-';
      else status = 'XXX';
    } else if (score >= 650) {
      if (roll < 0.65) status = '0';
      else if (roll < 0.85) status = '-';
      else status = 'XXX';
    } else {
      if (roll < 0.45) status = '0';
      else if (roll < 0.65) status = '-';
      else status = 'XXX';
    }

    result.push({ month: label, status });
  }

  return result;
}

function generateDpdRows(score: number): DpdYearRow[] {
  const years = [2022, 2023, 2024];

  const generateValue = (): PaymentStatus => {
    const roll = Math.random();

    if (score >= 750) {
      if (roll < 0.85) return '0';
      if (roll < 0.95) return '-';
      return 'XXX';
    }

    if (score >= 650) {
      if (roll < 0.65) return '0';
      if (roll < 0.85) return '-';
      return 'XXX';
    }

    if (roll < 0.45) return '0';
    if (roll < 0.65) return '-';
    return 'XXX';
  };

  return years.map((year) => ({
    year,
    jan: generateValue(),
    feb: generateValue(),
    mar: generateValue(),
    apr: generateValue(),
    may: generateValue(),
    jun: generateValue(),
    jul: generateValue(),
    aug: generateValue(),
    sep: generateValue(),
    oct: generateValue(),
    nov: generateValue(),
    dec: generateValue(),
  }));
}

function randomDateInLastYears(yearsBack: number): string {
  const now = new Date();
  const start = new Date(now.getFullYear() - yearsBack, 0, 1).getTime();
  const end = now.getTime();
  const date = new Date(start + Math.random() * (end - start));
  return date.toLocaleDateString('en-GB');
}

function maskAccountNumber(): string {
  const last4 = String(randomBetween(1000, 9999));
  return `XXXXXX${last4}`;
}

function generateAccounts(score: number): CibilAccount[] {
  const count = randomBetween(2, 4);
  const accounts: CibilAccount[] = [];

  for (let i = 0; i < count; i += 1) {
    const amount = randomBetween(5000, 250000);
    const closedBias = score >= 720 ? 0.5 : 0.3;
    const isClosed = Math.random() < closedBias;
    const balance = isClosed ? 0 : randomBetween(500, Math.max(2000, Math.floor(amount * 0.6)));
    const emiAmount = randomBetween(1200, Math.max(2000, Math.floor(amount / 10)));
    const overdue = isClosed ? 0 : randomBetween(0, Math.floor(emiAmount * 2));
    const openedDate = randomDateInLastYears(8);
    const lastPaymentDate = randomDateInLastYears(2);
    const dateClosed = isClosed ? randomDateInLastYears(1) : '--';
    const dateReported = new Date().toLocaleDateString('en-GB');

    accounts.push({
      bank: pickOne(BANKS),
      accountType: pickOne(ACCOUNT_TYPES),
      accountNumber: maskAccountNumber(),
      ownership: pickOne(OWNERSHIP_TYPES),
      creditLimit: randomBetween(Math.floor(amount * 0.5), amount),
      sanctionedAmount: amount,
      currentBalance: balance,
      cashLimit: randomBetween(0, Math.floor(amount * 0.25)),
      amountOverdue: overdue,
      rateOfInterest: `${randomBetween(9, 22)}%`,
      repaymentTenure: `${randomBetween(12, 84)} months`,
      emiAmount,
      paymentFrequency: 'Monthly',
      actualPaymentAmount: randomBetween(Math.floor(emiAmount * 0.75), emiAmount),
      dateOpened: openedDate,
      lastPaymentDate,
      dateClosed,
      dateReported,
      paymentHistory: generatePaymentHistory(score),
      dpd: generateDpdRows(score),
      collateralValue: randomBetween(0, Math.floor(amount * 1.5)),
      collateralType: pickOne(COLLATERAL_TYPES),
      suitFiled: Math.random() < 0.1 ? 'Yes' : 'No',
      writtenOff: Math.random() < 0.08 ? 'Yes' : 'No',
      settlement: Math.random() < 0.12 ? 'Yes' : 'No',
    });
  }

  return accounts;
}

function getSyntheticFields(id: string, score: number): SyntheticFields {
  const cached = syntheticCache.get(id);
  if (cached) return cached;

  try {
    const persisted = localStorage.getItem(`cibil.synthetic.${id}`);
    if (persisted) {
      const parsed = JSON.parse(persisted) as SyntheticFields;
      syntheticCache.set(id, parsed);
      return parsed;
    }
  } catch {
    // Ignore localStorage/parse issues and generate fresh synthetic fields.
  }

  const generated: SyntheticFields = {
    pan: generatePAN(),
    dob: generateDOB(),
    gender: generateGender(),
    addresses: [pickOne(ADDRESSES), pickOne(ADDRESSES)],
    employerName: pickOne(EMPLOYERS),
    accounts: generateAccounts(score),
  };

  syntheticCache.set(id, generated);
  try {
    localStorage.setItem(`cibil.synthetic.${id}`, JSON.stringify(generated));
  } catch {
    // Ignore persistence failure; in-memory cache still works for current session.
  }
  return generated;
}

function fallbackEmail(name: string): string {
  return `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
}

function normalizeBase(application: WorkflowApplication): CibilListItem {
  const extended = application as WorkflowApplication & {
    id?: number | string;
    applicant_name?: string;
    email?: string;
    phone?: string;
    borrower_phone?: string;
    cibilScore?: number;
  };

  const id = String(extended.id ?? application.arn);
  const name = extended.applicant_name ?? application.borrower_name;
  const email = extended.email ?? fallbackEmail(name);
  const phone = extended.phone ?? extended.borrower_phone ?? '+91 90000 00000';
  const cibilScore = extended.cibilScore ?? application.credit_score ?? 700;

  return {
    id,
    name,
    email,
    phone,
    cibilScore,
  };
}

function toControlNumber(id: string): string {
  const numeric = id.replace(/\D/g, '').slice(-10) || `${Math.floor(1000000000 + Math.random() * 9000000000)}`;
  return `CN-${numeric.padStart(10, '0')}`;
}

function toReportData(application: WorkflowApplication): CibilReportData {
  const base = normalizeBase(application);
  const synthetic = getSyntheticFields(base.id, base.cibilScore);

  return {
    ...base,
    controlNumber: toControlNumber(base.id),
    reportDate: new Date().toLocaleDateString('en-GB'),
    isCibilVerified: Boolean(application.is_cibil_verified),
    dob: synthetic.dob,
    gender: synthetic.gender,
    pan: synthetic.pan,
    addresses: synthetic.addresses,
    employmentType: application.employment_type,
    employerName: synthetic.employerName,
    accounts: synthetic.accounts,
  };
}

export async function fetchCibilList(): Promise<CibilListItem[]> {
  const rows = await workflowApi.listApplications();
  return rows.map((row) => normalizeBase(row));
}

export async function fetchCibilReportById(id: string): Promise<CibilReportData> {
  const row = await workflowApi.getApplication(id);
  return toReportData(row);
}

export function getCibilStatus(score: number): 'Good' | 'Average' | 'Risky' {
  if (score >= 750) return 'Good';
  if (score >= 650) return 'Average';
  return 'Risky';
}

export function getCibilScoreColor(score: number): string {
  if (score >= 750) return 'text-green-700 bg-green-100 border-green-200';
  if (score >= 650) return 'text-amber-700 bg-amber-100 border-amber-200';
  return 'text-red-700 bg-red-100 border-red-200';
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}
