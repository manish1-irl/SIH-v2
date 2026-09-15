from fastapi import APIRouter
from app.models.schemas import SchemeRecommendation, SocialCategoryEnum, GenderEnum
from app.engines.schemes import SchemeEngine, OFFICIAL_SCHEMES

router = APIRouter()


@router.get("/list", response_model=list[dict])
async def list_all_schemes():
    return OFFICIAL_SCHEMES


@router.post("/match", response_model=list[SchemeRecommendation])
async def match_schemes(
    project_cost: float,
    business_category: str = "general",
    social_category: SocialCategoryEnum = SocialCategoryEnum.GENERAL,
    gender: GenderEnum = GenderEnum.MALE,
    is_rural: bool = True,
):
    return SchemeEngine.match_schemes(
        project_cost=project_cost,
        business_category=business_category,
        social_category=social_category,
        gender=gender,
        is_rural=is_rural,
    )


@router.get("/eligibility/{scheme_id}")
async def check_eligibility(scheme_id: str, project_cost: float = 0.0):
    for s in OFFICIAL_SCHEMES:
        if s["id"] == scheme_id:
            eligible = True
            reason = "Meets basic eligibility criteria."
            if scheme_id == "pmegp":
                max_cost = s.get("max_manufacturing_cost", 5000000)
                if project_cost > max_cost:
                    eligible = False
                    reason = f"Project cost ₹{project_cost:,.0f} exceeds PMEGP ceiling of ₹{max_cost:,.0f}."
            elif scheme_id == "pm_mudra_kishore":
                if project_cost > 700000:
                    eligible = False
                    reason = f"Project cost ₹{project_cost:,.0f} exceeds MUDRA Kishore limit of ₹7,00,000."
            return {
                "scheme_id": scheme_id,
                "name": s["name"],
                "eligible": eligible,
                "reason": reason,
            }
    return {"error": "Scheme not found"}
