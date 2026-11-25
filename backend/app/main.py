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

    # In production, enforce that PostgreSQL is configured and prevent SQLite
    if settings.ENVIRONMENT.lower() == "production":
        if not settings.DATABASE_URL:
            err_msg = (
                "FATAL: Production deployment requires a valid Supabase PostgreSQL connection string "
                "in the DATABASE_URL environment variable (e.g. postgresql+asyncpg://postgres:[PASSWORD]@[HOST]:5432/postgres?ssl=require). "
                "SQLite is disabled in production."
            )
            logger.critical(err_msg)
            raise RuntimeError(err_msg)
        if "sqlite" in settings.DATABASE_URL.lower():
            err_msg = "FATAL: SQLite is strictly forbidden in production. Please configure Supabase PostgreSQL in DATABASE_URL."
            logger.critical(err_msg)
            raise RuntimeError(err_msg)
        if not settings.async_database_url or not settings.async_database_url.startswith("postgresql+asyncpg://"):
            err_msg = (
                "FATAL: DATABASE_URL must be a valid PostgreSQL connection URI "
                "(postgresql+asyncpg://postgres:[PASSWORD]@[HOST]:5432/postgres?ssl=require). "
                "Do not use Supabase project URLs (https://...) or API keys (sb_publishable_... / sb_secret_...)."
            )
            logger.critical(err_msg)
            raise RuntimeError(err_msg)

    # If using local SQLite database in development, ensure all tables are created
    engine = get_engine()
    if engine and "sqlite" in str(engine.url) and settings.ENVIRONMENT.lower() != "production":
        import app.models  # noqa: F401
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Local SQLite database tables initialized.")

    # Verify initial database state on startup
    db_health = await check_database_connection()
    if db_health["status"] == "connected":
        logger.info(f"{db_health['provider']}: Connected (Latency: {db_health['latency_ms']}ms)")
    elif settings.ENVIRONMENT.lower() == "production":
        err_msg = f"FATAL: Database connection failed during production startup: {db_health['message']}"
        logger.critical(err_msg)
        raise RuntimeError(err_msg)
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
# Supports explicit origins from CORS_ORIGINS as well as all Vercel production and preview deployment domains (*.vercel.app)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https://([a-zA-Z0-9_-]+\.)*vercel\.app$",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
    expose_headers=["*"],
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
