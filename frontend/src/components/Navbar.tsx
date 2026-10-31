"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { LogIn, LogOut, ShieldCheck, Terminal, User as UserIcon } from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-forest text-white border-b border-forest-light shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-lg bg-terracotta flex items-center justify-center text-white font-serif font-bold text-xl shadow-sm group-hover:bg-terracotta-dark transition-colors">
            D
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold tracking-tight text-white">
                Draftly
              </span>
              <span className="bg-sage/20 text-sage text-[10px] font-semibold uppercase px-2 py-0.5 rounded border border-sage/30">
                Phase 2
              </span>
            </div>
            <p className="text-[10px] text-warmStone-light/60 tracking-wider uppercase font-mono hidden sm:block">
              Modern Document Workspace
            </p>
          </div>
        </Link>

        {/* Navigation & Auth Controls */}
        <nav className="flex items-center gap-2 sm:gap-4">
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-warmStone-light hover:text-white hover:bg-forest-light rounded-md transition-colors"
          >
            <Terminal className="w-3.5 h-3.5 text-sage" />
            <span className="hidden sm:inline">API Docs</span>
          </a>

          <div className="h-4 w-[1px] bg-warmStone/20 mx-1 hidden sm:block"></div>

          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-forest-dark border border-forest-light text-xs font-mono">
                <div className="w-5 h-5 rounded-full bg-sage-dark text-white flex items-center justify-center text-[10px] font-bold uppercase">
                  {user.username.charAt(0)}
                </div>
                <span className="text-warmStone-light font-medium max-w-[120px] truncate">
                  {user.username}
                </span>
              </div>

              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-warmStone-light/10 hover:bg-red-900/30 text-warmStone-light hover:text-red-200 border border-warmStone/15 transition-all cursor-pointer"
                title="Sign out of Draftly"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-warmStone-light hover:text-white hover:bg-forest-light transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-sage" />
                Sign In
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-terracotta hover:bg-terracotta-dark text-white transition-all shadow-sm"
              >
                Create Account
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
