import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app


@pytest.mark.asyncio
async def test_cors_preflight_login_allowed_vercel_domain():
    """Verify that OPTIONS preflight request to /api/v1/auth/login from a Vercel domain succeeds with CORS headers."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.options(
            "/api/v1/auth/login",
            headers={
                "Origin": "https://draftly-production.vercel.app",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "https://draftly-production.vercel.app"
        assert response.headers.get("access-control-allow-credentials") == "true"


@pytest.mark.asyncio
async def test_cors_preflight_register_allowed_vercel_preview():
    """Verify that OPTIONS preflight request to /api/v1/auth/register from a Vercel preview domain succeeds."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.options(
            "/api/v1/auth/register",
            headers={
                "Origin": "https://draftly-git-feature-vishnu.vercel.app",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "https://draftly-git-feature-vishnu.vercel.app"
        assert response.headers.get("access-control-allow-credentials") == "true"


@pytest.mark.asyncio
async def test_cors_preflight_localhost_allowed():
    """Verify that local development origins remain allowed."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.options(
            "/api/v1/auth/login",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"


@pytest.mark.asyncio
async def test_cors_unauthorized_origin_blocked():
    """Verify that an unauthorized origin does not receive CORS allow headers."""
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.options(
            "/api/v1/auth/login",
            headers={
                "Origin": "https://malicious-site.com",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
        )
        # Unauthorized origin must not have access-control-allow-origin header
        assert response.headers.get("access-control-allow-origin") is None

