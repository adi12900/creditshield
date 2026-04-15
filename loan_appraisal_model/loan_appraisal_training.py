"""Trainable loan appraisal model built on extracted transaction features."""

from __future__ import annotations

import argparse
import json
import os
import pickle
import time
from typing import Any, Dict, List, Tuple

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score
from sklearn.model_selection import train_test_split

from loan_appraisal_features import extract_features, load_transactions
from loan_appraisal_rule_engine import evaluate_rules, load_rules


TIER_MAP = {
    "critical": 0.0,
    "high": 1.0,
    "moderate": 2.0,
    "stable": 3.0,
    "strong": 4.0,
}

TIER_FEATURES = [
    "salary_salary_detection_tier",
    "salary_salary_consistency_tier",
    "salary_salary_fluctuation_tier",
    "salary_salary_hike_drop_tier",
    "salary_job_switching_tier",
    "salary_salary_delay_tier",
    "cashflow_net_savings_tier",
    "cashflow_month_end_stress_tier",
    "emi_emi_deduction_tier",
    "emi_hidden_loan_tier",
    "digital_digital_lending_usage_tier",
    "digital_bnpl_dependency_tier",
    "bill_bill_regular_tier",
    "lifestyle_spending_spike_tier",
    "lifestyle_addiction_tier",
    "stress_low_balance_tier",
    "stress_credit_dependency_tier",
]

NUMERIC_FEATURES = [
    "metric_salary_months",
    "metric_salary_cv",
    "metric_salary_trend_pct",
    "metric_employer_switch_count",
    "metric_total_inflow",
    "metric_total_outflow",
    "metric_net_savings_ratio",
    "metric_min_balance",
    "metric_peak_balance",
    "metric_month_end_stress_count",
    "metric_emi_months",
    "metric_hidden_emi_count",
    "metric_digital_lending_count",
    "metric_bnpl_count",
    "metric_bill_months",
    "metric_addiction_ratio",
    "metric_negative_savings_months",
]

RULE_NUMERIC_FEATURES = [
    "rule_hit_count",
    "rule_impact_sum",
    "rule_critical_count",
    "rule_high_count",
    "rule_negative_impact_count",
    "rule_positive_impact_count",
]


def _log(message: str) -> None:
    print(message, flush=True)


def _heuristic_score(category_scores: Dict[str, float]) -> float:
    return (
        category_scores.get("Income Stability", 50.0) * 0.25
        + category_scores.get("Credit Behavior", 50.0) * 0.2
        + category_scores.get("Financial Discipline", 50.0) * 0.2
        + category_scores.get("Loan Burden", 50.0) * 0.2
        + category_scores.get("Lifestyle Risk", 50.0) * 0.15
    )


def _rule_metrics(rule_hits: List[Any]) -> Dict[str, float]:
    rule_hit_count = float(len(rule_hits))
    rule_impact_sum = float(sum(float(h.impact) for h in rule_hits))
    rule_critical_count = float(sum(1 for h in rule_hits if str(h.severity).lower() == "critical"))
    rule_high_count = float(sum(1 for h in rule_hits if str(h.severity).lower() == "high"))
    rule_negative_impact_count = float(sum(1 for h in rule_hits if float(h.impact) < 0.0))
    rule_positive_impact_count = float(sum(1 for h in rule_hits if float(h.impact) > 0.0))
    return {
        "rule_hit_count": rule_hit_count,
        "rule_impact_sum": rule_impact_sum,
        "rule_critical_count": rule_critical_count,
        "rule_high_count": rule_high_count,
        "rule_negative_impact_count": rule_negative_impact_count,
        "rule_positive_impact_count": rule_positive_impact_count,
    }


def _vectorize_features(feature_dict: Dict[str, Any]) -> List[float]:
    vec: List[float] = []
    for key in TIER_FEATURES:
        vec.append(TIER_MAP.get(str(feature_dict.get(key, "moderate")), 2.0))
    for key in NUMERIC_FEATURES + RULE_NUMERIC_FEATURES:
        try:
            vec.append(float(feature_dict.get(key, 0.0)))
        except (TypeError, ValueError):
            vec.append(0.0)
    return vec


def _collect_training_rows(dataset_dir: str, rules_yaml_path: str) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    X_rows: List[List[float]] = []
    score_rows: List[float] = []
    files_used: List[str] = []

    _log(f"[1/4] Loading rules from {rules_yaml_path}...")
    rule_load_start = time.perf_counter()
    rules = load_rules(rules_yaml_path)
    rule_load_elapsed = time.perf_counter() - rule_load_start

    candidate_files = [
        name
        for name in sorted(os.listdir(dataset_dir))
        if name.lower().endswith(".csv") and "index" not in name.lower()
    ]
    total_files = len(candidate_files)

    _log(
        f"[1/4] Loaded rules from {rules_yaml_path} in {rule_load_elapsed:.2f}s; "
        f"processing {total_files} CSV files from {dataset_dir}"
    )

    for idx, name in enumerate(candidate_files, start=1):
        file_start = time.perf_counter()

        path = os.path.join(dataset_dir, name)
        try:
            df = load_transactions(path)
            result = extract_features(df)
            rule_hits = evaluate_rules(result.features, rules)
            rule_feature_dict = _rule_metrics(rule_hits)
            feature_dict = dict(result.features)
            feature_dict.update(rule_feature_dict)

            # Include rulebook impact in pseudo-label score so training reflects YAML policy.
            score = _heuristic_score(result.category_scores) + (rule_feature_dict["rule_impact_sum"] * 15.0)
            x = _vectorize_features(feature_dict)
            X_rows.append(x)
            score_rows.append(score)
            files_used.append(name)
            file_elapsed = time.perf_counter() - file_start
            _log(
                f"[1/4] {idx}/{total_files} processed: {name} "
                f"(rules_hit={len(rule_hits)}, {file_elapsed:.2f}s)"
            )
        except Exception as exc:
            # Skip malformed files, continue training with remaining users; report reason.
            file_elapsed = time.perf_counter() - file_start
            _log(
                f"[1/4] {idx}/{total_files} skipped: {name} "
                f"({type(exc).__name__}: {exc}, {file_elapsed:.2f}s)"
            )
            continue

    if not X_rows:
        raise RuntimeError("No valid CSV files found for training")

    return np.array(X_rows, dtype=float), np.array(score_rows, dtype=float), files_used


def train_model(
    dataset_dir: str,
    rules_yaml_path: str,
    output_model_path: str,
    output_metrics_path: str,
) -> Dict[str, Any]:
    train_start = time.perf_counter()
    X, score_values, files_used = _collect_training_rows(dataset_dir, rules_yaml_path)
    _log(f"[2/4] Built feature matrix: rows={len(X)}, feature_count={X.shape[1]}")

    # Build labels from distribution so both classes exist in synthetic data.
    threshold = float(np.quantile(score_values, 0.5))
    y = (score_values >= threshold).astype(int)

    if len(set(y.tolist())) < 2:
        threshold = float(np.mean(score_values))
        y = (score_values >= threshold).astype(int)
    if len(set(y.tolist())) < 2:
        raise RuntimeError("Training labels collapsed to one class even after dynamic thresholding")

    _log(
        "[2/4] Labels ready: "
        f"risky_0={(y == 0).sum()}, safer_1={(y == 1).sum()}, threshold={threshold:.4f}"
    )

    try:
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=0.25,
            random_state=42,
            stratify=y,
        )
    except ValueError:
        X_train, X_test, y_train, y_test = train_test_split(
            X,
            y,
            test_size=0.25,
            random_state=42,
            stratify=None,
        )

    _log(f"[3/4] Split complete: train={len(X_train)}, test={len(X_test)}")

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=10,
        min_samples_leaf=2,
        random_state=42,
        class_weight="balanced",
    )

    fit_start = time.perf_counter()
    _log("[3/4] Training RandomForestClassifier (n_estimators=300)...")
    model.fit(X_train, y_train)
    fit_elapsed = time.perf_counter() - fit_start
    _log(f"[3/4] Model training complete in {fit_elapsed:.2f}s")

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    metrics: Dict[str, Any] = {
        "rows_total": int(len(X)),
        "rows_train": int(len(X_train)),
        "rows_test": int(len(X_test)),
        "label_distribution": {
            "risky_0": int((y == 0).sum()),
            "safer_1": int((y == 1).sum()),
        },
        "label_threshold": round(threshold, 4),
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "roc_auc": float(roc_auc_score(y_test, y_prob)),
        "classification_report": classification_report(y_test, y_pred, output_dict=True),
        "files_used": files_used,
        "feature_count": int(X.shape[1]),
        "rules_yaml_path": rules_yaml_path,
    }

    artifact = {
        "model": model,
        "tier_map": TIER_MAP,
        "tier_features": TIER_FEATURES,
        "numeric_features": NUMERIC_FEATURES + RULE_NUMERIC_FEATURES,
        "feature_names": TIER_FEATURES + NUMERIC_FEATURES + RULE_NUMERIC_FEATURES,
        "rule_numeric_features": RULE_NUMERIC_FEATURES,
        "metrics": metrics,
    }

    with open(output_model_path, "wb") as f:
        pickle.dump(artifact, f)

    with open(output_metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    total_elapsed = time.perf_counter() - train_start
    _log(
        f"[4/4] Saved model to {output_model_path} and metrics to {output_metrics_path} "
        f"in {total_elapsed:.2f}s total"
    )

    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="Train loan appraisal classifier on synthetic users")
    parser.add_argument("--dataset-dir", required=True, help="Path to synthetic_users folder")
    parser.add_argument("--rules", required=True, help="Path to behavioral_rules.yaml")
    parser.add_argument(
        "--model-out",
        default="loan_appraisal_trained_model.pkl",
        help="Output pickle path",
    )
    parser.add_argument(
        "--metrics-out",
        default="loan_appraisal_training_metrics.json",
        help="Output metrics JSON path",
    )
    args = parser.parse_args()

    metrics = train_model(args.dataset_dir, args.rules, args.model_out, args.metrics_out)
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
