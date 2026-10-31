import uuid
from datetime import datetime
from typing import Any, Dict, TYPE_CHECKING
from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.core.database import Base
from app.models.user import GUID

if TYPE_CHECKING:
    from app.models.user import User


class Document(Base):
    """SQLAlchemy 2.0 Document model for workspace documents."""

    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        primary_key=True,
        default=uuid.uuid4,
        index=True,
    )
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        default="Untitled Document",
        index=True,
    )
    content: Mapped[Dict[str, Any]] = mapped_column(
        JSON().with_variant(JSONB(), "postgresql"),
        nullable=False,
        default=lambda: {"type": "doc", "content": []},
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    is_deleted: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # User-to-Documents relationship
    owner: Mapped["User"] = relationship("User", back_populates="documents")

    __table_args__ = (
        Index("ix_documents_owner_deleted_updated", "owner_id", "is_deleted", "updated_at"),
    )

    def __repr__(self) -> str:
        return f"<Document id={self.id} title='{self.title}' owner_id={self.owner_id} is_deleted={self.is_deleted}>"

