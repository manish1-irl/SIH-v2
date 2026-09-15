from typing import Any, Dict, Optional
from app.engines.financial import DeterministicFinancialEngine
from app.engines.feasibility import FeasibilityEngine
from app.engines.schemes import SchemeEngine
from app.engines.time_machine import TimeMachineEngine
from app.engines.cluster import ClusterEngine
from app.engines.dpr import DPREngine
from app.engines.lifecycle import LifecycleEngine
from app.engines.location_intelligence import LocationIntelligenceEngine
from app.models.schemas import EvidenceObject, SocialCategoryEnum, GenderEnum


class AgentTools:
    """23 Agent Tool Contracts for CrewAI tool-calling."""

    @staticmethod
    def tool_01_calculate_project_cost(
        margin_capital: float,
        business_category: str = "general",
    ) -> Dict[str, Any]:
        cost = DeterministicFinancialEngine.calculate_project_cost(margin_capital, business_category)
        return {"project_cost": cost, "margin_capital": margin_capital, "category": business_category}

    @staticmethod
    def tool_02_calculate_emi(
        principal: float,
        annual_rate: float = 8.5,
        tenure_months: int = 60,
        moratorium_months: int = 6,
    ) -> Dict[str, Any]:
        emi = DeterministicFinancialEngine.calculate_emi(principal, annual_rate, tenure_months, moratorium_months)
        return {"emi": emi, "principal": principal, "rate": annual_rate, "tenure": tenure_months}

    @staticmethod
    def tool_03_generate_financial_plan(
        capital: float,
        business_category: str = "general",
    ) -> Dict[str, Any]:
        plan = DeterministicFinancialEngine.generate_financial_plan(capital, business_category)
        return plan.model_dump()

    @staticmethod
    def tool_04_calculate_feasibility(
        capital: float,
        business_idea: str,
        locality: str,
        state: str,
        demographics: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        result = FeasibilityEngine.calculate_feasibility(
            capital, business_idea, locality, state, demographics or {}
        )
        return result.model_dump()

    @staticmethod
    def tool_05_reverse_feasibility(
        capital: float,
        locality: str,
        state: str = "Rajasthan",
    ) -> Dict[str, Any]:
        recs = FeasibilityEngine.run_reverse_feasibility(capital, locality, state)
        loc_profile = LocationIntelligenceEngine.analyze_locality(locality, state)
        return {
            "location_profile": loc_profile.model_dump(),
            "recommendations": [r.model_dump() for r in recs],
        }

    @staticmethod
    def tool_06_match_schemes(
        project_cost: float,
        business_category: str = "general",
        social_category: str = "General",
        gender: str = "Male",
        is_rural: bool = True,
    ) -> Dict[str, Any]:
        sc = SocialCategoryEnum(social_category)
        gn = GenderEnum(gender)
        schemes = SchemeEngine.match_schemes(project_cost, business_category, sc, gn, is_rural)
        return {"schemes": [s.model_dump() for s in schemes]}

    @staticmethod
    def tool_07_check_scheme_eligibility(
        scheme_id: str,
        project_cost: float,
        social_category: str = "General",
        is_rural: bool = True,
    ) -> Dict[str, Any]:
        from app.engines.schemes import OFFICIAL_SCHEMES
        for s in OFFICIAL_SCHEMES:
            if s["id"] == scheme_id:
                return {"eligible": True, "scheme": s["name"], "project_cost": project_cost}
        return {"eligible": False, "error": "Scheme not found"}

    @staticmethod
    def tool_08_analyze_timing(
        business_category: str,
        moratorium_months: int = 6,
    ) -> Dict[str, Any]:
        result = TimeMachineEngine.analyze_timing(business_category, moratorium_months)
        return result.model_dump()

    @staticmethod
    def tool_09_find_clusters(
        locality: str,
        business_category: str = "general",
    ) -> Dict[str, Any]:
        clusters = ClusterEngine.find_clusters(locality, business_category)
        return {"clusters": [c.model_dump() for c in clusters]}

    @staticmethod
    def tool_10_generate_dpr(
        evidence_dict: Dict[str, Any],
        applicant_name: str = "Entrepreneur",
    ) -> Dict[str, Any]:
        evidence = EvidenceObject(**evidence_dict)
        dpr = DPREngine.generate_29_section_dpr(evidence, applicant_name)
        return dpr.model_dump()

    @staticmethod
    def tool_11_assess_lifecycle(
        business_id: str,
        days_since_launch: int,
        monthly_revenue: float = 0.0,
        monthly_expenses: float = 0.0,
        emi: float = 0.0,
        working_capital: float = 0.0,
    ) -> Dict[str, Any]:
        status = LifecycleEngine.assess_lifecycle(
            business_id, days_since_launch, monthly_revenue,
            monthly_expenses, emi, working_capital,
        )
        return status.model_dump()

    @staticmethod
    def tool_12_health_score(
        monthly_revenue: float,
        monthly_expenses: float,
        emi: float,
        days_since_launch: int,
    ) -> Dict[str, Any]:
        score = LifecycleEngine.calculate_health_score(
            days_since_launch, monthly_revenue, monthly_expenses,
        )
        return {"health_score": score}

    @staticmethod
    def tool_13_risk_alerts(
        monthly_revenue: float,
        monthly_expenses: float,
        emi: float,
        days_since_launch: int,
    ) -> Dict[str, Any]:
        alerts = LifecycleEngine.get_risk_alerts(monthly_revenue, monthly_expenses, emi, days_since_launch)
        return {"alerts": [a.model_dump() for a in alerts]}

    @staticmethod
    def tool_14_milestones(days_since_launch: int) -> Dict[str, Any]:
        milestones = LifecycleEngine.get_milestone_status(days_since_launch)
        return {"milestones": milestones}

    @staticmethod
    def tool_15_next_actions(
        days_since_launch: int,
        health_score: int,
    ) -> Dict[str, Any]:
        actions = LifecycleEngine.get_next_actions(days_since_launch, health_score)
        return {"actions": actions}

    @staticmethod
    def tool_16_cashflow_analysis(
        capital: float,
        business_category: str = "general",
    ) -> Dict[str, Any]:
        plan = DeterministicFinancialEngine.generate_financial_plan(capital, business_category)
        cashflows = plan.monthly_cashflow_projection
        total_revenue = sum(c.projected_revenue for c in cashflows)
        total_expenses = sum(c.operating_expenses + c.emi for c in cashflows)
        return {
            "break_even_month": plan.break_even_months,
            "total_revenue_12m": total_revenue,
            "total_expenses_12m": total_expenses,
            "net_position_12m": total_revenue - total_expenses,
            "cashflows": [c.model_dump() for c in cashflows],
        }

    @staticmethod
    def tool_17_scheme_subsidy_calculation(
        project_cost: float,
        scheme_id: str,
        is_rural: bool = True,
        is_special: bool = False,
    ) -> Dict[str, Any]:
        from app.engines.schemes import OFFICIAL_SCHEMES
        for s in OFFICIAL_SCHEMES:
            if s["id"] == scheme_id and scheme_id == "pmegp":
                if is_special:
                    subsidy_pct = s["subsidy_rural_special"] if is_rural else s["subsidy_urban_special"]
                    margin_pct = s["margin_special"]
                else:
                    subsidy_pct = s["subsidy_rural_general"] if is_rural else s["subsidy_urban_general"]
                    margin_pct = s["margin_general"]
                subsidy_amount = round(project_cost * (subsidy_pct / 100), 2)
                return {
                    "scheme": s["name"],
                    "subsidy_percentage": subsidy_pct,
                    "subsidy_amount": subsidy_amount,
                    "margin_required": round(project_cost * (margin_pct / 100), 2),
                    "loan_amount": round(project_cost - project_cost * (margin_pct / 100) - subsidy_amount, 2),
                }
        return {"error": "Scheme not found"}

    @staticmethod
    def tool_18_business_category_analysis(
        business_idea: str,
    ) -> Dict[str, Any]:
        idea_lower = business_idea.lower()
        if any(k in idea_lower for k in ["dairy", "milk", "cattle"]):
            return {"category": "Dairy & Animal Husbandry", "sector": "Agriculture", "risk_profile": "Medium", "typical_margin": "10-15%"}
        elif any(k in idea_lower for k in ["food", "spice", "processing", "mill"]):
            return {"category": "Food Processing", "sector": "MSME Manufacturing", "risk_profile": "Low-Medium", "typical_margin": "12-18%"}
        elif any(k in idea_lower for k in ["retail", "shop", "store", "trading"]):
            return {"category": "Retail & Trading", "sector": "Services", "risk_profile": "Low", "typical_margin": "8-12%"}
        elif any(k in idea_lower for k in ["solar", "energy", "electric"]):
            return {"category": "Rural Renewable Energy", "sector": "Infrastructure", "risk_profile": "Low", "typical_margin": "15-20%"}
        elif any(k in idea_lower for k in ["textile", "cloth", "weaving"]):
            return {"category": "Textiles & Handloom", "sector": "Manufacturing", "risk_profile": "Medium", "typical_margin": "10-15%"}
        return {"category": "General Enterprise", "sector": "Mixed", "risk_profile": "Medium", "typical_margin": "10-15%"}

    @staticmethod
    def tool_19_working_capital_assessment(
        project_cost: float,
        monthly_revenue: float,
        monthly_expenses: float,
    ) -> Dict[str, Any]:
        working_capital = project_cost * 0.25
        months_runway = working_capital / monthly_expenses if monthly_expenses > 0 else 0
        return {
            "recommended_working_capital": working_capital,
            "months_runway": round(months_runway, 1),
            "sufficient": months_runway >= 2,
            "recommendation": "Adequate" if months_runway >= 2 else "Insufficient - consider additional working capital loan",
        }

    @staticmethod
    def tool_20_competitive_landscape(
        locality: str,
        business_category: str,
    ) -> Dict[str, Any]:
        return {
            "locality": locality,
            "category": business_category,
            "estimated_competitors": 12,
            "market_saturation": "Medium",
            "differentiation_opportunities": [
                "Quality certification (FSSAI, organic)",
                "Digital payment integration",
                "Home delivery service",
                "Value-added product variants",
            ],
        }

    @staticmethod
    def tool_21_regulatory_checklist(
        business_category: str,
    ) -> Dict[str, Any]:
        base = ["Udyam Registration (MSME)", "GST Registration", "Shop & Establishment License"]
        idea_lower = business_category.lower()
        if any(k in idea_lower for k in ["dairy", "food", "milk"]):
            base.extend(["FSSAI License", "Health Department NOC", "Pollution Control Board Consent"])
        elif any(k in idea_lower for k in ["solar", "energy"]):
            base.extend(["Electrical Inspectorate Approval", "State Nodal Agency Registration"])
        elif any(k in idea_lower for k in ["textile"]):
            base.extend(["Textile Committee Registration", "Fire Safety NOC"])
        return {"licenses_required": base, "estimated_processing_time": "30-45 days"}

    @staticmethod
    def tool_22_investment_timeline(
        capital: float,
        business_category: str = "general",
    ) -> Dict[str, Any]:
        plan = DeterministicFinancialEngine.generate_financial_plan(capital, business_category)
        return {
            "phase_1_pre_launch": {"months": "0-1", "amount": capital * 0.4, "activities": ["Registration", "DPR preparation", "Bank application"]},
            "phase_2_setup": {"months": "1-2", "amount": capital * 0.35, "activities": ["Equipment purchase", "Infrastructure setup", "Initial stock"]},
            "phase_3_launch": {"months": "2-3", "amount": capital * 0.15, "activities": ["Marketing", "Staff hiring", "Operations begin"]},
            "phase_4_stabilize": {"months": "3-6", "amount": capital * 0.10, "activities": ["Working capital management", "First EMI payment", "Performance review"]},
            "total_project_cost": plan.project_cost,
            "bank_loan": plan.loan_requirement,
            "moratorium_months": plan.moratorium_months,
        }

    @staticmethod
    def tool_23_full_analysis_summary(
        request_dict: Dict[str, Any],
    ) -> Dict[str, Any]:
        capital = request_dict.get("capital", 100000)
        locality = request_dict.get("locality", "Unknown")
        business_idea = request_dict.get("business_idea", "general")

        plan = DeterministicFinancialEngine.generate_financial_plan(capital, business_idea)
        feasibility = FeasibilityEngine.calculate_feasibility(
            capital, business_idea, locality, request_dict.get("state", ""), {}
        )
        schemes = SchemeEngine.match_schemes(plan.project_cost, business_idea)
        timing = TimeMachineEngine.analyze_timing(business_idea)

        return {
            "financial_plan": plan.model_dump(),
            "feasibility": feasibility.model_dump(),
            "schemes": [s.model_dump() for s in schemes],
            "timing": timing.model_dump(),
            "verdict": feasibility.verdict.value,
            "overall_score": feasibility.overall_score,
        }

    @staticmethod
    def tool_24_location_intelligence(
        locality: str,
        state: str = "Rajasthan",
    ) -> Dict[str, Any]:
        loc_profile = LocationIntelligenceEngine.analyze_locality(locality, state)
        return {"location_profile": loc_profile.model_dump()}
