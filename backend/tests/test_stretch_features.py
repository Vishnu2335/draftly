import uuid
import pytest
from httpx import AsyncClient


async def register_and_login(
    client: AsyncClient, email: str, username: str, password: str = "SecurePass123!"
) -> dict:
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "username": username, "password": password},
    )
    assert reg_res.status_code == 201

    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    return {"user": reg_res.json(), "headers": {"Authorization": f"Bearer {token}"}}


@pytest.mark.asyncio
async def test_version_history_and_restore(client: AsyncClient):
    """Test manual version snapshotting and restoration."""
    owner = await register_and_login(client, "author_v@example.com", "author_v")

    # 1. Create document
    create_res = await client.post(
        "/api/v1/documents",
        headers=owner["headers"],
        json={"title": "Draft Initial", "content": {"type": "doc", "content": [{"type": "paragraph", "text": "v1 content"}]}},
    )
    assert create_res.status_code == 201
    doc_id = create_res.json()["id"]

    # 2. Create version snapshot
    v1_res = await client.post(
        f"/api/v1/documents/{doc_id}/versions",
        headers=owner["headers"],
        json={"title": "Version 1.0 Release"},
    )
    assert v1_res.status_code == 201
    v1_data = v1_res.json()
    assert v1_data["version_number"] == 1
    assert v1_data["title"] == "Version 1.0 Release"

    # 3. Update document to new content
    patch_res = await client.patch(
        f"/api/v1/documents/{doc_id}",
        headers=owner["headers"],
        json={"title": "Draft Altered", "content": {"type": "doc", "content": [{"type": "paragraph", "text": "v2 content"}]}},
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["title"] == "Draft Altered"

    # 4. List versions
    list_res = await client.get(
        f"/api/v1/documents/{doc_id}/versions",
        headers=owner["headers"],
    )
    assert list_res.status_code == 200
    versions = list_res.json()["items"]
    assert len(versions) >= 1

    # 5. Restore version 1
    restore_res = await client.post(
        f"/api/v1/documents/{doc_id}/versions/{v1_data['id']}/restore",
        headers=owner["headers"],
    )
    assert restore_res.status_code == 200
    restored = restore_res.json()
    assert restored["content"]["content"][0]["text"] == "v1 content"


@pytest.mark.asyncio
async def test_comments_flow(client: AsyncClient):
    """Test adding, listing, resolving, and deleting comments."""
    owner = await register_and_login(client, "comm_owner@example.com", "comm_owner")
    collab = await register_and_login(client, "comm_collab@example.com", "comm_collab")

    # Create doc and share with collab as viewer
    doc_res = await client.post(
        "/api/v1/documents",
        headers=owner["headers"],
        json={"title": "Proposal Doc", "content": {"type": "doc", "content": []}},
    )
    doc_id = doc_res.json()["id"]

    await client.post(
        f"/api/v1/documents/{doc_id}/share",
        headers=owner["headers"],
        json={"email": "comm_collab@example.com", "role": "viewer"},
    )

    # 1. Collab posts comment
    post_res = await client.post(
        f"/api/v1/documents/{doc_id}/comments",
        headers=collab["headers"],
        json={"content": "Please verify paragraph 2 metrics."},
    )
    assert post_res.status_code == 201
    comm = post_res.json()
    assert comm["content"] == "Please verify paragraph 2 metrics."
    assert comm["user_username"] == "comm_collab"
    assert comm["is_resolved"] is False

    # 2. List comments
    get_res = await client.get(
        f"/api/v1/documents/{doc_id}/comments",
        headers=owner["headers"],
    )
    assert get_res.status_code == 200
    assert len(get_res.json()["items"]) == 1

    # 3. Owner resolves comment
    resolve_res = await client.patch(
        f"/api/v1/documents/{doc_id}/comments/{comm['id']}",
        headers=owner["headers"],
        json={"is_resolved": True},
    )
    assert resolve_res.status_code == 200
    assert resolve_res.json()["is_resolved"] is True

    # 4. Collab deletes comment
    del_res = await client.delete(
        f"/api/v1/documents/{doc_id}/comments/{comm['id']}",
        headers=collab["headers"],
    )
    assert del_res.status_code == 200


@pytest.mark.asyncio
async def test_presence_heartbeat(client: AsyncClient):
    """Test live presence heartbeat and active collaborator listing."""
    owner = await register_and_login(client, "pres_owner@example.com", "pres_owner")

    doc_res = await client.post(
        "/api/v1/documents",
        headers=owner["headers"],
        json={"title": "Live Collab Doc", "content": {"type": "doc", "content": []}},
    )
    doc_id = doc_res.json()["id"]

    # Send heartbeat
    heartbeat_res = await client.post(
        f"/api/v1/documents/{doc_id}/presence",
        headers=owner["headers"],
    )
    assert heartbeat_res.status_code == 200
    active_users = heartbeat_res.json()["active_users"]
    assert len(active_users) == 1
    assert active_users[0]["username"] == "pres_owner"


@pytest.mark.asyncio
async def test_public_link_and_expiring_shares(client: AsyncClient):
    """Test public read-only link sharing and expiring share permissions."""
    owner = await register_and_login(client, "pub_owner@example.com", "pub_owner")
    collab = await register_and_login(client, "pub_collab@example.com", "pub_collab")

    doc_res = await client.post(
        "/api/v1/documents",
        headers=owner["headers"],
        json={"title": "Public Guide", "content": {"type": "doc", "content": [{"type": "paragraph", "text": "Public text"}]}},
    )
    doc_id = doc_res.json()["id"]

    # 1. Enable public link
    enable_pub = await client.patch(
        f"/api/v1/documents/{doc_id}",
        headers=owner["headers"],
        json={"is_public": True},
    )
    assert enable_pub.status_code == 200
    token = enable_pub.json()["public_share_token"]
    assert token is not None

    # 2. Fetch public document without any authorization headers!
    pub_get = await client.get(f"/api/v1/documents/public/{token}")
    assert pub_get.status_code == 200
    assert pub_get.json()["title"] == "Public Guide"
    assert pub_get.json()["owner_username"] == "pub_owner"

    # 3. Share with 7 days expiration
    share_res = await client.post(
        f"/api/v1/documents/{doc_id}/share",
        headers=owner["headers"],
        json={"email": "pub_collab@example.com", "role": "editor", "expires_in_days": 7},
    )
    assert share_res.status_code == 201
    assert share_res.json()["expires_at"] is not None
    assert share_res.json()["is_expired"] is False
