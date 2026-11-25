from fastapi import APIRouter
from app.api.v1.endpoints import auth, documents, health

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health & Diagnostics"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication & Users"])
api_router.include_router(documents.router, prefix="/documents", tags=["Workspace Documents"])
