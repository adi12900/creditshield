const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
const AUTH_TOKEN_KEY = 'creditshield_access_token';

export type WorkflowRole =
  | 'loan_officer'
  | 'credit_analyst'
  | 'underwriter'
  | 'compliance_officer'
  | 'field_officer';

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
      if (Array.isArray(body?.detail)) {
        const messages: Array<string | null> = body.detail
          .map((item: unknown) => {
            if (typeof item === 'string') {
              return item;
            }
            if (item && typeof item === 'object' && 'msg' in item && typeof (item as { msg?: unknown }).msg === 'string') {
              return (item as { msg: string }).msg;
            }
            return null;
          })
          .filter((msg: string | null): msg is string => Boolean(msg));
        detail = messages.length ? messages.join('; ') : detail;
      } else if (typeof body?.detail === 'string') {
        detail = body.detail;
      }
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

async function requestFormData<T>(path: string, formData: FormData): Promise<T> {
  const headers = new Headers();
  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    let detail = `Request failed with status ${response.status}`;
    try {
      const body = await response.json();
      if (typeof body?.detail === 'string') {
        detail = body.detail;
      }
    } catch {
      // Keep generic message.
    }
    throw new Error(detail);
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
  role: WorkflowRole;
  full_name: string;
  username?: string;
}

export interface WorkflowStat {
  key: string;
  value: number | string;
}

export interface WorkflowDashboardResponse {
  role: WorkflowRole;
  stats: WorkflowStat[];
}

export type FieldVisitStatus = 'Pending Visit' | 'In Progress' | 'Completed';

export interface FieldOfficerCaseItem {
  arn: string;
  borrower_name: string;
  loan_amount: number;
  status: FieldVisitStatus;
}

export interface FieldOfficerCaseDetail {
  arn: string;
  borrower_name: string;
  borrower_phone?: string | null;
  borrower_address: string;
  loan_amount: number;
  loan_type: string;
  stage: string;
  status: FieldVisitStatus;
  map_link: string;
  report_submitted: boolean;
}

export type LoanTypeCategory =
  | 'Personal Loan'
  | 'Car Loan'
  | 'Home Loan'
  | 'Gold Loan'
  | 'Education Loan'
  | 'Business Loan';

export interface FieldVisitReportPayload {
  loan_type: LoanTypeCategory;
  residence_verification: {
    house_type: 'Owned' | 'Rented';
    address_verified: boolean;
    staying_since_years: number;
    locality_type: 'Urban' | 'Rural' | 'Semi-Urban';
    house_condition: 'Good' | 'Average' | 'Poor';
    landmark_notes: string;
    neighbor_feedback?: string;
  };
  employment_business_verification: {
    employment_category: 'Salaried' | 'Self-Employed';
    business_verified: boolean;
    company_name?: string;
    job_role?: string;
    employment_type?: 'Permanent' | 'Contract';
    years_in_job?: number;
    office_verified?: boolean;
    salary_estimated?: number;
    business_name?: string;
    business_type?: string;
    shop_office_exists?: boolean;
    years_in_business?: number;
    daily_customer_flow?: 'Low' | 'Medium' | 'High';
    estimated_monthly_income?: number;
  };
  financial_assessment: {
    declared_income: number;
    estimated_actual_income: number;
    monthly_expenses: number;
    existing_loans: boolean;
    repayment_capacity: 'Low' | 'Medium' | 'High';
  };
  education_details?: {
    highest_qualification: string;
    tenth_percentage?: number;
    twelfth_or_diploma_percentage?: number;
    graduation_details?: string;
    professional_stability_indicator: 'Low' | 'Medium' | 'High';
  };
  loan_specific_details: Record<string, unknown>;
  uploaded_documents: Array<{ doc_type: string; files: string[] }>;
  risk_remarks: {
    risk_level: 'Low' | 'Medium' | 'High';
    fraud_suspicion: boolean;
    final_recommendation: 'Recommend Approval' | 'Recommend Rejection' | 'Needs Further Review';
    detailed_remarks: string;
  };
}

export type VerificationSection = 'residence' | 'business' | 'education' | 'loan_specific';

export interface FieldEvidenceItem {
  id: number;
  arn: string;
  loan_type: string;
  verification_section: VerificationSection;
  evidence_type: string;
  storage_url: string;
  access_url: string;
  uploaded_by_role: string;
  latitude: number;
  longitude: number;
  captured_at: string;
  created_at: string;
}

export interface FieldEvidenceUploadResponse {
  evidence: FieldEvidenceItem;
}

export interface FieldEvidenceGroupedResponse {
  arn: string;
  loan_type: string;
  grouped_evidence: Record<string, Record<string, FieldEvidenceItem[]>>;
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
    report_pdf_download_url?: string | null;
    report_pdf_storage_url?: string | null;
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

export interface UnderwriterDecisionStep {
  name: string;
  status: 'passed' | 'failed' | 'pending';
}

export interface UnderwriterDecisionEngineResponse {
  arn: string;
  decision: 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'AUTO_REJECT';
  steps: UnderwriterDecisionStep[];
}

export interface UnderwriterDecisionSubmitResponse {
  arn: string;
  decision: 'approve' | 'reject' | 'manual_review';
  status: string;
  stage: string;
  reason?: string | null;
  email_status?: string | null;
  email_error?: string | null;
}

export interface UnderwriterCaseSummary {
  application: Record<string, unknown>;
  creditworthiness: Record<string, unknown>;
  risk_analysis: Record<string, unknown>;
  financial_ratios: Record<string, unknown>;
  document_verification: {
    documents: WorkflowDocumentItem[];
    ocr_status?: string;
    fraud_detection_flags?: string[];
    digilocker_fetch_status?: string;
  };
  underwriting_notes: {
    internal_comments?: string;
    risk_justification?: string;
    exception_notes?: Array<Record<string, unknown>>;
    previous_decisions?: Array<Record<string, unknown>>;
  };
  status_tracking: {
    current_status?: string;
    stage_history?: Array<Record<string, unknown>>;
    assigned_officer?: string;
  };
  kpi_metrics?: Record<string, unknown>;
}

export interface UnderwriterCaseActionResponse {
  arn: string;
  status: string;
  stage?: string;
  message?: string;
  requested_documents?: string[];
  existing_documents?: string[];
  loan_officer_email_results?: Array<{ email: string; status: string; error?: string | null }>;
}

export interface WorkflowLoanOfferResponse {
  arn: string;
  emi: number;
  total_interest: number;
  total_payable: number;
  email_status?: string | null;
  email_error?: string | null;
  email_to?: string | null;
}

export interface WorkflowDocumentItem {
  id: string;
  type: string;
  status: 'Verified' | 'Pending OCR' | 'Flagged';
  confidence: number;
  agent_verdict?: string;
  storage_url?: string;
  uploaded_at?: string;
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

export interface WorkflowApplication {
  arn: string;
  borrower_name: string;
  borrower_email?: string | null;
  borrower_phone?: string | null;
  loan_amount: number;
  loan_type: string;
  stage: string;
  risk_grade: string;
  credit_score: number;
  kyc_status: string;
  is_cibil_verified: boolean;
  employment_type: string;
  purpose: string;
  created_at?: string | null;
  final_score?: number | null;
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
  getFinalScore: (arn: string) => request<{ final_score: number | null; exists: boolean }>(`/api/v1/workflow/applications/${arn}/final-score`),

  loanOfficerDashboard: (role: WorkflowRole) => request<WorkflowDashboardResponse>('/api/v1/workflow/loan-officer/dashboard', {}, role),
  creditAnalystDashboard: (role: WorkflowRole) => request<WorkflowDashboardResponse>('/api/v1/workflow/credit-analyst/dashboard', {}, role),
  underwriterDashboard: (role: WorkflowRole) => request<WorkflowDashboardResponse>('/api/v1/workflow/underwriter/dashboard', {}, role),
  complianceDashboard: (role: WorkflowRole) => request<WorkflowDashboardResponse>('/api/v1/workflow/compliance/dashboard', {}, role),
  fieldOfficerDashboard: (role: WorkflowRole) => request<WorkflowDashboardResponse>('/api/v1/workflow/field-officer/dashboard', {}, role),
  getFieldOfficerCases: (role: WorkflowRole, status?: string, search?: string) => {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.set('status', status);
    if (search?.trim()) params.set('search', search.trim());
    const suffix = params.toString() ? `?${params.toString()}` : '';
    return request<FieldOfficerCaseItem[]>(`/api/v1/workflow/field-officer/cases${suffix}`, {}, role);
  },
  getFieldOfficerCaseDetail: (arn: string, role: WorkflowRole) => request<FieldOfficerCaseDetail>(`/api/v1/workflow/field-officer/cases/${encodeURIComponent(arn)}`, {}, role),
  startFieldVisit: (arn: string, role: WorkflowRole) =>
    request<{ arn: string; status: string }>(`/api/v1/workflow/field-officer/cases/${encodeURIComponent(arn)}/start-visit`, {
      method: 'POST',
    }, role),
  submitFieldVisitReport: (arn: string, role: WorkflowRole, payload: FieldVisitReportPayload) =>
    request<{ arn: string; status: string; next_stage: string; submitted_at: string }>(`/api/v1/workflow/field-officer/cases/${encodeURIComponent(arn)}/submit-report`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, role),
  uploadFieldEvidence: async (
    arn: string,
    payload: {
      loanType: string;
      verificationSection: VerificationSection;
      evidenceType: string;
      latitude: number;
      longitude: number;
      capturedAt?: string;
      file: File;
    },
  ) => {
    const formData = new FormData();
    formData.append('loan_type', payload.loanType);
    formData.append('verification_section', payload.verificationSection);
    formData.append('evidence_type', payload.evidenceType);
    formData.append('latitude', String(payload.latitude));
    formData.append('longitude', String(payload.longitude));
    if (payload.capturedAt) {
      formData.append('captured_at', payload.capturedAt);
    }
    formData.append('file', payload.file);

    return requestFormData<FieldEvidenceUploadResponse>(
      `/api/v1/workflow/field-officer/cases/${encodeURIComponent(arn)}/evidence/upload`,
      formData,
    );
  },
  getFieldEvidence: (arn: string, signedUrlExpiresIn = 3600) =>
    request<FieldEvidenceGroupedResponse>(`/api/v1/workflow/field-officer/cases/${encodeURIComponent(arn)}/evidence?signed_url_expires_in=${signedUrlExpiresIn}`),
  getBureauReport: (arn: string, role: WorkflowRole) => request<WorkflowBureauReport>(`/api/v1/workflow/credit-analyst/bureau/${arn}`, {}, role),
  getAiScore: (arn: string, role: WorkflowRole) => request<WorkflowAiScore>(`/api/v1/workflow/credit-analyst/ai-score/${arn}`, {}, role),
  getUnderwriterDecisionEngine: (arn: string, role: WorkflowRole) =>
    request<UnderwriterDecisionEngineResponse>(`/api/v1/workflow/underwriter/decision-engine/${arn}`, {}, role),
  getUnderwriterCaseSummary: (arn: string, role: WorkflowRole) =>
    request<UnderwriterCaseSummary>(`/api/v1/workflow/underwriter/case-summary/${arn}`, {}, role),
  getUnderwriterDecisionHistory: (arn: string, role: WorkflowRole) =>
    request<Array<Record<string, unknown>>>(`/api/v1/workflow/underwriter/decisions/${arn}/history`, {}, role),
  submitUnderwriterDecision: (arn: string, role: WorkflowRole, payload: { decision: 'approve' | 'reject' | 'manual_review'; reason?: string }) =>
    request<UnderwriterDecisionSubmitResponse>(`/api/v1/workflow/underwriter/decision-engine/${arn}/submit`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, role),
  sendBackForClarification: (arn: string, role: WorkflowRole, message: string) =>
    request<UnderwriterCaseActionResponse>(`/api/v1/workflow/underwriter/case/${arn}/send-back`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    }, role),
  requestAdditionalDocuments: (arn: string, role: WorkflowRole, payload: { required_documents: string[]; message?: string }) =>
    request<UnderwriterCaseActionResponse>(`/api/v1/workflow/underwriter/case/${arn}/request-documents`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }, role),
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
  verifyCibilReport: (arn: string, role: WorkflowRole) =>
    request<WorkflowApplication>(`/api/v1/workflow/loan-officer/cibil/${arn}/verify`, { method: 'POST' }, role),

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
    request<WorkflowLoanOfferResponse>(`/api/v1/workflow/underwriter/loan-structuring/${arn}/offer`, {
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
