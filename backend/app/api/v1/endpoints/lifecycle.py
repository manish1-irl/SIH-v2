from fastapi import APIRouter
from app.models.schemas import LifecycleStatus
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
