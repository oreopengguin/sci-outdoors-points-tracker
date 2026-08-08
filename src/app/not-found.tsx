import Link from "next/link";

import { LeafMark } from "@/components/brand";

export default function NotFound() {
  return (
    <main id="main" className="flex flex-1 items-center justify-center px-4 py-20">
      <div className="card flex max-w-md flex-col items-center px-6 py-12 text-center">
        <LeafMark className="h-14 w-14" />
        <p className="mt-5 font-display text-5xl font-black tracking-tight text-ink">404</p>
        <h1 className="mt-2 font-display text-xl font-bold text-ink">Off the marked trail</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          That page doesn&rsquo;t exist. The scoreboard is back this way.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-11 items-center rounded-xl bg-[var(--leaf)] px-5 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Back to the leaderboard
        </Link>
      </div>
    </main>
  );
}
