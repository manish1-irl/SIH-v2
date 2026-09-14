from typing import Dict, Any
from app.models.schemas import EvidenceObject, DPRResponse

class DPREngine:
    @staticmethod
    def generate_29_section_dpr(evidence: EvidenceObject, applicant_name: str = "Entrepreneur") -> DPRResponse:
        f = evidence.financial_data
        sections: Dict[str, Any] = {
            f"section_{i:02d}": f"Detailed content for section {i}" for i in range(1, 30)
        }
        sections["section_01_cover_page"] = {
            "title": f"DPR for {evidence.user_inputs.get('business_idea', 'Business')}",
            "location": f"{evidence.user_inputs.get('locality')}, {evidence.user_inputs.get('state')}",
            "project_cost": f.project_cost,
            "margin_contribution": f.margin_contribution,
            "loan_amount": f.loan_requirement,
        }
        return DPRResponse(
            dpr_id=f"DPR-{evidence.user_inputs.get('locality', 'LOC')[:3].upper()}-{int(f.project_cost)}",
            business_name=evidence.user_inputs.get("business_idea", "Business"),
            sections_count=29,
            sections=sections,
            pdf_download_url="/api/v1/reports/download-pdf",
        )
