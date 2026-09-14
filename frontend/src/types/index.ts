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

export interface FeasibilityReportResponse {
  report_id: string;
  status: string;
  evidence: {
    user_inputs: Record<string, any>;
    location_intelligence: Record<string, any>;
    market_feasibility: Record<string, any>;
    financial_data: FinancialPlan;
    scheme_data: SchemeRecommendation[];
    time_machine: TimeMachineOutput;
    cluster_data: ClusterOpportunity[];
    feasibility_scores: FeasibilityScores;
    sources: Array<{ name: string; type: string }>;
    retrieved_at: string;
  };
  narrative_summary: string;
  swot: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  recommendation: "GO" | "CONDITIONAL GO" | "RECONSIDER" | "DO NOT PROCEED";
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
