from pathlib import Path
import os

import joblib
import numpy as np
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix, f1_score
from sklearn.model_selection import train_test_split


ROOT = Path(__file__).resolve().parents[1]
PROCESSED_DIR = ROOT / "data" / "processed"
MODELS_DIR = ROOT / "models"
REPORTS_DIR = ROOT / "reports"
FIGURES_DIR = REPORTS_DIR / "figures"
MPLCONFIG_DIR = ROOT / ".matplotlib"
MPLCONFIG_DIR.mkdir(exist_ok=True)
os.environ.setdefault("MPLCONFIGDIR", str(MPLCONFIG_DIR))
LABEL_NAMES = ["closed", "acquired", "operating"]
LABEL_MAP = {"closed": 0, "acquired": 1, "operating": 2}

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt


def import_tensorflow():
    try:
        from tensorflow.keras.callbacks import EarlyStopping
        from tensorflow.keras.layers import LSTM, Dense, Dropout, Masking
        from tensorflow.keras.models import Sequential
    except ModuleNotFoundError as exc:
        raise SystemExit(
            "TensorFlow is not installed. Install it with:\n"
            "  python -m pip install tensorflow\n"
            "Then rerun training/train_lstm.py."
        ) from exc

    return Sequential, Masking, LSTM, Dropout, Dense, EarlyStopping


def save_confusion_matrix(cm, path):
    fig, ax = plt.subplots(figsize=(6, 5))
    image = ax.imshow(cm, cmap="Blues")
    fig.colorbar(image, ax=ax)
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


def save_training_curves(history, path):
    plt.figure(figsize=(8, 5))
    plt.plot(history.history["loss"])
    plt.plot(history.history["val_loss"])
    plt.legend(["train", "validation"])
    plt.xlabel("epoch")
    plt.ylabel("loss")
    plt.tight_layout()
    plt.savefig(path)
    plt.close()


def main():
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    FIGURES_DIR.mkdir(parents=True, exist_ok=True)

    Sequential, Masking, LSTM, Dropout, Dense, EarlyStopping = import_tensorflow()

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

    print("Step 7 - Build LSTM")
    model = Sequential(
        [
            Masking(mask_value=0, input_shape=(X.shape[1], X.shape[2]), name="masking_layer"),
            LSTM(64, name="lstm_layer"),
            Dropout(0.3),
            Dense(32, activation="relu", name="embedding_layer"),
            Dense(len(LABEL_NAMES), activation="softmax", name="prediction_layer"),
        ]
    )

    print("Step 8 - Compile")
    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    print("Step 9 - Early Stopping")
    early_stop = EarlyStopping(
        monitor="val_loss",
        patience=5,
        restore_best_weights=True,
    )

    print("Step 10 - Train")
    history = model.fit(
        X_train,
        y_train,
        validation_split=0.2,
        epochs=50,
        batch_size=32,
        callbacks=[early_stop],
        verbose=2,
    )

    print("Step 11 - Save Model")
    model.save(MODELS_DIR / "lstm_model.h5")
    joblib.dump(LABEL_MAP, MODELS_DIR / "label_encoder.pkl")

    print("Step 12 - Predict")
    probs = model.predict(X_test)
    preds = probs.argmax(axis=1)

    print("Step 13 - Evaluate LSTM")
    report = classification_report(
        y_test,
        preds,
        target_names=LABEL_NAMES,
        zero_division=0,
    )
    accuracy = accuracy_score(y_test, preds)
    print(report)

    print("Step 14 - Macro F1")
    macro_f1 = f1_score(y_test, preds, average="macro")
    print("Macro F1:", macro_f1)

    print("Step 15 - Confusion Matrix")
    cm = confusion_matrix(y_test, preds)
    print(cm)
    save_confusion_matrix(cm, FIGURES_DIR / "lstm_confusion_matrix.png")

    print("Step 17 - Training Curves")
    save_training_curves(history, FIGURES_DIR / "lstm_training_curves.png")

    (REPORTS_DIR / "lstm_classification_report.txt").write_text(report, encoding="utf-8")
    (REPORTS_DIR / "lstm_metrics.csv").write_text(
        "model,accuracy,macro_f1\n"
        f"LSTM,{accuracy},{macro_f1}\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
