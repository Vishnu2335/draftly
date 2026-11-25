# Draftly — Document Creation & Collaboration Workspace

Draftly is a modern, distraction-free document creation, editing, importing, and collaborative sharing workspace. Designed with an intentional editorial visual identity, Draftly avoids the skeuomorphic paper margins, print rulers, and toolbar clutter of legacy office suites, offering a focused writing atelier backed by rigorous multi-tenant security and granular Role-Based Access Control (RBAC).

---

## 1. Problem Statement & Purpose

Most collaborative document editors today are bloated with complex toolbars, intrusive menus, and slow interfaces that pull writers away from deep focus. Conversely, minimal note apps lack enterprise-grade permissions, multi-format import, version histories, and robust collaboration controls.

Draftly bridges this gap by combining:
1. **A Calm, High-Velocity Atelier:** A centered 760px measure, warm editorial paper palette (`#F7F3EA`, `#F15B5D`, `#171717`), fluid typography, and immediate response.
2. **Strict Identity & Security:** Argon2id password hashing, stateless HS256 JWT bearer tokens, and automated token invalidation.
3. **Headless Rich-Text Engine:** Tiptap v2 integration with 1200ms debounced autosave, manual `Ctrl+S` override, word/character telemetry, and unsaved changes navigation guards.
4. **Universal Ingestion:** Single-click import for Microsoft Word (`.docx`), Markdown (`.md`), and plain text (`.txt`) up to 10MB into structured document nodes.
5. **Granular Collaboration & RBAC:** Multi-tenant workspace with Owner, Editor, and Viewer access enforcement, access duration expiration, and public read-only link sharing.
6. **Continuous Innovation:** Revision version snapshots with 1-click restore, threaded comments with resolve/reopen workflows, multi-format export (PDF, Markdown, Text), and live collaboration presence indicators.

---

## 2. Technology Stack

### Frontend
- **Framework:** Next.js 14+ (App Router, Server & Client Components)
- **Language:** TypeScript 5+ (Strict Type Checking)
- **Rich-Text Editor:** Tiptap v2 (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-underline`, `@tiptap/extension-text-align`, `@tiptap/extension-placeholder`)
- **Styling:** Tailwind CSS 3.4+ (Custom Draftly Editorial Theme)
- **Icons:** Lucide React
- **State Management:** React Context (`AuthContext` with JWT local persistence & automatic session validation)
- **End-to-End Testing:** Playwright Test 1.58+ (Chromium headless engine)

### Backend
- **Framework:** Python 3.11+ / FastAPI
- **Data Layer & ORM:** SQLAlchemy 2.0+ (Async engine via `asyncpg`)
- **Database Migrations:** Alembic 1.13+
- **Password Hashing:** Argon2id (`argon2-cffi`)
- **Token Security:** PyJWT (HS256 signed bearer tokens with 30-minute expiry)
- **File Ingestion:** `python-docx` for `.docx` XML parsing, custom AST line parser for `.md`, and streaming text handler for `.txt`
- **Configuration:** Pydantic Settings v2 & `python-dotenv`
- **Testing:** Pytest, pytest-asyncio, HTTPX, in-memory `aiosqlite`

### Database
- **Primary Database:** **Supabase PostgreSQL** (PostgreSQL 15+ with SSL and connection pooling)
- **Local Fallback:** SQLite with async driver (`sqlite+aiosqlite`) for zero-dependency local development and rapid test suite execution.

---

## 3. Architecture Overview

Draftly follows a clean decoupled client-server architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                       Next.js Frontend                      │
│   (App Router, React Context, Tiptap Editor Canvas, Tailwind)│
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / REST API
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       FastAPI Backend                       │
│    (Pydantic Validation, Argon2 Security, Async Services)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ SQLAlchemy 2.0 Async
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL / SQLite                      │
│   (Users, Documents, Shares, Versions, Comments, Presence)  │
└─────────────────────────────────────────────────────────────┘
```

- **Frontend:** Modular App Router architecture separating public routes (`/`, `/login`, `/register`, `/public/[token]`) from authenticated workspace routes (`/dashboard`, `/documents/[id]`).
- **Backend:** Layered FastAPI service layout: `api/v1/endpoints/` (routing & validation), `services/` (business logic, RBAC checks), `models/` (SQLAlchemy 2.0 declarative tables), and `core/` (config, database engine, security).
- **Multi-Tenant Isolation:** Uninvited users querying documents receive `404 Not Found` rather than `403 Forbidden` to prevent UUID enumeration attacks.

---

## 4. Prerequisites

To run Draftly locally, ensure you have:
- **Node.js:** v18.17.0+ (v20+ recommended)
- **npm:** v9+ or **pnpm** v8+
- **Python:** v3.11+ (Python 3.11.2 tested)
- **Git:** v2.30+
- *(Optional)* A free [Supabase](https://supabase.com) project for persistent cloud PostgreSQL storage.

---

## 5. Environment Configuration

### Backend Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:

```bash
cp backend/.env.example backend/.env
```

| Variable | Description | Example |
| :--- | :--- | :--- |
| `ENVIRONMENT` | Runtime mode (`development`, `production`, `testing`) | `development` |
| `PROJECT_NAME` | Service branding | `Draftly` |
| `API_V1_STR` | API routing prefix | `/api/v1` |
| `DATABASE_URL` | PostgreSQL connection URI (Optional for local dev) | `postgresql+asyncpg://postgres:[PASS]@[HOST]:5432/postgres?ssl=require` |
| `JWT_SECRET_KEY` | Secret key for signing HS256 tokens (min 32 chars) | `k4vt6nmF-2RhVdaBuB3Zw4i3PqsVtO5hECt8Hyl0HjU` |
| `JWT_ALGORITHM` | Cryptographic signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Bearer token lifespan | `30` |
| `CORS_ORIGINS` | Allowed origins for cross-origin requests | `["http://localhost:3000","http://127.0.0.1:3000"]` |

*Note: For local development, if `DATABASE_URL` is omitted, Draftly automatically initializes and uses a local SQLite database (`backend/draftly_dev.db`).*

### Frontend Configuration (`frontend/.env.local`)

Copy `frontend/.env.example` to `frontend/.env.local`:

```bash
cp frontend/.env.example frontend/.env.local
```

| Variable | Description | Example |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Base URL of the backend FastAPI service | `http://localhost:8000` |

---

## 6. Local Installation & Startup Guide

### Step 1: Clone the Repository

```bash
git clone https://github.com/Vishnu2335/draftly.git
cd draftly
```

### Step 2: Start the Backend Service

1. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv backend/venv
   & "backend/venv/Scripts/Activate.ps1"

   # macOS / Linux
   python3 -m venv backend/venv
   source backend/venv/bin/activate
   ```

2. Install backend dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

3. Launch the FastAPI application:
   ```bash
   # From the project root or backend folder
   uvicorn app.main:app --app-dir backend --reload --port 8000
   ```

4. Verify backend health:
   Open [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health) or [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI).

### Step 3: Start the Frontend Application

1. Open a new terminal and navigate to `frontend/`:
   ```bash
   cd frontend
   npm install
   ```

2. Launch the Next.js development server:
   ```bash
   npm run dev
   ```

3. Open the application:
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 7. Testing Instructions

### Backend Test Suite (Pytest)

The backend includes a comprehensive 50-test automated test suite covering authentication, security, CRUD operations, multi-format imports, CORS, health checks, and role-based sharing permissions.

Run the test suite:
```powershell
& "backend/venv/Scripts/python.exe" -m pytest backend/tests/ -v
```

Expected result:
```text
============================= 50 passed in 9.57s =============================
```

### Frontend Typecheck & Production Build

Verify Next.js build integrity and TypeScript compliance:
```bash
cd frontend
npm run build
```

Expected result:
```text
✓ Compiled successfully
✓ Generating static pages (7/7)
Finalizing page optimization ...
```

### End-to-End Browser Tests (Playwright)

Run all 6 user journeys in headless Chromium:
```bash
cd frontend
npx playwright test
```

---

## 8. Live Deployment Information

- **Designated Backend Target:** `https://draftly-numf.onrender.com` (Render Web Service)
- **Frontend Target:** Vercel (Next.js 14 App Router)
- **Database:** Supabase Managed PostgreSQL (`lfdwnglivncvxshaqslc`)

### Important Note on Cloud Database Persistence
On Render free-tier services, containers use an **ephemeral disk**. If `DATABASE_URL` is omitted from the Render Dashboard Environment tab, the backend defaults to local temporary SQLite. When a new commit is pushed, Render replaces the container, wiping the temporary file. Configuring `DATABASE_URL` pointing to Supabase in Render's dashboard ensures all user accounts and documents persist indefinitely across redeployments.

---

## 9. Known Limitations

1. **Simultaneous Real-Time Cursor Typing (Operational Transformation / CRDT):** While Draftly provides real-time collaboration presence badges, active user heartbeats, and debounced autosaving, simultaneous character-by-character live text cursor broadcasting (e.g., Yjs / WebSockets) is deprioritized in favor of rock-solid REST-based autosave and snapshot revision history.
2. **Offline Mode:** Draftly currently requires an active network connection to authenticate and persist document changes to the backend.
3. **Password Reset by Email:** Self-service password resets via SMTP email are not yet wired to a transactional email provider; password changes currently occur via authenticated account settings.
