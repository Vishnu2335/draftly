"use client";

import React, { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  apiCreateDocument,
  apiDeleteDocument,
  apiGetDocuments,
  apiUpdateDocument,
  DocumentItem,
} from "@/lib/config";
import {
  AlertCircle,
  ArrowUpDown,
  Check,
  Clock,
  Edit2,
  ExternalLink,
  FileText,
  Filter,
  Folder,
  LayoutGrid,
  List as ListIcon,
  Loader2,
  Lock,
  MoreVertical,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Share2,
  Sparkles,
  Star,
  Trash2,
  User,
  X,
} from "lucide-react";

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

  // Search & Sorting state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("updated_desc");

  // Creation Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newDocTitle, setNewDocTitle] = useState<string>("");
  const [creatingDoc, setCreatingDoc] = useState<boolean>(false);

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
    loadDocuments();
  }, [token, isAuthenticated, activeTab, sortBy]);

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
      // Navigate to the newly created document route
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
      // Refresh list
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
        <Loader2 className="w-8 h-8 text-forest animate-spin mb-3" />
        <p className="text-sm font-sans text-forest/70 font-medium">
          Loading workspace...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 mb-8 border-b border-warmStone/60">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-sage-dark uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5 text-terracotta" />
            <span>Workspace Atelier • Phase 3</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-forest tracking-tight">
            Welcome back, {user.username}
          </h1>
          <p className="text-sm text-forest/70 font-light mt-0.5">
            Your calm, focused atelier for drafting, organizing, and managing documents.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Document</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Editorial Navigation Sidebar */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="bg-white rounded-2xl p-3 border border-warmStone/60 shadow-xs">
            <div className="text-[11px] font-mono uppercase tracking-wider text-forest/50 font-semibold px-3 py-2">
              Workspace Views
            </div>

            <nav className="space-y-1">
              {/* My Documents */}
              <button
                onClick={() => {
                  setActiveTab("my-docs");
                  setSearchQuery("");
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === "my-docs"
                    ? "bg-forest text-white"
                    : "text-forest hover:bg-ivory"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Folder className="w-4 h-4" />
                  <span>My Documents</span>
                </div>
                <span
                  className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                    activeTab === "my-docs"
                      ? "bg-forest-light text-warmStone-light"
                      : "bg-warmStone/50 text-forest/70"
                  }`}
                >
                  {activeCount}
                </span>
              </button>

              {/* Overview Tab */}
              <button
                onClick={() => setActiveTab("overview")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === "overview"
                    ? "bg-forest text-white"
                    : "text-forest hover:bg-ivory"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4" />
                  <span>Overview</span>
                </div>
              </button>

              {/* Shared With Me (Placeholder for Phase 6) */}
              <button
                onClick={() => setActiveTab("shared")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === "shared"
                    ? "bg-forest text-white"
                    : "text-forest/70 hover:bg-ivory"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Share2 className="w-4 h-4" />
                  <span>Shared With Me</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-terracotta/15 text-terracotta font-semibold">
                  Phase 6
                </span>
              </button>

              {/* Starred (Placeholder) */}
              <button
                onClick={() => setActiveTab("starred")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === "starred"
                    ? "bg-forest text-white"
                    : "text-forest/70 hover:bg-ivory"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Star className="w-4 h-4" />
                  <span>Starred</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-sage/20 text-sage-dark font-semibold">
                  Soon
                </span>
              </button>

              {/* Trash */}
              <button
                onClick={() => {
                  setActiveTab("trash");
                  setSearchQuery("");
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === "trash"
                    ? "bg-forest text-white"
                    : "text-forest hover:bg-ivory"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Trash2 className="w-4 h-4" />
                  <span>Trash</span>
                </div>
                {trashCount > 0 && (
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                      activeTab === "trash"
                        ? "bg-forest-light text-warmStone-light"
                        : "bg-terracotta/20 text-terracotta-dark"
                    }`}
                  >
                    {trashCount}
                  </span>
                )}
              </button>

              {/* Settings */}
              <button
                onClick={() => setActiveTab("settings")}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  activeTab === "settings"
                    ? "bg-forest text-white"
                    : "text-forest hover:bg-ivory"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </div>
              </button>
            </nav>
          </div>

          {/* Identity & Atelier Status Card */}
          <div className="bg-white rounded-2xl p-4 border border-warmStone/60 text-xs space-y-3">
            <div className="flex items-center gap-2 text-forest font-semibold">
              <User className="w-4 h-4 text-sage-dark" />
              <span>Workspace Atelier</span>
            </div>
            <p className="text-forest/70 leading-relaxed">
              Connected as <span className="font-semibold text-forest">{user.email}</span>. All documents are private and protected by owner isolation.
            </p>
            <div className="pt-2 border-t border-warmStone/40 flex items-center justify-between text-[11px] text-forest/60 font-mono">
              <span>Active Storage:</span>
              <span className="font-bold text-forest">{activeCount} documents</span>
            </div>
          </div>
        </aside>

        {/* Right Main Content Area */}
        <main className="lg:col-span-9 space-y-6">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold">Workspace Notice: </span>
                {errorMsg}
              </div>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Tab 1: Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-warmStone/60 shadow-xs">
                  <span className="text-xs font-mono uppercase text-forest/60 font-medium">
                    Total Active Documents
                  </span>
                  <div className="text-3xl font-serif font-bold text-forest mt-1">
                    {activeCount}
                  </div>
                  <p className="text-xs text-forest/60 mt-1">
                    Owned and accessible in atelier
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-warmStone/60 shadow-xs">
                  <span className="text-xs font-mono uppercase text-forest/60 font-medium">
                    Soft-Deleted Documents
                  </span>
                  <div className="text-3xl font-serif font-bold text-terracotta mt-1">
                    {trashCount}
                  </div>
                  <p className="text-xs text-forest/60 mt-1">
                    Preserved in Trash for recovery
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-warmStone/60 shadow-xs">
                  <span className="text-xs font-mono uppercase text-forest/60 font-medium">
                    Active Architecture
                  </span>
                  <div className="text-xl font-serif font-bold text-sage-dark mt-1">
                    Phase 3 Active
                  </div>
                  <p className="text-xs text-forest/60 mt-1">
                    Metadata, CRUD, and isolation verified
                  </p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-warmStone/60 space-y-4">
                <h3 className="font-serif font-bold text-forest text-lg">
                  Recent Atelier Activity
                </h3>
                {documents.length === 0 ? (
                  <p className="text-sm text-forest/60 font-light">
                    No documents created yet. Click "Create New Document" to begin drafting.
                  </p>
                ) : (
                  <div className="divide-y divide-warmStone/40">
                    {documents.slice(0, 5).map((doc) => (
                      <div
                        key={doc.id}
                        className="py-3 flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-sage-dark" />
                          <div>
                            <Link
                              href={`/documents/${doc.id}`}
                              className="font-medium text-forest hover:text-terracotta transition-colors text-sm"
                            >
                              {doc.title}
                            </Link>
                            <p className="text-xs text-forest/50">
                              Modified {formatDate(doc.updated_at)}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/documents/${doc.id}`}
                          className="text-xs font-medium text-sage-dark hover:text-forest flex items-center gap-1"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Shared With Me (Placeholder) */}
          {activeTab === "shared" && (
            <div className="bg-white rounded-2xl border border-warmStone/60 p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-terracotta/10 text-terracotta mx-auto flex items-center justify-center">
                <Share2 className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-xl font-serif font-bold text-forest">
                  Document Sharing & Collaboration
                </h3>
                <p className="text-sm text-forest/70 font-light leading-relaxed">
                  Granular role-based access control (Owner, Editor, Viewer) is scheduled for implementation in <strong>Phase 6: Document Sharing</strong>.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ivory border border-warmStone text-xs font-mono text-forest/70">
                <Lock className="w-3.5 h-3.5 text-terracotta" />
                <span>Feature currently under development per approved PRD</span>
              </div>
            </div>
          )}

          {/* Tab 3: Starred (Placeholder) */}
          {activeTab === "starred" && (
            <div className="bg-white rounded-2xl border border-warmStone/60 p-12 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-sage/20 text-sage-dark mx-auto flex items-center justify-center">
                <Star className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-xl font-serif font-bold text-forest">
                  Starred Documents Atelier
                </h3>
                <p className="text-sm text-forest/70 font-light leading-relaxed">
                  Quick-marking important manuscripts and briefs will be available in future releases.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ivory border border-warmStone text-xs font-mono text-forest/70">
                <span>Database placeholder only • No mock data rendered</span>
              </div>
            </div>
          )}

          {/* Tab 4: Settings Tab */}
          {activeTab === "settings" && (
            <div className="bg-white rounded-2xl border border-warmStone/60 p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-xl font-serif font-bold text-forest">
                  Workspace Settings & Account
                </h3>
                <p className="text-sm text-forest/70 font-light">
                  Manage your personal atelier identity and security preferences.
                </p>
              </div>

              <div className="space-y-4 max-w-xl">
                <div className="p-4 rounded-xl bg-ivory border border-warmStone/60 space-y-2">
                  <div className="text-xs font-mono uppercase text-forest/50 font-semibold">
                    Account Profile
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-forest/70">Username:</span>
                    <span className="font-semibold text-forest">{user.username}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-forest/70">Email Address:</span>
                    <span className="font-semibold text-forest">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-forest/70">Account ID:</span>
                    <span className="font-mono text-xs text-forest/70">{user.id}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-ivory border border-warmStone/60 space-y-2">
                  <div className="text-xs font-mono uppercase text-forest/50 font-semibold">
                    Authentication & Persistence
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-forest/70">Algorithm:</span>
                    <span className="font-mono text-xs text-forest font-semibold">Argon2id + HS256</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-forest/70">Session Validity:</span>
                    <span className="font-mono text-xs text-forest font-semibold">30 Minutes</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-forest/70">Database Engine:</span>
                    <span className="font-mono text-xs text-sage-dark font-semibold">Supabase PostgreSQL</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5 & 6: My Documents or Trash */}
          {(activeTab === "my-docs" || activeTab === "trash") && (
            <div className="space-y-4">
              {/* Filter and Control Bar */}
              <div className="bg-white rounded-2xl p-4 border border-warmStone/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                {/* Search Bar */}
                <form
                  onSubmit={handleSearchSubmit}
                  className="relative flex-1 max-w-md"
                >
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-forest/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      activeTab === "trash"
                        ? "Search trashed documents..."
                        : "Search documents by title..."
                    }
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-ivory border border-warmStone/80 text-sm text-forest placeholder:text-forest/40 focus:outline-none focus:ring-2 focus:ring-forest focus:border-transparent font-sans"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-forest/40 hover:text-forest"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </form>

                {/* Sorting & View Controls */}
                <div className="flex items-center gap-3 self-end sm:self-auto">
                  <div className="flex items-center gap-1.5 text-xs text-forest/70 font-sans">
                    <ArrowUpDown className="w-3.5 h-3.5 text-forest/50" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="bg-ivory border border-warmStone/80 rounded-lg px-2.5 py-1.5 text-xs text-forest focus:outline-none focus:ring-1 focus:ring-forest cursor-pointer"
                    >
                      <option value="updated_desc">Recently Modified</option>
                      <option value="updated_asc">Oldest First</option>
                      <option value="title_asc">Alphabetical (A-Z)</option>
                      <option value="title_desc">Alphabetical (Z-A)</option>
                    </select>
                  </div>

                  {/* View Switcher */}
                  <div className="flex items-center bg-ivory border border-warmStone/80 rounded-lg p-0.5">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-md transition-colors ${
                        viewMode === "grid"
                          ? "bg-white shadow-xs text-forest"
                          : "text-forest/40 hover:text-forest"
                      }`}
                      title="Grid View"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded-md transition-colors ${
                        viewMode === "list"
                          ? "bg-white shadow-xs text-forest"
                          : "text-forest/40 hover:text-forest"
                      }`}
                      title="List View"
                    >
                      <ListIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Document Listing Area */}
              {loadingDocs ? (
                <div className="py-16 flex flex-col items-center justify-center bg-white rounded-2xl border border-warmStone/60">
                  <Loader2 className="w-7 h-7 text-forest animate-spin mb-3" />
                  <p className="text-sm font-medium text-forest/60">
                    Retrieving atelier documents...
                  </p>
                </div>
              ) : documents.length === 0 ? (
                /* Empty States */
                <div className="bg-white rounded-2xl border border-warmStone/60 p-12 text-center space-y-4">
                  {searchQuery ? (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-warmStone/30 text-forest/40 mx-auto flex items-center justify-center">
                        <Search className="w-6 h-6" />
                      </div>
                      <h3 className="font-serif font-bold text-forest text-lg">
                        No matches found
                      </h3>
                      <p className="text-sm text-forest/60 max-w-sm mx-auto font-light">
                        No documents matched your query "<strong>{searchQuery}</strong>". Try clearing your search.
                      </p>
                      <button
                        onClick={handleClearSearch}
                        className="px-4 py-2 rounded-xl bg-ivory hover:bg-warmStone/40 border border-warmStone text-xs font-semibold text-forest transition-colors"
                      >
                        Clear Search Filter
                      </button>
                    </div>
                  ) : activeTab === "trash" ? (
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-warmStone/30 text-forest/40 mx-auto flex items-center justify-center">
                        <Trash2 className="w-6 h-6" />
                      </div>
                      <h3 className="font-serif font-bold text-forest text-lg">
                        Trash is empty
                      </h3>
                      <p className="text-sm text-forest/60 max-w-sm mx-auto font-light">
                        Documents moved to trash will be kept here for restoration or permanent purge.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="w-14 h-14 rounded-2xl bg-forest/5 text-forest mx-auto flex items-center justify-center">
                        <FileText className="w-7 h-7 text-sage-dark" />
                      </div>
                      <h3 className="font-serif font-bold text-forest text-xl">
                        Your Atelier is Ready
                      </h3>
                      <p className="text-sm text-forest/70 max-w-md mx-auto font-light leading-relaxed">
                        You have not created any documents yet. Begin writing distraction-free with Draftly's focused editorial workflow.
                      </p>
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-dark text-white text-sm font-semibold transition-all shadow-sm active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create Your First Document</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : viewMode === "grid" ? (
                /* Grid View */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white rounded-2xl p-5 border border-warmStone/70 hover:border-forest/40 transition-all hover:shadow-sm flex flex-col justify-between group relative"
                    >
                      <div>
                        {/* Card Header & Actions */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-sage/15 text-sage-dark text-[11px] font-mono font-medium">
                            <User className="w-3 h-3" />
                            <span>Owner</span>
                          </span>

                          {/* Action Menu Button */}
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenMenuId(openMenuId === doc.id ? null : doc.id)
                              }
                              className="p-1 rounded-lg text-forest/40 hover:text-forest hover:bg-ivory transition-colors"
                              title="Document actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {openMenuId === doc.id && (
                              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-warmStone/70 py-1.5 z-20 text-xs font-sans">
                                {activeTab === "trash" ? (
                                  <>
                                    <button
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        handleRestoreFromTrash(doc.id);
                                      }}
                                      className="w-full text-left px-3 py-2 hover:bg-ivory flex items-center gap-2 text-forest"
                                    >
                                      <RotateCcw className="w-3.5 h-3.5 text-sage-dark" />
                                      <span>Restore to Workspace</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        handlePermanentDelete(doc.id);
                                      }}
                                      className="w-full text-left px-3 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Permanently Delete</span>
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <Link
                                      href={`/documents/${doc.id}`}
                                      className="w-full text-left px-3 py-2 hover:bg-ivory flex items-center gap-2 text-forest"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5 text-forest/60" />
                                      <span>Open Document</span>
                                    </Link>
                                    <button
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        setRenamingDoc(doc);
                                        setRenameTitle(doc.title);
                                      }}
                                      className="w-full text-left px-3 py-2 hover:bg-ivory flex items-center gap-2 text-forest"
                                    >
                                      <Edit2 className="w-3.5 h-3.5 text-forest/60" />
                                      <span>Rename Document</span>
                                    </button>
                                    <div className="border-t border-warmStone/40 my-1" />
                                    <button
                                      onClick={() => handleMoveToTrash(doc.id)}
                                      className="w-full text-left px-3 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600"
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
                          <h4 className="font-serif font-bold text-forest text-base leading-snug line-clamp-2 hover:text-terracotta transition-colors mb-2">
                            {doc.title}
                          </h4>
                          <p className="text-xs text-forest/50 line-clamp-2 font-light">
                            {doc.content?.content?.length
                              ? "Rich structured document contents stored."
                              : "Empty document atelier. Ready for drafting."}
                          </p>
                        </Link>
                      </div>

                      {/* Card Footer */}
                      <div className="pt-4 mt-4 border-t border-warmStone/40 flex items-center justify-between text-[11px] text-forest/50 font-mono">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(doc.updated_at)}</span>
                        </span>

                        {activeTab === "trash" ? (
                          <span className="text-terracotta font-semibold">
                            In Trash
                          </span>
                        ) : (
                          <Link
                            href={`/documents/${doc.id}`}
                            className="font-medium text-forest hover:text-terracotta transition-colors"
                          >
                            Open →
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* List View */
                <div className="bg-white rounded-2xl border border-warmStone/60 divide-y divide-warmStone/40 shadow-xs">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-ivory/50 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-ivory border border-warmStone flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-forest" />
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/documents/${doc.id}`}
                            className="font-serif font-bold text-forest hover:text-terracotta text-sm block truncate transition-colors"
                          >
                            {doc.title}
                          </Link>
                          <div className="flex items-center gap-2 text-xs text-forest/50 font-mono">
                            <span>Modified {formatDate(doc.updated_at)}</span>
                            <span>•</span>
                            <span className="text-sage-dark font-medium">Owner</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {activeTab === "trash" ? (
                          <>
                            <button
                              onClick={() => handleRestoreFromTrash(doc.id)}
                              className="px-3 py-1.5 rounded-lg bg-ivory hover:bg-warmStone/40 border border-warmStone text-xs font-medium text-forest flex items-center gap-1.5 transition-colors"
                              title="Restore"
                            >
                              <RotateCcw className="w-3.5 h-3.5 text-sage-dark" />
                              <span>Restore</span>
                            </button>
                            <button
                              onClick={() => handlePermanentDelete(doc.id)}
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
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
                              className="p-1.5 rounded-lg text-forest/40 hover:text-forest hover:bg-ivory transition-colors"
                              title="Rename"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleMoveToTrash(doc.id)}
                              className="p-1.5 rounded-lg text-forest/40 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Move to Trash"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <Link
                              href={`/documents/${doc.id}`}
                              className="px-3 py-1.5 rounded-lg bg-forest hover:bg-forest-dark text-white text-xs font-semibold flex items-center gap-1 transition-all"
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
        <div className="fixed inset-0 bg-forest-dark/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-warmStone shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-terracotta/15 text-terracotta flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-forest text-lg">
                  Create New Document
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-forest/40 hover:text-forest"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-forest/70 font-light leading-relaxed">
              Name your document to begin drafting. You can update the title anytime from the workspace or document header.
            </p>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-forest/60 font-semibold mb-1.5">
                  Document Title (Optional)
                </label>
                <input
                  type="text"
                  value={newDocTitle}
                  onChange={(e) => setNewDocTitle(e.target.value)}
                  placeholder="Untitled Document"
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl bg-ivory border border-warmStone text-sm text-forest placeholder:text-forest/40 focus:outline-none focus:ring-2 focus:ring-forest"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-warmStone text-xs font-semibold text-forest hover:bg-ivory transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingDoc}
                  className="px-5 py-2 rounded-xl bg-forest hover:bg-forest-dark text-white text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
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
        <div className="fixed inset-0 bg-forest-dark/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 border border-warmStone shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-forest/10 text-forest flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <h3 className="font-serif font-bold text-forest text-lg">
                  Rename Document
                </h3>
              </div>
              <button
                onClick={() => setRenamingDoc(null)}
                className="text-forest/40 hover:text-forest"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRenameDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-forest/60 font-semibold mb-1.5">
                  Document Title
                </label>
                <input
                  type="text"
                  value={renameTitle}
                  onChange={(e) => setRenameTitle(e.target.value)}
                  placeholder="Untitled Document"
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-ivory border border-warmStone text-sm text-forest placeholder:text-forest/40 focus:outline-none focus:ring-2 focus:ring-forest"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRenamingDoc(null)}
                  className="px-4 py-2 rounded-xl border border-warmStone text-xs font-semibold text-forest hover:bg-ivory transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRenaming}
                  className="px-5 py-2 rounded-xl bg-forest hover:bg-forest-dark text-white text-xs font-semibold flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {isRenaming && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Title</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
