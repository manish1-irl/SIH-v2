from app.models.schemas import TimeMachineOutput

class TimeMachineEngine:
    @staticmethod
    def analyze_timing(business_category: str, moratorium_months: int = 6) -> TimeMachineOutput:
        cat = business_category.lower()
        if "dairy" in cat:
            return TimeMachineOutput(
                recommended_prep_period="January - February",
                recommended_launch_window="March",
                expected_peak_period="April - July",
                cashflow_warning_period="July - August",
                seasonal_risk_factors=["Summer dry fodder inflation", "Monsoon humidity veterinary expenses"],
            )
        return TimeMachineOutput(
            recommended_prep_period="1-2 months before festive peak",
            recommended_launch_window="Post-harvest (September - October)",
            expected_peak_period="October - March",
            cashflow_warning_period="Month 6-8 (Moratorium expiry)",
            seasonal_risk_factors=["Rural liquidity fluctuation outside harvest cycles"],
        )
