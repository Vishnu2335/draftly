import logging
import time
from typing import Any, AsyncGenerator, Dict, Optional
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import declarative_base

from app.core.config import settings

logger = logging.getLogger("draftly.database")

Base = declarative_base()

# Global engine and session factory
_async_engine: Optional[AsyncEngine] = None
_async_session_factory: Optional[async_sessionmaker[AsyncSession]] = None


def get_engine() -> Optional[AsyncEngine]:
    """Lazy initialize and return the SQLAlchemy async engine."""
    global _async_engine, _async_session_factory
    url = settings.async_database_url

    if not url:
        return None

    if _async_engine is None:
        try:
            # Configure pooling suitable for Supabase PostgreSQL
            _async_engine = create_async_engine(
                url,
                echo=(settings.ENVIRONMENT == "development"),
                pool_pre_ping=True,
                pool_size=5,
                max_overflow=10,
                connect_args={"timeout": 5},
            )
            _async_session_factory = async_sessionmaker(
                bind=_async_engine,
                class_=AsyncSession,
                autocommit=False,
                autoflush=False,
                expire_on_commit=False,
            )
            logger.info("SQLAlchemy async engine initialized for Supabase PostgreSQL.")
        except Exception as e:
            logger.error(f"Failed to create SQLAlchemy async engine: {e}")
            return None

    return _async_engine


async def get_db() -> AsyncGenerator[Optional[AsyncSession], None]:
    """Dependency that yields an async database session."""
    engine = get_engine()
    if not engine or not _async_session_factory:
        yield None
        return

    async with _async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def check_database_connection() -> Dict[str, Any]:
    """Verify Supabase PostgreSQL connectivity and latency."""
    if not settings.DATABASE_URL or not settings.async_database_url:
        return {
            "status": "unconfigured",
            "provider": "Supabase PostgreSQL",
            "message": "DATABASE_URL is not configured in environment variables.",
            "latency_ms": None,
        }

    engine = get_engine()
    if not engine:
        return {
            "status": "disconnected",
            "provider": "Supabase PostgreSQL",
            "message": "Failed to create database engine from provided connection string.",
            "latency_ms": None,
        }

    start_time = time.perf_counter()
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            val = result.scalar()
            latency = (time.perf_counter() - start_time) * 1000

            if val == 1:
                return {
                    "status": "connected",
                    "provider": "Supabase PostgreSQL",
                    "message": "Live connection to Supabase PostgreSQL verified.",
                    "latency_ms": round(latency, 2),
                }
            else:
                return {
                    "status": "degraded",
                    "provider": "Supabase PostgreSQL",
                    "message": f"Unexpected verification response: {val}",
                    "latency_ms": round(latency, 2),
                }
    except Exception as exc:
        latency = (time.perf_counter() - start_time) * 1000
        logger.warning(f"Supabase PostgreSQL connectivity check failed: {exc}")
        return {
            "status": "disconnected",
            "provider": "Supabase PostgreSQL",
            "message": f"Connection check failed: {str(exc)}",
            "latency_ms": round(latency, 2),
        }
