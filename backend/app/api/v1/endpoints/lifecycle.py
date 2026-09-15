from typing import Any, Dict
from fastapi import APIRouter, Query, Body
from app.models.schemas import LifecycleStatus, PersonalDashboardData, GenerateGoalRequest, AIBusinessGoal
from app.engines.lifecycle import LifecycleEngine

router = APIRouter()


@router.post("/assess", response_model=LifecycleStatus)
async def assess_lifecycle(
    business_id: str = "BIZ-001",
    days_since_launch: int = 0,
    monthly_revenue: float = 0.0,
    monthly_expenses: float = 0.0,
    emi: float = 0.0,
    working_capital: float = 0.0,
    loan_emi_paid: bool = True,
    scheme_compliance: bool = True,
):
    return LifecycleEngine.assess_lifecycle(
        business_id=business_id,
        days_since_launch=days_since_launch,
        monthly_revenue=monthly_revenue,
        monthly_expenses=monthly_expenses,
        emi=emi,
        working_capital=working_capital,
        loan_emi_paid=loan_emi_paid,
        scheme_compliance=scheme_compliance,
    )


@router.get("/milestones")
async def get_milestones(days_since_launch: int = 0):
    return LifecycleEngine.get_milestone_status(days_since_launch)


@router.get("/health-tips")
async def get_health_tips(health_score: int = 50):
    tips = []
    if health_score < 50:
        tips = [
            "Review pricing strategy immediately.",
            "Reduce non-essential operating expenses.",
            "Contact your bank for loan restructuring options.",
            "Consult the AI advisor for pivot recommendations.",
        ]
    elif health_score < 75:
        tips = [
            "Optimize inventory management to reduce waste.",
            "Explore additional revenue streams in your cluster.",
            "Ensure timely EMI payments to maintain credit score.",
        ]
    else:
        tips = [
            "Consider expanding product range or services.",
            "Evaluate opportunities for PMEGP Phase 2 funding.",
            "Build reserves for seasonal demand fluctuations.",
        ]
    return {"health_score": health_score, "tips": tips}


@router.get("/dashboard", response_model=PersonalDashboardData)
async def get_personal_dashboard(
    locality: str = Query("Bassi", description="Locality or town of business"),
    state: str = Query("Rajasthan", description="State"),
    business_idea: str = Query("Commercial Mini Dairy & Chilling Unit", description="Finalized business idea"),
    capital: float = Query(100000.0, description="Promoter equity or margin money in INR"),
    enterprise_name: str = Query("Ganga Dairy Parlour", description="Enterprise name"),
):
    return LifecycleEngine.get_personal_dashboard(
        locality=locality,
        state=state,
        business_idea=business_idea,
        capital=capital,
        enterprise_name=enterprise_name,
    )


@router.post("/generate-next-goal", response_model=AIBusinessGoal)
async def generate_next_goal(request: GenerateGoalRequest):
    return LifecycleEngine.generate_next_ai_goal(request)


@router.post("/reminders/{reminder_id}/respond")
async def respond_to_reminder(
    reminder_id: str,
    action: str = Body(..., embed=True),
):
    return LifecycleEngine.respond_to_reminder(reminder_id=reminder_id, action=action)

