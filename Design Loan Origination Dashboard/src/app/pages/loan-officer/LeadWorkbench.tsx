import { BadgeCheck, Filter, PhoneCall, UserPlus2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { useStore } from '../../store';
import { workflowApi, type LoanOfficerChecklistItem } from '../../lib/workflowApi';
import { useLoanOfficerApplications } from '../../hooks/useLoanOfficerApplications';

export function LeadWorkbenchPage() {
  const user = useStore((state) => state.user);
  const {
    selectedApplication,
    applications: loanApplications,
    setSelectedApplicationArn,
    isLoading,
    errorMessage,
  } = useLoanOfficerApplications();
  const [checklist, setChecklist] = useState<LoanOfficerChecklistItem[]>([]);

  useEffect(() => {
    if (!selectedApplication || !user || (user.role !== 'loan_officer' && user.role !== 'system_admin')) {
      setChecklist([]);
      return;
    }

    workflowApi
      .getLoanOfficerPrequalificationChecklist(selectedApplication.arn, 'loan_officer')
      .then((rows) => setChecklist(rows))
      .catch(() => setChecklist([]));
  }, [selectedApplication, user]);

  if (!selectedApplication) {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        No applications available for Loan Officer view.
      </div>
    );
  }

  const leads = loanApplications.filter((application) => application.stage === 'Lead');
  const qualifiedLeads = leads.filter((application) => application.riskGrade === 'A+' || application.riskGrade === 'A').length;

  const handleMoveToIntake = async () => {
    if (!user || user.role !== 'loan_officer') return;
    try {
      await workflowApi.moveLeadToIntake(selectedApplication.arn, user.role);
      window.alert('Lead moved to intake successfully.');
      window.location.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to move lead to intake';
      window.alert(message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Lead Workbench</h1>
        <p className="text-slate-600">Stage 1 pipeline for lead qualification, assignment, and pre-screen readiness.</p>
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Search and filter incoming leads before moving them to formal application intake."
        applications={loanApplications}
      />

      {isLoading ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Loading lead workbench...
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Total Leads</p>
          <p className="text-xl font-semibold text-slate-900">{leads.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Qualified Leads</p>
          <p className="text-xl font-semibold text-green-700">{qualifiedLeads}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Selected ARN</p>
          <p className="text-xl font-semibold text-slate-900">{selectedApplication.arn}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Lead Source</p>
          <p className="text-xl font-semibold text-slate-900">{selectedApplication.loanType.replace(/_/g, ' ')}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Pre-Qualification Checklist</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {checklist.map((entry) => (
            <div key={entry.id} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
              <BadgeCheck className="w-4 h-4 text-green-600" />
              <p className="text-sm text-slate-700">{entry.item}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <button
          disabled={selectedApplication.stage !== 'Lead'}
          onClick={handleMoveToIntake}
          className="rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          Move To Application Intake
        </button>
        <button className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <div className="inline-flex items-center gap-2">
            <PhoneCall className="w-4 h-4" />
            Log Qualification Call
          </div>
        </button>
        <button className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <div className="inline-flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Apply Campaign Filter
          </div>
        </button>
      </div>

      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
        <p className="text-sm text-slate-700">
          Active lead profile: {selectedApplication.borrowerName} is currently in {selectedApplication.stage} stage and can be assigned to the next application intake queue.
        </p>
        {selectedApplication.stage !== 'Lead' && (
          <p className="mt-2 text-xs text-red-700">Lead can be moved to intake only from Lead stage.</p>
        )}
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700">
          <UserPlus2 className="w-3.5 h-3.5" />
          Lead-to-intake handoff ready
        </div>
      </div>
    </div>
  );
}
