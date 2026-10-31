# Draftly — Modern Document Workspace

> **Phase 2: Authentication & User Management** — Status: Complete & Operational

Draftly is a modern, focused, distraction-free document creation, editing, importing, and sharing workspace. Designed with its own distinct visual and editorial identity, Draftly intentionally avoids the skeuomorphic paper margins, print rulers, and toolbar bloat typical of legacy suites like Google Docs.

---

## 1. Project Overview

Draftly provides a calm, high-velocity writing atelier combining:
- **Focused Editorial Flow:** A centered 760px line measure, organic color palette, and fluid typography.
- **Secure Identity & Authentication (Phase 2):** Argon2id password hashing, stateless HS256 JWT bearer tokens, and automated key generation.
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
├── DRAFTLY_PRD.html             # Standalone interactive PRD specification
├── docs/
│   └── DRAFTLY_PRD.html         # Archival copy of approved PRD
├── frontend/                    # Next.js Application
│   ├── .env.example             # Frontend environment template
│   ├── next.config.mjs          # Next.js build configuration
│   ├── package.json             # NPM dependencies & scripts
│   ├── postcss.config.mjs       # PostCSS configuration
│   ├── tailwind.config.ts       # Tailwind theme with Draftly tokens
│   ├── tsconfig.json            # TypeScript configuration
│   └── src/
│       ├── app/
│       │   ├── globals.css      # Base styling and theme variables
│       │   ├── layout.tsx       # Root layout with AuthProvider, Navbar & Footer
│       │   ├── page.tsx         # Branded Phase 2 workspace & diagnostic view
│       │   ├── login/
│       │   │   └── page.tsx     # Sign-in page with client & API error handling
│       │   └── register/
│       │       └── page.tsx     # Registration page with validation & password confirmation
│       ├── components/
│       │   ├── Navbar.tsx       # Branded top navigation header with user profile badge
│       │   └── StatusIndicator.tsx # Live backend & DB telemetry component
│       ├── context/
│       │   └── AuthContext.tsx  # React AuthContext (token storage, login, register, logout)
│       └── lib/
│           └── config.ts        # Frontend API client and type schemas
└── backend/                     # FastAPI Application
    ├── .env.example             # Backend environment template
    ├── alembic.ini              # Alembic migration configuration
    ├── pytest.ini               # Pytest testing configuration
    ├── requirements.txt         # Python package dependencies
    ├── alembic/
    │   ├── env.py               # Async Alembic migration environment
    │   ├── script.py.mako       # Migration template
    │   └── versions/
    │       └── 0001_create_users_table.py # Initial users table schema migration
    ├── app/
    │   ├── __init__.py
    │   ├── main.py              # FastAPI application entry point, CORS & exception handlers
    │   ├── core/
    │   │   ├── config.py        # Centralized settings & automatic JWT secret generator
    │   │   ├── database.py      # SQLAlchemy async engine & connection verification
    │   │   ├── exceptions.py    # Standardized RFC 7807 error envelopes
    │   │   └── security.py      # Argon2 password hashing & PyJWT token utilities
    │   ├── models/
    │   │   ├── __init__.py
    │   │   └── user.py          # SQLAlchemy 2.0 User model (UUID, unique email, active)
    │   ├── schemas/
    │   │   ├── __init__.py
    │   │   └── user.py          # Pydantic v2 schemas (Register, Login, UserResponse, Token)
    │   ├── services/
    │   │   ├── __init__.py
    │   │   └── auth_service.py  # User registration, login verification, and auth dependencies
    │   └── api/
    │       └── v1/
    │           ├── api.py       # API v1 router mounting
    │           └── endpoints/
    │               ├── auth.py  # POST /register, POST /login, GET /me
    │               └── health.py # Health check and database diagnostics
    └── tests/
        ├── __init__.py
        ├── conftest.py          # In-memory async SQLite engine & client fixtures
        ├── test_auth.py         # 10 automated authentication & security test scenarios
        └── test_health.py       # 4 automated health & CORS test scenarios
```

---

## 4. Prerequisites

Ensure the following runtimes are installed on your workstation:
- **Node.js:** v18.17+ or v20+ (tested on Node v24.18.0)
- **NPM:** v9+ or v10+ (tested on NPM 11.16.0)
- **Python:** 3.11+ (tested on Python 3.11.2)
- **Git:** 2.30+

---

## 5. Automatic JWT Secret Generation

Draftly automatically provisions cryptographically secure JWT keys:
- On startup, the configuration manager inspects `backend/.env`.
- If `JWT_SECRET_KEY` is not found, it generates a secure 32-byte secret using Python's `secrets.token_urlsafe(32)`.
- It saves the secret in `backend/.env` automatically.
- Once generated, the secret is **strictly preserved** across all server restarts and is never regenerated.
- `backend/.env` is completely excluded from Git by `.gitignore`.

---

## 6. Backend Installation and Startup

### 1. Set Up Virtual Environment & Dependencies
```bash
# Navigate to the backend directory
cd backend

# Create Python virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On macOS / Linux:
source venv/bin/activate

# Install required dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables
```bash
# Copy example configuration template
cp .env.example .env
```
Provide your Supabase PostgreSQL connection string in `backend/.env`.

### 3. Run Automated Tests
```bash
pytest -v
```
All 14 unit and integration tests run against an isolated in-memory async SQLite database, ensuring test runs never alter production Supabase tables.

### 4. Start FastAPI Server
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API is now accessible at:
- **API Base:** `http://localhost:8000`
- **Health Diagnostics:** `http://localhost:8000/health`
- **Interactive Swagger Docs:** `http://localhost:8000/docs`
- **ReDoc Documentation:** `http://localhost:8000/redoc`

---

## 7. Frontend Installation and Startup

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment Variables
```bash
cp .env.example .env.local
```

### 3. Start Next.js Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser:
- **Home Workspace:** `http://localhost:3000/`
- **Sign In:** `http://localhost:3000/login`
- **Create Account:** `http://localhost:3000/register`

---

## 8. Authentication API Specifications & Examples

### 1. Register a User Account
- **Route:** `POST /api/v1/auth/register`
- **Headers:** `Content-Type: application/json`
- **Payload:**
  ```json
  {
    "username": "elena_author",
    "email": "elena@example.com",
    "password": "StrongPassword2026!"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "e4b1c7a2-11df-4b95-9472-880fa19d20c5",
    "username": "elena_author",
    "email": "elena@example.com",
    "is_active": true,
    "created_at": "2026-10-31T18:20:00Z",
    "updated_at": "2026-10-31T18:20:00Z"
  }
  ```

### 2. User Login & Token Issuance
- **Route:** `POST /api/v1/auth/login`
- **Headers:** `Content-Type: application/json`
- **Payload:**
  ```json
  {
    "email": "elena@example.com",
    "password": "StrongPassword2026!"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 1800,
    "user": {
      "id": "e4b1c7a2-11df-4b95-9472-880fa19d20c5",
      "username": "elena_author",
      "email": "elena@example.com",
      "is_active": true,
      "created_at": "2026-10-31T18:20:00Z",
      "updated_at": "2026-10-31T18:20:00Z"
    }
  }
  ```

### 3. Get Current User Profile (Protected)
- **Route:** `GET /api/v1/auth/me`
- **Headers:** `Authorization: Bearer <access_token>`
- **Response (200 OK):**
  ```json
  {
    "id": "e4b1c7a2-11df-4b95-9472-880fa19d20c5",
    "username": "elena_author",
    "email": "elena@example.com",
    "is_active": true,
    "created_at": "2026-10-31T18:20:00Z",
    "updated_at": "2026-10-31T18:20:00Z"
  }
  ```

---

## 9. Supabase PostgreSQL Configuration & Migrations

### Database Setup:
1. Log in to [Supabase Dashboard](https://supabase.com/dashboard) and open your Draftly project.
2. Under **Project Settings** → **Database**, copy the **URI connection string**.
3. Paste it into `backend/.env` as `DATABASE_URL`:
   ```env
   DATABASE_URL=postgresql+asyncpg://postgres:[YOUR-PASSWORD]@[YOUR-HOST]:5432/postgres?ssl=require
   ```
4. Run Alembic migrations to apply the `users` table schema:
   ```bash
   cd backend
   alembic upgrade head
   ```

---

## Phase 2 Sign-Off Status

- **Status:** **PHASE 2 COMPLETE & VERIFIED**
- **Automated Tests:** 14/14 Passing (100%)
- **Next Phase:** Phase 3 – Workspace Dashboard *(Pending user approval)*
