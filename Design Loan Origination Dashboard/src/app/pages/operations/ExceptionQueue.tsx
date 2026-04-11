import { AlertCircle, CheckCircle2, Clock3, TrendingUp } from 'lucide-react';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { useStore } from '../../store';

const exceptions = [
  { id: 'EX-101', type: 'Document Exception', arn: 'ARN202600012', age: '2h 14m', owner: 'Ops Member A', priority: 'Medium', status: 'Open' },
  { id: 'EX-102', type: 'KYC Exception', arn: 'ARN202600013', age: '38m', owner: 'Ops Member B', priority: 'High', status: 'In Review' },
  { id: 'EX-103', type: 'Disbursement Exception', arn: 'ARN202600014', age: '1h 05m', owner: 'Ops Supervisor', priority: 'High', status: 'Open' },
  { id: 'EX-104', type: 'Handoff Exception', arn: 'ARN202600015', age: '3h 22m', owner: 'Ops Member A', priority: 'Critical', status: 'Escalated' },
  { id: 'EX-105', type: 'System Exception', arn: 'ARN202600011', age: '47m', owner: 'Ops Member C', priority: 'Medium', status: 'Open' },
];

export function ExceptionQueuePage() {
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);

  const filteredExceptions = exceptions.filter((row) => row.arn === selectedApplication.arn || row.arn.startsWith('ARN20260001'));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Exception Management Queue</h1>
        <p className="text-slate-600">Resolve operational exceptions with ownership, age, and SLA tracking.</p>
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Select the borrower file before resolving exceptions and updating operational handoffs."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Borrower</p>
          <p className="font-semibold text-slate-900">{selectedApplication.borrowerName}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">ARN</p>
          <p className="font-semibold text-slate-900">{selectedApplication.arn}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Selected Stage</p>
          <p className="font-semibold text-slate-900">{selectedApplication.stage}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Risk Grade</p>
          <p className="font-semibold text-slate-900">{selectedApplication.riskGrade}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Open Exceptions</p>
          <p className="text-2xl font-bold text-slate-900">{filteredExceptions.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">SLA Breached</p>
          <p className="text-2xl font-bold text-red-600">{selectedApplication.slaBreached ? 1 : 0}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Avg Resolution Time</p>
          <p className="text-2xl font-bold text-amber-600">{selectedApplication.stage === 'Documents Pending' ? '3.1h' : '2.4h'}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">This Week Trend</p>
          <p className="text-2xl font-bold text-green-600">-18%</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Exception ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">ARN</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Age</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Owner</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Priority</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredExceptions.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{row.id}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{row.type}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{row.arn}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{row.age}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{row.owner}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        row.priority === 'Critical'
                          ? 'bg-red-100 text-red-700'
                          : row.priority === 'High'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {row.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        row.status === 'Escalated'
                          ? 'bg-red-100 text-red-700'
                          : row.status === 'In Review'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                      Resolve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-slate-900">Overdue Handling</h3>
          </div>
          <p className="text-sm text-slate-600">Exceptions beyond SLA are escalated to supervisor automatically.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock3 className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-slate-900">Resolution Tracking</h3>
          </div>
          <p className="text-sm text-slate-600">Every resolution requires a note and updates parent application status.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-slate-900">Trend Insights</h3>
          </div>
          <p className="text-sm text-slate-600">Document exceptions for {selectedApplication.borrowerName} are trending down while handoff exceptions need attention.</p>
        </div>
      </div>
    </div>
  );
}
