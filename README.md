# Draftly — Modern Document Workspace

> **Phase 4 & Phase 5: Document Editor and File Import** — Status: Complete & Operational

Draftly is a modern, focused, distraction-free document creation, editing, importing, and sharing workspace. Designed with its own distinct visual and editorial identity, Draftly intentionally avoids the skeuomorphic paper margins, print rulers, and toolbar bloat typical of legacy suites like Google Docs.

---

## 1. Project Overview

Draftly provides a calm, high-velocity writing atelier combining:
- **Focused Editorial Flow:** A centered 760px line measure, organic color palette, and fluid typography.
- **Secure Identity & Authentication (Phase 2):** Argon2id password hashing, stateless HS256 JWT bearer tokens, and automated secret management.
- **Workspace Dashboard & Lifecycle (Phase 3):** Dedicated atelier dashboard, instant document creation, title renaming, case-insensitive search, multi-field sorting, grid/list view toggling, and soft-delete trash recovery.
- **Tiptap Rich-Text Editor (Phase 4):** Professional, headless writing canvas with formatting (Bold, Italic, Underline, H1, H2, Paragraph, Bullet Lists, Numbered Lists, Text Alignment, Undo/Redo), 1200ms debounced autosave, manual `Ctrl+S` override, and unsaved changes protection.
- **Universal Ingestion (Phase 5):** Single-click import for Word (`.docx`), Markdown (`.md`), and plain text (`.txt`) up to 10MB, converting incoming content into structured Tiptap JSON.
- **Clear Collaboration:** Role-based access control (Owner, Editor, Viewer) backed by partitioned "My Documents" and "Shared With Me" views *(Phase 6)*.

---

## 2. Technology Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript 5+
- **Rich Text Editor:** Tiptap v2 (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-underline`, `@tiptap/extension-text-align`, `@tiptap/extension-placeholder`)
- **Styling:** Tailwind CSS 3.4+ (Custom Draftly Editorial Theme)
- **State & Context:** React Context (`AuthContext` with JWT persistence & re-validation)
- **Icons:** Lucide React
- **Deployment Target:** Vercel

### Backend
- **Framework:** Python 3.11+ / FastAPI
- **File Ingestion:** `python-docx` for `.docx` parsing, custom AST line parser for `.md`, and streaming text handler for `.txt`
- **Multipart Form Uploads:** `python-multipart`
- **Password Hashing:** Argon2id (`argon2-cffi`)
- **Token Security:** PyJWT (HS256 signed bearer tokens with 30-minute expiry)
- **ORM & Data Layer:** SQLAlchemy 2.0+ (Async engine via `asyncpg`)
- **Database Migrations:** Alembic 1.13+
- **Configuration:** Pydantic Settings v2 & `python-dotenv`
- **Testing:** Pytest, pytest-asyncio, HTTPX, in-memory `aiosqlite`
- **Deployment Target:** Render

### Database
- **Provider:** **Supabase PostgreSQL** (PostgreSQL 15+ with SSL and connection pooling)

---

## 3. Project Folder Structure

```
draftly/
├── .gitignore                   # Monorepo git exclusion rules
├── README.md                    # Project documentation & runbook
├── docs/                        # Architectural documentation
│   └── PRD.md                   # Approved product specifications
├── frontend/                    # Next.js 14 App Router Application
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts       # Draftly custom editorial color tokens
│   └── src/
│       ├── app/
│       │   ├── layout.tsx       # Root layout wrapped in AuthProvider
│       │   ├── page.tsx         # Atelier landing & quick navigation
│       │   ├── login/
│       │   │   └── page.tsx     # Editorial sign-in page
│       │   ├── register/
│       │   │   └── page.tsx     # Registration & instant auto-login
│       │   ├── dashboard/
│       │   │   └── page.tsx     # Phase 3/4/5 Workspace Dashboard
│       │   └── documents/
│       │       └── [id]/
│       │           └── page.tsx # Phase 4 Tiptap Document Editor & Live Canvas
│       ├── components/
│       │   ├── Navbar.tsx       # Branded top navigation header with user avatar
│       │   ├── StatusIndicator.tsx # Live backend & DB telemetry component
│       │   ├── dashboard/
│       │   │   └── ImportModal.tsx # Drag-and-drop file import modal (.txt, .md, .docx)
│       │   └── editor/
│       │       ├── EditorToolbar.tsx # Clean formatting toolbar (H1, H2, Bold, Lists, Align)
│       │       └── DraftlyEditor.tsx # Tiptap editor engine with debounced autosave
│       ├── context/
│       │   └── AuthContext.tsx  # Global authentication context & token manager
│       └── lib/
│           └── config.ts        # Frontend API client, document models, & endpoints
└── backend/                     # FastAPI Application
    ├── .env.example             # Backend environment template
    ├── alembic.ini              # Alembic migration configuration
    ├── pytest.ini               # Pytest testing configuration
    ├── requirements.txt         # Python package dependencies
    ├── alembic/
    │   ├── env.py               # Async Alembic migration environment
    │   ├── script.py.mako       # Migration template
    │   └── versions/
    │       ├── 0001_create_users_table.py     # Users schema migration
    │       └── 0002_create_documents_table.py # Documents schema migration
    ├── app/
    │   ├── __init__.py
    │   ├── main.py              # FastAPI application entry point & CORS
    │   ├── core/
    │   │   ├── config.py        # Centralized settings & JWT secret auto-generation
    │   │   ├── database.py      # SQLAlchemy async engine & connection verification
    │   │   ├── exceptions.py    # Standardized RFC 7807 error envelopes
    │   │   └── security.py      # Argon2id hashing & PyJWT token utilities
    │   ├── models/
    │   │   ├── __init__.py      # Model registry
    │   │   ├── user.py          # SQLAlchemy 2.0 User model (GUID, indexed email)
    │   │   └── document.py      # SQLAlchemy 2.0 Document model (JSONB, ownership)
    │   ├── schemas/
    │   │   ├── __init__.py
    │   │   ├── user.py          # User request & response schemas
    │   │   └── document.py      # Document CRUD and list response schemas
    │   ├── services/
    │   │   ├── __init__.py
    │   │   ├── auth_service.py     # User auth, registration, & token dependencies
    │   │   ├── document_service.py # Document CRUD, search, and trash management
    │   │   └── import_service.py   # Multi-format parser (.txt, .md, .docx -> Tiptap JSON)
    │   └── api/
    │       └── v1/
    │           ├── api.py       # API v1 router mounting
    │           └── endpoints/
    │               ├── health.py    # Health check and database diagnostics
    │               ├── auth.py      # User registration, login, and profile
    │               └── documents.py # Document management & import endpoints
    └── tests/
        ├── __init__.py
        ├── conftest.py          # In-memory async SQLite test harness
        ├── test_health.py       # Health check & CORS test suite
        ├── test_auth.py         # Authentication & security test suite
        ├── test_documents.py    # Document CRUD, search & isolation tests
        └── test_import.py       # File import (.txt, .md, .docx) & editor content tests
```

---

## 4. Phase 4: Document Editor Architecture

### 1. Tiptap Rich Text Engine
The writing atelier uses Tiptap v2 headless editor configured with:
- **StarterKit:** Paragraphs, Headings (H1, H2, H3), Bullet Lists, Ordered Lists, ListItem, Undo, Redo, Blockquote.
- **Underline:** Semantic underline formatting (`@tiptap/extension-underline`).
- **TextAlign:** Left, center, and right text alignment (`@tiptap/extension-text-align`).
- **Placeholder:** Contextual editor invitation prompt (`@tiptap/extension-placeholder`).

### 2. Autosave & Document Persistence
- **1200ms Debounce:** Saves to `PATCH /api/v1/documents/{id}` automatically after the user pauses typing.
- **Conflict Prevention:** Uses in-flight refs (`isSavingRef`) to guarantee sequential, non-overlapping saves.
- **Manual Save (`Ctrl+S` / `Cmd+S`):** Intercepts keyboard shortcuts on the editor and window to trigger an immediate save.
- **Save Status Telemetry:** Live indicators for `Saved`, `Saving...`, `Unsaved edits`, and `Save issue`.
- **Word & Character Counters:** Live counter calculating word and character metrics.
- **Unsaved Changes Navigation Guard:** Binds to `beforeunload` to prevent accidental data loss.

---

## 5. Phase 5: File Import Architecture

### 1. Supported Formats & Conversion
- **Plain Text (`.txt`):** Extracted into structured Tiptap paragraphs.
- **Markdown (`.md`):** Custom parser supporting `# H1`, `## H2`, `### H3`, `**bold**`, `*italic*`, `<u>underline</u>`, bullet lists (`- item`), and ordered lists (`1. item`).
- **Microsoft Word (`.docx`):** Parsed via `python-docx`, mapping Heading 1/2 styles to Tiptap headings, bullet/number styles to lists, and runs to bold, italic, and underline marks.

### 2. Validation & Security
- **Max File Size:** 10 MB (files > 10 MB rejected with `413 Payload Too Large`).
- **Unsupported Formats:** Files other than `.txt`, `.md`, `.docx` rejected with `400 Bad Request`.
- **Empty Files:** 0-byte uploads rejected with `400 Bad Request`.
- **Corrupt DOCX Protection:** Rejects invalid zip payloads with descriptive error messaging.
- **Title Derivation:** Document title is automatically derived from the uploaded filename (excluding extension).

### 3. Import API Endpoint
- **Endpoint:** `POST /api/v1/documents/import`
- **Authentication:** Required (Bearer JWT).
- **Body:** Multipart form data (`file: UploadFile`).
- **Response:** `201 Created` with full `DocumentResponse` object.

---

## 6. Running Automated Tests

Run the complete 32-test suite covering auth, diagnostics, document CRUD, isolation, file imports, and editor persistence:

```bash
cd backend
.\venv\Scripts\pytest.exe -v
```

Expected output:
```
tests/test_auth.py::test_argon2_password_hashing PASSED                  [  3%]
tests/test_auth.py::test_jwt_token_generation_and_validation PASSED      [  6%]
tests/test_auth.py::test_jwt_expired_token_rejection PASSED              [  9%]
tests/test_auth.py::test_successful_registration PASSED                  [ 12%]
tests/test_auth.py::test_duplicate_email_rejection PASSED                [ 15%]
tests/test_auth.py::test_successful_login PASSED                         [ 18%]
tests/test_auth.py::test_incorrect_password_rejection PASSED             [ 21%]
tests/test_auth.py::test_current_user_endpoint PASSED                    [ 25%]
tests/test_auth.py::test_unauthorized_access_rejection PASSED            [ 28%]
tests/test_auth.py::test_invalid_token_rejection PASSED                  [ 31%]
tests/test_documents.py::test_create_document_default_title PASSED       [ 34%]
tests/test_documents.py::test_create_document_custom_title PASSED        [ 37%]
tests/test_documents.py::test_list_and_count_documents PASSED            [ 40%]
tests/test_documents.py::test_get_document_by_id PASSED                  [ 43%]
tests/test_documents.py::test_rename_document PASSED                     [ 46%]
tests/test_documents.py::test_soft_delete_and_restore PASSED             [ 50%]
tests/test_documents.py::test_permanent_delete PASSED                    [ 53%]
tests/test_documents.py::test_unauthorized_access_prevention PASSED      [ 56%]
tests/test_documents.py::test_user_data_isolation PASSED                 [ 59%]
tests/test_documents.py::test_search_and_sorting PASSED                  [ 62%]
tests/test_health.py::test_root_endpoint PASSED                          [ 65%]
tests/test_health.py::test_root_health_endpoint PASSED                   [ 68%]
tests/test_health.py::test_v1_health_endpoint PASSED                     [ 71%]
tests/test_health.py::test_cors_headers PASSED                           [ 75%]
tests/test_import.py::test_import_txt_file PASSED                        [ 78%]
tests/test_import.py::test_import_markdown_file PASSED                   [ 81%]
tests/test_import.py::test_import_docx_file PASSED                       [ 84%]
tests/test_import.py::test_import_unsupported_file_rejection PASSED      [ 87%]
tests/test_import.py::test_import_empty_file_rejection PASSED            [ 90%]
tests/test_import.py::test_import_malformed_docx_rejection PASSED        [ 93%]
tests/test_import.py::test_import_unauthorized_rejection PASSED          [ 96%]
tests/test_import.py::test_editor_patch_and_get_content PASSED           [100%]

============================= 32 passed in 4.23s ==============================
```
