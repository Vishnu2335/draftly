import uuid
from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.document import Document
from app.models.document_version import DocumentVersion
from app.models.user import User
from app.schemas.version import DocumentVersionListResponse, DocumentVersionResponse
from app.services.sharing_service import get_document_with_role


async def create_document_version(
    db: AsyncSession,
    document_id: uuid.UUID,
    user_id: uuid.UUID,
    title: Optional[str] = None,
) -> DocumentVersionResponse:
    """Create a new version snapshot of the current document state."""
    doc, role = await get_document_with_role(db, document_id, user_id)
    if role == "viewer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Viewers cannot create version snapshots.",
        )

    # Calculate next version number
    count_stmt = select(func.count(DocumentVersion.id)).where(
        DocumentVersion.document_id == document_id
    )
    res = await db.execute(count_stmt)
    current_count = res.scalar() or 0
    next_num = current_count + 1

    # Fetch user username
    user_stmt = select(User).where(User.id == user_id)
    u_res = await db.execute(user_stmt)
    user = u_res.scalar_one_or_none()

    version_title = (title or "").strip() or f"Version {next_num}: {doc.title}"

    version = DocumentVersion(
        id=uuid.uuid4(),
        document_id=document_id,
        version_number=next_num,
        title=version_title,
        content=doc.content,
        created_by_id=user_id,
    )

    db.add(version)
    await db.commit()
    await db.refresh(version)

    return DocumentVersionResponse(
        id=version.id,
        document_id=version.document_id,
        version_number=version.version_number,
        title=version.title,
        content=version.content,
        created_by_id=version.created_by_id,
        created_by_username=user.username if user else "Unknown",
        created_at=version.created_at,
    )


async def list_document_versions(
    db: AsyncSession,
    document_id: uuid.UUID,
    user_id: uuid.UUID,
) -> DocumentVersionListResponse:
    """List all version snapshots for a document."""
    await get_document_with_role(db, document_id, user_id)

    stmt = (
        select(DocumentVersion, User.username)
        .outerjoin(User, DocumentVersion.created_by_id == User.id)
        .where(DocumentVersion.document_id == document_id)
        .order_by(desc(DocumentVersion.version_number))
    )
    result = await db.execute(stmt)
    rows = result.all()

    items = [
        DocumentVersionResponse(
            id=v.id,
            document_id=v.document_id,
            version_number=v.version_number,
            title=v.title,
            content=v.content,
            created_by_id=v.created_by_id,
            created_by_username=username or "Unknown",
            created_at=v.created_at,
        )
        for v, username in rows
    ]

    return DocumentVersionListResponse(items=items, total=len(items))


async def restore_document_version(
    db: AsyncSession,
    document_id: uuid.UUID,
    version_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Document:
    """Restore document content and title from a specific version snapshot."""
    doc, role = await get_document_with_role(db, document_id, user_id)
    if role == "viewer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Viewers cannot restore versions.",
        )

    # Fetch the target version
    stmt = select(DocumentVersion).where(
        DocumentVersion.id == version_id,
        DocumentVersion.document_id == document_id,
    )
    result = await db.execute(stmt)
    version = result.scalar_one_or_none()
    if not version:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document version snapshot not found.",
        )

    # Auto-save current state as a snapshot before overwriting
    count_stmt = select(func.count(DocumentVersion.id)).where(
        DocumentVersion.document_id == document_id
    )
    c_res = await db.execute(count_stmt)
    c_num = (c_res.scalar() or 0) + 1

    pre_restore_backup = DocumentVersion(
        id=uuid.uuid4(),
        document_id=document_id,
        version_number=c_num,
        title=f"Auto-saved prior to restoring v{version.version_number}",
        content=doc.content,
        created_by_id=user_id,
    )
    db.add(pre_restore_backup)

    # Restore content & title
    doc.content = version.content
    doc.updated_at = func.now()

    await db.commit()
    await db.refresh(doc)
    return doc
