import { Settings, Users, Activity, Workflow } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { useNavigate } from 'react-router-dom';

export function SystemAdminDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">System Admin Console</h1>
        <p className="text-slate-600">Workflow configuration, user management, and system monitoring</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={147}
          icon={Users}
        />
        <StatCard
          title="Active Sessions"
          value={42}
          icon={Activity}
        />
        <StatCard
          title="Workflows"
          value={8}
          icon={Workflow}
        />
        <StatCard
          title="Integrations"
          value={12}
          icon={Settings}
          subtitle="All healthy"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Integration Health</h3>
          <div className="space-y-3">
            {[
              { name: 'CIBIL Bureau', status: 'Healthy', latency: '120ms' },
              { name: 'Experian Bureau', status: 'Healthy', latency: '150ms' },
              { name: 'eSign Provider', status: 'Healthy', latency: '200ms' },
              { name: 'Payment Rails (NEFT/RTGS)', status: 'Healthy', latency: '180ms' },
              { name: 'KYC Provider', status: 'Degraded', latency: '450ms' },
              { name: 'Core Banking API', status: 'Healthy', latency: '90ms' },
            ].map((integration, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    integration.status === 'Healthy' ? 'bg-green-500' : 'bg-amber-500'
                  }`}></div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{integration.name}</p>
                    <p className="text-xs text-slate-500">Latency: {integration.latency}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  integration.status === 'Healthy'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-amber-50 text-orange-600'
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
            {[
              { role: 'Loan Officers', activeUsers: 24, totalUsers: 45 },
              { role: 'Credit Analysts', activeUsers: 12, totalUsers: 20 },
              { role: 'Underwriters', activeUsers: 8, totalUsers: 15 },
              { role: 'Compliance Officers', activeUsers: 3, totalUsers: 8 },
              { role: 'Operations Team', activeUsers: 15, totalUsers: 35 },
            ].map((role, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-slate-900">{role.role}</p>
                  <p className="text-xs text-slate-600">
                    {role.activeUsers}/{role.totalUsers} active
                  </p>
                </div>
                <div className="bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-green-600 h-full"
                    style={{ width: `${(role.activeUsers / role.totalUsers) * 100}%` }}
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
            {[
              { time: '11:30 AM', event: 'New workflow version published: Loan Application v2.1', user: 'Admin' },
              { time: '10:15 AM', event: 'Rule engine updated: Credit score threshold changed to 650', user: 'Admin' },
              { time: '09:45 AM', event: 'New user created: Anita Desai (Credit Analyst)', user: 'Admin' },
              { time: '09:20 AM', event: 'Integration health check completed: All systems operational', user: 'System' },
              { time: '08:30 AM', event: 'User role updated: Rahul Sharma promoted to Senior Underwriter', user: 'Admin' },
            ].map((event, idx) => (
              <div key={idx} className="flex items-start gap-4 p-3 bg-slate-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5"></div>
                <div className="flex-1">
                  <p className="text-sm text-slate-900">{event.event}</p>
                  <p className="text-xs text-slate-500 mt-1">{event.user} • {event.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
