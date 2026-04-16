# Loan Appraisal Model API Documentation

## Integration Status
The account-type classification, loan-product detection, product-aware rule thresholds, and merged rules evaluation are integrated in the runtime path used by the loan appraisal APIs.

Integrated modules:
- loan_appraisal_model/loan_appraisal_rule_engine.py
- loan_appraisal_model/loan_appraisal_engine.py
- loan_appraisal_model/loan_appraisal_inference.py
- Backend/app/services/loan_appraisal_service.py
- Backend/app/api/v1/risk/loan_appraisal_routes.py

## Rule Sources and Merge Logic
The evaluator supports two rule sources:
- Primary JSON: /mnt/user-data/uploads/behavioral_rules.json
- Extended YAML: /media/ideabliss/E0921B6E921B4904/creditshield/dataset/behavioral_rules_realistic.yaml

Merge behavior:
- Rules are merged by rule_id.
- If the same rule_id exists in both, YAML overrides JSON.
- If JSON is missing at runtime, YAML-only evaluation is used.

## API Base Path
Loan appraisal endpoints are mounted under:
- /api/v1/loan-appraisal

## Endpoints

### 1) Train Model
Method: POST
Path: /api/v1/loan-appraisal/train
Body (JSON):
- dataset_dir: string (default: dataset/synthetic_users)
- rules_path: string (default: dataset/behavioral_rules_realistic.yaml)
- model_out: string (default: loan_appraisal_model/loan_appraisal_trained_model.pkl)
- metrics_out: string (default: loan_appraisal_model/loan_appraisal_training_metrics.json)

Success response:
- message
- model_path
- metrics_path
- elapsed_seconds
- metrics

### 2) Predict from Existing Transaction CSV
Method: POST
Path: /api/v1/loan-appraisal/predict
Body (JSON):
- model_path: string
- transactions_csv: string
- rules_path: string

Success response:
- result: object

### 3) Analyze Uploaded Statement
Method: POST
Path: /api/v1/loan-appraisal/analyze-statement
Form-data:
- loan_type: string (personal, home, business, education, etc.)
- loan_amount: number (optional)
- statement: file (CSV or PDF)
- rules_path: string (default: dataset/behavioral_rules_realistic.yaml)
- model_path: string (default: loan_appraisal_model/loan_appraisal_trained_model.pkl)
- use_bedrock: boolean (default: true)

Success response:
- loan_type
- loan_amount
- source_file
- detected_format
- rows_analyzed
- analysis_period
- rules_path
- model_used
- result

Important nested fields under result:
- final_score
- risk_level
- recommendation
- confidence_score
- professional_appraisal
- underwriting_evaluation

### 4) Generate Professional 4-Page Report
Method: POST
Path: /api/v1/loan-appraisal/professional-report
Form-data:
- loan_type
- loan_amount
- statement
- rules_path
- model_path
- use_bedrock
- output_format: text or html (default: text)

Response:
- Plain text report or HTML report

## Underwriting Evaluation Object
The structured policy output is exposed at:
- result.underwriting_evaluation

Fields:
- ACCOUNT_TYPE
- CONFIDENCE
- CLASSIFICATION_REASON
- LOAN_PRODUCT
- NET_SCORE
- DECISION
- RULES_FIRED (array)
- TOP_RISK_FACTORS (array)
- BORROWER_FRIENDLY_EXPLANATION
- UNDERWRITER_NOTE

RULES_FIRED item fields:
- sign
- rule_id
- subcategory
- score
- reason
- status
- note

## Decision Bands
Standard:
- net_score >= 0.0 => APPROVE
- -0.25 <= net_score < 0.0 => APPROVE_WITH_CONDITIONS
- -0.40 <= net_score < -0.25 => REFER
- net_score < -0.40 => DECLINE

Micro-loan exception:
- For MICRO_LOAN, approval tolerance is relaxed and product-aware suppression/adjustment rules are applied before final decision.

## Account Type and Loan Product Logic
Implemented sequence:
1. ACCOUNT_TYPE classification
2. LOAN_PRODUCT detection
3. Product-aware rule adjustment/suppression
4. Net score and decision generation

## Quick Test Commands
From Backend directory:
- python3 test_run_adityastudents_2k_report.py
- python3 test_run_adityastudents_5k_report.py

Custom one-liner example:
- python3 -c "from pathlib import Path; from app.services.loan_appraisal_service import loan_appraisal_service; p=Path('../dataset/synthetic_users/salaried_employee_04.csv'); a=loan_appraisal_service.analyze_uploaded_statement('personal',50000.0,p.name,p.read_bytes(),'dataset/behavioral_rules_realistic.yaml','loan_appraisal_model/loan_appraisal_trained_model.pkl',True); print(a.get('result',{}).get('underwriting_evaluation',{}))"
