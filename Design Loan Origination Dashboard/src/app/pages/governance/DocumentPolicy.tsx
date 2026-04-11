import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { getLoanPolicy, getRequiredDocumentsForLoanType } from '../../lib/rbiPolicy';
import { useStore } from '../../store';

export function DocumentPolicyPage() {
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);
  const policy = getLoanPolicy(selectedApplication.loanType);
  const requiredDocuments = getRequiredDocumentsForLoanType(selectedApplication.loanType);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Document Policy by Loan Type</h1>
        <p className="text-slate-600">RBI product-specific mandatory document requirements and stage readiness.</p>
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Select borrower to validate product-linked mandatory documents."
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
          <p className="text-xs text-slate-500">Loan Product</p>
          <p className="font-semibold text-slate-900">{policy?.label}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">RBI Chapter</p>
          <p className="font-semibold text-slate-900">{policy?.rbiChapter}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Mandatory Document Set</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {requiredDocuments.map((document) => (
            <div key={document} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
              {document}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
