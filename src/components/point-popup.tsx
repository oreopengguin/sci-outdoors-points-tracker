"use client";

import { useEffect, useRef, useState } from "react";

import { useLive } from "@/components/live-state";
import { TeamCrest } from "@/components/team-crest";
import { useToast } from "@/components/ui";
import { api, ApiError } from "@/lib/client";
import { cn } from "@/lib/cn";
import { signed } from "@/lib/format";
import { getColor } from "@/lib/palette";
import type { PointEvent } from "@/lib/types";

/** How long a single announcement stays up. */
const HOLD_MS = 5_200;
/** Longer when there is an Undo button worth reaching for. */
const HOLD_MS_TEACHER = 8_000;
/**
 * When announcements are stacked up, each one gets out of the way quickly.
 * Holding the full time would put the board minutes behind a busy stretch of
 * scoring, which is worse than a brisk run-through.
 */
const HOLD_MS_BACKLOG = 2_200;
/** Enough headroom that a normal burst is announced in full, not dropped. */
const MAX_QUEUED = 6;

/**
 * Announces each new point award to everyone watching the board.
 *
 * It reads from the same polled state as the leaderboard, so it fires on every
 * open device — the projector at the front, a phone at the back — not just on
 * the machine the teacher used. The teacher's own award appears instantly,
 * because their mutation response updates the shared state directly.
 */
export function PointPopup() {
  const { data, applyState } = useLive();
  const { push } = useToast();

  // A single queue whose head is what's on screen. Deriving `current` rather
  // than promoting it in an effect keeps this to one render per change.
  const [queue, setQueue] = useState<PointEvent[]>([]);
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const [undoingId, setUndoingId] = useState<string | null>(null);

  const current = queue[0] ?? null;

  // Everything already on the board when this page opened is history, not news.
  const seen = useRef<Set<string> | null>(null);

  const signedIn = data?.signedIn ?? false;

  useEffect(() => {
    if (!data) return;

    if (seen.current === null) {
      seen.current = new Set(data.events.map((e) => e.id));
      return;
    }

    const fresh = data.events.filter((e) => e.delta !== 0 && !seen.current!.has(e.id));
    if (fresh.length === 0) return;

    for (const event of fresh) seen.current.add(event.id);

    // The log is newest-first; announce in the order things actually happened.
    setQueue((prev) => [...prev, ...fresh.slice().reverse()].slice(-MAX_QUEUED));

    // Keep the seen set from growing without bound on a long-running display.
    if (seen.current.size > 800) {
      seen.current = new Set(data.events.map((e) => e.id));
    }
  }, [data]);

  // Hold the head of the queue, play it out, then drop it so the next one shows.
  const currentId = current?.id ?? null;
  const backlog = queue.length > 1;
  useEffect(() => {
    if (!currentId) return;
    const hold = backlog ? HOLD_MS_BACKLOG : signedIn ? HOLD_MS_TEACHER : HOLD_MS;
    const out = setTimeout(() => setLeavingId(currentId), hold);
    const drop = setTimeout(() => setQueue((prev) => prev.slice(1)), hold + 260);
    return () => {
      clearTimeout(out);
      clearTimeout(drop);
    };
  }, [currentId, signedIn, backlog]);

  if (!current) return null;

  const leaving = leavingId === current.id;
  const undoing = undoingId === current.id;

  const theme = getColor(current.teamColor);
  const positive = current.delta > 0;

  const undo = async () => {
    if (undoing) return;
    const target = current;
    setUndoingId(target.id);
    try {
      const result = await api.undo(target.id);
      applyState(result.state);
      setLeavingId(target.id);
      setTimeout(() => setQueue((prev) => prev.filter((e) => e.id !== target.id)), 240);
      push({ tone: "info", title: `Took back ${signed(target.delta)} from ${target.teamName}` });
    } catch (err) {
      push({
        tone: "error",
        title: "Couldn't undo that",
        detail: err instanceof ApiError ? err.message : undefined,
      });
      setUndoingId(null);
    }
  };

  return (
    <div
      className="pointer-events-none fixed inset-x-0 z-[65] flex justify-center px-4"
      style={{ top: "var(--popup-top, 1rem)" }}
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        role="status"
        className={cn(
          "pointer-events-auto flex w-full max-w-md items-center gap-3.5 rounded-2xl border px-4 py-3.5 sm:gap-4 sm:px-5",
          leaving ? "anim-pop-out" : "anim-pop-in",
        )}
        style={{
          borderColor: `color-mix(in oklab, ${theme.base} 42%, transparent)`,
          background: `linear-gradient(112deg, color-mix(in oklab, ${theme.base} 20%, var(--surface)) 0%, var(--surface) 72%)`,
          boxShadow: `0 2px 8px rgb(22 32 26 / 0.08), 0 26px 56px -26px ${theme.base}`,
        }}
      >
        <TeamCrest
          logo={current.teamLogo}
          color={current.teamColor}
          size="md"
          glow={positive}
          className="shrink-0"
        />

        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-bold leading-tight text-ink sm:text-xl">
            {current.teamName}
          </p>
          <p className="mt-0.5 truncate text-[13px] leading-snug text-ink-soft sm:text-sm">
            {current.reason}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end">
          <span
            className="font-display text-3xl font-black leading-none tabular-nums sm:text-4xl"
            style={{ color: positive ? theme.base : "#c0392b" }}
          >
            {signed(current.delta)}
          </span>
          {signedIn ? (
            <button
              type="button"
              onClick={undo}
              disabled={undoing}
              className="mt-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-ink-faint transition hover:bg-[color-mix(in_oklab,var(--ink)_8%,transparent)] hover:text-ink disabled:opacity-50"
            >
              {undoing ? "…" : "Undo"}
            </button>
          ) : (
            <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-faint">
              points
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
