import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load .env from backend directory or project root
_backend_dir = Path(__file__).resolve().parent.parent.parent
load_dotenv(_backend_dir / ".env")
load_dotenv()


class Settings(BaseSettings):
    PROJECT_NAME: str = "Hyper-Local AI Business Advisor"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "https://*.vercel.app"]
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "https://erbdkwmsbwyqdpasjwjf.supabase.co")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyYmRrd21zYnd5cWRwYXNqd2pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMTY0MTEsImV4cCI6MjEwNDU5MjQxMX0.WEiTeFaLSveXI5ml2WijzQIa13C2wBfNyalKpK8_H8s")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "AIzaSyBrUq-VaPfAVJi2BAHjA3ZfaoxM-eCbLGE")
    BHASHINI_API_KEY: str = os.getenv("BHASHINI_API_KEY", "463e6d1d78-ccf5-4b71-b3d3-0824b67415d5")
    BHASHINI_USER_ID: str = os.getenv("BHASHINI_USER_ID", "")
    BHASHINI_INFERENCE_KEY: str = os.getenv("BHASHINI_INFERENCE_KEY", "bS88zqBWY0g_WTSfGyNyeFNOQrDmVrce7tI39hPcv8fg_9svcmw_es2-irzw0-nQ")

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
