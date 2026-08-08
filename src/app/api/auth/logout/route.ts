import { handleRouteError, ok } from "@/lib/api-helpers";
import { assertSameOrigin, endSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  try {
    await assertSameOrigin();
    // No CSRF check here: signing someone out is not a privilege escalation,
    // and refusing to do it would be the worse failure mode.
    await endSession();
    return ok({ signedIn: false });
  } catch (error) {
    return handleRouteError(error);
  }
}
