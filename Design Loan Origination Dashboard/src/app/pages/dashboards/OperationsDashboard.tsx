import { Package, CheckCircle, Clock, GitMerge } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { RiskBadge } from '../../components/ui/RiskBadge';
import { useNavigate } from 'react-router-dom';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { useStore } from '../../store';
import { getRBIFlowGate } from '../../lib/rbiCompliance';

const mockDisbursementQueue = [
  // Completed Disbursements (10)
  { arn: 'ARN202600001', borrowerName: 'Rajesh Kumar', loanAmount: 500000, status: 'Completed', riskGrade: 'A+' as const },
  { arn: 'ARN202600002', borrowerName: 'Priya Sharma', loanAmount: 750000, status: 'Completed', riskGrade: 'A' as const },
  { arn: 'ARN202600003', borrowerName: 'Amit Patel', loanAmount: 1200000, status: 'Completed', riskGrade: 'A' as const },
  { arn: 'ARN202600004', borrowerName: 'Vikram Singh', loanAmount: 850000, status: 'Completed', riskGrade: 'A+' as const },
  { arn: 'ARN202600005', borrowerName: 'Neha Gupta', loanAmount: 650000, status: 'Completed', riskGrade: 'B' as const },
  { arn: 'ARN202600006', borrowerName: 'Arjun Reddy', loanAmount: 2000000, status: 'Completed', riskGrade: 'A+' as const },
  { arn: 'ARN202600007', borrowerName: 'Sanjay Mehta', loanAmount: 950000, status: 'Completed', riskGrade: 'B' as const },
  { arn: 'ARN202600008', borrowerName: 'Kavita Iyer', loanAmount: 1100000, status: 'Completed', riskGrade: 'A' as const },
  { arn: 'ARN202600009', borrowerName: 'Rahul Verma', loanAmount: 800000, status: 'Completed', riskGrade: 'A+' as const },
  { arn: 'ARN202600010', borrowerName: 'Meera Krishnan', loanAmount: 1350000, status: 'Completed', riskGrade: 'A' as const },

  // In Progress Disbursements (5)
  { arn: 'ARN202600011', borrowerName: 'Suresh Rao', loanAmount: 1200000, status: 'In Progress', riskGrade: 'A' as const },
  { arn: 'ARN202600012', borrowerName: 'Lakshmi Nair', loanAmount: 900000, status: 'In Progress', riskGrade: 'B' as const },
  { arn: 'ARN202600013', borrowerName: 'Karthik Menon', loanAmount: 1500000, status: 'In Progress', riskGrade: 'A+' as const },
  { arn: 'ARN202600014', borrowerName: 'Pooja Desai', loanAmount: 700000, status: 'In Progress', riskGrade: 'B' as const },
  { arn: 'ARN202600015', borrowerName: 'Anil Kumar', loanAmount: 1100000, status: 'In Progress', riskGrade: 'A' as const },
];

export function OperationsDashboard() {
  const navigate = useNavigate();
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);
  const disbursalGate = getRBIFlowGate(selectedApplication, 'disbursal');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Operations Dashboard</h1>
        <p className="text-slate-600">Disbursement execution and operational management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Disbursements"
          value={15}
          icon={Package}
        />
        <StatCard
          title="Completed"
          value={10}
          icon={CheckCircle}
          trend={{ value: '8 more than yesterday', isPositive: true }}
        />
        <StatCard
          title="In Progress"
          value={5}
          icon={Clock}
          subtitle="pending disbursement"
        />
        <StatCard
          title="Disbursement Readiness"
          value={disbursalGate.canProceed ? '100%' : 'Blocked'}
          icon={GitMerge}
          subtitle={disbursalGate.canProceed ? 'checklist pass rate' : `${disbursalGate.blockingItems.length} RBI blockers`}
        />
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Search and filter borrowers to execute disbursement and operational handoff."
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
            <p className="text-xs text-slate-500">Loan Amount</p>
            <p className="font-semibold text-slate-900">₹{selectedApplication.loanAmount.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Stage</p>
            <p className="font-semibold text-slate-900">{selectedApplication.stage}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Disbursement Queue</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">ARN</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Borrower Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Loan Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Risk Grade</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {mockDisbursementQueue.map((app) => (
                <tr
                  key={app.arn}
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => {
                    setSelectedApplicationArn(app.arn);
                    navigate('/dashboard/document-vault');
                  }}
                >
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{app.arn}</td>
                  <td className="px-4 py-3 text-sm text-slate-900">{app.borrowerName}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">₹{(app.loanAmount / 100000).toFixed(2)}L</td>
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
                        navigate('/dashboard/document-vault');
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
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Disbursement Summary</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-1">Total Disbursed</p>
              <p className="text-2xl font-bold text-green-600">₹14.75Cr</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Pending Disbursement</p>
              <p className="text-2xl font-bold text-orange-500">₹5.25Cr</p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Avg Processing Time</p>
              <p className="text-2xl font-bold text-slate-900">2.4 hrs</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/dashboard/disbursement-approval')}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Authorize Disbursement
            </button>
            <button
              onClick={() => navigate('/dashboard/disbursement-approval')}
              className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              Disbursement Checklist
            </button>
            <button
              onClick={() => navigate('/dashboard/exception-queue')}
              className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              Exception Queue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
