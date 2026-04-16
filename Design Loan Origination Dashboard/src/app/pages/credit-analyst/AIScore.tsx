import { ApplicationSelector } from '../../components/ui/ApplicationSelector';
import { ScoreGauge } from '../../components/ui/ScoreGauge';
import { AIExplanationPanel } from '../../components/ui/AIExplanationPanel';
import { useEffect, useMemo, useState } from 'react';
import { Download, ExternalLink, FileText, Sparkles } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { getLoanApplicationByArn } from '../../data/loanApplications';
import { buildAIRiskProfile } from '../../lib/aiRiskModel';
import { useStore } from '../../store';
import { workflowApi, type WorkflowAiScore } from '../../lib/workflowApi';

function formatMoney(value: number): string {
  return `Rs ${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPercent(value: number): string {
  const normalized = Math.abs(value) <= 1 ? value * 100 : value;
  return `${normalized.toFixed(2)}%`;
}

function toneForText(value: string): string {
  const lower = value.toLowerCase();
  if (lower.includes('reject') || lower.includes('high')) return 'text-rose-300';
  if (lower.includes('approve')) return 'text-emerald-300';
  if (lower.includes('manual')) return 'text-amber-300';
  return 'text-slate-100';
}

function readNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function extractSalarySignals(
  incomeAnalysis: Record<string, unknown>,
  salaryDiagnostics: Record<string, unknown>,
) {
  const salaryMonthsDetected = readNumber(incomeAnalysis.salary_months_detected ?? salaryDiagnostics.salary_months_detected ?? 0);
  const salaryTrendPct = readNumber(incomeAnalysis.salary_trend_pct ?? salaryDiagnostics.salary_trend_pct ?? 0);
  const salaryVarianceRatio = readNumber(incomeAnalysis.salary_variance_ratio ?? salaryDiagnostics.salary_variance_ratio ?? 0);
  const salaryDelayStdDays = readNumber(incomeAnalysis.salary_delay_std_days ?? salaryDiagnostics.salary_delay_std_days ?? 0);
  const employerSwitchCount = readNumber(incomeAnalysis.employer_switch_count ?? salaryDiagnostics.employer_switch_count ?? 0);
  const employersDetected = Array.isArray(incomeAnalysis.employers_detected)
    ? incomeAnalysis.employers_detected.filter((value): value is string => typeof value === 'string')
    : Array.isArray(salaryDiagnostics.employers_detected)
      ? salaryDiagnostics.employers_detected.filter((value): value is string => typeof value === 'string')
      : [];

  return {
    salaryMonthsDetected,
    salaryTrendPct,
    salaryVarianceRatio,
    salaryDelayStdDays,
    employerSwitchCount,
    employersDetected,
  };
}

export function AIScorePage() {
  const selectedApplicationArn = useStore((state) => state.selectedApplicationArn);
  const setSelectedApplicationArn = useStore((state) => state.setSelectedApplicationArn);
  const user = useStore((state) => state.user);
  const selectedApplication = getLoanApplicationByArn(selectedApplicationArn);
  const localProfile = buildAIRiskProfile(selectedApplication);
  const [apiScore, setApiScore] = useState<WorkflowAiScore | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'credit_analyst') return;
    workflowApi
      .getAiScore(selectedApplicationArn, user.role)
      .then((score) => setApiScore(score))
      .catch(() => setApiScore(null));
  }, [selectedApplicationArn, user]);

  const aiRiskProfile = useMemo(() => {
    if (!apiScore) return localProfile;
    return {
      ...localProfile,
      compositeScore: apiScore.composite_score,
      confidencePercent: apiScore.confidence_percent,
      decision: apiScore.decision,
      reasonCodes: apiScore.reason_codes,
    };
  }, [apiScore, localProfile]);

  const actualAppraisal = apiScore?.actual_appraisal ?? null;
  const appraisalAvailable = Boolean(actualAppraisal?.available ?? actualAppraisal?.final_score !== undefined);
  const displayScore = appraisalAvailable && actualAppraisal?.final_score != null ? Number(actualAppraisal.final_score) : aiRiskProfile.compositeScore;
  const displayConfidence = appraisalAvailable && actualAppraisal?.confidence_score != null ? Number(actualAppraisal.confidence_score) : aiRiskProfile.confidencePercent;
  const scoreMax = appraisalAvailable ? 100 : 900;
  const scoreLabel = appraisalAvailable ? 'Loan Appraisal Score' : 'Credit Score Proxy';
  const sourceLabel = apiScore?.model_source === 'loan_appraisal_record' ? 'Actual loan appraisal record' : 'Workflow proxy score';
  const reportPdfUrl = actualAppraisal?.report_pdf_access_url ?? '';
  const hasReportPdf = Boolean(reportPdfUrl);

  const analysisPeriod = actualAppraisal?.analysis_period;
  const monthCount = readNumber(analysisPeriod?.month_count ?? actualAppraisal?.month_count ?? actualAppraisal?.monthly_balance_table?.length ?? 0);
  const monthlyRows = actualAppraisal?.monthly_balance_table ?? [];
  const monthlyIncomeTotal = monthlyRows.reduce((sum, row) => sum + readNumber(row.credit), 0);
  const monthlyExpenseTotal = monthlyRows.reduce((sum, row) => sum + readNumber(row.debit), 0);
  const monthlyIncomeAverage = monthCount > 0 ? monthlyIncomeTotal / monthCount : 0;
  const monthlyExpenseAverage = monthCount > 0 ? monthlyExpenseTotal / monthCount : 0;
  const openingOutstanding = readNumber(actualAppraisal?.opening_outstanding_before_first_month ?? monthlyRows[0]?.opening_balance ?? 0);

  const rawKpiMetrics = (actualAppraisal?.kpi_metrics ?? {}) as Record<string, unknown>;
  const incomeAnalysis = (actualAppraisal?.income_analysis ?? rawKpiMetrics.income_analysis ?? {}) as Record<string, unknown>;
  const cashflowAnalysis = (actualAppraisal?.cashflow_analysis ?? rawKpiMetrics.cashflow_analysis ?? {}) as Record<string, unknown>;
  const liabilityAnalysis = (actualAppraisal?.liability_analysis ?? rawKpiMetrics.liability_analysis ?? {}) as Record<string, unknown>;
  const salaryDiagnostics = (actualAppraisal?.salary_diagnostics ?? rawKpiMetrics.salary_diagnostics ?? {}) as Record<string, unknown>;
  const borrowerKpis = (actualAppraisal?.borrower_kpis ?? rawKpiMetrics.borrower_kpis ?? {}) as Record<string, unknown>;
  const coApplicantKpis = (actualAppraisal?.co_applicant_kpis ?? rawKpiMetrics.co_applicant_kpis ?? {}) as Record<string, unknown>;
  const coApplicantAppraisal = (rawKpiMetrics.co_applicant_appraisal ?? {}) as Record<string, unknown>;
  const borrowerIncomeAnalysis = (borrowerKpis.income_analysis ?? incomeAnalysis) as Record<string, unknown>;
  const coApplicantIncomeAnalysis = (coApplicantKpis.income_analysis ?? coApplicantAppraisal.income_analysis ?? {}) as Record<string, unknown>;
  const borrowerSalaryDiagnostics = (
    actualAppraisal?.borrower_salary_diagnostics
    ?? borrowerKpis.salary_diagnostics
    ?? (salaryDiagnostics.borrower as Record<string, unknown> | undefined)
    ?? salaryDiagnostics
    ?? {}
  ) as Record<string, unknown>;
  const coApplicantSalaryDiagnostics = (
    actualAppraisal?.co_applicant_salary_diagnostics
    ?? coApplicantKpis.salary_diagnostics
    ?? rawKpiMetrics.co_applicant_salary_diagnostics
    ?? (salaryDiagnostics.co_applicant as Record<string, unknown> | undefined)
    ?? {}
  ) as Record<string, unknown>;
  const coApplicantMonthlyRows = (
    coApplicantKpis.monthly_balance_table
    ?? coApplicantAppraisal.monthly_balance_table
    ?? []
  ) as Array<{ month: string; credit: number; debit: number; savings: number; balance_remaining: number; opening_balance?: number }>;
  const hasCoApplicantSection = Object.keys(coApplicantIncomeAnalysis).length > 0
    || Object.keys(coApplicantSalaryDiagnostics).length > 0
    || coApplicantMonthlyRows.length > 0;
  const ruleInsights = actualAppraisal?.rulebook_top_insights ?? [];

  const borrowerSalary = extractSalarySignals(borrowerIncomeAnalysis, borrowerSalaryDiagnostics);
  const coApplicantSalary = extractSalarySignals(coApplicantIncomeAnalysis, coApplicantSalaryDiagnostics);

  const explanationFactors = useMemo(() => {
    if (appraisalAvailable && ruleInsights.length > 0) {
      return ruleInsights.slice(0, 5).map((factor, index) => ({
        factor,
        impact: [30, 24, 18, 14, 10][index] ?? 8,
        isPositive: false,
      }));
    }
    return aiRiskProfile.topFactors;
  }, [appraisalAvailable, aiRiskProfile.topFactors, ruleInsights]);

  const decisionLabel = appraisalAvailable
    ? `${actualAppraisal?.recommendation ?? 'Pending'} • ${actualAppraisal?.risk_level ?? 'N/A'}`
    : aiRiskProfile.decision === 'AUTO_APPROVE'
      ? 'Recommended for Approval'
      : aiRiskProfile.decision === 'MANUAL_REVIEW'
        ? 'Manual Review Required'
        : 'Recommended for Decline';

  const explanationText = appraisalAvailable
    ? `Actual appraisal output shows a ${actualAppraisal?.risk_level ?? 'N/A'} profile with ${actualAppraisal?.recommendation ?? 'pending'} recommendation based on ${actualAppraisal?.rows_analyzed ?? 0} rows of transaction evidence.`
    : aiRiskProfile.explanation;

  const reasonCodes = appraisalAvailable
    ? [...(actualAppraisal?.rulebook_top_insights ?? []).slice(0, 4)]
    : apiScore?.reason_codes ?? aiRiskProfile.reasonCodes;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.28),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.22),transparent_32%)]" />
        <div className="relative p-6 lg:p-8 space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2 max-w-3xl">
              <Badge variant="outline" className="border-emerald-400/40 bg-emerald-400/10 text-emerald-200">
                Credit Analyst Workbench
              </Badge>
              <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight">AI Credit Score Breakdown</h1>
              <p className="text-sm lg:text-base text-slate-300 leading-relaxed">
                ARN: {selectedApplication.arn} • {selectedApplication.borrowerName}. View the actual loan appraisal model output, salary behavior, cashflow quality, and month-wise evidence in one screen.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <Badge className="bg-white/10 text-white border-white/15">{sourceLabel}</Badge>
              <Badge className="bg-emerald-500/15 text-emerald-100 border-emerald-300/20">
                {appraisalAvailable ? 'Live appraisal record' : 'Workflow proxy'}
              </Badge>
              <Badge className="bg-slate-800/80 text-slate-100 border-slate-700/80">
                Coverage: {monthCount || selectedApplication.tenureMonths} months
              </Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {hasReportPdf ? (
              <>
                <Button asChild variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/15 hover:text-white">
                  <a href={reportPdfUrl} target="_blank" rel="noreferrer">
                    <FileText className="w-4 h-4" />
                    View PDF
                  </a>
                </Button>
                <Button asChild className="bg-emerald-500 text-slate-950 hover:bg-emerald-400">
                  <a href={reportPdfUrl} download>
                    <Download className="w-4 h-4" />
                    Download PDF
                  </a>
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-slate-300">
                <ExternalLink className="w-4 h-4" />
                PDF not available yet for this appraisal record
              </div>
            )}
          </div>

          <ApplicationSelector
            selectedArn={selectedApplication.arn}
            onSelect={setSelectedApplicationArn}
            subtitle="Search and filter borrowers to inspect the real appraisal record, model score, and factor contributions."
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-300">Primary Score</p>
              <div className="mt-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-4xl lg:text-5xl font-semibold text-white">{displayScore.toFixed(2)}</p>
                  <p className="text-sm text-slate-300 mt-1">{scoreLabel}</p>
                </div>
                <div className="flex items-center gap-2 text-emerald-300">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm font-medium">{appraisalAvailable ? 'Actual appraisal' : 'Proxy score'}</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-300">Decision</p>
              <p className={`mt-4 text-2xl font-semibold ${toneForText(decisionLabel)}`}>{decisionLabel}</p>
              <p className="text-sm text-slate-300 mt-1">Source: {sourceLabel}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-300">Confidence</p>
              <p className="mt-4 text-2xl font-semibold text-white">{displayConfidence.toFixed(2)}%</p>
              <p className="text-sm text-slate-300 mt-1">Confidence interval: {appraisalAvailable ? `${displayScore.toFixed(2)} / ${scoreMax}` : `${aiRiskProfile.compositeScore} ± ${aiRiskProfile.confidenceDelta}`}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.28em] text-slate-300">Rows</p>
              <p className="mt-4 text-2xl font-semibold text-white">{actualAppraisal?.rows_analyzed ?? '-'}</p>
              <p className="text-sm text-slate-300 mt-1">Model records analyzed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-6">
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="bg-gradient-to-br from-slate-50 to-white border-b border-slate-200">
            <CardTitle className="text-slate-900">Primary AI Score</CardTitle>
            <CardDescription>Actual loan appraisal record with score and confidence.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <ScoreGauge
                score={displayScore}
                maxScore={scoreMax}
                label={scoreLabel}
                showConfidence
                confidence={displayConfidence}
              />
              <div className="grid grid-cols-2 gap-3 flex-1">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Risk Level</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{actualAppraisal?.risk_level ?? selectedApplication.riskGrade}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Analysis Period</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{monthCount || '-'}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Opening Outstanding</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{formatMoney(openingOutstanding || 0)}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">PDF Available</p>
                  <p className="mt-2 text-base font-semibold text-slate-900">{actualAppraisal?.report_pdf_access_url ? 'Yes' : 'No'}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Average Monthly Inflow</p>
                <p className="mt-2 text-2xl font-semibold text-emerald-900">{formatMoney(monthlyIncomeAverage)}</p>
                <p className="text-xs text-emerald-700 mt-1">Derived from the actual month-wise table</p>
              </div>
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-700">Average Monthly Outflow</p>
                <p className="mt-2 text-2xl font-semibold text-amber-900">{formatMoney(monthlyExpenseAverage)}</p>
                <p className="text-xs text-amber-700 mt-1">Debit average from the appraisal record</p>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">Average Monthly Savings</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatMoney(monthlyIncomeAverage - monthlyExpenseAverage)}</p>
                <p className="text-xs text-slate-600 mt-1">Income minus expense</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <AIExplanationPanel
          decision={decisionLabel}
          explanation={explanationText}
          confidence={displayConfidence}
          confidenceInterval={appraisalAvailable ? `${displayScore.toFixed(2)} / ${scoreMax}` : `${aiRiskProfile.compositeScore} ± ${aiRiskProfile.confidenceDelta}`}
          modelVersion={actualAppraisal?.available ? 'loan_appraisal_record' : aiRiskProfile.modelVersion}
          lastTrainingDate={actualAppraisal?.analysis_period?.period_end ?? aiRiskProfile.lastTrainingDate}
          reasonCodes={reasonCodes}
          counterfactual={appraisalAvailable ? 'Use the salary diagnostics, cashflow table, and outstanding balance trail to test affordability changes.' : aiRiskProfile.counterfactual}
          topFactors={explanationFactors}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Loan Amount</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{formatMoney(selectedApplication.loanAmount)}</p>
            <p className="text-sm text-slate-600 mt-1">Requested by the borrower</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Salary Months</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{borrowerSalary.salaryMonthsDetected || '-'}</p>
            <p className="text-sm text-slate-600 mt-1">Borrower salary activity</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Late Salary Signal</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{borrowerSalary.salaryDelayStdDays > 3 ? 'Yes' : 'No'}</p>
            <p className="text-sm text-slate-600 mt-1">Borrower std dev: {borrowerSalary.salaryDelayStdDays.toFixed(2)} days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Employer Switches</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{borrowerSalary.employerSwitchCount || 0}</p>
            <p className="text-sm text-slate-600 mt-1">Borrower salary patterns</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Borrower Salary Diagnostics</CardTitle>
            <CardDescription>Borrower-specific salary behavior extracted from the appraisal record.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {borrowerSalary.salaryMonthsDetected > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Salary Trend</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{formatPercent(borrowerSalary.salaryTrendPct)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Salary Variability</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{formatPercent(borrowerSalary.salaryVarianceRatio)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Salary Reduction Signal</p>
                  <p className={`mt-2 text-2xl font-semibold ${borrowerSalary.salaryTrendPct < -0.05 ? 'text-rose-600' : 'text-emerald-600'}`}>{borrowerSalary.salaryTrendPct < -0.05 ? 'Detected' : 'No'}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Late Salary Signal</p>
                  <p className={`mt-2 text-2xl font-semibold ${borrowerSalary.salaryDelayStdDays > 3 ? 'text-amber-600' : 'text-emerald-600'}`}>{borrowerSalary.salaryDelayStdDays > 3 ? 'Likely' : 'Stable'}</p>
                </div>
              </div>
            ) : actualAppraisal ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                Salary diagnostics were not stored in this appraisal record. The record has been loaded from the database, but it does not contain salary-month metrics yet.
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                No appraisal record is available yet, so salary diagnostics cannot be shown.
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 mb-2">Detected salary sources</p>
              <div className="flex flex-wrap gap-2">
                {borrowerSalary.employersDetected.length > 0 ? borrowerSalary.employersDetected.map((employer) => (
                  <Badge key={employer} variant="secondary" className="bg-slate-100 text-slate-700">
                    {employer}
                  </Badge>
                )) : (
                  <span className="text-sm text-slate-500">No specific employer source detected.</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Co-Applicant Salary Diagnostics</CardTitle>
            <CardDescription>Co-applicant-specific salary behavior and indicators.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasCoApplicantSection && coApplicantSalary.salaryMonthsDetected > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Salary Trend</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{formatPercent(coApplicantSalary.salaryTrendPct)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Salary Variability</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{formatPercent(coApplicantSalary.salaryVarianceRatio)}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Late Salary Signal</p>
                  <p className={`mt-2 text-2xl font-semibold ${coApplicantSalary.salaryDelayStdDays > 3 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    {coApplicantSalary.salaryDelayStdDays > 3 ? 'Likely' : 'Stable'}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Employer Switches</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{coApplicantSalary.employerSwitchCount || 0}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
                {hasCoApplicantSection
                  ? 'Co-applicant salary diagnostics are not available in this record.'
                  : 'No co-applicant analytics were attached to this appraisal record.'}
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 mb-2">Detected co-applicant salary sources</p>
              <div className="flex flex-wrap gap-2">
                {coApplicantSalary.employersDetected.length > 0 ? coApplicantSalary.employersDetected.map((employer) => (
                  <Badge key={employer} variant="secondary" className="bg-slate-100 text-slate-700">
                    {employer}
                  </Badge>
                )) : (
                  <span className="text-sm text-slate-500">No specific co-applicant employer source detected.</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Model Evidence Summary</CardTitle>
            <CardDescription>Actual metrics and rule evidence behind the score.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Opening Outstanding</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatMoney(openingOutstanding || 0)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Analysis Period</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {analysisPeriod?.period_start ?? 'N/A'} - {analysisPeriod?.period_end ?? 'N/A'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Debt-to-Income</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{formatPercent(readNumber(liabilityAnalysis.debt_to_income_ratio ?? 0))}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Affordability</p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {String(actualAppraisal?.loan_analysis ? (actualAppraisal.loan_analysis as Record<string, unknown>).affordability ?? 'N/A' : 'N/A')}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500 mb-3">Reason codes / rule insights</p>
              <div className="flex flex-wrap gap-2">
                {reasonCodes.length > 0 ? reasonCodes.map((code) => (
                  <Badge key={code} variant="outline" className="border-slate-300 bg-slate-50 text-slate-700">
                    {code}
                  </Badge>
                )) : (
                  <span className="text-sm text-slate-500">No reason codes available.</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-slate-900">Month-wise Income, Expense & Outstanding</CardTitle>
          <CardDescription>Actual month-wise evidence from the loan appraisal record.</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyRows.length > 0 ? (
            <>
              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                Opening Outstanding before <span className="font-semibold text-slate-900">{monthlyRows[0].month}</span>: <span className="font-semibold text-slate-900">{formatMoney(openingOutstanding || 0)}</span>
              </div>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Month</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Income (Credit)</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Expenses (Debit)</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Savings</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {monthlyRows.map((row) => (
                      <tr key={row.month} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-medium text-slate-900">{row.month}</td>
                        <td className="px-4 py-3 text-slate-700">{formatMoney(readNumber(row.credit))}</td>
                        <td className="px-4 py-3 text-slate-700">{formatMoney(readNumber(row.debit))}</td>
                        <td className={`px-4 py-3 font-medium ${readNumber(row.savings) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {formatMoney(readNumber(row.savings))}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{formatMoney(readNumber(row.balance_remaining))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              No month-wise appraisal table is available for this borrower yet.
            </div>
          )}
        </CardContent>
      </Card>

      {hasCoApplicantSection && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Co-Applicant Month-wise Income, Expense & Outstanding</CardTitle>
            <CardDescription>Separate month-wise evidence for co-applicant statement analysis.</CardDescription>
          </CardHeader>
          <CardContent>
            {coApplicantMonthlyRows.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Month</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Income (Credit)</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Expenses (Debit)</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Savings</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {coApplicantMonthlyRows.map((row) => (
                      <tr key={row.month} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-medium text-slate-900">{row.month}</td>
                        <td className="px-4 py-3 text-slate-700">{formatMoney(readNumber(row.credit))}</td>
                        <td className="px-4 py-3 text-slate-700">{formatMoney(readNumber(row.debit))}</td>
                        <td className={`px-4 py-3 font-medium ${readNumber(row.savings) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {formatMoney(readNumber(row.savings))}
                        </td>
                        <td className="px-4 py-3 text-slate-700">{formatMoney(readNumber(row.balance_remaining))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
                Co-applicant month-wise table is not available in this appraisal record.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Score Context</CardTitle>
            <CardDescription>How to interpret this appraisal score within the credit workflow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p>{appraisalAvailable ? 'This view is sourced from the actual loan_appraisal_record stored by the backend after statement processing.' : 'This view is currently using the workflow proxy until the appraisal record is available.'}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Loan Amount</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{formatMoney(selectedApplication.loanAmount)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Credit Score Proxy</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{selectedApplication.creditScore}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-900">Selected Borrower Snapshot</CardTitle>
            <CardDescription>Queue context for the current profile.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-slate-500">Borrower</p>
              <p className="font-semibold text-slate-900">{selectedApplication.borrowerName}</p>
            </div>
            <div>
              <p className="text-slate-500">Stage</p>
              <p className="font-semibold text-slate-900">{selectedApplication.stage}</p>
            </div>
            <div>
              <p className="text-slate-500">Employment</p>
              <p className="font-semibold text-slate-900">{selectedApplication.employmentType}</p>
            </div>
            <div>
              <p className="text-slate-500">KYC</p>
              <p className="font-semibold text-slate-900">{selectedApplication.kycStatus}</p>
            </div>
            <div>
              <p className="text-slate-500">Risk Grade</p>
              <p className="font-semibold text-slate-900">{selectedApplication.riskGrade}</p>
            </div>
            <div>
              <p className="text-slate-500">Tenure</p>
              <p className="font-semibold text-slate-900">{selectedApplication.tenureMonths} months</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
