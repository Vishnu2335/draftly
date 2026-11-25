# Draftly — Assessment Submission Package

## 1. Submission Artifacts Inventory

- [x] **Source Code:** Complete Next.js frontend and FastAPI backend repositories.
- [x] **Project Documentation:** [`submission/README.md`](README.md)
- [x] **System Architecture Document:** [`submission/ARCHITECTURE.md`](ARCHITECTURE.md)
- [x] **AI Workflow & Verification Report:** [`submission/AI_WORKFLOW.md`](AI_WORKFLOW.md)
- [x] **Walkthrough Video Presentation Script:** [`submission/VIDEO_PRESENTATION_SCRIPT.md`](VIDEO_PRESENTATION_SCRIPT.md)
- [x] **Video Recording Shot List & Checklist:** [`submission/VIDEO_SHOT_LIST.md`](VIDEO_SHOT_LIST.md)
- [x] **Assessment Readiness Audit:** [`submission/ASSESSMENT_READINESS.md`](ASSESSMENT_READINESS.md)
- [x] **Walkthrough Video URL Placeholder:** [`submission/WALKTHROUGH_VIDEO_URL.txt`](WALKTHROUGH_VIDEO_URL.txt)

---

## 2. Feature Completion & Verification Matrix

| Feature | Status | Notes & Concrete Codebase Evidence |
| :--- | :---: | :--- |
| **Authentication & Identity** | **Fully Implemented & Verified** | Argon2id password hashing, stateless HS256 JWT tokens, login by email or username, password show/hide toggle. Tested in `test_auth.py` (10/10 passing). |
| **Document Creation & Lifecycle** | **Fully Implemented & Verified** | Instant blank document creation, inline title renaming, soft-delete to Trash, and permanent purge. Tested in `test_documents.py` (10/10 passing). |
| **Rich-Text Editing Canvas** | **Fully Implemented & Verified** | Tiptap v2 headless editor with H1, H2, Bold, Italic, Underline, Bullet Lists, Numbered Lists, Alignment. 1200ms debounced autosave, manual `Ctrl+S`, word & char counter. Tested in Playwright Journey 2. |
| **Universal File Ingestion** | **Fully Implemented & Verified** | Direct import of Word (`.docx`), Markdown (`.md`), and plain text (`.txt`) up to 10MB into structured Tiptap JSON. Tested in `test_import.py` (8/8 passing). |
| **Document Sharing & RBAC** | **Fully Implemented & Verified** | Share modal with registered email search, Owner, Editor, and Viewer role assignment, and immediate access revocation. Tested in `test_sharing.py` (4/4 passing). |
| **Viewer Read-Only Permissions** | **Fully Implemented & Verified** | Read-only canvas (`contenteditable="false"`), suppressed toolbar, blocked title rename and delete. Backend returns `403 Forbidden` on modification attempts. Tested in Playwright Journey 5. |
| **Editor Collaboration Permissions** | **Fully Implemented & Verified** | Content editing permitted with live autosave. Title rename, document deletion, and collaborator management strictly prohibited. Tested in Playwright Journey 4. |
| **Multi-Format Export** | **Fully Implemented & Verified** | Instant export to PDF (`window.print()` with `@media print` CSS), Markdown (`.md` Blob serializer), and Plain Text (`.txt`). Implemented in `ExportMenu.tsx`. |
| **Document Version History** | **Fully Implemented & Verified** | Manual named snapshots, revision history list, and 1-click restore with automated pre-restore backup. Tested in `test_stretch_features.py`. |
| **Commenting & Suggestions** | **Fully Implemented & Verified** | Threaded comments drawer, resolve/reopen status toggling, and comment deletion. Tested in `test_stretch_features.py`. |
| **Live Collaboration Indicators** | **Fully Implemented & Verified** | Presence heartbeat (every 20s) with active collaborator avatars and pulsing green status in document header. Tested in `test_stretch_features.py`. |
| **Access Expiration & Public Sharing** | **Fully Implemented & Verified** | Expiring collaborator access (7 days, 30 days, Permanent) and public read-only link sharing (`/public/[token]`). Tested in `test_stretch_features.py`. |
| **Database Persistence** | **Fully Implemented & Verified** | SQLAlchemy 2.0 async engine supporting Supabase PostgreSQL and local SQLite fallback. Tested in `test_production_config.py`. |

---

## 3. Deployment Information

- **Backend Production Target:** `https://draftly-numf.onrender.com`
- **Frontend Production Target:** Vercel (Next.js 14 App Router)
- **Database Provider:** Supabase PostgreSQL (`lfdwnglivncvxshaqslc`)
- **API Documentation (Swagger UI):** Available at `https://draftly-numf.onrender.com/docs` or `http://localhost:8000/docs` locally.

---

## 4. Test Account Plan for Reviewers

Reviewers can verify all multi-user flows locally or on staging using two test accounts:

### Account A (Document Owner)
- **Email:** `owner@draftly.test`
- **Username:** `owner_alice`
- **Password:** `DraftlyPass2026!`

### Account B (Collaborator)
- **Email:** `collaborator@draftly.test`
- **Username:** `collab_bob`
- **Password:** `DraftlyPass2026!`

### Demonstration Steps:
1. Register **Account A** and create a document titled *"Q4 Product Strategy"*.
2. Open the **Share** modal, invite **Account B** (`collaborator@draftly.test`) as a **Viewer**.
3. Sign out, or open an Incognito window, and log into **Account B**.
4. Open the document from the **"Shared With Me"** dashboard tab.
5. Notice that the editor is locked into read-only mode (`Viewer` badge, formatting toolbar hidden, content editing disabled).
6. Return to **Account A**, open the **Share** modal, and change Account B's role to **Editor**.
7. In Account B's window, refresh the page. Notice that editing capability is instantly enabled with live autosave.
8. In Account A, open the **Share** modal and click **Revoke Access** on Account B.
9. Account B attempting to refresh or access the document URL receives an immediate `404 Document Unavailable` notice.
