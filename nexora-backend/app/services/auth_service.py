"""
Nexora AI — Auth Service (local academic use)
Simple JWT-based authentication for protected routes.
Credentials stored in environment variables — never hardcoded.
For production, replace with a proper user database and password hashing.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional

try:
    import jwt
    from jwt import PyJWTError as JWTError
except ImportError:
    try:
        from jose import JWTError, jwt
    except ImportError:
        JWTError = Exception
        jwt = None

from app.config import settings

from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
try:
    from passlib.context import CryptContext
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
except Exception:
    pwd_context = None
bearer = HTTPBearer(auto_error=False)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def verify_credentials(username: str, password: str) -> bool:
    """Check against env-configured demo credentials."""
    return (
        username == settings.demo_username
        and password == settings.demo_password
    )


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
) -> dict:
    """Dependency — validates JWT token on protected routes."""
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
        username = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"username": username}
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
