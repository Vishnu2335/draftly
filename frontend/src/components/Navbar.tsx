"use client";

import React from "react";
import Link from "next/link";
import { FileText, Layers, ShieldCheck, Terminal } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-forest text-white border-b border-forest-light shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-terracotta flex items-center justify-center text-white font-serif font-bold text-xl shadow-sm">
            D
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold tracking-tight text-white">
                Draftly
              </span>
              <span className="bg-sage/20 text-sage text-[10px] font-semibold uppercase px-2 py-0.5 rounded border border-sage/30">
                Phase 1 Active
              </span>
            </div>
            <p className="text-[10px] text-warmStone-light/60 tracking-wider uppercase font-mono hidden sm:block">
              Modern Document Workspace
            </p>
          </div>
        </div>

        {/* Navigation Actions */}
        <nav className="flex items-center gap-2 sm:gap-4">
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-warmStone-light hover:text-white hover:bg-forest-light rounded-md transition-colors"
          >
            <Terminal className="w-3.5 h-3.5 text-sage" />
            <span className="hidden sm:inline">FastAPI Docs</span>
          </a>

          <a
            href="http://localhost:8000/health"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-warmStone-light hover:text-white hover:bg-forest-light rounded-md transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-terracotta" />
            <span className="hidden sm:inline">Health API</span>
          </a>

          <div className="h-4 w-[1px] bg-warmStone/20 mx-1 hidden sm:block"></div>

          <span className="text-xs font-mono text-sage/80 bg-forest-dark px-2.5 py-1 rounded border border-forest-light hidden md:inline-block">
            Next.js • FastAPI • Supabase
          </span>
        </nav>
      </div>
    </header>
  );
}
