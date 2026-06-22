import numpy as np
import pandas as pd
from tensorflow.keras.preprocessing.sequence import pad_sequences

try:
    from .model_loader import model, scaler
except ImportError:
    from model_loader import model, scaler


MAX_LEN = 15
FEATURES = [
    "log_amount",
    "days_since_last_round",
    "funding_growth_rate",
    "total_funding",
    "funding_velocity",
    "startup_age_days",
    "round_number",
    "round_type_encoded",
]


def preprocess_rounds(rounds):
    features = []
    total_funding = 0.0
    elapsed_days = 0.0
    previous_amount = None

    for round_data in rounds:
        amount = float(round_data["amount"])
        days_since_last_round = float(round_data["days_since_last_round"])
        total_funding += amount
        elapsed_days += days_since_last_round

        if previous_amount and previous_amount > 0:
            funding_growth_rate = (amount - previous_amount) / previous_amount
        else:
            funding_growth_rate = 0.0
        previous_amount = amount

        features.append(
            [
                np.log1p(amount),
                days_since_last_round,
                funding_growth_rate,
                total_funding,
                total_funding / (elapsed_days + 1),
                elapsed_days,
                int(round_data["round_number"]),
                int(round_data["round_type"]),
            ]
        )

    return np.array(features, dtype="float32")


def prepare_input(features):
    feature_frame = pd.DataFrame(features, columns=FEATURES)
    scaled_features = scaler.transform(feature_frame)
    return pad_sequences(
        [scaled_features],
        maxlen=MAX_LEN,
        padding="post",
        truncating="post",
        dtype="float32",
    )


def predict_outcome(X):
    probs = model.predict(X, verbose=0)
    class_id = int(np.argmax(probs[0]))
    confidence = float(probs[0][class_id])
    return class_id, confidence
