import uuid
from datetime import datetime, timedelta, timezone
from typing import List
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document_presence import DocumentPresence
from app.models.user import User
from app.schemas.presence import DocumentPresenceResponse, PresenceUser
from app.services.sharing_service import get_document_with_role


async def record_presence_heartbeat(
    db: AsyncSession,
    document_id: uuid.UUID,
    user: User,
) -> DocumentPresenceResponse:
    """Record heartbeat ping from active collaborator and return current active users."""
    await get_document_with_role(db, document_id, user.id)

    # Upsert presence record
    stmt = select(DocumentPresence).where(
        DocumentPresence.document_id == document_id,
        DocumentPresence.user_id == user.id,
    )
    res = await db.execute(stmt)
    presence = res.scalar_one_or_none()

    if presence:
        presence.last_seen_at = func.now()
    else:
        presence = DocumentPresence(
            id=uuid.uuid4(),
            document_id=document_id,
            user_id=user.id,
        )
        db.add(presence)

    await db.commit()

    return await get_active_presence(db, document_id, user.id)


async def get_active_presence(
    db: AsyncSession,
    document_id: uuid.UUID,
    user_id: uuid.UUID,
) -> DocumentPresenceResponse:
    """Retrieve active collaborators who reported heartbeat in the last 60 seconds."""
    await get_document_with_role(db, document_id, user_id)

    active_threshold = datetime.now(timezone.utc) - timedelta(seconds=60)

    stmt = (
        select(DocumentPresence, User)
        .join(User, DocumentPresence.user_id == User.id)
        .where(
            DocumentPresence.document_id == document_id,
            DocumentPresence.last_seen_at >= active_threshold,
        )
        .order_by(DocumentPresence.last_seen_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    active_users = [
        PresenceUser(
            user_id=u.id,
            username=u.username,
            email=u.email,
            last_seen_at=p.last_seen_at,
        )
        for p, u in rows
    ]

    return DocumentPresenceResponse(
        document_id=document_id,
        active_users=active_users,
    )
