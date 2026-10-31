# Draftly — Modern Document Workspace

> **Phase 6 & Phase 7: Document Sharing, RBAC & Quality Assurance** — Status: Complete & Fully Verified

Draftly is a modern, focused, distraction-free document creation, editing, importing, and sharing workspace. Designed with its own distinct visual and editorial identity, Draftly intentionally avoids the skeuomorphic paper margins, print rulers, and toolbar bloat typical of legacy suites like Google Docs.

---

## 1. Project Overview

Draftly provides a calm, high-velocity writing atelier combining:
- **Focused Editorial Flow:** A centered 760px line measure, organic color palette, and fluid typography.
- **Secure Identity & Authentication (Phase 2):** Argon2id password hashing, stateless HS256 JWT bearer tokens, and automated secret management.
- **Workspace Dashboard & Lifecycle (Phase 3):** Dedicated atelier dashboard, instant document creation, title renaming, case-insensitive search, multi-field sorting, grid/list view toggling, and soft-delete trash recovery.
- **Tiptap Rich-Text Editor (Phase 4):** Professional, headless writing canvas with formatting (Bold, Italic, Underline, H1, H2, Paragraph, Bullet Lists, Numbered Lists, Text Alignment, Undo/Redo), 1200ms debounced autosave, manual `Ctrl+S` override, and unsaved changes protection.
- **Universal Ingestion (Phase 5):** Single-click import for Word (`.docx`), Markdown (`.md`), and plain text (`.txt`) up to 10MB, converting incoming content into structured Tiptap JSON.
- **Granular Collaboration & RBAC (Phase 6):** Strict Role-Based Access Control (Owner, Editor, Viewer) backed by partitioned "My Documents" and "Shared With Me" views, immediate revocation, and email invitations.
- **End-to-End Quality Assurance (Phase 7):** Comprehensive unit, integration, and Playwright browser E2E test suites covering all 6 critical user journeys with 100% pass rate.

---

## 2. Technology Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript 5+
- **Rich Text Editor:** Tiptap v2 (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-underline`, `@tiptap/extension-text-align`, `@tiptap/extension-placeholder`)
- **E2E Testing:** Playwright Test 1.58+ (Chromium headless engine)
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
│   ├── playwright.config.ts     # Playwright E2E configuration
│   ├── tailwind.config.ts       # Draftly custom editorial color tokens
│   ├── tests/
│   │   └── e2e/
│   │       └── journeys.spec.ts # All 6 End-to-End User Journeys
│   └── src/
│       ├── app/
│       │   ├── layout.tsx       # Root layout wrapped in AuthProvider
│       │   ├── page.tsx         # Atelier landing & quick navigation
│       │   ├── login/
│       │   │   └── page.tsx     # Editorial sign-in page
│       │   ├── register/
│       │   │   └── page.tsx     # Registration & instant auto-login
│       │   ├── dashboard/
│       │   │   └── page.tsx     # Workspace Dashboard with "Shared With Me" tab
│       │   └── documents/
│       │       └── [id]/
│       │           └── page.tsx # Role-aware Document Editor (Owner/Editor/Viewer)
│       ├── components/
│       │   ├── Navbar.tsx       # Branded top navigation header with user avatar
│       │   ├── StatusIndicator.tsx # Live backend & DB telemetry component
│       │   ├── dashboard/
│       │   │   └── ImportModal.tsx # Drag-and-drop file import modal (.txt, .md, .docx)
│       │   └── editor/
│       │       ├── EditorToolbar.tsx # Formatting toolbar (H1, H2, Bold, Lists, Align)
│       │       ├── DraftlyEditor.tsx # Tiptap editor engine with readOnly mode
│       │       └── ShareModal.tsx    # Collaborator management modal (Invite, Roles, Revoke)
│       ├── context/
│       │   └── AuthContext.tsx  # Global authentication context & token manager
│       └── lib/
│           └── config.ts        # Frontend API client, document & sharing methods
└── backend/                     # FastAPI Application
    ├── .env.example             # Backend environment template
    ├── alembic.ini              # Alembic migration configuration
    ├── pytest.ini               # Pytest testing configuration
    ├── requirements.txt         # Python package dependencies
    ├── alembic/
    │   ├── env.py               # Async Alembic migration environment
    │   └── versions/
    │       ├── 0001_create_users_table.py           # Users schema migration
    │       ├── 0002_create_documents_table.py       # Documents schema migration
    │       └── 0003_create_document_shares_table.py # Document shares migration
    ├── app/
    │   ├── main.py              # FastAPI application entry point & CORS
    │   ├── core/
    │   │   ├── config.py        # Centralized settings & JWT secret auto-generation
    │   │   ├── database.py      # SQLAlchemy async engine & connection verification
    │   │   ├── exceptions.py    # Standardized RFC 7807 error envelopes
    │   │   └── security.py      # Argon2id hashing & PyJWT token utilities
    │   ├── models/
    │   │   ├── __init__.py      # Model registry
    │   │   ├── user.py          # SQLAlchemy 2.0 User model
    │   │   ├── document.py      # SQLAlchemy 2.0 Document model
    │   │   └── document_share.py# SQLAlchemy 2.0 DocumentShare model
    │   ├── schemas/
    │   │   ├── user.py          # User schemas
    │   │   ├── document.py      # Document CRUD and list schemas
    │   │   └── share.py         # Sharing & collaborator schemas
    │   ├── services/
    │   │   ├── auth_service.py     # User auth & token dependencies
    │   │   ├── document_service.py # Document CRUD & RBAC checks
    │   │   ├── sharing_service.py  # Collaborator management & shared-with-me
    │   │   └── import_service.py   # Multi-format parser (.txt, .md, .docx)
    │   └── api/
    │       └── v1/
    │           ├── api.py       # API v1 router mounting
    │           └── endpoints/
    │               ├── health.py    # Health check and database diagnostics
    │               ├── auth.py      # User registration, login, and profile
    │               └── documents.py # Document management, import, & sharing
    └── tests/
        ├── conftest.py          # In-memory async SQLite test harness
        ├── test_health.py       # Health check & CORS test suite
        ├── test_auth.py         # Authentication & security test suite
        ├── test_documents.py    # Document CRUD, search & isolation tests
        ├── test_import.py       # File import (.txt, .md, .docx) tests
        └── test_sharing.py      # RBAC matrix, collaborator sharing & revocation tests
```

---

## 4. Phase 6: Document Sharing & Role-Based Access Control (RBAC)

### 1. Database Model (`document_shares` Table)
```sql
CREATE TABLE document_shares (
    id CHAR(36) PRIMARY KEY,
    document_id CHAR(36) NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id CHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer', -- 'editor' or 'viewer'
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_document_shares_doc_user UNIQUE (document_id, user_id)
);
CREATE INDEX ix_document_shares_user_role ON document_shares (user_id, role);
```

### 2. Strict RBAC Permission Matrix

| Operation | Owner | Editor | Viewer | Non-Collaborator |
|---|:---:|:---:|:---:|:---:|
| **View Document** (`GET /documents/{id}`) | ✅ Allowed | ✅ Allowed (`editor`) | ✅ Allowed (`viewer`) | ❌ `404 Not Found` *(Multi-tenant isolation)* |
| **Edit Content** (`PATCH /documents/{id}`) | ✅ Allowed | ✅ Allowed | ❌ `403 Forbidden` | ❌ `404 Not Found` |
| **Rename Document** (`PATCH /documents/{id}`) | ✅ Allowed | ❌ `403 Forbidden` | ❌ `403 Forbidden` | ❌ `404 Not Found` |
| **Move to Trash / Delete** (`DELETE /documents/{id}`) | ✅ Allowed | ❌ `403 Forbidden` | ❌ `403 Forbidden` | ❌ `404 Not Found` |
| **Share Document** (`POST /documents/{id}/share`) | ✅ Allowed | ❌ `403 Forbidden` | ❌ `403 Forbidden` | ❌ `404 Not Found` |
| **Update Collaborator Role** (`PATCH .../shares/{uid}`) | ✅ Allowed | ❌ `403 Forbidden` | ❌ `403 Forbidden` | ❌ `404 Not Found` |
| **Revoke Access** (`DELETE .../shares/{uid}`) | ✅ Allowed | ❌ `403 Forbidden` | ❌ `403 Forbidden` | ❌ `404 Not Found` |

### 3. Sharing REST API Endpoints

- `GET /api/v1/documents/shared-with-me` — Retrieve active documents shared with authenticated user.
- `POST /api/v1/documents/{document_id}/share` — Share document with registered email as `editor` or `viewer` (Owner only; rejects self-share with `400`, unregistered with `404`, duplicates with `409`).
- `GET /api/v1/documents/{document_id}/shares` — List all collaborators and authoritative owner (Owner only).
- `PATCH /api/v1/documents/{document_id}/shares/{collaborator_user_id}` — Change collaborator role between `editor` and `viewer` (Owner only).
- `DELETE /api/v1/documents/{document_id}/shares/{collaborator_user_id}` — Revoke collaborator access immediately (Owner only).

### 4. Role-Aware Frontend UX

- **"Shared With Me" Dashboard Tab:** Dedicated view displaying shared document cards with owner username/email, role pills (`Editor` or `Viewer`), shared timestamp, and direct atelier links.
- **Owner Share Modal:** Accessible from the atelier header for document owners. Enables inviting teammates via email, setting initial roles, dynamically switching roles, and revoking access with single-click confirmation.
- **Editor Experience:** Full writing canvas with active formatting toolbar and autosave persistence. Title editing, sharing, and trash controls are hidden; attempts to rename or delete are rejected with `403 Forbidden`.
- **Viewer Experience:** Read-only writing atelier (`editable: false`, `contenteditable="false"`). Formatting toolbar and manual save buttons are removed, and a persistent "Read-Only Atelier • Viewer Access Mode" badge is displayed.

---

## 5. Phase 7: Quality Assurance & Test Verification

### 1. Backend Pytest Suite (36/36 Tests Passing)

Execute the full backend test suite covering authentication, health checks, document CRUD, search/sort, multi-format file import, and the 7-row RBAC sharing matrix:

```powershell
cd backend
.\venv\Scripts\pytest.exe -v
```

```
============================= test session starts =============================
tests/test_auth.py::test_argon2_password_hashing PASSED                  [  2%]
tests/test_auth.py::test_jwt_token_generation_and_validation PASSED      [  5%]
tests/test_auth.py::test_jwt_expired_token_rejection PASSED              [  8%]
tests/test_auth.py::test_successful_registration PASSED                  [ 11%]
tests/test_auth.py::test_duplicate_email_rejection PASSED                [ 13%]
tests/test_auth.py::test_successful_login PASSED                         [ 16%]
tests/test_auth.py::test_incorrect_password_rejection PASSED             [ 19%]
tests/test_auth.py::test_current_user_endpoint PASSED                    [ 22%]
tests/test_auth.py::test_unauthorized_access_rejection PASSED            [ 25%]
tests/test_auth.py::test_invalid_token_rejection PASSED                  [ 27%]
tests/test_documents.py::test_create_document_default_title PASSED       [ 30%]
tests/test_documents.py::test_create_document_custom_title PASSED        [ 33%]
tests/test_documents.py::test_list_and_count_documents PASSED            [ 36%]
tests/test_documents.py::test_get_document_by_id PASSED                  [ 38%]
tests/test_documents.py::test_rename_document PASSED                     [ 41%]
tests/test_documents.py::test_soft_delete_and_restore PASSED             [ 44%]
tests/test_documents.py::test_permanent_delete PASSED                    [ 47%]
tests/test_documents.py::test_unauthorized_access_prevention PASSED      [ 50%]
tests/test_documents.py::test_user_data_isolation PASSED                 [ 52%]
tests/test_documents.py::test_search_and_sorting PASSED                  [ 55%]
tests/test_health.py::test_root_endpoint PASSED                          [ 58%]
tests/test_health.py::test_root_health_endpoint PASSED                   [ 61%]
tests/test_health.py::test_v1_health_endpoint PASSED                     [ 63%]
tests/test_health.py::test_cors_headers PASSED                           [ 66%]
tests/test_import.py::test_import_txt_file PASSED                        [ 69%]
tests/test_import.py::test_import_markdown_file PASSED                   [ 72%]
tests/test_import.py::test_import_docx_file PASSED                       [ 75%]
tests/test_import.py::test_import_unsupported_file_rejection PASSED      [ 77%]
tests/test_import.py::test_import_empty_file_rejection PASSED            [ 80%]
tests/test_import.py::test_import_malformed_docx_rejection PASSED        [ 83%]
tests/test_import.py::test_import_unauthorized_rejection PASSED          [ 86%]
tests/test_import.py::test_editor_patch_and_get_content PASSED           [ 88%]
tests/test_sharing.py::test_sharing_and_validations PASSED               [ 91%]
tests/test_sharing.py::test_rbac_matrix_enforcement PASSED               [ 94%]
tests/test_sharing.py::test_role_change_and_immediate_revocation PASSED  [ 97%]
tests/test_sharing.py::test_shared_with_me_aggregation PASSED            [100%]

============================= 36 passed in 7.64s ==============================
```

### 2. Frontend Production Build (Zero Errors)

```powershell
cd frontend
npm run build
```

```
   Creating an optimized production build ...
 ✓ Compiled successfully
   Linting and checking validity of types ...
   Collecting page data ...
 ✓ Generating static pages (7/7)
   Finalizing page optimization ...

Route (app)                              Size     First Load JS
┌ ○ /                                    6.19 kB         103 kB
├ ○ /_not-found                          873 B          88.2 kB
├ ○ /dashboard                           11.2 kB         108 kB
├ ƒ /documents/[id]                      141 kB          239 kB
├ ○ /login                               3.58 kB         101 kB
└ ○ /register                            3.86 kB         101 kB
+ First Load JS shared by all            87.3 kB
```

### 3. Playwright Browser E2E Test Suite (6/6 Journeys Passing)

Execute the end-to-end browser tests verifying user workflows:

```powershell
cd frontend
npx playwright test
```

```
Running 6 tests using 1 worker

  ok 1 [chromium] › tests\e2e\journeys.spec.ts › Journey 1: User Registration & Authentication (6.3s)
  ok 2 [chromium] › tests\e2e\journeys.spec.ts › Journey 2: Document Creation & Live Tiptap Editing (32.1s)
  ok 3 [chromium] › tests\e2e\journeys.spec.ts › Journey 3: Multi-format File Import (.md upload) (2.3s)
  ok 4 [chromium] › tests\e2e\journeys.spec.ts › Journey 4: Document Sharing & Collaborative Editing (Owner -> Editor) (5.5s)
  ok 5 [chromium] › tests\e2e\journeys.spec.ts › Journey 5: Viewer Permissions (Owner -> Viewer read-only) (4.2s)
  ok 6 [chromium] › tests\e2e\journeys.spec.ts › Journey 6: Access Revocation Immediate Enforcement (3.2s)

  6 passed (55.2s)
```

---

## 6. Definition of Done Checklist

- [x] SQLAlchemy 2.0 `DocumentShare` model with UUID PK, cascading FKs, unique constraint, composite index.
- [x] Alembic migration `0003_create_document_shares_table.py` with PostgreSQL dialect checks.
- [x] Complete 7-row RBAC Matrix enforced in FastAPI backend services with RFC 7807 error envelopes.
- [x] Authenticated sharing endpoints (`share`, `shares`, `role change`, `revoke`, `shared-with-me`).
- [x] Multi-tenant isolation verified (`404 Not Found` for uninvited callers, preventing ID enumeration).
- [x] Next.js Dashboard "Shared With Me" tab with active count badge and collaborator cards.
- [x] Owner "Share" modal with email invitation, role dropdown, and live collaborator management.
- [x] Role-enforced document atelier: Viewers have read-only canvas; Editors have content editing & autosave.
- [x] All 36 backend tests passing (`pytest`).
- [x] Frontend TypeScript compilation & production build passing (`npm run build`).
- [x] All 6 Playwright End-to-End browser user journeys passing.
- [x] Monorepo documentation and runbooks updated.
