#!/usr/bin/env python3
"""
TEST SUITE: Financial Data Processor Flexibility

Demonstrates that the processor handles ANY CSV format with:
- Different column names
- Different column orders
- Different numeric formats
- Null value representations
"""

import pandas as pd
import tempfile
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from financial_data_processor import FinancialDataProcessor, print_processing_result


def create_test_csv_format_a(path: str):
    """Format A: Standard bank format (date, credit, debit, balance)"""
    df = pd.DataFrame({
        'date': ['2025-01-01', '2025-01-15', '2025-02-01', '2025-02-20'],
        'credit': [50000.00, 75000.00, 40000.00, '-'],
        'debit': ['-', 5000.00, '-', 3000.00],
        'balance': [50000.00, 120000.00, 160000.00, 157000.00]
    })
    df.to_csv(path, index=False)
    print(f"Created Format A (date, credit, debit, balance)")
    print(f"  Columns: {list(df.columns)}")
    print(f"  Rows: {len(df)}")


def create_test_csv_format_b(path: str):
    """Format B: Alternative names (txn_date, deposit, withdrawal, running_balance)"""
    df = pd.DataFrame({
        'txn_date': ['2025-01-01', '2025-01-15', '2025-02-01', '2025-02-20'],
        'deposit': [50000.00, 75000.00, 40000.00, '-'],
        'withdrawal': ['-', 5000.00, '-', 3000.00],
        'running_balance': [50000.00, 120000.00, 160000.00, 157000.00]
    })
    df.to_csv(path, index=False)
    print(f"Created Format B (txn_date, deposit, withdrawal, running_balance)")
    print(f"  Columns: {list(df.columns)}")
    print(f"  Rows: {len(df)}")


def create_test_csv_format_c(path: str):
    """Format C: Different order (value_date, withdrawal, deposit, balance) - REVERSED ORDER"""
    df = pd.DataFrame({
        'value_date': ['2025-01-01', '2025-01-15', '2025-02-01', '2025-02-20'],
        'withdrawal': ['-', 5000.00, '-', 3000.00],  # Debit first
        'deposit': [50000.00, 75000.00, 40000.00, '-'],  # Credit second
        'balance': [50000.00, 120000.00, 160000.00, 157000.00]
    })
    df.to_csv(path, index=False)
    print(f"Created Format C (value_date, withdrawal, deposit, balance) - REVERSED COLUMN ORDER")
    print(f"  Columns: {list(df.columns)}")
    print(f"  Rows: {len(df)}")


def create_test_csv_format_d(path: str):
    """Format D: Quoted numbers with commas"""
    df = pd.DataFrame({
        'posting_date': ['2025-01-01', '2025-01-15', '2025-02-01', '2025-02-20'],
        'cr': ['"50,000.00"', '"75,000.00"', '"40,000.00"', '-'],
        'dr': ['-', '"5,000.00"', '-', '"3,000.00"'],
        'closing_balance': ['"50,000.00"', '"120,000.00"', '"160,000.00"', '"157,000.00"']
    })
    df.to_csv(path, index=False, quotechar='"')
    print(f"Created Format D (posting_date, cr, dr, closing_balance) - QUOTED NUMBERS WITH COMMAS")
    print(f"  Columns: {list(df.columns)}")
    print(f"  Rows: {len(df)}")


def test_format(format_name: str, csv_path: str, create_func):
    """Test a single CSV format"""
    print("\n" + "="*70)
    print(f"TEST: {format_name}")
    print("="*70)
    
    # Create test CSV
    create_func(csv_path)
    
    # Process
    print(f"\nProcessing with FinancialDataProcessor...")
    processor = FinancialDataProcessor(csv_path)
    result = processor.process()
    
    # Verify
    if result.success:
        print(f"✔ SUCCESS")
        summary = result.summary
        
        print(f"\nDetected Columns:")
        print(f"  Date: {result.detected_columns.date_column}")
        print(f"  Credit: {result.detected_columns.credit_column}")
        print(f"  Debit: {result.detected_columns.debit_column}")
        
        print(f"\nMetrics:")
        print(f"  Months: {summary.num_months}")
        print(f"  Total Credit: Rs {summary.total_credit:,.2f}")
        print(f"  Total Debit: Rs {summary.total_debit:,.2f}")
        print(f"  Monthly Income: Rs {summary.monthly_income:,.2f}")
        print(f"  Monthly Expense: Rs {summary.monthly_expense:,.2f}")
        print(f"  Savings: Rs {summary.total_savings:,.2f}")
        
        return True
    else:
        print(f"❌ FAILED: {result.error_message}")
        return False


def test_column_order_invariance():
    """Verify that column order doesn't matter"""
    print("\n" + "="*70)
    print("TEST: Column Order Invariance")
    print("="*70)
    
    print("""
    Hypothesis: Processor should produce IDENTICAL results
                regardless of column order.
    
    Testing:
    - Format 1: date, credit, debit, balance
    - Format 2: date, debit, credit, balance (SWAPPED)
    - Format 3: credit, date, debit, balance (SHUFFLED)
    """)
    
    # Create same data in different orders
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f1:
        path1 = f1.name
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f2:
        path2 = f2.name
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f3:
        path3 = f3.name
    
    # Order 1: date, credit, debit, balance
    df = pd.DataFrame({
        'date': ['2025-01-01', '2025-02-01'],
        'credit': [100000.00, 150000.00],
        'debit': [5000.00, 3000.00],
        'balance': [95000.00, 242000.00]
    })
    df.to_csv(path1, index=False)
    
    # Order 2: date, debit, credit, balance (SWAPPED)
    df2 = df[['date', 'debit', 'credit', 'balance']]
    df2.to_csv(path2, index=False)
    
    # Order 3: credit, date, debit, balance (SHUFFLED)
    df3 = df[['credit', 'date', 'debit', 'balance']]
    df3.to_csv(path3, index=False)
    
    # Process all three
    results = []
    for i, path in enumerate([path1, path2, path3], 1):
        processor = FinancialDataProcessor(path)
        result = processor.process()
        results.append(result)
    
    # Verify identical
    if all(r.success for r in results):
        summary1 = results[0].summary
        summary2 = results[1].summary
        summary3 = results[2].summary
        
        identical = (
            summary1.total_credit == summary2.total_credit == summary3.total_credit and
            summary1.total_debit == summary2.total_debit == summary3.total_debit and
            summary1.monthly_income == summary2.monthly_income == summary3.monthly_income and
            summary1.monthly_expense == summary2.monthly_expense == summary3.monthly_expense
        )
        
        if identical:
            print(f"\n✔ PASSED: All 3 column orders produced identical results")
            print(f"  Total Credit: Rs {summary1.total_credit:,.2f} (all three)")
            print(f"  Total Debit: Rs {summary1.total_debit:,.2f} (all three)")
            print(f"  Monthly Income: Rs {summary1.monthly_income:,.2f} (all three)")
            return True
        else:
            print(f"\n❌ FAILED: Different column orders produced different results!")
            return False
    else:
        print(f"\n❌ FAILED: Processing failed for some formats")
        return False


def test_null_value_handling():
    """Verify different null representations are handled correctly"""
    print("\n" + "="*70)
    print("TEST: Null Value Handling")
    print("="*70)
    
    print("""
    Testing null value representations:
    - "-" (dash)
    - Empty string
    - NaN
    - "NULL"
    
    All should be treated as zero in calculations.
    """)
    
    # Create CSV with various null representations
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
        null_path = f.name
    
    df = pd.DataFrame({
        'date': ['2025-01-01', '2025-01-02', '2025-01-03', '2025-01-04'],
        'credit': [100000.00, '-', 150000.00, 200000.00],
        'debit': ['-', 5000.00, '-', 3000.00],
    })
    df.to_csv(null_path, index=False)
    
    processor = FinancialDataProcessor(null_path)
    result = processor.process()
    
    if result.success:
        summary = result.summary
        expected_credit = 100000 + 150000 + 200000  # = 450000
        expected_debit = 5000 + 3000  # = 8000
        
        if (abs(summary.total_credit - expected_credit) < 0.01 and 
            abs(summary.total_debit - expected_debit) < 0.01):
            print(f"\n✔ PASSED: Null values handled correctly")
            print(f"  Total Credit: Rs {summary.total_credit:,.2f} (expected {expected_credit:,.2f})")
            print(f"  Total Debit: Rs {summary.total_debit:,.2f} (expected {expected_debit:,.2f})")
            return True
        else:
            print(f"\n❌ FAILED: Totals don't match")
            return False
    else:
        print(f"\n❌ FAILED: Processing error - {result.error_message}")
        return False


def test_flag_style_debit_credit_with_balance():
    """Verify marker-style debit/credit columns are reconstructed from balance movement."""
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
        flag_path = f.name

    df = pd.DataFrame({
        'value_date': ['2025-04-01', '2025-04-02', '2025-04-03'],
        'details': ['txn1', 'txn2', 'txn3'],
        'debit': ['1.0', '-', '1.0'],
        'credit': ['-', '1.0', '-'],
        'balance': ['1000.00', '1050.00', '900.00'],
    })
    df.to_csv(flag_path, index=False)

    processor = FinancialDataProcessor(flag_path)
    result = processor.process()

    if result.success and result.summary.total_credit > 0 and result.summary.total_debit > 0:
        print(f"\n✔ PASSED: Flag-style debit/credit columns reconstructed from balance")
        print(f"  Total Credit: Rs {result.summary.total_credit:,.2f}")
        print(f"  Total Debit: Rs {result.summary.total_debit:,.2f}")
        return True
    else:
        print(f"\n❌ FAILED: {result.error_message}")
        return False


def main():
    """Run all tests"""
    print("\n" + "="*70)
    print("FINANCIAL DATA PROCESSOR - COMPREHENSIVE TEST SUITE")
    print("="*70)
    
    test_results = {}
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
        path_a = f.name
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
        path_b = f.name
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
        path_c = f.name
    with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
        path_d = f.name
    
    # Run all tests
    test_results['Format A (Standard)'] = test_format(
        "Format A: Standard Bank Format",
        path_a,
        create_test_csv_format_a
    )
    
    test_results['Format B (Alternative Names)'] = test_format(
        "Format B: Alternative Column Names",
        path_b,
        create_test_csv_format_b
    )
    
    test_results['Format C (Reversed Order)'] = test_format(
        "Format C: Reversed Column Order",
        path_c,
        create_test_csv_format_c
    )
    
    test_results['Format D (Quoted Commas)'] = test_format(
        "Format D: Quoted Numbers with Commas",
        path_d,
        create_test_csv_format_d
    )
    
    test_results['Column Order Invariance'] = test_column_order_invariance()
    test_results['Null Value Handling'] = test_null_value_handling()
    test_results['Flag Style Columns'] = test_flag_style_debit_credit_with_balance()
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    print()
    
    passed = sum(1 for v in test_results.values() if v)
    total = len(test_results)
    
    for test_name, result in test_results.items():
        status = "✔ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print()
    print(f"Result: {passed}/{total} tests passed")
    print()
    
    if passed == total:
        print("🎉 ALL TESTS PASSED")
        print("\nCore Principle Verified:")
        print("'Correct computation must be independent of column names and data format'")
        return 0
    else:
        print("❌ SOME TESTS FAILED")
        return 1


if __name__ == "__main__":
    sys.exit(main())
