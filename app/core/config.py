"""Application configuration module."""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """Application settings."""
    
    # API configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "PDF Manager"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = """
    A comprehensive PDF management system with advanced plagiarism detection capabilities.
    
    Features:
    * PDF Processing (merge, compress, convert)
    * Advanced Plagiarism Detection
    * MBA-specific Content Analysis
    * Multi-format Export
    """
    
    # Environment
    DEBUG: bool = False
    ENVIRONMENT: str = "development"
    
    # Security
    SECRET_KEY: str = "your-secret-key-here"  # Change in production
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"
    ENCRYPTION_KEYS_FILE: str = "data/encryption_keys.json"
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost",
        "http://localhost:8000",
        "http://localhost:3000",  # React frontend
    ]
    
    # File upload
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB (for backward compatibility)
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: List[str] = ["pdf", "docx", "xlsx", "txt"]
    UPLOAD_DIR: str = "uploads"
    
    # Plagiarism detection
    SIMILARITY_THRESHOLD: float = 0.60
    MIN_CHUNK_SIZE: int = 50  # Minimum number of words to check
    MAX_CHUNK_SIZE: int = 1000  # Maximum number of words to check
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    LOG_FILE: str = "app.log"
    ENABLE_REQUEST_LOGGING: bool = True
    
    # Rate limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 100  # Number of requests
    RATE_LIMIT_WINDOW: int = 3600  # Time window in seconds (1 hour)
    
    # Cache
    CACHE_ENABLED: bool = True
    CACHE_TTL: int = 3600  # Cache time-to-live in seconds
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",  # Allow extra fields from environment variables
    )

settings = Settings() 