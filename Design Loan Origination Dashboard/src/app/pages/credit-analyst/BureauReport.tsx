import { TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { useStore } from '../../store';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { workflowApi, type WorkflowBureauReport } from '../../lib/workflowApi';

export function BureauReportPage() {
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const user = useStore((state) => state.user);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);
  const [bureauReport, setBureauReport] = useState<WorkflowBureauReport | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'credit_analyst') return;
    workflowApi
      .getBureauReport(selectedApplicationArn, user.role)
      .then((report) => setBureauReport(report))
      .catch(() => setBureauReport(null));
  }, [selectedApplicationArn, user]);

  const scoreData = bureauReport?.score_trend ?? [];
  const tradelines = bureauReport?.tradelines ?? [];
  const creditScore = bureauReport?.credit_score ?? selectedApplication.creditScore;
  const totalLimit = tradelines.reduce((sum, line) => sum + line.limit, 0);
  const totalBalance = tradelines.reduce((sum, line) => sum + line.balance, 0);
  const utilizationPct = totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;
  const derogatoryMarks = tradelines.filter((line) => line.dpd > 0).length;
  const activeAccounts = tradelines.filter((line) => line.status === 'Active').length;

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
          <p className="text-4xl font-bold text-slate-900">{creditScore}</p>
          <div className="flex items-center gap-1 mt-2 text-green-600">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">Good</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm text-slate-600 mb-2">Credit Utilization</p>
          <p className="text-4xl font-bold text-slate-900">{utilizationPct}%</p>
          <div className="mt-3 bg-slate-100 rounded-full h-2">
            <div className="bg-green-600 h-2 rounded-full" style={{ width: `${Math.min(utilizationPct, 100)}%` }}></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm text-slate-600 mb-2">Total Accounts</p>
          <p className="text-4xl font-bold text-slate-900">{tradelines.length}</p>
          <p className="text-sm text-slate-600 mt-2">{activeAccounts} Active</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <p className="text-sm text-slate-600 mb-2">Derogatory Marks</p>
          <p className={`text-4xl font-bold ${derogatoryMarks === 0 ? 'text-green-600' : 'text-red-600'}`}>{derogatoryMarks}</p>
          <p className={`text-sm mt-2 ${derogatoryMarks === 0 ? 'text-green-600' : 'text-red-600'}`}>
            {derogatoryMarks === 0 ? 'Clean Record' : 'Review Required'}
          </p>
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
                  <span className="text-sm font-semibold">{Math.max(1, Math.ceil(tradelines.length / 2))}</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-600">Total Debt</span>
                  <span className="text-sm font-semibold">₹{(totalBalance / 100000).toFixed(2)}L</span>
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
