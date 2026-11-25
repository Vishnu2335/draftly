/**
 * Frontend Configuration & API Client Helpers
 */

/**
 * Normalise and sanitize the backend API Base URL.
 * Prevents trailing slashes, surrounding quotes, and duplicate /api or /api/v1 prefixes.
 */
export function cleanApiBaseUrl(rawUrl?: string): string {
  if (!rawUrl) return "http://localhost:8000";
  let url = rawUrl.trim();
  // Strip enclosing quotes if accidentally pasted into env variable
  url = url.replace(/^["']|["']$/g, "").trim();
  // Strip trailing slashes
  url = url.replace(/\/+$/, "");
  // Prevent duplicate prefixes if user accidentally appended /api/v1 or /api in Vercel
  url = url.replace(/\/api\/v1$/, "").replace(/\/api$/, "");
  return url || "http://localhost:8000";
}

export const API_BASE_URL = cleanApiBaseUrl(
  process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL
);

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
  is_public?: boolean;
  public_share_token?: string | null;
  user_role?: "owner" | "editor" | "viewer";
  created_at: string;
  updated_at: string;
}

export interface DocumentCollaborator {
  id: string;
  user_id: string;
  email: string;
  username: string;
  role: "editor" | "viewer";
  expires_at?: string | null;
  is_expired?: boolean;
  shared_at: string;
}

export interface DocumentVersionItem {
  id: string;
  document_id: string;
  version_number: number;
  title: string;
  content: Record<string, any>;
  created_by_id?: string | null;
  created_by_username?: string | null;
  created_at: string;
}

export interface DocumentVersionListResponse {
  items: DocumentVersionItem[];
  total: number;
}

export interface DocumentCommentItem {
  id: string;
  document_id: string;
  user_id: string;
  user_email: string;
  user_username: string;
  content: string;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentCommentListResponse {
  items: DocumentCommentItem[];
  total: number;
}

export interface PresenceUser {
  user_id: string;
  username: string;
  email: string;
  last_seen_at: string;
}

export interface DocumentPresenceResponse {
  document_id: string;
  active_users: PresenceUser[];
}

export interface PublicDocumentItem {
  id: string;
  title: string;
  content: Record<string, any>;
  owner_username: string;
  updated_at: string;
}

export interface DocumentShareListResponse {
  document_id: string;
  owner: {
    id: string;
    email: string;
    username: string;
  };
  collaborators: DocumentCollaborator[];
}

export interface SharedWithMeItem {
  id: string;
  title: string;
  content: Record<string, any>;
  owner_id: string;
  owner_email: string;
  owner_username: string;
  role: "editor" | "viewer";
  shared_at: string;
  created_at: string;
  updated_at: string;
}

export interface SharedWithMeListResponse {
  items: SharedWithMeItem[];
  total: number;
}

export interface SharedByMeItem {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  collaborators: DocumentCollaborator[];
  total_collaborators: number;
}

export interface SharedByMeListResponse {
  items: SharedByMeItem[];
  total: number;
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
  payload: { title?: string; content?: any; is_deleted?: boolean; is_public?: boolean }
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

/**
 * Sharing & RBAC API Methods (Phase 6)
 */

export async function apiShareDocument(
  token: string,
  documentId: string,
  email: string,
  role: "editor" | "viewer" = "viewer",
  expiresInDays?: number
): Promise<DocumentCollaborator> {
  const res = await fetch(`${API_ENDPOINTS.DOCUMENTS}/${documentId}/share`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, role, expires_in_days: expiresInDays || null }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.detail || `Failed to share document (${res.status})`);
  }

  return await res.json();
}

export async function apiGetDocumentShares(
  token: string,
  documentId: string
): Promise<DocumentShareListResponse> {
  const res = await fetch(`${API_ENDPOINTS.DOCUMENTS}/${documentId}/shares`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.detail || `Failed to load collaborators (${res.status})`);
  }

  return await res.json();
}

export async function apiUpdateShareRole(
  token: string,
  documentId: string,
  collaboratorUserId: string,
  role: "editor" | "viewer",
  expiresInDays?: number
): Promise<DocumentCollaborator> {
  const res = await fetch(`${API_ENDPOINTS.DOCUMENTS}/${documentId}/shares/${collaboratorUserId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role, expires_in_days: expiresInDays !== undefined ? expiresInDays : null }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.detail || `Failed to update collaborator role (${res.status})`);
  }

  return await res.json();
}

export async function apiRevokeShare(
  token: string,
  documentId: string,
  collaboratorUserId: string
): Promise<{ message: string; document_id: string; user_id: string }> {
  const res = await fetch(`${API_ENDPOINTS.DOCUMENTS}/${documentId}/shares/${collaboratorUserId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.detail || `Failed to revoke access (${res.status})`);
  }

  return await res.json();
}

export async function apiGetSharedWithMe(
  token: string
): Promise<SharedWithMeListResponse> {
  const res = await fetch(`${API_ENDPOINTS.DOCUMENTS}/shared-with-me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.detail || `Failed to fetch shared documents (${res.status})`);
  }

  return await res.json();
}

export async function apiGetSharedByMe(
  token: string
): Promise<SharedByMeListResponse> {
  const res = await fetch(`${API_ENDPOINTS.DOCUMENTS}/shared-by-me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.detail || `Failed to fetch shared documents (${res.status})`);
  }

  return await res.json();
}

/**
 * Version History API Methods
 */

export async function apiGetVersions(
  token: string,
  documentId: string
): Promise<DocumentVersionListResponse> {
  const res = await fetch(`${API_ENDPOINTS.DOCUMENTS}/${documentId}/versions`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.detail || `Failed to load versions (${res.status})`);
  }

  return await res.json();
}

export async function apiCreateVersion(
  token: string,
  documentId: string,
  title?: string
): Promise<DocumentVersionItem> {
  const res = await fetch(`${API_ENDPOINTS.DOCUMENTS}/${documentId}/versions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title: title || null }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.detail || `Failed to create version (${res.status})`);
  }

  return await res.json();
}

export async function apiRestoreVersion(
  token: string,
  documentId: string,
  versionId: string
): Promise<DocumentItem> {
  const res = await fetch(`${API_ENDPOINTS.DOCUMENTS}/${documentId}/versions/${versionId}/restore`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.detail || `Failed to restore version (${res.status})`);
  }

  return await res.json();
}

/**
 * Comments & Suggestions API Methods
 */

export async function apiGetComments(
  token: string,
  documentId: string
): Promise<DocumentCommentListResponse> {
  const res = await fetch(`${API_ENDPOINTS.DOCUMENTS}/${documentId}/comments`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.detail || `Failed to load comments (${res.status})`);
  }

  return await res.json();
}

export async function apiAddComment(
  token: string,
  documentId: string,
  content: string
): Promise<DocumentCommentItem> {
  const res = await fetch(`${API_ENDPOINTS.DOCUMENTS}/${documentId}/comments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.detail || `Failed to add comment (${res.status})`);
  }

  return await res.json();
}

export async function apiUpdateComment(
  token: string,
  documentId: string,
  commentId: string,
  data: { content?: string; is_resolved?: boolean }
): Promise<DocumentCommentItem> {
  const res = await fetch(`${API_ENDPOINTS.DOCUMENTS}/${documentId}/comments/${commentId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.detail || `Failed to update comment (${res.status})`);
  }

  return await res.json();
}

export async function apiDeleteComment(
  token: string,
  documentId: string,
  commentId: string
): Promise<{ message: string }> {
  const res = await fetch(`${API_ENDPOINTS.DOCUMENTS}/${documentId}/comments/${commentId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.detail || `Failed to delete comment (${res.status})`);
  }

  return await res.json();
}

/**
 * Collaboration Presence API Methods
 */

export async function apiSendPresence(
  token: string,
  documentId: string
): Promise<DocumentPresenceResponse> {
  const res = await fetch(`${API_ENDPOINTS.DOCUMENTS}/${documentId}/presence`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.detail || `Failed to send presence heartbeat (${res.status})`);
  }

  return await res.json();
}

export async function apiGetPresence(
  token: string,
  documentId: string
): Promise<DocumentPresenceResponse> {
  const res = await fetch(`${API_ENDPOINTS.DOCUMENTS}/${documentId}/presence`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.detail || `Failed to fetch presence (${res.status})`);
  }

  return await res.json();
}

/**
 * Public Document API Method
 */

export async function apiGetPublicDocument(
  token: string
): Promise<PublicDocumentItem> {
  const res = await fetch(`${API_ENDPOINTS.DOCUMENTS}/public/${token}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || err?.detail || `Document not found or link has expired.`);
  }

  return await res.json();
}

