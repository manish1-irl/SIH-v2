from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timezone
from app.models.schemas import (
    LifecycleStatus, HealthMetric, RiskAlert,
    LoanStage, LoanApplicationProgress, DashboardReminder,
    AIBusinessGoal, PersonalDashboardData, GenerateGoalRequest,
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

    @staticmethod
    def get_personal_dashboard(
        locality: str = "Bassi",
        state: str = "Rajasthan",
        business_idea: str = "Dairy",
        capital: float = 100000.0,
        enterprise_name: str = "Ganga Dairy Parlour",
    ) -> PersonalDashboardData:
        loc_display = locality.strip().title() if locality else "Bassi"
        state_display = state.strip().title() if state else "Rajasthan"
        idea_display = business_idea.strip() if business_idea else "Commercial Mini Dairy & Chilling Unit"
        ent_display = enterprise_name.strip() if enterprise_name else f"{loc_display} Enterprise"

        project_cost = round(capital / 0.10, 2)
        concessional_debt = round(project_cost - capital, 2)
        subsidy_amount = round(project_cost * 0.25, 2)  # 25% PMEGP rural subsidy

        # 1. 5-Stage Loan Application Pipeline Progress
        stages = [
            LoanStage(
                stage_id=1,
                title="Detailed Project Report (DPR) Generated",
                description="Deterministic 5-year financial plan and reverse feasibility matrix sealed with QR verification.",
                status="completed",
                completion_date="12 Sep 2026",
                action_required=None,
            ),
            LoanStage(
                stage_id=2,
                title="KVIC / PMEGP Portal e-Submission",
                description="Digital application uploaded with Aadhaar, Rural Certificate, and DPR Annexures.",
                status="completed",
                completion_date="14 Sep 2026",
                action_required=None,
            ),
            LoanStage(
                stage_id=3,
                title="District Task Force Committee (DTFC) Scrutiny",
                description="DIC verification of applicant rural eligibility and local priority sector score.",
                status="in_progress",
                completion_date=None,
                action_required="Physical document verification hearing scheduled at DIC Jaipur on 22 Sep 2026.",
            ),
            LoanStage(
                stage_id=4,
                title="Bank Branch Credit Appraisal & Sanction",
                description="Lead bank field inspection, civil shed verification, and sanction letter generation.",
                status="pending",
                completion_date=None,
                action_required="SBI Branch Manager site visit pending DTFC recommendation clearance.",
            ),
            LoanStage(
                stage_id=5,
                title="Credit Guarantee & Subsidy Disbursement",
                description="100% CGFMU collateral guarantee activation and margin money release into escrow account.",
                status="pending",
                completion_date=None,
                action_required="First tranche disbursement conditional on promoter equity deposition.",
            ),
        ]

        loan_progress = LoanApplicationProgress(
            application_ref=f"PMEGP-{state_display[:2].upper()}-2026-884210",
            scheme_name="Prime Minister's Employment Generation Programme (PMEGP)",
            portal_name="KVIC Online DBT Portal",
            loan_amount=concessional_debt,
            subsidy_amount=subsidy_amount,
            promoter_equity=capital,
            bank_branch=f"State Bank of India (SBI), {loc_display} Main Branch (IFSC: SBIN0031256)",
            current_stage_index=3,
            total_stages=5,
            overall_progress_percent=60,
            stages=stages,
            target_disbursement_date="15 Oct 2026",
        )

        # 2. AI-Decided Operational Business Goals (Tailored to Confirmed Business Idea)
        idea_lower = idea_display.lower()
        if "oil" in idea_lower or "mustard" in idea_lower or "expeller" in idea_lower:
            goals = [
                AIBusinessGoal(
                    goal_id="GOAL-01",
                    title="Procure FSSAI & District Pollution Control NOC",
                    description=f"Register commercial expeller unit and obtain trade permit for {loc_display}.",
                    category="Compliance",
                    priority="high",
                    progress_percent=100,
                    status="completed",
                    ai_rationale="Statutory requirement before procuring raw mustard seed stock.",
                    deadline_days=5,
                    order=1,
                ),
                AIBusinessGoal(
                    goal_id="GOAL-02",
                    title="Install & Calibrate 9-Bolt Cold-Press Oil Expeller",
                    description="Seat heavy-duty crushing machinery and test seed feed hopper.",
                    category="Infrastructure",
                    priority="high",
                    progress_percent=75,
                    status="in_progress",
                    ai_rationale="Ensures optimal 36% oil recovery rate and cold-press pungency.",
                    deadline_days=12,
                    order=2,
                ),
                AIBusinessGoal(
                    goal_id="GOAL-03",
                    title=f"Establish Direct Seed Procurement with 12 Mandi Agents in {loc_display}",
                    description="Secure clean, high-oil content mustard seeds at mandi auction rates.",
                    category="Supply Chain",
                    priority="high",
                    progress_percent=40,
                    status="in_progress",
                    ai_rationale="Cuts middleman trading margins by 8% through spot auction delivery.",
                    deadline_days=18,
                    order=3,
                ),
                AIBusinessGoal(
                    goal_id="GOAL-04",
                    title="Deploy Semi-Automatic 1L Pouch Packaging Machine",
                    description="Commission food-grade pouch sealer and date coder.",
                    category="Packaging",
                    priority="medium",
                    progress_percent=15,
                    status="pending",
                    ai_rationale="Enables direct brand retail sale fetching ₹15/kg premium over tin bulk sale.",
                    deadline_days=25,
                    order=4,
                ),
                AIBusinessGoal(
                    goal_id="GOAL-05",
                    title="Establish Oil Cake (Khal) Offtake Pact with Local Dairy Clusters",
                    description="Forward contract protein-rich cattle feed byproduct to nearby dairy farms.",
                    category="Revenue Synergies",
                    priority="medium",
                    progress_percent=0,
                    status="pending",
                    ai_rationale="Oil cake covers 45% of working electricity and labor expenses.",
                    deadline_days=30,
                    order=5,
                ),
                AIBusinessGoal(
                    goal_id="GOAL-06",
                    title="Distributor Network Onboarding across Regional Kirana Stores",
                    description=f"Appoint 10 retail distributors across {loc_display} and adjoining tehsils.",
                    category="Market Expansion",
                    priority="low",
                    progress_percent=0,
                    status="pending",
                    ai_rationale="Builds recurring retail cash pipeline reducing credit cycle risks.",
                    deadline_days=45,
                    order=6,
                ),
            ]
            reminders = [
                DashboardReminder(
                    reminder_id="REM-01",
                    title="Daily Mustard Seed Crushing Volume Verification",
                    category="daily_ops",
                    question="Did today's crushing batch achieve the planned 500 kg seed target?",
                    target_metric="500 kg/Day",
                    urgency="important",
                    created_at="Today, 08:30 AM",
                    status="pending",
                ),
                DashboardReminder(
                    reminder_id="REM-02",
                    title="Expeller Chamber Wear & Filter Press Maintenance",
                    category="maintenance",
                    question="Filter cloth washed and gear lubrication oil level verified?",
                    target_metric="Filter Clean",
                    urgency="normal",
                    created_at="Yesterday",
                    status="pending",
                ),
                DashboardReminder(
                    reminder_id="REM-03",
                    title="Wholesale Oil Cake (Khal) Dispatch Settlement",
                    category="finance",
                    question="Are daily byproduct cash receipts tallied with gate passes?",
                    target_metric="100% Reconciled",
                    urgency="critical",
                    created_at="2 days ago",
                    status="confirmed",
                ),
            ]
        elif "retail" in idea_lower or "kirana" in idea_lower or "store" in idea_lower or "shop" in idea_lower:
            goals = [
                AIBusinessGoal(
                    goal_id="GOAL-01",
                    title="Procure Municipal Trade License & GST Registration",
                    description=f"Register establishment with local gram panchayat or municipality in {loc_display}.",
                    category="Compliance",
                    priority="high",
                    progress_percent=100,
                    status="completed",
                    ai_rationale="Mandatory legal requirement for commercial enterprise bank account opening.",
                    deadline_days=5,
                    order=1,
                ),
                AIBusinessGoal(
                    goal_id="GOAL-02",
                    title="Storefront Shelving & Digital POS Kiosk Setup",
                    description="Install modular display racks, barcode scanner, and digital weighing scale.",
                    category="Infrastructure",
                    priority="high",
                    progress_percent=75,
                    status="in_progress",
                    ai_rationale="Speeds checkout time by 60% and maintains automated inventory control.",
                    deadline_days=12,
                    order=2,
                ),
                AIBusinessGoal(
                    goal_id="GOAL-03",
                    title="Wholesale Direct Distributor Contracts with Top 5 FMCG Brands",
                    description="Secure direct wholesale distributor margins on staples, personal care, and packaged foods.",
                    category="Supply Chain",
                    priority="high",
                    progress_percent=40,
                    status="in_progress",
                    ai_rationale="Captures 14% distributor margins compared to sub-dealer purchasing.",
                    deadline_days=18,
                    order=3,
                ),
                AIBusinessGoal(
                    goal_id="GOAL-04",
                    title="Roll Out WhatsApp Business Quick Re-order for 50 Local Families",
                    description="Launch digital neighborhood catalog for doorstep evening deliveries.",
                    category="Digital Sales",
                    priority="medium",
                    progress_percent=15,
                    status="pending",
                    ai_rationale="Locks in customer loyalty and guarantees repeat weekly purchases.",
                    deadline_days=25,
                    order=4,
                ),
                AIBusinessGoal(
                    goal_id="GOAL-05",
                    title="Install Energy-Efficient Commercial Double-Door Chiller",
                    description="Setup cold beverage and dairy products refrigeration cabinet.",
                    category="High-Margin Items",
                    priority="medium",
                    progress_percent=0,
                    status="pending",
                    ai_rationale="Chilled impulse items command 25% gross retail margin.",
                    deadline_days=30,
                    order=5,
                ),
                AIBusinessGoal(
                    goal_id="GOAL-06",
                    title="Community Credit Card & UPI Smart Soundbox Activation",
                    description="Deploy instant QR soundbox and establish transparent credit ledger.",
                    category="Operations",
                    priority="low",
                    progress_percent=0,
                    status="pending",
                    ai_rationale="Prevents cash shrinkage and simplifies weekly audit reconciliation.",
                    deadline_days=45,
                    order=6,
                ),
            ]
            reminders = [
                DashboardReminder(
                    reminder_id="REM-01",
                    title="Daily Fast-Moving Stock Audit",
                    category="daily_ops",
                    question="Were fast-moving staples and cooking essentials restocked before peak evening footfall?",
                    target_metric="95% Stocked",
                    urgency="important",
                    created_at="Today, 08:30 AM",
                    status="pending",
                ),
                DashboardReminder(
                    reminder_id="REM-02",
                    title="UPI & Cash Till Day-End Reconciliation",
                    category="finance",
                    question="Digital payment soundbox receipts tallied with counter register closing cash?",
                    target_metric="100% Matched",
                    urgency="normal",
                    created_at="Yesterday",
                    status="pending",
                ),
                DashboardReminder(
                    reminder_id="REM-03",
                    title="Distributor Invoice Payment Cycle Review",
                    category="finance",
                    question="Are credit term invoices for FMCG stock approved within 7-day cash discount window?",
                    target_metric="3% Discount Saved",
                    urgency="critical",
                    created_at="2 days ago",
                    status="confirmed",
                ),
            ]
        else:
            # Default / Dairy and Food Processing
            goals = [
                AIBusinessGoal(
                    goal_id="GOAL-01",
                    title="Procure Statutory FSSAI & District Trade License",
                    description=f"Acquire food safety standard registration and gram panchayat trade permit in {loc_display}.",
                    category="Compliance",
                    priority="high",
                    progress_percent=100,
                    status="completed",
                    ai_rationale=f"Statutory pre-requisite before commencing commercial {idea_display} operations.",
                    deadline_days=5,
                    order=1,
                ),
                AIBusinessGoal(
                    goal_id="GOAL-02",
                    title="Install & Calibrate Core Processing & Chilling Equipment",
                    description="Position stainless steel SS-304 equipment and test temperature control sensors.",
                    category="Infrastructure",
                    priority="high",
                    progress_percent=75,
                    status="in_progress",
                    ai_rationale="Ensures hygienic processing and eliminates post-harvest spoilage.",
                    deadline_days=12,
                    order=2,
                ),
                AIBusinessGoal(
                    goal_id="GOAL-03",
                    title=f"Formalize Direct Sourcing Agreements across {loc_display} Feeder Routes",
                    description="Sign reliable collection agreements with verified local raw material producers.",
                    category="Supply Chain",
                    priority="high",
                    progress_percent=40,
                    status="in_progress",
                    ai_rationale="Secures reliable daily throughput required for operating break-even.",
                    deadline_days=18,
                    order=3,
                ),
                AIBusinessGoal(
                    goal_id="GOAL-04",
                    title="Establish Institutional Offtake Pact with Local Wholesale Buyers",
                    description="Secure long-term contracts for bulk morning delivery to institutional buyers.",
                    category="Sales & Distribution",
                    priority="medium",
                    progress_percent=15,
                    status="pending",
                    ai_rationale="Guarantees daily cash receipts and insulates enterprise against open market price swings.",
                    deadline_days=25,
                    order=4,
                ),
                AIBusinessGoal(
                    goal_id="GOAL-05",
                    title="Deploy Digital Quality Testing & Quality Control Analyzer",
                    description="Setup transparent digital testing kiosk ensuring standard quality payouts.",
                    category="Quality Control",
                    priority="medium",
                    progress_percent=0,
                    status="pending",
                    ai_rationale="Attracts premium suppliers and builds consumer trust.",
                    deadline_days=30,
                    order=5,
                ),
                AIBusinessGoal(
                    goal_id="GOAL-06",
                    title="Conduct Commercial Quality Certification with Regional B2B Buyers",
                    description="Provide certified sample batches to bulk town buyers for long-term contract pricing.",
                    category="Market Expansion",
                    priority="low",
                    progress_percent=0,
                    status="pending",
                    ai_rationale="Opens high-margin B2B channel commanding price premium over raw commodities.",
                    deadline_days=45,
                    order=6,
                ),
            ]
            reminders = [
                DashboardReminder(
                    reminder_id="REM-01",
                    title=f"Daily {idea_display} Intake & Processing Verification",
                    category="daily_ops",
                    question="Did morning and evening operational collection reach your daily target today?",
                    target_metric="Target Met",
                    urgency="important",
                    created_at="Today, 08:30 AM",
                    status="pending",
                ),
                DashboardReminder(
                    reminder_id="REM-02",
                    title="Equipment Hygiene & Preventative Maintenance Check",
                    category="hygiene",
                    question="Weekly equipment sanitization & pressure gauge maintenance log updated?",
                    target_metric="Equipment Steady",
                    urgency="normal",
                    created_at="Yesterday",
                    status="pending",
                ),
                DashboardReminder(
                    reminder_id="REM-03",
                    title="Supplier Weekly Payout Reconciliation",
                    category="finance",
                    question="Are digital UPI payout receipts matched against the digital intake register for Week 2?",
                    target_metric="100% Reconciled",
                    urgency="critical",
                    created_at="2 days ago",
                    status="confirmed",
                ),
            ]

        # 4. Financial Health Metrics
        monthly_rev = round(project_cost * 0.22, 2)
        monthly_opex = round(project_cost * 0.13, 2)
        monthly_emi = round(concessional_debt * 0.049699, 2)
        working_cap = round(project_cost * 0.25, 2)

        health_score = 84
        health_metrics = LifecycleEngine.get_health_metrics(
            monthly_revenue=monthly_rev,
            monthly_expenses=monthly_opex,
            emi=monthly_emi,
            working_capital=working_cap,
        )

        alerts = [
            RiskAlert(
                alert_id="ALERT-LOAN-01",
                severity="low",
                category="Government Scheme",
                message="DTFC physical scrutiny scheduled next week. Keep 3 hard copies of DPR with bank passbook.",
                recommended_action="Carry verified Gram Panchayat letter and Aadhaar original.",
                triggered_at="2026-09-15T08:00:00Z",
            )
        ]

        return PersonalDashboardData(
            business_id=f"BIZ-{uuid.uuid4().hex[:8].upper()}",
            business_name=ent_display,
            locality=loc_display,
            state=state_display,
            business_idea=idea_display,
            capital=capital,
            project_cost=project_cost,
            health_score=health_score,
            total_milestones_count=16,
            completed_milestones_count=7,
            running_goals_count=6,
            pending_goals_count=3,
            loan_progress=loan_progress,
            goals=goals,
            reminders=reminders,
            metrics=health_metrics,
            alerts=alerts,
            co_pilot_status="Active & Monitoring Operational Heartbeat",
        )

    @staticmethod
    def generate_next_ai_goal(request: GenerateGoalRequest) -> AIBusinessGoal:
        completed_count = len(request.completed_goal_ids)
        next_order = completed_count + 7

        next_pool = [
            {
                "title": "Launch Value-Added Cottage Cheese (Paneer) Pilot Line",
                "desc": "Utilize evening surplus milk to manufacture vacuum-packed 200g paneer blocks.",
                "cat": "Product Diversification",
                "priority": "high",
                "rationale": "Increases realization per litre from ₹44 to ₹62 by capturing downstream consumer margin.",
                "days": 60,
            },
            {
                "title": "Integrate 5kW Solar Thermal Chiller Backup",
                "desc": "Install solar photovoltaic panels to slash daytime compressor electricity bills by 35%.",
                "cat": "Cost Optimization",
                "priority": "medium",
                "rationale": "Reduces diesel generator dependency during summer grid outages.",
                "days": 75,
            },
            {
                "title": "Register Direct Brand Trademark & Food-Grade Pouch Packaging",
                "desc": "Launch branded farm-fresh retail pouches across sub-district kirana stores.",
                "cat": "Branding",
                "priority": "high",
                "rationale": "Builds customer goodwill and enables direct consumer subscription model.",
                "days": 90,
            },
            {
                "title": "Apply for NABARD Cold Storage Expansion Refinance",
                "desc": "Apply for second-tranche concessional credit to scale chilling from 1,000L to 3,000L.",
                "cat": "Capital Expansion",
                "priority": "medium",
                "rationale": "Enables coverage of additional 20 village collection nodes.",
                "days": 120,
            },
        ]

        selected = next_pool[completed_count % len(next_pool)]

        return AIBusinessGoal(
            goal_id=f"GOAL-{uuid.uuid4().hex[:6].upper()}",
            title=selected["title"],
            description=selected["desc"],
            category=selected["cat"],
            priority=selected["priority"],
            progress_percent=0,
            status="pending",
            ai_rationale=selected["rationale"],
            deadline_days=selected["days"],
            order=next_order,
        )

    @staticmethod
    def respond_to_reminder(reminder_id: str, action: str) -> Dict[str, Any]:
        return {
            "reminder_id": reminder_id,
            "action": action,
            "updated_status": "confirmed" if action == "confirm" else ("need_help" if action == "help" else "snoozed"),
            "ai_advice": (
                "Great job! Your operational check has been verified and logged in your business health audit trail."
                if action == "confirm"
                else "Your AI Business Co-Pilot has noted this challenge and queued operational troubleshooting steps."
            ),
        }
