import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class DocumentVersionCreateRequest(BaseModel):
    """Payload to create a manual snapshot/version of a document."""

    title: Optional[str] = Field(
        default=None,
        max_length=255,
        description="Optional version label or name. If omitted, uses current document title.",
    )


class DocumentVersionResponse(BaseModel):
    """Document snapshot representation."""

    id: uuid.UUID
    document_id: uuid.UUID
    version_number: int
    title: str
    content: Dict[str, Any]
    created_by_id: Optional[uuid.UUID] = None
    created_by_username: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentVersionListResponse(BaseModel):
    """List of all version snapshots for a document."""

    items: List[DocumentVersionResponse]
    total: int
