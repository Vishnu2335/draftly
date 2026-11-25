"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, ArrowRight, Check, Lock, Mail, User } from "lucide-react";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);
    setApiError(null);

    // Client validations
    if (!username.trim() || !email.trim() || !password || !passwordConfirm) {
      setClientError("All fields are required.");
      return;
    }

    if (username.trim().length < 3) {
      setClientError("Username must be at least 3 characters long.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setClientError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setClientError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== passwordConfirm) {
      setClientError("Passwords do not match. Please re-enter.");
      return;
    }

    setSubmitting(true);
    try {
      await register(username.trim(), email.trim(), password);
      // register() logs user in and redirects to "/"
    } catch (err: unknown) {
      setApiError(
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again."
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
          <div className="inline-flex w-12 h-12 rounded-xl bg-terracotta text-white items-center justify-center font-serif font-bold text-2xl shadow-sm mb-4">
            D
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-forest tracking-tight">
            Create Your Account
          </h2>
          <p className="text-xs sm:text-sm text-mutedText mt-1">
            Join Draftly for focused, modern document authoring
          </p>
        </div>

        {/* Error Banners */}
        {(clientError || apiError) && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong>Validation:</strong> {clientError || apiError}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1.5"
            >
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mutedText">
                <User className="w-4 h-4" />
              </div>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. elena_author"
                className="block w-full pl-10 pr-3.5 py-2.5 bg-warmStone-light/40 border border-borderTone rounded-xl text-forest text-sm placeholder:text-mutedText/60 focus:outline-none focus:border-terracotta focus:bg-white transition-all"
              />
            </div>
          </div>

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
                placeholder="elena@example.com"
                className="block w-full pl-10 pr-3.5 py-2.5 bg-warmStone-light/40 border border-borderTone rounded-xl text-forest text-sm placeholder:text-mutedText/60 focus:outline-none focus:border-terracotta focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1.5"
            >
              Password (min. 8 characters)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mutedText">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="block w-full pl-10 pr-3.5 py-2.5 bg-warmStone-light/40 border border-borderTone rounded-xl text-forest text-sm placeholder:text-mutedText/60 focus:outline-none focus:border-terracotta focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="passwordConfirm"
              className="block text-xs font-semibold text-forest uppercase tracking-wider mb-1.5"
            >
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-mutedText">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="passwordConfirm"
                name="passwordConfirm"
                type="password"
                autoComplete="new-password"
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="••••••••••••"
                className="block w-full pl-10 pr-3.5 py-2.5 bg-warmStone-light/40 border border-borderTone rounded-xl text-forest text-sm placeholder:text-mutedText/60 focus:outline-none focus:border-terracotta focus:bg-white transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-terracotta hover:bg-terracotta-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-terracotta transition-all shadow-sm cursor-pointer disabled:opacity-60"
          >
            {submitting ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <span>Create Draftly Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className="mt-8 pt-6 border-t border-borderTone text-center">
          <p className="text-xs text-mutedText">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-forest hover:text-forest-light transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

