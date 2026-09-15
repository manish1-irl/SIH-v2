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

    async def _call_gemini(
        self,
        prompt: str,
        tool_result: Optional[Dict[str, Any]] = None,
        ctx: Optional[Dict[str, Any]] = None,
        fallback: Optional[str] = None,
    ) -> str:
        if not self.gemini_key:
            return fallback or self._generate_offline_narrative(tool_result, ctx)
        models_to_try = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.7-flash"]
        try:
            import httpx
            async with httpx.AsyncClient() as client:
                for model_name in models_to_try:
                    try:
                        resp = await client.post(
                            f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.gemini_key}",
                            json={"contents": [{"parts": [{"text": prompt}]}]},
                            timeout=15.0,
                        )
                        if resp.status_code == 200:
                            data = resp.json()
                            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                            if text:
                                return text.strip()
                        else:
                            print(f"[Gemini API] Model {model_name} returned status {resp.status_code}")
                    except Exception as me:
                        print(f"[Gemini API] Model {model_name} request failed: {str(me)}")
                return fallback or self._generate_offline_narrative(tool_result, ctx)
        except Exception as e:
            print(f"[Gemini API] Exception: {str(e)}")
            return fallback or self._generate_offline_narrative(tool_result, ctx)

    def _generate_offline_narrative(
        self,
        tool_result: Optional[Dict[str, Any]] = None,
        ctx: Optional[Dict[str, Any]] = None,
    ) -> str:
        ctx = ctx or {}
        tool_result = tool_result or {}

        # 1. Reverse Feasibility Output (Turn 3)
        if "recommendations" in tool_result and "location_profile" in tool_result:
            lp = tool_result["location_profile"]
            recs = tool_result["recommendations"]
            loc = lp.get("locality", ctx.get("locality", "your area"))
            pop = lp.get("population", 0)
            cap = ctx.get("capital", 100000)

            rec_blocks = []
            for i, r in enumerate(recs, 1):
                rec_blocks.append(
                    f"{i}) {r.get('business')} ({r.get('category')}):\n"
                    f"   - Total Project Cost: ₹{r.get('project_cost', 0):,.0f}\n"
                    f"   - Your Own Capital (Margin): ₹{r.get('own_contribution', 0):,.0f}\n"
                    f"   - Bank Loan Required: ₹{r.get('bank_loan', 0):,.0f} (Monthly EMI: ~₹{r.get('monthly_emi', 0):,.0f})\n"
                    f"   - Government Scheme: {r.get('scheme_name')} (Subsidy: ₹{r.get('subsidy_amount', 0):,.0f})\n"
                    f"   - Expected Monthly Net Profit: ~₹{r.get('expected_monthly_net_profit', 0):,.0f}/mo"
                )
            recs_text = "\n\n".join(rec_blocks)

            return (
                f"Market Demographics & Reverse Feasibility for {loc} (Population: ~{pop:,}):\n\n"
                f"Based on local market gaps (avoiding saturated Kirana and retail stores), with your capital of ₹{cap:,.0f}, "
                f"here are the top 3 high-demand businesses:\n\n"
                f"{recs_text}\n\n"
                f"Which business would you like to choose? Let me know, and I will generate your complete 29-section bankable DPR and loan application schedule!"
            )

        # 2. Location Intelligence Output (Turn 2 - Awaiting Capital)
        elif "location_profile" in tool_result and "recommendations" not in tool_result:
            lp = tool_result["location_profile"]
            loc = lp.get("locality", ctx.get("locality", "your area"))
            pop = lp.get("population", 0)
            hh = lp.get("households", 0)
            driver = lp.get("primary_economic_driver", "")
            sat_list = [s.get("sector", "") for s in lp.get("saturated_sectors", [])]
            gap_list = [g.get("business_type", "") for g in lp.get("unmet_demand_gaps", [])]

            sat_str = ", ".join(sat_list[:2]) if sat_list else "Kirana grocery & tea kiosks"
            gap_str = ", ".join(gap_list[:3]) if gap_list else "Fresh milk chilling, custom uniform tailoring, and food processing"

            return (
                f"Location Market Analysis for {loc} ({lp.get('tier', 'Semi-Urban Hub')}):\n"
                f"- Population: Approximately {pop:,} residents ({hh:,} households).\n"
                f"- Local Economic Driver: {driver}.\n"
                f"- Saturated Businesses to Avoid (High Competition): {sat_str}.\n"
                f"- High-Demand Unmet Opportunities Needed: {gap_str}.\n\n"
                f"How much capital (own investment money) do you have available? (e.g. ₹50,000, ₹1 Lakh, ₹2 Lakhs). "
                f"Share your capital, and I will calculate the exact project cost, bank loan, monthly EMI, and government subsidy (like PMEGP 35% or MUDRA)!"
            )

        # 3. Awaiting Location Output (Turn 1)
        elif tool_result.get("step") == "awaiting_location":
            return tool_result.get(
                "question",
                "Which location (village, town, or district) do you live in? Tell me your area, and I will analyze the local population, existing businesses, and high-demand business gaps for you.",
            )

        # 4. Full Feasibility & Financial Summary (Turn 4)
        elif "financial_plan" in tool_result and "feasibility" in tool_result:
            fp = tool_result["financial_plan"]
            fs = tool_result["feasibility"]
            schemes = tool_result.get("schemes", [])
            scheme_names = ", ".join(s.get("scheme_name", "") for s in schemes[:2]) if schemes else "MUDRA & PMEGP"
            biz = ctx.get("business_idea", "business")
            loc = ctx.get("locality", "your locality")
            cap = ctx.get("capital", 0)
            verdict_val = fs.get("verdict", "FEASIBLE")
            verdict_str = verdict_val.value if hasattr(verdict_val, "value") else str(verdict_val).replace("RecommendationEnum.", "")
            return (
                f"Feasibility summary for {biz} in {loc}: With your initial capital of ₹{cap:,.0f}, "
                f"the estimated project cost is ₹{fp.get('project_cost', 0):,.0f}, requiring a bank loan of "
                f"₹{fp.get('loan_requirement', 0):,.0f} (approx. monthly EMI: ₹{fp.get('monthly_emi', 0):,.0f}). "
                f"Your business feasibility score is {fs.get('overall_score', 0)}/100 ({verdict_str}) "
                f"with break-even at month {fp.get('break_even_months', 6)}. Recommended schemes: {scheme_names}. "
                f"You can download your full 29-section bankable DPR report below."
            )
        elif "guidance" in tool_result:
            return tool_result["guidance"]
        elif "message" in tool_result:
            return tool_result["message"]

        return (
            "Based on the deterministic feasibility evaluation for your proposal, your inputs have been verified "
            "against local market benchmarks, scheme criteria, and deterministic financial models. "
            "Please check the tabs below for the complete breakdown and download your bankable DPR report."
        )

    def _extract_entities(self, text: str) -> Dict[str, Any]:
        entities: Dict[str, Any] = {}
        text_lower = text.lower()

        # 1. Capital extraction: match patterns like "1 lakh", "1.5 lac", "2 crores", "50k", "50 thousand", "1 लाख", "50 हजार"
        # with optional rs/rupees/ruppees/inr/₹/रुपये/रु before or after
        unit_match = re.search(
            r'(?:(?:rs\.?|inr|rupees?|ruppees?|₹|रुपये|रुपया|रु\.?)\s*)?(\d+(?:\.\d+)?)\s*(lakhs?|lacs?|crores?|cr\b|thousands?|k\b|लाख|हज़ार|हजार|करोड़)\s*(?:rs\.?|inr|rupees?|ruppees?|₹|रुपये|रुपया|रु\.?)?',
            text_lower,
        )
        if unit_match:
            try:
                num = float(unit_match.group(1))
                unit = unit_match.group(2).lower()
                if unit in ["lakh", "lakhs", "lac", "lacs", "लाख"]:
                    entities["capital"] = num * 100000
                elif unit in ["crore", "crores", "cr", "करोड़"]:
                    entities["capital"] = num * 10000000
                elif unit in ["k", "thousand", "thousands", "हज़ार", "हजार"]:
                    entities["capital"] = num * 1000
            except ValueError:
                pass

        # 2. Currency prefix or suffix with digits: "rs 50000", "₹100,000", "50000 rupees", "100000 ruppees", "50000 रुपये"
        if "capital" not in entities:
            curr_match = re.search(
                r'(?:(?:rs\.?|inr|rupees?|ruppees?|₹|रुपये|रुपया|रु\.?)\s*([\d,]+(?:\.\d+)?)|([\d,]+(?:\.\d+)?)\s*(?:rs\.?|inr|rupees?|ruppees?|₹|रुपये|रुपया|रु\.?))',
                text_lower,
            )
            if curr_match:
                amt_str = (curr_match.group(1) or curr_match.group(2)).replace(",", "")
                try:
                    entities["capital"] = float(amt_str)
                except ValueError:
                    pass

        # 3. Standalone numbers of 4+ digits (e.g. 50000, 100000)
        if "capital" not in entities:
            num_match = re.search(r'\b(\d{4,})\b', text)
            if num_match:
                try:
                    entities["capital"] = float(num_match.group(1))
                except ValueError:
                    pass

        # Locality extraction:
        # Check known locality dictionary first
        known_locs = {
            "pratapnagar": "Pratapnagar",
            "pratap nagar": "Pratapnagar",
            "sitapura": "Sitapura",
            "alwar": "Alwar",
            "tonk": "Tonk",
            "chomu": "Chomu",
            "sanganer": "Sanganer",
            "bhiwadi": "Bhiwadi",
            "jaipur": "Jaipur",
            "jodhpur": "Jodhpur",
            "udaipur": "Udaipur",
            "kota": "Kota",
            "bikaner": "Bikaner",
            "ajmer": "Ajmer",
            "delhi": "Delhi",
            "mumbai": "Mumbai",
            "pune": "Pune",
            "indore": "Indore",
            "lucknow": "Lucknow",
            "patna": "Patna",
            "bhopal": "Bhopal",
            "agra": "Agra",
            "kanpur": "Kanpur",
            "nagpur": "Nagpur",
            "varanasi": "Varanasi",
            "gurgaon": "Gurgaon",
            "noida": "Noida",
        }
        for k_loc, proper_name in known_locs.items():
            if re.search(r'\b' + re.escape(k_loc) + r'\b', text_lower):
                entities["locality"] = proper_name
                break

        # Check Hindi known localities
        if "locality" not in entities:
            known_hindi_locs = {
                "प्रतापनगर": "Pratapnagar",
                "प्रताप नगर": "Pratapnagar",
                "सीतापुरा": "Sitapura",
                "अलवर": "Alwar",
                "टोंक": "Tonk",
                "चौमू": "Chomu",
                "सांगानेर": "Sanganer",
                "भिवाड़ी": "Bhiwadi",
                "जयपुर": "Jaipur",
                "जोधपुर": "Jodhpur",
                "उदयपुर": "Udaipur",
                "कोटा": "Kota",
                "अजमेर": "Ajmer",
                "दिल्ली": "Delhi",
            }
            for k_hi, proper_name in known_hindi_locs.items():
                if k_hi in text:
                    entities["locality"] = proper_name
                    break

        # Preposition pattern: "in pratapnagar", "from alwar", "live in sitapura"
        if "locality" not in entities:
            loc_match = re.search(
                r'\b(?:in|at|near|from|live in|lives in|living in|located in|location is|area is|place is)\s+([a-zA-Z\s]+?)(?:\s+(?:with|for|having|using|at|\d|near|rs|inr|rupee|ruppee)|$)',
                text,
                re.IGNORECASE,
            )
            if loc_match:
                raw_loc = loc_match.group(1).strip()
                stopwords = {"a", "an", "the", "my", "our", "this", "that", "india", "village", "town", "city", "market", "area", "rural"}
                valid_words = [w for w in raw_loc.split() if w.lower() not in stopwords]
                if valid_words:
                    entities["locality"] = " ".join(valid_words).title()

        if "locality" not in entities:
            # Hindi location format: e.g. "जयपुर में", "प्रतापनगर में", "अजमेर में"
            indic_loc_match = re.search(r'([a-zA-Z\u0900-\u097F]+)\s+में', text)
            if indic_loc_match:
                cand = indic_loc_match.group(1).strip()
                indic_stopwords = {"हजार", "लाख", "करोड़", "रुपये", "रुपया", "दिन", "महीने", "साल", "काम", "शुरू", "बिजनेस", "दुकान"}
                if cand not in indic_stopwords:
                    entities["locality"] = cand.title()

        # Standalone short locality reply (e.g. user simply typed "Pratapnagar" or "Sitapura")
        if "locality" not in entities and "capital" not in entities:
            cleaned_text = re.sub(r'[^\w\s]', '', text_lower).strip()
            text_words = cleaned_text.split()
            non_loc_words = {
                "hi", "hello", "hey", "namaste", "yes", "no", "ok", "okay", "help", "how",
                "what", "where", "why", "when", "can", "i", "you", "me", "my", "start",
                "business", "project", "money", "capital", "loan", "emi", "scheme", "dairy",
                "shop", "cost", "dpr", "report", "first", "second", "third", "one", "two",
            }
            if 1 <= len(text_words) <= 3 and not any(w in non_loc_words for w in text_words):
                entities["locality"] = text.strip().title()

        # Detect intent to start business/project
        intent_phrases = [
            "start business", "start a business", "start project", "start a project",
            "start my project", "start new business", "need to start", "want to start",
            "open a business", "open business", "which business", "suggest business",
            "recommend business", "what business", "business idea", "shuru karna hai",
            "kholna hai", "kholna chahta", "business start", "project start",
            "बिजनेस शुरू", "नया बिजनेस", "काम शुरू", "प्रोजेक्ट शुरू", "दुकान खोलना",
        ]
        entities["intent_to_start"] = any(p in text_lower for p in intent_phrases)

        known_businesses = {
            "dairy": "Dairy Micro-Enterprise",
            "milk": "Dairy Micro-Enterprise",
            "dudh": "Dairy Micro-Enterprise",
            "doodh": "Dairy Micro-Enterprise",
            "cattle": "Dairy Micro-Enterprise",
            "cow": "Dairy Micro-Enterprise",
            "buffalo": "Dairy Micro-Enterprise",
            "pashupalan": "Dairy Micro-Enterprise",
            "डेयरी": "Dairy Micro-Enterprise",
            "दूध": "Dairy Micro-Enterprise",
            "पशुपालन": "Dairy Micro-Enterprise",
            "गाय": "Dairy Micro-Enterprise",
            "भैंस": "Dairy Micro-Enterprise",
            "spice": "Spice Processing Unit",
            "masala": "Spice Processing Unit",
            "मसाला": "Spice Processing Unit",
            "food": "Food Processing Unit",
            "flour": "Food Processing Unit",
            "atta": "Food Processing Unit",
            "आटा": "Food Processing Unit",
            "tailoring": "Tailoring & Garment Shop",
            "tailor": "Tailoring & Garment Shop",
            "cloth": "Tailoring & Garment Shop",
            "garment": "Tailoring & Garment Shop",
            "silai": "Tailoring & Garment Shop",
            "सिलाई": "Tailoring & Garment Shop",
            "दर्जी": "Tailoring & Garment Shop",
            "कपड़ा": "Tailoring & Garment Shop",
            "shop": "Retail Shop",
            "retail": "Retail Shop",
            "kirana": "Retail Shop",
            "grocery": "Retail Shop",
            "general store": "Retail Shop",
            "किराना": "Retail Shop",
            "दुकान": "Retail Shop",
            "राशन": "Retail Shop",
            "solar": "Solar Equipment Rental",
            "सोलर": "Solar Equipment Rental",
            "repair": "Repair & Service Center",
            "mobile repair": "Repair & Service Center",
            "beauty": "Beauty Parlour",
            "parlour": "Beauty Parlour",
            "salon": "Beauty Parlour",
            "photocopy": "Cyber Cafe & Photocopy",
            "cyber": "Cyber Cafe & Photocopy",
            "computer": "Computer Training Center",
            "tea": "Tea Stall",
            "chai": "Tea Stall",
            "चाय": "Tea Stall",
            "snack": "Snack Food Business",
            "नाश्ता": "Snack Food Business",
            "fish": "Fishery Enterprise",
            "machli": "Fishery Enterprise",
            "matsya": "Fishery Enterprise",
            "मछली": "Fishery Enterprise",
            "poultry": "Poultry Farm",
            "murgi": "Poultry Farm",
            "मुर्गी": "Poultry Farm",
            "पोल्ट्री": "Poultry Farm",
            "goat": "Goat Farming",
            "bakri": "Goat Farming",
            "बकरी": "Goat Farming",
            "bee": "Apiculture (Honey) Unit",
            "honey": "Apiculture (Honey) Unit",
            "मधुमक्खी": "Apiculture (Honey) Unit",
            "mushroom": "Mushroom Cultivation",
            "मशरूम": "Mushroom Cultivation",
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
        biz = evidence.user_inputs.get("business_idea", "your enterprise")
        loc = evidence.user_inputs.get("locality", "your area")
        fallback = (
            f"Feasibility summary for {biz} in {loc}: Overall feasibility score is "
            f"{evidence.feasibility_scores.overall_score if evidence.feasibility_scores else 80}/100 "
            f"({evidence.feasibility_scores.verdict.value if evidence.feasibility_scores else 'FEASIBLE'}). "
            f"Estimated total project cost is ₹{evidence.financial_data.project_cost:,.0f} with monthly EMI of ₹{evidence.financial_data.monthly_emi:,.0f}. "
            f"Break-even is projected at month {evidence.financial_data.break_even_months} with {len(evidence.scheme_data)} eligible government schemes."
        )
        return await self._call_gemini(prompt, fallback=fallback)

    async def handle_chat(self, query: str, context: Optional[Dict[str, Any]] = None, language: str = "en") -> Dict[str, Any]:
        query_lower = query.lower()
        entities = self._extract_entities(query)
        ctx = {**(context or {}), **entities}

        # Strict greeting check: only trigger pure greeting if message is purely a greeting
        words = re.findall(r'\b\w+\b', query_lower)
        pure_greetings = {"hi", "hello", "namaste", "hey", "pranam", "kya haal hai", "halo", "ram ram", "नमस्ते", "प्रणाम", "வணக்கம்", "নমস্কার"}
        is_pure_greeting = len(words) <= 2 and any(w in pure_greetings for w in words)
        if is_pure_greeting:
            greeting_msg = (
                "Namaste! I am your Hyper-Local AI Business Advisor. "
                "I can help you with: feasibility analysis, government scheme matching (PMEGP, MUDRA), "
                "deterministic financial planning, and business lifecycle support. "
                "Tell me your business idea, location, and available capital to get started. "
                "You can speak or type in any Indian language!"
            )
            if language == "hi":
                greeting_msg = (
                    "नमस्ते! मैं आपका हाइपर-लोकल AI बिजनेस सलाहकार हूँ। "
                    "मैं आपके बिजनेस की व्यवहार्यता (feasibility), सरकारी योजनाओं (PMEGP, MUDRA), "
                    "प्रोजेक्ट लागत और लोन/EMI की सटीक गणना में मदद कर सकता हूँ। "
                    "शुरू करने के लिए मुझे अपना बिजनेस विचार, स्थान और उपलब्ध पूंजी बताएं!"
                )
            return {
                "response": greeting_msg,
                "tool_used": ["greeting"],
                "data": {},
                "entities": entities,
            }

        if any(k in query_lower for k in ["what can you", "features", "capabilities", "help me with"]):
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
                "entities": entities,
            }

        if any(re.search(r'\b' + re.escape(w) + r'\b', query_lower) for w in ["emi", "loan", "repayment", "repay", "kist"]):
            loan = ctx.get("loan_amount", 200000)
            if "capital" in ctx:
                plan = self.tools.tool_03_generate_financial_plan(ctx["capital"], ctx.get("business_idea", "general"))
                loan = plan.get("loan_requirement", loan)
            tool_result = self.tools.tool_02_calculate_emi(principal=loan)

        elif any(re.search(r'\b' + re.escape(w) + r'\b', query_lower) for w in ["scheme", "subsidy", "pmegp", "mudra", "sarkari", "government"]):
            cost = ctx.get("project_cost", 450000)
            if "capital" in ctx:
                plan = self.tools.tool_03_generate_financial_plan(ctx["capital"], ctx.get("business_idea", "general"))
                cost = plan.get("project_cost", cost)
            tool_result = self.tools.tool_06_match_schemes(project_cost=cost)

        elif any(phrase in query_lower for phrase in ["when to launch", "launch timing", "best season", "start month", "launch window"]):
            tool_result = self.tools.tool_08_analyze_timing(
                business_category=ctx.get("business_idea", "general"),
            )

        elif any(re.search(r'\b' + re.escape(w) + r'\b', query_lower) for w in ["cluster", "network", "nearby", "supplier", "suppliers"]):
            tool_result = self.tools.tool_09_find_clusters(
                locality=ctx.get("locality", "India"),
                business_category=ctx.get("business_idea", "general"),
            )

        elif any(re.search(r'\b' + re.escape(w) + r'\b', query_lower) for w in ["dpr", "report", "document", "bankable"]):
            if "capital" in ctx:
                tool_result = self.tools.tool_16_cashflow_analysis(capital=ctx["capital"])
            else:
                tool_result = {"message": "I need your capital amount to generate the DPR cashflow analysis."}

        elif any(re.search(r'\b' + re.escape(w) + r'\b', query_lower) for w in ["swot", "strength", "weakness"]):
            if "capital" in ctx:
                tool_result = self.tools.tool_23_full_analysis_summary(ctx)
            else:
                tool_result = {"message": "Tell me your capital, business idea, and location for a SWOT analysis."}

        elif any(re.search(r'\b' + re.escape(w) + r'\b', query_lower) for w in ["lifecycle", "health", "checkup"]):
            tool_result = self.tools.tool_12_health_score(
                monthly_revenue=ctx.get("monthly_revenue", 30000),
                monthly_expenses=ctx.get("monthly_expenses", 20000),
                emi=ctx.get("emi", 5000),
                days_since_launch=ctx.get("days_since_launch", 30),
            )

        elif any(re.search(r'\b' + re.escape(w) + r'\b', query_lower) for w in ["category", "sector"]):
            if "business_idea" in ctx:
                tool_result = self.tools.tool_18_business_category_analysis(ctx["business_idea"])
            else:
                tool_result = {"message": "Tell me your business idea and I will classify it."}

        elif any(re.search(r'\b' + re.escape(w) + r'\b', query_lower) for w in ["license", "permit", "registration", "udyam", "fssai"]):
            if "business_idea" in ctx:
                tool_result = self.tools.tool_21_regulatory_checklist(ctx["business_idea"])
            else:
                tool_result = {"message": "Tell me your business idea for the required license list."}

        elif any(phrase in query_lower for phrase in ["how much cost", "total cost", "investment timeline", "capital required"]):
            if "capital" in ctx:
                tool_result = self.tools.tool_22_investment_timeline(
                    capital=ctx["capital"],
                    business_category=ctx.get("business_idea", "general"),
                )
            else:
                tool_result = {"message": "Tell me your available capital and I will break down the investment timeline."}

        # --- 4-Turn Conversational Discovery & Reverse Feasibility State Machine ---

        # Turn 4: User has specified both capital and a specific business idea (e.g., "Dairy", "Tailoring", "Milling")
        elif ("capital" in ctx and "business_idea" in ctx and ctx.get("business_idea") != "general") or (
            any(re.search(r'\b' + re.escape(w) + r'\b', query_lower) for w in ["feasible", "feasibility", "can i start", "should i start", "start dairy", "start milk", "start shop", "start unit"])
            and "capital" in ctx
        ):
            tool_result = self.tools.tool_23_full_analysis_summary(ctx)

        # Turn 3: User has provided capital AND locality (or asks what business they can do with capital in locality)
        elif "capital" in ctx and "locality" in ctx:
            tool_result = self.tools.tool_05_reverse_feasibility(
                capital=ctx["capital"],
                locality=ctx["locality"],
                state=ctx.get("state", "Rajasthan"),
            )

        # Turn 2: User has provided locality (e.g. "Pratapnagar" or "I live in Pratapnagar"), but NOT capital yet
        elif "locality" in ctx and "capital" not in ctx:
            tool_result = self.tools.tool_24_location_intelligence(
                locality=ctx["locality"],
                state=ctx.get("state", "Rajasthan"),
            )
            tool_result["step"] = "awaiting_capital"
            tool_result["question"] = (
                f"Based on {ctx['locality']}'s population and market demand, how much capital (own investment money) "
                f"do you have available? (e.g., ₹50,000, ₹1 Lakh, ₹2 Lakhs). Share your amount and I will calculate "
                f"the exact project cost, bank loan, monthly EMI, and government subsidy (like PMEGP 35% or MUDRA)!"
            )

        # User has provided capital but NOT locality
        elif "capital" in ctx and "locality" not in ctx:
            tool_result = {
                "step": "awaiting_location",
                "capital": ctx["capital"],
                "question": (
                    f"Great! With your available capital of ₹{ctx['capital']:,.0f}, which location (village, town, or district) "
                    f"do you plan to start your business in? Tell me your area so I can analyze local population, market saturation, "
                    f"and recommend the most profitable businesses."
                ),
            }

        # Turn 1: User expresses intent to start a business/project without location or capital
        elif entities.get("intent_to_start") or any(phrase in query_lower for phrase in ["start business", "start a business", "start project", "start a project", "which business", "suggest business", "recommend business", "what business", "business idea", "start any business", "want to start", "need to start"]):
            tool_result = {
                "step": "awaiting_location",
                "question": (
                    "Which location (village, town, or district) do you live in? Tell me your area, "
                    "and I will analyze the local population, which businesses already exist (market saturation), "
                    "and which high-demand businesses are missing and needed!"
                ),
            }

        else:
            tool_result = {
                "step": "awaiting_location",
                "question": (
                    "Namaste! Which location (village, town, or district) do you live in? "
                    "Tell me your area, and I will analyze the local population, existing market competition, "
                    "and top business opportunities for you."
                ),
            }

        lang_names = {
            "hi": "Hindi (हिन्दी)",
            "bn": "Bengali (বাংলা)",
            "ta": "Tamil (தமிழ்)",
            "te": "Telugu (తెలుగు)",
            "mr": "Marathi (मराठी)",
            "gu": "Gujarati (ગુજરાતી)",
            "kn": "Kannada (ಕನ್ನಡ)",
            "ml": "Malayalam (മലയാളം)",
            "pa": "Punjabi (ਪੰਜਾਬੀ)",
            "or": "Odia (ଓଡ଼ିଆ)",
            "as": "Assamese (অসমীয়া)",
            "ur": "Urdu (اردو)",
            "en": "English",
        }
        target_lang = lang_names.get(language, "the language of the user query")

        prompt = f"""You are a helpful, expert AI business advisor for rural and semi-urban Indian entrepreneurs.
User asked: {query}
Target Response Language: {target_lang}
Extracted details: {json.dumps(entities, default=str)}
Advisor Engine Data: {json.dumps(tool_result, default=str)}

Instructions based on the Advisor Engine Data:
1. If 'recommendations' are present:
   - Present the top 3 recommended businesses for the user's capital in their locality.
   - You MUST quote the exact calculated figures: Total Project Cost, User Margin/Capital, Bank Loan Required, Monthly EMI, Government Scheme with Subsidy amount, and Expected Monthly Net Profit.
   - Mention why these fit the local population (avoiding saturated Kirana/tea stalls).
   - Ask the user which business they would like to select so you can generate their 29-section bankable DPR.
2. If 'location_profile' is present (without recommendations) and step is 'awaiting_capital':
   - State the locality name and population/household demographics.
   - Explicitly list the saturated businesses that already exist in that area and warn the user to avoid them due to high competition.
   - Explicitly highlight the high-demand unmet business opportunities needed in that community.
   - Ask the user how much capital (own investment money) they have available (e.g. ₹50,000, ₹1 Lakh, ₹2 Lakhs) so you can calculate their project cost, loan, EMI, and PMEGP/MUDRA subsidy.
3. If step is 'awaiting_location':
   - Politely and clearly ask the user which location (village, town, or district) they live in so you can analyze local population, saturated businesses, and market gaps.
4. If 'financial_plan' and 'feasibility' are present:
   - Summarize the feasibility score, verdict, project cost, bank loan, monthly EMI, and eligible schemes (PMEGP/MUDRA).
5. Always respond fluently in {target_lang} (using its proper script). Never invent or hallucinate financial numbers; use the exact verified figures from Advisor Engine Data."""
        narrative = await self._call_gemini(prompt, tool_result=tool_result, ctx=ctx)

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
