import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field


class DocumentCommentCreateRequest(BaseModel):
    """Payload to create a comment on a document."""

    content: str = Field(..., min_length=1, max_length=5000, description="Comment text.")


class DocumentCommentUpdateRequest(BaseModel):
    """Payload to update or resolve a comment."""

    content: Optional[str] = Field(default=None, min_length=1, max_length=5000)
    is_resolved: Optional[bool] = None


class DocumentCommentResponse(BaseModel):
    """Comment details with author profile."""

    id: uuid.UUID
    document_id: uuid.UUID
    user_id: uuid.UUID
    user_email: str
    user_username: str
    content: str
    is_resolved: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentCommentListResponse(BaseModel):
    """List of comments on a document."""

    items: List[DocumentCommentResponse]
    total: int
