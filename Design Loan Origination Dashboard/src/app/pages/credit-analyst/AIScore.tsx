import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { ScoreGauge } from '../../components/ui/ScoreGauge';
import { AIExplanationPanel } from '../../components/ui/AIExplanationPanel';
import { useEffect, useMemo, useState } from 'react';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { buildAIRiskProfile } from '../../lib/aiRiskModel';
import { useStore } from '../../store';
import { workflowApi, type WorkflowAiScore } from '../../lib/workflowApi';

export function AIScorePage() {
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const user = useStore((state) => state.user);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);
  const localProfile = buildAIRiskProfile(selectedApplication);
  const [apiScore, setApiScore] = useState<WorkflowAiScore | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'credit_analyst') return;
    workflowApi
      .getAiScore(selectedApplicationArn, user.role)
      .then((score) => setApiScore(score))
      .catch(() => setApiScore(null));
  }, [selectedApplicationArn, user]);

  const aiRiskProfile = useMemo(() => {
    if (!apiScore) return localProfile;
    return {
      ...localProfile,
      compositeScore: apiScore.composite_score,
      confidencePercent: apiScore.confidence_percent,
      decision: apiScore.decision,
      reasonCodes: apiScore.reason_codes,
    };
  }, [apiScore, localProfile]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI Credit Score Breakdown</h1>
        <p className="text-slate-600">ARN: {selectedApplication.arn} • {selectedApplication.borrowerName}</p>
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Search and filter borrowers to inspect model score, confidence, and factor contributions."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Composite AI Score</h3>
          <ScoreGauge
            score={aiRiskProfile.compositeScore}
            label="Credit Score"
            showConfidence
            confidence={aiRiskProfile.confidencePercent}
          />
          <p className="mt-3 text-center text-xs text-slate-500">
            Confidence interval: {aiRiskProfile.compositeScore} ± {aiRiskProfile.confidenceDelta}
          </p>
        </div>

        <div className="lg:col-span-2">
          <AIExplanationPanel
            decision={aiRiskProfile.decision === 'AUTO_APPROVE' ? 'Recommended for Approval' : aiRiskProfile.decision === 'MANUAL_REVIEW' ? 'Manual Review Required' : 'Recommended for Decline'}
            explanation={aiRiskProfile.explanation}
            confidence={aiRiskProfile.confidencePercent}
            confidenceInterval={`${aiRiskProfile.compositeScore} ± ${aiRiskProfile.confidenceDelta}`}
            modelVersion={aiRiskProfile.modelVersion}
            lastTrainingDate={aiRiskProfile.lastTrainingDate}
            reasonCodes={aiRiskProfile.reasonCodes}
            counterfactual={aiRiskProfile.counterfactual}
            topFactors={aiRiskProfile.topFactors}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Three-Tier Score Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-900 mb-2">Tier 1: Bureau Data</p>
            <p className="text-3xl font-bold text-green-900">{aiRiskProfile.tierScores.bureau}</p>
            <p className="text-xs text-green-700 mt-2">Weight: 50%</p>
            <div className="mt-3 text-xs text-blue-800">
              <p>• CIBIL Score: {selectedApplication.creditScore}</p>
              <p>• Payment History: Excellent</p>
              <p>• Credit Utilization: 25%</p>
            </div>
          </div>

          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-900 mb-2">Tier 2: Behavioral Data</p>
            <p className="text-3xl font-bold text-green-900">{aiRiskProfile.tierScores.behavioral}</p>
            <p className="text-xs text-green-700 mt-2">Weight: 30%</p>
            <div className="mt-3 text-xs text-green-800">
              <p>• SLA profile: {selectedApplication.slaBreached ? 'Breached' : 'Within threshold'}</p>
              <p>• KYC status: {selectedApplication.kycStatus}</p>
              <p>• Stage latency: {selectedApplication.daysInStage} days</p>
            </div>
          </div>

          <div className="p-4 bg-slate-100 rounded-lg">
            <p className="text-sm font-medium text-slate-900 mb-2">Tier 3: Alternative Data</p>
            <p className="text-3xl font-bold text-slate-900">{aiRiskProfile.tierScores.alternative}</p>
            <p className="text-xs text-slate-700 mt-2">Weight: 20%</p>
            <div className="mt-3 text-xs text-slate-800">
              <p>• Employment: {selectedApplication.employmentType}</p>
              <p>• Loan amount: ₹{selectedApplication.loanAmount.toLocaleString('en-IN')}</p>
              <p>• Tenure: {selectedApplication.tenureMonths} months</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
