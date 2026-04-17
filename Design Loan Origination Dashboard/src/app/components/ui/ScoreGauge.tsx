interface ScoreGaugeProps {
  score: number;
  maxScore?: number;
  label: string;
  showConfidence?: boolean;
  confidence?: number;
}

export function ScoreGauge({
  score,
  maxScore = 900,
  label,
  showConfidence = false,
  confidence,
}: ScoreGaugeProps) {
  const percentage = Math.min(100, (score / maxScore) * 100);

  const getColor = () => {
    if (percentage >= 75) return '#28A745';
    if (percentage >= 55) return '#00A86B';
    if (percentage >= 35) return '#FD7E14';
    return '#DC3545';
  };

  const getRating = () => {
    if (percentage >= 75) return 'Excellent';
    if (percentage >= 55) return 'Good';
    if (percentage >= 35) return 'Fair';
    return 'Poor';
  };

  const color = getColor();

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-40 h-40">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#E2E8F0" strokeWidth="8" />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${percentage * 2.51} 251`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-3xl font-bold" style={{ color }}>
            {Number.isInteger(score) ? score : score.toFixed(1)}
          </div>
          <div className="text-xs text-slate-500">/ {maxScore}</div>
        </div>
      </div>
      <div className="text-center">
        <div className="font-medium text-sm text-slate-900">{label}</div>
        <div className="text-xs font-semibold mt-0.5" style={{ color }}>{getRating()}</div>
        {showConfidence && confidence != null && (
          <div className="text-xs text-slate-500 mt-1">{confidence.toFixed ? confidence.toFixed(1) : confidence}% confidence</div>
        )}
      </div>
    </div>
  );
}
