import uuid
from typing import Any, Dict, Optional
from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.schemas.document import (
    DocumentCreateRequest,
    DocumentListResponse,
    DocumentResponse,
    DocumentUpdateRequest,
)
from app.schemas.share import (
    DocumentCollaborator,
    DocumentShareListResponse,
    DocumentShareRequest,
    DocumentShareUpdateRequest,
    SharedWithMeListResponse,
)
from app.services.auth_service import get_current_active_user
from app.services.document_service import (
    create_document,
    delete_document,
    get_document,
    list_documents,
    update_document,
)
from app.services.import_service import process_document_import
from app.services.sharing_service import (
    list_document_collaborators,
    list_shared_with_me,
    revoke_collaborator_access,
    share_document,
    update_collaborator_role,
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
    items = []
    for d in docs:
        resp = DocumentResponse.model_validate(d)
        resp.user_role = "owner"
        items.append(resp)

    return DocumentListResponse(
        items=items,
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
    res = DocumentResponse.model_validate(doc)
    res.user_role = "owner"
    return res


@router.post(
    "/import",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Import external document",
    description="Upload and import a .txt, .md, or .docx file (up to 10MB) into Tiptap structured document content.",
)
async def import_document(
    file: UploadFile = File(..., description="Document file to import (.txt, .md, .docx)"),
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    title, content = await process_document_import(file)
    doc = await create_document(
        db=db,
        user_id=current_user.id,
        req=DocumentCreateRequest(title=title, content=content),
    )
    res = DocumentResponse.model_validate(doc)
    res.user_role = "owner"
    return res


@router.get(
    "/shared-with-me",
    response_model=SharedWithMeListResponse,
    summary="List documents shared with current user",
    description="Retrieve all documents shared with the authenticated user with owner information and assigned role.",
)
async def get_shared_with_me(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> SharedWithMeListResponse:
    return await list_shared_with_me(
        db=db,
        user_id=current_user.id,
    )


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Get document by ID",
    description="Retrieve full document details by ID. Enforces strict RBAC access control (owner, editor, or viewer).",
)
async def get_document_by_id(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    doc, role = await get_document(
        db=db,
        document_id=document_id,
        user_id=current_user.id,
    )
    res = DocumentResponse.model_validate(doc)
    res.user_role = role
    return res


@router.patch(
    "/{document_id}",
    response_model=DocumentResponse,
    summary="Update document",
    description="Update document content (owner or editor), or title and trash status (owner only).",
)
async def update_document_by_id(
    document_id: uuid.UUID,
    req: DocumentUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    doc, role = await update_document(
        db=db,
        document_id=document_id,
        user_id=current_user.id,
        req=req,
    )
    res = DocumentResponse.model_validate(doc)
    res.user_role = role
    return res


@router.delete(
    "/{document_id}",
    summary="Delete document",
    description="Soft-delete a document to trash, or permanently purge an already-trashed document (owner only).",
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


@router.post(
    "/{document_id}/share",
    response_model=DocumentCollaborator,
    status_code=status.HTTP_201_CREATED,
    summary="Share document with user",
    description="Share document with a registered user by email address with 'editor' or 'viewer' role (owner only).",
)
async def share_document_endpoint(
    document_id: uuid.UUID,
    req: DocumentShareRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentCollaborator:
    return await share_document(
        db=db,
        document_id=document_id,
        current_user=current_user,
        req=req,
    )


@router.get(
    "/{document_id}/shares",
    response_model=DocumentShareListResponse,
    summary="List document collaborators",
    description="List all collaborators on a document alongside owner information (owner only).",
)
async def list_document_shares_endpoint(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentShareListResponse:
    return await list_document_collaborators(
        db=db,
        document_id=document_id,
        current_user_id=current_user.id,
    )


@router.patch(
    "/{document_id}/shares/{collaborator_user_id}",
    response_model=DocumentCollaborator,
    summary="Update collaborator role",
    description="Change a collaborator's access role between 'editor' and 'viewer' (owner only).",
)
async def update_collaborator_role_endpoint(
    document_id: uuid.UUID,
    collaborator_user_id: uuid.UUID,
    req: DocumentShareUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentCollaborator:
    return await update_collaborator_role(
        db=db,
        document_id=document_id,
        owner_id=current_user.id,
        target_user_id=collaborator_user_id,
        req=req,
    )


@router.delete(
    "/{document_id}/shares/{collaborator_user_id}",
    summary="Revoke collaborator access",
    description="Immediately revoke collaborator access to a document (owner only).",
)
async def revoke_collaborator_access_endpoint(
    document_id: uuid.UUID,
    collaborator_user_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    return await revoke_collaborator_access(
        db=db,
        document_id=document_id,
        owner_id=current_user.id,
        target_user_id=collaborator_user_id,
    )
