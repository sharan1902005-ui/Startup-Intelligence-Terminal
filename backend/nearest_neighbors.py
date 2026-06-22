from pathlib import Path

import numpy as np
import pandas as pd

try:
    from .model_loader import nn
except ImportError:
    from model_loader import nn


ROOT = Path(__file__).resolve().parents[1]
MODELS_DIR = ROOT / "models"
startup_names = pd.read_csv(MODELS_DIR / "startup_names.csv")


def find_similar(embedding, k=5, predicted_status=None):
    n_neighbors = min(len(startup_names), max(k + 1, 6))
    distances, indices = nn.kneighbors(embedding.reshape(1, -1), n_neighbors=n_neighbors)

    results = []
    for dist, idx in zip(distances[0], indices[0]):
        row = startup_names.iloc[idx]
        if np.isclose(dist, 0.0):
            continue
        if predicted_status and row.get("status") != predicted_status:
            continue

        results.append(
            {
                "name": row["startup"],
                "similarity": round(float((1 - dist) * 100), 1),
            }
        )

        if len(results) >= k:
            break

    return results
