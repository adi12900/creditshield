import { AlertTriangle, FileText } from 'lucide-react';
import { useState } from 'react';
import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { useStore } from '../../store';
import { workflowApi } from '../../lib/workflowApi';

const failedRules = [
  { rule: 'DTI Threshold', evaluated: '42%', threshold: '40%', severity: 'Medium' },
  { rule: 'Credit Inquiries (6M)', evaluated: '4', threshold: '3', severity: 'Low' },
];

export function PolicyOverridePage() {
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const user = useStore((state) => state.user);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);
  const [overrideCategory, setOverrideCategory] = useState('Compensating Factors');
  const [justification, setJustification] = useState('');

  const failedRules = [
    {
      rule: 'DTI Threshold',
      evaluated: selectedApplication.riskGrade === 'C' ? '54%' : selectedApplication.riskGrade === 'B' ? '48%' : '42%',
      threshold: '40%',
      severity: selectedApplication.riskGrade === 'C' ? 'High' : 'Medium',
    },
    {
      rule: 'Credit Inquiries (6M)',
      evaluated: selectedApplication.slaBreached ? '5' : '4',
      threshold: '3',
      severity: selectedApplication.slaBreached ? 'Medium' : 'Low',
    },
  ];

  const handleSubmitOverride = async () => {
    if (!user || user.role !== 'underwriter') return;
    if (justification.trim().length < 50) {
      window.alert('Justification must be at least 50 characters.');
      return;
    }
    try {
      await workflowApi.submitPolicyOverride(selectedApplication.arn, user.role, {
        override_category: overrideCategory,
        justification,
        decision: 'approve',
      });
      window.alert('Policy override submitted.');
      window.location.reload();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to submit override';
      window.alert(message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Policy Override Interface</h1>
        <p className="text-slate-600">
          ARN: {selectedApplication.arn} • {selectedApplication.borrowerName}
        </p>
      </div>

      <ApplicationSelector
        selectedArn={selectedApplication.arn}
        onSelect={setSelectedApplicationArn}
        subtitle="Select the borrower file before reviewing override exceptions and delegated authority." 
      />

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-900">Policy Override Required</p>
          <p className="text-sm text-orange-600 mt-1">
            {failedRules.length} policy rules have failed for {selectedApplication.borrowerName}. Review and provide justification for override.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Failed Policy Rules</h3>
        <div className="space-y-4">
          {failedRules.map((rule, idx) => (
            <div key={idx} className="p-4 border-2 border-amber-200 rounded-lg bg-amber-50">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-slate-900">{rule.rule}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <div>
                      <span className="text-slate-600">Evaluated: </span>
                      <span className="font-semibold text-red-600">{rule.evaluated}</span>
                    </div>
                    <div>
                      <span className="text-slate-600">Policy Limit: </span>
                      <span className="font-semibold text-slate-900">{rule.threshold}</span>
                    </div>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  rule.severity === 'High' ? 'bg-red-100 text-red-700' :
                  rule.severity === 'Medium' ? 'bg-orange-100 text-orange-600' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {rule.severity} Severity
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Override Category *
                  </label>
                  <select value={overrideCategory} onChange={(e) => setOverrideCategory(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600">
                    <option>Select category...</option>
                    <option>Compensating Factors</option>
                    <option>Manual Underwriting</option>
                    <option>Senior Management Approval</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Justification * (min 50 characters)
                  </label>
                  <textarea
                    rows={3}
                    value={justification}
                    onChange={(e) => setJustification(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                    placeholder="Enter detailed justification for override..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id={`override-${idx}`} className="w-4 h-4 text-green-600" />
                  <label htmlFor={`override-${idx}`} className="text-sm text-slate-700">
                    I confirm override is within my delegated authority (up to ₹25L)
                  </label>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <h4 className="font-semibold text-slate-900 mb-2">Delegated Authority</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-600">Your Authority Level:</p>
              <p className="font-semibold text-slate-900">Junior Underwriter</p>
            </div>
            <div>
              <p className="text-slate-600">Maximum Loan Amount:</p>
              <p className="font-semibold text-slate-900">₹25,00,000</p>
            </div>
            <div>
              <p className="text-slate-600">Requested Loan Amount:</p>
              <p className="font-semibold text-green-600">₹{selectedApplication.loanAmount.toLocaleString('en-IN')} ✓</p>
            </div>
            <div>
              <p className="text-slate-600">Overrides This Month:</p>
              <p className="font-semibold text-slate-900">{selectedApplication.riskGrade === 'C' ? '7 / 10' : selectedApplication.slaBreached ? '4 / 10' : '3 / 10'}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button className="flex-1 px-4 py-3 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium">
            Cancel
          </button>
          <button onClick={handleSubmitOverride} className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
            Submit Override & Approve
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Override History</h3>
        <div className="text-center py-8 text-slate-500">
          <FileText className="w-12 h-12 mx-auto mb-2 text-slate-400" />
          <p className="text-sm">No previous overrides for {selectedApplication.borrowerName}</p>
        </div>
      </div>
    </div>
  );
}
