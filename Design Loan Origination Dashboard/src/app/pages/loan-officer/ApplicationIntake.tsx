import { CheckCircle2, ClipboardCheck, FileInput, UserRoundCheck } from 'lucide-react';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { useStore } from '../../store';
import { buildRBIComplianceProfile, getRBIFlowGate } from '../../lib/rbiCompliance';

export function ApplicationIntakePage() {
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);

  const complianceProfile = buildRBIComplianceProfile(selectedApplication);
  const documentGate = getRBIFlowGate(selectedApplication, 'document');
  const requiredFields = complianceProfile.items
    .filter((item) => ['dl-001', 'dl-002', 'dl-003', 'dl-004', 'dl-005', 'dl-009'].includes(item.id))
    .map((item) => ({
      name: `${item.field} (${item.chapter.split(' - ')[0]} ${item.clause})`,
      status: item.status,
      value: item.value,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Application Intake</h1>
        <p className="text-slate-600">Stage 2 structured intake for formal application creation and ARN tracking.</p>
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Select a borrower to validate fields and route into document collection."
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
          <p className="text-xs text-slate-500">Loan Amount</p>
          <p className="font-semibold text-slate-900">₹{selectedApplication.loanAmount.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Status</p>
          <p className="font-semibold text-green-700">Submitted</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">RBI Mandatory Intake Validation</h2>
        <div className="space-y-3">
          {requiredFields.map((field) => (
            <div key={field.name} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm text-slate-700">{field.name}</p>
                <p className="text-xs text-slate-500">{field.value}</p>
              </div>
              {field.status === 'Compliant' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Complete
                </span>
              ) : field.status === 'Attention' ? (
                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">Attention</span>
              ) : (
                <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">Missing</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <button
          disabled={!documentGate.canProceed}
          className="rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          Submit To Document Collection
        </button>
        <button className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <span className="inline-flex items-center gap-2">
            <FileInput className="w-4 h-4" />
            Request Missing Fields
          </span>
        </button>
        <button className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <span className="inline-flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" />
            Save Intake Draft
          </span>
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm text-slate-700">
          Intake summary: {selectedApplication.borrowerName}'s application has {complianceProfile.blockingIssues} RBI blocking issue(s). Resolve missing mandatory fields before moving to document collection.
        </p>
        {!documentGate.canProceed && (
          <p className="mt-2 text-xs text-red-700">{documentGate.message}</p>
        )}
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700">
          <UserRoundCheck className="w-3.5 h-3.5" />
          ARN generated and indexed
        </div>
      </div>
    </div>
  );
}
