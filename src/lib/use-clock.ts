"use client";

import { useSyncExternalStore } from "react";

/**
 * A shared ticking clock.
 *
 * Reading `Date.now()` during render is impure and makes server and client
 * markup disagree, so time lives in an external store instead: one interval per
 * distinct tick rate, shared by every component that asks for it, and torn down
 * when the last subscriber leaves. `null` on the server and on the first client
 * render, so relative timestamps only appear once hydration is done.
 */
type Clock = {
  subscribe: (listener: () => void) => () => void;
  snapshot: () => number;
};

const clocks = new Map<number, Clock>();

function clockFor(intervalMs: number): Clock {
  const existing = clocks.get(intervalMs);
  if (existing) return existing;

  let value = Date.now();
  let timer: ReturnType<typeof setInterval> | null = null;
  const listeners = new Set<() => void>();

  const clock: Clock = {
    subscribe(listener) {
      listeners.add(listener);
      if (timer === null) {
        value = Date.now();
        timer = setInterval(() => {
          value = Date.now();
          for (const l of listeners) l();
        }, intervalMs);
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && timer !== null) {
          clearInterval(timer);
          timer = null;
        }
      };
    },
    snapshot: () => value,
  };

  clocks.set(intervalMs, clock);
  return clock;
}

export function useClock(intervalMs = 30_000): number | null {
  const clock = clockFor(intervalMs);
  return useSyncExternalStore(clock.subscribe, clock.snapshot, () => null);
}
