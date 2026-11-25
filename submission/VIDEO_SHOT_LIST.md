# Draftly — Walkthrough Video Shot List & Recording Checklist

This document is your step-by-step visual storyboard for recording the 3–5 minute Draftly assessment video.

---

## 1. Pre-Recording Technical Checklist

- [ ] **Display Resolution:** Set monitor display resolution to 1080p (1920x1080) or 1440p (2560x1440).
- [ ] **Browser Zoom:** Set browser zoom to 100% (or 110% if text appears small on high-DPI screens).
- [ ] **Clean Browser Environment:**
  - Close unrelated browser tabs, bookmarks bar, and developer tools.
  - Set up two browser windows:
    - **Window 1 (Main / Chrome):** For Account A (Owner: `alice@draftly.test`).
    - **Window 2 (Incognito or Edge/Brave):** For Account B (Collaborator: `collaborator@draftly.test`).
- [ ] **Audio & Microphone:**
  - Use an external USB or headset microphone if available.
  - Test audio levels in Loom/OBS to ensure voice is crisp with zero background hiss.
- [ ] **System Notifications:**
  - Enable **Do Not Disturb** / **Focus Assist** on Windows to silence Slack, Discord, or email alerts.
- [ ] **Application Status:**
  - Backend running on `http://localhost:8000` (or live at `https://draftly-numf.onrender.com`).
  - Frontend running on `http://localhost:3000` (or live on Vercel).
  - Test accounts pre-registered or ready to demonstrate.

---

## 2. Scene-by-Scene Shot List

| Scene # | Time | Target Page / Component | User Account | On-Screen Action | Visual Feedback to Expect | Duration |
| :---: | :---: | :--- | :--- | :--- | :--- | :---: |
| **1** | **0:00–0:30** | Landing Page (`/`) | Logged out | Open Draftly home page. Move cursor over hero headline and action buttons. | Warm paper background, clean typography, "Sign In" and "Create" buttons visible. | 30s |
| **2** | **0:30–0:55** | Register Page (`/register`) | Registering `alice_writer` | Fill username, email, password, confirm password. Click "Create Your Account". | Form submits, instant redirection to `/dashboard` with Alice's username in navigation bar. | 25s |
| **3** | **0:55–1:15** | Dashboard (`/dashboard`) | `alice_writer` | Hover over search bar, sort dropdown, and click "Create New Document". | Modal appears with title input; document is created and opens editor. | 20s |
| **4** | **1:15–1:40** | Document Editor (`/documents/[id]`) | `alice_writer` (Owner) | Type title and heading. Format with Bold and Bullet list. Pause typing for 2s. | Autosave status badge in header switches from "Autosaving..." to "All Changes Saved". | 25s |
| **5** | **1:40–2:00** | Import Modal (`/dashboard`) | `alice_writer` (Owner) | Return to dashboard, click "Import Document", drag in sample `.docx` or `.md` file, click Import. | New document opens with formatted headings, lists, and bold text faithfully preserved. | 20s |
| **6** | **2:00–2:20** | Share Modal (`/documents/[id]`) | `alice_writer` (Owner) | Click "Share" button in header. Enter `collaborator@draftly.test`, choose "Viewer", click "Invite". | Collaborator appears in list as "Viewer". Success toast appears. | 20s |
| **7** | **2:20–2:40** | Window 2: Incognito (`/dashboard` & `/documents/[id]`) | `collaborator` (Viewer) | Log in as collaborator, click "Shared With Me" tab, open document. | "Viewer (Read-only)" badge visible. Canvas locked (`contenteditable=false`). Toolbar, Share, Trash hidden. | 20s |
| **8** | **2:40–3:00** | Window 1 & 2: Role Upgrade | `alice_writer` -> `collaborator` | Owner changes role to "Editor" in Share modal. Collaborator refreshes in Window 2. | Badge switches to "Editor Access". Toolbar appears. Collaborator types text and autosave saves it. Presence avatars show both live. | 20s |
| **9** | **3:00–3:15** | Drawers & Export (`/documents/[id]`) | `alice_writer` (Owner) | Click "Export" (show PDF/MD/Text), click "History" (show snapshots), click "Comments" (show thread). | Slide-out drawers smoothly animate from right edge with retro border and shadow styling. | 15s |
| **10** | **3:15–3:45** | Codebase / Editor View | Host | Show architecture highlights or stay on editor while explaining Next.js, FastAPI, PostgreSQL, and AI workflow. | Clear, authoritative vocal delivery demonstrating deep mastery of the stack. | 30s |
| **11** | **3:45–4:15** | Dashboard (`/dashboard`) | Host | Return to dashboard. Summarize product decisions, prioritized features, and future roadmap. | Full dashboard with active document cards and stats. | 30s |
| **12** | **4:15–4:30** | Landing Page / Header (`/`) | Host | Conclude presentation, thank reviewer, and finish recording cleanly. | Professional concluding screen. | 15s |

---

## 3. Post-Recording Quality Verification

Before submitting the video link:
1. **Audio Check:** Can your voice be heard clearly throughout without distortion?
2. **Video Check:** Is text crisp and legible (at least 720p/1080p rendered)?
3. **Pacing Check:** Is total duration between 3:00 and 5:00 minutes (ideal ~4:00)?
4. **Link Permissions:** Ensure your Loom or YouTube video is set to **"Unlisted"** or **"Anyone with the link can view"** (not Private).
5. **Paste URL:** Paste the resulting URL into [`submission/WALKTHROUGH_VIDEO_URL.txt`](WALKTHROUGH_VIDEO_URL.txt).
