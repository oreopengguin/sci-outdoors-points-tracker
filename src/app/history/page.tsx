"use client";

import { useMemo, useState } from "react";

import { ActivityFeed } from "@/components/activity";
import { ErrorPanel, LoadingPanel, NotConfigured } from "@/components/empty-states";
import { useLive } from "@/components/live-state";
import { SiteHeader } from "@/components/site-header";
import { TeamCrest } from "@/components/team-crest";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { plural, signed } from "@/lib/format";
import { getColor } from "@/lib/palette";

type Filter = "all" | "awards" | "deductions";

/** The full audit trail: every entry, who logged it and when. */
export default function HistoryPage() {
  const { data, status, error, refresh } = useLive();
  const [teamId, setTeamId] = useState<string | "all">("all");
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const events = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.events.filter((event) => {
      if (teamId !== "all" && event.teamId !== teamId) return false;
      if (filter === "awards" && event.delta <= 0) return false;
      if (filter === "deductions" && event.delta >= 0) return false;
      if (q && !`${event.teamName} ${event.reason}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, teamId, filter, query]);

  const totals = useMemo(() => {
    const awarded = events.filter((e) => e.delta > 0).reduce((s, e) => s + e.delta, 0);
    const removed = events.filter((e) => e.delta < 0).reduce((s, e) => s + e.delta, 0);
    return { awarded, removed, net: awarded + removed };
  }, [events]);

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        {!data ? (
          status === "error" ? (
            <ErrorPanel message={error ?? "Unknown error"} onRetry={refresh} />
          ) : (
            <LoadingPanel label="Loading the log…" />
          )
        ) : !data.configured ? (
          <NotConfigured signedIn={data.signedIn} />
        ) : (
          <div className="space-y-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--leaf)]">
                {data.season.name}
              </p>
              <h1 className="mt-1 font-display text-3xl font-black tracking-tight text-ink">
                Point history
              </h1>
              <p className="mt-1.5 text-sm text-ink-soft">
                Every entry this season, newest first. The log keeps the most recent 400 entries.
              </p>
            </div>

            <div className="card space-y-3 p-4">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search reasons or team names…"
                aria-label="Search the point log"
                className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-[var(--leaf)] focus:outline-none focus:ring-4 focus:ring-[color-mix(in_oklab,var(--leaf)_18%,transparent)]"
              />

              <div className="flex flex-wrap gap-1.5">
                <FilterChip active={teamId === "all"} onClick={() => setTeamId("all")}>
                  All teams
                </FilterChip>
                {data.teams.map((team) => (
                  <FilterChip
                    key={team.id}
                    active={teamId === team.id}
                    onClick={() => setTeamId(team.id)}
                    accent={getColor(team.color).base}
                  >
                    <TeamCrest
                      logo={team.logo}
                      color={team.color}
                      size="xs"
                      className="-ml-1 h-5 w-5"
                    />
                    {team.name}
                  </FilterChip>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5 border-t border-[var(--line)] pt-3">
                {(
                  [
                    ["all", "Everything"],
                    ["awards", "Awards only"],
                    ["deductions", "Deductions only"],
                  ] as const
                ).map(([value, label]) => (
                  <FilterChip
                    key={value}
                    active={filter === value}
                    onClick={() => setFilter(value)}
                  >
                    {label}
                  </FilterChip>
                ))}
                {query || teamId !== "all" || filter !== "all" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={() => {
                      setQuery("");
                      setTeamId("all");
                      setFilter("all");
                    }}
                  >
                    Clear filters
                  </Button>
                ) : null}
              </div>
            </div>

            <dl className="grid grid-cols-3 gap-2">
              {[
                { label: "Showing", value: plural(events.length, "entry", "entries") },
                { label: "Awarded", value: signed(totals.awarded) },
                { label: "Deducted", value: totals.removed === 0 ? "0" : signed(totals.removed) },
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

            <ActivityFeed
              events={events}
              title="Log"
              emptyLabel="No entries match those filters."
              className="[&_ul]:max-h-none"
            />
          </div>
        )}
      </main>
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  accent,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition",
        active
          ? "border-transparent text-white"
          : "border-[var(--line-strong)] bg-[var(--surface)] text-ink-soft hover:text-ink",
      )}
      style={active ? { background: accent ?? "var(--leaf)" } : undefined}
    >
      {children}
    </button>
  );
}
