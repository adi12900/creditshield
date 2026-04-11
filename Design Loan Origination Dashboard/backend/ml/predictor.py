"""
Production inference hooks (scaffold).

The API foundation uses mock predictions in app.api.v1.predict.
Replace load_model / predict with real loading from ml/saved_models/ when models exist.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

SAVED_MODELS_DIR = Path(__file__).resolve().parent / "saved_models"


def load_model(version: str | None = None) -> Any:
    """
    Load a serialized model from saved_models.

    Raises NotImplementedError until artifacts and ML stack are added.
    """
    raise NotImplementedError(
        "No serialized model in foundation scope; use mock predict or implement load_model."
    )


def predict(features: dict[str, Any], model: Any | None = None) -> dict[str, Any]:
    """
    Run inference for a single feature row.

    Not implemented in foundation; API returns deterministic mock output instead.
    """
    raise NotImplementedError("Real predict() deferred; API uses mock scoring.")
