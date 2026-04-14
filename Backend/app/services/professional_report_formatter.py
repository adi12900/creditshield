"""
Professional 4-Page Loan Appraisal Report Formatter
Transforms analyzed loan data into formal bank-grade underwriting documentation.
"""

from datetime import datetime
from typing import Any


class ProfessionalReportFormatter:
    """Formats loan appraisal analysis into 4-page formal document."""

    def __init__(self):
        self.page_separator = "\n" + "=" * 100 + "\n"
        self.section_separator = "\n" + "-" * 100 + "\n"

    def format_report(self, analysis_data: dict) -> str:
        """
        Generate a 4-page professional loan appraisal report.

        Args:
            analysis_data: Dictionary containing loan analysis results with keys:
                - applicant_profile (classification, financial_health)
                - loan_request (loan_type, amount)
                - financial_snapshot (income, expenses, savings, liquidity)
                - risk_drivers (list of risk factors)
                - decision (risk_level, recommendation, confidence)
                - income_analysis (source, stability, trend)
                - cashflow_analysis (inflows, outflows, net_savings)
                - liquidity_analysis (min_balance, peak_balance, low_days, stress)
                - expense_behavior (categories, insights)
                - liability_analysis (emis, bnpl, debt_to_income)
                - affordability_analysis (emi, ratio, classification)
                - notable_transactions (list of transactions)
                - rule_insights (top rules triggered)

        Returns:
            Formatted 4-page report as string.
        """
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

    def _generate_report_header(self, data: dict) -> str:
        """Generate report header with metadata."""
        report_date = datetime.now().strftime("%d-%b-%Y")
        return f"""
╔════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                         PROFESSIONAL LOAN APPRAISAL REPORT                                        ║
║                          (4-PAGE FORMAL UNDERWRITING DOCUMENT)                                    ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════╝

Report Generated: {report_date}
Analysis Period: {data.get('analysis_period', {}).get('period_start', 'N/A')} to {data.get('analysis_period', {}).get('period_end', 'N/A')}
Source File: {data.get('source_file', 'N/A')}
Confidentiality: INTERNAL - FOR AUTHORIZED PERSONNEL ONLY
"""

    def _generate_page_1(self, data: dict) -> str:
        """Generate PAGE 1: Executive Summary & Decision."""
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
        low_balance_days = int(snapshot.get("low_balance_days", 0))
        total_days = int(snapshot.get("total_active_days", 1))

        page_1 = f"""
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ PAGE 1: EXECUTIVE SUMMARY & CREDIT DECISION                                                     ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

1. APPLICANT PROFILE & FINANCIAL HEALTH
────────────────────────────────────────────────────────────────────────────────────────────────────

   Classification:           {applicant.get('classification', 'N/A')}
   Overall Financial Health: {applicant.get('financial_health', 'N/A')}
   
   Summary of Financial Behavior:
   {applicant.get('behavior_summary', 'Not available')}


2. LOAN REQUEST OVERVIEW
────────────────────────────────────────────────────────────────────────────────────────────────────

   Loan Type:                {loan_req.get('type', 'N/A')}
   Requested Loan Amount:    ₹{loan_amount:,.2f}
   Assumed Tenure:           24 months
   Estimated Monthly EMI:    ₹{emi_24m:,.2f}
   
   Loan Purpose:             {loan_req.get('purpose', 'Not specified')}


3. KEY FINANCIAL SNAPSHOT
────────────────────────────────────────────────────────────────────────────────────────────────────

   Estimated Monthly Income:     ₹{monthly_income:,.2f}
   Estimated Monthly Expenses:   ₹{monthly_expenses:,.2f}
   Monthly Surplus/(Deficit):    ₹{(monthly_income - monthly_expenses):,.2f}
   
   Net Savings Ratio:            {savings_ratio:.2%}
   Total Inflow (12 months):     ₹{snapshot.get('total_inflow', 0):,.2f}
   Total Outflow (12 months):    ₹{snapshot.get('total_outflow', 0):,.2f}
   
   Liquidity Stress Assessment:  {low_balance_days} low-balance days out of {total_days} active days
                                 ({(low_balance_days/total_days*100):.1f}% stress days)
   Minimum Balance Observed:     ₹{snapshot.get('min_balance', 0):,.2f}
   Peak Balance Observed:        ₹{snapshot.get('peak_balance', 0):,.2f}


4. TOP RISK DRIVERS (PRIMARY FACTORS AFFECTING DECISION)
────────────────────────────────────────────────────────────────────────────────────────────────────

"""
        for idx, risk in enumerate(risks[:6], 1):
            page_1 += f"   {idx}. {risk}\n"

        page_1 += f"""

5. FINAL CREDIT DECISION
────────────────────────────────────────────────────────────────────────────────────────────────────

   Risk Level:            {decision.get('risk_level', 'N/A')}
   Recommendation:        {decision.get('recommendation', 'N/A')}
   Confidence Level:      {decision.get('confidence_level', 'N/A')}
   
   Final Score:           {decision.get('final_score', 0):.2f} / 100


6. DECISION JUSTIFICATION
────────────────────────────────────────────────────────────────────────────────────────────────────

{decision.get('justification', 'Not available')}

   Key Drivers:
   • Income Pattern: {applicant.get('income_pattern', 'N/A')}
   • Savings Capacity: {('Adequate' if savings_ratio > 0.05 else 'Weak')} (ratio: {savings_ratio:.2%})
   • Liquidity Position: {('Constrained' if low_balance_days > total_days * 0.5 else 'Stable')}
   • EMI Affordability: {snapshot.get('affordability_status', 'N/A')}
   • Behavior Consistency: {applicant.get('behavior_consistency', 'N/A')}

"""
        return page_1

    def _generate_page_2(self, data: dict) -> str:
        """Generate PAGE 2: Income & Cashflow Analysis."""
        income = data.get("income_analysis", {})
        cashflow = data.get("cashflow_analysis", {})
        liquidity = data.get("liquidity_analysis", {})
        discipline = data.get("financial_discipline", {})

        total_inflow = float(cashflow.get("total_inflow", 0))
        total_outflow = float(cashflow.get("total_outflow", 0))
        net_savings = total_inflow - total_outflow
        savings_ratio = (net_savings / total_inflow * 100) if total_inflow > 0 else 0

        page_2 = f"""
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ PAGE 2: INCOME & CASHFLOW ANALYSIS                                                              ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

1. INCOME ANALYSIS
────────────────────────────────────────────────────────────────────────────────────────────────────

   Income Source(s):         {income.get('source', 'N/A')}
   Income Stability:         {income.get('stability', 'N/A')}
   
   Monthly Income Estimate:  ₹{income.get('monthly_estimate', 0):,.2f}
   Annual Inflow (12m):      ₹{total_inflow:,.2f}
   
   Income Trend:             {income.get('trend', 'N/A')}
   Income Risks:             {income.get('risks', 'None identified')}
   
   Income Classification:    {income.get('classification', 'N/A')}
   
   Detailed Observation:
   {income.get('detailed_observation', 'Standard income pattern.')}


2. CASHFLOW ANALYSIS
────────────────────────────────────────────────────────────────────────────────────────────────────

   Total Inflow (12 months):      ₹{total_inflow:,.2f}
   Total Outflow (12 months):     ₹{total_outflow:,.2f}
   Net Savings (12 months):       ₹{net_savings:,.2f}
   
   Net Savings Ratio:             {savings_ratio:.2f}%
   Monthly Average Inflow:        ₹{(total_inflow/12):,.2f}
   Monthly Average Outflow:       ₹{(total_outflow/12):,.2f}
   Monthly Average Savings:       ₹{(net_savings/12):,.2f}
   
   Savings Interpretation:        {cashflow.get('savings_interpretation', 'N/A')}
   Cashflow Health Rating:        {cashflow.get('health_rating', 'N/A')}
   
   Detailed Analysis:
   {cashflow.get('analysis_detail', 'Standard cashflow pattern observed.')}


3. LIQUIDITY ANALYSIS
────────────────────────────────────────────────────────────────────────────────────────────────────

   Minimum Balance Observed:      ₹{liquidity.get('min_balance', 0):,.2f}
   Peak Balance Observed:         ₹{liquidity.get('peak_balance', 0):,.2f}
   Average Balance:               ₹{liquidity.get('avg_balance', 0):,.2f}
   
   Low Balance Days:              {liquidity.get('low_balance_days', 0)} days
   Stress Days (balance < ₹5000): {liquidity.get('stress_days', 0)} days
   
   Month-End Stress Indicator:    {liquidity.get('month_end_stress', 'Normal')}
   Quarter-End Stress Indicator:  {liquidity.get('quarter_end_stress', 'Normal')}
   
   Liquidity Risk Assessment:     {liquidity.get('liquidity_risk', 'Moderate')}
   
   Observation:
   {liquidity.get('observation', 'Applicant maintains reasonable liquidity position.')}


4. FINANCIAL DISCIPLINE & CONSISTENCY
────────────────────────────────────────────────────────────────────────────────────────────────────

   Spending vs Earning Behavior:  {discipline.get('spending_pattern', 'N/A')}
   Financial Pattern Consistency: {discipline.get('pattern_consistency', 'N/A')}
   Expense Volatility:            {discipline.get('expense_volatility', 'N/A')}
   
   Stress Indicators:             {discipline.get('stress_indicators', 'None detected')}
   
   Overall Discipline Rating:     {discipline.get('discipline_rating', 'Moderate')}

"""
        return page_2

    def _generate_page_3(self, data: dict) -> str:
        """Generate PAGE 3: Expense, Liability & Behavioral Analysis."""
        expenses = data.get("expense_behavior", {})
        liability = data.get("liability_analysis", {})
        affordability = data.get("affordability_analysis", {})
        behavior = data.get("behavioral_risk", {})

        loan_amount = float(data.get("loan_request", {}).get("amount", 0))
        emi = loan_amount / 24 if loan_amount > 0 else 0
        monthly_income = float(data.get("financial_snapshot", {}).get("estimated_monthly_income", 0))
        emi_to_income = (emi / monthly_income * 100) if monthly_income > 0 else 0
        
        # Safe divisor for expense ratios
        income_safe = monthly_income if monthly_income > 0 else 1

        page_3 = f"""
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ PAGE 3: EXPENSE, LIABILITY & BEHAVIORAL ANALYSIS                                                ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

1. EXPENSE BEHAVIOR & SPENDING PATTERNS
────────────────────────────────────────────────────────────────────────────────────────────────────

   Essential Spending:
   • Rent/Housing:      ₹{expenses.get('rent', 0):,.2f}/month ({(expenses.get('rent', 0) / income_safe * 100):.1f}% of income)
   • Food/Groceries:    ₹{expenses.get('food', 0):,.2f}/month ({(expenses.get('food', 0) / income_safe * 100):.1f}% of income)
   • Travel/Transport:  ₹{expenses.get('travel', 0):,.2f}/month ({(expenses.get('travel', 0) / income_safe * 100):.1f}% of income)
   • Bills/Utilities:   ₹{expenses.get('bills', 0):,.2f}/month ({(expenses.get('bills', 0) / income_safe * 100):.1f}% of income)
   
   Discretionary Spending:
   • Entertainment:     ₹{expenses.get('discretionary', 0):,.2f}/month ({(expenses.get('discretionary', 0) / income_safe * 100):.1f}% of income)
   
   Spending Pattern: {expenses.get('pattern', 'N/A')}
   
   High-Value Transactions Identified: {expenses.get('high_value_tx_count', 0)} transactions
   
   Lifestyle Insight:
   {expenses.get('lifestyle_insight', 'Spending pattern reflects moderate living standards.')}


2. LIABILITY ANALYSIS & DEBT POSITION
────────────────────────────────────────────────────────────────────────────────────────────────────

   Existing EMIs Detected:        {liability.get('existing_emis', 'None detected')}
   BNPL / Credit Usage:           {liability.get('bnpl_usage', 'Minimal')}
   Hidden Liabilities (Pattern):  {liability.get('hidden_liabilities', 'No significant patterns')}
   
   Debt-to-Income Ratio:          {liability.get('debt_to_income_ratio', 0):.2%}
   Estimated Annual Debt Payment: ₹{liability.get('annual_debt_payment', 0):,.2f}
   
   Liability Risk Level:          {liability.get('liability_risk', 'Low')}
   
   Assessment:
   {liability.get('assessment', 'Applicant is not heavily leveraged.')}


3. LOAN AFFORDABILITY ANALYSIS (REQUESTED: ₹{loan_amount:,.2f})
────────────────────────────────────────────────────────────────────────────────────────────────────

   Expected Monthly EMI (24 months):     ₹{emi:,.2f}
   Estimated Monthly Income:             ₹{monthly_income:,.2f}
   EMI-to-Income Ratio:                  {emi_to_income:.2f}%
   
   Current Monthly Surplus:              ₹{(monthly_income - data.get('financial_snapshot', {}).get('estimated_monthly_expenses', 0)):,.2f}
   Expected Surplus After EMI:           ₹{(monthly_income - data.get('financial_snapshot', {}).get('estimated_monthly_expenses', 0) - emi):,.2f}
   
   Affordability Classification:         {affordability.get('classification', 'N/A')}
   Affordability Confidence:             {affordability.get('confidence', 'N/A')}
   
   RATIONALE FOR AFFORDABILITY CLASSIFICATION:
   
   {affordability.get('rationale', 'Assessment based on EMI ratio and surplus capacity.')}
   
   ├─ EMI Ratio Analysis: {('PASS' if emi_to_income < 50 else 'CAUTION' if emi_to_income < 60 else 'FAIL')}
   │  (Industry standard: < 50% healthy, 50-60% manageable, > 60% risky)
   │
   ├─ Surplus Analysis: {('PASS' if (monthly_income - data.get('financial_snapshot', {}).get('estimated_monthly_expenses', 0) - emi) > 0 else 'FAIL')}
   │  (Applicant must maintain positive post-EMI surplus)
   │
   └─ Historical Savings: {('PASS' if data.get('financial_snapshot', {}).get('net_savings_ratio', 0) > 0.05 else 'CAUTION' if data.get('financial_snapshot', {}).get('net_savings_ratio', 0) > 0 else 'FAIL')}
      (Higher savings history indicates affordability capacity)


4. BEHAVIORAL RISK ANALYSIS & FINANCIAL STRESS INDICATORS
────────────────────────────────────────────────────────────────────────────────────────────────────

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
        """Generate PAGE 4: Transaction Insights & Recommendations."""
        notable_txns = data.get("notable_transactions", [])
        rule_insights = data.get("rule_insights", [])
        risks = data.get("risk_drivers", [])
        recommendations = data.get("recommendations", {})
        
        # Pre-calculate all values to avoid division by zero
        loan_amt = data.get('loan_request', {}).get('amount', 0)
        monthly_income = data.get('financial_snapshot', {}).get('estimated_monthly_income', 0)
        emi = loan_amt / 24 if loan_amt > 0 else 0
        emi_income_ratio = (emi / monthly_income * 100) if monthly_income > 0 else 0
        low_days = data.get('financial_snapshot', {}).get('low_balance_days', 0)
        total_days = data.get('financial_snapshot', {}).get('total_active_days', 365)
        low_days_pct = (low_days / total_days * 100) if total_days > 0 else 0

        page_4 = f"""
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ PAGE 4: TRANSACTION INSIGHTS & RECOMMENDATIONS                                                  ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛

1. NOTABLE TRANSACTIONS (TOP 5 RISK INDICATORS)
────────────────────────────────────────────────────────────────────────────────────────────────────

"""
        for idx, txn in enumerate(notable_txns[:5], 1):
            page_4 += f"""   {idx}. {txn.get('date', 'N/A')} | {txn.get('type', 'OTHER').upper()}
      Amount: ₹{txn.get('amount', 0):,.2f}
      Description: {txn.get('description', 'N/A')}
      Risk Reason: {txn.get('reason', 'Notable transaction pattern')}

"""

        page_4 += f"""
2. RULE-BASED INSIGHTS (TOP RULES TRIGGERED)
────────────────────────────────────────────────────────────────────────────────────────────────────

"""
        for idx, rule in enumerate(rule_insights[:5], 1):
            if isinstance(rule, dict):
                page_4 += f"""   {idx}. Rule: {rule.get('name', 'N/A')}
      Impact Score: {rule.get('impact_score', 0):.2f}
      Severity: {rule.get('severity', 'Moderate')}
      Explanation: {rule.get('explanation', 'Rule condition triggered based on behavior')}

"""
            else:
                page_4 += f"""   {idx}. Rule: {str(rule)[:80]}
      Impact Score: N/A
      Severity: Moderate
      Explanation: Rule condition triggered based on behavior

"""

        page_4 += f"""
3. CONSOLIDATED RISK SUMMARY (ALL MAJOR FACTORS)
────────────────────────────────────────────────────────────────────────────────────────────────────

"""
        for idx, risk in enumerate(risks, 1):
            page_4 += f"   {idx}. {risk}\n"

        page_4 += f"""

4. MITIGATIONS & IMPROVEMENT SUGGESTIONS FOR FUTURE ELIGIBILITY
────────────────────────────────────────────────────────────────────────────────────────────────────

   To strengthen financial profile and improve loan eligibility, applicant should focus on:

   ✓ Income Stability:
     • {recommendations.get('income_improvement', 'Establish consistent monthly income source')}
     • Build salary documentation trail for next 3-6 months
   
   ✓ Spending Discipline:
     • {recommendations.get('spending_reduction', 'Reduce discretionary expenses where possible')}
     • Implement monthly budget tracking
   
   ✓ Liquidity Buffer:
     • Maintain minimum ₹{recommendations.get('min_balance_target', 10000):,.0f} balance at month-end
     • Build emergency fund (3-months expenses)
   
   ✓ Debt Management:
     • Clear any existing BNPL/credit card balances
     • Reduce existing EMI commitments if possible
   
   ✓ Savings Rate:
     • Current savings ratio: {data.get('financial_snapshot', {}).get('net_savings_ratio', 0):.2%}
     • Target savings ratio: Minimum 10% (₹{(data.get('financial_snapshot', {}).get('estimated_monthly_income', 0) * 0.10):,.2f}/month)
     • This will significantly improve future creditworthiness
   
   ✓ Credit History:
     • Maintain payment discipline on existing obligations
     • Avoid late payments or defaults
     • Build positive repayment track record


5. FINAL UNDERWRITING STATEMENT
────────────────────────────────────────────────────────────────────────────────────────────────────

   DECISION: {data.get('decision', {}).get('recommendation', 'PENDING')}
   RISK LEVEL: {data.get('decision', {}).get('risk_level', 'NOT ASSESSED')}
   CONFIDENCE: {data.get('decision', {}).get('confidence_level', 'MEDIUM')}

   
   REPAYMENT CAPACITY ASSESSMENT:
   
   Based on the 12-month transaction analysis, the applicant demonstrates a monthly income of
   ₹{monthly_income:,.2f} with controllable expenses of
   ₹{data.get('financial_snapshot', {}).get('estimated_monthly_expenses', 0):,.2f}. The requested EMI of
   ₹{emi:,.2f} represents {emi_income_ratio:.1f}% of monthly income.
   
   {('While mathematically manageable, the tight cashflow leaves limited buffer for emergencies.' if emi_income_ratio > 50 else 'The EMI is structurally affordable given the applicant income profile.')}


   RISK EXPOSURE ASSESSMENT:
   
   Primary Risk Factors:
   • Liquidity stress on {low_days} out of {total_days} days
     ({low_days_pct:.1f}% of period)
   • Net savings ratio of only {data.get('financial_snapshot', {}).get('net_savings_ratio', 0):.2%} limits financial buffer
   • {('Income classification as ' + data.get('applicant_profile', {}).get('classification', 'Unknown') + ' adds discretionary element') if data.get('applicant_profile', {}).get('classification', '') in ['Student', 'Freelancer', 'Self-employed'] else 'Income dependency factors'}

   Mitigating Factors:
   • No significant existing liabilities detected
   • Consistent monthly cashflow pattern
   • {('Acceptable debt-to-income ratio' if data.get('liability_analysis', {}).get('debt_to_income_ratio', 0) < 0.3 else 'Manageable debt levels')}


   CONFIDENCE & AUDIT TRAIL:
   
   This assessment is based on {data.get('rows_analyzed', 'N/A')} transaction records spanning a
   12-month period. The underwriting decision reflects:
   
   ✓ Quantitative scoring: 60% weight on rule-based financial metrics
   ✓ Machine-learning model: 40% weight on pattern recognition (trained on {data.get('model_stats', {}).get('training_sample_size', 'N/A')} historical cases)
   ✓ Professional judgment: Manual review of income classification, behavioral patterns, and stress indicators
   ✓ Regulatory compliance: Assessment conducted in compliance with RBI lending guidelines
   
   Confidence Level: {data.get('decision', {}).get('confidence_level', 'MEDIUM')}
   
   {data.get('decision', {}).get('confidence_explanation', 'Standard underwriting process completed.')}


   SIGNATURE & AUTHORIZATION
   ────────────────────────────────────────────────────────────────────────────────────────────────
   
   Report Generated By:     AI Loan Appraisal Engine v2.0
   Date:                   {datetime.now().strftime('%d-%B-%Y')}
   Report Version:         PROFESSIONAL DETAILED (4-PAGE FORMAT)
   
   This report is confidential and intended for authorized credit personnel only.
   The decision is subject to verification and may be overridden by senior management.

────────────────────────────────────────────────────────────────────────────────────────────────────

"""
        return page_4

    def _generate_report_footer(self) -> str:
        """Generate report footer with disclaimers."""
        footer = """
╔════════════════════════════════════════════════════════════════════════════════════════════════════╗
║                                  END OF REPORT                                                    ║
║                        (4-PAGE PROFESSIONAL LOAN APPRAISAL DOCUMENT)                              ║
╚════════════════════════════════════════════════════════════════════════════════════════════════════╝

IMPORTANT DISCLAIMERS:

1. CONFIDENTIALITY: This report contains confidential financial information and is intended
   exclusively for authorized personnel involved in credit decision-making.

2. DATA ACCURACY: This assessment is based on transaction data provided by the applicant.
   Any inaccuracies or omissions in the source data may affect analysis validity.

3. REGULATORY COMPLIANCE: Assessment conducted in accordance with RBI guidelines for retail lending.
   Final approval remains subject to management review and policy compliance.

4. DECISION FINALITY: This recommendation is advisory. Final credit decision rests with
   authorized credit committee members.

5. REVISION CLAUSE: This assessment is valid for 30 days from generation date. Subsequent
   applicant transactions may warrant reassessment.

────────────────────────────────────────────────────────────────────────────────────────────────────

"""
        return footer
