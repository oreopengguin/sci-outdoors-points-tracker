import { z } from "zod";

import { fail, handleRouteError, ok, readJson } from "@/lib/api-helpers";
import { assertSameOrigin, attemptLogin, getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  username: z.string().min(1).max(120),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  try {
    await assertSameOrigin();

    const existing = await getSession();
    if (existing) return ok({ signedIn: true, teacher: existing.username });

    const { username, password } = bodySchema.parse(await readJson(request));
    const outcome = await attemptLogin(username, password);

    if (outcome.ok) return ok({ signedIn: true, teacher: username.trim() });

    if (outcome.reason === "unconfigured") {
      return fail(
        "This deployment can't keep you signed in yet. Connect a Redis store in the Vercel " +
          "Storage tab, or set an AUTH_SECRET environment variable, then redeploy.",
        503,
      );
    }

    if (outcome.reason === "ratelimited") {
      return fail("Too many sign-in attempts. Wait a few minutes and try again.", 429, {
        retryAfterSeconds: outcome.retryAfterSeconds,
      });
    }
    // Deliberately identical for a wrong username and a wrong password.
    return fail("That username and password don't match.", 401);
  } catch (error) {
    return handleRouteError(error);
  }
}
