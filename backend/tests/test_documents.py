import uuid
import pytest
from httpx import AsyncClient

from app.core.security import create_access_token
from app.models.user import User


async def create_test_user(db, username: str, email: str) -> User:
    """Helper to register and persist a test user directly."""
    user = User(
        id=uuid.uuid4(),
        username=username,
        email=email,
        hashed_password="mocked_argon2_hash",
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


def auth_headers(user_id: uuid.UUID, email: str) -> dict:
    """Generate bearer authorization header for test requests."""
    token = create_access_token(user_id=str(user_id), email=email)
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_create_document_default_title(client: AsyncClient):
    """Test 1: Create document with default title 'Untitled Document'."""
    # Register user via auth API
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "doccreator",
            "email": "doccreator@draftly.com",
            "password": "Password123!",
        },
    )
    assert reg_res.status_code == 201
    user_id = reg_res.json()["id"]
    headers = auth_headers(user_id, "doccreator@draftly.com")

    # Create document with empty body
    res = await client.post("/api/v1/documents", json={}, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Untitled Document"
    assert data["is_deleted"] is False
    assert data["owner_id"] == user_id
    assert "id" in data
    assert "created_at" in data
    assert "updated_at" in data


@pytest.mark.asyncio
async def test_create_document_custom_title(client: AsyncClient):
    """Test 2: Create document with custom title and initial structure."""
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "writer_custom",
            "email": "writer_custom@draftly.com",
            "password": "Password123!",
        },
    )
    user_id = reg_res.json()["id"]
    headers = auth_headers(user_id, "writer_custom@draftly.com")

    res = await client.post(
        "/api/v1/documents",
        json={
            "title": "Editorial Style Guide",
            "content": {"type": "doc", "content": [{"type": "paragraph"}]},
        },
        headers=headers,
    )
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "Editorial Style Guide"
    assert data["content"]["type"] == "doc"


@pytest.mark.asyncio
async def test_list_and_count_documents(client: AsyncClient):
    """Test 3: List documents owned by user with accurate counts."""
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "lister",
            "email": "lister@draftly.com",
            "password": "Password123!",
        },
    )
    user_id = reg_res.json()["id"]
    headers = auth_headers(user_id, "lister@draftly.com")

    # Create 3 documents
    for i in range(3):
        await client.post(
            "/api/v1/documents",
            json={"title": f"Doc {i+1}"},
            headers=headers,
        )

    res = await client.get("/api/v1/documents", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 3
    assert data["active_count"] == 3
    assert data["trash_count"] == 0
    assert len(data["items"]) == 3


@pytest.mark.asyncio
async def test_get_document_by_id(client: AsyncClient):
    """Test 4: Retrieve single document by ID."""
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "retriever",
            "email": "retriever@draftly.com",
            "password": "Password123!",
        },
    )
    user_id = reg_res.json()["id"]
    headers = auth_headers(user_id, "retriever@draftly.com")

    create_res = await client.post(
        "/api/v1/documents",
        json={"title": "Q3 Marketing Strategy"},
        headers=headers,
    )
    doc_id = create_res.json()["id"]

    get_res = await client.get(f"/api/v1/documents/{doc_id}", headers=headers)
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["id"] == doc_id
    assert data["title"] == "Q3 Marketing Strategy"


@pytest.mark.asyncio
async def test_rename_document(client: AsyncClient):
    """Test 5: Update document title via PATCH."""
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "renamer",
            "email": "renamer@draftly.com",
            "password": "Password123!",
        },
    )
    user_id = reg_res.json()["id"]
    headers = auth_headers(user_id, "renamer@draftly.com")

    create_res = await client.post(
        "/api/v1/documents",
        json={"title": "Old Draft Title"},
        headers=headers,
    )
    doc_id = create_res.json()["id"]

    patch_res = await client.patch(
        f"/api/v1/documents/{doc_id}",
        json={"title": "Polished Master Document"},
        headers=headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["title"] == "Polished Master Document"


@pytest.mark.asyncio
async def test_soft_delete_and_restore(client: AsyncClient):
    """Test 6: Soft delete document to trash and restore back."""
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "trasher",
            "email": "trasher@draftly.com",
            "password": "Password123!",
        },
    )
    user_id = reg_res.json()["id"]
    headers = auth_headers(user_id, "trasher@draftly.com")

    create_res = await client.post(
        "/api/v1/documents",
        json={"title": "Disposable Notes"},
        headers=headers,
    )
    doc_id = create_res.json()["id"]

    # Soft delete
    del_res = await client.delete(f"/api/v1/documents/{doc_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["permanent"] is False

    # Verify not in active list
    list_active = await client.get("/api/v1/documents", headers=headers)
    assert list_active.json()["total"] == 0
    assert list_active.json()["active_count"] == 0
    assert list_active.json()["trash_count"] == 1

    # Verify present in trash list
    list_trash = await client.get("/api/v1/documents?is_deleted=true", headers=headers)
    assert list_trash.json()["total"] == 1
    assert list_trash.json()["items"][0]["id"] == doc_id

    # Restore from trash
    restore_res = await client.patch(
        f"/api/v1/documents/{doc_id}",
        json={"is_deleted": False},
        headers=headers,
    )
    assert restore_res.status_code == 200
    assert restore_res.json()["is_deleted"] is False

    # Verify back in active list
    list_restored = await client.get("/api/v1/documents", headers=headers)
    assert list_restored.json()["total"] == 1
    assert list_restored.json()["active_count"] == 1
    assert list_restored.json()["trash_count"] == 0


@pytest.mark.asyncio
async def test_permanent_delete(client: AsyncClient):
    """Test 7: Permanently delete trashed document."""
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "username": "purger",
            "email": "purger@draftly.com",
            "password": "Password123!",
        },
    )
    user_id = reg_res.json()["id"]
    headers = auth_headers(user_id, "purger@draftly.com")

    create_res = await client.post(
        "/api/v1/documents",
        json={"title": "To be purged"},
        headers=headers,
    )
    doc_id = create_res.json()["id"]

    # Soft delete first
    await client.delete(f"/api/v1/documents/{doc_id}", headers=headers)

    # Permanent delete
    perm_res = await client.delete(f"/api/v1/documents/{doc_id}?permanent=true", headers=headers)
    assert perm_res.status_code == 200
    assert perm_res.json()["permanent"] is True

    # Subsequent GET returns 404
    get_res = await client.get(f"/api/v1/documents/{doc_id}", headers=headers)
    assert get_res.status_code == 404


@pytest.mark.asyncio
async def test_unauthorized_access_prevention(client: AsyncClient):
    """Test 8: Ensure unauthenticated requests are blocked with 401."""
    res_list = await client.get("/api/v1/documents")
    assert res_list.status_code == 401

    fake_id = str(uuid.uuid4())
    res_get = await client.get(f"/api/v1/documents/{fake_id}")
    assert res_get.status_code == 401

    res_post = await client.post("/api/v1/documents", json={"title": "Hacked"})
    assert res_post.status_code == 401

    res_patch = await client.patch(f"/api/v1/documents/{fake_id}", json={"title": "Hacked"})
    assert res_patch.status_code == 401

    res_delete = await client.delete(f"/api/v1/documents/{fake_id}")
    assert res_delete.status_code == 401


@pytest.mark.asyncio
async def test_user_data_isolation(client: AsyncClient):
    """Test 9: Verify User B cannot access, read, update, or delete User A's document."""
    # Register User A
    res_a = await client.post(
        "/api/v1/auth/register",
        json={"username": "user_a", "email": "user_a@draftly.com", "password": "Password123!"},
    )
    headers_a = auth_headers(res_a.json()["id"], "user_a@draftly.com")

    # Register User B
    res_b = await client.post(
        "/api/v1/auth/register",
        json={"username": "user_b", "email": "user_b@draftly.com", "password": "Password123!"},
    )
    headers_b = auth_headers(res_b.json()["id"], "user_b@draftly.com")

    # User A creates a document
    doc_res = await client.post(
        "/api/v1/documents",
        json={"title": "User A Private Confidential Plan"},
        headers=headers_a,
    )
    doc_id = doc_res.json()["id"]

    # User B attempts to read User A's document -> 404
    read_attempt = await client.get(f"/api/v1/documents/{doc_id}", headers=headers_b)
    assert read_attempt.status_code == 404

    # User B attempts to update User A's document -> 404
    update_attempt = await client.patch(
        f"/api/v1/documents/{doc_id}",
        json={"title": "Hijacked by User B"},
        headers=headers_b,
    )
    assert update_attempt.status_code == 404

    # User B attempts to delete User A's document -> 404
    delete_attempt = await client.delete(f"/api/v1/documents/{doc_id}", headers=headers_b)
    assert delete_attempt.status_code == 404

    # User B lists documents -> User A's document must not appear
    list_b = await client.get("/api/v1/documents", headers=headers_b)
    assert list_b.json()["total"] == 0
    assert len(list_b.json()["items"]) == 0


@pytest.mark.asyncio
async def test_search_and_sorting(client: AsyncClient):
    """Test 10: Search title filtering and alphabetical/timestamp sorting."""
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"username": "searcher", "email": "searcher@draftly.com", "password": "Password123!"},
    )
    user_id = reg_res.json()["id"]
    headers = auth_headers(user_id, "searcher@draftly.com")

    # Create 3 documents with distinct titles
    await client.post("/api/v1/documents", json={"title": "Beta Quarterly Report"}, headers=headers)
    await client.post("/api/v1/documents", json={"title": "Alpha Roadmap 2027"}, headers=headers)
    await client.post("/api/v1/documents", json={"title": "Delta Engineering Specs"}, headers=headers)

    # Search for "alpha"
    search_res = await client.get("/api/v1/documents?search=alpha", headers=headers)
    assert search_res.status_code == 200
    assert search_res.json()["total"] == 1
    assert search_res.json()["items"][0]["title"] == "Alpha Roadmap 2027"

    # Search for "report"
    report_res = await client.get("/api/v1/documents?search=REPORT", headers=headers)
    assert report_res.status_code == 200
    assert report_res.json()["total"] == 1
    assert report_res.json()["items"][0]["title"] == "Beta Quarterly Report"

    # Sort alphabetical ASC
    sort_asc = await client.get("/api/v1/documents?sort_by=title&sort_order=asc", headers=headers)
    titles_asc = [d["title"] for d in sort_asc.json()["items"]]
    assert titles_asc == ["Alpha Roadmap 2027", "Beta Quarterly Report", "Delta Engineering Specs"]

    # Sort alphabetical DESC
    sort_desc = await client.get("/api/v1/documents?sort_by=title&sort_order=desc", headers=headers)
    titles_desc = [d["title"] for d in sort_desc.json()["items"]]
    assert titles_desc == ["Delta Engineering Specs", "Beta Quarterly Report", "Alpha Roadmap 2027"]
