import json
from typing import List, Optional, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Draftly Application Configuration Settings."""

    PROJECT_NAME: str = "Draftly"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://draftly.vercel.app",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return []

    # Supabase PostgreSQL Database URL
    DATABASE_URL: Optional[str] = None

    @property
    def async_database_url(self) -> Optional[str]:
        """Convert standard postgres connection string to asyncpg compatible format."""
        if not self.DATABASE_URL:
            return None
        url = self.DATABASE_URL.strip()
        # Normalise driver prefix for SQLAlchemy asyncpg
        if url.startswith("postgres://"):
            url = "postgresql+asyncpg://" + url[len("postgres://"):]
        elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
            url = "postgresql+asyncpg://" + url[len("postgresql://"):]
        # asyncpg uses ssl parameter instead of sslmode
        if "sslmode=" in url:
            url = url.replace("sslmode=require", "ssl=require").replace("sslmode=prefer", "ssl=prefer")
        return url

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()

