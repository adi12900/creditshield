"""
Future training pipeline for CreditShield default-risk models.

Planned steps (not implemented in foundation):
- Load curated feature store / exports
- Time-based validation splits
- Train sklearn / XGBoost / etc., track metrics
- Persist artifacts under ml/saved_models/

Run later with: python -m ml.train (after optional requirements-ml.txt install).
"""


def main() -> None:
    raise NotImplementedError(
        "Training pipeline is deferred; install ML extras and implement ml.train.main when ready."
    )


if __name__ == "__main__":
    main()
