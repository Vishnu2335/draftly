import StatusIndicator from "@/components/StatusIndicator";
import {
  Compass,
  FileCode2,
  Lock,
  Sparkles,
  Layers,
  ArrowRight,
  Database,
  Server,
  Layout,
} from "lucide-react";

export default function Home() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Hero Card */}
      <section className="bg-forest text-white rounded-3xl p-8 sm:p-12 shadow-lg mb-10 relative overflow-hidden border border-forest-light">
        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terracotta/20 border border-terracotta/40 text-terracotta-light text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-terracotta" />
            Phase 1 Foundation Active
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold font-serif tracking-tight text-white mb-4 leading-tight">
            Draftly Workspace
          </h1>

          <p className="text-base sm:text-lg text-warmStone-light font-light leading-relaxed mb-8 max-w-2xl">
            A modern, focused, distraction-free document workspace. Engineered
            with its own distinct editorial identity—free from Google
            Docs-style skeuomorphic margins, print rulers, and toolbar bloat.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-warmStone/15 font-mono text-xs text-warmStone-light/80">
            <div>
              <span className="block text-terracotta font-bold text-base sm:text-lg">
                Phase 1
              </span>
              <span>Foundation Setup</span>
            </div>
            <div>
              <span className="block text-sage font-bold text-base sm:text-lg">
                Next.js 14
              </span>
              <span>App Router + TS</span>
            </div>
            <div>
              <span className="block text-white font-bold text-base sm:text-lg">
                FastAPI
              </span>
              <span>Python 3.11+</span>
            </div>
            <div>
              <span className="block text-warmStone font-bold text-base sm:text-lg">
                Supabase
              </span>
              <span>PostgreSQL 15+</span>
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

      {/* Architecture & Foundation Overview */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white border border-borderTone rounded-2xl p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-forest-light text-sage flex items-center justify-center mb-4">
            <Layout className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-forest mb-2 font-serif">
            Frontend Architecture
          </h3>
          <p className="text-xs sm:text-sm text-mutedText leading-relaxed mb-4">
            Next.js App Router with TypeScript and Tailwind CSS. Customized with
            Draftly’s Forest Green, Warm Stone, Ivory, and Sage design tokens.
          </p>
          <ul className="text-xs font-mono text-forest space-y-1 bg-warmStone-light p-3 rounded-lg">
            <li>• /src/app (App Router)</li>
            <li>• /src/components (Reusable UI)</li>
            <li>• /src/lib/config.ts (API client)</li>
          </ul>
        </div>

        <div className="bg-white border border-borderTone rounded-2xl p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-forest text-white flex items-center justify-center mb-4">
            <Server className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-forest mb-2 font-serif">
            Backend Architecture
          </h3>
          <p className="text-xs sm:text-sm text-mutedText leading-relaxed mb-4">
            Python FastAPI REST service with Pydantic v2 settings, SQLAlchemy 2.0
            async engine, Alembic migrations, and CORS middleware.
          </p>
          <ul className="text-xs font-mono text-forest space-y-1 bg-warmStone-light p-3 rounded-lg">
            <li>• /app/main.py (FastAPI entry)</li>
            <li>• /app/core/database.py (SQLAlchemy)</li>
            <li>• /app/api/v1 (REST Router)</li>
          </ul>
        </div>

        <div className="bg-white border border-borderTone rounded-2xl p-6 shadow-sm">
          <div className="w-10 h-10 rounded-xl bg-terracotta text-white flex items-center justify-center mb-4">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-forest mb-2 font-serif">
            Database Integration
          </h3>
          <p className="text-xs sm:text-sm text-mutedText leading-relaxed mb-4">
            Configured for Supabase PostgreSQL using async connection strings.
            Connection verification checks database availability gracefully.
          </p>
          <ul className="text-xs font-mono text-forest space-y-1 bg-warmStone-light p-3 rounded-lg">
            <li>• DATABASE_URL via .env</li>
            <li>• Alembic async migrations</li>
            <li>• No tables created prematurely</li>
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
                Phase 1 (Project Foundation) is fully operational. In accordance with
                PRD Section 17, subsequent milestones (Phase 2 Authentication, Phase 3
                Dashboard, Phase 4 Editor) remain locked until explicit stakeholder
                review and gate approval.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center font-mono text-xs font-semibold px-3 py-1.5 rounded-lg bg-sage-light text-sage-dark border border-sage/40">
            Phase 1: Ready For Sign-Off
          </div>
        </div>
      </section>
    </div>
  );
}
