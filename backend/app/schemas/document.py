import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class DocumentCreateRequest(BaseModel):
    """Payload to create a new document in the workspace."""

    title: Optional[str] = Field(
        default="Untitled Document",
        max_length=255,
        description="Optional title of the document. Defaults to 'Untitled Document'.",
    )
    content: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Initial structured JSON document content.",
    )


class DocumentUpdateRequest(BaseModel):
    """Payload to update document metadata, content, rename, or update trash state."""

    title: Optional[str] = Field(
        default=None,
        max_length=255,
        description="New document title.",
    )
    content: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Updated structured Tiptap JSON document content.",
    )
    is_deleted: Optional[bool] = Field(
        default=None,
        description="Soft deletion flag. Set true to move to trash, false to restore.",
    )


class DocumentResponse(BaseModel):
    """Complete document representation."""

    id: uuid.UUID
    title: str
    content: Dict[str, Any]
    owner_id: uuid.UUID
    is_deleted: bool
    user_role: Optional[str] = "owner"  # "owner" | "editor" | "viewer"
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentListResponse(BaseModel):
    """Paginated or filtered list of user documents with summary counts."""

    items: List[DocumentResponse]
    total: int
    active_count: int
    trash_count: int

