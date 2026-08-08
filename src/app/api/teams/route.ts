import { z } from "zod";

import { fail, handleRouteError, ok, readJson } from "@/lib/api-helpers";
import { checkWriteRateLimit, requireTeacher } from "@/lib/auth";
import { applyTeamEdit, mutateState, toPublicState } from "@/lib/state";
import { teamNameSchema } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  teamId: z.string().min(1).max(64),
  name: teamNameSchema,
  logo: z.string().min(1).max(64),
  color: z.string().min(1).max(32),
});

/** Rename or restyle a team mid-season without touching its score. */
export async function PATCH(request: Request) {
  try {
    const session = await requireTeacher();

    const limit = await checkWriteRateLimit("teams");
    if (!limit.allowed) return fail("Slow down a moment, then try again.", 429);

    const body = bodySchema.parse(await readJson(request));

    const { state, result } = await mutateState((draft) =>
      applyTeamEdit(draft, { ...body, actor: session.username }),
    );

    return ok({ team: result, state: toPublicState(state) });
  } catch (error) {
    return handleRouteError(error);
  }
}
