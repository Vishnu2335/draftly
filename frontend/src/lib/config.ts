/**
 * Frontend Configuration & API Client Helpers
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const API_ENDPOINTS = {
  HEALTH: `${API_BASE_URL}/api/v1/health`,
  ROOT_HEALTH: `${API_BASE_URL}/health`,
  ROOT: `${API_BASE_URL}/`,
  AUTH_ME: `${API_BASE_URL}/api/v1/auth/me`,
  AUTH_LOGIN: `${API_BASE_URL}/api/v1/auth/login`,
  AUTH_REGISTER: `${API_BASE_URL}/api/v1/auth/register`,
  DOCUMENTS: `${API_BASE_URL}/api/v1/documents`,
} as const;

export interface DatabaseHealthInfo {
  status: "connected" | "unconfigured" | "disconnected" | "degraded" | "pending_configuration";
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

export interface DocumentItem {
  id: string;
  title: string;
  content: Record<string, any>;
  owner_id: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentListResponse {
  items: DocumentItem[];
  total: number;
  active_count: number;
  trash_count: number;
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

/**
 * Document API Client Methods
 */

export async function apiGetDocuments(
  token: string,
  params?: {
    search?: string;
    is_deleted?: boolean;
    sort_by?: "updated_at" | "title" | "created_at";
    sort_order?: "asc" | "desc";
  }
): Promise<DocumentListResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.is_deleted !== undefined) query.set("is_deleted", String(params.is_deleted));
  if (params?.sort_by) query.set("sort_by", params.sort_by);
  if (params?.sort_order) query.set("sort_order", params.sort_order);

  const url = `${API_ENDPOINTS.DOCUMENTS}${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.detail || `Failed to fetch documents (${res.status})`);
  }

  return await res.json();
}

export async function apiCreateDocument(
  token: string,
  payload: { title?: string; content?: any }
): Promise<DocumentItem> {
  const res = await fetch(API_ENDPOINTS.DOCUMENTS, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.detail || `Failed to create document (${res.status})`);
  }

  return await res.json();
}

export async function apiGetDocumentById(
  token: string,
  documentId: string
): Promise<DocumentItem> {
  const res = await fetch(`${API_ENDPOINTS.DOCUMENTS}/${documentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.detail || `Failed to fetch document (${res.status})`);
  }

  return await res.json();
}

export async function apiUpdateDocument(
  token: string,
  documentId: string,
  payload: { title?: string; content?: any; is_deleted?: boolean }
): Promise<DocumentItem> {
  const res = await fetch(`${API_ENDPOINTS.DOCUMENTS}/${documentId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.detail || `Failed to update document (${res.status})`);
  }

  return await res.json();
}

export async function apiImportDocument(
  token: string,
  file: File
): Promise<DocumentItem> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_ENDPOINTS.DOCUMENTS}/import`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.detail || `Failed to import document (${res.status})`);
  }

  return await res.json();
}

export async function apiDeleteDocument(
  token: string,
  documentId: string,
  permanent: boolean = false
): Promise<{ message: string; id: string; permanent: boolean }> {
  const url = `${API_ENDPOINTS.DOCUMENTS}/${documentId}${permanent ? "?permanent=true" : ""}`;
  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.detail || `Failed to delete document (${res.status})`);
  }

  return await res.json();
}
