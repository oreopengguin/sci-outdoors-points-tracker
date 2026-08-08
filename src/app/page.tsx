"use client";

import Link from "next/link";
import { useState } from "react";

import { ActivityFeed, ActivityTicker } from "@/components/activity";
import {
  BoardSkeleton,
  ErrorPanel,
  NotConfigured,
  StorageWarning,
} from "@/components/empty-states";
import { SeasonHighlights } from "@/components/highlights";
import { Leaderboard, StatStrip } from "@/components/leaderboard";
import { useLive } from "@/components/live-state";
import { SiteHeader } from "@/components/site-header";
import { TeamDetailDialog } from "@/components/team-detail";
import { Button } from "@/components/ui";
import type { PublicTeam } from "@/lib/types";

export default function LeaderboardPage() {
  const { data, status, error, refresh } = useLive();
  const [selected, setSelected] = useState<PublicTeam | null>(null);

  return (
    <>
      <SiteHeader />

      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        {status === "loading" && !data ? (
          <div className="space-y-6">
            <div className="h-20 animate-pulse rounded-[var(--radius-card)] bg-[var(--surface)] opacity-60" />
            <BoardSkeleton />
          </div>
        ) : status === "error" && !data ? (
          <ErrorPanel message={error ?? "Unknown error"} onRetry={refresh} />
        ) : data && !data.configured ? (
          <NotConfigured signedIn={data.signedIn} />
        ) : data ? (
          <div className="space-y-6">
            {data.signedIn ? <StorageWarning show={!data.storage.durable} /> : null}

            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--leaf)]">
                  Live standings
                </p>
                <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-ink sm:text-4xl">
                  {data.season.name}
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <Link href="/display">
                  <Button variant="secondary" size="sm">
                    <span aria-hidden="true">🖥</span> Big screen
                  </Button>
                </Link>
                {data.signedIn ? (
                  <Link href="/teacher">
                    <Button variant="primary" size="sm">
                      Award points
                    </Button>
                  </Link>
                ) : null}
              </div>
            </div>

            <StatStrip
              teams={data.teams}
              eventCount={data.events.length}
              seasonName={data.season.name}
              startedAt={data.season.startedAt}
            />

            <Leaderboard teams={data.teams} onSelect={setSelected} />

            <ActivityTicker events={data.events} />

            <div className="grid items-start gap-4 lg:grid-cols-[1.15fr_1fr]">
              <SeasonHighlights teams={data.teams} events={data.events} />
              <ActivityFeed events={data.events} limit={40} />
            </div>

            <p className="pt-2 text-center text-[12px] text-ink-faint">
              Tap a team for its full history. The board refreshes on its own — no need to reload.
            </p>
          </div>
        ) : null}
      </main>

      <TeamDetailDialog
        team={selected}
        events={data?.events ?? []}
        allTeams={data?.teams ?? []}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
