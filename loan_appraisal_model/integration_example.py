#!/usr/bin/env python3
"""
INTEGRATION EXAMPLE: Financial Data Processor + Loan Appraisal Engine

This example demonstrates how to:
1. Process raw bank statement CSVs (ANY format)
2. Validate financial metrics
3. Pass to loan appraisal engine

Core Principle: CSV format doesn't matter.
                Column names don't matter.
                Data cleaning and validation happen automatically.
"""

import sys
import json
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from financial_data_processor import FinancialDataProcessor, ProcessingResult, print_processing_result


def integrate_financial_processor_with_appraisal(csv_path: str, borrower_id: str) -> dict:
    """
    End-to-end integration: CSV → Validated Metrics → Appraisal Payload
    
    Args:
        csv_path: Path to bank statement CSV (any format)
        borrower_id: Unique borrower identifier
        
    Returns:
        dict: Validated payload ready for loan_appraisal_engine with all required fields
        
    Raises:
        ValueError: If CSV processing or validation fails
    """
    
    # STEP 1: Process raw CSV with automatic column detection
    print(f"\n[STEP 1] Processing CSV: {csv_path}")
    processor = FinancialDataProcessor(csv_path)
    result = processor.process()
    
    # STEP 2: Validate processing succeeded
    if not result.success:
        error_msg = f"CSV Processing Failed: {result.error_message}"
        print(f"❌ {error_msg}")
        raise ValueError(error_msg)
    
    print(f"✔ CSV processed successfully")
    print(f"  Detected columns: date={result.detected_columns.date_column}, "
          f"credit={result.detected_columns.credit_column}, "
          f"debit={result.detected_columns.debit_column}")
    
    # STEP 3: Extract validated metrics
    summary = result.summary
    print(f"\n[STEP 2] Financial Metrics (Validated)")
    print(f"  Date Range: {summary.date_range_start} to {summary.date_range_end} ({summary.num_months} months)")
    print(f"  Total Credit: Rs {summary.total_credit:,.2f}")
    print(f"  Total Debit: Rs {summary.total_debit:,.2f}")
    print(f"  Monthly Income: Rs {summary.monthly_income:,.2f}")
    print(f"  Monthly Expense: Rs {summary.monthly_expense:,.2f}")
    print(f"  Monthly Savings: Rs {summary.monthly_savings:,.2f}")
    
    # Compute derived metrics
    expense_ratio = (summary.monthly_expense / summary.monthly_income * 100) if summary.monthly_income > 0 else 0
    savings_ratio = (summary.monthly_savings / summary.monthly_income * 100) if summary.monthly_income > 0 else 0
    
    print(f"  Expense Ratio: {expense_ratio:.2f}%")
    print(f"  Savings Ratio: {savings_ratio:.2f}%")
    
    # STEP 4: Build appraisal payload
    print(f"\n[STEP 3] Building Appraisal Payload")
    payload = {
        # Borrower identification
        'borrower_id': borrower_id,
        
        # Financial metrics (from processor with full validation)
        'monthly_income': summary.monthly_income,
        'monthly_expense': summary.monthly_expense,
        'monthly_savings': summary.monthly_savings,
        'total_credit': summary.total_credit,
        'total_debit': summary.total_debit,
        
        # Time-based metrics
        'num_months': summary.num_months,
        'date_range_start': summary.date_range_start,
        'date_range_end': summary.date_range_end,
        
        # Derived metrics
        'expense_ratio_pct': round(expense_ratio, 2),
        'savings_ratio_pct': round(savings_ratio, 2),
        
        # Processing metadata (audit trail)
        'processing_status': 'VALIDATED',
        'source_columns': {
            'date': result.detected_columns.date_column,
            'credit': result.detected_columns.credit_column,
            'debit': result.detected_columns.debit_column,
            'balance': result.detected_columns.balance_column,
        },
        'validation_passed': result.validation_passed,
    }
    
    print(f"  Payload fields: {len(payload)} keys")
    print(f"  Ready for loan_appraisal_engine")
    
    return payload


def example_multiformat_processing():
    """
    Demonstrate that same processor works on different CSV formats.
    
    All these should work with ZERO code changes:
    - Format A: date, credit, debit, balance
    - Format B: txn_date, inflow, outflow, running_balance
    - Format C: value_date, deposit, withdrawal, balance
    - Format D:  posting_date, amount_in, amount_out
    """
    
    print("\n" + "="*70)
    print("MULTI-FORMAT CSV FLEXIBILITY DEMONSTRATION")
    print("="*70)
    
    print("\nThe processor handles CSV format variations automatically:")
    print("""
    Format A CSV:
        date, credit, debit, balance
        05/01/2025, "4,336.41", -, 129,351.59
        
    Format B CSV:
        txn_date, inflow, outflow, running_balance
        05/01/2025, 4336.41, -, 129351.59
        
    Format C CSV:
        value_date, deposit, withdrawal, balance
        05/01/2025, -, "4,336.41", 129,351.59
        
    Format D CSV:
        posting_date, amount_in, amount_out
        05/01/2025, 4336.41, -
        
    ✔ All process with SINGLE call (column names don't matter):
        processor = FinancialDataProcessor(any_csv_path)
        result = processor.process()
    """)


def example_error_handling():
    """
    Demonstrate strict error handling.
    
    If ANY validation fails: STOP, return error, never proceed.
    """
    
    print("\n" + "="*70)
    print("ERROR HANDLING & STRICT VALIDATION")
    print("="*70)
    
    print("""
    Scenario 1: Missing Required Columns
    ─────────────────────────────────────
    Input: CSV with no date or debit column
    Output: ERROR: UNABLE TO DETECT REQUIRED COLUMNS
    Action: STOP processing immediately
    
    Scenario 2: Aggregation Mismatch
    ─────────────────────────────────
    Input: Corrupted CSV where monthly × 12 ≠ total
    Tolerance: 0.1% or Rs 1.00 (whichever larger)
    
    Example:
      total_credit = Rs 1,200,000.00
      monthly_income = Rs 100,090.00
      monthly × 12 = Rs 1,201,080.00
      Difference = Rs 1,080.00 (exceeds tolerance)
    
    Output: ERROR: MONTHLY AGGREGATION ERROR
    Action: STOP processing, NEVER report with bad metrics
    
    Scenario 3: Zero Month Skipping (STRICT PROHIBITION)
    ──────────────────────────────────────────────────────
    Input: CSV with gaps (e.g., only Jan, Mar, May - skip Feb, Apr)
    ❌ WRONG: Only sum active months, report monthly_income = total/3
    ✔ RIGHT: Include all months [Jan..May], fill Feb/Apr with 0
             Report monthly_income = total/5
    
    This ensures:
    - monthly_income × 12 = annual_income (correct)
    - Not: monthly_income × 3 = annual_income (wrong!)
    """)


def main():
    """Main demonstration"""
    
    if len(sys.argv) < 2:
        print(__doc__)
        example_multiformat_processing()
        example_error_handling()
        print("\nUsage:")
        print(f"  python3 {sys.argv[0]} <csv_file> [borrower_id]")
        print("\nExample:")
        print(f"  python3 {sys.argv[0]} ../dataset/synthetic_users/freelancer_01.csv BORROW_001")
        return
    
    csv_path = sys.argv[1]
    borrower_id = sys.argv[2] if len(sys.argv) > 2 else "BORROW_DEFAULT"
    
    try:
        # Run integration
        payload = integrate_financial_processor_with_appraisal(csv_path, borrower_id)
        
        # Show final payload
        print(f"\n[STEP 4] Final Appraisal Payload (JSON)")
        print("-" * 70)
        print(json.dumps(payload, indent=2))
        print("-" * 70)
        
        print(f"\n✔ SUCCESS: Ready to pass to loan_appraisal_engine.run_loan_appraisal(payload)")
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
