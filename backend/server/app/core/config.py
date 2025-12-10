"""
Configuration settings for AI CREAT Backend
"""
import os
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import validator
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "AI CREAT Backend"
    
    # Database Configuration - All from environment variables
    POSTGRES_SERVER: str = os.getenv("POSTGRES_SERVER", "localhost")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "")
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "ai_creat_db")
    POSTGRES_PORT: str = os.getenv("POSTGRES_PORT", "5432")
    
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
    
    # JWT Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8000,http://localhost:5173"
    
    @property
    def CORS_ORIGINS(self) -> List[str]:
        if isinstance(self.BACKEND_CORS_ORIGINS, str):
            return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",")]
        return self.BACKEND_CORS_ORIGINS
    
    # File Storage Configuration
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")
    MAX_FILE_SIZE: int = int(os.getenv("MAX_FILE_SIZE", "50000000"))  # 50MB
    ALLOWED_FILE_TYPES: List[str] = [".jpg", ".jpeg", ".png", ".psd", ".tiff"]
    
    # AI Provider Configuration
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "gemini")
    AVAILABLE_AI_PROVIDERS: List[str] = ["openai", "gemini"]
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    GEMINI_API_KEY: Optional[str] = os.getenv("GEMINI_API_KEY")
    CLAUDE_API_KEY: Optional[str] = os.getenv("CLAUDE_API_KEY")
    STABILITY_AI_API_KEY: Optional[str] = os.getenv("STABILITY_AI_API_KEY")
    
    # AI Provider Enable/Disable Settings
    GEMINI_ENABLED: str = os.getenv("GEMINI_ENABLED", "true")
    OPENAI_ENABLED: str = os.getenv("OPENAI_ENABLED", "false")
    CLAUDE_ENABLED: str = os.getenv("CLAUDE_ENABLED", "false")
    
    # Additional Gemini Configuration
    GEMINI_PRIORITY: Optional[str] = os.getenv("GEMINI_PRIORITY")
    GEMINI_RPM: Optional[str] = os.getenv("GEMINI_RPM")
    GEMINI_MODEL: Optional[str] = os.getenv("GEMINI_MODEL")
    
    # Stability AI Configuration
    STABILITY_ENABLED: Optional[str] = os.getenv("STABILITY_ENABLED")
    
    # Celery Configuration
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "pyamqp://guest@localhost//")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379")
    
    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"  # Ignore extra fields instead of raising validation errors


settings = Settings()