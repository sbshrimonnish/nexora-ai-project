"""Revenue forecast and ARR router."""
from fastapi import APIRouter, Depends, Query
from app.models.schemas import Envelope
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/forecast", tags=["forecast"])


@router.get("/revenue", response_model=Envelope)
def revenue_forecast(
    horizon: int = Query(6, ge=3, le=12),
    _user=Depends(get_current_user),
):
    from app.services.forecast_service import get_revenue_forecast
    return Envelope(data=get_revenue_forecast(horizon=horizon))


@router.get("/arr", response_model=Envelope)
def arr_summary(_user=Depends(get_current_user)):
    from app.services.forecast_service import get_arr_summary
    return Envelope(data=get_arr_summary())
