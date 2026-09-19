"""Auth router — /api/auth/login, /api/auth/logout"""
from fastapi import APIRouter, HTTPException, status
from app.models.schemas import LoginRequest, TokenResponse, Envelope
from app.services.auth_service import verify_credentials, create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=Envelope)
def login(req: LoginRequest):
    if not verify_credentials(req.username, req.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    token = create_access_token({"sub": req.username})
    return Envelope(
        success=True,
        data=TokenResponse(access_token=token, username=req.username).model_dump(),
        message="Login successful",
    )


@router.post("/logout")
def logout():
    # JWT is stateless — client discards the token
    return Envelope(success=True, message="Logged out successfully")
