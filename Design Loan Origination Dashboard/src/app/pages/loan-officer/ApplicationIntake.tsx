import { CheckCircle2, ClipboardCheck, FileInput, UserRoundCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { useStore } from '../../store';
import { workflowApi } from '../../lib/workflowApi';
import { useLoanOfficerApplications } from '../../hooks/useLoanOfficerApplications';

export function ApplicationIntakePage() {
  const user = useStore((state) => state.user);
  const {
    selectedApplication,
    applications,
    setSelectedApplicationArn,
    isLoading,
    errorMessage,
  } = useLoanOfficerApplications();
  const [requiredFields, setRequiredFields] = useState<Array<{ name: string; status: string; value: string }>>([]);
  const [isFileCompleteChecked, setIsFileCompleteChecked] = useState(false);

  useEffect(() => {
    if (!selectedApplication || !user || (user.role !== 'loan_officer' && user.role !== 'system_admin')) {
      setRequiredFields([]);
      return;
    }

    workflowApi
      .getRbiCompliance(selectedApplication.arn, 'loan_officer')
      .then((payload) => {
        const items = Array.isArray(payload.items) ? payload.items : [];
        setRequiredFields(
          items.map((item: { requirement: string; status: string; value: string }) => ({
            name: item.requirement,
            status: item.status,
            value: item.value,
          }))
        );
      })
      .catch(() => setRequiredFields([]));
  }, [selectedApplication, user]);

  if (!selectedApplication) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        No applications available for intake.
      </div>
    );
  }

  const canSubmit = selectedApplication.stage === 'Submitted';
  const hasValidationData = requiredFields.length > 0;
  const hasPendingComplianceItems = requiredFields.some((field) => field.status !== 'Compliant');
  const isApplicantFileComplete = isFileCompleteChecked && hasValidationData && !hasPendingComplianceItems;
  const canSubmitToCreditAnalyst = canSubmit && isApplicantFileComplete && !isLoading;

  const handleSubmitIntake = async () => {
    if (!user || user.role !== 'loan_officer') return;
    try {
      if (!isFileCompleteChecked) {
        window.alert('Please confirm applicant file is complete before submission.');
        return;
      }

      if (hasPendingComplianceItems) {
        window.alert('Resolve all RBI mandatory validation items before submission.');
        return;
      }

      await workflowApi.submitIntake(selectedApplication.arn, user.role, { file_complete: true });
      window.alert('Application submitted to Credit Analyst queue successfully.');
      window.location.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit intake';
      window.alert(message);
    }
  };

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
        applications={applications}
      />

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Loading intake data...
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

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
          <p className="font-semibold text-green-700">{selectedApplication.stage}</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-xs text-slate-500">Applicant File Status</p>
        {isApplicantFileComplete ? (
          <p className="mt-1 inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            File Complete
          </p>
        ) : (
          <p className="mt-1 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
            File Incomplete
          </p>
        )}
        <p className="mt-2 text-xs text-slate-600">
          Submit to Credit Analyst is enabled only when file is complete.
        </p>
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
          disabled={!canSubmitToCreditAnalyst}
          onClick={handleSubmitIntake}
          className="rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          Submit To Credit Analyst
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
        <label className="mb-3 flex items-start gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
          <input
            id="file-complete-confirmation"
            name="file-complete-confirmation"
            type="checkbox"
            checked={isFileCompleteChecked}
            onChange={(event) => setIsFileCompleteChecked(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-green-600 focus:ring-green-600"
          />
          <span>I confirm applicant file is complete and ready for Credit Analyst review.</span>
        </label>
        <p className="text-sm text-slate-700">
          Intake summary: {selectedApplication.borrowerName}'s application has {requiredFields.filter((field) => field.status !== 'Compliant').length} RBI compliance item(s) requiring action.
        </p>
        {!canSubmit && (
          <p className="mt-2 text-xs text-red-700">Application can be submitted only from Submitted stage.</p>
        )}
        {canSubmit && !isFileCompleteChecked && (
          <p className="mt-2 text-xs text-amber-700">Mark applicant file as complete to enable submission.</p>
        )}
        {canSubmit && !hasValidationData && (
          <p className="mt-2 text-xs text-amber-700">RBI validation data is required before submission.</p>
        )}
        {hasPendingComplianceItems && (
          <p className="mt-2 text-xs text-red-700">All RBI mandatory validations must be Compliant before submission.</p>
        )}
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700">
          <UserRoundCheck className="w-3.5 h-3.5" />
          ARN generated and indexed
        </div>
      </div>
    </div>
  );
}
