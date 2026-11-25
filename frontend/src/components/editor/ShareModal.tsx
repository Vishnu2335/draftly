"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Users,
  UserPlus,
  Shield,
  Trash2,
  Check,
  AlertCircle,
  Loader2,
  Crown,
} from "lucide-react";
import {
  apiGetDocumentShares,
  apiRevokeShare,
  apiShareDocument,
  apiUpdateShareRole,
  DocumentCollaborator,
  DocumentShareListResponse,
} from "@/lib/config";

interface ShareModalProps {
  documentId: string;
  token: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ShareModal({
  documentId,
  token,
  isOpen,
  onClose,
}: ShareModalProps) {
  const [shareData, setShareData] = useState<DocumentShareListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [emailInput, setEmailInput] = useState<string>("");
  const [roleInput, setRoleInput] = useState<"editor" | "viewer">("viewer");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchShares = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const data = await apiGetDocumentShares(token, documentId);
      setShareData(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load collaborators.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setEmailInput("");
      setRoleInput("viewer");
      setErrorMessage(null);
      setSuccessMessage(null);
      fetchShares();
    }
  }, [isOpen, documentId, token]);

  if (!isOpen) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    try {
      setSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const newCollab = await apiShareDocument(
        token,
        documentId,
        emailInput.trim(),
        roleInput
      );

      setSuccessMessage(`Invited ${newCollab.email} as ${newCollab.role}.`);
      setEmailInput("");
      await fetchShares();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to share document.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (
    collaboratorUserId: string,
    newRole: "editor" | "viewer"
  ) => {
    try {
      setActionUserId(collaboratorUserId);
      setErrorMessage(null);
      setSuccessMessage(null);

      await apiUpdateShareRole(token, documentId, collaboratorUserId, newRole);
      setSuccessMessage(`Updated collaborator permissions to ${newRole}.`);
      await fetchShares();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update role.");
    } finally {
      setActionUserId(null);
    }
  };

  const handleRevoke = async (collaboratorUserId: string, email: string) => {
    if (!confirm(`Revoke document access for ${email}?`)) return;

    try {
      setActionUserId(collaboratorUserId);
      setErrorMessage(null);
      setSuccessMessage(null);

      await apiRevokeShare(token, documentId, collaboratorUserId);
      setSuccessMessage(`Revoked access for ${email}.`);
      await fetchShares();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to revoke access.");
    } finally {
      setActionUserId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-paper-light rounded-sm shadow-retro-xl border-2 border-ink-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-ink-border bg-paper-cream">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-coral border-2 border-ink-border flex items-center justify-center text-white shadow-retro">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-ink tracking-tight">
                Share Document
              </h2>
              <p className="text-xs text-ink-muted font-medium">
                Manage collaborator permissions and invite teammates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-sm text-ink-muted hover:text-ink hover:bg-paper-dark transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-coral-light border-2 border-ink-border rounded-sm flex items-start gap-2.5 text-xs text-ink shadow-retro font-medium">
            <AlertCircle className="w-4 h-4 text-coral shrink-0 mt-0.5" />
            <span className="flex-1 leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-retroGreen/15 border-2 border-ink-border rounded-sm flex items-start gap-2.5 text-xs text-ink shadow-retro font-medium">
            <Check className="w-4 h-4 text-retroGreen shrink-0 mt-0.5" />
            <span className="flex-1 leading-relaxed">{successMessage}</span>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Invite Form */}
          <form onSubmit={handleInvite} className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-ink">
              Invite Collaborator
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  required
                  placeholder="collaborator@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-paper-light border-2 border-ink-border rounded-sm focus:outline-none focus:bg-white focus:shadow-retro font-medium text-ink transition"
                  disabled={submitting}
                />
              </div>

              <select
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value as "editor" | "viewer")}
                className="px-3 py-2 text-xs font-bold bg-paper-cream border-2 border-ink-border rounded-sm text-ink focus:outline-none cursor-pointer"
                disabled={submitting}
              >
                <option value="viewer">Viewer (Read-only)</option>
                <option value="editor">Editor (Can edit)</option>
              </select>

              <button
                type="submit"
                disabled={submitting || !emailInput.trim()}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-coral hover:bg-coral-hover disabled:opacity-50 text-white text-xs font-extrabold border-2 border-ink-border rounded-sm shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition cursor-pointer"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Invite</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-ink-muted font-medium">
              User must be registered with Draftly. Editors can edit content; Viewers have read-only access.
            </p>
          </form>

          {/* Collaborator List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b-2 border-ink-border">
              <h3 className="text-xs font-bold uppercase tracking-wider text-ink">
                People with access
              </h3>
              {shareData && (
                <span className="text-[11px] font-bold text-ink-muted">
                  {shareData.collaborators.length + 1} person{shareData.collaborators.length !== 0 ? "s" : ""}
                </span>
              )}
            </div>

            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center text-ink-muted space-y-2">
                <Loader2 className="w-5 h-5 animate-spin text-ink" />
                <span className="text-xs font-bold">Loading collaborators...</span>
              </div>
            ) : (
              <div className="divide-y-2 divide-ink-border/20 max-h-60 overflow-y-auto pr-1">
                {/* Authoritative Owner */}
                {shareData && (
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-sm bg-coral border-2 border-ink-border text-white flex items-center justify-center text-xs font-extrabold shrink-0 shadow-[1px_1px_0px_#171717]">
                        {shareData.owner.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-ink truncate">
                            {shareData.owner.username}
                          </p>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-retroBlue text-white border border-ink-border">
                            <Crown className="w-2.5 h-2.5" />
                            Owner
                          </span>
                        </div>
                        <p className="text-[11px] text-ink-muted truncate font-mono">
                          {shareData.owner.email}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-ink-muted font-bold">Author</span>
                  </div>
                )}

                {/* Invited Collaborators */}
                {shareData?.collaborators.map((collab) => {
                  const isActioning = actionUserId === collab.user_id;

                  return (
                    <div
                      key={collab.id}
                      className="py-3 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-sm bg-paper-cream border-2 border-ink-border text-ink flex items-center justify-center text-xs font-bold shrink-0 shadow-[1px_1px_0px_#171717]">
                          {collab.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-ink truncate">
                            {collab.username}
                          </p>
                          <p className="text-[11px] text-ink-muted truncate font-mono">
                            {collab.email}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <select
                          value={collab.role}
                          onChange={(e) =>
                            handleRoleChange(
                              collab.user_id,
                              e.target.value as "editor" | "viewer"
                            )
                          }
                          disabled={isActioning}
                          className="px-2.5 py-1 text-xs font-bold bg-paper-cream border-2 border-ink-border rounded-sm text-ink cursor-pointer focus:outline-none"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                        </select>

                        <button
                          onClick={() => handleRevoke(collab.user_id, collab.email)}
                          disabled={isActioning}
                          className="p-1.5 text-ink-muted hover:text-coral hover:bg-coral-light rounded-sm border border-transparent hover:border-ink-border transition cursor-pointer"
                          title="Revoke collaborator access"
                        >
                          {isActioning ? (
                            <Loader2 className="w-4 h-4 animate-spin text-coral" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {shareData && shareData.collaborators.length === 0 && (
                  <div className="py-6 text-center text-xs text-ink-muted font-medium">
                    No collaborators yet. Invite teammates using their email address above.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-paper-cream border-t-2 border-ink-border flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-paper-light hover:bg-paper-dark border-2 border-ink-border text-ink text-xs font-bold rounded-sm shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
