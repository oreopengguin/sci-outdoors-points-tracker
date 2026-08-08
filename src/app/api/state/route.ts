import { NO_STORE, handleRouteError, ok } from "@/lib/api-helpers";
import { getSession } from "@/lib/auth";
import { readState, toPublicState } from "@/lib/state";
import { storageHealth } from "@/lib/store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * The one read endpoint. Public by design — the leaderboard is meant to be on
 * a projector — but it never returns anything the board itself doesn't show.
 */
export async function GET() {
  try {
    const [state, session] = await Promise.all([readState(), getSession()]);
    const health = storageHealth();
    return ok({
      ...toPublicState(state),
      signedIn: Boolean(session),
      teacher: session?.username ?? null,
      storage: { durable: health.durable, driver: health.driver },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function HEAD() {
  return new Response(null, { status: 200, headers: NO_STORE });
}
