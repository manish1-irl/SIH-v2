from typing import List, Dict, Any
from app.models.schemas import (
    ClusterOpportunity,
    ClusterNode,
    ClusterHub,
    ClusterNetworkResponse,
)

class ClusterEngine:
    @staticmethod
    def find_clusters(locality: str, business_category: str) -> List[ClusterOpportunity]:
        loc_display = locality.strip().title() if locality else "Bassi"
        cat_lower = business_category.lower() if business_category else "dairy"
        
        if "mustard" in cat_lower or "oil" in cat_lower or "processing" in cat_lower:
            name = f"{loc_display} Agro-Processing & Oilseed Cluster"
            comp = [
                "Mustard Seed Farmer Producer Organization (FPO)",
                "Solar Heated Oil Expeller & Milling Yard",
                "De-oiled Cake & Animal Feed Aggregation Depot",
            ]
            benefits = [
                "15% combined freight discount on mandi bulk grain transit",
                "Guaranteed buyer contract for byproduct cattle cake residue",
            ]
        elif "textile" in cat_lower or "handicraft" in cat_lower:
            name = f"{loc_display} Handloom & Artisanal Cluster"
            comp = [
                "Natural Indigo & Herbal Dyeing Cooperative",
                "Raw Cotton Fabric Direct Weaver Guild",
                "Shared Solar Fabric Steaming & Finishing Facility",
            ]
            benefits = [
                "18% group savings on certified organic dye procurement",
                "Joint booth representation at regional handicraft expos",
            ]
        else:
            name = f"{loc_display} Dairy & Livestock Economic Ring"
            comp = [
                "Green Fodder & Silage Collective",
                "Village Level Bulk Milk Chilling (BMC) Center",
                "Shared Refrigerated Milk Tanker Logistics",
            ]
            benefits = [
                "Bulk purchase discount on cattle feed saving ~14%",
                "Shared refrigerated logistics eliminating curdling losses",
            ]

        return [
            ClusterOpportunity(
                cluster_name=name,
                complementary_businesses=comp,
                shared_benefits=benefits,
                nearby_nodes_count=4,
            )
        ]

    @staticmethod
    def get_cluster_network(
        locality: str = "Bassi",
        business_category: str = "dairy",
        enterprise_name: str = "Ganga Dairy Parlour",
    ) -> ClusterNetworkResponse:
        loc_display = locality.strip().title() if locality else "Local"
        cat_lower = business_category.lower() if business_category else "general"
        ent_name = enterprise_name.strip() if enterprise_name else f"{loc_display} Enterprise"

        # 1. Mustard Oil / Oilseed Expeller
        if any(k in cat_lower for k in ["mustard", "oil", "expeller", "sarson", "tel"]):
            hub = ClusterHub(
                name=ent_name,
                sector="Agro-Processing & Oilseed Expeller • 10% Concessional Credit",
                locality_node=f"{loc_display} Mandi Bypass (Core Hub)",
                seeking="Seeking 800 kg/day premium raw mustard seed supply",
                daily_processing_volume="1,200 kg Seed/Day",
                max_peers=4,
            )
            nodes = [
                ClusterNode(
                    id="node-upstream-oil",
                    role="UPSTREAM PRODUCER",
                    title=f"{loc_display} Oilseed FPO Farmer Node #14",
                    category="Raw Mustard Seed Producer Collective",
                    distance_km=2.5,
                    capacity_metric="1,500 kg Daily Harvest",
                    rating=4.9,
                    icon_type="truck",
                    synergy_benefit="Can supply verified high-oil-content seed at ₹180/quintal direct farmgate discount.",
                    estimated_monthly_savings=16200.0,
                ),
                ClusterNode(
                    id="node-wholesale-oil",
                    role="INPUT WHOLESALE",
                    title="Regional Mandi Spares & Filter Depot #08",
                    category="Mandi Distributor (Filter Cloth & Machinery Spares)",
                    distance_km=3.8,
                    capacity_metric="Mandi Direct Stock",
                    rating=5.0,
                    icon_type="package",
                    synergy_benefit="Joint procurement of expeller screw parts & food-grade packaging bags saves 15% cash margin.",
                    estimated_monthly_savings=7500.0,
                ),
                ClusterNode(
                    id="node-peer-oil",
                    role="PEER RETAILER",
                    title=f"{loc_display} Bio-Feed & Cattle Cake Merchant #21",
                    category="Cattle Feed & Byproduct Trading Unit",
                    distance_km=4.2,
                    capacity_metric="600 kg Daily Offtake",
                    rating=4.8,
                    icon_type="store",
                    synergy_benefit="Offers standing advance purchase contract for 100% of residual oilcake at spot premium.",
                    estimated_monthly_savings=11000.0,
                ),
                ClusterNode(
                    id="node-infra-oil",
                    role="INFRASTRUCTURE SHARING",
                    title=f"{loc_display} Solar Agro-Drying Yard #02",
                    category="NABARD Solar Grain Drying Platform",
                    distance_km=4.9,
                    capacity_metric="25 MT Solar Platform",
                    rating=4.9,
                    icon_type="snowflake",
                    synergy_benefit="Offers moisture reduction bed access at ₹0.30/kg shared fee, preventing seed rancidity.",
                    estimated_monthly_savings=8500.0,
                ),
            ]
            perks = [
                "Flat ₹180/Quintal farm-direct seed discount",
                "Guaranteed 100% byproduct oilcake offtake",
                "Shared solar drying yard eliminating spoilage",
                "Bulk 15% discount on food-grade tins and filter spares",
            ]
            unlocked_note = "Connecting all 4 local nodes saves approximately ₹43,200/month in input, logistics, and processing overhead."

        # 2. Retail Kirana & FMCG Grocery
        elif any(k in cat_lower for k in ["kirana", "retail", "grocery", "fmcg", "store", "shop"]):
            hub = ClusterHub(
                name=ent_name,
                sector="Organized FMCG Retail & Daily Staples • Priority Credit",
                locality_node=f"{loc_display} Bazaar Chowk (Core Retail Node)",
                seeking="Seeking collective FMCG distributor wholesale tier",
                daily_processing_volume="85 Daily Orders",
                max_peers=4,
            )
            nodes = [
                ClusterNode(
                    id="node-upstream-kirana",
                    role="UPSTREAM PRODUCER",
                    title=f"{loc_display} Farmers Direct Grain & Pulse Guild #04",
                    category="Direct Grain & Pulses Farmer Collective",
                    distance_km=3.1,
                    capacity_metric="3 MT Monthly Grains",
                    rating=4.9,
                    icon_type="truck",
                    synergy_benefit="Supplies unpolished pulses and stone-ground spices at direct mandi benchmark prices, bypassing brokers.",
                    estimated_monthly_savings=12500.0,
                ),
                ClusterNode(
                    id="node-wholesale-kirana",
                    role="INPUT WHOLESALE",
                    title="District FMCG & Personal Care C&F Depot #11",
                    category="Authorized Master Distributor (FMCG Brands)",
                    distance_km=4.5,
                    capacity_metric="Direct C&F Warehouse",
                    rating=5.0,
                    icon_type="package",
                    synergy_benefit="Pools minimum order quantity (MOQ) with 3 peer stores to unlock tier-1 distributor margins (extra 4.5% margin).",
                    estimated_monthly_savings=14800.0,
                ),
                ClusterNode(
                    id="node-peer-kirana",
                    role="PEER RETAILER",
                    title=f"{loc_display} Dairy & Fresh Produce Corner #19",
                    category="Perishable Dairy & Cold Beverages Retailer",
                    distance_km=1.2,
                    capacity_metric="Daily Perishable Flow",
                    rating=4.8,
                    icon_type="store",
                    synergy_benefit="Cross-promotes breakfast and staple bundles; shares excess cold storage crates during weekend rush.",
                    estimated_monthly_savings=6800.0,
                ),
                ClusterNode(
                    id="node-infra-kirana",
                    role="INFRASTRUCTURE SHARING",
                    title=f"{loc_display} Micro-Logistics EV Delivery Fleet #03",
                    category="Shared Electric Cargo-Rickshaw Service",
                    distance_km=2.0,
                    capacity_metric="4 EV Loaders",
                    rating=4.9,
                    icon_type="truck",
                    synergy_benefit="Shares daily scheduled home delivery runs at ₹15 per drop rather than keeping a dedicated full-time driver.",
                    estimated_monthly_savings=9200.0,
                ),
            ]
            perks = [
                "Tier-1 master distributor pricing via pooled MOQs",
                "Direct farmgate pulse and spice procurement discounts",
                "Shared EV home delivery fleet reducing last-mile costs",
                "Refrigerated perishables inventory overflow backup",
            ]
            unlocked_note = "Connecting all 4 retail cluster nodes saves approximately ₹43,300/month in COGS and home delivery logistics."

        # 3. Flour Mill / Atta Chakki / Food Processing
        elif any(k in cat_lower for k in ["flour", "atta", "chakki", "spice", "masala", "grain", "dal mill", "pulverizer"]):
            hub = ClusterHub(
                name=ent_name,
                sector="Agro-Processing & Milling Hub • PMFME Scheme",
                locality_node=f"{loc_display} Mandi Arterial (Processing Node)",
                seeking="Seeking 600 kg/day local wheat & spice grain supply",
                daily_processing_volume="800 kg Grains/Day",
                max_peers=4,
            )
            nodes = [
                ClusterNode(
                    id="node-upstream-grain",
                    role="UPSTREAM PRODUCER",
                    title=f"{loc_display} Wheat & Grain Growers Cooperative #07",
                    category="Primary Cereal & Millet Producer Group",
                    distance_km=2.8,
                    capacity_metric="2,000 kg Daily Harvest",
                    rating=4.9,
                    icon_type="truck",
                    synergy_benefit="Supplies graded Sharbati & durum wheat directly from threshing yards with zero middleman margin.",
                    estimated_monthly_savings=15000.0,
                ),
                ClusterNode(
                    id="node-wholesale-grain",
                    role="INPUT WHOLESALE",
                    title="Regional Chakki Stone & Motor Spares Agency #02",
                    category="Milling Equipment & Packaging Consumables",
                    distance_km=5.0,
                    capacity_metric="Milling Depot",
                    rating=5.0,
                    icon_type="package",
                    synergy_benefit="Bulk purchase of woven HDPE flour sacks and flint stone redressing services at 20% group rebate.",
                    estimated_monthly_savings=7200.0,
                ),
                ClusterNode(
                    id="node-peer-grain",
                    role="PEER RETAILER",
                    title=f"{loc_display} Bakery & Community Kitchen Alliance #15",
                    category="Commercial Food & Bakery Enterprise",
                    distance_km=3.4,
                    capacity_metric="400 kg Daily Flour Offtake",
                    rating=4.8,
                    icon_type="store",
                    synergy_benefit="Standing daily bulk order for fresh whole wheat flour at premium commercial contract pricing.",
                    estimated_monthly_savings=11500.0,
                ),
                ClusterNode(
                    id="node-infra-grain",
                    role="INFRASTRUCTURE SHARING",
                    title=f"{loc_display} APMC Solar Powered Grain Cleaning Shed #01",
                    category="Cooperative Gravity Separator & Destoner Yard",
                    distance_km=3.9,
                    capacity_metric="10 MT/Day Cleaning",
                    rating=4.9,
                    icon_type="snowflake",
                    synergy_benefit="Provides access to high-capacity industrial pre-cleaner screens at nominal ₹0.15/kg processing fee.",
                    estimated_monthly_savings=8800.0,
                ),
            ]
            perks = [
                "Farmgate direct wheat procurement discount",
                "Shared APMC mechanical grain cleaning and destoning",
                "Guaranteed daily bulk off-take with local bakery network",
                "Group purchasing of HDPE woven sacks and packaging",
            ]
            unlocked_note = "Connecting all 4 milling cluster nodes unlocks ₹42,500/month in procurement and processing efficiency."

        # 4. Apparel / Tailoring / Garments
        elif any(k in cat_lower for k in ["tailor", "apparel", "garment", "cloth", "boutique", "textile", "uniform"]):
            hub = ClusterHub(
                name=ent_name,
                sector="Textile & Apparel Enterprise • PMEGP Term Scheme",
                locality_node=f"{loc_display} Commercial Market (Design Studio)",
                seeking="Seeking collective fabric mill procurement contracts",
                daily_processing_volume="25 Garments/Day",
                max_peers=4,
            )
            nodes = [
                ClusterNode(
                    id="node-upstream-apparel",
                    role="UPSTREAM PRODUCER",
                    title=f"{loc_display} Handloom & Cotton Weaver Cluster #05",
                    category="Local Cotton & Khadi Fabric Weavers",
                    distance_km=3.6,
                    capacity_metric="500 Meters Weekly Fabric",
                    rating=4.9,
                    icon_type="truck",
                    synergy_benefit="Supplies certified authentic cotton and blended suiting fabric directly at mill-gate rates.",
                    estimated_monthly_savings=13500.0,
                ),
                ClusterNode(
                    id="node-wholesale-apparel",
                    role="INPUT WHOLESALE",
                    title="Regional Sewing Spares & Trims Warehouse #12",
                    category="Zippers, Buttons, Thread & Machine Needle Depot",
                    distance_km=4.2,
                    capacity_metric="Wholesale Trims Depot",
                    rating=5.0,
                    icon_type="package",
                    synergy_benefit="Consolidated orders of industrial threads, fusing rolls, and branded buttons at 25% trade discount.",
                    estimated_monthly_savings=6800.0,
                ),
                ClusterNode(
                    id="node-peer-apparel",
                    role="PEER RETAILER",
                    title=f"{loc_display} School & Institutional Uniform Syndicate #09",
                    category="Institutional Educational Supplier Group",
                    distance_km=2.7,
                    capacity_metric="2,500 Student Uniform Base",
                    rating=4.8,
                    icon_type="store",
                    synergy_benefit="Subcontracts high-volume school uniform and hospital linen stitching runs during peak seasons.",
                    estimated_monthly_savings=16000.0,
                ),
                ClusterNode(
                    id="node-infra-apparel",
                    role="INFRASTRUCTURE SHARING",
                    title=f"{loc_display} Common Facility Computerized Embroidery Lab #01",
                    category="PMEGP Common Service Embroidery Center",
                    distance_km=3.1,
                    capacity_metric="12-Head Multi-Needle Machine",
                    rating=4.9,
                    icon_type="snowflake",
                    synergy_benefit="Provides access to high-end computerized logo and monogram embroidery without buying the ₹8L machine.",
                    estimated_monthly_savings=11200.0,
                ),
            ]
            perks = [
                "Mill-gate pricing on bulk fabric rolls and cotton blends",
                "Shared access to multi-head computerized embroidery lab",
                "Subcontracted institutional school uniform stitching pipeline",
                "25% bulk savings on industrial threads, fusing, and zippers",
            ]
            unlocked_note = "Connecting all 4 apparel cluster nodes saves approximately ₹47,500/month in fabrication and tooling costs."

        # 5. Dairy & Livestock
        elif any(k in cat_lower for k in ["dairy", "milk", "cattle", "chilling", "animal"]):
            hub = ClusterHub(
                name=ent_name,
                sector="Commercial Dairy & Chilling Hub • AHIDF Concessional Credit",
                locality_node=f"{loc_display} Village Center (Core Node)",
                seeking="Seeking 150L daily raw milk supply",
                daily_processing_volume="350 Liters/Day",
                max_peers=4,
            )
            nodes = [
                ClusterNode(
                    id="node-upstream-dairy",
                    role="UPSTREAM PRODUCER",
                    title=f"{loc_display} Dairy Farm Node #14",
                    category="Raw Milk Producer (Cow & Buffalo)",
                    distance_km=2.8,
                    capacity_metric="200L Daily Output",
                    rating=4.9,
                    icon_type="truck",
                    synergy_benefit="Can supply steady 120L evening yield at ₹4/L wholesale discount.",
                    estimated_monthly_savings=14400.0,
                ),
                ClusterNode(
                    id="node-wholesale-dairy",
                    role="INPUT WHOLESALE",
                    title="Regional Mandi Feed & Mineral Depot #06",
                    category="Mandi Distributor (Mineral & Fodder)",
                    distance_km=3.5,
                    capacity_metric="Mandi Direct Stock",
                    rating=5.0,
                    icon_type="package",
                    synergy_benefit="Joint purchase of 20+ bags unlocks flat 12% cash discount on feed sacks.",
                    estimated_monthly_savings=6500.0,
                ),
                ClusterNode(
                    id="node-peer-dairy",
                    role="PEER RETAILER",
                    title=f"{loc_display} Paneer & Dairy Production Unit #22",
                    category="Dairy & Paneer Production Unit",
                    distance_km=4.1,
                    capacity_metric="80L Daily Surplus",
                    rating=4.8,
                    icon_type="store",
                    synergy_benefit="Looking to offload evening raw milk surplus at cost to avoid wastage.",
                    estimated_monthly_savings=7200.0,
                ),
                ClusterNode(
                    id="node-infra-dairy",
                    role="INFRASTRUCTURE SHARING",
                    title=f"{loc_display} Community BMC Chiller Hub #03",
                    category="Bulk Milk Chiller (1,000L Unit)",
                    distance_km=5.2,
                    capacity_metric="NABARD Cooperative",
                    rating=4.9,
                    icon_type="snowflake",
                    synergy_benefit="Offers 200L excess refrigerated slot capacity at ₹1.5/L/day shared fee.",
                    estimated_monthly_savings=9000.0,
                ),
            ]
            perks = [
                "₹4/Litre evening yield discount on direct village milk collection",
                "12% cash discount on bulk cattle mineral feed sacks",
                "Shared 200L refrigeration slot at ₹1.5/L/day preventing souring",
                "Zero-waste surplus re-routing during off-peak sweet sales",
            ]
            unlocked_note = "Connecting all 4 local peers unlocks up to ₹37,100/month in collective margin expansion and spoilage reduction."

        # 6. Universal MSME Fallback (Clean, authentic cluster network for ANY custom business)
        else:
            title_idea = business_category.strip().title() if business_category else "Local Enterprise"
            hub = ClusterHub(
                name=ent_name,
                sector=f"{title_idea} Cluster Hub • PMEGP / Priority MSME",
                locality_node=f"{loc_display} Commercial Zone (Central Unit)",
                seeking=f"Seeking raw materials & regional distribution partners",
                daily_processing_volume="Standard Commercial Output",
                max_peers=4,
            )
            nodes = [
                ClusterNode(
                    id="node-upstream-gen",
                    role="UPSTREAM PRODUCER",
                    title=f"{loc_display} Material & Components Guild #08",
                    category="Local Primary Sourcing & Supplies",
                    distance_km=3.2,
                    capacity_metric="Direct Local Sourcing",
                    rating=4.9,
                    icon_type="truck",
                    synergy_benefit="Direct local supply eliminates intermediary trade margins, saving 12% on input procurement.",
                    estimated_monthly_savings=12000.0,
                ),
                ClusterNode(
                    id="node-wholesale-gen",
                    role="INPUT WHOLESALE",
                    title="Regional Equipment Spares & Consumables Depot #03",
                    category="Consolidated Tools & Industrial Hardware Agency",
                    distance_km=4.8,
                    capacity_metric="Regional Master Depot",
                    rating=5.0,
                    icon_type="package",
                    synergy_benefit="Pooled purchasing with local cluster members secures wholesale tier discounts on consumable parts.",
                    estimated_monthly_savings=7800.0,
                ),
                ClusterNode(
                    id="node-peer-gen",
                    role="PEER RETAILER",
                    title=f"{loc_display} Commercial Distribution & Retail Node #17",
                    category="Local Trade & Commercial Partner Network",
                    distance_km=2.4,
                    capacity_metric="Commercial Channel Partner",
                    rating=4.8,
                    icon_type="store",
                    synergy_benefit="Provides steady B2B offtake agreements and shared cross-promotional client referrals.",
                    estimated_monthly_savings=9500.0,
                ),
                ClusterNode(
                    id="node-infra-gen",
                    role="INFRASTRUCTURE SHARING",
                    title=f"{loc_display} Shared Solar Power & Utility Facility #02",
                    category="Common Facility Center (CFC) Utility",
                    distance_km=3.5,
                    capacity_metric="Shared Renewable Utility",
                    rating=4.9,
                    icon_type="snowflake",
                    synergy_benefit="Shared solar backup and commercial loading bay access reduces monthly overhead expenses.",
                    estimated_monthly_savings=8200.0,
                ),
            ]
            perks = [
                "12% direct sourcing discount from local producer guild",
                "Wholesale tier rebate on consumable tools and spares",
                "Direct B2B cross-promotional channel partner network",
                "Shared utility backup reducing monthly fixed operating overhead",
            ]
            unlocked_note = f"Connecting all 4 local cluster nodes saves approximately ₹37,500/month for your {title_idea} enterprise in {loc_display}."

        return ClusterNetworkResponse(
            locality=loc_display,
            business_idea=business_category,
            hub=hub,
            nodes=nodes,
            collective_perks=perks,
            unlocked_synergy_note=unlocked_note,
        )

