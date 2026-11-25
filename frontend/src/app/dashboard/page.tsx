"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  apiCreateDocument,
  apiDeleteDocument,
  apiGetDocuments,
  apiGetSharedWithMe,
  apiGetSharedByMe,
  apiUpdateDocument,
  apiUpdateShareRole,
  apiRevokeShare,
  DocumentItem,
  SharedWithMeItem,
  SharedByMeItem,
} from "@/lib/config";
import {
  AlertCircle,
  ArrowUpDown,
  Clock,
  Edit2,
  ExternalLink,
  Eye,
  FileText,
  Folder,
  LayoutGrid,
  List as ListIcon,
  Loader2,
  MoreVertical,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Share2,
  Sparkles,
  Star,
  Trash2,
  UploadCloud,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import ImportModal from "@/components/dashboard/ImportModal";
import ShareModal from "@/components/editor/ShareModal";

type TabView = "my-docs" | "overview" | "shared" | "starred" | "trash" | "settings";
type SortOption = "updated_desc" | "updated_asc" | "title_asc" | "title_desc";

export default function DashboardPage() {
  const { user, token, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // Navigation & View state
  const [activeTab, setActiveTab] = useState<TabView>("my-docs");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Document list & telemetry state
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeCount, setActiveCount] = useState<number>(0);
  const [trashCount, setTrashCount] = useState<number>(0);

  // Shared documents state
  const [sharedSubTab, setSharedSubTab] = useState<"with-me" | "by-me">("with-me");
  const [sharedDocuments, setSharedDocuments] = useState<SharedWithMeItem[]>([]);
  const [sharedByMeDocuments, setSharedByMeDocuments] = useState<SharedByMeItem[]>([]);
  const [loadingShared, setLoadingShared] = useState<boolean>(false);
  const [loadingSharedByMe, setLoadingSharedByMe] = useState<boolean>(false);
  const [sharedCount, setSharedCount] = useState<number>(0);
  const [modifyingCollabKey, setModifyingCollabKey] = useState<string | null>(null);
  const [shareFeedbackMsg, setShareFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [shareModalDocId, setShareModalDocId] = useState<string | null>(null);

  // Search & Sorting state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("updated_desc");

  // Creation Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newDocTitle, setNewDocTitle] = useState<string>("");
  const [creatingDoc, setCreatingDoc] = useState<boolean>(false);

  // Import Modal state
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);

  // Rename Modal state
  const [renamingDoc, setRenamingDoc] = useState<DocumentItem | null>(null);
  const [renameTitle, setRenameTitle] = useState<string>("");
  const [isRenaming, setIsRenaming] = useState<boolean>(false);

  // Active Dropdown state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Redirect unauthenticated visitors
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch documents when tab, search, or sort changes
  useEffect(() => {
    if (!token || !isAuthenticated) return;
    if (activeTab === "shared") {
      loadSharedDocuments();
      loadSharedByMe();
    } else {
      loadDocuments();
      loadSharedDocuments();
    }
  }, [token, isAuthenticated, activeTab, sortBy]);

  const loadSharedDocuments = async () => {
    if (!token) return;
    setLoadingShared(true);
    try {
      const data = await apiGetSharedWithMe(token);
      setSharedDocuments(data.items);
      setSharedCount(data.total);
    } catch (err: any) {
      console.error("Failed to load shared documents:", err);
    } finally {
      setLoadingShared(false);
    }
  };

  const loadSharedByMe = async () => {
    if (!token) return;
    setLoadingSharedByMe(true);
    try {
      const data = await apiGetSharedByMe(token);
      setSharedByMeDocuments(data.items);
    } catch (err: any) {
      console.error("Failed to load documents shared by me:", err);
    } finally {
      setLoadingSharedByMe(false);
    }
  };

  const handleUpdateCollaboratorRole = async (
    docId: string,
    collaboratorUserId: string,
    newRole: "editor" | "viewer"
  ) => {
    if (!token) return;
    const key = `${docId}_${collaboratorUserId}`;
    setModifyingCollabKey(key);
    setShareFeedbackMsg(null);
    try {
      await apiUpdateShareRole(token, docId, collaboratorUserId, newRole);
      setSharedByMeDocuments((prev) =>
        prev.map((doc) => {
          if (doc.id !== docId) return doc;
          return {
            ...doc,
            collaborators: doc.collaborators.map((c) =>
              c.user_id === collaboratorUserId ? { ...c, role: newRole } : c
            ),
          };
        })
      );
      setShareFeedbackMsg({
        type: "success",
        text: `Collaborator access updated to ${newRole}.`,
      });
      setTimeout(() => setShareFeedbackMsg(null), 3500);
    } catch (err: any) {
      setShareFeedbackMsg({
        type: "error",
        text: err?.message || "Failed to update collaborator role.",
      });
    } finally {
      setModifyingCollabKey(null);
    }
  };

  const handleRevokeCollaborator = async (
    docId: string,
    collaboratorUserId: string
  ) => {
    if (!token) return;
    if (!window.confirm("Are you sure you want to revoke this collaborator's access?")) return;
    const key = `${docId}_${collaboratorUserId}`;
    setModifyingCollabKey(key);
    setShareFeedbackMsg(null);
    try {
      await apiRevokeShare(token, docId, collaboratorUserId);
      setSharedByMeDocuments((prev) =>
        prev
          .map((doc) => {
            if (doc.id !== docId) return doc;
            const updatedCollabs = doc.collaborators.filter(
              (c) => c.user_id !== collaboratorUserId
            );
            return {
              ...doc,
              collaborators: updatedCollabs,
              total_collaborators: updatedCollabs.length,
            };
          })
          .filter((doc) => doc.total_collaborators > 0)
      );
      setShareFeedbackMsg({
        type: "success",
        text: "Collaborator access revoked successfully.",
      });
      setTimeout(() => setShareFeedbackMsg(null), 3500);
    } catch (err: any) {
      setShareFeedbackMsg({
        type: "error",
        text: err?.message || "Failed to revoke collaborator access.",
      });
    } finally {
      setModifyingCollabKey(null);
    }
  };

  const loadDocuments = async (overrideSearch?: string) => {
    if (!token) return;
    setLoadingDocs(true);
    setErrorMsg(null);

    const term = overrideSearch !== undefined ? overrideSearch : searchQuery;
    const isTrashView = activeTab === "trash";

    let sort_by: "updated_at" | "title" | "created_at" = "updated_at";
    let sort_order: "asc" | "desc" = "desc";

    if (sortBy === "updated_desc") {
      sort_by = "updated_at";
      sort_order = "desc";
    } else if (sortBy === "updated_asc") {
      sort_by = "updated_at";
      sort_order = "asc";
    } else if (sortBy === "title_asc") {
      sort_by = "title";
      sort_order = "asc";
    } else if (sortBy === "title_desc") {
      sort_by = "title";
      sort_order = "desc";
    }

    try {
      const data = await apiGetDocuments(token, {
        search: term || undefined,
        is_deleted: isTrashView,
        sort_by,
        sort_order,
      });

      setDocuments(data.items);
      setActiveCount(data.active_count);
      setTrashCount(data.trash_count);
    } catch (err: any) {
      setErrorMsg(err.message || "Unable to load documents from server.");
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDocuments();
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    loadDocuments("");
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setCreatingDoc(true);
    try {
      const doc = await apiCreateDocument(token, {
        title: newDocTitle.trim() || "Untitled Document",
      });

      setIsCreateModalOpen(false);
      setNewDocTitle("");
      router.push(`/documents/${doc.id}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create document.");
    } finally {
      setCreatingDoc(false);
    }
  };

  const handleRenameDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !renamingDoc) return;

    setIsRenaming(true);
    try {
      const updated = await apiUpdateDocument(token, renamingDoc.id, {
        title: renameTitle.trim() || "Untitled Document",
      });

      setDocuments((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d))
      );
      setRenamingDoc(null);
      setRenameTitle("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to rename document.");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleMoveToTrash = async (docId: string) => {
    if (!token) return;
    setOpenMenuId(null);
    try {
      await apiDeleteDocument(token, docId, false);
      loadDocuments();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to move document to trash.");
    }
  };

  const handleRestoreFromTrash = async (docId: string) => {
    if (!token) return;
    try {
      await apiUpdateDocument(token, docId, { is_deleted: false });
      loadDocuments();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to restore document.");
    }
  };

  const handlePermanentDelete = async (docId: string) => {
    if (!token) return;
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this document? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      await apiDeleteDocument(token, docId, true);
      loadDocuments();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to permanently delete document.");
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

  if (authLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-ink animate-spin mb-3" />
        <p className="text-sm font-sans text-ink-muted font-bold">
          Loading workspace...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Top Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-8 border-b-2 border-ink-border">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm bg-paper-light border-2 border-ink-border text-ink text-[11px] font-extrabold uppercase tracking-wider mb-2 shadow-retro">
            <Sparkles className="w-3.5 h-3.5 text-coral" />
            <span>Workspace Atelier</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-sans text-ink tracking-tight">
            Welcome back, {user.username}
          </h1>
          <p className="text-xs sm:text-sm text-ink-muted font-medium mt-1">
            Your calm, focused workspace for drafting, organizing, and collaborating.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-sm bg-paper-light hover:bg-paper-cream text-ink border-2 border-ink-border text-xs font-bold transition-all shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
            title="Import .txt, .md, or .docx file"
          >
            <UploadCloud className="w-4 h-4 text-retroBlue" />
            <span>Import Document</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-coral hover:bg-coral-hover text-white border-2 border-ink-border text-xs font-extrabold transition-all shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Document</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Editorial Navigation Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-paper-light border-2 border-ink-border rounded-sm p-4 shadow-retro-md">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-ink pb-2 mb-3 border-b-2 border-ink-border flex items-center justify-between">
              <span>Workspace Views</span>
              <span className="w-2 h-2 rounded-full bg-coral border border-ink-border" />
            </div>

            <nav className="space-y-1.5">
              {/* My Documents */}
              <button
                onClick={() => {
                  setActiveTab("my-docs");
                  setSearchQuery("");
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-sm text-xs font-bold border-2 transition-all ${
                  activeTab === "my-docs"
                    ? "bg-ink text-white border-ink-border shadow-retro"
                    : "bg-paper-light text-ink border-transparent hover:border-ink-border hover:bg-paper-cream"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  <span>My Documents</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border ${
                    activeTab === "my-docs"
                      ? "bg-coral text-white border-white"
                      : "bg-paper-cream text-ink border-ink-border"
                  }`}
                >
                  {activeCount}
                </span>
              </button>

              {/* Overview Tab */}
              <button
                onClick={() => setActiveTab("overview")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-sm text-xs font-bold border-2 transition-all ${
                  activeTab === "overview"
                    ? "bg-ink text-white border-ink-border shadow-retro"
                    : "bg-paper-light text-ink border-transparent hover:border-ink-border hover:bg-paper-cream"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>Overview</span>
                </div>
              </button>

              {/* Shared With Me */}
              <button
                onClick={() => setActiveTab("shared")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-sm text-xs font-bold border-2 transition-all ${
                  activeTab === "shared"
                    ? "bg-ink text-white border-ink-border shadow-retro"
                    : "bg-paper-light text-ink border-transparent hover:border-ink-border hover:bg-paper-cream"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  <span>Shared With Me</span>
                </div>
                {sharedCount > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border ${
                      activeTab === "shared"
                        ? "bg-coral text-white border-white"
                        : "bg-retroBlue text-white border-ink-border"
                    }`}
                  >
                    {sharedCount}
                  </span>
                )}
              </button>

              {/* Starred */}
              <button
                onClick={() => setActiveTab("starred")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-sm text-xs font-bold border-2 transition-all ${
                  activeTab === "starred"
                    ? "bg-ink text-white border-ink-border shadow-retro"
                    : "bg-paper-light text-ink border-transparent hover:border-ink-border hover:bg-paper-cream"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  <span>Starred</span>
                </div>
              </button>

              {/* Trash */}
              <button
                onClick={() => {
                  setActiveTab("trash");
                  setSearchQuery("");
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-sm text-xs font-bold border-2 transition-all ${
                  activeTab === "trash"
                    ? "bg-ink text-white border-ink-border shadow-retro"
                    : "bg-paper-light text-ink border-transparent hover:border-ink-border hover:bg-paper-cream"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  <span>Trash</span>
                </div>
                {trashCount > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm border ${
                      activeTab === "trash"
                        ? "bg-coral text-white border-white"
                        : "bg-coral text-white border-ink-border"
                    }`}
                  >
                    {trashCount}
                  </span>
                )}
              </button>

              {/* Settings */}
              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-sm text-xs font-bold border-2 transition-all ${
                  activeTab === "settings"
                    ? "bg-ink text-white border-ink-border shadow-retro"
                    : "bg-paper-light text-ink border-transparent hover:border-ink-border hover:bg-paper-cream"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </div>
              </button>
            </nav>
          </div>

          {/* User Profile Summary Card */}
          <div className="bg-paper-light border-2 border-ink-border rounded-sm p-4 text-xs shadow-retro-md space-y-2.5">
            <div className="flex items-center gap-2 text-ink font-bold uppercase text-[11px] pb-2 border-b border-ink-border/40">
              <User className="w-3.5 h-3.5 text-coral" />
              <span>Workspace Session</span>
            </div>
            <p className="text-ink-soft leading-relaxed text-xs">
              Logged in as <strong className="text-ink">{user.username}</strong>
            </p>
            <p className="text-[11px] text-ink-muted truncate font-mono">
              {user.email}
            </p>
            <div className="pt-2 border-t border-ink-border/40 flex items-center justify-between text-[11px] text-ink font-bold">
              <span>Active Documents:</span>
              <span className="border border-ink-border bg-paper-cream px-2 py-0.5 rounded-sm">{activeCount}</span>
            </div>
          </div>
        </aside>

        {/* Right Main Content Area */}
        <main className="lg:col-span-9 space-y-6">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 rounded-sm bg-coral-light border-2 border-ink-border text-ink text-xs sm:text-sm font-semibold flex items-start gap-3 shadow-retro">
              <AlertCircle className="w-5 h-5 text-coral shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-extrabold">Notice: </span>
                {errorMsg}
              </div>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-ink hover:text-coral"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-paper-light p-5 rounded-sm border-2 border-ink-border shadow-retro-md">
                  <span className="text-xs font-bold uppercase text-ink-muted">
                    Total Active Documents
                  </span>
                  <div className="text-3xl font-extrabold font-sans text-ink mt-1">
                    {activeCount}
                  </div>
                  <p className="text-xs text-ink-muted mt-1 font-medium">
                    Owned and accessible in workspace
                  </p>
                </div>

                <div className="bg-paper-light p-5 rounded-sm border-2 border-ink-border shadow-retro-md">
                  <span className="text-xs font-bold uppercase text-ink-muted">
                    Trash Archive
                  </span>
                  <div className="text-3xl font-extrabold font-sans text-coral mt-1">
                    {trashCount}
                  </div>
                  <p className="text-xs text-ink-muted mt-1 font-medium">
                    Preserved for recovery or purge
                  </p>
                </div>

                <div className="bg-paper-light p-5 rounded-sm border-2 border-ink-border shadow-retro-md">
                  <span className="text-xs font-bold uppercase text-ink-muted">
                    Shared Documents
                  </span>
                  <div className="text-3xl font-extrabold font-sans text-retroBlue mt-1">
                    {sharedCount}
                  </div>
                  <p className="text-xs text-ink-muted mt-1 font-medium">
                    Collaborating with teammates
                  </p>
                </div>
              </div>

              <div className="bg-paper-light p-6 rounded-sm border-2 border-ink-border shadow-retro-md space-y-4">
                <h3 className="font-extrabold text-ink text-lg">
                  Recent Document Activity
                </h3>
                {documents.length === 0 ? (
                  <p className="text-xs sm:text-sm text-ink-muted font-medium">
                    No documents created yet. Click "Create New Document" to begin drafting.
                  </p>
                ) : (
                  <div className="divide-y-2 divide-ink-border/20">
                    {documents.slice(0, 5).map((doc) => (
                      <div
                        key={doc.id}
                        className="py-3 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-sm bg-coral border-2 border-ink-border flex items-center justify-center text-white shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/documents/${doc.id}`}
                              className="font-bold text-ink hover:text-coral transition-colors text-sm truncate block"
                            >
                              {doc.title}
                            </Link>
                            <p className="text-xs text-ink-muted">
                              Modified {formatDate(doc.updated_at)}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/documents/${doc.id}`}
                          className="px-3 py-1 rounded-sm bg-coral hover:bg-coral-hover text-white border-2 border-ink-border font-bold text-xs shadow-retro flex items-center gap-1 shrink-0"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Shared Section (Shared With Me & Shared Docs) */}
          {activeTab === "shared" && (
            <div className="space-y-6">
              <div className="bg-paper-light rounded-sm border-2 border-ink-border p-6 shadow-retro-md">
                {/* Header & Sub-Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-ink-border">
                  <div>
                    <h3 className="text-xl font-extrabold text-ink">
                      Document Collaboration
                    </h3>
                    <p className="text-xs text-ink-muted mt-0.5 font-medium">
                      Manage incoming and outgoing document shares and access permissions
                    </p>
                  </div>

                  {/* Sub-Tabs: Shared With Me & Shared Docs */}
                  <div className="flex items-center gap-2 bg-paper-cream p-1 rounded-sm border-2 border-ink-border self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setSharedSubTab("with-me")}
                      className={`px-3 py-1.5 rounded-xs text-xs font-extrabold transition-all cursor-pointer ${
                        sharedSubTab === "with-me"
                          ? "bg-coral text-white shadow-retro"
                          : "text-ink hover:text-coral"
                      }`}
                    >
                      Shared With Me ({sharedDocuments.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSharedSubTab("by-me");
                        loadSharedByMe();
                      }}
                      className={`px-3 py-1.5 rounded-xs text-xs font-extrabold transition-all cursor-pointer ${
                        sharedSubTab === "by-me"
                          ? "bg-coral text-white shadow-retro"
                          : "text-ink hover:text-coral"
                      }`}
                    >
                      Shared Docs ({sharedByMeDocuments.length})
                    </button>
                  </div>
                </div>

                {/* Feedback Notification */}
                {shareFeedbackMsg && (
                  <div
                    className={`mt-4 p-3 rounded-sm border-2 border-ink-border text-xs font-bold flex items-center justify-between shadow-retro ${
                      shareFeedbackMsg.type === "success"
                        ? "bg-retroGreen/20 text-ink"
                        : "bg-coral-light text-ink"
                    }`}
                  >
                    <span>{shareFeedbackMsg.text}</span>
                    <button
                      onClick={() => setShareFeedbackMsg(null)}
                      className="text-ink hover:opacity-75 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* VIEW 1: Shared With Me */}
                {sharedSubTab === "with-me" && (
                  loadingShared ? (
                    <div className="py-16 text-center">
                      <Loader2 className="w-8 h-8 text-ink animate-spin mx-auto mb-3" />
                      <p className="text-xs font-bold text-ink-muted">
                        Loading shared workspace documents...
                      </p>
                    </div>
                  ) : sharedDocuments.length === 0 ? (
                    <div className="py-16 text-center space-y-3">
                      <div className="w-12 h-12 rounded-sm bg-paper-cream border-2 border-ink-border text-ink mx-auto flex items-center justify-center shadow-retro">
                        <Users className="w-6 h-6 text-coral" />
                      </div>
                      <div className="max-w-md mx-auto space-y-1">
                        <h4 className="text-base font-bold text-ink">
                          No Documents Shared With You Yet
                        </h4>
                        <p className="text-xs text-ink-muted font-medium leading-relaxed">
                          When a teammate invites your email to collaborate on a document as an Editor or Viewer, it will appear here.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-6">
                      {sharedDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="bg-paper-light rounded-sm border-2 border-ink-border p-5 flex flex-col justify-between shadow-retro hover:shadow-retro-md transition-all"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="w-8 h-8 rounded-sm bg-paper-cream border-2 border-ink-border flex items-center justify-center text-ink shadow-[1px_1px_0px_#171717]">
                                <FileText className="w-4 h-4 text-ink" />
                              </div>
                              {doc.role === "editor" ? (
                                <span className="px-2.5 py-0.5 rounded-sm text-[11px] font-bold bg-coral text-white border border-ink-border">
                                  Editor
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-sm text-[11px] font-bold bg-retroGreen text-white border border-ink-border flex items-center gap-1">
                                  <Eye className="w-3 h-3" />
                                  <span>Viewer</span>
                                </span>
                              )}
                            </div>

                            <div>
                              <Link
                                href={`/documents/${doc.id}`}
                                className="text-base font-bold text-ink hover:text-coral line-clamp-1 transition-colors"
                              >
                                {doc.title || "Untitled Document"}
                              </Link>
                              <p className="text-xs text-ink-muted mt-1 flex items-center gap-1.5 font-medium">
                                <User className="w-3.5 h-3.5 text-coral shrink-0" />
                                <span className="truncate">
                                  Shared by <strong className="text-ink">{doc.owner_username}</strong>
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 pt-3.5 border-t-2 border-ink-border/20 flex items-center justify-between text-xs font-semibold text-ink-muted">
                            <span>{formatDate(doc.shared_at)}</span>
                            <Link
                              href={`/documents/${doc.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm bg-coral hover:bg-coral-hover text-white text-xs font-bold border-2 border-ink-border shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                            >
                              <span>Open</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* VIEW 2: Shared Docs (Shared with others) */}
                {sharedSubTab === "by-me" && (
                  loadingSharedByMe ? (
                    <div className="py-16 text-center">
                      <Loader2 className="w-8 h-8 text-ink animate-spin mx-auto mb-3" />
                      <p className="text-xs font-bold text-ink-muted">
                        Loading documents you have shared...
                      </p>
                    </div>
                  ) : sharedByMeDocuments.length === 0 ? (
                    <div className="py-16 text-center space-y-4">
                      <div className="w-12 h-12 rounded-sm bg-paper-cream border-2 border-ink-border text-ink mx-auto flex items-center justify-center shadow-retro">
                        <Share2 className="w-6 h-6 text-coral" />
                      </div>
                      <div className="max-w-md mx-auto space-y-1">
                        <h4 className="text-base font-bold text-ink">
                          No Documents Shared With Others Yet
                        </h4>
                        <p className="text-xs text-ink-muted font-medium leading-relaxed">
                          You haven&apos;t shared any of your documents with other users yet. You can share documents from the &quot;All Documents&quot; view or inside any document.
                        </p>
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => setActiveTab("my-docs")}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-coral hover:bg-coral-hover text-white text-xs font-bold border-2 border-ink-border shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                        >
                          <span>Go to All Documents</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6 pt-6">
                      {sharedByMeDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="bg-paper-light rounded-sm border-2 border-ink-border p-5 shadow-retro hover:shadow-retro-md transition-all"
                        >
                          {/* Document Top Bar */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-ink-border/30">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-sm bg-paper-cream border-2 border-ink-border flex items-center justify-center text-ink shadow-[1px_1px_0px_#171717]">
                                <FileText className="w-4 h-4 text-coral" />
                              </div>
                              <div>
                                <Link
                                  href={`/documents/${doc.id}`}
                                  className="text-base font-bold text-ink hover:text-coral transition-colors"
                                >
                                  {doc.title || "Untitled Document"}
                                </Link>
                                <p className="text-[11px] text-ink-muted">
                                  Updated {formatDate(doc.updated_at)} • {doc.total_collaborators} active collaborator{doc.total_collaborators === 1 ? "" : "s"}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => setShareModalDocId(doc.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-paper-light hover:bg-paper-cream text-ink text-xs font-bold border-2 border-ink-border shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                              >
                                <UserPlus className="w-3.5 h-3.5 text-coral" />
                                <span>Add User</span>
                              </button>
                              <Link
                                href={`/documents/${doc.id}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-sm bg-coral hover:bg-coral-hover text-white text-xs font-bold border-2 border-ink-border shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                              >
                                <span>Open</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>

                          {/* Collaborators List & Role Access Controls */}
                          <div className="mt-4 space-y-2.5">
                            <p className="text-[11px] font-extrabold uppercase tracking-wider text-ink-muted">
                              Collaborator Permissions:
                            </p>
                            <div className="grid grid-cols-1 gap-2.5">
                              {doc.collaborators.map((collab) => {
                                const isUpdating = modifyingCollabKey === `${doc.id}_${collab.user_id}`;
                                return (
                                  <div
                                    key={collab.id}
                                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-paper-cream/50 rounded-sm border-2 border-ink-border"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="w-7 h-7 rounded-full bg-coral text-white border border-ink-border flex items-center justify-center text-xs font-bold shrink-0">
                                        {collab.username.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-bold text-ink truncate">
                                            {collab.username}
                                          </span>
                                          <span className="text-[11px] text-ink-muted truncate">
                                            ({collab.email})
                                          </span>
                                        </div>
                                        <span className="text-[10px] text-ink-muted">
                                          Shared on {formatDate(collab.shared_at)}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Access Role Modifier Controls (View or Edit) */}
                                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                                      {isUpdating ? (
                                        <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-ink">
                                          <Loader2 className="w-3.5 h-3.5 animate-spin text-coral" />
                                          <span>Updating...</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1 bg-paper-light border-2 border-ink-border rounded-sm p-0.5">
                                          <button
                                            type="button"
                                            title="Set read-only viewer access"
                                            onClick={() =>
                                              handleUpdateCollaboratorRole(doc.id, collab.user_id, "viewer")
                                            }
                                            className={`px-2.5 py-1 text-[11px] font-extrabold rounded-xs transition-all cursor-pointer ${
                                              collab.role === "viewer"
                                                ? "bg-retroGreen text-white shadow-[1px_1px_0px_#171717]"
                                                : "text-ink hover:text-coral"
                                            }`}
                                          >
                                            Viewer
                                          </button>
                                          <button
                                            type="button"
                                            title="Set editable access"
                                            onClick={() =>
                                              handleUpdateCollaboratorRole(doc.id, collab.user_id, "editor")
                                            }
                                            className={`px-2.5 py-1 text-[11px] font-extrabold rounded-xs transition-all cursor-pointer ${
                                              collab.role === "editor"
                                                ? "bg-coral text-white shadow-[1px_1px_0px_#171717]"
                                                : "text-ink hover:text-coral"
                                            }`}
                                          >
                                            Editor
                                          </button>
                                        </div>
                                      )}

                                      <button
                                        type="button"
                                        title="Revoke collaborator access"
                                        disabled={isUpdating}
                                        onClick={() => handleRevokeCollaborator(doc.id, collab.user_id)}
                                        className="p-1.5 rounded-sm bg-paper-light hover:bg-coral-light border border-ink-border text-ink hover:text-coral transition-colors disabled:opacity-50 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Starred Tab */}
          {activeTab === "starred" && (
            <div className="bg-paper-light rounded-sm border-2 border-ink-border p-12 text-center space-y-4 shadow-retro-md">
              <div className="w-12 h-12 rounded-sm bg-paper-cream border-2 border-ink-border text-coral mx-auto flex items-center justify-center shadow-retro">
                <Star className="w-6 h-6 fill-coral" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-xl font-extrabold text-ink">
                  Starred Documents
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted font-medium leading-relaxed">
                  Quick-marking important documents and briefs will be available in upcoming releases.
                </p>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="bg-paper-light rounded-sm border-2 border-ink-border p-6 sm:p-8 space-y-6 shadow-retro-md">
              <div className="border-b-2 border-ink-border pb-4">
                <h3 className="text-xl font-extrabold text-ink">
                  Workspace Settings &amp; Profile
                </h3>
                <p className="text-xs sm:text-sm text-ink-muted font-medium mt-1">
                  Manage your personal account identity.
                </p>
              </div>

              <div className="space-y-4 max-w-xl">
                <div className="p-5 rounded-sm bg-paper-cream/60 border-2 border-ink-border space-y-2.5 shadow-retro">
                  <div className="text-xs font-extrabold uppercase text-ink tracking-wider pb-1.5 border-b border-ink-border/30">
                    Account Profile
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-ink-muted font-medium">Username:</span>
                    <span className="font-bold text-ink">{user.username}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-ink-muted font-medium">Email Address:</span>
                    <span className="font-bold text-ink">{user.email}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* My Documents or Trash Tab */}
          {(activeTab === "my-docs" || activeTab === "trash") && (
            <div className="space-y-5">
              {/* Filter and Control Bar (Modeled after reference search/filter) */}
              <div className="bg-paper-light rounded-sm p-4 border-2 border-ink-border shadow-retro-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Search Bar */}
                <form
                  onSubmit={handleSearchSubmit}
                  className="relative flex-1 max-w-md"
                >
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      activeTab === "trash"
                        ? "Search trashed documents..."
                        : "Search documents by title..."
                    }
                    className="w-full pl-9 pr-8 py-2 rounded-sm bg-paper-cream/60 border-2 border-ink-border text-xs sm:text-sm text-ink placeholder:text-ink-muted/60 focus:bg-white focus:outline-none focus:shadow-retro font-medium transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </form>

                {/* Sorting & View Controls */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="flex items-center gap-1.5 text-xs text-ink font-bold">
                    <ArrowUpDown className="w-3.5 h-3.5 text-coral" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="bg-paper-cream/60 border-2 border-ink-border rounded-sm px-2.5 py-1.5 text-xs text-ink font-bold focus:outline-none focus:bg-white cursor-pointer"
                    >
                      <option value="updated_desc">Recently Modified</option>
                      <option value="updated_asc">Oldest First</option>
                      <option value="title_asc">Alphabetical (A-Z)</option>
                      <option value="title_desc">Alphabetical (Z-A)</option>
                    </select>
                  </div>

                  {/* View Switcher */}
                  <div className="flex items-center bg-paper-cream border-2 border-ink-border rounded-sm p-0.5">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-sm transition-all ${
                        viewMode === "grid"
                          ? "bg-coral text-white border border-ink-border shadow-[1px_1px_0px_#171717]"
                          : "text-ink hover:text-coral"
                      }`}
                      title="Grid View"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded-sm transition-all ${
                        viewMode === "list"
                          ? "bg-coral text-white border border-ink-border shadow-[1px_1px_0px_#171717]"
                          : "text-ink hover:text-coral"
                      }`}
                      title="List View"
                    >
                      <ListIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Total Documents Count Badge Header (Like reference screenshot) */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-extrabold text-ink">
                    {activeTab === "trash" ? "Trash Archive" : "Documents"}
                  </h2>
                  <span className="border-2 border-ink-border bg-paper-cream px-3 py-1 rounded-sm text-xs font-bold text-ink shadow-[1px_1px_0px_#171717]">
                    {documents.length} document{documents.length === 1 ? "" : "s"}
                  </span>
                </div>
              </div>

              {/* Document Listing Area */}
              {loadingDocs ? (
                <div className="py-16 flex flex-col items-center justify-center bg-paper-light rounded-sm border-2 border-ink-border shadow-retro-md">
                  <Loader2 className="w-7 h-7 text-ink animate-spin mb-3" />
                  <p className="text-xs font-bold text-ink-muted">
                    Retrieving workspace documents...
                  </p>
                </div>
              ) : documents.length === 0 ? (
                /* Empty States */
                <div className="bg-paper-light rounded-sm border-2 border-ink-border p-12 text-center space-y-4 shadow-retro-md">
                  {searchQuery ? (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-sm bg-paper-cream border-2 border-ink-border text-ink mx-auto flex items-center justify-center shadow-retro">
                        <Search className="w-6 h-6 text-coral" />
                      </div>
                      <h3 className="font-extrabold text-ink text-lg">
                        No matches found
                      </h3>
                      <p className="text-xs sm:text-sm text-ink-muted max-w-sm mx-auto font-medium">
                        No documents matched your query "<strong>{searchQuery}</strong>". Try clearing your search.
                      </p>
                      <button
                        onClick={handleClearSearch}
                        className="px-4 py-2 rounded-sm bg-paper-cream hover:bg-paper border-2 border-ink-border text-xs font-bold text-ink shadow-retro transition-all"
                      >
                        Clear Search Filter
                      </button>
                    </div>
                  ) : activeTab === "trash" ? (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-sm bg-paper-cream border-2 border-ink-border text-ink mx-auto flex items-center justify-center shadow-retro">
                        <Trash2 className="w-6 h-6 text-coral" />
                      </div>
                      <h3 className="font-extrabold text-ink text-lg">
                        Trash is empty
                      </h3>
                      <p className="text-xs sm:text-sm text-ink-muted max-w-sm mx-auto font-medium">
                        Documents moved to trash will be kept here for restoration or permanent purge.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-sm bg-paper-cream border-2 border-ink-border text-ink mx-auto flex items-center justify-center shadow-retro">
                        <FileText className="w-6 h-6 text-coral" />
                      </div>
                      <h3 className="font-extrabold text-ink text-xl">
                        Your Workspace is Ready
                      </h3>
                      <p className="text-xs sm:text-sm text-ink-muted max-w-md mx-auto font-medium leading-relaxed">
                        You have not created any documents yet. Begin writing distraction-free with Draftly's focused editorial workflow.
                      </p>
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-coral hover:bg-coral-hover text-white border-2 border-ink-border text-xs font-extrabold shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create Your First Document</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : viewMode === "grid" ? (
                /* Grid View (Styled after reference job cards) */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-paper-light rounded-sm p-5 border-2 border-ink-border shadow-retro-md hover:shadow-retro-lg transition-all flex flex-col justify-between group relative"
                    >
                      <div>
                        {/* Card Header & Badges */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-retroBlue text-white text-[10px] font-extrabold uppercase border border-ink-border">
                              <User className="w-3 h-3" />
                              <span>Owner</span>
                            </span>
                          </div>

                          {/* Action Menu Button */}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenMenuId(openMenuId === doc.id ? null : doc.id)
                              }
                              className="p-1 rounded-sm text-ink-muted hover:text-ink hover:bg-paper-cream border border-transparent hover:border-ink-border transition-colors cursor-pointer"
                              title="Document actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {openMenuId === doc.id && (
                              <div className="absolute right-0 top-full mt-1 w-48 bg-paper-light rounded-sm shadow-retro-lg border-2 border-ink-border py-1.5 z-20 text-xs font-bold">
                                {activeTab === "trash" ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        handleRestoreFromTrash(doc.id);
                                      }}
                                      className="w-full text-left px-3 py-2 hover:bg-paper-cream flex items-center gap-2 text-ink cursor-pointer"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5 text-retroGreen" />
                                      <span>Restore Document</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        handlePermanentDelete(doc.id);
                                      }}
                                      className="w-full text-left px-3 py-2 hover:bg-coral-light flex items-center gap-2 text-coral cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Permanently Delete</span>
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <Link
                                      href={`/documents/${doc.id}`}
                                      className="w-full text-left px-3 py-2 hover:bg-paper-cream flex items-center gap-2 text-ink"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5 text-coral" />
                                      <span>Open Document</span>
                                    </Link>
                                    <button
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        setRenamingDoc(doc);
                                        setRenameTitle(doc.title);
                                      }}
                                      className="w-full text-left px-3 py-2 hover:bg-paper-cream flex items-center gap-2 text-ink cursor-pointer"
                                    >
                                      <Edit2 className="w-3.5 h-3.5 text-ink-muted" />
                                      <span>Rename Document</span>
                                    </button>
                                    <div className="border-t-2 border-ink-border/20 my-1" />
                                    <button
                                      onClick={() => handleMoveToTrash(doc.id)}
                                      className="w-full text-left px-3 py-2 hover:bg-coral-light flex items-center gap-2 text-coral cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Move to Trash</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Title & Preview */}
                        <Link href={`/documents/${doc.id}`} className="block">
                          <h4 className="font-extrabold text-ink text-base leading-snug line-clamp-2 hover:text-coral transition-colors mb-1.5">
                            {doc.title}
                          </h4>
                          <p className="text-xs text-ink-soft line-clamp-2 font-normal leading-relaxed">
                            {doc.content?.content?.length
                              ? "Rich structured document contents stored."
                              : "Empty document workspace. Ready for drafting."}
                          </p>
                        </Link>
                      </div>

                      {/* Card Footer (Action button like Apply Now in reference) */}
                      <div className="pt-3.5 mt-4 border-t-2 border-ink-border/20 flex items-center justify-between text-xs font-semibold text-ink-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-coral" />
                          <span>{formatDate(doc.updated_at)}</span>
                        </span>

                        {activeTab === "trash" ? (
                          <span className="text-coral font-bold text-xs">
                            In Trash
                          </span>
                        ) : (
                          <Link
                            href={`/documents/${doc.id}`}
                            className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-sm bg-coral hover:bg-coral-hover text-white text-xs font-bold border-2 border-ink-border shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* List View */
                <div className="bg-paper-light rounded-sm border-2 border-ink-border divide-y-2 divide-ink-border/20 shadow-retro-md">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-paper-cream/40 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-8 h-8 rounded-sm bg-coral border-2 border-ink-border text-white flex items-center justify-center shrink-0 shadow-[1px_1px_0px_#171717]">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/documents/${doc.id}`}
                            className="font-bold text-ink hover:text-coral text-sm block truncate transition-colors"
                          >
                            {doc.title}
                          </Link>
                          <div className="flex items-center gap-2 text-xs text-ink-muted font-medium">
                            <span>Modified {formatDate(doc.updated_at)}</span>
                            <span>•</span>
                            <span className="text-retroBlue font-bold">Owner</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {activeTab === "trash" ? (
                          <>
                            <button
                              onClick={() => handleRestoreFromTrash(doc.id)}
                              className="px-3 py-1.5 rounded-sm bg-paper-light hover:bg-paper-cream border-2 border-ink-border text-xs font-bold text-ink flex items-center gap-1.5 shadow-retro transition-all cursor-pointer"
                              title="Restore"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-retroGreen" />
                              <span>Restore</span>
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(doc.id)}
                              className="p-1.5 rounded-sm text-coral hover:bg-coral-light border border-transparent hover:border-ink-border transition-colors cursor-pointer"
                              title="Permanently Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setRenamingDoc(doc);
                                setRenameTitle(doc.title);
                              }}
                              className="p-1.5 rounded-sm text-ink-muted hover:text-ink hover:bg-paper-cream border border-transparent hover:border-ink-border transition-colors cursor-pointer"
                              title="Rename"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleMoveToTrash(doc.id)}
                              className="p-1.5 rounded-sm text-ink-muted hover:text-coral hover:bg-coral-light border border-transparent hover:border-ink-border transition-colors cursor-pointer"
                              title="Move to Trash"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <Link
                              href={`/documents/${doc.id}`}
                              className="px-3.5 py-1.5 rounded-sm bg-coral hover:bg-coral-hover text-white text-xs font-bold border-2 border-ink-border flex items-center gap-1 shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                            >
                              <span>Open</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Creation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-paper-light rounded-sm max-w-md w-full p-6 sm:p-8 border-2 border-ink-border shadow-retro-xl space-y-5">
            <div className="flex items-center justify-between border-b-2 border-ink-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-sm bg-coral border-2 border-ink-border text-white flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-ink text-lg">
                  Create New Document
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-ink-muted hover:text-ink cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-ink-muted font-medium leading-relaxed">
              Name your document to begin drafting. You can rename it anytime from the workspace or document header.
            </p>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-ink mb-1.5">
                  Document Title (Optional)
                </label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Untitled Document"
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-sm bg-paper-light border-2 border-ink-border text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:bg-white focus:shadow-retro font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-sm border-2 border-ink-border text-xs font-bold text-ink bg-paper-light hover:bg-paper-cream shadow-retro transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingDoc}
                  className="px-5 py-2 rounded-sm bg-coral hover:bg-coral-hover text-white text-xs font-extrabold border-2 border-ink-border shadow-retro flex items-center gap-2 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 cursor-pointer"
                >
                  {creatingDoc && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Create Document</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renamingDoc && (
        <div className="fixed inset-0 bg-ink/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-paper-light rounded-sm max-w-md w-full p-6 sm:p-8 border-2 border-ink-border shadow-retro-xl space-y-5">
            <div className="flex items-center justify-between border-b-2 border-ink-border pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-sm bg-coral border-2 border-ink-border text-white flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-ink text-lg">
                  Rename Document
                </h3>
              </div>
              <button
                onClick={() => setRenamingDoc(null)}
                className="text-ink-muted hover:text-ink cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRenameDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-ink mb-1.5">
                  Document Title
                </label>
                <input
                  type="text"
                  value={renameTitle}
                  onChange={(e) => setRenameTitle(e.target.value)}
                  placeholder="Untitled Document"
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 rounded-sm bg-paper-light border-2 border-ink-border text-sm text-ink placeholder:text-ink-muted/60 focus:outline-none focus:bg-white focus:shadow-retro font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRenamingDoc(null)}
                  className="px-4 py-2 rounded-sm border-2 border-ink-border text-xs font-bold text-ink bg-paper-light hover:bg-paper-cream shadow-retro transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRenaming}
                  className="px-5 py-2 rounded-sm bg-coral hover:bg-coral-hover text-white text-xs font-extrabold border-2 border-ink-border shadow-retro flex items-center gap-2 active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isRenaming && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Title</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {token && (
        <ImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          token={token}
          onImportSuccess={(importedDoc) => {
            setIsImportModalOpen(false);
            router.push(`/documents/${importedDoc.id}`);
          }}
        />
      )}

      {/* Share Modal for Dashboard */}
      {token && shareModalDocId && (
        <ShareModal
          isOpen={!!shareModalDocId}
          token={token}
          documentId={shareModalDocId}
          onClose={() => {
            setShareModalDocId(null);
            loadSharedByMe();
          }}
        />
      )}
    </div>
  );
}
