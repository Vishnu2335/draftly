import uuid
import pytest
from httpx import AsyncClient


async def register_and_login(client: AsyncClient, email: str, username: str, password: str = "SecurePass123!") -> dict:
    """Helper to register and login a test user, returning auth headers and user info."""
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "username": username, "password": password},
    )
    assert reg_res.status_code == 201, f"Failed to register {email}: {reg_res.text}"
    user_data = reg_res.json()

    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert login_res.status_code == 200, f"Failed to login {email}: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    return {"user": user_data, "headers": headers}


@pytest.mark.asyncio
async def test_sharing_and_validations(client: AsyncClient):
    """Test document sharing flow, self-share prevention, unregistered email, and duplicates."""
    owner = await register_and_login(client, "owner_share@example.com", "owner_share")
    collab = await register_and_login(client, "collab_share@example.com", "collab_share")

    # Owner creates a document
    doc_res = await client.post(
        "/api/v1/documents",
        headers=owner["headers"],
        json={"title": "Team Strategy Document", "content": {"type": "doc", "content": []}},
    )
    assert doc_res.status_code == 201
    doc_id = doc_res.json()["id"]

    # 1. Successful share with editor role
    share_res = await client.post(
        f"/api/v1/documents/{doc_id}/share",
        headers=owner["headers"],
        json={"email": "collab_share@example.com", "role": "editor"},
    )
    assert share_res.status_code == 201
    share_data = share_res.json()
    assert share_data["email"] == "collab_share@example.com"
    assert share_data["role"] == "editor"
    assert share_data["user_id"] == collab["user"]["id"]

    # 2. Self-sharing prevention
    self_share_res = await client.post(
        f"/api/v1/documents/{doc_id}/share",
        headers=owner["headers"],
        json={"email": "owner_share@example.com", "role": "viewer"},
    )
    assert self_share_res.status_code == 400
    assert "Cannot share a document with yourself" in self_share_res.json()["error"]["message"]

    # 3. Sharing with unregistered email
    not_found_res = await client.post(
        f"/api/v1/documents/{doc_id}/share",
        headers=owner["headers"],
        json={"email": "ghost_user@example.com", "role": "viewer"},
    )
    assert not_found_res.status_code == 404
    assert "not registered" in not_found_res.json()["error"]["message"]

    # 4. Duplicate share prevention
    dup_res = await client.post(
        f"/api/v1/documents/{doc_id}/share",
        headers=owner["headers"],
        json={"email": "collab_share@example.com", "role": "viewer"},
    )
    assert dup_res.status_code == 409
    assert "already shared" in dup_res.json()["error"]["message"]


@pytest.mark.asyncio
async def test_rbac_matrix_enforcement(client: AsyncClient):
    """
    Test complete 7-row RBAC matrix:
    Owner vs Editor vs Viewer vs Non-Collaborator permissions.
    """
    owner = await register_and_login(client, "owner_rbac@example.com", "owner_rbac")
    editor = await register_and_login(client, "editor_rbac@example.com", "editor_rbac")
    viewer = await register_and_login(client, "viewer_rbac@example.com", "viewer_rbac")
    outsider = await register_and_login(client, "outsider_rbac@example.com", "outsider_rbac")

    # Owner creates document
    doc_res = await client.post(
        "/api/v1/documents",
        headers=owner["headers"],
        json={"title": "RBAC Specification", "content": {"type": "doc", "content": [{"type": "paragraph"}]}},
    )
    assert doc_res.status_code == 201
    doc_id = doc_res.json()["id"]

    # Share with editor
    await client.post(
        f"/api/v1/documents/{doc_id}/share",
        headers=owner["headers"],
        json={"email": "editor_rbac@example.com", "role": "editor"},
    )

    # Share with viewer
    await client.post(
        f"/api/v1/documents/{doc_id}/share",
        headers=owner["headers"],
        json={"email": "viewer_rbac@example.com", "role": "viewer"},
    )

    # --- 1. VIEW DOCUMENT ---
    # Owner view
    res = await client.get(f"/api/v1/documents/{doc_id}", headers=owner["headers"])
    assert res.status_code == 200
    assert res.json()["user_role"] == "owner"

    # Editor view
    res = await client.get(f"/api/v1/documents/{doc_id}", headers=editor["headers"])
    assert res.status_code == 200
    assert res.json()["user_role"] == "editor"

    # Viewer view
    res = await client.get(f"/api/v1/documents/{doc_id}", headers=viewer["headers"])
    assert res.status_code == 200
    assert res.json()["user_role"] == "viewer"

    # Outsider view (must 404 for tenant isolation)
    res = await client.get(f"/api/v1/documents/{doc_id}", headers=outsider["headers"])
    assert res.status_code == 404

    # --- 2. EDIT CONTENT ---
    new_content = {"type": "doc", "content": [{"type": "paragraph", "text": "Edited content"}]}

    # Editor can update content
    res = await client.patch(f"/api/v1/documents/{doc_id}", headers=editor["headers"], json={"content": new_content})
    assert res.status_code == 200
    assert res.json()["content"] == new_content

    # Viewer CANNOT update content (403)
    res = await client.patch(f"/api/v1/documents/{doc_id}", headers=viewer["headers"], json={"content": new_content})
    assert res.status_code == 403

    # Outsider CANNOT update content (404)
    res = await client.patch(f"/api/v1/documents/{doc_id}", headers=outsider["headers"], json={"content": new_content})
    assert res.status_code == 404

    # --- 3. RENAME DOCUMENT ---
    # Editor CANNOT rename (403)
    res = await client.patch(f"/api/v1/documents/{doc_id}", headers=editor["headers"], json={"title": "Hacked Title"})
    assert res.status_code == 403
    assert "Only the document owner can rename" in res.json()["error"]["message"]

    # Viewer CANNOT rename (403)
    res = await client.patch(f"/api/v1/documents/{doc_id}", headers=viewer["headers"], json={"title": "Hacked Title"})
    assert res.status_code == 403

    # Owner CAN rename (200)
    res = await client.patch(f"/api/v1/documents/{doc_id}", headers=owner["headers"], json={"title": "Official Title"})
    assert res.status_code == 200
    assert res.json()["title"] == "Official Title"

    # --- 4. DELETE DOCUMENT ---
    # Editor CANNOT delete (403)
    res = await client.delete(f"/api/v1/documents/{doc_id}", headers=editor["headers"])
    assert res.status_code == 403
    assert "Only the document owner can delete" in res.json()["error"]["message"]

    # Viewer CANNOT delete (403)
    res = await client.delete(f"/api/v1/documents/{doc_id}", headers=viewer["headers"])
    assert res.status_code == 403

    # Outsider CANNOT delete (404)
    res = await client.delete(f"/api/v1/documents/{doc_id}", headers=outsider["headers"])
    assert res.status_code == 404

    # --- 5. SHARE PERMISSIONS ---
    # Editor CANNOT share (403)
    res = await client.post(
        f"/api/v1/documents/{doc_id}/share",
        headers=editor["headers"],
        json={"email": "outsider_rbac@example.com", "role": "viewer"},
    )
    assert res.status_code == 403

    # Viewer CANNOT share (403)
    res = await client.post(
        f"/api/v1/documents/{doc_id}/share",
        headers=viewer["headers"],
        json={"email": "outsider_rbac@example.com", "role": "viewer"},
    )
    assert res.status_code == 403

    # --- 6. CHANGE ROLES ---
    # Editor CANNOT change roles (403)
    res = await client.patch(
        f"/api/v1/documents/{doc_id}/shares/{viewer['user']['id']}",
        headers=editor["headers"],
        json={"role": "editor"},
    )
    assert res.status_code == 403

    # Viewer CANNOT change roles (403)
    res = await client.patch(
        f"/api/v1/documents/{doc_id}/shares/{editor['user']['id']}",
        headers=viewer["headers"],
        json={"role": "viewer"},
    )
    assert res.status_code == 403

    # --- 7. REVOKE ACCESS ---
    # Editor CANNOT revoke access (403)
    res = await client.delete(
        f"/api/v1/documents/{doc_id}/shares/{viewer['user']['id']}",
        headers=editor["headers"],
    )
    assert res.status_code == 403

    # Viewer CANNOT revoke access (403)
    res = await client.delete(
        f"/api/v1/documents/{doc_id}/shares/{editor['user']['id']}",
        headers=viewer["headers"],
    )
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_role_change_and_immediate_revocation(client: AsyncClient):
    """Test owner updating collaborator roles and revoking access with immediate 404 enforcement."""
    owner = await register_and_login(client, "owner_mod@example.com", "owner_mod")
    user = await register_and_login(client, "member_mod@example.com", "member_mod")

    # Owner creates document
    doc_res = await client.post(
        "/api/v1/documents",
        headers=owner["headers"],
        json={"title": "Dynamic Roles Test", "content": {"type": "doc", "content": []}},
    )
    doc_id = doc_res.json()["id"]

    # Share initially as viewer
    await client.post(
        f"/api/v1/documents/{doc_id}/share",
        headers=owner["headers"],
        json={"email": "member_mod@example.com", "role": "viewer"},
    )

    # Member is viewer: cannot edit
    edit_res = await client.patch(
        f"/api/v1/documents/{doc_id}",
        headers=user["headers"],
        json={"content": {"type": "doc", "content": [{"text": "Attempt"}]}},
    )
    assert edit_res.status_code == 403

    # Owner upgrades member to editor
    patch_role_res = await client.patch(
        f"/api/v1/documents/{doc_id}/shares/{user['user']['id']}",
        headers=owner["headers"],
        json={"role": "editor"},
    )
    assert patch_role_res.status_code == 200
    assert patch_role_res.json()["role"] == "editor"

    # Member is now editor: can edit content
    edit_res2 = await client.patch(
        f"/api/v1/documents/{doc_id}",
        headers=user["headers"],
        json={"content": {"type": "doc", "content": [{"text": "Success"}]}},
    )
    assert edit_res2.status_code == 200

    # Owner lists collaborators
    shares_list_res = await client.get(
        f"/api/v1/documents/{doc_id}/shares",
        headers=owner["headers"],
    )
    assert shares_list_res.status_code == 200
    list_body = shares_list_res.json()
    assert list_body["owner"]["email"] == "owner_mod@example.com"
    assert len(list_body["collaborators"]) == 1
    assert list_body["collaborators"][0]["role"] == "editor"

    # Owner revokes access
    revoke_res = await client.delete(
        f"/api/v1/documents/{doc_id}/shares/{user['user']['id']}",
        headers=owner["headers"],
    )
    assert revoke_res.status_code == 200

    # Immediate access loss: member gets 404
    get_res = await client.get(f"/api/v1/documents/{doc_id}", headers=user["headers"])
    assert get_res.status_code == 404

    # Member's shared-with-me list is now empty
    shared_res = await client.get("/api/v1/documents/shared-with-me", headers=user["headers"])
    assert shared_res.status_code == 200
    assert shared_res.json()["total"] == 0


@pytest.mark.asyncio
async def test_shared_with_me_aggregation(client: AsyncClient):
    """Test GET /api/v1/documents/shared-with-me displays only active shared documents."""
    owner_a = await register_and_login(client, "owner_a@example.com", "owner_a")
    owner_b = await register_and_login(client, "owner_b@example.com", "owner_b")
    recipient = await register_and_login(client, "recipient@example.com", "recipient")

    # Owner A creates doc 1 and shares as editor
    doc1_res = await client.post(
        "/api/v1/documents",
        headers=owner_a["headers"],
        json={"title": "Doc from Owner A", "content": {}},
    )
    doc1_id = doc1_res.json()["id"]
    await client.post(
        f"/api/v1/documents/{doc1_id}/share",
        headers=owner_a["headers"],
        json={"email": "recipient@example.com", "role": "editor"},
    )

    # Owner B creates doc 2 and shares as viewer
    doc2_res = await client.post(
        "/api/v1/documents",
        headers=owner_b["headers"],
        json={"title": "Doc from Owner B", "content": {}},
    )
    doc2_id = doc2_res.json()["id"]
    await client.post(
        f"/api/v1/documents/{doc2_id}/share",
        headers=owner_b["headers"],
        json={"email": "recipient@example.com", "role": "viewer"},
    )

    # Recipient also creates own document (must NOT show up in shared-with-me)
    await client.post(
        "/api/v1/documents",
        headers=recipient["headers"],
        json={"title": "Recipient's Own Doc", "content": {}},
    )

    # Check recipient's shared-with-me
    res = await client.get("/api/v1/documents/shared-with-me", headers=recipient["headers"])
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2
    titles = [item["title"] for item in data["items"]]
    assert "Doc from Owner A" in titles
    assert "Doc from Owner B" in titles
    assert "Recipient's Own Doc" not in titles

    # Roles match
    for item in data["items"]:
        if item["id"] == doc1_id:
            assert item["role"] == "editor"
            assert item["owner_email"] == "owner_a@example.com"
        elif item["id"] == doc2_id:
            assert item["role"] == "viewer"
            assert item["owner_email"] == "owner_b@example.com"

    # Soft delete doc 1 by Owner A -> recipient should no longer see it in shared-with-me
    await client.delete(f"/api/v1/documents/{doc1_id}", headers=owner_a["headers"])
    res2 = await client.get("/api/v1/documents/shared-with-me", headers=recipient["headers"])
    assert res2.status_code == 200
    assert res2.json()["total"] == 1
    assert res2.json()["items"][0]["id"] == doc2_id
