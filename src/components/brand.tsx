"use client";

import { useId } from "react";

import { cn } from "@/lib/cn";

/**
 * The leaf mark. Drawn rather than imported so it inherits the theme, stays
 * crisp on a projector at any size, and costs no extra request.
 *
 * Gradient ids are per-instance. The header renders the mark twice (one copy
 * hidden at each breakpoint), and a shared id resolves to the first match in
 * the document — which, when that copy is `display: none`, paints nothing.
 */
export function LeafMark({ className, title }: { className?: string; title?: string }) {
  const uid = useId();
  const bodyId = `leaf-body-${uid}`;
  const shineId = `leaf-shine-${uid}`;

  return (
    <svg
      viewBox="0 0 48 48"
      role={title ? "img" : "presentation"}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      // No default size class here: two competing Tailwind size utilities in
      // one class list resolve by stylesheet order, not argument order, which
      // is how a 28px mark ends up rendering at 36px and getting squashed by
      // its flex parent.
      className={cn("shrink-0", className ?? "h-9 w-9")}
    >
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={bodyId} x1="14%" y1="6%" x2="86%" y2="96%">
          <stop offset="0%" stopColor="#7fd39a" />
          <stop offset="46%" stopColor="#39a463" />
          <stop offset="100%" stopColor="#1c6b3c" />
        </linearGradient>
        <linearGradient id={shineId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.04" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Blade: a classic asymmetric leaf silhouette. */}
      <path
        d="M40.5 6.2C25.6 5 14.2 9.6 9 18.1c-5 8.2-2.6 18 4.8 22.6l.5.3 3.9-8.9c2-4.6 5-8.7 8.8-12l4.8-4.2-3.4 4.9c-3.3 4.7-5.8 9.8-7.5 15.3l-2.2 7.2c9.5 3 18.6-.4 23.6-8.6 5.2-8.5 5.3-20.8-1.8-28.5Z"
        fill={`url(#${bodyId})`}
      />
      <path
        d="M40.5 6.2C25.6 5 14.2 9.6 9 18.1c-3.4 5.6-3.4 12 .1 16.7C11.6 22 22.9 12.1 40.5 6.2Z"
        fill={`url(#${shineId})`}
      />
      {/* Midrib and veins — the detail that makes it read as botanical. */}
      <path
        d="M39.8 7.2C31.4 15.5 24 25.6 17.8 37.6l-3.6 6.9"
        stroke="#0f4a29"
        strokeOpacity="0.42"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <g stroke="#0f4a29" strokeOpacity="0.24" strokeWidth="1.1" strokeLinecap="round" fill="none">
        <path d="M33.6 12.5c-4.6.5-8.7 2-12.3 4.3" />
        <path d="M29.2 18.6c-4.6.2-8.8 1.5-12.6 3.7" />
        <path d="M25.4 25.1c-4.4.3-8.3 1.6-11.8 3.8" />
        <path d="M34.8 15.2c1 3.4 1 6.9 0 10.4" />
        <path d="M29.9 23.7c1.1 3 1.3 6.1.6 9.2" />
      </g>
    </svg>
  );
}

export function Wordmark({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const scale = {
    sm: { mark: "h-7 w-7", eyebrow: "text-[10px]", title: "text-base" },
    md: { mark: "h-10 w-10", eyebrow: "text-[11px]", title: "text-xl" },
    lg: { mark: "h-16 w-16", eyebrow: "text-sm", title: "text-4xl" },
  }[size];

  return (
    <span className={cn("flex items-center gap-3", className)}>
      <LeafMark className={cn(scale.mark, "shrink-0 drop-shadow-sm")} />
      <span className="flex flex-col leading-none">
        <span className={cn("font-semibold uppercase tracking-[0.18em] text-leaf", scale.eyebrow)}>
          Science Outdoors
        </span>
        <span
          className={cn(
            "font-display font-bold tracking-tight text-ink",
            scale.title,
            size === "lg" ? "mt-1.5" : "mt-1",
          )}
        >
          Tuff Points Tracker
        </span>
      </span>
    </span>
  );
}

/** Fixed contour-map texture that sits behind every page. */
export function TopoBackdrop() {
  const rings = [
    { cx: 22, cy: 26, base: 6, count: 9, step: 4.4, squish: 0.74 },
    { cx: 78, cy: 68, base: 5, count: 8, step: 5.1, squish: 0.82 },
    { cx: 54, cy: 8, base: 4, count: 6, step: 4.8, squish: 0.62 },
    { cx: 8, cy: 88, base: 4, count: 6, step: 4.2, squish: 0.9 },
  ];
  return (
    <div className="topo-field" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <g fill="none" stroke="currentColor" strokeWidth="0.22">
          {rings.flatMap((ring, r) =>
            Array.from({ length: ring.count }, (_, i) => (
              <ellipse
                key={`${r}-${i}`}
                cx={ring.cx}
                cy={ring.cy}
                rx={ring.base + i * ring.step}
                ry={(ring.base + i * ring.step) * ring.squish}
                transform={`rotate(${r * 23 - 18} ${ring.cx} ${ring.cy})`}
              />
            )),
          )}
        </g>
      </svg>
    </div>
  );
}
