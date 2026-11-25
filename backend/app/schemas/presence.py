import uuid
from datetime import datetime
from typing import List
from pydantic import BaseModel, ConfigDict


class PresenceUser(BaseModel):
    """Active user presence representation."""

    user_id: uuid.UUID
    username: str
    email: str
    last_seen_at: datetime

    model_config = ConfigDict(from_attributes=True)


class DocumentPresenceResponse(BaseModel):
    """List of active collaborators viewing or editing this document."""

    document_id: uuid.UUID
    active_users: List[PresenceUser]
