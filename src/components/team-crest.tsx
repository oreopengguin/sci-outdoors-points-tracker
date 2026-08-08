import { getLogo } from "@/lib/logos";
import { getColor } from "@/lib/palette";
import { cn } from "@/lib/cn";

const SIZES = {
  xs: { box: "h-8 w-8", glyph: "text-base", ring: 1.5 },
  sm: { box: "h-11 w-11", glyph: "text-xl", ring: 2 },
  md: { box: "h-14 w-14", glyph: "text-2xl", ring: 2.5 },
  lg: { box: "h-20 w-20", glyph: "text-4xl", ring: 3 },
  xl: { box: "h-28 w-28", glyph: "text-6xl", ring: 3.5 },
  hero: { box: "h-40 w-40", glyph: "text-8xl", ring: 4 },
} as const;

export type CrestSize = keyof typeof SIZES;

/**
 * A team's badge: the chosen glyph set into a generated gradient medallion in
 * the team's colour. This is what turns a single character into something that
 * reads as a crest on a projector at the back of a hall.
 */
export function TeamCrest({
  logo,
  color,
  size = "md",
  className,
  label,
  glow = false,
}: {
  logo: string;
  color: string;
  size?: CrestSize;
  className?: string;
  label?: string;
  glow?: boolean;
}) {
  const theme = getColor(color);
  const crest = getLogo(logo);
  const dims = SIZES[size];

  return (
    <span
      role={label ? "img" : "presentation"}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      title={label}
      className={cn(
        "relative inline-grid shrink-0 place-items-center rounded-full select-none",
        dims.box,
        className,
      )}
      style={{
        background: `radial-gradient(120% 120% at 30% 22%, ${theme.light} 0%, ${theme.base} 52%, ${theme.dark} 100%)`,
        boxShadow: glow
          ? `0 0 0 ${dims.ring}px color-mix(in oklab, ${theme.base} 24%, transparent), 0 10px 30px -8px ${theme.base}88`
          : `0 0 0 ${dims.ring}px color-mix(in oklab, ${theme.base} 16%, transparent), 0 4px 14px -6px ${theme.dark}66`,
      }}
    >
      {/* Top-light highlight, so the medallion has a physical curve to it. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "linear-gradient(160deg, rgb(255 255 255 / 0.42) 0%, rgb(255 255 255 / 0.06) 42%, rgb(0 0 0 / 0.14) 100%)",
        }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-[7%] rounded-full border"
        style={{ borderColor: "rgb(255 255 255 / 0.28)" }}
      />
      <span
        className={cn("relative leading-none", dims.glyph)}
        style={{ filter: "drop-shadow(0 1px 1px rgb(0 0 0 / 0.32))" }}
      >
        {crest.glyph}
      </span>
    </span>
  );
}
