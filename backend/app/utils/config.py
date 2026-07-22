from pydantic_settings import BaseSettings
import os
from pathlib import Path

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./meetmind.db"
    JWT_SECRET_KEY: str = "supersecretjwtkeyforlocalmeetminddevelopment123!"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    UPLOAD_DIR: str = "uploads"
    PDF_DIR: str = "generated_pdfs"
    OFFLINE_MODE: str = "local"  # "local" or "mock"
    WHISPER_MODEL: str = "small"  # e.g., tiny, base, small

    class Config:
        # Load from .env if it exists in the backend directory or project root
        env_file = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
        extra = "ignore"

settings = Settings()

# Ensure directories exist
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
Path(settings.PDF_DIR).mkdir(parents=True, exist_ok=True)
