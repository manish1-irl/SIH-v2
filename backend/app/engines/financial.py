import math
from typing import List, Dict, Any, Optional
from app.models.schemas import FinancialPlan, ConcessionalLoanResponse, AmortizationQuarter

class DeterministicFinancialEngine:
    @staticmethod
    def calculate_project_cost(margin_capital: float, business_category: str = "general") -> float:
        multiplier = 4.0
        if "dairy" in business_category.lower():
            multiplier = 4.5
        elif "processing" in business_category.lower():
            multiplier = 5.0
        elif "retail" in business_category.lower():
            multiplier = 3.5
        return round(margin_capital * multiplier, 2)

    @staticmethod
    def calculate_emi(principal: float, annual_rate: float = 8.5, tenure_months: int = 60, moratorium_months: int = 6) -> float:
        if principal <= 0 or tenure_months <= 0:
            return 0.0
        effective_tenure = max(tenure_months - moratorium_months, 1)
        monthly_rate = (annual_rate / 100.0) / 12.0
        if monthly_rate == 0:
            return round(principal / effective_tenure, 2)
        emi = principal * (monthly_rate * math.pow(1 + monthly_rate, effective_tenure)) / (
            math.pow(1 + monthly_rate, effective_tenure) - 1
        )
        return round(emi, 2)

    @staticmethod
    def generate_financial_plan(capital: float, business_category: str = "general", annual_interest_rate: float = 8.5, tenure_months: int = 60, moratorium_months: int = 6) -> FinancialPlan:
        project_cost = DeterministicFinancialEngine.calculate_project_cost(capital, business_category)
        margin_contribution = round(capital, 2)
        loan_requirement = round(max(project_cost - margin_contribution, 0.0), 2)
        working_capital = round(project_cost * 0.25, 2)
        monthly_emi = DeterministicFinancialEngine.calculate_emi(loan_requirement, annual_interest_rate, tenure_months, moratorium_months)
        effective_tenure = max(tenure_months - moratorium_months, 1)
        total_repayment = round(monthly_emi * effective_tenure, 2)

        base_monthly_revenue = round(project_cost * 0.22, 2)
        base_monthly_opex = round(project_cost * 0.13, 2)
        cashflows: List[Dict[str, Any]] = []
        cumulative_net = -margin_contribution
        break_even_month = 7

        for m in range(1, 13):
            ramp = min(0.6 + (m * 0.04), 1.0)
            rev = round(base_monthly_revenue * ramp, 2)
            opex = round(base_monthly_opex * (0.85 + (m * 0.015)), 2)
            emi_cost = 0.0 if m <= moratorium_months else monthly_emi
            net = round(rev - opex - emi_cost, 2)
            cumulative_net += net
            if cumulative_net >= 0 and break_even_month == 7:
                break_even_month = m
            cashflows.append({
                "month": m,
                "projected_revenue": rev,
                "operating_expenses": opex,
                "emi": emi_cost,
                "net_profit": net,
                "moratorium_active": (m <= moratorium_months),
            })

        return FinancialPlan(
            project_cost=project_cost,
            margin_contribution=margin_contribution,
            loan_requirement=loan_requirement,
            interest_rate=annual_interest_rate,
            tenure_months=tenure_months,
            moratorium_months=moratorium_months,
            monthly_emi=monthly_emi,
            total_repayment=total_repayment,
            break_even_months=break_even_month,
            working_capital=working_capital,
            monthly_cashflow_projection=cashflows,
        )

    @staticmethod
    def calculate_concessional_scheme_structuring(
        capital: float = 100000.0,
        margin_percent: float = 10.0,
        annual_interest_rate: float = 8.0,
        tenure_years: int = 7,
        moratorium_months: int = 6,
        commercial_rate: float = 12.5,
        business_idea: Optional[str] = None,
        locality: Optional[str] = None,
    ) -> ConcessionalLoanResponse:
        # 1. Total Project Cost (P) & Concessional Debt (D)
        margin_ratio = max(margin_percent / 100.0, 0.01)
        total_project_cost = round(capital / margin_ratio, 2)
        concessional_debt = round(total_project_cost - capital, 2)

        # 2. Quarters calculation
        tenure_quarters = tenure_years * 4
        moratorium_quarters = max(int(round(moratorium_months / 3)), 0)
        active_quarters = max(tenure_quarters - moratorium_quarters, 1)

        # 3. Concessional rates
        quarterly_rate = (annual_interest_rate / 100.0) / 4.0
        grace_quarterly_installment = round(concessional_debt * quarterly_rate, 2)

        if quarterly_rate > 0:
            numerator = quarterly_rate * math.pow(1 + quarterly_rate, active_quarters)
            denominator = math.pow(1 + quarterly_rate, active_quarters) - 1
            active_eqi = round(concessional_debt * (numerator / denominator), 2)
        else:
            active_eqi = round(concessional_debt / active_quarters, 2)

        # 4. Generate Amortization Schedule
        schedule: List[AmortizationQuarter] = []
        balance = concessional_debt
        total_principal_repaid = 0.0
        total_concessional_interest = 0.0

        for q in range(1, tenure_quarters + 1):
            year = (q - 1) // 4 + 1
            quarter_in_year = (q - 1) % 4 + 1
            label = f"Y{year}-Q{quarter_in_year}"
            opening_balance = balance

            if q <= moratorium_quarters:
                status = "Grace Moratorium"
                interest_paid = round(opening_balance * quarterly_rate, 2)
                principal_repaid = 0.0
                installment = interest_paid
                closing_balance = opening_balance
            else:
                status = "Active EQI"
                interest_paid = round(opening_balance * quarterly_rate, 2)
                if q == tenure_quarters:
                    principal_repaid = round(opening_balance, 2)
                    installment = round(principal_repaid + interest_paid, 2)
                    closing_balance = 0.0
                else:
                    principal_repaid = round(min(opening_balance, active_eqi - interest_paid), 2)
                    installment = round(principal_repaid + interest_paid, 2)
                    closing_balance = round(max(opening_balance - principal_repaid, 0.0), 2)

            balance = closing_balance
            total_principal_repaid += principal_repaid
            total_concessional_interest += interest_paid

            schedule.append(
                AmortizationQuarter(
                    quarter=q,
                    label=label,
                    year=year,
                    quarter_of_year=quarter_in_year,
                    status=status,
                    opening_balance=opening_balance,
                    installment=installment,
                    principal_repaid=principal_repaid,
                    interest_paid=interest_paid,
                    closing_balance=closing_balance,
                )
            )

        total_principal_repaid = round(total_principal_repaid, 2)
        total_concessional_interest = round(total_concessional_interest, 2)
        total_outflow = round(total_principal_repaid + total_concessional_interest, 2)

        # 5. Commercial Benchmark Comparison (at commercial_rate, e.g. 12.5% p.a. standard 28-Qtr commercial term loan)
        comm_quarterly_rate = (commercial_rate / 100.0) / 4.0
        if comm_quarterly_rate > 0:
            comm_num = comm_quarterly_rate * math.pow(1 + comm_quarterly_rate, tenure_quarters)
            comm_den = math.pow(1 + comm_quarterly_rate, tenure_quarters) - 1
            comm_eqi = concessional_debt * (comm_num / comm_den)
            commercial_interest_cost = round((comm_eqi * tenure_quarters) - concessional_debt, 2)
        else:
            commercial_interest_cost = 0.0

        total_interest_savings = round(max(commercial_interest_cost - total_concessional_interest, 0.0), 2)
        savings_percent = round((total_interest_savings / commercial_interest_cost) * 100.0, 1) if commercial_interest_cost > 0 else 0.0

        idea_lower = (business_idea or "").lower()
        loc_display = (locality or "Local Cluster").strip().title()

        if any(k in idea_lower for k in ["oil", "mustard", "expeller", "sarson", "tel"]):
            scheme_category = "AGRI-INFRASTRUCTURE & MSME VALUE CHAIN"
            scheme_name = "Agri-Infra Fund (AIF) & PMEGP Agro-Processing Term Loan"
            scheme_description = f"Concessional financing tailored for Mustard Oil expeller, plate filter press & seed storage in {loc_display}."
            rules = "3% Interest Subvention (AIF) + 25% Rural PMEGP Subsidy"
            credit_guarantee = "100% CGTMSE Collateral-Free Guarantee"
        elif any(k in idea_lower for k in ["kirana", "retail", "grocery", "fmcg", "store", "shop"]):
            scheme_category = "RETAIL TRADE & MUDRA TARUN SCHEME"
            scheme_name = "PMMY MUDRA Tarun / PMEGP Retail Distribution Facility"
            scheme_description = f"Working capital & shop modernization credit for retail grocery inventory, POS systems & fixtures in {loc_display}."
            rules = "Collateral-free up to ₹20L under Mudra Tarun + CGTMSE coverage"
            credit_guarantee = "100% CGFMU Guarantee"
        elif any(k in idea_lower for k in ["tailor", "apparel", "garment", "cloth", "textile"]):
            scheme_category = "TEXTILES & RURAL SKILL ENTERPRISE"
            scheme_name = "PMEGP Apparel & Tailoring Mechanization Term Scheme"
            scheme_description = f"Financing for industrial sewing machines, cutting tables, fabric inventory in {loc_display}."
            rules = "25% Rural PMEGP Subsidy + 90% Bank Term Financing"
            credit_guarantee = "100% CGTMSE Collateral-Free Cover"
        elif any(k in idea_lower for k in ["flour", "atta", "chakki", "spice", "masala", "grain", "dal mill"]):
            scheme_category = "FOOD PROCESSING (PMFME & PMEGP)"
            scheme_name = "PMFME & PMEGP Grain/Spice Milling Concessional Credit"
            scheme_description = f"Subsidized financing for commercial chakki/pulverizer, grading screens & packaging in {loc_display}."
            rules = "35% PMFME Capital Subsidy (up to ₹10 Lakhs) + 3% Interest Subvention"
            credit_guarantee = "100% CGTMSE Guarantee"
        elif any(k in idea_lower for k in ["dairy", "milk", "cattle", "chilling", "animal"]):
            scheme_category = "DAIRY DEVELOPMENT (AHIDF / DIDF & PMEGP)"
            scheme_name = "AHIDF & PMEGP Dairy Infrastructure Concessional Loan"
            scheme_description = f"Established rural dairy aggregation, bulk milk cooling (BMC), and value-added processing in {loc_display}."
            rules = "₹1.40L < P ≤ ₹50.00L Priority Sector Lending Rule"
            credit_guarantee = "100% CGFMU/CGTMSE"
        else:
            title_name = business_idea.title() if business_idea else "Rural MSME"
            scheme_category = "MSME PRIORITY SECTOR TERM LOAN"
            scheme_name = f"PMEGP / MUDRA {title_name} Concessional Facility"
            scheme_description = f"Concessional credit for machinery, site setup, and working capital inventory in {loc_display}."
            rules = "25% Rural PMEGP Subsidy + 90% Concessional Bank Financing"
            credit_guarantee = "100% CGTMSE / CGFMU Guarantee"

        return ConcessionalLoanResponse(
            promoter_margin=capital,
            margin_percent=margin_percent,
            total_project_cost=total_project_cost,
            concessional_debt=concessional_debt,
            annual_interest_rate=annual_interest_rate,
            tenure_years=tenure_years,
            tenure_quarters=tenure_quarters,
            moratorium_months=moratorium_months,
            moratorium_quarters=moratorium_quarters,
            grace_quarterly_installment=grace_quarterly_installment,
            active_eqi=active_eqi,
            total_principal_repaid=total_principal_repaid,
            total_concessional_interest=total_concessional_interest,
            total_outflow=total_outflow,
            commercial_interest_cost=commercial_interest_cost,
            total_interest_savings=total_interest_savings,
            savings_percent=savings_percent,
            credit_guarantee=credit_guarantee,
            scheme_category=scheme_category,
            scheme_name=scheme_name,
            scheme_description=scheme_description,
            rules=rules,
            schedule=schedule,
        )
