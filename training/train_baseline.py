from pathlib import Path

import joblib
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import train_test_split


ROOT = Path(__file__).resolve().parents[1]
PROCESSED_DIR = ROOT / "data" / "processed"
MODELS_DIR = ROOT / "models"
REPORTS_DIR = ROOT / "reports"
LABEL_NAMES = ["closed", "acquired", "operating"]
LABEL_MAP = {"closed": 0, "acquired": 1, "operating": 2}


def aggregate_features(X):
    aggregated = []

    for startup in X:
        valid_rows = startup[np.any(startup != 0, axis=1)]

        if len(valid_rows) == 0:
            aggregated.append([0, 0, 0, 0])
            continue

        aggregated.append(
            [
                valid_rows[:, 0].mean(),
                valid_rows[:, 0].max(),
                valid_rows[:, 1].mean(),
                len(valid_rows),
            ]
        )

    return np.array(aggregated, dtype="float32")


def main():
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    print("Step 2 - Load Processed Data")
    X = np.load(PROCESSED_DIR / "X.npy")
    y = np.load(PROCESSED_DIR / "y.npy")
    print(X.shape)
    print(y.shape)

    print("Step 3 - Proper Train/Test Split")
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    print("Step 4 - Aggregate Features")
    X_train_agg = aggregate_features(X_train)
    X_test_agg = aggregate_features(X_test)

    print("Step 5 - Logistic Regression")
    baseline = LogisticRegression(max_iter=1000, class_weight="balanced")
    baseline.fit(X_train_agg, y_train)
    baseline_preds = baseline.predict(X_test_agg)

    print("Step 6 - Evaluate Baseline")
    report = classification_report(
        y_test,
        baseline_preds,
        target_names=LABEL_NAMES,
        zero_division=0,
    )
    accuracy = accuracy_score(y_test, baseline_preds)
    macro_f1 = f1_score(y_test, baseline_preds, average="macro")

    print(report)
    print("Accuracy:", accuracy)
    print("Macro F1:", macro_f1)

    (REPORTS_DIR / "baseline_classification_report.txt").write_text(report, encoding="utf-8")
    (REPORTS_DIR / "baseline_metrics.csv").write_text(
        "model,accuracy,macro_f1\n"
        f"Logistic Regression,{accuracy},{macro_f1}\n",
        encoding="utf-8",
    )
    joblib.dump(baseline, MODELS_DIR / "baseline_logistic_regression.pkl")
    joblib.dump(LABEL_MAP, MODELS_DIR / "label_encoder.pkl")


if __name__ == "__main__":
    main()
