const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["second", 1000],
  ["minute", 60_000],
  ["hour", 3_600_000],
  ["day", 86_400_000],
  ["week", 604_800_000],
];

/**
 * "just now", "4 min ago", "yesterday" — short enough for a dense feed.
 * `now` is null until the client clock has ticked once, in which case we fall
 * back to an absolute time so the markup is identical on both sides.
 */
export function relativeTime(timestamp: number, now: number | null): string {
  if (now === null) return clockTime(timestamp);
  const diff = timestamp - now;
  const abs = Math.abs(diff);
  if (abs < 45_000) return "just now";

  let unit: Intl.RelativeTimeFormatUnit = "second";
  let size = 1000;
  for (const [candidate, ms] of RELATIVE_UNITS) {
    if (abs >= ms) {
      unit = candidate;
      size = ms;
    }
  }
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto", style: "narrow" });
  return formatter.format(Math.round(diff / size), unit);
}

export function clockTime(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(
    timestamp,
  );
}

export function fullTime(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

export function signed(value: number): string {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${Math.abs(value).toLocaleString()}`;
}

export function ordinal(rank: number): string {
  const mod100 = rank % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${rank}th`;
  return `${rank}${["th", "st", "nd", "rd"][rank % 10] ?? "th"}`;
}

export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count.toLocaleString()} ${count === 1 ? one : many}`;
}
