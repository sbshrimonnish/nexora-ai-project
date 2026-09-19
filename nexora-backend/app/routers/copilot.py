"""Nexora Copilot router — Gemini-powered, backend-only key."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from app.models.schemas import Envelope
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/copilot", tags=["copilot"])


class ChatRequest(BaseModel):
    message: str
    history: list[dict] | None = None


@router.post("/chat", response_model=Envelope)
def chat(req: ChatRequest, _user=Depends(get_current_user)):
    from app.services.copilot_service import chat as gemini_chat
    result = gemini_chat(req.message, req.history)
    return Envelope(data=result)


@router.get("/status", response_model=Envelope)
def copilot_status(_user=Depends(get_current_user)):
    from app.config import settings
    return Envelope(data={
        "available":      settings.gemini_enabled,
        "model":          settings.gemini_model if settings.gemini_enabled else None,
        "mode":           "live" if settings.gemini_enabled else "demo",
        "note":           (
            "Gemini API active — responses grounded in real Nexora data."
            if settings.gemini_enabled
            else "Set GEMINI_API_KEY in .env to enable live Gemini responses."
        ),
    })
