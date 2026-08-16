from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "RHIPay Nexus Hub"
    API_V1_STR: str = "/api/v1"
    CORS_ORIGINS: List[str] = ["*"]
    
    # Request defaults
    DEFAULT_QR_EXPIRY_SECONDS: int = 900  # 15 minutes
    
    model_config = SettingsConfigDict(case_sensitive=True)


settings = Settings()
