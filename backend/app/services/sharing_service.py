import uuid
from typing import Any, Dict, List, Tuple
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
)


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

    # 5. Create new share
    new_share = DocumentShare(
        id=uuid.uuid4(),
        document_id=document_id,
        user_id=target_user.id,
        role=req.role,
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
    Update a collaborator's role between 'editor' and 'viewer'.
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
    await db.commit()
    await db.refresh(share)

    return DocumentCollaborator(
        id=share.id,
        user_id=user.id,
        email=user.email,
        username=user.username,
        role=share.role,
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

    items = [
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
        for doc, share, owner in rows
    ]

    return SharedWithMeListResponse(
        items=items,
        total=len(items),
    )
