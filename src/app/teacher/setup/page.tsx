"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { LeafMark } from "@/components/brand";
import { useCelebration } from "@/components/celebration";
import { LoadingPanel } from "@/components/empty-states";
import { useLive } from "@/components/live-state";
import { SiteHeader } from "@/components/site-header";
import { TeamCrest } from "@/components/team-crest";
import { TeamDraftRow } from "@/components/team-editor";
import { Button, Chip, Field, inputClass, useToast } from "@/components/ui";
import { api, ApiError } from "@/lib/client";
import { cn } from "@/lib/cn";
import { draftTeams } from "@/lib/drafts";
import { LOGO_CATEGORIES, LOGO_COUNT } from "@/lib/logos";
import { getColor } from "@/lib/palette";
import { LIMITS, teamNameSchema, type TeamDraft } from "@/lib/types";

type Step = "size" | "teams" | "confirm";

const STEPS: { id: Step; label: string }[] = [
  { id: "size", label: "How many teams" },
  { id: "teams", label: "Name & crest" },
  { id: "confirm", label: "Confirm reset" },
];

/**
 * Suggests the next season's name. "Autumn Expedition" becomes
 * "Autumn Expedition 2"; "Season 3" becomes "Season 4".
 */
function nextSeasonName(current: string | null): string {
  if (!current) return "Season 1";
  const match = current.trim().match(/^(.*?)(\d+)$/);
  const suggestion = match ? `${match[1]}${Number(match[2]) + 1}` : `${current.trim()} 2`;
  return suggestion.slice(0, LIMITS.maxSeasonNameLength);
}

/**
 * The season setup wizard. It is the only way to (re)create the board, and it
 * always ends with an explicit typed confirmation — resetting wipes every score.
 */
export default function SetupPage() {
  const { data } = useLive();

  // Wait for the current season before mounting the wizard, so its starting
  // values (team count, suggested name) can be derived once instead of synced.
  if (!data) {
    return (
      <>
        <SiteHeader />
        <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
          <LoadingPanel label="Loading the current season…" />
        </main>
      </>
    );
  }

  return <SetupWizard key={data.season.id} />;
}

function SetupWizard() {
  const router = useRouter();
  const { data, applyState, refresh } = useLive();
  const { push } = useToast();
  const celebrate = useCelebration();

  const alreadyConfigured = data?.configured ?? false;
  const existingTeamCount = data?.teams.length ?? 0;
  const initialCount = alreadyConfigured
    ? Math.min(LIMITS.maxTeams, Math.max(LIMITS.minTeams, existingTeamCount))
    : 4;

  const [step, setStep] = useState<Step>("size");
  const [count, setCount] = useState(initialCount);
  const [seasonName, setSeasonName] = useState(() =>
    nextSeasonName(alreadyConfigured ? (data?.season.name ?? null) : null),
  );
  const [drafts, setDrafts] = useState<TeamDraft[]>(() => draftTeams(initialCount));
  const [confirmText, setConfirmText] = useState("");
  const [busy, setBusy] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const setCountAndDrafts = useCallback((next: number) => {
    const clamped = Math.max(LIMITS.minTeams, Math.min(LIMITS.maxTeams, next));
    setCount(clamped);
    // Keep whatever the teacher has already typed; only add or trim from the end.
    setDrafts((prev) => draftTeams(clamped, prev));
  }, []);

  const errors = useMemo(() => {
    const map = new Map<number, string>();
    const seen = new Map<string, number>();
    drafts.forEach((draft, i) => {
      const parsed = teamNameSchema.safeParse(draft.name);
      if (!parsed.success) {
        map.set(i, parsed.error.issues[0]?.message ?? "That name won't work");
        return;
      }
      const key = parsed.data.toLowerCase();
      if (seen.has(key)) map.set(i, "Another team already has this name");
      else seen.set(key, i);
    });
    return map;
  }, [drafts]);

  const teamsValid = errors.size === 0 && drafts.length === count;

  const submit = async () => {
    if (busy || !teamsValid || confirmText.trim().toUpperCase() !== "RESET") return;
    setBusy(true);
    setServerError(null);
    try {
      const payload = drafts.map((d) => ({ ...d, name: d.name.trim() }));
      const result = await api.reset(seasonName.trim() || "New season", payload);
      applyState(result.state);
      await refresh();
      celebrate(
        { x: 0.5, y: 0.4 },
        payload.map((d) => getColor(d.color).base),
        3,
      );
      push({
        tone: "success",
        title: `${seasonName.trim() || "New season"} is live`,
        detail: `${payload.length} teams, all starting at zero.`,
      });
      router.push("/teacher");
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  };

  const stepIndex = STEPS.findIndex((s) => s.id === step);

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 pb-20 pt-6 sm:px-6 sm:pt-8">
        <div className="mb-6">
          <Link href="/teacher" className="text-[13px] font-semibold text-ink-soft hover:text-ink">
            ← Back to the console
          </Link>
          <h1 className="mt-2 font-display text-3xl font-black tracking-tight text-ink">
            {alreadyConfigured ? "Reset the board" : "Set up the season"}
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">
            {alreadyConfigured
              ? `This replaces the current season. All ${existingTeamCount} teams and every point they have earned will be cleared.`
              : "Choose how many teams there are, then give each one a name and a crest."}
          </p>
        </div>

        {/* Step rail */}
        <ol className="mb-6 flex items-center gap-2" aria-label="Setup steps">
          {STEPS.map((s, i) => (
            <li key={s.id} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-black transition",
                  i < stepIndex
                    ? "bg-[var(--leaf)] text-white"
                    : i === stepIndex
                      ? "bg-[var(--leaf-soft)] text-[var(--leaf)] ring-2 ring-[var(--leaf)]"
                      : "bg-[var(--surface-2)] text-ink-faint",
                )}
                aria-current={i === stepIndex ? "step" : undefined}
              >
                {i < stepIndex ? "✓" : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-[13px] font-semibold sm:block",
                  i === stepIndex ? "text-ink" : "text-ink-faint",
                )}
              >
                {s.label}
              </span>
              {i < STEPS.length - 1 ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-0.5 flex-1 rounded-full",
                    i < stepIndex ? "bg-[var(--leaf)]" : "bg-[var(--line)]",
                  )}
                />
              ) : null}
            </li>
          ))}
        </ol>

        {step === "size" ? (
          <section className="card space-y-6 p-5 sm:p-6 anim-rise">
            <Field label="Season name" hint="Shown at the top of the board and on the big screen.">
              {(props) => (
                <input
                  {...props}
                  type="text"
                  value={seasonName}
                  maxLength={LIMITS.maxSeasonNameLength}
                  onChange={(e) => setSeasonName(e.target.value)}
                  className={inputClass}
                  placeholder="Autumn Expedition"
                />
              )}
            </Field>

            <div>
              <p className="text-[13px] font-semibold text-ink-soft">Number of teams</p>
              <p className="mt-1 text-[13px] text-ink-faint">
                Between {LIMITS.minTeams} and {LIMITS.maxTeams}. You can change a team&rsquo;s name
                or crest later without resetting.
              </p>

              <div className="mt-3 flex items-center gap-3">
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setCountAndDrafts(count - 1)}
                  disabled={count <= LIMITS.minTeams}
                  aria-label="One fewer team"
                  className="w-12 px-0 text-xl"
                >
                  −
                </Button>
                <span
                  className="grid h-16 w-24 place-items-center rounded-2xl border border-[var(--line-strong)] bg-[var(--surface-2)] font-display text-4xl font-black text-ink tabular-nums"
                  aria-live="polite"
                >
                  {count}
                </span>
                <Button
                  variant="secondary"
                  size="lg"
                  onClick={() => setCountAndDrafts(count + 1)}
                  disabled={count >= LIMITS.maxTeams}
                  aria-label="One more team"
                  className="w-12 px-0 text-xl"
                >
                  +
                </Button>

                <div className="ml-2 flex flex-wrap gap-1.5">
                  {[2, 3, 4, 5, 6, 8].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCountAndDrafts(n)}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-[13px] font-semibold transition",
                        count === n
                          ? "border-transparent bg-[var(--leaf)] text-white"
                          : "border-[var(--line-strong)] bg-[var(--surface)] text-ink-soft hover:text-ink",
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {drafts.slice(0, count).map((draft, i) => (
                  <TeamCrest key={i} logo={draft.logo} color={draft.color} size="sm" />
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="primary" size="lg" onClick={() => setStep("teams")}>
                Name the teams →
              </Button>
            </div>
          </section>
        ) : null}

        {step === "teams" ? (
          <section className="space-y-4 anim-rise">
            <div className="card-quiet flex items-start gap-3 px-4 py-3">
              <LeafMark className="mt-0.5 h-6 w-6 shrink-0" />
              <p className="text-[13px] leading-relaxed text-ink-soft">
                Tap a crest to open the picker — there are{" "}
                <span className="font-semibold text-ink">{LOGO_COUNT.toLocaleString()}</span>{" "}
                science and nature crests to choose from, in{" "}
                <span className="font-semibold text-ink">{LOGO_CATEGORIES.length}</span> categories,
                each with its own colour.
              </p>
            </div>

            <div className="space-y-2.5">
              {drafts.slice(0, count).map((draft, i) => (
                <TeamDraftRow
                  key={i}
                  index={i}
                  draft={draft}
                  autoFocus={i === 0}
                  error={errors.get(i) ?? null}
                  onChange={(next) => setDrafts((prev) => prev.map((d, j) => (j === i ? next : d)))}
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              <Button variant="ghost" onClick={() => setStep("size")}>
                ← Back
              </Button>
              <div className="flex items-center gap-3">
                {!teamsValid ? (
                  <span className="text-[13px] font-semibold text-[#c0392b]">
                    Fix {errors.size} team name{errors.size === 1 ? "" : "s"} to continue
                  </span>
                ) : null}
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!teamsValid}
                  onClick={() => setStep("confirm")}
                >
                  Review →
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {step === "confirm" ? (
          <section className="space-y-4 anim-rise">
            <div className="card p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-xl font-bold text-ink">
                  {seasonName.trim() || "New season"}
                </h2>
                <Chip tone="leaf">{drafts.slice(0, count).length} teams</Chip>
              </div>

              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {drafts.slice(0, count).map((draft, i) => {
                  const theme = getColor(draft.color);
                  return (
                    <li
                      key={i}
                      className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
                      style={{
                        borderColor: `color-mix(in oklab, ${theme.base} 28%, transparent)`,
                        background: `color-mix(in oklab, ${theme.base} 7%, var(--surface))`,
                      }}
                    >
                      <TeamCrest logo={draft.logo} color={draft.color} size="sm" />
                      <span className="min-w-0 flex-1 truncate font-display font-bold text-ink">
                        {draft.name.trim()}
                      </span>
                      <span className="font-display text-sm font-black text-ink-faint tabular-nums">
                        0
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="card border-[#c0392b55] bg-[#c0392b0a] p-5 sm:p-6">
              <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink">
                <span aria-hidden="true">⚠️</span>
                {alreadyConfigured ? "This wipes every score" : "Confirm to start"}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
                {alreadyConfigured
                  ? "The current season, all team scores and the full point log will be replaced. This can't be undone."
                  : "This creates the season and puts every team on zero points."}
              </p>

              <Field label={`Type RESET to confirm`} error={serverError} className="mt-4 max-w-xs">
                {(props) => (
                  <input
                    {...props}
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    placeholder="RESET"
                    className={`${inputClass} font-mono tracking-widest`}
                  />
                )}
              </Field>

              <div className="mt-5 flex items-center justify-between gap-3">
                <Button variant="ghost" onClick={() => setStep("teams")}>
                  ← Back
                </Button>
                <Button
                  variant="danger"
                  size="lg"
                  loading={busy}
                  disabled={confirmText.trim().toUpperCase() !== "RESET" || !teamsValid}
                  onClick={submit}
                >
                  {alreadyConfigured ? "Reset and start season" : "Start the season"}
                </Button>
              </div>
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
