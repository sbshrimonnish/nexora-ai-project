"""
Nexora AI — Pydantic response schemas (typed API contracts).
All API responses use the Envelope wrapper: { success, data, meta }.
"""
from pydantic import BaseModel, Field
from typing import Any, Optional, List


# ── Envelope ─────────────────────────────────────────────────────────────────

class Meta(BaseModel):
    page: Optional[int] = None
    page_size: Optional[int] = None
    total: Optional[int] = None
    total_pages: Optional[int] = None


class Envelope(BaseModel):
    success: bool = True
    data: Any = None
    meta: Optional[Meta] = None
    message: Optional[str] = None


# ── Auth ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str


# ── Customer ─────────────────────────────────────────────────────────────────

class CustomerSummary(BaseModel):
    account_id: int
    company_size: str
    industry: str
    contract_type: str
    current_mrr: float
    predicted_clv: float
    clv_segment: str
    clv_trajectory: str          # Increasing | Stable | Declining
    churn_probability: float
    churn_risk_level: str        # Low | Medium | High | Critical
    health_score: float          # 0–100
    tenure_months: float
    feature_adoption_rate: float
    active_users: float
    payment_delay_rate: float
    regime_state: str


class CustomerDetail(CustomerSummary):
    hist_mrr_mean: float
    hist_mrr_max: float
    hist_mrr_std: float
    mrr_growth: float
    recent_mrr_mean: float
    usage_growth: float
    ticket_count: float
    ticket_growth: float
    shap_explanation: Optional[Any] = None
    recommendations: Optional[List[Any]] = None


# ── CLV ──────────────────────────────────────────────────────────────────────

class CLVSummary(BaseModel):
    total_predicted_clv: float
    avg_clv: float
    median_clv: float
    total_current_mrr: float
    current_arr: float
    high_value_count: int
    declining_count: int
    clv_growth_estimate: float
    model_version: str
    clv_horizon_months: int
    model_r2: float
    model_mae: float


class CLVDistributionBin(BaseModel):
    range_label: str
    count: int
    min_clv: float
    max_clv: float


class CLVSegmentSummary(BaseModel):
    segment: str
    count: int
    total_clv: float
    avg_clv: float
    revenue_pct: float
    avg_tenure: float
    avg_health: float
    color: str


class TopCustomer(BaseModel):
    account_id: int
    industry: str
    company_size: str
    current_mrr: float
    predicted_clv: float
    clv_segment: str
    clv_trajectory: str
    health_score: float
    churn_probability: float


# ── Churn ─────────────────────────────────────────────────────────────────────

class ChurnSummary(BaseModel):
    avg_churn_probability: float
    high_risk_count: int            # churn_prob > 0.6
    critical_count: int             # churn_prob > 0.8
    high_value_at_risk_count: int   # high CLV + high churn
    high_value_clv_at_risk: float
    model_available: bool
    model_note: str


class HighRiskCustomer(BaseModel):
    account_id: int
    industry: str
    company_size: str
    predicted_clv: float
    churn_probability: float
    churn_risk_level: str
    health_score: float
    current_mrr: float
    clv_segment: str


# ── Model Metrics ─────────────────────────────────────────────────────────────

class ModelMetrics(BaseModel):
    model_name: str
    model_version: str
    trained_at: str
    clv_horizon_months: int
    target_definition: str
    train_size: int
    test_size: int
    mae: float
    rmse: float
    r2: float
    mape: Optional[float]
    feature_count: int
    features: List[str]


class ModelComparison(BaseModel):
    candidates: List[dict]
    selected_model: str
    selection_reason: str


class FeatureImportance(BaseModel):
    feature: str
    importance: float       # mean |SHAP| value
    direction: str          # positive | negative | mixed
    rank: int


class TrainingJob(BaseModel):
    job_id: str
    status: str             # pending | running | completed | failed
    progress_pct: float
    message: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    metrics: Optional[dict] = None


# ── Forecast ─────────────────────────────────────────────────────────────────

class ForecastPoint(BaseModel):
    period: str
    actual: Optional[float]
    predicted: float
    lower_bound: float
    upper_bound: float
    is_forecast: bool


class RevenueForecast(BaseModel):
    method: str
    horizon_months: int
    current_mrr: float
    current_arr: float
    projected_12m_revenue: float
    points: List[ForecastPoint]
    uncertainty_method: str
    note: str


# ── Cohorts ───────────────────────────────────────────────────────────────────

class CohortRow(BaseModel):
    cohort_label: str
    customer_count: int
    avg_clv: float
    total_clv: float
    avg_tenure: float
    avg_mrr: float
    avg_health: float
    avg_adoption: float


# ── SHAP ─────────────────────────────────────────────────────────────────────

class SHAPExplanation(BaseModel):
    account_id: int
    base_value: float
    predicted_clv: float
    top_drivers: List[dict]     # {feature, shap_value, feature_value, direction}
    available: bool
    method: str
    note: str


# ── Dataset Profile ───────────────────────────────────────────────────────────

class DatasetProfile(BaseModel):
    filename: str
    source: str
    total_rows: int
    total_columns: int
    unique_accounts: int
    clv_target_column: str
    clv_range_min: float
    clv_range_max: float
    clv_mean: float
    clv_median: float
    mrr_range_min: float
    mrr_range_max: float
    industries: List[str]
    company_sizes: List[str]
    contract_types: List[str]
    numerical_columns: List[str]
    categorical_columns: List[str]
    missing_values: dict
    data_quality_note: str
