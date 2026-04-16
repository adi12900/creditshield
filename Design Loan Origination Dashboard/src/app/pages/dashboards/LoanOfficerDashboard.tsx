import {
  Activity,
  AlertCircle,
  Bell,
  Clock,
  FileText,
  Filter,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { KanbanBoard } from '../../components/ui/KanbanBoard';
import { StatCard } from '../../components/ui/StatCard';
import { getLoanApplications } from '../../data/loanApplications';
import { useStore } from '../../store';

export function LoanOfficerDashboard() {
  const navigate = useNavigate();
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const loanApplications = getLoanApplications();
  const [loanTypeFilter, setLoanTypeFilter] = useState('all');
  const [riskGradeFilter, setRiskGradeFilter] = useState('all');
  const [stageFilter, setStageFilter] = useState('all');

  const formatLabel = (value: string) =>
    value
      .replace(/_/g, ' ')
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

  const loanTypeOptions = useMemo(() => Array.from(new Set(loanApplications.map((app) => app.loanType))), [loanApplications]);
  const riskGradeOptions = useMemo(() => Array.from(new Set(loanApplications.map((app) => app.riskGrade))), [loanApplications]);

  const stages = ['Lead', 'Submitted', 'Documents Pending', 'KYC', 'Underwriting', 'Offer Sent', 'Disbursed', 'Rejected'];
  const filteredApplications = useMemo(
    () =>
      loanApplications.filter((app) => {
        const matchesLoanType = loanTypeFilter === 'all' || app.loanType === loanTypeFilter;
        const matchesRisk = riskGradeFilter === 'all' || app.riskGrade === riskGradeFilter;
        const matchesStage = stageFilter === 'all' || app.stage === stageFilter;
        return matchesLoanType && matchesRisk && matchesStage;
      }),
    [loanApplications, loanTypeFilter, riskGradeFilter, stageFilter]
  );

  const stageData = stages.map((stage) => ({
    stage,
    count: filteredApplications.filter((app) => app.stage === stage).length,
  }));

  const kanbanStages = stages.map((stage) => ({
    title: stage,
    applications: filteredApplications.filter((app) => app.stage === stage),
  }));

  const activeApplications = filteredApplications.filter((app) => app.stage !== 'Disbursed' && app.stage !== 'Rejected');
  const slaBreaches = filteredApplications.filter((app) => app.slaBreached).length;
  const overdueApplications = activeApplications.filter((app) => app.daysInStage > 3).length;
  const readyForDisbursement = filteredApplications.filter((app) => app.stage === 'Offer Sent').length;
  const disbursedCount = filteredApplications.filter((app) => app.stage === 'Disbursed').length;
  const conversionRate = filteredApplications.length > 0 ? Math.round((disbursedCount / filteredApplications.length) * 100) : 0;
  const averageTat = filteredApplications.length > 0
    ? (filteredApplications.reduce((sum, app) => sum + app.daysInStage, 0) / filteredApplications.length).toFixed(1)
    : '0.0';
  const selectedNotificationApp = filteredApplications[0];

  const appliedFilters = [
    loanTypeFilter === 'all' ? null : formatLabel(loanTypeFilter),
    riskGradeFilter === 'all' ? null : `Risk ${riskGradeFilter}`,
    stageFilter === 'all' ? null : stageFilter,
  ].filter(Boolean).join(', ');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Application Pipeline</h1>
          <p className="text-slate-600">Kanban-style LOS view for assigned applications, SLA monitoring, and handoff readiness</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          <Bell className="w-4 h-4" />
          <span className="text-sm font-medium">{activeApplications.length} active assignments and {slaBreaches} SLA breach alerts in the current pipeline</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Applications"
          value={activeApplications.length}
          icon={FileText}
          subtitle={`${filteredApplications.length} applications in filtered view`}
        />
        <StatCard
          title="Average TAT"
          value={`${averageTat} days`}
          icon={Clock}
          subtitle="calculated from days in current stage"
        />
        <StatCard
          title="SLA Breaches"
          value={slaBreaches}
          icon={AlertCircle}
          subtitle={slaBreaches > 0 ? 'requires escalation' : 'no escalation required'}
        />
        <StatCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          icon={TrendingUp}
          subtitle={`${disbursedCount} disbursed out of ${filteredApplications.length}`}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Pipeline Throughput</h2>
              <p className="text-sm text-slate-600">Stage distribution across {filteredApplications.length} filtered applications</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Filter className="w-4 h-4" />
              Applied filters: {appliedFilters || 'None'}
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="stage" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: '#F8FAFC' }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {stageData.map((entry, index) => (
                    <Cell key={entry.stage} fill={index < 4 ? '#00A86B' : index < 6 ? '#1A4A7A' : '#FD7E14'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Live Notifications</h2>
          <div className="space-y-4">
            {[
              {
                title: 'Newest assignment',
                detail: selectedNotificationApp
                  ? `${selectedNotificationApp.borrowerName} (${selectedNotificationApp.arn}) is currently in ${selectedNotificationApp.stage}.`
                  : 'No applications available in the current pipeline.',
                tone: 'bg-green-50 text-green-700 border-green-200',
              },
              {
                title: 'SLA breach warning',
                detail: `${slaBreaches} application(s) require escalation for breached stage SLA.`,
                tone: 'bg-amber-50 text-amber-700 border-amber-200',
              },
              {
                title: 'Ready for disbursement',
                detail: `${readyForDisbursement} application(s) are in Offer Sent stage pending final disbursement actions.`,
                tone: 'bg-slate-50 text-slate-700 border-slate-200',
              },
            ].map((item) => (
              <div key={item.title} className={`rounded-lg border p-4 ${item.tone}`}>
                <p className="font-semibold text-sm">{item.title}</p>
                <p className="mt-1 text-sm opacity-90">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Application Filters</h2>
            <p className="text-sm text-slate-600">Filter by loan type, risk grade, and workflow stage</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full md:w-auto">
            <select
              value={loanTypeFilter}
              onChange={(event) => setLoanTypeFilter(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              <option value="all">All loan types</option>
              {loanTypeOptions.map((loanType) => (
                <option key={loanType} value={loanType}>{formatLabel(loanType)}</option>
              ))}
            </select>
            <select
              value={riskGradeFilter}
              onChange={(event) => setRiskGradeFilter(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              <option value="all">All risk grades</option>
              {riskGradeOptions.map((riskGrade) => (
                <option key={riskGrade} value={riskGrade}>{riskGrade}</option>
              ))}
            </select>
            <select
              value={stageFilter}
              onChange={(event) => setStageFilter(event.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
            >
              <option value="all">All stages</option>
              {stages.map((stage) => (
                <option key={stage} value={stage}>{stage}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-6 overflow-hidden rounded-lg border border-slate-200">
          <div className="flex flex-wrap items-center gap-3 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-medium text-slate-700 border border-slate-200">
              <Activity className="w-4 h-4 text-green-600" />
              {filteredApplications.length} applications visible
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-medium text-slate-700 border border-slate-200">
              <Clock className="w-4 h-4 text-amber-600" />
              {overdueApplications} overdue
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-medium text-slate-700 border border-slate-200">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              {readyForDisbursement} ready for disbursement
            </span>
          </div>
        </div>

        <KanbanBoard
          stages={kanbanStages}
          onCardClick={(application) => {
            setSelectedApplicationArn(application.arn);
            navigate('/dashboard/application-detail');
          }}
        />
      </div>
    </div>
  );
}
