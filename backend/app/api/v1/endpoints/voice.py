import json
from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from app.services.bhashini import bhashini_client, SUPPORTED_LANGUAGES
from app.agent.crew_orchestrator import CrewOrchestrator
from app.models.schemas import ChatRequest

router = APIRouter()


class VoiceProcessRequest(BaseModel):
    audio_base64: str
    language: str = "hi"
    audio_format: str = "wav"
    sampling_rate: int = 16000


class TextToVoiceRequest(BaseModel):
    text: str
    language: str = "hi"
    gender: str = "female"


class ConversationalTurnRequest(BaseModel):
    user_id: str = "default"
    message: Optional[str] = None
    audio_base64: Optional[str] = None
    language: str = "hi"


_conversation_sessions: dict = {}


@router.get("/languages")
async def get_supported_languages():
    return {
        "languages": [{"code": k, "name": v} for k, v in SUPPORTED_LANGUAGES.items()],
        "bhashini_configured": bhashini_client.is_configured,
    }


@router.get("/status")
async def voice_service_status():
    from app.core.config import settings
    return {
        "bhashini_configured": bhashini_client.is_configured,
        "gemini_configured": bool(settings.GEMINI_API_KEY),
        "services": {
            "asr": bhashini_client.is_configured,
            "tts": bhashini_client.is_configured,
            "translation": bhashini_client.is_configured,
            "llm": bool(settings.GEMINI_API_KEY),
        },
    }


@router.post("/transcribe")
async def transcribe_audio(request: VoiceProcessRequest):
    if not bhashini_client.is_configured:
        return JSONResponse(
            status_code=503,
            content={"error": "Bhashini API not configured. Set BHASHINI_API_KEY and BHASHINI_USER_ID."},
        )
    text = await bhashini_client.speech_to_text(
        audio_base64=request.audio_base64,
        language=request.language,
        audio_format=request.audio_format,
        sampling_rate=request.sampling_rate,
    )
    if not text:
        return JSONResponse(status_code=422, content={"error": "Could not transcribe audio. Try again."})
    return {"transcribed_text": text, "language": request.language}


@router.post("/speak")
async def text_to_speech(request: TextToVoiceRequest):
    if not bhashini_client.is_configured:
        return JSONResponse(
            status_code=503,
            content={"error": "Bhashini API not configured."},
        )
    audio_b64 = await bhashini_client.text_to_speech(
        text=request.text,
        language=request.language,
        gender=request.gender,
    )
    if not audio_b64:
        return JSONResponse(status_code=500, content={"error": "TTS synthesis failed."})
    return {"audio_base64": audio_b64, "language": request.language}


@router.post("/voice-chat")
async def voice_chat(request: ConversationalTurnRequest):
    orchestrator = CrewOrchestrator()
    user_text = request.message or ""

    if request.audio_base64 and not user_text:
        if bhashini_client.is_configured:
            user_text = await bhashini_client.voice_to_english_text(
                audio_base64=request.audio_base64,
                source_language=request.language,
            )
        if not user_text:
            return JSONResponse(
                status_code=422,
                content={"error": "Could not process voice. Please try typing instead."},
            )

    if not user_text:
        return JSONResponse(status_code=400, content={"error": "No message provided."})

    session = _conversation_sessions.get(request.user_id, {"context": {}, "turns": []})
    response_data = await orchestrator.handle_chat(user_text, session["context"])
    session["turns"].append({"user": user_text, "agent": response_data.get("response", "")})
    _conversation_sessions[request.user_id] = session

    response_text = response_data.get("response", "")
    voice_audio = ""
    if bhashini_client.is_configured and response_text:
        voice_audio = await bhashini_client.english_text_to_voice(
            text=response_text,
            target_language=request.language,
        )

    return {
        "user_message": user_text,
        "agent_response": response_text,
        "voice_audio_base64": voice_audio,
        "tool_used": response_data.get("tool_used", []),
        "data": response_data.get("data", {}),
        "language": request.language,
    }


@router.post("/analyze-voice")
async def analyze_business_voice(request: ConversationalTurnRequest):
    orchestrator = CrewOrchestrator()
    user_text = request.message or ""

    if request.audio_base64 and not user_text:
        if bhashini_client.is_configured:
            user_text = await bhashini_client.voice_to_english_text(
                audio_base64=request.audio_base64,
                source_language=request.language,
            )
        if not user_text:
            return JSONResponse(
                status_code=422,
                content={"error": "Could not process voice input."},
            )

    result = await orchestrator.handle_full_analysis(user_text)
    response_text = result.get("narrative", "")
    voice_audio = ""
    if bhashini_client.is_configured and response_text:
        voice_audio = await bhashini_client.english_text_to_voice(
            text=response_text,
            target_language=request.language,
        )

    return {
        "user_message": user_text,
        "agent_response": response_text,
        "voice_audio_base64": voice_audio,
        "report": result.get("report"),
        "language": request.language,
    }
