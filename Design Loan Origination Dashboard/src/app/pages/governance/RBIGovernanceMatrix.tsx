import { ShieldCheck } from 'lucide-react';
import { roleAccountabilityMatrix } from '../../lib/rbiPolicy';

export function RBIGovernanceMatrixPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">RBI Governance Accountability Matrix</h1>
        <p className="text-slate-600">
          Role responsibility flow aligned to RBI/DOR/2025-26/154 for governance, certification, grievance, outsourcing, data, recovery, and audit controls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Governance Roles</p>
          <p className="font-semibold text-slate-900">{roleAccountabilityMatrix.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Coverage Type</p>
          <p className="font-semibold text-slate-900">Board to Audit Controls</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Model Status</p>
          <p className="font-semibold text-amber-700">Policy-mapped, implementation in progress</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Role to Accountability</h2>
        <div className="space-y-4">
          {roleAccountabilityMatrix.map((entry) => (
            <div key={entry.role} className="rounded-lg border border-slate-200 p-4">
              <div className="inline-flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                <p className="font-semibold text-slate-900">{entry.role}</p>
              </div>
              <ul className="space-y-1">
                {entry.accountabilities.map((accountability) => (
                  <li key={accountability} className="text-sm text-slate-700">
                    - {accountability}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
