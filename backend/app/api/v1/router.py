from fastapi import APIRouter
from app.api.v1.endpoints import advisor, schemes, goals, clusters, lifecycle, chat, voice

api_router = APIRouter()
api_router.include_router(advisor.router, prefix="/advisor", tags=["Advisor"])
api_router.include_router(schemes.router, prefix="/schemes", tags=["Schemes"])
api_router.include_router(goals.router, prefix="/business/goals", tags=["Goals"])
api_router.include_router(clusters.router, prefix="/clusters", tags=["Clusters"])
api_router.include_router(lifecycle.router, prefix="/lifecycle", tags=["Lifecycle"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat"])
api_router.include_router(voice.router, prefix="/voice", tags=["Voice"])
