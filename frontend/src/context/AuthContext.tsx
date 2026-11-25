"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL, API_ENDPOINTS } from "@/lib/config";

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "draftly_access_token";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  // Load initial token and verify identity on startup
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (!savedToken) {
      setLoading(false);
      return;
    }

    setToken(savedToken);
    verifyTokenAndLoadUser(savedToken);
  }, []);

  const verifyTokenAndLoadUser = async (authToken: string) => {
    try {
      const res = await fetch(API_ENDPOINTS.AUTH_ME, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.ok) {
        const userData: UserProfile = await res.json();
        setUser(userData);
      } else {
        // Token is invalid or expired
        logout();
      }
    } catch (err) {
      console.warn("Auth verification failed or server unreachable:", err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.AUTH_LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errMsg = data?.error?.message || data?.detail || "Authentication failed.";
        throw new Error(errMsg);
      }

      const receivedToken: string = data.access_token;
      const userProfile: UserProfile = data.user;

      localStorage.setItem(TOKEN_KEY, receivedToken);
      setToken(receivedToken);
      setUser(userProfile);
      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof TypeError && err.message.toLowerCase().includes("fetch")) {
        throw new Error(
          `Unable to reach backend API at ${API_BASE_URL}. If hosted on Render, the free instance may take ~45s to wake from sleep. Please check backend status and verify NEXT_PUBLIC_API_URL.`
        );
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINTS.AUTH_REGISTER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errMsg = data?.error?.message || data?.detail || "Registration failed.";
        throw new Error(errMsg);
      }

      // Immediately log in user upon successful registration
      await login(email, password);
    } catch (err: unknown) {
      if (err instanceof TypeError && err.message.toLowerCase().includes("fetch")) {
        throw new Error(
          `Unable to reach backend API at ${API_BASE_URL}. If hosted on Render, the free instance may take ~45s to wake from sleep. Please check backend status and verify NEXT_PUBLIC_API_URL.`
        );
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

