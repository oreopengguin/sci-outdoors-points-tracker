import "server-only";

import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";

import { compareAndSet, incrementWithTtl, readCounter, readRaw, storageHealth } from "@/lib/store";

/**
 * Authentication for the teacher console.
 *
 * Design notes, because this is the part a curious student will poke at:
 *  - The password is never in the bundle or in any client response. Only a
 *    scrypt hash lives in the source, and it can be replaced with an env var.
 *  - The session is a signed token in an HttpOnly cookie. Nothing about
 *    "am I a teacher?" is decided on the client; every mutating route calls
 *    `requireTeacher()` on the server.
 *  - Mutations additionally require a CSRF token and a same-origin request, so
 *    another site cannot make a logged-in teacher's browser award points.
 *  - Login is rate limited per client and globally, with constant-time
 *    comparison and a uniform error message.
 */

export const SESSION_COOKIE = "sot_session";
export const CSRF_COOKIE = "sot_csrf";
export const CSRF_HEADER = "x-sot-csrf";

const SESSION_TTL_SECONDS = 60 * 60 * 8; // a school day
const SECRET_KEY = "sot:auth:secret:v1";

/** scrypt$N$r$p$salt$hash, all base64url. */
const DEFAULT_PASSWORD_HASH =
  "scrypt$32768$8$1$ZrtlOgBIJND1iOE8S9RZiA$2m_k2Kz9hNGcQXCc_RwiU3u66wm31HvtAo6o8So2exGdg1IO9cdLLe324S7T7WVrPW5gXDsU91ErzFbJSdjhCw";

const DEFAULT_USERNAME = "soteacher";

/* --------------------------------------------------------------- secrets */

let cachedSecret: Buffer | null = null;

/**
 * Signing key for session cookies.
 *
 * Every instance of the app must arrive at the *same* key, or a cookie minted
 * by one server gets rejected by the next and the user bounces between the
 * login page and the console forever.
 *
 * `AUTH_SECRET` wins when set — that is the only option that needs nothing else
 * to be true. Otherwise we generate one and claim it in the shared store with a
 * compare-and-set, so if several cold instances start at once exactly one wins
 * and the rest adopt the winner's key instead of each keeping its own.
 */
async function getSecret(): Promise<Buffer> {
  if (cachedSecret) return cachedSecret;

  const fromEnv = process.env.AUTH_SECRET;
  if (fromEnv && fromEnv.length >= 16) {
    cachedSecret = Buffer.from(fromEnv, "utf8");
    return cachedSecret;
  }

  const existing = await readRaw(SECRET_KEY);
  if (existing && existing.length >= 32) {
    cachedSecret = Buffer.from(existing, "base64url");
    return cachedSecret;
  }

  const candidate = randomBytes(48).toString("base64url");
  const won = await compareAndSet(SECRET_KEY, null, candidate);
  // Losing the race is the common case on a cold start; read back whoever won.
  const settled = won ? candidate : ((await readRaw(SECRET_KEY)) ?? candidate);

  cachedSecret = Buffer.from(settled, "base64url");
  return cachedSecret;
}

/**
 * Whether this deployment can actually keep someone signed in.
 *
 * A signing key has to outlive a single server instance. `AUTH_SECRET` always
 * satisfies that; a durable store satisfies it because the generated key is
 * shared through it. With neither, in production, every instance would sign
 * with a different key — so we refuse to sign in at all rather than hand out a
 * session that the next request silently rejects.
 */
export function sessionsCanPersist(): boolean {
  if ((process.env.AUTH_SECRET?.length ?? 0) >= 16) return true;
  if (storageHealth().durable) return true;
  // Development runs as a single process, so the on-disk key is shared fine.
  return process.env.NODE_ENV !== "production";
}

/* -------------------------------------------------------------- password */

function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, { ...options, maxmem: 256 * 1024 * 1024 }, (err, derived) =>
      err ? reject(err) : resolve(derived as Buffer),
    );
  });
}

async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  const parts = encoded.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, nRaw, rRaw, pRaw, saltRaw, hashRaw] = parts;

  const N = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;

  const salt = Buffer.from(saltRaw, "base64url");
  const expected = Buffer.from(hashRaw, "base64url");
  if (salt.length === 0 || expected.length === 0) return false;

  const actual = await scryptAsync(password, salt, expected.length, { N, r, p });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function safeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  // Hash both sides so length differences don't leak through the comparison.
  const hA = createHmac("sha256", "compare").update(bufA).digest();
  const hB = createHmac("sha256", "compare").update(bufB).digest();
  return timingSafeEqual(hA, hB);
}

/* --------------------------------------------------------------- session */

type SessionPayload = {
  /** Subject — the teacher account name. */
  s: string;
  /** Issued at (seconds). */
  i: number;
  /** Expires at (seconds). */
  e: number;
  /** Random id, so two sessions are never byte-identical. */
  n: string;
};

export type Session = { username: string; expiresAt: number };

async function sign(payload: string): Promise<string> {
  const secret = await getSecret();
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

async function createToken(username: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    s: username,
    i: now,
    e: now + SESSION_TTL_SECONDS,
    n: randomBytes(12).toString("base64url"),
  };
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${await sign(body)}`;
}

async function readToken(token: string): Promise<Session | null> {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const signature = token.slice(dot + 1);

  const expected = await sign(body);
  const a = Buffer.from(signature, "base64url");
  const b = Buffer.from(expected, "base64url");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (typeof payload.s !== "string" || typeof payload.e !== "number") return null;
    if (payload.e * 1000 <= Date.now()) return null;
    if (!safeEqualStrings(payload.s, teacherUsername())) return null;
    return { username: payload.s, expiresAt: payload.e * 1000 };
  } catch {
    return null;
  }
}

export function teacherUsername(): string {
  return process.env.TEACHER_USERNAME?.trim() || DEFAULT_USERNAME;
}

function teacherPasswordHash(): string {
  const fromEnv = process.env.TEACHER_PASSWORD_HASH?.trim();
  if (fromEnv) return fromEnv;
  return DEFAULT_PASSWORD_HASH;
}

const isProduction = process.env.NODE_ENV === "production";

export async function startSession(username: string): Promise<void> {
  const jar = await cookies();
  const token = await createToken(username);
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  jar.set(CSRF_COOKIE, randomBytes(24).toString("base64url"), {
    // Readable by the client on purpose: it is echoed back in a header, which
    // is what proves the request came from our own page.
    httpOnly: false,
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function endSession(): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  jar.set(CSRF_COOKIE, "", { httpOnly: false, path: "/", maxAge: 0 });
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return readToken(token);
}

/* ---------------------------------------------------------- rate limiting */

const LOGIN_WINDOW_SECONDS = 15 * 60;
const LOGIN_MAX_PER_CLIENT = 8;
const LOGIN_MAX_GLOBAL_FAILURES = 400;

async function clientFingerprint(): Promise<string> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || "unknown";
  const ua = h.get("user-agent") ?? "";
  // Hashed so we never store a raw address.
  return createHmac("sha256", "sot-ratelimit")
    .update(`${ip}|${ua}`)
    .digest("base64url")
    .slice(0, 24);
}

export type RateLimitResult = { allowed: boolean; retryAfterSeconds: number };

function loginBucket(): number {
  return Math.floor(Date.now() / (LOGIN_WINDOW_SECONDS * 1000));
}

/**
 * Two limits, on purpose:
 *
 *  - Per client: counts every attempt. This is the one that actually stops
 *    someone sitting at the sign-in page guessing.
 *  - Global: counts *failures only*, and exists to catch an attacker rotating
 *    the forwarded-for header to dodge the per-client bucket. Counting only
 *    failures means a teacher signing in normally never eats into the shared
 *    budget, so nobody can lock the class out just by hammering the endpoint
 *    with valid-looking traffic.
 */
export async function checkLoginRateLimit(): Promise<RateLimitResult> {
  const fingerprint = await clientFingerprint();
  const bucket = loginBucket();
  try {
    const [perClient, globalFailures] = await Promise.all([
      incrementWithTtl(`sot:rl:login:${fingerprint}:${bucket}`, LOGIN_WINDOW_SECONDS),
      readCounter(`sot:rl:login:fail:${bucket}`),
    ]);
    if (perClient > LOGIN_MAX_PER_CLIENT || globalFailures > LOGIN_MAX_GLOBAL_FAILURES) {
      return { allowed: false, retryAfterSeconds: LOGIN_WINDOW_SECONDS };
    }
  } catch {
    // A store hiccup must not lock everyone out of their own leaderboard.
    return { allowed: true, retryAfterSeconds: 0 };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

async function noteFailedLogin(): Promise<void> {
  try {
    await incrementWithTtl(`sot:rl:login:fail:${loginBucket()}`, LOGIN_WINDOW_SECONDS);
  } catch {
    /* best effort */
  }
}

export async function checkWriteRateLimit(scope: string): Promise<RateLimitResult> {
  const fingerprint = await clientFingerprint();
  const bucket = Math.floor(Date.now() / 60_000);
  try {
    const count = await incrementWithTtl(`sot:rl:${scope}:${fingerprint}:${bucket}`, 60);
    if (count > 120) return { allowed: false, retryAfterSeconds: 60 };
  } catch {
    return { allowed: true, retryAfterSeconds: 0 };
  }
  return { allowed: true, retryAfterSeconds: 0 };
}

/* ------------------------------------------------------------- attempting */

export type LoginOutcome =
  | { ok: true }
  | {
      ok: false;
      reason: "credentials" | "ratelimited" | "unconfigured";
      retryAfterSeconds?: number;
    };

export async function attemptLogin(username: string, password: string): Promise<LoginOutcome> {
  // Checked before anything else: handing out a session this deployment cannot
  // verify on the next request is worse than saying so plainly.
  if (!sessionsCanPersist()) return { ok: false, reason: "unconfigured" };

  const limit = await checkLoginRateLimit();
  if (!limit.allowed) {
    return { ok: false, reason: "ratelimited", retryAfterSeconds: limit.retryAfterSeconds };
  }

  const userOk = safeEqualStrings(username.trim(), teacherUsername());
  // Always run the KDF, even for a wrong username, so response time does not
  // reveal whether the account name was right.
  const passOk = await verifyPassword(password, teacherPasswordHash());

  if (userOk && passOk) {
    await startSession(teacherUsername());
    return { ok: true };
  }

  await noteFailedLogin();
  return { ok: false, reason: "credentials" };
}

/* ------------------------------------------------------------ guards */

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

/** Rejects requests that did not originate from this site. */
export async function assertSameOrigin(): Promise<void> {
  const h = await headers();
  const origin = h.get("origin");
  if (!origin) return; // same-origin fetches may omit it; the CSRF token still applies
  const host = h.get("host");
  if (!host) throw new AuthError("Bad request", 400);
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new AuthError("Bad request", 400);
  }
  if (originHost !== host) throw new AuthError("Cross-site requests are not allowed", 403);
}

export async function assertCsrf(): Promise<void> {
  const jar = await cookies();
  const h = await headers();
  const cookieToken = jar.get(CSRF_COOKIE)?.value;
  const headerToken = h.get(CSRF_HEADER);
  if (!cookieToken || !headerToken || !safeEqualStrings(cookieToken, headerToken)) {
    throw new AuthError("Your session expired. Sign in again.", 403);
  }
}

/**
 * The single gate every mutating route goes through: same origin, valid CSRF
 * token, valid signed session.
 */
export async function requireTeacher(): Promise<Session> {
  await assertSameOrigin();
  await assertCsrf();
  const session = await getSession();
  if (!session) throw new AuthError("You need to be signed in as a teacher.", 401);
  return session;
}
