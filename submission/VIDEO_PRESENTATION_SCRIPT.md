# Draftly — Walkthrough Video Presentation Script

> **Instructions for Recording:**
> Open this Markdown file on one half of your screen and open Draftly in your browser on the other half.
> Read the **`[SPEAK]`** lines aloud naturally while performing the actions described in **`[ACTION]`**.
> **Total Duration:** ~4 minutes (comfortable speaking pace: ~130-140 words per minute).

---

## 0:00 – 0:30 | Introduction & Product Overview

**[ACTION]**
Start on the Draftly landing page (`/`). Move your mouse over the title and hero buttons.

**[SPEAK]**
"Hello everyone! My name is Vishnu, and today I'm excited to present **Draftly**, a modern, distraction-free document creation and collaborative sharing workspace.

Traditional document tools like Google Docs are often cluttered with endless toolbars, print margins, and complicated settings that distract us when we just want to focus on writing. 

Draftly was designed to solve this problem. It gives writers and teams a calm, high-velocity writing atelier combining rich-text formatting, instant file ingestion, and strict role-based access control. Let's dive in and see how it works!"

---

## 0:30 – 1:30 | Main User Flow: Authentication, Dashboard & Editing

**[ACTION]**
Click the **Sign In** button, then switch to **Create** / register page (`/register`). Type in:
- Username: `alice_writer`
- Email: `alice@draftly.test`
- Password: `DraftlyPass2026!`
Click **Create Your Account**. The app immediately logs you in and redirects to `/dashboard`.

**[SPEAK]**
"First, let's create a new account. Our registration system validates input requirements in real time and secures passwords using the modern Argon2id hashing algorithm.

As soon as we register, Draftly automatically authenticates us and creates a secure JSON Web Token, taking us directly into our Workspace Dashboard.

Here on the dashboard, we have a clean overview of our documents. We can search documents by title, sort them by last updated or creation date, toggle between grid and list views, or restore trashed files."

**[ACTION]**
Click the **Create New Document** button. Type the title: `2026 Product Launch Strategy`. Click **Create Document**.
You are immediately taken to the editor canvas (`/documents/[id]`).

**[SPEAK]**
"Now, let's create a new document. I'll name this *'2026 Product Launch Strategy'* and click Create.

This opens the Draftly writing atelier. The canvas is centered at a comfortable 760-pixel line length, which is optimal for reading and writing without eye strain."

**[ACTION]**
Click into the Tiptap editor canvas. Type:
`# Executive Overview`
`Draftly brings focus back to writing with clean formatting and seamless team collaboration.`
Highlight some text and click **Bold**, then make a bulleted list using the toolbar.
Pause for 2 seconds to show the status badge in the header changing from *'Autosaving...'* to *'All Changes Saved'*.

**[SPEAK]**
"Draftly's editor is powered by a headless Tiptap engine. We have access to clean headings, bold, italic, lists, and text alignment.

Notice the status indicator in the top bar: as soon as I stop typing, Draftly automatically triggers a debounced autosave after 1200 milliseconds. We can also hit `Ctrl+S` anytime for an immediate manual save. Our work is continuously protected, and if we ever try to close the tab while editing, a navigation guard prevents any accidental data loss."

---

## 1:30 – 2:30 | File Ingestion & Collaborative Sharing (RBAC)

**[ACTION]**
Click the back arrow to return to `/dashboard`. Click **Import Document**. Show the file dropzone.
Upload a sample `.md` or `.docx` file and click **Import & Open**.
Demonstrate that the imported file opens with all headings and paragraphs preserved.

**[SPEAK]**
"Draftly also features universal file ingestion. From the dashboard, we can import Word `.docx`, Markdown, or text files up to 10 megabytes. Our backend parses the document structure into native Tiptap nodes, preserving headings, bold text, and bullet lists instantly.

Now, let's look at one of Draftly's most powerful capabilities: **Role-Based Collaboration**."

**[ACTION]**
In the document editor header, click the **Share** button.
The Share modal opens.
Enter email: `collaborator@draftly.test`.
Select role: **Viewer (Read-only)**.
Select duration: **Permanent** (or 7 Days).
Click **Invite**. Show that `collaborator@draftly.test` appears in the collaborators list as a Viewer.
Click **Done**.

**[SPEAK]**
"When sharing a document, the owner has complete granular control. We can invite teammates by email and choose between two distinct permission levels: **Editor** or **Viewer**. We can even set access expiration, like 7 or 30 days, or enable a public read-only link for external review.

Let's invite our colleague as a **Viewer** and see what their experience looks like."

**[ACTION]**
Open an Incognito window (or a second browser profile).
Log in as `collaborator@draftly.test`.
Go to the **Shared With Me** tab on the dashboard.
Click and open the shared document *'2026 Product Launch Strategy'*.
Show the screen:
- Notice the **Viewer (Read-only)** badge in the header.
- Notice the formatting toolbar is completely hidden.
- Try to type on the canvas—nothing can be edited.
- Notice the **Share** and **Trash** buttons do not exist for the viewer.

**[SPEAK]**
"Here in our second browser window, I've logged in as the invited collaborator. In the 'Shared With Me' tab, our document appears immediately.

When we open it as a Viewer:
Notice the top badge clearly says *'Viewer'*. The formatting toolbar is completely hidden, and clicking on the canvas does not allow any edits. The Trash and Share buttons are completely unavailable.

Even if someone tries to bypass the UI using API tools like Postman or curl, our FastAPI backend checks the user's role on every single request and strictly rejects any unauthorized modifications with a 403 Forbidden."

**[ACTION]**
Switch back to the Owner window.
Click **Share**, change the collaborator's role to **Editor**, click Done.
Switch back to the Collaborator window and refresh.
Show that the badge now says **Editor**, the toolbar appears, and the collaborator can type a new paragraph.
Also show the live presence avatar in the header showing both users active!

**[SPEAK]**
"Now, watch how easy it is to update permissions: the owner switches the role to **Editor**. As soon as our collaborator refreshes, they immediately gain full editing access, while destructive actions like renaming the title or deleting the document remain safely restricted to the owner.

Notice also the live presence avatar in the top bar: Draftly's heartbeat system shows who is actively collaborating on the document right now."

---

## 2:30 – 3:15 | Technical Architecture & Implementation

**[ACTION]**
Stay on the document editor. Click the **History** button to show the Version History drawer, and click **Comments** to show the Comments drawer. Then click **Export** to show the PDF, Markdown, and Text export options.

**[SPEAK]**
"Let's look briefly under the hood at the technical architecture that powers Draftly.

On the frontend, we use **Next.js 14** with the App Router, React Context for authentication state, and **Tailwind CSS** for our custom retro editorial design system.

The backend is built with **FastAPI** on Python 3.11, providing high-performance asynchronous endpoints and automatic OpenAPI documentation.

For the database layer, we use **SQLAlchemy 2.0 Async** paired with **PostgreSQL on Supabase**, with a local async SQLite fallback for testing and offline development.

All authentication is stateless: passwords are encrypted with **Argon2id**, and authenticated requests carry a signed **HS256 JSON Web Token**. 

Communication happens over clean REST APIs with structured RFC 7807 error responses. When an uninvited user tries to access a private document ID, our backend intentionally returns a `404 Not Found` rather than a 403, preventing any UUID enumeration attacks."

---

## 3:15 – 3:45 | AI-Native Workflow & Engineering Decisions

**[ACTION]**
Scroll down to the footer of the dashboard or editor, showing the clean, robust layout and word counter.

**[SPEAK]**
"Draftly was developed using an AI-native engineering workflow with Google Antigravity and Claude.

AI materially accelerated our velocity by scaffolding repetitive boilerplate, generating our 50-test Pytest suite, and implementing AST parsing for `.docx` and `.md` file imports.

However, human engineering judgment was essential throughout:
For instance, when AI initially suggested using server-side headless browsers to export PDFs, I rejected that approach because it would bloat container sizes by over 500 megabytes and crash free-tier memory limits. Instead, I engineered a clean client-side solution using print media stylesheets and native browser streaming that runs in milliseconds with zero server overhead.

Likewise, I implemented our automated pre-restore version snapshotting so that reverting a document never accidentally overwrites current work.

Every single endpoint and component was rigorously verified through 50 passing backend automated tests, full Playwright end-to-end browser journeys, and production type checking."

---

## 3:45 – 4:15 | Prioritization, Tradeoffs & Future Roadmap

**[ACTION]**
Return to the main Dashboard (`/dashboard`), showing the organized document cards, search bar, and clean atelier feel.

**[SPEAK]**
"During this development cycle, we intentionally prioritized rock-solid permission enforcement, dependable autosave persistence, and intuitive file ingestion over raw feature bloat.

In terms of tradeoffs, we chose robust REST-based autosave and snapshot versioning over simultaneous character-by-character live typing cursors with Operational Transformation, ensuring zero data loss and simple scaling.

If I had another two to four hours, my next priorities would be:
1. Adding WebSockets for live real-time typing synchronization.
2. Integrating transactional SMTP email invitations.
3. Enabling drag-and-drop inline image uploads within the editor."

---

## 4:15 – 4:30 | Conclusion

**[ACTION]**
Hover over the Draftly logo in the header and smile.

**[SPEAK]**
"To conclude: Draftly demonstrates a complete, production-grade document workspace that combines thoughtful design with rigorous engineering, security, and collaborative power.

Thank you very much for your time and review! I look forward to your feedback."
