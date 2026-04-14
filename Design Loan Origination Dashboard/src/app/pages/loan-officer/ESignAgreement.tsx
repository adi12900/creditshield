import { CheckCircle2, FileSignature, ShieldCheck, TimerReset } from 'lucide-react';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { useStore } from '../../store';
import { getRBIFlowGate } from '../../lib/rbiCompliance';
import { workflowApi } from '../../lib/workflowApi';

export function ESignAgreementPage() {
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const user = useStore((state) => state.user);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);
  const esignGate = getRBIFlowGate(selectedApplication, 'esign');

  const checklist = [
    { item: 'Offer generated and accepted', done: true },
    { item: 'Agreement template populated', done: true },
    { item: 'Borrower OTP authentication', done: true },
    { item: 'Digital signature captured', done: selectedApplication.stage !== 'Lead' },
    { item: 'Executed copy delivered', done: selectedApplication.stage === 'Disbursed' || selectedApplication.stage === 'Offer Sent' },
  ];

  const handleSendEsign = async () => {
    if (!user || user.role !== 'loan_officer') return;
    try {
      await workflowApi.sendEsignLink(selectedApplication.arn, user.role);
      window.alert('E-sign link sent successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send e-sign link';
      window.alert(message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">E-Sign and Agreement</h1>
        <p className="text-slate-600">Stage 9 agreement execution, legal validation, and disbursement readiness checks.</p>
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Pick the approved borrower and complete digital agreement execution before disbursement."
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
          <p className="text-xs text-slate-500">Offer Terms</p>
          <p className="font-semibold text-slate-900">{selectedApplication.interestRate}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Agreement Status</p>
          <p className="font-semibold text-green-700">E-Sign Pending</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Execution Checklist</h2>
        <div className="space-y-3">
          {checklist.map((entry) => (
            <div key={entry.item} className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
              <p className="text-sm text-slate-700">{entry.item}</p>
              {entry.done ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Complete
                </span>
              ) : (
                <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">Pending</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <button
          disabled={!esignGate.canProceed}
          onClick={handleSendEsign}
          className="rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          Send E-Sign Link
        </button>
        <button className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <span className="inline-flex items-center gap-2">
            <FileSignature className="w-4 h-4" />
            Regenerate Agreement PDF
          </span>
        </button>
        <button className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <span className="inline-flex items-center gap-2">
            <TimerReset className="w-4 h-4" />
            Resend OTP
          </span>
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm text-slate-700">
          Legal note: executed agreements are stored in the document vault with immutable audit trail before disbursement authorization.
        </p>
        {!esignGate.canProceed && (
          <p className="mt-2 text-xs text-red-700">{esignGate.message}</p>
        )}
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700">
          <ShieldCheck className="w-3.5 h-3.5" />
          E-sign workflow compliant
        </div>
      </div>
    </div>
  );
}
