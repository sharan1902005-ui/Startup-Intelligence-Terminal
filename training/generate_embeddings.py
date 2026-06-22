from pathlib import Path
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.neighbors import NearestNeighbors


ROOT = Path(__file__).resolve().parents[1]
PROCESSED_DIR = ROOT / "data" / "processed"
MODELS_DIR = ROOT / "models"
MPLCONFIG_DIR = ROOT / ".matplotlib"
MPLCONFIG_DIR.mkdir(exist_ok=True)
os.environ.setdefault("MPLCONFIGDIR", str(MPLCONFIG_DIR))
LABEL_NAMES = ["closed", "acquired", "operating"]


def import_tensorflow():
    try:
        from tensorflow.keras.models import Model, load_model
    except ModuleNotFoundError as exc:
        raise SystemExit(
            "TensorFlow is not installed. Install it with:\n"
            "  python -m pip install tensorflow\n"
            "Then rerun training/generate_embeddings.py."
        ) from exc

    return Model, load_model


def main():
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    print("Step 3 - Extract Embedding Model")
    Model, load_model = import_tensorflow()
    model = load_model(MODELS_DIR / "lstm_model.h5")
    embedding_model = Model(
        inputs=model.inputs,
        outputs=model.get_layer("embedding_layer").output,
    )

    print("Step 4 - Generate Startup Embeddings")
    X = np.load(PROCESSED_DIR / "X.npy")
    y = np.load(PROCESSED_DIR / "y.npy")
    embeddings = embedding_model.predict(X, verbose=0)
    print(embeddings.shape)

    print("Step 5 - Save Embeddings")
    np.save(MODELS_DIR / "startup_embeddings.npy", embeddings)

    print("Step 6 - Save Startup Names")
    startup_names = np.load(PROCESSED_DIR / "startup_names.npy", allow_pickle=True)
    names_df = pd.DataFrame(
        {
            "startup": startup_names,
            "label": y,
            "status": [LABEL_NAMES[label] for label in y],
        }
    )
    names_df.to_csv(MODELS_DIR / "startup_names.csv", index=False)

    print("Step 7 - Build Nearest Neighbor Index")
    nn = NearestNeighbors(n_neighbors=6, metric="cosine")
    nn.fit(embeddings)
    joblib.dump(nn, MODELS_DIR / "nearest_neighbors.pkl")

    print("Step 9 - Test Similarity Search")
    sample = embeddings[100]
    distances, indices = nn.kneighbors(sample.reshape(1, -1))
    for dist, idx in zip(distances[0][1:], indices[0][1:]):
        similarity = (1 - dist) * 100
        print(names_df.iloc[idx]["startup"], round(similarity, 2))


if __name__ == "__main__":
    main()
