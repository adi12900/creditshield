"""CLI runner for loan appraisal model."""

from __future__ import annotations

import argparse

from loan_appraisal_engine import run_and_print_json


def main() -> None:
    parser = argparse.ArgumentParser(description="Run loan appraisal on one user transaction CSV")
    parser.add_argument("--transactions", required=True, help="Path to user transaction CSV")
    parser.add_argument("--rules", required=True, help="Path to behavioral_rules.yaml")
    args = parser.parse_args()

    run_and_print_json(args.transactions, args.rules)


if __name__ == "__main__":
    main()
