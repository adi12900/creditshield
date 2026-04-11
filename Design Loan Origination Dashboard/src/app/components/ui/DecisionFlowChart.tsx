import { Check, X, AlertCircle } from 'lucide-react';

interface DecisionStep {
  name: string;
  status: 'passed' | 'failed' | 'pending';
  details?: string;
}

interface DecisionFlowChartProps {
  steps: DecisionStep[];
  finalDecision: 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'AUTO_REJECT';
  reason?: string;
}

export function DecisionFlowChart({ steps, finalDecision, reason }: DecisionFlowChartProps) {
  const decisionConfig = {
    AUTO_APPROVE: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-500' },
    MANUAL_REVIEW: { bg: 'bg-amber-50', text: 'text-orange-600', border: 'border-amber-500' },
    AUTO_REJECT: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-500' },
  };

  const config = decisionConfig[finalDecision];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Decision Engine Flow</h3>

      <div className="space-y-4">
        {steps.map((step, idx) => (
          <div key={idx}>
            <div className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.status === 'passed'
                    ? 'bg-green-100 text-green-600'
                    : step.status === 'failed'
                    ? 'bg-red-100 text-red-600'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {step.status === 'passed' ? (
                  <Check className="w-4 h-4" />
                ) : step.status === 'failed' ? (
                  <X className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-900">{step.name}</p>
                {step.details && (
                  <p className="text-xs text-slate-500 mt-0.5">{step.details}</p>
                )}
              </div>
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  step.status === 'passed'
                    ? 'bg-green-50 text-green-700'
                    : step.status === 'failed'
                    ? 'bg-red-50 text-red-700'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {step.status.toUpperCase()}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div className="ml-4 h-6 w-0.5 bg-slate-200"></div>
            )}
          </div>
        ))}

        <div className="mt-6 pt-6 border-t border-slate-200">
          <div className={`p-4 rounded-lg border-2 ${config.bg} ${config.border}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-slate-900">Final Decision</p>
              <span className={`text-lg font-bold ${config.text}`}>
                {finalDecision.replace('_', ' ')}
              </span>
            </div>
            {reason && (
              <p className="text-xs text-slate-600">
                Reason: {reason}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
