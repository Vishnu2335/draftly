import uuid
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import DateTime, ForeignKey, Index, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.user import GUID

if TYPE_CHECKING:
    from app.models.document import Document
    from app.models.user import User


class DocumentPresence(Base):
    """SQLAlchemy 2.0 DocumentPresence model for real-time collaboration presence."""

    __tablename__ = "document_presence"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    document: Mapped["Document"] = relationship("Document", backref="presences")
    user: Mapped["User"] = relationship("User")

    __table_args__ = (
        UniqueConstraint("document_id", "user_id", name="uq_document_presence_doc_user"),
        Index("ix_document_presence_doc_seen", "document_id", "last_seen_at"),
    )

    def __repr__(self) -> str:
        return f"<DocumentPresence doc={self.document_id} user={self.user_id} last_seen={self.last_seen_at}>"
