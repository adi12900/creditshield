import { ShieldCheck, AlertTriangle, FileSearch, UserCheck } from 'lucide-react';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { useStore } from '../../store';
import { buildRBIComplianceProfile } from '../../lib/rbiCompliance';

export function KYCAMLPage() {
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);
  const complianceProfile = buildRBIComplianceProfile(selectedApplication);
  const digitalLendingItems = complianceProfile.items.filter((item) => item.id.startsWith('dl-'));
  const criticalPending = complianceProfile.items.filter((item) => item.isCritical && item.status !== 'Compliant');

  const checks = [
    { name: 'Aadhaar OTP', result: 'Passed', confidence: 99, provider: 'UIDAI' },
    { name: 'DigiLocker Fetch', result: 'Passed', confidence: 97, provider: 'DigiLocker' },
    { name: 'Liveness Check', result: 'Passed', confidence: 95, provider: 'Onfido' },
    { name: 'Face Match', result: 'Passed', confidence: 94, provider: 'Onfido' },
    { name: 'PEP Screening', result: 'Clear', confidence: 93, provider: 'SEON' },
    { name: 'Sanctions Screening', result: 'Clear', confidence: 98, provider: 'SEON' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">KYC / AML Screening Results</h1>
        <p className="text-slate-600">Review identity and AML checks with provider-level confidence scores.</p>
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Search and filter borrowers to view KYC/AML outcomes and compliance holds."
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
          <p className="text-xs text-slate-500">KYC Status</p>
          <p className="font-semibold text-green-700">{selectedApplication.kycStatus}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Compliance Hold</p>
          <p className={`font-semibold ${criticalPending.length === 0 ? 'text-green-700' : 'text-red-700'}`}>
            {criticalPending.length === 0 ? 'None' : `${criticalPending.length} blocking issue(s)`}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Verification Timeline</h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              criticalPending.length === 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {criticalPending.length === 0 ? 'All checks passed' : 'Compliance hold active'}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Check</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Result</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Confidence</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Provider</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {checks.map((check, index) => (
                <tr key={check.name} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-900">{check.name}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">{check.result}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">{check.confidence}%</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{check.provider}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">11-Apr-2026 0{index + 9}:12 AM</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">RBI Digital Lending Clause Controls</h2>
        <div className="space-y-3">
          {digitalLendingItems.map((item) => (
            <div key={item.id} className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.field}</p>
                  <p className="text-xs text-slate-500 mb-1">{item.chapter} - Clause {item.clause}</p>
                  <p className="text-sm text-slate-700">{item.requirement}</p>
                  <p className="text-xs text-slate-500 mt-1">Current value: {item.value}</p>
                </div>
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    item.status === 'Compliant'
                      ? 'bg-green-100 text-green-700'
                      : item.status === 'Attention'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {item.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-slate-900">KYC Verification</h3>
          </div>
          <p className="text-sm text-slate-600">Identity checks are complete with high-confidence document match.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-slate-900">AML Screening</h3>
          </div>
          <p className="text-sm text-slate-600">No sanctions/PEP hit detected across configured AML providers.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-slate-900">Action Panel</h3>
          </div>
          <button
            disabled={criticalPending.length > 0}
            className="mt-2 w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            Clear Compliance Hold
          </button>
        </div>
      </div>
    </div>
  );
}
