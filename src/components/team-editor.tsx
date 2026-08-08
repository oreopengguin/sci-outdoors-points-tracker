"use client";

import { useState } from "react";

import { LogoPicker } from "@/components/logo-picker";
import { TeamCrest } from "@/components/team-crest";
import { inputClass } from "@/components/ui";
import { cn } from "@/lib/cn";
import { getLogo } from "@/lib/logos";
import { getColor } from "@/lib/palette";
import { LIMITS, type TeamDraft } from "@/lib/types";

/**
 * One row of the team editor: crest, name and colour. Shared by the setup
 * wizard and the mid-season "edit team" dialog so the two can never drift.
 */
export function TeamDraftRow({
  index,
  draft,
  onChange,
  error,
  autoFocus = false,
  className,
}: {
  index: number;
  draft: TeamDraft;
  onChange: (next: TeamDraft) => void;
  error?: string | null;
  autoFocus?: boolean;
  className?: string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const theme = getColor(draft.color);
  const crest = getLogo(draft.logo);

  return (
    <div
      className={cn("card flex items-center gap-3 p-3 sm:gap-4 sm:p-4", className)}
      style={{ borderColor: `color-mix(in oklab, ${theme.base} 26%, var(--line))` }}
    >
      <span
        aria-hidden="true"
        className="hidden w-6 shrink-0 text-center font-display text-lg font-black text-ink-faint sm:block"
      >
        {index + 1}
      </span>

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="group relative shrink-0 rounded-full transition hover:scale-105 focus-visible:scale-105"
        aria-label={`Change crest for team ${index + 1}. Currently ${crest.label}.`}
      >
        <TeamCrest logo={draft.logo} color={draft.color} size="md" />
        <span
          aria-hidden="true"
          className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full border-2 border-[var(--surface)] bg-[var(--ink)] text-[11px] text-[var(--surface)]"
        >
          ✎
        </span>
      </button>

      <div className="min-w-0 flex-1">
        <label className="sr-only" htmlFor={`team-name-${index}`}>
          Team {index + 1} name
        </label>
        <input
          id={`team-name-${index}`}
          type="text"
          value={draft.name}
          autoFocus={autoFocus}
          maxLength={LIMITS.maxTeamNameLength}
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
          placeholder={`Team ${index + 1}`}
          aria-invalid={error ? true : undefined}
          className={cn(inputClass, "font-display text-base font-bold")}
        />
        <p
          className={cn(
            "mt-1 text-[12px]",
            error ? "font-semibold text-[#c0392b]" : "text-ink-faint",
          )}
        >
          {error ?? `${crest.label} · ${theme.label}`}
        </p>
      </div>

      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="shrink-0 rounded-lg px-2.5 py-1.5 text-[12px] font-bold uppercase tracking-wide text-ink-faint transition hover:bg-[color-mix(in_oklab,var(--ink)_8%,transparent)] hover:text-ink"
      >
        Crest
      </button>

      <LogoPicker
        open={pickerOpen}
        logo={draft.logo}
        color={draft.color}
        teamName={draft.name}
        onClose={() => setPickerOpen(false)}
        onChoose={({ logo, color }) => onChange({ ...draft, logo, color })}
      />
    </div>
  );
}
