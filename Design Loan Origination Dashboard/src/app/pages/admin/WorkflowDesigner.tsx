import { GitBranch, Plus, Save, Play } from 'lucide-react';

const workflowStages = [
  { id: 1, name: 'Application Submission', assignedRole: 'Loan Officer', avgDuration: '5 mins', status: 'Active' },
  { id: 2, name: 'Document Upload & OCR', assignedRole: 'System', avgDuration: '2 mins', status: 'Active' },
  { id: 3, name: 'Bureau Check', assignedRole: 'System', avgDuration: '30 secs', status: 'Active' },
  { id: 4, name: 'Credit Analysis', assignedRole: 'Credit Analyst', avgDuration: '1 hour', status: 'Active' },
  { id: 5, name: 'Underwriting', assignedRole: 'Underwriter', avgDuration: '2 hours', status: 'Active' },
  { id: 6, name: 'Compliance Review', assignedRole: 'Compliance Officer', avgDuration: '30 mins', status: 'Active' },
];

export function WorkflowDesignerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Workflow Designer</h1>
          <p className="text-slate-600">Configure and manage loan processing workflows</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium flex items-center gap-2">
            <Play className="w-4 h-4" />
            Test Workflow
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Active Stages</p>
          <p className="text-2xl font-bold text-slate-900">6</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Avg. Completion Time</p>
          <p className="text-2xl font-bold text-green-600">4.2h</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">SLA Compliance</p>
          <p className="text-2xl font-bold text-green-600">94.5%</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Active Workflows</p>
          <p className="text-2xl font-bold text-slate-900">3</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-slate-900">Standard Loan Workflow</h3>
          <button className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Stage
          </button>
        </div>

        <div className="space-y-3">
          {workflowStages.map((stage, idx) => (
            <div key={stage.id} className="relative">
              {idx < workflowStages.length - 1 && (
                <div className="absolute left-6 top-16 w-0.5 h-8 bg-green-200" />
              )}
              <div className="flex items-center gap-4 p-4 border-2 border-slate-200 rounded-lg hover:border-green-300 transition-colors">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center font-bold text-green-600 flex-shrink-0">
                  {stage.id}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900">{stage.name}</h4>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                      {stage.status}
                    </span>
                  </div>
                  <div className="flex gap-6 text-sm text-slate-600">
                    <div>
                      <span className="font-medium">Role:</span> {stage.assignedRole}
                    </div>
                    <div>
                      <span className="font-medium">Avg Duration:</span> {stage.avgDuration}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm">
                    Edit
                  </button>
                  <button className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm">
                    Configure
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Stage Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Stage Name *</label>
              <input
                type="text"
                placeholder="Enter stage name..."
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Assigned Role *</label>
              <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600">
                <option>Select role...</option>
                <option>Loan Officer</option>
                <option>Credit Analyst</option>
                <option>Underwriter</option>
                <option>Compliance Officer</option>
                <option>Operations Team</option>
                <option>System</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">SLA Duration (hours)</label>
              <input
                type="number"
                defaultValue="2"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Auto-Progress Condition</label>
              <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600">
                <option>Manual Approval Required</option>
                <option>Auto on Success</option>
                <option>Auto on All Checks Pass</option>
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4 text-green-600" />
                <span className="text-sm text-slate-700">Enable Email Notifications</span>
              </label>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <GitBranch className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-slate-900">Conditional Branching</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-900 mb-2">If Credit Score &lt; 650</p>
              <p className="text-xs text-slate-600 mb-3">→ Route to Senior Underwriter for manual review</p>
              <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                Edit Condition
              </button>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-900 mb-2">If DTI &gt; 45%</p>
              <p className="text-xs text-slate-600 mb-3">→ Require policy override approval</p>
              <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                Edit Condition
              </button>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-900 mb-2">If Loan Amount &gt; ₹20L</p>
              <p className="text-xs text-slate-600 mb-3">→ Add additional compliance checks</p>
              <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                Edit Condition
              </button>
            </div>
            <button className="w-full px-4 py-3 border border-green-300 text-green-700 rounded-lg hover:bg-green-50 font-medium flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" />
              Add New Condition
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
