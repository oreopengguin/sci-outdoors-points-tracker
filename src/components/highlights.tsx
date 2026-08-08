"use client";

import { useMemo } from "react";

import { TeamCrest } from "@/components/team-crest";
import { cn } from "@/lib/cn";
import { plural, relativeTime, signed } from "@/lib/format";
import { getColor } from "@/lib/palette";
import { useClock } from "@/lib/use-clock";
import type { PointEvent, PublicTeam } from "@/lib/types";

type Highlight = {
  key: string;
  icon: string;
  label: string;
  team: PublicTeam | null;
  value: string;
  detail: string;
};

/**
 * Small derived facts about the season. All of it comes from the same event
 * log the board already has, so there is nothing extra to keep in sync — and
 * it gives teams other than the leader something to point at.
 */
export function SeasonHighlights({
  teams,
  events,
  className,
}: {
  teams: PublicTeam[];
  events: PointEvent[];
  className?: string;
}) {
  const now = useClock(60_000);

  const highlights = useMemo<Highlight[]>(() => {
    const byId = new Map(teams.map((t) => [t.id, t]));
    const scoring = events.filter((e) => e.delta !== 0);

    // Biggest single award.
    let biggest: PointEvent | null = null;
    for (const event of scoring) {
      if (event.delta > 0 && (!biggest || event.delta > biggest.delta)) biggest = event;
    }

    // Most entries logged.
    const counts = new Map<string, number>();
    for (const event of scoring) counts.set(event.teamId, (counts.get(event.teamId) ?? 0) + 1);
    let busiestId: string | null = null;
    for (const [id, count] of counts) {
      if (!busiestId || count > (counts.get(busiestId) ?? 0)) busiestId = id;
    }

    // Best run in the last ten entries — who is hottest right now.
    const recent = scoring.slice(0, 10);
    const momentum = new Map<string, number>();
    for (const event of recent) {
      momentum.set(event.teamId, (momentum.get(event.teamId) ?? 0) + event.delta);
    }
    let risingId: string | null = null;
    for (const [id, sum] of momentum) {
      if (sum <= 0) continue;
      if (!risingId || sum > (momentum.get(risingId) ?? 0)) risingId = id;
    }

    const closest =
      teams.length > 1
        ? teams.reduce<{ gap: number; team: PublicTeam } | null>((best, team, i) => {
            if (i === 0) return best;
            const gap = teams[i - 1].points - team.points;
            return !best || gap < best.gap ? { gap, team } : best;
          }, null)
        : null;

    return [
      {
        key: "biggest",
        icon: "🚀",
        label: "Biggest single award",
        team: biggest ? (byId.get(biggest.teamId) ?? null) : null,
        value: biggest ? signed(biggest.delta) : "—",
        detail: biggest ? biggest.reason : "No points awarded yet",
      },
      {
        key: "rising",
        icon: "📈",
        label: "On a run",
        team: risingId ? (byId.get(risingId) ?? null) : null,
        value: risingId ? signed(momentum.get(risingId) ?? 0) : "—",
        detail: risingId ? "over the last ten entries" : "Nothing scored recently",
      },
      {
        key: "busiest",
        icon: "📋",
        label: "Most entries",
        team: busiestId ? (byId.get(busiestId) ?? null) : null,
        value: busiestId ? plural(counts.get(busiestId) ?? 0, "entry", "entries") : "—",
        detail: busiestId ? "logged this season" : "The log is empty",
      },
      {
        key: "closest",
        icon: "🤏",
        label: "Closest race",
        team: closest?.team ?? null,
        value: closest ? `${closest.gap.toLocaleString()} apart` : "—",
        detail: closest
          ? `${closest.team.name} is chasing the place above`
          : "Needs at least two teams",
      },
    ];
  }, [teams, events]);

  const latest = events.find((e) => e.delta !== 0);

  return (
    <section className={cn("card overflow-hidden", className)} aria-label="Season highlights">
      <header className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
        <h2 className="font-display text-sm font-bold uppercase tracking-wider text-ink-soft">
          Season highlights
        </h2>
        {latest ? (
          <span className="text-[12px] text-ink-faint">
            last change {relativeTime(latest.at, now)}
          </span>
        ) : null}
      </header>

      <ul className="grid gap-px bg-[var(--line)] sm:grid-cols-2">
        {highlights.map((item) => {
          const theme = item.team ? getColor(item.team.color) : null;
          return (
            <li key={item.key} className="flex items-start gap-3 bg-[var(--surface)] px-4 py-3.5">
              {item.team ? (
                <TeamCrest logo={item.team.logo} color={item.team.color} size="sm" />
              ) : (
                <span
                  aria-hidden="true"
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--surface-2)] text-lg"
                >
                  {item.icon}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                  <span aria-hidden="true" className="mr-1">
                    {item.icon}
                  </span>
                  {item.label}
                </p>
                <p className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5">
                  <span
                    className="font-display text-base font-black"
                    style={{ color: theme?.base ?? "var(--ink)" }}
                  >
                    {item.value}
                  </span>
                  {item.team ? (
                    <span className="truncate text-sm font-semibold text-ink">
                      {item.team.name}
                    </span>
                  ) : null}
                </p>
                <p className="truncate text-[12px] text-ink-faint" title={item.detail}>
                  {item.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
