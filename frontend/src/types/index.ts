export interface BusinessAdvisorRequest {
  locality: string;
  state: string;
  capital: number;
  business_idea?: string | null;
  user_age?: number;
  social_category?: string;
  gender?: string;
  existing_business?: boolean;
  experience_years?: number;
  education?: string;
  asset_availability?: string;
  preferred_language?: string;
}

export interface FinancialPlan {
  project_cost: number;
  margin_contribution: number;
  loan_requirement: number;
  interest_rate: number;
  tenure_months: number;
  moratorium_months: number;
  monthly_emi: number;
  total_repayment: number;
  break_even_months: number;
  working_capital: number;
  monthly_cashflow_projection: Array<{
    month: number;
    projected_revenue: number;
    operating_expenses: number;
    emi: number;
    net_profit: number;
    moratorium_active: boolean;
  }>;
}

export interface SchemeRecommendation {
  scheme_name: string;
  ministry: string;
  official_url: string;
  eligibility_status: string;
  subsidy_percentage: number;
  max_subsidy_amount: number;
  margin_required_percent: number;
  why_matched: string[];
  required_documents: string[];
  application_process: string;
}

export interface FeasibilityScores {
  overall_score: number;
  market_score: number;
  capital_fit: number;
  competition_score: number;
  supply_score: number;
  risk_score: number;
  scheme_fit: number;
  verdict: "GO" | "CONDITIONAL GO" | "RECONSIDER" | "DO NOT PROCEED";
  verdict_explanation: string;
}

export interface TimeMachineOutput {
  recommended_prep_period: string;
  recommended_launch_window: string;
  expected_peak_period: string;
  cashflow_warning_period: string;
  seasonal_risk_factors: string[];
}

export interface ClusterOpportunity {
  cluster_name: string;
  complementary_businesses: string[];
  shared_benefits: string[];
  nearby_nodes_count: number;
}

export interface SWOTAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface FeasibilityReportResponse {
  report_id: string;
  status: string;
  evidence: {
    user_inputs: Record<string, any>;
    location_intelligence: Record<string, any>;
    market_feasibility: Record<string, any>;
    financial_data: FinancialPlan;
    scheme_data: SchemeRecommendation[];
    time_machine?: TimeMachineOutput;
    cluster_data: ClusterOpportunity[];
    feasibility_scores?: FeasibilityScores;
    sources: Array<{ name: string; type: string }>;
    retrieved_at: string;
  };
  narrative_summary: string;
  swot: SWOTAnalysis;
  recommendation: "GO" | "CONDITIONAL GO" | "RECONSIDER" | "DO NOT PROCEED";
}

export interface HealthMetric {
  metric_name: string;
  current_value: number;
  target_value: number;
  unit: string;
  status: "on_track" | "warning" | "critical";
}

export interface RiskAlert {
  alert_id: string;
  severity: "low" | "medium" | "high" | "critical";
  category: string;
  message: string;
  recommended_action: string;
  triggered_at: string;
}

export interface LifecycleStatus {
  business_id: string;
  days_since_launch: number;
  health_score: number;
  health_metrics: HealthMetric[];
  risk_alerts: RiskAlert[];
  milestone_status: Array<{
    day: number;
    title: string;
    status: string;
  }>;
  next_actions: string[];
}

export interface ReverseFeasibilityRecommendation {
  business: string;
  category: string;
  score: number;
  capital_fit: string;
  market_fit: string;
  risk_level: string;
  reason: string[];
}

export interface BusinessGoal {
  goal_id: string;
  title: string;
  description: string;
  deadline_days: number;
  priority: string;
  status: string;
}

export interface ConcessionalLoanRequest {
  capital: number;
  margin_percent?: number;
  annual_interest_rate?: number;
  tenure_years?: number;
  moratorium_months?: number;
  commercial_rate?: number;
}

export interface AmortizationQuarter {
  quarter: number;
  label: string;
  year: number;
  quarter_of_year: number;
  status: "Grace Moratorium" | "Active EQI";
  opening_balance: number;
  installment: number;
  principal_repaid: number;
  interest_paid: number;
  closing_balance: number;
}

export interface ConcessionalLoanResponse {
  promoter_margin: number;
  margin_percent: number;
  total_project_cost: number;
  concessional_debt: number;
  annual_interest_rate: number;
  tenure_years: number;
  tenure_quarters: number;
  moratorium_months: number;
  moratorium_quarters: number;
  grace_quarterly_installment: number;
  active_eqi: number;
  total_principal_repaid: number;
  total_concessional_interest: number;
  total_outflow: number;
  commercial_interest_cost: number;
  total_interest_savings: number;
  savings_percent: number;
  credit_guarantee: string;
  scheme_category: string;
  scheme_name: string;
  scheme_description: string;
  rules: string;
  schedule: AmortizationQuarter[];
}

export interface ClusterNode {
  id: string;
  role: "UPSTREAM PRODUCER" | "INPUT WHOLESALE" | "PEER RETAILER" | "INFRASTRUCTURE SHARING" | string;
  title: string;
  category: string;
  distance_km: number;
  capacity_metric: string;
  rating: number;
  synergy_benefit: string;
  icon_type: "truck" | "store" | "package" | "snowflake" | string;
  estimated_monthly_savings: number;
}

export interface ClusterHub {
  name: string;
  sector: string;
  locality_node: string;
  seeking: string;
  daily_processing_volume: string;
  max_peers: number;
}

export interface ClusterNetworkResponse {
  locality: string;
  business_idea: string;
  hub: ClusterHub;
  nodes: ClusterNode[];
  collective_perks: string[];
  unlocked_synergy_note: string;
}

export interface ClusterNetworkRequest {
  locality?: string;
  business_idea?: string;
  enterprise_name?: string;
}
