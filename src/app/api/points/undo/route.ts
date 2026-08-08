import { z } from "zod";

import { fail, handleRouteError, ok, readJson } from "@/lib/api-helpers";
import { checkWriteRateLimit, requireTeacher } from "@/lib/auth";
import { applyUndo, mutateState, toPublicState } from "@/lib/state";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({ eventId: z.string().min(1).max(64) });

export async function POST(request: Request) {
  try {
    const session = await requireTeacher();

    const limit = await checkWriteRateLimit("undo");
    if (!limit.allowed) return fail("Slow down a moment, then try again.", 429);

    const { eventId } = bodySchema.parse(await readJson(request));

    const { state, result } = await mutateState((draft) =>
      applyUndo(draft, { eventId, actor: session.username }),
    );

    return ok({ event: result, state: toPublicState(state) });
  } catch (error) {
    return handleRouteError(error);
  }
}
