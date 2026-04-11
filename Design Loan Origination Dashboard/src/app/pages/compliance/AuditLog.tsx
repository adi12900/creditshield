import { Search, Download, Filter } from 'lucide-react';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { useStore } from '../../store';

const auditLogs = [
  {
    timestamp: '2026-04-10 14:23:15',
    user: 'Rajesh Kumar (Underwriter)',
    action: 'Policy Override Approved',
    resource: 'ARN202600004',
    details: 'DTI threshold override approved with justification',
    risk: 'Medium',
  },
  {
    timestamp: '2026-04-10 13:45:32',
    user: 'Priya Sharma (Credit Analyst)',
    action: 'Credit Memo Submitted',
    resource: 'ARN202600004',
    details: 'Submitted credit analysis with approval recommendation',
    risk: 'Low',
  },
  {
    timestamp: '2026-04-10 12:18:44',
    user: 'Vikram Singh (Loan Officer)',
    action: 'Document Verified',
    resource: 'ARN202600004 - PAN Card',
    details: 'Document marked as verified after OCR validation',
    risk: 'Low',
  },
  {
    timestamp: '2026-04-10 11:05:21',
    user: 'System Admin',
    action: 'Policy Rule Modified',
    resource: 'DTI_THRESHOLD_RULE',
    details: 'Updated DTI threshold from 38% to 40%',
    risk: 'High',
  },
  {
    timestamp: '2026-04-10 10:32:09',
    user: 'Meera Patel (Compliance)',
    action: 'Audit Report Generated',
    resource: 'Q1_2026_COMPLIANCE_REPORT',
    details: 'Generated quarterly compliance audit report',
    risk: 'Low',
  },
];

export function AuditLogPage() {
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Audit Log Viewer</h1>
        <p className="text-slate-600">Complete system activity tracking and audit trail</p>
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Switch borrower context before reviewing audit entries, events, and control actions."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Borrower</p>
          <p className="font-semibold text-slate-900">{selectedApplication.borrowerName}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-xs text-slate-500">ARN</p>
          <p className="font-semibold text-slate-900">{selectedApplication.arn}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Compliance Stage</p>
          <p className="font-semibold text-slate-900">{selectedApplication.stage}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-xs text-slate-500">Risk Grade</p>
          <p className="font-semibold text-slate-900">{selectedApplication.riskGrade}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search logs by user, action, or resource..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
          <button className="px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Date Range</label>
            <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600">
              <option>Last 24 Hours</option>
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>Custom Range</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Action Type</label>
            <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600">
              <option>All Actions</option>
              <option>Policy Override</option>
              <option>Document Verification</option>
              <option>User Login</option>
              <option>Configuration Change</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Risk Level</label>
            <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600">
              <option>All Levels</option>
              <option>High Risk</option>
              <option>Medium Risk</option>
              <option>Low Risk</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">User Role</label>
            <select className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600">
              <option>All Roles</option>
              <option>Loan Officer</option>
              <option>Underwriter</option>
              <option>Compliance</option>
              <option>System Admin</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Action</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Resource</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Details</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {auditLogs.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs">{log.timestamp}</td>
                  <td className="px-4 py-3 text-slate-900">{log.user}</td>
                  <td className="px-4 py-3 font-medium text-slate-900">{log.action}</td>
                  <td className="px-4 py-3 text-slate-700">{log.resource}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{log.details}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        log.risk === 'High'
                          ? 'bg-red-100 text-red-700'
                          : log.risk === 'Medium'
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {log.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
          <p className="text-sm text-slate-600">Showing 5 of 1,247 entries</p>
          <div className="flex gap-2">
            <button className="px-3 py-1 border border-slate-300 text-slate-700 rounded hover:bg-slate-50">
              Previous
            </button>
            <button className="px-3 py-1 bg-green-600 text-white rounded">1</button>
            <button className="px-3 py-1 border border-slate-300 text-slate-700 rounded hover:bg-slate-50">
              2
            </button>
            <button className="px-3 py-1 border border-slate-300 text-slate-700 rounded hover:bg-slate-50">
              3
            </button>
            <button className="px-3 py-1 border border-slate-300 text-slate-700 rounded hover:bg-slate-50">
              Next
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Total Events (24h)</p>
          <p className="text-2xl font-bold text-slate-900">1,247</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">High Risk Events</p>
          <p className="text-2xl font-bold text-red-600">8</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Policy Overrides</p>
          <p className="text-2xl font-bold text-orange-500">23</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Failed Logins</p>
          <p className="text-2xl font-bold text-slate-900">2</p>
        </div>
      </div>
    </div>
  );
}
