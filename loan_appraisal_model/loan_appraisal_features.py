"""Feature extraction for transaction-based loan appraisal."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, List

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
    "spotify",
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

EXPENSE_CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    "Food": ["swiggy", "zomato", "restaurant", "food", "cafe", "bigbasket", "dmart", "grocery"],
    "Bills": [
        "electricity",
        "water",
        "internet",
        "airtel",
        "jio",
        "recharge",
        "gas",
        "utility",
        "bill",
        "netflix",
        "prime",
        "hotstar",
        "spotify",
        "insurance",
        "dth",
    ],
    "Rent": ["rent", "landlord", "lease", "warehouse rent"],
    "Travel": ["ola", "uber", "irctc", "flight", "travel", "metro", "bus"],
    "Shopping": ["amazon", "flipkart", "myntra", "shopping", "store", "bookmyshow"],
    "Transfers": [
        "p2p transfer",
        "account transfer",
        "savings transfer",
        "trf",
        "neft dr",
        "rtgs dr",
        "imps",
        "transfer",
        "vendor payment",
        "supplier payment",
    ],
}

INCOME_FREELANCE_KEYWORDS = ["project", "invoice", "inv", "consult", "freelance", "contract"]
INCOME_BUSINESS_KEYWORDS = ["bulk receipt", "invoice settlement", "clt", "rtgs cr", "business"]


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
    if s in {"", "-", "nan", "None", "null", "0.00"}:
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


def _standardize_columns(df: pd.DataFrame) -> pd.DataFrame:
    col_map = {str(c).strip().lower(): c for c in df.columns}

    def pick(*names: str) -> pd.Series:
        for n in names:
            key = n.lower()
            if key in col_map:
                return df[col_map[key]]
        return pd.Series([""] * len(df), index=df.index, dtype="object")

    out = pd.DataFrame(index=df.index)
    out["txn_date"] = pick("txn_date", "post_date", "date")
    out["value_date"] = pick("value_date", "txn_date", "post_date")
    out["description"] = pick("description", "details", "narration", "remarks")
    out["reference"] = pick("reference", "ref_no", "ref", "chq")
    out["debit"] = pick("debit", "withdrawal", "dr")
    out["credit"] = pick("credit", "deposit", "cr")
    out["balance"] = pick("balance", "closing_balance", "bal")
    return out


def _categorize_expenses(df: pd.DataFrame) -> Dict[str, float]:
    totals = {k: 0.0 for k in ["Food", "Bills", "Rent", "Travel", "Shopping", "Transfers", "Unknown"]}
    debit_df = df[df["debit_amt"] > 0].copy()

    for _, row in debit_df.iterrows():
        desc = str(row.get("description", "")).lower()
        amt = float(row.get("debit_amt", 0.0) or 0.0)
        assigned = False
        for cat, kws in EXPENSE_CATEGORY_KEYWORDS.items():
            if any(k in desc for k in kws):
                totals[cat] += amt
                assigned = True
                break
        if not assigned:
            totals["Unknown"] += amt

    return {k: round(v, 2) for k, v in totals.items()}


def _classify_income_type(df: pd.DataFrame, salary_months: int) -> str:
    credits = df[df["credit_amt"] > 0].copy()
    if credits.empty:
        return "Unemployed"

    desc_text = " ".join(credits["description"].astype(str).str.lower().tolist())
    salary_hits = int(credits["description"].str.lower().str.contains("sal|salary|payroll", regex=True).sum())
    freelance_hits = sum(desc_text.count(k) for k in INCOME_FREELANCE_KEYWORDS)
    business_hits = sum(desc_text.count(k) for k in INCOME_BUSINESS_KEYWORDS)

    if salary_months >= 3 and salary_hits >= 3:
        return "Salaried"
    if business_hits >= max(3, freelance_hits):
        return "Business"
    if freelance_hits >= 2:
        return "Freelance"
    return "Informal income"


def load_transactions(csv_path: str) -> pd.DataFrame:
    try:
        raw = pd.read_csv(csv_path, dtype=str)
    except Exception:
        raw = pd.read_csv(csv_path, names=TX_COLUMNS, header=None, dtype=str)

    if not set(str(c).strip().lower() for c in raw.columns).intersection(
        {"debit", "credit", "balance", "details", "description", "post_date", "txn_date"}
    ):
        raw = pd.read_csv(csv_path, names=TX_COLUMNS, header=None, dtype=str)

    df = _standardize_columns(raw)
    for c in ["description", "reference", "txn_date", "value_date", "debit", "credit", "balance"]:
        df[c] = df[c].fillna("").astype(str)

    df["txn_date"] = pd.to_datetime(df["txn_date"], format="%d/%m/%Y", errors="coerce")
    df["value_date"] = pd.to_datetime(df["value_date"], format="%d/%m/%Y", errors="coerce")

    # Never drop transactions: fallback order for missing dates keeps every row in analysis.
    df["txn_date"] = df["txn_date"].fillna(df["value_date"])
    if df["txn_date"].isna().all():
        df["txn_date"] = pd.Timestamp.utcnow().normalize()
    else:
        df["txn_date"] = df["txn_date"].ffill().bfill()

    df["value_date"] = df["value_date"].fillna(df["txn_date"])

    df["debit_amt"] = df["debit"].apply(_to_amount)
    df["credit_amt"] = df["credit"].apply(_to_amount)
    df["balance_amt"] = df["balance"].apply(_to_amount)

    df = df.reset_index(drop=True)
    df["row_id"] = df.index
    df = df.sort_values(["txn_date", "value_date", "row_id"]).reset_index(drop=True)
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

    monthly_income = float(monthly_credit.mean()) if not monthly_credit.empty else 0.0
    monthly_expense = float(monthly_debit.mean()) if not monthly_debit.empty else 0.0
    monthly_savings = monthly_income - monthly_expense
    if round(monthly_savings, 2) != round(monthly_income - monthly_expense, 2):
        monthly_savings = monthly_income - monthly_expense
    savings_ratio_pct = (monthly_savings / monthly_income) * 100.0 if monthly_income > 0 else 0.0
    net_savings_ratio = (monthly_savings / monthly_income) if monthly_income > 0 else -1.0

    min_balance = float(df["balance_amt"].min())
    peak_balance = float(df["balance_amt"].max())

    daily_closing_balance = (
        df.sort_values(["txn_date", "value_date", "row_id"]) 
        .groupby(df["txn_date"].dt.normalize())["balance_amt"]
        .last()
    )
    low_balance_days = int((daily_closing_balance < 5000.0).sum())
    total_balance_days = max(int(daily_closing_balance.shape[0]), 1)
    liquidity_stress_pct = (low_balance_days / total_balance_days) * 100.0

    month_end_daily_close = daily_closing_balance[daily_closing_balance.index.day >= 25]
    month_end_stress_count = int((month_end_daily_close < 5000.0).sum())

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

    expense_categories = _categorize_expenses(df)
    income_classification = _classify_income_type(df, salary_months)

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
        "stress_low_balance_tier": _tier_from_risk(min(1.0, liquidity_stress_pct / 35.0)),
        "stress_credit_dependency_tier": _tier_from_risk(min(1.0, max(0.0, credit_dependency_trend))),
        "metric_salary_months": salary_months,
        "metric_salary_cv": round(salary_cv, 4),
        "metric_salary_trend_pct": round(salary_trend_pct, 4),
        "metric_employer_switch_count": employer_switch_count,
        "metric_total_inflow": round(total_inflow, 2),
        "metric_total_outflow": round(total_outflow, 2),
        "metric_net_savings_ratio": round(net_savings_ratio, 4),
        "metric_monthly_income": round(monthly_income, 2),
        "metric_monthly_expense": round(monthly_expense, 2),
        "metric_monthly_savings": round(monthly_savings, 2),
        "metric_savings_ratio_pct": round(savings_ratio_pct, 2),
        "metric_min_balance": round(min_balance, 2),
        "metric_peak_balance": round(peak_balance, 2),
        "metric_month_end_stress_count": month_end_stress_count,
        "metric_low_balance_days": low_balance_days,
        "metric_liquidity_stress_pct": round(liquidity_stress_pct, 2),
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
    if liquidity_stress_pct > 40.0:
        behavioral_flags.append("Frequent low-balance days indicate liquidity stress")
        red_flags.append("Sustained low-balance pattern across daily closing balances")
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
        "income_classification": income_classification,
    }

    cashflow_analysis = {
        "total_inflow": round(total_inflow, 2),
        "total_outflow": round(total_outflow, 2),
        "monthly_income": round(monthly_income, 2),
        "monthly_expense": round(monthly_expense, 2),
        "monthly_savings": round(monthly_savings, 2),
        "savings_ratio_pct": round(savings_ratio_pct, 2),
        "net_savings_ratio": round(net_savings_ratio, 4),
        "minimum_balance": round(min_balance, 2),
        "peak_balance": round(peak_balance, 2),
        "low_balance_days": low_balance_days,
        "liquidity_stress_pct": round(liquidity_stress_pct, 2),
        "month_end_stress_count": month_end_stress_count,
        "negative_savings_months": negative_savings_months,
        "expense_categories": expense_categories,
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
