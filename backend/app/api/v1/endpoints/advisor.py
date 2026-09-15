from io import BytesIO
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import StreamingResponse
from app.models.schemas import (
    BusinessAdvisorRequest, FeasibilityReportResponse, ReverseFeasibilityRecommendation,
    EvidenceObject, FinancialPlan, RecommendationEnum, SWOTAnalysis,
    ConcessionalLoanRequest, ConcessionalLoanResponse,
)
from app.engines.financial import DeterministicFinancialEngine
from app.engines.feasibility import FeasibilityEngine
from app.engines.schemes import SchemeEngine
from app.engines.time_machine import TimeMachineEngine
from app.engines.cluster import ClusterEngine
from app.engines.dpr import DPREngine
from app.agent.crew_orchestrator import CrewOrchestrator
from app.core.session import session_manager
import uuid
from datetime import datetime, timezone

router = APIRouter()


@router.get("/session/{user_id}")
async def get_user_session(user_id: str = "web-user"):
    return session_manager.get_session(user_id)


@router.post("/session/{user_id}")
async def update_user_session(user_id: str = "web-user", data: Dict[str, Any] = Body(...)):
    session_manager.update_session(user_id, **data)
    return session_manager.get_session(user_id)


@router.post("/analyze", response_model=FeasibilityReportResponse)
async def analyze_business(request: BusinessAdvisorRequest):
    user_id = getattr(request, "user_id", None) or "web-user"
    biz_idea = request.business_idea
    locality = request.locality
    state = request.state
    capital = request.capital

    # Fall back to active business in session if empty or generic
    if not biz_idea or biz_idea.strip().lower() in ["general", "none", ""]:
        session_biz = session_manager.get_active_business(user_id)
        if session_biz.get("business_idea"):
            biz_idea = session_biz["business_idea"]
        if session_biz.get("locality") and (not locality or locality == "Bassi"):
            locality = session_biz["locality"]
        if session_biz.get("state") and (not state or state == "Rajasthan"):
            state = session_biz["state"]
        if session_biz.get("capital") and capital in [0, 100000]:
            capital = session_biz["capital"]

    # Persist current evaluated parameters into session
    session_manager.update_session(
        user_id,
        business_idea=biz_idea,
        locality=locality,
        state=state,
        capital=capital,
        social_category=request.social_category.value if request.social_category else "General",
        gender=request.gender.value if request.gender else "Male",
    )

    financial_plan = DeterministicFinancialEngine.generate_financial_plan(
        capital=capital,
        business_category=biz_idea or "general",
    )

    feasibility = FeasibilityEngine.calculate_feasibility(
        capital=request.capital,
        business_idea=request.business_idea or "general",
        locality=request.locality,
        state=request.state,
        demographics={},
    )

    schemes = SchemeEngine.match_schemes(
        project_cost=financial_plan.project_cost,
        business_category=request.business_idea or "general",
        social_category=request.social_category,
        gender=request.gender,
        is_rural=True,
    )

    time_machine = TimeMachineEngine.analyze_timing(
        business_category=request.business_idea or "general",
        moratorium_months=financial_plan.moratorium_months,
    )

    clusters = ClusterEngine.find_clusters(
        locality=request.locality,
        business_category=request.business_idea or "general",
    )

    market_matrix = FeasibilityEngine.generate_market_feasibility_matrix(
        capital=request.capital,
        business_idea=request.business_idea or "general",
        locality=request.locality,
        state=request.state,
        financial_plan=financial_plan,
    )

    evidence = EvidenceObject(
        user_inputs={
            "locality": request.locality,
            "state": request.state,
            "capital": request.capital,
            "business_idea": request.business_idea,
            "social_category": request.social_category.value,
            "gender": request.gender.value,
        },
        financial_data=financial_plan,
        scheme_data=schemes,
        time_machine=time_machine,
        cluster_data=clusters,
        feasibility_scores=feasibility,
        market_feasibility=market_matrix,
        sources=[
            {"name": "PMEGP Portal", "type": "government_scheme"},
            {"name": "MUDRA Portal", "type": "government_scheme"},
            {"name": "Bhuvan & OpenStreetMap", "type": "geo_gis"},
            {"name": "Ministry of MSME & APMC Data", "type": "market_data"},
        ],
        retrieved_at=datetime.now(timezone.utc).isoformat(),
    )

    orchestrator = CrewOrchestrator()
    narrative = await orchestrator.generate_narrative(evidence)

    swot = _build_swot(feasibility, financial_plan, schemes, request)

    return FeasibilityReportResponse(
        report_id=f"RPT-{uuid.uuid4().hex[:12].upper()}",
        status="complete",
        evidence=evidence,
        narrative_summary=narrative,
        swot=swot,
        recommendation=feasibility.verdict,
    )


@router.post("/reverse-feasibility", response_model=list[ReverseFeasibilityRecommendation])
async def reverse_feasibility(request: BusinessAdvisorRequest):
    recommendations = FeasibilityEngine.run_reverse_feasibility(
        capital=request.capital,
        locality=request.locality,
        state=request.state,
    )
    return recommendations


@router.post("/concessional-calculator", response_model=ConcessionalLoanResponse)
async def calculate_concessional_loan(request: ConcessionalLoanRequest):
    user_id = request.user_id or "web-user"
    biz_idea = request.business_idea
    locality = request.locality

    if not biz_idea:
        session_biz = session_manager.get_active_business(user_id)
        biz_idea = session_biz.get("business_idea") or "General MSME"
        if not locality:
            locality = session_biz.get("locality") or "Bassi"

    return DeterministicFinancialEngine.calculate_concessional_scheme_structuring(
        capital=request.capital,
        margin_percent=request.margin_percent,
        annual_interest_rate=request.annual_interest_rate,
        tenure_years=request.tenure_years,
        moratorium_months=request.moratorium_months,
        commercial_rate=request.commercial_rate,
        business_idea=biz_idea,
        locality=locality,
    )


@router.post("/generate-dpr")
async def generate_dpr(request: BusinessAdvisorRequest):
    user_id = getattr(request, "user_id", None) or "web-user"
    biz_idea = request.business_idea
    locality = request.locality
    state = request.state
    capital = request.capital

    if not biz_idea or biz_idea.strip().lower() in ["general", "none", ""]:
        session_biz = session_manager.get_active_business(user_id)
        if session_biz.get("business_idea"):
            biz_idea = session_biz["business_idea"]
        if session_biz.get("locality") and (not locality or locality == "Bassi"):
            locality = session_biz["locality"]
        if session_biz.get("state") and (not state or state == "Rajasthan"):
            state = session_biz["state"]
        if session_biz.get("capital") and capital in [0, 100000]:
            capital = session_biz["capital"]

    financial_plan = DeterministicFinancialEngine.generate_financial_plan(
        capital=capital,
        business_category=biz_idea or "general",
    )
    schemes = SchemeEngine.match_schemes(
        project_cost=financial_plan.project_cost,
        business_category=biz_idea or "general",
        social_category=request.social_category,
        gender=request.gender,
    )
    feasibility = FeasibilityEngine.calculate_feasibility(
        capital=capital,
        business_idea=biz_idea or "general",
        locality=locality,
        state=state,
        demographics={},
    )
    time_machine = TimeMachineEngine.analyze_timing(
        business_category=biz_idea or "general",
    )
    clusters = ClusterEngine.find_clusters(
        locality=locality,
        business_category=biz_idea or "general",
    )
    evidence = EvidenceObject(
        user_inputs={
            "locality": locality,
            "state": state,
            "capital": capital,
            "business_idea": biz_idea,
            "social_category": request.social_category.value if request.social_category else "General",
            "gender": request.gender.value if request.gender else "Male",
        },
        financial_data=financial_plan,
        scheme_data=schemes,
        time_machine=time_machine,
        cluster_data=clusters,
        feasibility_scores=feasibility,
        retrieved_at=datetime.now(timezone.utc).isoformat(),
    )
    dpr = DPREngine.generate_29_section_dpr(evidence, applicant_name="Entrepreneur")
    return dpr


@router.get("/dpr/download-pdf")
async def download_dpr_pdf_get(
    capital: float = 100000.0,
    business_idea: str = "Dairy Micro-Enterprise",
    locality: str = "Alwar",
    state: str = "Rajasthan",
    applicant_name: str = "Entrepreneur",
):
    financial_plan = DeterministicFinancialEngine.generate_financial_plan(capital=capital, business_category=business_idea)
    schemes = SchemeEngine.match_schemes(project_cost=financial_plan.project_cost, business_category=business_idea)
    feasibility = FeasibilityEngine.calculate_feasibility(capital=capital, business_idea=business_idea, locality=locality, state=state, demographics={})
    time_machine = TimeMachineEngine.analyze_timing(business_category=business_idea)
    clusters = ClusterEngine.find_clusters(locality=locality, business_category=business_idea)
    evidence = EvidenceObject(
        user_inputs={"locality": locality, "state": state, "capital": capital, "business_idea": business_idea},
        financial_data=financial_plan,
        scheme_data=schemes,
        time_machine=time_machine,
        cluster_data=clusters,
        feasibility_scores=feasibility,
        retrieved_at=datetime.now(timezone.utc).isoformat(),
    )
    dpr = DPREngine.generate_29_section_dpr(evidence, applicant_name=applicant_name)
    pdf_bytes = DPREngine.generate_pdf_bytes(dpr)
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=DPR-{dpr.dpr_id}.pdf"},
    )


@router.post("/dpr/download-pdf")
async def download_dpr_pdf_post(request: BusinessAdvisorRequest, applicant_name: str = "Entrepreneur"):
    financial_plan = DeterministicFinancialEngine.generate_financial_plan(capital=request.capital, business_category=request.business_idea or "general")
    schemes = SchemeEngine.match_schemes(project_cost=financial_plan.project_cost, business_category=request.business_idea or "general", social_category=request.social_category, gender=request.gender)
    feasibility = FeasibilityEngine.calculate_feasibility(capital=request.capital, business_idea=request.business_idea or "general", locality=request.locality, state=request.state, demographics={})
    time_machine = TimeMachineEngine.analyze_timing(business_category=request.business_idea or "general")
    clusters = ClusterEngine.find_clusters(locality=request.locality, business_category=request.business_idea or "general")
    evidence = EvidenceObject(
        user_inputs=request.model_dump(),
        financial_data=financial_plan,
        scheme_data=schemes,
        time_machine=time_machine,
        cluster_data=clusters,
        feasibility_scores=feasibility,
        retrieved_at=datetime.now(timezone.utc).isoformat(),
    )
    dpr = DPREngine.generate_29_section_dpr(evidence, applicant_name=applicant_name)
    pdf_bytes = DPREngine.generate_pdf_bytes(dpr)
    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=DPR-{dpr.dpr_id}.pdf"},
    )


def _build_swot(feasibility, financial_plan, schemes, request):
    strengths = []
    weaknesses = []
    opportunities = []
    threats = []

    if feasibility.capital_fit >= 75:
        strengths.append("Strong capital positioning for the proposed business.")
    if financial_plan.monthly_emi > 0:
        strengths.append(f"Manageable EMI of ₹{financial_plan.monthly_emi:,.0f} with {financial_plan.moratorium_months} months moratorium.")
    if schemes:
        strengths.append(f"Eligible for {len(schemes)} government scheme(s) including subsidy support.")
    if feasibility.market_score >= 75:
        strengths.append("Good market fit for the locality.")

    if financial_plan.break_even_months > 9:
        weaknesses.append(f"Break-even takes {financial_plan.break_even_months} months; cash reserves needed.")
    if feasibility.risk_score < 60:
        weaknesses.append("Higher than ideal risk profile for the business category.")
    weaknesses.append("Limited diversification in revenue streams initially.")

    if schemes:
        opportunities.append("Government subsidy significantly reduces capital burden.")
    opportunities.append("Cluster network can provide bulk procurement savings.")
    opportunities.append("Digital payments and formalization unlock further scheme eligibility.")

    threats.append("Raw material price volatility in rural markets.")
    threats.append("Seasonal demand fluctuation may impact early cashflows.")
    if feasibility.competition_score < 70:
        threats.append("Growing local competition in the business segment.")

    return SWOTAnalysis(
        strengths=strengths,
        weaknesses=weaknesses,
        opportunities=opportunities,
        threats=threats,
    )
