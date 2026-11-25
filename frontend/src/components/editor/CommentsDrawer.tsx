"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  MessageSquare,
  Send,
  CheckCircle2,
  Circle,
  Trash2,
  Loader2,
  AlertCircle,
  Filter,
} from "lucide-react";
import {
  apiAddComment,
  apiDeleteComment,
  apiGetComments,
  apiUpdateComment,
  DocumentCommentItem,
} from "@/lib/config";

interface CommentsDrawerProps {
  documentId: string;
  token: string;
  currentUserEmail?: string;
  isOwnerOrEditor: boolean;
  isOpen: boolean;
  onClose: () => void;
  onCommentCountChange?: (count: number) => void;
}

export default function CommentsDrawer({
  documentId,
  token,
  currentUserEmail,
  isOwnerOrEditor,
  isOpen,
  onClose,
  onCommentCountChange,
}: CommentsDrawerProps) {
  const [comments, setComments] = useState<DocumentCommentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newCommentText, setNewCommentText] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [filterResolved, setFilterResolved] = useState<"all" | "open">("open");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadComments = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await apiGetComments(token, documentId);
      setComments(res.items);
      const openCount = res.items.filter((c) => !c.is_resolved).length;
      onCommentCountChange?.(openCount);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load comments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, documentId, token]);

  if (!isOpen) return null;

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    try {
      setSubmitting(true);
      setErrorMsg(null);
      await apiAddComment(token, documentId, newCommentText.trim());
      setNewCommentText("");
      await loadComments();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to post comment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleResolve = async (comment: DocumentCommentItem) => {
    try {
      await apiUpdateComment(token, documentId, comment.id, {
        is_resolved: !comment.is_resolved,
      });
      await loadComments();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update resolution state.");
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      await apiDeleteComment(token, documentId, commentId);
      await loadComments();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to delete comment.");
    }
  };

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  const displayedComments =
    filterResolved === "open"
      ? comments.filter((c) => !c.is_resolved)
      : comments;

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
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-ink">Comments & Notes</h2>
              <p className="text-xs text-ink-muted">Collaborative inline discussion thread</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-sm text-ink-muted hover:text-ink hover:bg-paper-cream border-2 border-transparent hover:border-ink-border transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="px-4 py-2 bg-paper border-b border-ink-border/30 flex items-center justify-between text-xs font-bold text-ink-muted">
          <span className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            <span>Show:</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setFilterResolved("open")}
              className={`px-2.5 py-1 rounded-sm border transition text-xs font-bold cursor-pointer ${
                filterResolved === "open"
                  ? "bg-coral text-white border-ink-border shadow-xs"
                  : "bg-paper-light text-ink border-transparent hover:border-ink-border"
              }`}
            >
              Open ({comments.filter((c) => !c.is_resolved).length})
            </button>
            <button
              onClick={() => setFilterResolved("all")}
              className={`px-2.5 py-1 rounded-sm border transition text-xs font-bold cursor-pointer ${
                filterResolved === "all"
                  ? "bg-coral text-white border-ink-border shadow-xs"
                  : "bg-paper-light text-ink border-transparent hover:border-ink-border"
              }`}
            >
              All ({comments.length})
            </button>
          </div>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="mx-4 mt-3 p-2 bg-coral-light border border-coral text-coral text-xs font-bold rounded-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Comments stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-ink-muted">
              <Loader2 className="w-6 h-6 animate-spin mb-2 text-coral" />
              <p className="text-xs font-bold">Loading comments...</p>
            </div>
          ) : displayedComments.length === 0 ? (
            <div className="py-12 text-center text-ink-muted">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs font-bold">
                {filterResolved === "open"
                  ? "No open comments."
                  : "No comments posted yet."}
              </p>
              <p className="text-[11px] mt-1">Start a discussion using the box below.</p>
            </div>
          ) : (
            displayedComments.map((c) => {
              const isAuthor = currentUserEmail && c.user_email.toLowerCase() === currentUserEmail.toLowerCase();
              return (
                <div
                  key={c.id}
                  className={`p-3 bg-white border-2 border-ink-border rounded-sm shadow-retro space-y-2 transition ${
                    c.is_resolved ? "opacity-60 bg-paper-light" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-xs bg-ink text-white font-extrabold text-[10px] flex items-center justify-center uppercase">
                        {c.user_username.slice(0, 2)}
                      </div>
                      <span className="text-xs font-extrabold text-ink">{c.user_username}</span>
                    </div>
                    <span className="text-[11px] text-ink-muted">{formatDateTime(c.created_at)}</span>
                  </div>

                  <p className="text-xs font-medium text-ink leading-relaxed whitespace-pre-wrap">
                    {c.content}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-ink-border/20 text-xs">
                    <button
                      onClick={() => handleToggleResolve(c)}
                      className={`inline-flex items-center gap-1 text-[11px] font-bold cursor-pointer transition ${
                        c.is_resolved
                          ? "text-retroGreen hover:text-ink"
                          : "text-ink-muted hover:text-retroGreen"
                      }`}
                    >
                      {c.is_resolved ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-retroGreen" />
                          <span>Resolved</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-3.5 h-3.5" />
                          <span>Mark Resolved</span>
                        </>
                      )}
                    </button>

                    {(isAuthor || isOwnerOrEditor) && (
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-[11px] text-ink-muted hover:text-coral transition p-1 cursor-pointer"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Post comment input box */}
        <div className="p-4 border-t-2 border-ink-border bg-paper-light">
          <form onSubmit={handleAddComment} className="space-y-2">
            <textarea
              rows={2}
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Leave feedback or notes for the team..."
              className="w-full p-2.5 text-xs font-medium bg-white border-2 border-ink-border rounded-sm focus:outline-none focus:ring-1 focus:ring-coral text-ink resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting || !newCommentText.trim()}
                className="px-3.5 py-1.5 rounded-sm bg-coral text-white text-xs font-extrabold border-2 border-ink-border shadow-retro hover:bg-coral-hover active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Comment</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
