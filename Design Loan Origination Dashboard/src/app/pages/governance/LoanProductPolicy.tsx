import { loanProductPolicies } from '../../lib/rbiPolicy';

export function LoanProductPolicyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Loan Product Policy Mapping</h1>
        <p className="text-slate-600">
          RBI chapter-wise control coverage across loan product types for frontend workflow governance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {loanProductPolicies.map((policy) => (
          <div key={policy.type} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <p className="text-xs text-slate-500 mb-1">{policy.rbiChapter}</p>
            <h3 className="text-base font-semibold text-slate-900 mb-3">{policy.label}</h3>
            <div className="space-y-1">
              {policy.keyControls.map((control) => (
                <p key={control} className="text-sm text-slate-700">
                  - {control}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
