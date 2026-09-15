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
