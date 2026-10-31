import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.api import api_router
from app.api.v1.endpoints.health import get_health
from app.core.config import settings
from app.core.database import Base, check_database_connection, get_engine
from app.core.exceptions import register_exception_handlers

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("draftly")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager for startup and shutdown hooks."""
    logger.info(f"Starting {settings.PROJECT_NAME} API v{settings.VERSION} [{settings.ENVIRONMENT}]")

    # If using local SQLite database in development, ensure all tables are created
    engine = get_engine()
    if engine and "sqlite" in str(engine.url):
        import app.models  # noqa: F401
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Local SQLite database tables initialized.")

    # Verify initial database state on startup
    db_health = await check_database_connection()
    if db_health["status"] == "connected":
        logger.info(f"{db_health['provider']}: Connected (Latency: {db_health['latency_ms']}ms)")
    elif db_health["status"] == "unconfigured":
        logger.info("Database: Unconfigured (DATABASE_URL not set). Ready for configuration.")
    else:
        logger.warning(f"Database: {db_health['status']} - {db_health['message']}")

    yield

    logger.info(f"Shutting down {settings.PROJECT_NAME} API.")


app = FastAPI(
    title=f"{settings.PROJECT_NAME} API",
    version=settings.VERSION,
    description="Backend API for Draftly — Next-generation document workspace.",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# CORS Configuration
if settings.CORS_ORIGINS:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Register Exception Handlers
register_exception_handlers(app)

# Root service banner
@app.get("/", tags=["Root"], summary="API Root")
async def root() -> JSONResponse:
    return JSONResponse(
        content={
            "service": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "status": "online",
            "docs": "/docs",
            "health": "/health",
            "api_v1": settings.API_V1_STR,
        }
    )

# Convenience health check at root /health for Render / Vercel monitors
@app.get("/health", tags=["Health & Diagnostics"], summary="Root Health Check")
async def root_health():
    return await get_health()

# Mount API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
