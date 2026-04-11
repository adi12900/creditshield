import { ArrowLeft, User, FileText, Shield, TrendingUp, MessageSquare, Activity, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { RiskBadge } from '../components/ui/RiskBadge';
import { ScoreGauge } from '../components/ui/ScoreGauge';
import { AIExplanationPanel } from '../components/ui/AIExplanationPanel';
import { FraudIndicators } from '../components/ui/FraudIndicators';
import { DecisionFlowChart } from '../components/ui/DecisionFlowChart';
import { ApplicationSelector } from '../components/ui/ApplicationSelector';
import { useNavigate } from 'react-router-dom';
import { getApplicationDisplayStatus, getLoanApplicationByArn } from '../data/loanApplications';
import { buildAIRiskProfile } from '../lib/aiRiskModel';
import { useStore } from '../store';

export function ApplicationDetailPage() {
  const navigate = useNavigate();
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const activeApplication = getLoanApplicationByArn(selectedApplicationArn);
  const applicationStatus = getApplicationDisplayStatus(activeApplication);
  const aiRiskProfile = buildAIRiskProfile(activeApplication);

  const selectApplication = (arn: string) => {
    setSelectedApplicationArn(arn);
  };

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
            {applicationStatus}
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
      />

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
              <p className="text-xl font-bold text-slate-900">8/8</p>
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
              <p className="text-xl font-bold text-slate-900">{activeApplication.processingTime}</p>
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
                <p className="font-medium text-slate-900">{activeApplication.panNumber}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Date of Birth</p>
                <p className="font-medium text-slate-900">{activeApplication.dob}</p>
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
                <p className="text-2xl font-bold text-slate-900">{activeApplication.tenureMonths} months</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Interest Rate</p>
                <p className="font-medium text-slate-900">{activeApplication.interestRate}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">EMI</p>
                <p className="font-medium text-slate-900">{activeApplication.emi}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Purpose</p>
                <p className="font-medium text-slate-900">{activeApplication.purpose}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Application Date</p>
                <p className="font-medium text-slate-900">{activeApplication.applicationDate}</p>
              </div>
            </div>
          </div>

          {/* Decision Engine */}
          <DecisionFlowChart
            steps={[
              {
                name: 'Hard Filters',
                status: aiRiskProfile.decision === 'AUTO_REJECT' ? 'failed' : 'passed',
                details: `Age, KYC, and fraud controls validated for ${activeApplication.borrowerName}`,
              },
              {
                name: 'Policy Rules',
                status: 'passed',
                details: 'DTI: 42%, FOIR: 38%, LTV: 65%',
              },
              {
                name: 'Credit Score Evaluation',
                status: aiRiskProfile.decision === 'AUTO_APPROVE' ? 'passed' : 'pending',
                details: `Score: ${aiRiskProfile.compositeScore} - Risk grade ${aiRiskProfile.riskGrade}`,
              },
            ]}
            finalDecision={aiRiskProfile.decision}
            reason={aiRiskProfile.explanation}
          />

          {/* AI Explanation */}
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

        {/* Right Column */}
        <div className="space-y-6">
          {/* AI Credit Score */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">AI Credit Score</h3>
            <ScoreGauge
              score={aiRiskProfile.compositeScore}
              label="Composite Score"
              showConfidence
              confidence={aiRiskProfile.confidencePercent}
            />
            <p className="mt-3 text-center text-xs text-slate-500">
              Confidence interval: {aiRiskProfile.compositeScore} ± {aiRiskProfile.confidenceDelta}
            </p>
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Tier 1 (Bureau)</span>
                <span className="font-semibold text-slate-900">{aiRiskProfile.tierScores.bureau}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Tier 2 (Behavioral)</span>
                <span className="font-semibold text-slate-900">{aiRiskProfile.tierScores.behavioral}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Tier 3 (Alternative)</span>
                <span className="font-semibold text-slate-900">{aiRiskProfile.tierScores.alternative}</span>
              </div>
            </div>
          </div>

          {/* Fraud Assessment */}
          <FraudIndicators
            overallScore={15}
            signals={[
              {
                type: 'Device Fingerprint',
                severity: 'Low',
                description: 'Single device used, no anomalies detected',
                detectedAt: `${activeApplication.applicationDate} 09:45 AM`,
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
              {[
                { status: 'Submitted', date: `${activeApplication.applicationDate} 09:30 AM`, active: true },
                { status: 'Documents Verified', date: `${activeApplication.applicationDate} 11:45 AM`, active: true },
                { status: 'KYC Cleared', date: '09-Apr-2026 02:15 PM', active: activeApplication.kycStatus === 'Verified' },
                { status: 'Credit Analysis', date: '10-Apr-2026 10:20 AM', active: true },
                { status: 'Underwriting', date: '-', active: false },
              ].map((item, idx) => (
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
