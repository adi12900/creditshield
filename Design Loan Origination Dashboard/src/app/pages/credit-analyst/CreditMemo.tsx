import { Save, Send, FileText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { useStore } from '../../store';
import { workflowApi, type WorkflowAiScore, type WorkflowApplication, type WorkflowBureauReport } from '../../lib/workflowApi';

export function CreditMemoPage() {
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const user = useStore((state) => state.user);
  const [applications, setApplications] = useState<WorkflowApplication[]>([]);
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [bureauSummary, setBureauSummary] = useState<WorkflowBureauReport | null>(null);
  const [aiSummary, setAiSummary] = useState<WorkflowAiScore | null>(null);
  const [summary, setSummary] = useState('');
  const [strengths, setStrengths] = useState('');
  const [riskFactors, setRiskFactors] = useState('');
  const [recommendation, setRecommendation] = useState<'Approve' | 'Approve with Conditions' | 'Decline'>('Approve');
  const [conditions, setConditions] = useState('');

  const fallbackApplication = getLoanApplicationByArn(selectedApplicationArn);
  const selectedApiApplication = applications.find((item) => item.arn === selectedApplicationArn) ?? null;
  const selectedApplication = useMemo(() => ({
    arn: selectedApiApplication?.arn ?? fallbackApplication.arn,
    borrowerName: selectedApiApplication?.borrower_name ?? fallbackApplication.borrowerName,
    loanAmount: selectedApiApplication?.loan_amount ?? fallbackApplication.loanAmount,
    stage: selectedApiApplication?.stage ?? fallbackApplication.stage,
    riskGrade: selectedApiApplication?.risk_grade ?? fallbackApplication.riskGrade,
    creditScore: selectedApiApplication?.credit_score ?? fallbackApplication.creditScore,
    employmentType: selectedApiApplication?.employment_type ?? fallbackApplication.employmentType,
    kycStatus: selectedApiApplication?.kyc_status ?? fallbackApplication.kycStatus,
  }), [fallbackApplication, selectedApiApplication]);

  useEffect(() => {
    if (!user || user.role !== 'credit_analyst') {
      setApplications([]);
      return;
    }

    setApplicationLoading(true);
    workflowApi
      .listApplications()
      .then((rows) => {
        const filteredRows = rows.filter((row) => row.stage === 'CREDIT_ANALYST');
        setApplications(filteredRows);
        if (!filteredRows.some((row) => row.arn === selectedApplicationArn) && filteredRows.length > 0) {
          setSelectedApplicationArn(filteredRows[0].arn);
        }
      })
      .catch(() => setApplications([]))
      .finally(() => setApplicationLoading(false));
  }, [selectedApplicationArn, setSelectedApplicationArn, user]);

  useEffect(() => {
    if (!user || user.role !== 'credit_analyst' || !selectedApplicationArn) return;

    workflowApi
      .getBureauReport(selectedApplicationArn, user.role)
      .then((data) => setBureauSummary(data))
      .catch(() => setBureauSummary(null));

    workflowApi
      .getAiScore(selectedApplicationArn, user.role)
      .then((data) => setAiSummary(data))
      .catch(() => setAiSummary(null));
  }, [selectedApplicationArn, user]);

  useEffect(() => {
    const aiDecision = aiSummary?.decision === 'AUTO_APPROVE'
      ? 'Auto Approve'
      : aiSummary?.decision === 'AUTO_REJECT'
        ? 'Auto Reject'
        : 'Manual Review';

    setSummary(
      `Applicant ${selectedApplication.borrowerName} is currently in ${selectedApplication.stage}. ` +
      `CIBIL score is ${bureauSummary?.credit_score ?? selectedApplication.creditScore} and AI composite score is ${aiSummary?.composite_score ?? selectedApplication.creditScore}. ` +
      `Current AI recommendation is ${aiDecision}. Loan amount under review is ₹${selectedApplication.loanAmount.toLocaleString('en-IN')}.`,
    );

    setStrengths(
      `• CIBIL score: ${bureauSummary?.credit_score ?? selectedApplication.creditScore}\n` +
      `• Risk grade: ${selectedApplication.riskGrade}\n` +
      `• KYC status: ${selectedApplication.kycStatus}`,
    );

    setRiskFactors(
      `• Employment type: ${selectedApplication.employmentType}\n` +
      `• AI confidence: ${aiSummary?.confidence_percent ?? 0}%\n` +
      `• Tradelines reviewed: ${bureauSummary?.tradelines?.length ?? 0}`,
    );
  }, [aiSummary, bureauSummary, selectedApplication]);

  const payload = {
    summary,
    strengths,
    risk_factors: riskFactors,
    recommendation,
    conditions,
  };

  const handleSaveDraft = async () => {
    if (!user || user.role !== 'credit_analyst') return;
    try {
      await workflowApi.saveCreditMemoDraft(selectedApplication.arn, user.role, payload);
      window.alert('Credit memo draft saved.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save draft';
      window.alert(message);
    }
  };

  const handleSubmit = async () => {
    if (!user || user.role !== 'credit_analyst') return;
    try {
      await workflowApi.submitCreditMemo(selectedApplication.arn, user.role, payload);
      window.alert('Credit memo submitted to underwriter.');
      setApplications((prev) => prev.filter((application) => application.arn !== selectedApplication.arn));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit memo';
      window.alert(message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Credit Memo Creation</h1>
        <p className="text-slate-600">
          ARN: {selectedApplication.arn} • {selectedApplication.borrowerName}
        </p>
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Select a borrower before drafting the credit memo so the analysis stays tied to the right file."
        applications={applications.map((application) => ({
          arn: application.arn,
          borrowerName: application.borrower_name,
          email: `${application.borrower_name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          stage: application.stage,
          riskGrade: application.risk_grade,
          loanAmount: application.loan_amount,
        }))}
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Pre-Populated Data</h3>
        {applicationLoading && (
          <p className="text-xs text-slate-500 mb-3">Loading applications from database...</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600">Bureau Score</p>
            <p className="text-lg font-bold text-slate-900">{bureauSummary?.credit_score ?? selectedApplication.creditScore}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600">CIBIL Tradelines</p>
            <p className="text-lg font-bold text-slate-900">{bureauSummary?.tradelines?.length ?? 0}</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg">
            <p className="text-xs text-slate-600">AI Composite Score</p>
            <p className="text-lg font-bold text-green-600">{aiSummary?.composite_score ?? selectedApplication.creditScore}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
            <p className="text-sm font-semibold text-indigo-900">CIBIL Summary</p>
            <ul className="mt-2 text-sm text-indigo-800 space-y-1">
              <li>Score trend points: {bureauSummary?.score_trend?.length ?? 0}</li>
              <li>Active tradelines: {(bureauSummary?.tradelines ?? []).filter((item) => item.status === 'Active').length}</li>
              <li>Max DPD observed: {Math.max(0, ...(bureauSummary?.tradelines ?? []).map((item) => item.dpd ?? 0))}</li>
            </ul>
          </div>
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
            <p className="text-sm font-semibold text-emerald-900">AI Summary</p>
            <ul className="mt-2 text-sm text-emerald-800 space-y-1">
              <li>Decision: {aiSummary?.decision ?? 'N/A'}</li>
              <li>Confidence: {aiSummary?.confidence_percent ?? 0}%</li>
              <li>Top reason: {aiSummary?.reason_codes?.[0] ?? 'N/A'}</li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Credit Analysis Summary
            </label>
            <textarea
              rows={6}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="Enter detailed credit analysis..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Key Strengths
            </label>
            <textarea
              rows={3}
              value={strengths}
              onChange={(e) => setStrengths(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="List key strengths..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Risk Factors
            </label>
            <textarea
              rows={3}
              value={riskFactors}
              onChange={(e) => setRiskFactors(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="List risk factors..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Recommendation *
            </label>
            <select
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value as 'Approve' | 'Approve with Conditions' | 'Decline')}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              <option>Select recommendation...</option>
              <option>Approve</option>
              <option>Approve with Conditions</option>
              <option>Decline</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Conditions (if applicable)
            </label>
            <textarea
              rows={3}
              value={conditions}
              onChange={(e) => setConditions(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              placeholder="Enter any conditions for approval..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={handleSaveDraft} className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium flex items-center justify-center gap-2">
              <Save className="w-4 h-4" />
              Save Draft
            </button>
            <button onClick={handleSubmit} className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              Submit to Underwriter
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Memo History</h3>
        <div className="space-y-3">
          <div className="p-4 border border-slate-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-slate-900">Version 1.0 - Draft</p>
                <p className="text-sm text-slate-600 mt-1">Created by: Current Analyst</p>
                <p className="text-xs text-slate-500 mt-1">2026-04-10 10:30 AM</p>
              </div>
              <FileText className="w-5 h-5 text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
