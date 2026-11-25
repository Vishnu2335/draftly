import uuid
from typing import Any, Dict, List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document
from app.schemas.document import DocumentCreateRequest, DocumentUpdateRequest


async def create_document(
    db: AsyncSession,
    user_id: uuid.UUID,
    req: DocumentCreateRequest,
) -> Document:
    """Create a new document owned by the authenticated user."""
    raw_title = (req.title or "").strip()
    title = raw_title if raw_title else "Untitled Document"
    content = req.content if req.content is not None else {"type": "doc", "content": []}

    document = Document(
        id=uuid.uuid4(),
        title=title,
        content=content,
        owner_id=user_id,
        is_deleted=False,
    )

    db.add(document)
    await db.commit()
    await db.refresh(document)
    return document


async def get_document(
    db: AsyncSession,
    document_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Tuple[Document, str]:
    """Retrieve document by ID checking owner or collaborator permissions."""
    from app.services.sharing_service import get_document_with_role

    return await get_document_with_role(db, document_id, user_id)


async def list_documents(
    db: AsyncSession,
    user_id: uuid.UUID,
    search: Optional[str] = None,
    is_deleted: bool = False,
    sort_by: str = "updated_at",
    sort_order: str = "desc",
) -> Tuple[List[Document], int, int, int]:
    """List documents for the user with search, filtering, and summary counts."""
    # Base query for user's documents in the specified state (active or trash)
    stmt = select(Document).where(
        Document.owner_id == user_id,
        Document.is_deleted == is_deleted,
    )

    # Case-insensitive title search
    if search and search.strip():
        search_pattern = f"%{search.strip().lower()}%"
        stmt = stmt.where(func.lower(Document.title).like(search_pattern))

    # Apply sorting
    if sort_by == "title":
        order_col = Document.title.asc() if sort_order.lower() == "asc" else Document.title.desc()
    elif sort_by == "created_at":
        order_col = Document.created_at.asc() if sort_order.lower() == "asc" else Document.created_at.desc()
    else:  # default updated_at
        order_col = Document.updated_at.asc() if sort_order.lower() == "asc" else Document.updated_at.desc()

    stmt = stmt.order_by(order_col)

    result = await db.execute(stmt)
    documents = list(result.scalars().all())

    # Calculate live workspace counts
    active_count_stmt = select(func.count(Document.id)).where(
        Document.owner_id == user_id,
        Document.is_deleted.is_(False),
    )
    trash_count_stmt = select(func.count(Document.id)).where(
        Document.owner_id == user_id,
        Document.is_deleted.is_(True),
    )

    active_count_res = await db.execute(active_count_stmt)
    trash_count_res = await db.execute(trash_count_stmt)

    active_count = active_count_res.scalar() or 0
    trash_count = trash_count_res.scalar() or 0

    return documents, len(documents), active_count, trash_count


async def update_document(
    db: AsyncSession,
    document_id: uuid.UUID,
    user_id: uuid.UUID,
    req: DocumentUpdateRequest,
) -> Tuple[Document, str]:
    """Update document content (owner or editor), or metadata/deletion (owner only)."""
    document, role = await get_document(db, document_id, user_id)

    if role == "viewer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Viewers cannot modify document content or properties.",
        )

    if role == "editor":
        # Editor cannot rename
        if req.title is not None and req.title.strip() != document.title:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the document owner can rename this document.",
            )
        # Editor cannot soft delete or restore
        if req.is_deleted is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the document owner can delete or restore this document.",
            )
        # Editor is permitted to update content
        if req.content is not None:
            document.content = req.content
            document.updated_at = func.now()
            await db.commit()
            await db.refresh(document)
        return document, role

    # Owner has full update capabilities
    if req.title is not None:
        cleaned_title = req.title.strip()
        document.title = cleaned_title if cleaned_title else "Untitled Document"

    if req.content is not None:
        document.content = req.content

    if req.is_deleted is not None:
        document.is_deleted = req.is_deleted

    # Touch update timestamp
    document.updated_at = func.now()

    await db.commit()
    await db.refresh(document)
    return document, role


async def delete_document(
    db: AsyncSession,
    document_id: uuid.UUID,
    user_id: uuid.UUID,
    permanent: bool = False,
) -> Dict[str, Any]:
    """Soft delete document to trash, or permanently delete from trash (Owner only)."""
    document, role = await get_document(db, document_id, user_id)

    if role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the document owner can delete this document.",
        )

    if permanent:
        await db.delete(document)
        await db.commit()
        return {
            "message": "Document permanently deleted.",
            "id": str(document_id),
            "permanent": True,
        }

    # Soft delete
    document.is_deleted = True
    document.updated_at = func.now()
    await db.commit()
    return {
        "message": "Document moved to trash.",
        "id": str(document_id),
        "permanent": False,
    }

