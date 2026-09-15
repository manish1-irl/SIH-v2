import math
from typing import List, Dict, Any
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
            credit_guarantee="100% CGFMU/CGTMSE",
            scheme_category="TERM LOAN CATEGORY",
            scheme_name="Term Loan Concessional Scheme (TLS)",
            scheme_description="Established rural micro/small enterprises, agri-processors, dairy clusters, mechanization units",
            rules="₹1.40L < P ≤ ₹50.00L Rule",
            schedule=schedule,
        )
