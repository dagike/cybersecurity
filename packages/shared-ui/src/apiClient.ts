// Thin fetch wrapper shared by both apps. Always sends cookies. The fixed app
// passes `getCsrfToken` so state-changing requests carry an X-CSRF-Token
// header; the vulnerable app leaves it undefined.

import type { Note, User } from "./types";

export interface ApiError {
  status: number;
  message: string;
  /** Present only on the vulnerable app, which leaks internals in errors. */
  body?: unknown;
}

export interface ApiClientOptions {
  baseUrl?: string;
  getCsrfToken?: () => string | null | undefined;
}

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function createApiClient(options: ApiClientOptions = {}) {
  const baseUrl = options.baseUrl ?? "";

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";

    const csrf = options.getCsrfToken?.();
    if (csrf && UNSAFE_METHODS.has(method)) headers["X-CSRF-Token"] = csrf;

    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      credentials: "include",
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    const text = await res.text();
    const parsed = text ? safeJsonParse(text) : undefined;

    if (!res.ok) {
      const err: ApiError = {
        status: res.status,
        message:
          (parsed && typeof parsed === "object" && "error" in parsed
            ? String((parsed as { error: unknown }).error)
            : res.statusText) || "Request failed",
        body: parsed,
      };
      throw err;
    }

    return parsed as T;
  }

  return {
    request,
    register: (username: string, password: string) =>
      request<{ user: User }>("POST", "/api/auth/register", { username, password }),
    login: (username: string, password: string) =>
      request<{ user: User }>("POST", "/api/auth/login", { username, password }),
    logout: () => request<void>("POST", "/api/auth/logout"),
    me: () => request<{ user: User }>("GET", "/api/auth/me"),
    listNotes: () => request<{ notes: Note[] }>("GET", "/api/notes"),
    getNote: (id: string) => request<{ note: Note }>("GET", `/api/notes/${id}`),
    createNote: (title: string, body: string) =>
      request<{ note: Note }>("POST", "/api/notes", { title, body }),
    updateNote: (id: string, title: string, body: string) =>
      request<{ note: Note }>("PUT", `/api/notes/${id}`, { title, body }),
    deleteNote: (id: string) => request<void>("DELETE", `/api/notes/${id}`),
    searchNotes: (q: string) =>
      request<{ notes: Note[] }>("GET", `/api/notes/search?q=${encodeURIComponent(q)}`),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
