import { CheckCircle2, CreditCard, Landmark, ShieldCheck } from 'lucide-react';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { useStore } from '../../store';
import { getRBIFlowGate } from '../../lib/rbiCompliance';

const disbursementQueue = [
  { arn: 'ARN202600011', rail: 'NEFT', bank: 'HDFC •••• 8721', amount: 1200000, status: 'Pending Authorization' },
  { arn: 'ARN202600012', rail: 'RTGS', bank: 'ICICI •••• 9932', amount: 900000, status: 'Pending Authorization' },
  { arn: 'ARN202600013', rail: 'IMPS', bank: 'SBI •••• 2841', amount: 1500000, status: 'Dual Authorization Required' },
  { arn: 'ARN202600014', rail: 'NEFT', bank: 'Axis •••• 1104', amount: 700000, status: 'Pending Authorization' },
];

export function DisbursementApprovalPage() {
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);
  const disbursalGate = getRBIFlowGate(selectedApplication, 'disbursal');
  const criticalPending = disbursalGate.blockingItems;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Disbursement Approval Queue</h1>
        <p className="text-slate-600">Authorize payment instructions after validating pre-disbursement checklist.</p>
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Search and filter borrowers to process disbursement authorization."
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
          <p className="text-xs text-slate-500">Approved Amount</p>
          <p className="font-semibold text-slate-900">₹{selectedApplication.loanAmount.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Payment Rail</p>
          <p className="font-semibold text-slate-900">NEFT</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Queue</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">ARN</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Payment Rail</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Bank Account</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {disbursementQueue.map((row) => (
                  <tr key={row.arn} className="hover:bg-slate-50 cursor-pointer" onClick={() => setSelectedApplicationArn(row.arn)}>
                    <td className="px-4 py-3 text-sm font-medium text-slate-900">{row.arn}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{row.rail}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{row.bank}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">₹{row.amount.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Pre-Disbursement Checklist</h3>
          <div className="space-y-3">
            {[
              'E-sign completed',
              'KYC and AML cleared',
              'Agreement executed',
              'Bank account verified',
              'RBI critical checks compliant',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                {item}
              </div>
            ))}
          </div>

          {criticalPending.length > 0 && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm font-medium text-red-700">Disbursement blocked by RBI mandatory gaps</p>
              <ul className="mt-2 space-y-1 text-xs text-red-700">
                {criticalPending.map((item) => (
                  <li key={item.id}>• {item.field} (Clause {item.clause})</li>
                ))}
              </ul>
            </div>
          )}

          <button
            disabled={criticalPending.length > 0}
            className="mt-6 w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            Authorize Disbursement
          </button>
          <p className="mt-2 text-xs text-slate-500">UTR reference will be displayed after payment confirmation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Landmark className="w-4 h-4 text-green-600" />
            <p className="text-sm font-medium text-slate-900">Dual Authorization Threshold</p>
          </div>
          <p className="text-xs text-slate-600">Amounts above ₹10,00,000 require second approver confirmation.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-green-600" />
            <p className="text-sm font-medium text-slate-900">Rail Health</p>
          </div>
          <p className="text-xs text-slate-600">NEFT/RTGS/IMPS rails are healthy with low latency.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-4 h-4 text-green-600" />
            <p className="text-sm font-medium text-slate-900">Audit Coverage</p>
          </div>
          <p className="text-xs text-slate-600">All approvals are recorded with user ID and timestamp.</p>
        </div>
      </div>
    </div>
  );
}
