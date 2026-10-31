import { test, expect } from "@playwright/test";

// Unique run timestamp to avoid email collisions
const timestamp = Date.now();
const userA = {
  email: `owner_${timestamp}@draftly.io`,
  username: `owner_${timestamp}`,
  password: "SecurePassword2026!",
};
const userB = {
  email: `editor_${timestamp}@draftly.io`,
  username: `editor_${timestamp}`,
  password: "SecurePassword2026!",
};
const userC = {
  email: `viewer_${timestamp}@draftly.io`,
  username: `viewer_${timestamp}`,
  password: "SecurePassword2026!",
};

let sharedDocUrl: string = "";

test.describe.serial("Draftly Quality Assurance - End-to-End User Journeys", () => {
  // Helper to register and log in a user
  async function registerAndLogin(page: any, user: typeof userA) {
    await page.goto("/register");
    await page.waitForLoadState("networkidle");
    await page.fill("#username", user.username);
    await page.fill("#email", user.email);
    await page.fill("#password", user.password);
    await page.fill("#passwordConfirm", user.password);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard upon successful registration & login
    await page.waitForURL("**/dashboard", { timeout: 20000 });
    await expect(page.locator("body")).toContainText(user.username);
  }

  test("Journey 1: User Registration & Authentication", async ({ page }) => {
    // 1. Register User A
    await registerAndLogin(page, userA);

    // 2. Verify dashboard displays active user workspace
    await expect(page.locator("body")).toContainText("Workspace Atelier");
    await expect(page.locator("body")).toContainText(userA.username);

    // 3. Register collaborator users for subsequent journeys
    const pageB = await page.context().newPage();
    await registerAndLogin(pageB, userB);
    await pageB.close();

    const pageC = await page.context().newPage();
    await registerAndLogin(pageC, userC);
    await pageC.close();
  });

  test("Journey 2: Document Creation & Live Tiptap Editing", async ({ page }) => {
    // Log in as User A
    await page.goto("/login");
    await page.fill('input[type="email"]', userA.email);
    await page.fill('input[type="password"]', userA.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 20000 });

    // Click "Create New Document" button
    await page.click('button:has-text("Create New Document")');
    await page.waitForSelector('input[placeholder="Untitled Document"]');

    // Enter custom document title
    const docTitle = `Strategic Product Blueprint ${timestamp}`;
    await page.fill('input[placeholder="Untitled Document"]', docTitle);
    await page.click('button:has-text("Create Document")');

    // Expect navigation to /documents/[id]
    await page.waitForURL("**/documents/*", { timeout: 20000 });
    sharedDocUrl = page.url();

    // Verify document header shows title
    await expect(page.locator("header h1")).toContainText(docTitle);

    // Type content into Tiptap editor canvas
    const editor = page.locator(".tiptap");
    await editor.click();
    await page.keyboard.type("Draftly delivers unparalleled productivity with role-based access control.");

    // Verify editor content was registered
    await expect(editor).toContainText("Draftly delivers unparalleled productivity");

    // Wait for autosave debouncing to execute
    await page.waitForTimeout(2000);
    await expect(page.locator("body")).toContainText("All Changes Saved");
  });

  test("Journey 3: Multi-format File Import (.md upload)", async ({ page }) => {
    // Log in as User A
    await page.goto("/login");
    await page.fill('input[type="email"]', userA.email);
    await page.fill('input[type="password"]', userA.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 20000 });

    // Open Import Modal
    await page.click('button:has-text("Import Document")');
    await page.waitForSelector("text=Click to browse or drop your file here");

    // Upload a simulated markdown document directly to file input
    const buffer = Buffer.from("# Executive Summary\n\nCloud infrastructure verified.", "utf-8");
    await page.locator('input[type="file"]').setInputFiles({
      name: "imported_architecture.md",
      mimeType: "text/markdown",
      buffer,
    });

    // Submit import
    await page.click('button:has-text("Import & Open in Atelier")');

    // Should navigate into the imported document atelier
    await page.waitForURL("**/documents/*", { timeout: 20000 });
    await expect(page.locator("header h1")).toContainText("imported_architecture");
    await expect(page.locator(".tiptap")).toContainText("Executive Summary");
  });

  test("Journey 4: Document Sharing & Collaborative Editing (Owner -> Editor)", async ({ browser }) => {
    // Context 1: User A (Owner) shares document with User B as Editor
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await pageA.goto("/login");
    await pageA.fill('input[type="email"]', userA.email);
    await pageA.fill('input[type="password"]', userA.password);
    await pageA.click('button[type="submit"]');
    await pageA.waitForURL("**/dashboard");

    // Navigate to the shared document
    await pageA.goto(sharedDocUrl);
    await pageA.waitForSelector('button:has-text("Share")');

    // Open Share Modal
    await pageA.click('button:has-text("Share")');
    await pageA.waitForSelector("text=Share Document");

    // Fill collaborator email and choose "Editor"
    await pageA.fill('input[placeholder="collaborator@example.com"]', userB.email);
    await pageA.selectOption("select", "editor");
    await pageA.click('button:has-text("Invite")');

    // Verify collaborator added in modal
    await expect(pageA.locator("body")).toContainText(userB.email);
    await pageA.click('button:has-text("Done")');
    await pageA.close();

    // Context 2: User B (Editor) opens document from "Shared With Me"
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.goto("/login");
    await pageB.fill('input[type="email"]', userB.email);
    await pageB.fill('input[type="password"]', userB.password);
    await pageB.click('button[type="submit"]');
    await pageB.waitForURL("**/dashboard");

    // Navigate to "Shared With Me" tab
    await pageB.click('button:has-text("Shared With Me")');
    await expect(pageB.locator("body")).toContainText("Editor");

    // Open document
    await pageB.goto(sharedDocUrl);
    await pageB.waitForSelector(".tiptap");

    // Verify User B sees "Editor Access" badge and can edit content
    await expect(pageB.locator("body")).toContainText("Editor Access");

    // Editor cannot see Share or Trash buttons
    await expect(pageB.locator('button:has-text("Share")')).toHaveCount(0);
    await expect(pageB.locator('button:has-text("Trash")')).toHaveCount(0);

    // Edit content as Editor
    const editor = pageB.locator(".tiptap");
    await editor.click();
    await pageB.keyboard.type(" Collaborator contribution added by Editor.");
    await pageB.waitForTimeout(2000);
    await expect(pageB.locator("body")).toContainText("All Changes Saved");

    await pageB.close();
  });

  test("Journey 5: Viewer Permissions (Owner -> Viewer read-only)", async ({ browser }) => {
    // Owner invites User C as Viewer
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await pageA.goto("/login");
    await pageA.fill('input[type="email"]', userA.email);
    await pageA.fill('input[type="password"]', userA.password);
    await pageA.click('button[type="submit"]');
    await pageA.waitForURL("**/dashboard");

    await pageA.goto(sharedDocUrl);
    await pageA.waitForSelector('button:has-text("Share")');
    await pageA.click('button:has-text("Share")');
    await pageA.waitForSelector("text=Share Document");

    await pageA.fill('input[placeholder="collaborator@example.com"]', userC.email);
    await pageA.selectOption("select", "viewer");
    await pageA.click('button:has-text("Invite")');
    await expect(pageA.locator("body")).toContainText(userC.email);
    await pageA.close();

    // User C opens document
    const contextC = await browser.newContext();
    const pageC = await contextC.newPage();
    await pageC.goto("/login");
    await pageC.fill('input[type="email"]', userC.email);
    await pageC.fill('input[type="password"]', userC.password);
    await pageC.click('button[type="submit"]');
    await pageC.waitForURL("**/dashboard");

    await pageC.goto(sharedDocUrl);
    await pageC.waitForSelector(".tiptap");

    // Verify Viewer Access UI indicators
    await expect(pageC.locator("body")).toContainText("Viewer (Read-only)");
    await expect(pageC.locator("body")).toContainText("Read-Only Atelier");

    // Toolbar and action buttons must be completely absent
    await expect(pageC.locator('button:has-text("Share")')).toHaveCount(0);
    await expect(pageC.locator('button:has-text("Trash")')).toHaveCount(0);

    // Tiptap editor canvas must be non-editable (contenteditable="false")
    const tiptapElem = pageC.locator(".tiptap");
    await expect(tiptapElem).toHaveAttribute("contenteditable", "false");

    await pageC.close();
  });

  test("Journey 6: Access Revocation Immediate Enforcement", async ({ browser }) => {
    // Owner revokes User B's access
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await pageA.goto("/login");
    await pageA.fill('input[type="email"]', userA.email);
    await pageA.fill('input[type="password"]', userA.password);
    await pageA.click('button[type="submit"]');
    await pageA.waitForURL("**/dashboard");

    await pageA.goto(sharedDocUrl);
    await pageA.waitForSelector('button:has-text("Share")');
    await pageA.click('button:has-text("Share")');
    await pageA.waitForSelector("text=Share Document");

    // Accept confirmation dialog automatically
    pageA.on("dialog", (dialog) => dialog.accept());

    // Wait for collaborator list to load
    await pageA.waitForSelector('button[title="Revoke collaborator access"]');

    // Click revoke button specifically for User B and confirm dialog
    const userBRow = pageA.locator("div.py-3", { hasText: userB.email });
    const revokeBtn = userBRow.locator('button[title="Revoke collaborator access"]');
    await revokeBtn.click();

    // Wait for revocation confirmation from backend
    await pageA.waitForSelector("text=Revoked access");
    await pageA.close();

    // User B attempts to access revoked document
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.goto("/login");
    await pageB.fill('input[type="email"]', userB.email);
    await pageB.fill('input[type="password"]', userB.password);
    await pageB.click('button[type="submit"]');
    await pageB.waitForURL("**/dashboard");

    // User B tries to open the document URL
    await pageB.goto(sharedDocUrl);
    await pageB.waitForSelector("text=Document Unavailable", { timeout: 10000 });

    // Verify access denied message
    await expect(pageB.locator("body")).toContainText("Document Unavailable");
    await expect(pageB.locator("body")).toContainText("Document not found");

    await pageB.close();
  });
});
