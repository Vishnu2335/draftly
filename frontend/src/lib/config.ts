/**
 * Frontend Configuration & API Client Helpers
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/api/v1/health`,
  ROOT_HEALTH: `${API_BASE_URL}/health`,
  ROOT: `${API_BASE_URL}/`,
} as const;

export interface DatabaseHealthInfo {
  status: "connected" | "unconfigured" | "disconnected" | "degraded";
  provider: string;
  message: string;
  latency_ms: number | null;
}

export interface HealthCheckResponse {
  status: string;
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  database: DatabaseHealthInfo;
}

export async function fetchHealthStatus(): Promise<HealthCheckResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(API_ENDPOINTS.HEALTH, {
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`API returned HTTP ${res.status}`);
    }

    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

