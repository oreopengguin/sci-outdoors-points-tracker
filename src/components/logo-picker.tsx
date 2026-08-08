"use client";

import { useDeferredValue, useMemo, useRef, useState } from "react";

import { TeamCrest } from "@/components/team-crest";
import { Button, Dialog } from "@/components/ui";
import { cn } from "@/lib/cn";
import { LOGO_CATEGORIES, LOGO_COUNT, LOGOS, getLogo, searchLogos } from "@/lib/logos";
import { TEAM_COLORS, getColor } from "@/lib/palette";

/**
 * Crest and colour picker. The catalogue is large on purpose, so the priorities
 * here are: search that actually finds things, categories to browse when you
 * don't know what you want, and a live preview in the team's own colour.
 */
export function LogoPicker(props: {
  open: boolean;
  logo: string;
  color: string;
  teamName: string;
  onClose: () => void;
  onChoose: (next: { logo: string; color: string }) => void;
}) {
  if (!props.open) return null;
  // Mounting fresh each time is what resets the search, the category and the
  // draft selection — no prop-syncing effects needed.
  return <LogoPickerBody {...props} />;
}

function LogoPickerBody({
  logo,
  color,
  teamName,
  onClose,
  onChoose,
}: {
  logo: string;
  color: string;
  teamName: string;
  onClose: () => void;
  onChoose: (next: { logo: string; color: string }) => void;
}) {
  const [draftLogo, setDraftLogo] = useState(logo);
  const [draftColor, setDraftColor] = useState(color);
  // Open on whichever category the current crest lives in.
  const [category, setCategory] = useState<string | "all">(() => getLogo(logo).category);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const searchRef = useRef<HTMLInputElement>(null);

  const results = useMemo(
    () => searchLogos(deferredQuery, category === "all" ? undefined : category),
    [deferredQuery, category],
  );

  const chosen = getLogo(draftLogo);

  return (
    <Dialog
      open
      onClose={onClose}
      size="xl"
      title="Choose a crest"
      description={`${LOGO_COUNT.toLocaleString()} science and nature crests. Search, or browse by category.`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              onChoose({ logo: draftLogo, color: draftColor });
              onClose();
            }}
          >
            Use this crest
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Preview */}
        <div
          className="flex items-center gap-4 rounded-2xl border px-4 py-4"
          style={{
            borderColor: `color-mix(in oklab, ${getColor(draftColor).base} 32%, transparent)`,
            background: `linear-gradient(112deg, color-mix(in oklab, ${getColor(draftColor).base} 14%, var(--surface)) 0%, var(--surface) 72%)`,
          }}
        >
          <TeamCrest logo={draftLogo} color={draftColor} size="lg" glow />
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-bold text-ink">
              {teamName || "Your team"}
            </p>
            <p className="mt-0.5 text-[13px] text-ink-soft">
              {chosen.label} · {getColor(draftColor).label}
            </p>
          </div>
        </div>

        {/* Colour */}
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-ink-faint">
            Colour
          </p>
          <div className="flex flex-wrap gap-2">
            {TEAM_COLORS.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => setDraftColor(theme.id)}
                aria-pressed={draftColor === theme.id}
                title={theme.label}
                className={cn(
                  "h-9 w-9 rounded-full transition",
                  draftColor === theme.id ? "scale-110" : "hover:scale-105",
                )}
                style={{
                  background: `radial-gradient(120% 120% at 30% 22%, ${theme.light}, ${theme.base} 55%, ${theme.dark})`,
                  boxShadow:
                    draftColor === theme.id
                      ? `0 0 0 3px var(--surface), 0 0 0 5px ${theme.base}`
                      : `0 0 0 2px color-mix(in oklab, ${theme.base} 22%, transparent)`,
                }}
              >
                <span className="sr-only">{theme.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="sticky top-0 z-10 -mx-5 space-y-2.5 border-b border-[var(--line)] bg-[var(--surface)] px-5 pb-3 pt-1">
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              // Searching always looks across the whole catalogue — typing a
              // word and getting nothing because of a category you forgot was
              // selected is the fastest way to make a picker feel broken.
              if (e.target.value.trim()) setCategory("all");
            }}
            placeholder="Search crests — try “owl”, “volcano”, “helix”…"
            aria-label="Search crests"
            className="w-full rounded-xl border border-[var(--line-strong)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-[var(--leaf)] focus:outline-none focus:ring-4 focus:ring-[color-mix(in_oklab,var(--leaf)_18%,transparent)]"
          />
          <div className="scroll-slim -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            <CategoryChip active={category === "all"} onClick={() => setCategory("all")}>
              All · {LOGO_COUNT}
            </CategoryChip>
            {LOGO_CATEGORIES.map((cat) => (
              <CategoryChip
                key={cat.id}
                active={category === cat.id}
                onClick={() => setCategory(cat.id)}
                title={cat.blurb}
              >
                {cat.label}
              </CategoryChip>
            ))}
          </div>
        </div>

        {/* Grid */}
        {results.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-semibold text-ink">No crests match “{query}”.</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => {
                setQuery("");
                setCategory("all");
                searchRef.current?.focus();
              }}
            >
              Show all {LOGO_COUNT}
            </Button>
          </div>
        ) : (
          <>
            <p className="text-[12px] text-ink-faint">
              {results.length.toLocaleString()} crest{results.length === 1 ? "" : "s"}
              {category !== "all" && !query
                ? ` in ${LOGO_CATEGORIES.find((c) => c.id === category)?.label}`
                : ""}
            </p>
            <div
              role="listbox"
              aria-label="Crests"
              className="grid grid-cols-5 gap-2 sm:grid-cols-8 md:grid-cols-10"
            >
              {results.map((item) => {
                const selected = item.id === draftLogo;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => setDraftLogo(item.id)}
                    onDoubleClick={() => {
                      onChoose({ logo: item.id, color: draftColor });
                      onClose();
                    }}
                    title={item.label}
                    className={cn(
                      "group flex flex-col items-center gap-1 rounded-xl border p-1.5 transition",
                      selected
                        ? "border-[var(--leaf)] bg-[var(--leaf-soft)]"
                        : "border-transparent hover:border-[var(--line-strong)] hover:bg-[var(--surface-2)]",
                    )}
                  >
                    <TeamCrest logo={item.id} color={draftColor} size="sm" />
                    <span className="w-full truncate text-center text-[10px] font-medium leading-tight text-ink-faint">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition",
        active
          ? "border-transparent bg-[var(--leaf)] text-white"
          : "border-[var(--line-strong)] bg-[var(--surface)] text-ink-soft hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}

/** Small stat used in the setup wizard's intro. */
export function crestCount(): number {
  return LOGOS.length;
}
