"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { api, type LiveState } from "@/lib/client";
import type { PublicState } from "@/lib/types";

type Status = "loading" | "ready" | "error";

type LiveContextValue = {
  data: LiveState | null;
  status: Status;
  error: string | null;
  /** True while a background poll is in flight and we already have data. */
  refreshing: boolean;
  refresh: () => Promise<void>;
  /** Fold a mutation response straight into the cache — no round trip. */
  applyState: (next: PublicState) => void;
  setSignedIn: (signedIn: boolean, teacher: string | null) => void;
};

const LiveContext = createContext<LiveContextValue | null>(null);

const POLL_ACTIVE_MS = 4_000;
const POLL_HIDDEN_MS = 30_000;

export function LiveStateProvider({
  initial,
  children,
}: {
  initial: LiveState | null;
  children: React.ReactNode;
}) {
  const [data, setData] = useState<LiveState | null>(initial);
  const [status, setStatus] = useState<Status>(initial ? "ready" : "loading");
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const inFlight = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setRefreshing(true);
    try {
      const next = await api.state();
      if (!mounted.current) return;
      setData(next);
      setStatus("ready");
      setError(null);
    } catch (err) {
      if (!mounted.current) return;
      // A failed poll should never blank a board that is already on screen.
      setError(err instanceof Error ? err.message : "Lost contact with the server.");
      setStatus((prev) => (prev === "ready" ? "ready" : "error"));
    } finally {
      inFlight.current = false;
      if (mounted.current) setRefreshing(false);
    }
  }, []);

  // One loop handles both the first load and the polling: fast while the tab is
  // visible, slow when it isn't, and immediate on focus so a teacher switching
  // back never sees a stale score.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const tick = (delay: number) => {
      timer = setTimeout(async () => {
        await refresh();
        tick(document.visibilityState === "visible" ? POLL_ACTIVE_MS : POLL_HIDDEN_MS);
      }, delay);
    };
    tick(initial ? POLL_ACTIVE_MS : 0);

    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    window.addEventListener("online", onVisible);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
      window.removeEventListener("online", onVisible);
    };
  }, [refresh, initial]);

  const applyState = useCallback((next: PublicState) => {
    setData((prev) =>
      prev
        ? { ...prev, ...next }
        : { ...next, signedIn: false, teacher: null, storage: { durable: true, driver: "redis" } },
    );
    setStatus("ready");
    setError(null);
  }, []);

  const setSignedIn = useCallback((signedIn: boolean, teacher: string | null) => {
    setData((prev) => (prev ? { ...prev, signedIn, teacher } : prev));
  }, []);

  const value = useMemo<LiveContextValue>(
    () => ({ data, status, error, refreshing, refresh, applyState, setSignedIn }),
    [data, status, error, refreshing, refresh, applyState, setSignedIn],
  );

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLive(): LiveContextValue {
  const ctx = useContext(LiveContext);
  if (!ctx) throw new Error("useLive must be used inside <LiveStateProvider>");
  return ctx;
}
