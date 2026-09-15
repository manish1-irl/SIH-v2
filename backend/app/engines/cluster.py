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
        loc_display = locality.strip().title() if locality else "Bassi"
        cat_lower = business_category.lower() if business_category else "dairy"
        ent_name = enterprise_name.strip() if enterprise_name else f"{loc_display} Enterprise"

        if "mustard" in cat_lower or "oil" in cat_lower:
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
        else:
            # Dairy & Livestock default matching the user's mockup exactly
            hub = ClusterHub(
                name=ent_name,
                sector="Retail Dairy & Sweet Shop • 10% Concessional Credit",
                locality_node=f"{loc_display} Village Center (Core Node)",
                seeking="Seeking 150L daily raw milk supply",
                daily_processing_volume="350 Liters",
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

        return ClusterNetworkResponse(
            locality=loc_display,
            business_idea=business_category,
            hub=hub,
            nodes=nodes,
            collective_perks=perks,
            unlocked_synergy_note=unlocked_note,
        )
