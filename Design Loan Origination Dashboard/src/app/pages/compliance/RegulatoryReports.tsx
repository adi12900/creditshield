import { FileText, Download, Calendar, CheckCircle } from 'lucide-react';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { useStore } from '../../store';

const reports = [
  {
    name: 'RBI NBFC Returns - Q1 2026',
    type: 'Quarterly',
    dueDate: '2026-04-15',
    status: 'In Progress',
    completeness: 85,
  },
  {
    name: 'Fair Lending Compliance Report',
    type: 'Monthly',
    dueDate: '2026-04-05',
    status: 'Submitted',
    completeness: 100,
  },
  {
    name: 'AML/KYC Compliance Summary',
    type: 'Monthly',
    dueDate: '2026-04-05',
    status: 'Submitted',
    completeness: 100,
  },
  {
    name: 'RBI DLA Registry (CIMS) Update',
    type: 'Event-based',
    dueDate: '2026-04-12',
    status: 'In Progress',
    completeness: 70,
  },
  {
    name: 'CIC Digital Lending Submission',
    type: 'Monthly',
    dueDate: '2026-04-14',
    status: 'Pending',
    completeness: 40,
  },
  {
    name: 'Consumer Protection Report',
    type: 'Quarterly',
    dueDate: '2026-04-15',
    status: 'Pending',
    completeness: 45,
  },
];

export function RegulatoryReportsPage() {
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Regulatory Reports</h1>
        <p className="text-slate-600">Generate and submit compliance reports to regulatory authorities</p>
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Use borrower context when preparing compliance evidence and regulatory submissions."
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Selected Borrower</p>
          <p className="text-lg font-semibold text-slate-900">{selectedApplication.borrowerName}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Selected ARN</p>
          <p className="text-lg font-semibold text-slate-900">{selectedApplication.arn}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Borrower Stage</p>
          <p className="text-lg font-semibold text-slate-900">{selectedApplication.stage}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Risk Grade</p>
          <p className="text-lg font-semibold text-slate-900">{selectedApplication.riskGrade}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Reports Due This Month</p>
          <p className="text-2xl font-bold text-slate-900">6</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Submitted On Time</p>
          <p className="text-2xl font-bold text-green-600">2</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">In Progress</p>
          <p className="text-2xl font-bold text-orange-500">2</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Compliance Rate</p>
          <p className="text-2xl font-bold text-green-600">98.5%</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Upcoming & Recent Reports</h3>
        <div className="space-y-4">
          {reports.map((report, idx) => (
            <div key={idx} className="p-4 border border-slate-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    <h4 className="font-semibold text-slate-900">{report.name}</h4>
                  </div>
                  <div className="flex gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Due: {report.dueDate}
                    </div>
                    <span>Type: {report.type}</span>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 text-xs rounded-full font-medium ${
                    report.status === 'Submitted'
                      ? 'bg-green-100 text-green-700'
                      : report.status === 'In Progress'
                      ? 'bg-orange-100 text-orange-600'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {report.status}
                </span>
              </div>

              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600">Completeness</span>
                  <span className="font-semibold text-slate-900">{report.completeness}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      report.completeness === 100 ? 'bg-green-500' : 'bg-green-600'
                    }`}
                    style={{ width: `${report.completeness}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button className="flex-1 px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium">
                  View Details
                </button>
                {report.status === 'Submitted' ? (
                  <button className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center justify-center gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                ) : (
                  <button className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                    Continue Editing
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Generate New Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Report Type *</label>
            <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600">
              <option>Select report type...</option>
              <option>RBI NBFC Returns</option>
              <option>Fair Lending Compliance</option>
              <option>AML/KYC Summary</option>
              <option>Consumer Protection</option>
              <option>Data Privacy Compliance</option>
              <option>RBI DLA Registry (CIMS)</option>
              <option>CIC Digital Lending Submission</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Reporting Period *</label>
            <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600">
              <option>Select period...</option>
              <option>Q1 2026 (Jan-Mar)</option>
              <option>Q2 2026 (Apr-Jun)</option>
              <option>March 2026</option>
              <option>April 2026</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">Include Sections</label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-green-600" />
                <span className="text-sm text-slate-700">Loan Portfolio Analysis</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-green-600" />
                <span className="text-sm text-slate-700">Risk Metrics</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="w-4 h-4 text-green-600" />
                <span className="text-sm text-slate-700">Compliance Violations</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 text-green-600" />
                <span className="text-sm text-slate-700">Audit Findings</span>
              </label>
            </div>
          </div>
          <div className="md:col-span-2">
            <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Generate Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
