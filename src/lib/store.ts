import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

/**
 * Tiny key/value store with compare-and-set, so the app has exactly one
 * persistence seam.
 *
 * Two drivers:
 *   - `redis`  — Upstash / Vercel KV over the REST API. Zero dependencies, and
 *                CAS is a Lua script so concurrent teachers can't clobber each
 *                other's point awards.
 *   - `file`   — local JSON on disk. Development only; a serverless deployment
 *                gets a fresh, empty filesystem per instance, which is why
 *                `storageHealth()` reports it loudly.
 */

export type StorageDriver = "redis" | "file";

export type StorageHealth = {
  driver: StorageDriver;
  durable: boolean;
  detail: string;
};

type RestConfig = { url: string; token: string };

function restConfig(): RestConfig | null {
  const url =
    process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL ?? process.env.REDIS_REST_URL;
  const token =
    process.env.KV_REST_API_TOKEN ??
    process.env.UPSTASH_REDIS_REST_TOKEN ??
    process.env.REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return { url: url.replace(/\/+$/, ""), token };
}

export function storageHealth(): StorageHealth {
  if (restConfig()) {
    return {
      driver: "redis",
      durable: true,
      detail: "Connected to a Redis-compatible KV store. Points persist across deploys.",
    };
  }
  return {
    driver: "file",
    durable: false,
    detail:
      "No KV store is configured, so data is kept on the local filesystem. That is fine for development, " +
      "but on a serverless host it will be lost between instances. Connect a Redis store and set " +
      "KV_REST_API_URL and KV_REST_API_TOKEN.",
  };
}

/* ------------------------------------------------------------------ redis */

async function redisCommand(cfg: RestConfig, command: unknown[]): Promise<unknown> {
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`KV request failed (${res.status}): ${await res.text().catch(() => "")}`);
  }
  const body = (await res.json()) as { result?: unknown; error?: string };
  if (body.error) throw new Error(`KV error: ${body.error}`);
  return body.result ?? null;
}

/**
 * Set `key` to `next` only if it currently holds `expected`.
 * `expected === null` means "only if the key does not exist".
 */
const CAS_SCRIPT = `
local current = redis.call('GET', KEYS[1])
local expected = ARGV[2]
if expected == '' then
  if current then return 0 end
else
  if not current or current ~= expected then return 0 end
end
redis.call('SET', KEYS[1], ARGV[1])
return 1
`;

/* ------------------------------------------------------------------- file */

const FILE_DIR = process.env.SOT_DATA_DIR ?? path.join(os.tmpdir(), "sci-outdoors-points");

function filePath(key: string): string {
  // Keys are internal constants, but normalise anyway so a future caller can
  // never walk out of the data directory.
  return path.join(FILE_DIR, `${key.replace(/[^a-zA-Z0-9._-]/g, "_")}.json`);
}

/** Serialises writes within this process; the file driver is single-node anyway. */
let fileChain: Promise<unknown> = Promise.resolve();
function withFileLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = fileChain.then(fn, fn);
  fileChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

/* ---------------------------------------------------------------- public */

export async function readRaw(key: string): Promise<string | null> {
  const cfg = restConfig();
  if (cfg) {
    const result = await redisCommand(cfg, ["GET", key]);
    return typeof result === "string" ? result : null;
  }
  try {
    return await fs.readFile(filePath(key), "utf8");
  } catch {
    return null;
  }
}

export async function writeRaw(key: string, value: string): Promise<void> {
  const cfg = restConfig();
  if (cfg) {
    await redisCommand(cfg, ["SET", key, value]);
    return;
  }
  await withFileLock(async () => {
    await fs.mkdir(FILE_DIR, { recursive: true });
    const target = filePath(key);
    const tmp = `${target}.${process.pid}.tmp`;
    await fs.writeFile(tmp, value, "utf8");
    await fs.rename(tmp, target);
  });
}

/**
 * Atomic compare-and-set. Returns true when the write landed.
 * Callers retry on false — see `mutateState`.
 */
export async function compareAndSet(
  key: string,
  expected: string | null,
  next: string,
): Promise<boolean> {
  const cfg = restConfig();
  if (cfg) {
    const result = await redisCommand(cfg, ["EVAL", CAS_SCRIPT, "1", key, next, expected ?? ""]);
    return Number(result) === 1;
  }
  return withFileLock(async () => {
    await fs.mkdir(FILE_DIR, { recursive: true });
    const target = filePath(key);
    let current: string | null = null;
    try {
      current = await fs.readFile(target, "utf8");
    } catch {
      current = null;
    }
    if (current !== expected) return false;
    const tmp = `${target}.${process.pid}.tmp`;
    await fs.writeFile(tmp, next, "utf8");
    await fs.rename(tmp, target);
    return true;
  });
}

/** Increment a counter that expires after `ttlSeconds`. Used for rate limiting. */
export async function incrementWithTtl(key: string, ttlSeconds: number): Promise<number> {
  const cfg = restConfig();
  if (cfg) {
    const result = await redisCommand(cfg, [
      "EVAL",
      `local n = redis.call('INCR', KEYS[1])
       if n == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end
       return n`,
      "1",
      key,
      String(ttlSeconds),
    ]);
    return Number(result) || 0;
  }
  return withFileLock(async () => {
    await fs.mkdir(FILE_DIR, { recursive: true });
    const target = filePath(key);
    const now = Date.now();
    let entry: { count: number; expiresAt: number } = { count: 0, expiresAt: 0 };
    try {
      entry = JSON.parse(await fs.readFile(target, "utf8"));
    } catch {
      /* fresh counter */
    }
    if (!entry.expiresAt || entry.expiresAt < now) {
      entry = { count: 0, expiresAt: now + ttlSeconds * 1000 };
    }
    entry.count += 1;
    await fs.writeFile(target, JSON.stringify(entry), "utf8");
    return entry.count;
  });
}

/** Read a counter written by `incrementWithTtl` without incrementing it. */
export async function readCounter(key: string): Promise<number> {
  const cfg = restConfig();
  if (cfg) {
    const result = await redisCommand(cfg, ["GET", key]);
    return typeof result === "string" ? Number(result) || 0 : 0;
  }
  try {
    const entry = JSON.parse(await fs.readFile(filePath(key), "utf8")) as {
      count: number;
      expiresAt: number;
    };
    if (!entry.expiresAt || entry.expiresAt < Date.now()) return 0;
    return entry.count ?? 0;
  } catch {
    return 0;
  }
}

export async function deleteKey(key: string): Promise<void> {
  const cfg = restConfig();
  if (cfg) {
    await redisCommand(cfg, ["DEL", key]);
    return;
  }
  await withFileLock(async () => {
    await fs.rm(filePath(key), { force: true });
  });
}
