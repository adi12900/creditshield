const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const AUTH_TOKEN_KEY = 'creditshield_access_token';

export type WorkflowRole =
  | 'loan_officer'
  | 'credit_analyst'
  | 'underwriter'
  | 'compliance_officer';

async function request<T>(path: string, options: RequestInit = {}, role?: string): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      detail = body?.detail || detail;
    } catch {
      // Ignore parse errors and keep generic message.
    }
    throw new Error(detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
  full_name: string;
  expires_in_seconds: number;
}

export interface WorkflowApplication {
  arn: string;
  borrower_name: string;
  loan_amount: number;
  stage: string;
  risk_grade: 'A+' | 'A' | 'B' | 'C';
  credit_score: number;
  kyc_status: 'Verified' | 'Pending';
  employment_type: 'Salaried' | 'Self Employed';
  purpose: string;
}

export interface WorkflowDashboardResponse {
  role: WorkflowRole;
  stats: Array<{ key: string; value: number | string }>;
}

export interface WorkflowBureauReport {
  arn: string;
  credit_score: number;
  tradelines: Array<{
    lender: string;
    type: string;
    limit: number;
    balance: number;
    status: string;
    dpd: number;
  }>;
  score_trend: Array<{ month: string; score: number }>;
}

export interface WorkflowAiScore {
  arn: string;
  composite_score: number;
  confidence_percent: number;
  risk_grade: 'A+' | 'A' | 'B' | 'C';
  decision: 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'AUTO_REJECT';
  reason_codes: string[];
  model_source?: string;
  appraisal_available?: boolean;
  actual_appraisal?: {
    available?: boolean;
    final_score?: number | null;
    risk_level?: string | null;
    recommendation?: string | null;
    confidence_score?: number | null;
    rows_analyzed?: number | null;
    analysis_period?: {
      period_start?: string;
      period_end?: string;
      month_count?: number | string;
    };
    monthly_balance_table?: Array<{
      month: string;
      credit: number;
      debit: number;
      savings: number;
      balance_remaining: number;
      opening_balance?: number;
    }>;
    opening_outstanding_before_first_month?: number | null;
    income_analysis?: Record<string, unknown>;
    cashflow_analysis?: Record<string, unknown>;
    liability_analysis?: Record<string, unknown>;
    loan_analysis?: Record<string, unknown>;
    behavioral_risk?: Record<string, unknown>;
    salary_diagnostics?: Record<string, unknown>;
    borrower_kpis?: Record<string, unknown>;
    co_applicant_kpis?: Record<string, unknown>;
    borrower_salary_diagnostics?: Record<string, unknown>;
    co_applicant_salary_diagnostics?: Record<string, unknown>;
    kpi_metrics?: Record<string, unknown>;
    rulebook_top_insights?: string[];
    report_pdf_access_url?: string | null;
    report_text?: string | null;
    month_count?: number;
  } | null;
}

export interface WorkflowKycAml {
  arn: string;
  kyc_status: 'Verified' | 'Pending' | string;
  aml_status: string;
  fraud_score: number;
  can_clear_hold: boolean;
}

export interface WorkflowDocumentItem {
  id: string;
  type: string;
  status: 'Verified' | 'Pending OCR' | 'Flagged';
  confidence: number;
}

export interface WorkflowCommunicationItem {
  id: string;
  channel: 'email' | 'sms' | 'call';
  subject: string;
  message: string;
  sent_at: string;
  upload_token?: string;
  upload_link?: string;
  expires_at?: string;
  status?: string;
}

export type AdminUserRole = 'loan_officer' | 'credit_analyst' | 'underwriter' | 'compliance_officer';

export interface AdminCreateUserRequest {
  full_name: string;
  email: string;
  role: AdminUserRole;
  password: string;
  is_active: boolean;
}

export interface AdminUserResponse {
  id: number;
  full_name: string;
  email: string;
  role: AdminUserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const workflowApi = {
  login: (username: string, password: string) =>
    request<LoginResponse>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  createUser: (payload: AdminCreateUserRequest) =>
    request<AdminUserResponse>('/api/v1/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  listApplications: () => request<WorkflowApplication[]>('/api/v1/workflow/applications'),
  getApplication: (arn: string) => request<WorkflowApplication>(`/api/v1/workflow/applications/${arn}`),

  loanOfficerDashboard: (role: WorkflowRole) => request<WorkflowDashboardResponse>('/api/v1/workflow/loan-officer/dashboard', {}, role),
  creditAnalystDashboard: (role: WorkflowRole) => request<WorkflowDashboardResponse>('/api/v1/workflow/credit-analyst/dashboard', {}, role),
  underwriterDashboard: (role: WorkflowRole) => request<WorkflowDashboardResponse>('/api/v1/workflow/underwriter/dashboard', {}, role),
  complianceDashboard: (role: WorkflowRole) => request<WorkflowDashboardResponse>('/api/v1/workflow/compliance/dashboard', {}, role),
  getBureauReport: (arn: string, role: WorkflowRole) => request<WorkflowBureauReport>(`/api/v1/workflow/credit-analyst/bureau/${arn}`, {}, role),
  getAiScore: (arn: string, role: WorkflowRole) => request<WorkflowAiScore>(`/api/v1/workflow/credit-analyst/ai-score/${arn}`, {}, role),
  getUnderwriterDecisionEngine: (arn: string, role: WorkflowRole) => request(`/api/v1/workflow/underwriter/decision-engine/${arn}`, {}, role),
  getDocuments: (arn: string, role: WorkflowRole) => request<WorkflowDocumentItem[]>(`/api/v1/workflow/loan-officer/documents/${arn}`, {}, role),
  reviewDocument: (arn: string, documentId: string, decision: 'approve' | 'reject', role: WorkflowRole, reason?: string) =>
    request<WorkflowDocumentItem>(`/api/v1/workflow/loan-officer/documents/${arn}/review`, {
      method: 'POST',
      body: JSON.stringify({ document_id: documentId, decision, reason }),
    }, role),
  getCommunications: (arn: string, role: WorkflowRole) => request<WorkflowCommunicationItem[]>(`/api/v1/workflow/loan-officer/communications/${arn}`, {}, role),
  sendCommunication: (arn: string, role: WorkflowRole, channel: 'email' | 'sms' | 'call', subject: string, message: string) =>
    request<WorkflowCommunicationItem>(`/api/v1/workflow/loan-officer/communications/${arn}/send`, {
      method: 'POST',
      body: JSON.stringify({ channel, subject, message }),
    }, role),
  moveLeadToIntake: (arn: string, role: WorkflowRole) =>
    request(`/api/v1/workflow/loan-officer/leads/${arn}/move-to-intake`, { method: 'POST' }, role),
  submitIntake: (arn: string, role: WorkflowRole) =>
    request(`/api/v1/workflow/loan-officer/intake/${arn}/submit`, { method: 'POST' }, role),
  sendEsignLink: (arn: string, role: WorkflowRole) =>
    request(`/api/v1/workflow/loan-officer/esign/${arn}/send-link`, { method: 'POST' }, role),

  recalculateRatios: (arn: string, role: WorkflowRole, payload: {
    monthly_income: number;
    existing_obligations: number;
    proposed_emi: number;
    loan_amount: number;
    asset_value: number;
  }) =>
    request(`/api/v1/workflow/credit-analyst/ratios/${arn}/recalculate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, role),
  saveCreditMemoDraft: (arn: string, role: WorkflowRole, payload: Record<string, unknown>) =>
    request(`/api/v1/workflow/credit-analyst/memo/${arn}/draft`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, role),
  submitCreditMemo: (arn: string, role: WorkflowRole, payload: Record<string, unknown>) =>
    request(`/api/v1/workflow/credit-analyst/memo/${arn}/submit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, role),

  generateLoanOffer: (arn: string, role: WorkflowRole, payload: { loan_amount: number; tenure_months: number; interest_rate: number }) =>
    request(`/api/v1/workflow/underwriter/loan-structuring/${arn}/offer`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, role),
  submitPolicyOverride: (arn: string, role: WorkflowRole, payload: Record<string, unknown>) =>
    request(`/api/v1/workflow/underwriter/policy-override/${arn}/submit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, role),

  getKycAml: (arn: string, role: WorkflowRole) => request<WorkflowKycAml>(`/api/v1/workflow/compliance/kyc-aml/${arn}`, {}, role),
  clearComplianceHold: (arn: string, role: WorkflowRole, reason: string) =>
    request(`/api/v1/workflow/compliance/kyc-aml/${arn}/clear-hold`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }, role),
  getFraudSignals: (arn: string, role: WorkflowRole) => request(`/api/v1/workflow/compliance/fraud-signals/${arn}`, {}, role),
  markFraudFalsePositive: (arn: string, role: WorkflowRole, reason: string) =>
    request(`/api/v1/workflow/compliance/fraud-signals/${arn}/false-positive`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }, role),
  getAuditLogs: (role: WorkflowRole) => request('/api/v1/workflow/compliance/audit-logs', {}, role),
  getRegulatoryReports: (role: WorkflowRole) => request('/api/v1/workflow/compliance/regulatory-reports', {}, role),
  generateRegulatoryReport: (role: WorkflowRole, payload: { name: string; report_type: string; reporting_period: string }) =>
    request('/api/v1/workflow/compliance/regulatory-reports/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    }, role),
  getRbiCompliance: (arn: string, role: WorkflowRole) => request(`/api/v1/workflow/compliance/rbi-compliance/${arn}`, {}, role),
  getRbiAuditExport: (arn: string, role: WorkflowRole) => request(`/api/v1/workflow/compliance/rbi-audit-export/${arn}`, {}, role),
};
