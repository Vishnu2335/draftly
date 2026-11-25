"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  apiGetPublicDocument,
  PublicDocumentItem,
} from "@/lib/config";
import DraftlyEditor from "@/components/editor/DraftlyEditor";
import {
  AlertCircle,
  FileText,
  Globe,
  Loader2,
  Printer,
  ShieldCheck,
  User,
  Calendar,
  LogIn,
} from "lucide-react";

export default function PublicDocumentPage() {
  const params = useParams();
  const token = params?.token as string;

  const [document, setDocument] = useState<PublicDocumentItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    loadPublicDoc();
  }, [token]);

  const loadPublicDoc = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const doc = await apiGetPublicDocument(token);
      setDocument(doc);
    } catch (err: any) {
      setErrorMsg(
        err.message || "This document is not public or the link has been disabled."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-ink animate-spin mb-3" />
        <p className="text-sm font-bold text-ink-muted">Loading public document...</p>
      </div>
    );
  }

  if (errorMsg || !document) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-14 h-14 rounded-sm bg-coral-light border-2 border-ink-border text-coral mx-auto flex items-center justify-center shadow-retro">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold font-sans text-ink">
          Document Unavailable
        </h2>
        <p className="text-xs sm:text-sm text-ink-muted max-w-md mx-auto font-medium">
          {errorMsg || "This link may have been revoked or is no longer public."}
        </p>
        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-coral hover:bg-coral-hover text-white border-2 border-ink-border font-extrabold text-sm shadow-retro transition"
          >
            Go to Draftly
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper">
      {/* Public Header */}
      <header className="bg-paper-cream border-b-2 border-ink-border sticky top-0 z-30 px-4 sm:px-8 py-3.5 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-ink font-sans font-extrabold text-lg tracking-tight hover:text-coral transition-colors"
            >
              <span className="p-1.5 bg-coral text-white rounded-sm border-2 border-ink-border shadow-[2px_2px_0px_#171717]">
                <FileText className="w-4 h-4" />
              </span>
              <span>Draftly</span>
            </Link>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-xs text-[11px] font-bold bg-white text-ink border border-ink-border">
              <Globe className="w-3 h-3 text-coral" />
              Public View
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-paper-light hover:bg-paper-cream text-ink text-xs font-bold border-2 border-ink-border shadow-retro active:translate-x-[1px] active:translate-y-[1px] transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-coral" />
              <span>Print</span>
            </button>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-coral hover:bg-coral-hover text-white text-xs font-extrabold border-2 border-ink-border shadow-retro active:translate-x-[1px] active:translate-y-[1px] transition"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Document Meta Banner */}
        <div className="bg-paper-light rounded-sm p-4 border-2 border-ink-border mb-6 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-ink-muted shadow-retro print:hidden">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-ink">
              <User className="w-3.5 h-3.5 text-coral" />
              <span>By <strong>@{document.owner_username}</strong></span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-ink-muted" />
              <span>Updated {formatDate(document.updated_at)}</span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-retroGreen" />
            <span>Read-only copy</span>
          </div>
        </div>

        {/* Document Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold font-sans text-ink mb-6 pb-3 border-b-2 border-ink-border">
          {document.title}
        </h1>

        {/* Read-only Document Content */}
        <div className="bg-white border-2 border-ink-border rounded-sm shadow-retro-xl p-6 sm:p-10 min-h-[500px]">
          <DraftlyEditor
            documentId={document.id}
            initialContent={document.content}
            token=""
            readOnly={true}
          />
        </div>
      </main>
    </div>
  );
}
