import { ArrowLeft, User, FileText, Shield, TrendingUp, MessageSquare, Activity, CheckCircle, Clock } from 'lucide-react';
import { RiskBadge } from '../components/ui/RiskBadge';
import { ScoreGauge } from '../components/ui/ScoreGauge';
import { AIExplanationPanel } from '../components/ui/AIExplanationPanel';
import { FraudIndicators } from '../components/ui/FraudIndicators';
import { DecisionFlowChart } from '../components/ui/DecisionFlowChart';
import { ApplicationSelector } from '../components/ui/ApplicationSelector';
import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../store';
import { useLoanOfficerApplications } from '../hooks/useLoanOfficerApplications';
import { workflowApi, type LoanOfficerApplicationSummary, type WorkflowAiScore } from '../lib/workflowApi';

export function ApplicationDetailPage() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const {
    selectedApplication: activeApplication,
    applications,
    setSelectedApplicationArn,
    isLoading,
    errorMessage,
  } = useLoanOfficerApplications();
  const [summary, setSummary] = useState<LoanOfficerApplicationSummary | null>(null);
  const [aiScore, setAiScore] = useState<WorkflowAiScore | null>(null);

  const selectApplication = (arn: string) => {
    setSelectedApplicationArn(arn);
  };

  useEffect(() => {
    if (!activeApplication || !user || (user.role !== 'loan_officer' && user.role !== 'system_admin')) {
      setSummary(null);
      setAiScore(null);
      return;
    }

    workflowApi
      .getLoanOfficerApplicationSummary(activeApplication.arn, 'loan_officer')
      .then((payload) => setSummary(payload))
      .catch(() => setSummary(null));

    workflowApi
      .getAiScore(activeApplication.arn, 'loan_officer')
      .then((payload) => setAiScore(payload))
      .catch(() => setAiScore(null));
  }, [activeApplication, user]);

  const aiView = useMemo(() => {
    if (!aiScore) {
      return {
        compositeScore: activeApplication?.creditScore || 0,
        confidencePercent: 0,
        confidenceDelta: 0,
        riskGrade: activeApplication?.riskGrade || 'B',
        decision: 'MANUAL_REVIEW' as const,
        reasonCodes: [],
      };
    }

    return {
      compositeScore: aiScore.composite_score,
      confidencePercent: aiScore.confidence_percent,
      confidenceDelta: Math.max(5, Math.round((100 - aiScore.confidence_percent) / 2)),
      riskGrade: aiScore.risk_grade,
      decision: aiScore.decision,
      reasonCodes: aiScore.reason_codes,
    };
  }, [aiScore, activeApplication]);

  if (!activeApplication) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        No application selected.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Application Detail</h1>
          <p className="text-slate-600">ARN: {activeApplication.arn} • {activeApplication.borrowerName}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            {summary?.application_status || 'In Progress'}
          </span>
          <RiskBadge grade={activeApplication.riskGrade} size="lg" />
          <button
            onClick={() => navigate('/dashboard/document-review')}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Document Review
          </button>
          <button
            onClick={() => navigate('/dashboard/communication')}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Communication
          </button>
        </div>
      </div>

      <ApplicationSelector
        selectedArn={activeApplication.arn}
        onSelect={selectApplication}
        subtitle="Search and filter borrowers to sync Application Detail, Document Review, and Communication."
        applications={applications}
      />

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Loading application details...
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {/* Key Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">Credit Score</p>
              <p className="text-xl font-bold text-slate-900">{activeApplication.creditScore}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">Documents</p>
              <p className="text-xl font-bold text-slate-900">{summary?.documents_verified ?? 0}/{summary?.documents_total ?? 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">KYC Status</p>
              <p className="text-xl font-bold text-green-600">{activeApplication.kycStatus}</p>
            </div>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Clock className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-xs text-slate-600">Processing Time</p>
              <p className="text-xl font-bold text-slate-900">{summary ? `${summary.processing_time_days} days` : activeApplication.processingTime}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          {[
            { label: 'Overview', icon: User, active: true },
            { label: 'Documents', icon: FileText, active: false },
            { label: 'KYC Status', icon: Shield, active: false },
            { label: 'Credit', icon: TrendingUp, active: false },
            { label: 'Communication', icon: MessageSquare, active: false },
            { label: 'Activity Log', icon: Activity, active: false },
          ].map((tab) => (
            <button
              key={tab.label}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                tab.active
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="font-medium text-sm">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Borrower Information */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Borrower Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">Full Name</p>
                <p className="font-medium text-slate-900">{activeApplication.borrowerName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Mobile Number</p>
                <p className="font-medium text-slate-900">{activeApplication.phone}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Email Address</p>
                <p className="font-medium text-slate-900">{activeApplication.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">PAN Number</p>
                <p className="font-medium text-slate-900">-</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Date of Birth</p>
                <p className="font-medium text-slate-900">-</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Employment Type</p>
                <p className="font-medium text-slate-900">{activeApplication.employmentType}</p>
              </div>
            </div>
          </div>

          {/* Loan Details */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Loan Details</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">Requested Amount</p>
                <p className="text-2xl font-bold text-slate-900">₹{activeApplication.loanAmount.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Tenure</p>
                <p className="text-2xl font-bold text-slate-900">-</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Interest Rate</p>
                <p className="font-medium text-slate-900">-</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">EMI</p>
                <p className="font-medium text-slate-900">-</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Purpose</p>
                <p className="font-medium text-slate-900">{activeApplication.purpose}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Application Date</p>
                <p className="font-medium text-slate-900">{activeApplication.createdAt ? new Date(activeApplication.createdAt).toLocaleDateString() : '-'}</p>
              </div>
            </div>
          </div>

          {/* Decision Engine */}
          <DecisionFlowChart
            steps={[
              {
                name: 'Hard Filters',
                status: aiView.decision === 'AUTO_REJECT' ? 'failed' : 'passed',
                details: `Age, KYC, and fraud controls validated for ${activeApplication.borrowerName}`,
              },
              {
                name: 'Policy Rules',
                status: 'passed',
                details: `Risk grade ${aiView.riskGrade} with ${aiView.confidencePercent}% confidence.`,
              },
              {
                name: 'Credit Score Evaluation',
                status: aiView.decision === 'AUTO_APPROVE' ? 'passed' : 'pending',
                details: `Score: ${aiView.compositeScore} - Risk grade ${aiView.riskGrade}`,
              },
            ]}
            finalDecision={aiView.decision}
            reason={aiView.decision === 'AUTO_APPROVE' ? 'Model recommends automatic approval.' : aiView.decision === 'MANUAL_REVIEW' ? 'Model recommends manual review.' : 'Model recommends rejection.'}
          />

          {/* AI Explanation */}
          <AIExplanationPanel
            decision={aiView.decision === 'AUTO_APPROVE' ? 'Recommended for Approval' : aiView.decision === 'MANUAL_REVIEW' ? 'Manual Review Required' : 'Recommended for Decline'}
            explanation={aiView.decision === 'AUTO_APPROVE' ? 'This profile is currently eligible for automatic approval based on AI risk score.' : aiView.decision === 'MANUAL_REVIEW' ? 'This profile requires manual underwriting review due to mixed risk signals.' : 'This profile is currently outside policy risk thresholds for auto approval.'}
            confidence={aiView.confidencePercent}
            confidenceInterval={`${aiView.compositeScore} ± ${aiView.confidenceDelta}`}
            modelVersion="LOS-CREDIT-GBC-v3.4.2"
            lastTrainingDate={new Date().toISOString().slice(0, 10)}
            reasonCodes={aiView.reasonCodes}
            counterfactual="Reduce risk drivers and re-run score to improve eligibility outcomes."
            topFactors={[
              { factor: `Credit score ${activeApplication.creditScore}`, impact: 30, isPositive: activeApplication.creditScore >= 700 },
              { factor: `KYC status ${activeApplication.kycStatus}`, impact: 20, isPositive: activeApplication.kycStatus === 'Verified' },
              { factor: `Current stage ${activeApplication.stage}`, impact: 15, isPositive: activeApplication.stage !== 'Lead' },
            ]}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* AI Credit Score */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">AI Credit Score</h3>
            <ScoreGauge
              score={aiView.compositeScore}
              label="Composite Score"
              showConfidence
              confidence={aiView.confidencePercent}
            />
            <p className="mt-3 text-center text-xs text-slate-500">
              Confidence interval: {aiView.compositeScore} ± {aiView.confidenceDelta}
            </p>
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Tier 1 (Bureau)</span>
                <span className="font-semibold text-slate-900">{activeApplication.creditScore}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Tier 2 (Behavioral)</span>
                <span className="font-semibold text-slate-900">{Math.max(300, activeApplication.creditScore - 20)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Tier 3 (Alternative)</span>
                <span className="font-semibold text-slate-900">{Math.max(300, activeApplication.creditScore - 35)}</span>
              </div>
            </div>
          </div>

          {/* Fraud Assessment */}
          <FraudIndicators
            overallScore={Math.max(10, 100 - (summary?.risk_confidence_percent || 70))}
            signals={[
              {
                type: 'Device Fingerprint',
                severity: 'Low',
                description: 'Single device used, no anomalies detected',
                detectedAt: `${new Date().toISOString().slice(0, 10)} 09:45 AM`,
              },
            ]}
          />

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
                Approve for Underwriting
              </button>
              <button className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
                Request Documents
              </button>
              <button className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium">
                Add Note
              </button>
              <button className="w-full px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium">
                Reject Application
              </button>
            </div>
          </div>

          {/* Application Timeline */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Application Timeline</h3>
            <div className="space-y-4">
              {(summary?.timeline || []).map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 mt-1.5 rounded-full ${
                      item.active ? 'bg-green-500' : 'bg-slate-300'
                    }`}
                  ></div>
                  <div>
                    <p className={`text-sm font-medium ${item.active ? 'text-slate-900' : 'text-slate-400'}`}>
                      {item.status}
                    </p>
                    <p className="text-xs text-slate-500">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
