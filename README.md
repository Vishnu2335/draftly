# Draftly — Modern Document Workspace

> **Phase 1: Project Foundation** — Status: Complete & Operational

Draftly is a modern, focused, distraction-free document creation, editing, importing, and sharing workspace. Designed with its own distinct visual and editorial identity, Draftly intentionally avoids the skeuomorphic paper margins, print rulers, and toolbar bloat typical of legacy suites like Google Docs.

---

## 1. Project Overview

Draftly provides a calm, high-velocity writing atelier combining:
- **Focused Editorial Flow:** A centered 760px line measure, organic color palette, and fluid typography.
- **Universal Ingestion:** Single-click import for Word (`.docx`), Markdown (`.md`), and plain text (`.txt`) up to 10MB.
- **Resilient Persistence:** 1000ms debounced autosave, manual `Ctrl+S` override, and cloud persistence with Supabase PostgreSQL.
- **Clear Collaboration:** Role-based access control (Owner, Editor, Viewer) backed by partitioned "My Documents" and "Shared With Me" views.

---

## 2. Technology Stack

### Frontend
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript 5+
- **Styling:** Tailwind CSS 3.4+ (Custom Draftly Editorial Theme)
- **Icons:** Lucide React
- **Deployment Target:** Vercel

### Backend
- **Framework:** Python 3.11+ / FastAPI
- **ORM & Data Layer:** SQLAlchemy 2.0+ (Async engine via `asyncpg`)
- **Database Migrations:** Alembic 1.13+
- **Configuration:** Pydantic Settings v2
- **Testing:** Pytest, pytest-asyncio, HTTPX
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
│       │   ├── layout.tsx       # Root layout with Navbar & Footer
│       │   └── page.tsx         # Branded Phase 1 workspace & diagnostic view
│       ├── components/
│       │   ├── Navbar.tsx       # Branded top navigation header
│       │   └── StatusIndicator.tsx # Live backend & DB telemetry component
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
    │   └── versions/            # Version-controlled migration scripts
    ├── app/
    │   ├── __init__.py
    │   ├── main.py              # FastAPI application entry point & CORS
    │   ├── core/
    │   │   ├── config.py        # Centralized settings & connection string parsing
    │   │   ├── database.py      # SQLAlchemy async engine & connection verification
    │   │   └── exceptions.py    # Standardized RFC 7807 error envelopes
    │   └── api/
    │       └── v1/
    │           ├── api.py       # API v1 router mounting
    │           └── endpoints/
    │               └── health.py # Health check and database diagnostics
    └── tests/
        ├── __init__.py
        └── test_health.py       # Automated health & CORS test suite
```

---

## 4. Prerequisites

Ensure the following runtimes are installed on your workstation:
- **Node.js:** v18.17+ or v20+ (tested on Node v24.18.0)
- **NPM:** v9+ or v10+ (tested on NPM 11.16.0)
- **Python:** 3.11+ (tested on Python 3.11.2)
- **Git:** 2.30+

---

## 5. Backend Installation and Startup

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
Edit `.env` with your actual Supabase PostgreSQL credentials (see Section 7).

### 3. Run Backend Test Suite
```bash
pytest -v
```

### 4. Start FastAPI Server
```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API is now accessible at:
- **API Base:** `http://localhost:8000`
- **Health Diagnostics:** `http://localhost:8000/health`
- **Interactive OpenAPI Docs:** `http://localhost:8000/docs`
- **ReDoc Documentation:** `http://localhost:8000/redoc`

---

## 6. Frontend Installation and Startup

### 1. Install Dependencies
```bash
# In a new terminal, navigate to the frontend directory
cd frontend

# Install dependencies
npm install
```

### 2. Configure Environment Variables
```bash
# Copy example configuration template
cp .env.example .env.local
```

### 3. Start Next.js Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. The landing workspace will automatically probe `http://localhost:8000/api/v1/health` and display real-time connectivity status.

---

## 7. Supabase PostgreSQL Configuration

Draftly uses **Supabase PostgreSQL** as its managed relational database provider.

### How to Retrieve Your Supabase Database URL:
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your Draftly project.
3. Navigate to **Project Settings** → **Database**.
4. Under **Connection string**, select **URI**.
5. Choose either:
   - **Direct connection:**
     ```
     postgresql://postgres:[YOUR-PASSWORD]@[YOUR-HOST].supabase.co:5432/postgres?sslmode=require
     ```
   - **Transaction Pooler (Recommended for production):**
     ```
     postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@[YOUR-POOLER-HOST]:6543/postgres?sslmode=require
     ```
6. Paste this URI into `backend/.env` as `DATABASE_URL`.

*Note:* Draftly’s database engine automatically normalizes `postgres://` or `postgresql://` URIs into asyncpg-compatible `postgresql+asyncpg://` connections and handles SSL parameters appropriately.

---

## 8. Environment Variable Setup

### Backend (`backend/.env`)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `ENVIRONMENT` | `development` | Operating environment (`development`, `staging`, `production`) |
| `PROJECT_NAME` | `Draftly` | Display service identifier |
| `API_V1_STR` | `/api/v1` | URL route prefix for v1 endpoints |
| `DATABASE_URL` | *None* | Supabase PostgreSQL connection string with SSL |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed frontend origins (JSON array or comma-separated) |

### Frontend (`frontend/.env.local`)
| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` | Base URL of the FastAPI backend service |

---

## 9. Database Connectivity Verification

To verify your Supabase PostgreSQL connection:

1. Ensure your `.env` contains a valid `DATABASE_URL`.
2. Run the automated database probe:
   ```bash
   cd backend
   python -c "import asyncio; from app.core.database import check_database_connection; print(asyncio.run(check_database_connection()))"
   ```
   - **If Connected:** Returns `{'status': 'connected', 'provider': 'Supabase PostgreSQL', 'latency_ms': XX.X}`.
   - **If Unconfigured:** Returns `{'status': 'unconfigured', 'message': 'DATABASE_URL is not configured...'}` without crashing.
   - **If Bad Credentials:** Returns `{'status': 'disconnected', 'message': 'Connection check failed: ...'}`.

3. Verify Alembic schema tracking:
   ```bash
   alembic heads
   ```

---

## 10. API Health-Check Instructions

Once the backend is running, verify service diagnostics:

### Curl / HTTP GET:
```bash
curl -s http://localhost:8000/api/v1/health | jq .
```

### Expected Response Payload:
```json
{
  "status": "healthy",
  "service": "Draftly",
  "version": "1.0.0",
  "environment": "development",
  "timestamp": "2026-10-31T18:04:04.005010+00:00",
  "database": {
    "status": "unconfigured",
    "provider": "Supabase PostgreSQL",
    "message": "DATABASE_URL is not configured in environment variables.",
    "latency_ms": null
  }
}
```

When `DATABASE_URL` is configured with active Supabase credentials:
```json
{
  "status": "healthy",
  "service": "Draftly",
  "version": "1.0.0",
  "environment": "development",
  "timestamp": "2026-10-31T18:10:00.000000+00:00",
  "database": {
    "status": "connected",
    "provider": "Supabase PostgreSQL",
    "message": "Live connection to Supabase PostgreSQL verified.",
    "latency_ms": 34.2
  }
}
```

---

## Phase 1 Sign-Off Status

- **Status:** **COMPLETE & VERIFIED**
- **Next Phase:** Phase 2 – Authentication & User Management *(Pending user approval)*
