from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler


ROOT = Path(__file__).resolve().parents[1]
CLEAN_PATH = ROOT / "data" / "processed" / "cleaned_startups.csv"
PROCESSED_DIR = ROOT / "data" / "processed"
MODELS_DIR = ROOT / "models"
MAX_LEN = 15

ROUND_COLUMNS = [
    ("seed", "Seed"),
    ("angel", "Angel"),
    ("grant", "Grant"),
    ("equity_crowdfunding", "Equity Crowdfunding"),
    ("product_crowdfunding", "Product Crowdfunding"),
    ("convertible_note", "Convertible Note"),
    ("venture", "Venture"),
    ("round_A", "Series A"),
    ("round_B", "Series B"),
    ("round_C", "Series C"),
    ("round_D", "Series D"),
    ("round_E", "Series E"),
    ("round_F", "Series F"),
    ("round_G", "Series G"),
    ("round_H", "Series H"),
    ("debt_financing", "Debt Financing"),
    ("private_equity", "Private Equity"),
    ("secondary_market", "Secondary Market"),
    ("post_ipo_equity", "Post IPO Equity"),
    ("post_ipo_debt", "Post IPO Debt"),
    ("undisclosed", "Undisclosed"),
]

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

LABEL_MAP = {
    "closed": 0,
    "acquired": 1,
    "operating": 2,
}


def pad_sequences_numpy(sequences, maxlen, dtype="float32"):
    feature_count = sequences[0].shape[1]
    padded = np.zeros((len(sequences), maxlen, feature_count), dtype=dtype)
    for index, sequence in enumerate(sequences):
        clipped = sequence[:maxlen]
        padded[index, : len(clipped), :] = clipped
    return padded


def expand_company_rows_to_round_events(df):
    round_columns = [(col, label) for col, label in ROUND_COLUMNS if col in df.columns]
    event_rows = []

    for _, row in df.iterrows():
        first_date = row["funding_date"]
        last_date = pd.to_datetime(row.get("last_funding_at"), errors="coerce")
        if pd.isna(last_date):
            last_date = first_date

        nonzero_rounds = []
        for col, label in round_columns:
            amount = pd.to_numeric(row.get(col), errors="coerce")
            if pd.notna(amount) and amount > 0:
                nonzero_rounds.append((col, label, float(amount)))

        if not nonzero_rounds:
            amount = pd.to_numeric(row.get("funding_amount"), errors="coerce")
            if pd.notna(amount) and amount > 0:
                label = row.get("funding_round_type", "Unknown")
                nonzero_rounds.append(("funding_amount", label, float(amount)))

        expected_rounds = pd.to_numeric(row.get("funding_rounds"), errors="coerce")
        expected_rounds = int(expected_rounds) if pd.notna(expected_rounds) and expected_rounds > 0 else len(nonzero_rounds)
        if expected_rounds > len(nonzero_rounds):
            total_amount = pd.to_numeric(row.get("funding_amount"), errors="coerce")
            if pd.notna(total_amount) and total_amount > 0:
                label = row.get("funding_round_type", "Unknown")
                amount = float(total_amount) / expected_rounds
                nonzero_rounds = [("funding_amount", label, amount) for _ in range(expected_rounds)]

        round_count = len(nonzero_rounds)
        for round_index, (_, label, amount) in enumerate(nonzero_rounds):
            if round_count <= 1:
                event_date = first_date
            else:
                fraction = round_index / (round_count - 1)
                event_date = first_date + (last_date - first_date) * fraction

            event_rows.append(
                {
                    "company_name": row["company_name"],
                    "funding_date": event_date,
                    "funding_amount": amount,
                    "funding_round_type": label,
                    "status": row["status"],
                    "country": row.get("country"),
                    "industry": row.get("industry"),
                }
            )

    return pd.DataFrame(event_rows)


def main():
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    print("Step 1 - Load Clean Dataset")
    df = pd.read_csv(CLEAN_PATH)
    df["funding_date"] = pd.to_datetime(df["funding_date"], errors="coerce")
    df["status"] = df["status"].astype(str).str.lower().str.strip()
    df = df[df["status"].isin(LABEL_MAP)]
    df = df.dropna(subset=["company_name", "funding_date", "funding_amount", "status"])

    has_wide_round_columns = any(col in df.columns for col, _ in ROUND_COLUMNS)
    if has_wide_round_columns:
        print("Expanding company-level rows into funding-round events.")
        df = expand_company_rows_to_round_events(df)

    df["funding_date"] = pd.to_datetime(df["funding_date"], errors="coerce")
    df["funding_amount"] = pd.to_numeric(df["funding_amount"], errors="coerce")
    df = df.dropna(subset=["company_name", "funding_date", "funding_amount", "funding_round_type"])
    df = df[df["funding_amount"] > 0]

    print("Step 2 - Sort Chronologically")
    df = df.sort_values(["company_name", "funding_date"])

    print("Step 3 - Create Round Number")
    df["round_number"] = df.groupby("company_name").cumcount() + 1

    print("Step 4 - Days Since Previous Round")
    df["days_since_last_round"] = (
        df.groupby("company_name")["funding_date"].diff().dt.days.fillna(0)
    )

    print("Step 5 - Funding Growth Rate")
    df["funding_growth_rate"] = (
        df.groupby("company_name")["funding_amount"]
        .pct_change()
        .replace([np.inf, -np.inf], np.nan)
        .fillna(0)
    )

    print("Step 6 - Total Funding Raised")
    df["total_funding"] = df.groupby("company_name")["funding_amount"].cumsum()

    print("Step 7 - Funding Velocity")
    elapsed_days = df.groupby("company_name")["funding_date"].transform(lambda dates: (dates - dates.min()).dt.days)
    df["funding_velocity"] = df["total_funding"] / (elapsed_days + 1)

    print("Step 8 - Startup Age at Round")
    first_date = df.groupby("company_name")["funding_date"].transform("min")
    df["startup_age_days"] = (df["funding_date"] - first_date).dt.days

    print("Step 9 - Log Funding Amount")
    df["log_amount"] = np.log1p(df["funding_amount"])

    print("Step 10 - Encode Funding Round Type")
    round_encoder = LabelEncoder()
    df["round_type_encoded"] = round_encoder.fit_transform(df["funding_round_type"].astype(str))
    joblib.dump(round_encoder, MODELS_DIR / "round_encoder.pkl")

    print("Step 11 - Select Final Sequence Features")
    print(FEATURES)

    print("Step 12 - Normalize Features")
    scaler = StandardScaler()
    df[FEATURES] = scaler.fit_transform(df[FEATURES])
    joblib.dump(scaler, MODELS_DIR / "scaler.pkl")

    print("Step 13 - Build Startup Sequences")
    sequences = []
    labels = []
    startup_names = []

    for company, group in df.groupby("company_name"):
        group = group.sort_values("funding_date")
        sequence = group[FEATURES].values
        label = group["status"].iloc[-1]

        if len(sequence) >= 2:
            sequences.append(sequence)
            labels.append(label)
            startup_names.append(company)

    print("Step 14 - Convert Labels")
    y = np.array([LABEL_MAP[label] for label in labels], dtype="int64")

    print("Step 15 - Check Sequence Lengths")
    lengths = [len(seq) for seq in sequences]
    print(min(lengths), max(lengths))
    pd.DataFrame({"company_name": startup_names, "sequence_length": lengths}).to_csv(
        PROCESSED_DIR / "sequence_lengths.csv",
        index=False,
    )

    print("Step 16 - Decide Max Sequence Length")
    print(MAX_LEN)

    print("Step 17 - Pad Sequences")
    try:
        from tensorflow.keras.preprocessing.sequence import pad_sequences

        X = pad_sequences(sequences, maxlen=MAX_LEN, padding="post", truncating="post", dtype="float32")
    except ModuleNotFoundError:
        print("TensorFlow not installed; using NumPy padding fallback.")
        X = pad_sequences_numpy(sequences, maxlen=MAX_LEN, dtype="float32")
    print(X.shape)

    print("Step 18 - Save Processed Arrays")
    np.save(PROCESSED_DIR / "X.npy", X)
    np.save(PROCESSED_DIR / "y.npy", y)
    np.save(PROCESSED_DIR / "startup_names.npy", np.array(startup_names, dtype=object))
    df.to_csv(PROCESSED_DIR / "sequence_events.csv", index=False)
    (PROCESSED_DIR / "sequence_features.txt").write_text("\n".join(FEATURES) + "\n", encoding="utf-8")
    pd.Series(LABEL_MAP, name="label").to_csv(PROCESSED_DIR / "sequence_label_map.csv", header=True)

    print("Step 19 - Verify Everything")
    print(X.shape)
    print(y.shape)
    print(X[0])


if __name__ == "__main__":
    main()
