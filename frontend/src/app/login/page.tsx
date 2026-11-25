"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, ArrowRight, Lock, Mail, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);
    setApiError(null);

    // Client validation
    if (!email.trim() || !password) {
      setClientError("Please enter both your email address and password.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setClientError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err: unknown) {
      setApiError(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please verify your credentials."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-paper">
      <div className="max-w-md w-full bg-paper-light border-2 border-ink-border rounded-sm p-8 sm:p-10 shadow-retro-lg relative">
        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-sm bg-coral border-2 border-ink-border text-white items-center justify-center font-sans font-extrabold text-2xl shadow-retro mb-4">
            D
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-sans text-ink tracking-tight">
            Sign In to Draftly
          </h2>
          <p className="text-xs sm:text-sm text-ink-muted mt-1 font-medium">
            Access your focused document workspace
          </p>
        </div>

        {/* Error Banners */}
        {(clientError || apiError) && (
          <div className="mb-6 p-4 rounded-sm bg-coral-light border-2 border-ink-border text-ink text-xs sm:text-sm flex items-start gap-3 shadow-retro">
            <AlertCircle className="w-5 h-5 text-coral flex-shrink-0 mt-0.5" />
            <div className="flex-1 font-medium">
              <strong className="font-bold">Error:</strong> {clientError || apiError}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-sm bg-paper-light border-2 border-ink-border text-sm text-ink font-medium placeholder:text-ink-muted/60 focus:bg-white focus:outline-none focus:shadow-retro transition-all"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-bold text-ink uppercase tracking-wider mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-ink-muted">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-sm bg-paper-light border-2 border-ink-border text-sm text-ink font-medium placeholder:text-ink-muted/60 focus:bg-white focus:outline-none focus:shadow-retro transition-all"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-sm bg-coral hover:bg-coral-hover text-white border-2 border-ink-border font-extrabold text-sm shadow-retro active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Note */}
        <div className="mt-8 pt-6 border-t-2 border-ink-border text-center">
          <p className="text-xs text-ink-muted font-medium">
            Don&apos;t have a Draftly account?{" "}
            <Link
              href="/register"
              className="text-coral font-bold hover:underline"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
