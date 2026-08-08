"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { ActivityFeed } from "@/components/activity";
import { AwardDialog } from "@/components/award-dialog";
import { EditTeamDialog } from "@/components/edit-team-dialog";
import { LoadingPanel, StorageWarning } from "@/components/empty-states";
import { useLive } from "@/components/live-state";
import { SiteHeader } from "@/components/site-header";
import { TeamCrest } from "@/components/team-crest";
import { Button, Chip, useToast } from "@/components/ui";
import { api, ApiError } from "@/lib/client";
import { ordinal, plural, signed } from "@/lib/format";
import { getColor } from "@/lib/palette";
import type { PointEvent, PublicTeam } from "@/lib/types";

/**
 * The teacher console. Everything that changes a score lives here, and every
 * one of those actions round-trips to a server route that re-checks the
 * session — the UI is a convenience, not the security boundary.
 */
export default function TeacherPage() {
  const { data, applyState, refresh } = useLive();
  const { push } = useToast();

  const [awarding, setAwarding] = useState<PublicTeam | null>(null);
  const [editing, setEditing] = useState<PublicTeam | null>(null);
  const [undoingId, setUndoingId] = useState<string | null>(null);

  const teams = useMemo(() => data?.teams ?? [], [data]);

  // Number keys 1–9 open the award sheet for that rank. Fast for a teacher
  // running a session with a laptop open.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      if (awarding || editing) return;
      const index = Number.parseInt(event.key, 10) - 1;
      if (Number.isInteger(index) && index >= 0 && index < teams.length) {
        event.preventDefault();
        setAwarding(teams[index]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [teams, awarding, editing]);

  const undo = useCallback(
    async (event: PointEvent) => {
      setUndoingId(event.id);
      try {
        const result = await api.undo(event.id);
        applyState(result.state);
        push({ tone: "info", title: `Took back ${signed(event.delta)} from ${event.teamName}` });
      } catch (err) {
        push({
          tone: "error",
          title: "Couldn't undo that",
          detail: err instanceof ApiError ? err.message : undefined,
        });
        void refresh();
      } finally {
        setUndoingId(null);
      }
    },
    [applyState, push, refresh],
  );

  if (!data) {
    return (
      <>
        <SiteHeader />
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
          <LoadingPanel label="Opening the console…" />
        </main>
      </>
    );
  }

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pb-20 pt-6 sm:px-6 sm:pt-8">
        <div className="space-y-6">
          <StorageWarning show={!data.storage.durable} />

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--leaf)]">
                Teacher console
              </p>
              <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-ink">
                {data.configured ? data.season.name : "No season yet"}
              </h1>
              <p className="mt-1 text-[13px] text-ink-soft">
                Signed in as <span className="font-semibold text-ink">{data.teacher}</span>
                {data.configured
                  ? ` · ${plural(teams.length, "team")} · ${plural(data.events.length, "log entry", "log entries")}`
                  : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/">
                <Button variant="secondary" size="md">
                  View board
                </Button>
              </Link>
              <Link href="/teacher/setup">
                <Button variant={data.configured ? "secondary" : "primary"} size="md">
                  {data.configured ? "Reset board…" : "Set up the season"}
                </Button>
              </Link>
            </div>
          </div>

          {!data.configured ? (
            <div className="card px-6 py-12 text-center">
              <p className="font-display text-lg font-bold text-ink">Nothing to score yet</p>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-ink-soft">
                Choose how many teams you have, then name them and pick a crest for each one.
              </p>
              <Link href="/teacher/setup">
                <Button variant="primary" size="lg" className="mt-5">
                  Set up the season
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <section aria-label="Teams">
                <div className="mb-2.5 flex items-baseline justify-between">
                  <h2 className="font-display text-sm font-bold uppercase tracking-wider text-ink-soft">
                    Tap a team to award points
                  </h2>
                  <span className="hidden text-[12px] text-ink-faint sm:block">
                    Tip: press 1–9 for the team at that rank
                  </span>
                </div>

                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {teams.map((team, index) => {
                    const theme = getColor(team.color);
                    return (
                      <li
                        key={team.id}
                        className="anim-rise"
                        style={{ animationDelay: `${index * 45}ms` }}
                      >
                        <div
                          className="card group relative flex h-full flex-col overflow-hidden p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]"
                          style={{
                            borderColor: `color-mix(in oklab, ${theme.base} 26%, var(--line))`,
                          }}
                        >
                          <span
                            aria-hidden="true"
                            className="absolute inset-x-0 top-0 h-1"
                            style={{
                              background: `linear-gradient(90deg, ${theme.light}, ${theme.dark})`,
                            }}
                          />

                          <div className="flex items-start gap-3">
                            <TeamCrest
                              logo={team.logo}
                              color={team.color}
                              size="md"
                              glow={team.rank === 1 && !team.tied}
                            />
                            <div className="min-w-0 flex-1">
                              <p
                                className="truncate font-display text-lg font-bold text-ink"
                                title={team.name}
                              >
                                {team.name}
                              </p>
                              <p className="mt-0.5 flex items-center gap-1.5">
                                <Chip tone={team.rank === 1 && !team.tied ? "gold" : "neutral"}>
                                  {team.tied ? `Tied ${ordinal(team.rank)}` : ordinal(team.rank)}
                                </Chip>
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditing(team)}
                              aria-label={`Edit ${team.name}`}
                              className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-faint opacity-0 transition hover:bg-[color-mix(in_oklab,var(--ink)_8%,transparent)] hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
                            >
                              ✎
                            </button>
                          </div>

                          <p className="mt-3 font-display text-4xl font-black leading-none text-ink tabular-nums">
                            {team.points.toLocaleString()}
                            <span className="ml-1.5 text-[11px] font-bold uppercase tracking-wider text-ink-faint">
                              pts
                            </span>
                          </p>

                          <div className="mt-4 flex gap-2">
                            <Button
                              variant="primary"
                              className="flex-1"
                              onClick={() => setAwarding(team)}
                            >
                              Award points
                            </Button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>

              <ActivityFeed
                events={data.events}
                title="Recent entries"
                undoable
                onUndo={undo}
                busyId={undoingId}
                limit={40}
                emptyLabel="No points awarded yet this season."
              />

              <div className="card border-[#c0392b44] bg-[#c0392b08] p-5">
                <h2 className="font-display text-base font-bold text-ink">Danger zone</h2>
                <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-ink-soft">
                  Resetting starts a brand-new season: you choose how many teams there are and give
                  each one a name and crest, and every current score is cleared. You&rsquo;ll be
                  asked to type a confirmation first.
                </p>
                <Link href="/teacher/setup">
                  <Button variant="danger" className="mt-4">
                    Reset the board…
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </main>

      <AwardDialog team={awarding} onClose={() => setAwarding(null)} onApplied={applyState} />
      <EditTeamDialog team={editing} onClose={() => setEditing(null)} onApplied={applyState} />
    </>
  );
}
