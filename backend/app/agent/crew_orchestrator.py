import os
import json
import re
from typing import Any, Dict, Optional
from app.models.schemas import EvidenceObject
from app.tools.agent_tools import AgentTools
from app.core.config import settings


class CrewOrchestrator:
    def __init__(self):
        self.gemini_key = settings.GEMINI_API_KEY
        self.tools = AgentTools()

    @property
    def is_gemini_configured(self) -> bool:
        return bool(self.gemini_key)

    async def _call_gemini(self, prompt: str) -> str:
        if not self.gemini_key:
            return self._generate_offline_narrative(prompt)
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={self.gemini_key}",
                    json={"contents": [{"parts": [{"text": prompt}]}]},
                    timeout=30.0,
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                return self._generate_offline_narrative(prompt)
        except Exception:
            return self._generate_offline_narrative(prompt)

    def _generate_offline_narrative(self, context: str) -> str:
        return (
            "Based on the deterministic analysis of your business proposal, "
            "the feasibility engine has evaluated capital fit, market conditions, "
            "scheme eligibility, and seasonal timing. All financial calculations "
            "follow verified formulas with zero hallucinated estimates. "
            "Please review the detailed breakdown across all tabs for complete insights."
        )

    def _extract_entities(self, text: str) -> Dict[str, Any]:
        entities: Dict[str, Any] = {}
        text_lower = text.lower()

        amount_match = re.search(r'(?:rs\.?|inr|rupees?)\s*[\d,]+(?:\s*(?:lakh|crore))?', text_lower)
        if amount_match:
            amt_str = amount_match.group().replace("rs.", "").replace("inr", "").replace("rupees", "").strip()
            multiplier = 1
            if "lakh" in amt_str:
                amt_str = amt_str.replace("lakh", "").strip()
                multiplier = 100000
            elif "crore" in amt_str:
                amt_str = amt_str.replace("crore", "").strip()
                multiplier = 10000000
            amt_str = amt_str.replace(",", "")
            try:
                entities["capital"] = float(amt_str) * multiplier
            except ValueError:
                pass

        if "capital" not in entities:
            num_match = re.search(r'(\d{4,})', text)
            if num_match:
                entities["capital"] = float(num_match.group(1))

        known_businesses = {
            "dairy": "Dairy Micro-Enterprise",
            "milk": "Dairy Micro-Enterprise",
            "spice": "Spice Processing Unit",
            "food": "Food Processing Unit",
            "tailoring": "Tailoring & Garment Shop",
            "tailor": "Tailoring & Garment Shop",
            "shop": "Retail Shop",
            "retail": "Retail Shop",
            "solar": "Solar Equipment Rental",
            "repair": "Repair & Service Center",
            "beauty": "Beauty Parlour",
            "photocopy": "Cyber Cafe & Photocopy",
            "computer": "Computer Training Center",
            "tea": "Tea Stall",
            "snack": "Snack Food Business",
            "fish": "Fishery Enterprise",
            "poultry": "Poultry Farm",
            "goat": "Goat Farming",
            "bee": "Apiculture (Honey) Unit",
            "mushroom": "Mushroom Cultivation",
        }
        for keyword, business in known_businesses.items():
            if keyword in text_lower:
                entities["business_idea"] = business
                break

        indian_states = [
            "rajasthan", "maharashtra", "uttar pradesh", "madhya pradesh",
            "gujarat", "karnataka", "tamil nadu", "andhra pradesh", "telangana",
            "west bengal", "odisha", "punjab", "haryana", "bihar", "jharkhand",
            "chhattisgarh", "uttarakhand", "himachal pradesh", "assam", "kerala",
            "goa", "manipur", "meghalaya", "nagaland", "tripura", "mizoram",
            "arunachal pradesh", "sikkim", "jammu", "kashmir", "delhi",
        ]
        for state in indian_states:
            if state in text_lower:
                entities["state"] = state.title()
                break

        if not entities.get("business_idea") and not entities.get("capital"):
            entities["needs_input"] = True

        return entities

    async def generate_narrative(self, evidence: EvidenceObject) -> str:
        prompt = f"""You are a business advisor for rural Indian entrepreneurs.
Generate a concise, encouraging but honest narrative summary for this business analysis.

Business: {evidence.user_inputs.get('business_idea', 'N/A')}
Location: {evidence.user_inputs.get('locality', 'N/A')}, {evidence.user_inputs.get('state', 'N/A')}
Capital: INR {evidence.user_inputs.get('capital', 0):,.0f}
Project Cost: INR {evidence.financial_data.project_cost:,.0f}
Monthly EMI: INR {evidence.financial_data.monthly_emi:,.0f}
Break-even: Month {evidence.financial_data.break_even_months}
Verdict: {evidence.feasibility_scores.verdict.value if evidence.feasibility_scores else 'N/A'}
Overall Score: {evidence.feasibility_scores.overall_score if evidence.feasibility_scores else 'N/A'}/100
Schemes Matched: {len(evidence.scheme_data)}

Provide 3-4 sentences covering the key recommendation, financial viability, and next steps."""
        return await self._call_gemini(prompt)

    async def handle_chat(self, query: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        query_lower = query.lower()
        entities = self._extract_entities(query)
        ctx = {**(context or {}), **entities}

        if any(k in query_lower for k in ["hi", "hello", "namaste", "start", "help", "hey"]):
            return {
                "response": (
                    "Namaste! I am your Hyper-Local AI Business Advisor. "
                    "I can help you with: feasibility analysis, government scheme matching, "
                    "financial planning, and business lifecycle support. "
                    "Tell me your business idea, location, and available capital to get started. "
                    "You can speak in any Indian language!"
                ),
                "tool_used": ["greeting"],
                "data": {},
            }

        if any(k in query_lower for k in ["what can you", "features", "capabilities"]):
            return {
                "response": (
                    "I can help you: 1) Check if your business idea is feasible in your area. "
                    "2) Match you with government schemes like PMEGP and MUDRA. "
                    "3) Calculate exact EMI, project cost, and break-even timeline. "
                    "4) Find the best season to launch. 5) Generate a 29-section bankable DPR. "
                    "6) Track your business health after launch. "
                    "Just tell me about your idea, location, and capital!"
                ),
                "tool_used": ["capabilities"],
                "data": {},
            }

        if any(k in query_lower for k in ["emi", "loan", "repayment", "repay"]):
            loan = ctx.get("loan_amount", 200000)
            if "capital" in ctx:
                plan = self.tools.tool_03_generate_financial_plan(ctx["capital"], ctx.get("business_idea", "general"))
                loan = plan.get("loan_requirement", loan)
            tool_result = self.tools.tool_02_calculate_emi(principal=loan)

        elif any(k in query_lower for k in ["feasible", "feasibility", "score", "should i", "can i start"]):
            if "capital" in ctx and "business_idea" in ctx:
                tool_result = self.tools.tool_04_calculate_feasibility(
                    capital=ctx["capital"],
                    business_idea=ctx.get("business_idea", "general"),
                    locality=ctx.get("locality", "India"),
                    state=ctx.get("state", ""),
                )
            else:
                tool_result = {"message": "I need your capital amount, business idea, and location to check feasibility."}

        elif any(k in query_lower for k in ["scheme", "subsidy", "pmegp", "mudra", "government"]):
            cost = ctx.get("project_cost", 450000)
            if "capital" in ctx:
                plan = self.tools.tool_03_generate_financial_plan(ctx["capital"], ctx.get("business_idea", "general"))
                cost = plan.get("project_cost", cost)
            tool_result = self.tools.tool_06_match_schemes(project_cost=cost)

        elif any(k in query_lower for k in ["when", "launch", "time", "season", "start date"]):
            tool_result = self.tools.tool_08_analyze_timing(
                business_category=ctx.get("business_idea", "general"),
            )

        elif any(k in query_lower for k in ["cluster", "network", "nearby", "supplier"]):
            tool_result = self.tools.tool_09_find_clusters(
                locality=ctx.get("locality", "India"),
                business_category=ctx.get("business_idea", "general"),
            )

        elif any(k in query_lower for k in ["dpr", "report", "document", "bankable"]):
            if "capital" in ctx:
                tool_result = self.tools.tool_16_cashflow_analysis(capital=ctx["capital"])
            else:
                tool_result = {"message": "I need your capital amount to generate the DPR cashflow analysis."}

        elif any(k in query_lower for k in ["swot", "strength", "weakness"]):
            if "capital" in ctx:
                tool_result = self.tools.tool_23_full_analysis_summary(ctx)
            else:
                tool_result = {"message": "Tell me your capital, business idea, and location for a SWOT analysis."}

        elif any(k in query_lower for k in ["lifecycle", "health", "status"]):
            tool_result = self.tools.tool_12_health_score(
                monthly_revenue=ctx.get("monthly_revenue", 30000),
                monthly_expenses=ctx.get("monthly_expenses", 20000),
                emi=ctx.get("emi", 5000),
                days_since_launch=ctx.get("days_since_launch", 30),
            )

        elif any(k in query_lower for k in ["category", "sector", "type"]):
            if "business_idea" in ctx:
                tool_result = self.tools.tool_18_business_category_analysis(ctx["business_idea"])
            else:
                tool_result = {"message": "Tell me your business idea and I will classify it."}

        elif any(k in query_lower for k in ["license", "permit", "registration", "udyog"]):
            if "business_idea" in ctx:
                tool_result = self.tools.tool_21_regulatory_checklist(ctx["business_idea"])
            else:
                tool_result = {"message": "Tell me your business idea for the required license list."}

        elif any(k in query_lower for k in ["invest", "cost", "how much"]):
            if "capital" in ctx:
                tool_result = self.tools.tool_22_investment_timeline(
                    capital=ctx["capital"],
                    business_category=ctx.get("business_idea", "general"),
                )
            else:
                tool_result = {"message": "Tell me your available capital and I will break down the investment timeline."}

        else:
            if "capital" in ctx and "business_idea" in ctx:
                tool_result = self.tools.tool_23_full_analysis_summary(ctx)
            else:
                tool_result = {"message": "I can help with feasibility, schemes, financials, timing, and DPR. Tell me your business idea, location, and capital!"}

        prompt = f"""You are an AI business advisor for rural Indian entrepreneurs.
User asked: {query}
Extracted entities: {json.dumps(entities, default=str)}
Analysis result: {json.dumps(tool_result, default=str)}

Respond in 2-4 sentences. Be warm, encouraging, and specific. If data is present, mention key numbers. Always mention that all financial calculations are deterministic and verified."""
        narrative = await self._call_gemini(prompt)

        return {
            "response": narrative,
            "tool_used": list(tool_result.keys()),
            "data": tool_result,
            "entities": entities,
        }

    async def handle_full_analysis(self, user_text: str) -> Dict[str, Any]:
        entities = self._extract_entities(user_text)
        if "capital" not in entities:
            entities["capital"] = 100000
        if "business_idea" not in entities:
            entities["business_idea"] = "general"
        if "locality" not in entities:
            entities["locality"] = "India"

        from app.engines.financial import DeterministicFinancialEngine
        from app.engines.feasibility import FeasibilityEngine
        from app.engines.schemes import SchemeEngine
        from app.engines.time_machine import TimeMachineEngine
        from app.engines.cluster import ClusterEngine
        from app.models.schemas import EvidenceObject
        from datetime import datetime, timezone
        import uuid

        financial_plan = DeterministicFinancialEngine.generate_financial_plan(
            capital=entities["capital"],
            business_category=entities["business_idea"],
        )
        feasibility = FeasibilityEngine.calculate_feasibility(
            capital=entities["capital"],
            business_idea=entities["business_idea"],
            locality=entities["locality"],
            state=entities.get("state", ""),
            demographics={},
        )
        schemes = SchemeEngine.match_schemes(
            project_cost=financial_plan.project_cost,
            business_category=entities["business_idea"],
        )
        time_machine = TimeMachineEngine.analyze_timing(
            business_category=entities["business_idea"],
        )
        clusters = ClusterEngine.find_clusters(
            locality=entities["locality"],
            business_category=entities["business_idea"],
        )

        evidence = EvidenceObject(
            user_inputs=entities,
            financial_data=financial_plan,
            scheme_data=schemes,
            time_machine=time_machine,
            cluster_data=clusters,
            feasibility_scores=feasibility,
            retrieved_at=datetime.now(timezone.utc).isoformat(),
        )

        narrative = await self.generate_narrative(evidence)

        return {
            "narrative": narrative,
            "report": {
                "report_id": f"RPT-{uuid.uuid4().hex[:12].upper()}",
                "status": "complete",
                "evidence": evidence.model_dump(),
                "feasibility": feasibility.model_dump(),
                "financial_plan": financial_plan.model_dump(),
                "schemes": [s.model_dump() for s in schemes],
                "timing": time_machine.model_dump(),
                "clusters": [c.model_dump() for c in clusters],
                "verdict": feasibility.verdict.value,
                "overall_score": feasibility.overall_score,
            },
        }
