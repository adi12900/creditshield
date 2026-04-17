import { FileText, ChevronRight, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLoanApplications } from '../../data/loanApplications';
import { useStore } from '../../store';
import { workflowApi, type WorkflowApplication } from '../../lib/workflowApi';

function formatMoney(value: number): string {
  return `Rs ${value.toLocaleString('en-IN')}`;
}

export function DocumentQueuePage() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const [search, setSearch] = useState('');
  const [applications, setApplications] = useState<WorkflowApplication[]>([]);

  useEffect(() => {
    if (!user || (user.role !== 'loan_officer' && user.role !== 'system_admin')) {
      setApplications([]);
      return;
    }

    workflowApi
      .listApplications()
      .then((rows) => setApplications(rows))
      .catch(() => {
        const fallbackRows = getLoanApplications().map((item) => ({
          arn: item.arn,
          borrower_name: item.borrowerName,
          loan_amount: item.loanAmount,
          stage: item.stage,
          risk_grade: item.riskGrade,
          credit_score: item.creditScore,
          kyc_status: item.kycStatus,
          employment_type: item.employmentType,
          purpose: item.purpose,
        }));
        setApplications(fallbackRows);
      });
  }, [user]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return applications;
    return applications.filter((item) =>
      item.arn.toLowerCase().includes(needle) || item.borrower_name.toLowerCase().includes(needle)
    );
  }, [applications, search]);

  const openDetail = (arn: string) => {
    setSelectedApplicationArn(arn);
    navigate(`/dashboard/document-review/${encodeURIComponent(arn)}`);
  };

  return (
    <div className="min-h-screen space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Document Review Queue</h1>
        <p className="text-slate-600">Select a borrower to open the full document review page.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by ARN or applicant name"
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <button
            key={item.arn}
            onClick={() => openDetail(item.arn)}
            className="w-full text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-green-500 hover:shadow-sm transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-slate-900">{item.borrower_name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.arn}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-slate-50 p-2.5">
                <p className="text-xs text-slate-500">Loan Amount</p>
                <p className="font-semibold text-slate-900">{formatMoney(item.loan_amount)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <p className="text-xs text-slate-500">Stage</p>
                <p className="font-semibold text-slate-900">{item.stage}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <p className="text-xs text-slate-500">Risk</p>
                <p className="font-semibold text-slate-900">{item.risk_grade}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5">
                <p className="text-xs text-slate-500">KYC</p>
                <p className="font-semibold text-slate-900">{item.kyc_status}</p>
              </div>
            </div>

            <div className="mt-3 inline-flex items-center gap-1.5 text-green-700 text-sm font-medium">
              <FileText className="w-4 h-4" />
              Open Document Review
            </div>
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-600">
          No matching applications found.
        </div>
      )}
    </div>
  );
}
