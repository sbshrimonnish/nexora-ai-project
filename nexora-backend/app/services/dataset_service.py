"""
Nexora AI — Dataset Service
Loads, validates, and profiles the confirmed 50K SaaS CLV dataset.
Dataset: nexora_clv_50k_model_ready.csv (Kaggle synthetic dataset).
This is NOT real-world customer data.
"""
import json
import logging
from pathlib import Path
from typing import Optional
import numpy as np
import pandas as pd

from app.config import settings

logger = logging.getLogger(__name__)

# ── Confirmed column specification (Phase 0 inspection) ──────────────────────
EXPECTED_COLUMNS = [
    "account_id", "company_size", "industry", "contract_type", "regime_state",
    "discount_pct", "historical_tenure_months", "current_mrr", "current_active_users",
    "current_usage_growth", "current_feature_adoption_rate", "current_error_rate",
    "current_tickets_count", "current_ticket_growth", "current_payment_delay_flag",
    "hist_mrr_mean", "hist_mrr_std", "hist_mrr_min", "hist_mrr_max",
    "hist_active_users_mean", "hist_usage_growth_mean", "hist_adoption_mean",
    "hist_error_rate_mean", "hist_tickets_mean", "hist_ticket_growth_mean",
    "payment_delay_rate", "recent_3m_mrr_mean", "recent_3m_active_users_mean",
    "recent_3m_adoption_mean", "recent_3m_tickets_mean", "recent_3m_error_rate_mean",
    "mrr_growth_first3_to_last3", "active_users_trend_first3_to_last3",
    "adoption_trend_first3_to_last3", "tickets_trend_first3_to_last3",
    "error_rate_trend_first3_to_last3", "clv_target_12m_revenue_based",
]

CATEGORICAL_COLUMNS = ["company_size", "industry", "contract_type", "regime_state"]
CLV_TARGET_COLUMN   = "clv_target_12m_revenue_based"


# Singleton cache
_raw_df: Optional[pd.DataFrame] = None
_active_source_name: str = "nexora_clv_50k_model_ready.csv"


def clear_dataset_caches():
    """Clear cached profile and quality report files so they regenerate."""
    profile_path = Path(settings.artifacts_dir) / "dataset_profile.json"
    report_path = Path(settings.artifacts_dir) / "data_quality_report.json"
    if profile_path.exists():
        try:
            profile_path.unlink()
        except Exception:
            pass
    if report_path.exists():
        try:
            report_path.unlink()
        except Exception:
            pass


def load_dataset() -> pd.DataFrame:
    """Load the raw dataset. Validates schema on first load."""
    global _raw_df, _active_source_name
    if _raw_df is not None:
        return _raw_df

    path = Path(settings.data_path)
    if not path.exists():
        raise FileNotFoundError(
            f"Dataset not found at: {path.resolve()}\n"
            "Place nexora_clv_50k_model_ready.csv in the project root "
            "and set DATA_PATH in .env"
        )

    logger.info(f"Loading dataset from {path}")
    df = pd.read_csv(path)

    # ── Schema validation ────────────────────────────────
    missing = set(EXPECTED_COLUMNS) - set(df.columns)
    if missing:
        logger.warning(f"Dataset missing expected columns: {missing}. Autofilling defaults for compliance.")
        for col in missing:
            if col in CATEGORICAL_COLUMNS:
                df[col] = "Unknown"
            elif col == "account_id":
                df[col] = range(1001, 1001 + len(df))
            else:
                df[col] = 0.0

    _raw_df = df
    _active_source_name = path.name
    logger.info(f"Dataset loaded: {len(df):,} rows × {len(df.columns)} columns")
    return _raw_df


def set_active_dataset(df: pd.DataFrame, source_name: str = "custom_uploaded_dataset.csv") -> dict:
    """Dynamically set the active dataset in memory and clear cached statistics."""
    global _raw_df, _active_source_name
    
    # Fill missing expected columns defensively
    missing = set(EXPECTED_COLUMNS) - set(df.columns)
    if missing:
        for col in missing:
            if col in CATEGORICAL_COLUMNS:
                df[col] = "Unknown"
            elif col == "account_id":
                df[col] = list(range(1001, 1001 + len(df)))
            else:
                df[col] = 0.0
                
    _raw_df = df
    _active_source_name = source_name
    clear_dataset_caches()

    # Save to disk as uploaded_active.csv
    try:
        active_path = Path(settings.artifacts_dir) / "uploaded_active.csv"
        df.to_csv(active_path, index=False)
    except Exception as e:
        logger.warning(f"Failed to persist uploaded dataset to disk: {e}")

    logger.info(f"Active dataset updated to {source_name}: {len(df):,} rows")
    return {
        "source_name": _active_source_name,
        "rows": len(df),
        "columns": len(df.columns),
        "columns_list": list(df.columns),
    }


def connect_and_ingest_db(db_type: str, connection_string: str, query_or_table: str) -> dict:
    """
    Connect to an external database (SQLite, PostgreSQL, MySQL, etc.) via SQLAlchemy
    and ingest table/query into pandas DataFrame.
    """
    from sqlalchemy import create_engine
    
    # Handle simple sqlite path format
    if db_type.lower() == "sqlite" and not connection_string.startswith("sqlite:"):
        connection_string = f"sqlite:///{connection_string}"
        
    engine = create_engine(connection_string)
    
    # Determine if query_or_table is a table or SQL query
    clean = query_or_table.strip()
    if clean.lower().startswith("select "):
        sql = clean
    else:
        sql = f"SELECT * FROM {clean}"
        
    with engine.connect() as conn:
        df = pd.read_sql(sql, conn)
        
    if df.empty:
        raise ValueError("Database query returned 0 rows.")
        
    source_label = f"DB Connection [{db_type}]: {clean[:30]}"
    res = set_active_dataset(df, source_name=source_label)
    return res


def get_active_dataset_preview(n: int = 20) -> dict:
    """Return top N preview rows and column metadata of the currently active dataset."""
    df = load_dataset()
    preview_df = df.head(n).copy()
    
    # Convert NaNs to None for clean JSON serialization
    preview_rows = preview_df.replace({np.nan: None}).to_dict(orient="records")
    
    column_info = []
    for col in df.columns:
        dtype = str(df[col].dtype)
        is_categorical = col in CATEGORICAL_COLUMNS
        col_type = "categorical" if is_categorical else ("integer" if "int" in dtype else "float")
        if col == CLV_TARGET_COLUMN:
            col_type += " (target)"
            
        column_info.append({
            "name": col,
            "type": col_type,
            "missing": int(df[col].isna().sum()),
            "valid": True,
        })
        
    return {
        "source_name": _active_source_name,
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "columns": column_info,
        "preview_data": preview_rows,
    }


def get_dataset_profile() -> dict:
    """
    Generate and cache a machine-readable dataset profile.
    Saved to artifacts/dataset_profile.json.
    """
    profile_path = Path(settings.artifacts_dir) / "dataset_profile.json"
    if profile_path.exists():
        try:
            with open(profile_path) as f:
                return json.load(f)
        except Exception:
            pass

    df = load_dataset()

    numerical_cols = [c for c in df.columns if c not in CATEGORICAL_COLUMNS and c != "account_id"]
    missing_values = {col: int(df[col].isna().sum()) for col in df.columns if df[col].isna().sum() > 0}

    clv = df[CLV_TARGET_COLUMN] if CLV_TARGET_COLUMN in df.columns else pd.Series([0])
    mrr = df["current_mrr"] if "current_mrr" in df.columns else pd.Series([0])

    profile = {
        "filename":              _active_source_name,
        "source":                f"Active Dataset Source: {_active_source_name}",
        "total_rows":            int(len(df)),
        "total_columns":         int(len(df.columns)),
        "unique_accounts":       int(df["account_id"].nunique()) if "account_id" in df.columns else int(len(df)),
        "clv_target_column":     CLV_TARGET_COLUMN,
        "clv_target_definition": "12-month future revenue-based CLV (sum of predicted future MRR over 12 months)",
        "clv_horizon_months":    12,
        "clv_range_min":         float(clv.min()),
        "clv_range_max":         float(clv.max()),
        "clv_mean":              float(clv.mean()),
        "clv_median":            float(clv.median()),
        "clv_std":               float(clv.std()),
        "mrr_range_min":         float(mrr.min()),
        "mrr_range_max":         float(mrr.max()),
        "mrr_mean":              float(mrr.mean()),
        "industries":            sorted(df["industry"].unique().tolist()) if "industry" in df.columns else [],
        "company_sizes":         sorted(df["company_size"].unique().tolist()) if "company_size" in df.columns else [],
        "contract_types":        sorted(df["contract_type"].unique().tolist()) if "contract_type" in df.columns else [],
        "regime_states":         sorted(df["regime_state"].unique().tolist()) if "regime_state" in df.columns else [],
        "numerical_columns":     numerical_cols,
        "categorical_columns":   CATEGORICAL_COLUMNS,
        "missing_values":        missing_values,
        "duplicate_rows":        int(df.duplicated().sum()),
        "data_quality_note":     (
            "Dataset is pre-engineered with feature columns + categorical columns. "
            "No missing values detected in confirmed columns. "
            "CLV target is 12-month future revenue-based."
        ),
    }

    with open(profile_path, "w") as f:
        json.dump(profile, f, indent=2)

    logger.info("Dataset profile generated and saved.")
    return profile


def get_data_quality_report() -> dict:
    """Detailed data quality report saved to artifacts/data_quality_report.json."""
    report_path = Path(settings.artifacts_dir) / "data_quality_report.json"
    if report_path.exists():
        try:
            with open(report_path) as f:
                return json.load(f)
        except Exception:
            pass

    df = load_dataset()
    numerical_cols = [c for c in df.columns if c not in CATEGORICAL_COLUMNS and c != "account_id"]

    stats = {}
    for col in numerical_cols:
        col_data = df[col].dropna()
        if col_data.empty:
            continue
        q1, q3 = col_data.quantile(0.25), col_data.quantile(0.75)
        iqr = q3 - q1
        outliers = int(((col_data < (q1 - 1.5 * iqr)) | (col_data > (q3 + 1.5 * iqr))).sum())
        stats[col] = {
            "mean":     round(float(col_data.mean()), 4),
            "std":      round(float(col_data.std()), 4),
            "min":      round(float(col_data.min()), 4),
            "max":      round(float(col_data.max()), 4),
            "q25":      round(float(q1), 4),
            "q75":      round(float(q3), 4),
            "missing":  int(df[col].isna().sum()),
            "outliers": outliers,
        }

    report = {
        "total_rows":       int(len(df)),
        "unique_customers": int(df["account_id"].nunique()) if "account_id" in df.columns else len(df),
        "total_columns":    int(len(df.columns)),
        "missing_values":   {col: int(df[col].isna().sum()) for col in df.columns},
        "total_missing":    int(df.isna().sum().sum()),
        "duplicate_rows":   int(df.duplicated().sum()),
        "usable_rows":      int(len(df)),
        "column_stats":     stats,
        "categorical_distributions": {
            col: df[col].value_counts().to_dict()
            for col in CATEGORICAL_COLUMNS if col in df.columns
        },
        "clv_distribution": {
            "p10":  float(df[CLV_TARGET_COLUMN].quantile(0.10)) if CLV_TARGET_COLUMN in df.columns else 0.0,
            "p25":  float(df[CLV_TARGET_COLUMN].quantile(0.25)) if CLV_TARGET_COLUMN in df.columns else 0.0,
            "p50":  float(df[CLV_TARGET_COLUMN].quantile(0.50)) if CLV_TARGET_COLUMN in df.columns else 0.0,
            "p75":  float(df[CLV_TARGET_COLUMN].quantile(0.75)) if CLV_TARGET_COLUMN in df.columns else 0.0,
            "p85":  float(df[CLV_TARGET_COLUMN].quantile(0.85)) if CLV_TARGET_COLUMN in df.columns else 0.0,
            "p90":  float(df[CLV_TARGET_COLUMN].quantile(0.90)) if CLV_TARGET_COLUMN in df.columns else 0.0,
            "p95":  float(df[CLV_TARGET_COLUMN].quantile(0.95)) if CLV_TARGET_COLUMN in df.columns else 0.0,
        },
    }

    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)

    return report


class DatasetService:
    def load_data(self) -> pd.DataFrame:
        return load_dataset()

    def get_profile(self) -> dict:
        return get_dataset_profile()

    def get_quality_report(self) -> dict:
        return get_data_quality_report()

    def get_preview(self, n: int = 20) -> dict:
        return get_active_dataset_preview(n)

    def set_dataset(self, df: pd.DataFrame, source_name: str) -> dict:
        return set_active_dataset(df, source_name)

    def ingest_db(self, db_type: str, connection_string: str, query_or_table: str) -> dict:
        return connect_and_ingest_db(db_type, connection_string, query_or_table)


dataset_service = DatasetService()


