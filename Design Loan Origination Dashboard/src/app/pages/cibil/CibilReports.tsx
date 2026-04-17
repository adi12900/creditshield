import { useEffect, useMemo, useState } from 'react';
import { Search, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchCibilList, getCibilScoreColor, getCibilStatus, type CibilListItem } from './cibilUsers';

export function CibilReportsPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<CibilListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'good' | 'average' | 'risky'>('all');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    fetchCibilList()
      .then((rows) => {
        if (!active) return;
        setUsers(rows);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to load applications');
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const q = query.trim().toLowerCase();

    return users.filter((user) => {
      const nameMatches =
        q.length === 0 ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.phone.toLowerCase().includes(q);

      if (!nameMatches) return false;

      if (scoreFilter === 'good') return user.cibilScore >= 750;
      if (scoreFilter === 'average') return user.cibilScore >= 650 && user.cibilScore < 750;
      if (scoreFilter === 'risky') return user.cibilScore < 650;
      return true;
    });
  }, [query, scoreFilter, users]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">CIBIL Reports</h1>
        <p className="text-slate-600">Dynamic CIBIL report list sourced from loan applications.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name, email, or phone"
              className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
            />
          </div>
          <select
            value={scoreFilter}
            onChange={(event) => setScoreFilter(event.target.value as 'all' | 'good' | 'average' | 'risky')}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <option value="all">All Scores</option>
            <option value="good">Good (750+)</option>
            <option value="average">Average (650-749)</option>
            <option value="risky">Risky (&lt;650)</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <p className="text-sm font-medium text-slate-700">Loading applications...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          Failed to load applications: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {!loading && !error && filteredUsers.map((user) => {
          const status = getCibilStatus(user.cibilScore);
          const scoreColor = getCibilScoreColor(user.cibilScore);

          return (
            <div key={user.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{user.name}</p>
                  <p className="text-xs text-slate-500 mt-1">{user.email}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{user.phone}</p>
                </div>
                <FileText className="w-5 h-5 text-slate-500" />
              </div>

              <div className="mt-4">
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${scoreColor}`}>
                  CIBIL {user.cibilScore}
                </span>
                <p className="text-sm text-slate-600 mt-2">Status: <span className="font-medium text-slate-900">{status}</span></p>
              </div>

              <button
                onClick={() => navigate(`/dashboard/cibil-report/${encodeURIComponent(user.id)}`)}
                className="mt-5 w-full rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2.5 transition-colors"
              >
                View Report
              </button>
            </div>
          );
        })}
      </div>

      {!loading && !error && filteredUsers.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
          <p className="text-sm font-medium text-slate-700">No users found</p>
          <p className="text-xs text-slate-500 mt-1">Try changing name search or score filter.</p>
        </div>
      )}
    </div>
  );
}
