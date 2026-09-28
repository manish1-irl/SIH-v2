from fastapi import APIRouter
from app.models.schemas import ChatRequest
from app.agent.crew_orchestrator import CrewOrchestrator

router = APIRouter()


@router.post("")
async def chat(request: ChatRequest):
    orchestrator = CrewOrchestrator()
    lang = request.language or (request.context.get("language") if request.context else "en") or "en"
    response = await orchestrator.handle_chat(request.query, request.context, language=lang)
    return response


@router.get("/health")
async def chat_health():
    return {"status": "Chat service operational", "mode": "crewai_gemini"}
