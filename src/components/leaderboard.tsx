"use client";

import { useEffect, useMemo, useRef } from "react";

import { CountUp } from "@/components/count-up";
import { useCelebration } from "@/components/celebration";
import { TeamCrest, type CrestSize } from "@/components/team-crest";
import { Chip } from "@/components/ui";
import { cn } from "@/lib/cn";
import { ordinal, plural } from "@/lib/format";
import { getColor } from "@/lib/palette";
import { useClock } from "@/lib/use-clock";
import type { PublicTeam } from "@/lib/types";

function movement(team: PublicTeam): "up" | "down" | null {
  if (team.previousRank == null || team.previousRank === team.rank) return null;
  return team.rank < team.previousRank ? "up" : "down";
}

/** Bar length is relative to the leader, with a floor so a 0 never vanishes. */
function barFraction(points: number, leader: number, lowest: number): number {
  const span = Math.max(leader - Math.min(0, lowest), 1);
  const value = (points - Math.min(0, lowest)) / span;
  return Math.max(0.045, Math.min(1, value));
}

export function LeaderboardRow({
  team,
  leaderPoints,
  lowestPoints,
  index,
  compact = false,
  crestSize,
  onSelect,
}: {
  team: PublicTeam;
  leaderPoints: number;
  lowestPoints: number;
  index: number;
  compact?: boolean;
  crestSize?: CrestSize;
  onSelect?: (team: PublicTeam) => void;
}) {
  const theme = getColor(team.color);
  // Nobody "leads" a tie — at the start of a season every team is on zero, and
  // crowning all of them makes the board meaningless.
  const isLeader = team.rank === 1 && !team.tied;
  const move = movement(team);
  const fraction = barFraction(team.points, leaderPoints, lowestPoints);
  const gap = leaderPoints - team.points;

  const Wrapper = onSelect ? "button" : "div";

  return (
    <Wrapper
      {...(onSelect ? { type: "button" as const, onClick: () => onSelect(team) } : {})}
      className={cn(
        "group relative flex w-full items-center gap-3 overflow-hidden rounded-[var(--radius-card)] border text-left transition anim-rise sm:gap-5",
        compact ? "px-3 py-3 sm:px-4" : "px-4 py-4 sm:px-6 sm:py-5",
        onSelect && "cursor-pointer hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
      )}
      style={{
        animationDelay: `${Math.min(index, 12) * 55}ms`,
        borderColor: isLeader
          ? `color-mix(in oklab, ${theme.base} 45%, transparent)`
          : "var(--line)",
        background: isLeader
          ? `linear-gradient(112deg, color-mix(in oklab, ${theme.base} 14%, var(--surface)) 0%, var(--surface) 62%)`
          : "var(--surface)",
        boxShadow: isLeader
          ? `0 1px 2px rgb(22 32 26 / 0.05), 0 18px 44px -26px ${theme.base}`
          : "var(--shadow-card)",
      }}
    >
      {/* Colour spine — reads the team's identity even at a glance from across a room. */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[5px]"
        style={{ background: `linear-gradient(${theme.light}, ${theme.dark})` }}
      />

      <span
        className={cn(
          "ml-1.5 flex shrink-0 flex-col items-center leading-none",
          compact ? "w-8" : "w-10 sm:w-14",
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            "font-display font-black tabular-nums",
            compact ? "text-2xl" : "text-3xl sm:text-5xl",
          )}
          style={{ color: isLeader ? theme.base : "var(--ink-faint)" }}
        >
          {team.rank}
        </span>
      </span>

      <TeamCrest
        logo={team.logo}
        color={team.color}
        size={crestSize ?? (compact ? "sm" : "md")}
        glow={isLeader}
        className={isLeader ? "anim-float" : undefined}
      />

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span
            className={cn(
              "truncate font-display font-bold text-ink",
              compact ? "text-base" : "text-lg sm:text-2xl",
            )}
          >
            {team.name}
          </span>
          {isLeader ? (
            <Chip tone="gold">
              <span aria-hidden="true">★</span> Leading
            </Chip>
          ) : team.tied ? (
            <Chip tone="neutral">Tied {ordinal(team.rank)}</Chip>
          ) : null}
          {move ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-bold anim-pop",
                move === "up"
                  ? "bg-[var(--leaf-soft)] text-[var(--leaf)]"
                  : "bg-[#c0392b1a] text-[#c0392b]",
              )}
              title={`Moved ${move} from ${ordinal(team.previousRank!)}`}
            >
              {move === "up" ? "▲" : "▼"}
              <span className="sr-only">
                Moved {move} from {ordinal(team.previousRank!)}
              </span>
            </span>
          ) : null}
        </span>

        <span className="mt-2 flex items-center gap-2">
          <span
            className="relative h-2 flex-1 overflow-hidden rounded-full"
            style={{ background: `color-mix(in oklab, ${theme.base} 14%, transparent)` }}
            role="presentation"
          >
            <span
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-[width] duration-[900ms] ease-out",
                isLeader && "shimmer",
              )}
              style={{
                width: `${fraction * 100}%`,
                background: `linear-gradient(90deg, ${theme.light}, ${theme.base})`,
              }}
            />
          </span>
          {!compact && !isLeader && gap > 0 ? (
            <span className="hidden shrink-0 text-[12px] font-semibold text-ink-faint tabular-nums sm:block">
              {gap.toLocaleString()} behind
            </span>
          ) : null}
        </span>
      </span>

      <span className="flex shrink-0 flex-col items-end">
        <CountUp
          value={team.points}
          className={cn(
            "font-display font-black leading-none",
            compact ? "text-2xl" : "text-3xl sm:text-5xl",
          )}
        />
        <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
          {compact ? "pts" : "points"}
        </span>
      </span>
    </Wrapper>
  );
}

export function Leaderboard({
  teams,
  compact = false,
  onSelect,
  celebrateLeadChange = true,
}: {
  teams: PublicTeam[];
  compact?: boolean;
  onSelect?: (team: PublicTeam) => void;
  celebrateLeadChange?: boolean;
}) {
  const celebrate = useCelebration();
  const lastLeader = useRef<string | null>(null);

  const { leaderPoints, lowestPoints } = useMemo(
    () => ({
      leaderPoints: teams.length ? Math.max(...teams.map((t) => t.points)) : 0,
      lowestPoints: teams.length ? Math.min(...teams.map((t) => t.points)) : 0,
    }),
    [teams],
  );

  // A change at the top is the moment worth marking. Everything else is a
  // number ticking over.
  useEffect(() => {
    if (!celebrateLeadChange || teams.length === 0) return;
    const leader = teams[0];
    // A shared top spot isn't a new leader; wait until someone actually pulls ahead.
    if (leader.tied) return;
    if (lastLeader.current && lastLeader.current !== leader.id) {
      celebrate(
        { x: 0.5, y: 0.32 },
        [getColor(leader.color).base, getColor(leader.color).light, "#c9922a"],
        3,
      );
    }
    lastLeader.current = leader.id;
  }, [teams, celebrate, celebrateLeadChange]);

  if (teams.length === 0) return null;

  return (
    <ol className={cn("flex flex-col", compact ? "gap-2" : "gap-3")} aria-label="Team standings">
      {teams.map((team, index) => (
        <li key={team.id}>
          <LeaderboardRow
            team={team}
            index={index}
            leaderPoints={leaderPoints}
            lowestPoints={lowestPoints}
            compact={compact}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ol>
  );
}

/** Season summary numbers shown above the board. */
export function StatStrip({
  teams,
  eventCount,
  seasonName,
  startedAt,
}: {
  teams: PublicTeam[];
  eventCount: number;
  seasonName: string;
  startedAt: number;
}) {
  const now = useClock(60_000);
  const total = teams.reduce((sum, t) => sum + t.points, 0);
  const leader = teams[0];
  const spread = teams.length > 1 ? teams[0].points - teams[teams.length - 1].points : 0;
  const days = now === null ? null : Math.max(1, Math.ceil((now - startedAt) / 86_400_000));

  const stats = [
    {
      label: "Season",
      value: seasonName,
      sub: days === null ? "in progress" : plural(days, "day"),
    },
    { label: "Teams", value: String(teams.length), sub: plural(eventCount, "entry", "entries") },
    { label: "Points awarded", value: total.toLocaleString(), sub: "across all teams" },
    {
      label: "Lead",
      value: leader ? `${spread.toLocaleString()}` : "—",
      sub: teams.length > 1 ? "first to last" : "one team",
    },
  ];

  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
      {stats.map((stat) => (
        <div key={stat.label} className="card-quiet px-3.5 py-3">
          <dt className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
            {stat.label}
          </dt>
          <dd className="mt-1 truncate font-display text-lg font-bold text-ink" title={stat.value}>
            {stat.value}
          </dd>
          <dd className="text-[12px] text-ink-faint">{stat.sub}</dd>
        </div>
      ))}
    </dl>
  );
}
