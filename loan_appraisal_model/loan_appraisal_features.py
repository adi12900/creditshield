"""Feature extraction for transaction-based loan appraisal."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List, Tuple

import pandas as pd


TX_COLUMNS = [
    "txn_date",
    "value_date",
    "description",
    "reference",
    "debit",
    "credit",
    "balance",
]

DIGITAL_LENDERS = [
    "slice",
    "kreditbee",
    "navi",
    "lazypay",
    "simpl",
    "moneyview",
    "mpokket",
    "dhani",
    "kissht",
    "cashe",
    "zestmoney",
    "paytm postpaid",
    "amazon pay later",
    "flipkart pay later",
    "bnpl",
]

BILL_KEYWORDS = [
    "electricity",
    "water",
    "broadband",
    "internet",
    "airtel",
    "jio",
    "recharge",
    "gas",
    "insurance",
    "emi",
    "dth",
    "netflix",
    "prime",
    "hotstar",
    "utility",
]

LIFESTYLE_KEYWORDS = [
    "swiggy",
    "zomato",
    "amazon",
    "flipkart",
    "myntra",
    "uber",
    "ola",
    "travel",
    "movie",
    "shopping",
    "restaurant",
]

ADDICTION_KEYWORDS = [
    "liquor",
    "alcohol",
    "wine",
    "bar",
    "casino",
    "bet",
    "betting",
    "rummy",
    "dream11",
    "poker",
    "lottery",
    "gaming",
]

EMI_KEYWORDS = ["emi", "loan", "nach", "ecs", "ach", "autopay", "auto debit", "autodebit"]


@dataclass
class FeatureResult:
    features: Dict[str, Any]
    income_analysis: Dict[str, Any]
    cashflow_analysis: Dict[str, Any]
    loan_analysis: Dict[str, Any]
    behavioral_flags: List[str]
    red_flags: List[str]
    category_scores: Dict[str, float]


def _to_amount(value: Any) -> float:
    if value is None:
        return 0.0
    s = str(value).strip().replace(",", "")
    if s in {"", "-", "nan", "None"}:
        return 0.0
    try:
        return float(s)
    except ValueError:
        return 0.0


def _tier_from_risk(value: float) -> str:
    if value >= 0.85:
        return "critical"
    if value >= 0.65:
        return "high"
    if value >= 0.45:
        return "moderate"
    if value >= 0.25:
        return "stable"
    return "strong"


def _score_from_tier(tier: str) -> float:
    mapping = {
        "critical": 0.15,
        "high": 0.35,
        "moderate": 0.55,
        "stable": 0.75,
        "strong": 0.9,
    }
    return mapping.get(tier, 0.55)


def _contains_any(s: str, keywords: List[str]) -> bool:
    low = s.lower()
    return any(k in low for k in keywords)


def _parse_employer(description: str) -> str:
    parts = [p.strip() for p in str(description).split("/") if p.strip()]
    if len(parts) >= 3 and "sal" in parts[1].lower():
        return parts[2].upper()
    for p in parts:
        if "salary" in p.lower() and len(p) > 6:
            return p.upper()
    return "UNKNOWN"


def load_transactions(csv_path: str) -> pd.DataFrame:
    df = pd.read_csv(csv_path, names=TX_COLUMNS, header=None, dtype=str)
    for c in ["description", "reference"]:
        df[c] = df[c].fillna("").astype(str)

    df["txn_date"] = pd.to_datetime(df["txn_date"], format="%d/%m/%Y", errors="coerce")
    df["value_date"] = pd.to_datetime(df["value_date"], format="%d/%m/%Y", errors="coerce")
    df["debit_amt"] = df["debit"].apply(_to_amount)
    df["credit_amt"] = df["credit"].apply(_to_amount)
    df["balance_amt"] = df["balance"].apply(_to_amount)
    df = df[df["txn_date"].notna()].copy()
    df["month"] = df["txn_date"].dt.to_period("M")
    df["day"] = df["txn_date"].dt.day
    return df


def extract_features(df: pd.DataFrame) -> FeatureResult:
    if df.empty:
        raise ValueError("No valid transactions found in file")

    months = max(df["month"].nunique(), 1)
    active_days = max(df["txn_date"].dt.normalize().nunique(), 1)

    salary_mask = (
        (df["credit_amt"] > 0)
        & df["description"].str.lower().str.contains("sal|salary|payroll", regex=True)
    )
    salary_df = df[salary_mask].copy()
    salary_by_month = salary_df.groupby("month")["credit_amt"].sum()
    salary_months = int(salary_by_month.shape[0])
    salary_mean = float(salary_by_month.mean()) if salary_months else 0.0
    salary_std = float(salary_by_month.std(ddof=0)) if salary_months else 0.0
    salary_cv = (salary_std / salary_mean) if salary_mean > 0 else 1.0

    salary_trend_pct = 0.0
    if salary_months >= 4:
        early = float(salary_by_month.head(2).mean())
        late = float(salary_by_month.tail(2).mean())
        if early > 0:
            salary_trend_pct = (late - early) / early

    employer_list = sorted({_parse_employer(d) for d in salary_df["description"].tolist()})
    employer_switch_count = max(0, len([e for e in employer_list if e != "UNKNOWN"]) - 1)

    salary_day_std = 0.0
    if not salary_df.empty:
        salary_day_std = float(salary_df["txn_date"].dt.day.std(ddof=0))

    monthly_credit = df.groupby("month")["credit_amt"].sum()
    monthly_debit = df.groupby("month")["debit_amt"].sum()
    monthly_net = monthly_credit - monthly_debit

    total_inflow = float(df["credit_amt"].sum())
    total_outflow = float(df["debit_amt"].sum())
    net_savings_ratio = (total_inflow - total_outflow) / total_inflow if total_inflow > 0 else -1.0

    min_balance = float(df["balance_amt"].min())
    peak_balance = float(df["balance_amt"].max())

    low_balance_threshold = max(5000.0, salary_mean * 0.2) if salary_mean > 0 else 5000.0
    daily_min_balance = df.groupby(df["txn_date"].dt.normalize())["balance_amt"].min()
    low_balance_days = int((daily_min_balance < low_balance_threshold).sum())
    month_end_daily_min = (
        df[df["day"] >= 25]
        .groupby(df[df["day"] >= 25]["txn_date"].dt.normalize())["balance_amt"]
        .min()
    )
    month_end_stress_count = int((month_end_daily_min < low_balance_threshold).sum())

    emi_mask = (df["debit_amt"] > 0) & df["description"].apply(lambda x: _contains_any(x, EMI_KEYWORDS))
    emi_df = df[emi_mask].copy()
    emi_months = int(emi_df["month"].nunique())
    avg_emi = float(emi_df.groupby("month")["debit_amt"].sum().mean()) if not emi_df.empty else 0.0

    hidden_emi_mask = emi_mask & ~df["description"].str.lower().str.contains("emi", regex=False)
    hidden_emi_count = int(hidden_emi_mask.sum())

    digital_mask = df["description"].apply(lambda x: _contains_any(x, DIGITAL_LENDERS))
    digital_df = df[digital_mask].copy()
    digital_lending_count = int(digital_df.shape[0])
    digital_lending_months = int(digital_df["month"].nunique()) if not digital_df.empty else 0

    bnpl_count = int(
        df["description"]
        .str.lower()
        .str.contains("postpaid|pay later|bnpl|slice|simpl|lazypay", regex=True)
        .sum()
    )

    bill_mask = df["description"].apply(lambda x: _contains_any(x, BILL_KEYWORDS))
    bill_df = df[bill_mask].copy()
    bill_months = int(bill_df["month"].nunique()) if not bill_df.empty else 0
    bill_irregularity = 1.0 - (bill_months / months)

    lifestyle_spend = float(df[df["description"].apply(lambda x: _contains_any(x, LIFESTYLE_KEYWORDS))]["debit_amt"].sum())
    addiction_spend = float(df[df["description"].apply(lambda x: _contains_any(x, ADDICTION_KEYWORDS))]["debit_amt"].sum())
    lifestyle_ratio = lifestyle_spend / total_outflow if total_outflow > 0 else 0.0
    addiction_ratio = addiction_spend / total_outflow if total_outflow > 0 else 0.0

    spend_spike_months = 0
    if len(monthly_debit) >= 3:
        spend_spike_limit = float(monthly_debit.mean() + 1.5 * monthly_debit.std(ddof=0))
        spend_spike_months = int((monthly_debit > spend_spike_limit).sum())

    cash_withdrawals = int(df["description"].str.lower().str.contains("atm wd|cash wd|cash withdrawal", regex=True).sum())

    negative_savings_months = int((monthly_net < 0).sum())
    credit_dependency_trend = 0.0
    if len(monthly_net) >= 4:
        first_half = float(monthly_net.head(len(monthly_net) // 2).mean())
        second_half = float(monthly_net.tail(len(monthly_net) - len(monthly_net) // 2).mean())
        if abs(first_half) > 1:
            credit_dependency_trend = (first_half - second_half) / abs(first_half)

    income_risk = 0.0
    income_risk += 0.35 * (1.0 - min(1.0, salary_months / max(1, months)))
    income_risk += 0.25 * min(1.0, salary_cv)
    income_risk += 0.2 * (1.0 if salary_trend_pct < -0.1 else 0.0)
    income_risk += 0.2 * min(1.0, employer_switch_count / 2)

    credit_risk = 0.0
    credit_risk += 0.4 * min(1.0, digital_lending_count / 24)
    credit_risk += 0.3 * min(1.0, bnpl_count / 18)
    credit_risk += 0.3 * min(1.0, max(0.0, credit_dependency_trend))

    discipline_risk = 0.0
    discipline_risk += 0.4 * min(1.0, bill_irregularity)
    discipline_risk += 0.35 * min(1.0, max(0.0, -net_savings_ratio + 0.2))
    discipline_risk += 0.25 * min(1.0, month_end_stress_count / max(1, months * 4))

    loan_burden_risk = 0.0
    loan_burden_risk += 0.45 * min(1.0, emi_months / max(1, months))
    if salary_mean > 0:
        loan_burden_risk += 0.35 * min(1.0, avg_emi / salary_mean)
    loan_burden_risk += 0.2 * min(1.0, hidden_emi_count / 10)

    lifestyle_risk = 0.0
    lifestyle_risk += 0.45 * min(1.0, lifestyle_ratio / 0.35)
    lifestyle_risk += 0.45 * min(1.0, addiction_ratio / 0.07)
    lifestyle_risk += 0.1 * min(1.0, spend_spike_months / max(1, months))

    income_tier = _tier_from_risk(income_risk)
    credit_tier = _tier_from_risk(credit_risk)
    discipline_tier = _tier_from_risk(discipline_risk)
    loan_tier = _tier_from_risk(loan_burden_risk)
    lifestyle_tier = _tier_from_risk(lifestyle_risk)

    features: Dict[str, Any] = {
        "salary_salary_detection_tier": income_tier,
        "salary_salary_consistency_tier": _tier_from_risk(min(1.0, salary_cv)),
        "salary_salary_fluctuation_tier": _tier_from_risk(min(1.0, salary_cv)),
        "salary_salary_hike_drop_tier": _tier_from_risk(1.0 if salary_trend_pct < -0.1 else 0.25 if salary_trend_pct < 0 else 0.1),
        "salary_job_switching_tier": _tier_from_risk(min(1.0, employer_switch_count / 2)),
        "salary_salary_delay_tier": _tier_from_risk(min(1.0, salary_day_std / 8.0)),
        "cashflow_net_savings_tier": _tier_from_risk(min(1.0, max(0.0, -net_savings_ratio + 0.2))),
        "cashflow_month_end_stress_tier": _tier_from_risk(min(1.0, month_end_stress_count / max(1, months * 4))),
        "emi_emi_deduction_tier": _tier_from_risk(min(1.0, emi_months / max(1, months))),
        "emi_hidden_loan_tier": _tier_from_risk(min(1.0, hidden_emi_count / 10)),
        "digital_digital_lending_usage_tier": _tier_from_risk(min(1.0, digital_lending_count / 24)),
        "digital_bnpl_dependency_tier": _tier_from_risk(min(1.0, bnpl_count / 18)),
        "bill_bill_regular_tier": _tier_from_risk(min(1.0, bill_irregularity)),
        "lifestyle_spending_spike_tier": _tier_from_risk(min(1.0, spend_spike_months / max(1, months))),
        "lifestyle_addiction_tier": _tier_from_risk(min(1.0, addiction_ratio / 0.07)),
        "stress_low_balance_tier": _tier_from_risk(min(1.0, low_balance_days / max(1, active_days * 0.3))),
        "stress_credit_dependency_tier": _tier_from_risk(min(1.0, max(0.0, credit_dependency_trend))),
        "metric_salary_months": salary_months,
        "metric_salary_cv": round(salary_cv, 4),
        "metric_salary_trend_pct": round(salary_trend_pct, 4),
        "metric_employer_switch_count": employer_switch_count,
        "metric_total_inflow": round(total_inflow, 2),
        "metric_total_outflow": round(total_outflow, 2),
        "metric_net_savings_ratio": round(net_savings_ratio, 4),
        "metric_min_balance": round(min_balance, 2),
        "metric_peak_balance": round(peak_balance, 2),
        "metric_month_end_stress_count": month_end_stress_count,
        "metric_emi_months": emi_months,
        "metric_hidden_emi_count": hidden_emi_count,
        "metric_digital_lending_count": digital_lending_count,
        "metric_bnpl_count": bnpl_count,
        "metric_bill_months": bill_months,
        "metric_addiction_ratio": round(addiction_ratio, 4),
        "metric_negative_savings_months": negative_savings_months,
    }

    behavioral_flags: List[str] = []
    red_flags: List[str] = []

    if employer_switch_count > 0:
        behavioral_flags.append("Salary source switching detected")
    if salary_trend_pct < -0.1:
        behavioral_flags.append("Salary drop trend detected")
        red_flags.append("Salary reduced materially in recent months")
    if salary_day_std > 5:
        behavioral_flags.append("Salary credit delay variability detected")
    if emi_months >= 6 and hidden_emi_count >= 3:
        behavioral_flags.append("Hidden EMI / auto-debit loan pattern detected")
        red_flags.append("Possible undisclosed loan obligations")
    if digital_lending_count >= 8:
        behavioral_flags.append("Frequent digital lending usage")
        red_flags.append("High dependence on short-term digital credit")
    if bnpl_count >= 6:
        behavioral_flags.append("BNPL dependency signal detected")
    if bill_irregularity > 0.35:
        behavioral_flags.append("Irregular bill payment behavior")
    if net_savings_ratio < 0.05:
        behavioral_flags.append("Very low savings cushion against monthly outflows")
        red_flags.append("Thin repayment buffer with low net savings")
    if low_balance_days > active_days * 0.4:
        behavioral_flags.append("Frequent low-balance days indicate liquidity stress")
        red_flags.append("Sustained low-balance pattern across active transaction days")
    if addiction_ratio > 0.04:
        behavioral_flags.append("Addiction-related spending pattern detected")
        red_flags.append("Potential gambling/alcohol/high-risk discretionary spend")
    if negative_savings_months > months * 0.4:
        behavioral_flags.append("Negative savings trend across months")
        red_flags.append("Persistent monthly cash deficit")

    income_analysis = {
        "salary_months_detected": salary_months,
        "salary_mean": round(salary_mean, 2),
        "salary_variance_ratio": round(salary_cv, 4),
        "salary_trend_pct": round(salary_trend_pct, 4),
        "employers_detected": employer_list,
        "employer_switch_count": employer_switch_count,
        "salary_delay_std_days": round(salary_day_std, 2),
    }

    cashflow_analysis = {
        "total_inflow": round(total_inflow, 2),
        "total_outflow": round(total_outflow, 2),
        "net_savings_ratio": round(net_savings_ratio, 4),
        "minimum_balance": round(min_balance, 2),
        "peak_balance": round(peak_balance, 2),
        "low_balance_days": low_balance_days,
        "month_end_stress_count": month_end_stress_count,
        "negative_savings_months": negative_savings_months,
    }

    loan_analysis = {
        "emi_transaction_count": int(emi_df.shape[0]),
        "emi_active_months": emi_months,
        "estimated_average_monthly_emi": round(avg_emi, 2),
        "hidden_emi_count": hidden_emi_count,
        "digital_lending_count": digital_lending_count,
        "digital_lending_months": digital_lending_months,
        "bnpl_count": bnpl_count,
        "cash_withdrawal_count": cash_withdrawals,
    }

    category_scores = {
        "Income Stability": round(_score_from_tier(income_tier) * 100, 2),
        "Credit Behavior": round(_score_from_tier(credit_tier) * 100, 2),
        "Financial Discipline": round(_score_from_tier(discipline_tier) * 100, 2),
        "Loan Burden": round(_score_from_tier(loan_tier) * 100, 2),
        "Lifestyle Risk": round(_score_from_tier(lifestyle_tier) * 100, 2),
    }

    return FeatureResult(
        features=features,
        income_analysis=income_analysis,
        cashflow_analysis=cashflow_analysis,
        loan_analysis=loan_analysis,
        behavioral_flags=behavioral_flags,
        red_flags=red_flags,
        category_scores=category_scores,
    )
