import { Brain, AlertCircle } from 'lucide-react';

interface AIExplanationPanelProps {
  decision: string;
  explanation: string;
  topFactors: {
    factor: string;
    impact: number;
    isPositive: boolean;
  }[];
  confidence: number;
  confidenceInterval?: string;
  modelVersion?: string;
  lastTrainingDate?: string;
  reasonCodes?: string[];
  counterfactual?: string;
}

export function AIExplanationPanel({
  decision,
  explanation,
  topFactors,
  confidence,
  confidenceInterval,
  modelVersion,
  lastTrainingDate,
  reasonCodes,
  counterfactual,
}: AIExplanationPanelProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
          <Brain className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">AI Decision Explanation</h3>
          <p className="text-xs text-slate-500">{confidence}% confidence</p>
          {confidenceInterval && (
            <p className="text-xs text-slate-500">Confidence interval: {confidenceInterval}</p>
          )}
        </div>
      </div>

      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm font-medium text-green-900 mb-1">{decision}</p>
        <p className="text-xs text-green-700">{explanation}</p>
      </div>

      <div>
        <h4 className="text-xs font-semibold text-slate-700 mb-3">Contributing Factors</h4>
        <div className="space-y-2">
          {topFactors.map((factor, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="flex-1">
                <p className="text-sm text-slate-700">{factor.factor}</p>
                <div className="mt-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full ${factor.isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.abs(factor.impact)}%` }}
                  ></div>
                </div>
              </div>
              <span
                className={`text-xs font-semibold ${
                  factor.isPositive ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {factor.isPositive ? '+' : '-'}
                {Math.abs(factor.impact)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {(modelVersion || lastTrainingDate) && (
        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs text-slate-600">
            Model: {modelVersion ?? 'N/A'}
          </p>
          <p className="text-xs text-slate-600">
            Last training date: {lastTrainingDate ?? 'N/A'}
          </p>
        </div>
      )}

      {reasonCodes && reasonCodes.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-semibold text-slate-700 mb-2">Reason Codes</h4>
          <div className="flex flex-wrap gap-2">
            {reasonCodes.map((code) => (
              <span
                key={code}
                className="rounded-full border border-slate-300 bg-white px-2 py-1 text-[11px] font-medium text-slate-700"
              >
                {code}
              </span>
            ))}
          </div>
        </div>
      )}

      {counterfactual && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-xs font-semibold text-amber-800 mb-1">Counterfactual Guidance</p>
          <p className="text-xs text-amber-700">{counterfactual}</p>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5" />
          <p className="text-xs text-slate-500">
            AI explanations are provided for transparency. Final decisions remain with authorized personnel.
          </p>
        </div>
      </div>
    </div>
  );
}
