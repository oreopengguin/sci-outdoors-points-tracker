"use client";

import { useEffect, useState } from "react";

/**
 * True only for the first moment after mount.
 *
 * The board's entry animation is staggered with a per-row delay and
 * `fill-mode: both`, so a row is invisible until its delay elapses. That reads
 * beautifully on first paint — and terribly afterwards, because reordering the
 * list moves DOM nodes, and moving a node restarts its CSS animation. A team
 * overtaking another would blank out every row that shifted.
 *
 * So the animation is applied once and then retired. After that, reordering is
 * instant and nothing flickers.
 */
export function useEntryAnimation(durationMs = 1400): boolean {
  const [active, setActive] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setActive(false), durationMs);
    return () => clearTimeout(timer);
  }, [durationMs]);

  return active;
}
