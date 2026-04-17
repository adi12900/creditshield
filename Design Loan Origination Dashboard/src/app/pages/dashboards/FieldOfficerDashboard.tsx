import { ClipboardCheck, Search, UserRound, Filter, ArrowRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { workflowApi, type FieldOfficerCaseItem } from '../../lib/workflowApi';
import { useStore } from '../../store';

const statusOptions = ['all', 'Pending Visit', 'In Progress', 'Completed'] as const;

function formatMoney(value: number): string {
  return `Rs ${value.toLocaleString('en-IN')}`;
}

export function FieldOfficerDashboard() {
  const navigate = useNavigate();
  const user = useStore((state) => state.user);
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>('all');
  const [search, setSearch] = useState('');
  const [cases, setCases] = useState<FieldOfficerCaseItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'field_officer') return;
    setLoading(true);
    workflowApi
      .getFieldOfficerCases('field_officer', statusFilter, search)
      .then((rows) => setCases(rows))
      .catch(() => setCases([]))
      .finally(() => setLoading(false));
  }, [search, statusFilter, user]);

  const counts = useMemo(() => {
    return {
      all: cases.length,
      pending: cases.filter((item) => item.status === 'Pending Visit').length,
      inProgress: cases.filter((item) => item.status === 'In Progress').length,
      completed: cases.filter((item) => item.status === 'Completed').length,
    };
  }, [cases]);

  return (
    <div className="min-h-screen space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Field Officer Dashboard</h1>
        <p className="text-slate-600">Assigned applications for field verification visits.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Assigned Cases</p>
          <p className="text-2xl font-semibold text-slate-900 mt-1">{counts.all}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Pending Visit</p>
          <p className="text-2xl font-semibold text-amber-700 mt-1">{counts.pending}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">In Progress</p>
          <p className="text-2xl font-semibold text-blue-700 mt-1">{counts.inProgress}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">Completed</p>
          <p className="text-2xl font-semibold text-green-700 mt-1">{counts.completed}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by applicant or ARN"
              className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
          <div className="relative">
            <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as (typeof statusOptions)[number])}
              className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>{option === 'all' ? 'All Statuses' : option}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {cases.map((item) => (
          <button
            key={item.arn}
            onClick={() => navigate(`/dashboard/field-visit/${encodeURIComponent(item.arn)}`)}
            className="w-full text-left bg-white border border-slate-200 rounded-xl p-5 hover:border-green-500 hover:shadow-sm transition"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-900">{item.borrower_name}</p>
                <p className="text-xs text-slate-500 mt-1">ARN: {item.arn}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-500" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Loan Amount</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">{formatMoney(item.loan_amount)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Status</p>
                <p className="text-sm font-semibold text-slate-900 mt-1">{item.status}</p>
              </div>
            </div>
            <div className="mt-4 inline-flex items-center gap-2 text-sm text-green-700 font-medium">
              <ClipboardCheck className="w-4 h-4" />
              Open Visit Case
            </div>
          </button>
        ))}
      </div>

      {!loading && cases.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
          <UserRound className="w-10 h-10 text-slate-400 mx-auto" />
          <p className="text-slate-600 mt-3">No assigned cases found for the selected filters.</p>
        </div>
      )}
    </div>
  );
}
