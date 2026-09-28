from typing import List, Dict, Any
from app.models.schemas import SchemeRecommendation, SocialCategoryEnum, GenderEnum

OFFICIAL_SCHEMES: List[Dict[str, Any]] = [
    {
        "id": "pmegp",
        "name": "Prime Minister's Employment Generation Programme (PMEGP)",
        "ministry": "Ministry of Micro, Small and Medium Enterprises (MSME)",
        "official_url": "https://www.kviconline.gov.in/pmegpeportal",
        "max_manufacturing_cost": 5000000.0,
        "max_service_cost": 2000000.0,
        "margin_general": 10.0,
        "margin_special": 5.0,
        "subsidy_rural_special": 35.0,
        "subsidy_rural_general": 25.0,
        "subsidy_urban_special": 25.0,
        "subsidy_urban_general": 15.0,
        "eligible_sectors": ["Manufacturing", "Service", "Food Processing", "Dairy", "Textiles", "Agri-allied", "General"],
        "required_docs": [
            "Aadhaar Card", "PAN Card", "Caste Certificate (if applicable)", "Detailed Project Report (DPR)", "Rural Area Certificate", "Educational Qualification Certificate"
        ],
        "application_process": "Online via KVIC portal -> District Level Task Force Committee (DLTFC) scrutiny -> Bank sanction -> EDP training",
    },
    {
        "id": "pmfme",
        "name": "PM Formalisation of Micro food processing Enterprises (PMFME)",
        "ministry": "Ministry of Food Processing Industries (MoFPI)",
        "official_url": "https://pmfme.mofpi.gov.in/",
        "max_subsidy": 1000000.0,
        "subsidy_percentage": 35.0,
        "margin_required": 10.0,
        "eligible_sectors": ["Food Processing", "Dairy Processing", "Spice Grinding", "Oil Extraction", "Bakery", "Pickle & Jam", "Flour Mill"],
        "required_docs": [
            "Aadhaar Card", "PAN Card", "FSSAI License / Registration", "DPR for Food Processing Unit", "Bank Account Statement (6 months)"
        ],
        "application_process": "Apply online at PMFME portal -> District Resource Person (DRP) assistance -> District Level Committee -> Bank approval",
    },
    {
        "id": "pm_mudra_shishu",
        "name": "Pradhan Mantri MUDRA Yojana (Shishu Loan)",
        "ministry": "Department of Financial Services, Ministry of Finance",
        "official_url": "https://www.mudra.org.in/",
        "min_loan": 5000.0,
        "max_loan": 50000.0,
        "margin_required": 0.0,
        "subsidy_percentage": 0.0,
        "eligible_sectors": ["Retail", "Small Shop", "Artisan", "Micro Service", "Tailoring", "Street Vending"],
        "required_docs": ["Aadhaar Card", "Voter ID / Driving License", "Passport Size Photos", "Business Quotation"],
        "application_process": "Direct application via public/commercial bank, RRBs, or Udyamimitra portal with no collateral required.",
    },
    {
        "id": "pm_mudra_kishore",
        "name": "Pradhan Mantri MUDRA Yojana (Kishore Loan)",
        "ministry": "Department of Financial Services, Ministry of Finance",
        "official_url": "https://www.mudra.org.in/",
        "min_loan": 50000.0,
        "max_loan": 500000.0,
        "margin_required": 15.0,
        "subsidy_percentage": 0.0,
        "eligible_sectors": ["Retail", "Trading", "Dairy", "Food Processing", "Services", "Manufacturing", "Workshop"],
        "required_docs": ["Identity Proof", "Address Proof", "Business Proof / Registration", "6 Months Bank Statement", "Quotation for Machinery"],
        "application_process": "Direct application via public/commercial bank, cooperative bank, or Udyamimitra portal.",
    },
    {
        "id": "pm_mudra_tarun",
        "name": "Pradhan Mantri MUDRA Yojana (Tarun Loan)",
        "ministry": "Department of Financial Services, Ministry of Finance",
        "official_url": "https://www.mudra.org.in/",
        "min_loan": 500000.0,
        "max_loan": 2000000.0,
        "margin_required": 15.0,
        "subsidy_percentage": 0.0,
        "eligible_sectors": ["Small Enterprises", "Manufacturing", "Agri-tech", "Commercial Vehicles", "Trading", "Processing"],
        "required_docs": ["KYC Documents", "ITR / Financial Statements", "Detailed Business Projection", "Machinery Quotation", "Udyam Registration"],
        "application_process": "Apply through commercial banks or SIDBI with collateral-free credit under CGFMU guarantee.",
    },
    {
        "id": "aif",
        "name": "Agriculture Infrastructure Fund (AIF)",
        "ministry": "Ministry of Agriculture & Farmers Welfare",
        "official_url": "https://agriinfra.dac.gov.in/",
        "max_loan": 20000000.0,
        "interest_subvention_pct": 3.0,
        "subvention_years": 7,
        "margin_required": 10.0,
        "subsidy_percentage": 0.0,
        "eligible_sectors": ["Agri-Infrastructure", "Cold Storage", "Warehousing", "Post-Harvest Management", "Sorting & Grading", "Primary Processing"],
        "required_docs": [
            "Aadhaar Card", "Land Ownership / Lease Documents", "Detailed Project Report (DPR)", "Udyam Registration", "Bank Account Statement"
        ],
        "application_process": "Register on AIF portal -> Online DPR submission -> Ministry verification -> Participating financial institution sanction",
    },
    {
        "id": "ahidf",
        "name": "Animal Husbandry Infrastructure Development Fund (AHIDF)",
        "ministry": "Department of Animal Husbandry and Dairying (DAHD)",
        "official_url": "https://ahidf.udyamimitra.in/",
        "loan_percentage": 90.0,
        "interest_subvention_pct": 3.0,
        "subvention_years": 8,
        "moratorium_years": 2,
        "margin_required": 10.0,
        "subsidy_percentage": 0.0,
        "eligible_sectors": ["Dairy Processing", "Value Added Dairy Products", "Meat Processing", "Animal Feed Plant", "Breed Improvement"],
        "required_docs": [
            "Entity Registration", "DPR with Financial Viability", "Land Ownership / Lease Agreement", "Pollution Clearance", "PAN and KYC"
        ],
        "application_process": "Online application on AHIDF Udyamimitra portal -> DAHD appraisal -> Lending bank appraisal & disbursement",
    },
    {
        "id": "stand_up_india",
        "name": "Stand-Up India Scheme for Women and SC/ST",
        "ministry": "Department of Financial Services, Ministry of Finance",
        "official_url": "https://www.standupmitra.in/",
        "min_loan": 1000000.0,
        "max_loan": 10000000.0,
        "margin_required": 15.0,
        "subsidy_percentage": 0.0,
        "eligible_sectors": ["Manufacturing", "Services", "Agri-allied Activities", "Trading", "Greenfield Enterprise"],
        "required_docs": [
            "Proof of SC/ST or Women Entrepreneurship (>=51% stake)", "DPR", "KYC & Address Proof", "Pollution NOC (if applicable)", "Projected Balance Sheets"
        ],
        "application_process": "Apply via Stand-Up Mitra portal or directly at scheduled commercial banks for greenfield enterprises.",
    },
    {
        "id": "pm_kusum",
        "name": "PM-KUSUM Solar Agriculture Scheme",
        "ministry": "Ministry of New and Renewable Energy (MNRE)",
        "official_url": "https://pmkusum.mnre.gov.in/",
        "subsidy_percentage": 60.0,
        "margin_required": 10.0,
        "eligible_sectors": ["Solar Agriculture Pump", "Solar Farming", "Solar Cold Storage", "Renewable Energy Kiosk", "Rural Solar Microgrid"],
        "required_docs": [
            "Land Revenue Records (Jamabandi/Khasra)", "Aadhaar Card", "Electricity Bill / DISCOM NOC", "Bank Account Details"
        ],
        "application_process": "State nodal agency (e.g., RREC) portal application -> Vendor allotment -> Installation -> Subsidy release via DBT",
    },
    {
        "id": "nlm",
        "name": "National Livestock Mission (NLM)",
        "ministry": "Department of Animal Husbandry and Dairying (DAHD)",
        "official_url": "https://nlm.udyamimitra.in/",
        "subsidy_percentage": 50.0,
        "max_subsidy": 5000000.0,
        "margin_required": 10.0,
        "eligible_sectors": ["Poultry Farm", "Goat Rearing", "Sheep Breeding", "Piggery", "Fodder & Feed Production"],
        "required_docs": [
            "DPR with technical layout", "Land availability proof (owned/leased)", "Experience / Training Certificate in Animal Husbandry", "Bank Consent Letter"
        ],
        "application_process": "Online submission via NLM portal -> State Implementing Agency (SIA) recommendation -> State Level Committee -> Bank sanction & subsidy credit",
    },
    {
        "id": "pm_vishwakarma",
        "name": "PM Vishwakarma Scheme",
        "ministry": "Ministry of Micro, Small and Medium Enterprises (MSME)",
        "official_url": "https://pmvishwakarma.gov.in/",
        "toolkit_grant": 15000.0,
        "first_tranche_loan": 100000.0,
        "second_tranche_loan": 200000.0,
        "concessional_interest_pct": 5.0,
        "subsidy_percentage": 0.0,
        "margin_required": 0.0,
        "eligible_sectors": ["Tailor", "Carpenter", "Blacksmith", "Potter", "Cobbler", "Basket Weaver", "Traditional Artisan", "Handicrafts"],
        "required_docs": [
            "Aadhaar Card", "Mobile Number linked with Aadhaar", "Bank Account Details", "Ration Card / Proof of Traditional Craft"
        ],
        "application_process": "Gram Panchayat / ULB biometric verification at CSC -> Skill assessment training -> ₹15,000 toolkit e-voucher -> Collateral-free credit at 5%",
    },
    {
        "id": "cgtmse",
        "name": "Credit Guarantee Fund Trust for Micro and Small Enterprises (CGTMSE)",
        "ministry": "Ministry of MSME & SIDBI",
        "official_url": "https://www.cgtmse.in/",
        "max_loan": 50000000.0,
        "guarantee_coverage_pct": 85.0,
        "margin_required": 15.0,
        "subsidy_percentage": 0.0,
        "eligible_sectors": ["Manufacturing", "Service Sector", "Retail Trade", "Wholesale Trade", "Education/Healthcare Institutions"],
        "required_docs": [
            "Udyam Registration", "DPR and Business Plan", "Audited Financials (for existing) / Projections", "KYC of Promoters"
        ],
        "application_process": "Borrower applies to scheduled commercial bank / NBFC requesting collateral-free loan under CGTMSE cover.",
    },
]

class SchemeEngine:
    @staticmethod
    def match_schemes(
        project_cost: float,
        business_category: str,
        social_category: SocialCategoryEnum = SocialCategoryEnum.GENERAL,
        gender: GenderEnum = GenderEnum.MALE,
        is_rural: bool = True,
    ) -> List[SchemeRecommendation]:
        recs: List[SchemeRecommendation] = []
        is_special = (
            social_category in [SocialCategoryEnum.SC, SocialCategoryEnum.ST, SocialCategoryEnum.OBC, SocialCategoryEnum.WOMEN]
            or gender == GenderEnum.FEMALE
        )
        cat_lower = business_category.lower()

        for s in OFFICIAL_SCHEMES:
            sid = s["id"]

            # 1. PMEGP
            if sid == "pmegp":
                if project_cost <= s["max_manufacturing_cost"]:
                    margin_pct = s["margin_special"] if is_special else s["margin_general"]
                    subsidy_pct = (
                        s["subsidy_rural_special"] if (is_rural and is_special)
                        else s["subsidy_rural_general"] if is_rural
                        else s["subsidy_urban_special"] if is_special
                        else s["subsidy_urban_general"]
                    )
                    max_sub = round(project_cost * (subsidy_pct / 100.0), 2)
                    recs.append(SchemeRecommendation(
                        scheme_name=s["name"],
                        ministry=s["ministry"],
                        official_url=s["official_url"],
                        eligibility_status="Eligible",
                        subsidy_percentage=subsidy_pct,
                        max_subsidy_amount=max_sub,
                        margin_required_percent=margin_pct,
                        why_matched=[
                            "Project cost fits statutory ceiling.",
                            f"Qualifies for {subsidy_pct}% {'rural' if is_rural else 'urban'} capital subsidy under MSME.",
                        ],
                        required_documents=s["required_docs"],
                        application_process=s["application_process"],
                    ))

            # 2. PMFME (Food Processing)
            elif sid == "pmfme":
                food_keywords = ["food", "dairy", "spice", "mill", "pickle", "bakery", "oil", "processing", "flour", "grain", "fruit", "vegetable"]
                if any(k in cat_lower for k in food_keywords):
                    sub_pct = s["subsidy_percentage"]
                    max_sub = min(round(project_cost * (sub_pct / 100.0), 2), s["max_subsidy"])
                    recs.append(SchemeRecommendation(
                        scheme_name=s["name"],
                        ministry=s["ministry"],
                        official_url=s["official_url"],
                        eligibility_status="Eligible",
                        subsidy_percentage=sub_pct,
                        max_subsidy_amount=max_sub,
                        margin_required_percent=s["margin_required"],
                        why_matched=[
                            "Micro food processing unit eligible for MoFPI 35% credit-linked capital subsidy.",
                            f"Capital subsidy capped up to ₹{s['max_subsidy']:,.0f}.",
                        ],
                        required_documents=s["required_docs"],
                        application_process=s["application_process"],
                    ))

            # 3. MUDRA Shishu (up to ₹50k)
            elif sid == "pm_mudra_shishu":
                if project_cost <= 75000.0:
                    recs.append(SchemeRecommendation(
                        scheme_name=s["name"],
                        ministry=s["ministry"],
                        official_url=s["official_url"],
                        eligibility_status="Eligible",
                        subsidy_percentage=0.0,
                        max_subsidy_amount=0.0,
                        margin_required_percent=0.0,
                        why_matched=["Zero-margin, collateral-free credit for micro starter loans up to ₹50,000."],
                        required_documents=s["required_docs"],
                        application_process=s["application_process"],
                    ))

            # 4. MUDRA Kishore (₹50k - ₹5L)
            elif sid == "pm_mudra_kishore":
                if 50000.0 <= project_cost <= 700000.0:
                    recs.append(SchemeRecommendation(
                        scheme_name=s["name"],
                        ministry=s["ministry"],
                        official_url=s["official_url"],
                        eligibility_status="Eligible",
                        subsidy_percentage=0.0,
                        max_subsidy_amount=0.0,
                        margin_required_percent=s["margin_required"],
                        why_matched=["Collateral-free commercial credit up to ₹5 Lakhs under MUDRA Kishore."],
                        required_documents=s["required_docs"],
                        application_process=s["application_process"],
                    ))

            # 5. MUDRA Tarun (₹5L - ₹20L)
            elif sid == "pm_mudra_tarun":
                if 500000.0 <= project_cost <= 2500000.0:
                    recs.append(SchemeRecommendation(
                        scheme_name=s["name"],
                        ministry=s["ministry"],
                        official_url=s["official_url"],
                        eligibility_status="Eligible",
                        subsidy_percentage=0.0,
                        max_subsidy_amount=0.0,
                        margin_required_percent=s["margin_required"],
                        why_matched=["Collateral-free expansion credit from ₹5 Lakhs to ₹20 Lakhs."],
                        required_documents=s["required_docs"],
                        application_process=s["application_process"],
                    ))

            # 6. Agriculture Infrastructure Fund (AIF)
            elif sid == "aif":
                agri_infra_kw = ["cold storage", "warehouse", "sorting", "grading", "post-harvest", "silo", "ripening", "agri infra", "supply chain"]
                if any(k in cat_lower for k in agri_infra_kw) and project_cost <= s["max_loan"]:
                    recs.append(SchemeRecommendation(
                        scheme_name=s["name"],
                        ministry=s["ministry"],
                        official_url=s["official_url"],
                        eligibility_status="Eligible",
                        subsidy_percentage=0.0,
                        max_subsidy_amount=0.0,
                        margin_required_percent=s["margin_required"],
                        why_matched=[
                            "3% annual interest subvention for up to 7 years on post-harvest infrastructure.",
                            "Credit guarantee coverage under CGTMSE paid by central fund.",
                        ],
                        required_documents=s["required_docs"],
                        application_process=s["application_process"],
                    ))

            # 7. Animal Husbandry Infrastructure Development Fund (AHIDF)
            elif sid == "ahidf":
                dairy_meat_kw = ["dairy", "chilling", "animal husbandry", "milk processing", "meat", "animal feed", "cattle feed"]
                if any(k in cat_lower for k in dairy_meat_kw) and project_cost >= 150000.0:
                    recs.append(SchemeRecommendation(
                        scheme_name=s["name"],
                        ministry=s["ministry"],
                        official_url=s["official_url"],
                        eligibility_status="Eligible",
                        subsidy_percentage=0.0,
                        max_subsidy_amount=0.0,
                        margin_required_percent=s["margin_required"],
                        why_matched=[
                            "3% annual interest subvention for up to 8 years on animal husbandry processing.",
                            "Up to 90% loan coverage from scheduled banks with 2-year statutory moratorium.",
                        ],
                        required_documents=s["required_docs"],
                        application_process=s["application_process"],
                    ))

            # 8. Stand-Up India (Women & SC/ST)
            elif sid == "stand_up_india":
                if is_special and 1000000.0 <= project_cost <= s["max_loan"]:
                    recs.append(SchemeRecommendation(
                        scheme_name=s["name"],
                        ministry=s["ministry"],
                        official_url=s["official_url"],
                        eligibility_status="Eligible",
                        subsidy_percentage=0.0,
                        max_subsidy_amount=0.0,
                        margin_required_percent=s["margin_required"],
                        why_matched=[
                            "Dedicated greenfield funding for SC/ST and Women entrepreneurs (₹10 Lakhs to ₹1 Crore).",
                            "Blended with state subsidy schemes to minimize promoter equity.",
                        ],
                        required_documents=s["required_docs"],
                        application_process=s["application_process"],
                    ))

            # 9. PM-KUSUM (Solar Agriculture & Pumps)
            elif sid == "pm_kusum":
                solar_kw = ["solar", "pump", "irrigation", "renewable", "photovoltaic", "energy kiosk"]
                if any(k in cat_lower for k in solar_kw):
                    sub_pct = s["subsidy_percentage"]
                    max_sub = round(project_cost * (sub_pct / 100.0), 2)
                    recs.append(SchemeRecommendation(
                        scheme_name=s["name"],
                        ministry=s["ministry"],
                        official_url=s["official_url"],
                        eligibility_status="Eligible",
                        subsidy_percentage=sub_pct,
                        max_subsidy_amount=max_sub,
                        margin_required_percent=s["margin_required"],
                        why_matched=[
                            "60% combined capital subsidy (30% central CFA + 30% state subsidy) for solar agriculture.",
                            "Bank loan covers 30%; farmer promoter contribution capped at 10%.",
                        ],
                        required_documents=s["required_docs"],
                        application_process=s["application_process"],
                    ))

            # 10. National Livestock Mission (NLM)
            elif sid == "nlm":
                livestock_kw = ["goat", "sheep", "poultry", "piggery", "livestock", "fodder", "silage"]
                if any(k in cat_lower for k in livestock_kw):
                    sub_pct = s["subsidy_percentage"]
                    max_sub = min(round(project_cost * (sub_pct / 100.0), 2), s["max_subsidy"])
                    recs.append(SchemeRecommendation(
                        scheme_name=s["name"],
                        ministry=s["ministry"],
                        official_url=s["official_url"],
                        eligibility_status="Eligible",
                        subsidy_percentage=sub_pct,
                        max_subsidy_amount=max_sub,
                        margin_required_percent=s["margin_required"],
                        why_matched=[
                            "50% capital subsidy on livestock breed multiplication and feed/fodder infrastructure.",
                            f"Subsidy amount credited up to ₹{s['max_subsidy']:,.0f}.",
                        ],
                        required_documents=s["required_docs"],
                        application_process=s["application_process"],
                    ))

            # 11. PM Vishwakarma (Traditional Crafts & Artisans)
            elif sid == "pm_vishwakarma":
                artisan_kw = ["tailor", "stitching", "carpenter", "blacksmith", "potter", "cobbler", "artisan", "handicraft", "weaver"]
                if any(k in cat_lower for k in artisan_kw) and project_cost <= 300000.0:
                    recs.append(SchemeRecommendation(
                        scheme_name=s["name"],
                        ministry=s["ministry"],
                        official_url=s["official_url"],
                        eligibility_status="Eligible",
                        subsidy_percentage=0.0,
                        max_subsidy_amount=s["toolkit_grant"],
                        margin_required_percent=0.0,
                        why_matched=[
                            "₹15,000 modern toolkit incentive grant credited to beneficiary.",
                            "Collateral-free credit (Tranche 1: ₹1L, Tranche 2: ₹2L) at concessional 5% interest rate.",
                        ],
                        required_documents=s["required_docs"],
                        application_process=s["application_process"],
                    ))

            # 12. CGTMSE (Collateral Guarantee for Micro & Small Enterprises)
            elif sid == "cgtmse":
                if 200000.0 <= project_cost <= s["max_loan"]:
                    recs.append(SchemeRecommendation(
                        scheme_name=s["name"],
                        ministry=s["ministry"],
                        official_url=s["official_url"],
                        eligibility_status="Eligible",
                        subsidy_percentage=0.0,
                        max_subsidy_amount=0.0,
                        margin_required_percent=s["margin_required"],
                        why_matched=[
                            "Up to 85% credit guarantee coverage for collateral-free bank loans.",
                            "Enables MSME bank financing without third-party guarantee or immovable property mortgage.",
                        ],
                        required_documents=s["required_docs"],
                        application_process=s["application_process"],
                    ))

        return recs
