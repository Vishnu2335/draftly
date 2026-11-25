# Draftly — AI-Native Workflow & Engineering Audit

This document explains the actual AI-assisted development workflow used to build, refine, verify, and document Draftly. It describes where AI materially accelerated development, what recommendations were modified or rejected, and how correctness, UX quality, and reliability were systematically verified.

---

## 1. AI Tools Used

- **Google Antigravity Agentic IDE & Gemini AI:** Primary agentic coding assistant used for full-stack codebase exploration, rapid scaffolding of FastAPI endpoints, Pydantic schema generation, Tiptap React integration, and test suite generation.
- **Claude / Cursor CLI (Architecture Exploration):** Used in early planning phases for analyzing Tiptap node schema definitions and role-based sharing models.

---

## 2. Where AI Materially Accelerated Work

AI accelerated the development lifecycle in several distinct areas:

1. **Scaffolding Repetitive Boilerplate:**
   Rapid generation of SQLAlchemy 2.0 declarative models (`Document`, `DocumentShare`, `DocumentVersion`, `DocumentComment`, `DocumentPresence`) with UUID primary keys and cascading foreign keys, saving hours of manual boilerplate writing.
2. **Complex File Ingestion Engine (`import_service.py`):**
   Scaffolding AST parsing logic to convert Word `.docx` styles, Markdown `#` ATX headings, and plain text into Tiptap-compliant JSON nodes (`{"type": "doc", "content": [...]}`).
3. **Comprehensive Pytest Suite Generation:**
   Crafting 50 granular test cases across authentication, JWT validation, argon2 hashing, file upload edge cases, and RBAC matrix violations in minutes.
4. **Draftly Editorial Design Tokens:**
   Generating cohesive Tailwind CSS color tokens (`coral`, `cream`, `paper`, `retroGreen`, `shadow-retro`) to give Draftly its distinctive warm atelier aesthetic.
5. **Interactive Component Prototyping:**
   Rapid implementation of the slide-out drawers (`VersionHistoryDrawer.tsx`, `CommentsDrawer.tsx`, `ExportMenu.tsx`) adhering strictly to the warm paper visual design system.

---

## 3. AI-Generated Output Modified or Rejected

During the development of Draftly, several AI-generated recommendations and snippets were rejected or modified based on human engineering judgment:

### Example 1: Database UUID Compatibility on SQLite vs PostgreSQL
- **AI Recommendation:** Use PostgreSQL's native `from sqlalchemy.dialects.postgresql import UUID` directly in models.
- **Why Rejected:** When running local test suites with `aiosqlite`, SQLite failed with `CompileError` because it does not support native PostgreSQL UUID types.
- **Human Correction:** Implemented a platform-agnostic `GUID` custom TypeDecorator in `app/models/user.py` that loads native UUID on PostgreSQL and falls back to `CHAR(36)` on SQLite, allowing tests to run in-memory while production uses native Postgres UUIDs.

### Example 2: Server-Side PDF Rendering vs Client-Side Print
- **AI Recommendation:** Install server-side headless Chromium (e.g. `playwright` or `weasyprint`) in the FastAPI backend container to generate PDFs.
- **Why Rejected:** Adding a headless browser or C-bindings (`cairo`, `pango`) bloated Docker container size by 500MB+, dramatically increased memory consumption on free-tier hosting (Render 512MB RAM limit), and added latency.
- **Human Correction:** Implemented lightweight client-side printing via `window.print()` coupled with dedicated `@media print` CSS rules in `globals.css`. It produces instant, pixel-perfect PDFs with zero backend overhead.

### Example 3: Client-Side Export Serializer vs Heavy Server Endpoint
- **AI Recommendation:** Create a backend endpoint `GET /documents/{id}/export/markdown` that deserializes Tiptap JSON and streams a file.
- **Why Rejected:** Document content is already available in client memory inside the active Tiptap editor instance (`editor.getJSON()` / `editor.getText()`). Sending another roundtrip to the server to serialize markdown wastes bandwidth.
- **Human Correction:** Built `convertJsonToMarkdown` directly inside `ExportMenu.tsx` to serialize the AST into a `Blob` in client memory, downloading instantly.

### Example 4: Supabase Connection String Masking in Health Telemetry
- **AI Recommendation:** Return the raw `DATABASE_URL` in the `/api/v1/health` endpoint for debugging.
- **Why Rejected:** Exposed the live database hostname and credentials in a public unauthenticated endpoint.
- **Human Correction:** Sanitized health check output to only report connection status, provider name, and latency in milliseconds without exposing connection strings.

---

## 4. Human Engineering Decisions

1. **Multi-Tenant Security: 404 Not Found vs 403 Forbidden:**
   Enforced that uninvited callers requesting a private document receive `404 Not Found` rather than `403 Forbidden` to prevent malicious UUID enumeration.
2. **Pre-Restore Automated Backup:**
   Engineered the version restoration flow so that before overwriting a document with an older snapshot, the backend automatically takes a snapshot of the current state (`"Auto-saved prior to restoring vX"`), guaranteeing zero accidental data loss.
3. **Decoupled Stateless Architecture:**
   Deliberately avoided sticky sessions or server-side state in FastAPI, ensuring seamless horizontal scaling.
4. **Resilient Ephemeral Storage Fallback:**
   Added clear diagnostic messaging when the backend runs on an ephemeral container so developers immediately recognize when a persistent cloud `DATABASE_URL` needs to be set.

---

## 5. Verification & Testing Methodology

Implementation correctness and reliability were verified through eight rigorous verification layers:

1. **Static Analysis & Type Checking:**
   - Next.js production build (`npm run build`) completed with **0** TypeScript or ESLint errors across all 7 routes.
   - Pydantic models validated strict types, input constraints, and RFC 7807 error envelopes.
2. **Automated Backend Tests (`pytest`):**
   - 50/50 test cases passed in 9.57 seconds covering authentication, security, imports, sharing, versions, comments, and presence.
3. **End-to-End Browser Journeys (`playwright`):**
   - 6/6 full browser journeys passing in Chromium, validating multi-tab collaboration, owner invite, editor modifications, viewer lockouts, and instant access revocation.
4. **RBAC Permission Matrix Verification:**
   - Validated that Viewers receive `403 Forbidden` on PATCH endpoints and have `contenteditable="false"` set in the DOM.
   - Validated that Editors can edit content but cannot rename title, delete, or manage collaborators.
5. **Database Multi-Dialect Verification:**
   - Verified that models and migrations run seamlessly on both SQLite and PostgreSQL.
6. **Autosave Debouncing & Concurrency Verification:**
   - Verified that 1200ms debounce buffers continuous typing, that manual `Ctrl+S` forces immediate save, and that browser unload warnings trigger if uncommitted edits exist.
7. **Multi-Format Ingestion Verification:**
   - Tested real `.docx`, `.md`, and `.txt` files with formatting, headings, bullet lists, and special characters.
8. **Responsive UI & Accessibility Testing:**
   - Manually tested UI behavior across mobile, tablet, and desktop viewports, verifying retro shadows, drawer overlays, and keyboard focus states.
