"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogIn, LogOut, FileText, LayoutDashboard } from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-paper-cream text-ink border-b-2 border-ink-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo (Always navigates to public landing page) */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-sm bg-coral border-2 border-ink-border flex items-center justify-center text-white font-sans font-extrabold text-xl shadow-retro group-hover:bg-coral-hover transition-colors">
            D
          </div>
          <div className="flex items-center gap-2">
            <span className="font-sans text-xl font-extrabold tracking-tight text-ink">
              Draftly
            </span>
            <span className="border border-ink-border bg-paper-light text-ink text-[10px] font-bold uppercase px-2 py-0.5 rounded-sm shadow-[1px_1px_0px_#171717]">
              Workspace
            </span>
          </div>
        </Link>

        {/* Navigation & Controls */}
        <nav className="flex items-center gap-3 sm:gap-5">
          {/* Main Navigation Links */}
          <div className="hidden sm:flex items-center gap-4 text-xs font-bold">
            <Link
              href="/"
              className={`transition-colors ${
                pathname === "/"
                  ? "text-coral underline underline-offset-4 decoration-2"
                  : "text-ink hover:text-coral"
              }`}
            >
              Overview
            </Link>

            {isAuthenticated && (
              <Link
                href="/dashboard"
                className={`transition-colors ${
                  pathname?.startsWith("/dashboard") || pathname?.startsWith("/documents")
                    ? "text-coral underline underline-offset-4 decoration-2"
                    : "text-ink hover:text-coral"
                }`}
              >
                My Documents
              </Link>
            )}
          </div>

          <div className="h-4 w-[2px] bg-ink-border mx-1 hidden sm:block" />

          {/* User Auth Actions */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/dashboard"
                className="inline-flex sm:hidden items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs font-bold bg-paper-light border-2 border-ink-border text-ink shadow-retro"
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-coral" />
                <span>Docs</span>
              </Link>

              <div className="flex items-center gap-2 px-2.5 py-1 rounded-sm bg-paper-light border-2 border-ink-border text-xs font-semibold shadow-retro">
                <div className="w-6 h-6 rounded-full border border-ink-border bg-coral text-white flex items-center justify-center text-[10px] font-bold uppercase">
                  {user.username.charAt(0)}
                </div>
                <span className="text-ink font-bold max-w-[110px] truncate hidden sm:inline">
                  {user.username}
                </span>
              </div>

              <button
                onClick={logout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold bg-paper-light hover:bg-paper-dark text-ink border-2 border-ink-border shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer"
                title="Sign out of Draftly"
              >
                <LogOut className="w-3.5 h-3.5 text-ink" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm text-xs font-bold bg-paper-light hover:bg-paper-dark text-ink border-2 border-ink-border shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              >
                <LogIn className="w-3.5 h-3.5 text-coral" />
                <span>Sign In</span>
              </Link>

              <Link
                href="/register"
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-sm text-xs font-extrabold bg-coral hover:bg-coral-hover text-white border-2 border-ink-border shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              >
                <span>Create Account</span>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
