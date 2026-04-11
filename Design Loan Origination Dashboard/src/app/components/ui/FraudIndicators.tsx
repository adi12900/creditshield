import { AlertTriangle, Shield, Eye, FileWarning } from 'lucide-react';

interface FraudSignal {
  type: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  detectedAt: string;
}

interface FraudIndicatorsProps {
  overallScore: number;
  signals: FraudSignal[];
}

const severityConfig = {
  Low: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  Medium: { bg: 'bg-amber-50', text: 'text-orange-600', border: 'border-amber-200' },
  High: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  Critical: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
};

export function FraudIndicators({ overallScore, signals }: FraudIndicatorsProps) {
  const getSeverityLevel = (score: number): 'Low' | 'Medium' | 'High' | 'Critical' => {
    if (score < 30) return 'Low';
    if (score < 60) return 'Medium';
    if (score < 85) return 'High';
    return 'Critical';
  };

  const severity = getSeverityLevel(overallScore);
  const config = severityConfig[severity];

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900">Fraud Risk Assessment</h3>
        <div className={`px-3 py-1 rounded-lg border ${config.bg} ${config.text} ${config.border}`}>
          <span className="text-sm font-semibold">{severity} Risk</span>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-600">Overall Fraud Score</span>
          <span className={`text-2xl font-bold ${config.text}`}>{overallScore}</span>
        </div>
        <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full ${
              severity === 'Low'
                ? 'bg-green-500'
                : severity === 'Medium'
                ? 'bg-amber-500'
                : severity === 'High'
                ? 'bg-orange-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${overallScore}%` }}
          ></div>
        </div>
      </div>

      {signals.length > 0 ? (
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-3">Detected Signals</h4>
          <div className="space-y-2">
            {signals.map((signal, idx) => {
              const signalConfig = severityConfig[signal.severity];
              return (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border ${signalConfig.bg} ${signalConfig.border}`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-4 h-4 mt-0.5 ${signalConfig.text}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-sm font-medium ${signalConfig.text}`}>
                          {signal.type}
                        </p>
                        <span className={`text-xs ${signalConfig.text}`}>
                          {signal.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{signal.description}</p>
                      <p className="text-xs text-slate-500 mt-1">
                        Detected: {signal.detectedAt}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-6">
          <Shield className="w-12 h-12 text-green-500 mx-auto mb-2" />
          <p className="text-sm text-slate-600">No fraud signals detected</p>
        </div>
      )}
    </div>
  );
}
