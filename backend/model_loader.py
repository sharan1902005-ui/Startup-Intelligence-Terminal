from pathlib import Path
import os

import joblib


ROOT = Path(__file__).resolve().parents[1]
MODELS_DIR = ROOT / "models"
MPLCONFIG_DIR = ROOT / ".matplotlib"
MPLCONFIG_DIR.mkdir(exist_ok=True)
os.environ.setdefault("MPLCONFIGDIR", str(MPLCONFIG_DIR))
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")

from tensorflow.keras.models import Model, load_model

LABELS = {
    0: "Shutdown",
    1: "Acquired",
    2: "Growing",
}

model = load_model(MODELS_DIR / "lstm_model.h5")
scaler = joblib.load(MODELS_DIR / "scaler.pkl")
nn = joblib.load(MODELS_DIR / "nearest_neighbors.pkl")
embedding_model = Model(
    inputs=model.inputs,
    outputs=model.get_layer("embedding_layer").output,
)
