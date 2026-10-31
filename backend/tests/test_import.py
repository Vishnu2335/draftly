import io
import uuid
import pytest
import docx
from httpx import AsyncClient

from app.core.security import create_access_token


def auth_headers(user_id: uuid.UUID, email: str) -> dict:
    """Generate bearer authorization header."""
    token = create_access_token(user_id=str(user_id), email=email)
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_import_txt_file(client: AsyncClient):
    """Test 1: Import plain text (.txt) file into Tiptap document."""
    reg = await client.post(
        "/api/v1/auth/register",
        json={"username": "txt_user", "email": "txt_user@draftly.com", "password": "Password123!"},
    )
    user_id = reg.json()["id"]
    headers = auth_headers(user_id, "txt_user@draftly.com")

    txt_content = "First line of notes.\nSecond line of notes.\n\nThird paragraph."
    files = {"file": ("Meeting_Notes.txt", io.BytesIO(txt_content.encode("utf-8")), "text/plain")}

    res = await client.post("/api/v1/documents/import", files=files, headers=headers)
    assert res.status_code == 201
    data = res.json()

    assert data["title"] == "Meeting_Notes"
    assert data["owner_id"] == user_id
    assert data["content"]["type"] == "doc"
    assert len(data["content"]["content"]) >= 2
    assert data["content"]["content"][0]["type"] == "paragraph"


@pytest.mark.asyncio
async def test_import_markdown_file(client: AsyncClient):
    """Test 2: Import Markdown (.md) preserving headings, bold, italic, and lists."""
    reg = await client.post(
        "/api/v1/auth/register",
        json={"username": "md_user", "email": "md_user@draftly.com", "password": "Password123!"},
    )
    user_id = reg.json()["id"]
    headers = auth_headers(user_id, "md_user@draftly.com")

    md_content = """# Product Strategy
This is an **important** overview with *italic* emphasis.

## Key Objectives
- Launch workspace atelier
- Enable frictionless imports

1. First priority
2. Second priority
"""
    files = {"file": ("Product_Strategy.md", io.BytesIO(md_content.encode("utf-8")), "text/markdown")}

    res = await client.post("/api/v1/documents/import", files=files, headers=headers)
    assert res.status_code == 201
    data = res.json()

    assert data["title"] == "Product_Strategy"
    nodes = data["content"]["content"]

    # Verify heading node
    heading_nodes = [n for n in nodes if n.get("type") == "heading"]
    assert len(heading_nodes) >= 2
    assert heading_nodes[0]["attrs"]["level"] == 1
    assert heading_nodes[1]["attrs"]["level"] == 2

    # Verify bullet list node
    bullet_lists = [n for n in nodes if n.get("type") == "bulletList"]
    assert len(bullet_lists) == 1
    assert len(bullet_lists[0]["content"]) == 2

    # Verify ordered list node
    ordered_lists = [n for n in nodes if n.get("type") == "orderedList"]
    assert len(ordered_lists) == 1
    assert len(ordered_lists[0]["content"]) == 2


@pytest.mark.asyncio
async def test_import_docx_file(client: AsyncClient):
    """Test 3: Import Word (.docx) document preserving paragraphs, headings, and formatting."""
    reg = await client.post(
        "/api/v1/auth/register",
        json={"username": "docx_user", "email": "docx_user@draftly.com", "password": "Password123!"},
    )
    user_id = reg.json()["id"]
    headers = auth_headers(user_id, "docx_user@draftly.com")

    # Build DOCX binary in memory
    doc = docx.Document()
    doc.add_heading("Manuscript Chapter 1", level=1)
    p = doc.add_paragraph("This is a formatted paragraph with ")
    run_bold = p.add_run("bold text")
    run_bold.bold = True
    p.add_run(" and ")
    run_italic = p.add_run("italic text")
    run_italic.italic = True
    run_under = p.add_run(" and underlined text.")
    run_under.underline = True

    docx_buf = io.BytesIO()
    doc.save(docx_buf)
    docx_bytes = docx_buf.getvalue()

    files = {"file": ("Chapter_One.docx", io.BytesIO(docx_bytes), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}

    res = await client.post("/api/v1/documents/import", files=files, headers=headers)
    assert res.status_code == 201
    data = res.json()

    assert data["title"] == "Chapter_One"
    nodes = data["content"]["content"]
    assert any(n.get("type") == "heading" for n in nodes)
    assert any(n.get("type") == "paragraph" for n in nodes)


@pytest.mark.asyncio
async def test_import_unsupported_file_rejection(client: AsyncClient):
    """Test 4: Reject unsupported file formats with 400 Bad Request."""
    reg = await client.post(
        "/api/v1/auth/register",
        json={"username": "rej_user", "email": "rej_user@draftly.com", "password": "Password123!"},
    )
    headers = auth_headers(reg.json()["id"], "rej_user@draftly.com")

    files = {"file": ("presentation.pdf", io.BytesIO(b"%PDF-1.4 mock pdf bytes"), "application/pdf")}
    res = await client.post("/api/v1/documents/import", files=files, headers=headers)
    assert res.status_code == 400
    assert "Unsupported file format" in res.text


@pytest.mark.asyncio
async def test_import_empty_file_rejection(client: AsyncClient):
    """Test 5: Reject empty files (0 bytes) with 400 Bad Request."""
    reg = await client.post(
        "/api/v1/auth/register",
        json={"username": "empty_user", "email": "empty_user@draftly.com", "password": "Password123!"},
    )
    headers = auth_headers(reg.json()["id"], "empty_user@draftly.com")

    files = {"file": ("empty.txt", io.BytesIO(b""), "text/plain")}
    res = await client.post("/api/v1/documents/import", files=files, headers=headers)
    assert res.status_code == 400
    assert "empty" in res.text.lower()


@pytest.mark.asyncio
async def test_import_malformed_docx_rejection(client: AsyncClient):
    """Test 6: Reject malformed / corrupt DOCX with 400 Bad Request."""
    reg = await client.post(
        "/api/v1/auth/register",
        json={"username": "corrupt_user", "email": "corrupt_user@draftly.com", "password": "Password123!"},
    )
    headers = auth_headers(reg.json()["id"], "corrupt_user@draftly.com")

    files = {"file": ("broken.docx", io.BytesIO(b"not a real zip archive"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document")}
    res = await client.post("/api/v1/documents/import", files=files, headers=headers)
    assert res.status_code == 400
    assert "DOCX" in res.text or "Malformed" in res.text


@pytest.mark.asyncio
async def test_import_unauthorized_rejection(client: AsyncClient):
    """Test 7: Reject unauthenticated upload with 401 Unauthorized."""
    files = {"file": ("test.txt", io.BytesIO(b"unauthorized content"), "text/plain")}
    res = await client.post("/api/v1/documents/import", files=files)
    assert res.status_code == 401


@pytest.mark.asyncio
async def test_editor_patch_and_get_content(client: AsyncClient):
    """Test 8: Verify saving full Tiptap structured content via PATCH and reloading via GET."""
    reg = await client.post(
        "/api/v1/auth/register",
        json={"username": "editor_user", "email": "editor_user@draftly.com", "password": "Password123!"},
    )
    user_id = reg.json()["id"]
    headers = auth_headers(user_id, "editor_user@draftly.com")

    # Create empty document
    create_res = await client.post("/api/v1/documents", json={"title": "Draft Document"}, headers=headers)
    doc_id = create_res.json()["id"]

    # Save rich content from Tiptap editor
    tiptap_payload = {
        "title": "Polished Article",
        "content": {
            "type": "doc",
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": 1},
                    "content": [{"type": "text", "text": "Draftly Atelier"}],
                },
                {
                    "type": "paragraph",
                    "content": [
                        {"type": "text", "text": "Editing in real time with "},
                        {"type": "text", "text": "bold", "marks": [{"type": "bold"}]},
                        {"type": "text", "text": " and "},
                        {"type": "text", "text": "underline", "marks": [{"type": "underline"}]},
                    ],
                },
            ],
        },
    }

    patch_res = await client.patch(f"/api/v1/documents/{doc_id}", json=tiptap_payload, headers=headers)
    assert patch_res.status_code == 200
    patched_data = patch_res.json()
    assert patched_data["title"] == "Polished Article"
    assert patched_data["content"]["type"] == "doc"

    # Reload document via GET /documents/{id}
    get_res = await client.get(f"/api/v1/documents/{doc_id}", headers=headers)
    assert get_res.status_code == 200
    loaded_data = get_res.json()
    assert loaded_data["title"] == "Polished Article"
    assert loaded_data["content"]["content"][0]["type"] == "heading"
    assert loaded_data["content"]["content"][0]["content"][0]["text"] == "Draftly Atelier"
