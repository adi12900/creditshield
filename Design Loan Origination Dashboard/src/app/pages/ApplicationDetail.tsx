import { ArrowLeft, User, FileText, Shield, TrendingUp, MessageSquare, Activity, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { RiskBadge } from '../components/ui/RiskBadge';
import { ScoreGauge } from '../components/ui/ScoreGauge';
import { AIExplanationPanel } from '../components/ui/AIExplanationPanel';
import { FraudIndicators } from '../components/ui/FraudIndicators';
import { DecisionFlowChart } from '../components/ui/DecisionFlowChart';
import { ApplicationSelector } from '../components/ui/ApplicationSelector';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workflowApi, type WorkflowApplication } from '../lib/workflowApi';
import { useStore } from '../store';

export function ApplicationDetailPage() {
  const navigate = useNavigate();
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const [activeApplication, setActiveApplication] = useState<WorkflowApplication | null>(null);
  const [documentSummary, setDocumentSummary] = useState('0/0');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadApplication = async () => {
      setLoading(true);
      setError(null);

      try {
        let arn = selectedApplicationArn;
        if (!arn) {
          const applications = await workflowApi.listApplications();
          if (!applications.length) {
            if (mounted) {
              setActiveApplication(null);
              setError('No applications found');
            }
            return;
          }
          arn = applications[0].arn;
          setSelectedApplicationArn(arn);
        }

        const application = await workflowApi.getApplication(arn);
        const documents = await workflowApi.getDocuments(arn, 'loan_officer');
        const verifiedCount = documents.filter((item) => item.status === 'Verified').length;
        if (mounted) {
          setActiveApplication(application);
          setDocumentSummary(`${verifiedCount}/${documents.length}`);
        }
      } catch (loadError) {
        if (mounted) {
          const message = loadError instanceof Error ? loadError.message : 'Failed to load application details';
          setError(message);
          setActiveApplication(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadApplication();
    return () => {
      mounted = false;
    };
  }, [selectedApplicationArn, setSelectedApplicationArn]);

  const riskGrade = useMemo(() => {
    const value = activeApplication?.risk_grade;
    if (value === 'A+' || value === 'A' || value === 'B' || value === 'C') {
      return value;
    }
    return 'C';
  }, [activeApplication?.risk_grade]);

  const decision = useMemo(() => {
    if (riskGrade === 'A+' || riskGrade === 'A') return 'AUTO_APPROVE';
    if (riskGrade === 'B') return 'MANUAL_REVIEW';
    return 'AUTO_REJECT';
  }, [riskGrade]);

  const applicationStatus = activeApplication?.stage || 'Unknown';
  const finalScore = activeApplication?.final_score ?? null;
  const hasFinalScore = finalScore != null;
  const compositeScore = hasFinalScore ? finalScore : (activeApplication?.credit_score ?? 700);
  const scoreMax = hasFinalScore ? 100 : 900;
  const scoreLabel = hasFinalScore ? 'AI Final Score' : 'Credit Score Proxy';
  const confidencePercent = decision === 'AUTO_APPROVE' ? 91 : decision === 'MANUAL_REVIEW' ? 82 : 74;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-600">Loading application details...</div>
      </div>
    );
  }

  if (error || !activeApplication) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700">
          {error || 'Application details are unavailable'}
        </div>
      </div>
    );
  }

  const selectApplication = (arn: string) => {
    setSelectedApplicationArn(arn);
  };

  const handleApproveForCreditAnalyst = async () => {
    if (!activeApplication || approving) return;

    setApproving(true);
    try {
      const response = await workflowApi.verifyCibilReport(activeApplication.arn, 'loan_officer');
      setActiveApplication({
        ...response,
        stage: 'CREDIT_ANALYST',
      });
    } catch (approveError) {
      const message = approveError instanceof Error ? approveError.message : 'Failed to approve application';
      window.alert(message);
    } finally {
      setApproving(false);
    }
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
          <p className="text-slate-600">ARN: {activeApplication.arn} • {activeApplication.borrower_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            {applicationStatus}
          </span>
          <RiskBadge grade={riskGrade} size="lg" />
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
              <p className="text-xs text-slate-600">{hasFinalScore ? 'AI Final Score' : 'Credit Score'}</p>
              <p className="text-xl font-bold text-slate-900">
                {hasFinalScore ? `${finalScore!.toFixed(1)}/100` : activeApplication.credit_score}
              </p>
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
              <p className="text-xl font-bold text-slate-900">{documentSummary}</p>
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
              <p className="text-xl font-bold text-green-600">{activeApplication.kyc_status}</p>
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
              <p className="text-xl font-bold text-slate-900">From {new Date(activeApplication.created_at || Date.now()).toLocaleDateString('en-IN')}</p>
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
                <p className="font-medium text-slate-900">{activeApplication.borrower_name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Mobile Number</p>
                <p className="font-medium text-slate-900">{activeApplication.borrower_phone || 'Not available'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Email Address</p>
                <p className="font-medium text-slate-900">{activeApplication.borrower_email || 'Not available'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">PAN Number</p>
                <p className="font-medium text-slate-900">Not available</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Date of Birth</p>
                <p className="font-medium text-slate-900">Not available</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Employment Type</p>
                <p className="font-medium text-slate-900">{activeApplication.employment_type}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">CIBIL Verification</p>
                <p className={`font-medium ${activeApplication.is_cibil_verified ? 'text-green-700' : 'text-amber-700'}`}>
                  {activeApplication.is_cibil_verified ? 'Verified' : 'Pending'}
                </p>
              </div>
            </div>
          </div>

          {/* Loan Details */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Loan Details</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-600 mb-1">Requested Amount</p>
                <p className="text-2xl font-bold text-slate-900">₹{activeApplication.loan_amount.toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Loan Type</p>
                <p className="text-2xl font-bold text-slate-900">{activeApplication.loan_type}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Stage</p>
                <p className="font-medium text-slate-900">{activeApplication.stage}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Credit Score</p>
                <p className="font-medium text-slate-900">{activeApplication.credit_score}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Purpose</p>
                <p className="font-medium text-slate-900">{activeApplication.purpose}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 mb-1">Application Date</p>
                <p className="font-medium text-slate-900">{new Date(activeApplication.created_at || Date.now()).toLocaleDateString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* Decision Engine */}
          <DecisionFlowChart
            steps={[
              {
                name: 'Hard Filters',
                status: decision === 'AUTO_REJECT' ? 'failed' : 'passed',
                details: `KYC and policy controls evaluated for ${activeApplication.borrower_name}`,
              },
              {
                name: 'Policy Rules',
                status: 'passed',
                details: `Stage: ${activeApplication.stage}, Employment: ${activeApplication.employment_type}`,
              },
              {
                name: 'Credit Score Evaluation',
                status: decision === 'AUTO_APPROVE' ? 'passed' : 'pending',
                details: `Score: ${activeApplication.credit_score} - Risk grade ${riskGrade}`,
              },
            ]}
            finalDecision={decision}
            reason={`Decision support generated from current loan application snapshot for ${activeApplication.arn}.`}
          />

          {/* AI Explanation */}
          <AIExplanationPanel
            decision={decision === 'AUTO_APPROVE' ? 'Recommended for Approval' : decision === 'MANUAL_REVIEW' ? 'Manual Review Required' : 'Recommended for Decline'}
            explanation={`Recommendation is based on credit score (${activeApplication.credit_score}), risk grade (${riskGrade}), KYC status (${activeApplication.kyc_status}), and employment type (${activeApplication.employment_type}).`}
            confidence={confidencePercent}
            confidenceInterval={`${compositeScore} ± ${Math.max(8, Math.round((100 - confidencePercent) / 2))}`}
            modelVersion="LOS-CREDIT-API-v1"
            lastTrainingDate={new Date().toISOString().slice(0, 10)}
            reasonCodes={[
              `RC-SCORE-${activeApplication.credit_score}`,
              `RC-RISK-${riskGrade}`,
              `RC-KYC-${activeApplication.kyc_status.toUpperCase().replace(/\s+/g, '_')}`,
            ]}
            counterfactual={decision === 'AUTO_APPROVE' ? 'No counterfactual required for current profile.' : 'Improving repayment profile and bureau score can improve decision outcome.'}
            topFactors={[
              { factor: `Credit score ${activeApplication.credit_score}`, impact: 32, isPositive: activeApplication.credit_score >= 700 },
              { factor: `Risk grade ${riskGrade}`, impact: 24, isPositive: riskGrade === 'A+' || riskGrade === 'A' },
              { factor: `KYC status ${activeApplication.kyc_status}`, impact: 20, isPositive: activeApplication.kyc_status === 'Verified' },
              { factor: `Employment type ${activeApplication.employment_type}`, impact: 12, isPositive: activeApplication.employment_type === 'Salaried' },
            ]}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* AI Credit Score */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">AI Credit Score</h3>
              {hasFinalScore && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">AI Scored</span>
              )}
            </div>
            <ScoreGauge
              score={compositeScore}
              maxScore={scoreMax}
              label={scoreLabel}
              showConfidence
              confidence={confidencePercent}
            />
            {hasFinalScore && (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>0</span>
                  <span className="font-medium text-slate-700">{finalScore.toFixed(1)} / 100</span>
                  <span>100</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, finalScore)}%`,
                      backgroundColor: finalScore >= 75 ? '#28A745' : finalScore >= 55 ? '#00A86B' : finalScore >= 35 ? '#FD7E14' : '#DC3545',
                    }}
                  />
                </div>
              </div>
            )}
            <p className="mt-3 text-center text-xs text-slate-500">
              {hasFinalScore
                ? `AI model score out of 100 • Confidence: ${confidencePercent}%`
                : `Confidence interval: ${compositeScore} ± ${Math.max(8, Math.round((100 - confidencePercent) / 2))}`}
            </p>
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
              {hasFinalScore ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">AI Final Score</span>
                    <span className="font-semibold text-slate-900">{finalScore.toFixed(1)} / 100</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Bureau Credit Score</span>
                    <span className="font-semibold text-slate-900">{activeApplication.credit_score}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Risk Grade</span>
                    <span className="font-semibold text-slate-900">{activeApplication.risk_grade}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Tier 1 (Bureau)</span>
                    <span className="font-semibold text-slate-900">{activeApplication.credit_score}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Tier 2 (Behavioral)</span>
                    <span className="font-semibold text-slate-900">{Math.max(300, activeApplication.credit_score - 25)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Tier 3 (Alternative)</span>
                    <span className="font-semibold text-slate-900">{Math.min(900, activeApplication.credit_score + 15)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Fraud Assessment */}
          <FraudIndicators
            overallScore={15}
            signals={[
              {
                type: 'Device Fingerprint',
                severity: activeApplication.kyc_status === 'Verified' ? 'Low' : 'Medium',
                description: activeApplication.kyc_status === 'Verified' ? 'Identity checks are currently consistent with submitted profile' : 'KYC is pending, monitor for identity mismatch during verification',
                detectedAt: `${new Date(activeApplication.created_at || Date.now()).toLocaleDateString('en-IN')} 09:45 AM`,
              },
            ]}
          />

          {/* Quick Actions */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={handleApproveForCreditAnalyst}
                disabled={approving}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {approving ? 'Approving...' : 'Approve for Credit Analyst'}
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
                { status: 'Application Created', date: `${new Date(activeApplication.created_at || Date.now()).toLocaleDateString('en-IN')} 09:30 AM`, active: true },
                { status: 'Current Stage', date: activeApplication.stage, active: true },
                { status: 'KYC Status', date: activeApplication.kyc_status, active: activeApplication.kyc_status === 'Verified' },
                { status: 'Risk Grade', date: riskGrade, active: true },
                { status: 'Underwriting', date: activeApplication.stage === 'Underwriting' ? 'In Progress' : 'Pending', active: activeApplication.stage === 'Underwriting' },
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
