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
  borrower_email?: string | null;
  borrower_phone?: string | null;
  loan_amount: number;
  loan_type?: string;
  stage: string;
  risk_grade: 'A+' | 'A' | 'B' | 'C';
  credit_score: number;
  kyc_status: 'Verified' | 'Pending';
  employment_type: 'Salaried' | 'Self Employed';
  purpose: string;
  created_at?: string;
  updated_at?: string;
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
}

export interface LoanOfficerChecklistItem {
  id: string;
  item: string;
  done: boolean;
}

export interface CommunicationTemplateItem {
  id: string;
  name: string;
  category: string;
  channel: 'email' | 'sms' | 'call';
  subject: string;
  body: string;
}

export interface LoanOfficerApplicationSummary {
  arn: string;
  application_status: string;
  active_stage: string;
  processing_time_days: number;
  documents_verified: number;
  documents_total: number;
  communications_total: number;
  email_count: number;
  sms_count: number;
  call_count: number;
  risk_score: number;
  risk_confidence_percent: number;
  timeline: Array<{ status: string; date: string; active: boolean }>;
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

export interface SystemAdminMetric {
  key: string;
  label: string;
  value: number | string;
  subtitle?: string | null;
}

export interface SystemIntegrationHealth {
  name: string;
  status: 'Healthy' | 'Degraded' | 'Down';
  latency_ms: number;
}

export interface SystemRoleActivity {
  role: string;
  active_users: number;
  total_users: number;
}

export interface SystemEventItem {
  timestamp: string;
  event: string;
  user: string;
}

export interface SystemAdminDashboardResponse {
  metrics: SystemAdminMetric[];
  integrations: SystemIntegrationHealth[];
  role_activity: SystemRoleActivity[];
  recent_events: SystemEventItem[];
}

export interface WorkflowDesignerStageItem {
  id: number;
  name: string;
  assigned_role: string;
  avg_duration_minutes: number;
  status: 'Active' | 'Inactive';
}

export interface WorkflowConditionItem {
  id: string;
  condition: string;
  outcome: string;
}

export interface WorkflowDesignerResponse {
  metrics: SystemAdminMetric[];
  workflow_name: string;
  stages: WorkflowDesignerStageItem[];
  conditions: WorkflowConditionItem[];
}

export interface RuleEngineRuleItem {
  id: number;
  name: string;
  category: string;
  condition: string;
  action: string;
  severity: 'High' | 'Medium' | 'Low';
  status: 'Active' | 'Inactive';
  last_modified: string;
}

export interface RuleEngineResponse {
  metrics: SystemAdminMetric[];
  rules: RuleEngineRuleItem[];
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

  listUsers: () => request<AdminUserResponse[]>('/api/v1/users'),

  systemAdminDashboard: () => request<SystemAdminDashboardResponse>('/api/v1/workflow/system-admin/dashboard'),
  systemAdminWorkflowDesigner: () => request<WorkflowDesignerResponse>('/api/v1/workflow/system-admin/workflow-designer'),
  systemAdminRuleEngine: () => request<RuleEngineResponse>('/api/v1/workflow/system-admin/rule-engine'),

  listApplications: () => request<WorkflowApplication[]>('/api/v1/workflow/applications'),
  getApplication: (arn: string) => request<WorkflowApplication>(`/api/v1/workflow/applications/${arn}`),

  loanOfficerDashboard: (role: WorkflowRole) => request<WorkflowDashboardResponse>('/api/v1/workflow/loan-officer/dashboard', {}, role),
  getLoanOfficerPrequalificationChecklist: (arn: string, role: WorkflowRole) =>
    request<LoanOfficerChecklistItem[]>(`/api/v1/workflow/loan-officer/pre-qualification/${arn}`, {}, role),
  getLoanOfficerEsignChecklist: (arn: string, role: WorkflowRole) =>
    request<LoanOfficerChecklistItem[]>(`/api/v1/workflow/loan-officer/esign-checklist/${arn}`, {}, role),
  getCommunicationTemplates: (role: WorkflowRole) =>
    request<CommunicationTemplateItem[]>('/api/v1/workflow/loan-officer/communication-templates', {}, role),
  getLoanOfficerApplicationSummary: (arn: string, role: WorkflowRole) =>
    request<LoanOfficerApplicationSummary>(`/api/v1/workflow/loan-officer/application-summary/${arn}`, {}, role),
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
  submitIntake: (arn: string, role: WorkflowRole, payload: { file_complete: boolean }) =>
    request(`/api/v1/workflow/loan-officer/intake/${arn}/submit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, role),
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
