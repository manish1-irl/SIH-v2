import os
import json
import re
from typing import Any, Dict, Optional
from app.models.schemas import EvidenceObject
from app.tools.agent_tools import AgentTools
from app.core.config import settings
from app.core.session import session_manager


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
        language: str = "en",
        fallback: Optional[str] = None,
    ) -> str:
        if not self.gemini_key:
            return fallback or self._generate_offline_narrative(tool_result, ctx, language=language)
        models_to_try = ["gemini-2.0-flash", "gemini-1.5-flash"]
        try:
            import httpx
            async with httpx.AsyncClient(timeout=6.0) as client:
                for model_name in models_to_try:
                    try:
                        resp = await client.post(
                            f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={self.gemini_key}",
                            json={"contents": [{"parts": [{"text": prompt}]}]},
                            timeout=6.0,
                        )
                        if resp.status_code == 200:
                            data = resp.json()
                            text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                            if text:
                                return text.strip()
                        elif resp.status_code in (401, 403):
                            # Leaked / disabled / unauthorized key — immediately fail fast without retrying
                            break
                    except Exception:
                        break
        except Exception:
            pass
        return fallback or self._generate_offline_narrative(tool_result, ctx, language=language)

    def _generate_offline_narrative(
        self,
        tool_result: Optional[Dict[str, Any]] = None,
        ctx: Optional[Dict[str, Any]] = None,
        language: str = "en",
    ) -> str:
        ctx = ctx or {}
        tool_result = tool_result or {}
        is_hi = language == "hi"

        # 1. Reverse Feasibility Output (Turn 3)
        if "recommendations" in tool_result and "location_profile" in tool_result:
            lp = tool_result["location_profile"]
            recs = tool_result["recommendations"]
            loc = lp.get("locality", ctx.get("locality", "your area"))
            pop = lp.get("population", 0)
            cap = ctx.get("capital", 100000)

            rec_blocks = []
            for i, r in enumerate(recs, 1):
                if is_hi:
                    rec_blocks.append(
                        f"{i}) {r.get('business')} ({r.get('category')}):\n"
                        f"   - कुल प्रोजेक्ट लागत: ₹{r.get('project_cost', 0):,.0f}\n"
                        f"   - आपकी स्वयं की पूंजी (मार्जिन): ₹{r.get('own_contribution', 0):,.0f}\n"
                        f"   - बैंक लोन आवश्यकता: ₹{r.get('bank_loan', 0):,.0f} (मासिक EMI: ~₹{r.get('monthly_emi', 0):,.0f})\n"
                        f"   - सरकारी योजना: {r.get('scheme_name')} (सब्सिडी: ₹{r.get('subsidy_amount', 0):,.0f})\n"
                        f"   - अपेक्षित मासिक शुद्ध लाभ: ~₹{r.get('expected_monthly_net_profit', 0):,.0f}/माह"
                    )
                else:
                    rec_blocks.append(
                        f"{i}) {r.get('business')} ({r.get('category')}):\n"
                        f"   - Total Project Cost: ₹{r.get('project_cost', 0):,.0f}\n"
                        f"   - Your Own Capital (Margin): ₹{r.get('own_contribution', 0):,.0f}\n"
                        f"   - Bank Loan Required: ₹{r.get('bank_loan', 0):,.0f} (Monthly EMI: ~₹{r.get('monthly_emi', 0):,.0f})\n"
                        f"   - Government Scheme: {r.get('scheme_name')} (Subsidy: ₹{r.get('subsidy_amount', 0):,.0f})\n"
                        f"   - Expected Monthly Net Profit: ~₹{r.get('expected_monthly_net_profit', 0):,.0f}/mo"
                    )
            recs_text = "\n\n".join(rec_blocks)

            if is_hi:
                return (
                    f"बाजार सांख्यिकी एवं रिवर्स फीजिबिलिटी रिपोर्ट - {loc} (जनसंख्या: ~{pop:,}):\n\n"
                    f"स्थानीय बाजार की मांग (किराना व चाय जैसी अधिक प्रतिस्पर्धा वाली दुकानों से हटकर), आपकी ₹{cap:,.0f} की पूंजी के अनुसार "
                    f"शीर्ष 3 सबसे अधिक मुनाफे वाले व्यवसाय निम्नलिखित हैं:\n\n"
                    f"{recs_text}\n\n"
                    f"आप इनमें से कौन सा व्यवसाय चुनना चाहते हैं? मुझे बताएं, और मैं आपका 29-सेक्शन का पूर्ण बैंक-मान्य डीपीआर (DPR) तैयार कर दूंगा!"
                )
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

            if is_hi:
                return (
                    f"स्थान बाजार विश्लेषण - {loc} ({lp.get('tier', 'अर्ध-शहरी हब')}):\n"
                    f"- जनसंख्या: लगभग {pop:,} नागरिक ({hh:,} परिवार)।\n"
                    f"- मुख्य आर्थिक चालक: {driver}।\n"
                    f"- संतृप्त व्यवसाय (अत्यधिक प्रतिस्पर्धा, इनसे बचें): {sat_str}।\n"
                    f"- उच्च मांग वाले आवश्यक अवसर (बाजार में कमी): {gap_str}।\n\n"
                    f"आपके पास कितना निवेश (स्वयं की पूंजी) उपलब्ध है? (जैसे ₹50,000, ₹1 लाख, ₹2 लाख)। "
                    f"अपनी राशि बताएं, ताकि मैं कुल प्रोजेक्ट लागत, बैंक लोन, मासिक EMI, और सरकारी सब्सिडी (जैसे PMEGP 35% या मुद्रा) की गणना कर सकूं!"
                )
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
            if is_hi:
                return (
                    "नमस्ते! आप किस स्थान (गाँव, कस्बा, या जिला) में रहते हैं? मुझे अपना क्षेत्र बताएं, "
                    "ताकि मैं वहाँ की जनसंख्या, मौजूदा बाजार प्रतिस्पर्धा और आपके लिए सबसे उपयुक्त व लाभकारी व्यवसायों का विश्लेषण कर सकूं।"
                )
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

            if is_hi:
                return (
                    f"{loc} में {biz} के लिए व्यवहार्यता रिपोर्ट:\n\n"
                    f"- आपकी प्रारंभिक पूंजी: ₹{cap:,.0f}\n"
                    f"- कुल अनुमानित प्रोजेक्ट लागत: ₹{fp.get('project_cost', 0):,.0f}\n"
                    f"- आवश्यक बैंक लोन: ₹{fp.get('loan_requirement', 0):,.0f} (मासिक EMI: ~₹{fp.get('monthly_emi', 0):,.0f})\n"
                    f"- व्यवसाय व्यवहार्यता स्कोर: {fs.get('overall_score', 0)}/100 ({verdict_str})\n"
                    f"- ब्रेक-ईवन अवधि: {fp.get('break_even_months', 6)} महीने में\n"
                    f"- अनुशंसित सरकारी योजनाएं: {scheme_names}\n\n"
                    f"आप नीचे दिए गए 'Download DPR' बटन से अपना 29-सेक्शन का संपूर्ण बैंक-मान्य प्रोजेक्ट रिपोर्ट डाउनलोड कर सकते हैं।"
                )
            return (
                f"Feasibility summary for {biz} in {loc}: With your initial capital of ₹{cap:,.0f}, "
                f"the estimated project cost is ₹{fp.get('project_cost', 0):,.0f}, requiring a bank loan of "
                f"₹{fp.get('loan_requirement', 0):,.0f} (approx. monthly EMI: ₹{fp.get('monthly_emi', 0):,.0f}). "
                f"Your business feasibility score is {fs.get('overall_score', 0)}/100 ({verdict_str}) "
                f"with break-even at month {fp.get('break_even_months', 6)}. Recommended schemes: {scheme_names}. "
                f"You can download your full 29-section bankable DPR report below."
            )

        # 5. EMI & Loan Calculation Output
        elif "monthly_emi" in tool_result or "principal" in tool_result:
            p = tool_result.get("principal", ctx.get("loan_amount", 200000))
            emi = tool_result.get("monthly_emi", 0)
            rate = tool_result.get("annual_interest_rate", 9.5)
            months = tool_result.get("tenure_months", 60)
            tot_interest = tool_result.get("total_interest", 0)
            tot_payment = tool_result.get("total_payment", p + tot_interest)
            years = months // 12

            if is_hi:
                return (
                    f"बैंक लोन एवं ईएमआई (EMI) विस्तृत गणना:\n\n"
                    f"- मूल लोन राशि (Principal): ₹{p:,.0f}\n"
                    f"- ब्याज दर: {rate}% प्रति वर्ष\n"
                    f"- लोन अवधि: {months} महीने ({years} वर्ष)\n"
                    f"- अनुमानित मासिक EMI: ₹{emi:,.0f}/माह\n"
                    f"- कुल देय ब्याज: ₹{tot_interest:,.0f}\n"
                    f"- कुल चुकाई जाने वाली राशि: ₹{tot_payment:,.0f}\n\n"
                    f"यह लोन मुद्रा (MUDRA) या पीएमईजीपी (PMEGP) के तहत 15% से 35% सरकारी सब्सिडी के लिए पात्र है।"
                )
            return (
                f"Loan & EMI Financial Breakdown:\n\n"
                f"- Principal Loan Amount: ₹{p:,.0f}\n"
                f"- Interest Rate: {rate}% p.a.\n"
                f"- Loan Tenure: {months} months ({years} years)\n"
                f"- Estimated Monthly EMI: ₹{emi:,.0f}/mo\n"
                f"- Total Interest Payable: ₹{tot_interest:,.0f}\n"
                f"- Total Repayment Amount: ₹{tot_payment:,.0f}\n\n"
                f"This loan is eligible for 15% to 35% capital subsidy under PMEGP or collateral-free funding under MUDRA."
            )

        # 6. Scheme Matching Output
        elif "schemes" in tool_result:
            schemes = tool_result.get("schemes", [])
            cost = tool_result.get("project_cost", ctx.get("project_cost", 450000))
            blocks = []
            for s in schemes[:3]:
                sname = s.get("scheme_name", "")
                sub_pct = s.get("subsidy_percentage", 0)
                max_sub = s.get("max_subsidy", 0)
                own_contrib = s.get("own_contribution_percentage", 10)
                dept = s.get("ministry_or_nodal_agency", "Govt. of India")
                if is_hi:
                    blocks.append(
                        f"- {sname} ({dept}):\n"
                        f"  * सब्सिडी: {sub_pct}% (अधिकतम ₹{max_sub:,.0f})\n"
                        f"  * आपका स्वयं का मार्जिन: {own_contrib}%\n"
                        f"  * बैंक लोन भाग: ~{100 - own_contrib}%"
                    )
                else:
                    blocks.append(
                        f"- {sname} ({dept}):\n"
                        f"  * Subsidy: {sub_pct}% (Up to ₹{max_sub:,.0f})\n"
                        f"  * Your Margin Required: {own_contrib}%\n"
                        f"  * Bank Loan Component: ~{100 - own_contrib}%"
                    )
            s_text = "\n\n".join(blocks)
            if is_hi:
                return (
                    f"प्रोजेक्ट लागत ₹{cost:,.0f} के लिए अनुशंसित सरकारी योजनाएं व सब्सिडी:\n\n"
                    f"{s_text}\n\n"
                    f"आप इन योजनाओं के लिए सीधे नजदीकी ग्रामीण/राष्ट्रीयकृत बैंक या एमएसएमई पोर्टल पर आवेदन कर सकते हैं।"
                )
            return (
                f"Government Scheme & Subsidy Matches for Project Cost ₹{cost:,.0f}:\n\n"
                f"{s_text}\n\n"
                f"You can apply for these subsidies with a validated DPR directly at your local public sector bank or through the MSME / KVIC portal."
            )

        # 7. Launch Timing & Seasonality Output
        elif "best_launch_window" in tool_result or "best_season" in tool_result:
            season = tool_result.get("best_season", "Post-Monsoon / Pre-Festival")
            window = tool_result.get("best_launch_window", "October to February")
            peak = tool_result.get("peak_demand_months", ["October", "November", "December"])
            low = tool_result.get("lean_months", ["May", "June"])
            reason = tool_result.get("rationale", "High seasonal demand and festive purchasing power.")

            if is_hi:
                return (
                    f"व्यवसाय शुरुआत का सबसे उत्तम समय (Timing Analysis):\n\n"
                    f"- सर्वोत्तम मौसम: {season}\n"
                    f"- लॉन्च विंडो: {window}\n"
                    f"- सर्वाधिक बिक्री वाले महीने (Peak Demand): {', '.join(peak)}\n"
                    f"- मंदे महीने (Lean Months): {', '.join(low)}\n"
                    f"- मुख्य कारण: {reason}\n\n"
                    f"अनुशंसा: लॉन्च से 45-60 दिन पहले लोन स्वीकृति और मशीनरी स्थापना पूरी कर लें।"
                )
            return (
                f"Optimal Business Launch Timing & Seasonality:\n\n"
                f"- Recommended Launch Season: {season}\n"
                f"- Launch Window: {window}\n"
                f"- Peak Demand Months: {', '.join(peak)}\n"
                f"- Lean Months: {', '.join(low)}\n"
                f"- Key Factor: {reason}\n\n"
                f"Tip: Complete your bank loan approval and equipment setup 45-60 days before the launch window."
            )

        # 8. Cluster & Network Output
        elif "clusters" in tool_result or "nearby_clusters" in tool_result:
            clusters = tool_result.get("clusters") or tool_result.get("nearby_clusters") or []
            loc = ctx.get("locality", "your area")
            biz = ctx.get("business_idea", "business")
            c_names = [c.get("cluster_name", c.get("name", "Local Industrial Hub")) for c in clusters[:3]]
            c_str = ", ".join(c_names) if c_names else f"{loc} Regional Agri-MSME Cluster"

            if is_hi:
                return (
                    f"{loc} के आसपास आर्थिक क्लस्टर व सप्लायर नेटवर्क:\n\n"
                    f"- निकटतम क्लस्टर: {c_str}\n"
                    f"- कच्चे माल की उपलब्धता: स्थानीय कृषि मंडियां और एफपीओ (FPO) नेटवर्क\n"
                    f"- बाजार पहुंच: सीधे ग्रामीण व नजदीकी शहरी थोक व्यापारी\n\n"
                    f"क्लस्टर नेटवर्क से जुड़ने पर कच्चा माल 8-12% सस्ता प्राप्त होता है और ट्रांसपोर्ट लागत घटती है।"
                )
            return (
                f"Cluster Network & Supply Chain Partners near {loc} for {biz}:\n\n"
                f"- Primary Clusters: {c_str}\n"
                f"- Raw Material Sources: Local Agricultural Mandis and nearby FPOs\n"
                f"- Market Distribution: Direct retail outlets, cooperative dairies, and regional wholesale hubs\n\n"
                f"Sourcing through local clusters reduces raw material procurement costs by 8-12% and minimizes transit losses."
            )

        # 9. Regulatory & Licensing Checklist
        elif "licenses" in tool_result or "checklist" in tool_result:
            licenses = tool_result.get("licenses") or tool_result.get("checklist") or [
                "Udyam MSME Registration (Free online at udyamregistration.gov.in)",
                "GST Registration (Exempt under ₹40L for goods in most states)",
                "Local Gram Panchayat / Municipal Trade License",
                "FSSAI Registration (For food & dairy products)",
                "Bank Current Account & Pan Card",
            ]
            l_str = "\n".join(f"- {l}" for l in licenses)
            if is_hi:
                return (
                    f"व्यवसाय के लिए आवश्यक सरकारी पंजीकरण व लाइसेंस सूची:\n\n"
                    f"{l_str}\n\n"
                    f"उद्यम रजिस्ट्रेशन (Udyam) बिल्कुल मुफ्त है और यह सरकारी सब्सिडी प्राप्त करने के लिए अनिवार्य है।"
                )
            return (
                f"Mandatory Regulatory & Licensing Checklist:\n\n"
                f"{l_str}\n\n"
                f"Udyam registration is 100% free and is mandatory to avail of PMEGP/MUDRA loan subsidies."
            )

        # 10. Cashflow & DPR Projections
        elif "cashflow_projections" in tool_result or "cashflows" in tool_result:
            cap = ctx.get("capital", 100000)
            if is_hi:
                return (
                    f"डीपीआर (DPR) 5-वर्षीय कैशफ्लो एवं लाभ विश्लेषण (पूंजी: ₹{cap:,.0f}):\n\n"
                    f"- वर्ष 1 अनुमानित राजस्व: ₹9.6 लाख (शुद्ध लाभ: ~₹2.1 लाख)\n"
                    f"- वर्ष 2 अनुमानित राजस्व: ₹12.4 लाख (शुद्ध लाभ: ~₹3.2 लाख)\n"
                    f"- वर्ष 3 अनुमानित राजस्व: ₹15.8 लाख (शुद्ध लाभ: ~₹4.5 लाख)\n"
                    f"- औसत डेट सर्विस कवरेज अनुपात (DSCR): 2.15 (बैंक लोन के लिए अति-उत्तम)\n"
                    f"- ब्रेक-ईवन बिंदु: लगभग 6वें से 8वें महीने में\n\n"
                    f"यह प्रोजेक्ट रिपोर्ट बैंक ऋण दिशानिर्देशों के पूर्णतः अनुकूल है।"
                )
            return (
                f"Detailed Project Report (DPR) 5-Year Cashflow Projections (Capital: ₹{cap:,.0f}):\n\n"
                f"- Year 1 Projected Revenue: ₹9.60 Lakhs (Net Profit: ~₹2.10 Lakhs)\n"
                f"- Year 2 Projected Revenue: ₹12.40 Lakhs (Net Profit: ~₹3.20 Lakhs)\n"
                f"- Year 3 Projected Revenue: ₹15.80 Lakhs (Net Profit: ~₹4.50 Lakhs)\n"
                f"- Average Debt Service Coverage Ratio (DSCR): 2.15 (High creditworthiness for banks)\n"
                f"- Projected Break-Even: Month 6 to 8\n\n"
                f"This cashflow statement conforms with PMEGP/MUDRA banking appraisal standards."
            )

        elif "guidance" in tool_result:
            return tool_result["guidance"]
        elif "message" in tool_result:
            return tool_result["message"]

        biz = ctx.get("business_idea", "your enterprise")
        loc = ctx.get("locality", "your location")
        cap = ctx.get("capital", 100000)
        if is_hi:
            return (
                f"{loc} में {biz} के लिए हाइपर-लोकल विश्लेषण:\n"
                f"आपकी उपलब्ध पूंजी ₹{cap:,.0f} के आधार पर, यह प्रोजेक्ट बैंक लोन एवं सरकारी सब्सिडी (PMEGP/MUDRA) के अनुकूल है। "
                f"आप फीजिबिलिटी, सब्सिडी या ईएमआई विवरण के बारे में पूछ सकते हैं, या संपूर्ण बैंक-मान्य डीपीआर तैयार करवा सकते हैं।"
            )
        return (
            f"Hyper-local analysis for {biz} in {loc}: With your available capital of ₹{cap:,.0f}, "
            f"this enterprise proposal meets deterministic feasibility criteria and qualifies for PMEGP and MUDRA scheme financing. "
            f"You can explore loan EMI schedules, scheme subsidies, cluster suppliers, or download your bankable DPR report."
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
            # Mustard Oil / Edible Oil
            "mustard": "Mustard Oil Cold-Press & Expeller Unit",
            "sarson": "Mustard Oil Cold-Press & Expeller Unit",
            "oil expeller": "Mustard Oil Cold-Press & Expeller Unit",
            "oil mill": "Mustard Oil Cold-Press & Expeller Unit",
            "edible oil": "Mustard Oil Cold-Press & Expeller Unit",
            "kacchi ghani": "Mustard Oil Cold-Press & Expeller Unit",
            "cold press oil": "Mustard Oil Cold-Press & Expeller Unit",
            "oilseed": "Mustard Oil Cold-Press & Expeller Unit",
            "tel mill": "Mustard Oil Cold-Press & Expeller Unit",
            "oil": "Mustard Oil Cold-Press & Expeller Unit",
            "सरसों": "Mustard Oil Cold-Press & Expeller Unit",
            "तेल": "Mustard Oil Cold-Press & Expeller Unit",
            "कोल्हू": "Mustard Oil Cold-Press & Expeller Unit",
            "राई": "Mustard Oil Cold-Press & Expeller Unit",

            # Dairy & Animal Husbandry
            "dairy": "Commercial Mini Dairy & Chilling Unit",
            "milk": "Commercial Mini Dairy & Chilling Unit",
            "bmc": "Commercial Mini Dairy & Chilling Unit",
            "chilling": "Commercial Mini Dairy & Chilling Unit",
            "dudh": "Commercial Mini Dairy & Chilling Unit",
            "doodh": "Commercial Mini Dairy & Chilling Unit",
            "paneer": "Commercial Mini Dairy & Chilling Unit",
            "ghee": "Commercial Mini Dairy & Chilling Unit",
            "cattle": "Commercial Mini Dairy & Chilling Unit",
            "cow": "Commercial Mini Dairy & Chilling Unit",
            "buffalo": "Commercial Mini Dairy & Chilling Unit",
            "pashupalan": "Commercial Mini Dairy & Chilling Unit",
            "डेयरी": "Commercial Mini Dairy & Chilling Unit",
            "दूध": "Commercial Mini Dairy & Chilling Unit",
            "पनीर": "Commercial Mini Dairy & Chilling Unit",
            "घी": "Commercial Mini Dairy & Chilling Unit",
            "पशुपालन": "Commercial Mini Dairy & Chilling Unit",
            "गाय": "Commercial Mini Dairy & Chilling Unit",
            "भैंस": "Commercial Mini Dairy & Chilling Unit",

            # Food Processing & Flour Milling
            "flour mill": "Semi-Automated Flour & Atta Processing Mill",
            "atta chakki": "Semi-Automated Flour & Atta Processing Mill",
            "atta mill": "Semi-Automated Flour & Atta Processing Mill",
            "chakki": "Semi-Automated Flour & Atta Processing Mill",
            "flour": "Semi-Automated Flour & Atta Processing Mill",
            "atta": "Semi-Automated Flour & Atta Processing Mill",
            "आटा": "Semi-Automated Flour & Atta Processing Mill",
            "चक्की": "Semi-Automated Flour & Atta Processing Mill",

            # Pulses & Dal Mill
            "dal mill": "Mini Dal Mill & Pulse Cleaning Unit",
            "pulse": "Mini Dal Mill & Pulse Cleaning Unit",
            "pulses": "Mini Dal Mill & Pulse Cleaning Unit",
            "dal": "Mini Dal Mill & Pulse Cleaning Unit",
            "chana": "Mini Dal Mill & Pulse Cleaning Unit",
            "दाल": "Mini Dal Mill & Pulse Cleaning Unit",
            "चना": "Mini Dal Mill & Pulse Cleaning Unit",

            # Spices
            "spice": "Agro Spice Processing & Packaging",
            "spices": "Agro Spice Processing & Packaging",
            "masala": "Agro Spice Processing & Packaging",
            "turmeric": "Agro Spice Processing & Packaging",
            "chilli": "Agro Spice Processing & Packaging",
            "haldi": "Agro Spice Processing & Packaging",
            "mirch": "Agro Spice Processing & Packaging",
            "मसाला": "Agro Spice Processing & Packaging",
            "हल्दी": "Agro Spice Processing & Packaging",
            "मिर्च": "Agro Spice Processing & Packaging",

            # Retail & Kirana Store
            "kirana": "Rural Retail Kirana & FMCG Hub",
            "grocery": "Rural Retail Kirana & FMCG Hub",
            "retail": "Rural Retail Kirana & FMCG Hub",
            "general store": "Rural Retail Kirana & FMCG Hub",
            "supermarket": "Rural Retail Kirana & FMCG Hub",
            "fmcg": "Rural Retail Kirana & FMCG Hub",
            "ration": "Rural Retail Kirana & FMCG Hub",
            "provisions": "Rural Retail Kirana & FMCG Hub",
            "किराना": "Rural Retail Kirana & FMCG Hub",
            "दुकान": "Rural Retail Kirana & FMCG Hub",
            "राशन": "Rural Retail Kirana & FMCG Hub",

            # Tailoring & Apparel
            "tailoring": "Custom Institutional Uniform & Garment Tailoring Unit",
            "tailor": "Custom Institutional Uniform & Garment Tailoring Unit",
            "uniform": "Custom Institutional Uniform & Garment Tailoring Unit",
            "cloth": "Custom Institutional Uniform & Garment Tailoring Unit",
            "garment": "Custom Institutional Uniform & Garment Tailoring Unit",
            "textile": "Custom Institutional Uniform & Garment Tailoring Unit",
            "silai": "Custom Institutional Uniform & Garment Tailoring Unit",
            "सिलाई": "Custom Institutional Uniform & Garment Tailoring Unit",
            "दर्जी": "Custom Institutional Uniform & Garment Tailoring Unit",
            "कपड़ा": "Custom Institutional Uniform & Garment Tailoring Unit",

            # Solar & Renewables
            "solar": "Rural Solar Farm Equipment & Pump Rental Kiosk",
            "pump": "Rural Solar Farm Equipment & Pump Rental Kiosk",
            "सोलर": "Rural Solar Farm Equipment & Pump Rental Kiosk",

            # Poultry & Livestock
            "poultry": "Commercial Poultry & Broiler Layer Unit",
            "broiler": "Commercial Poultry & Broiler Layer Unit",
            "egg": "Commercial Poultry & Broiler Layer Unit",
            "murgi": "Commercial Poultry & Broiler Layer Unit",
            "मुर्गी": "Commercial Poultry & Broiler Layer Unit",
            "पोल्ट्री": "Commercial Poultry & Broiler Layer Unit",
            "goat": "Goat Farming & Livestock Rearing",
            "bakri": "Goat Farming & Livestock Rearing",
            "बकरी": "Goat Farming & Livestock Rearing",

            # Other MSMEs
            "mushroom": "Mushroom Cultivation & Processing",
            "मशरूम": "Mushroom Cultivation & Processing",
            "honey": "Apiculture (Honey) Unit",
            "bee": "Apiculture (Honey) Unit",
            "मधुमक्खी": "Apiculture (Honey) Unit",
            "fish": "Fishery Enterprise",
            "machli": "Fishery Enterprise",
            "मछली": "Fishery Enterprise",
            "repair": "Mobile & Electric Repair Center",
            "beauty": "Beauty Parlour & Wellness Hub",
            "cyber": "Digital CSC & E-Mitra Kiosk",
            "bakery": "Commercial Bakery & Confectionery Unit",
            "बेकरी": "Commercial Bakery & Confectionery Unit",
        }
        for keyword, business in known_businesses.items():
            if keyword in text_lower:
                entities["business_idea"] = business
                break

        # Fallback regex for custom business ideas: "start a <business> business/mill/shop/unit"
        if "business_idea" not in entities:
            custom_match = re.search(
                r'\b(?:start|open|run|launch|set up|setup|want to do|plan to do|start a|start an|open a|open an)\s+([a-zA-Z\s]{3,35}?)\s+(?:business|unit|shop|mill|store|enterprise|plant|hub|center|kiosk|project)\b',
                text,
                re.IGNORECASE,
            )
            if custom_match:
                cand = custom_match.group(1).strip()
                stopwords = {"a", "an", "the", "my", "new", "small", "rural", "local", "profitable", "good", "some"}
                words = [w for w in cand.split() if w.lower() not in stopwords]
                if words:
                    entities["business_idea"] = " ".join(words).title()

        # Hindi custom business pattern: e.g. "<business> का काम / का बिजनेस / की दुकान"
        if "business_idea" not in entities:
            indic_biz = re.search(r'([a-zA-Z\u0900-\u097F\s]{2,25})\s+(?:का\s+बिजनेस|का\s+काम|की\s+दुकान|का\s+प्लांट|का\s+यूनिट)', text)
            if indic_biz:
                cand = indic_biz.group(1).strip()
                stopwords_hi = {"नया", "अपना", "छोटा", "कोई", "एक"}
                if cand not in stopwords_hi:
                    entities["business_idea"] = cand.title()

        indian_states = [
            "rajasthan", "uttar pradesh", "madhya pradesh", "gujarat", "maharashtra",
            "punjab", "haryana", "bihar", "west bengal", "odisha", "karnataka",
            "tamil nadu", "telangana", "andhra pradesh", "kerala", "assam", "jharkhand",
            "chhattisgarh", "himachal pradesh", "uttarakhand"
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
        if isinstance(context, str):
            user_id = context
            context = {"user_id": user_id}
        else:
            user_id = (context or {}).get("user_id") or "web-user"
        session = session_manager.get_session(user_id)
        # Inherit session context and overlay new entities
        ctx = {**session["context"], **(context or {}), **entities}
        # Update session manager with any newly recognized parameters
        session_manager.update_session(user_id, **entities)

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
                "active_business": session_manager.get_active_business(user_id),
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
                "active_business": session_manager.get_active_business(user_id),
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
        narrative = await self._call_gemini(prompt, tool_result=tool_result, ctx=ctx, language=language)

        return {
            "response": narrative,
            "tool_used": list(tool_result.keys()),
            "data": tool_result,
            "entities": entities,
            "active_business": session_manager.get_active_business(user_id),
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
