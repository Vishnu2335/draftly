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
    PublicDocumentResponse,
)
from app.schemas.share import (
    DocumentCollaborator,
    DocumentShareListResponse,
    DocumentShareRequest,
    DocumentShareUpdateRequest,
    SharedWithMeListResponse,
    SharedByMeListResponse,
)
from app.schemas.version import (
    DocumentVersionCreateRequest,
    DocumentVersionListResponse,
    DocumentVersionResponse,
)
from app.schemas.comment import (
    DocumentCommentCreateRequest,
    DocumentCommentListResponse,
    DocumentCommentResponse,
    DocumentCommentUpdateRequest,
)
from app.schemas.presence import DocumentPresenceResponse
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
    get_public_document_by_token,
    list_document_collaborators,
    list_shared_with_me,
    list_shared_by_me,
    revoke_collaborator_access,
    share_document,
    update_collaborator_role,
)
from app.services.version_service import (
    create_document_version,
    list_document_versions,
    restore_document_version,
)
from app.services.comment_service import (
    create_document_comment,
    delete_document_comment,
    list_document_comments,
    update_document_comment,
)
from app.services.presence_service import (
    get_active_presence,
    record_presence_heartbeat,
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
    "/shared-by-me",
    response_model=SharedByMeListResponse,
    summary="List documents shared by current user",
    description="Retrieve all documents owned by the authenticated user that have been shared with collaborators.",
)
async def get_shared_by_me(
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> SharedByMeListResponse:
    return await list_shared_by_me(
        db=db,
        user_id=current_user.id,
    )


@router.get(
    "/public/{token}",
    response_model=PublicDocumentResponse,
    summary="Get public read-only document",
    description="View a document publicly using its unique public share token without requiring authentication.",
)
async def get_public_document(
    token: str,
    db: AsyncSession = Depends(get_db),
) -> PublicDocumentResponse:
    doc, owner_username = await get_public_document_by_token(db=db, token=token)
    return PublicDocumentResponse(
        id=doc.id,
        title=doc.title,
        content=doc.content,
        owner_username=owner_username,
        updated_at=doc.updated_at,
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


# --- Sharing Endpoints ---

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


# --- Version History Endpoints ---

@router.get(
    "/{document_id}/versions",
    response_model=DocumentVersionListResponse,
    summary="List document versions",
    description="Retrieve all revision snapshots created for this document.",
)
async def get_document_versions_endpoint(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentVersionListResponse:
    return await list_document_versions(
        db=db,
        document_id=document_id,
        user_id=current_user.id,
    )


@router.post(
    "/{document_id}/versions",
    response_model=DocumentVersionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create version snapshot",
    description="Create a manual snapshot of the current document state.",
)
async def create_document_version_endpoint(
    document_id: uuid.UUID,
    req: Optional[DocumentVersionCreateRequest] = None,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentVersionResponse:
    title = req.title if req else None
    return await create_document_version(
        db=db,
        document_id=document_id,
        user_id=current_user.id,
        title=title,
    )


@router.post(
    "/{document_id}/versions/{version_id}/restore",
    response_model=DocumentResponse,
    summary="Restore document version",
    description="Revert the document content and title back to a previous snapshot state.",
)
async def restore_document_version_endpoint(
    document_id: uuid.UUID,
    version_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentResponse:
    doc = await restore_document_version(
        db=db,
        document_id=document_id,
        version_id=version_id,
        user_id=current_user.id,
    )
    res = DocumentResponse.model_validate(doc)
    res.user_role = "owner" if doc.owner_id == current_user.id else "editor"
    return res


# --- Comments Endpoints ---

@router.get(
    "/{document_id}/comments",
    response_model=DocumentCommentListResponse,
    summary="List comments",
    description="Retrieve all comments and discussion threads on this document.",
)
async def get_document_comments_endpoint(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentCommentListResponse:
    return await list_document_comments(
        db=db,
        document_id=document_id,
        user_id=current_user.id,
    )


@router.post(
    "/{document_id}/comments",
    response_model=DocumentCommentResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add comment",
    description="Add a comment to the document.",
)
async def add_document_comment_endpoint(
    document_id: uuid.UUID,
    req: DocumentCommentCreateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentCommentResponse:
    return await create_document_comment(
        db=db,
        document_id=document_id,
        user=current_user,
        req=req,
    )


@router.patch(
    "/{document_id}/comments/{comment_id}",
    response_model=DocumentCommentResponse,
    summary="Update or resolve comment",
    description="Edit comment text (author) or toggle resolved status (author, owner, editor).",
)
async def update_document_comment_endpoint(
    document_id: uuid.UUID,
    comment_id: uuid.UUID,
    req: DocumentCommentUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentCommentResponse:
    return await update_document_comment(
        db=db,
        document_id=document_id,
        comment_id=comment_id,
        user_id=current_user.id,
        req=req,
    )


@router.delete(
    "/{document_id}/comments/{comment_id}",
    summary="Delete comment",
    description="Delete a comment from the document (author or owner only).",
)
async def delete_document_comment_endpoint(
    document_id: uuid.UUID,
    comment_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> Dict[str, Any]:
    return await delete_document_comment(
        db=db,
        document_id=document_id,
        comment_id=comment_id,
        user_id=current_user.id,
    )


# --- Live Collaboration Presence Endpoints ---

@router.post(
    "/{document_id}/presence",
    response_model=DocumentPresenceResponse,
    summary="Send presence heartbeat",
    description="Report user presence on the document and receive currently active collaborators.",
)
async def presence_heartbeat_endpoint(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentPresenceResponse:
    return await record_presence_heartbeat(
        db=db,
        document_id=document_id,
        user=current_user,
    )


@router.get(
    "/{document_id}/presence",
    response_model=DocumentPresenceResponse,
    summary="Get active collaborators",
    description="Retrieve all collaborators who have viewed or edited this document within the last 60 seconds.",
)
async def get_presence_endpoint(
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_active_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentPresenceResponse:
    return await get_active_presence(
        db=db,
        document_id=document_id,
        user_id=current_user.id,
    )
