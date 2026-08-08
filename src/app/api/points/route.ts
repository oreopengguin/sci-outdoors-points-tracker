import { z } from "zod";

import { fail, handleRouteError, ok, readJson } from "@/lib/api-helpers";
import { checkWriteRateLimit, requireTeacher } from "@/lib/auth";
import { LIMITS, reasonSchema } from "@/lib/types";
import { applyAward, mutateState, toPublicState } from "@/lib/state";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  teamId: z.string().min(1).max(64),
  delta: z
    .number()
    .int("Points must be a whole number")
    .refine((n) => n !== 0, "Enter a non-zero amount")
    .refine(
      (n) => Math.abs(n) <= LIMITS.maxDelta,
      `Single awards are capped at ${LIMITS.maxDelta}`,
    ),
  reason: reasonSchema,
});

export async function POST(request: Request) {
  try {
    const session = await requireTeacher();

    const limit = await checkWriteRateLimit("points");
    if (!limit.allowed) return fail("Slow down a moment, then try again.", 429);

    const body = bodySchema.parse(await readJson(request));

    const { state, result } = await mutateState((draft) =>
      applyAward(draft, { ...body, actor: session.username }),
    );

    return ok({ event: result, state: toPublicState(state) });
  } catch (error) {
    return handleRouteError(error);
  }
}
