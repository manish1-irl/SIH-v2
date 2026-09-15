from __future__ import annotations
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class RecommendationEnum(str, Enum):
    GO = "GO"
    CONDITIONAL_GO = "CONDITIONAL GO"
    RECONSIDER = "RECONSIDER"
    DO_NOT_PROCEED = "DO NOT PROCEED"


class SocialCategoryEnum(str, Enum):
    GENERAL = "General"
    SC = "SC"
    ST = "ST"
    OBC = "OBC"
    MINORITY = "Minority"
    WOMEN = "Women"


class GenderEnum(str, Enum):
    MALE = "Male"
    FEMALE = "Female"
    OTHER = "Other"


# --- Request Models ---

class BusinessAdvisorRequest(BaseModel):
    locality: str
    state: str
    capital: float
    business_idea: Optional[str] = None
    user_age: Optional[int] = None
    social_category: SocialCategoryEnum = SocialCategoryEnum.GENERAL
    gender: GenderEnum = GenderEnum.MALE
    existing_business: bool = False
    experience_years: int = 0
    education: Optional[str] = None
    asset_availability: Optional[str] = None
    preferred_language: str = "en"


class ChatRequest(BaseModel):
    query: str
    context: Optional[Dict[str, Any]] = None


# --- Financial Models ---

class CashflowMonth(BaseModel):
    month: int
    projected_revenue: float
    operating_expenses: float
    emi: float
    net_profit: float
    moratorium_active: bool


class FinancialPlan(BaseModel):
    project_cost: float
    margin_contribution: float
    loan_requirement: float
    interest_rate: float
    tenure_months: int
    moratorium_months: int
    monthly_emi: float
    total_repayment: float
    break_even_months: int
    working_capital: float
    monthly_cashflow_projection: List[CashflowMonth]


class ConcessionalLoanRequest(BaseModel):
    capital: float = Field(100000.0, description="Promoter margin capital in INR")
    margin_percent: float = Field(10.0, description="Borrower equity percentage")
    annual_interest_rate: float = Field(8.0, description="Annual concessional interest rate")
    tenure_years: int = Field(7, description="Loan repayment tenure in years")
    moratorium_months: int = Field(6, description="Statutory grace period in months")
    commercial_rate: float = Field(12.5, description="Comparison commercial bank rate")


class AmortizationQuarter(BaseModel):
    quarter: int
    label: str
    year: int
    quarter_of_year: int
    status: str
    opening_balance: float
    installment: float
    principal_repaid: float
    interest_paid: float
    closing_balance: float


class ConcessionalLoanResponse(BaseModel):
    promoter_margin: float
    margin_percent: float
    total_project_cost: float
    concessional_debt: float
    annual_interest_rate: float
    tenure_years: int
    tenure_quarters: int
    moratorium_months: int
    moratorium_quarters: int
    grace_quarterly_installment: float
    active_eqi: float
    total_principal_repaid: float
    total_concessional_interest: float
    total_outflow: float
    commercial_interest_cost: float
    total_interest_savings: float
    savings_percent: float
    credit_guarantee: str
    scheme_category: str
    scheme_name: str
    scheme_description: str
    rules: str
    schedule: List[AmortizationQuarter]


# --- Feasibility Models ---

class FeasibilityScoreBreakdown(BaseModel):
    overall_score: int
    market_score: int
    capital_fit: int
    competition_score: int
    supply_score: int
    risk_score: int
    scheme_fit: int
    verdict: RecommendationEnum
    verdict_explanation: str


class ReverseFeasibilityRecommendation(BaseModel):
    business: str
    category: str
    score: int
    capital_fit: str
    market_fit: str
    risk_level: str
    reason: List[str]
    project_cost: Optional[float] = None
    own_contribution: Optional[float] = None
    bank_loan: Optional[float] = None
    monthly_emi: Optional[float] = None
    subsidy_amount: Optional[float] = None
    scheme_name: Optional[str] = None
    expected_monthly_net_profit: Optional[float] = None


# --- Scheme Models ---

class SchemeRecommendation(BaseModel):
    scheme_name: str
    ministry: str
    official_url: str
    eligibility_status: str
    subsidy_percentage: float
    max_subsidy_amount: float
    margin_required_percent: float
    why_matched: List[str]
    required_documents: List[str]
    application_process: str


# --- Time Machine Models ---

class TimeMachineOutput(BaseModel):
    recommended_prep_period: str
    recommended_launch_window: str
    expected_peak_period: str
    cashflow_warning_period: str
    seasonal_risk_factors: List[str]


# --- Cluster Models ---

class ClusterOpportunity(BaseModel):
    cluster_name: str
    complementary_businesses: List[str]
    shared_benefits: List[str]
    nearby_nodes_count: int


class ClusterNode(BaseModel):
    id: str
    role: str  # "UPSTREAM PRODUCER" | "INPUT WHOLESALE" | "PEER RETAILER" | "INFRASTRUCTURE SHARING"
    title: str
    category: str
    distance_km: float
    capacity_metric: str
    rating: float
    synergy_benefit: str
    icon_type: str
    estimated_monthly_savings: float


class ClusterHub(BaseModel):
    name: str
    sector: str
    locality_node: str
    seeking: str
    daily_processing_volume: str
    max_peers: int = 4


class ClusterNetworkResponse(BaseModel):
    locality: str
    business_idea: str
    hub: ClusterHub
    nodes: List[ClusterNode]
    collective_perks: List[str]
    unlocked_synergy_note: str


class ClusterNetworkRequest(BaseModel):
    locality: str = "Bassi"
    business_idea: str = "Dairy"
    enterprise_name: str = "Ganga Dairy Parlour"


# --- Lifecycle Models ---

class HealthMetric(BaseModel):
    metric_name: str
    current_value: float
    target_value: float
    unit: str
    status: str  # "on_track", "warning", "critical"


class RiskAlert(BaseModel):
    alert_id: str
    severity: str  # "low", "medium", "high", "critical"
    category: str
    message: str
    recommended_action: str
    triggered_at: str


class LifecycleStatus(BaseModel):
    business_id: str
    days_since_launch: int
    health_score: int
    health_metrics: List[HealthMetric]
    risk_alerts: List[RiskAlert]
    milestone_status: List[Dict[str, Any]]
    next_actions: List[str]


# --- Personal Dashboard & Loan Pipeline Models ---

class LoanStage(BaseModel):
    stage_id: int
    title: str
    description: str
    status: str  # "completed", "in_progress", "pending"
    completion_date: Optional[str] = None
    action_required: Optional[str] = None


class LoanApplicationProgress(BaseModel):
    application_ref: str
    scheme_name: str
    portal_name: str
    loan_amount: float
    subsidy_amount: float
    promoter_equity: float
    bank_branch: str
    current_stage_index: int
    total_stages: int
    overall_progress_percent: int
    stages: List[LoanStage]
    target_disbursement_date: str


class DashboardReminder(BaseModel):
    reminder_id: str
    title: str
    category: str
    question: str
    target_metric: Optional[str] = None
    urgency: str  # "normal", "important", "critical"
    created_at: str
    status: str  # "pending", "confirmed", "need_help", "snoozed"


class AIBusinessGoal(BaseModel):
    goal_id: str
    title: str
    description: str
    category: str
    priority: str
    progress_percent: int
    status: str  # "pending", "in_progress", "completed"
    ai_rationale: str
    deadline_days: int
    order: int


class PersonalDashboardData(BaseModel):
    business_id: str
    business_name: str
    locality: str
    state: str
    business_idea: str
    capital: float
    project_cost: float
    health_score: int
    total_milestones_count: int
    completed_milestones_count: int
    running_goals_count: int
    pending_goals_count: int
    loan_progress: LoanApplicationProgress
    goals: List[AIBusinessGoal]
    reminders: List[DashboardReminder]
    metrics: List[HealthMetric]
    alerts: List[RiskAlert]
    co_pilot_status: str


class GenerateGoalRequest(BaseModel):
    business_id: str = "BIZ-DEFAULT"
    locality: str = "Bassi"
    business_idea: str = "Dairy"
    completed_goal_ids: List[str] = []
    current_challenges: Optional[str] = None


# --- DPR Models ---

class EvidenceObject(BaseModel):
    user_inputs: Dict[str, Any]
    location_intelligence: Dict[str, Any] = {}
    market_feasibility: Dict[str, Any] = {}
    financial_data: FinancialPlan
    scheme_data: List[SchemeRecommendation] = []
    time_machine: Optional[TimeMachineOutput] = None
    cluster_data: List[ClusterOpportunity] = []
    feasibility_scores: Optional[FeasibilityScoreBreakdown] = None
    sources: List[Dict[str, str]] = []
    retrieved_at: str = ""


class DPRResponse(BaseModel):
    dpr_id: str
    business_name: str
    sections_count: int
    sections: Dict[str, Any]
    pdf_download_url: str


# --- Full Report Response ---

class SWOTAnalysis(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    opportunities: List[str]
    threats: List[str]


class FeasibilityReportResponse(BaseModel):
    report_id: str
    status: str
    evidence: EvidenceObject
    narrative_summary: str
    swot: SWOTAnalysis
    recommendation: RecommendationEnum


# --- Goal Models ---

class BusinessGoal(BaseModel):
    goal_id: str
    title: str
    description: str
    deadline_days: int
    priority: str
    status: str
