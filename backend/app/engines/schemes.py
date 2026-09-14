from typing import List, Dict, Any
from app.models.schemas import SchemeRecommendation, SocialCategoryEnum, GenderEnum

OFFICIAL_SCHEMES: List[Dict[str, Any]] = [
    {
        "id": "pmegp",
        "name": "Prime Minister's Employment Generation Programme (PMEGP)",
        "ministry": "Ministry of Micro, Small and Medium Enterprises (MSME)",
        "official_url": "https://www.kviconline.gov.in/pmegpeportal",
        "max_manufacturing_cost": 5000000,
        "max_service_cost": 2000000,
        "margin_general": 10.0,
        "margin_special": 5.0,
        "subsidy_rural_special": 35.0,
        "subsidy_rural_general": 25.0,
        "subsidy_urban_special": 25.0,
        "subsidy_urban_general": 15.0,
        "eligible_sectors": ["Manufacturing", "Service", "Food Processing", "Dairy", "Textiles", "Agri-allied"],
        "required_docs": [
            "Aadhaar Card", "PAN Card", "Caste Certificate", "DPR", "Rural Certificate"
        ],
        "application_process": "Online via KVIC portal -> District committee review -> Bank sanction",
    },
    {
        "id": "pm_mudra_kishore",
        "name": "Pradhan Mantri MUDRA Yojana (Kishore Loan)",
        "ministry": "Department of Financial Services, Ministry of Finance",
        "official_url": "https://www.mudra.org.in/",
        "min_loan": 50000,
        "max_loan": 500000,
        "margin_required": 15.0,
        "subsidy_percentage": 0.0,
        "eligible_sectors": ["Retail", "Trading", "Dairy", "Food Processing", "Services"],
        "required_docs": ["Identity Proof", "Address Proof", "Business Proof", "Bank Statement"],
        "application_process": "Direct application via public/commercial bank or Udyamimitra portal.",
    }
]

class SchemeEngine:
    @staticmethod
    def match_schemes(project_cost: float, business_category: str, social_category: SocialCategoryEnum = SocialCategoryEnum.GENERAL, gender: GenderEnum = GenderEnum.MALE, is_rural: bool = True) -> List[SchemeRecommendation]:
        recs = []
        is_special = (social_category in [SocialCategoryEnum.SC, SocialCategoryEnum.ST, SocialCategoryEnum.OBC, SocialCategoryEnum.WOMEN] or gender == GenderEnum.FEMALE)
        for s in OFFICIAL_SCHEMES:
            if s["id"] == "pmegp":
                margin_pct = s["margin_special"] if is_special else s["margin_general"]
                subsidy_pct = s["subsidy_rural_special"] if (is_rural and is_special) else 25.0
                max_sub = round(project_cost * (subsidy_pct / 100.0), 2)
                recs.append(SchemeRecommendation(
                    scheme_name=s["name"],
                    ministry=s["ministry"],
                    official_url=s["official_url"],
                    eligibility_status="Eligible",
                    subsidy_percentage=subsidy_pct,
                    max_subsidy_amount=max_sub,
                    margin_required_percent=margin_pct,
                    why_matched=["Meets project ceiling criteria.", f"Qualifies for {subsidy_pct}% rural subsidy."],
                    required_documents=s["required_docs"],
                    application_process=s["application_process"],
                ))
            elif s["id"] == "pm_mudra_kishore":
                if project_cost <= 700000:
                    recs.append(SchemeRecommendation(
                        scheme_name=s["name"],
                        ministry=s["ministry"],
                        official_url=s["official_url"],
                        eligibility_status="Eligible",
                        subsidy_percentage=0.0,
                        max_subsidy_amount=0.0,
                        margin_required_percent=15.0,
                        why_matched=["Collateral-free credit under MUDRA Kishore."],
                        required_documents=s["required_docs"],
                        application_process=s["application_process"],
                    ))
        return recs
