"""Cohort analytics router."""
from fastapi import APIRouter, Depends
from app.models.schemas import Envelope
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/cohorts", tags=["cohorts"])


@router.get("", response_model=Envelope)
@router.get("/analysis", response_model=Envelope)
def cohorts(_user=Depends(get_current_user)):
    from app.services.cohort_service import get_cohort_analytics
    return Envelope(data=get_cohort_analytics())

