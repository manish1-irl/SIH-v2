from fastapi import APIRouter
from app.models.schemas import ClusterOpportunity, ClusterNetworkResponse, ClusterNetworkRequest
from app.engines.cluster import ClusterEngine
from app.core.session import session_manager

router = APIRouter()


@router.post("/find", response_model=list[ClusterOpportunity])
async def find_clusters(locality: str, business_category: str = "general"):
    return ClusterEngine.find_clusters(locality=locality, business_category=business_category)


@router.post("/network", response_model=ClusterNetworkResponse)
async def get_cluster_network(request: ClusterNetworkRequest):
    user_id = request.user_id or "web-user"
    biz_idea = request.business_idea
    locality = request.locality
    ent_name = request.enterprise_name

    if not biz_idea or biz_idea.strip().lower() in ["general", "none", ""]:
        session_biz = session_manager.get_active_business(user_id)
        if session_biz.get("business_idea"):
            biz_idea = session_biz["business_idea"]
        if session_biz.get("locality") and (not locality or locality == "Bassi"):
            locality = session_biz["locality"]
        if session_biz.get("enterprise_name") and (not ent_name or ent_name == "Ganga Dairy Parlour"):
            ent_name = session_biz["enterprise_name"]

    return ClusterEngine.get_cluster_network(
        locality=locality or "Bassi",
        business_category=biz_idea or "Dairy",
        enterprise_name=ent_name or f"{locality or 'Local'} Enterprise",
    )


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
