"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  apiDeleteDocument,
  apiGetDocumentById,
  apiUpdateDocument,
  DocumentItem,
} from "@/lib/config";
import DraftlyEditor, { SaveStatus } from "@/components/editor/DraftlyEditor";
import ShareModal from "@/components/editor/ShareModal";
import VersionHistoryDrawer from "@/components/editor/VersionHistoryDrawer";
import CommentsDrawer from "@/components/editor/CommentsDrawer";
import PresenceIndicators from "@/components/editor/PresenceIndicators";
import ExportMenu from "@/components/editor/ExportMenu";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Clock,
  Edit3,
  Eye,
  History,
  Loader2,
  MessageSquare,
  RotateCcw,
  ShieldCheck,
  Trash2,
  User,
  Users,
} from "lucide-react";

export default function DocumentDetailPage() {
  const params = useParams();
  const documentId = params?.id as string;
  const router = useRouter();
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();

  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // In-line title editing state
  const [isEditingTitle, setIsEditingTitle] = useState<boolean>(false);
  const [titleInput, setTitleInput] = useState<string>("");
  const [savingTitle, setSavingTitle] = useState<boolean>(false);

  // Editor telemetry & instance reference
  const [editorSaveStatus, setEditorSaveStatus] = useState<SaveStatus>("saved");
  const [editorInstance, setEditorInstance] = useState<any>(null);

  // Trash action state
  const [deleting, setDeleting] = useState<boolean>(false);

  // Drawers and Modals state
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState<boolean>(false);
  const [openCommentsCount, setOpenCommentsCount] = useState<number>(0);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!token || !documentId) return;
    loadDocument();
  }, [token, documentId]);

  const loadDocument = async () => {
    if (!token || !documentId) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const doc = await apiGetDocumentById(token, documentId);
      setDocument(doc);
      setTitleInput(doc.title);
    } catch (err: any) {
      setErrorMsg(
        err.message || "Document not found or you lack access permission."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTitle = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!token || !document || savingTitle) return;

    const newTitle = titleInput.trim() || "Untitled Document";
    if (newTitle === document.title) {
      setIsEditingTitle(false);
      return;
    }

    setSavingTitle(true);
    try {
      const updated = await apiUpdateDocument(token, document.id, {
        title: newTitle,
      });
      setDocument(updated);
      setTitleInput(updated.title);
      setIsEditingTitle(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update title.");
    } finally {
      setSavingTitle(false);
    }
  };

  const handleMoveToTrash = async () => {
    if (!token || !document || deleting) return;
    const confirmed = window.confirm(
      "Move this document to Trash? You can restore it anytime from the workspace Trash view."
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      await apiDeleteDocument(token, document.id, false);
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to move document to trash.");
      setDeleting(false);
    }
  };

  const handleRestoreFromTrash = async () => {
    if (!token || !document) return;
    try {
      const updated = await apiUpdateDocument(token, document.id, {
        is_deleted: false,
      });
      setDocument(updated);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to restore document.");
    }
  };

  const handleVersionRestored = (restoredDoc: DocumentItem) => {
    setDocument(restoredDoc);
    setTitleInput(restoredDoc.title);
    if (editorInstance && restoredDoc.content) {
      editorInstance.commands.setContent(restoredDoc.content);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  if (authLoading || (loading && !errorMsg)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-ink animate-spin mb-3" />
        <p className="text-sm font-bold text-ink-muted">
          Loading document workspace...
        </p>
      </div>
    );
  }

  if (errorMsg || !document) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-sm bg-coral-light border-2 border-ink-border text-coral mx-auto flex items-center justify-center shadow-retro">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold font-sans text-ink">
          Document Unavailable
        </h2>
        <p className="text-xs sm:text-sm text-ink-muted max-w-md mx-auto font-medium">
          {errorMsg || "This document does not exist or you do not have permission to view it."}
        </p>
        <div className="pt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-coral hover:bg-coral-hover text-white border-2 border-ink-border font-extrabold text-sm shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Workspace Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const userRole = document.user_role || "owner";
  const isOwner = userRole === "owner";
  const isEditor = userRole === "editor";
  const isViewer = userRole === "viewer";

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-paper">
      {/* Top Document Header Bar */}
      <header className="bg-paper-cream border-b-2 border-ink-border sticky top-16 z-30 px-4 sm:px-8 py-3 print:hidden">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Back & Editable Title */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="p-2 rounded-sm text-ink hover:bg-paper-light border-2 border-ink-border shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all shrink-0"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            {isOwner && isEditingTitle ? (
              <form
                onSubmit={handleSaveTitle}
                className="flex items-center gap-2 flex-1 max-w-md"
              >
                <input
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={() => handleSaveTitle()}
                  autoFocus
                  className="px-3 py-1.5 rounded-sm border-2 border-ink-border text-base font-extrabold text-ink bg-paper-light focus:outline-none focus:bg-white w-full"
                />
                <button
                  type="submit"
                  disabled={savingTitle}
                  className="p-2 rounded-sm bg-coral text-white border-2 border-ink-border shadow-retro hover:bg-coral-hover cursor-pointer"
                  title="Save title"
                >
                  {savingTitle ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 min-w-0 group">
                <h1
                  onClick={() => {
                    if (isOwner) setIsEditingTitle(true);
                  }}
                  className={`text-lg sm:text-xl font-extrabold text-ink truncate ${
                    isOwner ? "cursor-pointer hover:text-coral transition-colors" : ""
                  }`}
                  title={isOwner ? "Click to rename document" : "Document Title"}
                >
                  {document.title}
                </h1>
                {isOwner && (
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-ink-muted hover:text-ink transition-opacity cursor-pointer"
                    title="Rename document"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right: Collaboration, Drawers, Telemetry & Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 self-end sm:self-auto">
            {/* Live Presence Indicator */}
            {token && (
              <PresenceIndicators
                documentId={document.id}
                token={token}
                currentUserId={user?.id}
              />
            )}

            {/* RBAC Role Indicator for non-owners */}
            {isEditor && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-bold bg-retroGreen text-white border-2 border-ink-border shadow-retro">
                Editor
              </span>
            )}
            {isViewer && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-bold bg-paper-light text-ink border-2 border-ink-border shadow-retro">
                <Eye className="w-3.5 h-3.5 text-coral" />
                <span>Viewer</span>
              </span>
            )}

            {document.is_deleted ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-sm bg-coral text-white border-2 border-ink-border shadow-retro">
                  In Trash
                </span>
                {isOwner && (
                  <button
                    onClick={handleRestoreFromTrash}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-paper-light hover:bg-paper-cream text-ink text-xs font-bold border-2 border-ink-border shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-retroGreen" />
                    <span>Restore</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Export Dropdown Menu */}
                <ExportMenu
                  title={document.title}
                  getContentJson={() => editorInstance?.getJSON() || document.content}
                  getTextContent={() => editorInstance?.getText() || ""}
                />

                {/* Comments Drawer Button */}
                <button
                  onClick={() => setIsCommentsOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-paper-light hover:bg-paper-cream text-ink text-xs font-bold border-2 border-ink-border shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                  title="Discussion and comments thread"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-coral" />
                  <span>Comments</span>
                  {openCommentsCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-xs bg-coral text-white text-[10px] font-extrabold">
                      {openCommentsCount}
                    </span>
                  )}
                </button>

                {/* Version History Drawer Button */}
                <button
                  onClick={() => setIsHistoryOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-paper-light hover:bg-paper-cream text-ink text-xs font-bold border-2 border-ink-border shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                  title="Document revision snapshots and restore"
                >
                  <History className="w-3.5 h-3.5 text-ink-muted" />
                  <span>History</span>
                </button>

                {/* Owner Actions: Share & Trash */}
                {isOwner && (
                  <>
                    <button
                      onClick={() => setIsShareModalOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-coral hover:bg-coral-hover text-white text-xs font-extrabold border-2 border-ink-border shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition cursor-pointer"
                      title="Share document and manage collaborators"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>

                    <button
                      onClick={handleMoveToTrash}
                      disabled={deleting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm border-2 border-ink-border text-xs font-bold text-ink bg-paper-light hover:bg-coral-light hover:text-coral shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-colors cursor-pointer"
                      title="Move document to trash"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Trash</span>
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Writing Canvas */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Document Metadata Bar */}
        <div className="bg-paper-light rounded-sm p-3.5 border-2 border-ink-border mb-6 flex flex-wrap items-center justify-between gap-4 text-xs font-bold text-ink-muted shadow-retro print:hidden">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-coral" />
              <span>Role: <strong className="text-ink capitalize">{userRole}</strong></span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-ink-muted" />
              <span>Created {formatDate(document.created_at)}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-ink-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-retroGreen" />
            <span>Draftly Atelier • Role-Based Access Control</span>
          </div>
        </div>

        {/* Live Tiptap Rich-Text Editor */}
        {token && (
          <DraftlyEditor
            documentId={document.id}
            initialContent={document.content}
            token={token}
            readOnly={isViewer}
            onStatusChange={setEditorSaveStatus}
            onEditorReady={setEditorInstance}
          />
        )}
      </main>

      {/* Share & Permissions Modal (Owner Only) */}
      {isOwner && token && (
        <ShareModal
          documentId={document.id}
          token={token}
          document={document}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onDocumentUpdate={(updated) => setDocument(updated)}
        />
      )}

      {/* Version History Drawer */}
      {token && (
        <VersionHistoryDrawer
          documentId={document.id}
          token={token}
          isOpen={isHistoryOpen}
          canRestore={isOwner || isEditor}
          onClose={() => setIsHistoryOpen(false)}
          onRestore={handleVersionRestored}
        />
      )}

      {/* Comments Drawer */}
      {token && (
        <CommentsDrawer
          documentId={document.id}
          token={token}
          currentUserEmail={user?.email}
          isOwnerOrEditor={isOwner || isEditor}
          isOpen={isCommentsOpen}
          onClose={() => setIsCommentsOpen(false)}
          onCommentCountChange={setOpenCommentsCount}
        />
      )}
    </div>
  );
}
