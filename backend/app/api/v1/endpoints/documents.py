import uuid
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.schemas.document import (
    DocumentCreateRequest,
    DocumentListResponse,
    DocumentResponse,
    DocumentUpdateRequest,
)
from app.services.auth_service import get_current_active_user
from app.services.document_service import (
    create_document,
    delete_document,
    get_document,
    list_documents,
    update_document,
)

router = APIRouter()


@router.get(
    "",
    response_model=DocumentListResponse,
    summary="List user documents",
    description="Retrieve all documents owned by the authenticated user with optional search, trash filtering, and sorting.",
)
async def get_documents(
    search: Optional[str] = Query(None, description="Case-insensitive title search query"),
    is_deleted: bool = Query(False, description="Filter active documents (False) or trash items (True)"),
    sort_by: str = Query("updated_at", pattern="^(updated_at|title|created_at)$", description="Field to sort by"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$", description="Sort direction ('asc' or 'desc')"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentListResponse:
    docs, total, active_count, trash_count = await list_documents(
        db=db,
        user_id=current_user.id,
        search=search,
        is_deleted=is_deleted,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return DocumentListResponse(
        items=[DocumentResponse.model_validate(d) for d in docs],
        total=total,
        active_count=active_count,
        trash_count=trash_count,
    )


@router.post(
    "",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new document",
    description="Create a blank or titled document in the workspace owned by the authenticated user.",
)
async def create_new_document(
    req: DocumentCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    doc = await create_document(
        db=db,
        user_id=current_user.id,
        req=req,
    )
    return DocumentResponse.model_validate(doc)


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Get document by ID",
    description="Retrieve full document details by ID. Enforces strict ownership access control.",
)
async def get_document_by_id(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    doc = await get_document(
        db=db,
        document_id=document_id,
        user_id=current_user.id,
    )
    return DocumentResponse.model_validate(doc)


@router.patch(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Update document",
    description="Update document title or change soft-delete status (restore from trash).",
)
async def update_document_by_id(
    document_id: uuid.UUID,
    req: DocumentUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    doc = await update_document(
        db=db,
        document_id=document_id,
        user_id=current_user.id,
        req=req,
    )
    return DocumentResponse.model_validate(doc)


@router.delete(
    "/{document_id}",
    summary="Delete document",
    description="Soft-delete a document to trash, or permanently purge an already-trashed document.",
)
async def delete_document_by_id(
    document_id: uuid.UUID,
    permanent: bool = Query(False, description="Permanently delete document from database if already in trash"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    return await delete_document(
        db=db,
        document_id=document_id,
        user_id=current_user.id,
        permanent=permanent,
    )
