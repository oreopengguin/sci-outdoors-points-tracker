"use client";

import Link from "next/link";

import { LeafMark } from "@/components/brand";
import { Button, Spinner } from "@/components/ui";
import { cn } from "@/lib/cn";

export function BoardSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="card flex items-center gap-5 px-6 py-5 opacity-70"
          style={{ animation: `sot-fade-in .4s ease ${i * 70}ms both` }}
        >
          <div className="h-10 w-10 rounded-lg bg-[var(--surface-2)]" />
          <div className="h-14 w-14 rounded-full bg-[var(--surface-2)]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 rounded-full bg-[var(--surface-2)]" />
            <div className="h-2 w-full rounded-full bg-[var(--surface-2)]" />
          </div>
          <div className="h-9 w-20 rounded-lg bg-[var(--surface-2)]" />
        </div>
      ))}
    </div>
  );
}

export function LoadingPanel({ label = "Loading the board…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-ink-faint">
      <Spinner className="h-5 w-5" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

/** Shown when a season has never been configured. */
export function NotConfigured({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="card mx-auto flex max-w-xl flex-col items-center px-6 py-14 text-center anim-rise">
      <LeafMark className="h-16 w-16 anim-float" />
      <h1 className="mt-5 font-display text-2xl font-bold text-ink">No season set up yet</h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
        A teacher needs to choose how many teams there are, name them and give each one a crest.
        Once that&rsquo;s done, this page becomes the live scoreboard.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        {signedIn ? (
          <Link href="/teacher/setup">
            <Button variant="primary" size="lg">
              Set up the season
            </Button>
          </Link>
        ) : (
          <Link href="/login">
            <Button variant="primary" size="lg">
              Teacher sign in
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export function ErrorPanel({
  message,
  onRetry,
  className,
}: {
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn("card flex flex-col items-center px-6 py-12 text-center", className)}
      role="alert"
    >
      <span aria-hidden="true" className="text-3xl">
        🌧️
      </span>
      <h2 className="mt-3 font-display text-lg font-bold text-ink">
        Couldn&rsquo;t load the board
      </h2>
      <p className="mt-1 max-w-sm text-sm text-ink-soft">{message}</p>
      {onRetry ? (
        <Button variant="secondary" className="mt-5" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

/** Warns a teacher when the deployment has no durable store behind it. */
export function StorageWarning({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div
      role="status"
      className="card flex items-start gap-3 border-[color-mix(in_oklab,var(--gold)_45%,transparent)] bg-[color-mix(in_oklab,var(--gold)_10%,var(--surface))] px-4 py-3"
    >
      <span aria-hidden="true" className="text-lg leading-none">
        ⚠️
      </span>
      <p className="text-[13px] leading-relaxed text-ink-soft">
        <span className="font-semibold text-ink">Scores aren&rsquo;t being stored durably.</span>{" "}
        This deployment has no key-value store connected, so points may disappear when the server
        restarts. Add a Redis store and set{" "}
        <code className="font-mono text-[12px]">KV_REST_API_URL</code> and{" "}
        <code className="font-mono text-[12px]">KV_REST_API_TOKEN</code>.
      </p>
    </div>
  );
}
