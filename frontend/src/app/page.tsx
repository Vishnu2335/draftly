"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowRight,
  FileEdit,
  Share2,
  UploadCloud,
} from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Hero Header Section */}
      <section className="text-center mb-12 sm:mb-16">
        <h1 className="text-4xl sm:text-6xl font-extrabold font-sans text-ink tracking-tight mb-4">
          Create &amp; Collaborate with Draftly
        </h1>
        <p className="text-base sm:text-lg text-ink-muted max-w-2xl mx-auto font-medium leading-relaxed">
          Looking for focus? Experience a modern, distraction-free document workspace
          to write, import, and share with your team today.
        </p>
      </section>

      {/* Main Content Layout (Sidebar Features + Showcase Cards) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Feature Filters Card */}
        <div className="lg:col-span-4 bg-paper-light border-2 border-ink-border rounded-sm p-6 shadow-retro-md">
          <div className="border-b-2 border-ink-border pb-3 mb-5 flex items-center justify-between">
            <h3 className="font-extrabold text-ink text-base uppercase tracking-wider">
              Workspace Capabilities
            </h3>
            <span className="w-2.5 h-2.5 rounded-full bg-retroGreen border border-ink-border" />
          </div>

          <div className="space-y-4 text-xs font-semibold text-ink">
            <div>
              <p className="text-[11px] text-ink-muted font-bold uppercase mb-2">
                Core Editorial Features
              </p>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm border-2 border-ink-border bg-coral text-white flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </div>
                  <span>Rich-Text Formatting (Tiptap)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm border-2 border-ink-border bg-coral text-white flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </div>
                  <span>Auto-Save Debounced Sync</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm border-2 border-ink-border bg-coral text-white flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </div>
                  <span>Clean Sans Typography</span>
                </li>
              </ul>
            </div>

            <div className="pt-3 border-t-2 border-ink-border">
              <p className="text-[11px] text-ink-muted font-bold uppercase mb-2">
                Collaboration &amp; Ingestion
              </p>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm border-2 border-ink-border bg-retroBlue text-white flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </div>
                  <span>Role Permissions (Owner / Editor / Viewer)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm border-2 border-ink-border bg-retroBlue text-white flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </div>
                  <span>Multi-Format File Import (.md, .txt, .docx)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm border-2 border-ink-border bg-retroBlue text-white flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </div>
                  <span>Instant Revocation &amp; Transfer</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right Column: Reference-styled Feature Cards */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-extrabold text-ink">
              Workspace Overview
            </h2>
            <span className="border-2 border-ink-border bg-paper-cream px-3 py-1 rounded-sm text-xs font-bold text-ink shadow-[1px_1px_0px_#171717]">
              3 core modules
            </span>
          </div>

          {/* Card 1: Editorial Atelier */}
          <div className="bg-paper-light border-2 border-ink-border rounded-sm p-6 shadow-retro-md hover:shadow-retro-lg transition-all">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-sm bg-coral border-2 border-ink-border flex items-center justify-center text-white font-extrabold text-lg shadow-retro flex-shrink-0">
                  <FileEdit className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-ink">
                      Distraction-Free Rich-Text Editor
                    </h3>
                    <span className="border border-ink-border bg-retroGreen text-white text-[11px] font-bold px-2 py-0.5 rounded-sm">
                      Full Formatting
                    </span>
                    <span className="border border-ink-border bg-coral text-white text-[11px] font-bold px-2 py-0.5 rounded-sm">
                      Autosave
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted font-medium">
                    Editorial Atelier • Clean Typography
                  </p>
                </div>
              </div>

              <div className="text-xs font-semibold text-ink-muted sm:text-right">
                Editorial Surface
              </div>
            </div>

            <ul className="text-xs sm:text-sm text-ink-soft space-y-1.5 mb-6 pl-4 font-normal">
              <li>• Focused formatting toolbar featuring headings, inline styles, alignments, and lists</li>
              <li>• Automatic background saving ensures seamless progress persistence at all times</li>
            </ul>

            <div className="flex justify-end pt-3 border-t border-ink-border/30">
              <Link
                href={isAuthenticated ? "/dashboard" : "/register"}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-sm bg-coral hover:bg-coral-hover text-white border-2 border-ink-border text-xs font-extrabold shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              >
                <span>Start Writing</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Collaboration & Sharing */}
          <div className="bg-paper-light border-2 border-ink-border rounded-sm p-6 shadow-retro-md hover:shadow-retro-lg transition-all">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-sm bg-retroBlue border-2 border-ink-border flex items-center justify-center text-white font-extrabold text-lg shadow-retro flex-shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-ink">
                      Role-Based Document Collaboration
                    </h3>
                    <span className="border border-ink-border bg-retroBlue text-white text-[11px] font-bold px-2 py-0.5 rounded-sm">
                      Owner &amp; Editor
                    </span>
                    <span className="border border-ink-border bg-retroGreen text-white text-[11px] font-bold px-2 py-0.5 rounded-sm">
                      Viewer Guard
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted font-medium">
                    Collaboration Engine • Secure Access
                  </p>
                </div>
              </div>

              <div className="text-xs font-semibold text-ink-muted sm:text-right">
                Team Sharing
              </div>
            </div>

            <ul className="text-xs sm:text-sm text-ink-soft space-y-1.5 mb-6 pl-4 font-normal">
              <li>• Share documents securely with team members using granular Owner, Editor, and Viewer permissions</li>
              <li>• Manage collaborators, update access privileges, or revoke sharing instantly</li>
            </ul>

            <div className="flex justify-end pt-3 border-t border-ink-border/30">
              <Link
                href={isAuthenticated ? "/dashboard" : "/register"}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-sm bg-coral hover:bg-coral-hover text-white border-2 border-ink-border text-xs font-extrabold shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              >
                <span>Share Documents</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 3: Multi-Format File Ingestion */}
          <div className="bg-paper-light border-2 border-ink-border rounded-sm p-6 shadow-retro-md hover:shadow-retro-lg transition-all">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-sm bg-retroGreen border-2 border-ink-border flex items-center justify-center text-white font-extrabold text-lg shadow-retro flex-shrink-0">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-ink">
                      Universal Document Import
                    </h3>
                    <span className="border border-ink-border bg-retroBlue text-white text-[11px] font-bold px-2 py-0.5 rounded-sm">
                      Markdown
                    </span>
                    <span className="border border-ink-border bg-coral text-white text-[11px] font-bold px-2 py-0.5 rounded-sm">
                      DOCX &amp; TXT
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted font-medium">
                    File Ingestion • Structure Preservation
                  </p>
                </div>
              </div>

              <div className="text-xs font-semibold text-ink-muted sm:text-right">
                Multi-Format
              </div>
            </div>

            <ul className="text-xs sm:text-sm text-ink-soft space-y-1.5 mb-6 pl-4 font-normal">
              <li>• Seamlessly import existing notes and manuscripts directly into your Draftly workspace</li>
              <li>• Preserves semantic document structure, headings, paragraphs, and list hierarchies</li>
            </ul>

            <div className="flex justify-end pt-3 border-t border-ink-border/30">
              <Link
                href={isAuthenticated ? "/dashboard" : "/register"}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-sm bg-coral hover:bg-coral-hover text-white border-2 border-ink-border text-xs font-extrabold shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              >
                <span>Import Files</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
