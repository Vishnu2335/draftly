# Draftly — Modern Document Workspace

> **Phase 3: Workspace Dashboard** — Status: Complete & Operational

Draftly is a modern, focused, distraction-free document creation, editing, importing, and sharing workspace. Designed with its own distinct visual and editorial identity, Draftly intentionally avoids the skeuomorphic paper margins, print rulers, and toolbar bloat typical of legacy suites like Google Docs.

---

## 1. Project Overview

Draftly provides a calm, high-velocity writing atelier combining:
- **Focused Editorial Flow:** A centered 760px line measure, organic color palette, and fluid typography.
- **Secure Identity & Authentication (Phase 2):** Argon2id password hashing, stateless HS256 JWT bearer tokens, and automated secret management.
- **Workspace Dashboard & Document Lifecycle (Phase 3):** Dedicated atelier dashboard, instant document creation, title renaming, case-insensitive search, multi-field sorting, grid/list view toggling, and soft-delete trash recovery.
- **Universal Ingestion:** Single-click import for Word (`.docx`), Markdown (`.md`), and plain text (`.txt`) up to 10MB *(Phase 5)*.
- **Resilient Persistence:** 1000ms debounced autosave, manual `Ctrl+S` override, and cloud persistence with Supabase PostgreSQL.
- **Clear Collaboration:** Role-based access control (Owner, Editor, Viewer) backed by partitioned "My Documents" and "Shared With Me" views *(Phase 6)*.

---

## 2. Technology Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript 5+
- **Styling:** Tailwind CSS 3.4+ (Custom Draftly Editorial Theme)
- **State & Context:** React Context (`AuthContext` with JWT persistence & re-validation)
- **Icons:** Lucide React
- **Deployment Target:** Vercel

### Backend
- **Framework:** Python 3.11+ / FastAPI
- **Password Hashing:** Argon2id (`argon2-cffi`)
- **Token Security:** PyJWT (HS256 signed bearer tokens with 30-minute expiry)
- **ORM & Data Layer:** SQLAlchemy 2.0+ (Async engine via `asyncpg`)
- **Database Migrations:** Alembic 1.13+ (Multi-revision dialect-aware migrations)
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
│       │   │   └── page.tsx     # Phase 3 Workspace Dashboard
│       │   └── documents/
│       │       └── [id]/
│       │           └── page.tsx # Phase 3 Document Detail & Preview Page
│       ├── context/
│       │   └── AuthContext.tsx  # Global authentication context & token manager
│       ├── components/
│       │   ├── Navbar.tsx       # Branded top navigation header with user avatar
│       │   └── StatusIndicator.tsx # Live backend & DB telemetry component
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
    │   │   ├── auth_service.py  # User auth, registration, & token dependencies
    │   │   └── document_service.py # Document CRUD, search, and trash management
    │   └── api/
    │       └── v1/
    │           ├── api.py       # API v1 router mounting
    │           └── endpoints/
    │               ├── health.py    # Health check and database diagnostics
    │               ├── auth.py      # User registration, login, and profile
    │               └── documents.py # Workspace document management endpoints
    └── tests/
        ├── __init__.py
        ├── conftest.py          # In-memory async SQLite test harness
        ├── test_health.py       # Health check & CORS test suite
        ├── test_auth.py         # Authentication & security test suite
        └── test_documents.py    # Phase 3 Document CRUD, search & isolation tests
```

---

## 4. Database Schema

### `users` Table
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Platform-independent UUID primary key |
| `username` | VARCHAR(100) | NOT NULL, INDEX | Display username |
| `email` | VARCHAR(320) | NOT NULL, UNIQUE, INDEX | Normalized lower-case user email |
| `hashed_password` | VARCHAR(255) | NOT NULL | Argon2id password hash |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT true | Account status flag |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Account creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last update timestamp |

### `documents` Table (Phase 3)
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | Primary Key | Platform-independent UUID primary key |
| `title` | VARCHAR(255) | NOT NULL, DEFAULT 'Untitled Document', INDEX | Document title |
| `content` | JSONB / JSON | NOT NULL, DEFAULT '{}' | Structured document content |
| `owner_id` | UUID | NOT NULL, FK(`users.id`), INDEX | Document author & owner ID |
| `is_deleted` | BOOLEAN | NOT NULL, DEFAULT false, INDEX | Soft deletion flag (Trash) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Document creation timestamp |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Last modification timestamp |

#### Indexes
- `ix_documents_id`: Primary lookup index.
- `ix_documents_owner_id`: High-speed owner filtering.
- `ix_documents_title`: Case-insensitive title searching.
- `ix_documents_is_deleted`: Partitioning active workspace documents vs trash items.
- `ix_documents_owner_deleted_updated`: Composite index on `(owner_id, is_deleted, updated_at)` for instant dashboard pagination.

---

## 5. API Endpoints

### Workspace Documents API (`/api/v1/documents`)

All document endpoints enforce **Strict Ownership Isolation**: unauthenticated requests receive `401 Unauthorized`, and attempting to access another user's document returns `404 Not Found` to prevent resource enumeration.

| Method | Endpoint | Query Parameters | Description | Status Code |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/documents` | `search`, `is_deleted`, `sort_by`, `sort_order` | List documents owned by user with live counts | `200 OK` |
| `POST` | `/api/v1/documents` | — | Create a new document in the workspace | `201 Created` |
| `GET` | `/api/v1/documents/{id}` | — | Retrieve complete document details by ID | `200 OK` |
| `PATCH` | `/api/v1/documents/{id}` | — | Update document title or restore from trash | `200 OK` |
| `DELETE` | `/api/v1/documents/{id}` | `permanent` (boolean) | Soft-delete to trash or permanently purge | `200 OK` |

#### Example: List Documents Response
```json
{
  "items": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Editorial Atelier Specification",
      "content": { "type": "doc", "content": [] },
      "owner_id": "987fcdeb-51a2-43f7-9012-345678901234",
      "is_deleted": false,
      "created_at": "2026-11-01T00:15:00Z",
      "updated_at": "2026-11-01T00:18:00Z"
    }
  ],
  "total": 1,
  "active_count": 1,
  "trash_count": 0
}
```

---

## 6. Workspace Dashboard Features

1. **Editorial Atelier Sidebar:**
   - **Overview:** Dynamic telemetry cards showing active count, trash count, and recent activity.
   - **My Documents:** Primary workspace view with live count pill.
   - **Shared With Me:** Clear UI placeholder marked for *Phase 6: Document Sharing*.
   - **Starred:** Clean UI placeholder marked for future releases.
   - **Trash:** Dedicated soft-deletion view with document restoration and permanent purge controls.
   - **Settings:** Atelier account profile and session overview.
2. **Instant Document Creation:**
   - "Create New Document" button opens an editorial modal with optional title (defaulting to "Untitled Document").
   - Automatically saves to the database and navigates to the dedicated document route (`/documents/[id]`).
3. **Live Search & Multi-Field Sorting:**
   - Case-insensitive search filtering across document titles.
   - Sort by: "Recently Modified", "Oldest First", "Alphabetical (A-Z)", and "Alphabetical (Z-A)".
4. **Adaptive View Modes:**
   - Switch between **Grid View** (rich cards with relative dates, status badges, and 3-dot action menus) and **List View** (compact rows for power writers).
5. **Document Detail & Preview Canvas (`/documents/[id]`):**
   - In-place title renaming directly in the sticky top header.
   - Centered 760px line measure matching the editorial atelier specifications.
   - Phase 4 teaser card detailing the upcoming Tiptap rich-text canvas and autosave engine.

---

## 7. Supabase Database Integration & Migrations

To run migrations against your Supabase PostgreSQL database:

1. Configure `backend/.env` with your PostgreSQL URI:
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres:[PASSWORD]@[HOST]:5432/postgres?ssl=require
   ```
2. Apply all migrations up to the latest head:
   ```bash
   cd backend
   .\venv\Scripts\alembic.exe upgrade head
   ```

Alembic will sequentially execute:
- `0001_create_users_table`: Instantiates the `users` table and indexes.
- `0002_create_documents_table`: Instantiates the `documents` table, foreign keys, and compound indexes.

---

## 8. Running Automated Tests

Run the full automated test suite (24 tests covering auth, health, documents, search, and isolation):

```bash
cd backend
.\venv\Scripts\pytest.exe -v
```

Expected output:
```
tests/test_auth.py::test_argon2_password_hashing PASSED                  [  4%]
tests/test_auth.py::test_jwt_token_generation_and_validation PASSED      [  8%]
tests/test_auth.py::test_jwt_expired_token_rejection PASSED              [ 12%]
tests/test_auth.py::test_successful_registration PASSED                  [ 16%]
tests/test_auth.py::test_duplicate_email_rejection PASSED                [ 20%]
tests/test_auth.py::test_successful_login PASSED                         [ 25%]
tests/test_auth.py::test_incorrect_password_rejection PASSED             [ 29%]
tests/test_auth.py::test_current_user_endpoint PASSED                    [ 33%]
tests/test_auth.py::test_unauthorized_access_rejection PASSED            [ 37%]
tests/test_auth.py::test_invalid_token_rejection PASSED                  [ 41%]
tests/test_documents.py::test_create_document_default_title PASSED       [ 45%]
tests/test_documents.py::test_create_document_custom_title PASSED        [ 50%]
tests/test_documents.py::test_list_and_count_documents PASSED            [ 54%]
tests/test_documents.py::test_get_document_by_id PASSED                  [ 58%]
tests/test_documents.py::test_rename_document PASSED                     [ 62%]
tests/test_documents.py::test_soft_delete_and_restore PASSED             [ 66%]
tests/test_documents.py::test_permanent_delete PASSED                    [ 70%]
tests/test_documents.py::test_unauthorized_access_prevention PASSED      [ 75%]
tests/test_documents.py::test_user_data_isolation PASSED                 [ 79%]
tests/test_documents.py::test_search_and_sorting PASSED                  [ 83%]
tests/test_health.py::test_root_endpoint PASSED                          [ 87%]
tests/test_health.py::test_root_health_endpoint PASSED                   [ 91%]
tests/test_health.py::test_v1_health_endpoint PASSED                     [ 95%]
tests/test_health.py::test_cors_headers PASSED                           [100%]

============================= 24 passed in 3.43s ==============================
```
