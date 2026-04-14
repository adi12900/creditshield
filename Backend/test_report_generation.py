#!/usr/bin/env python3
"""
Test 4-page report generation for studentshinde.csv
"""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).parent))

from app.services.loan_appraisal_service import loan_appraisal_service

def main():
    csv_file = Path(__file__).parent.parent / "dataset/synthetic_users/studentshinde.csv"
    
    if not csv_file.exists():
        print(f"❌ File not found: {csv_file}")
        return 1
    
    print(f"📄 Loading: {csv_file.name}")
    sample_bytes = csv_file.read_bytes()
    print(f"✓ Size: {len(sample_bytes):,} bytes\n")
    
    print("📊 Analyzing statement with:")
    print("  - Loan Type: personal")
    print("  - Loan Amount: ₹50,000")
    print("  - Use Bedrock: Yes\n")
    
    analysis = loan_appraisal_service.analyze_uploaded_statement(
        loan_type='personal',
        loan_amount=50000.0,
        source_file_name='studentshinde.csv',
        payload_bytes=sample_bytes,
        rules_path='dataset/behavioral_rules.yaml',
        model_path='loan_appraisal_model/loan_appraisal_trained_model.pkl',
        use_bedrock=True
    )
    
    print(f"✓ Analysis complete")
    print(f"  - Rows: {analysis.get('rows_analyzed', 0)}")
    print(f"  - Period: {analysis.get('analysis_period', {})}\n")
    
    print("📄 Generating 4-page professional report...\n")
    report = loan_appraisal_service.generate_professional_report(
        analysis_result=analysis,
        output_format='text'
    )
    
    print(f"✓ Report generated: {len(report):,} characters\n")
    print("=" * 100)
    print(report)
    print("=" * 100)
    
    # Save to file
    output_file = Path(__file__).parent / "studentshinde_report.txt"
    output_file.write_text(report)
    print(f"\n✓ Report saved to: {output_file}")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
