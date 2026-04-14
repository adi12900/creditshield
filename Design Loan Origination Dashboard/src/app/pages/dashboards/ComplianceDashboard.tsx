import { Shield, AlertTriangle, FileSearch, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StatCard } from '../../components/ui/StatCard';
import { useNavigate } from 'react-router-dom';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { useStore } from '../../store';
import { buildRBIComplianceProfile } from '../../lib/rbiCompliance';
import { workflowApi } from '../../lib/workflowApi';

type ComplianceQueueItem = {
  arn: string;
  borrowerName: string;
  kycStatus: string;
  amlStatus: string;
  fraudScore: number;
  status: 'Completed' | 'In Progress';
};

export function ComplianceDashboard() {
  const navigate = useNavigate();
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const user = useStore((state) => state.user);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);
  const rbiProfile = buildRBIComplianceProfile(selectedApplication);
  const [inProgress, setInProgress] = useState(0);
  const [complianceQueue, setComplianceQueue] = useState<ComplianceQueueItem[]>([]);

  const completedCount = complianceQueue.filter((item) => item.status === 'Completed').length;
  const clearCount = complianceQueue.filter((item) => item.kycStatus === 'Verified' || item.kycStatus === 'Clear').length;
  const pendingCount = complianceQueue.filter((item) => item.status === 'In Progress').length;
  const avgFraudScore = complianceQueue.length
    ? Math.round(complianceQueue.reduce((sum, item) => sum + item.fraudScore, 0) / complianceQueue.length)
    : 0;

  useEffect(() => {
    if (!user || user.role !== 'compliance_officer') return;
    Promise.all([workflowApi.listApplications(), workflowApi.getRegulatoryReports(user.role)])
      .then(async ([applications, reports]) => {
        const queue = await Promise.all(
          applications.map(async (app) => {
            try {
              const kyc = await workflowApi.getKycAml(app.arn, user.role);
              const isInProgress = kyc.kyc_status !== 'Verified' || kyc.aml_status !== 'Clear';
              return {
                arn: app.arn,
                borrowerName: app.borrower_name,
                kycStatus: kyc.kyc_status,
                amlStatus: kyc.aml_status,
                fraudScore: kyc.fraud_score,
                status: isInProgress ? 'In Progress' : 'Completed',
              } as ComplianceQueueItem;
            } catch {
              return {
                arn: app.arn,
                borrowerName: app.borrower_name,
                kycStatus: app.kyc_status,
                amlStatus: 'Pending',
                fraudScore: 0,
                status: 'In Progress',
              } as ComplianceQueueItem;
            }
          })
        );

        const reportInProgress = reports.filter((r: any) => r.status !== 'Submitted').length;
        setComplianceQueue(queue);
        setInProgress(reportInProgress || queue.filter((item) => item.status === 'In Progress').length);
      })
      .catch(() => undefined);
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Compliance Dashboard</h1>
        <p className="text-slate-600">KYC/AML monitoring, fraud review, and audit</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Reviews"
          value={complianceQueue.length}
          icon={Shield}
        />
        <StatCard
          title="Completed"
          value={completedCount}
          icon={Activity}
          trend={{ value: '6 more than yesterday', isPositive: true }}
        />
        <StatCard
          title="In Progress"
          value={inProgress}
          icon={FileSearch}
          subtitle="pending clearance"
        />
        <StatCard
          title="RBI Compliance Score"
          value={`${rbiProfile.score}%`}
          icon={AlertTriangle}
        />
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Search and filter borrowers to review KYC, AML, and fraud flags."
      />

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Selected Borrower Snapshot</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-500">Borrower</p>
            <p className="font-semibold text-slate-900">{selectedApplication.borrowerName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">ARN</p>
            <p className="font-semibold text-slate-900">{selectedApplication.arn}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">KYC Status</p>
            <p className="font-semibold text-slate-900">{selectedApplication.kycStatus}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Risk Grade</p>
            <p className="font-semibold text-slate-900">{selectedApplication.riskGrade}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">RBI Blocking Issues</p>
            <p className="font-semibold text-red-700">{rbiProfile.blockingIssues}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">RBI Mandatory Controls</h2>
          <button
            onClick={() => navigate('/dashboard/rbi-compliance')}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Open Clause Checklist
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Compliant</p>
            <p className="text-xl font-semibold text-green-700">
              {rbiProfile.items.filter((item) => item.status === 'Compliant').length}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Needs Attention</p>
            <p className="text-xl font-semibold text-amber-700">
              {rbiProfile.items.filter((item) => item.status === 'Attention').length}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <p className="text-xs text-slate-500">Missing</p>
            <p className="text-xl font-semibold text-red-700">
              {rbiProfile.items.filter((item) => item.status === 'Missing').length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">KYC/AML Review Queue</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">ARN</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Borrower Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">KYC Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">AML Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Fraud Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {complianceQueue.map((app) => (
                <tr
                  key={app.arn}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => {
                    setSelectedApplicationArn(app.arn);
                    navigate('/dashboard/audit-log');
                  }}
                >
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{app.arn}</td>
                  <td className="px-4 py-3 text-sm text-slate-900">{app.borrowerName}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        app.kycStatus === 'Clear'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-600'
                      }`}
                    >
                      {app.kycStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        app.amlStatus === 'Clear'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {app.amlStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`font-semibold ${
                        app.fraudScore < 30 ? 'text-green-600' : app.fraudScore < 60 ? 'text-orange-500' : 'text-red-600'
                      }`}
                    >
                      {app.fraudScore}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full font-medium ${
                        app.status === 'Completed'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-orange-100 text-orange-600'
                      }`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedApplicationArn(app.arn);
                        navigate('/dashboard/audit-log');
                      }}
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      Review →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Clearance Summary</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-1">KYC Clear</p>
              <p className="text-2xl font-bold text-green-600">{clearCount}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Pending Review</p>
              <p className="text-2xl font-bold text-orange-500">{pendingCount}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Avg Fraud Score</p>
              <p className="text-2xl font-bold text-green-600">{avgFraudScore}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/dashboard/audit-log')}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              View Audit Log
            </button>
            <button
              onClick={() => navigate('/dashboard/regulatory-reports')}
              className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              Regulatory Reports
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
