import math
from typing import List, Dict, Any
from app.models.schemas import FinancialPlan

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
