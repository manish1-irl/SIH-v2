import json
from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from app.services.bhashini import bhashini_client, SUPPORTED_LANGUAGES
from app.agent.crew_orchestrator import CrewOrchestrator
from app.models.schemas import ChatRequest
from app.core.session import session_manager

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


async def transcribe_audio_gemini(audio_base64: str, language: str = "hi") -> str:
    from app.core.config import settings
    if not settings.GEMINI_API_KEY or not audio_base64:
        return ""
    mime = "audio/webm"
    if audio_base64.startswith("UklGR"):
        mime = "audio/wav"
    models = ["gemini-3.5-flash", "gemini-flash-latest"]
    prompt = (
        f"Transcribe the spoken words in this audio accurately. "
        f"The user is speaking in an Indian language or English (language hint: {language}). "
        f"Return ONLY the transcribed words in their spoken language or script. "
        f"If the audio contains silence, noise, or no recognizable words, return SILENCE."
    )
    payload = {
        "contents": [{
            "parts": [
                {"inlineData": {"mimeType": mime, "data": audio_base64}},
                {"text": prompt},
            ]
        }]
    }
    try:
        import httpx
        async with httpx.AsyncClient(timeout=15.0) as client:
            for model in models:
                try:
                    r = await client.post(
                        f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={settings.GEMINI_API_KEY}",
                        json=payload,
                    )
                    if r.status_code == 200:
                        data = r.json()
                        text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        if text and "SILENCE" not in text.upper():
                            return text.strip()
                except Exception as me:
                    print(f"[Gemini ASR] Model {model} request error: {me}")
    except Exception as e:
        print(f"[Gemini ASR] Transcription exception: {e}")
    return ""


@router.post("/voice-chat")
async def voice_chat(request: ConversationalTurnRequest):
    orchestrator = CrewOrchestrator()
    user_text = request.message or ""

    if request.audio_base64 and not user_text:
        # 1. Try Bhashini ASR first if configured
        if bhashini_client.is_configured:
            try:
                import asyncio
                user_text = await asyncio.wait_for(
                    bhashini_client.voice_to_english_text(
                        audio_base64=request.audio_base64,
                        source_language=request.language,
                    ),
                    timeout=4.0,
                )
            except Exception:
                user_text = ""

        # 2. Multimodal Gemini ASR fallback (transcribes audio/webm and audio/wav directly)
        if not user_text:
            user_text = await transcribe_audio_gemini(request.audio_base64, request.language)

        if not user_text:
            return JSONResponse(
                status_code=422,
                content={"error": "Could not detect clear speech. Please speak closer to the mic or type your message."},
            )

    if not user_text:
        return JSONResponse(status_code=400, content={"error": "No message provided."})

    user_id = request.user_id or "web-user"
    session = session_manager.get_session(user_id)
    response_data = await orchestrator.handle_chat(user_text, {**session["context"], "user_id": user_id}, language=request.language)

    # Update session context with newly extracted entities for multi-turn conversational memory
    if "entities" in response_data:
        extracted = {k: v for k, v in response_data["entities"].items() if v is not None and k != "needs_input"}
        session_manager.update_session(user_id, **extracted)

    active_business = session_manager.get_active_business(user_id)

    response_text = response_data.get("response", "")
    voice_audio = ""

    return {
        "user_message": user_text,
        "agent_response": response_text,
        "voice_audio_base64": voice_audio,
        "tool_used": response_data.get("tool_used", []),
        "data": response_data.get("data", {}),
        "entities": response_data.get("entities", {}),
        "active_business": active_business,
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
