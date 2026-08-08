import { SUGGESTED_TEAM_NAMES, defaultLogoFor } from "@/lib/logos";
import { defaultColorFor } from "@/lib/palette";
import type { TeamDraft } from "@/lib/types";

/**
 * Sensible starting drafts when the wizard asks for N teams. Existing rows are
 * preserved so changing the team count never discards work already done.
 */
export function draftTeams(count: number, existing: TeamDraft[] = []): TeamDraft[] {
  return Array.from({ length: count }, (_, i) => {
    const kept = existing[i];
    if (kept) return kept;
    return {
      name: SUGGESTED_TEAM_NAMES[i % SUGGESTED_TEAM_NAMES.length],
      logo: defaultLogoFor(i),
      color: defaultColorFor(i),
    };
  });
}
