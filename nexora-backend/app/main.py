"""
Nexora AI — FastAPI Main Application
Production-quality backend for SaaS Customer Lifetime Value (CLV) & XAI.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import (
    auth,
    customers,
    clv,
    churn,
    forecast,
    cohorts,
    model,
    datasets,
    copilot,
    export,
    individual_analysis,
)
from app.services.dataset_service import dataset_service
from app.services.training_service import training_service

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("nexora.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application Lifespan Context Manager.
    Runs initial dataset profiling and ensures baseline model exists on startup.
    """
    logger.info("Starting Nexora AI Engine...")
    # Ensure artifact directories exist
    settings.ensure_dirs()

    # Load dataset profile
    try:
        profile = dataset_service.get_profile()
        logger.info(
            f"Dataset loaded successfully: {profile.get('row_count', 0)} rows, "
            f"{profile.get('column_count', 0)} columns."
        )
    except Exception as e:
        logger.warning(f"Initial dataset loading failed or file missing: {e}")

    # Check if a model is already trained; if not, initiate initial training
    try:
        if not training_service.get_active_model_metrics():
            logger.info("No active model found. Launching initial training run...")
            training_service.train_all_candidates()
            logger.info("Initial model training completed successfully.")
        else:
            logger.info("Active model metrics loaded from disk.")
    except Exception as e:
        logger.error(f"Error checking/training initial model: {e}")

    yield
    logger.info("Shutting down Nexora AI Engine.")


app = FastAPI(
    title="Nexora AI Platform",
    description="Explainable Customer Lifetime Value (CLV) & XAI Analytics Engine for B2B/SaaS",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router)
app.include_router(customers.router)
app.include_router(clv.router)
app.include_router(churn.router)
app.include_router(forecast.router)
app.include_router(cohorts.router)
app.include_router(model.router)
app.include_router(datasets.router)
app.include_router(copilot.router)
app.include_router(export.router)
app.include_router(individual_analysis.router)


@app.get("/health", tags=["system"])
@app.get("/api/health", tags=["system"])
async def health_check():
    """Health check endpoint returning system status and model readiness."""
    active_model = training_service.get_active_model_metrics()
    return JSONResponse(
        content={
            "status": "online",
            "service": "Nexora AI Backend",
            "version": "1.0.0",
            "dataset_rows": dataset_service.get_profile().get("row_count", 0),
            "model_ready": active_model is not None,
            "active_model_name": active_model.get("model_name") if active_model else None,
            "gemini_enabled": settings.gemini_enabled,
        }
    )
