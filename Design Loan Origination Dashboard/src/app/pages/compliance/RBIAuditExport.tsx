import { Download, FileSpreadsheet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { useStore } from '../../store';
import { buildRBIComplianceProfile } from '../../lib/rbiCompliance';
import { getLoanPolicy } from '../../lib/rbiPolicy';
import { workflowApi } from '../../lib/workflowApi';

function csvEscape(value: string) {
  const normalized = value.replace(/\r?\n/g, ' ');
  if (normalized.includes(',') || normalized.includes('"')) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

export function RBIAuditExportPage() {
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const user = useStore((state) => state.user);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);
  const selectedPolicy = getLoanPolicy(selectedApplication.loanType);
  const profile = buildRBIComplianceProfile(selectedApplication);
  const [rows, setRows] = useState<any[]>(profile.items);

  useEffect(() => {
    if (!user || user.role !== 'compliance_officer') return;
    workflowApi
      .getRbiAuditExport(selectedApplication.arn, user.role)
      .then((res: any) => {
        const mapped = (res.rows || []).map((item: any) => ({
          id: item.id,
          chapter: 'RBI - Digital Lending',
          clause: item.clause,
          field: item.id,
          status: item.status,
          isCritical: true,
          value: item.value,
        }));
        setRows(mapped.length > 0 ? mapped : profile.items);
      })
      .catch(() => undefined);
  }, [selectedApplication.arn, user]);

  const downloadCsv = () => {
    const header = [
      'ARN',
      'Borrower',
      'Chapter',
      'Clause',
      'Requirement',
      'Field',
      'Value',
      'Status',
      'Critical',
      'Action',
      'ExportedAt',
    ];

    const csvRows = rows.map((item) => [
      selectedApplication.arn,
      selectedApplication.borrowerName,
      item.chapter || 'RBI - Digital Lending',
      item.clause,
      item.requirement || item.field,
      item.field,
      item.value,
      item.status,
      item.isCritical ? 'Yes' : 'No',
      item.action || 'N/A',
      new Date().toISOString(),
    ]);

    const csv = [header, ...csvRows]
      .map((row) => row.map((cell) => csvEscape(String(cell))).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedApplication.arn}_rbi_audit_export.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">RBI Audit Export</h1>
        <p className="text-slate-600">
          Generate clause-level compliance evidence export for internal audit and regulator submissions.
        </p>
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Select borrower to generate RBI compliance evidence export."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
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
          <p className="font-semibold text-slate-900">{selectedPolicy?.label}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">RBI Chapter</p>
          <p className="font-semibold text-slate-900">{selectedPolicy?.rbiChapter}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Compliance Score</p>
          <p className="font-semibold text-slate-900">{profile.score}%</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Blocking Issues</p>
          <p className="font-semibold text-red-700">{profile.blockingIssues}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Audit Evidence Table</h2>
          <button
            onClick={downloadCsv}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Chapter / Clause</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Field</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Status</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Critical</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">Current Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50 align-top">
                  <td className="px-3 py-2 text-sm text-slate-900">
                    <p className="font-medium">{item.chapter}</p>
                    <p className="text-xs text-slate-500">Clause {item.clause}</p>
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-700">{item.field}</td>
                  <td className="px-3 py-2 text-sm">
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
                  </td>
                  <td className="px-3 py-2 text-sm text-slate-700">{item.isCritical ? 'Yes' : 'No'}</td>
                  <td className="px-3 py-2 text-sm text-slate-700">{item.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="inline-flex items-center gap-2 text-sm text-slate-700">
          <FileSpreadsheet className="w-4 h-4 text-green-700" />
          CSV includes clause-level status, criticality, and corrective actions for evidence handoff.
        </div>
      </div>
    </div>
  );
}
