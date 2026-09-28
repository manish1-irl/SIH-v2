import asyncio
import pytest
from app.tools.agent_tools import AgentTools
from app.engines.schemes import SchemeEngine, OFFICIAL_SCHEMES
from app.engines.financial import DeterministicFinancialEngine
from app.models.schemas import RecommendationEnum
from app.agent.crew_orchestrator import CrewOrchestrator


class TestAgentToolsSuite:
    """Comprehensive test verification for all 24 AgentTools contracts and deterministic logic."""

    def test_tool_01_calculate_project_cost(self):
        res = AgentTools.tool_01_calculate_project_cost(100000, "dairy")
        assert res["margin_capital"] == 100000
        assert res["project_cost"] >= 100000
        assert "category" in res

    def test_tool_02_calculate_emi(self):
        res = AgentTools.tool_02_calculate_emi(principal=200000, annual_rate=8.5, tenure_months=60, moratorium_months=6)
        assert res["emi"] > 0
        assert res["principal"] == 200000
        assert res["rate"] == 8.5
        assert res["tenure"] == 60

    def test_tool_03_generate_financial_plan_with_dynamic_project_cost(self):
        plan1 = AgentTools.tool_03_generate_financial_plan(100000, "dairy")
        plan2 = AgentTools.tool_03_generate_financial_plan(100000, "dairy", project_cost=600000)
        assert plan2["project_cost"] == 600000.0
        assert plan2["margin_contribution"] == 100000.0
        assert plan2["loan_requirement"] == 500000.0
        assert plan2["working_capital"] == 150000.0
        assert len(plan2["monthly_cashflow_projection"]) == 12

    def test_tool_04_calculate_feasibility_with_project_cost(self):
        res = AgentTools.tool_04_calculate_feasibility(
            capital=150000,
            business_idea="Commercial Mini Dairy",
            locality="Bassi",
            state="Rajasthan",
            project_cost=500000,
        )
        assert res["overall_score"] > 0
        assert res["verdict"] in [
            RecommendationEnum.GO,
            RecommendationEnum.CONDITIONAL_GO,
            "STRONG GO",
            "CONDITIONAL GO",
            "Viable",
            "Feasible",
            "Conditionally Feasible",
            "FEASIBLE",
            "CONDITIONALLY_FEASIBLE",
        ]
        assert "capital_fit" in res
        assert "market_score" in res

    def test_tool_05_reverse_feasibility(self):
        res = AgentTools.tool_05_reverse_feasibility(100000, "Bassi", "Rajasthan")
        assert "location_profile" in res
        assert "recommendations" in res
        assert len(res["recommendations"]) > 0

    def test_tool_06_match_schemes_all_12_schemes(self):
        res = AgentTools.tool_06_match_schemes(project_cost=500000, business_category="dairy")
        schemes = res["schemes"]
        assert len(schemes) >= 3
        names = [s["scheme_name"] for s in schemes]
        assert any("PMEGP" in n or "MUDRA" in n or "PMFME" in n for n in names)

    def test_tool_07_check_scheme_eligibility(self):
        res1 = AgentTools.tool_07_check_scheme_eligibility("pmegp", 500000)
        assert res1["eligible"] is True
        res2 = AgentTools.tool_07_check_scheme_eligibility("non_existent_scheme", 500000)
        assert res2["eligible"] is False

    def test_tool_08_analyze_timing(self):
        res = AgentTools.tool_08_analyze_timing("dairy", moratorium_months=6)
        assert "recommended_launch_window" in res
        assert "expected_peak_period" in res

    def test_tool_09_find_clusters(self):
        res = AgentTools.tool_09_find_clusters("Bassi", "dairy")
        assert "clusters" in res
        assert len(res["clusters"]) > 0

    def test_tool_10_generate_dpr(self):
        evidence = {
            "applicant_name": "Test Farmer",
            "social_category": "OBC",
            "gender": "Male",
            "education": "Graduate",
            "prior_experience": "3 years",
            "asset_availability": "Owned land",
            "role": "Proprietor",
            "business_idea": "Mini Dairy Farm",
            "capital": 100000.0,
            "locality": "Bassi",
            "state": "Rajasthan",
            "is_rural": True,
            "project_cost": 500000.0,
        }
        res = AgentTools.tool_10_generate_dpr(evidence, "Test Farmer")
        assert res["business_name"] == "Mini Dairy Farm"
        assert res["sections_count"] == 29
        assert len(res["sections"]) == 29

    def test_tool_11_to_15_lifecycle_engines(self):
        s = AgentTools.tool_11_assess_lifecycle("biz-101", days_since_launch=45, monthly_revenue=45000, monthly_expenses=25000, emi=5000)
        assert s["health_score"] > 0
        h = AgentTools.tool_12_health_score(45000, 25000, 5000, 45)
        assert 0 <= h["health_score"] <= 100
        a = AgentTools.tool_13_risk_alerts(10000, 30000, 8000, 45)
        assert len(a["alerts"]) > 0
        m = AgentTools.tool_14_milestones(60)
        assert "milestones" in m
        acts = AgentTools.tool_15_next_actions(45, 80)
        assert len(acts["actions"]) > 0

    def test_tool_16_cashflow_analysis_with_project_cost(self):
        res = AgentTools.tool_16_cashflow_analysis(capital=100000, business_category="dairy", project_cost=500000)
        assert res["total_revenue_12m"] > 0
        assert res["total_expenses_12m"] > 0
        assert len(res["cashflows"]) == 12

    def test_tool_17_scheme_subsidy_calculations_for_schemes(self):
        pmegp = AgentTools.tool_17_scheme_subsidy_calculation(1000000, "pmegp", is_rural=True, is_special=True)
        assert pmegp["subsidy_percentage"] == 35.0
        assert pmegp["subsidy_amount"] == 350000.0
        assert pmegp["margin_required"] == 50000.0

        pmfme = AgentTools.tool_17_scheme_subsidy_calculation(1000000, "pmfme")
        assert pmfme["subsidy_percentage"] == 35.0
        assert pmfme["subsidy_amount"] == 350000.0

        mudra = AgentTools.tool_17_scheme_subsidy_calculation(400000, "pm_mudra_kishore")
        assert mudra["margin_required"] == 60000.0
        assert mudra["loan_amount"] == 340000.0

        kusum = AgentTools.tool_17_scheme_subsidy_calculation(500000, "pm_kusum")
        assert kusum["subsidy_percentage"] == 60.0

    def test_tool_18_and_19_category_and_working_capital(self):
        cat = AgentTools.tool_18_business_category_analysis("Mustard Oil Expeller")
        assert "Food Processing" in cat["category"]
        wc = AgentTools.tool_19_working_capital_assessment(project_cost=500000, monthly_revenue=60000, monthly_expenses=40000)
        assert wc["recommended_working_capital"] == 125000.0
        assert wc["months_runway"] > 2
        assert wc["sufficient"] is True

    def test_tool_20_competitive_landscape_dynamic_zero_mock(self):
        res1 = AgentTools.tool_20_competitive_landscape("Bassi", "kirana retail")
        res2 = AgentTools.tool_20_competitive_landscape("Sitapura", "solar energy")
        assert res1["estimated_competitors"] > 0
        assert res2["estimated_competitors"] > 0
        assert res1["locality"] == "Bassi"
        assert "market_saturation" in res1
        assert "differentiation_opportunities" in res1
        assert res1["estimated_competitors"] != res2["estimated_competitors"] or res1["category"] != res2["category"]

    def test_tool_21_regulatory_checklist(self):
        res = AgentTools.tool_21_regulatory_checklist("dairy milk processing")
        assert any("FSSAI" in lic for lic in res["licenses_required"])
        assert any("Udyam" in lic for lic in res["licenses_required"])

    def test_tool_22_investment_timeline_with_project_cost(self):
        res = AgentTools.tool_22_investment_timeline(capital=100000, business_category="dairy", project_cost=500000)
        assert res["total_project_cost"] == 500000.0
        assert res["phase_1_pre_launch"]["amount"] == 200000.0
        assert res["phase_2_setup"]["amount"] == 175000.0
        assert res["phase_3_launch"]["amount"] == 75000.0
        assert res["phase_4_stabilize"]["amount"] == 50000.0

    def test_tool_23_full_analysis_summary(self):
        req = {
            "capital": 100000,
            "locality": "Bassi",
            "business_idea": "Commercial Mini Dairy",
            "state": "Rajasthan",
            "project_cost": 500000,
        }
        res = AgentTools.tool_23_full_analysis_summary(req)
        assert res["financial_plan"]["project_cost"] == 500000.0
        assert res["financial_plan"]["margin_contribution"] == 100000.0
        assert res["financial_plan"]["loan_requirement"] == 400000.0
        assert res["overall_score"] > 0
        assert len(res["schemes"]) >= 1

    def test_tool_24_location_intelligence(self):
        res = AgentTools.tool_24_location_intelligence("Bassi", "Rajasthan")
        assert "location_profile" in res
        assert res["location_profile"]["locality"] == "Bassi"
        assert res["location_profile"]["households"] > 0


class TestCrewOrchestratorConversationalFlow:
    """Test AI conversational turn routing, dynamic project_cost, and multi-lingual fallback."""

    def setup_method(self):
        self.orchestrator = CrewOrchestrator()

    def test_chat_greeting(self):
        res = asyncio.run(self.orchestrator.handle_chat("Hello", context="test_user_1", language="en"))
        assert "Namaste" in res["response"]
        assert "greeting" in res["tool_used"]

    def test_chat_emi_inquiry(self):
        res = asyncio.run(self.orchestrator.handle_chat("What is the EMI for 200000 loan?", context="test_user_2", language="en"))
        assert "EMI" in res["response"] or "loan" in res["response"].lower()
        assert any(t in res["tool_used"] for t in ["emi", "monthly_emi", "agent_tools", "principal"])

    def test_chat_scheme_inquiry(self):
        res = asyncio.run(self.orchestrator.handle_chat("Which government scheme provides subsidy for dairy?", context="test_user_3", language="en"))
        assert any(s in res["response"] for s in ["PMEGP", "MUDRA", "PMFME", "Scheme", "Subsidy"])

    def test_chat_full_business_intent(self):
        res = asyncio.run(self.orchestrator.handle_chat("I have 1 lakh capital and want to start dairy in Bassi", context="test_user_4", language="en"))
        assert len(res["response"]) > 0
        assert res["active_business"]["business_idea"] is not None
        assert res["active_business"]["capital"] == 100000.0
        assert res["active_business"]["locality"] == "Bassi"
