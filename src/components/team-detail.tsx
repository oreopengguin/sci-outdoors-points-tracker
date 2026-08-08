"use client";

import { useMemo } from "react";

import { ActivityFeed } from "@/components/activity";
import { TeamCrest } from "@/components/team-crest";
import { Chip, Dialog } from "@/components/ui";
import { getLogo } from "@/lib/logos";
import { getColor } from "@/lib/palette";
import { ordinal, plural, signed } from "@/lib/format";
import type { PointEvent, PublicTeam } from "@/lib/types";

/**
 * Everything a team has done this season, derived on the fly from the shared
 * event log — there is no per-team record to fall out of sync.
 */
export function TeamDetailDialog({
  team,
  events,
  allTeams,
  onClose,
}: {
  team: PublicTeam | null;
  events: PointEvent[];
  allTeams: PublicTeam[];
  onClose: () => void;
}) {
  const stats = useMemo(() => {
    if (!team) return null;
    const own = events.filter((e) => e.teamId === team.id);
    const scoring = own.filter((e) => e.delta !== 0);
    const gains = scoring.filter((e) => e.delta > 0);
    const losses = scoring.filter((e) => e.delta < 0);
    const best = gains.reduce<PointEvent | null>(
      (top, e) => (!top || e.delta > top.delta ? e : top),
      null,
    );
    const leader = allTeams[0];
    return {
      own,
      entries: scoring.length,
      earned: gains.reduce((sum, e) => sum + e.delta, 0),
      lost: losses.reduce((sum, e) => sum + e.delta, 0),
      best,
      behind: leader && leader.id !== team.id ? leader.points - team.points : 0,
      average: scoring.length ? Math.round(team.points / scoring.length) : 0,
    };
  }, [team, events, allTeams]);

  if (!team || !stats) return null;

  const theme = getColor(team.color);
  const crest = getLogo(team.logo);

  return (
    <Dialog
      open
      onClose={onClose}
      title={team.name}
      description={team.tied ? `Tied ${ordinal(team.rank)} place` : `${ordinal(team.rank)} place`}
      size="lg"
    >
      <div className="space-y-5">
        <div
          className="flex items-center gap-4 rounded-2xl px-4 py-4"
          style={{
            background: `linear-gradient(112deg, color-mix(in oklab, ${theme.base} 18%, var(--surface)) 0%, var(--surface) 70%)`,
            border: `1px solid color-mix(in oklab, ${theme.base} 30%, transparent)`,
          }}
        >
          <TeamCrest logo={team.logo} color={team.color} size="lg" glow />
          <div className="min-w-0 flex-1">
            <p className="font-display text-2xl font-black text-ink">
              {team.points.toLocaleString()} pts
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[13px] text-ink-soft">
              <Chip tone={team.rank === 1 && !team.tied ? "gold" : "neutral"}>
                {team.tied ? `Tied ${ordinal(team.rank)}` : ordinal(team.rank)}
              </Chip>
              <span>
                {crest.label} · {theme.label}
              </span>
            </p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { label: "Entries", value: plural(stats.entries, "entry", "entries") },
            { label: "Earned", value: signed(stats.earned) },
            { label: "Deducted", value: stats.lost === 0 ? "0" : signed(stats.lost) },
            {
              label: team.rank === 1 ? "Lead" : "Behind first",
              value:
                team.rank === 1
                  ? allTeams.length > 1
                    ? signed(team.points - allTeams[1].points)
                    : "—"
                  : stats.behind.toLocaleString(),
            },
          ].map((stat) => (
            <div key={stat.label} className="card-quiet px-3 py-2.5">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                {stat.label}
              </dt>
              <dd className="mt-0.5 font-display text-base font-bold text-ink tabular-nums">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>

        {stats.best ? (
          <div className="card-quiet px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-faint">
              Biggest single award
            </p>
            <p className="mt-1 text-sm text-ink">
              <span className="font-display font-black text-[var(--leaf)]">
                {signed(stats.best.delta)}
              </span>{" "}
              — {stats.best.reason}
            </p>
          </div>
        ) : null}

        <ActivityFeed
          events={stats.own}
          title={`${team.name} history`}
          emptyLabel="No points recorded for this team yet."
        />
      </div>
    </Dialog>
  );
}
