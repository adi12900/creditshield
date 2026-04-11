import { TrendingUp } from 'lucide-react';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { useStore } from '../../store';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const scoreData = [
  { month: 'Oct', score: 680 },
  { month: 'Nov', score: 695 },
  { month: 'Dec', score: 710 },
  { month: 'Jan', score: 720 },
  { month: 'Feb', score: 720 },
  { month: 'Mar', score: 720 },
];

const tradelines = [
  { lender: 'HDFC Credit Card', type: 'Credit Card', limit: 500000, balance: 125000, status: 'Active', dpd: 0 },
  { lender: 'SBI Home Loan', type: 'Home Loan', limit: 5000000, balance: 3500000, status: 'Active', dpd: 0 },
  { lender: 'Bajaj Finserv PL', type: 'Personal Loan', limit: 300000, balance: 0, status: 'Closed', dpd: 0 },
];

export function BureauReportPage() {
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Credit Bureau Report</h1>
        <p className="text-slate-600">
          ARN: {selectedApplication.arn} • {selectedApplication.borrowerName}
        </p>
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Switch between borrowers to inspect bureau history, tradelines, and score trend for the selected file."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm text-slate-600 mb-2">CIBIL Score</p>
          <p className="text-4xl font-bold text-slate-900">{selectedApplication.creditScore}</p>
          <div className="flex items-center gap-1 mt-2 text-green-600">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Good</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm text-slate-600 mb-2">Credit Utilization</p>
          <p className="text-4xl font-bold text-slate-900">25%</p>
          <div className="mt-3 bg-slate-100 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full" style={{ width: '25%' }}></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm text-slate-600 mb-2">Total Accounts</p>
          <p className="text-4xl font-bold text-slate-900">{selectedApplication.riskGrade === 'C' ? 5 : selectedApplication.riskGrade === 'B' ? 6 : 8}</p>
          <p className="text-sm text-slate-600 mt-2">3 Active</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm text-slate-600 mb-2">Derogatory Marks</p>
          <p className="text-4xl font-bold text-green-600">{selectedApplication.riskGrade === 'C' ? 2 : 0}</p>
          <p className="text-sm text-green-600 mt-2">Clean Record</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Score Trend (24 Months)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={scoreData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="month" stroke="#64748B" />
              <YAxis stroke="#64748B" domain={[600, 800]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#00A86B" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Credit Profile</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-600">Credit History Length</span>
                  <span className="text-sm font-semibold">{selectedApplication.riskGrade === 'A+' ? '6+ years' : selectedApplication.riskGrade === 'A' ? '5 years' : '3 years'}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-600">Payment History</span>
                  <span className="text-sm font-semibold text-green-600">
                    {selectedApplication.riskGrade === 'C' ? 'Mixed' : '100% On-time'}
                  </span>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-600">Recent Inquiries (6M)</span>
                  <span className="text-sm font-semibold">{selectedApplication.slaBreached ? 5 : 4}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-600">Total Debt</span>
                  <span className="text-sm font-semibold">₹{(selectedApplication.loanAmount / 100000).toFixed(2)}L</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Active Tradelines</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Lender</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Limit</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Balance</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">DPD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tradelines.map((trade, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-3 text-sm text-slate-900">{trade.lender}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{trade.type}</td>
                  <td className="px-4 py-3 text-sm text-slate-900">₹{(trade.limit / 100000).toFixed(2)}L</td>
                  <td className="px-4 py-3 text-sm text-slate-900">₹{(trade.balance / 100000).toFixed(2)}L</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      trade.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {trade.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-green-600">{trade.dpd}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
