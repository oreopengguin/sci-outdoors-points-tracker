"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { LeafMark } from "@/components/brand";
import { Button } from "@/components/ui";

/**
 * Last line of defence for a client-side crash. It deliberately shows nothing
 * about the underlying error — the digest is enough to find it in the logs.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("[sci-outdoors] render error:", error);
  }, [error]);

  return (
    <main id="main" className="flex flex-1 items-center justify-center px-4 py-20">
      <div className="card flex max-w-md flex-col items-center px-6 py-12 text-center">
        <LeafMark className="h-14 w-14" />
        <h1 className="mt-5 font-display text-xl font-bold text-ink">Something went wrong</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          The scoreboard hit an unexpected problem. Your points are safe on the server — reloading
          usually sorts it out.
        </p>
        <div className="mt-6 flex gap-2">
          <Button variant="primary" onClick={reset}>
            Try again
          </Button>
          <Button variant="secondary" onClick={() => router.push("/")}>
            Back to the board
          </Button>
        </div>
        {error.digest ? (
          <p className="mt-4 font-mono text-[11px] text-ink-faint">ref {error.digest}</p>
        ) : null}
      </div>
    </main>
  );
}
