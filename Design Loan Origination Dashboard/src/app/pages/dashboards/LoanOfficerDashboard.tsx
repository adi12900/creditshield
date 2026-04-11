import {
  Activity,
  AlertCircle,
  Bell,
  Clock,
  FileText,
  Filter,
  TrendingUp,
} from 'lucide-react';
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
import { loanApplications } from '../../data/loanApplications';
import { useStore } from '../../store';

export function LoanOfficerDashboard() {
  const navigate = useNavigate();
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);

  const stages = ['Lead', 'Submitted', 'Documents Pending', 'KYC', 'Underwriting', 'Offer Sent', 'Disbursed', 'Rejected'];
  const stageData = stages.map((stage) => ({
    stage,
    count: loanApplications.filter((app) => app.stage === stage).length,
  }));

  const kanbanStages = stages.map((stage) => ({
    title: stage,
    applications: loanApplications.filter((app) => app.stage === stage),
  }));

  const activeApplications = loanApplications.filter((app) => app.stage !== 'Disbursed' && app.stage !== 'Rejected');
  const slaBreaches = loanApplications.filter((app) => app.slaBreached).length;
  const conversionRate = Math.round((loanApplications.filter((app) => app.stage === 'Disbursed').length / loanApplications.length) * 100);
  const averageTat = (loanApplications.reduce((sum, app) => sum + app.daysInStage, 0) / loanApplications.length).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Application Pipeline</h1>
          <p className="text-slate-600">Kanban-style LOS view for assigned applications, SLA monitoring, and handoff readiness</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          <Bell className="w-4 h-4" />
          <span className="text-sm font-medium">2 new assignments and 1 SLA breach detected in the last hour</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Active Applications"
          value={activeApplications.length}
          icon={FileText}
          trend={{ value: '8% vs last week', isPositive: true }}
        />
        <StatCard
          title="Average TAT"
          value={`${averageTat} days`}
          icon={Clock}
          subtitle="all pipeline stages"
        />
        <StatCard
          title="SLA Breaches"
          value={slaBreaches}
          icon={AlertCircle}
          subtitle="needs escalation"
        />
        <StatCard
          title="Conversion Rate"
          value={`${conversionRate}%`}
          icon={TrendingUp}
          trend={{ value: '3% improvement', isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Pipeline Throughput</h2>
              <p className="text-sm text-slate-600">Stage distribution across the current 15 applications</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Filter className="w-4 h-4" />
              Applied filters: Personal Loan, A/B risk, Today
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
              { title: 'New application assigned', detail: 'Vikram Singh received ARN202600004 in Submitted stage.', tone: 'bg-green-50 text-green-700 border-green-200' },
              { title: 'SLA breach warning', detail: 'Neha Gupta has been in Documents Pending for 4 days.', tone: 'bg-amber-50 text-amber-700 border-amber-200' },
              { title: 'KYC cleared', detail: 'Kavita Iyer is ready for underwriting handoff.', tone: 'bg-slate-50 text-slate-700 border-slate-200' },
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
            <p className="text-sm text-slate-600">Loan type, risk grade, date range, and source channel</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-auto">
            <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
              <option>All loan types</option>
              <option>Personal Loan</option>
              <option>Business Loan</option>
              <option>Home Loan</option>
            </select>
            <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
              <option>All risk grades</option>
              <option>A+</option>
              <option>A</option>
              <option>B</option>
              <option>C</option>
            </select>
            <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
              <option>Today</option>
              <option>Last 7 days</option>
              <option>Last 30 days</option>
            </select>
            <select className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">
              <option>Digital channel</option>
              <option>Branch</option>
              <option>Partner</option>
            </select>
          </div>
        </div>

        <div className="mb-6 overflow-hidden rounded-lg border border-slate-200">
          <div className="flex flex-wrap items-center gap-3 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-medium text-slate-700 border border-slate-200">
              <Activity className="w-4 h-4 text-green-600" />
              15 applications visible
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-medium text-slate-700 border border-slate-200">
              <Clock className="w-4 h-4 text-amber-600" />
              2 overdue
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-medium text-slate-700 border border-slate-200">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              2 ready for disbursement
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
