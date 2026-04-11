import { CheckCircle2, FileWarning, ShieldAlert, ShieldCheck } from 'lucide-react';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { useStore } from '../../store';
import { buildRBIComplianceProfile } from '../../lib/rbiCompliance';
import { getLoanPolicy } from '../../lib/rbiPolicy';

const statusClasses = {
  Compliant: 'bg-green-100 text-green-700',
  Attention: 'bg-amber-100 text-amber-700',
  Missing: 'bg-red-100 text-red-700',
};

export function RBIComplianceCenterPage() {
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);
  const selectedPolicy = getLoanPolicy(selectedApplication.loanType);
  const profile = buildRBIComplianceProfile(selectedApplication);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">RBI Compliance Center</h1>
        <p className="text-slate-600">
          Mandatory field checklist mapped to RBI/DOR/2025-26/154 for digital lending, borrower disclosure, data controls, and disbursal governance.
        </p>
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Select borrower to inspect clause-level compliance and blocking gaps."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Borrower</p>
          <p className="font-semibold text-slate-900">{selectedApplication.borrowerName}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">ARN</p>
          <p className="font-semibold text-slate-900">{selectedApplication.arn}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Loan Product</p>
          <p className="font-semibold text-slate-900">{selectedPolicy?.label}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">RBI Chapter</p>
          <p className="font-semibold text-slate-900">{selectedPolicy?.rbiChapter}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Compliance Score</p>
          <p className="font-semibold text-slate-900">{profile.score}%</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Blocking Issues</p>
          <p className="font-semibold text-red-700">{profile.blockingIssues}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-slate-900">Compliant Controls</h3>
          </div>
          <p className="text-2xl font-bold text-green-700">
            {profile.items.filter((item) => item.status === 'Compliant').length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-slate-900">Needs Attention</h3>
          </div>
          <p className="text-2xl font-bold text-amber-700">
            {profile.items.filter((item) => item.status === 'Attention').length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-2">
            <FileWarning className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-slate-900">Missing Mandatory</h3>
          </div>
          <p className="text-2xl font-bold text-red-700">
            {profile.items.filter((item) => item.status === 'Missing').length}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Clause-Level RBI Checklist</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Chapter / Clause</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Requirement</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Field</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Value</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {profile.items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 align-top">
                  <td className="px-4 py-3 text-sm text-slate-900">
                    <p className="font-medium">{item.chapter}</p>
                    <p className="text-xs text-slate-500">Clause {item.clause}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{item.requirement}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{item.field}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{item.value}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClasses[item.status]}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Corrective Actions</h2>
        <div className="space-y-3">
          {profile.items
            .filter((item) => item.status !== 'Compliant')
            .map((item) => (
              <div key={`${item.id}-action`} className="rounded-lg border border-slate-200 px-4 py-3">
                <p className="text-sm font-medium text-slate-900">{item.field}</p>
                <p className="text-xs text-slate-500 mb-1">{item.chapter} - Clause {item.clause}</p>
                <p className="text-sm text-slate-700">{item.action}</p>
              </div>
            ))}
          {profile.items.every((item) => item.status === 'Compliant') && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 inline-flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              No corrective action pending for selected borrower.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
