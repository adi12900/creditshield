import { TrendingUp, FileText, Calculator, Activity } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { DataTable } from '../../components/ui/DataTable';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { ScoreGauge } from '../../components/ui/ScoreGauge';
import { useNavigate } from 'react-router-dom';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { useStore } from '../../store';

const mockAnalysisQueue = [
  // Completed (10)
  { arn: 'ARN202600001', borrowerName: 'Rajesh Kumar', loanAmount: 500000, creditScore: 730, riskGrade: 'A+', status: 'Completed' },
  { arn: 'ARN202600002', borrowerName: 'Priya Sharma', loanAmount: 750000, creditScore: 710, riskGrade: 'A', status: 'Completed' },
  { arn: 'ARN202600003', borrowerName: 'Amit Patel', loanAmount: 1200000, creditScore: 745, riskGrade: 'A', status: 'Completed' },
  { arn: 'ARN202600004', borrowerName: 'Vikram Singh', loanAmount: 850000, creditScore: 720, riskGrade: 'A+', status: 'Completed' },
  { arn: 'ARN202600005', borrowerName: 'Neha Gupta', loanAmount: 650000, creditScore: 680, riskGrade: 'B', status: 'Completed' },
  { arn: 'ARN202600006', borrowerName: 'Arjun Reddy', loanAmount: 2000000, creditScore: 780, riskGrade: 'A+', status: 'Completed' },
  { arn: 'ARN202600007', borrowerName: 'Sanjay Mehta', loanAmount: 950000, creditScore: 695, riskGrade: 'B', status: 'Completed' },
  { arn: 'ARN202600008', borrowerName: 'Kavita Iyer', loanAmount: 1100000, creditScore: 750, riskGrade: 'A', status: 'Completed' },
  { arn: 'ARN202600009', borrowerName: 'Rahul Verma', loanAmount: 800000, creditScore: 735, riskGrade: 'A+', status: 'Completed' },
  { arn: 'ARN202600010', borrowerName: 'Meera Krishnan', loanAmount: 1350000, creditScore: 725, riskGrade: 'A', status: 'Completed' },

  // In Progress (5)
  { arn: 'ARN202600011', borrowerName: 'Suresh Rao', loanAmount: 1200000, creditScore: 715, riskGrade: 'A', status: 'In Progress' },
  { arn: 'ARN202600012', borrowerName: 'Lakshmi Nair', loanAmount: 900000, creditScore: 665, riskGrade: 'B', status: 'In Progress' },
  { arn: 'ARN202600013', borrowerName: 'Karthik Menon', loanAmount: 1500000, creditScore: 760, riskGrade: 'A+', status: 'In Progress' },
  { arn: 'ARN202600014', borrowerName: 'Pooja Desai', loanAmount: 700000, creditScore: 690, riskGrade: 'B', status: 'In Progress' },
  { arn: 'ARN202600015', borrowerName: 'Anil Kumar', loanAmount: 1100000, creditScore: 740, riskGrade: 'A', status: 'In Progress' },
];

export function CreditAnalystDashboard() {
  const navigate = useNavigate();
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Credit Analysis Workbench</h1>
        <p className="text-slate-600">Analyze creditworthiness and prepare credit memos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Analyzed"
          value={15}
          icon={FileText}
        />
        <StatCard
          title="Completed"
          value={10}
          icon={TrendingUp}
          trend={{ value: '15% increase', isPositive: true }}
        />
        <StatCard
          title="In Progress"
          value={5}
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
              {mockAnalysisQueue.map((app) => (
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
              <p className="text-2xl font-bold text-slate-900">722</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Avg DTI</p>
              <p className="text-2xl font-bold text-slate-900">38%</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Approval Rate</p>
              <p className="text-2xl font-bold text-green-600">72%</p>
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
