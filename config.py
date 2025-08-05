"""
Configuration settings for Gertie.ai Financial Risk Management System
Loads environment variables and provides application settings
"""

import os
from typing import List, Optional
from pydantic import validator
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # JWT Authentication Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "fallback-secret-key-change-in-production")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # API Settings
    API_V1_PREFIX: str = os.getenv("API_V1_PREFIX", "/api/v1")
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "Gertie.ai Financial Risk Management")
    
    # CORS Settings
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8080", 
        "http://localhost:5173"
    ]
    
    # Database Settings (for future use)
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./gertie.db")
    
    # Security Settings
    BCRYPT_ROUNDS: int = 12
    
    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v):
        """Parse CORS origins from environment variable"""
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v
    
    @validator("SECRET_KEY")
    def validate_secret_key(cls, v):
        """Ensure SECRET_KEY is set and not using default"""
        if not v:
            raise ValueError("SECRET_KEY must be set")
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        return v
    
    class Config:
        """Pydantic configuration"""
        case_sensitive = True
        env_file = ".env"

# Create global settings instance
settings = Settings()

# Print configuration on import (for development)
if __name__ == "__main__":
    print("🔧 Gertie.ai Configuration:")
    print(f"   SECRET_KEY: {'*' * len(settings.SECRET_KEY)} (length: {len(settings.SECRET_KEY)})")
    print(f"   ALGORITHM: {settings.ALGORITHM}")
    print(f"   TOKEN_EXPIRE: {settings.ACCESS_TOKEN_EXPIRE_MINUTES} minutes")
    print(f"   API_PREFIX: {settings.API_V1_PREFIX}")
    print(f"   CORS_ORIGINS: {settings.BACKEND_CORS_ORIGINS}")
    print("✅ Configuration loaded successfully!")