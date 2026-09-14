from typing import List, Dict, Any
from app.models.schemas import FeasibilityScoreBreakdown, RecommendationEnum, ReverseFeasibilityRecommendation

class FeasibilityEngine:
    @staticmethod
    def calculate_feasibility(capital: float, business_idea: str, locality: str, state: str, demographics: Dict[str, Any]) -> FeasibilityScoreBreakdown:
        capital_fit = min(int((capital / 75000.0) * 70), 95)
        capital_fit = max(capital_fit, 40)
        market_score = 84 if "alwar" in locality.lower() else 78
        competition_score = 72
        supply_score = 80 if any(k in business_idea.lower() for k in ["dairy", "food", "agri"]) else 74
        risk_score = 65
        scheme_fit = 88
        overall = int((capital_fit * 0.25) + (market_score * 0.20) + (competition_score * 0.15) + (supply_score * 0.15) + (scheme_fit * 0.15) + (risk_score * 0.10))
        verdict = RecommendationEnum.CONDITIONAL_GO if overall >= 60 else RecommendationEnum.RECONSIDER
        return FeasibilityScoreBreakdown(
            overall_score=overall,
            market_score=market_score,
            capital_fit=capital_fit,
            competition_score=competition_score,
            supply_score=supply_score,
            risk_score=risk_score,
            scheme_fit=scheme_fit,
            verdict=verdict,
            verdict_explanation="Strong capital fit and scheme backing. Maintain working capital liquidity during initial months.",
        )

    @staticmethod
    def run_reverse_feasibility(capital: float, locality: str, state: str) -> List[ReverseFeasibilityRecommendation]:
        return [
            ReverseFeasibilityRecommendation(
                business="Dairy Micro-Enterprise & Chilling Collection",
                category="Dairy & Animal Husbandry",
                score=86,
                capital_fit="High",
                market_fit="High",
                risk_level="Medium",
                reason=[f"High year-round local demand in {locality}.", "PMEGP 35% subsidy compatibility."],
            ),
            ReverseFeasibilityRecommendation(
                business="Agro-Produce & Spice Processing Unit",
                category="Food Processing (MoFPI)",
                score=81,
                capital_fit="High",
                market_fit="Medium-High",
                risk_level="Low-Medium",
                reason=["PMFME 35% credit-linked capital subsidy.", "Locally available raw materials."],
            ),
            ReverseFeasibilityRecommendation(
                business="Rural Solar Farm Equipment Rental Kiosk",
                category="Rural Renewable & Agri-Services",
                score=77,
                capital_fit="High",
                market_fit="High",
                risk_level="Low",
                reason=["High pay-per-use demand among local farmers.", "Low working capital requirement."],
            ),
        ]
