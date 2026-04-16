import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { useStore, UserRole } from './store';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/Login';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Dashboards
import { LoanOfficerDashboard } from './pages/dashboards/LoanOfficerDashboard';
import { CreditAnalystDashboard } from './pages/dashboards/CreditAnalystDashboard';
import { UnderwriterDashboard } from './pages/dashboards/UnderwriterDashboard';
import { ComplianceDashboard } from './pages/dashboards/ComplianceDashboard';
import { OperationsDashboard } from './pages/dashboards/OperationsDashboard';
import { SystemAdminDashboard } from './pages/dashboards/SystemAdminDashboard';

// Loan Officer Pages
import { ApplicationDetailPage } from './pages/ApplicationDetail';
import { DocumentReviewPage } from './pages/loan-officer/DocumentReview';
import { CommunicationPage } from './pages/loan-officer/Communication';
import { LeadWorkbenchPage } from './pages/loan-officer/LeadWorkbench';
import { ApplicationIntakePage } from './pages/loan-officer/ApplicationIntake';
import { ESignAgreementPage } from './pages/loan-officer/ESignAgreement';

// Credit Analyst Pages
import { FinancialRatiosPage } from './pages/credit-analyst/FinancialRatios';
import { AIScorePage } from './pages/credit-analyst/AIScore';
import { CreditMemoPage } from './pages/credit-analyst/CreditMemo';
import { CibilReportsPage } from './pages/cibil/CibilReports';
import { CibilReportViewerPage } from './pages/cibil/CibilReportViewer';

// Underwriter Pages
import { PolicyOverridePage } from './pages/underwriter/PolicyOverride';
import { LoanStructuringPage } from './pages/underwriter/LoanStructuring';
import { DecisionEnginePage } from './pages/underwriter/DecisionEngine';

// Compliance Pages
import { AuditLogPage } from './pages/compliance/AuditLog';
import { RegulatoryReportsPage } from './pages/compliance/RegulatoryReports';
import { KYCAMLPage } from './pages/compliance/KYCAML';
import { FraudSignalsPage } from './pages/compliance/FraudSignals';
import { RBIComplianceCenterPage } from './pages/compliance/RBIComplianceCenter';
import { RBIAuditExportPage } from './pages/compliance/RBIAuditExport';

// Operations Pages
import { DocumentVaultPage } from './pages/operations/DocumentVault';
import { DisbursementApprovalPage } from './pages/operations/DisbursementApproval';
import { ExceptionQueuePage } from './pages/operations/ExceptionQueue';

// System Admin Pages
import { WorkflowDesignerPage } from './pages/admin/WorkflowDesigner';
import { RuleEnginePage } from './pages/admin/RuleEngine';
import { UserManagementPage } from './pages/admin/UserManagement';
import { RBIGovernanceMatrixPage } from './pages/governance/RBIGovernanceMatrix';
import { LoanProductPolicyPage } from './pages/governance/LoanProductPolicy';
import { DocumentPolicyPage } from './pages/governance/DocumentPolicy';

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function RoleProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}) {
  const user = useStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function CibilReportRedirectRoute() {
  const { id } = useParams();
  return <Navigate to={`/dashboard/cibil-report/${id ?? ''}`} replace />;
}

export default function App() {
  const user = useStore((state) => state.user);

  const getDashboard = () => {
    if (!user) return <Navigate to="/login" replace />;

    switch (user.role) {
      case 'loan_officer':
        return <LoanOfficerDashboard />;
      case 'credit_analyst':
        return <CreditAnalystDashboard />;
      case 'underwriter':
        return <UnderwriterDashboard />;
      case 'compliance_officer':
        return <ComplianceDashboard />;
      case 'ops_team':
        return <OperationsDashboard />;
      case 'system_admin':
        return <SystemAdminDashboard />;
      case 'board_member':
      case 'chief_compliance_officer':
      case 'nodal_grievance_officer':
      case 'lsp_governance_officer':
      case 'data_protection_officer':
      case 'recovery_governance_officer':
      case 'internal_auditor':
        return <ComplianceDashboard />;
      default:
        return <LoanOfficerDashboard />;
    }
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/cibil-reports" element={<Navigate to="/dashboard/cibil-reports" replace />} />
        <Route path="/cibil-report/:id" element={<CibilReportRedirectRoute />} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={getDashboard()} />

          {/* Loan Officer Routes */}
          <Route path="lead-workbench" element={<RoleProtectedRoute allowedRoles={['loan_officer', 'system_admin']}><LeadWorkbenchPage /></RoleProtectedRoute>} />
          <Route path="application-intake" element={<RoleProtectedRoute allowedRoles={['loan_officer', 'system_admin']}><ApplicationIntakePage /></RoleProtectedRoute>} />
          <Route path="application-detail" element={<RoleProtectedRoute allowedRoles={['loan_officer', 'system_admin']}><ApplicationDetailPage /></RoleProtectedRoute>} />
          <Route path="document-review" element={<RoleProtectedRoute allowedRoles={['loan_officer', 'system_admin']}><DocumentReviewPage /></RoleProtectedRoute>} />
          <Route path="communication" element={<RoleProtectedRoute allowedRoles={['loan_officer', 'system_admin']}><CommunicationPage /></RoleProtectedRoute>} />
          <Route path="e-sign-agreement" element={<RoleProtectedRoute allowedRoles={['loan_officer', 'system_admin']}><ESignAgreementPage /></RoleProtectedRoute>} />

          {/* Credit Analyst Routes */}
          <Route path="financial-ratios" element={<RoleProtectedRoute allowedRoles={['credit_analyst', 'system_admin']}><FinancialRatiosPage /></RoleProtectedRoute>} />
          <Route path="ai-score" element={<RoleProtectedRoute allowedRoles={['credit_analyst', 'underwriter', 'system_admin']}><AIScorePage /></RoleProtectedRoute>} />
          <Route path="credit-memo" element={<RoleProtectedRoute allowedRoles={['credit_analyst', 'system_admin']}><CreditMemoPage /></RoleProtectedRoute>} />
          <Route path="cibil-reports" element={<RoleProtectedRoute allowedRoles={['credit_analyst', 'loan_officer', 'underwriter', 'system_admin']}><CibilReportsPage /></RoleProtectedRoute>} />
          <Route path="cibil-report/:id" element={<RoleProtectedRoute allowedRoles={['credit_analyst', 'loan_officer', 'underwriter', 'system_admin']}><CibilReportViewerPage /></RoleProtectedRoute>} />

          {/* Underwriter Routes */}
          <Route path="decision-engine" element={<RoleProtectedRoute allowedRoles={['underwriter', 'system_admin']}><DecisionEnginePage /></RoleProtectedRoute>} />
          <Route path="policy-override" element={<RoleProtectedRoute allowedRoles={['underwriter', 'system_admin']}><PolicyOverridePage /></RoleProtectedRoute>} />
          <Route path="loan-structuring" element={<RoleProtectedRoute allowedRoles={['underwriter', 'system_admin']}><LoanStructuringPage /></RoleProtectedRoute>} />

          {/* Compliance Routes */}
          <Route path="kyc-aml" element={<RoleProtectedRoute allowedRoles={['compliance_officer', 'system_admin']}><KYCAMLPage /></RoleProtectedRoute>} />
          <Route path="fraud-signals" element={<RoleProtectedRoute allowedRoles={['compliance_officer', 'system_admin', 'chief_compliance_officer']}><FraudSignalsPage /></RoleProtectedRoute>} />
          <Route path="audit-log" element={<RoleProtectedRoute allowedRoles={['compliance_officer', 'system_admin', 'chief_compliance_officer', 'data_protection_officer', 'recovery_governance_officer', 'internal_auditor', 'nodal_grievance_officer']}><AuditLogPage /></RoleProtectedRoute>} />
          <Route path="regulatory-reports" element={<RoleProtectedRoute allowedRoles={['compliance_officer', 'system_admin', 'chief_compliance_officer', 'board_member', 'nodal_grievance_officer', 'lsp_governance_officer']}><RegulatoryReportsPage /></RoleProtectedRoute>} />
          <Route path="rbi-compliance" element={<RoleProtectedRoute allowedRoles={['compliance_officer', 'system_admin', 'chief_compliance_officer', 'nodal_grievance_officer']}><RBIComplianceCenterPage /></RoleProtectedRoute>} />
          <Route path="rbi-audit-export" element={<RoleProtectedRoute allowedRoles={['compliance_officer', 'system_admin', 'chief_compliance_officer', 'data_protection_officer', 'internal_auditor']}><RBIAuditExportPage /></RoleProtectedRoute>} />

          {/* Governance and Policy Routes */}
          <Route path="rbi-governance-matrix" element={<RoleProtectedRoute allowedRoles={['system_admin', 'board_member', 'chief_compliance_officer', 'nodal_grievance_officer', 'lsp_governance_officer', 'data_protection_officer', 'recovery_governance_officer', 'internal_auditor', 'compliance_officer']}><RBIGovernanceMatrixPage /></RoleProtectedRoute>} />
          <Route path="loan-product-policy" element={<RoleProtectedRoute allowedRoles={['system_admin', 'board_member', 'chief_compliance_officer', 'lsp_governance_officer', 'internal_auditor', 'compliance_officer']}><LoanProductPolicyPage /></RoleProtectedRoute>} />
          <Route path="document-policy" element={<RoleProtectedRoute allowedRoles={['system_admin', 'board_member', 'chief_compliance_officer', 'data_protection_officer', 'internal_auditor', 'loan_officer', 'compliance_officer']}><DocumentPolicyPage /></RoleProtectedRoute>} />

          {/* Operations Routes */}
          <Route path="disbursement-approval" element={<RoleProtectedRoute allowedRoles={['ops_team', 'system_admin']}><DisbursementApprovalPage /></RoleProtectedRoute>} />
          <Route path="document-vault" element={<RoleProtectedRoute allowedRoles={['ops_team', 'system_admin']}><DocumentVaultPage /></RoleProtectedRoute>} />
          <Route path="exception-queue" element={<RoleProtectedRoute allowedRoles={['ops_team', 'system_admin']}><ExceptionQueuePage /></RoleProtectedRoute>} />

          {/* System Admin Routes */}
          <Route path="workflow-designer" element={<RoleProtectedRoute allowedRoles={['system_admin']}><WorkflowDesignerPage /></RoleProtectedRoute>} />
          <Route path="rule-engine" element={<RoleProtectedRoute allowedRoles={['system_admin']}><RuleEnginePage /></RoleProtectedRoute>} />
          <Route path="user-management" element={<RoleProtectedRoute allowedRoles={['system_admin']}><UserManagementPage /></RoleProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}