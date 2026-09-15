from fastapi import APIRouter
from app.models.schemas import ClusterOpportunity
from app.engines.cluster import ClusterEngine

router = APIRouter()


@router.post("/find", response_model=list[ClusterOpportunity])
async def find_clusters(locality: str, business_category: str = "general"):
    return ClusterEngine.find_clusters(locality=locality, business_category=business_category)


@router.get("/benefits")
async def cluster_benefits():
    return {
        "benefits": [
            "Bulk procurement discounts (10-20% savings)",
            "Shared logistics and cold chain infrastructure",
            "Collective marketing and brand building",
            "Knowledge sharing and skill development",
            "Access to shared equipment and technology",
        ],
        "typical_clusters": [
            "Dairy & Livestock Economic Ring",
            "Food Processing & Agri-Value Chain",
            "Textile & Handloom Cooperative",
            "Rural Renewable Energy Network",
        ],
    }
