"use client";

import Link from "next/link";
import StatusIndicator from "@/components/StatusIndicator";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowRight,
  Database,
  KeyRound,
  Layout,
  Lock,
  Server,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Hero Card */}
      <section className="bg-forest text-white rounded-3xl p-8 sm:p-12 shadow-lg mb-10 relative overflow-hidden border border-forest-light">
        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terracotta/20 border border-terracotta/40 text-terracotta-light text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-terracotta" />
            Phase 3: Workspace Dashboard Active
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold font-serif tracking-tight text-white mb-4 leading-tight">
            Draftly Workspace
          </h1>

          <p className="text-base sm:text-lg text-warmStone-light font-light leading-relaxed mb-6 max-w-2xl">
            A modern, focused, distraction-free document workspace. Engineered
            with its own distinct editorial identity—free from Google
            Docs-style skeuomorphic margins, print rulers, and toolbar bloat.
          </p>

          {/* User Session Callout */}
          {isAuthenticated && user ? (
            <div className="space-y-4 mb-8">
              <div className="p-4 rounded-2xl bg-forest-dark border border-sage/30 flex items-center justify-between gap-4 max-w-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-sage-dark text-white flex items-center justify-center font-bold text-base uppercase">
                    {user.username.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-sm">
                        {user.username}
                      </span>
                      <span className="bg-sage/20 text-sage text-[10px] font-mono px-2 py-0.5 rounded">
                        Authenticated
                      </span>
                    </div>
                    <p className="text-xs text-warmStone-light/70 font-mono">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-sage font-mono">
                    Session Active
                  </span>
                </div>
              </div>

              <div>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold transition-all shadow-sm active:scale-95"
                >
                  <span>Open Workspace Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 mb-8">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold transition-all shadow-sm"
              >
                <span>Create Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-light hover:bg-forest-dark text-warmStone-light hover:text-white border border-warmStone/20 text-sm font-semibold transition-all"
              >
                <span>Sign In</span>
              </Link>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-warmStone/15 font-mono text-xs text-warmStone-light/80">
            <div>
              <span className="block text-terracotta font-bold text-base sm:text-lg">
                Phase 2
              </span>
              <span>Authentication</span>
            </div>
            <div>
              <span className="block text-sage font-bold text-base sm:text-lg">
                Argon2id
              </span>
              <span>Password Hashing</span>
            </div>
            <div>
              <span className="block text-white font-bold text-base sm:text-lg">
                HS256 JWT
              </span>
              <span>Signed Bearer Tokens</span>
            </div>
            <div>
              <span className="block text-warmStone font-bold text-base sm:text-lg">
                Supabase
              </span>
              <span>PostgreSQL Schema</span>
            </div>
          </div>
        </div>

        {/* Decorative backdrop accent */}
        <div className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full bg-terracotta/10 pointer-events-none blur-3xl"></div>
      </section>

      {/* Live System Diagnostics */}
      <section className="mb-10">
        <StatusIndicator />
      </section>

      {/* Phase 2 Architecture Capabilities */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white border border-borderTone rounded-2xl p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-forest-light text-sage flex items-center justify-center mb-4">
            <KeyRound className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-forest mb-2 font-serif">
            Argon2 Password Hashing
          </h3>
          <p className="text-xs sm:text-sm text-mutedText leading-relaxed mb-4">
            Passwords are cryptographically salted and hashed using Argon2id
            with 64 MiB memory cost and 3 iterations, completely preventing
            plaintext exposure.
          </p>
          <ul className="text-xs font-mono text-forest space-y-1 bg-warmStone-light p-3 rounded-lg">
            <li>• Memory-hard Argon2id</li>
            <li>• Salted per-user hash</li>
            <li>• Zero plaintext storage</li>
          </ul>
        </div>

        <div className="bg-white border border-borderTone rounded-2xl p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-forest text-white flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-forest mb-2 font-serif">
            JWT Session Management
          </h3>
          <p className="text-xs sm:text-sm text-mutedText leading-relaxed mb-4">
            Stateless JWT access tokens signed with a cryptographically secure
            32-byte secret. Tokens validate user identity and enforce 30-minute expiration.
          </p>
          <ul className="text-xs font-mono text-forest space-y-1 bg-warmStone-light p-3 rounded-lg">
            <li>• HS256 JWT signature</li>
            <li>• Auto-generated 32B key</li>
            <li>• GET /api/v1/auth/me guard</li>
          </ul>
        </div>

        <div className="bg-white border border-borderTone rounded-2xl p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-terracotta text-white flex items-center justify-center mb-4">
            <UserCheck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-forest mb-2 font-serif">
            Identity &amp; User Model
          </h3>
          <p className="text-xs sm:text-sm text-mutedText leading-relaxed mb-4">
            SQLAlchemy 2.0 User model with UUID primary keys, unique email
            indexes, and full Alembic migration for Supabase PostgreSQL.
          </p>
          <ul className="text-xs font-mono text-forest space-y-1 bg-warmStone-light p-3 rounded-lg">
            <li>• Table: users (UUID PK)</li>
            <li>• Duplicate email guard</li>
            <li>• Migration: 0001_create_users</li>
          </ul>
        </div>
      </section>

      {/* Phase Progression Gate Notification */}
      <section className="bg-warmStone-light border border-borderTone rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-forest text-sage flex items-center justify-center flex-shrink-0 mt-1">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base sm:text-lg font-bold text-forest">
                Phase-by-Phase Gated Development
              </h4>
              <p className="text-xs sm:text-sm text-mutedText max-w-2xl leading-relaxed">
                Phase 2 (Authentication &amp; User Management) is fully implemented
                and verified with automated tests. In accordance with PRD Section 17,
                subsequent milestones (Phase 3 Workspace Dashboard, Phase 4 Document
                Editor) remain locked until explicit stakeholder review and approval.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center font-mono text-xs font-semibold px-3 py-1.5 rounded-lg bg-sage-light text-sage-dark border border-sage/40">
            Phase 2: Complete &amp; Verified
          </div>
        </div>
      </section>
    </div>
  );
}
