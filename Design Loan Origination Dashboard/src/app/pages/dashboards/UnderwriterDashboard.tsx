import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { DataTable } from '../../components/ui/DataTable';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { useNavigate } from 'react-router-dom';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { useStore } from '../../store';
import { buildRBIComplianceProfile } from '../../lib/rbiCompliance';

const mockPendingDecisions = [
  // Completed Decisions (10)
  { arn: 'ARN202600001', borrowerName: 'Rajesh Kumar', loanAmount: 500000, riskGrade: 'A+', creditScore: 730, recommendation: 'Approved', status: 'Completed' },
  { arn: 'ARN202600002', borrowerName: 'Priya Sharma', loanAmount: 750000, riskGrade: 'A', creditScore: 710, recommendation: 'Approved', status: 'Completed' },
  { arn: 'ARN202600003', borrowerName: 'Amit Patel', loanAmount: 1200000, riskGrade: 'A', creditScore: 745, recommendation: 'Approved', status: 'Completed' },
  { arn: 'ARN202600004', borrowerName: 'Vikram Singh', loanAmount: 850000, riskGrade: 'A+', creditScore: 720, recommendation: 'Approved with Conditions', status: 'Completed' },
  { arn: 'ARN202600005', borrowerName: 'Neha Gupta', loanAmount: 650000, riskGrade: 'B', creditScore: 680, recommendation: 'Approved with Conditions', status: 'Completed' },
  { arn: 'ARN202600006', borrowerName: 'Arjun Reddy', loanAmount: 2000000, riskGrade: 'A+', creditScore: 780, recommendation: 'Approved', status: 'Completed' },
  { arn: 'ARN202600007', borrowerName: 'Sanjay Mehta', loanAmount: 950000, riskGrade: 'B', creditScore: 695, recommendation: 'Approved with Conditions', status: 'Completed' },
  { arn: 'ARN202600008', borrowerName: 'Kavita Iyer', loanAmount: 1100000, riskGrade: 'A', creditScore: 750, recommendation: 'Approved', status: 'Completed' },
  { arn: 'ARN202600009', borrowerName: 'Rahul Verma', loanAmount: 800000, riskGrade: 'A+', creditScore: 735, recommendation: 'Approved', status: 'Completed' },
  { arn: 'ARN202600010', borrowerName: 'Meera Krishnan', loanAmount: 1350000, riskGrade: 'A', creditScore: 725, recommendation: 'Approved', status: 'Completed' },

  // In Progress (5)
  { arn: 'ARN202600011', borrowerName: 'Suresh Rao', loanAmount: 1200000, riskGrade: 'A', creditScore: 715, recommendation: 'Pending Review', status: 'In Progress' },
  { arn: 'ARN202600012', borrowerName: 'Lakshmi Nair', loanAmount: 900000, riskGrade: 'B', creditScore: 665, recommendation: 'Pending Review', status: 'In Progress' },
  { arn: 'ARN202600013', borrowerName: 'Karthik Menon', loanAmount: 1500000, riskGrade: 'A+', creditScore: 760, recommendation: 'Pending Review', status: 'In Progress' },
  { arn: 'ARN202600014', borrowerName: 'Pooja Desai', loanAmount: 700000, riskGrade: 'B', creditScore: 690, recommendation: 'Pending Review', status: 'In Progress' },
  { arn: 'ARN202600015', borrowerName: 'Anil Kumar', loanAmount: 1100000, riskGrade: 'A', creditScore: 740, recommendation: 'Pending Review', status: 'In Progress' },
];

export function UnderwriterDashboard() {
  const navigate = useNavigate();
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);
  const rbiProfile = buildRBIComplianceProfile(selectedApplication);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Underwriter Workbench</h1>
        <p className="text-slate-600">Final risk assessment and credit decisions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Reviewed"
          value={15}
          icon={Shield}
        />
        <StatCard
          title="Completed"
          value={10}
          icon={CheckCircle}
          trend={{ value: '3 more than yesterday', isPositive: true }}
        />
        <StatCard
          title="In Progress"
          value={5}
          icon={Clock}
          subtitle="pending decision"
        />
        <StatCard
          title="Approval Rate"
          value="78%"
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
              {mockPendingDecisions.map((app) => (
                <tr
                  key={app.arn}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => {
                    setSelectedApplicationArn(app.arn);
                    navigate('/dashboard/loan-structuring');
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
                        navigate('/dashboard/loan-structuring');
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
              <p className="text-2xl font-bold text-green-600">7</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Approved with Conditions</p>
              <p className="text-2xl font-bold text-orange-500">3</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Declined</p>
              <p className="text-2xl font-bold text-red-600">0</p>
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
