import importlib
import json
import re
import sys
import tempfile
import time
from datetime import timedelta
from pathlib import Path
from typing import Any

import pandas as pd


class LoanAppraisalServiceError(Exception):
    def __init__(self, message: str, status_code: int = 400) -> None:
        super().__init__(message)
        self.status_code = status_code


class LoanAppraisalService:
    def __init__(self) -> None:
        self.repo_root = Path(__file__).resolve().parents[3]
        self.model_dir = self.repo_root / "loan_appraisal_model"
        self._bedrock_client: Any | None = None

        self._column_aliases: dict[str, tuple[str, ...]] = {
            "txn_date": ("txn_date", "transaction_date", "date", "posting_date", "transactiondate"),
            "value_date": ("value_date", "valuedate", "value dt", "value date"),
            "description": ("description", "narration", "remarks", "particulars", "transaction_details"),
            "reference": ("reference", "ref", "utr", "chq_no", "cheque_no", "transaction_id"),
            "debit": ("debit", "withdrawal", "debit_amount", "dr", "paid_out"),
            "credit": ("credit", "deposit", "credit_amount", "cr", "paid_in"),
            "amount": ("amount", "txn_amount", "transaction_amount"),
            "txn_type": ("type", "txn_type", "transaction_type", "dr_cr", "debit_credit"),
            "balance": ("balance", "closing_balance", "running_balance", "available_balance"),
        }

    def _normalize_col(self, value: str) -> str:
        return re.sub(r"[^a-z0-9]+", "_", str(value).strip().lower()).strip("_")

    def _find_col(self, df: pd.DataFrame, logical_name: str) -> str | None:
        alias_set = {self._normalize_col(a) for a in self._column_aliases.get(logical_name, ())}
        for c in df.columns:
            if self._normalize_col(c) in alias_set:
                return c
        return None

    def _to_number(self, value: Any) -> float:
        if value is None:
            return 0.0
        text = str(value).strip()
        if text == "":
            return 0.0
        cleaned = re.sub(r"[^0-9.\-]", "", text.replace(",", ""))
        if cleaned in {"", "-", ".", "-."}:
            return 0.0
        try:
            return float(cleaned)
        except ValueError:
            return 0.0

    def _column_looks_like_flag(self, series: pd.Series) -> bool:
        sample = series.dropna().astype(str).str.strip().str.lower()
        if sample.empty:
            return False
        sample = sample[~sample.isin({"", "-", "nan", "none"})]
        if sample.empty:
            return False
        normalized = sample.str.replace(",", "", regex=False)
        numeric = pd.to_numeric(normalized, errors="coerce")
        if numeric.notna().mean() < 0.85:
            return False
        non_zero = numeric[numeric > 0]
        if non_zero.empty:
            return False
        if non_zero.max() <= 1.5 and numeric.dropna().isin([0, 1]).mean() >= 0.75:
            return True
        return set(sample.unique()).issubset({"0", "1", "1.0", "0.0", "cr", "dr", "credit", "debit"})

    def _parse_date_series(self, series: pd.Series) -> pd.Series:
        return pd.to_datetime(series, errors="coerce", dayfirst=True)

    def _extract_pdf_to_dataframe(self, pdf_path: Path) -> pd.DataFrame:
        try:
            import pdfplumber
        except ModuleNotFoundError as exc:
            raise LoanAppraisalServiceError(
                "PDF parsing requires pdfplumber. Install it in backend environment.",
                500,
            ) from exc

        frames: list[pd.DataFrame] = []
        with pdfplumber.open(str(pdf_path)) as pdf:
            for page in pdf.pages:
                for table in page.extract_tables() or []:
                    if not table:
                        continue

                    cleaned_rows: list[list[str]] = []
                    for row in table:
                        if not row:
                            continue
                        normalized_row = [str(cell).strip() if cell is not None else "" for cell in row]
                        if any(normalized_row):
                            cleaned_rows.append(normalized_row)

                    if len(cleaned_rows) < 2:
                        continue

                    header_candidate = cleaned_rows[0]
                    header_tokens = " ".join(header_candidate).lower()
                    looks_like_header = any(
                        token in header_tokens
                        for token in ("date", "narration", "description", "debit", "credit", "balance")
                    )

                    if looks_like_header:
                        frame = pd.DataFrame(cleaned_rows[1:], columns=header_candidate)
                    else:
                        frame = pd.DataFrame(cleaned_rows)
                    frames.append(frame)

        if not frames:
            raise LoanAppraisalServiceError("No transaction-like tables found in PDF statement", 400)

        merged = pd.concat(frames, ignore_index=True)
        merged.columns = [str(c).strip() if str(c).strip() else f"col_{idx}" for idx, c in enumerate(merged.columns)]
        return merged

    def _normalize_statement_df(self, df: pd.DataFrame) -> pd.DataFrame:
        raw = df.copy()
        raw.columns = [str(c).strip() for c in raw.columns]

        if all(str(c).startswith("Unnamed") for c in raw.columns) and raw.shape[1] >= 7:
            raw.columns = [f"col_{i}" for i in range(raw.shape[1])]

        date_col = self._find_col(raw, "txn_date")
        value_date_col = self._find_col(raw, "value_date")
        desc_col = self._find_col(raw, "description")
        ref_col = self._find_col(raw, "reference")
        debit_col = self._find_col(raw, "debit")
        credit_col = self._find_col(raw, "credit")
        amount_col = self._find_col(raw, "amount")
        type_col = self._find_col(raw, "txn_type")
        balance_col = self._find_col(raw, "balance")

        if date_col is None and raw.shape[1] >= 1:
            date_col = raw.columns[0]
        if desc_col is None and raw.shape[1] >= 3:
            desc_col = raw.columns[2]
        if ref_col is None:
            ref_col = desc_col

        if date_col is None or desc_col is None:
            raise LoanAppraisalServiceError(
                "Could not detect required statement columns (date/description).",
                400,
            )

        norm = pd.DataFrame()
        norm["txn_date"] = self._parse_date_series(raw[date_col])

        if value_date_col:
            norm["value_date"] = self._parse_date_series(raw[value_date_col])
        else:
            norm["value_date"] = norm["txn_date"]

        norm["description"] = raw[desc_col].fillna("").astype(str)
        norm["reference"] = raw[ref_col].fillna("").astype(str) if ref_col else norm["description"]

        if debit_col or credit_col:
            debit_series = raw[debit_col].apply(self._to_number) if debit_col else pd.Series(0.0, index=raw.index)
            credit_series = raw[credit_col].apply(self._to_number) if credit_col else pd.Series(0.0, index=raw.index)
            norm["debit"] = debit_series
            norm["credit"] = credit_series
        elif amount_col:
            amount_series = raw[amount_col].apply(self._to_number)
            if type_col:
                type_norm = raw[type_col].fillna("").astype(str).str.lower()
                is_debit = type_norm.str.contains("debit|dr|withdraw|paid out", regex=True)
                norm["debit"] = amount_series.where(is_debit, 0.0).abs()
                norm["credit"] = amount_series.where(~is_debit, 0.0).abs()
            else:
                norm["debit"] = amount_series.where(amount_series < 0, 0.0).abs()
                norm["credit"] = amount_series.where(amount_series >= 0, 0.0).abs()
        else:
            raise LoanAppraisalServiceError(
                "Could not detect debit/credit or amount columns in statement.",
                400,
            )

        if balance_col:
            norm["balance"] = raw[balance_col].apply(self._to_number)
        else:
            norm["balance"] = (norm["credit"] - norm["debit"]).cumsum()

        # Some statements expose debit/credit as flag columns (for example 1.0 / -)
        # and keep the real movement in the balance series. Reconstruct amounts from
        # balance deltas in that case so we do not confuse row markers with money.
        if balance_col and debit_col and credit_col:
            flag_style = self._column_looks_like_flag(raw[debit_col]) or self._column_looks_like_flag(raw[credit_col])
            if flag_style:
                balance_numeric = raw[balance_col].apply(self._to_number).fillna(method="ffill").fillna(0.0)
                balance_delta = balance_numeric.diff().fillna(0.0)
                derived_amount = balance_delta.abs().round(2)

                debit_mark = debit_series > 0
                credit_mark = credit_series > 0
                inferred_debit = debit_mark | (~credit_mark & (balance_delta < 0))
                inferred_credit = credit_mark | (~debit_mark & (balance_delta > 0))

                reconstructed_debit = pd.Series(0.0, index=raw.index)
                reconstructed_credit = pd.Series(0.0, index=raw.index)
                reconstructed_debit.loc[inferred_debit] = derived_amount.loc[inferred_debit]
                reconstructed_credit.loc[inferred_credit] = derived_amount.loc[inferred_credit]
                reconstructed_debit = pd.concat([reconstructed_debit, debit_series], axis=1).max(axis=1)
                reconstructed_credit = pd.concat([reconstructed_credit, credit_series], axis=1).max(axis=1)

                norm["debit"] = reconstructed_debit.clip(lower=0).round(2)
                norm["credit"] = reconstructed_credit.clip(lower=0).round(2)

        norm = norm[norm["txn_date"].notna()].copy()
        norm["txn_date"] = norm["txn_date"].dt.strftime("%d/%m/%Y")
        norm["value_date"] = norm["value_date"].dt.strftime("%d/%m/%Y")
        norm["debit"] = norm["debit"].round(2)
        norm["credit"] = norm["credit"].round(2)
        norm["balance"] = norm["balance"].round(2)

        if norm.empty:
            raise LoanAppraisalServiceError("No valid dated transactions found after normalization.", 400)

        return norm[["txn_date", "value_date", "description", "reference", "debit", "credit", "balance"]]

    def _loan_type_insights(self, loan_type: str, result: dict[str, Any]) -> list[str]:
        lt = loan_type.strip().lower()
        insights: list[str] = []

        loan_analysis = result.get("loan_analysis", {})
        cashflow = result.get("cashflow_analysis", {})
        income = result.get("income_analysis", {})

        if lt in {"home", "housing", "mortgage"}:
            if float(cashflow.get("net_savings_ratio", 0.0)) < 0.1:
                insights.append("Home-loan caution: low monthly surplus may stress long-tenure EMI commitments.")
            if int(income.get("salary_months_detected", 0)) < 6:
                insights.append("Home-loan caution: limited stable salary history observed for repayment confidence.")
        elif lt in {"personal", "consumer"}:
            if int(loan_analysis.get("digital_lending_count", 0)) >= 6:
                insights.append("Personal-loan caution: frequent short-term digital borrowing indicates liquidity pressure.")
        elif lt in {"business", "msme"}:
            if int(cashflow.get("negative_savings_months", 0)) >= 3:
                insights.append("Business-loan caution: recurring negative monthly cashflow can impact working-capital servicing.")
        elif lt in {"education", "student"}:
            if int(income.get("salary_months_detected", 0)) == 0:
                insights.append("Education-loan note: primary repayment may depend on co-applicant stability.")

        if not insights:
            insights.append("Loan-type profile appears broadly aligned; rely on category scores and rule hits for final underwriting.")

        return insights

    def _ensure_repo_import_paths(self) -> None:
        repo_path = str(self.repo_root)
        model_path = str(self.model_dir)
        if repo_path not in sys.path:
            sys.path.insert(0, repo_path)
        if model_path not in sys.path:
            sys.path.insert(0, model_path)

    def _restrict_to_recent_one_year(self, normalized: pd.DataFrame) -> tuple[pd.DataFrame, dict[str, str]]:
        parsed = normalized.copy()
        parsed["txn_date_dt"] = pd.to_datetime(parsed["txn_date"], format="%d/%m/%Y", errors="coerce")
        parsed = parsed[parsed["txn_date_dt"].notna()].copy()
        if parsed.empty:
            raise LoanAppraisalServiceError("No valid transactions after date parsing", 400)

        end_dt = parsed["txn_date_dt"].max()
        start_dt = end_dt - timedelta(days=365)
        filtered = parsed[parsed["txn_date_dt"] >= start_dt].copy()

        if filtered.empty:
            raise LoanAppraisalServiceError("No transactions available in the latest 1-year window", 400)

        filtered = filtered.drop(columns=["txn_date_dt"]) 
        return filtered, {
            "period_start": start_dt.strftime("%Y-%m-%d"),
            "period_end": end_dt.strftime("%Y-%m-%d"),
        }

    def _build_monthly_balance_table(self, normalized: pd.DataFrame) -> list[dict[str, Any]]:
        df = normalized.copy()
        df["txn_date_dt"] = pd.to_datetime(df["txn_date"], format="%d/%m/%Y", errors="coerce")
        df = df[df["txn_date_dt"].notna()].copy()
        if df.empty:
            return []

        df["debit"] = pd.to_numeric(df["debit"], errors="coerce").fillna(0.0)
        df["credit"] = pd.to_numeric(df["credit"], errors="coerce").fillna(0.0)
        df["balance"] = pd.to_numeric(df["balance"], errors="coerce").fillna(0.0)
        df["month"] = df["txn_date_dt"].dt.to_period("M").astype(str)

        monthly = df.sort_values("txn_date_dt").groupby("month", as_index=False).agg(
            credit=("credit", "sum"),
            debit=("debit", "sum"),
            opening_balance=("balance", "first"),
            closing_balance=("balance", "last"),
        )
        monthly["savings"] = monthly["credit"] - monthly["debit"]
        monthly["month_index"] = range(1, len(monthly) + 1)
        return [
            {
                "month_index": int(row["month_index"]),
                "month": str(row["month"]),
                "credit": round(float(row["credit"]), 2),
                "debit": round(float(row["debit"]), 2),
                "savings": round(float(row["savings"]), 2),
                "opening_balance": round(float(row["opening_balance"]), 2),
                "balance_remaining": round(float(row["closing_balance"]), 2),
            }
            for _, row in monthly.iterrows()
        ]

    def _summarize_rule_insights(self, result: dict[str, Any]) -> list[str]:
        rules = result.get("rule_evaluations") or []
        if not isinstance(rules, list) or not rules:
            return ["No explicit rule hit was triggered in the current 1-year history."]

        sorted_rules = sorted(
            [r for r in rules if isinstance(r, dict)],
            key=lambda r: abs(float(r.get("impact", 0.0))),
            reverse=True,
        )
        insights: list[str] = []
        for r in sorted_rules[:5]:
            rid = str(r.get("rule_id", "UNKNOWN"))
            impact = float(r.get("impact", 0.0))
            reason = str(r.get("reason", "")).strip()
            category = str(r.get("category", "")).strip()
            impact_tag = "negative" if impact < 0 else "positive"
            insights.append(
                f"{rid} ({category}) has {impact_tag} impact {impact:.4f}. {reason}".strip()
            )
        return insights

    def _safe_float(self, value: Any, default: float = 0.0) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return default

    def _build_validated_appraisal(
        self,
        loan_type: str,
        normalized: pd.DataFrame,
        result: dict[str, Any],
    ) -> dict[str, Any]:
        issues: list[str] = []
        corrections: list[str] = []

        work = result.copy()
        income_analysis = dict(work.get("income_analysis", {}))
        cashflow_analysis = dict(work.get("cashflow_analysis", {}))
        loan_analysis = dict(work.get("loan_analysis", {}))
        behavioral_flags = list(work.get("behavioral_flags", []))
        rules = [r for r in work.get("rule_evaluations", []) if isinstance(r, dict)]
        trained = dict(work.get("trained_model", {}))

        df = normalized.copy()
        df["txn_date_dt"] = pd.to_datetime(df["txn_date"], format="%d/%m/%Y", errors="coerce")
        df = df[df["txn_date_dt"].notna()].copy()
        df["debit"] = pd.to_numeric(df["debit"], errors="coerce").fillna(0.0)
        df["credit"] = pd.to_numeric(df["credit"], errors="coerce").fillna(0.0)
        df["balance"] = pd.to_numeric(df["balance"], errors="coerce").fillna(0.0)
        df["desc_l"] = df["description"].fillna("").astype(str).str.lower()
        unique_days = int(df["txn_date_dt"].dt.normalize().nunique())
        month_count = max(1, int(df["txn_date_dt"].dt.to_period("M").nunique()))

        # 1) Data consistency checks and corrections.
        salary_months = int(income_analysis.get("salary_months_detected", 0) or 0)
        salary_rule_hits = [
            r
            for r in rules
            if "salary" in str(r.get("category", "")).lower()
            or str(r.get("rule_id", "")).upper().startswith("R000")
        ]
        if salary_months <= 0 and salary_rule_hits:
            issues.append("Salary rules triggered while salary_months_detected is zero")
            rules = [r for r in rules if r not in salary_rule_hits]
            corrections.append("Removed salary-linked rule hits due to missing salary evidence")

        reported_low_balance_days = int(cashflow_analysis.get("low_balance_days", 0) or 0)
        if reported_low_balance_days > unique_days:
            issues.append("low_balance_days exceeded unique transaction days")
            reported_low_balance_days = unique_days
            corrections.append("Capped low_balance_days to unique active days")

        total_inflow = self._safe_float(cashflow_analysis.get("total_inflow", 0.0))
        total_outflow = self._safe_float(cashflow_analysis.get("total_outflow", 0.0))
        expected_savings = ((total_inflow - total_outflow) / total_inflow) if total_inflow > 0 else -1.0
        reported_savings = self._safe_float(cashflow_analysis.get("net_savings_ratio", 0.0))
        if abs(expected_savings - reported_savings) > 0.01:
            issues.append("net_savings_ratio inconsistent with inflow/outflow")
            corrections.append("Recomputed net_savings_ratio from inflow and outflow")
        corrected_savings_ratio = round(expected_savings, 4)

        # 2) Income intelligence enhancement.
        salary_like = df[(df["credit"] > 0) & df["desc_l"].str.contains("salary|payroll|stipend", regex=True)]
        freelance_like = df[(df["credit"] > 0) & df["desc_l"].str.contains("freelance|consult|invoice|client", regex=True)]
        business_like = df[(df["credit"] > 0) & df["desc_l"].str.contains("merchant|settlement|sales|business", regex=True)]
        imps_neft_like = df[(df["credit"] > 0) & df["desc_l"].str.contains("neft|imps|rtgs", regex=True)]

        if salary_months <= 0:
            if len(freelance_like) >= 6:
                income_profile = "Freelancer"
            elif len(business_like) >= 6:
                income_profile = "Business income"
            elif len(imps_neft_like) >= 12 and df["credit"].sum() > 0:
                income_profile = "Student"
            else:
                income_profile = "Unemployed"
        else:
            income_profile = "Salaried"

        monthly_income = df.groupby(df["txn_date_dt"].dt.to_period("M"))["credit"].sum()
        income_cv = float(monthly_income.std(ddof=0) / monthly_income.mean()) if float(monthly_income.mean()) > 0 else 1.0
        income_trend = 0.0
        if len(monthly_income) >= 4:
            early = float(monthly_income.head(2).mean())
            late = float(monthly_income.tail(2).mean())
            if early > 0:
                income_trend = (late - early) / early

        enhanced_income = {
            "income_profile": income_profile,
            "salary_months_detected": salary_months,
            "monthly_income_mean": round(float(monthly_income.mean()), 2),
            "income_variability_ratio": round(income_cv, 4),
            "income_trend_pct": round(income_trend, 4),
            "salary_or_salary_like_txn_count": int(len(salary_like)),
            "nonsalary_regular_credit_txn_count": int(len(imps_neft_like)),
        }

        # 3) Expense intelligence.
        debit = df[df["debit"] > 0].copy()

        def _cat_sum(pattern: str) -> float:
            return float(debit[debit["desc_l"].str.contains(pattern, regex=True)]["debit"].sum())

        expense_breakdown = {
            "rent_housing": round(_cat_sum("rent|housing|landlord"), 2),
            "food_groceries": round(_cat_sum("swiggy|zomato|grocery|mart|supermarket|dmart|bigbasket"), 2),
            "travel_fuel": round(_cat_sum("uber|ola|fuel|petrol|diesel|irctc|metro|bus|travel"), 2),
            "bills": round(_cat_sum("electric|water|gas|recharge|broadband|jio|airtel|bill|insurance"), 2),
            "lifestyle_discretionary": round(_cat_sum("amazon|flipkart|myntra|movie|shopping|restaurant|liquor|bar|casino"), 2),
        }
        essential = expense_breakdown["rent_housing"] + expense_breakdown["food_groceries"] + expense_breakdown["travel_fuel"] + expense_breakdown["bills"]
        discretionary = expense_breakdown["lifestyle_discretionary"]
        expense_to_income = (total_outflow / total_inflow) if total_inflow > 0 else 99.0
        enhanced_expense = {
            "expense_breakdown": expense_breakdown,
            "expense_to_income_ratio": round(expense_to_income, 4),
            "essential_to_nonessential_ratio": round((essential / discretionary), 4) if discretionary > 0 else None,
            "overspending_pattern": bool(expense_to_income > 0.95),
        }

        # 4) Liability enhancement.
        emi_hits = debit[debit["desc_l"].str.contains("emi|loan|nach|ecs|ach|autopay|credit card", regex=True)]
        bnpl_hits = debit[debit["desc_l"].str.contains("slice|lazypay|kreditbee|simpl|pay later|bnpl|postpaid", regex=True)]
        hidden_liability_score = int(len(emi_hits) + len(bnpl_hits))
        monthly_liability = float(emi_hits.groupby(emi_hits["txn_date_dt"].dt.to_period("M"))["debit"].sum().mean()) if not emi_hits.empty else 0.0
        monthly_income_mean = float(monthly_income.mean()) if float(monthly_income.mean()) > 0 else 0.0
        debt_to_income = (monthly_liability / monthly_income_mean) if monthly_income_mean > 0 else 0.0
        enhanced_liability = {
            "emi_pattern_count": int(len(emi_hits)),
            "bnpl_pattern_count": int(len(bnpl_hits)),
            "estimated_monthly_liability": round(monthly_liability, 2),
            "debt_to_income_ratio": round(debt_to_income, 4),
            "hidden_liability_signal": hidden_liability_score,
        }

        # 5) Cashflow correction and stress checks.
        low_balance_threshold = max(5000.0, monthly_income_mean * 0.2) if monthly_income_mean > 0 else 5000.0
        daily_min_balance = df.groupby(df["txn_date_dt"].dt.normalize())["balance"].min()
        corrected_low_days = int((daily_min_balance < low_balance_threshold).sum())
        month_end_daily = df[df["txn_date_dt"].dt.day >= 25].groupby(df[df["txn_date_dt"].dt.day >= 25]["txn_date_dt"].dt.normalize())["balance"].min()
        corrected_month_end = int((month_end_daily < low_balance_threshold).sum())

        if corrected_low_days != reported_low_balance_days:
            issues.append("low_balance_days did not match recomputed unique-day liquidity stress")
            corrections.append("Recomputed low_balance_days from daily minimum balances")

        corrected_cashflow = {
            "total_inflow": round(total_inflow, 2),
            "total_outflow": round(total_outflow, 2),
            "net_savings_ratio": corrected_savings_ratio,
            "low_balance_days": corrected_low_days,
            "month_end_stress_count": corrected_month_end,
            "unique_active_days": unique_days,
            "liquidity_stress_ratio": round((corrected_low_days / max(unique_days, 1)), 4),
        }

        # 6) Behavioral intelligence expansion.
        if corrected_savings_ratio < 0.05:
            behavioral_flags.append("Low savings ratio below 5%")
        if income_cv > 0.6:
            behavioral_flags.append("Irregular income volatility observed")
        if corrected_low_days > unique_days * 0.35:
            behavioral_flags.append("Frequent low-balance pattern indicates financial stress")
        if enhanced_expense["overspending_pattern"]:
            behavioral_flags.append("Expense-to-income ratio indicates overspending pressure")
        behavioral_flags = list(dict.fromkeys(behavioral_flags))

        # 7) Rule validation and top risk drivers.
        corrected_rules = [dict(r) for r in rules]
        derived_rules: list[dict[str, Any]] = []
        if corrected_savings_ratio < 0.05:
            derived_rules.append(
                {
                    "rule_id": "DERIVED_LOW_SAVINGS",
                    "impact": -0.1,
                    "reason": "Net savings ratio below 5% indicates weak repayment buffer",
                    "category": "cashflow_discipline",
                }
            )
            corrections.append("Added derived low-savings risk rule")
        if corrected_low_days > unique_days * 0.35:
            derived_rules.append(
                {
                    "rule_id": "DERIVED_LIQUIDITY_STRESS",
                    "impact": -0.08,
                    "reason": "Frequent low-balance days suggest recurring liquidity stress",
                    "category": "cashflow_stress",
                }
            )
            corrections.append("Added derived liquidity-stress rule")
        corrected_rules.extend(derived_rules)

        sorted_risk_rules = sorted(corrected_rules, key=lambda r: abs(self._safe_float(r.get("impact", 0.0))), reverse=True)
        top_risk_drivers = [
            f"{r.get('rule_id')} impact={self._safe_float(r.get('impact', 0.0)):.4f} reason={str(r.get('reason', ''))}"
            for r in sorted_risk_rules[:5]
        ]

        # 8) ML + rule score alignment.
        prob_safe = self._safe_float(trained.get("probability_safe", 0.5), 0.5)
        prob_risky = self._safe_float(trained.get("probability_risky", 1.0 - prob_safe), 1.0 - prob_safe)
        ml_score = prob_safe * 100.0
        rule_score = self._safe_float(trained.get("rule_score", work.get("final_score", 50.0)), 50.0)

        if prob_risky > 0.80:
            final_score = round(min(49.0, (0.6 * rule_score) + (0.4 * ml_score)), 2)
            risk_level = "High Risk"
            recommendation = "Reject"
            corrections.append("Applied hard override: probability_risky > 0.80 => High Risk/Reject")
        else:
            final_score = round((0.6 * rule_score) + (0.4 * ml_score), 2)
            if (corrected_savings_ratio < 0.05) or (income_profile in {"Unemployed"} and monthly_income_mean <= 0):
                risk_level = "High Risk"
            elif final_score < 70:
                risk_level = "Moderate Risk"
            else:
                risk_level = "Low Risk"

            if risk_level == "High Risk":
                recommendation = "Reject"
            elif risk_level == "Moderate Risk":
                recommendation = "Approve with caution"
            else:
                recommendation = "Approve"

        # 9) Corrected summary and confidence.
        confidence_score = max(45.0, min(98.0, round(max(prob_safe, prob_risky) * 100.0 - (len(issues) * 3.0), 2)))
        corrected_summary = (
            f"Validated 1-year appraisal for {loan_type}. Final score {final_score:.2f} ({risk_level}). "
            f"ML risky probability={prob_risky:.4f}, rule base score={rule_score:.2f}, savings ratio={corrected_savings_ratio:.4f}. "
            f"Recommendation: {recommendation}."
        )

        return {
            "corrected_summary": corrected_summary,
            "final_score": final_score,
            "risk_level": risk_level,
            "recommendation": recommendation,
            "confidence_score": confidence_score,
            "validation_issues_detected": issues,
            "corrections_applied": corrections,
            "enhanced_income_analysis": enhanced_income,
            "enhanced_expense_analysis": enhanced_expense,
            "enhanced_liability_analysis": enhanced_liability,
            "corrected_cashflow_analysis": corrected_cashflow,
            "behavioral_flags": behavioral_flags,
            "corrected_rule_evaluations": corrected_rules,
            "top_risk_drivers": top_risk_drivers,
            "trained_model_output": trained,
        }

    def _get_bedrock_client(self) -> Any | None:
        if self._bedrock_client is not None:
            return self._bedrock_client

        try:
            self._ensure_repo_import_paths()
            bedrock_module = importlib.import_module("ai_agent.bedrock.client")
            BedrockClient = getattr(bedrock_module, "BedrockClient")
            self._bedrock_client = BedrockClient()
        except Exception:
            self._bedrock_client = None
        return self._bedrock_client

    def _build_professional_report_context(
        self,
        loan_type: str,
        loan_amount: float | None,
        result: dict[str, Any],
        rows_analyzed: int,
        period_meta: dict[str, str],
    ) -> dict[str, Any]:
        validated = result.get("validated_appraisal", {})
        return {
            "loan_type": loan_type,
            "analysis_period": period_meta,
            "monthly_balance_table": result.get("monthly_balance_table", []),
            "rows_analyzed": rows_analyzed,
            "requested_loan_amount": loan_amount,
            "final_score": result.get("final_score"),
            "risk_level": result.get("risk_level"),
            "recommendation": result.get("recommendation"),
            "confidence_score": result.get("confidence_score"),
            "category_scores": result.get("category_scores", {}),
            "income_analysis": result.get("income_analysis", {}),
            "cashflow_analysis": result.get("cashflow_analysis", {}),
            "loan_analysis": result.get("loan_analysis", {}),
            "red_flags": result.get("red_flags", []),
            "behavioral_flags": result.get("behavioral_flags", []),
            "top_rule_insights": self._summarize_rule_insights(result),
            "validated_appraisal": validated,
        }

    def _compute_loan_amount_analysis(self, loan_amount: float | None, result: dict[str, Any]) -> dict[str, Any]:
        validated = result.get("validated_appraisal", {})
        income = validated.get("enhanced_income_analysis", {})
        cash = validated.get("corrected_cashflow_analysis", {})
        top_income = result.get("income_analysis", {})
        top_cash = result.get("cashflow_analysis", {})

        salary_mean = self._safe_float(top_income.get("salary_mean", 0.0), 0.0)
        total_inflow = self._safe_float(top_cash.get("total_inflow", 0.0), 0.0)
        inflow_monthly = (total_inflow / 12.0) if total_inflow > 0 else 0.0
        monthly_income = max(salary_mean, inflow_monthly, self._safe_float(income.get("monthly_income_mean", 0.0), 0.0))
        savings_ratio = self._safe_float(cash.get("net_savings_ratio", 0.0), 0.0)
        amount = self._safe_float(loan_amount, 0.0)

        if amount <= 0:
            return {
                "requested_loan_amount": loan_amount,
                "assumption": "Loan amount not provided; affordability simulation skipped.",
                "tenure_scenarios": [],
                "selected_tenure_months": None,
                "estimated_monthly_emi": None,
                "emi_to_income_ratio": None,
                "post_emi_savings_ratio": None,
                "affordability": "RISKY_BUT_MANAGEABLE",
                "interpretation": "Provide loan_amount to perform full EMI affordability diagnostics.",
            }

        scenarios: list[dict[str, Any]] = []
        for tenure in (12, 24, 36):
            emi = amount / tenure
            emi_ratio = (emi / monthly_income) if monthly_income > 0 else 99.0
            post_emi_savings_ratio = savings_ratio - (emi / monthly_income) if monthly_income > 0 else -99.0
            scenarios.append(
                {
                    "tenure_months": tenure,
                    "estimated_monthly_emi": round(emi, 2),
                    "emi_to_income_ratio": round(emi_ratio, 4),
                    "post_emi_savings_ratio": round(post_emi_savings_ratio, 4),
                }
            )

        selected = next((s for s in scenarios if s["tenure_months"] == 24), scenarios[0])
        emi_ratio = self._safe_float(selected.get("emi_to_income_ratio", 99.0), 99.0)
        post_emi_savings = self._safe_float(selected.get("post_emi_savings_ratio", -99.0), -99.0)

        if monthly_income <= 0:
            affordability = "NOT_AFFORDABLE"
            interpretation = "Estimated EMI burden is not serviceable from observed monthly cash generation."
        elif amount <= 50000 and emi_ratio < 0.10:
            affordability = "AFFORDABLE"
            interpretation = "Micro-loan EMI burden is low versus monthly income and is generally serviceable."
        elif amount <= 50000 and emi_ratio <= 0.30:
            affordability = "RISKY_BUT_MANAGEABLE"
            interpretation = "Micro-loan EMI is manageable but requires discipline given buffer constraints."
        elif amount <= 50000 and emi_ratio > 0.30:
            affordability = "NOT_AFFORDABLE"
            interpretation = "Micro-loan EMI burden is high relative to monthly income for this profile."
        elif (emi_ratio > 0.5) or (post_emi_savings < 0.0):
            affordability = "NOT_AFFORDABLE"
            interpretation = "Estimated EMI burden is not serviceable from observed monthly cash generation."
        elif (emi_ratio > 0.35) or (post_emi_savings < 0.05):
            affordability = "RISKY_BUT_MANAGEABLE"
            interpretation = "Loan appears serviceable only under tight discipline; repayment stress risk remains elevated."
        else:
            affordability = "AFFORDABLE"
            interpretation = "Estimated EMI is within sustainable bounds against observed monthly income and savings buffer."

        return {
            "requested_loan_amount": round(amount, 2),
            "assumption": "EMI approximated as loan_amount/tenure across 12, 24, and 36 months.",
            "tenure_scenarios": scenarios,
            "selected_tenure_months": int(selected["tenure_months"]),
            "estimated_monthly_emi": selected["estimated_monthly_emi"],
            "emi_to_income_ratio": selected["emi_to_income_ratio"],
            "post_emi_savings_ratio": selected["post_emi_savings_ratio"],
            "affordability": affordability,
            "interpretation": interpretation,
        }

    def _extract_notable_transactions(self, normalized: pd.DataFrame) -> list[dict[str, Any]]:
        df = normalized.copy()
        df["txn_date_dt"] = pd.to_datetime(df["txn_date"], format="%d/%m/%Y", errors="coerce")
        df = df[df["txn_date_dt"].notna()].copy()
        if df.empty:
            return []

        df["debit"] = pd.to_numeric(df["debit"], errors="coerce").fillna(0.0)
        df["credit"] = pd.to_numeric(df["credit"], errors="coerce").fillna(0.0)
        df["balance"] = pd.to_numeric(df["balance"], errors="coerce").fillna(0.0)
        df["desc_l"] = df["description"].fillna("").astype(str).str.lower()

        notable: list[dict[str, Any]] = []

        top_debits = df[df["debit"] > 0].nlargest(3, "debit")
        for _, row in top_debits.iterrows():
            notable.append(
                {
                    "date": row["txn_date_dt"].strftime("%Y-%m-%d"),
                    "type": "large_debit",
                    "amount": round(float(row["debit"]), 2),
                    "description": str(row["description"])[:140],
                    "reason": "High-value outflow transaction",
                }
            )

        low_balance_rows = df.nsmallest(2, "balance")
        for _, row in low_balance_rows.iterrows():
            notable.append(
                {
                    "date": row["txn_date_dt"].strftime("%Y-%m-%d"),
                    "type": "low_balance_event",
                    "amount": round(float(row["balance"]), 2),
                    "description": str(row["description"])[:140],
                    "reason": "Very low running balance indicates liquidity stress",
                }
            )

        stress_rows = df[
            (df["debit"] > 0)
            & (df["desc_l"].str.contains("loan|emi|nach|ecs|ach|credit card|bnpl|pay later", regex=True))
        ].nlargest(2, "debit")
        for _, row in stress_rows.iterrows():
            notable.append(
                {
                    "date": row["txn_date_dt"].strftime("%Y-%m-%d"),
                    "type": "liability_pattern",
                    "amount": round(float(row["debit"]), 2),
                    "description": str(row["description"])[:140],
                    "reason": "Potential liability or debt-servicing marker",
                }
            )

        dedup: list[dict[str, Any]] = []
        seen: set[tuple[str, str, float]] = set()
        for item in notable:
            key = (str(item.get("date", "")), str(item.get("type", "")), float(item.get("amount", 0.0)))
            if key in seen:
                continue
            seen.add(key)
            dedup.append(item)
        return dedup[:8]

    def _build_plain_text_underwriting(
        self,
        result: dict[str, Any],
        loan_amount_analysis: dict[str, Any],
        notable_transactions: list[dict[str, Any]],
        final_risk_level: str | None = None,
        final_recommendation: str | None = None,
        final_justification: str | None = None,
    ) -> str:
        validated = result.get("validated_appraisal", {})
        trained = validated.get("trained_model_output", result.get("trained_model", {}))
        income = validated.get("enhanced_income_analysis", {})
        cash = validated.get("corrected_cashflow_analysis", {})
        liabilities = validated.get("enhanced_liability_analysis", {})

        prob_risky = self._safe_float(trained.get("probability_risky", 0.0), 0.0)
        final_score = self._safe_float(validated.get("final_score", result.get("final_score", 50.0)), 50.0)
        risk_level = str(final_risk_level or result.get("risk_level") or validated.get("risk_level", "Moderate Risk"))
        recommendation = str(
            final_recommendation or result.get("recommendation") or validated.get("recommendation", "Approve with caution")
        )

        lines = [
            f"Underwriting conclusion: {risk_level} with recommendation '{recommendation}'.",
            f"Risk is driven by final score {final_score:.2f} and model risky probability {prob_risky:.4f}.",
            f"Decision rationale: {str(final_justification or validated.get('corrected_summary', 'Final decision based on affordability and risk signals.'))}",
            (
                "Transaction behaviour shows "
                f"income profile '{income.get('income_profile', 'Unknown')}', "
                f"net savings ratio {self._safe_float(cash.get('net_savings_ratio', 0.0), 0.0):.4f}, "
                f"and liquidity stress on {int(cash.get('low_balance_days', 0) or 0)} out of "
                f"{int(cash.get('unique_active_days', 0) or 0)} active days."
            ),
            (
                "Liability posture indicates "
                f"estimated debt-to-income ratio {self._safe_float(liabilities.get('debt_to_income_ratio', 0.0), 0.0):.4f} "
                f"with hidden liability signal {int(liabilities.get('hidden_liability_signal', 0) or 0)}."
            ),
            (
                "Loan amount assessment: "
                f"requested amount {loan_amount_analysis.get('requested_loan_amount')} is "
                f"classified as {loan_amount_analysis.get('affordability', 'RISKY_BUT_MANAGEABLE')} based on EMI stress simulation."
            ),
        ]

        if notable_transactions:
            lines.append("Noticeable transactions:")
            for t in notable_transactions[:6]:
                lines.append(
                    f"- {t.get('date')} | {t.get('type')} | amount={t.get('amount')} | {t.get('description')} | {t.get('reason')}"
                )

        return "\n".join(lines)

    def _compute_realistic_underwriting_policy(
        self,
        result: dict[str, Any],
        loan_amount: float | None,
    ) -> dict[str, str]:
        """Affordability-first policy with filtered behavioral rule influence."""
        amount = self._safe_float(loan_amount, 0.0)
        validated = result.get("validated_appraisal", {})
        income_analysis = result.get("income_analysis", {})
        cash = result.get("cashflow_analysis", {})
        trained = validated.get("trained_model_output", result.get("trained_model", {}))

        total_inflow = self._safe_float(cash.get("total_inflow", 0.0), 0.0)
        total_outflow = self._safe_float(cash.get("total_outflow", 0.0), 0.0)
        salary_mean = self._safe_float(income_analysis.get("salary_mean", 0.0), 0.0)
        monthly_income = max(salary_mean, (total_inflow / 12.0) if total_inflow > 0 else 0.0)
        monthly_expenses = (total_outflow / 12.0) if total_outflow > 0 else 0.0

        emi = amount / 24.0 if amount > 0 else 0.0
        emi_to_income = (emi / monthly_income) if monthly_income > 0 else 99.0
        surplus = monthly_income - monthly_expenses

        text_blob = " ".join(
            [
                str(result.get("summary", "")),
                " ".join([str(x) for x in result.get("red_flags", [])]),
                " ".join([str(x) for x in result.get("behavioral_flags", [])]),
            ]
        ).lower()
        severe_tokens = (
            "fraud",
            "gambling",
            "chargeback",
            "bounced cheque",
            "repeat default",
            "repeated default",
            "wilful default",
            "written off",
            "write-off",
        )
        severe_pattern = any(tok in text_blob for tok in severe_tokens)

        rules = validated.get("corrected_rule_evaluations", result.get("rule_evaluations", []))
        low_priority_tokens = (
            "low savings",
            "liquidity",
            "salary variance",
            "salary",
            "low-balance",
            "low balance",
        )
        behavioral_penalty = 0.0
        for r in rules if isinstance(rules, list) else []:
            if not isinstance(r, dict):
                continue
            impact = self._safe_float(r.get("impact", 0.0), 0.0)
            if impact >= 0:
                continue
            reason = str(r.get("reason", "")).lower()
            rid = str(r.get("rule_id", "")).lower()
            joined = f"{rid} {reason}"
            if any(tok in joined for tok in low_priority_tokens):
                impact = max(impact, -0.05)
            behavioral_penalty += abs(impact)
        behavioral_penalty = min(1.0, behavioral_penalty)

        if monthly_income <= 0:
            affordability_score = 0.0
        elif emi_to_income < 0.10:
            affordability_score = 1.0
        elif emi_to_income <= 0.30:
            affordability_score = 0.75
        elif emi_to_income <= 0.50:
            affordability_score = 0.45
        else:
            affordability_score = 0.10
        if surplus < 0:
            affordability_score = max(0.0, affordability_score - 0.25)

        behavior_score = 1.0 - behavioral_penalty
        weighted_score = (0.70 * affordability_score) + (0.30 * behavior_score)

        if amount <= 50000:
            bucket = "micro"
        elif amount <= 200000:
            bucket = "small"
        elif amount <= 1000000:
            bucket = "medium"
        else:
            bucket = "large"

        if total_inflow <= 0 or monthly_income <= 0:
            decision = "REJECT"
            recommendation = "Reject"
            risk_level = "High Risk"
            confidence = "HIGH"
            reason = "Rejected due to no observable inflow capacity to service EMI."
        elif severe_pattern:
            decision = "REJECT"
            recommendation = "Reject"
            risk_level = "High Risk"
            confidence = "HIGH"
            reason = "Rejected due to severe behavioral risk patterns (fraud/gambling/default markers)."
        elif bucket == "micro":
            if emi_to_income < 0.10:
                decision = "APPROVE"
                recommendation = "Approve"
                risk_level = "Low Risk"
                confidence = "MEDIUM"
            elif emi_to_income <= 0.30:
                decision = "APPROVE_WITH_CAUTION"
                recommendation = "Approve with caution"
                risk_level = "Moderate Risk"
                confidence = "MEDIUM"
            else:
                decision = "REJECT"
                recommendation = "Reject"
                risk_level = "High Risk"
                confidence = "HIGH"
            reason = (
                "Micro-loan decision driven primarily by EMI affordability; "
                "low-savings/liquidity rules treated as supporting signals."
            )
        else:
            if (emi_to_income > 0.50) or (surplus < 0 and amount > 0):
                decision = "REJECT"
                recommendation = "Reject"
                risk_level = "High Risk"
                confidence = "HIGH"
            elif weighted_score >= 0.65:
                decision = "APPROVE"
                recommendation = "Approve"
                risk_level = "Low Risk"
                confidence = "MEDIUM"
            elif weighted_score >= 0.45:
                decision = "APPROVE_WITH_CAUTION"
                recommendation = "Approve with caution"
                risk_level = "Moderate Risk"
                confidence = "MEDIUM"
            else:
                decision = "REJECT"
                recommendation = "Reject"
                risk_level = "High Risk"
                confidence = "MEDIUM"
            reason = "Decision balances 70% affordability and 30% filtered behavioral-rule influence."

        prob_risky = self._safe_float(trained.get("probability_risky", 0.0), 0.0)
        justification = (
            f"{reason} EMI-to-income={emi_to_income:.4f}, monthly_income={monthly_income:.2f}, "
            f"monthly_expenses={monthly_expenses:.2f}, surplus={surplus:.2f}, loan_bucket={bucket}, "
            f"weighted_score={weighted_score:.4f}, behavioral_penalty={behavioral_penalty:.4f}, "
            f"model_probability_risky={prob_risky:.4f}."
        )

        return {
            "decision": decision,
            "recommendation": recommendation,
            "risk_level": risk_level,
            "confidence": confidence,
            "justification": justification,
        }

    def _normalize_professional_report(
        self,
        report: dict[str, Any],
        result: dict[str, Any],
        loan_amount: float | None,
        notable_transactions: list[dict[str, Any]],
    ) -> dict[str, Any]:
        validated = result.get("validated_appraisal", {})
        trained = validated.get("trained_model_output", result.get("trained_model", {}))
        prob_safe = self._safe_float(trained.get("probability_safe", 0.5), 0.5)
        prob_risky = self._safe_float(trained.get("probability_risky", 1.0 - prob_safe), 1.0 - prob_safe)
        final_score = self._safe_float(validated.get("final_score", result.get("final_score", 50.0)), 50.0)
        risk_level = str(validated.get("risk_level", result.get("risk_level", "Moderate Risk")))
        recommendation = str(validated.get("recommendation", result.get("recommendation", "Approve with caution")))
        corrected_cash = validated.get("corrected_cashflow_analysis", {})
        affordability = self._compute_loan_amount_analysis(loan_amount, result)
        policy = self._compute_realistic_underwriting_policy(result, loan_amount)

        llm_final = report.get("final_underwriting_view", {})
        llm_decision = str(llm_final.get("decision", "")).strip().upper().replace(" ", "_")
        llm_confidence = str(llm_final.get("confidence", "")).strip().upper()
        llm_justification = str(
            llm_final.get("justification", llm_final.get("rationale", ""))
        ).strip()

        valid_decisions = {"APPROVE", "APPROVE_WITH_CAUTION", "REJECT"}
        loan_amount_analysis = self._compute_loan_amount_analysis(loan_amount, result)
        micro_overrides = {"AFFORDABLE", "RISKY_BUT_MANAGEABLE"}
        use_policy_override = self._safe_float(loan_amount, 0.0) > 0 and self._safe_float(loan_amount, 0.0) <= 50000 and str(loan_amount_analysis.get("affordability", "NOT_AFFORDABLE")) in micro_overrides
        if use_policy_override:
            cashflow_state = result.get("cashflow_analysis", {})
            savings_ratio = self._safe_float(cashflow_state.get("net_savings_ratio", 0.0), 0.0)
            low_balance_days = int(cashflow_state.get("low_balance_days", 0) or 0)
            active_days = max(1, int(cashflow_state.get("unique_active_days", 0) or 0))
            if str(loan_amount_analysis.get("affordability", "NOT_AFFORDABLE")) == "AFFORDABLE" and savings_ratio >= 0.10 and low_balance_days <= int(active_days * 0.2):
                decision = "APPROVE"
                confidence = "HIGH"
                final_justification = "Micro-loan affordability is strong with adequate savings buffer and limited liquidity stress."
            else:
                decision = "APPROVE_WITH_CAUTION"
                confidence = "MEDIUM"
                final_justification = "Micro-loan affordability is acceptable, but liquidity stress and weak savings warrant caution."
        elif llm_decision in valid_decisions:
            decision = llm_decision
            confidence = llm_confidence if llm_confidence in {"HIGH", "MEDIUM", "LOW"} else policy["confidence"]
            final_justification = llm_justification or policy["justification"]
        else:
            decision = policy["decision"]
            confidence = policy["confidence"]
            final_justification = policy["justification"]

        if decision == "APPROVE":
            recommendation = "Approve"
            risk_level = "Low Risk"
        elif decision == "APPROVE_WITH_CAUTION":
            recommendation = "Approve with caution"
            risk_level = "Moderate Risk"
        else:
            recommendation = "Reject"
            risk_level = "High Risk"

        normalized = {
            "source": str(report.get("source", "bedrock")),
            "executive_summary": str(report.get("executive_summary", "")) or str(validated.get("corrected_summary", "")),
            "income_diagnostics": report.get("income_diagnostics", validated.get("enhanced_income_analysis", {})),
            "cashflow_diagnostics": report.get("cashflow_diagnostics", corrected_cash),
            "liability_diagnostics": report.get("liability_diagnostics", validated.get("enhanced_liability_analysis", {})),
            "loan_amount_analysis": report.get("loan_amount_analysis", affordability),
            "risk_justification": report.get("risk_justification", []),
            "score_explanation": report.get(
                "score_explanation",
                {
                    "final_score": round(final_score, 2),
                    "ml_probability_safe": round(prob_safe, 4),
                    "ml_probability_risky": round(prob_risky, 4),
                    "narrative": "Final score aligns model probability, corrected rules, and behavioral diagnostics.",
                },
            ),
            "rulebook_insights": report.get("rulebook_insights", result.get("rulebook_top_insights", [])),
            "key_risks": report.get("key_risks", validated.get("behavioral_flags", [])),
            "mitigations": report.get("mitigations", []),
            "final_underwriting_view": report.get("final_underwriting_view", {}),
            "notable_transactions": notable_transactions,
        }

        normalized["final_underwriting_view"] = {
            "decision": decision,
            "justification": str(final_justification),
            "confidence": confidence,
        }

        normalized["plain_text_report"] = self._build_plain_text_underwriting(
            result=result,
            loan_amount_analysis=normalized["loan_amount_analysis"],
            notable_transactions=notable_transactions,
            final_risk_level=risk_level,
            final_recommendation=recommendation,
            final_justification=str(final_justification),
        )

        # Keep validated and top-level result decisions synchronized.
        aligned_summary = (
            f"Validated appraisal. Final score {final_score:.2f} ({risk_level}). "
            f"Recommendation: {recommendation}."
        )
        validated["risk_level"] = risk_level
        validated["recommendation"] = recommendation
        validated["final_score"] = final_score
        validated["corrected_summary"] = aligned_summary
        result["validated_appraisal"] = validated

        result["risk_level"] = risk_level
        result["recommendation"] = recommendation
        result["final_score"] = final_score
        result["summary"] = aligned_summary
        return normalized

    def _build_deterministic_professional_report(self, result: dict[str, Any]) -> dict[str, Any]:
        validated = result.get("validated_appraisal", {})
        trained = validated.get("trained_model_output", result.get("trained_model", {}))
        prob_safe = self._safe_float(trained.get("probability_safe", 0.5), 0.5)
        prob_risky = self._safe_float(trained.get("probability_risky", 1.0 - prob_safe), 1.0 - prob_safe)
        rule_score = self._safe_float(trained.get("rule_score", result.get("final_score", 50.0)), 50.0)
        final_score = self._safe_float(validated.get("final_score", result.get("final_score", 50.0)), 50.0)
        risk_level = str(validated.get("risk_level", result.get("risk_level", "Moderate Risk")))
        recommendation = str(validated.get("recommendation", result.get("recommendation", "Approve with caution")))

        corrected_cashflow = validated.get("corrected_cashflow_analysis", {})
        enhanced_income = validated.get("enhanced_income_analysis", {})
        enhanced_liability = validated.get("enhanced_liability_analysis", {})
        top_drivers = validated.get("top_risk_drivers", [])
        issues = validated.get("validation_issues_detected", [])
        corrections = validated.get("corrections_applied", [])

        score_blend = (
            f"Final score {final_score:.2f} is aligned using a blended policy: "
            f"60% rule score ({rule_score:.2f}) and 40% ML safe score ({prob_safe * 100.0:.2f})."
        )

        risk_reasons = [
            f"ML model risky probability is {prob_risky:.4f}, indicating repayment stress risk.",
            f"Net savings ratio is {self._safe_float(corrected_cashflow.get('net_savings_ratio', 0.0), 0.0):.4f}, showing buffer strength.",
            f"Income profile classified as {enhanced_income.get('income_profile', 'Unknown')} with variability ratio {self._safe_float(enhanced_income.get('income_variability_ratio', 0.0), 0.0):.4f}.",
            f"Estimated debt-to-income ratio is {self._safe_float(enhanced_liability.get('debt_to_income_ratio', 0.0), 0.0):.4f}.",
        ]

        return {
            "source": "deterministic-fallback",
            "executive_summary": (
                f"Decision is {recommendation} with risk level {risk_level}. "
                f"Assessment uses transaction behavior, rule checks, and ML probability on the latest one-year statement window."
            ),
            "income_diagnostics": enhanced_income,
            "cashflow_diagnostics": corrected_cashflow,
            "liability_diagnostics": enhanced_liability,
            "loan_amount_analysis": {},
            "score_explanation": {
                "final_score": round(final_score, 2),
                "rule_score_component": round(rule_score, 2),
                "ml_probability_safe": round(prob_safe, 4),
                "ml_probability_risky": round(prob_risky, 4),
                "blend_logic": "final = 0.6 * rule_score + 0.4 * ml_score",
                "narrative": score_blend,
            },
            "risk_justification": risk_reasons,
            "rulebook_insights": result.get("rulebook_top_insights", []),
            "key_risks": list(dict.fromkeys(result.get("red_flags", []) + validated.get("behavioral_flags", [])))[:8],
            "mitigations": [
                "Build a consistent monthly savings buffer above 10% before fresh leverage.",
                "Reduce discretionary spend and maintain minimum account balance discipline.",
                "Stabilize recurring income inflows for at least 6 consecutive months.",
                "Avoid short-term credit products and BNPL stacking where possible.",
            ],
            "final_underwriting_view": {
                "decision": recommendation.upper().replace(" ", "_"),
                "justification": str(validated.get("corrected_summary", result.get("summary", ""))),
                "confidence": "MEDIUM",
            },
        }

    def _parse_llm_json(self, raw: str) -> dict[str, Any] | None:
        text = str(raw or "").strip()
        if not text:
            return None

        # 1) Try direct parse first.
        try:
            parsed = json.loads(text)
            return parsed if isinstance(parsed, dict) else None
        except Exception:
            pass

        # 2) Try fenced code block content.
        fenced = re.findall(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", text, flags=re.IGNORECASE)
        for block in fenced:
            try:
                parsed = json.loads(block)
                if isinstance(parsed, dict):
                    return parsed
            except Exception:
                continue

        # 3) Try extracting first balanced JSON object region.
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            snippet = text[start : end + 1]
            try:
                parsed = json.loads(snippet)
                return parsed if isinstance(parsed, dict) else None
            except Exception:
                return None

        return None

    def _generate_bedrock_professional_report(self, context: dict[str, Any]) -> dict[str, Any] | None:
        client = self._get_bedrock_client()
        if client is None:
            return None

        system_prompt = (
            "You are a senior retail credit underwriter for Indian consumer and MSME loans. "
            "Write practical, realistic, compliance-conscious underwriting analysis."
        )
        user_prompt = (
            "Generate a detailed professional loan appraisal report in strict JSON only. "
            "Do not use markdown. Keep language specific, explainable, and audit-ready.\n"
            "JSON schema:\n"
            "{\n"
            "  \"source\": \"bedrock\",\n"
            "  \"executive_summary\": \"string\",\n"
            "  \"income_diagnostics\": {\"summary\": \"string\", \"monthly_income_estimate\": number, \"stability_observations\": [\"string\"], \"classification\": \"string\"},\n"
            "  \"cashflow_diagnostics\": {\"summary\": \"string\", \"inflow_outflow_observations\": [\"string\"], \"liquidity_observations\": [\"string\"]},\n"
            "  \"liability_diagnostics\": {\"summary\": \"string\", \"liability_observations\": [\"string\"]},\n"
            "  \"loan_amount_analysis\": {\"requested_loan_amount\": number, \"assumption\": \"string\", \"tenure_scenarios\": [\"string\"], \"affordability\": \"AFFORDABLE|RISKY_BUT_MANAGEABLE|NOT_AFFORDABLE\", \"interpretation\": \"string\"},\n"
            "  \"risk_justification\": [\"string\"],\n"
            "  \"score_explanation\": {\"narrative\": \"string\", \"rule_score_component\": number, \"ml_probability_safe\": number, \"ml_probability_risky\": number, \"blend_logic\": \"string\"},\n"
            "  \"rulebook_insights\": [\"string\"],\n"
            "  \"key_risks\": [\"string\"],\n"
            "  \"mitigations\": [\"string\"],\n"
            "  \"final_underwriting_view\": {\"decision\": \"APPROVE|APPROVE_WITH_CAUTION|REJECT\", \"justification\": \"string\", \"confidence\": \"HIGH|MEDIUM|LOW\"}\n"
            "}\n"
            "Decision policy (mandatory): prioritize affordability (EMI vs income) and loan size. "
            "Use 70% affordability and 30% filtered behavioral rules. "
            "For micro loans (<=50000): EMI/income <10% => APPROVE, 10-30% => APPROVE_WITH_CAUTION, >30% => REJECT unless severe fraud/default markers exist.\n"
            "Input context:\n"
            f"{json.dumps(context, default=str)}"
        )

        try:
            raw = client.invoke_model(user_prompt, system_prompt, max_tokens=1400, temperature=0.1)
            parsed = self._parse_llm_json(raw)
            if parsed is not None:
                parsed["source"] = "bedrock"
                return parsed
        except Exception:
            return None
        return None

    def _ensure_model_import_path(self) -> None:
        self._ensure_repo_import_paths()

    def _resolve_path(self, path_value: str, must_exist: bool = False) -> Path:
        candidate = Path(path_value)
        if candidate.name == "behavioral_rules.yaml":
            realistic_candidate = candidate.with_name("behavioral_rules_realistic.yaml")
            if realistic_candidate.exists():
                candidate = realistic_candidate
        resolved = candidate if candidate.is_absolute() else self.repo_root / candidate
        if must_exist and not resolved.exists():
            raise LoanAppraisalServiceError(f"Path not found: {resolved}", 404)
        return resolved

    def train(
        self,
        dataset_dir: str,
        rules_path: str,
        model_out: str,
        metrics_out: str,
    ) -> dict[str, Any]:
        self._ensure_model_import_path()

        dataset_abs = self._resolve_path(dataset_dir, must_exist=True)
        rules_abs = self._resolve_path(rules_path, must_exist=True)
        model_out_abs = self._resolve_path(model_out, must_exist=False)
        metrics_out_abs = self._resolve_path(metrics_out, must_exist=False)

        model_out_abs.parent.mkdir(parents=True, exist_ok=True)
        metrics_out_abs.parent.mkdir(parents=True, exist_ok=True)

        try:
            train_module = importlib.import_module("loan_appraisal_training")
            train_model = getattr(train_module, "train_model")
        except Exception as exc:
            raise LoanAppraisalServiceError(f"Failed to load training module: {exc}", 500) from exc

        start = time.perf_counter()
        try:
            metrics = train_model(
                str(dataset_abs),
                str(rules_abs),
                str(model_out_abs),
                str(metrics_out_abs),
            )
        except Exception as exc:
            raise LoanAppraisalServiceError(f"Training failed: {exc}", 500) from exc

        elapsed = round(time.perf_counter() - start, 2)
        return {
            "message": "Training completed successfully",
            "model_path": str(model_out_abs),
            "metrics_path": str(metrics_out_abs),
            "elapsed_seconds": elapsed,
            "metrics": metrics,
        }

    def predict(self, model_path: str, transactions_csv: str, rules_path: str) -> dict[str, Any]:
        self._ensure_model_import_path()

        model_abs = self._resolve_path(model_path, must_exist=True)
        transactions_abs = self._resolve_path(transactions_csv, must_exist=True)
        rules_abs = self._resolve_path(rules_path, must_exist=True)

        try:
            infer_module = importlib.import_module("loan_appraisal_inference")
            run_inference = getattr(infer_module, "run_inference")
        except Exception as exc:
            raise LoanAppraisalServiceError(f"Failed to load inference module: {exc}", 500) from exc

        try:
            result = run_inference(str(model_abs), str(transactions_abs), str(rules_abs))
        except Exception as exc:
            raise LoanAppraisalServiceError(f"Inference failed: {exc}", 500) from exc

        return {"result": result}

    def analyze_uploaded_statement(
        self,
        loan_type: str,
        loan_amount: float | None,
        source_file_name: str,
        payload_bytes: bytes,
        rules_path: str,
        model_path: str,
        use_bedrock: bool = True,
    ) -> dict[str, Any]:
        self._ensure_model_import_path()

        if not payload_bytes:
            raise LoanAppraisalServiceError("Uploaded file is empty", 400)

        rules_abs = self._resolve_path(rules_path, must_exist=True)
        model_abs = self._resolve_path(model_path, must_exist=False)

        suffix = Path(source_file_name).suffix.lower()
        if suffix not in {".csv", ".pdf"}:
            raise LoanAppraisalServiceError("Only CSV or PDF statements are supported", 400)

        with tempfile.TemporaryDirectory(prefix="loan_appraisal_") as tmp_dir:
            tmp_path = Path(tmp_dir)
            source_path = tmp_path / f"input{suffix}"
            source_path.write_bytes(payload_bytes)

            if suffix == ".pdf":
                raw_df = self._extract_pdf_to_dataframe(source_path)
                detected_format = "pdf"
            else:
                try:
                    raw_df = pd.read_csv(source_path, dtype=str)
                except Exception as exc:
                    raise LoanAppraisalServiceError(f"Unable to read CSV statement: {exc}", 400) from exc
                detected_format = "csv"

            normalized = self._normalize_statement_df(raw_df)
            normalized, period_meta = self._restrict_to_recent_one_year(normalized)
            monthly_balance_table = self._build_monthly_balance_table(normalized)
            period_meta = {**period_meta, "month_count": str(len(monthly_balance_table))}
            notable_transactions = self._extract_notable_transactions(normalized)
            normalized_csv_path = tmp_path / "normalized_statement.csv"
            normalized.to_csv(normalized_csv_path, index=False, header=False)

            if model_abs.exists():
                infer_module = importlib.import_module("loan_appraisal_inference")
                run_inference = getattr(infer_module, "run_inference")
                result = run_inference(
                    str(model_abs),
                    str(normalized_csv_path),
                    str(rules_abs),
                    {
                        "loan_type": loan_type,
                        "loan_amount": loan_amount,
                        "tenure_months": 24,
                        "collateral_present": loan_type.strip().lower() in {"home", "housing", "mortgage", "gold"},
                    },
                )
                model_used: str | None = str(model_abs)
            else:
                engine_module = importlib.import_module("loan_appraisal_engine")
                run_loan_appraisal = getattr(engine_module, "run_loan_appraisal")
                result = run_loan_appraisal(
                    str(normalized_csv_path),
                    str(rules_abs),
                    {
                        "loan_type": loan_type,
                        "loan_amount": loan_amount,
                        "tenure_months": 24,
                        "collateral_present": loan_type.strip().lower() in {"home", "housing", "mortgage", "gold"},
                    },
                )
                model_used = None

        result["loan_type"] = loan_type
        result["loan_type_insights"] = self._loan_type_insights(loan_type, result)
        result["analysis_period"] = period_meta
        result["monthly_balance_table"] = monthly_balance_table
        result["rulebook_top_insights"] = self._summarize_rule_insights(result)

        validated_appraisal = self._build_validated_appraisal(
            loan_type=loan_type,
            normalized=normalized,
            result=result,
        )
        result["validated_appraisal"] = validated_appraisal

        policy_result = self._compute_realistic_underwriting_policy(result, loan_amount)
        loan_amount_value = self._safe_float(loan_amount, 0.0)
        loan_amount_analysis = self._compute_loan_amount_analysis(loan_amount, result)
        severe_tokens_present = any(
            token in " ".join(
                [
                    str(result.get("summary", "")),
                    " ".join([str(x) for x in result.get("red_flags", [])]),
                    " ".join([str(x) for x in result.get("behavioral_flags", [])]),
                ]
            ).lower()
            for token in (
                "fraud",
                "gambling",
                "chargeback",
                "bounced cheque",
                "repeat default",
                "repeated default",
                "wilful default",
                "written off",
                "write-off",
            )
        )

        if loan_amount_value > 0 and loan_amount_value <= 50000 and not severe_tokens_present:
            micro_policy_score_map = {
                "APPROVE": 72.0,
                "APPROVE_WITH_CAUTION": 62.0,
                "REJECT": 44.0,
            }
            cashflow_state = result.get("cashflow_analysis", {})
            savings_ratio = self._safe_float(cashflow_state.get("net_savings_ratio", 0.0), 0.0)
            low_balance_days = int(cashflow_state.get("low_balance_days", 0) or 0)
            active_days = max(1, int(cashflow_state.get("unique_active_days", 0) or len(normalized)))
            affordability_state = str(loan_amount_analysis.get("affordability", "NOT_AFFORDABLE"))

            if affordability_state == "NOT_AFFORDABLE":
                policy_decision = "REJECT"
            elif affordability_state == "AFFORDABLE" and savings_ratio >= 0.10 and low_balance_days <= int(active_days * 0.2):
                policy_decision = "APPROVE"
            else:
                policy_decision = "APPROVE_WITH_CAUTION"

            validated_appraisal["final_score"] = micro_policy_score_map.get(policy_decision, validated_appraisal["final_score"])
            validated_appraisal["risk_level"] = "Low Risk" if policy_decision == "APPROVE" else "Moderate Risk" if policy_decision == "APPROVE_WITH_CAUTION" else "High Risk"
            validated_appraisal["recommendation"] = "Approve" if policy_decision == "APPROVE" else "Approve with caution" if policy_decision == "APPROVE_WITH_CAUTION" else "Reject"
            validated_appraisal["confidence_score"] = max(
                self._safe_float(validated_appraisal.get("confidence_score", 50.0)),
                72.0 if policy_decision == "APPROVE" else 62.0 if policy_decision == "APPROVE_WITH_CAUTION" else 50.0,
            )
            validated_appraisal["corrected_summary"] = (
                f"Validated 1-year appraisal for {loan_type}. Final score {validated_appraisal['final_score']:.2f} "
                f"({validated_appraisal['risk_level']}). Micro-loan policy={policy_decision}, "
                f"affordability={affordability_state}, cashflow stress and behavioral rules were balanced. "
                f"Recommendation: {validated_appraisal['recommendation']}."
            )
            result["validated_appraisal"] = validated_appraisal

        # Promote corrected decision fields to top-level result for downstream consistency.
        result["summary"] = validated_appraisal["corrected_summary"]
        result["final_score"] = validated_appraisal["final_score"]
        result["risk_level"] = validated_appraisal["risk_level"]
        result["recommendation"] = validated_appraisal["recommendation"]
        result["confidence_score"] = validated_appraisal["confidence_score"]

        professional_report = None
        if use_bedrock:
            context = self._build_professional_report_context(
                loan_type=loan_type,
                loan_amount=loan_amount,
                result=result,
                rows_analyzed=int(len(normalized)),
                period_meta=period_meta,
            )
            professional_report = self._generate_bedrock_professional_report(context)
            if professional_report is None:
                professional_report = self._build_deterministic_professional_report(result)
        else:
            professional_report = self._build_deterministic_professional_report(result)

        # Enforce strict report structure and decision policy.
        professional_report = self._normalize_professional_report(
            report=professional_report,
            result=result,
            loan_amount=loan_amount,
            notable_transactions=notable_transactions,
        )

        result["professional_appraisal"] = professional_report

        return {
            "loan_type": loan_type,
            "loan_amount": loan_amount,
            "source_file": source_file_name,
            "detected_format": detected_format,
            "rows_analyzed": int(len(normalized)),
            "rules_path": str(rules_abs),
            "model_used": model_used,
            "analysis_period": period_meta,
            "result": result,
        }

    def generate_professional_report(
        self, analysis_result: dict, output_format: str = "text"
    ) -> str:
        """
        Generate a professional 4-page loan appraisal report from analysis results.

        Args:
            analysis_result: The complete analysis result dictionary from analyze_uploaded_statement
            output_format: Either 'text' (default) for formatted document or 'html'

        Returns:
            Formatted professional report as string.
        """
        # Import formatter here to avoid circular dependencies
        from app.services.professional_report_formatter import ProfessionalReportFormatter

        # Extract core data from analysis result.
        result_block = analysis_result.get("result", {})

        def _as_dict(value: Any) -> dict[str, Any]:
            return value if isinstance(value, dict) else {}

        def _as_list(value: Any) -> list[Any]:
            return value if isinstance(value, list) else []

        def _to_float(value: Any, default: float = 0.0) -> float:
            try:
                return float(value)
            except (TypeError, ValueError):
                return default

        def _confidence_band(raw_confidence: Any) -> str:
            score = _to_float(raw_confidence, -1.0)
            if score >= 75.0:
                return "HIGH"
            if score >= 50.0:
                return "MEDIUM"
            if score >= 0.0:
                return "LOW"
            text = str(raw_confidence).strip().upper()
            if text in {"HIGH", "MEDIUM", "LOW"}:
                return text
            return "MEDIUM"

        professional_appraisal = _as_dict(result_block.get("professional_appraisal"))
        validated = _as_dict(result_block.get("validated_appraisal"))
        strict_metrics = _as_dict(result_block.get("strict_pipeline_metrics"))

        top_income = _as_dict(result_block.get("income_analysis"))
        top_cashflow = _as_dict(result_block.get("cashflow_analysis"))
        top_loan = _as_dict(result_block.get("loan_analysis"))

        income_diag = _as_dict(professional_appraisal.get("income_diagnostics"))
        cashflow_diag = _as_dict(professional_appraisal.get("cashflow_diagnostics"))
        liability_diag = _as_dict(professional_appraisal.get("liability_diagnostics"))
        loan_amount_diag = _as_dict(professional_appraisal.get("loan_amount_analysis"))
        final_underwriting_view = _as_dict(professional_appraisal.get("final_underwriting_view"))

        month_count = len(_as_list(result_block.get("monthly_balance_table")))
        if month_count <= 0:
            try:
                month_count = int(analysis_result.get("analysis_period", {}).get("month_count", 0) or 0)
            except (TypeError, ValueError):
                month_count = 0
        month_count = max(1, month_count)

        monthly_income = _to_float(
            income_diag.get("monthly_income_estimate")
            or cashflow_diag.get("monthly_income")
            or top_cashflow.get("monthly_income")
            or strict_metrics.get("monthly_income")
            or top_income.get("salary_mean")
        )
        total_inflow = _to_float(top_cashflow.get("total_inflow"))
        total_outflow = _to_float(top_cashflow.get("total_outflow"))
        monthly_expenses = _to_float(
            cashflow_diag.get("monthly_expense")
            or top_cashflow.get("monthly_expense")
            or strict_metrics.get("monthly_expense")
            or ((total_outflow / month_count) if total_outflow > 0 else 0.0)
        )
        net_savings_ratio = _to_float(top_cashflow.get("net_savings_ratio"))
        low_balance_days = int(_to_float(top_cashflow.get("low_balance_days"), 0.0))
        min_balance = _to_float(top_cashflow.get("minimum_balance"))
        peak_balance = _to_float(top_cashflow.get("peak_balance"))
        month_end_stress = int(_to_float(top_cashflow.get("month_end_stress_count"), 0.0))

        existing_monthly_liability = _to_float(top_loan.get("estimated_average_monthly_emi"))
        debt_to_income_ratio = (existing_monthly_liability / monthly_income) if monthly_income > 0 else 0.0

        final_score = _to_float(result_block.get("final_score"))
        risk_level = str(result_block.get("risk_level", "Not Assessed"))
        recommendation = str(result_block.get("recommendation", "PENDING"))
        confidence_level = _confidence_band(
            final_underwriting_view.get("confidence") or result_block.get("confidence_score")
        )

        classification = str(income_diag.get("classification") or "Unknown")
        behavior_summary = str(professional_appraisal.get("executive_summary", ""))
        risk_justification = (
            final_underwriting_view.get("justification")
            or professional_appraisal.get("risk_justification", "")
        )

        affordability_class = str(
            loan_amount_diag.get("affordability")
            or loan_amount_diag.get("classification")
            or "N/A"
        )

        salary_months_detected = int(_to_float(top_income.get("salary_months_detected"), 0.0))
        salary_variance_ratio = _to_float(top_income.get("salary_variance_ratio"), 0.0)
        salary_trend_pct = _to_float(top_income.get("salary_trend_pct"), 0.0)
        salary_delay_std_days = _to_float(top_income.get("salary_delay_std_days"), 0.0)
        employer_switch_count = int(_to_float(top_income.get("employer_switch_count"), 0.0))
        employers_detected = _as_list(top_income.get("employers_detected"))

        salary_reduction_signal = (
            "Detected" if salary_trend_pct < -0.05 else "Not detected"
        )
        salary_delay_signal = (
            "Likely delayed/irregular" if salary_delay_std_days > 3.0 else "Mostly on-time"
        )
        company_switch_signal = (
            "Detected" if employer_switch_count > 0 else "Not detected"
        )

        corrected_rules = _as_list(validated.get("corrected_rule_evaluations"))
        structured_rules: list[dict[str, Any]] = []
        for rule in corrected_rules[:5]:
            if not isinstance(rule, dict):
                continue
            impact = _to_float(rule.get("impact"))
            if impact <= -0.10:
                severity = "High"
            elif impact <= -0.05:
                severity = "Moderate"
            else:
                severity = "Low"
            structured_rules.append(
                {
                    "name": str(rule.get("rule_id", "UNKNOWN_RULE")),
                    "impact_score": impact,
                    "severity": severity,
                    "explanation": str(rule.get("reason", "Rule condition triggered based on behavior")),
                }
            )

        if not structured_rules:
            for idx, insight in enumerate(_as_list(professional_appraisal.get("rulebook_insights"))[:5], 1):
                structured_rules.append(
                    {
                        "name": f"RULE_{idx}",
                        "impact_score": 0.0,
                        "severity": "Low",
                        "explanation": str(insight),
                    }
                )

        risk_drivers = _as_list(validated.get("top_risk_drivers"))
        if not risk_drivers:
            key_risks = professional_appraisal.get("key_risks")
            if isinstance(key_risks, list):
                risk_drivers = [str(item) for item in key_risks]
            elif isinstance(key_risks, str) and key_risks.strip():
                risk_drivers = [key_risks.strip()]

        total_days = 365
        liquidity_stress_ratio = (low_balance_days / total_days) if total_days > 0 else 0.0

        # Build structured data for the formatter.
        formatted_data = {
            "source_file": analysis_result.get("source_file", "N/A"),
            "analysis_period": analysis_result.get("analysis_period", {}),
            "rows_analyzed": analysis_result.get("rows_analyzed", 0),
            "monthly_balance_table": result_block.get("monthly_balance_table", []),
            "applicant_profile": {
                "classification": classification,
                "financial_health": ("Weak" if final_score < 40 else "Moderate" if final_score < 70 else "Strong"),
                "behavior_summary": behavior_summary[:300],
                "income_pattern": ", ".join(_as_list(income_diag.get("stability_observations"))) or "N/A",
                "behavior_consistency": "Low" if liquidity_stress_ratio > 0.5 else "Moderate",
            },
            "loan_request": {
                "type": analysis_result.get("loan_type", "Personal"),
                "amount": analysis_result.get("loan_amount", 0),
                "purpose": "Not specified",
            },
            "financial_snapshot": {
                "estimated_monthly_income": monthly_income,
                "estimated_monthly_expenses": monthly_expenses,
                "net_savings_ratio": net_savings_ratio,
                "total_inflow": total_inflow,
                "total_outflow": total_outflow,
                "low_balance_days": low_balance_days,
                "total_active_days": total_days,
                "min_balance": min_balance,
                "peak_balance": peak_balance,
                "affordability_status": affordability_class,
            },
            "decision": {
                "risk_level": risk_level,
                "recommendation": recommendation,
                "confidence_level": confidence_level,
                "final_score": final_score,
                "justification": str(risk_justification)[:500],
                "confidence_explanation": str(final_underwriting_view),
            },
            "income_analysis": {
                "source": ", ".join(_as_list(top_income.get("employers_detected"))) or "Unknown",
                "stability": "Irregular" if _to_float(top_income.get("salary_variance_ratio")) > 0.5 else "Consistent",
                "monthly_estimate": monthly_income,
                "trend": (
                    "Increasing" if _to_float(top_income.get("salary_trend_pct")) > 0
                    else "Decreasing" if _to_float(top_income.get("salary_trend_pct")) < 0
                    else "Stable"
                ),
                "risks": ", ".join(_as_list(income_diag.get("stability_observations"))) or "None identified",
                "classification": classification,
                "detailed_observation": income_diag or "Standard income pattern.",
                "salary_months_detected": salary_months_detected,
                "salary_variance_ratio": salary_variance_ratio,
                "salary_trend_pct": salary_trend_pct,
                "salary_delay_std_days": salary_delay_std_days,
                "employer_switch_count": employer_switch_count,
                "employers_detected": employers_detected,
                "salary_reduction_signal": salary_reduction_signal,
                "salary_delay_signal": salary_delay_signal,
                "company_switch_signal": company_switch_signal,
            },
            "cashflow_analysis": {
                "total_inflow": total_inflow,
                "total_outflow": total_outflow,
                "net_savings": (total_inflow - total_outflow),
                "savings_interpretation": (
                    "Weak" if net_savings_ratio < 0.05 else "Adequate" if net_savings_ratio < 0.10 else "Healthy"
                ),
                "health_rating": (
                    "Good" if net_savings_ratio > 0.05 else "Fair" if net_savings_ratio > 0 else "Poor"
                ),
                "analysis_detail": cashflow_diag or "Standard cashflow pattern observed.",
            },
            "liquidity_analysis": {
                "min_balance": min_balance,
                "peak_balance": peak_balance,
                "avg_balance": ((min_balance + peak_balance) / 2.0) if peak_balance > 0 else 0.0,
                "low_balance_days": low_balance_days,
                "stress_days": low_balance_days,
                "month_end_stress": f"{month_end_stress} days",
                "quarter_end_stress": "Elevated" if month_end_stress > 0 else "Normal",
                "liquidity_risk": ("High" if low_balance_days > 100 else "Moderate" if low_balance_days > 50 else "Low"),
                "observation": professional_appraisal.get("key_risks", "")[:200],
            },
            "financial_discipline": {
                "spending_pattern": "Aggressive" if net_savings_ratio < 0.05 else "Controlled",
                "pattern_consistency": "Low" if liquidity_stress_ratio > 0.5 else "Moderate",
                "expense_volatility": "Moderate",
                "stress_indicators": _as_list(cashflow_diag.get("liquidity_observations")),
                "discipline_rating": ("Good" if net_savings_ratio > 0.05 else "Moderate" if net_savings_ratio > 0 else "Poor"),
            },
            "expense_behavior": {
                "rent": 0.0,
                "food": 0.0,
                "travel": 0.0,
                "bills": 0.0,
                "discretionary": 0.0,
                "pattern": "No categorical split available",
                "high_value_tx_count": len(_as_list(professional_appraisal.get("notable_transactions"))),
                "lifestyle_insight": behavior_summary[:300],
            },
            "liability_analysis": {
                "existing_emis": f"Estimated monthly liability ₹{existing_monthly_liability:,.2f}",
                "bnpl_usage": "Minimal" if _to_float(top_loan.get("bnpl_count")) == 0 else "Detected",
                "hidden_liabilities": f"Hidden EMI count: {int(_to_float(top_loan.get('hidden_emi_count'), 0.0))}",
                "debt_to_income_ratio": debt_to_income_ratio,
                "annual_debt_payment": existing_monthly_liability * 12.0,
                "liability_risk": ("High" if debt_to_income_ratio > 0.5 else "Moderate" if debt_to_income_ratio > 0.3 else "Low"),
                "assessment": liability_diag or "Applicant is not heavily leveraged.",
            },
            "affordability_analysis": {
                "emi": analysis_result.get("loan_amount", 0) / 24 if analysis_result.get("loan_amount", 0) > 0 else 0,
                "classification": affordability_class,
                "confidence": "HIGH" if affordability_class == "AFFORDABLE" else "MEDIUM",
                "rationale": str(loan_amount_diag.get("interpretation") or "Assessment based on EMI ratio and surplus capacity."),
            },
            "behavioral_risk": {
                "low_balance_frequency": ("Frequent" if low_balance_days > 100 else "Occasional" if low_balance_days > 30 else "Rare"),
                "large_debit_count": len([t for t in _as_list(professional_appraisal.get("notable_transactions")) if isinstance(t, dict) and t.get("type") == "large_debit"]),
                "spending_spikes": "Detected" if len(_as_list(professional_appraisal.get("notable_transactions"))) >= 3 else "No unusual spikes",
                "stress_level": ("High" if low_balance_days > 100 else "Moderate" if low_balance_days > 50 else "Low"),
                "stress_indicators": _as_list(cashflow_diag.get("liquidity_observations")) or "Standard financial behavior",
                "repayment_prediction": ("Likely regular" if final_score > 50 else "May need monitoring" if final_score > 40 else "High default risk"),
                "detailed_assessment": str(risk_justification or "Applicant demonstrates acceptable financial discipline."),
            },
            "notable_transactions": _as_list(professional_appraisal.get("notable_transactions")),
            "rule_insights": structured_rules,
            "risk_drivers": risk_drivers,
            "recommendations": {
                "income_improvement": "Establish consistent monthly income source",
                "spending_reduction": "Reduce discretionary expenses where possible",
                "min_balance_target": 10000,
            },
            "model_stats": {
                "training_sample_size": "10000+",
            },
        }

        # Generate formatted report
        formatter = ProfessionalReportFormatter()
        if output_format == "html":
            return self._convert_text_to_html(formatter.format_report(formatted_data))
        else:
            return formatter.format_report(formatted_data)

    def _convert_text_to_html(self, text_report: str) -> str:
        """Convert text report to basic HTML for display."""
        import html

        html_header = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Loan Appraisal Report</title>
    <style>
        body { font-family: 'Courier New', monospace; margin: 20px; background: #f5f5f5; }
        .page { background: white; padding: 30px; margin: 20px 0; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { font-weight: bold; font-size: 1.2em; }
        .section { margin: 20px 0; }
        h1 { border-bottom: 3px solid #333; padding-bottom: 10px; }
        pre { background: #f0f0f0; padding: 15px; overflow-x: auto; border-radius: 5px; }
    </style>
</head>
<body>
<div class="page">
<pre>
"""
        html_footer = """
</pre>
</div>
</body>
</html>
"""
        escaped_text = html.escape(text_report)
        return html_header + escaped_text + html_footer


loan_appraisal_service = LoanAppraisalService()
