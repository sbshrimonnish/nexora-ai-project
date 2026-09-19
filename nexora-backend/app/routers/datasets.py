"""Dataset profile, preview, database ingestion, and status router."""
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Form
from pydantic import BaseModel
from typing import Optional
from app.models.schemas import Envelope
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/datasets", tags=["datasets"])


class DbIngestionRequest(BaseModel):
    db_type: str = "sqlite"  # sqlite, postgresql, mysql, duckdb
    connection_string: str = "sqlite:///./artifacts/nexora.db"
    query_or_table: str = "training_jobs"
    activate: bool = True


@router.get("/status", response_model=Envelope)
def dataset_status(_user=Depends(get_current_user)):
    """System and dataset connectivity status report."""
    from app.services.dataset_service import dataset_service
    from app.models.db import engine
    
    profile = dataset_service.get_profile()
    
    # Test DB engine connection
    db_status = "Disconnected"
    try:
        with engine.connect() as conn:
            db_status = "Connected (SQLite nexora.db)"
    except Exception as e:
        db_status = f"Error: {str(e)}"
        
    return Envelope(data={
        "backend_status": "Online & Operational",
        "database_connection": db_status,
        "active_dataset": {
            "source_name": profile.get("filename"),
            "total_rows": profile.get("total_rows"),
            "total_columns": profile.get("total_columns"),
            "clv_target_column": profile.get("clv_target_column"),
        },
        "model_engine": "Scikit-Learn / XGBoost ML Pipeline Active",
    })


@router.get("/profile", response_model=Envelope)
def dataset_profile(_user=Depends(get_current_user)):
    from app.services.dataset_service import get_dataset_profile
    return Envelope(data=get_dataset_profile())


@router.get("/quality-report", response_model=Envelope)
def quality_report(_user=Depends(get_current_user)):
    from app.services.dataset_service import get_data_quality_report
    return Envelope(data=get_data_quality_report())


@router.get("/preview", response_model=Envelope)
def dataset_preview(n: int = 20, _user=Depends(get_current_user)):
    """Get active dataset top N preview rows and column types."""
    from app.services.dataset_service import dataset_service
    return Envelope(data=dataset_service.get_preview(n=n))


@router.post("/upload", response_model=Envelope)
async def upload_dataset(
    file: UploadFile = File(...),
    activate: bool = Form(True),
    _user=Depends(get_current_user)
):
    """
    Accept CSV upload, validate schema, return quality report, and activate dataset if requested.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(400, "Only CSV files are accepted")

    content = await file.read()
    try:
        import io, pandas as pd
        df = pd.read_csv(io.BytesIO(content))

        from app.services.dataset_service import EXPECTED_COLUMNS, dataset_service
        missing = set(EXPECTED_COLUMNS) - set(df.columns)
        extra   = set(df.columns) - set(EXPECTED_COLUMNS)

        activated_info = None
        if activate:
            activated_info = dataset_service.set_dataset(df, source_name=file.filename)

        preview = dataset_service.get_preview(n=10)

        return Envelope(data={
            "filename":       file.filename,
            "rows":           len(df),
            "columns":        len(df.columns),
            "missing_cols":   list(missing),
            "extra_cols":     list(extra),
            "schema_valid":   len(missing) == 0,
            "activated":      activate,
            "missing_values": {c: int(df[c].isna().sum()) for c in df.columns if df[c].isna().sum() > 0},
            "preview_data":   preview["preview_data"],
            "columns_info":   preview["columns"],
            "note":           f"Uploaded dataset {file.filename} parsed and activated into working memory." if activate else "Dataset validated.",
        })
    except Exception as e:
        raise HTTPException(400, f"Failed to parse CSV: {str(e)}")


@router.post("/ingest-db", response_model=Envelope)
def ingest_database(req: DbIngestionRequest, _user=Depends(get_current_user)):
    """
    Ingest a table or query from an external or local database engine (SQLite, PostgreSQL, MySQL).
    """
    from app.services.dataset_service import dataset_service
    try:
        res = dataset_service.ingest_db(
            db_type=req.db_type,
            connection_string=req.connection_string,
            query_or_table=req.query_or_table,
        )
        preview = dataset_service.get_preview(n=10)
        return Envelope(data={
            "message": "Database table ingested successfully",
            "source_name": res["source_name"],
            "rows": res["rows"],
            "columns": res["columns"],
            "preview_data": preview["preview_data"],
            "columns_info": preview["columns"],
        })
    except Exception as e:
        raise HTTPException(400, f"Database Ingestion Failed: {str(e)}")

