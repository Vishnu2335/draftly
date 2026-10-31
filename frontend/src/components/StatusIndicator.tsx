"use client";

import React, { useEffect, useState } from "react";
import {
  fetchHealthStatus,
  HealthCheckResponse,
  API_BASE_URL,
} from "@/lib/config";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Server,
  Database,
} from "lucide-react";

export default function StatusIndicator() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHealthStatus();
      setHealth(data);
      setLastChecked(new Date());
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Unable to reach backend API"
      );
      setHealth(null);
      setLastChecked(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="bg-white border border-borderTone rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-warmStone mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-semibold text-terracotta uppercase tracking-wider">
              Diagnostic Telemetry
            </span>
            <span className="inline-block w-2 h-2 rounded-full bg-sage"></span>
          </div>
          <h3 className="text-xl font-bold text-forest editorial-title">
            Phase 1 System Connectivity
          </h3>
          <p className="text-xs sm:text-sm text-mutedText">
            Targeting backend at{" "}
            <code className="bg-warmStone-light px-2 py-0.5 rounded text-forest font-mono text-xs">
              {API_BASE_URL}
            </code>
          </p>
        </div>

        <button
          onClick={checkStatus}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-warmStone-light hover:bg-warmStone text-forest border border-borderTone rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Refresh Diagnostics
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Backend API Card */}
        <div className="p-5 rounded-xl border border-borderTone bg-warmStone-light/50 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-forest text-white flex items-center justify-center">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-forest text-sm">
                  FastAPI Backend Service
                </h4>
                <span className="text-xs text-mutedText">Python 3.11+ • Uvicorn</span>
              </div>
            </div>

            {loading ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-warmStone text-mutedText">
                Checking...
              </span>
            ) : health ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sage-light text-sage-dark border border-sage/40">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Online (v{health.version})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                <AlertCircle className="w-3.5 h-3.5" />
                Offline
              </span>
            )}
          </div>

          <div className="text-xs text-mutedText border-t border-borderTone/60 pt-3 mt-2">
            {error ? (
              <p className="text-red-700">
                Connection error: {error}. Ensure FastAPI is running on port 8000.
              </p>
            ) : health ? (
              <p className="text-forest">
                Operational environment: <strong className="capitalize">{health.environment}</strong>. Health endpoint responding 200 OK.
              </p>
            ) : (
              <p>Waiting for backend response...</p>
            )}
          </div>
        </div>

        {/* Supabase Database Card */}
        <div className="p-5 rounded-xl border border-borderTone bg-warmStone-light/50 flex flex-col justify-between">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-terracotta text-white flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-forest text-sm">
                  Supabase PostgreSQL
                </h4>
                <span className="text-xs text-mutedText">SQLAlchemy 2.0 Async</span>
              </div>
            </div>

            {loading ? (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-warmStone text-mutedText">
                Checking...
              </span>
            ) : health?.database.status === "connected" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sage-light text-sage-dark border border-sage/40">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connected
              </span>
            ) : health?.database.status === "unconfigured" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                <Clock className="w-3.5 h-3.5" />
                Unconfigured (Ready)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                <AlertCircle className="w-3.5 h-3.5" />
                Disconnected
              </span>
            )}
          </div>

          <div className="text-xs text-mutedText border-t border-borderTone/60 pt-3 mt-2">
            {health?.database ? (
              <div>
                <p className="text-forest mb-1">{health.database.message}</p>
                {health.database.latency_ms !== null && (
                  <p className="font-mono text-[11px] text-mutedText">
                    Roundtrip Latency: {health.database.latency_ms} ms
                  </p>
                )}
              </div>
            ) : (
              <p>
                Database diagnostics will be reported once backend connection is active.
              </p>
            )}
          </div>
        </div>
      </div>

      {lastChecked && (
        <div className="mt-4 text-right">
          <span className="text-[11px] font-mono text-mutedText">
            Last probe: {lastChecked.toLocaleTimeString()}
          </span>
        </div>
      )}
    </div>
  );
}

