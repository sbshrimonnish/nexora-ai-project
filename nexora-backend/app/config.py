"""
Nexora AI Backend — Configuration
All secrets and paths are loaded from environment variables / .env file.
Never hardcode secrets in source code.
"""
from pydantic_settings import BaseSettings
from pydantic import Field
from pathlib import Path
import os


class Settings(BaseSettings):
    # ── Data ─────────────────────────────────────────────
    data_path: str = Field(
        default="../nexora_clv_50k_model_ready.csv",
        description="Path to the 50K SaaS CLV dataset CSV",
    )
    model_dir: str = Field(default="./artifacts/models")
    artifacts_dir: str = Field(default="./artifacts")
    clv_horizon: int = Field(default=12, description="CLV prediction horizon in months (12/24/36)")

    # ── Auth ─────────────────────────────────────────────
    jwt_secret: str = Field(default="CHANGE_ME_in_production", description="JWT signing secret")
    jwt_algorithm: str = Field(default="HS256")
    jwt_expire_minutes: int = Field(default=480)
    demo_username: str = Field(default="admin")
    demo_password: str = Field(default="nexora2025")

    # ── Gemini (optional) ────────────────────────────────
    gemini_api_key: str = Field(default="", description="Google Gemini API key — leave blank to disable")
    gemini_model: str = Field(default="gemini-3.6-flash")

    # ── Server ───────────────────────────────────────────
    host: str = Field(default="0.0.0.0")
    port: int = Field(default=8000)
    cors_origins: str = Field(
        default="http://localhost:5173,http://localhost:8443,http://127.0.0.1:5173"
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    @property
    def gemini_enabled(self) -> bool:
        return bool(self.gemini_api_key and self.gemini_api_key != "")

    def ensure_dirs(self):
        for sub in ["models", "metrics", "explanations", "forecasts", "reports"]:
            Path(self.artifacts_dir, sub).mkdir(parents=True, exist_ok=True)

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "ignore"}


settings = Settings()
settings.ensure_dirs()
