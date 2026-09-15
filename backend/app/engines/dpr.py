import math
from datetime import datetime, timezone
from io import BytesIO
from typing import Dict, Any, List, Optional

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether

from app.models.schemas import EvidenceObject, DPRResponse


def _to_dict(obj: Any) -> Dict[str, Any]:
    if hasattr(obj, "model_dump"):
        return obj.model_dump()
    if hasattr(obj, "dict"):
        return obj.dict()
    if isinstance(obj, dict):
        return obj
    return vars(obj) if hasattr(obj, "__dict__") else {}


class DPREngine:
    @staticmethod
    def generate_29_section_dpr(evidence: EvidenceObject, applicant_name: str = "Entrepreneur") -> DPRResponse:
        f = evidence.financial_data
        inputs = evidence.user_inputs or {}
        feasibility = _to_dict(evidence.feasibility_scores) if evidence.feasibility_scores else {}
        timing = _to_dict(evidence.time_machine) if evidence.time_machine else {}
        schemes = [_to_dict(s) for s in (evidence.scheme_data or [])]
        clusters = [_to_dict(c) for c in (evidence.cluster_data or [])]
        sources = [_to_dict(src) for src in (evidence.sources or [])]

        locality = str(inputs.get("locality", "Local Area"))
        state = str(inputs.get("state", "India"))
        business_idea = str(inputs.get("business_idea", "Micro-Enterprise"))
        capital = float(inputs.get("capital", f.margin_contribution if f else 100000.0))
        project_cost = float(f.project_cost if f else capital * 4.0)
        loan_amount = float(f.loan_requirement if f else max(project_cost - capital, 0.0))
        margin_contrib = float(f.margin_contribution if f else capital)
        working_capital = float(f.working_capital if f else project_cost * 0.25)
        monthly_emi = float(f.monthly_emi if f else 0.0)
        tenure_months = int(f.tenure_months if f else 60)
        moratorium_months = int(f.moratorium_months if f else 6)
        break_even_month = int(f.break_even_months if f else 7)
        
        raw_cashflows = f.monthly_cashflow_projection if f else []
        cashflows = [_to_dict(m) for m in raw_cashflows]

        target_scheme = schemes[0].get("scheme_name", "PMEGP / MUDRA") if schemes else "PMEGP / MUDRA"
        s01 = {
            "title": f"Detailed Project Report (DPR) for {business_idea}",
            "project_name": business_idea,
            "applicant_name": applicant_name,
            "location": f"{locality}, {state}",
            "project_cost": project_cost,
            "margin_contribution": margin_contrib,
            "loan_amount": loan_amount,
            "target_scheme": target_scheme,
            "submission_purpose": "Bank Appraisal & Government Scheme Credit Support",
            "date": datetime.now(timezone.utc).strftime("%B %Y"),
        }

        # 2. Applicant Profile
        s02 = {
            "applicant_name": applicant_name,
            "age": inputs.get("user_age", "Not specified"),
            "gender": str(inputs.get("gender", "General")),
            "social_category": str(inputs.get("social_category", "General")),
            "education": str(inputs.get("education", "Higher Secondary / Graduate")),
            "prior_experience": f"{inputs.get('experience_years', 0)} years relevant industry/trade experience",
            "existing_enterprise": bool(inputs.get("existing_business", False)),
            "asset_availability": str(inputs.get("asset_availability", "Adequate work shed / commercial premises")),
            "role": "Proprietor & Managing Operator",
        }

        # 3. Executive Summary
        verdict_obj = feasibility.get("verdict", "Go")
        verdict = verdict_obj.value if hasattr(verdict_obj, "value") else str(verdict_obj)
        overall_score = feasibility.get("overall_score", 78)
        s03 = {
            "summary": (
                f"Proposal to establish a viable {business_idea} at {locality}, {state} with total capital outlay "
                f"of INR {project_cost:,.0f}. The promoter contributes INR {margin_contrib:,.0f} as margin, "
                f"with a term/working capital loan requirement of INR {loan_amount:,.0f}."
            ),
            "feasibility_verdict": verdict,
            "overall_score": overall_score,
            "payback_period_months": break_even_month + 6,
            "direct_employment": "3 to 5 full-time local positions",
        }

        # 4. Business Description
        s04 = {
            "enterprise_name": f"{applicant_name} {business_idea} Unit",
            "industry_sector": business_idea,
            "category": "Micro, Small & Medium Enterprise (MSME)",
            "operational_scope": f"Manufacturing, processing, and direct local retail/wholesale supply in {locality}.",
            "usp": "Locally grounded production, short supply turnaround, competitive unit pricing, and zero middleman markup.",
        }

        # 5. Objectives
        base_monthly_rev = cashflows[-1]["projected_revenue"] if cashflows else project_cost * 0.22
        s05 = {
            "short_term_objective": f"Successfully complete commercial trial runs and achieve cash break-even by Month {break_even_month}.",
            "medium_term_objective": f"Attain stabilized monthly sales exceeding INR {base_monthly_rev:,.0f} and 85%+ capacity utilization within Year 1.",
            "long_term_vision": "Scale production, add value-added product lines, and integrate into regional supplier clusters.",
        }

        # 6. Location Analysis
        s06 = {
            "locality": locality,
            "state": state,
            "location_advantages": [
                f"Proximity to primary consumer and commercial base in {locality}",
                "Reliable grid connectivity and road network access",
                "Abundant local raw material and labor availability within immediate vicinity",
            ],
            "infrastructure_score": 80,
            "connectivity_rating": "High",
        }

        # 7. Market Analysis
        market_score = feasibility.get("market_score", 75)
        demand_score = feasibility.get("supply_score", 80)
        comp_score = feasibility.get("competition_score", 70)
        s07 = {
            "market_score": f"{market_score}/100",
            "demand_index": f"{demand_score}/100",
            "competition_index": f"{comp_score}/100",
            "target_segments": [
                "Local household consumers in surrounding villages and towns",
                "Retail merchants, weekly haats, and local commercial establishments",
                "Semi-urban institutional or bulk buyers",
            ],
            "demand_outlook": "High sustainable domestic demand supported by rising rural purchasing power.",
        }

        # 8. Product / Service Description
        s08 = {
            "primary_offerings": [
                f"Standard Grade {business_idea} Output",
                f"Value-Added / Custom Packaged {business_idea} Products",
            ],
            "pricing_policy": "Cost-plus competitive pricing benchmarked against prevailing local mandi and market rates.",
            "quality_assurance": "Standardized processing, clean grading, and tamper-evident hygienic packaging.",
        }

        # 9. Operations Plan
        cluster_names = [c.get("business_name", "") for c in clusters if c.get("business_name")] if clusters else ["Local transport providers", "Packaging vendors"]
        s09 = {
            "operating_cycle_days": 30,
            "workflow": "Raw Material Procurement -> Quality Check -> Processing / Value Addition -> Packaging -> Dispatch & Sales",
            "working_hours": "8 hours/day, 26 working days/month",
            "cluster_synergies": cluster_names,
            "maintenance_schedule": "Weekly equipment servicing and monthly comprehensive safety audit",
        }

        # 10. Infrastructure Requirements
        s10 = {
            "covered_area_sqft": 600,
            "premises_status": inputs.get("asset_availability", "Commercial / Industrial Rental Shed"),
            "connected_load_kw": "3.5 kW Single/Three Phase Commercial Connection",
            "water_requirements": "Continuous municipal/borewell potable supply with 2,000L storage capacity",
            "waste_management": "Eco-friendly zero-liquid discharge and organic waste composting",
        }

        # 11. Machinery / Equipment
        machinery_cost = round(project_cost * 0.55, 2)
        s11 = {
            "total_machinery_expenditure": machinery_cost,
            "machinery_breakdown": [
                {"item": f"{business_idea} Primary Processing Machine", "qty": 1, "estimated_cost": round(machinery_cost * 0.65, 2)},
                {"item": "Auxiliary Tools, Power Backup & Fixtures", "qty": 1, "estimated_cost": round(machinery_cost * 0.20, 2)},
                {"item": "Electronic Weighing & Packaging Unit", "qty": 1, "estimated_cost": round(machinery_cost * 0.15, 2)},
            ],
            "procurement_mode": "Reputed Indian OEMs with minimum 1-year on-site warranty",
        }

        # 12. Raw Material Requirements
        monthly_raw_material = round(project_cost * 0.08, 2)
        s12 = {
            "primary_inputs": f"Agricultural and commercial grade raw ingredients for {business_idea}",
            "monthly_expenditure": monthly_raw_material,
            "sourcing_channel": f"Direct farm gate, local mandis, and wholesale aggregators in {locality}",
            "lead_time_days": 2,
            "safety_inventory_days": 15,
        }

        # 13. Human Resource Requirements
        monthly_payroll = round(project_cost * 0.05, 2)
        s13 = {
            "total_headcount": 3,
            "monthly_payroll": monthly_payroll,
            "personnel_structure": [
                {"designation": "Proprietor / General Manager", "count": 1, "monthly_compensation": round(monthly_payroll * 0.50, 2)},
                {"designation": "Skilled Machine Operator", "count": 1, "monthly_compensation": round(monthly_payroll * 0.30, 2)},
                {"designation": "Helper / Packing Assistant", "count": 1, "monthly_compensation": round(monthly_payroll * 0.20, 2)},
            ],
        }

        # 14. Project Cost
        fixed_assets = round(project_cost * 0.70, 2)
        pre_op = round(project_cost * 0.05, 2)
        s14 = {
            "total_project_cost": project_cost,
            "plant_and_machinery": machinery_cost,
            "infrastructure_and_civil_works": round(fixed_assets - machinery_cost, 2),
            "pre_operative_expenses": pre_op,
            "working_capital_margin": working_capital,
        }

        # 15. Means of Finance
        subsidy_est = schemes[0].get("subsidy_amount", round(project_cost * 0.25, 2)) if schemes else round(project_cost * 0.25, 2)
        s15 = {
            "promoter_margin_contribution": margin_contrib,
            "margin_percentage": round((margin_contrib / max(project_cost, 1)) * 100, 1),
            "bank_term_loan": loan_amount,
            "bank_loan_percentage": round((loan_amount / max(project_cost, 1)) * 100, 1),
            "eligible_government_subsidy": subsidy_est,
            "total_means_of_finance": project_cost,
        }

        # 16. Working Capital
        s16 = {
            "total_working_capital_requirement": working_capital,
            "raw_material_stock_days": 20,
            "finished_goods_holding_days": 7,
            "trade_receivables_days": 15,
            "contingency_cash_buffer": round(working_capital * 0.25, 2),
        }

        # 17. Revenue Projection
        annual_gross_revenue = round(sum(m["projected_revenue"] for m in cashflows), 2) if cashflows else round(project_cost * 2.2, 2)
        s17 = {
            "annual_projected_revenue": annual_gross_revenue,
            "month_1_revenue": cashflows[0]["projected_revenue"] if cashflows else round(project_cost * 0.13, 2),
            "month_6_revenue": cashflows[5]["projected_revenue"] if len(cashflows) >= 6 else round(project_cost * 0.18, 2),
            "month_12_revenue": cashflows[-1]["projected_revenue"] if cashflows else round(project_cost * 0.22, 2),
            "average_monthly_revenue": round(annual_gross_revenue / 12, 2),
        }

        # 18. Expense Projection
        annual_opex = round(sum(m["operating_expenses"] for m in cashflows), 2) if cashflows else round(project_cost * 1.3, 2)
        s18 = {
            "annual_operating_expenses": annual_opex,
            "cost_distribution": {
                "raw_materials": "58%",
                "labor_and_wages": "22%",
                "power_fuel_utilities": "10%",
                "admin_and_marketing": "10%",
            },
            "average_monthly_opex": round(annual_opex / 12, 2),
        }

        # 19. Profit & Loss Projection
        annual_debt_service = round(sum(m["emi"] for m in cashflows), 2) if cashflows else round(monthly_emi * 6, 2)
        annual_net_profit = round(sum(m["net_profit"] for m in cashflows), 2) if cashflows else round(annual_gross_revenue - annual_opex - annual_debt_service, 2)
        net_margin = round((annual_net_profit / max(annual_gross_revenue, 1)) * 100, 1)
        s19 = {
            "gross_revenue": annual_gross_revenue,
            "total_operating_expenses": annual_opex,
            "operating_profit_ebitda": round(annual_gross_revenue - annual_opex, 2),
            "debt_service_interest_emi": annual_debt_service,
            "net_profit_before_tax": annual_net_profit,
            "net_profit_margin_percent": f"{net_margin}%",
        }

        # 20. Cash Flow
        s20 = {
            "cashflow_schedule_12_months": cashflows,
            "closing_cash_surplus_year_1": annual_net_profit,
            "debt_service_coverage_ratio": "1.85 (Robust bank repayment capability)",
        }

        # 21. Break-even Analysis
        s21 = {
            "break_even_month": break_even_month,
            "break_even_capacity_percent": 52.0,
            "monthly_fixed_costs": round(project_cost * 0.045, 2),
            "variable_cost_ratio": 0.65,
            "assessment": f"Operations transition to steady monthly profitability from Month {break_even_month} onwards.",
        }

        # 22. Loan / EMI Details
        interest_rate = float(f.interest_rate if f else 8.5)
        total_repayment = float(f.total_repayment if f else monthly_emi * (tenure_months - moratorium_months))
        s22 = {
            "loan_amount": loan_amount,
            "annual_interest_rate_percent": interest_rate,
            "tenure_months": tenure_months,
            "moratorium_months": moratorium_months,
            "monthly_emi": monthly_emi,
            "total_repayment": total_repayment,
            "total_interest_payable": round(max(total_repayment - loan_amount, 0.0), 2),
        }

        # 23. Government Scheme Alignment
        rec_scheme = schemes[0].get("scheme_name", "PMEGP (Prime Minister's Employment Generation Programme)") if schemes else "PMEGP (Prime Minister's Employment Generation Programme)"
        subsidy_pct = schemes[0].get("subsidy_percentage", 25) if schemes else 25
        nodal = schemes[0].get("ministry") or schemes[0].get("nodal_agency") or "KVIC / KVIB / District Industries Centre (DIC)" if schemes else "KVIC / KVIB / District Industries Centre (DIC)"
        docs = schemes[0].get("documents_required", []) if schemes else [
            "Aadhaar Card & PAN Card",
            "Detailed Project Report (this document)",
            "Rural Area Certificate / Address Proof",
            "Caste / Category Certificate (if claiming special subsidy)",
            "Quotation for Machinery from OEM vendors",
        ]
        s23 = {
            "recommended_scheme": rec_scheme,
            "subsidy_amount": subsidy_est,
            "subsidy_percentage": f"{subsidy_pct}%",
            "nodal_agency": nodal,
            "eligible_schemes_list": schemes,
            "mandatory_documents": docs,
        }

        # 24. Risk Analysis
        risk_score = feasibility.get("risk_score", 75)
        s24 = {
            "risk_score": f"{risk_score}/100",
            "key_risks": [
                {"risk_factor": "Raw Material Price Volatility", "probability": "Medium", "impact": "Moderate"},
                {"risk_factor": "Working Capital Delay", "probability": "Low", "impact": "Moderate"},
                {"risk_factor": "Seasonal Demand Variations", "probability": "Medium", "impact": "Low"},
            ],
        }

        # 25. Mitigation Plan
        s25 = {
            "mitigation_measures": [
                {"risk": "Raw Material Volatility", "measure": "Long-term procurement agreements with regional growers/mandis."},
                {"risk": "Working Capital Delay", "measure": f"Deploying ₹{working_capital:,.0f} reserve fund and strict 15-day trade credit limits."},
                {"risk": "Seasonal Demand Variations", "measure": "Product diversification into counter-cyclical processed goods."},
            ],
        }

        # 26. Implementation Timeline
        launch_window = timing.get("best_launch_window", "Optimal seasonal window (Months 3-5)") if timing else "Optimal seasonal window (Months 3-5)"
        s26 = {
            "recommended_launch_window": launch_window,
            "project_milestones": [
                {"period": "Month 1", "activity": "Udyam registration, statutory NOCs & formal Bank loan application"},
                {"period": "Month 2", "activity": "Bank appraisal, loan sanction & industrial premises lease finalization"},
                {"period": "Month 3", "activity": "Procurement of plant and machinery, civil fit-out & power connection"},
                {"period": "Month 4", "activity": "Machinery installation, trial runs & initial raw material stocking"},
                {"period": "Month 5", "activity": "Commercial production launch & distribution to initial retail clients"},
                {"period": "Month 6+", "activity": "Attaining break-even & scaling production to full utilization"},
            ],
        }

        # 27. Sustainability Plan
        s27 = {
            "financial_sustainability": "Reinvestment of 25% of annual net profit into working capital reserves and maintenance.",
            "social_and_community_impact": f"Creating sustainable local employment in {locality} and reducing outward migration.",
            "ecological_compliance": "Compliance with SPCB green category micro-enterprise guidelines.",
        }

        # 28. Conclusion
        s28 = {
            "bankability_verdict": f"Highly Bankable & Economically Viable ({verdict})",
            "recommendation": (
                f"The proposed {business_idea} at {locality} is commercially viable, shows strong promoter commitment "
                f"with INR {margin_contrib:,.0f} equity, manageable debt service (EMI ₹{monthly_emi:,.0f}), and qualifies "
                f"for significant capital subsidy under government schemes."
            ),
        }

        # 29. Data Sources and Assumptions
        s29 = {
            "financial_assumptions": [
                f"Interest rate calculated at benchmark rate of {interest_rate}% per annum.",
                f"Moratorium period of {moratorium_months} months granted for principal repayment.",
                "Tax rates applied as per MSME presumptive taxation guidelines under Section 44AD.",
            ],
            "verified_data_sources": sources if sources else [
                {"source": "Ministry of MSME, Govt of India", "description": "PMEGP and Udyam operational guidelines"},
                {"source": "Reserve Bank of India (RBI)", "description": "Priority Sector Lending (PSL) norms for micro-units"},
                {"source": "District Industries Centre (DIC)", "description": "Local district industrial profile and cluster data"},
            ],
        }

        sections: Dict[str, Any] = {
            "section_01_cover_page": s01,
            "section_02_applicant_profile": s02,
            "section_03_executive_summary": s03,
            "section_04_business_description": s04,
            "section_05_objectives": s05,
            "section_06_location_analysis": s06,
            "section_07_market_analysis": s07,
            "section_08_product_service_description": s08,
            "section_09_operations_plan": s09,
            "section_10_infrastructure_requirements": s10,
            "section_11_machinery_equipment": s11,
            "section_12_raw_material_requirements": s12,
            "section_13_human_resource_requirements": s13,
            "section_14_project_cost": s14,
            "section_15_means_of_finance": s15,
            "section_16_working_capital": s16,
            "section_17_revenue_projection": s17,
            "section_18_expense_projection": s18,
            "section_19_profit_and_loss_projection": s19,
            "section_20_cash_flow": s20,
            "section_21_break_even_analysis": s21,
            "section_22_loan_and_emi_details": s22,
            "section_23_government_scheme_alignment": s23,
            "section_24_risk_analysis": s24,
            "section_25_mitigation_plan": s25,
            "section_26_implementation_timeline": s26,
            "section_27_sustainability_plan": s27,
            "section_28_conclusion": s28,
            "section_29_data_sources_and_assumptions": s29,
        }

        dpr_id = f"DPR-{locality[:3].upper()}-{int(project_cost)}"
        return DPRResponse(
            dpr_id=dpr_id,
            business_name=business_idea,
            sections_count=29,
            sections=sections,
            pdf_download_url=f"/api/v1/advisor/dpr/download-pdf?dpr_id={dpr_id}",
        )

    @staticmethod
    def generate_pdf_bytes(dpr: DPRResponse) -> bytes:
        """
        Generates a professional, multi-page, bankable Detailed Project Report PDF
        using ReportLab.
        """
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36,
        )

        styles = getSampleStyleSheet()
        primary_color = colors.HexColor("#1E3A8A")
        secondary_color = colors.HexColor("#0D9488")
        text_color = colors.HexColor("#1E293B")
        bg_light = colors.HexColor("#F8FAFC")

        title_style = ParagraphStyle(
            "DPRTitle",
            parent=styles["Title"],
            fontSize=22,
            leading=26,
            textColor=primary_color,
            alignment=1,
            spaceAfter=12,
        )
        subtitle_style = ParagraphStyle(
            "DPRSubtitle",
            parent=styles["Normal"],
            fontSize=12,
            leading=16,
            textColor=secondary_color,
            alignment=1,
            spaceAfter=20,
        )
        h1_style = ParagraphStyle(
            "DPRHeading1",
            parent=styles["Heading1"],
            fontSize=13,
            leading=17,
            textColor=primary_color,
            spaceBefore=12,
            spaceAfter=6,
            keepWithNext=True,
        )
        body_style = ParagraphStyle(
            "DPRBody",
            parent=styles["Normal"],
            fontSize=9,
            leading=13,
            textColor=text_color,
            spaceAfter=4,
        )
        bold_label = ParagraphStyle(
            "DPRBold",
            parent=body_style,
            fontName="Helvetica-Bold",
        )

        story = []
        sec = dpr.sections

        # --- Cover Page ---
        s01 = sec.get("section_01_cover_page", {})
        story.append(Spacer(1, 40))
        story.append(Paragraph("DETAILED PROJECT REPORT (DPR)", title_style))
        story.append(Paragraph(f"PROPOSAL FOR {dpr.business_name.upper()}", subtitle_style))
        story.append(Spacer(1, 20))

        cover_table_data = [
            [Paragraph("<b>Enterprise Name:</b>", body_style), Paragraph(str(dpr.business_name), body_style)],
            [Paragraph("<b>Applicant / Promoter:</b>", body_style), Paragraph(str(s01.get("applicant_name", "Entrepreneur")), body_style)],
            [Paragraph("<b>Project Location:</b>", body_style), Paragraph(str(s01.get("location", "India")), body_style)],
            [Paragraph("<b>Total Project Outlay:</b>", body_style), Paragraph(f"₹{float(s01.get('project_cost', 0)):,.2f}", body_style)],
            [Paragraph("<b>Promoter Margin:</b>", body_style), Paragraph(f"₹{float(s01.get('margin_contribution', 0)):,.2f}", body_style)],
            [Paragraph("<b>Bank Loan Requirement:</b>", body_style), Paragraph(f"₹{float(s01.get('loan_amount', 0)):,.2f}", body_style)],
            [Paragraph("<b>Aligned Government Scheme:</b>", body_style), Paragraph(str(s01.get("target_scheme", "PMEGP / MUDRA")), body_style)],
            [Paragraph("<b>Report Identifier:</b>", body_style), Paragraph(str(dpr.dpr_id), body_style)],
            [Paragraph("<b>Date of Appraisal:</b>", body_style), Paragraph(str(s01.get("date", "2026")), body_style)],
        ]
        t_cover = Table(cover_table_data, colWidths=[160, 340])
        t_cover.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), bg_light),
            ("BOX", (0, 0), (-1, -1), 1, primary_color),
            ("INNERGRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("PADDING", (0, 0), (-1, -1), 6),
        ]))
        story.append(t_cover)
        story.append(Spacer(1, 30))
        story.append(Paragraph("<i>Prepared in compliance with RBI MSME Lending Guidelines & National Subsidy Framework</i>", subtitle_style))
        story.append(PageBreak())

        # --- Section 2 & 3: Applicant Profile & Executive Summary ---
        s02 = sec.get("section_02_applicant_profile", {})
        story.append(Paragraph("1. Applicant & Enterprise Profile", h1_style))
        app_table_data = [
            [Paragraph("<b>Promoter Name</b>", body_style), Paragraph(str(s02.get("applicant_name")), body_style),
             Paragraph("<b>Social Category</b>", body_style), Paragraph(str(s02.get("social_category")), body_style)],
            [Paragraph("<b>Age</b>", body_style), Paragraph(str(s02.get("age")), body_style),
             Paragraph("<b>Gender</b>", body_style), Paragraph(str(s02.get("gender")), body_style)],
            [Paragraph("<b>Education</b>", body_style), Paragraph(str(s02.get("education")), body_style),
             Paragraph("<b>Experience</b>", body_style), Paragraph(str(s02.get("prior_experience")), body_style)],
            [Paragraph("<b>Premises Status</b>", body_style), Paragraph(str(s02.get("asset_availability")), body_style),
             Paragraph("<b>Proposed Role</b>", body_style), Paragraph(str(s02.get("role")), body_style)],
        ]
        t_app = Table(app_table_data, colWidths=[100, 150, 100, 150])
        t_app.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("PADDING", (0, 0), (-1, -1), 5),
        ]))
        story.append(t_app)

        s03 = sec.get("section_03_executive_summary", {})
        story.append(Paragraph("2. Executive Summary", h1_style))
        story.append(Paragraph(str(s03.get("summary")), body_style))
        story.append(Paragraph(f"<b>Feasibility Verdict:</b> {s03.get('feasibility_verdict')} (Composite Score: {s03.get('overall_score')}/100)", body_style))
        story.append(Paragraph(f"<b>Payback Period:</b> {s03.get('payback_period_months')} Months | <b>Employment Potential:</b> {s03.get('direct_employment')}", body_style))
        story.append(Spacer(1, 10))

        # --- Section 14 & 15: Project Cost & Means of Finance ---
        s14 = sec.get("section_14_project_cost", {})
        s15 = sec.get("section_15_means_of_finance", {})
        story.append(Paragraph("3. Project Cost & Means of Finance", h1_style))
        cost_fin_data = [
            [Paragraph("<b>Particulars (Expenditure)</b>", bold_label), Paragraph("<b>Amount (₹)</b>", bold_label),
             Paragraph("<b>Means of Finance</b>", bold_label), Paragraph("<b>Amount (₹)</b>", bold_label)],
            [Paragraph("Plant & Machinery", body_style), Paragraph(f"₹{float(s14.get('plant_and_machinery', 0)):,.2f}", body_style),
             Paragraph("Promoter Margin", body_style), Paragraph(f"₹{float(s15.get('promoter_margin_contribution', 0)):,.2f} ({s15.get('margin_percentage')}%)", body_style)],
            [Paragraph("Infrastructure / Civil Works", body_style), Paragraph(f"₹{float(s14.get('infrastructure_and_civil_works', 0)):,.2f}", body_style),
             Paragraph("Bank Term Loan", body_style), Paragraph(f"₹{float(s15.get('bank_term_loan', 0)):,.2f} ({s15.get('bank_loan_percentage')}%)", body_style)],
            [Paragraph("Pre-operative Expenses", body_style), Paragraph(f"₹{float(s14.get('pre_operative_expenses', 0)):,.2f}", body_style),
             Paragraph("Eligible Govt Subsidy", body_style), Paragraph(f"₹{float(s15.get('eligible_government_subsidy', 0)):,.2f}", body_style)],
            [Paragraph("Working Capital Margin", body_style), Paragraph(f"₹{float(s14.get('working_capital_margin', 0)):,.2f}", body_style),
             Paragraph("<b>Total Finance</b>", bold_label), Paragraph(f"<b>₹{float(s15.get('total_means_of_finance', 0)):,.2f}</b>", bold_label)],
            [Paragraph("<b>Total Project Cost</b>", bold_label), Paragraph(f"<b>₹{float(s14.get('total_project_cost', 0)):,.2f}</b>", bold_label),
             Paragraph("-", body_style), Paragraph("-", body_style)],
        ]
        t_cf = Table(cost_fin_data, colWidths=[150, 100, 150, 100])
        t_cf.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), primary_color),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("PADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(t_cf)
        story.append(Spacer(1, 10))

        # --- Section 20: 12-Month Cashflow Projection Table ---
        s20 = sec.get("section_20_cash_flow", {})
        cflows = s20.get("cashflow_schedule_12_months", [])
        if cflows:
            story.append(Paragraph("4. 12-Month Projected Cash Flow & Debt Repayment Schedule", h1_style))
            cf_table = [
                [Paragraph("<b>Mo</b>", body_style), Paragraph("<b>Revenue (₹)</b>", body_style),
                 Paragraph("<b>OPEX (₹)</b>", body_style), Paragraph("<b>EMI (₹)</b>", body_style),
                 Paragraph("<b>Net Profit (₹)</b>", body_style), Paragraph("<b>Moratorium</b>", body_style)]
            ]
            for m in cflows[:12]:
                cf_table.append([
                    Paragraph(str(m.get("month", "")), body_style),
                    Paragraph(f"₹{float(m.get('projected_revenue', 0)):,.0f}", body_style),
                    Paragraph(f"₹{float(m.get('operating_expenses', 0)):,.0f}", body_style),
                    Paragraph(f"₹{float(m.get('emi', 0)):,.0f}", body_style),
                    Paragraph(f"₹{float(m.get('net_profit', 0)):,.0f}", body_style),
                    Paragraph("Yes" if m.get("moratorium_active") else "No", body_style),
                ])
            t_cash = Table(cf_table, colWidths=[35, 95, 95, 85, 100, 90])
            t_cash.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), secondary_color),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("PADDING", (0, 0), (-1, -1), 3),
            ]))
            story.append(t_cash)
            story.append(Spacer(1, 10))

        # --- Section 22 & 23: Loan Details & Government Scheme ---
        s22 = sec.get("section_22_loan_and_emi_details", {})
        s23 = sec.get("section_23_government_scheme_alignment", {})
        story.append(Paragraph("5. Debt Service & Government Subsidy Alignment", h1_style))
        loan_scheme_data = [
            [Paragraph("<b>Loan Principal Amount</b>", body_style), Paragraph(f"₹{float(s22.get('loan_amount', 0)):,.2f}", body_style),
             Paragraph("<b>Target Scheme</b>", body_style), Paragraph(str(s23.get("recommended_scheme")), body_style)],
            [Paragraph("<b>Interest Rate (% p.a.)</b>", body_style), Paragraph(f"{s22.get('annual_interest_rate_percent')}%", body_style),
             Paragraph("<b>Expected Subsidy</b>", body_style), Paragraph(f"₹{float(s23.get('subsidy_amount', 0)):,.2f} ({s23.get('subsidy_percentage')})", body_style)],
            [Paragraph("<b>Tenure (Months)</b>", body_style), Paragraph(f"{s22.get('tenure_months')} Months", body_style),
             Paragraph("<b>Nodal Agency</b>", body_style), Paragraph(str(s23.get("nodal_agency")), body_style)],
            [Paragraph("<b>Principal Moratorium</b>", body_style), Paragraph(f"{s22.get('moratorium_months')} Months", body_style),
             Paragraph("<b>Total Interest Payable</b>", body_style), Paragraph(f"₹{float(s22.get('total_interest_payable', 0)):,.2f}", body_style)],
            [Paragraph("<b>Monthly Installment (EMI)</b>", bold_label), Paragraph(f"<b>₹{float(s22.get('monthly_emi', 0)):,.2f}</b>", bold_label),
             Paragraph("<b>Total Repayment</b>", bold_label), Paragraph(f"<b>₹{float(s22.get('total_repayment', 0)):,.2f}</b>", bold_label)],
        ]
        t_ls = Table(loan_scheme_data, colWidths=[130, 120, 120, 130])
        t_ls.setStyle(TableStyle([
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ("PADDING", (0, 0), (-1, -1), 4),
        ]))
        story.append(t_ls)
        story.append(Spacer(1, 10))

        # --- Section 24, 25, 28: Risk, Mitigation & Conclusion ---
        s24 = sec.get("section_24_risk_analysis", {})
        s25 = sec.get("section_25_mitigation_plan", {})
        s28 = sec.get("section_28_conclusion", {})
        story.append(Paragraph("6. Risk Assessment & Bank Appraisal Conclusion", h1_style))
        story.append(Paragraph(f"<b>Composite Risk Score:</b> {s24.get('risk_score')}", body_style))
        story.append(Paragraph("<b>Appraisal Verdict:</b> " + str(s28.get("bankability_verdict")), body_style))
        story.append(Paragraph(str(s28.get("recommendation")), body_style))
        story.append(Spacer(1, 15))

        # Sign-off block
        sign_data = [
            [Paragraph("<b>Signature of Promoter:</b>", body_style), Paragraph("<b>Appraising Bank Officer / Branch Manager:</b>", body_style)],
            [Spacer(1, 20), Spacer(1, 20)],
            [Paragraph(f"({s01.get('applicant_name', 'Promoter')})", body_style), Paragraph("Branch Seal & Date", body_style)],
        ]
        t_sign = Table(sign_data, colWidths=[250, 250])
        t_sign.setStyle(TableStyle([
            ("LINEBELOW", (0, 0), (0, 1), 0.5, primary_color),
            ("LINEBELOW", (1, 0), (1, 1), 0.5, primary_color),
        ]))
        story.append(t_sign)

        doc.build(story)
        pdf_data = buffer.getvalue()
        buffer.close()
        return pdf_data

