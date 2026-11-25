import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserRegisterRequest(BaseModel):
    """Payload for user registration."""

    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        description="Public display and handle name.",
    )
    email: EmailStr = Field(
        ...,
        description="Unique user email address.",
    )
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Password must contain at least 8 characters.",
    )


class UserLoginRequest(BaseModel):
    """Payload for user login."""

    email: EmailStr = Field(..., description="Registered user email.")
    password: str = Field(..., min_length=1, description="Account password.")


class UserResponse(BaseModel):
    """Public user identity model (omits sensitive password hashes)."""

    id: uuid.UUID
    username: str
    email: EmailStr
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenResponse(BaseModel):
    """JWT bearer token response on successful authentication."""

    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse

