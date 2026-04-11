import { AlertTriangle, CheckCircle2, Gauge, ShieldAlert } from 'lucide-react';
import { DecisionFlowChart } from '../../components/ui/DecisionFlowChart';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { buildAIRiskProfile } from '../../lib/aiRiskModel';
import { useStore } from '../../store';

export function DecisionEnginePage() {
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);
  const aiRiskProfile = buildAIRiskProfile(selectedApplication);

  const finalDecision = aiRiskProfile.decision;

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
          <p className="text-lg font-semibold text-slate-900">{selectedApplication.borrowerName}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Credit Score</p>
          <p className="text-lg font-semibold text-slate-900">{selectedApplication.creditScore}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Risk Grade</p>
          <p className="text-lg font-semibold text-slate-900">{aiRiskProfile.riskGrade}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Policy Band</p>
          <p className="text-lg font-semibold text-slate-900">{aiRiskProfile.riskGrade === 'A+' || aiRiskProfile.riskGrade === 'A' ? 'Low Risk' : aiRiskProfile.riskGrade === 'B' ? 'Medium Risk' : 'High Risk'}</p>
        </div>
      </div>

      <DecisionFlowChart
        steps={[
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
        ]}
        finalDecision={finalDecision}
        reason={
          finalDecision === 'AUTO_REJECT'
            ? 'Hard filter triggered due to policy risk profile.'
            : finalDecision === 'AUTO_APPROVE'
            ? 'All policy checks and AI risk bands passed for automatic approval.'
            : `Credit score ${aiRiskProfile.compositeScore} routed to manual underwriting review.`
        }
      />

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
          <button className="mt-4 w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
            Approve for Loan Structuring
          </button>
        </div>
      </div>
    </div>
  );
}
