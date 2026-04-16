import { AlertTriangle, CheckCircle2, FileText, Gauge, Mail, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DecisionFlowChart } from '../../components/ui/DecisionFlowChart';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { buildAIRiskProfile } from '../../lib/aiRiskModel';
import { useStore } from '../../store';
import { workflowApi, type UnderwriterCaseSummary, type UnderwriterDecisionStep } from '../../lib/workflowApi';

export function DecisionEnginePage() {
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const user = useStore((state) => state.user);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);
  const aiRiskProfile = buildAIRiskProfile(selectedApplication);
  const [apiDecision, setApiDecision] = useState<'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'AUTO_REJECT' | null>(null);
  const [apiSteps, setApiSteps] = useState<UnderwriterDecisionStep[] | null>(null);
  const [caseSummary, setCaseSummary] = useState<UnderwriterCaseSummary | null>(null);
  const [decisionHistory, setDecisionHistory] = useState<Array<Record<string, unknown>>>([]);
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [isCaseLoading, setIsCaseLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'underwriter') return;
    setIsCaseLoading(true);
    Promise.all([
      workflowApi.getUnderwriterDecisionEngine(selectedApplication.arn, user.role),
      workflowApi.getUnderwriterCaseSummary(selectedApplication.arn, user.role),
      workflowApi.getUnderwriterDecisionHistory(selectedApplication.arn, user.role),
    ])
      .then(([engine, summary, history]) => {
        setApiDecision(engine.decision);
        setApiSteps(engine.steps);
        setCaseSummary(summary);
        setDecisionHistory(history);
      })
      .catch(() => {
        setApiDecision(null);
        setApiSteps(null);
        setCaseSummary(null);
        setDecisionHistory([]);
      })
      .finally(() => setIsCaseLoading(false));
  }, [selectedApplication.arn, user]);

  const finalDecision = apiDecision ?? aiRiskProfile.decision;
  const decisionSteps =
    apiSteps ??
    [
      {
        name: 'Hard Filters',
        status: aiRiskProfile.decision === 'AUTO_REJECT' ? 'failed' : 'passed',
        details: aiRiskProfile.decision === 'AUTO_REJECT' ? 'Risk policy block due to high-risk profile.' : 'Fraud and sanction checks passed.',
      },
      {
        name: 'Policy Rules',
        status: 'passed',
        details: 'Age, employment, and product eligibility checks passed.',
      },
      {
        name: 'Credit Score Evaluation',
        status: aiRiskProfile.decision === 'AUTO_APPROVE' ? 'passed' : 'pending',
        details: `Score ${aiRiskProfile.compositeScore} evaluated in ${aiRiskProfile.riskGrade} band.`,
      },
    ];

  const submitDecision = async (
    decision: 'approve' | 'manual_review' | 'reject',
    successMessage: string,
    defaultReason: string,
  ) => {
    if (!user || user.role !== 'underwriter') return;
    setIsSubmittingDecision(true);
    try {
      const reason = window.prompt('Add decision reason (optional):', defaultReason) ?? defaultReason;
      const response = await workflowApi.submitUnderwriterDecision(selectedApplication.arn, user.role, {
        decision,
        reason,
      });
      const emailMessage = response.email_status ? ` (borrower email: ${response.email_status})` : '';
      window.alert(`${successMessage}${emailMessage}`);
      const [summary, history] = await Promise.all([
        workflowApi.getUnderwriterCaseSummary(selectedApplication.arn, user.role),
        workflowApi.getUnderwriterDecisionHistory(selectedApplication.arn, user.role),
      ]);
      setCaseSummary(summary);
      setDecisionHistory(history);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit decision';
      window.alert(message);
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  const handleApproveForStructuring = async () => {
    await submitDecision(
      'approve',
      'Decision submitted: approved for structuring.',
      'Approved after underwriter decision-engine review for loan structuring.',
    );
  };

  const handleManualReview = async () => {
    await submitDecision(
      'manual_review',
      'Decision submitted: marked for manual review.',
      'Additional manual review requested due to mixed policy and risk indicators.',
    );
  };

  const handleReject = async () => {
    await submitDecision(
      'reject',
      'Decision submitted: application rejected.',
      'Rejected after underwriter review due to policy and risk concerns.',
    );
  };

  const handleSendBackForClarification = async () => {
    if (!user || user.role !== 'underwriter') return;
    const message = window.prompt('Clarification message for loan officer:', 'Please validate applicant data mismatch and re-submit.') || '';
    if (!message.trim()) return;
    try {
      const response = await workflowApi.sendBackForClarification(selectedApplication.arn, user.role, message.trim());
      window.alert(`Clarification sent. Emails triggered: ${response.loan_officer_email_results?.length || 0}`);
      const summary = await workflowApi.getUnderwriterCaseSummary(selectedApplication.arn, user.role);
      setCaseSummary(summary);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to send clarification';
      window.alert(msg);
    }
  };

  const handleRequestAdditionalDocuments = async () => {
    if (!user || user.role !== 'underwriter') return;
    const rawDocs = window.prompt('Enter required document codes (comma-separated):', 'bank_statement_12m,itr_last_2_years') || '';
    const requiredDocuments = rawDocs.split(',').map((item) => item.trim()).filter(Boolean);
    if (!requiredDocuments.length) return;
    const message = window.prompt('Message for loan officer:', 'Please collect and upload the requested documents before underwriting closure.') || undefined;
    try {
      const response = await workflowApi.requestAdditionalDocuments(selectedApplication.arn, user.role, {
        required_documents: requiredDocuments,
        message,
      });
      window.alert(`Document request sent. Emails triggered: ${response.loan_officer_email_results?.length || 0}`);
      const summary = await workflowApi.getUnderwriterCaseSummary(selectedApplication.arn, user.role);
      setCaseSummary(summary);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to request additional documents';
      window.alert(msg);
    }
  };

  const appData = (caseSummary?.application || {}) as Record<string, unknown>;
  const credit = (caseSummary?.creditworthiness || {}) as Record<string, unknown>;
  const risk = (caseSummary?.risk_analysis || {}) as Record<string, unknown>;
  const ratios = (caseSummary?.financial_ratios || {}) as Record<string, unknown>;
  const docs = caseSummary?.document_verification?.documents || [];

  const asText = (value: unknown) => (value === null || value === undefined || value === '' ? 'N/A' : String(value));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Decision Engine Output</h1>
        <p className="text-slate-600">Visualize hard filters, policy rules, and final decision for {selectedApplication.arn}</p>
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Search and filter borrowers to inspect decision-engine evaluation."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Borrower</p>
          <p className="text-lg font-semibold text-slate-900">{asText(appData.borrower_name || selectedApplication.borrowerName)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Credit Score</p>
          <p className="text-lg font-semibold text-slate-900">{asText(credit.credit_score || selectedApplication.creditScore)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Risk Grade</p>
          <p className="text-lg font-semibold text-slate-900">{asText(credit.risk_grade || aiRiskProfile.riskGrade)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Policy Band</p>
          <p className="text-lg font-semibold text-slate-900">{aiRiskProfile.riskGrade === 'A+' || aiRiskProfile.riskGrade === 'A' ? 'Low Risk' : aiRiskProfile.riskGrade === 'B' ? 'Medium Risk' : 'High Risk'}</p>
        </div>
      </div>

      {isCaseLoading ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">Loading full case summary...</div>
      ) : null}

      <DecisionFlowChart
        steps={decisionSteps}
        finalDecision={finalDecision}
        reason={
          finalDecision === 'AUTO_REJECT'
            ? 'Hard filter triggered due to policy risk profile.'
            : finalDecision === 'AUTO_APPROVE'
            ? 'All policy checks and AI risk bands passed for automatic approval.'
            : `Credit score ${aiRiskProfile.compositeScore} routed to manual underwriting review.`
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-3">Applicant Basic Details</h3>
          <p className="text-sm text-slate-700">Name: {asText(appData.borrower_name)}</p>
          <p className="text-sm text-slate-700">Email: {asText(appData.borrower_email)}</p>
          <p className="text-sm text-slate-700">Phone: {asText(appData.borrower_phone)}</p>
          <p className="text-sm text-slate-700">KYC Status: {asText(appData.kyc_status)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-3">Loan Application Details</h3>
          <p className="text-sm text-slate-700">ARN: {asText(appData.arn)}</p>
          <p className="text-sm text-slate-700">Loan Type: {asText(appData.loan_type)}</p>
          <p className="text-sm text-slate-700">Loan Amount: {asText(appData.loan_amount)}</p>
          <p className="text-sm text-slate-700">Purpose: {asText(appData.purpose)}</p>
          <p className="text-sm text-slate-700">Stage: {asText(caseSummary?.status_tracking?.current_status)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-3">Risk Analysis and Ratios</h3>
          <p className="text-sm text-slate-700">System Risk Score: {asText(risk.system_risk_score)}</p>
          <p className="text-sm text-slate-700">Risk Category: {asText(risk.risk_category)}</p>
          <p className="text-sm text-slate-700">DTI: {asText(ratios.dti)}</p>
          <p className="text-sm text-slate-700">FOIR: {asText(ratios.foir)}</p>
          <p className="text-sm text-slate-700">EMI Eligibility: {asText(ratios.emi_eligibility)}</p>
          <p className="text-sm text-slate-700">Disposable Income: {asText(ratios.disposable_income)}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="font-semibold text-slate-900 mb-3">Creditworthiness Snapshot</h3>
          <p className="text-sm text-slate-700">Existing Loans: {asText(credit.existing_loans)}</p>
          <p className="text-sm text-slate-700">Past Defaults: {asText(credit.past_defaults)}</p>
          <p className="text-sm text-slate-700">Late Payments: {asText(credit.late_payments)}</p>
          <p className="text-sm text-slate-700">Credit Utilization: {asText(credit.credit_utilization_ratio)}</p>
          <p className="text-sm text-slate-700">Assigned Officer: {asText(caseSummary?.status_tracking?.assigned_officer)}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-slate-700" />
          <h3 className="font-semibold text-slate-900">Document Verification</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600 border-b border-slate-200">
                <th className="py-2">Doc Type</th>
                <th className="py-2">Status</th>
                <th className="py-2">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {docs.length ? (
                docs.map((doc) => {
                  const docType = doc.type || (doc as unknown as { doc_type?: string }).doc_type || 'Unknown';
                  return (
                    <tr key={`${doc.id}-${docType}`} className="border-b border-slate-100">
                      <td className="py-2">{docType}</td>
                      <td className="py-2">{doc.status}</td>
                      <td className="py-2">{doc.confidence ?? 0}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td className="py-3 text-slate-500" colSpan={3}>No documents available for this application.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-slate-900">Hard Filter Checks</h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>Fraud score below critical threshold</li>
            <li>No sanctions or PEP match</li>
            <li>KYC verification complete</li>
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <Gauge className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-slate-900">Policy Rule Evaluation</h3>
          </div>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>DTI threshold: 42% (limit 45%)</li>
            <li>FOIR threshold: 38% (limit 40%)</li>
            <li>LTV threshold: 65% (limit 80%)</li>
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-slate-900">Manual Review Trigger</h3>
          </div>
          <p className="text-sm text-slate-700">
            Decision routed to underwriter for final approval with reason code DE-2026-MR-014.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2">
            <button
              onClick={handleApproveForStructuring}
              disabled={isSubmittingDecision}
              className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
            >
              {isSubmittingDecision ? 'Submitting...' : 'Approve for Loan Structuring'}
            </button>
            <button
              onClick={handleManualReview}
              disabled={isSubmittingDecision}
              className="w-full rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60"
            >
              Mark as Manual Review
            </button>
            <button
              onClick={handleReject}
              disabled={isSubmittingDecision}
              className="w-full rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
            >
              Reject Application
            </button>
            <button
              onClick={handleSendBackForClarification}
              disabled={isSubmittingDecision}
              className="w-full rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60"
            >
              Send Back for Clarification
            </button>
            <button
              onClick={handleRequestAdditionalDocuments}
              disabled={isSubmittingDecision}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            >
              Request Additional Documents
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-3">
          <Mail className="w-5 h-5 text-slate-700" />
          <h3 className="font-semibold text-slate-900">Previous Underwriter Decisions</h3>
        </div>
        {decisionHistory.length ? (
          <ul className="space-y-2 text-sm text-slate-700">
            {decisionHistory.map((entry, idx) => (
              <li key={`${asText(entry.decided_at)}-${idx}`} className="rounded border border-slate-200 p-3">
                <p><strong>Decision:</strong> {asText(entry.decision)}</p>
                <p><strong>Status:</strong> {asText(entry.status)}</p>
                <p><strong>Reason:</strong> {asText(entry.reason)}</p>
                <p><strong>Time:</strong> {asText(entry.decided_at)}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-600">No previous underwriter decisions recorded for this ARN.</p>
        )}
      </div>
    </div>
  );
}
