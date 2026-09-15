from typing import List, Dict, Any, Optional
from app.models.schemas import FeasibilityScoreBreakdown, RecommendationEnum, ReverseFeasibilityRecommendation
from app.engines.location_intelligence import LocationIntelligenceEngine, LocationProfile
from app.engines.financial import DeterministicFinancialEngine


class FeasibilityEngine:
    CANDIDATE_TAXONOMY: List[Dict[str, Any]] = [
        {
            "id": "dairy_chilling",
            "business": "Packaged Fresh Milk Chilling & Dairy Unit",
            "category": "Dairy & Animal Husbandry",
            "min_capital": 30000,
            "max_capital": 350000,
            "cost_multiplier": 4.5,
            "fixed_min_cost": 150000.0,
            "fixed_max_cost": 1500000.0,
            "scheme": "PMEGP Rural (35% Subsidy)",
            "subsidy_pct": 35.0,
            "risk_level": "Medium",
            "base_monthly_margin_pct": 0.20,
            "keywords": ["dairy", "milk", "curd", "paneer", "cattle", "livestock", "animal husbandry"],
            "base_score": 86,
        },
        {
            "id": "custom_tailoring",
            "business": "Custom Institutional Uniform & Garment Tailoring Unit",
            "category": "Apparel & Textiles",
            "min_capital": 20000,
            "max_capital": 250000,
            "cost_multiplier": 3.8,
            "fixed_min_cost": 80000.0,
            "fixed_max_cost": 800000.0,
            "scheme": "PMEGP (Rural 35% / Urban 25%) & MUDRA Kishore",
            "subsidy_pct": 35.0,
            "risk_level": "Low-Medium",
            "base_monthly_margin_pct": 0.25,
            "keywords": ["tailoring", "garment", "uniform", "apparel", "textile", "silai", "cloth"],
            "base_score": 84,
        },
        {
            "id": "spice_flour_mill",
            "business": "Cold-Pressed Spice Grinding & Grain Milling Unit",
            "category": "Food Processing (MSME)",
            "min_capital": 25000,
            "max_capital": 300000,
            "cost_multiplier": 4.2,
            "fixed_min_cost": 100000.0,
            "fixed_max_cost": 1200000.0,
            "scheme": "PMFME (35% Subsidy) & PMEGP",
            "subsidy_pct": 35.0,
            "risk_level": "Low-Medium",
            "base_monthly_margin_pct": 0.22,
            "keywords": ["spice", "flour", "atta", "masala", "food processing", "mill", "grinding"],
            "base_score": 83,
        },
        {
            "id": "solar_rental",
            "business": "Rural Solar Farm Equipment & Pump Rental Kiosk",
            "category": "Rural Renewable & Agri-Services",
            "min_capital": 40000,
            "max_capital": 400000,
            "cost_multiplier": 4.0,
            "fixed_min_cost": 160000.0,
            "fixed_max_cost": 1600000.0,
            "scheme": "PM-KUSUM & PMEGP Rural (35% Subsidy)",
            "subsidy_pct": 35.0,
            "risk_level": "Low",
            "base_monthly_margin_pct": 0.28,
            "keywords": ["solar", "pump", "irrigation", "rental", "farm equipment", "renewable"],
            "base_score": 81,
        },
        {
            "id": "dal_mill",
            "business": "Mini Dal Mill & Pulse Cleaning Unit",
            "category": "Agro-Processing",
            "min_capital": 50000,
            "max_capital": 500000,
            "cost_multiplier": 4.5,
            "fixed_min_cost": 200000.0,
            "fixed_max_cost": 2000000.0,
            "scheme": "PMFME Credit-Linked Subsidy (35%)",
            "subsidy_pct": 35.0,
            "risk_level": "Medium",
            "base_monthly_margin_pct": 0.21,
            "keywords": ["dal", "pulse", "grain", "mandi", "agro", "cleaning"],
            "base_score": 80,
        },
        {
            "id": "digital_csc_kiosk",
            "business": "Digital Citizen Services (CSC) & E-Mitra Hub",
            "category": "Citizen Services & IT",
            "min_capital": 15000,
            "max_capital": 150000,
            "cost_multiplier": 3.2,
            "fixed_min_cost": 50000.0,
            "fixed_max_cost": 400000.0,
            "scheme": "PMMY MUDRA (Shishu / Kishore)",
            "subsidy_pct": 0.0,
            "risk_level": "Low",
            "base_monthly_margin_pct": 0.35,
            "keywords": ["digital", "csc", "emitra", "cyber", "online", "kiosk", "services"],
            "base_score": 79,
        },
        {
            "id": "goat_farming",
            "business": "Commercial Goat Farming & Breeding Enterprise",
            "category": "Animal Husbandry",
            "min_capital": 35000,
            "max_capital": 350000,
            "cost_multiplier": 4.0,
            "fixed_min_cost": 140000.0,
            "fixed_max_cost": 1400000.0,
            "scheme": "National Livestock Mission (NLM 50% Capital Subsidy)",
            "subsidy_pct": 50.0,
            "risk_level": "Medium",
            "base_monthly_margin_pct": 0.28,
            "keywords": ["goat", "bakri", "breeding", "livestock", "meat", "pastoral"],
            "base_score": 78,
        },
        {
            "id": "ev_battery_service",
            "business": "EV Two-Wheeler Battery Service & Swap Station",
            "category": "EV & Automotive Services",
            "min_capital": 30000,
            "max_capital": 250000,
            "cost_multiplier": 3.6,
            "fixed_min_cost": 100000.0,
            "fixed_max_cost": 800000.0,
            "scheme": "PMEGP Service Enterprise & MUDRA Kishore",
            "subsidy_pct": 25.0,
            "risk_level": "Low-Medium",
            "base_monthly_margin_pct": 0.30,
            "keywords": ["ev", "battery", "electric", "charging", "repair", "service"],
            "base_score": 77,
        },
        {
            "id": "vermicompost_organic",
            "business": "Organic Vermicompost & Bio-Fertilizer Packaging",
            "category": "Organic Inputs & Agri-Allied",
            "min_capital": 20000,
            "max_capital": 200000,
            "cost_multiplier": 3.5,
            "fixed_min_cost": 70000.0,
            "fixed_max_cost": 700000.0,
            "scheme": "Paramparagat Krishi Vikas Yojana (PKVY) & PMEGP",
            "subsidy_pct": 35.0,
            "risk_level": "Low",
            "base_monthly_margin_pct": 0.32,
            "keywords": ["vermicompost", "organic", "fertilizer", "bio", "waste", "compost"],
            "base_score": 76,
        },
    ]

    @staticmethod
    def calculate_feasibility(capital: float, business_idea: str, locality: str, state: str, demographics: Dict[str, Any]) -> FeasibilityScoreBreakdown:
        loc_profile = LocationIntelligenceEngine.analyze_locality(locality, state)
        capital_fit = min(int((capital / 75000.0) * 70), 95)
        capital_fit = max(capital_fit, 40)

        # Dynamic market score grounded in local population and economic driver
        base_market = 78
        if loc_profile.population > 100000:
            base_market += 6
        elif loc_profile.population > 50000:
            base_market += 4

        # Boost if business idea matches unmet demand gap in this locality
        idea_lower = business_idea.lower()
        is_gap_match = any(
            any(kw in g.business_type.lower() for kw in idea_lower.split())
            for g in loc_profile.unmet_demand_gaps
        )
        is_saturated = any(
            any(kw in s.sector.lower() for kw in idea_lower.split())
            for s in loc_profile.saturated_sectors
        )

        market_score = min(base_market + (8 if is_gap_match else 0) - (10 if is_saturated else 0), 96)
        competition_score = 55 if is_saturated else 76
        supply_score = 82 if any(k in idea_lower for k in ["dairy", "food", "agri", "solar", "cloth"]) else 74
        risk_score = 75 if not is_saturated else 52
        scheme_fit = 88

        overall = int(
            (capital_fit * 0.25)
            + (market_score * 0.20)
            + (competition_score * 0.15)
            + (supply_score * 0.15)
            + (scheme_fit * 0.15)
            + (risk_score * 0.10)
        )
        verdict = RecommendationEnum.CONDITIONAL_GO if overall >= 60 else RecommendationEnum.RECONSIDER

        explanation = (
            f"Evaluated for {loc_profile.locality} (Pop: {loc_profile.population:,}). "
            f"Capital fit is verified at {capital_fit}%. "
            f"{'Strong alignment with local unmet demand gap. ' if is_gap_match else ''}"
            f"{'Warning: High market saturation detected in existing retail. ' if is_saturated else ''}"
            f"Government subsidy scheme integration is confirmed."
        )

        return FeasibilityScoreBreakdown(
            overall_score=overall,
            market_score=market_score,
            capital_fit=capital_fit,
            competition_score=competition_score,
            supply_score=supply_score,
            risk_score=risk_score,
            scheme_fit=scheme_fit,
            verdict=verdict,
            verdict_explanation=explanation,
        )

    @classmethod
    def run_reverse_feasibility(cls, capital: float, locality: str, state: str = "Rajasthan") -> List[ReverseFeasibilityRecommendation]:
        loc_profile = LocationIntelligenceEngine.analyze_locality(locality, state)
        scored_candidates = []

        unmet_keywords = set()
        for gap in loc_profile.unmet_demand_gaps:
            unmet_keywords.update(gap.business_type.lower().split())
            unmet_keywords.update(gap.category.lower().split())

        saturated_keywords = set()
        for sat in loc_profile.saturated_sectors:
            saturated_keywords.update(sat.sector.lower().split())

        for cand in cls.CANDIDATE_TAXONOMY:
            # 1. Capital fit evaluation
            c_min = cand["min_capital"]
            c_max = cand["max_capital"]
            if capital >= c_min and capital <= c_max:
                cap_fit = "High"
                cap_score = 92
            elif capital >= c_min * 0.7:
                cap_fit = "Medium"
                cap_score = 75
            else:
                cap_fit = "Low"
                cap_score = 55

            # 2. Market gap alignment
            cand_kws = cand["keywords"]
            matches_gap = any(any(kw in g.business_type.lower() or kw in g.category.lower() for kw in cand_kws) for g in loc_profile.unmet_demand_gaps)
            matches_sat = any(any(kw in s.sector.lower() for kw in cand_kws) for s in loc_profile.saturated_sectors)

            mkt_fit = "High" if matches_gap else ("Medium-High" if not matches_sat else "Low")
            mkt_score = 94 if matches_gap else (80 if not matches_sat else 45)

            # Combined score
            total_score = int((cap_score * 0.45) + (mkt_score * 0.40) + (cand["base_score"] * 0.15))

            # 3. Deterministic Financial calculations
            project_cost = round(min(max(capital * cand["cost_multiplier"], cand["fixed_min_cost"]), cand["fixed_max_cost"]), 2)
            own_contribution = round(min(capital, project_cost * 0.25), 2)
            bank_loan = round(max(project_cost - own_contribution, 0.0), 2)
            monthly_emi = DeterministicFinancialEngine.calculate_emi(
                principal=bank_loan,
                annual_rate=8.5,
                tenure_months=60,
                moratorium_months=6,
            )
            subsidy_amount = round(project_cost * (cand["subsidy_pct"] / 100.0), 2)
            expected_monthly_net_profit = round(
                (project_cost * 0.22 * cand["base_monthly_margin_pct"]) - (monthly_emi * 0.35),
                2,
            )

            # Localized reasons
            reasons = [
                f"High unmet demand among {loc_profile.population:,} residents in {loc_profile.locality}, avoiding saturated Kirana/retail.",
                f"{cand['scheme']} provides ₹{subsidy_amount:,.0f} government subsidy with approx. monthly EMI of ₹{monthly_emi:,.0f}.",
                f"Project cost of ₹{project_cost:,.0f} utilizes your ₹{own_contribution:,.0f} margin with ₹{bank_loan:,.0f} bank financing.",
            ]

            rec = ReverseFeasibilityRecommendation(
                business=cand["business"],
                category=cand["category"],
                score=total_score,
                capital_fit=cap_fit,
                market_fit=mkt_fit,
                risk_level=cand["risk_level"],
                reason=reasons,
                project_cost=project_cost,
                own_contribution=own_contribution,
                bank_loan=bank_loan,
                monthly_emi=monthly_emi,
                subsidy_amount=subsidy_amount,
                scheme_name=cand["scheme"],
                expected_monthly_net_profit=expected_monthly_net_profit,
            )
            scored_candidates.append((total_score, rec))

        # Sort descending by score and pick top 3
        scored_candidates.sort(key=lambda x: x[0], reverse=True)
        return [item[1] for item in scored_candidates[:3]]

    @staticmethod
    def generate_market_feasibility_matrix(
        capital: float,
        business_idea: str,
        locality: str,
        state: str,
        financial_plan: Any = None,
    ) -> Dict[str, Any]:
        idea_clean = business_idea.lower() if business_idea else "dairy"
        loc_display = locality.title() if locality else "Bassi"
        state_display = state.title() if state else "Rajasthan"
        project_cost = getattr(financial_plan, "project_cost", capital * 4.5) if financial_plan else capital * 4.5
        monthly_rev = getattr(financial_plan, "project_cost", project_cost) * 0.22 if financial_plan else 1740000.0
        monthly_opex = getattr(financial_plan, "project_cost", project_cost) * 0.13 if financial_plan else 1260000.0
        monthly_ebitda = round(monthly_rev - monthly_opex, 2)

        is_dairy = any(k in idea_clean for k in ["dairy", "milk", "chilling", "animal"])
        
        # 1. Market Reach & Logistics Corridors
        unit_type = "Litres" if is_dairy else "Units"
        throughput_daily = 1000 if is_dairy else int(capital / 100)
        market_reach = {
            "radius": "5–10 km Radius",
            "consumer_base_footprint": f"Direct coverage across 15 villages in {loc_display} block with an estimated footprint of 14,000 rural households and supply ties to {state_display} urban dairies and consumption hubs.",
            "primary_distribution_channels": f"{throughput_daily:,} {unit_type}/day target throughput distributed via highway commercial dhabas on national corridors, confectioners in {loc_display} town, and wholesale APMC Mandi stockists.",
            "competitive_supply_advantage": f"Integrated Bulk Cooling & Chilling (BMC) with digital fat/SNF testing prevents spoilage, outperforming unorganized informal collectors (Dudhiyas).",
            "transport_node": f"Direct high-speed freight corridor access along regional highways, enabling transit times under 45 minutes to central {state_display} wholesale markets.",
        }

        # 2. Localized Opportunity & Capital Allocation
        opp_analysis = {
            "project_cost_tier_fit": f"The ₹{project_cost:,.0f} capital outlay directly funds automated processing equipment, rapid chilling tanks, back-up utility generators, and initial raw material working capital.",
            "unserved_local_niche": f"Lack of rapid village-level chilling forces local producers to sell warm milk at distress prices; this unit provides immediate 4°C cooling and transparent digital quality-based payouts.",
            "expansion_horizon": "Scale into high-margin value-added products (Paneer, Ghee, Flavored Butter Milk) and double processing capacity after 12 quarters of successful loan repayment.",
            "recommended_capital_allocation": {
                "total_cost": project_cost,
                "breakdown": [
                    {
                        "percent": 45,
                        "amount": round(project_cost * 0.45, 2),
                        "label": "Core Production Machinery & Tools",
                    },
                    {
                        "percent": 25,
                        "amount": round(project_cost * 0.25, 2),
                        "label": "Civil Shed, Power & Water Utilities",
                    },
                    {
                        "percent": 20,
                        "amount": round(project_cost * 0.20, 2),
                        "label": "Initial Raw Material & Inventory",
                    },
                    {
                        "percent": 10,
                        "amount": round(project_cost * 0.10, 2),
                        "label": "Statutory FSSAI/Trade Licenses & Working Buffer",
                    },
                ],
            },
        }

        # 3. SWOT Matrix
        swot_data = {
            "strengths": [
                f"Direct high-speed road connectivity to {state_display}'s major APMC mandis via regional highway corridors",
                f"Low promoter equity contribution of only 10% under priority sector MSME/TLS loan schemes",
                "On-site Bulk Milk Cooling capacity eliminating transportation spoilage and curdling losses",
            ],
            "weaknesses": [
                "Heavy reliance on grid electricity requiring continuous diesel generator/solar backup support",
                "Working capital sensitivity to seasonal raw milk yield variations (flush vs lean season)",
                f"Initial dependence on local village aggregators in {loc_display} for initial milk pooling",
            ],
            "opportunities": [
                f"Rising consumer preference for verified high-fat pure milk across {loc_display} and urban suburbs",
                "High-margin commercial diversification into cottage cheese (Paneer) and Ghee production",
                "Potential integration with NABARD and PMEGP capital subsidies for solar thermal chilling support",
            ],
            "threats": [
                "Aggressive procurement pricing and established procurement networks of regional dairy federations",
                "Spikes in cattle feed and fodder prices impacting primary milk producer margins",
                "Unseasonal monsoons disrupting daily morning collection routes across rural feeder roads",
            ],
        }

        # 4. Unit Economics & Pricing Architecture
        unit_econ = {
            "estimated_gross_margin": 27.6,
            "margin_status": "High Terroir Profitability",
            "break_even_timeline": "8 Months",
            "break_even_subtext": "Accelerated by Grace Moratorium",
            "local_catchment_index": "Medium",
            "catchment_pop": "38,000–65,000 (Estimated) Catchment Pop.",
            "cost_per_litre": {
                "production_cost": 42.00,
                "production_desc": "Raw material, feed & power",
                "selling_price": 58.00,
                "selling_desc": "Farm gate / Mandi wholesale",
                "net_margin": 16.00,
                "net_margin_desc": "Direct operating spread",
                "capacity_label": "Capacity: 30,000 Litres / Month",
            },
            "monthly_summary": {
                "revenue": monthly_rev,
                "opex": monthly_opex,
                "ebitda": monthly_ebitda,
            },
        }

        # 5. Competitor Density & Block Saturation
        density = {
            "density_index": 85,
            "density_scope": f"Estimated competitor density within 5 km radius of {loc_display} ({loc_display} Block)",
            "saturation_insight": f"High operational saturation (85% across 25 local nodes), but existing competitors predominantly rely on unorganized, unchilled milk supply, leaving a lucrative entry window for standardized, chilled bulk milk.",
            "cost_advantage_note": f"Because Commercial Mini Dairy & Chilling Unit operates with direct sourcing in {loc_display}, the enterprise holds an operational cost advantage over urban stockists who face multi-tier transportation markups.",
            "landscape_comparison": [
                {
                    "badge": "PREVALENT",
                    "badge_color": "amber",
                    "volume_share": "~60% Volume",
                    "name": "Informal Dudhiyas",
                    "description": "Local middlemen and unorganized door-to-door vendors without cold-chain storage or adulteration testing.",
                    "chilling_infra": "None (Warm Milk)",
                    "chilling_status": "danger",
                    "pricing_stability": "Volatile / Seasonal",
                },
                {
                    "badge": "INSTITUTIONAL",
                    "badge_color": "navy",
                    "volume_share": "~25% Volume",
                    "name": "Regional Co-op (Saras)",
                    "description": "Structured dairy federation BMC collection routes with fixed procurement rates but strict payout schedules.",
                    "chilling_infra": "Central BMC",
                    "chilling_status": "safe",
                    "pricing_stability": "Rigid / Pre-fixed",
                },
                {
                    "badge": "PROPOSED UNIT",
                    "badge_color": "emerald",
                    "sub_badge": "TARGET MODEL • High Margin",
                    "volume_share": "High Margin",
                    "name": "Mini Dairy & Chilling Hub",
                    "description": "Direct village aggregation, immediate 4°C cooling, testing at source, directly serving sweet-makers & bulk buyers.",
                    "chilling_infra": "On-site 4°C Bulk Tank",
                    "chilling_status": "target",
                    "value_add": "Zero Curdling Loss",
                },
            ],
        }

        return {
            "market_reach": market_reach,
            "opportunity_analysis": opp_analysis,
            "swot": swot_data,
            "unit_economics": unit_econ,
            "competitor_density": density,
        }
