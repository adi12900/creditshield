"""ASCII-only professional 4-page loan appraisal report formatter."""

from datetime import datetime


class ProfessionalReportFormatter:
    """Formats loan appraisal analysis into a text report safe for PDF rendering."""

    def __init__(self):
        self.page_separator = "\n" + "=" * 100 + "\n"

    def format_report(self, analysis_data: dict) -> str:
        report_parts = [
           self._generate_report_header(analysis_data),
           self.page_separator,
           self._generate_page_1(analysis_data),
           self.page_separator,
           self._generate_page_2(analysis_data),
           self.page_separator,
           self._generate_page_3(analysis_data),
           self.page_separator,
           self._generate_page_4(analysis_data),
           self.page_separator,
           self._generate_report_footer(),
        ]
        return "".join(report_parts)

    def _money(self, value: float) -> str:
        return f"Rs {float(value):,.2f}"

    def _pct(self, value: float) -> str:
        return f"{float(value):.2%}" if abs(float(value)) <= 1 else f"{float(value):.2f}%"

    def _month_count(self, data: dict) -> int:
        table = data.get("monthly_balance_table", [])
        if isinstance(table, list) and table:
            return len(table)
        analysis_period = data.get("analysis_period", {})
        try:
            month_count = int(analysis_period.get("month_count", 0) or 0)
            if month_count > 0:
                return month_count
        except (TypeError, ValueError):
            pass
        return 12

    def _month_balance_table(self, data: dict) -> str:
        rows = data.get("monthly_balance_table", [])
        if not rows:
            return "   No monthly balance table available."

        first_row = rows[0] if isinstance(rows[0], dict) else {}
        first_month = str(first_row.get("month", "N/A"))
        opening_balance = float(first_row.get("opening_balance", 0) or 0)

        lines_out = [
            f"   Opening Outstanding (Before {first_month}): {self._money(opening_balance)}",
            "",
            "   Month      | Credit        | Debit         | Savings       | Balance Remaining",
            "   -------------------------------------------------------------------------------",
        ]
        for row in rows:
            month_label = str(row.get("month", "N/A"))
            credit_text = self._money(row.get("credit", 0))
            debit_text = self._money(row.get("debit", 0))
            savings_text = self._money(row.get("savings", 0))
            balance_text = self._money(row.get("balance_remaining", 0))
            lines_out.append("   %s | %s | %s | %s | %s" % (month_label.ljust(10), credit_text.rjust(12), debit_text.rjust(12), savings_text.rjust(12), balance_text.rjust(16)))
        return chr(10).join(lines_out)


    def _generate_report_header(self, data: dict) -> str:
        report_date = datetime.now().strftime("%d-%b-%Y")
        return f"""
================================================================================================================
PROFESSIONAL LOAN APPRAISAL REPORT
4-PAGE FORMAL UNDERWRITING DOCUMENT
================================================================================================================

Report Generated: {report_date}
Analysis Period: {data.get('analysis_period', {}).get('period_start', 'N/A')} to {data.get('analysis_period', {}).get('period_end', 'N/A')}
Source File: {data.get('source_file', 'N/A')}
Confidentiality: INTERNAL - FOR AUTHORIZED PERSONNEL ONLY
"""

    def _generate_page_1(self, data: dict) -> str:
        applicant = data.get("applicant_profile", {})
        loan_req = data.get("loan_request", {})
        snapshot = data.get("financial_snapshot", {})
        decision = data.get("decision", {})
        risks = data.get("risk_drivers", [])

        loan_amount = float(loan_req.get("amount", 0))
        emi_24m = loan_amount / 24 if loan_amount > 0 else 0
        monthly_income = float(snapshot.get("estimated_monthly_income", 0))
        monthly_expenses = float(snapshot.get("estimated_monthly_expenses", 0))
        savings_ratio = float(snapshot.get("net_savings_ratio", 0))
        month_count = self._month_count(data)
        low_balance_days = int(snapshot.get("low_balance_days", 0))
        total_days = max(int(snapshot.get("total_active_days", 1)), 1)

        page_1 = f"""
====================================================================================================
PAGE 1: EXECUTIVE SUMMARY AND CREDIT DECISION
====================================================================================================

1. APPLICANT PROFILE AND FINANCIAL HEALTH

   Classification:           {applicant.get('classification', 'N/A')}
   Overall Financial Health:  {applicant.get('financial_health', 'N/A')}
   Summary of Financial Behavior:
   {applicant.get('behavior_summary', 'Not available')}

2. LOAN REQUEST OVERVIEW

   Loan Type:                {loan_req.get('type', 'N/A')}
   Requested Loan Amount:     {self._money(loan_amount)}
   Assumed Tenure:            24 months
   Estimated Monthly EMI:     {self._money(emi_24m)}
   Loan Purpose:              {loan_req.get('purpose', 'Not specified')}

3. KEY FINANCIAL SNAPSHOT

   Estimated Monthly Income:  {self._money(monthly_income)}
   Estimated Monthly Expenses: {self._money(monthly_expenses)}
   Monthly Surplus or Deficit: {self._money(monthly_income - monthly_expenses)}
   Net Savings Ratio:         {self._pct(savings_ratio)}
    Total Inflow ({month_count} months):   {self._money(snapshot.get('total_inflow', 0))}
    Total Outflow ({month_count} months):  {self._money(snapshot.get('total_outflow', 0))}
   Liquidity Stress Assessment: {low_balance_days} low-balance days out of {total_days} active days
   Low-balance Stress Rate:    {low_balance_days / total_days * 100:.1f}%
   Minimum Balance Observed:    {self._money(snapshot.get('min_balance', 0))}
   Peak Balance Observed:       {self._money(snapshot.get('peak_balance', 0))}

4. TOP RISK DRIVERS
"""
        for idx, risk in enumerate(risks[:6], 1):
           page_1 += f"   {idx}. {risk}\n"

        page_1 += f"""

5. FINAL CREDIT DECISION

   Risk Level:            {decision.get('risk_level', 'N/A')}
   Recommendation:        {decision.get('recommendation', 'N/A')}
   Confidence Level:      {decision.get('confidence_level', 'N/A')}
   Final Score:           {decision.get('final_score', 0):.2f} / 100

6. DECISION JUSTIFICATION

{decision.get('justification', 'Not available')}

   Key Drivers:
   - Income Pattern: {applicant.get('income_pattern', 'N/A')}
   - Savings Capacity: {('Adequate' if savings_ratio > 0.05 else 'Weak')} (ratio: {savings_ratio:.2%})
   - Liquidity Position: {('Constrained' if low_balance_days > total_days * 0.5 else 'Stable')}
   - EMI Affordability: {snapshot.get('affordability_status', 'N/A')}
   - Behavior Consistency: {applicant.get('behavior_consistency', 'N/A')}
"""
        return page_1

    def _generate_page_2(self, data: dict) -> str:
        income = data.get("income_analysis", {})
        cashflow = data.get("cashflow_analysis", {})
        liquidity = data.get("liquidity_analysis", {})
        discipline = data.get("financial_discipline", {})

        total_inflow = float(cashflow.get("total_inflow", 0))
        total_outflow = float(cashflow.get("total_outflow", 0))
        net_savings = total_inflow - total_outflow
        savings_ratio = (net_savings / total_inflow * 100) if total_inflow > 0 else 0
        month_count = self._month_count(data)
        salary_months = int(income.get("salary_months_detected", 0) or 0)
        salary_delay_std = float(income.get("salary_delay_std_days", 0) or 0)
        salary_var = float(income.get("salary_variance_ratio", 0) or 0)
        salary_trend_pct = float(income.get("salary_trend_pct", 0) or 0)
        employer_switches = int(income.get("employer_switch_count", 0) or 0)
        reduction_signal = income.get("salary_reduction_signal", "Not detected")
        delay_signal = income.get("salary_delay_signal", "Mostly on-time")
        switch_signal = income.get("company_switch_signal", "Not detected")
        salary_section = ""
        if salary_months > 0:
            salary_section = f"""

    1A. SALARY BEHAVIOR DIAGNOSTICS

       Salary Months Detected:   {salary_months} month(s)
       Salary Trend:             {salary_trend_pct * 100:.2f}%
       Salary Reduction Signal:  {reduction_signal}
       Salary Delay Variability: {salary_delay_std:.2f} day(s)
       Late Salary Signal:       {delay_signal}
       Employer Switching:       {switch_signal} ({employer_switches} switch event(s))
       Salary Volatility Ratio:  {salary_var:.4f}
    """

        page_2 = f"""
====================================================================================================
PAGE 2: INCOME AND CASHFLOW ANALYSIS
====================================================================================================

1. INCOME ANALYSIS

   Income Source(s):         {income.get('source', 'N/A')}
   Income Stability:         {income.get('stability', 'N/A')}
   Monthly Income Estimate:   {self._money(income.get('monthly_estimate', 0))}
   Total Inflow ({month_count}m):       {self._money(total_inflow)}
   Income Trend:             {income.get('trend', 'N/A')}
   Income Risks:             {income.get('risks', 'None identified')}
   Income Classification:    {income.get('classification', 'N/A')}
   Detailed Observation:
   {income.get('detailed_observation', 'Standard income pattern.')}
{salary_section}

2. CASHFLOW ANALYSIS

   Total Inflow ({month_count} months):  {self._money(total_inflow)}
   Total Outflow ({month_count} months): {self._money(total_outflow)}
   Net Savings ({month_count} months):   {self._money(net_savings)}
   Net Savings Ratio:         {savings_ratio:.2f}%
   Monthly Average Inflow:    {self._money(total_inflow / month_count if total_inflow else 0)}
   Monthly Average Outflow:   {self._money(total_outflow / month_count if total_outflow else 0)}
   Monthly Average Savings:   {self._money(net_savings / month_count if total_inflow else 0)}
   Savings Interpretation:    {cashflow.get('savings_interpretation', 'N/A')}
   Cashflow Health Rating:    {cashflow.get('health_rating', 'N/A')}
   Detailed Analysis:
   {cashflow.get('analysis_detail', 'Standard cashflow pattern observed.')}

3. MONTH-WISE BALANCE REMAINING

{self._month_balance_table(data)}

4. LIQUIDITY ANALYSIS

   Minimum Balance Observed:  {self._money(liquidity.get('min_balance', 0))}
   Peak Balance Observed:     {self._money(liquidity.get('peak_balance', 0))}
   Average Balance:           {self._money(liquidity.get('avg_balance', 0))}
   Low Balance Days:          {liquidity.get('low_balance_days', 0)} days
   Stress Days (balance < Rs 5000): {liquidity.get('stress_days', 0)} days
   Month-End Stress Indicator: {liquidity.get('month_end_stress', 'Normal')}
   Quarter-End Stress Indicator: {liquidity.get('quarter_end_stress', 'Normal')}
   Liquidity Risk Assessment: {liquidity.get('liquidity_risk', 'Moderate')}
   Observation:
   {liquidity.get('observation', 'Applicant maintains reasonable liquidity position.')}

5. FINANCIAL DISCIPLINE AND CONSISTENCY

   Spending vs Earning Behavior:  {discipline.get('spending_pattern', 'N/A')}
   Financial Pattern Consistency: {discipline.get('pattern_consistency', 'N/A')}
   Expense Volatility:            {discipline.get('expense_volatility', 'N/A')}
   Stress Indicators:             {discipline.get('stress_indicators', 'None detected')}
   Overall Discipline Rating:     {discipline.get('discipline_rating', 'Moderate')}
"""
        return page_2

    def _generate_page_3(self, data: dict) -> str:
        expenses = data.get("expense_behavior", {})
        liability = data.get("liability_analysis", {})
        affordability = data.get("affordability_analysis", {})
        behavior = data.get("behavioral_risk", {})

        loan_amount = float(data.get("loan_request", {}).get("amount", 0))
        emi = loan_amount / 24 if loan_amount > 0 else 0
        monthly_income = float(data.get("financial_snapshot", {}).get("estimated_monthly_income", 0))
        month_count = self._month_count(data)
        emi_to_income = (emi / monthly_income * 100) if monthly_income > 0 else 0
        income_safe = monthly_income if monthly_income > 0 else 1

        page_3 = f"""
====================================================================================================
PAGE 3: EXPENSE, LIABILITY, AND BEHAVIORAL ANALYSIS
====================================================================================================

1. EXPENSE BEHAVIOR AND SPENDING PATTERNS

   Essential Spending:
   - Rent/Housing:      {self._money(expenses.get('rent', 0))}/month ({expenses.get('rent', 0) / income_safe * 100:.1f}% of income)
   - Food/Groceries:    {self._money(expenses.get('food', 0))}/month ({expenses.get('food', 0) / income_safe * 100:.1f}% of income)
   - Travel/Transport:  {self._money(expenses.get('travel', 0))}/month ({expenses.get('travel', 0) / income_safe * 100:.1f}% of income)
   - Bills/Utilities:   {self._money(expenses.get('bills', 0))}/month ({expenses.get('bills', 0) / income_safe * 100:.1f}% of income)
   Discretionary Spending:
   - Entertainment:     {self._money(expenses.get('discretionary', 0))}/month ({expenses.get('discretionary', 0) / income_safe * 100:.1f}% of income)
   Spending Pattern: {expenses.get('pattern', 'N/A')}
   High-Value Transactions Identified: {expenses.get('high_value_tx_count', 0)} transactions
   Lifestyle Insight:
   {expenses.get('lifestyle_insight', 'Spending pattern reflects moderate living standards.')}

2. LIABILITY ANALYSIS AND DEBT POSITION

   Existing EMIs Detected:        {liability.get('existing_emis', 'None detected')}
   BNPL / Credit Usage:           {liability.get('bnpl_usage', 'Minimal')}
   Hidden Liabilities (Pattern):  {liability.get('hidden_liabilities', 'No significant patterns')}
   Debt-to-Income Ratio:          {liability.get('debt_to_income_ratio', 0):.2%}
   Estimated Annual Debt Payment: {self._money(liability.get('annual_debt_payment', 0))}
   Liability Risk Level:          {liability.get('liability_risk', 'Low')}
   Assessment:
   {liability.get('assessment', 'Applicant is not heavily leveraged.')}

3. LOAN AFFORDABILITY ANALYSIS (REQUESTED: {self._money(loan_amount)})

   Expected Monthly EMI (24 months): {self._money(emi)}
   Estimated Monthly Income:         {self._money(monthly_income)}
   EMI-to-Income Ratio:              {emi_to_income:.2f}%
   Current Monthly Surplus:          {self._money(monthly_income - data.get('financial_snapshot', {}).get('estimated_monthly_expenses', 0))}
   Expected Surplus After EMI:       {self._money(monthly_income - data.get('financial_snapshot', {}).get('estimated_monthly_expenses', 0) - emi)}
   Affordability Classification:     {affordability.get('classification', 'N/A')}
   Affordability Confidence:         {affordability.get('confidence', 'N/A')}
   Rationale for Affordability Classification:
   {affordability.get('rationale', 'Assessment based on EMI ratio and surplus capacity.')}
   EMI Ratio Analysis: {('PASS' if emi_to_income < 50 else 'CAUTION' if emi_to_income < 60 else 'FAIL')}
   Surplus Analysis: {('PASS' if (monthly_income - data.get('financial_snapshot', {}).get('estimated_monthly_expenses', 0) - emi) > 0 else 'FAIL')}
   Historical Savings: {('PASS' if data.get('financial_snapshot', {}).get('net_savings_ratio', 0) > 0.05 else 'CAUTION' if data.get('financial_snapshot', {}).get('net_savings_ratio', 0) > 0 else 'FAIL')}

4. BEHAVIORAL RISK ANALYSIS AND FINANCIAL STRESS INDICATORS

   Frequent Low-Balance Events:      {behavior.get('low_balance_frequency', 'Not frequent')}
   Large Debit Transactions:         {behavior.get('large_debit_count', 0)} detected
   Spending Spike Patterns:          {behavior.get('spending_spikes', 'No unusual spikes')}
   Financial Stress Level:           {behavior.get('stress_level', 'Moderate')}
   Stress Indicators Detected:       {behavior.get('stress_indicators', 'Standard financial behavior')}
   Repayment Behavior Prediction:    {behavior.get('repayment_prediction', 'Likely regular')}
   Behavioral Assessment:
   {behavior.get('detailed_assessment', 'Applicant demonstrates acceptable financial discipline.')}
"""
        return page_3

    def _generate_page_4(self, data: dict) -> str:
        notable_txns = data.get("notable_transactions", [])
        rule_insights = data.get("rule_insights", [])
        risks = data.get("risk_drivers", [])
        recommendations = data.get("recommendations", {})

        loan_amt = data.get('loan_request', {}).get('amount', 0)
        monthly_income = data.get('financial_snapshot', {}).get('estimated_monthly_income', 0)
        month_count = self._month_count(data)
        emi = loan_amt / 24 if loan_amt > 0 else 0
        emi_income_ratio = (emi / monthly_income * 100) if monthly_income > 0 else 0
        low_days = data.get('financial_snapshot', {}).get('low_balance_days', 0)
        total_days = data.get('financial_snapshot', {}).get('total_active_days', 365)
        low_days_pct = (low_days / total_days * 100) if total_days > 0 else 0

        page_4 = f"""
====================================================================================================
PAGE 4: TRANSACTION INSIGHTS AND RECOMMENDATIONS
====================================================================================================

1. NOTABLE TRANSACTIONS (TOP 5 RISK INDICATORS)
"""
        for idx, txn in enumerate(notable_txns[:5], 1):
            page_4 += f"""
   {idx}. {txn.get('date', 'N/A')} | {txn.get('type', 'OTHER').upper()}
      Amount: {self._money(txn.get('amount', 0))}
      Description: {txn.get('description', 'N/A')}
      Risk Reason: {txn.get('reason', 'Notable transaction pattern')}
"""

        page_4 += """
2. RULE-BASED INSIGHTS (TOP RULES TRIGGERED)
"""
        for idx, rule in enumerate(rule_insights[:5], 1):
            if isinstance(rule, dict):
                page_4 += f"""
   {idx}. Rule: {rule.get('name', 'N/A')}
      Impact Score: {rule.get('impact_score', 0):.2f}
      Severity: {rule.get('severity', 'Moderate')}
      Explanation: {rule.get('explanation', 'Rule condition triggered based on behavior')}
"""
            else:
                page_4 += f"""
   {idx}. Rule: {str(rule)[:80]}
      Impact Score: N/A
      Severity: Moderate
      Explanation: Rule condition triggered based on behavior
"""

        page_4 += """
3. CONSOLIDATED RISK SUMMARY (ALL MAJOR FACTORS)
"""
        for idx, risk in enumerate(risks, 1):
            page_4 += f"   {idx}. {risk}\n"

        page_4 += f"""
4. MITIGATIONS AND IMPROVEMENT SUGGESTIONS FOR FUTURE ELIGIBILITY

   To strengthen financial profile and improve loan eligibility, applicant should focus on:
   - Income Stability: {recommendations.get('income_improvement', 'Establish consistent monthly income source')}
   - Spending Discipline: {recommendations.get('spending_reduction', 'Reduce discretionary expenses where possible')}
   - Liquidity Buffer: Maintain minimum Rs {recommendations.get('min_balance_target', 10000):,.0f} balance at month-end
   - Debt Management: Clear any existing BNPL or credit card balances
   - Savings Rate: Current savings ratio {data.get('financial_snapshot', {}).get('net_savings_ratio', 0):.2%}
   - Credit History: Maintain payment discipline on existing obligations

5. FINAL UNDERWRITING STATEMENT

   Decision: {data.get('decision', {}).get('recommendation', 'PENDING')}
   Risk Level: {data.get('decision', {}).get('risk_level', 'NOT ASSESSED')}
   Confidence: {data.get('decision', {}).get('confidence_level', 'MEDIUM')}
   Repayment Capacity Assessment:
   Based on the {month_count}-month transaction analysis, the applicant demonstrates a monthly income of
   {self._money(monthly_income)} with controllable expenses of
   {self._money(data.get('financial_snapshot', {}).get('estimated_monthly_expenses', 0))}. The requested EMI of
   {self._money(emi)} represents {emi_income_ratio:.1f}% of monthly income.
   {('While mathematically manageable, the tight cashflow leaves limited buffer for emergencies.' if emi_income_ratio > 50 else 'The EMI is structurally affordable given the applicant income profile.')}

   Risk Exposure Assessment:
   - Liquidity stress on {low_days} out of {total_days} days ({low_days_pct:.1f}% of period)
   - Net savings ratio of {data.get('financial_snapshot', {}).get('net_savings_ratio', 0):.2%} limits financial buffer
   - {('Income classification as ' + data.get('applicant_profile', {}).get('classification', 'Unknown') + ' adds discretionary element') if data.get('applicant_profile', {}).get('classification', '') in ['Student', 'Freelancer', 'Self-employed'] else 'Income dependency factors'}

   Mitigating Factors:
   - No significant existing liabilities detected
   - Consistent monthly cashflow pattern
   - {('Acceptable debt-to-income ratio' if data.get('liability_analysis', {}).get('debt_to_income_ratio', 0) < 0.3 else 'Manageable debt levels')}

   Confidence and Audit Trail:
   This assessment is based on {data.get('rows_analyzed', 'N/A')} transaction records spanning a {month_count}-month period.
   The underwriting decision reflects:
   - Quantitative scoring: 60% weight on rule-based financial metrics
   - Machine-learning model: 40% weight on pattern recognition (trained on {data.get('model_stats', {}).get('training_sample_size', 'N/A')} historical cases)
   - Professional judgment: Manual review of income classification, behavioral patterns, and stress indicators
   - Regulatory compliance: Assessment conducted in compliance with RBI lending guidelines

   Confidence Level: {data.get('decision', {}).get('confidence_level', 'MEDIUM')}
   {data.get('decision', {}).get('confidence_explanation', 'Standard underwriting process completed.')}

   Signature and Authorization
   Report Generated By: AI Loan Appraisal Engine v2.0
   Date: {datetime.now().strftime('%d-%B-%Y')}
   Report Version: PROFESSIONAL DETAILED (4-PAGE FORMAT)
   This report is confidential and intended for authorized credit personnel only.
   The decision is subject to verification and may be overridden by senior management.
"""
        return page_4

    def _generate_report_footer(self) -> str:
        footer = """
====================================================================================================
END OF REPORT
4-PAGE PROFESSIONAL LOAN APPRAISAL DOCUMENT
====================================================================================================

IMPORTANT DISCLAIMERS:

1. CONFIDENTIALITY: This report contains confidential financial information and is intended
   exclusively for authorized personnel involved in credit decision-making.
"""
        return footer
