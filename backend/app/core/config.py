import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "Tone & Emotion Detector API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    GEMINI_API_KEY: str = ""
    DB_PATH: str = "tone_detector.db"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

settings = Settings()
