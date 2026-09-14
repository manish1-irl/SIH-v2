from typing import List
from app.models.schemas import ClusterOpportunity

class ClusterEngine:
    @staticmethod
    def find_clusters(locality: str, business_category: str) -> List[ClusterOpportunity]:
        return [
            ClusterOpportunity(
                cluster_name=f"{locality} Dairy & Livestock Economic Ring",
                complementary_businesses=[
                    "Green Fodder & Silage Collective",
                    "Village Level Chilling Center",
                    "Shared Refrigerated Milk Tanker Logistics",
                ],
                shared_benefits=[
                    "Bulk purchase discount on cattle feed saving ~14%",
                    "Shared refrigerated logistics minimizing spoilage",
                ],
                nearby_nodes_count=4,
            )
        ]
