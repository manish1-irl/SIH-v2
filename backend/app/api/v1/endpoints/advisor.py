from io import BytesIO
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from app.models.schemas import (
    BusinessAdvisorRequest, FeasibilityReportResponse, ReverseFeasibilityRecommendation,
    EvidenceObject, FinancialPlan, RecommendationEnum, SWOTAnalysis,
)
from app.engines.financial import DeterministicFinancialEngine
from app.engines.feasibility import FeasibilityEngine
from app.engines.schemes import SchemeEngine
from app.engines.time_machine import TimeMachineEngine
from app.engines.cluster import ClusterEngine
from app.engines.dpr import DPREngine
from app.agent.crew_orchestrator import CrewOrchestrator
import uuid
from datetime import datetime, timezone

router = APIRouter()


@router.post("/analyze", response_model=FeasibilityReportResponse)
async def analyze_business(request: BusinessAdvisorRequest):
    financial_plan = DeterministicFinancialEngine.generate_financial_plan(
        capital=request.capital,
        business_category=request.business_idea or "general",
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
        sources=[
            {"name": "PMEGP Portal", "type": "government_scheme"},
            {"name": "MUDRA Portal", "type": "government_scheme"},
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


@router.post("/generate-dpr")
async def generate_dpr(request: BusinessAdvisorRequest):
    financial_plan = DeterministicFinancialEngine.generate_financial_plan(
        capital=request.capital,
        business_category=request.business_idea or "general",
    )
    schemes = SchemeEngine.match_schemes(
        project_cost=financial_plan.project_cost,
        business_category=request.business_idea or "general",
        social_category=request.social_category,
        gender=request.gender,
    )
    feasibility = FeasibilityEngine.calculate_feasibility(
        capital=request.capital,
        business_idea=request.business_idea or "general",
        locality=request.locality,
        state=request.state,
        demographics={},
    )
    time_machine = TimeMachineEngine.analyze_timing(
        business_category=request.business_idea or "general",
    )
    clusters = ClusterEngine.find_clusters(
        locality=request.locality,
        business_category=request.business_idea or "general",
    )
    evidence = EvidenceObject(
        user_inputs=request.model_dump(),
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
