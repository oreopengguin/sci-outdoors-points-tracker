"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo } from "react";

import { Wordmark } from "@/components/brand";
import { CountUp } from "@/components/count-up";
import { BoardSkeleton, NotConfigured } from "@/components/empty-states";
import { ActivityTicker } from "@/components/activity";
import { LeaderboardRow } from "@/components/leaderboard";
import { useLive } from "@/components/live-state";
import { TeamCrest } from "@/components/team-crest";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { clockTime, ordinal } from "@/lib/format";
import { getColor } from "@/lib/palette";
import { useClock } from "@/lib/use-clock";
import type { PublicTeam } from "@/lib/types";

/**
 * Projector mode: huge type, a real podium, no chrome. Built to be left on a
 * screen at the front of a room all day.
 */
export default function DisplayPage() {
  const { data, status } = useLive();
  const now = useClock(15_000);

  const enterFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.().catch(() => undefined);
  }, []);

  // F toggles fullscreen — the one shortcut worth having on a projector.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "f" && !event.metaKey && !event.ctrlKey && !event.altKey) {
        const target = event.target as HTMLElement | null;
        if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
        enterFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enterFullscreen]);

  const podium = useMemo(() => (data ? data.teams.slice(0, 3) : []), [data]);
  const rest = useMemo(() => (data ? data.teams.slice(3) : []), [data]);

  if (!data) {
    return (
      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
        {status === "loading" ? <BoardSkeleton rows={5} /> : null}
      </main>
    );
  }

  if (!data.configured) {
    return (
      <main id="main" className="mx-auto w-full max-w-7xl flex-1 px-6 py-16">
        <NotConfigured signedIn={data.signedIn} />
      </main>
    );
  }

  const leaderPoints = data.teams.length ? data.teams[0].points : 0;
  const lowestPoints = data.teams.length ? data.teams[data.teams.length - 1].points : 0;

  return (
    <main id="main" className="flex min-h-full flex-1 flex-col px-4 py-4 sm:px-8 sm:py-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/" className="rounded-lg" aria-label="Back to the leaderboard">
          <Wordmark size="md" />
        </Link>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-display text-lg font-bold text-ink sm:text-2xl">
              {data.season.name}
            </p>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-faint tabular-nums">
              {now === null ? " " : clockTime(now)} · live
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={enterFullscreen}
            title="Toggle fullscreen (F)"
          >
            ⛶ Fullscreen
          </Button>
        </div>
      </header>

      <div className="mt-5 flex flex-1 flex-col gap-5">
        {podium.length > 0 ? <Podium teams={podium} /> : null}

        {rest.length > 0 ? (
          <ol className="grid gap-2 lg:grid-cols-2">
            {rest.map((team, index) => (
              <li key={team.id}>
                <LeaderboardRow
                  team={team}
                  index={index + 3}
                  leaderPoints={leaderPoints}
                  lowestPoints={lowestPoints}
                  compact
                />
              </li>
            ))}
          </ol>
        ) : null}

        <div className="mt-auto">
          <ActivityTicker events={data.events} />
        </div>
      </div>
    </main>
  );
}

const MEDALS = ["🥇", "🥈", "🥉"];

/** Gold–silver–bronze, with first place raised in the middle on wide screens. */
function Podium({ teams }: { teams: PublicTeam[] }) {
  const order = teams.length >= 3 ? [teams[1], teams[0], teams[2]] : teams;
  const heights = teams.length >= 3 ? ["lg:mt-10", "", "lg:mt-16"] : [""];

  return (
    <ol className="grid gap-3 sm:gap-4 lg:grid-cols-3" aria-label="Top three teams">
      {order.map((team, i) => {
        const theme = getColor(team.color);
        const first = team.rank === 1 && !team.tied;
        return (
          <li
            key={team.id}
            className={cn("anim-rise", heights[i] ?? "")}
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <div
              className={cn(
                "relative flex h-full flex-col items-center overflow-hidden rounded-[var(--radius-card)] border px-5 text-center",
                first ? "py-8 sm:py-10" : "py-6 sm:py-7",
              )}
              style={{
                borderColor: `color-mix(in oklab, ${theme.base} ${first ? 55 : 32}%, transparent)`,
                background: `linear-gradient(168deg, color-mix(in oklab, ${theme.base} ${first ? 20 : 12}%, var(--surface)) 0%, var(--surface) 72%)`,
                boxShadow: first
                  ? `0 2px 6px rgb(22 32 26 / .06), 0 34px 70px -32px ${theme.base}`
                  : "var(--shadow-card)",
              }}
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1.5"
                style={{
                  background: `linear-gradient(90deg, ${theme.light}, ${theme.base}, ${theme.dark})`,
                }}
              />

              <span
                className="flex items-center gap-1.5 font-display text-[11px] font-black uppercase tracking-[0.22em]"
                style={{ color: theme.base }}
              >
                {!team.tied && team.rank <= 3 ? (
                  <span aria-hidden="true" className="text-base">
                    {MEDALS[team.rank - 1]}
                  </span>
                ) : null}
                {ordinal(team.rank)}
                {first ? " · leading" : team.tied ? " · tied" : ""}
              </span>

              <TeamCrest
                logo={team.logo}
                color={team.color}
                size={first ? "hero" : "xl"}
                glow={first}
                className={cn("mt-4", first && "anim-float")}
              />

              <p
                className={cn(
                  "mt-4 max-w-full truncate font-display font-black tracking-tight text-ink",
                  first ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl",
                )}
                title={team.name}
              >
                {team.name}
              </p>

              <CountUp
                value={team.points}
                className={cn(
                  "mt-1 font-display font-black leading-none",
                  first ? "text-6xl sm:text-8xl" : "text-5xl sm:text-6xl",
                )}
              />
              <span className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-ink-faint">
                points
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
