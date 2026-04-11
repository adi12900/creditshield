import { LoanApplication } from '../data/loanApplications';

export interface AIScoreFactor {
  factor: string;
  impact: number;
  isPositive: boolean;
}

export interface AIRiskProfile {
  compositeScore: number;
  confidencePercent: number;
  confidenceDelta: number;
  riskGrade: 'A+' | 'A' | 'B' | 'C' | 'D';
  decision: 'AUTO_APPROVE' | 'MANUAL_REVIEW' | 'AUTO_REJECT';
  modelVersion: string;
  lastTrainingDate: string;
  reasonCodes: string[];
  explanation: string;
  counterfactual: string;
  tierScores: {
    bureau: number;
    behavioral: number;
    alternative: number;
  };
  topFactors: AIScoreFactor[];
}

const MODEL_VERSION = 'LOS-CREDIT-GBC-v3.4.2';
const LAST_TRAINING_DATE = '2026-03-28';

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseInterestRate(interestRate: string): number {
  const numeric = Number.parseFloat(interestRate.replace(/[^\d.]/g, ''));
  return Number.isFinite(numeric) ? numeric : 12;
}

function calculateRatios(application: LoanApplication) {
  const monthlyIncome = application.employmentType === 'Salaried' ? 75000 : 90000;
  const currentObligations = application.employmentType === 'Salaried' ? 20000 : 30000;
  const emiNumeric = Number.parseFloat(application.emi.replace(/[^\d.]/g, ''));
  const emi = Number.isFinite(emiNumeric) ? emiNumeric : application.loanAmount / application.tenureMonths;
  const dti = ((currentObligations + emi) / monthlyIncome) * 100;
  const foir = (currentObligations / monthlyIncome) * 100;
  const ltv = clamp((application.loanAmount / (application.loanAmount * 1.45)) * 100, 20, 95);

  return {
    dti: Math.round(dti),
    foir: Math.round(foir),
    ltv: Math.round(ltv),
  };
}

export function buildAIRiskProfile(application: LoanApplication): AIRiskProfile {
  const interestRate = parseInterestRate(application.interestRate);
  const { dti, foir, ltv } = calculateRatios(application);

  const bureauScore = clamp(Math.round(application.creditScore + (application.riskGrade === 'A+' ? 18 : 0)), 300, 900);

  const behavioralBase =
    720 -
    (application.slaBreached ? 42 : 0) -
    (application.daysInStage > 3 ? 18 : 0) +
    (application.kycStatus === 'Verified' ? 20 : -15);
  const behavioralScore = clamp(Math.round(behavioralBase), 300, 900);

  const alternativeBase =
    705 +
    (application.employmentType === 'Salaried' ? 16 : 8) -
    (interestRate > 13 ? 20 : 0) -
    (application.loanAmount > 1400000 ? 14 : 0);
  const alternativeScore = clamp(Math.round(alternativeBase), 300, 900);

  const compositeScore = clamp(
    Math.round(bureauScore * 0.5 + behavioralScore * 0.3 + alternativeScore * 0.2),
    300,
    900
  );

  const confidenceBase =
    89 -
    (application.slaBreached ? 7 : 0) -
    (application.kycStatus === 'Pending' ? 6 : 0) -
    (application.stage === 'Rejected' ? 5 : 0);
  const confidencePercent = clamp(Math.round(confidenceBase), 68, 96);
  const confidenceDelta = clamp(Math.round((100 - confidencePercent) / 1.4), 10, 45);

  let riskGrade: AIRiskProfile['riskGrade'] = 'D';
  if (compositeScore >= 780) riskGrade = 'A+';
  else if (compositeScore >= 730) riskGrade = 'A';
  else if (compositeScore >= 680) riskGrade = 'B';
  else if (compositeScore >= 630) riskGrade = 'C';

  let decision: AIRiskProfile['decision'] = 'AUTO_REJECT';
  if (riskGrade === 'A+' || riskGrade === 'A') decision = 'AUTO_APPROVE';
  else if (riskGrade === 'B' || riskGrade === 'C') decision = 'MANUAL_REVIEW';

  const topFactors: AIScoreFactor[] = [
    { factor: `Credit score ${application.creditScore}`, impact: 34, isPositive: application.creditScore >= 700 },
    { factor: `DTI at ${dti}%`, impact: 24, isPositive: dti <= 45 },
    { factor: `FOIR at ${foir}%`, impact: 16, isPositive: foir <= 40 },
    { factor: `KYC status ${application.kycStatus}`, impact: 14, isPositive: application.kycStatus === 'Verified' },
    { factor: `Tenure ${application.tenureMonths} months`, impact: 12, isPositive: application.tenureMonths <= 48 },
    {
      factor: application.slaBreached ? 'SLA breached in current stage' : 'SLA within threshold',
      impact: 10,
      isPositive: !application.slaBreached,
    },
  ];

  const orderedFactors = topFactors
    .map((factor) => ({ ...factor, impact: factor.isPositive ? factor.impact : -factor.impact }))
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  const reasonCodes: string[] = [];
  if (dti > 45) reasonCodes.push('RC-DTI-045-EXCEED');
  if (foir > 40) reasonCodes.push('RC-FOIR-040-EXCEED');
  if (application.creditScore < 680) reasonCodes.push('RC-SCORE-LOW');
  if (application.slaBreached) reasonCodes.push('RC-SLA-BREACH');
  if (application.kycStatus !== 'Verified') reasonCodes.push('RC-KYC-PENDING');
  if (reasonCodes.length === 0) reasonCodes.push('RC-POLICY-CLEAR');

  const explanation =
    decision === 'AUTO_APPROVE'
      ? `This profile qualifies for automatic approval because credit score (${application.creditScore}) and policy ratios (DTI ${dti}%, FOIR ${foir}%) are within policy bands with high model confidence.`
      : decision === 'MANUAL_REVIEW'
      ? `This profile is routed to manual review because risk indicators are mixed: score ${application.creditScore}, DTI ${dti}%, and FOIR ${foir}% require underwriter confirmation.`
      : `This profile is not eligible for straight-through approval because score ${application.creditScore} and policy metrics indicate elevated default risk.`;

  const suggestedDti = dti > 45 ? 42 : 40;
  const counterfactual =
    decision === 'AUTO_APPROVE'
      ? 'No counterfactual needed. The current profile already meets automatic approval policy thresholds.'
      : `If DTI improves to around ${suggestedDti}% and bureau score improves by 20 points, this application can move to AUTO_APPROVE.`;

  return {
    compositeScore,
    confidencePercent,
    confidenceDelta,
    riskGrade,
    decision,
    modelVersion: MODEL_VERSION,
    lastTrainingDate: LAST_TRAINING_DATE,
    reasonCodes,
    explanation,
    counterfactual,
    tierScores: {
      bureau: bureauScore,
      behavioral: behavioralScore,
      alternative: alternativeScore,
    },
    topFactors: orderedFactors,
  };
}
