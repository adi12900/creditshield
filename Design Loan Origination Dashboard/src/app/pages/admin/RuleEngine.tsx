import { Settings, Plus, AlertCircle, CheckCircle } from 'lucide-react';

const policyRules = [
  {
    id: 1,
    name: 'DTI Threshold Check',
    category: 'Financial',
    condition: 'DTI_RATIO > 45',
    action: 'Reject',
    severity: 'High',
    status: 'Active',
    lastModified: '2026-04-01',
  },
  {
    id: 2,
    name: 'Credit Score Minimum',
    category: 'Credit',
    condition: 'CIBIL_SCORE < 650',
    action: 'Flag for Review',
    severity: 'High',
    status: 'Active',
    lastModified: '2026-03-28',
  },
  {
    id: 3,
    name: 'Multiple Inquiries Check',
    category: 'Credit',
    condition: 'CREDIT_INQUIRIES_6M > 3',
    action: 'Flag for Review',
    severity: 'Medium',
    status: 'Active',
    lastModified: '2026-04-05',
  },
  {
    id: 4,
    name: 'LTV Limit',
    category: 'Financial',
    condition: 'LTV_RATIO > 80',
    action: 'Reject',
    severity: 'High',
    status: 'Active',
    lastModified: '2026-03-15',
  },
  {
    id: 5,
    name: 'Employment Stability',
    category: 'Income',
    condition: 'EMPLOYMENT_MONTHS < 12',
    action: 'Flag for Review',
    severity: 'Low',
    status: 'Inactive',
    lastModified: '2026-02-20',
  },
];

export function RuleEnginePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rule Engine Configuration</h1>
          <p className="text-slate-600">Define and manage underwriting policy rules</p>
        </div>
        <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create New Rule
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Total Rules</p>
          <p className="text-2xl font-bold text-slate-900">5</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Active Rules</p>
          <p className="text-2xl font-bold text-green-600">4</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">High Severity</p>
          <p className="text-2xl font-bold text-red-600">3</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
          <p className="text-sm text-slate-600 mb-1">Rules Triggered Today</p>
          <p className="text-2xl font-bold text-orange-500">12</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Policy Rules</h3>
        <div className="space-y-3">
          {policyRules.map((rule) => (
            <div
              key={rule.id}
              className={`p-4 border-2 rounded-lg transition-colors ${
                rule.status === 'Active'
                  ? 'border-slate-200 hover:border-green-300'
                  : 'border-slate-100 bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-slate-900">{rule.name}</h4>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        rule.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {rule.status}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        rule.severity === 'High'
                          ? 'bg-red-100 text-red-700'
                          : rule.severity === 'Medium'
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {rule.severity} Severity
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded px-3 py-2 mb-2">
                    <p className="text-sm font-mono text-slate-900">{rule.condition}</p>
                  </div>
                  <div className="flex gap-6 text-sm text-slate-600">
                    <div>
                      <span className="font-medium">Category:</span> {rule.category}
                    </div>
                    <div>
                      <span className="font-medium">Action:</span> {rule.action}
                    </div>
                    <div>
                      <span className="font-medium">Last Modified:</span> {rule.lastModified}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm">
                    Edit
                  </button>
                  <button className="px-3 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm">
                    {rule.status === 'Active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-slate-900">Create New Rule</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Rule Name *</label>
              <input
                type="text"
                placeholder="Enter rule name..."
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category *</label>
              <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600">
                <option>Select category...</option>
                <option>Financial</option>
                <option>Credit</option>
                <option>Income</option>
                <option>Employment</option>
                <option>Documentation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Condition *</label>
              <textarea
                rows={2}
                placeholder="e.g., DTI_RATIO > 45 AND CIBIL_SCORE < 700"
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600 font-mono text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Action *</label>
              <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600">
                <option>Select action...</option>
                <option>Reject</option>
                <option>Flag for Review</option>
                <option>Require Override</option>
                <option>Send for Manual Underwriting</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Severity *</label>
              <select className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600">
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
              </select>
            </div>
            <button className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
              Create Rule
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Available Parameters</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Financial Parameters</p>
              <div className="space-y-1 text-sm text-slate-600">
                <p className="font-mono">DTI_RATIO</p>
                <p className="font-mono">FOIR_RATIO</p>
                <p className="font-mono">LTV_RATIO</p>
                <p className="font-mono">LOAN_AMOUNT</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Credit Parameters</p>
              <div className="space-y-1 text-sm text-slate-600">
                <p className="font-mono">CIBIL_SCORE</p>
                <p className="font-mono">CREDIT_INQUIRIES_6M</p>
                <p className="font-mono">ACTIVE_LOANS_COUNT</p>
                <p className="font-mono">DEFAULT_HISTORY</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Income Parameters</p>
              <div className="space-y-1 text-sm text-slate-600">
                <p className="font-mono">MONTHLY_INCOME</p>
                <p className="font-mono">EMPLOYMENT_MONTHS</p>
                <p className="font-mono">INCOME_STABILITY</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-2">Operators</p>
              <div className="space-y-1 text-sm text-slate-600">
                <p className="font-mono">&gt;, &lt;, &gt;=, &lt;=, ==, !=</p>
                <p className="font-mono">AND, OR, NOT</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-900">Rule Modification Warning</p>
          <p className="text-sm text-orange-600 mt-1">
            Changes to policy rules will affect all new applications immediately. Existing applications in
            process will continue with the rules they were initially evaluated against.
          </p>
        </div>
      </div>
    </div>
  );
}
