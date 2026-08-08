"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";

/**
 * Animates a score from its previous value to the new one. Scores are the
 * whole point of the board, so the motion is short and eased rather than
 * showy — you should be able to read the number the whole way.
 *
 * While no animation is running the component simply renders `value`, so it is
 * always correct even if a frame is dropped or motion is turned off.
 */
export function CountUp({
  value,
  className,
  style,
  durationMs = 750,
}: {
  value: number;
  className?: string;
  /** For callers that size the number from available space, e.g. the big screen. */
  style?: React.CSSProperties;
  durationMs?: number;
}) {
  const [tween, setTween] = useState<number | null>(null);
  const previous = useRef(value);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    const from = previous.current;
    previous.current = value;
    if (from === value) return;

    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const start = performance.now();
    const distance = value - from;
    // Longer travel earns a little more time, capped so it never feels slow.
    const duration = Math.min(
      durationMs * 1.6,
      durationMs * (0.6 + Math.min(Math.abs(distance), 200) / 160),
    );

    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      if (t < 1) {
        setTween(Math.round(from + distance * eased));
        frame.current = requestAnimationFrame(step);
      } else {
        setTween(null);
      }
    };

    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [value, durationMs]);

  return (
    <span className={cn("tnum", className)} style={style}>
      {(tween ?? value).toLocaleString()}
    </span>
  );
}
