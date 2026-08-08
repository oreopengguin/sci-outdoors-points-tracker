import { z } from "zod";

/** Hard limits — enforced on the server, never trusted from the client. */
export const LIMITS = {
  minTeams: 2,
  maxTeams: 16,
  maxTeamNameLength: 28,
  maxReasonLength: 120,
  maxSeasonNameLength: 40,
  maxDelta: 1000,
  maxEvents: 400,
  maxPoints: 1_000_000,
} as const;

export const teamNameSchema = z
  .string()
  .trim()
  .min(1, "Team name is required")
  .max(LIMITS.maxTeamNameLength, `Keep it under ${LIMITS.maxTeamNameLength} characters`)
  // Printable characters only: blocks control chars and most invisible trickery.
  .regex(
    /^[\p{L}\p{N}\p{Emoji_Presentation}\p{Emoji}\s'’&.\-!?+]+$/u,
    "That name has unsupported characters",
  );

export const reasonSchema = z
  .string()
  .trim()
  .min(1, "Give a reason")
  .max(LIMITS.maxReasonLength, `Keep the reason under ${LIMITS.maxReasonLength} characters`);

export const teamSchema = z.object({
  id: z.string().min(1).max(64),
  name: teamNameSchema,
  logo: z.string().min(1).max(64),
  color: z.string().min(1).max(32),
  points: z.number().int().min(-LIMITS.maxPoints).max(LIMITS.maxPoints),
  createdAt: z.number().int().nonnegative(),
});

export const pointEventSchema = z.object({
  id: z.string(),
  teamId: z.string(),
  teamName: z.string(),
  teamLogo: z.string(),
  teamColor: z.string(),
  delta: z.number().int(),
  reason: z.string(),
  actor: z.string(),
  at: z.number().int().nonnegative(),
  kind: z.enum(["award", "deduct", "undo", "system"]).default("award"),
  /** For an undo entry: the id of the event it reverses. */
  ref: z.string().optional(),
});

export const seasonSchema = z.object({
  id: z.string(),
  name: z.string(),
  startedAt: z.number().int().nonnegative(),
});

export const appStateSchema = z.object({
  schema: z.literal(1),
  rev: z.number().int().nonnegative(),
  configured: z.boolean(),
  season: seasonSchema,
  teams: z.array(teamSchema),
  events: z.array(pointEventSchema),
});

export type Team = z.infer<typeof teamSchema>;
export type PointEvent = z.infer<typeof pointEventSchema>;
export type Season = z.infer<typeof seasonSchema>;
export type AppState = z.infer<typeof appStateSchema>;

/** What the public leaderboard receives. Deliberately narrower than AppState. */
export type PublicTeam = Team & {
  rank: number;
  previousRank: number | null;
  /** True when at least one other team holds the same rank. */
  tied: boolean;
};

export type PublicState = {
  configured: boolean;
  season: Season;
  teams: PublicTeam[];
  events: PointEvent[];
  totalPoints: number;
  rev: number;
  serverTime: number;
};

export const teamDraftSchema = z.object({
  name: teamNameSchema,
  logo: z.string().min(1).max(64),
  color: z.string().min(1).max(32),
});

export type TeamDraft = z.infer<typeof teamDraftSchema>;
