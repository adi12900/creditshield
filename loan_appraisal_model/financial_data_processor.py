"""
ROBUST FINANCIAL DATA PIPELINE
================================

Handles ANY CSV format with dynamic column detection.
Computes monthly metrics with strict validation.

Core Principle: "Correct computation must be independent of column names and data format"
"""

import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass, asdict
import re


@dataclass
class DetectedColumns:
    """Detected column mappings from CSV"""
    date_column: str
    credit_column: str
    debit_column: str
    balance_column: Optional[str] = None
    description_column: Optional[str] = None


@dataclass
class MonthlyMetric:
    """Single month's financial data"""
    month: str  # YYYY-MM format
    credit: float
    debit: float
    savings: float


@dataclass
class FinancialSummary:
    """Complete financial analysis"""
    total_credit: float
    total_debit: float
    total_savings: float
    num_months: int
    monthly_income: float
    monthly_expense: float
    monthly_savings: float
    date_range_start: str
    date_range_end: str


@dataclass
class ProcessingResult:
    """Complete processing result"""
    success: bool
    error_message: Optional[str]
    detected_columns: Optional[DetectedColumns]
    monthly_data: Optional[List[MonthlyMetric]]
    summary: Optional[FinancialSummary]
    validation_passed: bool


class FinancialDataProcessor:
    """
    STEP 0-10: Dynamic column detection, data cleaning, monthly aggregation.
    
    Strict validation at every stage.
    No assumptions about column names or format.
    """
    
    # Column name patterns for detection
    DATE_PATTERNS = ['date', 'txn_date', 'transaction_date', 'value_date', 'posting_date', 'tran_date']
    CREDIT_PATTERNS = ['credit', 'deposit', 'inflow', 'cr', 'amount_in', 'credit_amount', 'in_amount']
    DEBIT_PATTERNS = ['debit', 'withdrawal', 'outflow', 'dr', 'amount_out', 'debit_amount', 'out_amount']
    BALANCE_PATTERNS = ['balance', 'closing_balance', 'opening_balance', 'running_balance']
    DESCRIPTION_PATTERNS = ['details', 'narration', 'description', 'remarks', 'notes']
    
    def __init__(self, csv_path: str):
        """Initialize with CSV file path"""
        self.csv_path = csv_path
        self.df_raw = None
        self.df_clean = None
        self.detected_columns = None
        
    def process(self) -> ProcessingResult:
        """
        Main processing pipeline: STEP 0-10
        
        Returns ProcessingResult with all details or error.
        """
        try:
            # STEP 0: Load CSV
            self._load_csv()
            
            # STEP 0: Dynamic column detection
            self._detect_required_columns()
            if not self.detected_columns:
                return ProcessingResult(
                    success=False,
                    error_message="UNABLE TO DETECT REQUIRED COLUMNS",
                    detected_columns=None,
                    monthly_data=None,
                    summary=None,
                    validation_passed=False
                )
            
            # STEP 1: Data cleaning
            self._clean_data()
            
            # STEP 2: Date normalization
            self._normalize_dates()
            
            # STEP 3-5: Generate complete month range and group
            monthly_data_list = self._generate_monthly_aggregates()
            
            # STEP 6: Validate month-wise table
            if not monthly_data_list:
                return ProcessingResult(
                    success=False,
                    error_message="UNABLE TO GENERATE MONTHLY DATA",
                    detected_columns=self.detected_columns,
                    monthly_data=None,
                    summary=None,
                    validation_passed=False
                )
            
            # STEP 7: Compute correct monthly metrics
            summary = self._compute_monthly_metrics(monthly_data_list)
            
            # STEP 8: Consistency validation
            validation_result = self._validate_consistency(monthly_data_list, summary)
            if not validation_result["passed"]:
                return ProcessingResult(
                    success=False,
                    error_message=validation_result["error"],
                    detected_columns=self.detected_columns,
                    monthly_data=monthly_data_list,
                    summary=summary,
                    validation_passed=False
                )
            
            # STEP 9: Final savings validation
            savings_validation = self._validate_savings(monthly_data_list, summary)
            if not savings_validation["passed"]:
                return ProcessingResult(
                    success=False,
                    error_message=savings_validation["error"],
                    detected_columns=self.detected_columns,
                    monthly_data=monthly_data_list,
                    summary=summary,
                    validation_passed=False
                )
            
            # STEP 10: Return successful result
            return ProcessingResult(
                success=True,
                error_message=None,
                detected_columns=self.detected_columns,
                monthly_data=monthly_data_list,
                summary=summary,
                validation_passed=True
            )
            
        except Exception as e:
            return ProcessingResult(
                success=False,
                error_message=f"PROCESSING ERROR: {str(e)}",
                detected_columns=None,
                monthly_data=None,
                summary=None,
                validation_passed=False
            )
    
    def _load_csv(self) -> None:
        """Load CSV file with automatic type inference"""
        self.df_raw = pd.read_csv(self.csv_path)
        if self.df_raw.empty:
            raise ValueError("CSV file is empty")
    
    def _detect_required_columns(self) -> None:
        """
        STEP 0: Dynamic column detection
        
        Intelligently match columns to date, credit, debit.
        """
        columns_lower = {col.lower(): col for col in self.df_raw.columns}
        
        # Detect DATE column
        date_col = self._find_column_by_patterns(columns_lower, self.DATE_PATTERNS)
        if not date_col:
            date_col = self._detect_date_column_by_content()
        
        # Detect CREDIT column
        credit_col = self._find_column_by_patterns(columns_lower, self.CREDIT_PATTERNS)
        
        # Detect DEBIT column
        debit_col = self._find_column_by_patterns(columns_lower, self.DEBIT_PATTERNS)
        
        # Detect optional columns
        balance_col = self._find_column_by_patterns(columns_lower, self.BALANCE_PATTERNS)
        description_col = self._find_column_by_patterns(columns_lower, self.DESCRIPTION_PATTERNS)
        
        # All required columns must be detected
        if date_col and credit_col and debit_col:
            self.detected_columns = DetectedColumns(
                date_column=date_col,
                credit_column=credit_col,
                debit_column=debit_col,
                balance_column=balance_col,
                description_column=description_col
            )
    
    def _find_column_by_patterns(self, columns_lower: Dict[str, str], patterns: List[str]) -> Optional[str]:
        """Match column name against patterns"""
        for pattern in patterns:
            for col_lower, col_actual in columns_lower.items():
                if pattern.lower() in col_lower or col_lower == pattern.lower():
                    return col_actual
        return None

    def _column_looks_like_flag(self, series: pd.Series) -> bool:
        """Return True when a numeric column behaves like a marker column rather than money."""
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

        text_tokens = set(sample.unique())
        return text_tokens.issubset({"0", "1", "1.0", "0.0", "cr", "dr", "credit", "debit"})
    
    def _detect_date_column_by_content(self) -> Optional[str]:
        """Detect date column by parsing content"""
        for col in self.df_raw.columns:
            try:
                # Try to parse first non-null value as datetime
                sample = self.df_raw[col].dropna().iloc[0] if len(self.df_raw[col].dropna()) > 0 else None
                if sample:
                    pd.to_datetime(sample)
                    return col
            except:
                pass
        return None
    
    def _detect_numeric_column_by_content(self, column_type: str) -> Optional[str]:
        """
        Detect numeric columns.
        column_type: "positive" for credit, "outflow" for debit inferred from remaining columns
        """
        # Get numeric columns
        numeric_cols = self.df_raw.select_dtypes(include=[np.number]).columns.tolist()
        
        # Remove already detected columns (date, balance, description)
        if self.detected_columns:
            if self.detected_columns.date_column in numeric_cols:
                numeric_cols.remove(self.detected_columns.date_column)
            if self.detected_columns.balance_column and self.detected_columns.balance_column in numeric_cols:
                numeric_cols.remove(self.detected_columns.balance_column)
        
        if numeric_cols:
            return numeric_cols[0]
        
        return None
    
    def _clean_data(self) -> None:
        """
        STEP 1: Data cleaning
        
        Convert to numeric, handle nulls, blanks, commas.
        Treats "-" as null/zero.
        """
        # Create working copy
        self.df_clean = self.df_raw.copy()

        # Replace dash markers and normalise raw values first.
        credit_raw = self.df_clean[self.detected_columns.credit_column].replace('-', pd.NA)
        debit_raw = self.df_clean[self.detected_columns.debit_column].replace('-', pd.NA)
        balance_raw = None
        if self.detected_columns.balance_column:
            balance_raw = self.df_clean[self.detected_columns.balance_column].replace('-', pd.NA)

        credit_numeric = pd.to_numeric(
            credit_raw.astype(str).str.replace(',', '', regex=False),
            errors='coerce'
        ).fillna(0.0)
        debit_numeric = pd.to_numeric(
            debit_raw.astype(str).str.replace(',', '', regex=False),
            errors='coerce'
        ).fillna(0.0)

        self.df_clean[self.detected_columns.credit_column] = credit_numeric.clip(lower=0)
        self.df_clean[self.detected_columns.debit_column] = debit_numeric.clip(lower=0)

        flag_style = bool(self.detected_columns.balance_column) and (
            self._column_looks_like_flag(self.df_raw[self.detected_columns.credit_column])
            or self._column_looks_like_flag(self.df_raw[self.detected_columns.debit_column])
        )

        # Some bank exports store debit/credit as 1/blank markers and the true amount is
        # only visible in the balance movement. Reconstruct transaction value from balance
        # deltas in that case so downstream monthly totals are not just row counts.
        if flag_style and balance_raw is not None:
            balance_numeric = pd.to_numeric(
                balance_raw.astype(str).str.replace(',', '', regex=False),
                errors='coerce'
            ).fillna(method='ffill').fillna(0.0)
            balance_delta = balance_numeric.diff().fillna(0.0)
            derived_amount = balance_delta.abs().round(2)

            debit_mark = debit_numeric > 0
            credit_mark = credit_numeric > 0
            inferred_debit = debit_mark | (~credit_mark & (balance_delta < 0))
            inferred_credit = credit_mark | (~debit_mark & (balance_delta > 0))

            reconstructed_debit = pd.Series(0.0, index=self.df_clean.index)
            reconstructed_credit = pd.Series(0.0, index=self.df_clean.index)
            reconstructed_debit.loc[inferred_debit] = derived_amount.loc[inferred_debit]
            reconstructed_credit.loc[inferred_credit] = derived_amount.loc[inferred_credit]

            # Preserve any explicit non-flag amount if it is larger than the balance delta.
            reconstructed_debit = pd.concat([reconstructed_debit, debit_numeric], axis=1).max(axis=1)
            reconstructed_credit = pd.concat([reconstructed_credit, credit_numeric], axis=1).max(axis=1)

            self.df_clean[self.detected_columns.debit_column] = reconstructed_debit.clip(lower=0).round(2)
            self.df_clean[self.detected_columns.credit_column] = reconstructed_credit.clip(lower=0).round(2)
        else:
            self.df_clean[self.detected_columns.credit_column] = self.df_clean[self.detected_columns.credit_column].clip(lower=0)
            self.df_clean[self.detected_columns.debit_column] = self.df_clean[self.detected_columns.debit_column].clip(lower=0)
    
    def _normalize_dates(self) -> None:
        """
        STEP 2: Date normalization
        
        Convert to datetime, extract YYYY-MM month format.
        """
        self.df_clean[self.detected_columns.date_column] = pd.to_datetime(
            self.df_clean[self.detected_columns.date_column],
            errors='coerce',
            dayfirst=True
        )
        
        # Remove rows with invalid dates
        self.df_clean = self.df_clean.dropna(subset=[self.detected_columns.date_column])
        
        # Extract month in YYYY-MM format
        self.df_clean['month'] = self.df_clean[self.detected_columns.date_column].dt.strftime('%Y-%m')
    
    def _generate_monthly_aggregates(self) -> List[MonthlyMetric]:
        """
        STEP 3-5: Generate complete month range and group
        
        Include all months from start to end, even if empty.
        """
        # STEP 3: Find date range
        dates = pd.to_datetime(self.df_clean[self.detected_columns.date_column])
        start_month = dates.min()
        end_month = dates.max()
        
        # Generate all months in range
        all_months = pd.date_range(
            start=start_month.replace(day=1),
            end=end_month,
            freq='MS'
        ).strftime('%Y-%m')
        
        # STEP 4: Group by month using integer cents to avoid floating-point drift.
        work = self.df_clean.copy()
        work['_credit_cents'] = (pd.to_numeric(work[self.detected_columns.credit_column], errors='coerce').fillna(0.0) * 100).round().astype('int64')
        work['_debit_cents'] = (pd.to_numeric(work[self.detected_columns.debit_column], errors='coerce').fillna(0.0) * 100).round().astype('int64')

        grouped = work.groupby('month').agg({
            '_credit_cents': 'sum',
            '_debit_cents': 'sum'
        }).reset_index()

        grouped.columns = ['month', 'credit_cents', 'debit_cents']
        
        # STEP 5: Merge with all_months (include zero months)
        all_months_df = pd.DataFrame({'month': all_months})
        final_monthly = all_months_df.merge(grouped, on='month', how='left').fillna(0)
        
        # Compute savings for each month
        final_monthly['credit'] = final_monthly['credit_cents'] / 100.0
        final_monthly['debit'] = final_monthly['debit_cents'] / 100.0
        final_monthly['savings'] = final_monthly['credit'] - final_monthly['debit']
        
        # Convert to MonthlyMetric objects
        monthly_data_list = [
            MonthlyMetric(
                month=row['month'],
                credit=float(row['credit']),
                debit=float(row['debit']),
                savings=float(row['savings'])
            )
            for _, row in final_monthly.iterrows()
        ]
        
        return monthly_data_list
    
    def _compute_monthly_metrics(self, monthly_data_list: List[MonthlyMetric]) -> FinancialSummary:
        """
        STEP 7: Correct monthly metrics
        
        Divide totals by number of months (NOT just active months).
        """
        months_data = pd.DataFrame([asdict(m) for m in monthly_data_list])

        total_credit_cents = int(round(months_data['credit'].sum() * 100))
        total_debit_cents = int(round(months_data['debit'].sum() * 100))
        total_savings_cents = total_credit_cents - total_debit_cents
        num_months = len(monthly_data_list)

        monthly_income = (total_credit_cents / 100.0) / num_months if num_months > 0 else 0
        monthly_expense = (total_debit_cents / 100.0) / num_months if num_months > 0 else 0
        monthly_savings = monthly_income - monthly_expense
        
        date_range_start = monthly_data_list[0].month if monthly_data_list else None
        date_range_end = monthly_data_list[-1].month if monthly_data_list else None
        
        return FinancialSummary(
            total_credit=total_credit_cents / 100.0,
            total_debit=total_debit_cents / 100.0,
            total_savings=total_savings_cents / 100.0,
            num_months=num_months,
            monthly_income=monthly_income,
            monthly_expense=monthly_expense,
            monthly_savings=monthly_savings,
            date_range_start=date_range_start,
            date_range_end=date_range_end
        )
    
    def _validate_consistency(self, monthly_data_list: List[MonthlyMetric], summary: FinancialSummary) -> Dict[str, Any]:
        """
        STEP 8: Consistency validation
        
        Check: monthly_income × num_months ≈ total_credit
        Check: monthly_expense × num_months ≈ total_debit
        """
        # Enforce exact currency precision at the cent level. No percentage tolerance.
        total_credit_cents = int(round(summary.total_credit * 100))
        total_debit_cents = int(round(summary.total_debit * 100))
        calc_credit_cents = int(round(summary.monthly_income * summary.num_months * 100))
        calc_debit_cents = int(round(summary.monthly_expense * summary.num_months * 100))

        credit_error_cents = abs(calc_credit_cents - total_credit_cents)
        debit_error_cents = abs(calc_debit_cents - total_debit_cents)

        if credit_error_cents != 0 or debit_error_cents != 0:
            return {
                "passed": False,
                "error": (
                    "MONTHLY AGGREGATION ERROR: "
                    f"Credit mismatch Rs {credit_error_cents / 100:.2f}, "
                    f"Debit mismatch Rs {debit_error_cents / 100:.2f}"
                )
            }
        
        return {"passed": True, "error": None}
    
    def _validate_savings(self, monthly_data_list: List[MonthlyMetric], summary: FinancialSummary) -> Dict[str, Any]:
        """
        STEP 9: Final savings validation
        
        Check: monthly_savings × num_months ≈ annual_savings
        """
        total_savings_cents = int(round((summary.total_credit - summary.total_debit) * 100))
        calc_savings_cents = int(round(summary.monthly_savings * summary.num_months * 100))
        error_cents = abs(calc_savings_cents - total_savings_cents)

        if error_cents != 0:
            return {
                "passed": False,
                "error": f"SAVINGS VALIDATION ERROR: Mismatch Rs {error_cents / 100:.2f}"
            }
        
        return {"passed": True, "error": None}


def print_processing_result(result: ProcessingResult) -> None:
    """Pretty print processing result"""
    print("\n" + "="*70)
    print("FINANCIAL DATA PROCESSING RESULT")
    print("="*70)
    
    if not result.success:
        print(f"❌ ERROR: {result.error_message}")
        return
    
    print(f"✔ PROCESSING SUCCESSFUL")
    print()
    
    # Detected columns
    print("1. DETECTED COLUMNS:")
    print(f"   Date: {result.detected_columns.date_column}")
    print(f"   Credit (Inflow): {result.detected_columns.credit_column}")
    print(f"   Debit (Outflow): {result.detected_columns.debit_column}")
    if result.detected_columns.balance_column:
        print(f"   Balance: {result.detected_columns.balance_column}")
    if result.detected_columns.description_column:
        print(f"   Description: {result.detected_columns.description_column}")
    print()
    
    # Month-wise table
    print("2. MONTH-WISE TABLE:")
    print(f"{'Month':<12} {'Credit (Rs)':>15} {'Debit (Rs)':>15} {'Savings (Rs)':>15}")
    print("-" * 60)
    for metric in result.monthly_data:
        print(f"{metric.month:<12} {metric.credit:>15,.2f} {metric.debit:>15,.2f} {metric.savings:>15,.2f}")
    print()
    
    # Summary
    print("3. FINANCIAL SUMMARY:")
    s = result.summary
    print(f"   Date Range: {s.date_range_start} to {s.date_range_end}")
    print(f"   Total Credit: Rs {s.total_credit:,.2f}")
    print(f"   Total Debit: Rs {s.total_debit:,.2f}")
    print(f"   Total Savings: Rs {s.total_savings:,.2f}")
    print(f"   Number of Months: {s.num_months}")
    print(f"   Monthly Income: Rs {s.monthly_income:,.2f}")
    print(f"   Monthly Expense: Rs {s.monthly_expense:,.2f}")
    print(f"   Monthly Savings: Rs {s.monthly_savings:,.2f}")
    print()
    
    # Validation status
    print("4. VALIDATION STATUS:")
    print(f"   {'✔ PASSED' if result.validation_passed else '❌ FAILED'}")
    print()
    print("="*70)


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python financial_data_processor.py <csv_file>")
        sys.exit(1)
    
    csv_file = sys.argv[1]
    processor = FinancialDataProcessor(csv_file)
    result = processor.process()
    print_processing_result(result)
