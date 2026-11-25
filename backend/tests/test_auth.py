from datetime import timedelta
import pytest
from httpx import AsyncClient

from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


@pytest.mark.asyncio
async def test_argon2_password_hashing():
    """Verify Argon2 password hashing and verification."""
    password = "SuperSecretPassword123!"
    hashed = hash_password(password)

    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


@pytest.mark.asyncio
async def test_jwt_token_generation_and_validation():
    """Requirement 5 & 6: Verify JWT token generation and signature validation."""
    user_id = "123e4567-e89b-12d3-a456-426614174000"
    email = "researcher@draftly.com"

    token = create_access_token(user_id=user_id, email=email)
    assert isinstance(token, str)
    assert len(token) > 20

    payload = decode_access_token(token)
    assert payload["sub"] == user_id
    assert payload["email"] == email
    assert "exp" in payload


@pytest.mark.asyncio
async def test_jwt_expired_token_rejection():
    """Requirement 9: Verify rejection of expired JWT access tokens."""
    user_id = "123e4567-e89b-12d3-a456-426614174000"
    email = "expired@draftly.com"

    # Create token expired 10 minutes ago
    expired_token = create_access_token(
        user_id=user_id,
        email=email,
        expires_delta=timedelta(minutes=-10),
    )

    with pytest.raises(ValueError, match="expired"):
        decode_access_token(expired_token)


@pytest.mark.asyncio
async def test_successful_registration(client: AsyncClient):
    """Requirement 1: Verify successful user registration."""
    payload = {
        "username": "elena_author",
        "email": "elena@draftly.com",
        "password": "StrongPassword2026!",
    }

    response = await client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201

    data = response.json()
    assert data["username"] == "elena_author"
    assert data["email"] == "elena@draftly.com"
    assert data["is_active"] is True
    assert "id" in data
    assert "created_at" in data
    # Ensure password hash is NEVER leaked in response
    assert "hashed_password" not in data
    assert "password" not in data


@pytest.mark.asyncio
async def test_duplicate_email_rejection(client: AsyncClient):
    """Requirement 2: Verify duplicate email registration is rejected."""
    payload = {
        "username": "first_user",
        "email": "duplicate@draftly.com",
        "password": "Password123!",
    }

    # First registration
    res1 = await client.post("/api/v1/auth/register", json=payload)
    assert res1.status_code == 201

    # Attempt duplicate registration with same email (case-insensitive)
    payload_dup = {
        "username": "second_user",
        "email": "DUPLICATE@draftly.com",
        "password": "AnotherPassword456!",
    }
    res2 = await client.post("/api/v1/auth/register", json=payload_dup)
    assert res2.status_code == 409
    error_data = res2.json()
    assert "error" in error_data
    assert "already exists" in error_data["error"]["message"].lower()


@pytest.mark.asyncio
async def test_successful_login(client: AsyncClient):
    """Requirement 3: Verify successful user login and JWT token issuance."""
    # Register user
    reg_payload = {
        "username": "marcus_pm",
        "email": "marcus@draftly.com",
        "password": "ProductLeaderPass!",
    }
    await client.post("/api/v1/auth/register", json=reg_payload)

    # Login
    login_payload = {
        "email": "marcus@draftly.com",
        "password": "ProductLeaderPass!",
    }
    response = await client.post("/api/v1/auth/login", json=login_payload)
    assert response.status_code == 200

    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] == 30 * 60
    assert data["user"]["email"] == "marcus@draftly.com"
    assert data["user"]["username"] == "marcus_pm"


@pytest.mark.asyncio
async def test_incorrect_password_rejection(client: AsyncClient):
    """Requirement 4: Verify login fails on incorrect password."""
    # Register user
    reg_payload = {
        "username": "aisha_policy",
        "email": "aisha@draftly.com",
        "password": "CorrectPassword123!",
    }
    await client.post("/api/v1/auth/register", json=reg_payload)

    # Login with wrong password
    bad_login = {
        "email": "aisha@draftly.com",
        "password": "WrongPasswordAttempt!",
    }
    response = await client.post("/api/v1/auth/login", json=bad_login)
    assert response.status_code == 401
    assert "incorrect email or password" in response.json()["error"]["message"].lower()


@pytest.mark.asyncio
async def test_current_user_endpoint(client: AsyncClient):
    """Requirement 7: Verify GET /api/v1/auth/me returns current user identity."""
    # Register & Login
    reg_payload = {
        "username": "valid_user",
        "email": "valid@draftly.com",
        "password": "ValidPassword999!",
    }
    await client.post("/api/v1/auth/register", json=reg_payload)

    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "valid@draftly.com", "password": "ValidPassword999!"},
    )
    token = login_res.json()["access_token"]

    # Call /me with Bearer token
    me_res = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert me_res.status_code == 200
    user_data = me_res.json()
    assert user_data["email"] == "valid@draftly.com"
    assert user_data["username"] == "valid_user"
    assert user_data["is_active"] is True


@pytest.mark.asyncio
async def test_unauthorized_access_rejection(client: AsyncClient):
    """Requirement 8: Verify rejection of requests without authentication token."""
    response = await client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "error" in response.json()


@pytest.mark.asyncio
async def test_invalid_token_rejection(client: AsyncClient):
    """Requirement 9: Verify rejection of invalid or malformed tokens."""
    response = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer completely-invalid-token-string"},
    )
    assert response.status_code == 401
    assert "error" in response.json()
