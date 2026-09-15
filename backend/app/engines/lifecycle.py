from typing import List, Dict, Any
import uuid
from datetime import datetime, timezone
from app.models.schemas import (
    LifecycleStatus, HealthMetric, RiskAlert
)


class LifecycleEngine:
    MILESTONES = [
        {"day": 0, "title": "Business Registration & DPR Approval"},
        {"day": 15, "title": "Bank Loan Disbursement Application"},
        {"day": 30, "title": "Infrastructure Setup Complete"},
        {"day": 45, "title": "First Revenue Transaction"},
        {"day": 60, "title": "Working Capital Cycle Stabilized"},
        {"day": 90, "title": "First Quarterly Review"},
        {"day": 180, "title": "Break-Even Target"},
        {"day": 365, "title": "Annual Compliance & Renewal"},
    ]

    @staticmethod
    def calculate_health_score(
        days_since_launch: int,
        monthly_revenue: float = 0.0,
        monthly_expenses: float = 0.0,
        loan_emi_paid: bool = True,
        scheme_compliance: bool = True,
    ) -> int:
        score = 50
        if monthly_revenue > 0:
            profit_margin = (monthly_revenue - monthly_expenses) / monthly_revenue if monthly_revenue > 0 else 0
            if profit_margin > 0.2:
                score += 20
            elif profit_margin > 0:
                score += 10
            elif profit_margin > -0.1:
                score -= 5
            else:
                score -= 15
        if loan_emi_paid:
            score += 15
        else:
            score -= 20
        if scheme_compliance:
            score += 10
        else:
            score -= 10
        if days_since_launch > 90:
            score += 5
        return max(0, min(100, score))

    @staticmethod
    def get_health_metrics(
        monthly_revenue: float,
        monthly_expenses: float,
        emi: float,
        working_capital: float,
    ) -> List[HealthMetric]:
        profit_margin = ((monthly_revenue - monthly_expenses) / monthly_revenue * 100) if monthly_revenue > 0 else 0
        return [
            HealthMetric(
                metric_name="Profit Margin",
                current_value=round(profit_margin, 1),
                target_value=20.0,
                unit="%",
                status="on_track" if profit_margin >= 15 else ("warning" if profit_margin >= 5 else "critical"),
            ),
            HealthMetric(
                metric_name="Monthly Revenue",
                current_value=monthly_revenue,
                target_value=monthly_expenses * 1.3,
                unit="INR",
                status="on_track" if monthly_revenue > monthly_expenses else "warning",
            ),
            HealthMetric(
                metric_name="EMI Coverage Ratio",
                current_value=round(monthly_revenue / emi, 2) if emi > 0 else 0,
                target_value=2.0,
                unit="x",
                status="on_track" if monthly_revenue > emi * 2 else ("warning" if monthly_revenue > emi else "critical"),
            ),
            HealthMetric(
                metric_name="Working Capital Runway",
                current_value=round(working_capital / monthly_expenses, 1) if monthly_expenses > 0 else 0,
                target_value=3.0,
                unit="months",
                status="on_track" if working_capital > monthly_expenses * 2 else "warning",
            ),
        ]

    @staticmethod
    def get_risk_alerts(
        monthly_revenue: float,
        monthly_expenses: float,
        emi: float,
        days_since_launch: int,
    ) -> List[RiskAlert]:
        alerts = []
        now = datetime.now(timezone.utc).isoformat()
        if monthly_revenue < monthly_expenses and days_since_launch > 30:
            alerts.append(RiskAlert(
                alert_id=f"ALERT-{uuid.uuid4().hex[:8].upper()}",
                severity="high",
                category="Revenue",
                message="Monthly revenue is below operating expenses for more than 30 days.",
                recommended_action="Review pricing strategy and cost optimization. Consider pivoting product mix.",
                triggered_at=now,
            ))
        if emi > 0 and monthly_revenue < emi:
            alerts.append(RiskAlert(
                alert_id=f"ALERT-{uuid.uuid4().hex[:8].upper()}",
                severity="critical",
                category="Loan Repayment",
                message="Revenue insufficient to cover EMI payments.",
                recommended_action="Contact bank for moratorium extension. Explore MUDRA restructuring options.",
                triggered_at=now,
            ))
        if days_since_launch > 45 and monthly_revenue == 0:
            alerts.append(RiskAlert(
                alert_id=f"ALERT-{uuid.uuid4().hex[:8].upper()}",
                severity="critical",
                category="Revenue",
                message="No revenue recorded after 45 days of launch.",
                recommended_action="Immediate market reassessment. Consult advisor for pivot strategy.",
                triggered_at=now,
            ))
        return alerts

    @staticmethod
    def get_milestone_status(days_since_launch: int) -> List[Dict[str, Any]]:
        status = []
        for m in LifecycleEngine.MILESTONES:
            if days_since_launch >= m["day"]:
                status.append({
                    "day": m["day"],
                    "title": m["title"],
                    "status": "completed",
                })
            elif days_since_launch >= m["day"] - 7:
                status.append({
                    "day": m["day"],
                    "title": m["title"],
                    "status": "upcoming",
                })
            else:
                status.append({
                    "day": m["day"],
                    "title": m["title"],
                    "status": "pending",
                })
        return status

    @staticmethod
    def get_next_actions(
        days_since_launch: int,
        health_score: int,
    ) -> List[str]:
        actions = []
        if days_since_launch < 15:
            actions.append("Complete business registration and DPR submission to bank.")
            actions.append("Apply for PMEGP/MUDRA scheme subsidy.")
        elif days_since_launch < 30:
            actions.append("Follow up on bank loan sanction status.")
            actions.append("Set up basic infrastructure and procure equipment.")
        elif days_since_launch < 60:
            actions.append("Begin operations and track daily revenue.")
            actions.append("Maintain proper bookkeeping for scheme compliance.")
        elif days_since_launch < 90:
            actions.append("Prepare first monthly review report.")
            actions.append("Evaluate working capital needs and adjust operations.")
        else:
            actions.append("Prepare quarterly compliance report.")
            actions.append("Evaluate expansion opportunities in cluster network.")
        if health_score < 50:
            actions.append("URGENT: Schedule advisor consultation for business restructuring.")
        return actions

    @staticmethod
    def assess_lifecycle(
        business_id: str,
        days_since_launch: int,
        monthly_revenue: float = 0.0,
        monthly_expenses: float = 0.0,
        emi: float = 0.0,
        working_capital: float = 0.0,
        loan_emi_paid: bool = True,
        scheme_compliance: bool = True,
    ) -> LifecycleStatus:
        health_score = LifecycleEngine.calculate_health_score(
            days_since_launch, monthly_revenue, monthly_expenses,
            loan_emi_paid, scheme_compliance,
        )
        health_metrics = LifecycleEngine.get_health_metrics(
            monthly_revenue, monthly_expenses, emi, working_capital,
        )
        risk_alerts = LifecycleEngine.get_risk_alerts(
            monthly_revenue, monthly_expenses, emi, days_since_launch,
        )
        milestone_status = LifecycleEngine.get_milestone_status(days_since_launch)
        next_actions = LifecycleEngine.get_next_actions(days_since_launch, health_score)
        return LifecycleStatus(
            business_id=business_id,
            days_since_launch=days_since_launch,
            health_score=health_score,
            health_metrics=health_metrics,
            risk_alerts=risk_alerts,
            milestone_status=milestone_status,
            next_actions=next_actions,
        )
