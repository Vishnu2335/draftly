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
  Globe,
  Copy,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  apiGetDocumentShares,
  apiRevokeShare,
  apiShareDocument,
  apiUpdateShareRole,
  apiUpdateDocument,
  DocumentCollaborator,
  DocumentShareListResponse,
  DocumentItem,
} from "@/lib/config";

interface ShareModalProps {
  documentId: string;
  token: string;
  document?: DocumentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onDocumentUpdate?: (updatedDoc: DocumentItem) => void;
}

export default function ShareModal({
  documentId,
  token,
  document: currentDoc,
  isOpen,
  onClose,
  onDocumentUpdate,
}: ShareModalProps) {
  const [shareData, setShareData] = useState<DocumentShareListResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [emailInput, setEmailInput] = useState<string>("");
  const [roleInput, setRoleInput] = useState<"editor" | "viewer">("viewer");
  const [expirationDays, setExpirationDays] = useState<number>(0); // 0 = permanent
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Public link sharing state
  const [isPublic, setIsPublic] = useState<boolean>(currentDoc?.is_public || false);
  const [publicToken, setPublicToken] = useState<string | null>(currentDoc?.public_share_token || null);
  const [togglingPublic, setTogglingPublic] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

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
      setExpirationDays(0);
      setErrorMessage(null);
      setSuccessMessage(null);
      setCopiedLink(false);
      if (currentDoc) {
        setIsPublic(currentDoc.is_public || false);
        setPublicToken(currentDoc.public_share_token || null);
      }
      fetchShares();
    }
  }, [isOpen, documentId, token, currentDoc]);

  if (!isOpen) return null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    try {
      setSubmitting(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      const exp = expirationDays > 0 ? expirationDays : undefined;
      const newCollab = await apiShareDocument(
        token,
        documentId,
        emailInput.trim(),
        roleInput,
        exp
      );

      const expMsg = exp ? ` (access expires in ${exp} days)` : " (permanent access)";
      setSuccessMessage(`Invited ${newCollab.email} as ${newCollab.role}${expMsg}.`);
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

  const handleTogglePublicLink = async () => {
    try {
      setTogglingPublic(true);
      setErrorMessage(null);
      const nextPublic = !isPublic;
      const updated = await apiUpdateDocument(token, documentId, {
        is_public: nextPublic,
      });
      setIsPublic(updated.is_public || false);
      setPublicToken(updated.public_share_token || null);
      onDocumentUpdate?.(updated);
      setSuccessMessage(
        nextPublic
          ? "Public read-only link enabled."
          : "Public read-only link disabled."
      );
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update public link.");
    } finally {
      setTogglingPublic(false);
    }
  };

  const getPublicUrl = () => {
    if (typeof window === "undefined" || !publicToken) return "";
    return `${window.location.origin}/public/${publicToken}`;
  };

  const handleCopyLink = () => {
    const url = getPublicUrl();
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-paper-light rounded-sm shadow-retro-xl border-2 border-ink-border overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-ink-border bg-paper-cream shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-sm bg-coral border-2 border-ink-border flex items-center justify-center text-white shadow-retro">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-ink tracking-tight">
                Share & Permissions
              </h2>
              <p className="text-xs text-ink-muted font-medium">
                Collaborators, public access, and role permissions
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
          <div className="mx-6 mt-4 p-3 bg-coral-light border-2 border-ink-border rounded-sm flex items-start gap-2.5 text-xs text-ink shadow-retro font-medium shrink-0">
            <AlertCircle className="w-4 h-4 text-coral shrink-0 mt-0.5" />
            <span className="flex-1 leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3 bg-retroGreen/15 border-2 border-ink-border rounded-sm flex items-start gap-2.5 text-xs text-ink shadow-retro font-medium shrink-0">
            <Check className="w-4 h-4 text-retroGreen shrink-0 mt-0.5" />
            <span className="flex-1 leading-relaxed">{successMessage}</span>
          </div>
        )}

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Public Link Access Section */}
          <div className="p-3.5 bg-paper-cream border-2 border-ink-border rounded-sm shadow-retro space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-coral" />
                <div>
                  <h4 className="text-xs font-bold text-ink">Public Read-Only Link</h4>
                  <p className="text-[11px] text-ink-muted">Anyone with the link can view without signing in</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTogglePublicLink}
                disabled={togglingPublic}
                className={`px-3 py-1 text-xs font-extrabold border-2 border-ink-border rounded-sm transition cursor-pointer ${
                  isPublic
                    ? "bg-retroGreen text-white shadow-retro"
                    : "bg-paper-light text-ink hover:bg-white"
                }`}
              >
                {togglingPublic ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : isPublic ? (
                  "Enabled"
                ) : (
                  "Disabled"
                )}
              </button>
            </div>

            {isPublic && publicToken && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={getPublicUrl()}
                  className="flex-1 px-2.5 py-1 text-xs font-mono bg-white border border-ink-border rounded-sm text-ink truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-3 py-1 bg-coral hover:bg-coral-hover text-white text-xs font-extrabold border border-ink-border rounded-sm shadow-xs flex items-center gap-1 cursor-pointer transition shrink-0"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Invite Form with Duration Selection */}
          <form onSubmit={handleInvite} className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-ink">
              Invite Collaborator
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="email"
                required
                placeholder="collaborator@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="sm:col-span-6 px-3 py-2 text-xs bg-paper-light border-2 border-ink-border rounded-sm focus:outline-none focus:bg-white text-ink font-medium"
                disabled={submitting}
              />

              <select
                value={roleInput}
                onChange={(e) => setRoleInput(e.target.value as "editor" | "viewer")}
                className="sm:col-span-3 px-2 py-2 text-xs font-bold bg-paper-cream border-2 border-ink-border rounded-sm text-ink focus:outline-none cursor-pointer"
                disabled={submitting}
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>

              <select
                value={expirationDays}
                onChange={(e) => setExpirationDays(Number(e.target.value))}
                className="sm:col-span-3 px-2 py-2 text-xs font-bold bg-paper-cream border-2 border-ink-border rounded-sm text-ink focus:outline-none cursor-pointer"
                disabled={submitting}
                title="Access duration"
              >
                <option value={0}>Permanent</option>
                <option value={7}>7 Days</option>
                <option value={30}>30 Days</option>
              </select>
            </div>

            <div className="flex justify-between items-center pt-1">
              <p className="text-[11px] text-ink-muted">
                Choose access duration and role (Viewer: read-only, Editor: can edit content).
              </p>
              <button
                type="submit"
                disabled={submitting || !emailInput.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-coral hover:bg-coral-hover disabled:opacity-50 text-white text-xs font-extrabold border-2 border-ink-border rounded-sm shadow-retro active:translate-x-[1px] active:translate-y-[1px] transition cursor-pointer shrink-0"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Invite</span>
                  </>
                )}
              </button>
            </div>
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
              <div className="py-6 flex flex-col items-center justify-center text-ink-muted space-y-2">
                <Loader2 className="w-5 h-5 animate-spin text-ink" />
                <span className="text-xs font-bold">Loading collaborators...</span>
              </div>
            ) : (
              <div className="divide-y-2 divide-ink-border/20 max-h-52 overflow-y-auto pr-1">
                {/* Authoritative Owner */}
                {shareData && (
                  <div className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-sm bg-coral border-2 border-ink-border text-white flex items-center justify-center text-xs font-extrabold shrink-0 shadow-[1px_1px_0px_#171717]">
                        {shareData.owner.username.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-ink truncate">
                            {shareData.owner.username}
                          </p>
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-xs text-[9px] font-bold bg-retroBlue text-white border border-ink-border">
                            <Crown className="w-2.5 h-2.5" />
                            Owner
                          </span>
                        </div>
                        <p className="text-[10px] text-ink-muted truncate font-mono">
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
                      className="py-2.5 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-sm bg-paper-cream border-2 border-ink-border text-ink flex items-center justify-center text-xs font-bold shrink-0 shadow-[1px_1px_0px_#171717]">
                          {collab.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-ink truncate">
                              {collab.username}
                            </p>
                            {collab.expires_at && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.2 rounded-xs border flex items-center gap-1 ${
                                  collab.is_expired
                                    ? "bg-coral-light text-coral border-coral"
                                    : "bg-paper-cream text-ink-muted border-ink-border/40"
                                }`}
                              >
                                <Clock className="w-2.5 h-2.5" />
                                {collab.is_expired ? "Expired" : "Expiring"}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-ink-muted truncate font-mono">
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
                          className="px-2 py-1 text-xs font-bold bg-paper-cream border-2 border-ink-border rounded-sm text-ink cursor-pointer focus:outline-none"
                        >
                          <option value="viewer">Viewer</option>
                          <option value="editor">Editor</option>
                        </select>

                        <button
                          onClick={() => handleRevoke(collab.user_id, collab.email)}
                          disabled={isActioning}
                          className="p-1 text-ink-muted hover:text-coral hover:bg-coral-light rounded-sm border border-transparent hover:border-ink-border transition cursor-pointer"
                          title="Revoke collaborator access"
                        >
                          {isActioning ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-coral" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {shareData && shareData.collaborators.length === 0 && (
                  <div className="py-4 text-center text-xs text-ink-muted font-medium">
                    No collaborators yet. Invite teammates using their email address above.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-paper-cream border-t-2 border-ink-border flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-paper-light hover:bg-paper-dark border-2 border-ink-border text-ink text-xs font-bold rounded-sm shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
