import uuid
from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document_comment import DocumentComment
from app.models.user import User
from app.schemas.comment import (
    DocumentCommentCreateRequest,
    DocumentCommentListResponse,
    DocumentCommentResponse,
    DocumentCommentUpdateRequest,
)
from app.services.sharing_service import get_document_with_role


async def create_document_comment(
    db: AsyncSession,
    document_id: uuid.UUID,
    user: User,
    req: DocumentCommentCreateRequest,
) -> DocumentCommentResponse:
    """Create a new comment on a document (accessible to owner, editor, or viewer)."""
    await get_document_with_role(db, document_id, user.id)

    comment = DocumentComment(
        id=uuid.uuid4(),
        document_id=document_id,
        user_id=user.id,
        content=req.content.strip(),
        is_resolved=False,
    )

    db.add(comment)
    await db.commit()
    await db.refresh(comment)

    return DocumentCommentResponse(
        id=comment.id,
        document_id=comment.document_id,
        user_id=comment.user_id,
        user_email=user.email,
        user_username=user.username,
        content=comment.content,
        is_resolved=comment.is_resolved,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
    )


async def list_document_comments(
    db: AsyncSession,
    document_id: uuid.UUID,
    user_id: uuid.UUID,
) -> DocumentCommentListResponse:
    """List all comments on a document with author profiles."""
    await get_document_with_role(db, document_id, user_id)

    stmt = (
        select(DocumentComment, User)
        .join(User, DocumentComment.user_id == User.id)
        .where(DocumentComment.document_id == document_id)
        .order_by(DocumentComment.created_at.asc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    items = [
        DocumentCommentResponse(
            id=c.id,
            document_id=c.document_id,
            user_id=c.user_id,
            user_email=u.email,
            user_username=u.username,
            content=c.content,
            is_resolved=c.is_resolved,
            created_at=c.created_at,
            updated_at=c.updated_at,
        )
        for c, u in rows
    ]

    return DocumentCommentListResponse(items=items, total=len(items))


async def update_document_comment(
    db: AsyncSession,
    document_id: uuid.UUID,
    comment_id: uuid.UUID,
    user_id: uuid.UUID,
    req: DocumentCommentUpdateRequest,
) -> DocumentCommentResponse:
    """Update comment text (author only) or resolution state (author, owner, or editor)."""
    doc, role = await get_document_with_role(db, document_id, user_id)

    stmt = (
        select(DocumentComment, User)
        .join(User, DocumentComment.user_id == User.id)
        .where(
            DocumentComment.id == comment_id,
            DocumentComment.document_id == document_id,
        )
    )
    result = await db.execute(stmt)
    row = result.first()

    if not row:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found.",
        )

    comment, author = row

    if req.content is not None:
        if comment.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only the author can edit the comment text.",
            )
        comment.content = req.content.strip()

    if req.is_resolved is not None:
        # Resolving is permitted for author, owner, or editor
        if comment.user_id != user_id and role not in ["owner", "editor"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Viewers cannot resolve comments they did not author.",
            )
        comment.is_resolved = req.is_resolved

    await db.commit()
    await db.refresh(comment)

    return DocumentCommentResponse(
        id=comment.id,
        document_id=comment.document_id,
        user_id=comment.user_id,
        user_email=author.email,
        user_username=author.username,
        content=comment.content,
        is_resolved=comment.is_resolved,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
    )


async def delete_document_comment(
    db: AsyncSession,
    document_id: uuid.UUID,
    comment_id: uuid.UUID,
    user_id: uuid.UUID,
) -> dict:
    """Delete a comment (author or document owner only)."""
    doc, role = await get_document_with_role(db, document_id, user_id)

    stmt = select(DocumentComment).where(
        DocumentComment.id == comment_id,
        DocumentComment.document_id == document_id,
    )
    result = await db.execute(stmt)
    comment = result.scalar_one_or_none()

    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found.",
        )

    if comment.user_id != user_id and role != "owner":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the author or document owner can delete this comment.",
        )

    await db.delete(comment)
    await db.commit()
    return {"message": "Comment deleted successfully."}
