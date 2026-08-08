import "server-only";

import { randomUUID } from "node:crypto";

import { compareAndSet, readRaw } from "@/lib/store";
import {
  LIMITS,
  appStateSchema,
  type AppState,
  type PointEvent,
  type PublicState,
  type PublicTeam,
  type Team,
  type TeamDraft,
} from "@/lib/types";
import { defaultColorFor, isColorId } from "@/lib/palette";
import { defaultLogoFor, isLogoId } from "@/lib/logos";

const STATE_KEY = "sot:state:v1";

/** A brand-new, unconfigured season. The setup wizard fills it in. */
export function emptyState(now = Date.now()): AppState {
  return {
    schema: 1,
    rev: 0,
    configured: false,
    season: { id: randomUUID(), name: "Season 1", startedAt: now },
    teams: [],
    events: [],
  };
}

function parseState(raw: string | null): AppState {
  if (!raw) return emptyState();
  try {
    const parsed = appStateSchema.safeParse(JSON.parse(raw));
    if (parsed.success) return parsed.data;
  } catch {
    /* fall through to a clean slate */
  }
  // Corrupt or future-schema data: refuse to guess. A fresh state is recoverable;
  // half-interpreted state is not.
  return emptyState();
}

export async function readState(): Promise<AppState> {
  return parseState(await readRaw(STATE_KEY));
}

export class ConflictError extends Error {
  constructor(message = "Someone else changed the scores at the same time. Try again.") {
    super(message);
    this.name = "ConflictError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/**
 * Read-modify-write with optimistic concurrency. `mutator` may be called more
 * than once, so it must stay pure with respect to anything outside `state`.
 */
export async function mutateState<T>(
  mutator: (state: AppState) => { state: AppState; result: T },
): Promise<{ state: AppState; result: T }> {
  // Generous, because losing a race here means a teacher's point award silently
  // bounces. Each attempt re-reads, so retrying is always safe.
  const attempts = 14;
  for (let attempt = 0; attempt < attempts; attempt++) {
    const raw = await readRaw(STATE_KEY);
    const current = parseState(raw);
    const { state: draft, result } = mutator(structuredClone(current));

    const next: AppState = {
      ...draft,
      rev: current.rev + 1,
      events: draft.events.slice(0, LIMITS.maxEvents),
    };

    const validated = appStateSchema.parse(next);
    // When the stored value was unparseable we treat it as absent, so CAS must
    // expect the exact bytes we read rather than a re-serialised guess.
    const ok = await compareAndSet(STATE_KEY, raw, JSON.stringify(validated));
    if (ok) return { state: validated, result };

    // Growing backoff with jitter. Without the jitter, contenders that collide
    // once tend to collide again on exactly the same schedule.
    const base = Math.min(20 * (attempt + 1), 160);
    await new Promise((r) => setTimeout(r, base + Math.random() * base));
  }
  throw new ConflictError();
}

/* --------------------------------------------------------------- ranking */

function sortTeams(teams: Team[]): Team[] {
  return [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    // Stable, explainable tiebreak: earliest-created team ranks higher.
    if (a.createdAt !== b.createdAt) return a.createdAt - b.createdAt;
    return a.name.localeCompare(b.name);
  });
}

/** Standard competition ranking — equal scores share a rank (1, 1, 3). */
export function rankTeams(teams: Team[]): { team: Team; rank: number }[] {
  const sorted = sortTeams(teams);
  const out: { team: Team; rank: number }[] = [];
  sorted.forEach((team, index) => {
    const prev = out[index - 1];
    const rank = prev && prev.team.points === team.points ? prev.rank : index + 1;
    out.push({ team, rank });
  });
  return out;
}

/**
 * Rank each team as it stood before the most recent scoring event, so the
 * leaderboard can show movement arrows without storing rank history.
 */
function previousRanks(state: AppState): Map<string, number> {
  const lastEvent = state.events.find((e) => e.delta !== 0);
  if (!lastEvent) return new Map();
  const rewound = state.teams.map((t) =>
    t.id === lastEvent.teamId ? { ...t, points: t.points - lastEvent.delta } : t,
  );
  return new Map(rankTeams(rewound).map(({ team, rank }) => [team.id, rank]));
}

export function toPublicState(state: AppState): PublicState {
  const previous = previousRanks(state);
  const ranked = rankTeams(state.teams);

  // Count how many teams hold each rank, so the UI can say "tied 1st" instead
  // of crowning four leaders at the start of a season when everyone is on zero.
  const rankCounts = new Map<number, number>();
  for (const { rank } of ranked) rankCounts.set(rank, (rankCounts.get(rank) ?? 0) + 1);

  const teams: PublicTeam[] = ranked.map(({ team, rank }) => ({
    ...team,
    rank,
    previousRank: previous.get(team.id) ?? null,
    tied: (rankCounts.get(rank) ?? 1) > 1,
  }));
  return {
    configured: state.configured,
    season: state.season,
    teams,
    events: state.events,
    totalPoints: state.teams.reduce((sum, t) => sum + t.points, 0),
    rev: state.rev,
    serverTime: Date.now(),
  };
}

/* -------------------------------------------------------------- mutations */

function clampPoints(value: number): number {
  return Math.max(-LIMITS.maxPoints, Math.min(LIMITS.maxPoints, Math.round(value)));
}

function pushEvent(state: AppState, event: PointEvent): void {
  state.events.unshift(event);
  state.events = state.events.slice(0, LIMITS.maxEvents);
}

export function applyAward(
  state: AppState,
  input: { teamId: string; delta: number; reason: string; actor: string },
): { state: AppState; result: PointEvent } {
  const team = state.teams.find((t) => t.id === input.teamId);
  if (!team) throw new ValidationError("That team no longer exists.");

  const delta = Math.round(input.delta);
  if (!Number.isFinite(delta) || delta === 0) {
    throw new ValidationError("Enter a non-zero whole number of points.");
  }
  if (Math.abs(delta) > LIMITS.maxDelta) {
    throw new ValidationError(`Single awards are capped at ${LIMITS.maxDelta} points.`);
  }

  team.points = clampPoints(team.points + delta);

  const event: PointEvent = {
    id: randomUUID(),
    teamId: team.id,
    teamName: team.name,
    teamLogo: team.logo,
    teamColor: team.color,
    delta,
    reason: input.reason,
    actor: input.actor,
    at: Date.now(),
    kind: delta >= 0 ? "award" : "deduct",
  };
  pushEvent(state, event);
  return { state, result: event };
}

export function applyUndo(
  state: AppState,
  input: { eventId: string; actor: string },
): { state: AppState; result: PointEvent } {
  const original = state.events.find((e) => e.id === input.eventId);
  if (!original) throw new ValidationError("That entry is no longer in the log.");
  if (original.kind === "undo") throw new ValidationError("That entry is already an undo.");
  if (original.delta === 0) throw new ValidationError("There are no points to take back.");
  if (state.events.some((e) => e.ref === original.id)) {
    throw new ValidationError("That entry has already been undone.");
  }

  const team = state.teams.find((t) => t.id === original.teamId);
  if (!team) throw new ValidationError("That team no longer exists.");

  team.points = clampPoints(team.points - original.delta);

  const event: PointEvent = {
    id: randomUUID(),
    teamId: team.id,
    teamName: team.name,
    teamLogo: team.logo,
    teamColor: team.color,
    delta: -original.delta,
    reason: `Undo — ${truncate(original.reason, 90)}`,
    actor: input.actor,
    at: Date.now(),
    kind: "undo",
    ref: original.id,
  };
  pushEvent(state, event);
  return { state, result: event };
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

export function applyTeamEdit(
  state: AppState,
  input: { teamId: string; name: string; logo: string; color: string; actor: string },
): { state: AppState; result: Team } {
  const team = state.teams.find((t) => t.id === input.teamId);
  if (!team) throw new ValidationError("That team no longer exists.");
  if (!isLogoId(input.logo)) throw new ValidationError("Pick a crest from the library.");
  if (!isColorId(input.color)) throw new ValidationError("Pick a colour from the palette.");

  const nameTaken = state.teams.some(
    (t) => t.id !== team.id && t.name.toLowerCase() === input.name.toLowerCase(),
  );
  if (nameTaken) throw new ValidationError("Another team already has that name.");

  const before = team.name;
  team.name = input.name;
  team.logo = input.logo;
  team.color = input.color;

  if (before !== input.name) {
    pushEvent(state, {
      id: randomUUID(),
      teamId: team.id,
      teamName: team.name,
      teamLogo: team.logo,
      teamColor: team.color,
      delta: 0,
      reason: `Renamed from “${truncate(before, 40)}”`,
      actor: input.actor,
      at: Date.now(),
      kind: "system",
    });
  }
  return { state, result: team };
}

/**
 * Wipe the board and rebuild it from the setup wizard's drafts. This is the
 * only path that clears points, and it is gated behind an authenticated,
 * explicitly confirmed request.
 */
export function applyReset(
  state: AppState,
  input: { seasonName: string; teams: TeamDraft[]; actor: string },
): { state: AppState; result: AppState } {
  if (input.teams.length < LIMITS.minTeams || input.teams.length > LIMITS.maxTeams) {
    throw new ValidationError(`Choose between ${LIMITS.minTeams} and ${LIMITS.maxTeams} teams.`);
  }

  const names = new Set<string>();
  for (const draft of input.teams) {
    const key = draft.name.toLowerCase();
    if (names.has(key)) throw new ValidationError(`Two teams are both called “${draft.name}”.`);
    names.add(key);
    if (!isLogoId(draft.logo)) throw new ValidationError(`“${draft.name}” needs a crest.`);
    if (!isColorId(draft.color)) throw new ValidationError(`“${draft.name}” needs a colour.`);
  }

  const now = Date.now();
  const next: AppState = {
    schema: 1,
    rev: state.rev,
    configured: true,
    season: { id: randomUUID(), name: input.seasonName, startedAt: now },
    teams: input.teams.map((draft, index) => ({
      id: randomUUID(),
      name: draft.name,
      logo: draft.logo,
      color: draft.color,
      points: 0,
      // Spread creation times so the tiebreak order matches the setup order.
      createdAt: now + index,
    })),
    events: [
      {
        id: randomUUID(),
        teamId: "",
        teamName: input.seasonName,
        teamLogo: defaultLogoFor(0),
        teamColor: defaultColorFor(0),
        delta: 0,
        reason: `${input.seasonName} started with ${input.teams.length} teams — all scores at zero`,
        actor: input.actor,
        at: now,
        kind: "system",
      },
    ],
  };
  return { state: next, result: next };
}
