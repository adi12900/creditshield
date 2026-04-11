import { AlertTriangle, Radar, ShieldAlert, ShieldCheck } from 'lucide-react';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { useStore } from '../../store';

const fraudSignals = [
  { label: 'Identity Fraud', score: 14, severity: 'Low', source: 'Face match and KYC checks' },
  { label: 'Document Fraud', score: 22, severity: 'Low', source: 'OCR and metadata checks' },
  { label: 'Application Fraud', score: 31, severity: 'Medium', source: 'Income consistency checks' },
  { label: 'Synthetic Identity', score: 18, severity: 'Low', source: 'Cross-network identity graph' },
  { label: 'Velocity Fraud', score: 12, severity: 'Low', source: 'Device/IP behavior' },
];

export function FraudSignalsPage() {
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);

  const aggregateScore = Math.round(fraudSignals.reduce((sum, item) => sum + item.score, 0) / fraudSignals.length);
  const riskBand = aggregateScore <= 30 ? 'Low' : aggregateScore <= 60 ? 'Medium' : aggregateScore <= 85 ? 'High' : 'Critical';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fraud Signal Visualization</h1>
        <p className="text-slate-600">Multi-dimensional fraud indicators with severity and detection source.</p>
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Search and filter borrowers to review fraud indicators before disbursement."
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
          <p className="text-xs text-slate-500">Aggregate Fraud Score</p>
          <p className="font-semibold text-slate-900">{aggregateScore}/100</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Severity Band</p>
          <p className={`font-semibold ${riskBand === 'Low' ? 'text-green-700' : riskBand === 'Medium' ? 'text-amber-700' : 'text-red-700'}`}>{riskBand}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Radar className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-slate-900">Fraud Dimension Scores</h2>
        </div>

        <div className="space-y-4">
          {fraudSignals.map((signal) => (
            <div key={signal.label}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-slate-900">{signal.label}</p>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${signal.severity === 'Low' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {signal.severity}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full ${signal.score <= 30 ? 'bg-green-600' : signal.score <= 60 ? 'bg-amber-500' : 'bg-red-600'}`}
                  style={{ width: `${signal.score}%` }}
                ></div>
              </div>
              <p className="mt-1 text-xs text-slate-500">{signal.source}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-slate-900">Device Intelligence</h3>
          </div>
          <p className="text-sm text-slate-600">Single trusted device, stable geolocation, no proxy/VPN indicators.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-slate-900">Signal Timeline</h3>
          </div>
          <p className="text-sm text-slate-600">Most recent signal detected at 11-Apr-2026 10:42 AM during OCR validation.</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-slate-900">Action</h3>
          </div>
          <button className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Mark False Positive
          </button>
        </div>
      </div>
    </div>
  );
}
