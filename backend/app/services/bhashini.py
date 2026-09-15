import base64
import json
from typing import Optional
import httpx
from app.core.config import settings


BHASHINI_BASE_URL = "https://dhruva-api.bhashini.gov.in"
BHASHINI_PIPELINE_URL = f"{BHASHINI_BASE_URL}/pipeline/v1"
BHASHINI_INFER_URL = f"{BHASHINI_BASE_URL}/inference"

SUPPORTED_LANGUAGES = {
    "hi": "Hindi",
    "bn": "Bengali",
    "ta": "Tamil",
    "te": "Telugu",
    "mr": "Marathi",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "or": "Odia",
    "as": "Assamese",
    "en": "English",
}

DEFAULT_ASR_SERVICE = "ai4bharat/air--conformer-multilingual-asr"
DEFAULT_TTS_SERVICE = "ai4bharat/air--indic-tts-stitched"
DEFAULT_NMT_SERVICE = "ai4bharat/air--nmt-en-hi"


class BhashiniClient:
    def __init__(self):
        self.api_key = settings.BHASHINI_API_KEY
        self.inference_key = settings.BHASHINI_INFERENCE_KEY
        self.user_id = settings.BHASHINI_USER_ID

    @property
    def is_configured(self) -> bool:
        return bool(self.inference_key or self.api_key)

    def _get_headers(self) -> dict:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
        }
        # Authorization header gets the inference key (or fallback to api key)
        auth_key = self.inference_key or self.api_key
        if auth_key:
            headers["Authorization"] = auth_key
        # UDYAT / ULCA API Key header
        if self.api_key:
            headers["ulcaApiKey"] = self.api_key
        # User ID headers (both standard variations)
        if self.user_id:
            headers["userID"] = self.user_id
            headers["X-Userid"] = self.user_id
        return headers

    async def _post_compute(self, payload: dict) -> dict:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{BHASHINI_PIPELINE_URL}/compute",
                headers=self._get_headers(),
                json=payload,
                timeout=30.0,
            )
            if resp.status_code == 200:
                return resp.json()
            return {}

    async def speech_to_text(
        self,
        audio_base64: str,
        language: str = "hi",
        audio_format: str = "wav",
        sampling_rate: int = 16000,
    ) -> str:
        if not self.is_configured:
            return ""
        payload = {
            "pipelineTasks": [
                {
                    "taskType": "asr",
                    "config": {
                        "language": {"sourceLanguage": language},
                        "serviceId": DEFAULT_ASR_SERVICE,
                        "audioFormat": audio_format,
                        "samplingRate": sampling_rate,
                        "preProcessors": ["vad"],
                        "postProcessors": ["itn", "punctuation"],
                    },
                }
            ],
            "inputData": {
                "input": [{"source": None}],
                "audio": [{"audioContent": audio_base64}],
            },
        }
        try:
            data = await self._post_compute(payload)
            output = data.get("pipelineResponse", [])
            for item in output:
                if item.get("taskType") == "asr":
                    return item.get("output", [{}])[0].get("source", "")
            return ""
        except Exception:
            return ""

    async def text_to_speech(
        self,
        text: str,
        language: str = "hi",
        gender: str = "female",
    ) -> str:
        if not self.is_configured or not text:
            return ""
        payload = {
            "pipelineTasks": [
                {
                    "taskType": "tts",
                    "config": {
                        "language": {"sourceLanguage": language},
                        "serviceId": DEFAULT_TTS_SERVICE,
                        "gender": gender,
                    },
                }
            ],
            "inputData": {
                "input": [{"source": text}],
                "audio": [{"audioContent": None}],
            },
        }
        try:
            data = await self._post_compute(payload)
            output = data.get("pipelineResponse", [])
            for item in output:
                if item.get("taskType") == "tts":
                    audio_b64 = item.get("output", [{}])[0].get("audioContent", "")
                    if audio_b64:
                        return audio_b64
            return ""
        except Exception:
            return ""

    async def translate(
        self,
        text: str,
        source_lang: str = "hi",
        target_lang: str = "en",
    ) -> str:
        if not self.is_configured or not text:
            return text
        payload = {
            "pipelineTasks": [
                {
                    "taskType": "translation",
                    "config": {
                        "language": {
                            "sourceLanguage": source_lang,
                            "targetLanguage": target_lang,
                        },
                        "serviceId": DEFAULT_NMT_SERVICE,
                    },
                }
            ],
            "inputData": {
                "input": [{"source": text}],
                "audio": [{"audioContent": None}],
            },
        }
        try:
            data = await self._post_compute(payload)
            output = data.get("pipelineResponse", [])
            for item in output:
                if item.get("taskType") == "translation":
                    return item.get("output", [{}])[0].get("target", text)
            return text
        except Exception:
            return text

    async def voice_to_english_text(
        self,
        audio_base64: str,
        source_language: str = "hi",
        audio_format: str = "wav",
        sampling_rate: int = 16000,
    ) -> str:
        if source_language == "en":
            return await self.speech_to_text(audio_base64, "en", audio_format, sampling_rate)
        transcribed = await self.speech_to_text(audio_base64, source_language, audio_format, sampling_rate)
        if not transcribed:
            return ""
        if source_language == "en":
            return transcribed
        translated = await self.translate(transcribed, source_language, "en")
        return translated if translated else transcribed

    async def english_text_to_voice(
        self,
        text: str,
        target_language: str = "hi",
        gender: str = "female",
    ) -> str:
        if target_language == "en":
            return await self.text_to_speech(text, "en", gender)
        # If response is already in the target Indic script, synthesize voice directly
        if any(ord(c) > 127 for c in text):
            return await self.text_to_speech(text, target_language, gender)
        translated = await self.translate(text, "en", target_language)
        final_text = translated if translated else text
        return await self.text_to_speech(final_text, target_language, gender)


bhashini_client = BhashiniClient()
