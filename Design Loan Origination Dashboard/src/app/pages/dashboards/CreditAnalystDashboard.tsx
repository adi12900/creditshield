import { TrendingUp, FileText, Calculator, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';
import { StatCard } from '../../components/ui/StatCard';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { useNavigate } from 'react-router-dom';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { useStore } from '../../store';
import { workflowApi } from '../../lib/workflowApi';

type AnalysisQueueItem = {
  arn: string;
  borrowerName: string;
  loanAmount: number;
  creditScore: number;
  riskGrade: string;
  status: 'Completed' | 'In Progress';
};

export function CreditAnalystDashboard() {
  const navigate = useNavigate();
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const user = useStore((state) => state.user);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);
  const [analysisQueue, setAnalysisQueue] = useState<AnalysisQueueItem[]>([]);
  const [inProgressCount, setInProgressCount] = useState(0);
  const [totalAnalyzed, setTotalAnalyzed] = useState(0);

  const completedCount = analysisQueue.filter((item) => item.status === 'Completed').length;
  const averageCreditScore = analysisQueue.length
    ? Math.round(analysisQueue.reduce((sum, item) => sum + item.creditScore, 0) / analysisQueue.length)
    : 0;
  const approvalRate = analysisQueue.length
    ? Math.round((analysisQueue.filter((item) => item.riskGrade === 'A+' || item.riskGrade === 'A').length / analysisQueue.length) * 100)
    : 0;

  useEffect(() => {
    if (!user || user.role !== 'credit_analyst') return;
    Promise.all([workflowApi.creditAnalystDashboard(user.role), workflowApi.listApplications()])
      .then(([dashboard, applications]) => {
        const queue = applications.map((app) => ({
          arn: app.arn,
          borrowerName: app.borrower_name,
          loanAmount: app.loan_amount,
          creditScore: app.credit_score,
          riskGrade: app.risk_grade,
          status: app.current_stage === 'Credit Review' || app.current_stage === 'Documents Pending' ? 'In Progress' : 'Completed',
        }));

        const inProgressStat = dashboard?.stats?.find((item) => item.key === 'in_progress');
        setAnalysisQueue(queue);
        setTotalAnalyzed(queue.length);
        setInProgressCount(inProgressStat?.value !== undefined ? Number(inProgressStat.value) : queue.filter((item) => item.status === 'In Progress').length);
      })
      .catch(() => undefined);
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Credit Analysis Workbench</h1>
        <p className="text-slate-600">Analyze creditworthiness and prepare credit memos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Analyzed"
          value={totalAnalyzed}
          icon={FileText}
        />
        <StatCard
          title="Completed"
          value={completedCount}
          icon={TrendingUp}
          trend={{ value: '15% increase', isPositive: true }}
        />
        <StatCard
          title="In Progress"
          value={inProgressCount}
          icon={Calculator}
          subtitle="active now"
        />
        <StatCard
          title="Avg. Analysis Time"
          value="2.1 hrs"
          icon={Activity}
        />
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Search and filter borrowers to analyze the correct profile in Credit Analyst workbench."
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
            <p className="text-xs text-slate-500">Credit Score</p>
            <p className="font-semibold text-slate-900">{selectedApplication.creditScore}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Loan Amount</p>
            <p className="font-semibold text-slate-900">₹{selectedApplication.loanAmount.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Analysis Queue</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">ARN</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Borrower Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Loan Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Credit Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Risk Grade</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {analysisQueue.map((app) => (
                <tr
                  key={app.arn}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => {
                    setSelectedApplicationArn(app.arn);
                    navigate('/dashboard/bureau-reports');
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
                        navigate('/dashboard/bureau-reports');
                      }}
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      View Details →
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
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Stats</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-1">Avg Credit Score</p>
              <p className="text-2xl font-bold text-slate-900">{averageCreditScore || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Avg DTI</p>
              <p className="text-2xl font-bold text-slate-900">38%</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Approval Rate</p>
              <p className="text-2xl font-bold text-green-600">{approvalRate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/dashboard/bureau-reports')}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              View Bureau Report
            </button>
            <button
              onClick={() => navigate('/dashboard/financial-ratios')}
              className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              Calculate Ratios
            </button>
            <button
              onClick={() => navigate('/dashboard/ai-score')}
              className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              AI Score Analysis
            </button>
            <button
              onClick={() => navigate('/dashboard/credit-memo')}
              className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              Create Memo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
