"use client";

import { useMemo, useRef, useState } from "react";

import { useCelebration } from "@/components/celebration";
import { TeamCrest } from "@/components/team-crest";
import { Button, Dialog, Field, inputClass, useToast } from "@/components/ui";
import { api, ApiError } from "@/lib/client";
import { cn } from "@/lib/cn";
import { signed } from "@/lib/format";
import { getColor } from "@/lib/palette";
import { LIMITS, type PublicState, type PublicTeam } from "@/lib/types";

const AWARD_PRESETS = [1, 2, 3, 5, 10, 15, 20, 25, 50];

const AWARD_REASONS = [
  "Great teamwork",
  "Sharp observation",
  "Safety first",
  "Helped another team",
  "Excellent field notes",
  "Best specimen find",
  "Clear explanation",
  "Left the site spotless",
  "Answered the challenge",
  "Real curiosity",
  "Led from the front",
  "Bonus round win",
];

const DEDUCT_REASONS = [
  "Gear left untidy",
  "Late back to base",
  "Off the marked route",
  "Safety reminder needed",
  "Litter left behind",
  "Not listening to the brief",
];

/**
 * Award or deduct points for one team, with a reason that gets logged.
 *
 * The `key` on the inner component means switching teams remounts the form
 * rather than syncing half a dozen pieces of state from props.
 */
export function AwardDialog(props: {
  team: PublicTeam | null;
  onClose: () => void;
  onApplied: (state: PublicState) => void;
}) {
  if (!props.team) return null;
  return <AwardForm key={props.team.id} {...props} team={props.team} />;
}

function AwardForm({
  team,
  onClose,
  onApplied,
}: {
  team: PublicTeam;
  onClose: () => void;
  onApplied: (state: PublicState) => void;
}) {
  const { push } = useToast();
  const celebrate = useCelebration();

  const [mode, setMode] = useState<"award" | "deduct">("award");
  const [amount, setAmount] = useState(5);
  const [customAmount, setCustomAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reasonRef = useRef<HTMLInputElement>(null);

  const effectiveAmount = useMemo(() => {
    const custom = Number.parseInt(customAmount, 10);
    const base = Number.isFinite(custom) && customAmount.trim() !== "" ? Math.abs(custom) : amount;
    return Math.min(LIMITS.maxDelta, Math.max(0, base));
  }, [amount, customAmount]);

  const delta = mode === "award" ? effectiveAmount : -effectiveAmount;
  const reasons = mode === "award" ? AWARD_REASONS : DEDUCT_REASONS;
  const canSubmit = effectiveAmount > 0 && reason.trim().length > 0 && !busy;
  const theme = getColor(team.color);

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const result = await api.award(team.id, delta, reason.trim());
      onApplied(result.state);
      if (delta > 0) {
        celebrate(
          { x: 0.5, y: 0.45 },
          [theme.base, theme.light, theme.dark],
          delta >= 25 ? 2.4 : 1.2,
        );
      }
      push({
        tone: "success",
        title: `${signed(delta)} for ${team.name}`,
        detail: reason.trim(),
        action: {
          label: "Undo",
          onClick: async () => {
            try {
              const undone = await api.undo(result.event.id);
              onApplied(undone.state);
              push({ tone: "info", title: `Took back ${signed(delta)} from ${team.name}` });
            } catch (err) {
              push({
                tone: "error",
                title: "Couldn't undo that",
                detail: err instanceof ApiError ? err.message : undefined,
              });
            }
          },
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      size="md"
      title={team.name}
      description={`${team.points.toLocaleString()} points right now`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={mode === "award" ? "primary" : "danger"}
            size="lg"
            onClick={submit}
            loading={busy}
            disabled={!canSubmit}
          >
            {mode === "award" ? "Award" : "Deduct"} {effectiveAmount || 0}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div
          className="flex items-center gap-4 rounded-2xl px-4 py-3.5"
          style={{
            background: `linear-gradient(112deg, color-mix(in oklab, ${theme.base} 16%, var(--surface)) 0%, var(--surface) 72%)`,
            border: `1px solid color-mix(in oklab, ${theme.base} 28%, transparent)`,
          }}
        >
          <TeamCrest logo={team.logo} color={team.color} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-bold text-ink">{team.name}</p>
            <p className="text-[13px] text-ink-soft tabular-nums">
              {team.points.toLocaleString()}
              <span aria-hidden="true"> → </span>
              <span
                className="font-display font-black"
                style={{ color: delta >= 0 ? "var(--leaf)" : "#c0392b" }}
              >
                {(team.points + delta).toLocaleString()}
              </span>
            </p>
          </div>
        </div>

        {/* Award / deduct */}
        <div
          role="radiogroup"
          aria-label="Award or deduct"
          className="grid grid-cols-2 gap-1.5 rounded-xl bg-[var(--surface-2)] p-1"
        >
          {(
            [
              ["award", "Award points", "var(--leaf)"],
              ["deduct", "Deduct points", "#c0392b"],
            ] as const
          ).map(([value, label, tone]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={mode === value}
              onClick={() => setMode(value)}
              className={cn(
                "rounded-lg py-2.5 text-sm font-bold transition",
                mode === value ? "text-white shadow-sm" : "text-ink-soft hover:text-ink",
              )}
              style={mode === value ? { background: tone } : undefined}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div>
          <p className="mb-2 text-[13px] font-semibold text-ink-soft">How many points?</p>
          <div className="grid grid-cols-5 gap-1.5">
            {AWARD_PRESETS.map((preset) => {
              const active = customAmount.trim() === "" && amount === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setAmount(preset);
                    setCustomAmount("");
                  }}
                  className={cn(
                    "rounded-xl border py-2.5 font-display text-base font-black tabular-nums transition",
                    active
                      ? "border-transparent text-white"
                      : "border-[var(--line-strong)] bg-[var(--surface)] text-ink-soft hover:text-ink",
                  )}
                  style={
                    active
                      ? { background: mode === "award" ? "var(--leaf)" : "#c0392b" }
                      : undefined
                  }
                >
                  {preset}
                </button>
              );
            })}
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={LIMITS.maxDelta}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
              placeholder="Any"
              aria-label="Custom amount"
              className={cn(
                inputClass,
                "px-2 py-2.5 text-center font-display text-base font-black tabular-nums",
                customAmount.trim() !== "" && "border-[var(--leaf)]",
              )}
            />
          </div>
        </div>

        {/* Reason */}
        <Field label="Reason" error={error} hint="Shown on the board and kept in the log.">
          {(props) => (
            <input
              {...props}
              ref={reasonRef}
              type="text"
              value={reason}
              maxLength={LIMITS.maxReasonLength}
              onChange={(e) => setReason(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canSubmit) {
                  e.preventDefault();
                  void submit();
                }
              }}
              placeholder="What earned this?"
              className={inputClass}
            />
          )}
        </Field>

        <div className="flex flex-wrap gap-1.5">
          {reasons.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => {
                setReason(preset);
                reasonRef.current?.focus();
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition",
                reason === preset
                  ? "border-[var(--leaf)] bg-[var(--leaf-soft)] text-[var(--leaf)]"
                  : "border-[var(--line-strong)] bg-[var(--surface)] text-ink-soft hover:text-ink",
              )}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
    </Dialog>
  );
}
