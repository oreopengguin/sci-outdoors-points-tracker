"use client";

import type { PointEvent, PublicState } from "@/lib/types";

export type LiveState = PublicState & {
  signedIn: boolean;
  teacher: string | null;
  storage: { durable: boolean; driver: string };
};

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function csrfToken(): string {
  const match = document.cookie.match(/(?:^|;\s*)sot_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const method = init?.method ?? "GET";
  const headers = new Headers(init?.headers);
  if (init?.body) headers.set("Content-Type", "application/json");
  if (method !== "GET" && method !== "HEAD") {
    headers.set("x-sot-csrf", csrfToken());
  }

  const res = await fetch(path, {
    ...init,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    /* some errors have no body */
  }

  if (!res.ok) {
    const message =
      (payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: unknown }).error)
        : null) ?? "Something went wrong. Try again.";
    throw new ApiError(message, res.status);
  }
  return payload as T;
}

export const api = {
  state: () => request<LiveState>("/api/state"),

  login: (username: string, password: string) =>
    request<{ signedIn: boolean; teacher: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  logout: () => request<{ signedIn: boolean }>("/api/auth/logout", { method: "POST" }),

  award: (teamId: string, delta: number, reason: string) =>
    request<{ event: PointEvent; state: PublicState }>("/api/points", {
      method: "POST",
      body: JSON.stringify({ teamId, delta, reason }),
    }),

  undo: (eventId: string) =>
    request<{ event: PointEvent; state: PublicState }>("/api/points/undo", {
      method: "POST",
      body: JSON.stringify({ eventId }),
    }),

  updateTeam: (teamId: string, name: string, logo: string, color: string) =>
    request<{ state: PublicState }>("/api/teams", {
      method: "PATCH",
      body: JSON.stringify({ teamId, name, logo, color }),
    }),

  reset: (seasonName: string, teams: { name: string; logo: string; color: string }[]) =>
    request<{ state: PublicState }>("/api/reset", {
      method: "POST",
      body: JSON.stringify({ confirm: "RESET", seasonName, teams }),
    }),
};
