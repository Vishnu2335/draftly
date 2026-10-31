import json
import os
import secrets
from pathlib import Path
from typing import List, Optional, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def _ensure_env_file_and_jwt_secret() -> str:
    """Ensure a cryptographically secure JWT secret exists.
    
    Checks the OS environment first (standard for Render / production deployments).
    Falls back to reading or generating a secret in backend/.env for local development.
    """
    # 1. Check OS environment first (Render / Vercel / CI)
    env_secret = os.environ.get("JWT_SECRET_KEY")
    if env_secret:
        clean_secret = env_secret.strip().strip('"').strip("'")
        if len(clean_secret) >= 32:
            return clean_secret

    # 2. Local development fallback in backend/.env
    env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    existing_secret = None
    lines: List[str] = []

    if env_path.exists():
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                lines = f.readlines()
            for line in lines:
                stripped = line.strip()
                if stripped.startswith("JWT_SECRET_KEY=") and not stripped.startswith("#"):
                    val = stripped.split("=", 1)[1].strip().strip('"').strip("'")
                    if len(val) >= 32:
                        existing_secret = val
                        break
        except Exception:
            pass

    if existing_secret:
        return existing_secret

    # Generate at least 32 bytes of secure random material (token_urlsafe(32) yields ~43 chars)
    new_secret = secrets.token_urlsafe(32)

    # Persist into .env file while preserving existing settings
    has_jwt_line = False
    new_lines = []
    for line in lines:
        if line.strip().startswith("JWT_SECRET_KEY="):
            new_lines.append(f'JWT_SECRET_KEY="{new_secret}"\n')
            has_jwt_line = True
        else:
            new_lines.append(line)

    if not has_jwt_line:
        if new_lines and not new_lines[-1].endswith("\n"):
            new_lines.append("\n")
        new_lines.append(f'JWT_SECRET_KEY="{new_secret}"\n')
        new_lines.append('JWT_ALGORITHM="HS256"\n')
        new_lines.append('ACCESS_TOKEN_EXPIRE_MINUTES=30\n')

    try:
        with open(env_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
    except Exception:
        pass

    return new_secret


# Initialize or retrieve JWT secret before loading settings
_initial_jwt_secret = _ensure_env_file_and_jwt_secret()


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

    # Supabase PostgreSQL Database URL (REQUIRED in production)
    DATABASE_URL: Optional[str] = None

    # Supabase Project Metadata & Optional Keys
    SUPABASE_URL: Optional[str] = None
    NEXT_PUBLIC_SUPABASE_URL: Optional[str] = None
    SUPABASE_PUBLISHABLE_KEY: Optional[str] = None
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: Optional[str] = None
    SUPABASE_SECRET_KEY: Optional[str] = None

    # JWT Authentication Configuration
    JWT_SECRET_KEY: str = _initial_jwt_secret
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    @property
    def async_database_url(self) -> Optional[str]:
        """Convert standard postgres connection string to asyncpg compatible format, or provide local SQLite in development.
        
        CRITICAL FOR PRODUCTION: SQLite is strictly forbidden in production. If DATABASE_URL is missing,
        invalid, or points to SQLite when ENVIRONMENT=production, this returns None to ensure safe fail-fast behavior.
        """
        is_production = self.ENVIRONMENT.lower() == "production"

        if not self.DATABASE_URL:
            if not is_production:
                db_path = Path(__file__).resolve().parent.parent.parent / "draftly_dev.db"
                return f"sqlite+aiosqlite:///{db_path.as_posix()}"
            return None

        url = self.DATABASE_URL.strip().strip('"').strip("'")

        # Disallow SQLite in production environment
        if url.startswith("sqlite"):
            if is_production:
                return None
            return url

        # Detect placeholders, API keys, or HTTP URLs accidentally passed as DATABASE_URL
        if (
            "[YOUR-PASSWORD]" in url
            or "your_password" in url
            or url.startswith("http://")
            or url.startswith("https://")
            or url.startswith("sb_secret_")
            or url.startswith("sb_publishable_")
        ):
            if not is_production:
                db_path = Path(__file__).resolve().parent.parent.parent / "draftly_dev.db"
                return f"sqlite+aiosqlite:///{db_path.as_posix()}"
            return None

        # Normalise driver prefix for SQLAlchemy asyncpg
        if url.startswith("postgres://"):
            url = "postgresql+asyncpg://" + url[len("postgres://"):]
        elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
            url = "postgresql+asyncpg://" + url[len("postgresql://"):]

        if url.startswith("postgresql+asyncpg://"):
            if "sslmode=" in url:
                url = url.replace("sslmode=require", "ssl=require").replace("sslmode=prefer", "ssl=prefer")
            elif "ssl=" not in url:
                # Default to ssl=require for cloud PostgreSQL connections
                separator = "&" if "?" in url else "?"
                url = f"{url}{separator}ssl=require"
            return url

        # Fallback to local SQLite only in development/test
        if not is_production:
            db_path = Path(__file__).resolve().parent.parent.parent / "draftly_dev.db"
            return f"sqlite+aiosqlite:///{db_path.as_posix()}"

        return None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
