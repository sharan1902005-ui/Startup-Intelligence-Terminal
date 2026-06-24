from pathlib import Path

import joblib
import onnxruntime as ort

ROOT = Path(__file__).resolve().parents[1]
MODELS_DIR = ROOT / "models"

LABELS = {
    0: "Shutdown",
    1: "Acquired",
    2: "Growing",
}

model = ort.InferenceSession(str(MODELS_DIR / "lstm_model.onnx"))
embedding_model = ort.InferenceSession(str(MODELS_DIR / "embedding_model.onnx"))
scaler = joblib.load(MODELS_DIR / "scaler.pkl")
nn = joblib.load(MODELS_DIR / "nearest_neighbors.pkl")
