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
import {
  AlertCircle,
  ArrowLeft,
  Check,
  Clock,
  Database,
  Edit3,
  FileText,
  Loader2,
  Lock,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  User,
  X,
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

  // Trash action state
  const [deleting, setDeleting] = useState<boolean>(false);

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

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "Recently";
    }
  };

  if (authLoading || (loading && !errorMsg)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-forest animate-spin mb-3" />
        <p className="text-sm font-medium text-forest/70">
          Loading document atelier...
        </p>
      </div>
    );
  }

  if (errorMsg || !document) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 mx-auto flex items-center justify-center">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-forest">
          Document Unavailable
        </h2>
        <p className="text-sm text-forest/70 max-w-md mx-auto">
          {errorMsg || "This document does not exist or you do not have permission to view it."}
        </p>
        <div className="pt-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-dark text-white text-sm font-semibold transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Workspace Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-ivory">
      {/* Top Document Header Bar */}
      <header className="bg-white border-b border-warmStone/70 sticky top-16 z-30 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Left: Back & Title Edit */}
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl text-forest/60 hover:text-forest hover:bg-ivory border border-warmStone/60 transition-colors shrink-0"
              title="Return to Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>

            {isEditingTitle ? (
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
                  className="px-3 py-1.5 rounded-lg border border-forest text-base font-serif font-bold text-forest bg-ivory focus:outline-none w-full"
                />
                <button
                  type="submit"
                  disabled={savingTitle}
                  className="p-2 rounded-lg bg-forest text-white hover:bg-forest-dark"
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
                  onClick={() => setIsEditingTitle(true)}
                  className="text-lg sm:text-xl font-serif font-bold text-forest truncate cursor-pointer hover:text-terracotta transition-colors"
                  title="Click to rename document"
                >
                  {document.title}
                </h1>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-forest/40 hover:text-forest transition-opacity"
                  title="Rename document"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Right: Telemetry & Actions */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {document.is_deleted ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-terracotta/20 text-terracotta-dark font-semibold">
                  In Trash
                </span>
                <button
                  onClick={handleRestoreFromTrash}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-forest hover:bg-forest-dark text-white text-xs font-semibold transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore</span>
                </button>
              </div>
            ) : (
              <>
                <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sage/20 text-sage-dark text-xs font-mono font-medium">
                  <Check className="w-3.5 h-3.5" />
                  <span>Metadata Saved</span>
                </div>

                <button
                  onClick={handleMoveToTrash}
                  disabled={deleting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-warmStone text-xs font-medium text-forest/70 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                  title="Move document to trash"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Trash</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Preview Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Document Metadata Bar */}
        <div className="bg-white rounded-2xl p-4 border border-warmStone/70 mb-8 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-forest/70 shadow-xs">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-sage-dark" />
              <span>Owner: <strong className="text-forest">{user?.username}</strong></span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-forest/50" />
              <span>Last Modified: {formatDate(document.updated_at)}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-forest/50">
            <ShieldCheck className="w-3.5 h-3.5 text-sage-dark" />
            <span>Isolated Cloud Record: {document.id.slice(0, 8)}...</span>
          </div>
        </div>

        {/* Focused 760px Editorial Canvas Atelier */}
        <div className="max-w-[760px] mx-auto bg-white rounded-3xl p-8 sm:p-14 border border-warmStone shadow-sm space-y-8 min-h-[550px]">
          {/* Document Title Header */}
          <div className="border-b border-warmStone/60 pb-6">
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-forest leading-tight">
              {document.title}
            </h1>
            <p className="text-xs text-forest/40 font-mono mt-2">
              Created {formatDate(document.created_at)}
            </p>
          </div>

          {/* Phase 4 Editor Teaser / Placeholder Card */}
          <div className="p-6 rounded-2xl bg-ivory border border-sage/40 space-y-4">
            <div className="flex items-center gap-2.5 text-sage-dark">
              <Sparkles className="w-5 h-5 text-terracotta" />
              <h3 className="font-serif font-bold text-forest text-base">
                Draftly Editorial Atelier — Phase 4 Rich-Text Canvas
              </h3>
            </div>

            <p className="text-sm text-forest/80 font-light leading-relaxed">
              This document has been securely instantiated in your workspace database. The rich-text editing engine (built with Tiptap, headless Markdown shortcuts, clean typography, and 1000ms debounced autosave) is scheduled for implementation in <strong>Phase 4: Document Editor</strong>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-mono text-forest/70">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-warmStone/60">
                <Check className="w-4 h-4 text-sage-dark shrink-0" />
                <span>Phase 3: Database Model & Metadata Active</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-warmStone/60">
                <Check className="w-4 h-4 text-sage-dark shrink-0" />
                <span>Phase 3: Soft-Delete & Rename Active</span>
              </div>
            </div>
          </div>

          {/* Structured Document Content Dump / Preview */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-forest/50">
              <span>Structured Content Payload</span>
              <span>JSON Schema v1</span>
            </div>
            <pre className="p-4 rounded-xl bg-forest-dark text-warmStone-light font-mono text-xs overflow-x-auto leading-relaxed">
              {JSON.stringify(document.content, null, 2)}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
