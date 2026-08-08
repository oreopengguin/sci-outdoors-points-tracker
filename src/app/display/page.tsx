"use client";

import Link from "next/link";
import { useCallback, useEffect } from "react";

import { Wordmark } from "@/components/brand";
import { CountUp } from "@/components/count-up";
import { BoardSkeleton, NotConfigured } from "@/components/empty-states";
import { ActivityTicker } from "@/components/activity";
import { useLive } from "@/components/live-state";
import { TeamCrest } from "@/components/team-crest";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { clockTime, ordinal } from "@/lib/format";
import { getColor } from "@/lib/palette";
import { useClock } from "@/lib/use-clock";
import { useEntryAnimation } from "@/lib/use-entry-animation";
import type { PublicTeam } from "@/lib/types";

const MEDALS = ["🥇", "🥈", "🥉"];

/**
 * Projector mode: every team on one screen, ranked top to bottom, no scrolling
 * and no chrome. Built to be left on a screen at the front of a room all day.
 */
export default function DisplayPage() {
  const { data, status } = useLive();
  const now = useClock(15_000);
  const animateIn = useEntryAnimation();

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

  const teams = data.teams;
  const leaderPoints = teams.length ? teams[0].points : 0;
  const lowestPoints = teams.length ? teams[teams.length - 1].points : 0;

  /**
   * Type scales with how many teams there are, so a two-team board is huge and
   * a sixteen-team board still fits. The flex rows below do the exact fitting;
   * these sizes just keep the proportions right at each count.
   */
  const rowVh = Math.max(3.4, 66 / Math.max(teams.length, 1));
  const scale = {
    crest: `clamp(26px, ${(rowVh * 0.66).toFixed(2)}vh, 104px)`,
    rank: `clamp(0.95rem, ${(rowVh * 0.4).toFixed(2)}vh, 3.4rem)`,
    name: `clamp(0.95rem, ${(rowVh * 0.34).toFixed(2)}vh, 3rem)`,
    points: `clamp(1.15rem, ${(rowVh * 0.52).toFixed(2)}vh, 5rem)`,
    medal: `clamp(0.7rem, ${(rowVh * 0.24).toFixed(2)}vh, 2rem)`,
  };

  return (
    <main
      id="main"
      className="flex h-[100dvh] flex-1 flex-col overflow-hidden px-3 py-3 sm:px-6 sm:py-4"
    >
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <Link href="/" className="rounded-lg" aria-label="Back to the leaderboard">
          <Wordmark size="md" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="font-display text-base font-bold text-ink sm:text-2xl">
              {data.season.name}
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint tabular-nums sm:text-[12px]">
              {now === null ? " " : clockTime(now)} · live
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

      {/* One ranked column. `flex-1` on every row divides the leftover height
          evenly, which is what guarantees the whole table fits without a
          scrollbar no matter how many teams there are. */}
      <ol
        className="mt-2.5 flex min-h-0 flex-1 flex-col gap-1.5 sm:mt-3 sm:gap-2"
        aria-label="Team standings, highest first"
      >
        {teams.map((team, index) => (
          <li key={team.id} className="display-row flex min-h-0 flex-1">
            <DisplayRow
              team={team}
              index={index}
              leaderPoints={leaderPoints}
              lowestPoints={lowestPoints}
              scale={scale}
              animateIn={animateIn}
            />
          </li>
        ))}
      </ol>

      <div className="mt-2 shrink-0 sm:mt-3">
        <ActivityTicker events={data.events} />
      </div>
    </main>
  );
}

/** Bar length is relative to the leader, with a floor so a 0 never vanishes. */
function barFraction(points: number, leader: number, lowest: number): number {
  const span = Math.max(leader - Math.min(0, lowest), 1);
  return Math.max(0.045, Math.min(1, (points - Math.min(0, lowest)) / span));
}

function DisplayRow({
  team,
  index,
  leaderPoints,
  lowestPoints,
  scale,
  animateIn,
}: {
  team: PublicTeam;
  index: number;
  leaderPoints: number;
  lowestPoints: number;
  scale: { crest: string; rank: string; name: string; points: string; medal: string };
  /** Off after first paint, so a reorder never blanks a row. */
  animateIn: boolean;
}) {
  const theme = getColor(team.color);
  const leading = team.rank === 1 && !team.tied;
  const fraction = barFraction(team.points, leaderPoints, lowestPoints);

  return (
    <div
      className={cn(
        "relative flex w-full min-w-0 items-center gap-2.5 overflow-hidden rounded-2xl border px-2.5 sm:gap-4 sm:px-4",
        animateIn && "anim-rise",
      )}
      style={{
        animationDelay: animateIn ? `${Math.min(index, 14) * 45}ms` : undefined,
        borderColor: leading
          ? `color-mix(in oklab, ${theme.base} 52%, transparent)`
          : `color-mix(in oklab, ${theme.base} 22%, var(--line))`,
        background: leading
          ? `linear-gradient(112deg, color-mix(in oklab, ${theme.base} 20%, var(--surface)) 0%, var(--surface) 66%)`
          : `linear-gradient(112deg, color-mix(in oklab, ${theme.base} 8%, var(--surface)) 0%, var(--surface) 60%)`,
        boxShadow: leading
          ? `0 2px 8px rgb(22 32 26 / 0.06), 0 22px 48px -28px ${theme.base}`
          : "var(--shadow-card)",
      }}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ background: `linear-gradient(${theme.light}, ${theme.dark})` }}
      />

      <span
        className="ml-1 grid shrink-0 place-items-center font-display font-black leading-none tabular-nums"
        style={{
          fontSize: scale.rank,
          minWidth: "1.6em",
          color: leading ? theme.base : "var(--ink-faint)",
        }}
        aria-hidden="true"
      >
        {team.rank}
      </span>

      <TeamCrest
        logo={team.logo}
        color={team.color}
        dimension={scale.crest}
        glow={leading}
        className={leading ? "anim-float" : undefined}
      />

      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <span className="flex min-w-0 items-baseline gap-2">
          <span
            className="min-w-0 truncate font-display font-black leading-tight tracking-tight text-ink"
            style={{ fontSize: scale.name }}
            title={team.name}
          >
            {team.name}
          </span>
          {team.rank <= 3 && !team.tied ? (
            <span
              aria-hidden="true"
              className="display-medal shrink-0 leading-none opacity-80"
              style={{ fontSize: scale.medal }}
            >
              {MEDALS[team.rank - 1]}
            </span>
          ) : null}
          {team.tied ? (
            <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-ink-faint">
              tied {ordinal(team.rank)}
            </span>
          ) : null}
        </span>

        <span
          className="display-bar relative h-1.5 w-full overflow-hidden rounded-full sm:h-2"
          role="presentation"
          style={{ background: `color-mix(in oklab, ${theme.base} 14%, transparent)` }}
        >
          <span
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-[width] duration-[900ms] ease-out",
              leading && "shimmer",
            )}
            style={{
              width: `${fraction * 100}%`,
              background: `linear-gradient(90deg, ${theme.light}, ${theme.base})`,
            }}
          />
        </span>
      </span>

      <CountUp
        value={team.points}
        className="shrink-0 font-display font-black leading-none"
        style={{ fontSize: scale.points }}
      />
    </div>
  );
}
