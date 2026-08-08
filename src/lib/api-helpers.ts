import "server-only";

import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AuthError } from "@/lib/auth";
import { ConflictError, ValidationError } from "@/lib/state";

export const NO_STORE = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
} as const;

export function ok<T extends object>(data: T, status = 200) {
  return NextResponse.json(data, { status, headers: NO_STORE });
}

export function fail(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: message, ...extra }, { status, headers: NO_STORE });
}

/**
 * One error funnel for every route, so an unexpected throw can never leak a
 * stack trace or an internal message to the browser.
 */
export function handleRouteError(error: unknown) {
  if (error instanceof AuthError) return fail(error.message, error.status);
  if (error instanceof ValidationError) return fail(error.message, 422);
  if (error instanceof ConflictError) return fail(error.message, 409);
  if (error instanceof ZodError) {
    const first = error.issues[0];
    return fail(first?.message ?? "That request wasn't valid.", 422);
  }
  console.error("[sci-outdoors] unhandled route error:", error);
  return fail("Something went wrong on our end. Try again.", 500);
}

/** Rejects oversized or non-JSON bodies before they reach a schema. */
export async function readJson(request: Request): Promise<unknown> {
  const type = request.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) {
    throw new ValidationError("Expected a JSON body.");
  }
  const text = await request.text();
  if (text.length > 64 * 1024) throw new ValidationError("That request was too large.");
  try {
    return JSON.parse(text);
  } catch {
    throw new ValidationError("That request wasn't valid JSON.");
  }
}
