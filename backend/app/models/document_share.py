import uuid
from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import DateTime, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.user import GUID

if TYPE_CHECKING:
    from app.models.document import Document
    from app.models.user import User


class DocumentShare(Base):
    """SQLAlchemy 2.0 DocumentShare model for Role-Based Access Control (Phase 6)."""

    __tablename__ = "document_shares"

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
    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="viewer",
    )  # "editor" or "viewer"
    shared_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    # Relationships
    document: Mapped["Document"] = relationship("Document", back_populates="shares")
    user: Mapped["User"] = relationship("User", back_populates="shared_documents")

    __table_args__ = (
        UniqueConstraint("document_id", "user_id", name="uq_document_shares_doc_user"),
        Index("ix_document_shares_user_role", "user_id", "role"),
    )

    def __repr__(self) -> str:
        return f"<DocumentShare id={self.id} document_id={self.document_id} user_id={self.user_id} role={self.role}>"
