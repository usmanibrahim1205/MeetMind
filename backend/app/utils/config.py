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

# Adjust paths for read-only environments (like Vercel serverless)
if os.environ.get("VERCEL"):
    # Auto-detect Vercel Postgres URL, external DATABASE_URL, or custom STORAGE_URL if configured
    postgres_url = os.environ.get("POSTGRES_URL") or os.environ.get("DATABASE_URL") or os.environ.get("STORAGE_URL")
    if postgres_url and not postgres_url.startswith("sqlite"):
        settings.DATABASE_URL = postgres_url
    elif settings.DATABASE_URL == "sqlite:///./meetmind.db" or settings.DATABASE_URL.startswith("sqlite:///."):
        settings.DATABASE_URL = "sqlite:////tmp/meetmind.db"
    
    settings.UPLOAD_DIR = "/tmp/uploads"
    settings.PDF_DIR = "/tmp/generated_pdfs"

# Ensure directories exist
try:
    Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
    Path(settings.PDF_DIR).mkdir(parents=True, exist_ok=True)
except Exception as e:
    # Do not crash the app if mkdir fails
    import sys
    print(f"Warning: Could not create directories: {e}", file=sys.stderr)

