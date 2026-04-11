interface RiskBadgeProps {
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  size?: 'sm' | 'md' | 'lg';
}

const riskConfig = {
  'A+': { bg: '#DCFCE7', text: '#15803D', border: '#16A34A', label: 'Excellent' },
  'A': { bg: '#D1FAE5', text: '#065F46', border: '#059669', label: 'Good' },
  'B': { bg: '#CCFBF1', text: '#0F766E', border: '#0D9488', label: 'Fair' },
  'C': { bg: '#FEF3C7', text: '#92400E', border: '#D97706', label: 'Caution' },
  'D': { bg: '#FEE2E2', text: '#991B1B', border: '#DC2626', label: 'High Risk' },
};

export function RiskBadge({ grade, size = 'md' }: RiskBadgeProps) {
  const config = riskConfig[grade];
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium ${sizeClasses[size]}`}
      style={{
        backgroundColor: config.bg,
        color: config.text,
        borderColor: config.border,
      }}
    >
      <span className="font-semibold">{grade}</span>
      <span className="opacity-90">{config.label}</span>
    </span>
  );
}
