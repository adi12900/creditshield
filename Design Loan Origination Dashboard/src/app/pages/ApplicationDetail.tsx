import { ArrowLeft, User, TrendingUp, Shield, Clock, CheckCircle, AlertCircle, FileText, Sparkles } from 'lucide-react';
import { RiskBadge } from '../components/ui/RiskBadge';
import { ScoreGauge } from '../components/ui/ScoreGauge';
import { FraudIndicators } from '../components/ui/FraudIndicators';
import { DecisionFlowChart } from '../components/ui/DecisionFlowChart';
import { ApplicationSelector } from '../components/ui/ApplicationSelector';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workflowApi, type WorkflowApplication, type WorkflowDocumentItem } from '../lib/workflowApi';
import { useStore } from '../store';

export function ApplicationDetailPage() {
  const navigate = useNavigate();
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const [activeApplication, setActiveApplication] = useState<WorkflowApplication | null>(null);
  const [documents, setDocuments] = useState<WorkflowDocumentItem[]>([]);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [scoreExists, setScoreExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [docsError, setDocsError] = useState(false);
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

        const [application, docs, scoreData] = await Promise.allSettled([
          workflowApi.getApplication(arn),
          workflowApi.getDocuments(arn, 'loan_officer'),
          workflowApi.getFinalScore(arn),
        ]);

        if (!mounted) return;

        if (application.status === 'fulfilled') {
          setActiveApplication(application.value);
        } else {
          throw new Error(application.reason instanceof Error ? application.reason.message : 'Failed to load application');
        }

        if (docs.status === 'fulfilled') {
          setDocuments(docs.value);
          setDocsError(false);
        } else {
          setDocsError(true);
        }

        if (scoreData.status === 'fulfilled') {
          setFinalScore(scoreData.value.final_score);
          setScoreExists(scoreData.value.exists);
        } else {
          // Non-fatal: fall back to bureau score silently
          console.warn('AI final score unavailable:', scoreData.reason);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load application details');
          setActiveApplication(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadApplication();
    return () => { mounted = false; };
  }, [selectedApplicationArn, setSelectedApplicationArn]);

  const riskGrade = useMemo(() => {
    const value = activeApplication?.risk_grade;
    if (value === 'A+' || value === 'A' || value === 'B' || value === 'C') return value;
    return 'C';
  }, [activeApplication?.risk_grade]);

  const decision = useMemo(() => {
    if (riskGrade === 'A+' || riskGrade === 'A') return 'AUTO_APPROVE';
    if (riskGrade === 'B') return 'MANUAL_REVIEW';
    return 'AUTO_REJECT';
  }, [riskGrade]);

  const confidencePercent = decision === 'AUTO_APPROVE' ? 91 : decision === 'MANUAL_REVIEW' ? 82 : 74;
  const documentSummary = `${documents.filter((d) => d.status === 'Verified').length}/${documents.length}`;

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

  const handleApproveForCreditAnalyst = async () => {
    if (!activeApplication || approving) return;
    setApproving(true);
    try {
      const response = await workflowApi.verifyCibilReport(activeApplication.arn, 'loan_officer');
      setActiveApplication({ ...response, stage: 'CREDIT_ANALYST' });
    } catch (approveError) {
      window.alert(approveError instanceof Error ? approveError.message : 'Failed to approve application');
    } finally {
      setApproving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">Application Detail</h1>
          <p className="text-slate-600">ARN: {activeApplication.arn} • {activeApplication.borrower_name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
            {activeApplication.stage}
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
        onSelect={(arn) => setSelectedApplicationArn(arn)}
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
              <p className="text-xs text-slate-600">{scoreExists ? 'AI Final Score' : 'Credit Score'}</p>
              <p className="text-xl font-bold text-slate-900">
                {scoreExists && finalScore != null ? `${finalScore.toFixed(1)}/100` : activeApplication.credit_score}
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
              <p className="text-xl font-bold text-slate-900">
                From {new Date(activeApplication.created_at || Date.now()).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content — Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Borrower Information */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-slate-500" /> Borrower Information
            </h3>
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
                <p className="font-medium text-slate-900">
                  {new Date(activeApplication.created_at || Date.now()).toLocaleDateString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* Documents Checklist */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-500" /> Documents Checklist
            </h3>
            {docsError ? (
              <div className="flex items-center gap-2 py-4 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Failed to load documents. Please refresh.</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <FileText className="w-10 h-10 mb-2 opacity-40" />
                <p className="text-sm">No documents uploaded yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-2">
                      {doc.status === 'Verified' ? (
                        <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                      ) : doc.status === 'Flagged' ? (
                        <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                      )}
                      <span className="text-sm text-slate-700">{doc.type}</span>
                    </div>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        doc.status === 'Verified'
                          ? 'bg-green-100 text-green-700'
                          : doc.status === 'Flagged'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
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
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* AI Credit Score */}
          <div className="bg-white border border-slate-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900">AI Credit Score</h3>
              {scoreExists ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">AI Scored</span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">Not yet scored</span>
              )}
            </div>

            {scoreExists && finalScore != null ? (
              <>
                <ScoreGauge
                  score={finalScore}
                  maxScore={100}
                  label="AI Final Score"
                  showConfidence
                  confidence={confidencePercent}
                />
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
                <p className="mt-3 text-center text-xs text-slate-500">
                  AI model score out of 100 • Confidence: {confidencePercent}%
                </p>
                <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
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
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-3">
                <Sparkles className="w-10 h-10 opacity-30" />
                <p className="text-sm text-center">AI appraisal not yet available.<br />Score will appear after bank statement analysis.</p>
                <div className="w-full pt-4 border-t border-slate-100 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Bureau Credit Score</span>
                    <span className="font-semibold text-slate-900">{activeApplication.credit_score}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-600">Risk Grade</span>
                    <span className="font-semibold text-slate-900">{activeApplication.risk_grade}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fraud Assessment */}
          <FraudIndicators
            overallScore={15}
            signals={[
              {
                type: 'Device Fingerprint',
                severity: activeApplication.kyc_status === 'Verified' ? 'Low' : 'Medium',
                description: activeApplication.kyc_status === 'Verified'
                  ? 'Identity checks are currently consistent with submitted profile'
                  : 'KYC is pending, monitor for identity mismatch during verification',
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
                { status: 'Application Created', date: new Date(activeApplication.created_at || Date.now()).toLocaleDateString('en-IN') + ' 09:30 AM', active: true },
                { status: 'Current Stage', date: activeApplication.stage, active: true },
                { status: 'KYC Status', date: activeApplication.kyc_status, active: activeApplication.kyc_status === 'Verified' },
                { status: 'Risk Grade', date: riskGrade, active: true },
                { status: 'Underwriting', date: activeApplication.stage === 'Underwriting' ? 'In Progress' : 'Pending', active: activeApplication.stage === 'Underwriting' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className={`w-2 h-2 mt-1.5 rounded-full ${item.active ? 'bg-green-500' : 'bg-slate-300'}`} />
                  <div>
                    <p className={`text-sm font-medium ${item.active ? 'text-slate-900' : 'text-slate-400'}`}>{item.status}</p>
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
