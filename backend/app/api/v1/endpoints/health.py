from datetime import datetime, timezone
from typing import Any, Dict
from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import settings
from app.core.database import check_database_connection

router = APIRouter()


class DatabaseHealth(BaseModel):
    status: str
    provider: str
    message: str
    latency_ms: float | None = None


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    environment: str
    timestamp: str
    database: DatabaseHealth


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Service and Database Health Check",
    description="Returns current service operational status and Supabase PostgreSQL connectivity.",
)
async def get_health() -> Dict[str, Any]:
    """Perform health and database connectivity diagnostics."""
    db_status = await check_database_connection()

    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "database": db_status,
    }

