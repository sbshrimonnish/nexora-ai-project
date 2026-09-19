/**
 * Nexora AI — Primary API Service
 * Interacts with FastAPI backend routes.
 * Supports authentication headers, pagination, filtering, export, and copilot.
 */
import { authService } from './authService';

const API_BASE = '/api';

export interface ApiEnvelope<T> {
  status: 'success' | 'error';
  data: T;
  meta?: Record<string, any>;
  error?: string;
  is_mock?: boolean;
}

export interface Customer {
  customer_id: string;
  account_name: string;
  industry: string;
  tier: string;
  region: string;
  historical_mrr: number;
  historical_tenure_months: number;
  nps_score: number;
  support_tickets_30d: number;
  active_users_count: number;
  contract_length_months: number;
  clv_target_12m_revenue_based: number;
  predicted_clv: number;
  clv_segment: 'High Value' | 'Mid Value' | 'Low Value' | 'At Risk';
  clv_trajectory: 'Increasing' | 'Stable' | 'Declining';
  clv_trajectory_pct: number;
  health_score: number;
  churn_probability: number;
  recommended_action: string;
}

export interface CustomerListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: Customer[];
}

export interface CLVSummary {
  total_portfolio_clv: number;
  avg_predicted_clv: number;
  median_predicted_clv: number;
  highest_clv: number;
  lowest_clv: number;
  total_customers: number;
  horizon_months: number;
  trajectory_counts: {
    Increasing: number;
    Stable: number;
    Declining: number;
  };
  segment_counts: {
    'High Value': number;
    'Mid Value': number;
    'Low Value': number;
    'At Risk': number;
  };
  is_mock: boolean;
}

export interface ModelMetricsResponse {
  best_model_name: string;
  dataset_rows: number;
  feature_count: number;
  evaluated_candidates: Array<{
    model_name: string;
    r2_score: number;
    rmse: number;
    mae: number;
    is_best: boolean;
  }>;
  trained_at: string;
  dataset_split: string;
  metrics_source: string;
}

export interface SHAPGlobalResponse {
  features: Array<{
    feature_name: string;
    description: string;
    mean_abs_shap: number;
    rank: number;
  }>;
}

export interface SHAPLocalResponse {
  customer_id: string;
  account_name: string;
  predicted_clv: number;
  base_value: number;
  top_positive_features: Array<{ feature: string; description: string; shap_value: number }>;
  top_negative_features: Array<{ feature: string; description: string; shap_value: number }>;
}

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiEnvelope<T>> {
  const headers = {
    'Content-Type': 'application/json',
    ...authService.getAuthHeaders(),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      if (res.status === 401) {
        authService.clearSession();
      }
      const errData = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(errData.detail || `API request failed with status ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    console.warn(`[Nexora API] Call to ${endpoint} failed:`, error.message);
    throw error;
  }
}

export const apiService = {
  // System Health
  async getHealth() {
    return fetchApi<any>('/health');
  },

  // Auth
  async login(username: string, password: string) {
    return fetchApi<{ access_token: string; token_type: string; username: string; role: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  },

  // Customers
  async getCustomers(params: {
    page?: number;
    page_size?: number;
    search?: string;
    tier?: string;
    industry?: string;
    clv_segment?: string;
    clv_trajectory?: string;
    sort_by?: string;
    sort_desc?: boolean;
  }): Promise<ApiEnvelope<CustomerListResponse>> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.page_size) query.set('page_size', params.page_size.toString());
    if (params.search) query.set('search', params.search);
    if (params.tier && params.tier !== 'All') query.set('tier', params.tier);
    if (params.industry && params.industry !== 'All') query.set('industry', params.industry);
    if (params.clv_segment && params.clv_segment !== 'All') query.set('clv_segment', params.clv_segment);
    if (params.clv_trajectory && params.clv_trajectory !== 'All') query.set('clv_trajectory', params.clv_trajectory);
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.sort_desc !== undefined) query.set('sort_desc', params.sort_desc.toString());

    return fetchApi<CustomerListResponse>(`/customers?${query.toString()}`);
  },

  async getCustomerById(customerId: string): Promise<ApiEnvelope<Customer>> {
    return fetchApi<Customer>(`/customers/${customerId}`);
  },

  async getCustomerShap(customerId: string): Promise<ApiEnvelope<SHAPLocalResponse>> {
    return fetchApi<SHAPLocalResponse>(`/customers/${customerId}/shap`);
  },

  async getCustomerRecommendations(customerId: string): Promise<ApiEnvelope<any>> {
    return fetchApi<any>(`/customers/${customerId}/recommendations`);
  },

  async getCustomerProgress(customerId: string): Promise<ApiEnvelope<any>> {
    return fetchApi<any>(`/customers/${customerId}/progress`);
  },

  async getCustomerTimeline(customerId: string): Promise<ApiEnvelope<any>> {
    return fetchApi<any>(`/customers/${customerId}/timeline`);
  },

  async getIndividualAnalysis(customerId: string): Promise<ApiEnvelope<any>> {
    return fetchApi<any>(`/individual-analysis/${customerId}`);
  },

  // CLV Intelligence
  async getCLVSummary(): Promise<ApiEnvelope<CLVSummary>> {
    return fetchApi<CLVSummary>('/clv/summary');
  },

  async getCLVDistribution(): Promise<ApiEnvelope<any>> {
    return fetchApi<any>('/clv/distribution');
  },

  async getCLVSegments(): Promise<ApiEnvelope<any>> {
    return fetchApi<any>('/clv/segments');
  },

  // Model & XAI
  async getModelMetrics(): Promise<ApiEnvelope<ModelMetricsResponse>> {
    return fetchApi<ModelMetricsResponse>('/model/metrics');
  },

  async getGlobalShap(): Promise<ApiEnvelope<SHAPGlobalResponse>> {
    return fetchApi<SHAPGlobalResponse>('/model/feature-importance');
  },

  async triggerModelTraining(selectedModel: string): Promise<ApiEnvelope<any>> {
    return fetchApi<any>('/model/retrain', {
      method: 'POST',
      body: JSON.stringify({ selected_model: selectedModel }),
    });
  },

  async getTrainingJobStatus(jobId: string): Promise<ApiEnvelope<any>> {
    return fetchApi<any>(`/model/jobs/${jobId}`);
  },

  // Churn Intelligence
  async getChurnSummary(): Promise<ApiEnvelope<any>> {
    return fetchApi<any>('/churn/summary');
  },

  async getHighRiskCustomers(limit: number = 20): Promise<ApiEnvelope<any>> {
    return fetchApi<any>(`/churn/high-risk?limit=${limit}`);
  },

  // Revenue Forecast
  async getRevenueForecast(horizonMonths: number = 12): Promise<ApiEnvelope<any>> {
    return fetchApi<any>(`/forecast/revenue?horizon_months=${horizonMonths}`);
  },

  // Cohort Analytics
  async getCohortAnalytics(): Promise<ApiEnvelope<any>> {
    return fetchApi<any>('/cohorts/analysis');
  },

  // Dataset & Database Ingestion & Status
  async getDatasetStatus(): Promise<ApiEnvelope<any>> {
    return fetchApi<any>('/datasets/status');
  },

  async getDatasetProfile(): Promise<ApiEnvelope<any>> {
    return fetchApi<any>('/datasets/profile');
  },

  async getDatasetQuality(): Promise<ApiEnvelope<any>> {
    return fetchApi<any>('/datasets/quality-report');
  },

  async getDatasetPreview(n: number = 20): Promise<ApiEnvelope<any>> {
    return fetchApi<any>(`/datasets/preview?n=${n}`);
  },

  async uploadDataset(file: File, activate: boolean = true): Promise<ApiEnvelope<any>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('activate', activate ? 'true' : 'false');
    const headers = authService.getAuthHeaders();

    const res = await fetch('/api/datasets/upload', {
      method: 'POST',
      headers,
      body: formData,
    });
    return res.json();
  },

  async ingestDatabase(params: {
    db_type: string;
    connection_string: string;
    query_or_table: string;
    activate?: boolean;
  }): Promise<ApiEnvelope<any>> {
    return fetchApi<any>('/datasets/ingest-db', {
      method: 'POST',
      body: JSON.stringify({
        db_type: params.db_type,
        connection_string: params.connection_string,
        query_or_table: params.query_or_table,
        activate: params.activate !== undefined ? params.activate : true,
      }),
    });
  },

  // Copilot Chat
  async sendCopilotMessage(prompt: string, customerId?: string): Promise<ApiEnvelope<any>> {
    return fetchApi<any>('/copilot/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt, customer_id: customerId }),
    });
  },

  // Export
  getExportUrl(params: Record<string, string>): string {
    const query = new URLSearchParams(params);
    return `/api/export/csv?${query.toString()}`;
  },
};
