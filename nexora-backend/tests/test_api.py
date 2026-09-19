"""
Nexora AI — Backend Comprehensive Test Suite
Tests dataset ingestion, preprocessing, model training, predictions, SHAP, and FastAPI endpoints.
"""
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.dataset_service import dataset_service
from app.services.preprocessing import preprocessing_service
from app.services.training_service import training_service
from app.services.clv_service import clv_service
from app.services.shap_service import shap_service
from app.services.segmentation import segmentation_service
from app.services.churn_service import churn_service
from app.services.auth_service import create_access_token

client = TestClient(app)


@pytest.fixture
def auth_headers():
    token = create_access_token({"sub": "admin"})
    return {"Authorization": f"Bearer {token}"}


def test_health_check():
    """Verify health endpoint returns status 200 and online status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "dataset_rows" in data
    assert "model_ready" in data


def test_dataset_service():
    """Verify dataset service loads profile and data correctly."""
    profile = dataset_service.get_profile()
    assert profile["row_count"] > 0
    assert profile["column_count"] >= 10
    df = dataset_service.load_data()
    assert len(df) == profile["row_count"]


def test_preprocessing_service():
    """Verify preprocessing transforms 50K customer data cleanly."""
    df = dataset_service.load_data()
    X, y, cat_cols, num_cols = preprocessing_service.prepare_features_and_target(df)
    assert len(X) == len(df)
    assert len(y) == len(df)
    assert "current_mrr" in num_cols


def test_model_training_service():
    """Verify model training evaluates candidates and selects best model."""
    result = training_service.train_all_candidates()
    assert "selected_model" in result or "candidates" in result
    candidates = result.get("candidates") or result.get("evaluated_candidates") or []
    assert len(candidates) >= 3
    metrics = training_service.get_active_model_metrics()
    assert metrics is not None


def test_clv_service():
    """Verify CLV prediction produces valid non-negative predictions."""
    if not training_service.is_trained():
        training_service.train_all_candidates()
    predictions = clv_service.predict_all()
    assert len(predictions) > 0
    first = list(predictions.values())[0]
    assert first["predicted_clv"] >= 0


def test_shap_service():
    """Verify global feature importance computation."""
    global_importance = shap_service.get_global_feature_importance()
    assert len(global_importance) > 0


def test_api_customers_endpoint(auth_headers):
    """Verify server-side paginated customer list endpoint."""
    response = client.get("/api/customers?page=1&page_size=10", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data.get("success") is True
    payload = data.get("data", {})
    records = payload.get("items", []) if isinstance(payload, dict) else payload
    assert len(records) == 10
    assert data.get("meta", {}).get("total", 0) > 0


def test_api_clv_summary_endpoint(auth_headers):
    """Verify CLV portfolio summary endpoint."""
    response = client.get("/api/clv/summary", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data.get("success") is True
    payload = data.get("data", {})
    assert "total_predicted_clv" in payload or "total_portfolio_clv" in payload


def test_api_churn_summary_endpoint(auth_headers):
    """Verify churn intelligence summary endpoint."""
    response = client.get("/api/churn/summary", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data.get("success") is True
    payload = data.get("data", {})
    assert "high_risk_count" in payload or "overall_churn_rate_pct" in payload


def test_api_forecast_endpoint(auth_headers):
    """Verify ETS revenue forecast endpoint."""
    response = client.get("/api/forecast/revenue?horizon=6", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data.get("success") is True
    payload = data.get("data", {})
    points = payload.get("points", [])
    assert len(points) >= 12
