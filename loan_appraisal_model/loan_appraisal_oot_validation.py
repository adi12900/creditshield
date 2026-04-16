"""Out-of-time holdout validation for loan appraisal model.

Builds one training sample (older period) and one holdout sample (future period)
per borrower CSV, then evaluates model performance on the out-of-time window.
"""

from __future__ import annotations

import argparse
import json
import os
from dataclasses import dataclass
from typing import Any, Dict, List, Tuple

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, roc_auc_score

from loan_appraisal_features import extract_features, load_transactions
from loan_appraisal_rule_engine import evaluate_rules, load_rules
from loan_appraisal_training import NUMERIC_FEATURES, RULE_NUMERIC_FEATURES, TIER_FEATURES, TIER_MAP


@dataclass
class OOTRow:
    file_name: str
    split_date: str
    train_vec: List[float]
    test_vec: List[float]
    train_score: float
    test_score: float


def _log(msg: str) -> None:
    print(msg, flush=True)


def _heuristic_score(category_scores: Dict[str, float]) -> float:
    return (
        category_scores.get("Income Stability", 50.0) * 0.25
        + category_scores.get("Credit Behavior", 50.0) * 0.2
        + category_scores.get("Financial Discipline", 50.0) * 0.2
        + category_scores.get("Loan Burden", 50.0) * 0.2
        + category_scores.get("Lifestyle Risk", 50.0) * 0.15
    )


def _rule_metrics(rule_hits: List[Any]) -> Dict[str, float]:
    return {
        "rule_hit_count": float(len(rule_hits)),
        "rule_impact_sum": float(sum(float(h.impact) for h in rule_hits)),
        "rule_critical_count": float(sum(1 for h in rule_hits if str(h.severity).lower() == "critical")),
        "rule_high_count": float(sum(1 for h in rule_hits if str(h.severity).lower() == "high")),
        "rule_negative_impact_count": float(sum(1 for h in rule_hits if float(h.impact) < 0.0)),
        "rule_positive_impact_count": float(sum(1 for h in rule_hits if float(h.impact) > 0.0)),
    }


def _vectorize(feature_dict: Dict[str, Any]) -> List[float]:
    vec: List[float] = []
    for key in TIER_FEATURES:
        vec.append(float(TIER_MAP.get(str(feature_dict.get(key, "moderate")), 2.0)))
    for key in NUMERIC_FEATURES + RULE_NUMERIC_FEATURES:
        try:
            vec.append(float(feature_dict.get(key, 0.0)))
        except (TypeError, ValueError):
            vec.append(0.0)
    return vec


def _build_period_row(df_period: Any, rules: List[Dict[str, Any]]) -> Tuple[List[float], float]:
    feat = extract_features(df_period)
    hits = evaluate_rules(feat.features, rules)
    feature_dict = dict(feat.features)
    rule_metrics = _rule_metrics(hits)
    feature_dict.update(rule_metrics)
    vec = _vectorize(feature_dict)
    score = _heuristic_score(feat.category_scores) + (rule_metrics["rule_impact_sum"] * 15.0)
    return vec, float(score)


def _collect_oot_rows(dataset_dir: str, rules_yaml: str, split_ratio: float) -> List[OOTRow]:
    rules = load_rules(rules_yaml)

    rows: List[OOTRow] = []
    files = [
        name
        for name in sorted(os.listdir(dataset_dir))
        if name.lower().endswith(".csv") and "index" not in name.lower()
    ]

    _log(f"Scanning {len(files)} files for out-of-time splits...")
    for i, name in enumerate(files, start=1):
        path = os.path.join(dataset_dir, name)
        try:
            df = load_transactions(path)
            if df.empty:
                _log(f"[{i}/{len(files)}] skipped {name}: empty")
                continue

            unique_days = sorted(df["txn_date"].dt.normalize().unique().tolist())
            if len(unique_days) < 8:
                _log(f"[{i}/{len(files)}] skipped {name}: insufficient timeline")
                continue

            cut_idx = max(1, min(len(unique_days) - 1, int(len(unique_days) * split_ratio)))
            split_day = unique_days[cut_idx - 1]

            train_df = df[df["txn_date"].dt.normalize() <= split_day].copy()
            test_df = df[df["txn_date"].dt.normalize() > split_day].copy()

            if train_df.empty or test_df.empty:
                _log(f"[{i}/{len(files)}] skipped {name}: invalid temporal split")
                continue

            train_vec, train_score = _build_period_row(train_df, rules)
            test_vec, test_score = _build_period_row(test_df, rules)

            rows.append(
                OOTRow(
                    file_name=name,
                    split_date=str(split_day.date()),
                    train_vec=train_vec,
                    test_vec=test_vec,
                    train_score=train_score,
                    test_score=test_score,
                )
            )
            _log(f"[{i}/{len(files)}] processed {name}: split={split_day.date()}")
        except Exception as exc:
            _log(f"[{i}/{len(files)}] skipped {name}: {type(exc).__name__}: {exc}")

    return rows


def run_oot_validation(dataset_dir: str, rules_yaml: str, split_ratio: float = 0.75) -> Dict[str, Any]:
    rows = _collect_oot_rows(dataset_dir, rules_yaml, split_ratio)
    if not rows:
        raise RuntimeError("No valid out-of-time rows were generated")

    X_train = np.array([r.train_vec for r in rows], dtype=float)
    X_test = np.array([r.test_vec for r in rows], dtype=float)
    train_scores = np.array([r.train_score for r in rows], dtype=float)
    test_scores = np.array([r.test_score for r in rows], dtype=float)

    threshold = float(np.quantile(train_scores, 0.5))
    y_train = (train_scores >= threshold).astype(int)
    y_test = (test_scores >= threshold).astype(int)

    if len(set(y_train.tolist())) < 2:
        threshold = float(np.mean(train_scores))
        y_train = (train_scores >= threshold).astype(int)
        y_test = (test_scores >= threshold).astype(int)

    if len(set(y_train.tolist())) < 2 or len(set(y_test.tolist())) < 2:
        raise RuntimeError("Label collapse in OOT split; cannot produce meaningful validation")

    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=10,
        min_samples_leaf=2,
        random_state=42,
        class_weight="balanced",
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_prob = model.predict_proba(X_test)[:, 1]

    metrics: Dict[str, Any] = {
        "oot_mode": "per_borrower_time_split",
        "split_ratio": split_ratio,
        "rows_train": int(len(X_train)),
        "rows_test": int(len(X_test)),
        "label_threshold": round(threshold, 4),
        "label_distribution_train": {
            "risky_0": int((y_train == 0).sum()),
            "safer_1": int((y_train == 1).sum()),
        },
        "label_distribution_test": {
            "risky_0": int((y_test == 0).sum()),
            "safer_1": int((y_test == 1).sum()),
        },
        "accuracy": float(accuracy_score(y_test, y_pred)),
        "roc_auc": float(roc_auc_score(y_test, y_prob)),
        "classification_report": classification_report(y_test, y_pred, output_dict=True),
        "files_used": [r.file_name for r in rows],
        "feature_count": int(X_train.shape[1]),
        "rules_yaml_path": rules_yaml,
        "split_dates": {r.file_name: r.split_date for r in rows},
    }

    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="Run out-of-time holdout validation")
    parser.add_argument("--dataset-dir", required=True, help="Path to synthetic_users folder")
    parser.add_argument("--rules", required=True, help="Path to behavioral_rules.yaml")
    parser.add_argument(
        "--split-ratio",
        type=float,
        default=0.75,
        help="Fraction of timeline used for train period per borrower",
    )
    parser.add_argument(
        "--metrics-out",
        default="loan_appraisal_oot_metrics.json",
        help="Output metrics JSON path",
    )
    args = parser.parse_args()

    metrics = run_oot_validation(args.dataset_dir, args.rules, split_ratio=args.split_ratio)
    with open(args.metrics_out, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
