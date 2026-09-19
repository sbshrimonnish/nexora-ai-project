"""CSV export router — streaming for large datasets."""
import io
import csv
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from typing import Optional
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/export", tags=["export"])


@router.get("/customers")
def export_customers(
    segment:  Optional[str] = Query(None),
    industry: Optional[str] = Query(None),
    _user=Depends(get_current_user),
):
    """Stream all (or filtered) customer records as CSV."""
    from app.services.churn_service import get_churn_predictions
    df = get_churn_predictions().copy()

    if segment:
        df = df[df["clv_segment"] == segment]
    if industry:
        df = df[df["industry"].str.lower() == industry.lower()]

    export_cols = [
        "account_id", "industry", "company_size", "contract_type",
        "current_mrr", "predicted_clv", "clv_segment", "clv_trajectory",
        "health_score", "churn_probability", "churn_risk_level",
        "historical_tenure_months", "current_feature_adoption_rate",
        "payment_delay_rate",
    ]
    df_export = df[export_cols].rename(columns={
        "historical_tenure_months": "tenure_months",
        "current_feature_adoption_rate": "feature_adoption_rate",
    })

    def generate():
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow(df_export.columns.tolist())
        yield buf.getvalue()
        buf.truncate(0); buf.seek(0)

        for _, row in df_export.iterrows():
            writer.writerow(row.tolist())
            yield buf.getvalue()
            buf.truncate(0); buf.seek(0)

    filename = f"nexora_customers{'_' + segment if segment else ''}.csv"
    return StreamingResponse(
        generate(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
