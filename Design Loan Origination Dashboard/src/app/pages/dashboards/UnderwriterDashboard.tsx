import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StatCard } from '../../components/ui/StatCard';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { useNavigate } from 'react-router-dom';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { useStore } from '../../store';
import { buildRBIComplianceProfile } from '../../lib/rbiCompliance';
import { workflowApi } from '../../lib/workflowApi';

type UnderwritingQueueItem = {
  arn: string;
  borrowerName: string;
  loanAmount: number;
  riskGrade: string;
  creditScore: number;
  recommendation: string;
  status: 'Completed' | 'In Progress';
};

export function UnderwriterDashboard() {
  const navigate = useNavigate();
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const user = useStore((state) => state.user);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);
  const rbiProfile = buildRBIComplianceProfile(selectedApplication);
  const [queueCount, setQueueCount] = useState(0);
  const [underwritingQueue, setUnderwritingQueue] = useState<UnderwritingQueueItem[]>([]);

  const completedCount = underwritingQueue.filter((item) => item.status === 'Completed').length;
  const approvedCount = underwritingQueue.filter((item) => item.recommendation === 'Approved').length;
  const conditionalCount = underwritingQueue.filter((item) => item.recommendation === 'Approved with Conditions').length;
  const declinedCount = underwritingQueue.filter((item) => item.recommendation === 'Declined').length;
  const approvalRate = underwritingQueue.length
    ? Math.round(((approvedCount + conditionalCount) / underwritingQueue.length) * 100)
    : 0;

  useEffect(() => {
    if (!user || user.role !== 'underwriter') return;
    Promise.all([workflowApi.underwriterDashboard(user.role), workflowApi.listApplications()])
      .then(([dashboard, applications]) => {
        const queue = applications.map((app) => {
          const recommendation = app.risk_grade === 'A+' || app.risk_grade === 'A'
            ? 'Approved'
            : app.risk_grade === 'B'
              ? 'Approved with Conditions'
              : 'Declined';

          return {
            arn: app.arn,
            borrowerName: app.borrower_name,
            loanAmount: app.loan_amount,
            riskGrade: app.risk_grade,
            creditScore: app.credit_score,
            recommendation,
            status: app.stage === 'Underwriting' ? 'In Progress' : 'Completed',
          };
        });

        const queueStat = dashboard?.stats?.find((item) => item.key === 'underwriting_queue');
        setUnderwritingQueue(queue);
        setQueueCount(queueStat?.value !== undefined ? Number(queueStat.value) : queue.filter((item) => item.status === 'In Progress').length);
      })
      .catch(() => undefined);
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Underwriter Workbench</h1>
        <p className="text-slate-600">Final risk assessment and credit decisions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Reviewed"
          value={underwritingQueue.length}
          icon={Shield}
        />
        <StatCard
          title="Completed"
          value={completedCount}
          icon={CheckCircle}
          trend={{ value: '3 more than yesterday', isPositive: true }}
        />
        <StatCard
          title="In Progress"
          value={queueCount}
          icon={Clock}
          subtitle="pending decision"
        />
        <StatCard
          title="Approval Rate"
          value={`${approvalRate}%`}
          icon={AlertTriangle}
        />
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Search and filter borrowers to underwrite the right application."
      />

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Selected Borrower Snapshot</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <p className="text-xs text-slate-500">Borrower</p>
            <p className="font-semibold text-slate-900">{selectedApplication.borrowerName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">ARN</p>
            <p className="font-semibold text-slate-900">{selectedApplication.arn}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Risk Grade</p>
            <p className="font-semibold text-slate-900">{selectedApplication.riskGrade}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Credit Score</p>
            <p className="font-semibold text-slate-900">{selectedApplication.creditScore}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">RBI Blockers</p>
            <p className={`font-semibold ${rbiProfile.blockingIssues === 0 ? 'text-green-700' : 'text-red-700'}`}>
              {rbiProfile.blockingIssues}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Underwriting Queue</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">ARN</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Borrower Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Loan Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Credit Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Risk Grade</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Recommendation</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {underwritingQueue.map((app) => (
                <tr
                  key={app.arn}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => {
                    setSelectedApplicationArn(app.arn);
                    navigate('/dashboard/decision-engine');
                  }}
                >
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{app.arn}</td>
                  <td className="px-4 py-3 text-sm text-slate-900">{app.borrowerName}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">₹{(app.loanAmount / 100000).toFixed(2)}L</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-900">{app.creditScore}</span>
                  </td>
                  <td className="px-4 py-3">
                    <RiskBadge grade={app.riskGrade} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{app.recommendation}</td>
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
                        navigate('/dashboard/decision-engine');
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
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Decision Summary</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-1">Approved</p>
              <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Approved with Conditions</p>
              <p className="text-2xl font-bold text-orange-500">{conditionalCount}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Declined</p>
              <p className="text-2xl font-bold text-red-600">{declinedCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/dashboard/loan-structuring')}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Loan Structuring
            </button>
            <button
              onClick={() => navigate('/dashboard/policy-override')}
              className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              Policy Override
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
