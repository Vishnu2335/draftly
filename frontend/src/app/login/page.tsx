"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, ArrowRight, Lock, Mail } from "lucide-react";

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
      // login() handles router.push("/")
    } catch (err: unknown) {
      setApiError(
        err instanceof Error
          ? err.message
          : "Authentication failed. Please verify credentials."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-ivory">
      <div className="max-w-md w-full bg-white border border-borderTone rounded-3xl p-8 sm:p-10 shadow-sm relative">
        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="inline-flex w-12 h-12 rounded-xl bg-forest text-white items-center justify-center font-serif font-bold text-2xl shadow-sm mb-4">
            D
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-forest tracking-tight">
            Sign In to Draftly
          </h2>
          <p className="text-xs sm:text-sm text-mutedText mt-1">
            Access your focused workspace and documents
          </p>
        </div>

        {/* Error Banners */}
        {(clientError || apiError) && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong>Error:</strong> {clientError || apiError}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1.5"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mutedText">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="block w-full pl-10 pr-3.5 py-2.5 bg-warmStone-light/40 border border-borderTone rounded-xl text-forest text-sm placeholder:text-mutedText/60 focus:outline-none focus:border-terracotta focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mutedText">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="block w-full pl-10 pr-3.5 py-2.5 bg-warmStone-light/40 border border-borderTone rounded-xl text-forest text-sm placeholder:text-mutedText/60 focus:outline-none focus:border-terracotta focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-forest hover:bg-forest-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-forest transition-all shadow-sm cursor-pointer disabled:opacity-60"
          >
            {submitting ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 pt-6 border-t border-borderTone text-center">
          <p className="text-xs text-mutedText">
            Don&apos;t have an account yet?{" "}
            <Link
              href="/register"
              className="font-semibold text-terracotta hover:text-terracotta-dark transition-colors"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

