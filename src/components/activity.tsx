"use client";

import { useMemo } from "react";

import { TeamCrest } from "@/components/team-crest";
import { cn } from "@/lib/cn";
import { clockTime, fullTime, relativeTime, signed } from "@/lib/format";
import { getColor } from "@/lib/palette";
import { useClock } from "@/lib/use-clock";
import type { PointEvent } from "@/lib/types";

function deltaTone(event: PointEvent) {
  if (event.kind === "system") return "text-ink-faint";
  if (event.kind === "undo") return "text-ink-soft";
  return event.delta > 0 ? "text-[var(--leaf)]" : "text-[#c0392b]";
}

export function ActivityItem({
  event,
  now,
  onUndo,
  undoable = false,
  busy = false,
  undone = false,
}: {
  event: PointEvent;
  now: number | null;
  onUndo?: (event: PointEvent) => void;
  undoable?: boolean;
  busy?: boolean;
  /** This entry has already been reversed, so it can't be undone again. */
  undone?: boolean;
}) {
  const theme = getColor(event.teamColor);
  const canUndo =
    undoable && Boolean(onUndo) && event.delta !== 0 && event.kind !== "undo" && !undone;

  return (
    <li className="flex items-start gap-3 px-4 py-3 transition hover:bg-[var(--surface-2)]">
      <TeamCrest logo={event.teamLogo} color={event.teamColor} size="xs" className="mt-0.5" />

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="truncate font-semibold text-ink">{event.teamName}</span>
          {event.delta !== 0 ? (
            <span className={cn("font-display text-sm font-black tabular-nums", deltaTone(event))}>
              {signed(event.delta)}
            </span>
          ) : null}
          <time
            dateTime={new Date(event.at).toISOString()}
            title={fullTime(event.at)}
            className="text-[12px] text-ink-faint"
          >
            {relativeTime(event.at, now)}
          </time>
        </p>
        <p className="mt-0.5 break-words text-[13px] leading-snug text-ink-soft">{event.reason}</p>
      </div>

      {canUndo ? (
        <button
          type="button"
          onClick={() => onUndo?.(event)}
          disabled={busy}
          className="shrink-0 rounded-lg px-2 py-1 text-[12px] font-bold uppercase tracking-wide text-ink-faint transition hover:bg-[color-mix(in_oklab,var(--ink)_8%,transparent)] hover:text-ink disabled:opacity-50"
          title={`Take back ${signed(event.delta)} from ${event.teamName}`}
        >
          Undo
        </button>
      ) : undone ? (
        <span className="shrink-0 rounded-lg px-2 py-1 text-[12px] font-bold uppercase tracking-wide text-ink-faint opacity-60">
          Undone
        </span>
      ) : (
        <span
          aria-hidden="true"
          className="mt-1 h-2 w-2 shrink-0 rounded-full"
          style={{ background: theme.base, opacity: 0.35 }}
        />
      )}
    </li>
  );
}

export function ActivityFeed({
  events,
  title = "Point log",
  emptyLabel = "Nothing yet. Points will show up here the moment they're awarded.",
  onUndo,
  undoable = false,
  busyId,
  limit,
  className,
}: {
  events: PointEvent[];
  title?: string;
  emptyLabel?: string;
  onUndo?: (event: PointEvent) => void;
  undoable?: boolean;
  busyId?: string | null;
  limit?: number;
  className?: string;
}) {
  const now = useClock();
  const shown = limit ? events.slice(0, limit) : events;
  // Which entries have already been reversed — the server refuses a second
  // undo, so the button shouldn't be offered in the first place.
  const undoneIds = useMemo(
    () => new Set(events.map((e) => e.ref).filter((id): id is string => Boolean(id))),
    [events],
  );

  return (
    <section className={cn("card overflow-hidden", className)} aria-label={title}>
      <header className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider text-ink-soft">
          {title}
        </h2>
        <span className="text-[12px] font-semibold text-ink-faint tabular-nums">
          {events.length}
        </span>
      </header>

      {shown.length === 0 ? (
        <p className="px-4 py-8 text-center text-[13px] text-ink-faint">{emptyLabel}</p>
      ) : (
        <ul className="scroll-slim max-h-[520px] divide-y divide-[var(--line)] overflow-y-auto">
          {shown.map((event) => (
            <ActivityItem
              key={event.id}
              event={event}
              now={now}
              onUndo={onUndo}
              undoable={undoable}
              busy={busyId === event.id}
              undone={undoneIds.has(event.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * The scrolling strip along the bottom of the board. Duplicated once so the
 * CSS translate can loop seamlessly; paused on hover so you can actually read it.
 */
export function ActivityTicker({ events }: { events: PointEvent[] }) {
  const now = useClock(20_000);
  const scoring = events.filter((e) => e.delta !== 0).slice(0, 18);
  if (scoring.length === 0) return null;

  const duration = Math.max(28, scoring.length * 4.5);
  const run = [...scoring, ...scoring];

  return (
    <div className="ticker-host card overflow-hidden py-2.5" aria-label="Recent points">
      <div
        className="ticker-track flex w-max items-center gap-6 px-4"
        style={{ ["--ticker-duration" as string]: `${duration}s` }}
      >
        {run.map((event, i) => (
          <span
            key={`${event.id}-${i}`}
            className="flex shrink-0 items-center gap-2 whitespace-nowrap"
          >
            <TeamCrest
              logo={event.teamLogo}
              color={event.teamColor}
              size="xs"
              className="h-6 w-6"
            />
            <span className="text-[13px] font-semibold text-ink">{event.teamName}</span>
            <span className={cn("font-display text-sm font-black tabular-nums", deltaTone(event))}>
              {signed(event.delta)}
            </span>
            <span className="max-w-[26ch] truncate text-[13px] text-ink-soft">{event.reason}</span>
            <span className="text-[12px] text-ink-faint">{clockTime(event.at)}</span>
            <span aria-hidden="true" className="ml-2 text-ink-faint opacity-40">
              •
            </span>
          </span>
        ))}
      </div>
      <span className="sr-only">
        {scoring.length} recent point entries, most recent {relativeTime(scoring[0].at, now)}.
      </span>
    </div>
  );
}
