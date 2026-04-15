"""Print key model performance metrics from loan appraisal training output."""

from __future__ import annotations

import argparse
import json
import os
import sys
from typing import Any, Dict


def _load_metrics(metrics_path: str) -> Dict[str, Any]:
    if not os.path.exists(metrics_path):
        raise FileNotFoundError(
            f"Metrics file not found: {metrics_path}. Run loan_appraisal_training.py first."
        )

    with open(metrics_path, "r", encoding="utf-8") as f:
        return json.load(f)


def _extract_required_metrics(metrics: Dict[str, Any]) -> Dict[str, float]:
    report = metrics.get("classification_report", {})
    macro_avg = report.get("macro avg", {})

    required = {
        "ROC-AUC": metrics.get("roc_auc"),
        "Accuracy": metrics.get("accuracy"),
        "Precision (macro avg)": macro_avg.get("precision"),
        "Recall (macro avg)": macro_avg.get("recall"),
        "F1 (macro avg)": macro_avg.get("f1-score"),
    }

    missing = [name for name, value in required.items() if value is None]
    if missing:
        missing_str = ", ".join(missing)
        raise ValueError(f"Missing expected metric(s): {missing_str}")

    return {k: float(v) for k, v in required.items()}


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Report ROC-AUC, Accuracy, Precision, Recall, and F1 from training metrics JSON"
    )
    parser.add_argument(
        "--metrics",
        default="loan_appraisal_training_metrics.json",
        help="Path to loan_appraisal_training_metrics.json",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print only JSON output for easy automation",
    )
    args = parser.parse_args()

    try:
        metrics = _load_metrics(args.metrics)
        selected = _extract_required_metrics(metrics)
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        return 1

    if args.json:
        print(json.dumps(selected, indent=2))
        return 0

    print("Loan Appraisal Model - Key Evaluation Metrics")
    print("-" * 48)
    for label, value in selected.items():
        print(f"{label}: {value:.6f}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
