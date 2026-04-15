# Loan Appraisal Model

All files in this module intentionally start with `loan_appraisal_` so it is easy to identify among other models.

## Files

- `loan_appraisal_features.py`: Transaction feature extraction and behavioral flag detection
- `loan_appraisal_rule_engine.py`: YAML rule loader and safe rule evaluator
- `loan_appraisal_engine.py`: End-to-end scoring, risk level, recommendation, JSON output
- `loan_appraisal_cli.py`: CLI entry point
- `loan_appraisal_training.py`: Trainable classifier pipeline on synthetic users
- `loan_appraisal_inference.py`: Inference with trained model + explainable rule output
- `loan_appraisal_trained_model.pkl`: Saved trained model artifact (generated after training)
- `loan_appraisal_training_metrics.json`: Training metrics (generated after training)

## Data Sources (strict)

- Transactions folder: `/media/ideabliss/data/creditshield/dataset/synthetic_users`
- Rules file: `/media/ideabliss/data/creditshield/dataset/behavioral_rules_realistic.yaml`

## Run

```bash
cd /media/ideabliss/data/creditshield/loan_appraisal_model
python3 loan_appraisal_cli.py \
  --transactions /media/ideabliss/data/creditshield/dataset/synthetic_users/salaried_employee_01.csv \
  --rules /media/ideabliss/data/creditshield/dataset/behavioral_rules_realistic.yaml
```

## Train Model

```bash
cd /media/ideabliss/data/creditshield/loan_appraisal_model
python3 loan_appraisal_training.py \
  --dataset-dir /media/ideabliss/data/creditshield/dataset/synthetic_users \
  --rules /media/ideabliss/data/creditshield/dataset/behavioral_rules_realistic.yaml \
  --model-out loan_appraisal_trained_model.pkl \
  --metrics-out loan_appraisal_training_metrics.json
```

## Run Inference With Trained Model

```bash
cd /media/ideabliss/data/creditshield/loan_appraisal_model
python3 loan_appraisal_inference.py \
  --model loan_appraisal_trained_model.pkl \
  --transactions /media/ideabliss/data/creditshield/dataset/synthetic_users/salaried_employee_01.csv \
  --rules /media/ideabliss/data/creditshield/dataset/behavioral_rules_realistic.yaml
```

## Output

Produces strict JSON with:

- `final_score` (0-100)
- `risk_level`
- `summary`
- `income_analysis`
- `cashflow_analysis`
- `loan_analysis`
- `category_scores`
- `behavioral_flags`
- `rule_evaluations`
- `red_flags`
- `recommendation`
- `confidence_score`
