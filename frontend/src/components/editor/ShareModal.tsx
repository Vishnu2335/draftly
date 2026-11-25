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
      className="fixed inset-0 z-50 flex items-center justify-center bg-draftly-forest/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-draftly-stone overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-draftly-stone/60 bg-draftly-ivory/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-draftly-forest/10 flex items-center justify-center text-draftly-forest">
              <Users className="w-5 h-5 text-draftly-forest" />
            </div>
            <div>
              <h2 className="text-lg font-serif font-bold text-draftly-forest tracking-tight">
                Share Document
              </h2>
              <p className="text-xs text-draftly-forest/65">
                Manage collaborator permissions and invite teammates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-draftly-forest/60 hover:text-draftly-forest hover:bg-draftly-stone/50 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span className="flex-1 leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="flex-1 leading-relaxed">{successMessage}</span>
          </div>
        )}

        <div className="p-6 space-y-6">
          {/* Invite Form */}
          <form onSubmit={handleInvite} className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-draftly-forest/75">
              Invite Collaborator
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  required
                  placeholder="collaborator@example.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full pl-3.5 pr-3 py-2 text-sm bg-draftly-ivory/60 border border-draftly-stone rounded-xl focus:outline-none focus:ring-2 focus:ring-draftly-forest/30 focus:border-draftly-forest transition"
                  disabled={submitting}
                />
              </div>

              <select
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value as "editor" | "viewer")}
                className="px-3 py-2 text-xs font-medium bg-draftly-ivory/60 border border-draftly-stone rounded-xl text-draftly-forest focus:outline-none focus:ring-2 focus:ring-draftly-forest/30 cursor-pointer"
                disabled={submitting}
              >
                <option value="viewer">Viewer (Read-only)</option>
                <option value="editor">Editor (Can edit)</option>
              </select>

              <button
                type="submit"
                disabled={submitting || !emailInput.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-draftly-forest hover:bg-draftly-forest/90 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-sm transition"
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
            <p className="text-[11px] text-draftly-forest/60">
              User must be registered with Draftly. Editors can edit content; Viewers have read-only access.
            </p>
          </form>

          {/* Collaborator List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-draftly-forest/75">
                People with access
              </h3>
              {shareData && (
                <span className="text-[11px] text-draftly-forest/60">
                  {shareData.collaborators.length + 1} person{shareData.collaborators.length !== 0 ? "s" : ""}
                </span>
              )}
            </div>

            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center text-draftly-forest/50 space-y-2">
                <Loader2 className="w-5 h-5 animate-spin text-draftly-forest" />
                <span className="text-xs">Loading collaborators...</span>
              </div>
            ) : (
              <div className="divide-y divide-draftly-stone/60 max-h-60 overflow-y-auto pr-1">
                {/* Authoritative Owner */}
                {shareData && (
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-draftly-terracotta/20 text-draftly-terracotta flex items-center justify-center text-xs font-bold shrink-0">
                        {shareData.owner.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-draftly-forest truncate">
                            {shareData.owner.username}
                          </p>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <Crown className="w-2.5 h-2.5 text-amber-600" />
                            Owner
                          </span>
                        </div>
                        <p className="text-[11px] text-draftly-forest/60 truncate">
                          {shareData.owner.email}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-draftly-forest/60 font-medium">Author</span>
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
                        <div className="w-8 h-8 rounded-full bg-draftly-sage/25 text-draftly-forest flex items-center justify-center text-xs font-bold shrink-0">
                          {collab.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-draftly-forest truncate">
                            {collab.username}
                          </p>
                          <p className="text-[11px] text-draftly-forest/60 truncate">
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
                          className="px-2.5 py-1 text-xs font-medium bg-draftly-ivory/80 border border-draftly-stone rounded-lg text-draftly-forest cursor-pointer focus:outline-none focus:ring-1 focus:ring-draftly-forest"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                        </select>

                        <button
                          onClick={() => handleRevoke(collab.user_id, collab.email)}
                          disabled={isActioning}
                          className="p-1.5 text-draftly-forest/40 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Revoke collaborator access"
                        >
                          {isActioning ? (
                            <Loader2 className="w-4 h-4 animate-spin text-draftly-forest" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {shareData && shareData.collaborators.length === 0 && (
                  <div className="py-6 text-center text-xs text-draftly-forest/50">
                    No collaborators yet. Invite teammates using their email address above.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-draftly-ivory/60 border-t border-draftly-stone/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-draftly-stone/60 hover:bg-draftly-stone text-draftly-forest text-xs font-semibold rounded-xl transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

