import pytest
from app.engines.financial import DeterministicFinancialEngine
from app.engines.feasibility import FeasibilityEngine
from app.engines.schemes import SchemeEngine, OFFICIAL_SCHEMES
from app.engines.time_machine import TimeMachineEngine
from app.engines.cluster import ClusterEngine
from app.engines.dpr import DPREngine
from app.engines.lifecycle import LifecycleEngine
from app.engines.location_intelligence import LocationIntelligenceEngine, LocationProfile
from app.models.schemas import (
    FinancialPlan, FeasibilityScoreBreakdown, SchemeRecommendation,
    TimeMachineOutput, ClusterOpportunity, DPRResponse, LifecycleStatus,
    SocialCategoryEnum, GenderEnum, RecommendationEnum, EvidenceObject,
)


class TestDeterministicFinancialEngine:
    def test_calculate_project_cost_general(self):
        cost = DeterministicFinancialEngine.calculate_project_cost(100000, "general")
        assert cost == 400000.0

    def test_calculate_project_cost_dairy(self):
        cost = DeterministicFinancialEngine.calculate_project_cost(100000, "dairy")
        assert cost == 450000.0

    def test_calculate_project_cost_processing(self):
        cost = DeterministicFinancialEngine.calculate_project_cost(100000, "food processing")
        assert cost == 500000.0

    def test_calculate_project_cost_retail(self):
        cost = DeterministicFinancialEngine.calculate_project_cost(100000, "retail")
        assert cost == 350000.0

    def test_calculate_emi_basic(self):
        emi = DeterministicFinancialEngine.calculate_emi(100000, 8.5, 60, 6)
        assert emi > 0
        assert isinstance(emi, float)

    def test_calculate_emi_zero_principal(self):
        emi = DeterministicFinancialEngine.calculate_emi(0, 8.5, 60, 6)
        assert emi == 0.0

    def test_calculate_emi_zero_rate(self):
        emi = DeterministicFinancialEngine.calculate_emi(100000, 0, 60, 0)
        assert emi > 0

    def test_generate_financial_plan(self):
        plan = DeterministicFinancialEngine.generate_financial_plan(100000, "dairy")
        assert isinstance(plan, FinancialPlan)
        assert plan.project_cost == 450000.0
        assert plan.margin_contribution == 100000.0
        assert plan.loan_requirement == 350000.0
        assert plan.monthly_emi > 0
        assert plan.total_repayment > 0
        assert plan.break_even_months >= 1
        assert len(plan.monthly_cashflow_projection) == 12

    def test_financial_plan_cashflow_structure(self):
        plan = DeterministicFinancialEngine.generate_financial_plan(100000)
        for cf in plan.monthly_cashflow_projection:
            assert cf.month >= 1
            assert cf.month <= 12
            assert cf.projected_revenue >= 0
            assert cf.operating_expenses >= 0

    def test_concessional_scheme_structuring_mockup_values(self):
        result = DeterministicFinancialEngine.calculate_concessional_scheme_structuring(
            capital=100000.0,
            margin_percent=10.0,
            annual_interest_rate=8.0,
            tenure_years=7,
            moratorium_months=6,
            commercial_rate=12.5,
        )
        assert result.total_project_cost == 1000000.0
        assert result.concessional_debt == 900000.0
        assert result.grace_quarterly_installment == 18000.0
        assert round(result.active_eqi) == 44729
        assert round(result.total_concessional_interest) in [298962, 298965]
        assert round(result.total_outflow) in [1198962, 1198965]
        assert round(result.total_interest_savings) in [164631, 164634]
        assert len(result.schedule) == 28
        assert result.schedule[0].status == "Grace Moratorium"
        assert result.schedule[1].status == "Grace Moratorium"
        assert result.schedule[2].status == "Active EQI"
        assert result.schedule[9].label == "Y3-Q2"
        assert round(result.schedule[9].closing_balance) in [670583, 670584, 670585, 670586]
        assert round(result.schedule[9].interest_paid) == 14026
        assert result.schedule[-1].closing_balance == 0.0


class TestFeasibilityEngine:
    def test_calculate_feasibility(self):
        result = FeasibilityEngine.calculate_feasibility(
            capital=100000, business_idea="dairy",
            locality="Alwar", state="Rajasthan", demographics={}
        )
        assert isinstance(result, FeasibilityScoreBreakdown)
        assert 0 <= result.overall_score <= 100
        assert result.verdict in [RecommendationEnum.GO, RecommendationEnum.CONDITIONAL_GO, RecommendationEnum.RECONSIDER]
        assert len(result.verdict_explanation) > 0

    def test_calculate_feasibility_low_capital(self):
        result = FeasibilityEngine.calculate_feasibility(
            capital=10000, business_idea="general",
            locality="Mumbai", state="Maharashtra", demographics={}
        )
        assert result.capital_fit <= 95
        assert result.capital_fit >= 40

    def test_calculate_feasibility_high_capital(self):
        result = FeasibilityEngine.calculate_feasibility(
            capital=500000, business_idea="dairy",
            locality="Alwar", state="Rajasthan", demographics={}
        )
        assert result.overall_score >= 50

    def test_run_reverse_feasibility(self):
        recs = FeasibilityEngine.run_reverse_feasibility(100000, "Alwar", "Rajasthan")
        assert len(recs) == 3
        for r in recs:
            assert r.score > 0
            assert len(r.reason) > 0
            assert r.capital_fit in ["High", "Medium", "Low"]

    def test_run_reverse_feasibility_pratapnagar_financials(self):
        recs = FeasibilityEngine.run_reverse_feasibility(100000, "Pratapnagar", "Rajasthan")
        assert len(recs) == 3
        for r in recs:
            assert r.project_cost is not None and r.project_cost > 0
            assert r.bank_loan is not None and r.bank_loan > 0
            assert r.monthly_emi is not None and r.monthly_emi > 0
            assert 0 < r.own_contribution <= 100000.0
            assert r.subsidy_amount is not None and r.subsidy_amount >= 0
            assert r.expected_monthly_net_profit is not None and r.expected_monthly_net_profit > 0
            assert any("pratapnagar" in rs.lower() or "residents" in rs.lower() for rs in r.reason)


class TestLocationIntelligenceEngine:
    def test_analyze_pratapnagar(self):
        profile = LocationIntelligenceEngine.analyze_locality("Pratapnagar", "Rajasthan")
        assert isinstance(profile, LocationProfile)
        assert profile.locality == "Pratapnagar"
        assert profile.population == 65000
        assert profile.households == 13500
        assert len(profile.saturated_sectors) >= 2
        assert any("kirana" in s.sector.lower() for s in profile.saturated_sectors)
        assert len(profile.unmet_demand_gaps) >= 3
        assert any("dairy" in g.category.lower() or "milk" in g.business_type.lower() for g in profile.unmet_demand_gaps)

    def test_analyze_generic_locality(self):
        profile = LocationIntelligenceEngine.analyze_locality("Rampur", "Uttar Pradesh")
        assert isinstance(profile, LocationProfile)
        assert profile.population > 0
        assert profile.households > 0
        assert len(profile.saturated_sectors) > 0
        assert len(profile.unmet_demand_gaps) > 0


class TestSchemeEngine:
    def test_match_schemes_pmegp(self):
        schemes = SchemeEngine.match_schemes(450000, "dairy")
        assert len(schemes) >= 1
        pmegp = next((s for s in schemes if "PMEGP" in s.scheme_name), None)
        assert pmegp is not None
        assert pmegp.eligibility_status == "Eligible"
        assert pmegp.subsidy_percentage > 0

    def test_match_schemes_mudra(self):
        schemes = SchemeEngine.match_schemes(500000, "retail")
        mudra = next((s for s in schemes if "MUDRA" in s.scheme_name), None)
        assert mudra is not None
        assert mudra.eligibility_status == "Eligible"

    def test_match_schemes_special_category(self):
        schemes_general = SchemeEngine.match_schemes(450000, "dairy", SocialCategoryEnum.GENERAL, GenderEnum.MALE)
        schemes_special = SchemeEngine.match_schemes(450000, "dairy", SocialCategoryEnum.SC, GenderEnum.FEMALE)
        assert schemes_special[0].subsidy_percentage >= schemes_general[0].subsidy_percentage

    def test_match_schemes_high_cost_no_mudra(self):
        schemes = SchemeEngine.match_schemes(1000000, "manufacturing")
        mudra = next((s for s in schemes if "MUDRA" in s.scheme_name), None)
        assert mudra is None

    def test_official_schemes_data(self):
        assert len(OFFICIAL_SCHEMES) == 2
        ids = [s["id"] for s in OFFICIAL_SCHEMES]
        assert "pmegp" in ids
        assert "pm_mudra_kishore" in ids


class TestTimeMachineEngine:
    def test_analyze_timing_dairy(self):
        result = TimeMachineEngine.analyze_timing("dairy")
        assert isinstance(result, TimeMachineOutput)
        assert "March" in result.recommended_launch_window
        assert len(result.seasonal_risk_factors) > 0

    def test_analyze_timing_general(self):
        result = TimeMachineEngine.analyze_timing("retail shop")
        assert isinstance(result, TimeMachineOutput)
        assert len(result.recommended_prep_period) > 0
        assert len(result.expected_peak_period) > 0


class TestClusterEngine:
    def test_find_clusters(self):
        clusters = ClusterEngine.find_clusters("Alwar", "dairy")
        assert len(clusters) >= 1
        assert isinstance(clusters[0], ClusterOpportunity)
        assert clusters[0].nearby_nodes_count > 0
        assert len(clusters[0].complementary_businesses) > 0


class TestDPREngine:
    def test_generate_dpr(self):
        plan = DeterministicFinancialEngine.generate_financial_plan(100000, "dairy")
        evidence = EvidenceObject(
            user_inputs={"business_idea": "Dairy Unit", "locality": "Alwar", "state": "Rajasthan", "capital": 100000},
            financial_data=plan,
        )
        dpr = DPREngine.generate_29_section_dpr(evidence, "Test Entrepreneur")
        assert isinstance(dpr, DPRResponse)
        assert dpr.sections_count == 29
        assert "section_01_cover_page" in dpr.sections
        assert dpr.dpr_id.startswith("DPR-")

        # Verify all 29 sections are structured dicts with real data
        for i in range(1, 30):
            sec_key = [k for k in dpr.sections.keys() if k.startswith(f"section_{i:02d}")][0]
            assert isinstance(dpr.sections[sec_key], dict)
            assert len(dpr.sections[sec_key]) > 0

        # Verify key financial mappings
        assert dpr.sections["section_14_project_cost"]["total_project_cost"] == plan.project_cost
        assert dpr.sections["section_15_means_of_finance"]["bank_term_loan"] == plan.loan_requirement
        assert dpr.sections["section_22_loan_and_emi_details"]["monthly_emi"] == plan.monthly_emi
        assert len(dpr.sections["section_20_cash_flow"]["cashflow_schedule_12_months"]) == 12

    def test_generate_pdf_bytes(self):
        plan = DeterministicFinancialEngine.generate_financial_plan(100000, "dairy")
        evidence = EvidenceObject(
            user_inputs={"business_idea": "Dairy Unit", "locality": "Alwar", "state": "Rajasthan", "capital": 100000},
            financial_data=plan,
        )
        dpr = DPREngine.generate_29_section_dpr(evidence, "Ramesh Kumar")
        pdf_bytes = DPREngine.generate_pdf_bytes(dpr)
        assert isinstance(pdf_bytes, bytes)
        assert len(pdf_bytes) > 2000
        assert pdf_bytes.startswith(b"%PDF-")



class TestLifecycleEngine:
    def test_calculate_health_score_healthy(self):
        score = LifecycleEngine.calculate_health_score(60, 50000, 30000, True, True)
        assert 0 <= score <= 100
        assert score >= 70

    def test_calculate_health_score_critical(self):
        score = LifecycleEngine.calculate_health_score(60, 10000, 40000, False, False)
        assert score < 50

    def test_get_health_metrics(self):
        metrics = LifecycleEngine.get_health_metrics(50000, 30000, 5000, 100000)
        assert len(metrics) == 4
        for m in metrics:
            assert m.status in ["on_track", "warning", "critical"]

    def test_get_risk_alerts_no_revenue(self):
        alerts = LifecycleEngine.get_risk_alerts(0, 30000, 5000, 60)
        assert len(alerts) > 0
        assert any(a.severity == "critical" for a in alerts)

    def test_get_risk_alerts_healthy(self):
        alerts = LifecycleEngine.get_risk_alerts(80000, 30000, 5000, 60)
        assert len(alerts) == 0

    def test_get_milestone_status(self):
        milestones = LifecycleEngine.get_milestone_status(30)
        assert len(milestones) == 8
        completed = [m for m in milestones if m["status"] == "completed"]
        assert len(completed) >= 2

    def test_get_next_actions(self):
        actions = LifecycleEngine.get_next_actions(10, 80)
        assert len(actions) > 0
        assert any("registration" in a.lower() for a in actions)

    def test_assess_lifecycle(self):
        status = LifecycleEngine.assess_lifecycle(
            "BIZ-001", 45, 50000, 30000, 5000, 100000
        )
        assert isinstance(status, LifecycleStatus)
        assert status.business_id == "BIZ-001"
        assert status.days_since_launch == 45
        assert 0 <= status.health_score <= 100
        assert len(status.health_metrics) > 0
        assert len(status.milestone_status) > 0
        assert len(status.next_actions) > 0
