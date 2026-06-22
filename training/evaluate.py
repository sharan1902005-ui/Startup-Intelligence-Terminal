from pathlib import Path
import os

import joblib
import numpy as np
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from sklearn.model_selection import train_test_split

from train_baseline import aggregate_features


ROOT = Path(__file__).resolve().parents[1]
PROCESSED_DIR = ROOT / "data" / "processed"
MODELS_DIR = ROOT / "models"
REPORTS_DIR = ROOT / "reports"
FIGURES_DIR = REPORTS_DIR / "figures"
MPLCONFIG_DIR = ROOT / ".matplotlib"
MPLCONFIG_DIR.mkdir(exist_ok=True)
os.environ.setdefault("MPLCONFIGDIR", str(MPLCONFIG_DIR))
LABEL_NAMES = ["closed", "acquired", "operating"]

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt


def save_confusion_matrix(cm, title, path):
    fig, ax = plt.subplots(figsize=(6, 5))
    image = ax.imshow(cm, cmap="Blues")
    fig.colorbar(image, ax=ax)
    ax.set_title(title)
    ax.set_xticks(np.arange(len(LABEL_NAMES)), labels=LABEL_NAMES, rotation=30, ha="right")
    ax.set_yticks(np.arange(len(LABEL_NAMES)), labels=LABEL_NAMES)
    ax.set_xlabel("Predicted")
    ax.set_ylabel("Actual")

    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            ax.text(j, i, cm[i, j], ha="center", va="center", color="black")

    plt.tight_layout()
    plt.savefig(path)
    plt.close(fig)


def evaluate_predictions(model_name, y_test, preds):
    report = classification_report(
        y_test,
        preds,
        target_names=LABEL_NAMES,
        zero_division=0,
    )
    accuracy = accuracy_score(y_test, preds)
    macro_f1 = f1_score(y_test, preds, average="macro")

    print(f"\n{model_name}")
    print(report)
    print("Accuracy:", accuracy)
    print("Macro F1:", macro_f1)

    safe_name = model_name.lower().replace(" ", "_")
    (REPORTS_DIR / f"{safe_name}_classification_report.txt").write_text(report, encoding="utf-8")
    save_confusion_matrix(
        confusion_matrix(y_test, preds),
        model_name,
        FIGURES_DIR / f"{safe_name}_confusion_matrix.png",
    )

    return {"Model": model_name, "Accuracy": accuracy, "Macro F1": macro_f1}


def main():
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    FIGURES_DIR.mkdir(parents=True, exist_ok=True)

    print("Step 2 - Load Processed Data")
    X = np.load(PROCESSED_DIR / "X.npy")
    y = np.load(PROCESSED_DIR / "y.npy")
    print(X.shape)
    print(y.shape)

    print("Step 3 - Proper Train/Test Split")
    X_train, X_test, _, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    rows = []

    baseline_path = MODELS_DIR / "baseline_logistic_regression.pkl"
    if baseline_path.exists():
        baseline = joblib.load(baseline_path)
        baseline_preds = baseline.predict(aggregate_features(X_test))
        rows.append(evaluate_predictions("Logistic Regression", y_test, baseline_preds))
    else:
        print(f"Skipping baseline, missing model: {baseline_path}")

    lstm_path = MODELS_DIR / "lstm_model.h5"
    if lstm_path.exists():
        try:
            from tensorflow.keras.models import load_model
        except ModuleNotFoundError:
            print("Skipping LSTM, TensorFlow is not installed.")
        else:
            model = load_model(lstm_path)
            probs = model.predict(X_test)
            preds = probs.argmax(axis=1)
            rows.append(evaluate_predictions("LSTM", y_test, preds))
    else:
        print(f"Skipping LSTM, missing model: {lstm_path}")

    if rows:
        metrics_path = REPORTS_DIR / "model_comparison.csv"
        lines = ["Model,Accuracy,Macro F1"]
        for row in rows:
            lines.append(f"{row['Model']},{row['Accuracy']},{row['Macro F1']}")
        metrics_path.write_text("\n".join(lines) + "\n", encoding="utf-8")

        print("\nStep 16 - Compare Models")
        print(metrics_path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    main()
