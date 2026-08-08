import { z } from "zod";

import { fail, handleRouteError, ok, readJson } from "@/lib/api-helpers";
import { checkWriteRateLimit, requireTeacher } from "@/lib/auth";
import { applyReset, mutateState, toPublicState } from "@/lib/state";
import { LIMITS, teamDraftSchema } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * The destructive one. Three independent things must all be true: a valid
 * teacher session, a matching CSRF token, and an explicit typed confirmation
 * phrase. Nothing here can fire from a stray click or a background request.
 */
const bodySchema = z.object({
  confirm: z.literal("RESET", { message: "Type RESET to confirm." }),
  seasonName: z
    .string()
    .trim()
    .min(1, "Give the season a name")
    .max(LIMITS.maxSeasonNameLength, "That season name is too long"),
  teams: z
    .array(teamDraftSchema)
    .min(LIMITS.minTeams, `You need at least ${LIMITS.minTeams} teams`)
    .max(LIMITS.maxTeams, `You can have at most ${LIMITS.maxTeams} teams`),
});

export async function POST(request: Request) {
  try {
    const session = await requireTeacher();

    const limit = await checkWriteRateLimit("reset");
    if (!limit.allowed) return fail("Slow down a moment, then try again.", 429);

    const body = bodySchema.parse(await readJson(request));

    const { state } = await mutateState((draft) =>
      applyReset(draft, {
        seasonName: body.seasonName,
        teams: body.teams,
        actor: session.username,
      }),
    );

    return ok({ state: toPublicState(state) });
  } catch (error) {
    return handleRouteError(error);
  }
}
