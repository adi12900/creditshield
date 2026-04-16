"""CLI runner for loan appraisal model."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from loan_appraisal_engine import run_loan_appraisal


def _resolve_transactions_input(path: str, user_file: str | None) -> str:
    p = Path(path)
    if p.is_file():
        return str(p)

    if not p.is_dir():
        raise FileNotFoundError(f"Transactions input not found: {path}")

    if user_file:
        selected = p / user_file
        if not selected.exists():
            raise FileNotFoundError(f"User file not found under dataset folder: {selected}")
        return str(selected)

    csv_files = sorted(p.glob("*.csv"))
    if not csv_files:
        raise FileNotFoundError(f"No CSV files found in dataset folder: {p}")
    return str(csv_files[0])


def main() -> None:
    parser = argparse.ArgumentParser(description="Run strict loan appraisal pipeline")
    parser.add_argument("--transactions", required=True, help="Path to user transaction CSV or dataset folder")
    parser.add_argument("--user-file", default=None, help="CSV filename when --transactions points to a dataset folder")
    parser.add_argument("--rules", required=True, help="Path to behavioral_rules.yaml")
    parser.add_argument("--loan-amount", type=float, required=True, help="Requested loan amount")
    parser.add_argument("--tenure-months", type=int, required=True, help="Requested tenure in months")
    parser.add_argument("--loan-type", default="personal", help="Loan type, e.g., personal, business")
    args = parser.parse_args()

    tx_file = _resolve_transactions_input(args.transactions, args.user_file)
    try:
        result = run_loan_appraisal(
            tx_file,
            args.rules,
            loan_context={
                "loan_amount": args.loan_amount,
                "tenure_months": args.tenure_months,
                "loan_type": args.loan_type,
            },
        )
    except ValueError as exc:
        print(f"Startup preflight failed: {exc}", file=sys.stderr)
        raise SystemExit(1)

    import json

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
