import pytest
from app.core.config import Settings
from app.main import lifespan
from fastapi import FastAPI


def test_production_disallows_sqlite():
    """Verify that in production mode, SQLite URLs are strictly forbidden."""
    s = Settings(
        ENVIRONMENT="production",
        DATABASE_URL="sqlite+aiosqlite:///production.db",
        JWT_SECRET_KEY="a" * 32,
    )
    assert s.async_database_url is None


def test_production_disallows_empty_database_url():
    """Verify that in production mode, an empty DATABASE_URL returns None."""
    s = Settings(
        ENVIRONMENT="production",
        DATABASE_URL=None,
        JWT_SECRET_KEY="a" * 32,
    )
    assert s.async_database_url is None


def test_production_disallows_api_keys_as_database_url():
    """Verify that accidental API keys or HTTPS URLs as DATABASE_URL are rejected in production."""
    s = Settings(
        ENVIRONMENT="production",
        DATABASE_URL="https://lfdwnglivncvxshaqslc.supabase.co",
        JWT_SECRET_KEY="a" * 32,
    )
    assert s.async_database_url is None

    s2 = Settings(
        ENVIRONMENT="production",
        DATABASE_URL="sb_publishable_C16b5fDW1Ld9NOUq1F6npg_fDYWUAGq",
        JWT_SECRET_KEY="a" * 32,
    )
    assert s2.async_database_url is None


def test_production_formats_postgres_url():
    """Verify that a standard postgres URL is converted to postgresql+asyncpg:// with SSL."""
    s = Settings(
        ENVIRONMENT="production",
        DATABASE_URL="postgresql://postgres:secret@db.lfdwnglivncvxshaqslc.supabase.co:5432/postgres",
        JWT_SECRET_KEY="a" * 32,
    )
    assert s.async_database_url is not None
    assert s.async_database_url.startswith("postgresql+asyncpg://")
    assert "ssl=require" in s.async_database_url


def test_development_fallback_to_sqlite():
    """Verify that in development mode, an unconfigured or placeholder database safely falls back to SQLite."""
    s = Settings(
        ENVIRONMENT="development",
        DATABASE_URL="postgresql+asyncpg://postgres:[YOUR-PASSWORD]@db.supabase.co:5432/postgres",
        JWT_SECRET_KEY="a" * 32,
    )
    assert s.async_database_url is not None
    assert s.async_database_url.startswith("sqlite+aiosqlite://")


@pytest.mark.asyncio
async def test_production_startup_fails_fast_on_missing_db(monkeypatch):
    """Verify that FastAPI lifespan raises a clear RuntimeError if started in production without PostgreSQL."""
    from app.core import config
    monkeypatch.setattr(config.settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(config.settings, "DATABASE_URL", None)

    app = FastAPI()
    with pytest.raises(RuntimeError) as exc_info:
        async with lifespan(app):
            pass

    assert "FATAL: Production deployment requires a valid Supabase PostgreSQL connection string" in str(exc_info.value)

