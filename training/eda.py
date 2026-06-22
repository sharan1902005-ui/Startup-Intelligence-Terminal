from pathlib import Path
import os

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
PROCESSED_DIR = ROOT / "data" / "processed"
REPORTS_DIR = ROOT / "reports" / "figures"
MPLCONFIG_DIR = ROOT / ".matplotlib"
MPLCONFIG_DIR.mkdir(exist_ok=True)
os.environ.setdefault("MPLCONFIGDIR", str(MPLCONFIG_DIR))

try:
    import matplotlib

    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
except ModuleNotFoundError:
    plt = None


RAW_PATH = ROOT / "data" / "raw" / "investments_VC.csv"


def clean_money(value):
    if pd.isna(value):
        return np.nan
    return pd.to_numeric(str(value).replace(",", "").strip(), errors="coerce")


def save_bar_plot(series, title, path, top_n=None):
    if plt is None:
        print(f"Skipping plot, matplotlib is not installed: {path}")
        return
    values = series.head(top_n) if top_n else series
    ax = values.plot(kind="bar", figsize=(10, 5), title=title)
    ax.set_xlabel("")
    ax.set_ylabel("count")
    plt.tight_layout()
    plt.savefig(path)
    plt.close()


def save_hist(series, title, path, bins=50):
    if plt is None:
        print(f"Skipping plot, matplotlib is not installed: {path}")
        return
    ax = series.dropna().hist(bins=bins, figsize=(10, 5))
    ax.set_title(title)
    plt.tight_layout()
    plt.savefig(path)
    plt.close()


def main():
    PROCESSED_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(RAW_PATH, encoding="latin1", skipinitialspace=True)
    df.columns = df.columns.str.strip()

    print("\nStep 4 - Load Dataset")
    print(df.head())

    print("\nStep 5 - Understand Columns")
    print(df.columns)

    column_list_path = PROCESSED_DIR / "column_list.txt"
    column_list_path.write_text("\n".join(df.columns) + "\n", encoding="utf-8")
    print(f"Saved column list to: {column_list_path}")

    print("\nStep 6 - Basic Inspection")
    print(df.shape)
    print(df.info())
    print(df.describe(include="all"))

    print("\nStep 7 - Missing Values")
    print(df.isnull().sum())
    missing = df.isnull().mean().sort_values(ascending=False) * 100
    print(missing)
    missing.to_csv(PROCESSED_DIR / "missing_values_percent.csv", header=["missing_percent"])

    rename_map = {
        "name": "company_name",
        "market": "industry",
        "funding_total_usd": "funding_amount",
        "first_funding_at": "funding_date",
        "country_code": "country",
    }
    df = df.rename(columns=rename_map)

    if "funding_amount" in df.columns:
        df["funding_amount"] = df["funding_amount"].apply(clean_money)

    round_amount_columns = [
        "seed",
        "venture",
        "equity_crowdfunding",
        "undisclosed",
        "convertible_note",
        "debt_financing",
        "angel",
        "grant",
        "private_equity",
        "post_ipo_equity",
        "post_ipo_debt",
        "secondary_market",
        "product_crowdfunding",
        "round_A",
        "round_B",
        "round_C",
        "round_D",
        "round_E",
        "round_F",
        "round_G",
        "round_H",
    ]
    available_round_columns = [col for col in round_amount_columns if col in df.columns]
    if available_round_columns and "funding_round_type" not in df.columns:
        round_amounts = (
            df[available_round_columns]
            .apply(pd.to_numeric, errors="coerce")
            .fillna(0)
        )
        df["funding_round_type"] = (
            round_amounts
            .idxmax(axis=1)
            .where(round_amounts.sum(axis=1) > 0)
        )

    print("\nCanonical columns for modeling:")
    print([col for col in ["company_name", "funding_round_type", "funding_date", "funding_amount", "status", "country", "industry"] if col in df.columns])

    print("\nStep 8 - Check Status Distribution")
    print(df["status"].value_counts())
    save_bar_plot(
        df["status"].value_counts(),
        "Startup Status Distribution",
        REPORTS_DIR / "status_distribution.png",
    )

    print("\nStep 9 - Funding Round Distribution")
    print(df["funding_round_type"].value_counts())
    save_bar_plot(
        df["funding_round_type"].value_counts(),
        "Top Funding Round Types",
        REPORTS_DIR / "funding_round_distribution_top10.png",
        top_n=10,
    )

    print("\nStep 10 - Funding Amount Distribution")
    save_hist(
        df["funding_amount"],
        "Funding Amount Distribution",
        REPORTS_DIR / "funding_amount_distribution.png",
    )
    df["log_amount"] = np.log1p(df["funding_amount"])
    save_hist(
        df["log_amount"],
        "Log Funding Amount Distribution",
        REPORTS_DIR / "log_funding_amount_distribution.png",
    )

    print("\nStep 11 - Date Cleanup")
    df["funding_date"] = pd.to_datetime(df["funding_date"], errors="coerce")
    print(df["funding_date"].min())
    print(df["funding_date"].max())

    print("\nStep 12 - Remove Broken Rows")
    df = df.dropna(subset=["company_name", "funding_date", "funding_amount"])
    print(df.shape)

    print("\nStep 13 - Count Funding Events per Startup")
    if "funding_rounds" in df.columns:
        round_counts = pd.to_numeric(df["funding_rounds"], errors="coerce")
    else:
        round_counts = df.groupby("company_name").size()

    print(round_counts.describe())
    save_hist(
        round_counts,
        "Funding Events per Startup",
        REPORTS_DIR / "funding_events_per_startup.png",
        bins=30,
    )

    print("\nStep 14 - Keep Useful Startups")
    if "funding_rounds" in df.columns:
        df = df[pd.to_numeric(df["funding_rounds"], errors="coerce") >= 2]
    else:
        valid_startups = round_counts[round_counts >= 2].index
        df = df[df["company_name"].isin(valid_startups)]
    print(df.shape)

    print("\nStep 15 - Save Cleaned Dataset")
    cleaned_path = PROCESSED_DIR / "cleaned_startups.csv"
    df.to_csv(cleaned_path, index=False)
    print(f"Saved cleaned dataset to: {cleaned_path}")

    print("\nStep 16 - Create Label Mapping")
    label_map = {
        "closed": 0,
        "acquired": 1,
        "ipo": 2,
        "operating": 3,
    }
    label_map_path = PROCESSED_DIR / "label_map.csv"
    pd.Series(label_map, name="label").to_csv(label_map_path, header=True)
    print(label_map)
    print(f"Saved label map to: {label_map_path}")


if __name__ == "__main__":
    main()
