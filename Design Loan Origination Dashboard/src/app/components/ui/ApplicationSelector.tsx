import { useMemo, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { getLoanApplications } from '../../data/loanApplications';
import { RiskBadge } from './RiskBadge';

type SelectorApplication = {
  arn: string;
  borrowerName: string;
  email: string;
  stage: string;
  riskGrade: 'A+' | 'A' | 'B' | 'C';
  loanAmount: number;
};

interface ApplicationSelectorProps {
  selectedArn: string;
  onSelect: (arn: string) => void;
  subtitle: string;
  applications?: SelectorApplication[];
}

export function ApplicationSelector({ selectedArn, onSelect, subtitle, applications: providedApplications }: ApplicationSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState('All stages');
  const [riskFilter, setRiskFilter] = useState('All grades');
  const applications = providedApplications ?? getLoanApplications();

  const stageOptions = useMemo(() => {
    const stages = Array.from(new Set(applications.map((application) => application.stage)));
    return ['All stages', ...stages];
  }, [applications]);

  const filteredApplications = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return applications.filter((application) => {
      const matchesQuery =
        query.length === 0 ||
        application.borrowerName.toLowerCase().includes(query) ||
        application.arn.toLowerCase().includes(query) ||
        application.email.toLowerCase().includes(query);

      const matchesStage = stageFilter === 'All stages' || application.stage === stageFilter;
      const matchesRisk = riskFilter === 'All grades' || application.riskGrade === riskFilter;

      return matchesQuery && matchesStage && matchesRisk;
    });
  }, [applications, searchQuery, stageFilter, riskFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setStageFilter('All stages');
    setRiskFilter('All grades');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">User Queue</h3>
          <p className="text-sm text-slate-600">{subtitle}</p>
        </div>
        <span className="text-xs font-medium text-slate-500">
          Showing {filteredApplications.length} of {applications.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <div className="md:col-span-2 relative">
          <label htmlFor="application-search" className="sr-only">Search applications</label>
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="application-search"
            name="application-search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by borrower, ARN, or email"
            className="w-full rounded-lg border border-slate-300 pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>

        <label htmlFor="stage-filter" className="sr-only">Filter by stage</label>
        <select
          id="stage-filter"
          name="stage-filter"
          value={stageFilter}
          onChange={(event) => setStageFilter(event.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-600"
        >
          {stageOptions.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <label htmlFor="risk-filter" className="sr-only">Filter by risk grade</label>
          <select
            id="risk-filter"
            name="risk-filter"
            value={riskFilter}
            onChange={(event) => setRiskFilter(event.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <option value="All grades">All grades</option>
            <option value="A+">A+</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>

          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            aria-label="Clear filters"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filteredApplications.map((application) => {
          const isActive = application.arn === selectedArn;

          return (
            <button
              key={application.arn}
              onClick={() => onSelect(application.arn)}
              className={`rounded-lg border p-4 text-left transition-all ${
                isActive
                  ? 'border-green-600 bg-green-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-green-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{application.borrowerName}</p>
                  <p className="text-xs text-slate-500">{application.arn}</p>
                </div>
                <RiskBadge grade={application.riskGrade} size="sm" />
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
                <span>{application.stage}</span>
                <span>₹{(application.loanAmount / 100000).toFixed(2)}L</span>
              </div>
            </button>
          );
        })}
      </div>

      {filteredApplications.length === 0 && (
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-6 text-center">
          <SlidersHorizontal className="w-5 h-5 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700">No users match current search/filter</p>
          <p className="text-xs text-slate-500 mt-1">Try a different query or clear filters.</p>
        </div>
      )}
    </div>
  );
}
