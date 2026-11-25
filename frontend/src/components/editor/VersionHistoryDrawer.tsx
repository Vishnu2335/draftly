"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  History,
  RotateCcw,
  Plus,
  Loader2,
  Calendar,
  User,
  AlertCircle,
  Check,
} from "lucide-react";
import {
  apiCreateVersion,
  apiGetVersions,
  apiRestoreVersion,
  DocumentItem,
  DocumentVersionItem,
} from "@/lib/config";

interface VersionHistoryDrawerProps {
  documentId: string;
  token: string;
  isOpen: boolean;
  canRestore: boolean;
  onClose: () => void;
  onRestore: (restoredDoc: DocumentItem) => void;
}

export default function VersionHistoryDrawer({
  documentId,
  token,
  isOpen,
  canRestore,
  onClose,
  onRestore,
}: VersionHistoryDrawerProps) {
  const [versions, setVersions] = useState<DocumentVersionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [snapshotLabel, setSnapshotLabel] = useState<string>("");
  const [creating, setCreating] = useState<boolean>(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadVersions = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await apiGetVersions(token, documentId);
      setVersions(res.items);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load versions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadVersions();
      setSnapshotLabel("");
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen, documentId, token]);

  if (!isOpen) return null;

  const handleCreateSnapshot = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      setErrorMsg(null);
      setSuccessMsg(null);
      await apiCreateVersion(token, documentId, snapshotLabel.trim() || undefined);
      setSnapshotLabel("");
      setSuccessMsg("Snapshot saved successfully.");
      await loadVersions();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save snapshot.");
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async (version: DocumentVersionItem) => {
    const confirmed = window.confirm(
      `Revert document to Version ${version.version_number} ("${version.title}")? Your current state will be automatically saved as a backup.`
    );
    if (!confirmed) return;

    try {
      setRestoringId(version.id);
      setErrorMsg(null);
      const restored = await apiRestoreVersion(token, documentId, version.id);
      setSuccessMsg(`Restored to Version ${version.version_number}.`);
      onRestore(restored);
      await loadVersions();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to restore version.");
    } finally {
      setRestoringId(null);
    }
  };

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
    } catch {
      return "Unknown date";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
      />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-paper-cream border-l-2 border-ink-border shadow-2xl flex flex-col h-full z-10 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b-2 border-ink-border flex items-center justify-between bg-paper-light">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-sm bg-coral text-white border-2 border-ink-border flex items-center justify-center shadow-retro">
              <History className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-ink">Version History</h2>
              <p className="text-xs text-ink-muted">View snapshots and restore past revisions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-sm text-ink-muted hover:text-ink hover:bg-paper-cream border-2 border-transparent hover:border-ink-border transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Create Snapshot Form (Editors and Owners) */}
        {canRestore && (
          <div className="p-4 border-b-2 border-ink-border bg-paper">
            <form onSubmit={handleCreateSnapshot} className="space-y-2">
              <label className="text-xs font-bold text-ink">Create Named Snapshot</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Pre-review draft, Final v1"
                  value={snapshotLabel}
                  onChange={(e) => setSnapshotLabel(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs font-semibold bg-white border-2 border-ink-border rounded-sm focus:outline-none focus:ring-1 focus:ring-coral text-ink"
                />
                <button
                  type="submit"
                  disabled={creating}
                  className="px-3 py-1.5 rounded-sm bg-coral text-white text-xs font-extrabold border-2 border-ink-border shadow-retro hover:bg-coral-hover active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {creating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Snapshot</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Notifications */}
        {errorMsg && (
          <div className="mx-4 mt-3 p-2.5 bg-coral-light border-2 border-coral rounded-sm text-coral text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-4 mt-3 p-2.5 bg-retroGreen/15 border-2 border-retroGreen rounded-sm text-ink text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-retroGreen shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Versions List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-ink-muted">
              <Loader2 className="w-6 h-6 animate-spin mb-2 text-coral" />
              <p className="text-xs font-bold">Loading revision history...</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="py-12 text-center text-ink-muted">
              <History className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-bold">No snapshots recorded yet.</p>
              <p className="text-[11px] mt-1">
                Create a snapshot above or restore from any auto-backup point.
              </p>
            </div>
          ) : (
            versions.map((v) => (
              <div
                key={v.id}
                className="p-3 bg-white border-2 border-ink-border rounded-sm shadow-retro space-y-2 hover:border-coral transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-xs bg-ink text-white text-[11px] font-extrabold border border-ink-border">
                      v{v.version_number}
                    </span>
                    <h4 className="text-xs font-bold text-ink truncate max-w-[200px]" title={v.title}>
                      {v.title}
                    </h4>
                  </div>
                  {canRestore && (
                    <button
                      onClick={() => handleRestore(v)}
                      disabled={restoringId === v.id}
                      className="px-2.5 py-1 rounded-sm bg-paper-light hover:bg-paper-cream text-ink text-[11px] font-bold border-2 border-ink-border shadow-xs active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-1 cursor-pointer transition disabled:opacity-50"
                      title="Restore this version"
                    >
                      {restoringId === v.id ? (
                        <Loader2 className="w-3 h-3 animate-spin text-coral" />
                      ) : (
                        <RotateCcw className="w-3 h-3 text-coral" />
                      )}
                      <span>Restore</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-ink-muted pt-1 border-t border-ink-border/20">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-ink-muted" />
                    <span>{v.created_by_username || "Collaborator"}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-ink-muted" />
                    <span>{formatDateTime(v.created_at)}</span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
