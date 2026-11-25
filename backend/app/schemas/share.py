import uuid
from datetime import datetime
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class DocumentShareRequest(BaseModel):
    """Payload to invite/share document with a registered user by email."""

    email: EmailStr = Field(..., description="Email address of registered collaborator.")
    role: Literal["editor", "viewer"] = Field(
        default="viewer",
        description="Access role: 'editor' can modify content; 'viewer' has read-only access.",
    )
    expires_in_days: Optional[int] = Field(
        default=None,
        ge=1,
        le=365,
        description="Optional access expiration in days (e.g. 7, 30 days).",
    )


class DocumentShareUpdateRequest(BaseModel):
    """Payload to update an existing collaborator's role or expiration."""

    role: Literal["editor", "viewer"] = Field(
        ...,
        description="Updated access role ('editor' or 'viewer').",
    )
    expires_in_days: Optional[int] = Field(
        default=None,
        ge=1,
        le=365,
        description="Optional updated expiration in days, or None.",
    )


class DocumentCollaborator(BaseModel):
    """Collaborator information with user profile details."""

    id: uuid.UUID
    user_id: uuid.UUID
    email: str
    username: str
    role: str  # "editor" or "viewer"
    expires_at: Optional[datetime] = None
    is_expired: bool = False
    shared_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentOwnerInfo(BaseModel):
    """Document owner summary."""

    id: uuid.UUID
    email: str
    username: str


class DocumentShareListResponse(BaseModel):
    """List of all collaborators on a document alongside owner info."""

    document_id: uuid.UUID
    owner: DocumentOwnerInfo
    collaborators: List[DocumentCollaborator]


class SharedWithMeItem(BaseModel):
    """Document shared with current authenticated user."""

    id: uuid.UUID
    title: str
    content: Dict[str, Any]
    owner_id: uuid.UUID
    owner_email: str
    owner_username: str
    role: str  # "editor" or "viewer"
    shared_at: datetime
    created_at: datetime
    updated_at: datetime


class SharedWithMeListResponse(BaseModel):
    """List of documents shared with the authenticated user."""

    items: List[SharedWithMeItem]
    total: int


class SharedByMeItem(BaseModel):
    """Document owned by current user that has collaborators."""

    id: uuid.UUID
    title: str
    created_at: datetime
    updated_at: datetime
    collaborators: List[DocumentCollaborator]
    total_collaborators: int


class SharedByMeListResponse(BaseModel):
    """List of documents owned by user and shared with others."""

    items: List[SharedByMeItem]
    total: int

