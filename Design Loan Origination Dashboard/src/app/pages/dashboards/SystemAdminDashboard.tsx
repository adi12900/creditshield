import { Settings, Users, Activity, Workflow } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { workflowApi, type SystemAdminDashboardResponse } from '../../lib/workflowApi';

export function SystemAdminDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<SystemAdminDashboardResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const data = await workflowApi.systemAdminDashboard();
        if (mounted) {
          setDashboard(data);
        }
      } catch (error) {
        if (mounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Failed to load dashboard data');
        }
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const metricMap = useMemo(() => {
    const metrics = dashboard?.metrics ?? [];
    return new Map(metrics.map((metric) => [metric.key, metric]));
  }, [dashboard]);

  const integrations = dashboard?.integrations ?? [];
  const roleActivity = dashboard?.role_activity ?? [];
  const recentEvents = dashboard?.recent_events ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">System Admin Console</h1>
        <p className="text-slate-600">Workflow configuration, user management, and system monitoring</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={metricMap.get('total_users')?.value ?? '-'}
          icon={Users}
        />
        <StatCard
          title="Active Sessions"
          value={metricMap.get('active_sessions')?.value ?? '-'}
          icon={Activity}
        />
        <StatCard
          title="Workflows"
          value={metricMap.get('workflows')?.value ?? '-'}
          icon={Workflow}
        />
        <StatCard
          title="Integrations"
          value={metricMap.get('integrations')?.value ?? '-'}
          icon={Settings}
          subtitle={metricMap.get('integrations')?.subtitle ?? undefined}
        />
      </div>

      {errorMessage ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Integration Health</h3>
          <div className="space-y-3">
            {integrations.map((integration, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    integration.status === 'Healthy' ? 'bg-green-500' : integration.status === 'Degraded' ? 'bg-amber-500' : 'bg-red-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{integration.name}</p>
                    <p className="text-xs text-slate-500">Latency: {integration.latency_ms}ms</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  integration.status === 'Healthy'
                    ? 'bg-green-50 text-green-700'
                    : integration.status === 'Degraded'
                    ? 'bg-amber-50 text-orange-600'
                    : 'bg-red-50 text-red-700'
                }`}>
                  {integration.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">User Activity</h3>
          <div className="space-y-3">
            {roleActivity.map((role, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-900">{role.role}</p>
                  <p className="text-xs text-slate-600">
                    {role.active_users}/{role.total_users} active
                  </p>
                </div>
                <div className="bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-green-600 h-full"
                    style={{ width: `${role.total_users > 0 ? (role.active_users / role.total_users) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/dashboard/user-management')}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Create New User
            </button>
            <button
              onClick={() => navigate('/dashboard/user-management')}
              className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              Manage Roles
            </button>
            <button
              onClick={() => navigate('/dashboard/workflow-designer')}
              className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              Workflow Designer
            </button>
            <button
              onClick={() => navigate('/dashboard/rule-engine')}
              className="w-full px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              Rule Engine
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent System Events</h3>
          <div className="space-y-3">
            {recentEvents.map((event, idx) => (
              <div key={idx} className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                <div className="flex-1">
                  <p className="text-sm text-slate-900">{event.event}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {event.user} • {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
