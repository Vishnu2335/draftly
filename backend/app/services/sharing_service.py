import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.document import Document
from app.models.document_share import DocumentShare
from app.models.user import User
from app.schemas.share import (
    DocumentCollaborator,
    DocumentOwnerInfo,
    DocumentShareListResponse,
    DocumentShareRequest,
    DocumentShareUpdateRequest,
    SharedWithMeItem,
    SharedWithMeListResponse,
    SharedByMeItem,
    SharedByMeListResponse,
)


def _check_is_expired(expires_at: Optional[datetime]) -> bool:
    """Helper to check if a share timestamp has passed in UTC."""
    if not expires_at:
        return False
    now_utc = datetime.now(timezone.utc)
    exp_utc = expires_at if expires_at.tzinfo else expires_at.replace(tzinfo=timezone.utc)
    return exp_utc < now_utc


async def get_document_with_role(
    db: AsyncSession,
    document_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Tuple[Document, str]:
    """
    Retrieve document and determine user's role ('owner', 'editor', or 'viewer').
    Raises 404 if document does not exist or caller has no access (prevents UUID enumeration).
    """
    stmt = select(Document).where(Document.id == document_id)
    result = await db.execute(stmt)
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    # Check if user is authoritative owner
    if document.owner_id == user_id:
        return document, "owner"

    # Check if shared with user
    share_stmt = select(DocumentShare).where(
        DocumentShare.document_id == document_id,
        DocumentShare.user_id == user_id,
    )
    share_res = await db.execute(share_stmt)
    share = share_res.scalar_one_or_none()

    if not share:
        # Non-collaborator: 404 for multi-tenant isolation
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    # Check if share has expired
    if _check_is_expired(share.expires_at):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your access to this document has expired.",
        )

    return document, share.role


async def share_document(
    db: AsyncSession,
    document_id: uuid.UUID,
    current_user: User,
    req: DocumentShareRequest,
) -> DocumentCollaborator:
    """
    Share a document with a registered user by email.
    Only the document owner can share.
    """
    # 1. Fetch document and check role
    document, role = await get_document_with_role(db, document_id, current_user.id)
    if role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the document owner can share this document.",
        )

    target_email = req.email.strip().lower()

    # 2. Prevent self-sharing
    if target_email == current_user.email.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot share a document with yourself.",
        )

    # 3. Find target registered user
    user_stmt = select(User).where(User.email == target_email)
    user_res = await db.execute(user_stmt)
    target_user = user_res.scalar_one_or_none()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with email '{req.email}' is not registered with Draftly.",
        )

    # 4. Check for duplicate share
    existing_share_stmt = select(DocumentShare).where(
        DocumentShare.document_id == document_id,
        DocumentShare.user_id == target_user.id,
    )
    existing_share_res = await db.execute(existing_share_stmt)
    existing_share = existing_share_res.scalar_one_or_none()

    if existing_share:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Document is already shared with '{req.email}' as '{existing_share.role}'.",
        )

    # 5. Calculate expiration if provided
    expires_at = None
    if req.expires_in_days:
        expires_at = datetime.now(timezone.utc) + timedelta(days=req.expires_in_days)

    # 6. Create new share
    new_share = DocumentShare(
        id=uuid.uuid4(),
        document_id=document_id,
        user_id=target_user.id,
        role=req.role,
        expires_at=expires_at,
    )
    db.add(new_share)
    await db.commit()
    await db.refresh(new_share)

    return DocumentCollaborator(
        id=new_share.id,
        user_id=target_user.id,
        email=target_user.email,
        username=target_user.username,
        role=new_share.role,
        expires_at=new_share.expires_at,
        is_expired=False,
        shared_at=new_share.shared_at,
    )


async def list_document_collaborators(
    db: AsyncSession,
    document_id: uuid.UUID,
    current_user_id: uuid.UUID,
) -> DocumentShareListResponse:
    """
    List all collaborators on a document alongside owner information.
    Accessible to the document owner.
    """
    document, role = await get_document_with_role(db, document_id, current_user_id)
    if role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the document owner can view the collaborators list.",
        )

    # Fetch owner details
    owner_stmt = select(User).where(User.id == document.owner_id)
    owner_res = await db.execute(owner_stmt)
    owner = owner_res.scalar_one()

    # Fetch all shares with joined users
    stmt = (
        select(DocumentShare, User)
        .join(User, DocumentShare.user_id == User.id)
        .where(DocumentShare.document_id == document_id)
        .order_by(DocumentShare.shared_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    collaborators = [
        DocumentCollaborator(
            id=share.id,
            user_id=user.id,
            email=user.email,
            username=user.username,
            role=share.role,
            expires_at=share.expires_at,
            is_expired=_check_is_expired(share.expires_at),
            shared_at=share.shared_at,
        )
        for share, user in rows
    ]

    return DocumentShareListResponse(
        document_id=document_id,
        owner=DocumentOwnerInfo(
            id=owner.id,
            email=owner.email,
            username=owner.username,
        ),
        collaborators=collaborators,
    )


async def update_collaborator_role(
    db: AsyncSession,
    document_id: uuid.UUID,
    owner_id: uuid.UUID,
    target_user_id: uuid.UUID,
    req: DocumentShareUpdateRequest,
) -> DocumentCollaborator:
    """
    Update a collaborator's role between 'editor' and 'viewer' and update expiration.
    Only the document owner can perform this operation.
    """
    document, role = await get_document_with_role(db, document_id, owner_id)
    if role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the document owner can update collaborator roles.",
        )

    stmt = (
        select(DocumentShare, User)
        .join(User, DocumentShare.user_id == User.id)
        .where(
            DocumentShare.document_id == document_id,
            DocumentShare.user_id == target_user_id,
        )
    )
    result = await db.execute(stmt)
    row = result.first()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collaborator not found for this document.",
        )

    share, user = row
    share.role = req.role

    if req.expires_in_days is not None:
        if req.expires_in_days > 0:
            share.expires_at = datetime.now(timezone.utc) + timedelta(days=req.expires_in_days)
        else:
            share.expires_at = None

    await db.commit()
    await db.refresh(share)

    return DocumentCollaborator(
        id=share.id,
        user_id=user.id,
        email=user.email,
        username=user.username,
        role=share.role,
        expires_at=share.expires_at,
        is_expired=_check_is_expired(share.expires_at),
        shared_at=share.shared_at,
    )


async def revoke_collaborator_access(
    db: AsyncSession,
    document_id: uuid.UUID,
    owner_id: uuid.UUID,
    target_user_id: uuid.UUID,
) -> Dict[str, Any]:
    """
    Revoke a collaborator's access to a document immediately.
    Only the document owner can perform this operation.
    """
    document, role = await get_document_with_role(db, document_id, owner_id)
    if role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the document owner can revoke collaborator access.",
        )

    stmt = select(DocumentShare).where(
        DocumentShare.document_id == document_id,
        DocumentShare.user_id == target_user_id,
    )
    result = await db.execute(stmt)
    share = result.scalar_one_or_none()

    if not share:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Collaborator not found for this document.",
        )

    await db.delete(share)
    await db.commit()

    return {
        "message": "Collaborator access revoked successfully.",
        "document_id": str(document_id),
        "user_id": str(target_user_id),
    }


async def list_shared_with_me(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> SharedWithMeListResponse:
    """
    List all active documents shared with the authenticated user.
    Includes owner metadata and collaborator's assigned role.
    """
    stmt = (
        select(Document, DocumentShare, User)
        .join(DocumentShare, Document.id == DocumentShare.document_id)
        .join(User, Document.owner_id == User.id)
        .where(
            DocumentShare.user_id == user_id,
            Document.is_deleted.is_(False),
        )
        .order_by(DocumentShare.shared_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    items = []
    for doc, share, owner in rows:
        if _check_is_expired(share.expires_at):
            continue
        items.append(
            SharedWithMeItem(
                id=doc.id,
                title=doc.title,
                content=doc.content,
                owner_id=owner.id,
                owner_email=owner.email,
                owner_username=owner.username,
                role=share.role,
                shared_at=share.shared_at,
                created_at=doc.created_at,
                updated_at=doc.updated_at,
            )
        )

    return SharedWithMeListResponse(
        items=items,
        total=len(items),
    )


async def list_shared_by_me(
    db: AsyncSession,
    user_id: uuid.UUID,
) -> SharedByMeListResponse:
    """
    List all active documents owned by the user that have at least one collaborator.
    Includes each document's collaborators with their roles and profile details.
    """
    stmt = (
        select(Document)
        .join(DocumentShare, Document.id == DocumentShare.document_id)
        .where(
            Document.owner_id == user_id,
            Document.is_deleted.is_(False),
        )
        .distinct()
        .order_by(Document.updated_at.desc())
    )
    result = await db.execute(stmt)
    documents = result.scalars().all()

    items = []
    for doc in documents:
        collab_stmt = (
            select(DocumentShare, User)
            .join(User, DocumentShare.user_id == User.id)
            .where(DocumentShare.document_id == doc.id)
            .order_by(DocumentShare.shared_at.desc())
        )
        collab_res = await db.execute(collab_stmt)
        collab_rows = collab_res.all()

        collaborators = [
            DocumentCollaborator(
                id=share.id,
                user_id=user.id,
                email=user.email,
                username=user.username,
                role=share.role,
                expires_at=share.expires_at,
                is_expired=_check_is_expired(share.expires_at),
                shared_at=share.shared_at,
            )
            for share, user in collab_rows
        ]

        items.append(
            SharedByMeItem(
                id=doc.id,
                title=doc.title,
                created_at=doc.created_at,
                updated_at=doc.updated_at,
                collaborators=collaborators,
                total_collaborators=len(collaborators),
            )
        )

    return SharedByMeListResponse(
        items=items,
        total=len(items),
    )


async def get_public_document_by_token(
    db: AsyncSession,
    token: str,
) -> Tuple[Document, str]:
    """Retrieve document by public share token without requiring login."""
    stmt = (
        select(Document, User.username)
        .join(User, Document.owner_id == User.id)
        .where(
            Document.public_share_token == token,
            Document.is_public.is_(True),
            Document.is_deleted.is_(False),
        )
    )
    result = await db.execute(stmt)
    row = result.first()
    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Public document not found or link has been disabled.",
        )
    doc, owner_username = row
    return doc, owner_username
